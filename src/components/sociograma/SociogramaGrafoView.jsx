import { forwardRef, useEffect, useRef, useState } from 'react'
import { secondaryClass } from '@/components/mediaciones/MediacionUI'
const WIDTH = 1000,
  HEIGHT = 640
const SociogramaGrafoView = forwardRef(function SociogramaGrafoView(
  { nodes = [], links = [], onSelect },
  forwardedRef,
) {
  const svgRef = useRef(null),
    graphRef = useRef(null),
    points = useRef([]),
    drag = useRef(null),
    viewRef = useRef({ x: 0, y: 0, k: 1 }),
    [zoom, setZoom] = useState(1)
  const setRef = (el) => {
    svgRef.current = el
    if (typeof forwardedRef === 'function') forwardedRef(el)
    else if (forwardedRef) forwardedRef.current = el
  }
  function applyView(v) {
    viewRef.current = v
    graphRef.current?.setAttribute(
      'transform',
      `translate(${v.x} ${v.y}) scale(${v.k})`,
    )
    setZoom(v.k)
  }
  useEffect(() => {
    points.current = nodes.map((n, i) => ({
      ...n,
      x:
        WIDTH / 2 +
        Math.cos((i * 2 * Math.PI) / Math.max(nodes.length, 1)) * 230,
      y:
        HEIGHT / 2 +
        Math.sin((i * 2 * Math.PI) / Math.max(nodes.length, 1)) * 220,
      vx: 0,
      vy: 0,
    }))
    const map = new Map(points.current.map((p) => [p.id, p]))
    let frame,
      ticks = 0,
      active = true
    const edges = links
      .map((l) => ({
        ...l,
        a: map.get(typeof l.source === 'object' ? l.source.id : l.source),
        b: map.get(typeof l.target === 'object' ? l.target.id : l.target),
      }))
      .filter((l) => l.a && l.b)
    const paint = () => {
      const root = svgRef.current
      if (!root) return
      points.current.forEach((p, i) =>
        root
          .querySelector(`[data-node-index="${i}"]`)
          ?.setAttribute('transform', `translate(${p.x} ${p.y})`),
      )
      links.forEach((l, i) => {
        const a = map.get(
            typeof l.source === 'object' ? l.source.id : l.source,
          ),
          b = map.get(typeof l.target === 'object' ? l.target.id : l.target)
        const line = root.querySelector(`[data-edge-index="${i}"]`)
        if (a && b && line) {
          line.setAttribute('x1', a.x)
          line.setAttribute('y1', a.y)
          line.setAttribute('x2', b.x)
          line.setAttribute('y2', b.y)
        }
      })
    }
    const tick = () => {
      if (!active) return
      const ps = points.current
      const alpha = Math.max(0.02, 1 - ticks / 180)
      for (let i = 0; i < ps.length; i++) {
        const a = ps[i]
        for (let j = i + 1; j < ps.length; j++) {
          const b = ps[j],
            dx = a.x - b.x || 1,
            dy = a.y - b.y || 1,
            d2 = Math.max(100, dx * dx + dy * dy),
            f = (850 * alpha) / d2
          a.vx += dx * f
          a.vy += dy * f
          b.vx -= dx * f
          b.vy -= dy * f
        }
      }
      edges.forEach(({ a, b }) => {
        const dx = b.x - a.x,
          dy = b.y - a.y,
          d = Math.hypot(dx, dy) || 1,
          f = (d - 150) * 0.012 * alpha
        a.vx += (dx / d) * f
        a.vy += (dy / d) * f
        b.vx -= (dx / d) * f
        b.vy -= (dy / d) * f
      })
      ps.forEach((p) => {
        if (drag.current?.node === p) return
        p.vx += (WIDTH / 2 - p.x) * 0.001
        p.vy += (HEIGHT / 2 - p.y) * 0.001
        p.vx *= 0.72
        p.vy *= 0.72
        p.x = Math.max(45, Math.min(WIDTH - 45, p.x + p.vx))
        p.y = Math.max(40, Math.min(HEIGHT - 40, p.y + p.vy))
      })
      paint()
      ticks++
      if (ticks < 200 || drag.current) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      active = false
      cancelAnimationFrame(frame)
    }
  }, [nodes, links])
  function position(e) {
    const r = svgRef.current.getBoundingClientRect()
    return {
      x: ((e.clientX - r.left) * WIDTH) / r.width,
      y: ((e.clientY - r.top) * HEIGHT) / r.height,
    }
  }
  function start(e, index) {
    if (e.button !== 0) return
    e.preventDefault()
    svgRef.current.setPointerCapture(e.pointerId)
    const p = position(e)
    drag.current = {
      node: index === undefined ? null : points.current[index],
      start: p,
      last: p,
      moved: false,
    }
    if (index !== undefined) e.stopPropagation()
  }
  function move(e) {
    const d = drag.current
    if (!d) return
    const p = position(e),
      v = viewRef.current
    if (Math.hypot(p.x - d.start.x, p.y - d.start.y) > 4) d.moved = true
    if (d.node) {
      d.node.x = (p.x - v.x) / v.k
      d.node.y = (p.y - v.y) / v.k
      const index = points.current.indexOf(d.node)
      svgRef.current
        .querySelector(`[data-node-index="${index}"]`)
        ?.setAttribute('transform', `translate(${d.node.x} ${d.node.y})`)
      links.forEach((l, i) => {
        const source = typeof l.source === 'object' ? l.source.id : l.source,
          target = typeof l.target === 'object' ? l.target.id : l.target
        const line = svgRef.current.querySelector(`[data-edge-index="${i}"]`)
        if (source === d.node.id) {
          line?.setAttribute('x1', d.node.x)
          line?.setAttribute('y1', d.node.y)
        }
        if (target === d.node.id) {
          line?.setAttribute('x2', d.node.x)
          line?.setAttribute('y2', d.node.y)
        }
      })
    } else applyView({ ...v, x: v.x + p.x - d.last.x, y: v.y + p.y - d.last.y })
    d.last = p
  }
  const clickBlocked = useRef(false)
  function end() {
    const current = drag.current
    clickBlocked.current = Boolean(current?.moved)
    drag.current = null
    if (current?.node && !current.moved) {
      onSelect(nodes.find((n) => n.id === current.node.id) || current.node)
    }
  }
  function scale(delta) {
    const v = viewRef.current,
      k = Math.max(0.4, Math.min(3, v.k * delta))
    applyView({
      x: WIDTH / 2 - ((WIDTH / 2 - v.x) * k) / v.k,
      y: HEIGHT / 2 - ((HEIGHT / 2 - v.y) * k) / v.k,
      k,
    })
  }
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          aria-label="Acercar red"
          className={secondaryClass}
          onClick={() => scale(1.2)}
        >
          +
        </button>
        <button
          aria-label="Alejar red"
          className={secondaryClass}
          onClick={() => scale(1 / 1.2)}
        >
          −
        </button>
        <button
          className={secondaryClass}
          onClick={() => applyView({ x: 0, y: 0, k: 1 })}
        >
          Restablecer vista
        </button>
        <span className="text-xs text-slate-500">
          {Math.round(zoom * 100)}% · Arrastra los nodos o el fondo.
        </span>
      </div>
      <svg
        ref={setRef}
        role="img"
        aria-label="Red de interacciones del curso"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        xmlns="http://www.w3.org/2000/svg"
        className="w-full touch-none rounded-xl border bg-slate-50"
        onPointerDown={(e) => start(e)}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      >
        <rect width={WIDTH} height={HEIGHT} fill="#f8fafc" />
        <g ref={graphRef}>
          {links.map((l, i) => (
            <line
              key={i}
              data-edge-index={i}
              x1="500"
              y1="320"
              x2="500"
              y2="320"
              stroke={l.mediaciones_count ? '#7c3aed' : '#94a3b8'}
              strokeWidth={Math.min(
                7,
                1 + Math.log2(1 + Math.abs(Number(l.weight) || 0)),
              )}
              opacity="0.65"
            >
              <title>
                {l.tipo_vinculo || 'Interacción registrada'} · Peso neto:{' '}
                {l.weight ?? 0}
              </title>
            </line>
          ))}
          {nodes.map((n, i) => (
            <g
              key={n.id}
              data-node-index={i}
              transform="translate(500 320)"
              role="button"
              tabIndex={0}
              aria-label={`Ver estudiante ${n.nombre}`}
              onPointerDown={(e) => start(e, i)}
              onClick={(e) => {
                if (e.detail === 0 && !clickBlocked.current) onSelect(n)
                clickBlocked.current = false
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(n)
                }
              }}
              style={{ cursor: 'grab' }}
            >
              <title>
                {n.nombre} · {n.conflictividad_total || 0} registros ·{' '}
                {n.clasificacion_formativa || 'Sin clasificación'}
              </title>
              <circle
                r={18 + Math.min(10, n.grado_centralidad || 0)}
                fill={(n.conflictividad_total || 0) > 3 ? '#f59e0b' : '#6366f1'}
                stroke="white"
                strokeWidth="3"
              />
              <text
                y="40"
                textAnchor="middle"
                fill="#334155"
                fontSize="13"
                fontFamily="Arial,sans-serif"
              >
                {n.nombre}
              </text>
            </g>
          ))}
        </g>
      </svg>
      <p className="mt-2 text-xs text-slate-500">
        Los vínculos representan registros compartidos; no equivalen a un
        diagnóstico personal. Morado: vínculos con mediaciones; gris: otros
        vínculos.
      </p>
    </div>
  )
})
export default SociogramaGrafoView
