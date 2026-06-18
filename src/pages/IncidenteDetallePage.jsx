import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getIncidenteById, updateEstadoIncidente } from '@/services/incidentesService'
import { useAuth } from '@/store/useAuthStore'

export default function IncidenteDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [incidente, setIncidente] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [updatingEstado, setUpdatingEstado] = useState(false)
  const { user } = useAuth()

  const canEdit = ['Administrador', 'Equipo de Formación'].includes(user?.rol)

  useEffect(() => {
    loadIncidente()
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

  const handleCambiarEstado = async () => {
    if (nuevoEstado === incidente.estado) return

    try {
      setUpdatingEstado(true)
      const updated = await updateEstadoIncidente(id, nuevoEstado)
      setIncidente(updated)
    } catch (err) {
      alert('Error al cambiar estado')
    } finally {
      setUpdatingEstado(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 animate-spin text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="mt-2 text-gray-600">Cargando incidente...</p>
        </div>
      </div>
    )
  }

  if (error || !incidente) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg bg-red-50 p-6 text-center">
          <p className="text-red-800">{error || 'Incidente no encontrado'}</p>
          <button
            onClick={() => navigate('/incidentes')}
            className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Volver a Incidentes
          </button>
        </div>
      </div>
    )
  }

  const getGravedadColor = (gravedad) => {
    const colors = {
      Leve: 'from-yellow-500 to-yellow-700',
      Grave: 'from-orange-500 to-orange-700',
      Gravísima: 'from-red-500 to-red-700',
    }
    return colors[gravedad] || 'from-gray-500 to-gray-700'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => navigate('/incidentes')}
          className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Incidentes
        </button>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className={`bg-gradient-to-r ${getGravedadColor(incidente.gravedad)} px-6 py-8`}>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white">Incidente #{incidente.id}</h1>
                  <p className="mt-1 text-white">
                    {new Date(incidente.fecha).toLocaleDateString('es-CL')}
                  </p>
                </div>
                <span className="rounded-full bg-white/20 px-4 py-2 text-lg font-semibold text-white">
                  {incidente.gravedad}
                </span>
              </div>
            </div>

            <div className="space-y-6 p-6">
              <div>
                <h2 className="mb-2 text-lg font-semibold text-gray-900">Tipo de Abordaje</h2>
                <p className="text-gray-700">{incidente.tipo_abordaje}</p>
              </div>

              <div>
                <h2 className="mb-2 text-lg font-semibold text-gray-900">Relato</h2>
                <p className="whitespace-pre-wrap text-gray-700">{incidente.relato}</p>
              </div>

              {incidente.medidas_adoptadas && (
                <div>
                  <h2 className="mb-2 text-lg font-semibold text-gray-900">Medidas Adoptadas</h2>
                  <p className="whitespace-pre-wrap text-gray-700">{incidente.medidas_adoptadas}</p>
                </div>
              )}

              <div>
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Estudiantes Involucrados</h2>
                <div className="space-y-3">
                  {incidente.estudiantes?.map((est) => (
                    <div key={est.id} className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {est.nombre} {est.apellido}
                          </p>
                          <p className="text-sm text-gray-600">{est.curso}</p>
                          {est.observacion && (
                            <p className="mt-2 text-sm text-gray-700">{est.observacion}</p>
                          )}
                        </div>
                        {est.es_victima && (
                          <span className="ml-4 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                            Víctima
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {canEdit && (
                <div className="border-t pt-6">
                  <h2 className="mb-4 text-lg font-semibold text-gray-900">Cambiar Estado</h2>
                  <div className="flex items-center gap-4">
                    <select
                      value={nuevoEstado}
                      onChange={(e) => setNuevoEstado(e.target.value)}
                      className="block flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="En Investigación">En Investigación</option>
                      <option value="Derivado">Derivado</option>
                      <option value="Cerrado">Cerrado</option>
                    </select>
                    <button
                      onClick={handleCambiarEstado}
                      disabled={nuevoEstado === incidente.estado || updatingEstado}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {updatingEstado ? 'Actualizando...' : 'Actualizar Estado'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
