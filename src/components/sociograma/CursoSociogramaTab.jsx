import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { jsPDF } from 'jspdf'
import { FileDown, Image as ImageIcon, Loader2, Sparkles, Users } from 'lucide-react'
import SociogramaGrafoView, {
  obtenerEstiloArista,
} from '@/components/sociograma/SociogramaGrafoView'
import { obtenerSociograma } from '@/services/sprint9Service'
import { mensajeError } from '@/utils/mediaciones'
import { ErrorBox, Modal, secondaryClass } from '@/components/mediaciones/MediacionUI'

/**
 * Pestaña interactiva de Sociograma de Convivencia Escolar para un curso específico.
 * Puede ser montada dentro de EstudiantesPage o en la ruta independiente de Sociograma.
 *
 * @param {Object} props
 * @param {string} props.cursoId - UUID del curso
 * @param {string} [props.cursoNombre] - Nombre legible del curso (ej: "4° Básico A")
 */
export default function CursoSociogramaTab({ cursoId, cursoNombre }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [exporting, setExporting] = useState(false)
  const svg = useRef(null)

  useEffect(() => {
    setData(null)
    if (!cursoId) return

    let active = true
    setLoading(true)
    setError('')

    obtenerSociograma(cursoId)
      .then((r) => active && setData(r.data || r))
      .catch((e) => active && setError(mensajeError(e)))
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [cursoId])

  async function exportGraph(type) {
    if (!svg.current) return
    setExporting(true)
    setError('')
    let url
    try {
      const clone = svg.current.cloneNode(true)
      clone.setAttribute('width', '1600')
      clone.setAttribute('height', '1024')
      url = URL.createObjectURL(
        new Blob([new XMLSerializer().serializeToString(clone)], {
          type: 'image/svg+xml;charset=utf-8',
        }),
      )
      const image = new Image()
      await new Promise((resolve, reject) => {
        image.onload = resolve
        image.onerror = reject
        image.src = url
      })
      const canvas = document.createElement('canvas')
      canvas.width = 1600
      canvas.height = 1024
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, 1600, 1024)
      ctx.drawImage(image, 0, 0, 1600, 1024)
      const png = canvas.toDataURL('image/png')
      if (type === 'pdf') {
        const pdf = new jsPDF({ orientation: 'landscape' })
        pdf.setFontSize(15)
        pdf.text(`Sociograma · ${cursoNombre || data?.curso?.nombre || 'Curso'}`, 12, 14)
        pdf.addImage(png, 'PNG', 12, 23, 273, 175)
        pdf.save(`sociograma-${(cursoNombre || 'curso').toLowerCase().replace(/\s+/g, '-')}.pdf`)
      } else {
        const a = document.createElement('a')
        a.href = png
        a.download = `sociograma-${(cursoNombre || 'curso').toLowerCase().replace(/\s+/g, '-')}.png`
        a.click()
      }
    } catch (e) {
      setError(`No fue posible exportar el sociograma. ${mensajeError(e)}`)
    } finally {
      if (url) URL.revokeObjectURL(url)
      setExporting(false)
    }
  }

  const metrics = data?.metricas || {}
  const nodes = data?.nodes || []
  const links = data?.links || []

  if (!cursoId) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-12 text-center dark:border-gray-700 dark:bg-gray-800/50">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-3 text-base font-bold text-gray-700 dark:text-gray-300">
          Selecciona un curso
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          Elige un curso para construir su red sociométrica y analizar la dinámica de aula.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ErrorBox>{error}</ErrorBox>

      {loading ? (
        <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <Loader2 className="h-9 w-9 animate-spin text-indigo-600" />
          <p role="status" className="mt-4 text-sm font-semibold text-gray-800 dark:text-gray-200">
            Construyendo red de interacciones…
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Calculando matriz de co-ocurrencias, grados de centralidad y cohesión de aula.
          </p>
        </div>
      ) : data ? (
        <>
          {/* Tarjetas de Métricas de Red y Clima Escolar */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <p className="text-xs font-medium text-slate-500 dark:text-gray-400">Estudiantes en Red</p>
              <p className="mt-1 text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {metrics.total_estudiantes ?? nodes.length}
              </p>
              <span className="text-[11px] text-slate-400">Total matriculado activo</span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <p className="text-xs font-medium text-slate-500 dark:text-gray-400">Densidad de la Red</p>
              <p className="mt-1 text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {metrics.densidad_red_pct ?? 0}%
              </p>
              <span className="text-[11px] text-slate-400">
                {metrics.total_aristas_activas ?? links.length} interacciones activas
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <p className="text-xs font-medium text-slate-500 dark:text-gray-400">Tasa de Integración</p>
              <p className="mt-1 text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {metrics.tasa_integracion_pct ?? 0}%
              </p>
              <span className="text-[11px] text-slate-400">
                {nodes.length - (metrics.estudiantes_aislados || 0)} con registros
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <p className="text-xs font-medium text-slate-500 dark:text-gray-400">Índice de Cohesión</p>
              <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {metrics.indice_cohesion ?? 100} / 100
              </p>
              <span className="text-[11px] text-slate-400">Clima formativo grupal</span>
            </div>
          </div>

          {/* Lienzo Interactivo del Sociograma */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  {cursoNombre || data.curso?.nombre || 'Red Sociométrica del Curso'}
                </h2>
                <p className="text-xs text-gray-500">
                  Explora las dinámicas entre estudiantes; haz clic sobre un alumno para examinar su historial relacional.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!nodes.length || exporting}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-200"
                  onClick={() => exportGraph('png')}
                >
                  <ImageIcon className="h-3.5 w-3.5 text-slate-500" />
                  <span>Exportar PNG</span>
                </button>
                <button
                  type="button"
                  disabled={!nodes.length || exporting}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-200"
                  onClick={() => exportGraph('pdf')}
                >
                  <FileDown className="h-3.5 w-3.5 text-slate-500" />
                  <span>Exportar PDF</span>
                </button>
              </div>
            </div>

            {nodes.length ? (
              <SociogramaGrafoView ref={svg} nodes={nodes} links={links} onSelect={setSelected} />
            ) : (
              <p className="p-8 text-center text-sm text-slate-500">
                El curso no tiene estudiantes disponibles para generar la red.
              </p>
            )}
          </section>

          {/* Orientaciones de Acompañamiento Formativo */}
          <aside className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/60 p-5 shadow-sm dark:border-indigo-900/40 dark:from-indigo-950/40 dark:via-gray-800 dark:to-purple-950/30">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-gray-900 dark:text-white">
                Orientaciones de Acompañamiento y Convivencia
              </h3>
            </div>

            <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              {metrics.diagnostico_clima ||
                'Revisa la red junto al equipo de convivencia y contrasta con observaciones del curso.'}
            </p>

            {metrics.estudiantes_aislados > 0 && (
              <p className="mt-2 text-xs text-amber-800 dark:text-amber-300">
                Hay <strong>{metrics.estudiantes_aislados}</strong> estudiantes sin vínculos registrados (grado 0).
                Se recomienda verificar su integración en actividades grupales antes de inferir aislamiento social.
              </p>
            )}

            {(metrics.estudiantes_en_riesgo?.length > 0 || metrics.pares_criticos?.length > 0) && (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {metrics.estudiantes_en_riesgo?.length > 0 && (
                  <section className="rounded-xl border border-indigo-100 bg-white/90 p-4 shadow-xs dark:border-gray-700 dark:bg-gray-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      Revisión de acompañamiento
                    </h4>
                    <p className="mt-1 text-xs text-slate-500">
                      Estudiantes con múltiples intervenciones registradas:
                    </p>
                    <ul className="mt-3 divide-y divide-gray-100 text-sm dark:divide-gray-700">
                      {metrics.estudiantes_en_riesgo.map((e) => (
                        <li key={e.id} className="flex items-center justify-between py-2">
                          <Link className="font-semibold text-indigo-700 hover:underline dark:text-indigo-400" to={`/estudiantes/${e.id}`}>
                            {e.nombre}
                          </Link>
                          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                            {e.nivel_acompanamiento || 'Revisar antecedentes'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {metrics.pares_criticos?.length > 0 && (
                  <section className="rounded-xl border border-indigo-100 bg-white/90 p-4 shadow-xs dark:border-gray-700 dark:bg-gray-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      Vínculos para revisar
                    </h4>
                    <p className="mt-1 text-xs text-slate-500">
                      Pares con incidentes compartidos que ameritan mediación:
                    </p>
                    <ul className="mt-3 divide-y divide-gray-100 text-sm dark:divide-gray-700">
                      {metrics.pares_criticos.map((p, i) => (
                        <li key={`${p.source_id}-${p.target_id}-${i}`} className="py-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {p.source_nombre} ↔ {p.target_nombre}
                            </span>
                            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                              Peso: {p.weight}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            )}

            <p className="mt-3 text-[11px] text-slate-500">
              Los indicadores sociométricos apoyan la reflexión del profesor jefe y la dupla psicosocial; no sustituyen la entrevista clínica ni determinan sanciones.
            </p>
          </aside>
        </>
      ) : null}

      {/* Modal Detalle Individual de Estudiante Seleccionado */}
      {selected && (
        <Modal title={selected.nombre} onClose={() => setSelected(null)}>
          <dl className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-xs dark:bg-gray-800">
            <dt className="text-slate-500">Incidentes registrados:</dt>
            <dd className="font-bold text-gray-900 dark:text-white">{selected.incidentes_count || 0}</dd>

            <dt className="text-slate-500">Mediaciones participadas:</dt>
            <dd className="font-bold text-gray-900 dark:text-white">{selected.mediaciones_count || 0}</dd>

            <dt className="text-slate-500">Vínculos en el aula:</dt>
            <dd className="font-bold text-gray-900 dark:text-white">{selected.grado_centralidad || 0}</dd>

            <dt className="text-slate-500">Nivel de acompañamiento:</dt>
            <dd className="font-bold text-indigo-700 dark:text-indigo-400">
              {selected.nivel_acompanamiento || 'Sin clasificación'}
            </dd>
          </dl>

          <section className="mt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Interacciones compartidas registradas
            </h4>
            {links.filter(
              (l) =>
                (typeof l.source === 'object' ? l.source.id : l.source) === selected.id ||
                (typeof l.target === 'object' ? l.target.id : l.target) === selected.id,
            ).length ? (
              <ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-700">
                {links
                  .filter(
                    (l) =>
                      (typeof l.source === 'object' ? l.source.id : l.source) === selected.id ||
                      (typeof l.target === 'object' ? l.target.id : l.target) === selected.id,
                  )
                  .map((l, i) => {
                    const source = typeof l.source === 'object' ? l.source.id : l.source
                    const target = typeof l.target === 'object' ? l.target.id : l.target
                    const peer = nodes.find((n) => n.id === (source === selected.id ? target : source))
                    const estilo = obtenerEstiloArista(l)
                    return (
                      <li key={`${source}-${target}-${i}`} className="flex flex-wrap items-center justify-between gap-2 py-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {peer?.nombre || 'Estudiante vinculado'}
                          </p>
                          <p className="text-xs text-slate-500">
                            Incidentes compartidos: {l.incidentes_count ?? l.co_ocurrencias_incidentes ?? 0} · Mediaciones compartidas: {l.mediaciones_count ?? l.mediaciones_realizadas ?? 0}
                          </p>
                        </div>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${estilo.badgeBg}`}>
                          {estilo.etiqueta}
                        </span>
                      </li>
                    )
                  })}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-slate-500">Sin interacciones compartidas registradas.</p>
            )}
          </section>

          <div className="mt-5 border-t border-gray-100 pt-3 dark:border-gray-700">
            <Link className="text-xs font-bold text-indigo-700 hover:underline dark:text-indigo-400" to={`/estudiantes/${selected.id}`}>
              Ver perfil completo del estudiante →
            </Link>
          </div>
        </Modal>
      )}
    </div>
  )
}
