import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import {
  obtenerHistorialCitacionesEstudiante,
  descargarActaCitacionPdf,
  descargarArchivoIcs,
  CATEGORIAS_FORMATIVAS,
} from '@/services/citacionesService'
import NuevaCitacionModal from './NuevaCitacionModal'
import EntrevistaCitacionModal from './EntrevistaCitacionModal'
import {
  CalendarCheck,
  CalendarPlus,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Video,
  Download,
  ShieldCheck,
  User,
  Calendar,
  Sparkles,
  Award,
} from 'lucide-react'

export default function TabCitacionesEstudiante({
  estudianteId,
  estudiante = null,
  apoderado = null,
  citacionesIniciales = null,
  onActualizado = null,
}) {
  const [citaciones, setCitaciones] = useState(citacionesIniciales || [])
  const [metricas, setMetricas] = useState({
    total_citaciones: citacionesIniciales?.length || 0,
    realizadas: 0,
    no_asiste: 0,
    tasa_asistencia: 0,
    compromisos_vigentes: 0,
  })
  const [loading, setLoading] = useState(!citacionesIniciales)
  const [descargandoId, setDescargandoId] = useState(null)
  const [showNuevaModal, setShowNuevaModal] = useState(false)
  const [citacionEntrevista, setCitacionEntrevista] = useState(null)

  const cargarHistorial = async () => {
    if (!estudianteId) return
    try {
      if (!citacionesIniciales) setLoading(true)
      const data = await obtenerHistorialCitacionesEstudiante(estudianteId)
      if (data) {
        if (data.citaciones) setCitaciones(data.citaciones)
        if (data.metricas_estudiante) setMetricas(data.metricas_estudiante)
      }
    } catch {
      // Degradación grácil ante endpoints no disponibles en mocks o offline
      if (citacionesIniciales) {
        setCitaciones(citacionesIniciales)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarHistorial()
  }, [estudianteId])

  const handleDescargarActa = async (citacionId, folio) => {
    try {
      setDescargandoId(citacionId)
      await descargarActaCitacionPdf(citacionId, folio)
    } catch (err) {
      console.error('Error al descargar acta oficial de citación:', err)
    } finally {
      setDescargandoId(null)
    }
  }

  const handleSuccessNueva = () => {
    setShowNuevaModal(false)
    cargarHistorial()
    if (onActualizado) onActualizado()
  }

  const handleSuccessEntrevista = () => {
    setCitacionEntrevista(null)
    cargarHistorial()
    if (onActualizado) onActualizado()
  }

  return (
    <div className="space-y-6" data-testid="tab-citaciones-estudiante">
      {/* CABECERA Y BOTÓN DE ACCIÓN */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shadow-2xs">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Citaciones Formativas y Acuerdos Mutuos
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Historial de convocatorias pedagógicas, alianza familia-escuela y actas oficiales selladas.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowNuevaModal(true)}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
        >
          <CalendarPlus className="w-4 h-4" />
          <span>Nueva Citación</span>
        </button>
      </div>

      {/* BANNER DE MÉTRICAS INDIVIDUALES DEL ALUMNO */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 space-y-1 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Citaciones
          </span>
          <p className="text-xl font-black text-slate-900 dark:text-white">
            {metricas.total_citaciones || citaciones.length}
          </p>
          <p className="text-[11px] text-slate-400">Convocatorias registradas</p>
        </div>

        <div className="p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-950 bg-emerald-50/50 dark:bg-emerald-950/30 space-y-1 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            Tasa Asistencia
          </span>
          <p className="text-xl font-black text-emerald-800 dark:text-emerald-300">
            {metricas.tasa_asistencia}%
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-500">Adherencia de la familia</p>
        </div>

        <div className="p-3.5 rounded-xl border border-amber-100 dark:border-amber-950 bg-amber-50/50 dark:bg-amber-950/30 space-y-1 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
            Inasistencias
          </span>
          <p className="text-xl font-black text-amber-800 dark:text-amber-300">
            {metricas.no_asiste || 0}
          </p>
          <p className="text-[11px] text-amber-600 dark:text-amber-500">Sin justificar en entrevista</p>
        </div>

        <div className="p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-950 bg-indigo-50/50 dark:bg-indigo-950/30 space-y-1 shadow-2xs">
          <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
            Compromisos
          </span>
          <p className="text-xl font-black text-indigo-800 dark:text-indigo-300">
            {metricas.compromisos_vigentes || 0}
          </p>
          <p className="text-[11px] text-indigo-600 dark:text-indigo-500">En seguimiento activo</p>
        </div>
      </div>

      {/* LISTADO CRONOLÓGICO DE CITACIONES */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">
          <Clock className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-2" />
          <p className="text-sm font-medium">Cargando expediente de citaciones formativas...</p>
        </div>
      ) : citaciones && citaciones.length > 0 ? (
        <div className="space-y-3.5">
          {citaciones.map((c) => {
            const categoriaInfo = CATEGORIAS_FORMATIVAS[c.motivo_categoria] || {
              label: c.motivo_categoria || 'Citación Formativa',
              color: 'bg-slate-100 text-slate-800',
            }

            const tieneActa = Boolean(c.tiene_acta || c.acuerdos?.hash_sha256)
            const esCerrable = ['programada', 'confirmada', 'reprogramacion_solicitada'].includes(c.estado)

            return (
              <div
                key={c.id}
                className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {c.folio}
                    </span>

                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${categoriaInfo.color}`}
                    >
                      {categoriaInfo.label}
                    </span>

                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        c.estado === 'realizada'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : c.estado === 'confirmada'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : c.estado === 'reprogramacion_solicitada'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : c.estado === 'justificada'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          : c.estado === 'cancelada'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {c.estado === 'realizada'
                        ? '✓ Realizada con Acuerdos'
                        : c.estado === 'confirmada'
                        ? '✓ Asistencia Confirmada'
                        : c.estado === 'reprogramacion_solicitada'
                        ? '⏳ Reprogramación Solicitada'
                        : c.estado === 'justificada'
                        ? 'Justificada'
                        : c.estado === 'cancelada'
                        ? 'Cancelada'
                        : 'Programada'}
                    </span>

                    {tieneActa && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>Sello SHA-256</span>
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {c.motivo_detalle}
                  </p>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      {new Date(c.fecha_hora_programada).toLocaleString('es-CL', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    <span className="flex items-center gap-1">
                      {c.modalidad === 'virtual' ? (
                        <>
                          <Video className="w-3.5 h-3.5 text-blue-500" />
                          <span>Reunión Virtual</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-3.5 h-3.5 text-amber-500" />
                          <span>{c.lugar_entrevista || 'Sala de Entrevistas'}</span>
                        </>
                      )}
                    </span>

                    {(c.apoderados?.nombre || c.apoderado?.nombre) && (
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          Apoderado:{' '}
                          <strong className="text-slate-700 dark:text-slate-300">
                            {c.apoderados?.nombre || c.apoderado?.nombre}{' '}
                            {c.apoderados?.apellido || c.apoderado?.apellido}
                          </strong>
                        </span>
                      </span>
                    )}
                  </div>

                  {/* ACUERDOS RESUMIDOS SI TIENE ACTA */}
                  {c.acuerdos && (
                    <div className="mt-2.5 p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          <FileCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          Acuerdos Mutuos Registrados
                        </span>
                        {c.acuerdos.fecha_proximo_seguimiento && (
                          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                            Seguimiento: {c.acuerdos.fecha_proximo_seguimiento}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                        <div>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Colegio:</span>{' '}
                          {Array.isArray(c.acuerdos.compromisos_colegio)
                            ? c.acuerdos.compromisos_colegio.join(' · ')
                            : 'Compromisos asumidos'}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Familia:</span>{' '}
                          {Array.isArray(c.acuerdos.compromisos_apoderado)
                            ? c.acuerdos.compromisos_apoderado.join(' · ')
                            : 'Compromisos asumidos'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* BOTONES DE ACCIÓN */}
                <div className="flex flex-wrap md:flex-col items-stretch gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  {tieneActa ? (
                    <button
                      type="button"
                      onClick={() => handleDescargarActa(c.id, c.folio)}
                      disabled={descargandoId === c.id}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition shadow-2xs disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{descargandoId === c.id ? 'Descargando...' : 'Acta Oficial PDF'}</span>
                    </button>
                  ) : esCerrable ? (
                    <button
                      type="button"
                      onClick={() => setCitacionEntrevista(c)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-2xs"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Registrar Acuerdos</span>
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => descargarArchivoIcs(c)}
                    className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Exportar a calendario (.ics)"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Guardar .ics</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="py-12 text-center text-slate-500 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
          <CalendarCheck className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Sin citaciones formativas registradas
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            No se registran convocatorias pedagógicas previas para este estudiante.
          </p>
          <button
            type="button"
            onClick={() => setShowNuevaModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Programar Primera Citación</span>
          </button>
        </div>
      )}

      {/* MODAL PROGRAMAR NUEVA CITACIÓN */}
      <NuevaCitacionModal
        isOpen={showNuevaModal}
        onClose={() => setShowNuevaModal(false)}
        onSuccess={handleSuccessNueva}
        estudiante={estudiante || { id: estudianteId }}
        apoderado={apoderado}
      />

      {/* MODAL ENTREVISTA PRESENCIAL Y FIRMAS A 60 FPS */}
      <EntrevistaCitacionModal
        isOpen={Boolean(citacionEntrevista)}
        onClose={() => setCitacionEntrevista(null)}
        onSuccess={handleSuccessEntrevista}
        citacion={citacionEntrevista}
      />
    </div>
  )
}

TabCitacionesEstudiante.propTypes = {
  estudianteId: PropTypes.string.isRequired,
  estudiante: PropTypes.object,
  apoderado: PropTypes.object,
  citacionesIniciales: PropTypes.array,
  onActualizado: PropTypes.func,
}
