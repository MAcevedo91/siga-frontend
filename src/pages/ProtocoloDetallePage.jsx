import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  getProtocoloById,
  avanzarEstadoProtocolo,
  getPasosProtocolo,
  actualizarPasoProtocolo,
  subirEvidenciaPaso,
  eliminarEvidenciaPaso,
  descargarExpedientePDF,
} from '@/services/protocolosService'
import { getAntecedentesEscalada } from '@/services/estudiantesService'
import ChecklistProtocolo from '@/components/protocolos/ChecklistProtocolo'
import AlertaEscaladaBanner from '@/components/shared/AlertaEscaladaBanner'
import AsistenteNormativoModal from '@/components/rice/AsistenteNormativoModal'
import { useAuth } from '@/store/useAuthStore'
import { formatDate } from '@/utils/formatDate'
import toast from 'react-hot-toast'
import {
  Lock,
  FileText,
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Calendar,
  User,
  Copy,
  ExternalLink,
  ShieldAlert,
  AlertCircle,
  Loader2,
  Share2,
} from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ROLES_GESTION_CASOS } from '@/constants/roles'

const ESTADOS = ['En Investigación', 'Derivado', 'Cerrado']

export default function ProtocoloDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [protocolo, setProtocolo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAvanzarForm, setShowAvanzarForm] = useState(false)
  const [observacion, setObservacion] = useState('')
  const [updatingEstado, setUpdatingEstado] = useState(false)
  const [descargandoPdf, setDescargandoPdf] = useState(false)
  const [copiedId, setCopiedId] = useState(false)
  const [modalRiceOpen, setModalRiceOpen] = useState(false)

  // Estados para checklist y alerta de escalada
  const [pasos, setPasos] = useState([])
  const [loadingPasos, setLoadingPasos] = useState(false)
  const [alertaEscalada, setAlertaEscalada] = useState(null)

  const { user } = useAuth()
  const canEdit = ROLES_GESTION_CASOS.includes(user?.rol)

  useEffect(() => {
    loadProtocolo()
  }, [id])

  const loadProtocolo = async () => {
    try {
      setLoading(true)
      const data = await getProtocoloById(id)
      setProtocolo(data)

      // Cargar pasos normativos del protocolo
      loadPasos()

      // Cargar antecedentes preventivos del estudiante
      const estId = data?.estudiante_id || data?.estudiante?.id
      if (estId) {
        getAntecedentesEscalada(estId)
          .then((diag) => setAlertaEscalada(diag))
          .catch((err) => console.error('Error al cargar antecedentes:', err))
      }
    } catch (err) {
      setError('Error al cargar protocolo')
    } finally {
      setLoading(false)
    }
  }

  const loadPasos = async () => {
    try {
      setLoadingPasos(true)
      const data = await getPasosProtocolo(id)
      setPasos(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error al cargar pasos del protocolo:', err)
      setPasos([])
    } finally {
      setLoadingPasos(false)
    }
  }

  const handleCompletarPaso = async (pasoId, observacionPaso, archivo = null) => {
    try {
      await actualizarPasoProtocolo(id, pasoId, {
        completado: true,
        observacion: observacionPaso,
      })

      // Si se adjuntó un archivo de evidencia durante la certificación, subirlo
      if (archivo) {
        try {
          await subirEvidenciaPaso(id, pasoId, archivo)
        } catch (fileErr) {
          console.error('Error al subir evidencia adjunta:', fileErr)
          toast.error('Paso completado, pero ocurrió un problema al subir la evidencia adjunta')
        }
      }

      await loadPasos()
      toast.success('Paso normativo completado exitosamente')
    } catch (err) {
      console.error('Error al certificar paso:', err)
      const msg = err.response?.data?.message || 'Error al completar el paso normativo'
      toast.error(msg)
      throw err
    }
  }

  const handleSubirEvidencia = async (pasoId, archivo) => {
    try {
      await subirEvidenciaPaso(id, pasoId, archivo)
      toast.success('Evidencia probatoria adjuntada exitosamente')
      await loadPasos()
    } catch (err) {
      console.error('Error al subir evidencia:', err)
      const msg = err.response?.data?.message || 'Error al subir la evidencia'
      toast.error(msg)
    }
  }

  const handleEliminarEvidencia = async (pasoId, evidenciaId) => {
    if (!window.confirm('¿Seguro que deseas eliminar este archivo probatorio?')) return
    try {
      await eliminarEvidenciaPaso(id, pasoId, evidenciaId)
      toast.success('Evidencia eliminada exitosamente')
      await loadPasos()
    } catch (err) {
      console.error('Error al eliminar evidencia:', err)
      const msg = err.response?.data?.message || 'Error al eliminar la evidencia'
      toast.error(msg)
    }
  }

  const handleDescargarExpediente = async () => {
    try {
      setDescargandoPdf(true)
      const apellidoEst = (protocolo?.estudiante?.apellido || 'Estudiante').replace(/\s+/g, '_')
      const folio = String(id).substring(0, 8).toUpperCase()
      const nombreSugerido = `Expediente_RICE_${folio}_${apellidoEst}.pdf`
      await descargarExpedientePDF(id, nombreSugerido)
      toast.success('Expediente oficial RICE generado y descargado exitosamente')
    } catch (err) {
      console.error('Error al descargar expediente:', err)
      toast.error('Ocurrió un problema al generar el expediente en PDF')
    } finally {
      setDescargandoPdf(false)
    }
  }

  const handleCopyId = () => {
    if (!protocolo?.id) return
    navigator.clipboard?.writeText(String(protocolo.id))
    setCopiedId(true)
    toast.success('ID del protocolo copiado al portapapeles')
    setTimeout(() => setCopiedId(false), 2000)
  }

  const handleAvanzarEstado = async () => {
    if (!observacion.trim()) {
      toast.error('La observación es obligatoria para avanzar el estado')
      return
    }

    const estadoActualIndex = ESTADOS.indexOf(protocolo.estado)
    if (estadoActualIndex === ESTADOS.length - 1) {
      toast.error('El protocolo ya está en el estado final')
      return
    }

    const nuevoEstado = ESTADOS[estadoActualIndex + 1]

    try {
      setUpdatingEstado(true)
      const updated = await avanzarEstadoProtocolo(id, nuevoEstado, observacion)
      setProtocolo(updated)
      setObservacion('')
      setShowAvanzarForm(false)
      toast.success(`Protocolo avanzado a "${nuevoEstado}" exitosamente`)
    } catch (err) {
      toast.error('Error al avanzar estado del protocolo')
    } finally {
      setUpdatingEstado(false)
    }
  }

  const getInitials = (nombre, apellido) => {
    const n = (nombre || '').trim().charAt(0).toUpperCase()
    const a = (apellido || '').trim().charAt(0).toUpperCase()
    return `${n}${a}` || 'ES'
  }

  const getEstadoBadgeStyle = (estado) => {
    switch (estado) {
      case 'En Investigación':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
      case 'Derivado':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
      case 'Cerrado':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-600" />
            <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-400">Cargando protocolo...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !protocolo) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center p-4">
          <div className="rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-8 text-center max-w-md shadow-xs">
            <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-red-900 dark:text-red-200 mb-4">{error || 'Protocolo no encontrado'}</p>
            <button
              onClick={() => navigate('/protocolos')}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700 shadow-sm transition"
            >
              <ArrowLeft className="w-4 h-4" /> Volver a Protocolos
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const estadoActualIndex = ESTADOS.indexOf(protocolo.estado)
  const puedeAvanzar = canEdit && estadoActualIndex < ESTADOS.length - 1
  const tienePasosPendientes = pasos.length > 0 && pasos.some((p) => !p.completado)

  const totalPasos = pasos.length
  const pasosCompletados = pasos.filter((p) => p.completado).length
  const porcentajeAvance = totalPasos > 0 ? Math.round((pasosCompletados / totalPasos) * 100) : 0

  const tipoProtocoloNombre = protocolo.tipo_protocolo || protocolo.tipo || 'Protocolo de Convivencia Escolar'
  const fechaApertura = protocolo.fecha_apertura || protocolo.created_at

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* BARRA SUPERIOR DE NAVEGACIÓN Y ACCIONES */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate('/protocolos')}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver a Protocolos</span>
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setModalRiceOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 px-3.5 py-2 text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all shadow-xs"
            >
              <BookOpen className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
              <span>Consultar RICE</span>
            </button>

            <button
              type="button"
              onClick={handleDescargarExpediente}
              disabled={descargandoPdf}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white px-4 py-2 text-xs sm:text-sm font-semibold transition shadow-sm disabled:opacity-50"
              title="Descargar expediente oficial con carátula y anexo de evidencias probatorias"
            >
              {descargandoPdf ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Generando Expediente...</span>
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  <span>Descargar Expediente RICE (PDF)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* HERO HEADER MODERNO DEL PROTOCOLO */}
        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/90 dark:border-gray-700/80 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Expediente Normativo
                </span>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="group inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                  title="Copiar ID"
                >
                  <span>Protocolo RICE #{protocolo.id}</span>
                  {copiedId ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                  )}
                </button>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${getEstadoBadgeStyle(protocolo.estado)}`}>
                  {protocolo.estado}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>{tipoProtocoloNombre}</span>
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    Estudiante: {protocolo.estudiante?.nombre} {protocolo.estudiante?.apellido}
                  </span>
                  {protocolo.estudiante?.curso && (
                    <span className="text-gray-400">
                      ({typeof protocolo.estudiante?.curso === 'object' ? protocolo.estudiante?.curso?.nombre : protocolo.estudiante?.curso})
                    </span>
                  )}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span>Apertura: {formatDate(fechaApertura)}</span>
                </span>
              </div>
            </div>

            {/* Resumen de Cumplimiento Normativo */}
            <div className="flex flex-col sm:items-end justify-center border-t sm:border-t-0 sm:border-l border-gray-100 dark:border-gray-700/60 pt-3 sm:pt-0 sm:pl-6 min-w-[200px]">
              <div className="flex items-center justify-between sm:justify-end gap-3 w-full mb-1.5">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Cumplimiento Checklist</span>
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">
                  {pasosCompletados} de {totalPasos} ({porcentajeAvance}%)
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    porcentajeAvance === 100
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      : 'bg-gradient-to-r from-indigo-500 to-blue-600'
                  }`}
                  style={{ width: `${porcentajeAvance}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* LAYOUT PRINCIPAL A 2 COLUMNAS (GRID RESPONSIVO) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ======================================================== */}
          {/* COLUMNA PRINCIPAL (8 COLS): CHECKLIST Y OBSERVACIONES    */}
          {/* ======================================================== */}
          <div className="lg:col-span-8 space-y-6">
            {/* Banner de alerta preventiva de antecedentes RICE si corresponde */}
            {alertaEscalada?.tiene_alerta && (
              <AlertaEscaladaBanner diagnostico={alertaEscalada} />
            )}

            {/* Checklist de Pasos Normativos RICE y Evidencias */}
            <ChecklistProtocolo
              pasos={pasos}
              loading={loadingPasos}
              canEdit={canEdit}
              onCompletarPaso={handleCompletarPaso}
              onSubirEvidencia={handleSubirEvidencia}
              onEliminarEvidencia={handleEliminarEvidencia}
              protocoloCerrado={protocolo.estado === 'Cerrado'}
            />

            {/* Observaciones Iniciales y Hechos de Apertura */}
            {protocolo.observaciones && (
              <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/90 dark:border-gray-700/80 p-5 sm:p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 dark:border-gray-700/60">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                      Observaciones y Hechos de Apertura
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Antecedentes registrados al momento de la activación del protocolo
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-normal">
                  {protocolo.observaciones}
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* COLUMNA LATERAL (4 COLS): ESTUDIANTE, STEPPER Y ACCIONES  */}
          {/* ======================================================== */}
          <div className="lg:col-span-4 space-y-6">
            {/* Tarjeta 1: Ficha del Estudiante Titular */}
            <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/90 dark:border-gray-700/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700/60">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <User className="w-4 h-4 text-indigo-500" />
                  <span>Estudiante Involucrado</span>
                </div>
                {protocolo.estudiante?.es_pie && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    Programa PIE
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0">
                  {getInitials(protocolo.estudiante?.nombre, protocolo.estudiante?.apellido)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {protocolo.estudiante?.nombre} {protocolo.estudiante?.apellido}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {typeof protocolo.estudiante?.curso === 'object'
                      ? protocolo.estudiante?.curso?.nombre
                      : protocolo.estudiante?.curso || 'Sin curso asignado'}
                  </p>
                  {protocolo.estudiante?.rut && (
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 font-mono mt-0.5">
                      RUT: {protocolo.estudiante.rut}
                    </p>
                  )}
                </div>
              </div>

              {protocolo.estudiante?.id && (
                <Link
                  to={`/estudiantes/${protocolo.estudiante.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200/80 dark:border-indigo-800 transition"
                >
                  <span>Ver Expediente del Alumno</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {/* Tarjeta 2: Incidente Relacionado (si existe) */}
            {protocolo.incidente && (
              <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/90 dark:border-gray-700/80 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700/60">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    <span>Incidente Asociado</span>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 text-[10px] font-bold">
                    {protocolo.incidente.gravedad}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">
                    {protocolo.incidente.tipo_abordaje}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Fecha del hecho: {formatDate(protocolo.incidente.fecha)}
                  </p>
                </div>

                <Link
                  to={`/incidentes/${protocolo.incidente.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 transition"
                >
                  <span>Revisar Caso #{protocolo.incidente.id}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* Tarjeta 3: Línea de Tiempo del Estado (Stepper Vertical) */}
            <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/90 dark:border-gray-700/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 border-b border-gray-100 dark:border-gray-700/60">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>Etapa Administrativa</span>
              </div>

              <div className="space-y-4 relative">
                {ESTADOS.map((estado, index) => {
                  const isCurrent = index === estadoActualIndex
                  const isPassed = index < estadoActualIndex
                  return (
                    <div key={estado} className="flex items-start gap-3 relative">
                      {/* Línea conectora vertical */}
                      {index < ESTADOS.length - 1 && (
                        <div
                          className={`absolute left-4 top-8 -bottom-4 w-0.5 ${
                            isPassed ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        />
                      )}

                      {/* Icono del paso */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors z-10 ${
                          isPassed
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : isCurrent
                            ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-2 border-indigo-600 dark:border-indigo-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                        }`}
                      >
                        {isPassed ? <Check className="w-4 h-4" /> : index + 1}
                      </div>

                      <div className="min-w-0 pt-1 flex-1">
                        <p
                          className={`text-xs font-bold ${
                            isCurrent
                              ? 'text-indigo-700 dark:text-indigo-300'
                              : isPassed
                              ? 'text-gray-800 dark:text-gray-200'
                              : 'text-gray-400 dark:text-gray-500'
                          }`}
                        >
                          {estado}
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                          {isPassed
                            ? 'Completado'
                            : isCurrent
                            ? 'Etapa en curso activo'
                            : 'Pendiente'}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Tarjeta 4: Avanzar Estado Administrativo */}
            {puedeAvanzar && (
              <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/90 dark:border-gray-700/80 p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 border-b border-gray-100 dark:border-gray-700/60">
                  <Share2 className="w-4 h-4 text-indigo-500" />
                  <span>Avanzar Estado</span>
                </div>

                {tienePasosPendientes && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 p-3.5 text-xs text-amber-800 dark:text-amber-200"
                  >
                    <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span className="font-medium leading-relaxed">
                      Debe completar todos los pasos del checklist antes de cambiar de etapa.
                    </span>
                  </div>
                )}

                {!showAvanzarForm ? (
                  <button
                    type="button"
                    disabled={tienePasosPendientes}
                    onClick={() => setShowAvanzarForm(true)}
                    className={`w-full rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold text-white transition shadow-sm ${
                      tienePasosPendientes
                        ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60'
                        : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-indigo-500/20 active:scale-[0.99]'
                    }`}
                  >
                    Avanzar a &quot;{ESTADOS[estadoActualIndex + 1]}&quot;
                  </button>
                ) : (
                  <div className="space-y-3 animate-in fade-in">
                    <div>
                      <label htmlFor="observacion" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Observación del Cambio de Estado <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="observacion"
                        value={observacion}
                        onChange={(e) => setObservacion(e.target.value)}
                        rows={3}
                        className="w-full text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 p-3 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                        placeholder="Describa las acciones realizadas y justificación del avance..."
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAvanzarForm(false)
                          setObservacion('')
                        }}
                        className="px-3.5 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition border border-gray-200 dark:border-gray-600"
                        disabled={updatingEstado}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleAvanzarEstado}
                        disabled={updatingEstado || !observacion.trim()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition disabled:opacity-50"
                      >
                        {updatingEstado ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        <span>Confirmar Avance</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal de Asistencia RAG Normativa (Copiloto RICE) */}
        <AsistenteNormativoModal
          isOpen={modalRiceOpen}
          onClose={() => setModalRiceOpen(false)}
          consultaInicial={`¿Qué procedimientos y plazos normativos aplican para un caso de ${tipoProtocoloNombre}?`}
        />
      </div>
    </DashboardLayout>
  )
}
