import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Sparkles,
  FileText,
  Loader2,
  ArrowLeft,
  Clock,
  Download,
  ExternalLink,
  MailCheck,
  AlertTriangle,
  CheckCircle,
  BookOpen,
  Copy,
  Check,
  ShieldAlert,
  Users,
  Calendar,
  AlertCircle,
  Scale,
  Send,
  HelpCircle,
  ChevronRight,
  Edit2,
  MessageSquare,
  Pencil,
} from 'lucide-react'
import toast from 'react-hot-toast'
import DlpSensitiveText from '@/components/dlp/DlpSensitiveText'
import {
  getIncidenteById,
  updateEstadoIncidente,
  updateObservacionEstudiante,
} from '@/services/incidentesService'
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
import { ROLES_GESTION_CASOS, ROLES_GESTION_REPORTES } from '@/constants/roles'

const ESTADOS_INCIDENTE = ['Registrado', 'En Investigación', 'Derivado', 'Cerrado']

export default function IncidenteDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [incidente, setIncidente] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [updatingEstado, setUpdatingEstado] = useState(false)
  const [modalEstadoOpen, setModalEstadoOpen] = useState(false)
  const [justificacionEstado, setJustificacionEstado] = useState('')

  // Estados para observaciones individuales al derivar o en seguimiento (Hallazgo 5)
  const [observacionesEstudiantesDerivacion, setObservacionesEstudiantesDerivacion] = useState({})
  const [estudianteObservacionModal, setEstudianteObservacionModal] = useState(null)
  const [textoObservacionIndividual, setTextoObservacionIndividual] = useState('')
  const [guardandoObservacion, setGuardandoObservacion] = useState(false)

  // Estados para gestión de reportes con IA
  const [reportes, setReportes] = useState([])
  const [loadingReportes, setLoadingReportes] = useState(false)
  const [generandoBorradores, setGenerandoBorradores] = useState(false)
  const [modalReporteOpen, setModalReporteOpen] = useState(false)
  const [reporteModalId, setReporteModalId] = useState(null)
  const [modalRiceOpen, setModalRiceOpen] = useState(false)
  const [descargandoPdfId, setDescargandoPdfId] = useState(null)
  const [copiedId, setCopiedId] = useState(false)

  const { user } = useAuth()

  // Permisos según matriz de roles
  const canEdit = ROLES_GESTION_CASOS.includes(user?.rol)
  const canManageReportes = ROLES_GESTION_REPORTES.includes(user?.rol)

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

  const handleConfirmarCambioEstado = async () => {
    if (nuevoEstado === incidente.estado) return

    try {
      setUpdatingEstado(true)
      const payload = {
        justificacion: justificacionEstado,
      }

      if (nuevoEstado === 'Derivado') {
        payload.observacionesEstudiantes = Object.entries(observacionesEstudiantesDerivacion).map(
          ([estudiante_id, observacion]) => ({
            estudiante_id,
            observacion: (observacion || '').trim(),
          })
        )
      }

      const updated = await updateEstadoIncidente(id, nuevoEstado, payload)
      // Actualizar reactivamente las observaciones individuales en el estado local
      setIncidente((prev) => {
        if (!prev) return updated
        const nuevosEst = (prev.estudiantes || []).map((e) => {
          const obsNueva = observacionesEstudiantesDerivacion[e.id]
          return obsNueva !== undefined ? { ...e, observacion: obsNueva.trim() || null } : e
        })
        return { ...prev, ...updated, estudiantes: nuevosEst }
      })

      setModalEstadoOpen(false)
      setJustificacionEstado('')
      toast.success(`Estado actualizado a "${nuevoEstado}" correctamente`)
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al cambiar estado'
      toast.error(msg)
    } finally {
      setUpdatingEstado(false)
    }
  }

  const handleGuardarObservacionIndividual = async () => {
    if (!estudianteObservacionModal) return

    try {
      setGuardandoObservacion(true)
      const textoLimpio = textoObservacionIndividual.trim()
      await updateObservacionEstudiante(
        incidente.id,
        estudianteObservacionModal.id,
        textoLimpio
      )

      // Actualizar reactivamente en el estado local de incidentes
      setIncidente((prev) => {
        if (!prev) return prev
        const nuevosEst = (prev.estudiantes || []).map((e) =>
          String(e.id) === String(estudianteObservacionModal.id)
            ? { ...e, observacion: textoLimpio || null }
            : e
        )
        return { ...prev, estudiantes: nuevosEst }
      })

      toast.success(
        `Observación individual de ${estudianteObservacionModal.nombre} guardada correctamente`
      )
      setEstudianteObservacionModal(null)
      setTextoObservacionIndividual('')
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al actualizar la observación individual'
      toast.error(msg)
    } finally {
      setGuardandoObservacion(false)
    }
  }

  // Clic en botón principal de IA
  const handleAbrirOGenerarReporte = async (reporteId = null) => {
    setReporteModalId(reporteId || null)
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

  // Descarga o previsualización de PDF desde la tarjeta del informe individual (HU 6.3.2 y Hallazgo 4)
  const handleDescargarReportePdf = async (reporte, abrirEnNuevaPestana = false, esPreview = false) => {
    try {
      setDescargandoPdfId(reporte.id)
      const apellidoLimpio = (reporte.estudiantes?.apellido || 'Estudiante')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_')
      const prefix = esPreview ? 'Validacion_Borrador' : 'Informe_Incidente'
      const filename = `${prefix}_${incidente.id}_${apellidoLimpio}.pdf`

      if (esPreview) {
        await descargarReportePdf(incidente.id, reporte.id, filename, abrirEnNuevaPestana, true)
      } else {
        await descargarReportePdf(incidente.id, reporte.id, filename, abrirEnNuevaPestana)
      }

      if (abrirEnNuevaPestana) {
        toast.success(esPreview ? 'Abriendo vista previa para validación del documento' : 'Abriendo PDF oficial en nueva pestaña')
      } else {
        toast.success(`Descarga iniciada: ${filename}`)
      }
    } catch (err) {
      toast.error('Error al generar el archivo PDF')
    } finally {
      setDescargandoPdfId(null)
    }
  }

  const handleReportesActualizados = (nuevosReportes) => {
    setReportes(nuevosReportes)
    loadIncidente()
    loadReportes()
  }

  const handleCopyId = () => {
    if (!incidente?.id) return
    navigator.clipboard?.writeText(String(incidente.id))
    setCopiedId(true)
    toast.success('ID del incidente copiado al portapapeles')
    setTimeout(() => setCopiedId(false), 2000)
  }

  // Helper para armar iniciales de avatar
  const getInitials = (nombre, apellido) => {
    const n = (nombre || '').trim().charAt(0).toUpperCase()
    const a = (apellido || '').trim().charAt(0).toUpperCase()
    return `${n}${a}` || 'AL'
  }

  // Helper para obtener rol sensible al género (ej. Agresora / Agresor / Víctima)
  const getRolEstudiante = (est) => {
    if (est?.es_victima === true) return 'Víctima'
    if (est?.es_victima === false) {
      const primerNombre = (est.nombre || '').trim().split(' ')[0]
      const esFemenino =
        est.genero === 'Femenino' ||
        est.sexo === 'F' ||
        (primerNombre && /[aá]$/i.test(primerNombre))
      return esFemenino ? 'Agresora' : 'Agresor'
    }
    return 'Involucrado'
  }

  // Helper para humanizar el encabezado según los alumnos involucrados
  const getHumanizedTitle = (estudiantes = []) => {
    if (!estudiantes || estudiantes.length === 0) return `Incidente #${incidente?.id}`
    if (estudiantes.length === 1) {
      const e = estudiantes[0]
      return `${e.nombre || ''} ${e.apellido || ''}`.trim()
    }
    if (estudiantes.length === 2) {
      return `${estudiantes[0].nombre || ''} ${estudiantes[0].apellido || ''}`.trim() + ' y ' + `${estudiantes[1].nombre || ''} ${estudiantes[1].apellido || ''}`.trim()
    }
    return `${estudiantes[0].nombre || ''} ${estudiantes[0].apellido || ''}`.trim() + `, ${estudiantes[1].nombre || ''} ${estudiantes[1].apellido || ''}`.trim() + ` y ${estudiantes.length - 2} más`
  }

  // Renderizado del título humanizado protegido con DLP
  const renderHumanizedTitle = (estudiantes = []) => {
    if (!estudiantes || estudiantes.length === 0) return `Incidente #${incidente?.id}`
    if (estudiantes.length === 1) {
      const e = estudiantes[0]
      return (
        <DlpSensitiveText tipo="nombre">
          {`${e.nombre || ''} ${e.apellido || ''}`.trim() || 'Estudiante'}
        </DlpSensitiveText>
      )
    }
    if (estudiantes.length === 2) {
      return (
        <span className="inline-flex items-center flex-wrap gap-x-2">
          <DlpSensitiveText tipo="nombre">
            {`${estudiantes[0].nombre || ''} ${estudiantes[0].apellido || ''}`.trim() || 'Estudiante 1'}
          </DlpSensitiveText>
          <span className="text-gray-400 font-normal">y</span>
          <DlpSensitiveText tipo="nombre">
            {`${estudiantes[1].nombre || ''} ${estudiantes[1].apellido || ''}`.trim() || 'Estudiante 2'}
          </DlpSensitiveText>
        </span>
      )
    }
    return (
      <span className="inline-flex items-center flex-wrap gap-x-1.5">
        <DlpSensitiveText tipo="nombre">
          {`${estudiantes[0].nombre || ''} ${estudiantes[0].apellido || ''}`.trim() || 'Estudiante 1'}
        </DlpSensitiveText>
        <span className="text-gray-400 font-normal">,</span>
        <DlpSensitiveText tipo="nombre">
          {`${estudiantes[1].nombre || ''} ${estudiantes[1].apellido || ''}`.trim() || 'Estudiante 2'}
        </DlpSensitiveText>
        <span className="text-gray-400 font-normal">y {estudiantes.length - 2} más</span>
      </span>
    )
  }

  // Paletas visuales diferenciadas y armónicas para las tarjetas de estudiantes
  const CARD_PALETTES = [
    {
      card: 'border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-indigo-50/30 to-white dark:from-indigo-950/40 dark:via-indigo-950/20 dark:to-gray-900 dark:border-indigo-800/80 hover:border-indigo-300 dark:hover:border-indigo-700',
      avatar: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/70 dark:text-indigo-200',
    },
    {
      card: 'border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-emerald-50/30 to-white dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-gray-900 dark:border-emerald-800/80 hover:border-emerald-300 dark:hover:border-emerald-700',
      avatar: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/70 dark:text-emerald-200',
    },
    {
      card: 'border-purple-200 bg-gradient-to-br from-purple-50/70 via-purple-50/30 to-white dark:from-purple-950/40 dark:via-purple-950/20 dark:to-gray-900 dark:border-purple-800/80 hover:border-purple-300 dark:hover:border-purple-700',
      avatar: 'bg-purple-100 text-purple-700 dark:bg-purple-900/70 dark:text-purple-200',
    },
    {
      card: 'border-amber-200 bg-gradient-to-br from-amber-50/70 via-amber-50/30 to-white dark:from-amber-950/40 dark:via-amber-950/20 dark:to-gray-900 dark:border-amber-800/80 hover:border-amber-300 dark:hover:border-amber-700',
      avatar: 'bg-amber-100 text-amber-800 dark:bg-amber-900/70 dark:text-amber-200',
    },
  ]

  const getGravedadBadgeStyle = (gravedad) => {
    switch (gravedad) {
      case 'Gravísima':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'Grave':
        return 'bg-amber-100 text-amber-800 border-amber-300'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300'
    }
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
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-red-500 mb-2" />
            <p className="text-red-800 font-semibold">{error || 'Incidente no encontrado'}</p>
            <button
              onClick={() => navigate('/incidentes')}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Volver a Incidentes
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Lista unificada de estudiantes y vinculación de reportes
  const listaEstudiantes = (() => {
    const list = [...(incidente.estudiantes || [])]
    reportes.forEach((rep) => {
      if (rep.estudiantes && !list.some((e) => String(e.id) === String(rep.estudiante_id))) {
        list.push({
          ...rep.estudiantes,
          id: rep.estudiante_id,
        })
      }
    })
    return list
  })()

  const totalReportes = reportes.length
  const stepIndex = ESTADOS_INCIDENTE.indexOf(incidente.estado) !== -1
    ? ESTADOS_INCIDENTE.indexOf(incidente.estado)
    : 0

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* BARRA SUPERIOR DE NAVEGACIÓN Y ACCIONES */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate('/incidentes')}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver a Incidentes</span>
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setModalRiceOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs sm:text-sm font-semibold text-emerald-800 hover:bg-emerald-100 transition-all shadow-xs"
            >
              <BookOpen className="h-4 w-4 text-emerald-700" />
              <span>Consultar RICE</span>
            </button>
          </div>
        </div>

        {/* OVERLAY MODAL DE ESPERA DURANTE GENERACIÓN ASISTIDA */}
        {generandoBorradores && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4 animate-bounce">
                <Sparkles className="h-7 w-7 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Asistente de Redacción Normativa RICE
              </h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                El sistema está redactando la propuesta pedagógica de los informes, resguardando la privacidad y confidencialidad de los estudiantes conforme a la Circular N° 482 y la Ley N° 19.628.
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-indigo-600 font-medium">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Estructurando hechos objetivos y medidas formativas...</span>
              </div>
            </div>
          </div>
        )}

        {/* ENCABEZADO HUMANIZADO DEL CASO */}
        <div className="mb-6 rounded-2xl bg-white border border-gray-200/90 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Detalle del Caso
                </span>
                <span className="text-gray-300">•</span>
                <span className="font-mono text-xs font-semibold text-gray-600">
                  Incidente #{incidente.id}
                </span>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${getGravedadBadgeStyle(incidente.gravedad)}`}>
                  {incidente.gravedad}
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-300 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
                  {incidente.estado}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                <DlpSensitiveText tipo="nombre" value={getHumanizedTitle(listaEstudiantes)}>
                  {getHumanizedTitle(listaEstudiantes)}
                </DlpSensitiveText>
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                Registrado el {formatDate(incidente.fecha)} por {incidente.usuarios ? `${incidente.usuarios.nombre} ${incidente.usuarios.apellido} (${incidente.usuarios.rol})` : 'Personal institucional'}
              </p>
            </div>

            {totalReportes > 0 && (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 px-3.5 py-2 text-xs text-indigo-900 font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600 shrink-0" />
                <span>{totalReportes} informe(s) normativo(s) disponible(s)</span>
              </div>
            )}
          </div>
        </div>

        {/* GRID PRINCIPAL ASIMÉTRICA: 8 COLS CONTENIDO + 4 COLS ASIDE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* COLUMNA PRINCIPAL (8 COLS) */}
          <div className="lg:col-span-8 space-y-6">
            {/* TARJETA 1: METADATOS DEL INCIDENTE */}
            <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/50 via-indigo-50/20 to-white p-5 sm:p-6 shadow-xs">
              <h2 className="text-sm font-bold text-blue-950 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                Antecedentes del Suceso
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-xl bg-white/80 border border-blue-100/70 p-3">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase block">Fecha Suceso</span>
                  <span className="text-sm font-bold text-gray-900 mt-0.5 block">{formatDate(incidente.fecha)}</span>
                </div>
                <div className="rounded-xl bg-white/80 border border-blue-100/70 p-3">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase block">Gravedad</span>
                  <span className="text-sm font-bold text-gray-900 mt-0.5 block">{incidente.gravedad}</span>
                </div>
                <div className="rounded-xl bg-white/80 border border-blue-100/70 p-3">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase block">Tipo Abordaje</span>
                  <span className="text-sm font-bold text-gray-900 mt-0.5 block truncate" title={incidente.tipo_abordaje || incidente.tipos_abordaje?.nombre || 'General'}>
                    {incidente.tipo_abordaje || incidente.tipos_abordaje?.nombre || 'No especificado'}
                  </span>
                </div>
                <div className="rounded-xl bg-white/80 border border-blue-100/70 p-3">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase block">Involucrados</span>
                  <span className="text-sm font-bold text-gray-900 mt-0.5 block">
                    {listaEstudiantes.length} {listaEstudiantes.length === 1 ? 'estudiante' : 'estudiantes'}
                  </span>
                </div>
              </div>
            </section>

            {/* TARJETA 2: RELATO FACTUAL Y MEDIDAS INMEDIATAS */}
            <section className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/40 via-violet-50/20 to-white p-5 sm:p-6 shadow-xs">
              <h2 className="text-sm font-bold text-purple-950 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Scale className="h-4 w-4 text-purple-600" />
                Relato Factual y Actuaciones Inmediatas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl bg-white/90 border border-purple-100/80 p-4">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Relato de los Hechos
                  </h3>
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {incidente.relato || 'Sin relato detallado registrado en el sistema.'}
                  </p>
                </div>
                <div className="rounded-xl bg-white/90 border border-purple-100/80 p-4">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Medidas Inmediatas Adoptadas
                  </h3>
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {incidente.medidas || 'Sin medidas inmediatas adicionales registradas.'}
                  </p>
                </div>
              </div>
            </section>

            {/* SECCIÓN: INFORMES OFICIALES INDIVIDUALES (MINIMALISTA) */}
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Informes oficiales
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {listaEstudiantes.filter((est) => reportes.some((r) => String(r.estudiante_id) === String(est.id) && r.estado === 'Aprobado')).length} de {listaEstudiantes.length} validados
                  </p>
                  <span className="sr-only">
                    Informes Normativos Oficiales (RICE)
                  </span>
                </div>

                {canManageReportes && (
                  <button
                    type="button"
                    onClick={handleAbrirOGenerarReporte}
                    disabled={generandoBorradores || loadingReportes}
                    aria-label={
                      generandoBorradores
                        ? 'Redactando con Gemini...'
                        : totalReportes > 0
                        ? `Ver / Editar Informes Oficiales (${totalReportes})`
                        : 'Generar Informe Oficial con IA'
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-colors shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {generandoBorradores && (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-600 dark:text-gray-300" />
                    )}
                    <span>
                      {generandoBorradores
                        ? 'Redactando...'
                        : totalReportes > 0
                        ? 'Editar informes'
                        : 'Generar informes con IA'}
                    </span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {listaEstudiantes.map((est, idx) => {
                  const rep = reportes.find((r) => String(r.estudiante_id) === String(est.id))
                  const estudianteCompleto = {
                    ...est,
                    ...(rep?.estudiantes || {}),
                    observacion: est.observacion,
                    es_victima: est.es_victima,
                  }
                  const reporteConEstudiante = rep ? {
                    ...rep,
                    estudiantes: estudianteCompleto,
                  } : null

                  const esAprobado = rep?.estado === 'Aprobado'
                  const esBorrador = rep && rep.estado !== 'Aprobado'
                  const nombreAprobador = rep?.aprobador
                    ? `${rep.aprobador.nombre} ${rep.aprobador.apellido} (${rep.aprobador.rol})`
                    : 'Jefatura Institucional'
                  const fechaAprobacion = rep?.fecha_aprobacion
                    ? formatDate(rep.fecha_aprobacion)
                    : ''

                  const apoderadoTitular = estudianteCompleto.apoderados?.find((a) => a.es_titular) || estudianteCompleto.apoderados?.[0]
                  const apoderadoEmail = apoderadoTitular?.email
                  const isDownloadingThis = rep && descargandoPdfId === rep.id
                  const rolTexto = getRolEstudiante(estudianteCompleto)
                  const cursoTexto =
                    estudianteCompleto.cursos?.nombre ||
                    estudianteCompleto.curso ||
                    est.cursos?.nombre ||
                    est.curso ||
                    'Sin curso'
                  const palette = CARD_PALETTES[idx % CARD_PALETTES.length]

                  return (
                    <div
                      key={est.id || rep?.id || idx}
                      className={`rounded-2xl border ${palette.card} p-6 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all`}
                    >
                      <div>
                        {/* Fila superior: Avatar circular con iniciales + Badge de Estado */}
                        <div className="flex items-center justify-between gap-3">
                          <div className={`flex h-11 w-11 items-center justify-center rounded-full ${palette.avatar} font-semibold text-sm shrink-0`}>
                            {getInitials(est.nombre, est.apellido)}
                          </div>

                          {esAprobado ? (
                            <div
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400"
                              title={`Informe Oficial Aprobado por ${nombreAprobador} el ${fechaAprobacion}`}
                            >
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              <span>Aprobado</span>
                              <span className="sr-only">Informe Oficial Aprobado por {nombreAprobador} el {fechaAprobacion}</span>
                            </div>
                          ) : esBorrador ? (
                            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-500">
                              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                              <span>En revisión</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 dark:text-gray-500">
                              <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                              <span>Sin borrador</span>
                            </div>
                          )}
                        </div>

                        {/* Disposición vertical: Nombre, RUT, Rol, Curso */}
                        <div className="mt-3.5 space-y-1">
                          {/* 1. Nombre del estudiante con protección DLP */}
                          <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                            <DlpSensitiveText tipo="nombre">
                              {`${est.nombre || ''} ${est.apellido || ''}`.trim() || 'Estudiante'}
                            </DlpSensitiveText>
                          </h3>

                          {/* 2. RUT protegido con DLP */}
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            <DlpSensitiveText tipo="rut">{est.rut || 'Sin RUT'}</DlpSensitiveText>
                          </div>

                          {/* 3. Rol formativo / procesal */}
                          <div className="pt-0.5">
                            <span className="inline-flex items-center text-xs font-semibold text-gray-700 dark:text-gray-300">
                              {rolTexto}
                            </span>
                          </div>

                          {/* 4. Curso oficial del estudiante */}
                          <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {cursoTexto}
                          </div>
                        </div>

                        {/* Hecho / Observación individual con ícono de lápiz */}
                        <div className="mt-4 flex items-center justify-between gap-2 text-xs text-gray-700 dark:text-gray-300">
                          <span className="truncate" title={estudianteCompleto.observacion || 'Sin observación registrada'}>
                            {estudianteCompleto.observacion || 'Sin observación registrada'}
                          </span>
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => {
                                setEstudianteObservacionModal(estudianteCompleto)
                                setTextoObservacionIndividual(estudianteCompleto.observacion || '')
                              }}
                              className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors p-1 -m-1 rounded-md shrink-0"
                              title={estudianteCompleto.observacion ? 'Editar observación individual' : 'Agregar observación individual'}
                              aria-label={estudianteCompleto.observacion ? 'Editar Observación' : '+ Agregar Observación Individual'}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span className="sr-only">
                                {estudianteCompleto.observacion ? 'Editar Observación' : '+ Agregar Observación Individual'}
                              </span>
                            </button>
                          )}
                        </div>

                        {/* Advertencia apoderado sin correo */}
                        {!apoderadoEmail ? (
                          <p className="text-xs font-medium text-amber-700 dark:text-amber-500 flex items-center gap-1.5 mt-2">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>Apoderado sin correo</span>
                          </p>
                        ) : (
                          <span className="sr-only">{apoderadoEmail}</span>
                        )}
                      </div>

                      {/* Botones inferiores */}
                      <div className="mt-6 flex items-center gap-3">
                        {esAprobado ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleDescargarReportePdf(reporteConEstudiante || rep, true)}
                              disabled={isDownloadingThis}
                              aria-label="Ver en pestaña"
                              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                            >
                              Ver
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDescargarReportePdf(reporteConEstudiante || rep, false)}
                              disabled={isDownloadingThis}
                              aria-label="Descargar PDF Oficial"
                              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gray-950 hover:bg-gray-900 dark:bg-white dark:text-gray-950 text-white text-xs font-semibold transition-colors disabled:opacity-50 shadow-2xs"
                            >
                              {isDownloadingThis && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                              <span>Descargar PDF</span>
                            </button>
                          </>
                        ) : esBorrador ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleDescargarReportePdf(reporteConEstudiante || rep, true, true)}
                              disabled={isDownloadingThis}
                              aria-label="Validar / Previsualizar PDF"
                              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                            >
                              {isDownloadingThis && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                              Previsualizar
                            </button>
                            {canManageReportes && (
                              <button
                                type="button"
                                onClick={() => {
                                  setReporteModalId(rep.id)
                                  setModalReporteOpen(true)
                                }}
                                aria-label="Revisar y Aprobar"
                                className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-gray-950 hover:bg-gray-900 dark:bg-white dark:text-gray-950 text-white text-xs font-semibold transition-colors shadow-2xs"
                              >
                                Revisar y aprobar
                              </button>
                            )}
                          </>
                        ) : (
                          canManageReportes && (
                            <button
                              type="button"
                              onClick={() => handleAbrirOGenerarReporte(null)}
                              disabled={generandoBorradores}
                              aria-label="Redactar Informe con IA"
                              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gray-950 hover:bg-gray-900 dark:bg-white dark:text-gray-950 text-white text-xs font-semibold transition-colors shadow-2xs"
                            >
                              {generandoBorradores && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                              <span>Generar borrador</span>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>

          {/* COLUMNA LATERAL (ASIDE STICKY 4 COLS) */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
            {/* TARJETA 1: ESTADO DEL INCIDENTE Y STEPPER VISUAL */}
            <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Estado del Incidente</span>
                <span className="rounded-md bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-semibold">
                  {incidente.estado}
                </span>
              </h2>

              {/* STEPPER VISUAL DE 4 ETAPAS */}
              <div className="mb-6 space-y-2">
                {ESTADOS_INCIDENTE.map((est, idx) => {
                  const isDone = idx < stepIndex
                  const isCurrent = idx === stepIndex
                  return (
                    <div
                      key={est}
                      className={`flex items-center gap-3 rounded-xl p-2.5 transition-all text-xs font-medium ${
                        isCurrent
                          ? 'bg-blue-50/80 border border-blue-200 text-blue-900 font-bold'
                          : isDone
                          ? 'text-gray-700'
                          : 'text-gray-400 opacity-60'
                      }`}
                    >
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold shrink-0 ${
                          isCurrent
                            ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                            : isDone
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {isDone ? '✓' : idx + 1}
                      </div>
                      <span>{est}</span>
                      {isCurrent && (
                        <span className="ml-auto text-[10px] uppercase font-bold tracking-wider text-blue-600">
                          Actual
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* SELECTOR INTERACTIVO PARA ACTUALIZAR ESTADO */}
              {canEdit ? (
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <label htmlFor="nuevoEstadoSelect" className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Cambiar Estado
                  </label>
                  <select
                    id="nuevoEstadoSelect"
                    value={nuevoEstado}
                    onChange={(e) => setNuevoEstado(e.target.value)}
                    className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Registrado">Registrado</option>
                    <option value="En Investigación">En Investigación</option>
                    <option value="Derivado">Derivado</option>
                    <option value="Cerrado">Cerrado</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (nuevoEstado === 'Derivado') {
                        const iniciales = {}
                        listaEstudiantes.forEach((est) => {
                          iniciales[est.id] = est.observacion || ''
                        })
                        setObservacionesEstudiantesDerivacion(iniciales)
                      }
                      setModalEstadoOpen(true)
                    }}
                    disabled={nuevoEstado === incidente.estado || updatingEstado}
                    className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
                  >
                    {updatingEstado ? 'Actualizando...' : 'Actualizar Estado'}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-gray-500 pt-3 border-t border-gray-100">
                  Solo los roles Administrador y Equipo de Convivencia Escolar pueden modificar el estado del caso.
                </p>
              )}
            </div>

            {/* TARJETA 2: ACCIONES RÁPIDAS Y DERIVACIÓN RICE */}
            <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/40 via-slate-50/30 to-white p-5 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-sky-600" />
                Acciones Rápidas RICE
              </h2>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Herramientas complementarias para activar protocolos de convivencia conforme a la gravedad.
              </p>

              <div className="space-y-2.5">
                {['Grave', 'Gravísima'].includes(incidente.gravedad) && (
                  <button
                    type="button"
                    onClick={() => navigate(`/protocolos/nuevo?incidenteId=${id}&tipo=grave`)}
                    className="w-full inline-flex items-center justify-between rounded-xl border border-red-200 bg-red-50/60 p-3 text-xs font-semibold text-red-900 hover:bg-red-100/70 transition-all text-left"
                  >
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      Aperturar Protocolo RICE
                    </span>
                    <ChevronRight className="h-4 w-4 text-red-400" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => navigate(`/mediaciones/nueva?incidenteId=${id}`)}
                  className="w-full inline-flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/60 p-3 text-xs font-semibold text-indigo-900 hover:bg-indigo-100/70 transition-all text-left"
                >
                  <span className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-indigo-600" />
                    Iniciar Mediación Escolar
                  </span>
                  <ChevronRight className="h-4 w-4 text-indigo-400" />
                </button>
              </div>
            </div>

            {/* IDENTIFICADOR ÚNICO DEL INCIDENTE CON COPIADO RÁPIDO */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-3 text-xs text-gray-600 flex items-center justify-between gap-2">
              <span className="truncate">
                ID Incidente: <strong className="font-mono text-gray-800">{incidente.id}</strong>
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                className="inline-flex items-center gap-1 rounded-md bg-white border border-gray-300 px-2 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-100 transition-colors shrink-0 shadow-2xs"
                title="Copiar ID para oficios o seguimiento"
              >
                {copiedId ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-gray-500" />}
                {copiedId ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN Y JUSTIFICACIÓN PARA CAMBIO DE ESTADO */}
      {modalEstadoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className={`w-full ${nuevoEstado === 'Derivado' ? 'max-w-xl' : 'max-w-md'} rounded-2xl bg-white p-6 shadow-2xl transition-all`}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Confirmar Cambio de Estado
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">
              El estado del caso cambiará de <strong className="text-gray-900">{incidente.estado}</strong> a{' '}
              <strong className="text-blue-700">{nuevoEstado}</strong>.
            </p>

            {/* SECCIÓN DE OBSERVACIONES INDIVIDUALES AL DERIVAR (HALLAZGO 5) */}
            {nuevoEstado === 'Derivado' && (
              <div className="mb-4 space-y-3">
                <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3 text-xs text-blue-900">
                  <p className="font-bold flex items-center gap-1.5 mb-1">
                    <Send className="w-4 h-4 text-blue-600 shrink-0" />
                    Observaciones Individuales de Derivación por Alumno
                  </p>
                  <p className="text-blue-800 leading-relaxed text-[11px]">
                    Conforme al RICE y a los requerimientos institucionales, ingrese la medida y motivo de derivación individual para cada estudiante involucrado:
                  </p>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                  {listaEstudiantes.map((est) => (
                    <div key={est.id} className="rounded-xl border border-gray-200 bg-gray-50/60 p-3">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-900">
                            <DlpSensitiveText tipo="nombre">{`${est.nombre || ''} ${est.apellido || ''}`.trim() || 'Estudiante'}</DlpSensitiveText>
                          </span>
                          {est.rut && (
                            <span className="font-mono text-[10px] text-gray-500">
                              (<DlpSensitiveText tipo="rut">{est.rut}</DlpSensitiveText>)
                            </span>
                          )}
                          {est.es_victima !== null && est.es_victima !== undefined && (
                            <span className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                              est.es_victima
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}>
                              {est.es_victima ? 'Víctima' : 'Involucrado'}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold text-gray-500">
                          {est.cursos?.nombre || est.curso || 'Sin curso'}
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        value={observacionesEstudiantesDerivacion[est.id] || ''}
                        onChange={(e) =>
                          setObservacionesEstudiantesDerivacion((prev) => ({
                            ...prev,
                            [est.id]: e.target.value,
                          }))
                        }
                        placeholder={`Observación individual de derivación para ${est.nombre || 'estudiante'} (ej: derivado a psicólogo por contención emocional)...`}
                        className="w-full rounded-lg border border-gray-300 p-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="justificacionEstado" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Motivo / Justificación General Administrativa (Opcional)
              </label>
              <textarea
                id="justificacionEstado"
                rows={2}
                value={justificacionEstado}
                onChange={(e) => setJustificacionEstado(e.target.value)}
                placeholder="Indique brevemente el motivo del cambio para fines de trazabilidad institucional..."
                className="w-full rounded-xl border border-gray-300 p-3 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setModalEstadoOpen(false)}
                className="rounded-xl border border-gray-300 px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarCambioEstado}
                disabled={updatingEstado}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs disabled:opacity-50"
              >
                {updatingEstado ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Confirmar Actualización
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE OBSERVACIÓN INDIVIDUAL DE ESTUDIANTE (HALLAZGO 5) */}
      {estudianteObservacionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Observación Individual de Derivación
                </h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  Estudiante: <strong><DlpSensitiveText tipo="nombre">{`${estudianteObservacionModal.nombre || ''} ${estudianteObservacionModal.apellido || ''}`.trim() || 'Estudiante'}</DlpSensitiveText></strong> {estudianteObservacionModal.rut ? (<span className="font-mono text-gray-500">(<DlpSensitiveText tipo="rut">{estudianteObservacionModal.rut}</DlpSensitiveText>)</span>) : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEstudianteObservacionModal(null)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <label htmlFor="observacionIndividualText" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Detalle de la Derivación o Actuación Individual
              </label>
              <textarea
                id="observacionIndividualText"
                rows={4}
                value={textoObservacionIndividual}
                onChange={(e) => setTextoObservacionIndividual(e.target.value)}
                placeholder="Indique las medidas, profesional asignado o motivo específico de derivación para este estudiante..."
                className="w-full rounded-xl border border-gray-300 p-3 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-[11px] text-gray-500">
                Esta observación quedará registrada en el historial del caso y en el expediente individual del alumno.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEstudianteObservacionModal(null)}
                className="rounded-xl border border-gray-300 px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarObservacionIndividual}
                disabled={guardandoObservacion}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs disabled:opacity-50"
              >
                {guardandoObservacion ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Guardar Observación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE REVISIÓN ASISTIDA */}
      <ModalRevisionReporteIA
        isOpen={modalReporteOpen}
        onClose={() => {
          setModalReporteOpen(false)
          setReporteModalId(null)
        }}
        incidente={incidente}
        reportes={reportes}
        initialReporteId={reporteModalId}
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
