import { useState, useEffect } from 'react'
import api from '@/services/api'
import toast from 'react-hot-toast'

const ESTADOS = {
  Presente: { icon: '✓', color: 'bg-green-500', label: 'Presente' },
  Ausente: { icon: '✗', color: 'bg-red-500', label: 'Ausente' },
  Atrasado: { icon: '⏰', color: 'bg-yellow-500', label: 'Atrasado' }
}

export default function AsistenciaChecklist({ curso, fecha, onGuardar, onCancelar }) {
  const [estudiantes, setEstudiantes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAsistencia()
  }, [curso.id, fecha])

  const fetchAsistencia = async () => {
    try {
      const response = await api.get(`/asistencia/curso/${curso.id}/fecha/${fecha}`)
      setEstudiantes(response.data.data)
    } catch (error) {
      toast.error('Error cargando asistencia')
    } finally {
      setLoading(false)
    }
  }

  const handleEstadoChange = (estudianteId, nuevoEstado) => {
    setEstudiantes(prev =>
      prev.map(est =>
        est.estudianteId === estudianteId
          ? { ...est, estado: nuevoEstado }
          : est
      )
    )
  }

  const handleMarcarTodos = (estado) => {
    setEstudiantes(prev => prev.map(est => ({ ...est, estado })))
  }

  const handleGuardar = () => {
    const asistencias = estudiantes.map(est => ({
      estudianteId: est.estudianteId,
      estado: est.estado || 'Presente' // Default a Presente si no se marcó
    }))

    onGuardar(asistencias)
  }

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{curso.nombre}</h2>
          <p className="text-gray-600 dark:text-gray-400">{fecha}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleMarcarTodos('Presente')}
            data-testid="marcar-todos-presente"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Marcar todos Presente
          </button>
          <button
            onClick={onCancelar}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancelar
          </button>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        {estudiantes.map((estudiante) => (
          <div
            key={estudiante.estudianteId}
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <span className="text-gray-900 dark:text-white font-medium">
              {estudiante.apellido}, {estudiante.nombre}
            </span>

            <div className="flex gap-2">
              {Object.entries(ESTADOS).map(([estado, config]) => (
                <button
                  key={estado}
                  data-testid={`estudiante-${estudiante.estudianteId}-${estado.toLowerCase()}`}
                  onClick={() => handleEstadoChange(estudiante.estudianteId, estado)}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all
                    ${estudiante.estado === estado ? config.color : 'bg-gray-300 dark:bg-gray-600'}
                    hover:scale-110
                  `}
                  title={config.label}
                >
                  {config.icon}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleGuardar}
        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
      >
        Guardar Asistencia
      </button>
    </div>
  )
}
