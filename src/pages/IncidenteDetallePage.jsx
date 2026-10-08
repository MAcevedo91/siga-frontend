import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Sparkles,
  FileText,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  MailCheck,
  AlertTriangle,
  CheckCircle,
  BookOpen,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getIncidenteById, updateEstadoIncidente } from '@/services/incidentesService'
import {
  getReportesIncidente,
  generarBorradoresReporte,
  descargarReportePdf,
} from '@/services/reportesService'
import ModalRevisionReporteIA from '@/components/reportes/ModalRevisionReporteIA'
import AsistenteNormativoModal from '@/components/rice/AsistenteNormativoModal'
import { useAuth } from '@/store/useAuthStore'
import { formatDate, formatDateTime } from '@/utils/formatDate'
import DashboardLayout from '@/components/layout/DashboardLayout'

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
  const [modalRiceOpen, setModalRiceOpen] = useState(false)
  const [descargandoPdfId, setDescargandoPdfId] = useState(null)

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
    if (reportes.length > 0) {
      setModalReporteOpen(true)
      return
    }

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

  // Descarga o previsualización de PDF desde la tarjeta del informe (HU 6.3.2)
  const handleDescargarReportePdf = async (reporte, abrirEnNuevaPestana = false) => {
    try {
      setDescargandoPdfId(reporte.id)
      const apellidoLimpio = (reporte.estudiantes?.apellido || 'Estudiante')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_')
      const filename = `Informe_Incidente_${incidente.id}_${apellidoLimpio}.pdf`

      await descargarReportePdf(incidente.id, reporte.id, filename, abrirEnNuevaPestana)

      if (abrirEnNuevaPestana) {
        toast.success('Abriendo PDF oficial en nueva pestaña')
      } else {
        toast.success(`Descarga iniciada: ${filename}`)
      }
    } catch (err) {
      toast.error('Error al descargar el archivo PDF oficial')
    } finally {
      setDescargandoPdfId(null)
    }
  }

  const handleReportesActualizados = (nuevosReportes) => {
    setReportes(nuevosReportes)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 animate-spin text-blue-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="mt-2 text-gray-600 font-medium">Cargando incidente...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !incidente) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
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
      </DashboardLayout>
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
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate('/incidentes')}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Incidentes
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setModalRiceOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-md bg-emerald-600 hover:bg-emerald-700 text-white transition-all"
            >
              <BookOpen className="h-4 w-4" />
              <span>Consultar RICE</span>
            </button>

            {/* BOTÓN ASISTENTE DE INFORMES CON IA */}
            {canManageReportes && (
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
            )}
          </div>
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

              {/* SECCIÓN DEDICADA DE REPORTES OFICIALIZADOS / BORRADORES (HU 6.3.2 & HU 6.4.2) */}
              {canManageReportes && totalReportes > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        Informes Normativos Oficiales (RICE)
                      </h2>
                      <p className="text-xs text-gray-500">
                        Documentos individuales con validez legal emitidos para cada estudiante involucrado.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalReporteOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-600 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors shadow-xs"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                      Gestionar en Asistente
                    </button>
                  </div>

                  <div className="space-y-3">
                    {reportes.map((rep) => {
                      const est = rep.estudiantes || {}
                      const esAprobado = rep.estado === 'Aprobado'
                      const nombreAprobador = rep.aprobador
                        ? `${rep.aprobador.nombre} ${rep.aprobador.apellido} (${rep.aprobador.rol})`
                        : 'Jefatura Institucional'
                      const fechaAprobacion = rep.fecha_aprobacion
                        ? formatDate(rep.fecha_aprobacion)
                        : ''

                      const apoderadoTitular = est.apoderados?.find((a) => a.es_titular) || est.apoderados?.[0]
                      const apoderadoEmail = apoderadoTitular?.email
                      const emailEnviado = !!rep.email_apoderado_enviado
                      const fechaEnvioEmail = rep.fecha_envio_email
                      const isDownloadingThis = descargandoPdfId === rep.id

                      return (
                        <div
                          key={rep.id}
                          className={`rounded-xl border p-4.5 transition-all shadow-xs ${
                            esAprobado ? 'border-emerald-200 bg-emerald-50/20' : 'border-amber-200 bg-amber-50/20'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 text-sm">
                                {est.nombre ? `${est.nombre} ${est.apellido}` : 'Estudiante'}
                              </span>
                              {est.rut && <span className="font-mono text-xs text-gray-500">({est.rut})</span>}
                              {est.es_pie && (
                                <span className="rounded-full bg-purple-100 text-purple-700 px-2 py-0.5 font-semibold text-[10px]">
                                  PIE
                                </span>
                              )}
                            </div>

                            {esAprobado ? (
                              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-900">
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Informe Oficial Aprobado por {nombreAprobador} el {fechaAprobacion}</span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                                <Clock className="h-3.5 w-3.5" /> Borrador en revisión
                              </span>
                            )}
                          </div>

                          {/* FEEDBACK DE CORREO Y ACCIONES PDF CUANDO ESTÁ APROBADO (HU 6.3.2 & HU 6.4.2) */}
                          {esAprobado ? (
                            <div className="mt-3 pt-3 border-t border-gray-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                              {emailEnviado ? (
                                <div
                                  className="flex items-center gap-2 text-emerald-900"
                                  title="El PDF oficial fue despachado automáticamente al correo del apoderado titular."
                                >
                                  <MailCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                                  <span>
                                    Enviado a <strong>{apoderadoEmail || 'correo del apoderado'}</strong> el{' '}
                                    {formatDateTime(fechaEnvioEmail) || formatDate(fechaEnvioEmail)}
                                  </span>
                                </div>
                              ) : apoderadoEmail ? (
                                <div
                                  className="flex items-center gap-2 text-blue-900"
                                  title="En cola de salida para entrega al apoderado."
                                >
                                  <Clock className="h-4 w-4 text-blue-600 shrink-0" />
                                  <span>Despacho de correo en proceso para {apoderadoEmail}</span>
                                </div>
                              ) : (
                                <div
                                  className="flex items-center gap-2 text-amber-900"
                                  title="El apoderado no tiene correo registrado en la ficha institucional."
                                >
                                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                                  <span className="font-medium">
                                    Apoderado sin correo registrado. Imprimir copia para citación presencial.
                                  </span>
                                </div>
                              )}

                              <div className="flex items-center gap-2 ml-auto">
                                <button
                                  type="button"
                                  onClick={() => handleDescargarReportePdf(rep, true)}
                                  disabled={isDownloadingThis}
                                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                  title="Abrir PDF en nueva pestaña para lectura directa o impresión"
                                >
                                  <ExternalLink className="h-3.5 w-3.5 text-gray-500" />
                                  Ver en pestaña
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDescargarReportePdf(rep, false)}
                                  disabled={isDownloadingThis}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 transition-colors disabled:opacity-50"
                                >
                                  {isDownloadingThis ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Download className="h-3.5 w-3.5" />
                                  )}
                                  Descargar PDF Oficial
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2 pt-2 border-t border-amber-100 flex items-center justify-between text-xs text-amber-800">
                              <span>El informe está en edición preliminar y requiere revisión y aprobación de Jefatura antes de emitir PDF oficial.</span>
                              <button
                                type="button"
                                onClick={() => setModalReporteOpen(true)}
                                className="font-semibold underline hover:text-amber-950 transition-colors"
                              >
                                Editar borrador &rarr;
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

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

      {/* MODAL DEL COPILOTO NORMATIVO RICE */}
      <AsistenteNormativoModal
        isOpen={modalRiceOpen}
        onClose={() => setModalRiceOpen(false)}
        contextoIncidente={incidente}
        consultaInicial={
          incidente?.relato
            ? `¿Qué artículos, procedimientos o medidas del RICE aplican ante este hecho: "${incidente.relato.slice(0, 140)}..."?`
            : ''
        }
      />
    </DashboardLayout>
  )
}
