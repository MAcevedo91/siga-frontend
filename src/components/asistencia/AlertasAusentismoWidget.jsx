import { useState, useEffect } from 'react'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { CircleCheck, TriangleAlert } from 'lucide-react'

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
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 shadow-sm dark:border-emerald-800 dark:from-emerald-950/50 dark:to-gray-800">
        <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"><CircleCheck size={22} /></span>
        <p className="font-semibold text-emerald-900 dark:text-emerald-100">No hay estudiantes con ausentismo crítico</p>
      </div>
    )
  }

  return (
    <div>
      <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-4 shadow-sm dark:border-red-800 dark:from-red-950/50 dark:to-gray-800 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500 text-white"><TriangleAlert size={23} /></span>
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
            className="self-start rounded-xl bg-red-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500 sm:self-auto"
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
                  className="flex flex-col gap-2 rounded-xl border border-red-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700 dark:bg-gray-800"
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
