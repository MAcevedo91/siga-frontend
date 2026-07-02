import { useState, useEffect } from 'react'
import api from '@/services/api'
import toast from 'react-hot-toast'

export default function AlertasAusentismoWidget() {
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostrarDetalle, setMostrarDetalle] = useState(false)

  useEffect(() => {
    fetchAlertas()
  }, [])

  const fetchAlertas = async () => {
    try {
      const response = await api.get('/asistencia/alertas')
      setAlertas(response.data.data)
    } catch (error) {
      toast.error('Error cargando alertas de ausentismo')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return null

  if (alertas.length === 0) {
    return (
      <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <p className="text-green-800 dark:text-green-200">
          ✓ No hay estudiantes con ausentismo crítico
        </p>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚨</span>
            <div>
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-200">
                Alerta de Ausentismo
              </h3>
              <p className="text-red-700 dark:text-red-300">
                {alertas.length} estudiante{alertas.length !== 1 ? 's' : ''} con más de 15% de ausencias
              </p>
            </div>
          </div>

          <button
            onClick={() => setMostrarDetalle(!mostrarDetalle)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            {mostrarDetalle ? 'Ocultar' : 'Ver Detalle'}
          </button>
        </div>

        {mostrarDetalle && (
          <div className="mt-4 border-t border-red-200 dark:border-red-800 pt-4">
            <div className="space-y-2" data-testid="alertas-lista">
              {alertas.map((alerta) => (
                <div
                  key={alerta.estudianteId}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded"
                >
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {alerta.apellido}, {alerta.nombre}
                    </span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">({alerta.curso})</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-600 dark:text-red-400">
                      {alerta.porcentajeAsistencia}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {alerta.diasAusente} días ausente
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
