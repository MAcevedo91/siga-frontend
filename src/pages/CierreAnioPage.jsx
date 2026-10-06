import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Breadcrumbs from '@/components/shared/Breadcrumbs'
import {
  getEstadoActual,
  getPropuestaPromocion,
  ejecutarCierreYPromocion,
} from '@/services/cierreAnioService'
import {
  GraduationCap,
  Calendar,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Search,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react'

export default function CierreAnioPage() {
  const navigate = useNavigate()
  const [paso, setPaso] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Datos base cargados
  const [periodoActual, setPeriodoActual] = useState(null)
  const [docentesDisponibles, setDocentesDisponibles] = useState([])
  
  // Paso 1: Configuración de fechas y ciclo educativo del establecimiento
  const [nuevoAnio, setNuevoAnio] = useState(new Date().getFullYear() + 1)
  const [fechaInicio, setFechaInicio] = useState(`${new Date().getFullYear() + 1}-03-01`)
  const [fechaFin, setFechaFin] = useState(`${new Date().getFullYear() + 1}-12-31`)
  const [tipoEstablecimiento, setTipoEstablecimiento] = useState('BASICA') // 'BASICA' | 'MEDIA'

  // Paso 2: Cursos proyectados y jefaturas sugeridas
  const [cursosConfig, setCursosConfig] = useState([])

  // Paso 3: Alumnos y nómina de promoción
  const [alumnosPromocion, setAlumnosPromocion] = useState([])
  const [cursoFiltroTab, setCursoFiltroTab] = useState('ALL')
  const [busquedaAlumno, setBusquedaAlumno] = useState('')

  // Modal de confirmación final
  const [modalConfirmacion, setModalConfirmacion] = useState(false)

  useEffect(() => {
    cargarDatosIniciales(tipoEstablecimiento)
  }, [])

  const cargarDatosIniciales = async (tipoEst = tipoEstablecimiento) => {
    try {
      setLoading(true)
      setError(null)

      const propuesta = await getPropuestaPromocion({ tipo_establecimiento: tipoEst })

      setPeriodoActual(propuesta.periodo_actual)
      setNuevoAnio(propuesta.nuevo_anio_sugerido)
      setFechaInicio(propuesta.fecha_inicio_sugerida)
      setFechaFin(propuesta.fecha_fin_sugerida)
      if (propuesta.tipo_establecimiento) {
        setTipoEstablecimiento(propuesta.tipo_establecimiento)
      }
      setCursosConfig(propuesta.cursos_proyectados || [])
      setDocentesDisponibles(propuesta.docentes_disponibles || [])

      // Mapear nómina con estado mutable
      const alumnos = (propuesta.alumnos_propuesta || []).map((a) => ({
        estudiante_id: a.estudiante_id,
        rut: a.rut,
        nombre: a.nombre,
        apellido: a.apellido,
        es_pie: a.es_pie,
        curso_anterior_id: a.curso_anterior_id,
        curso_anterior_nombre: a.curso_anterior_nombre,
        nivel_anterior: a.nivel_anterior,
        es_egresado_automatico: a.es_egresado_automatico,
        estado_final: a.estado_propuesto, // 'Promovido' | 'Repitente' | 'Egresado' | 'Retirado'
        nuevo_curso_nombre: a.nuevo_curso_nombre_sugerido,
        curso_promovido_sugerido: a.nuevo_curso_nombre_sugerido,
      }))

      setAlumnosPromocion(alumnos)
      if (alumnos.length > 0) {
        setCursoFiltroTab('ALL')
      }
    } catch (err) {
      console.error('Error al cargar propuesta de cierre de año:', err)
      setError(err.response?.data?.message || 'Error al cargar la información del período lectivo')
    } finally {
      setLoading(false)
    }
  }

  // Cursos de origen disponibles para pestañas
  const cursosOrigenUnicos = useMemo(() => {
    const setCursos = new Set()
    alumnosPromocion.forEach((a) => {
      if (a.curso_anterior_nombre) setCursos.add(a.curso_anterior_nombre)
    })
    return Array.from(setCursos).sort()
  }, [alumnosPromocion])

  // Filtrado de alumnos en el Paso 3
  const alumnosFiltrados = useMemo(() => {
    return alumnosPromocion.filter((a) => {
      const matchCurso = cursoFiltroTab === 'ALL' || a.curso_anterior_nombre === cursoFiltroTab
      const matchBusqueda =
        busquedaAlumno === '' ||
        a.nombre.toLowerCase().includes(busquedaAlumno.toLowerCase()) ||
        a.apellido.toLowerCase().includes(busquedaAlumno.toLowerCase()) ||
        a.rut.includes(busquedaAlumno)
      return matchCurso && matchBusqueda
    })
  }, [alumnosPromocion, cursoFiltroTab, busquedaAlumno])

  // Resumen cuantitativo para el Paso 4
  const metricas = useMemo(() => {
    const total = alumnosPromocion.length
    const promovidos = alumnosPromocion.filter((a) => a.estado_final === 'Promovido').length
    const repitentes = alumnosPromocion.filter((a) => a.estado_final === 'Repitente').length
    const egresados = alumnosPromocion.filter((a) => a.estado_final === 'Egresado').length
    const retirados = alumnosPromocion.filter((a) => a.estado_final === 'Retirado').length
    return { total, promovidos, repitentes, egresados, retirados }
  }, [alumnosPromocion])

  // Manejador de cambio de profesor jefe en Paso 2
  const handleProfesorJefeChange = (nombreCurso, nuevoDocenteId) => {
    setCursosConfig((prev) =>
      prev.map((c) =>
        c.nombre === nombreCurso
          ? { ...c, profesor_jefe_id: nuevoDocenteId || null }
          : c
      )
    )
  }

  // Manejador de cambio de estado final por estudiante en Paso 3
  const handleCambioEstadoEstudiante = (estudianteId, nuevoEstado) => {
    setAlumnosPromocion((prev) =>
      prev.map((a) => {
        if (a.estudiante_id !== estudianteId) return a

        let nuevoCurso = a.nuevo_curso_nombre
        if (nuevoEstado === 'Egresado' || nuevoEstado === 'Retirado') {
          nuevoCurso = null
        } else if (nuevoEstado === 'Repitente') {
          // Si repite, se queda en el mismo curso o nivel anterior
          nuevoCurso = a.curso_anterior_nombre
        } else if (nuevoEstado === 'Promovido' && !a.es_egresado_automatico) {
          // Reasigna el curso proyectado por defecto si vuelve a promovido
          nuevoCurso = a.curso_promovido_sugerido || a.curso_anterior_nombre
        }

        return {
          ...a,
          estado_final: nuevoEstado,
          nuevo_curso_nombre: nuevoCurso,
        }
      })
    )
  }

  // Manejador de cambio de curso destino específico (con sincronización bidireccional)
  const handleCambioCursoDestino = (estudianteId, valorDestino) => {
    setAlumnosPromocion((prev) =>
      prev.map((a) => {
        if (a.estudiante_id !== estudianteId) return a

        if (valorDestino === '__EGRESADO__') {
          return {
            ...a,
            estado_final: 'Egresado',
            nuevo_curso_nombre: null,
          }
        }

        if (valorDestino === '__RETIRADO__') {
          return {
            ...a,
            estado_final: 'Retirado',
            nuevo_curso_nombre: null,
          }
        }

        // Si seleccionó un curso regular, se actualiza el nombre y se asegura estado compatible
        const estadoFinalActualizado =
          a.estado_final === 'Egresado' || a.estado_final === 'Retirado'
            ? 'Promovido'
            : a.estado_final

        return {
          ...a,
          estado_final: estadoFinalActualizado,
          nuevo_curso_nombre: valorDestino,
        }
      })
    )
  }

  // Acción masiva para marcar todos los alumnos del curso activo como Egresados
  const handleMarcarTodosEgresados = (cursoNombre) => {
    setAlumnosPromocion((prev) =>
      prev.map((a) => {
        if (cursoNombre !== 'ALL' && a.curso_anterior_nombre !== cursoNombre) return a
        return {
          ...a,
          estado_final: 'Egresado',
          nuevo_curso_nombre: null,
        }
      })
    )
    toast.success(`Estudiantes de ${cursoNombre} marcados como Egresados`)
  }

  // Acción masiva para marcar todos los alumnos del curso activo como Promovidos
  const handleMarcarTodosPromovidos = (cursoNombre) => {
    setAlumnosPromocion((prev) =>
      prev.map((a) => {
        if (cursoNombre !== 'ALL' && a.curso_anterior_nombre !== cursoNombre) return a
        return {
          ...a,
          estado_final: 'Promovido',
          nuevo_curso_nombre: a.curso_promovido_sugerido || a.curso_anterior_nombre,
        }
      })
    )
    toast.success(`Estudiantes de ${cursoNombre} marcados como Promovidos`)
  }

  // Ejecución final del cierre y promoción
  const handleConfirmarCierre = async () => {
    try {
      setSaving(true)
      setModalConfirmacion(false)

      const payload = {
        periodo_anterior_id: periodoActual?.id || null,
        nuevo_anio: Number(nuevoAnio),
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        cursos_config: cursosConfig.map((c) => ({
          nombre: c.nombre,
          nivel: c.nivel,
          letra: c.letra,
          profesor_jefe_id: c.profesor_jefe_id || null,
        })),
        promociones: alumnosPromocion.map((a) => ({
          estudiante_id: a.estudiante_id,
          curso_anterior_id: a.curso_anterior_id || null,
          estado_final: a.estado_final,
          nuevo_curso_nombre: a.nuevo_curso_nombre || null,
        })),
      }

      const res = await ejecutarCierreYPromocion(payload)
      toast.success('Año escolar cerrado y cursos promovidos exitosamente')
      navigate('/dashboard')
    } catch (err) {
      console.error('Error al ejecutar cierre:', err)
      toast.error(err.response?.data?.message || 'Error al ejecutar el cierre de año')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
          <div className="text-center">
            <RefreshCw className="mx-auto h-12 w-12 animate-spin text-blue-600 dark:text-blue-400" />
            <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-300">
              Cargando asistente de cierre de año...
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
          <div className="rounded-xl bg-red-50 dark:bg-red-950/40 p-6 text-center max-w-md border border-red-200 dark:border-red-800">
            <AlertTriangle className="mx-auto h-10 w-10 text-red-600 dark:text-red-400 mb-2" />
            <p className="text-sm font-semibold text-red-800 dark:text-red-200">{error}</p>
            <button
              onClick={cargarDatosIniciales}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
            >
              Reintentar
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <Breadcrumbs items={[{ label: 'Cierre de Año y Promoción' }]} />

        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl text-white shadow-md shadow-indigo-500/20">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Cierre de Año y Promoción
              </h1>
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Transición de cursos, promoción de estudiantes y egreso de 8° Básico.
            </p>
          </div>
        </div>

        {/* Barra de progreso de pasos (Stepper) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { num: 1, label: 'Nuevo Período', desc: 'Año y fechas oficiales' },
            { num: 2, label: 'Cursos y Jefaturas', desc: 'Clonación sugerida' },
            { num: 3, label: 'Nómina de Alumnos', desc: 'Promoción y egresos' },
            { num: 4, label: 'Confirmación', desc: 'Resumen y ejecución' },
          ].map((s) => {
            const activo = paso === s.num
            const completado = paso > s.num
            return (
              <div
                key={s.num}
                onClick={() => paso > s.num && setPaso(s.num)}
                className={`p-3.5 rounded-xl border transition cursor-pointer ${
                  activo
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 dark:border-blue-500 shadow-sm'
                    : completado
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      activo
                        ? 'bg-blue-600 text-white'
                        : completado
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {completado ? '✓' : s.num}
                  </span>
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">
                    {s.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.desc}</p>
              </div>
            )
          })}
        </div>

        {/* CONTENIDO DEL PASO 1: NUEVO PERÍODO */}
        {paso === 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Configuración del Nuevo Período Académico
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Verifica el año a cerrar y define el calendario del nuevo ciclo lectivo para la Escuela El Salvador.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Período que finaliza
                </span>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  Año Lectivo {periodoActual?.anio || 'Vigente'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Este año se marcará como cerrado y su historial quedará inmutable.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nuevo Año Lectivo
                  </label>
                  <input
                    type="number"
                    value={nuevoAnio}
                    onChange={(e) => setNuevoAnio(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha Término
                    </label>
                    <input
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Ciclo educativo del establecimiento */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
                    Ciclo Educativo y Nivel Terminal
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTipoEstablecimiento('BASICA')
                        cargarDatosIniciales('BASICA')
                      }}
                      className={`p-3 text-left rounded-xl border transition ${
                        tipoEstablecimiento === 'BASICA'
                          ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 shadow-sm'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">Solo enseñanza básica</span>
                        {tipoEstablecimiento === 'BASICA' && (
                          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        8° Básico egresa automáticamente al archivo histórico.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTipoEstablecimiento('MEDIA')
                        cargarDatosIniciales('MEDIA')
                      }}
                      className={`p-3 text-left rounded-xl border transition ${
                        tipoEstablecimiento === 'MEDIA'
                          ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-sm'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">Enseñanza media</span>
                        {tipoEstablecimiento === 'MEDIA' && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        8° Básico se promueve a 1° Medio. Egresan en 4° Medio.
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setPaso(2)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
              >
                Siguiente: Cursos y Jefaturas
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* CONTENIDO DEL PASO 2: CURSOS Y JEFATURAS SUGERIDAS */}
        {paso === 2 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Cursos Proyectados y Profesores Jefes
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Se clonaron las jefaturas de curso del año anterior como sugerencia. Puedes mantenerlas o reasignarlas.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-600 dark:text-gray-300 font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">Curso {nuevoAnio}</th>
                    <th className="px-4 py-3 text-left">Nivel</th>
                    <th className="px-4 py-3 text-left">Letra</th>
                    <th className="px-4 py-3 text-left">Profesor Jefe Sugerido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  {cursosConfig.map((c) => {
                    const docenteSeleccionado = docentesDisponibles.find((d) => d.id === c.profesor_jefe_id)
                    const docentesFiltrados = docentesDisponibles.filter((d) => !d.rol || d.rol === 'Docente')

                    return (
                      <tr key={c.nombre} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                        <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                          {c.nombre}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{c.nivel}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{c.letra}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {docenteSeleccionado ? (
                              docenteSeleccionado.avatar_url ? (
                                <img
                                  src={docenteSeleccionado.avatar_url}
                                  alt={`${docenteSeleccionado.nombre} ${docenteSeleccionado.apellido}`}
                                  className="w-7 h-7 rounded-full object-cover border border-gray-200 dark:border-gray-600 shrink-0"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold shrink-0 border border-blue-200 dark:border-blue-700">
                                  {docenteSeleccionado.nombre?.[0] || 'D'}
                                  {docenteSeleccionado.apellido?.[0] || ''}
                                </div>
                              )
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 flex items-center justify-center text-[10px] shrink-0 border border-gray-200 dark:border-gray-600">
                                ?
                              </div>
                            )}

                            <select
                              value={c.profesor_jefe_id || ''}
                              onChange={(e) => handleProfesorJefeChange(c.nombre, e.target.value)}
                              className="w-full max-w-xs px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              <option value="">-- Sin asignar temporalmente --</option>
                              {docentesFiltrados.map((doc) => (
                                <option key={doc.id} value={doc.id}>
                                  {doc.nombre} {doc.apellido}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setPaso(1)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Atrás
              </button>
              <button
                onClick={() => setPaso(3)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
              >
                Siguiente: Nómina de Alumnos
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* CONTENIDO DEL PASO 3: NÓMINA DE ALUMNOS Y PROMOCIÓN */}
        {paso === 3 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Asistente de Promoción Automática
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Los alumnos suben un nivel por defecto. 8° Básico egresa automáticamente. Ajusta repitentes o cambios de letra.
                </p>
              </div>

              {/* Buscador de alumnos */}
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Buscar alumno o RUT..."
                  value={busquedaAlumno}
                  onChange={(e) => setBusquedaAlumno(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Pestañas de cursos de origen y acciones rápidas */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => setCursoFiltroTab('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    cursoFiltroTab === 'ALL'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  Todos ({alumnosPromocion.length})
                </button>
                {cursosOrigenUnicos.map((cursoNom) => {
                  const count = alumnosPromocion.filter((a) => a.curso_anterior_nombre === cursoNom).length
                  return (
                    <button
                      key={cursoNom}
                      onClick={() => setCursoFiltroTab(cursoNom)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                        cursoFiltroTab === cursoNom
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {cursoNom} ({count})
                    </button>
                  )
                })}
              </div>

              {/* Acciones rápidas para el curso seleccionado */}
              {cursoFiltroTab !== 'ALL' && (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-gray-500 hidden md:inline">Acción masiva:</span>
                  <button
                    type="button"
                    onClick={() => handleMarcarTodosEgresados(cursoFiltroTab)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition flex items-center gap-1"
                    title={`Marcar a todos los alumnos de ${cursoFiltroTab} como Egresados`}
                  >
                    🎓 Marcar todo {cursoFiltroTab} como Egresados
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarcarTodosPromovidos(cursoFiltroTab)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition flex items-center gap-1"
                    title={`Restaurar a todos los alumnos de ${cursoFiltroTab} como Promovidos`}
                  >
                    ↑ Promover todo {cursoFiltroTab}
                  </button>
                </div>
              )}
            </div>

            {/* Tabla de alumnos */}
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 max-h-[500px]">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-xs">
                <thead className="bg-gray-50 dark:bg-gray-900/60 sticky top-0 z-10 text-gray-600 dark:text-gray-300 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3 text-left">Estudiante</th>
                    <th className="px-4 py-3 text-left">RUT</th>
                    <th className="px-4 py-3 text-left">Curso {periodoActual?.anio || 'Actual'}</th>
                    <th className="px-4 py-3 text-left">Estado Final Propuesto</th>
                    <th className="px-4 py-3 text-left">Destino {nuevoAnio}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  {alumnosFiltrados.map((a) => {
                    const esEgresado = a.estado_final === 'Egresado'
                    const esRetirado = a.estado_final === 'Retirado'
                    const esRepitente = a.estado_final === 'Repitente'

                    return (
                      <tr key={a.estudiante_id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                        <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white">
                          {a.apellido}, {a.nombre}
                          {a.es_pie && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold">
                              PIE
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 font-mono">
                          {a.rut}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">
                          {a.curso_anterior_nombre}
                        </td>
                        <td className="px-4 py-2.5">
                          <select
                            value={a.estado_final}
                            onChange={(e) =>
                              handleCambioEstadoEstudiante(a.estudiante_id, e.target.value)
                            }
                            className={`px-2 py-1 rounded-md text-xs font-semibold border ${
                              esEgresado
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                                : esRetirado
                                ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                : esRepitente
                                ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                : 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            }`}
                          >
                            <option value="Promovido">Promovido al nivel superior</option>
                            <option value="Repitente">Repite (mismo nivel)</option>
                            <option value="Egresado">Egresado (Término de ciclo)</option>
                            <option value="Retirado">Retirado del establecimiento</option>
                          </select>
                        </td>
                        <td className="px-4 py-2.5">
                          <select
                            value={
                              esEgresado
                                ? '__EGRESADO__'
                                : esRetirado
                                ? '__RETIRADO__'
                                : a.nuevo_curso_nombre || ''
                            }
                            onChange={(e) =>
                              handleCambioCursoDestino(a.estudiante_id, e.target.value)
                            }
                            className={`px-2 py-1 text-xs rounded border ${
                              esEgresado
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold dark:bg-indigo-950/60 dark:text-indigo-300'
                                : esRetirado
                                ? 'bg-amber-50 border-amber-300 text-amber-700 font-semibold dark:bg-amber-950/60 dark:text-amber-300'
                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                            }`}
                          >
                            <optgroup label="Resoluciones Especiales">
                              <option value="__EGRESADO__">🎓 Archivo Egresado (Término de ciclo)</option>
                              <option value="__RETIRADO__">📁 Archivo Retirado del colegio</option>
                            </optgroup>
                            <optgroup label="Cursos Regulares Proyectados">
                              {cursosConfig.map((c) => (
                                <option key={c.nombre} value={c.nombre}>
                                  {c.nombre}
                                </option>
                              ))}
                            </optgroup>
                          </select>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setPaso(2)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Atrás
              </button>
              <button
                onClick={() => setPaso(4)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
              >
                Siguiente: Resumen y Confirmación
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* CONTENIDO DEL PASO 4: RESUMEN Y CONFIRMACIÓN TRANSACCIONAL */}
        {paso === 4 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Auditoría y Confirmación de Transición
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Revisa el balance global antes de aplicar los cambios en la base de datos de la escuela.
              </p>
            </div>

            {/* KPIs del impacto */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-xs text-slate-500 font-semibold uppercase">Total Nómina</span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {metricas.total}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                <span className="text-xs text-emerald-600 font-semibold uppercase">Promovidos</span>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                  {metricas.promovidos}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center">
                <span className="text-xs text-rose-600 font-semibold uppercase">Repitentes</span>
                <p className="text-2xl font-bold text-rose-700 dark:text-rose-300 mt-1">
                  {metricas.repitentes}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-center">
                <span className="text-xs text-indigo-600 font-semibold uppercase">Egresados</span>
                <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 mt-1">
                  {metricas.egresados}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
                <span className="text-xs text-amber-600 font-semibold uppercase">Retirados</span>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">
                  {metricas.retirados}
                </p>
              </div>
            </div>

            {/* Banner de consideraciones normativas Supereduc */}
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                Garantías de Transición Segura e Inmutabilidad Normativa:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-blue-800 dark:text-blue-300">
                <li>El período lectivo {periodoActual?.anio} quedará cerrado y archivado formalmente.</li>
                <li>Los estudiantes egresados y retirados mantendrán su ficha, incidentes y protocolos RICE intactos para responder a fiscalizaciones.</li>
                <li>Se creará una nueva matrícula en el año {nuevoAnio} para todos los alumnos promovidos y repitentes.</li>
                <li>Esta operación es atómica: se ejecuta en una sola transacción en la base de datos.</li>
              </ul>
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setPaso(3)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Atrás
              </button>
              <button
                onClick={() => setModalConfirmacion(true)}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/30 disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5" />
                {saving ? 'Ejecutando Transacción...' : 'Confirmar Cierre y Promover Cursos'}
              </button>
            </div>
          </div>
        )}

        {/* MODAL DE CONFIRMACIÓN SEGURA */}
        {modalConfirmacion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-8 h-8" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  ¿Confirmar Cierre del Año Lectivo?
                </h3>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300">
                Estás a punto de cerrar el período {periodoActual?.anio || 'actual'}, aperturar el año <strong>{nuevoAnio}</strong> y reasignar los cursos de <strong>{metricas.total} estudiantes</strong>.
              </p>

              <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl text-xs space-y-1">
                <p>• Promovidos: <strong>{metricas.promovidos}</strong></p>
                <p>• Repitentes: <strong>{metricas.repitentes}</strong></p>
                <p>• Egresados a archivar: <strong>{metricas.egresados}</strong></p>
                <p>• Retirados a archivar: <strong>{metricas.retirados}</strong></p>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  onClick={() => setModalConfirmacion(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmarCierre}
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-md disabled:opacity-50"
                >
                  {saving ? 'Procesando...' : 'Sí, Ejecutar Ahora'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
