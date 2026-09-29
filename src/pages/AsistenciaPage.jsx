import { useState, useEffect } from 'react'
import { useAuth } from '@/store/useAuthStore'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Breadcrumbs from '@/components/shared/Breadcrumbs'
import AsistenciaChecklist from '@/components/asistencia/AsistenciaChecklist'
import AlertasAusentismoWidget from '@/components/asistencia/AlertasAusentismoWidget'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { ArrowUpRight, CalendarDays, ClipboardCheck, GraduationCap } from 'lucide-react'

const getTodayLocal = () => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function AsistenciaPage() {
  const { user } = useAuth()
  const [cursos, setCursos] = useState([])
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null)
  const [fecha, setFecha] = useState(getTodayLocal())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCursos()
  }, [])

  const fetchCursos = async () => {
    try {
      setLoading(true)
      const response = await api.get('/cursos')
      setCursos(response.data?.data || [])
    } catch (error) {
      toast.error('Error cargando cursos')
      console.error('Error fetching cursos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCursoClick = (curso) => {
    setCursoSeleccionado(curso)
  }

  const handleGuardarAsistencia = async (asistencias) => {
    try {
      await api.post('/asistencia/registrar', {
        cursoId: cursoSeleccionado.id,
        fecha,
        asistencias,
      })

      toast.success('Asistencia registrada correctamente')
      setCursoSeleccionado(null)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al registrar asistencia')
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <Breadcrumbs items={[{ label: 'Asistencia Escolar' }]} />

        <div className="mb-6 flex items-center gap-4">
          <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"><ClipboardCheck size={26} /></span>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Asistencia Escolar</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Registro diario de asistencia por curso</p>
          </div>
        </div>

        {/* Alertas Widget - solo visible para roles autorizados */}
        {['Administrador', 'Directivo', 'Inspector'].includes(user?.rol) && (
          <div className="mb-5">
            <AlertasAusentismoWidget />
          </div>
        )}

        {/* Selector de fecha */}
        <div className="mb-7 flex flex-col gap-3 rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50 to-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 dark:border-cyan-900 dark:from-cyan-950/40 dark:to-gray-800">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-cyan-700 shadow-sm dark:bg-gray-700 dark:text-cyan-300"><CalendarDays size={20} /></span>
            <div>
              <label htmlFor="fecha" className="block text-sm font-bold text-gray-900 dark:text-white">Fecha de registro</label>
              <p className="text-xs text-gray-600 dark:text-gray-300">Selecciona el día antes de abrir un curso</p>
            </div>
          </div>
          <input
            type="date"
            id="fecha"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full rounded-xl border border-cyan-200 bg-white px-4 py-2.5 font-semibold text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 sm:w-auto dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Lista de cursos */}
        {!cursoSeleccionado ? (
          cursos.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
              <p className="text-gray-500 dark:text-gray-300">No hay cursos registrados para este establecimiento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {cursos.map((curso, index) => {
                const estilo = [
                  { barra: 'from-orange-400 via-orange-500 to-rose-500', fondo: 'from-orange-50 to-rose-50 dark:from-orange-950/70 dark:to-gray-800', texto: 'text-orange-700 dark:text-orange-300', icono: 'bg-orange-500', borde: 'hover:border-orange-300 dark:hover:border-orange-500' },
                  { barra: 'from-fuchsia-500 via-pink-500 to-rose-500', fondo: 'from-fuchsia-50 to-pink-50 dark:from-fuchsia-950/70 dark:to-gray-800', texto: 'text-fuchsia-700 dark:text-fuchsia-300', icono: 'bg-fuchsia-600', borde: 'hover:border-fuchsia-300 dark:hover:border-fuchsia-500' },
                  { barra: 'from-sky-400 via-cyan-500 to-teal-400', fondo: 'from-sky-50 to-cyan-50 dark:from-sky-950/70 dark:to-gray-800', texto: 'text-sky-700 dark:text-sky-300', icono: 'bg-sky-500', borde: 'hover:border-sky-300 dark:hover:border-sky-500' },
                ][index % 3]
                return (
                  <button
                    type="button"
                    key={curso.id}
                    onClick={() => handleCursoClick(curso)}
                    className={`group overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-md shadow-gray-200/60 transition duration-200 hover:-translate-y-1 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-600 dark:border-gray-700 dark:bg-gray-800 dark:shadow-black/20 ${estilo.borde}`}
                  >
                    <span aria-hidden="true" className={`block h-2 bg-gradient-to-r ${estilo.barra}`} />
                    <span className={`block bg-gradient-to-br p-5 sm:p-6 ${estilo.fondo}`}>
                      <span className="flex items-start justify-between gap-3">
                        <span className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${estilo.texto}`}>{curso.nombre}</span>
                        <span aria-hidden="true" className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md ${estilo.icono}`}><GraduationCap size={23} /></span>
                      </span>
                      <span className="mt-5 block text-sm font-semibold text-gray-600 dark:text-gray-300">{curso.nivel || 'Educación General'}</span>
                    </span>
                    <span className={`flex items-center justify-between px-5 py-4 text-sm font-bold sm:px-6 ${estilo.texto}`}>
                      <span>Registrar asistencia</span><ArrowUpRight size={18} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </button>
                )
              })}
            </div>
          )
        ) : (
          <AsistenciaChecklist
            curso={cursoSeleccionado}
            fecha={fecha}
            onGuardar={handleGuardarAsistencia}
            onCancelar={() => setCursoSeleccionado(null)}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
