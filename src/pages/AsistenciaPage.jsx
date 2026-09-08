import { useState, useEffect } from 'react'
import { useAuth } from '@/store/useAuthStore'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Breadcrumbs from '@/components/shared/Breadcrumbs'
import AsistenciaChecklist from '@/components/asistencia/AsistenciaChecklist'
import AlertasAusentismoWidget from '@/components/asistencia/AlertasAusentismoWidget'
import api from '@/services/api'
import toast from 'react-hot-toast'

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
      <div className="p-6 max-w-7xl mx-auto">
        <Breadcrumbs items={[{ label: 'Asistencia Escolar' }]} />

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Asistencia Escolar</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Registro diario de asistencia por curso</p>
        </div>

        {/* Alertas Widget - solo visible para roles autorizados */}
        {['Administrador', 'Directivo', 'Inspector'].includes(user?.rol) && (
          <div className="mb-6">
            <AlertasAusentismoWidget />
          </div>
        )}

        {/* Selector de fecha */}
        <div className="mb-6">
          <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Fecha de Registro
          </label>
          <input
            type="date"
            id="fecha"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Lista de cursos */}
        {!cursoSeleccionado ? (
          cursos.length === 0 ? (
            <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <p className="text-gray-500">No hay cursos registrados para este establecimiento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cursos.map((curso) => (
                <button
                  key={curso.id}
                  onClick={() => handleCursoClick(curso)}
                  className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700 text-left"
                >
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {curso.nombre}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {curso.nivel || 'Educación General'}
                  </p>
                </button>
              ))}
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
