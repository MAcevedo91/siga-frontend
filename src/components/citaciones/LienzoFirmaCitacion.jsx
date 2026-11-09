import { useRef, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import {
  PenTool,
  RotateCcw,
  CheckCircle,
  UserCheck,
  ShieldCheck,
} from 'lucide-react'

export default function LienzoFirmaCitacion({
  firmas = { docente: null, apoderado: null },
  onFirmaChange,
  docenteNombre = 'Docente / Directivo',
  apoderadoNombre = 'Apoderado Titular',
}) {
  const [tabActiva, setTabActiva] = useState('docente')
  const canvasRef = useRef(null)
  const isDrawing = useRef(false)
  const [hasStroke, setHasStroke] = useState(false)

  // Obtener coordenadas relativas en el canvas
  const getCoordinates = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) * canvas.width) / rect.width,
      y: ((e.clientY - rect.top) * canvas.height) / rect.height,
    }
  }

  // Iniciar trazo (Pointer Events con captura a 60 FPS)
  const handlePointerDown = (e) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.setPointerCapture(e.pointerId)
    isDrawing.current = true

    const { x, y } = getCoordinates(e)
    const ctx = canvas.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#1e3a8a' // Azul institucional
  }

  // Mover trazo
  const handlePointerMove = (e) => {
    if (!isDrawing.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const { x, y } = getCoordinates(e)
    const ctx = canvas.getContext('2d')
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasStroke(true)
  }

  // Finalizar trazo y exportar a PNG Base64
  const handlePointerUp = (e) => {
    if (!isDrawing.current) return
    isDrawing.current = false
    const canvas = canvasRef.current
    if (!canvas) return

    try {
      canvas.releasePointerCapture(e.pointerId)
    } catch {
      // Ignorar si el puntero ya fue liberado
    }

    const dataUrl = canvas.toDataURL('image/png')
    if (onFirmaChange) {
      onFirmaChange(tabActiva, dataUrl)
    }
  }

  // Limpiar el lienzo actual
  const handleLimpiar = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasStroke(false)
    if (onFirmaChange) {
      onFirmaChange(tabActiva, null)
    }
  }

  // Cargar firma guardada si existe al cambiar de pestaña
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const firmaGuardada = firmas[tabActiva]
    if (firmaGuardada) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        setHasStroke(true)
      }
      img.src = firmaGuardada
    } else {
      setHasStroke(false)
    }
  }, [tabActiva])

  const docenteFirmado = Boolean(firmas.docente)
  const apoderadoFirmado = Boolean(firmas.apoderado)

  return (
    <div className="space-y-4">
      {/* PESTAÑAS DE FIRMANTES CON INDICADORES DE ESTADO */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        <button
          type="button"
          onClick={() => setTabActiva('docente')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            tabActiva === 'docente'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          {docenteFirmado ? (
            <CheckCircle className="w-4 h-4 text-emerald-300" />
          ) : (
            <UserCheck className="w-4 h-4 opacity-70" />
          )}
          <span>Docente / Directivo</span>
          {docenteFirmado && (
            <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-1.5 py-0.2 rounded-sm">
              Suscrita
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('apoderado')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            tabActiva === 'apoderado'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          {apoderadoFirmado ? (
            <CheckCircle className="w-4 h-4 text-white" />
          ) : (
            <UserCheck className="w-4 h-4 opacity-70" />
          )}
          <span>Apoderado Titular</span>
          {apoderadoFirmado && (
            <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.2 rounded-sm">
              Suscrita
            </span>
          )}
        </button>
      </div>

      {/* INFORMACIÓN DEL FIRMANTE ACTIVO */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
          <PenTool className="w-4 h-4 text-indigo-500" />
          <span>
            Firmando como:{' '}
            <strong className="text-slate-900 dark:text-white font-bold">
              {tabActiva === 'docente' ? docenteNombre : apoderadoNombre}
            </strong>
          </span>
        </div>

        <button
          type="button"
          onClick={handleLimpiar}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Limpiar Trazo</span>
        </button>
      </div>

      {/* LIENZO CANVAS DE FIRMA DIGITAL A 60 FPS */}
      <div className="relative rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 p-2 overflow-hidden shadow-inner">
        <canvas
          ref={canvasRef}
          width={700}
          height={220}
          aria-label={`Lienzo de firma para ${tabActiva === 'docente' ? docenteNombre : apoderadoNombre}`}
          className="w-full h-[180px] sm:h-[220px] bg-white dark:bg-slate-900 rounded-xl cursor-crosshair touch-none select-none block"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />

        {/* LÍNEA GUÍA BASE PARA FIRMAR */}
        <div className="pointer-events-none absolute bottom-8 left-8 right-8 border-b border-dashed border-slate-300 dark:border-slate-700 flex justify-between text-[10px] text-slate-400 px-1 pb-1">
          <span>Firma manuscrita en pantalla</span>
          <span>Trazo continuo</span>
        </div>
      </div>

      {/* NOTA DE VALIDACIÓN */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
          Captura directa a 60 FPS con sensibilidad táctil
        </span>
        <span className="font-mono text-[10px] text-slate-400">
          {tabActiva === 'docente'
            ? docenteFirmado
              ? '✓ Trazo registrado'
              : 'Pendiente'
            : apoderadoFirmado
            ? '✓ Trazo registrado'
            : 'Pendiente'}
        </span>
      </div>
    </div>
  )
}

LienzoFirmaCitacion.propTypes = {
  firmas: PropTypes.shape({
    docente: PropTypes.string,
    apoderado: PropTypes.string,
  }),
  onFirmaChange: PropTypes.func.isRequired,
  docenteNombre: PropTypes.string,
  apoderadoNombre: PropTypes.string,
}
