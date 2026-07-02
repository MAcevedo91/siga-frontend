import { useState, useEffect } from 'react'
import { useAuth } from '@/store/useAuthStore'
import AsistenciaChecklist from '@/components/asistencia/AsistenciaChecklist'
import AlertasAusentismoWidget from '@/components/asistencia/AlertasAusentismoWidget'
import api from '@/services/api'
import toast from 'react-hot-toast'

export default function AsistenciaPage() {
  const { user } = useAuth()
  const [cursos, setCursos] = useState([])
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null)
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCursos()
  }, [])

  const fetchCursos = async () => {
    try {
      const response = await api.get('/cursos')
      setCursos(response.data.data)
    } catch (error) {
      toast.error('Error cargando cursos')
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
        asistencias
      })

      toast.success('Asistencia registrada correctamente')
      setCursoSeleccionado(null)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al registrar asistencia')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Asistencia Escolar</h1>
        <p className="text-gray-600 dark:text-gray-400">Registro diario de asistencia por curso</p>
      </div>

      {/* Alertas Widget - solo visible para roles autorizados */}
      {['Administrador', 'Directivo', 'Inspector'].includes(user.rol) && (
        <AlertasAusentismoWidget />
      )}

      {/* Selector de fecha */}
      <div className="mb-6">
        <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Fecha
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cursos.map((curso) => (
            <button
              key={curso.id}
              onClick={() => handleCursoClick(curso)}
              className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {curso.nombre}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {curso.estudiantes_count || 0} estudiantes
              </p>
            </button>
          ))}
        </div>
      ) : (
        <AsistenciaChecklist
          curso={cursoSeleccionado}
          fecha={fecha}
          onGuardar={handleGuardarAsistencia}
          onCancelar={() => setCursoSeleccionado(null)}
        />
      )}
    </div>
  )
}
