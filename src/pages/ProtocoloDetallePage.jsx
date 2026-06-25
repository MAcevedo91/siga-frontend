import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProtocoloById, avanzarEstadoProtocolo } from '@/services/protocolosService'
import { useAuth } from '@/store/useAuthStore'

const ESTADOS = ['En Investigación', 'Derivado', 'Cerrado']

export default function ProtocoloDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [protocolo, setProtocolo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAvanzarForm, setShowAvanzarForm] = useState(false)
  const [observacion, setObservacion] = useState('')
  const [updatingEstado, setUpdatingEstado] = useState(false)
  const { user } = useAuth()

  const canEdit = ['Administrador', 'Equipo de Formación'].includes(user?.rol)

  useEffect(() => {
    loadProtocolo()
  }, [id])

  const loadProtocolo = async () => {
    try {
      setLoading(true)
      const data = await getProtocoloById(id)
      setProtocolo(data)
    } catch (err) {
      setError('Error al cargar protocolo')
    } finally {
      setLoading(false)
    }
  }

  const handleAvanzarEstado = async () => {
    if (!observacion.trim()) {
      alert('La observación es obligatoria para avanzar el estado')
      return
    }

    const estadoActualIndex = ESTADOS.indexOf(protocolo.estado)
    if (estadoActualIndex === ESTADOS.length - 1) {
      alert('El protocolo ya está en el estado final')
      return
    }

    const nuevoEstado = ESTADOS[estadoActualIndex + 1]

    try {
      setUpdatingEstado(true)
      const updated = await avanzarEstadoProtocolo(id, nuevoEstado, observacion)
      setProtocolo(updated)
      setObservacion('')
      setShowAvanzarForm(false)
    } catch (err) {
      alert('Error al avanzar estado')
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
          <p className="mt-2 text-gray-600">Cargando protocolo...</p>
        </div>
      </div>
    )
  }

  if (error || !protocolo) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg bg-red-50 p-6 text-center">
          <p className="text-red-800">{error || 'Protocolo no encontrado'}</p>
          <button
            onClick={() => navigate('/protocolos')}
            className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Volver a Protocolos
          </button>
        </div>
      </div>
    )
  }

  const estadoActualIndex = ESTADOS.indexOf(protocolo.estado)
  const puedeAvanzar = canEdit && estadoActualIndex < ESTADOS.length - 1

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => navigate('/protocolos')}
          className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Protocolos
        </button>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 px-6 py-8">
              <h1 className="text-3xl font-bold text-white">Protocolo RICE #{protocolo.id}</h1>
              <p className="mt-1 text-purple-100">{protocolo.tipo_protocolo}</p>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <h2 className="mb-2 text-sm font-medium text-gray-500">Estudiante</h2>
                  <p className="text-lg font-semibold text-gray-900">
                    {protocolo.estudiante?.nombre} {protocolo.estudiante?.apellido}
                  </p>
                  <p className="text-sm text-gray-600">{protocolo.estudiante?.curso}</p>
                </div>

                <div>
                  <h2 className="mb-2 text-sm font-medium text-gray-500">Fecha de Apertura</h2>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(protocolo.fecha_apertura).toLocaleDateString('es-CL')}
                  </p>
                </div>
              </div>

              {protocolo.incidente && (
                <div>
                  <h2 className="mb-2 text-sm font-medium text-gray-500">Incidente Relacionado</h2>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-900">
                      {new Date(protocolo.incidente.fecha).toLocaleDateString('es-CL')} - {protocolo.incidente.tipo_abordaje}
                    </p>
                    <span className="mt-2 inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
                      {protocolo.incidente.gravedad}
                    </span>
                  </div>
                </div>
              )}

              {protocolo.observaciones && (
                <div>
                  <h2 className="mb-2 text-sm font-medium text-gray-500">Observaciones Iniciales</h2>
                  <p className="whitespace-pre-wrap text-gray-700">{protocolo.observaciones}</p>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Línea de Tiempo del Estado</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                {ESTADOS.map((estado, index) => (
                  <div key={estado} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full ${
                          index <= estadoActualIndex
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {index < estadoActualIndex ? (
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-sm font-semibold">{index + 1}</span>
                        )}
                      </div>
                      <p
                        className={`mt-2 text-center text-xs font-medium ${
                          index <= estadoActualIndex ? 'text-gray-900' : 'text-gray-500'
                        }`}
                      >
                        {estado}
                      </p>
                    </div>
                    {index < ESTADOS.length - 1 && (
                      <div
                        className={`h-1 flex-1 ${
                          index < estadoActualIndex ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {puedeAvanzar && (
            <div className="overflow-hidden rounded-lg bg-white shadow">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">Avanzar Estado</h2>
              </div>
              <div className="p-6">
                {!showAvanzarForm ? (
                  <button
                    onClick={() => setShowAvanzarForm(true)}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Avanzar a "{ESTADOS[estadoActualIndex + 1]}"
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="observacion" className="block text-sm font-medium text-gray-700">
                        Observación <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="observacion"
                        value={observacion}
                        onChange={(e) => setObservacion(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Describe las acciones realizadas y motivo del cambio de estado..."
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => {
                          setShowAvanzarForm(false)
                          setObservacion('')
                        }}
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        disabled={updatingEstado}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleAvanzarEstado}
                        disabled={updatingEstado || !observacion.trim()}
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {updatingEstado ? 'Actualizando...' : 'Confirmar Avance'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
