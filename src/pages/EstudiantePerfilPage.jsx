import SeguimientoFormativo from '@/components/estudiantes/SeguimientoFormativo'
import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { getEstudianteById } from '@/services/estudiantesService'
import { getEstudiantesEnRiesgo } from '@/services/dashboardService'
import DownloadPDFButton from '../components/reports/DownloadPDFButton'
import { formatDate } from '@/utils/formatDate'
import {
  MapPin,
  ArrowLeftRight,
  ArrowLeft,
  CalendarPlus,
  User,
  Users,
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  AlertTriangle,
  History,
  FileText,
  ShieldAlert,
  Sparkles,
  CalendarCheck,
  FileCheck,
  Download,
  CheckCircle2,
} from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Breadcrumbs from '@/components/shared/Breadcrumbs'
import { useAuth } from '@/store/useAuthStore'
import { ROLES_GESTION_CASOS } from '@/constants/roles'
import ReasignarCursoModal from '@/components/estudiantes/ReasignarCursoModal'
import NuevaCitacionModal from '@/components/citaciones/NuevaCitacionModal'
import CerrarCitacionAcuerdosModal from '@/components/citaciones/CerrarCitacionAcuerdosModal'
import EntrevistaCitacionModal from '@/components/citaciones/EntrevistaCitacionModal'
import TabCitacionesEstudiante from '@/components/citaciones/TabCitacionesEstudiante'
import {
  listarCitaciones,
  descargarActaCitacionPdf,
  CATEGORIAS_FORMATIVAS,
} from '@/services/citacionesService'

export default function EstudiantePerfilPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [estudiante, setEstudiante] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [riesgoEstudianteId, setRiesgoEstudianteId] = useState(null)
  const [showReasignarModal, setShowReasignarModal] = useState(false)
  const [showCitacionModal, setShowCitacionModal] = useState(false)
  const [citaciones, setCitaciones] = useState([])
  const [citacionParaAcuerdos, setCitacionParaAcuerdos] = useState(null)
  const [showAcuerdosModal, setShowAcuerdosModal] = useState(false)
  const [descargandoActaId, setDescargandoActaId] = useState(null)

  const { user } = useAuth()
  const canWrite = ROLES_GESTION_CASOS.includes(user?.rol)

  const cargarCitaciones = async () => {
    try {
      const res = await listarCitaciones({ estudiante_id: id })
      if (res?.data) {
        setCitaciones(res.data)
      }
    } catch {
      // Degradación grácil ante fallos de conectividad o tests unitarios
    }
  }

  const handleDescargarActa = async (citacionId, folio) => {
    try {
      setDescargandoActaId(citacionId)
      await descargarActaCitacionPdf(citacionId, folio)
    } catch (err) {
      console.error('Error al descargar acta oficial:', err)
    } finally {
      setDescargandoActaId(null)
    }
  }

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    setRiesgoEstudianteId(null)

    cargarCitaciones()

    getEstudianteById(id)
      .then((data) => {
        if (active) setEstudiante(data)
      })
      .catch(() => {
        if (active) setError('Error al cargar perfil del estudiante')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    getEstudiantesEnRiesgo()
      .then((estudiantesEnRiesgo) => {
        if (active && estudiantesEnRiesgo.some((est) => String(est.id) === id)) {
          setRiesgoEstudianteId(id)
        }
      })
      .catch(() => {
        if (active) setRiesgoEstudianteId(null)
      })

    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 animate-spin text-indigo-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="mt-2 text-sm font-medium text-slate-600">Cargando expediente escolar del estudiante...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !estudiante) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center p-4">
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-6 text-center max-w-md w-full shadow-sm">
            <div className="w-12 h-12 bg-rose-100 rounded-full mx-auto flex items-center justify-center text-rose-600 mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-rose-900">{error || 'Estudiante no encontrado'}</h2>
            <p className="text-xs text-rose-600 mt-1">Verifique el identificador solicitado o regrese al directorio general.</p>
            <button
              onClick={() => navigate('/estudiantes')}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Estudiantes</span>
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const cursoObj =
    estudiante?.curso ||
    (Array.isArray(estudiante?.cursos) ? estudiante.cursos[0] : estudiante?.cursos) ||
    null

  const nombreCurso =
    cursoObj?.nombre ||
    estudiante?.curso_nombre ||
    (estudiante?.estado_matricula === 'Egresado'
      ? '🎓 Egresado'
      : estudiante?.estado_matricula === 'Retirado'
      ? '📁 Retirado'
      : 'Sin curso asignado')

  const cursoId = searchParams.get('curso') || cursoObj?.id || estudiante?.curso_id
  const cursoUrl = cursoId ? `/estudiantes?curso=${cursoId}` : '/estudiantes'
  const breadcrumbItems = [
    { label: 'Cursos', href: '/estudiantes' },
    {
      label: 'Estudiantes',
      onClick: () => navigate(cursoUrl),
    },
    { label: `Perfil ${estudiante.nombre} ${estudiante.apellido}` },
  ]

  const apoderadoTitular =
    estudiante.apoderado ||
    (Array.isArray(estudiante.apoderados) &&
      (estudiante.apoderados.find((a) => a.es_titular) || estudiante.apoderados[0])) ||
    null

  const iniciales = `${estudiante.nombre?.[0] || ''}${estudiante.apellido?.[0] || ''}`.toUpperCase()

  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navegación y Botón Volver */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Breadcrumbs items={breadcrumbItems} />
          <button
            onClick={() => navigate(cursoUrl)}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Volver a Estudiantes</span>
          </button>
        </div>

        {/* HERO BANNER MODERNO: ESTILO EXPEDIENTE OFICIAL */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-6 sm:p-8 shadow-md border border-indigo-900/40">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4 sm:gap-5">
              {/* Avatar con Iniciales Grandes */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-indigo-600/90 text-white flex items-center justify-center text-xl sm:text-2xl font-black shadow-inner border-2 border-indigo-300/40 shrink-0">
                {iniciales || <User className="w-8 h-8 text-white" />}
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {estudiante.nombre} {estudiante.apellido}
                  </h1>

                  {estudiante.estado_matricula === 'Egresado' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 shadow-sm">
                      🎓 Egresado (8° Básico)
                    </span>
                  )}
                  {estudiante.estado_matricula === 'Retirado' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-sm">
                      📁 Retirado
                    </span>
                  )}
                  {(estudiante.es_pie || estudiante.pie) && (
                    <span
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 shadow-sm"
                      title="Estudiante del Programa de Integración Escolar (PIE)"
                    >
                      PIE
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-indigo-200">
                  <span className="font-mono bg-white/10 px-2.5 py-0.5 rounded-md border border-white/15 text-white">
                    RUT: {estudiante.rut}
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-white">
                    {nombreCurso}
                  </span>
                  {estudiante.genero && (
                    <>
                      <span>•</span>
                      <span>Género: {estudiante.genero}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Acciones Principales en Cabecera */}
            <div className="flex flex-wrap items-center gap-2.5 sm:self-center">
              {/* Botón de Citar Apoderado (Épica 10) */}
              <button
                type="button"
                onClick={() => setShowCitacionModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all hover:scale-[1.02]"
                title="Convocar a entrevista o citación formativa"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>Citar Apoderado</span>
              </button>

              {/* Botón Descargar PDF Ficha */}
              <DownloadPDFButton
                estudianteId={estudiante.id}
                estudianteNombre={`${estudiante.nombre}-${estudiante.apellido}`}
              />
            </div>
          </div>
        </div>

        {/* ALERTA DE CONTEXTO / RIESGO (Requerida estrictamente por testing) */}
        {riesgoEstudianteId === id && (
          <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 flex items-start gap-3 shadow-xs">
            <span aria-hidden="true" className="text-xl shrink-0 mt-0.5">⚠️</span>
            <div className="text-sm">
              <p className="font-bold text-amber-900">Atención de Convivencia Escolar</p>
              <p className="text-amber-800 mt-0.5">
                Este estudiante acumula múltiples incidentes recientes. Evalúe si corresponde activar o escalar el protocolo vigente.
              </p>
            </div>
          </div>
        )}

        {/* GRID PRINCIPAL EN 2 COLUMNAS AMPLIAS (Datos Estudiante vs Apoderado) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* TARJETA 1: DATOS PERSONALES Y ESCOLARES */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-5 transition-all">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Datos Personales
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Información biográfica y de matrícula activa.
                  </p>
                </div>
              </div>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/60">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Fecha de Nacimiento
                </dt>
                <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {formatDate(estudiante.fecha_nacimiento) || 'Sin fecha'}
                </dd>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/60">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Género
                </dt>
                <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {estudiante.genero || 'No informado'}
                </dd>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/60 sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Curso
                </dt>
                <dd className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                    {nombreCurso}
                  </span>
                  {canWrite &&
                    estudiante.estado_matricula !== 'Egresado' &&
                    estudiante.estado_matricula !== 'Retirado' && (
                      <button
                        type="button"
                        onClick={() => setShowReasignarModal(true)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-300 dark:hover:bg-amber-900 transition shadow-2xs"
                        title="Cambiar de curso / paralelo"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Cambiar Curso</span>
                      </button>
                    )}
                </dd>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/60 sm:col-span-2">
                <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Domicilio</span>
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                  {estudiante.direccion || 'Sin domicilio registrado'}
                </dd>
              </div>
            </dl>
          </section>

          {/* TARJETA 2: DATOS DEL APODERADO TITULAR */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-5 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Apoderado
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Alianza Familia-Escuela y contacto principal.
                    </p>
                  </div>
                </div>

                {apoderadoTitular && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Titular Convocable
                  </span>
                )}
              </div>

              {!apoderadoTitular ? (
                <div className="py-8 text-center text-slate-500">
                  <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-medium">Sin apoderado registrado</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Asigne un apoderado para habilitar la emisión de citaciones y colillas digitales.
                  </p>
                </div>
              ) : (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/60 sm:col-span-2">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Nombre
                    </dt>
                    <dd className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                      {apoderadoTitular.nombre} {apoderadoTitular.apellido || ''}
                    </dd>
                  </div>

                  {apoderadoTitular.rut && (
                    <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/60">
                      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        RUT
                      </dt>
                      <dd className="mt-1 text-sm font-mono font-medium text-slate-800 dark:text-slate-200">
                        {apoderadoTitular.rut}
                      </dd>
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/60">
                    <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <Mail className="w-3.5 h-3.5 text-sky-500" />
                      <span>Email</span>
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                      {apoderadoTitular.email || 'Sin email registrado'}
                    </dd>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/60">
                    <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Teléfono</span>
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">
                      {apoderadoTitular.telefono || 'Sin teléfono registrado'}
                    </dd>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/60 sm:col-span-2">
                    <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-sky-500" />
                      <span>Domicilio</span>
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">
                      {apoderadoTitular.direccion || estudiante.direccion || 'Sin domicilio registrado'}
                    </dd>
                  </div>
                </dl>
              )}
            </div>
          </section>
        </div>

        {/* TARJETA 3: TRAYECTORIA ESCOLAR (Si existe) */}
        {estudiante.trayectoria_escolar && estudiante.trayectoria_escolar.length > 0 && (
          <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-4 transition-all">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Trayectoria Escolar
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Historial cronológico de matrícula y situación final por año lectivo.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {estudiante.trayectoria_escolar.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 space-y-1.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-400">
                      Año {t.anio}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        t.estado_final === 'Promovido'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : t.estado_final === 'Egresado'
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                          : t.estado_final === 'Repitente'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : t.estado_final === 'Retirado'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      {t.estado_final}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {t.curso_nombre}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TARJETA 4: HISTORIAL DE INCIDENTES */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-4 transition-all">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Historial de Incidentes
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Bitácora de hechos registrados con abordaje formativo.
                </p>
              </div>
            </div>
          </div>

          {estudiante.incidentes && estudiante.incidentes.length > 0 ? (
            <div className="space-y-3">
              {estudiante.incidentes
                .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                .map((incidente) => (
                  <div
                    key={incidente.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              incidente.gravedad === 'Leve'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : incidente.gravedad === 'Grave'
                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {incidente.gravedad}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {formatDate(incidente.fecha)}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {incidente.tipo_abordaje}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                          {incidente.relato}
                        </p>
                        {incidente.es_victima && (
                          <span className="inline-flex rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 text-[10px] font-bold">
                            Víctima del Suceso
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500">
              <ShieldAlert className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-medium">Sin incidentes registrados</p>
              <p className="text-xs text-slate-400">
                El estudiante no registra anotaciones ni faltas al reglamento escolar.
              </p>
            </div>
          )}
        </section>

        {/* TARJETA 5: GESTOR DE CITACIONES FORMATIVAS Y ALIANZA FAMILIA-ESCUELA (ÉPICA 10 / TASK 10.3.3) */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-4 transition-all">
          <TabCitacionesEstudiante
            estudianteId={id}
            estudiante={estudiante}
            apoderado={apoderadoTitular}
            citacionesIniciales={citaciones}
            onActualizado={cargarCitaciones}
          />
        </section>

        {/* SEGUIMIENTO FORMATIVO E INFORMES */}
        <div className="w-full">
          <SeguimientoFormativo key={id} estudianteId={id} />
        </div>
      </div>

      {/* MODAL REASIGNACIÓN DE CURSO */}
      {canWrite && showReasignarModal && (
        <ReasignarCursoModal
          isOpen={showReasignarModal}
          onClose={() => setShowReasignarModal(false)}
          estudiante={estudiante}
          onSuccess={(resultado) => {
            setEstudiante((prev) => ({
              ...prev,
              curso_id: resultado.curso?.id || resultado.id,
              curso: resultado.curso || resultado,
            }))
            setShowReasignarModal(false)
          }}
        />
      )}

      {/* MODAL NUEVA CITACIÓN FORMATIVA (ÉPICA 10) */}
      {showCitacionModal && (
        <NuevaCitacionModal
          isOpen={showCitacionModal}
          onClose={() => setShowCitacionModal(false)}
          onSuccess={() => {
            setShowCitacionModal(false)
            cargarCitaciones()
          }}
          estudiante={estudiante}
          apoderado={apoderadoTitular}
        />
      )}

      {/* MODAL ENTREVISTA PRESENCIAL Y FIRMAS EN REACT (TASK 10.2.4) */}
      {showAcuerdosModal && citacionParaAcuerdos && (
        <EntrevistaCitacionModal
          isOpen={showAcuerdosModal}
          onClose={() => {
            setShowAcuerdosModal(false)
            setCitacionParaAcuerdos(null)
          }}
          citacion={citacionParaAcuerdos}
          onSuccess={() => {
            cargarCitaciones()
          }}
        />
      )}
    </DashboardLayout>
  )
}
