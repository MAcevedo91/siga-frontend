import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Sparkles, FileText, Loader2, ArrowLeft, CheckCircle2, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { getIncidenteById, updateEstadoIncidente } from '@/services/incidentesService'
import { getReportesIncidente, generarBorradoresReporte } from '@/services/reportesService'
import ModalRevisionReporteIA from '@/components/reportes/ModalRevisionReporteIA'
import { useAuth } from '@/store/useAuthStore'
import { formatDate } from '@/utils/formatDate'

export default function IncidenteDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [incidente, setIncidente] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [updatingEstado, setUpdatingEstado] = useState(false)

  // Estados para gestión de reportes con IA
  const [reportes, setReportes] = useState([])
  const [loadingReportes, setLoadingReportes] = useState(false)
  const [generandoBorradores, setGenerandoBorradores] = useState(false)
  const [modalReporteOpen, setModalReporteOpen] = useState(false)

  const { user } = useAuth()

  // Permisos según matriz de roles
  const canEdit = ['Administrador', 'Equipo de Formación'].includes(user?.rol)
  const canManageReportes = ['Administrador', 'Directivo', 'Equipo de Formación', 'Inspector'].includes(user?.rol)

  useEffect(() => {
    loadIncidente()
    if (canManageReportes) {
      loadReportes()
    }
  }, [id])

  const loadIncidente = async () => {
    try {
      setLoading(true)
      const data = await getIncidenteById(id)
      setIncidente(data)
      setNuevoEstado(data.estado)
    } catch (err) {
      setError('Error al cargar incidente')
    } finally {
      setLoading(false)
    }
  }

  const loadReportes = async () => {
    try {
      setLoadingReportes(true)
      const data = await getReportesIncidente(id)
      setReportes(data || [])
    } catch (err) {
      console.error('Error al cargar reportes asociados:', err)
    } finally {
      setLoadingReportes(false)
    }
  }

  const handleCambiarEstado = async () => {
    if (nuevoEstado === incidente.estado) return

    try {
      setUpdatingEstado(true)
      const updated = await updateEstadoIncidente(id, nuevoEstado)
      setIncidente(updated)
      toast.success('Estado actualizado correctamente')
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al cambiar estado'
      toast.error(msg)
    } finally {
      setUpdatingEstado(false)
    }
  }

  // Clic en botón principal de IA
  const handleAbrirOGenerarReporte = async () => {
    // Si ya existen reportes creados previamente, abrir el modal de inmediato
    if (reportes.length > 0) {
      setModalReporteOpen(true)
      return
    }

    // Si no existen reportes, invocar la generación asistida con Google Gemini Flash
    try {
      setGenerandoBorradores(true)
      const nuevosReportes = await generarBorradoresReporte(id)
      setReportes(nuevosReportes)
      toast.success('Propuesta de informe redactada exitosamente con IA')
      setModalReporteOpen(true)
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al generar la propuesta asistida de informe'
      toast.error(msg)
    } finally {
      setGenerandoBorradores(false)
    }
  }

  const handleReportesActualizados = (nuevosReportes) => {
    setReportes(nuevosReportes)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 animate-spin text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="mt-2 text-gray-600 font-medium">Cargando incidente...</p>
        </div>
      </div>
    )
  }

  if (error || !incidente) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg bg-red-50 p-6 text-center">
          <p className="text-red-800">{error || 'Incidente no encontrado'}</p>
          <button
            onClick={() => navigate('/incidentes')}
            className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Volver a Incidentes
          </button>
        </div>
      </div>
    )
  }

  const getGravedadColor = (gravedad) => {
    const colors = {
      Leve: 'from-yellow-500 to-yellow-700',
      Grave: 'from-orange-500 to-orange-700',
      Gravísima: 'from-red-500 to-red-700',
    }
    return colors[gravedad] || 'from-gray-500 to-gray-700'
  }

  const totalReportes = reportes.length
  const reportesAprobados = reportes.filter((r) => r.estado === 'Aprobado').length

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate('/incidentes')}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Incidentes
          </button>

          {/* BOTÓN ASISTENTE DE INFORMES CON IA */}
          {canManageReportes && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAbrirOGenerarReporte}
                disabled={generandoBorradores || loadingReportes}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-md transition-all ${
                  totalReportes > 0
                    ? 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white hover:from-blue-800 hover:to-indigo-800'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 ring-2 ring-purple-300 ring-offset-1'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {generandoBorradores ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
                )}
                <span>
                  {generandoBorradores
                    ? 'Redactando con Gemini...'
                    : totalReportes > 0
                    ? `Ver / Editar Informes Oficiales (${totalReportes})`
                    : 'Generar Informe Oficial con IA'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* OVERLAY MODAL DE ESPERA DURANTE GENERACIÓN CON GEMINI */}
        {generandoBorradores && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4 animate-bounce">
                <Sparkles className="h-7 w-7 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Asistente de Redacción Normativa
              </h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                <strong>Google Gemini Flash</strong> está redactando la propuesta objetiva de los informes,
                aplicando sanitización <strong>DLP</strong> conforme a la Circular N° 482 y la Ley N° 19.628.
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-indigo-600 font-medium">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Procesando hechos objetivos y medidas pedagógicas...</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className={`bg-gradient-to-r ${getGravedadColor(incidente.gravedad)} px-6 py-8`}>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white">Incidente #{incidente.id}</h1>
                  <p className="mt-1 text-white">{formatDate(incidente.fecha)}</p>
                </div>
                <span className="rounded-full bg-white/20 px-4 py-2 text-lg font-semibold text-white">
                  {incidente.gravedad}
                </span>
              </div>
            </div>

            {/* BANNER RESUMEN DE REPORTES (SI YA FUERON GENERADOS) */}
            {canManageReportes && totalReportes > 0 && (
              <div className="border-b border-gray-100 bg-blue-50/70 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-blue-900">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold">
                    {totalReportes} informe(s) normativo(s) disponible(s) para este caso.
                  </span>
                  {reportesAprobados === totalReportes ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800 text-[11px]">
                      <CheckCircle2 className="h-3 w-3" /> Todos Oficializados
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800 text-[11px]">
                      <Clock className="h-3 w-3" /> {totalReportes - reportesAprobados} en borrador
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setModalReporteOpen(true)}
                  className="font-semibold text-blue-700 hover:text-blue-900 underline transition-colors"
                >
                  Abrir asistente de revisión &rarr;
                </button>
              </div>
            )}

            <div className="space-y-6 p-6">
              <div>
                <h2 className="mb-2 text-lg font-semibold text-gray-900">Tipo de Abordaje</h2>
                <p className="text-gray-700">{incidente.tipo_abordaje}</p>
              </div>

              <div>
                <h2 className="mb-2 text-lg font-semibold text-gray-900">Relato</h2>
                <p className="whitespace-pre-wrap text-gray-700">{incidente.relato}</p>
              </div>

              {incidente.medidas && (
                <div>
                  <h2 className="mb-2 text-lg font-semibold text-gray-900">Medidas Adoptadas</h2>
                  <p className="whitespace-pre-wrap text-gray-700">{incidente.medidas}</p>
                </div>
              )}

              <div>
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Estudiantes Involucrados</h2>
                <div className="space-y-3">
                  {incidente.estudiantes?.map((est) => (
                    <div key={est.id} className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {est.nombre} {est.apellido}
                          </p>
                          <p className="text-sm text-gray-600">{est.curso}</p>
                          {est.observacion && (
                            <p className="mt-2 text-sm text-gray-700">{est.observacion}</p>
                          )}
                        </div>
                        {est.es_victima && (
                          <span className="ml-4 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                            Víctima
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {canEdit && (
                <div className="border-t pt-6">
                  <h2 className="mb-4 text-lg font-semibold text-gray-900">Cambiar Estado</h2>
                  <div className="flex items-center gap-4">
                    <select
                      value={nuevoEstado}
                      onChange={(e) => setNuevoEstado(e.target.value)}
                      className="block flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="En Investigación">En Investigación</option>
                      <option value="Derivado">Derivado</option>
                      <option value="Cerrado">Cerrado</option>
                    </select>
                    <button
                      onClick={handleCambiarEstado}
                      disabled={nuevoEstado === incidente.estado || updatingEstado}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {updatingEstado ? 'Actualizando...' : 'Actualizar Estado'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE REVISIÓN MODULAR ASISTIDA POR IA */}
      <ModalRevisionReporteIA
        isOpen={modalReporteOpen}
        onClose={() => setModalReporteOpen(false)}
        incidente={incidente}
        reportes={reportes}
        currentUser={user}
        onReportesActualizados={handleReportesActualizados}
      />
    </div>
  )
}
