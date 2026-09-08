import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { createProtocolo, getTiposProtocolo, getIncidentesByEstudiante } from '@/services/protocolosService'
import { getAntecedentesEscalada } from '@/services/estudiantesService'
import SelectorEstudianteCascada from '@/components/shared/SelectorEstudianteCascada'
import AlertaEscaladaBanner from '@/components/shared/AlertaEscaladaBanner'
import { formatDate } from '@/utils/formatDate'

export default function NuevoProtocoloPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tiposProtocolo, setTiposProtocolo] = useState([])
  const [selectedEstudiante, setSelectedEstudiante] = useState(null)
  const [alertaEscalada, setAlertaEscalada] = useState(null)
  const [incidentesRelacionados, setIncidentesRelacionados] = useState([])
  const [loadingIncidentes, setLoadingIncidentes] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm()

  useEffect(() => {
    loadTiposProtocolo()
  }, [])

  useEffect(() => {
    if (selectedEstudiante) {
      loadIncidentesEstudiante()
    }
  }, [selectedEstudiante])

  const loadTiposProtocolo = async () => {
    try {
      const data = await getTiposProtocolo()
      setTiposProtocolo(data)
    } catch (err) {
      setError('Error al cargar tipos de protocolo')
    }
  }

  const handleSelectEstudiante = async (estudiante) => {
    setSelectedEstudiante(estudiante)
    try {
      const diag = await getAntecedentesEscalada(estudiante.id)
      setAlertaEscalada(diag)
    } catch (err) {
      console.error('Error al consultar antecedentes:', err)
      setAlertaEscalada(null)
    }
  }

  const loadIncidentesEstudiante = async () => {
    try {
      setLoadingIncidentes(true)
      const data = await getIncidentesByEstudiante(selectedEstudiante.id)
      setIncidentesRelacionados(data)
    } catch (err) {
      console.error('Error cargando incidentes', err)
      setIncidentesRelacionados([])
    } finally {
      setLoadingIncidentes(false)
    }
  }


  const onSubmit = async (data) => {
    if (!selectedEstudiante) {
      setError('Debes seleccionar un estudiante')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const payload = {
        tipo_protocolo_id: Number(data.tipo_protocolo_id),
        estudiante_id: selectedEstudiante.id,
        incidente_id: data.incidente_id || null,
        fecha_apertura: data.fecha_apertura,
        observaciones: data.observaciones,
      }

      await createProtocolo(payload)
      navigate('/protocolos')
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear protocolo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => navigate('/protocolos')}
          className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Protocolos
        </button>

        <div className="rounded-lg bg-white p-6 shadow">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">Nuevo Protocolo RICE</h1>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {alertaEscalada?.tiene_alerta && (
              <AlertaEscaladaBanner diagnostico={alertaEscalada} />
            )}

            <div>
              <label htmlFor="tipo_protocolo_id" className="block text-sm font-medium text-gray-700">
                Tipo de Protocolo <span className="text-red-500">*</span>
              </label>
              <select
                id="tipo_protocolo_id"
                {...register('tipo_protocolo_id', { required: 'El tipo de protocolo es obligatorio' })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Seleccionar tipo</option>
                {tiposProtocolo.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </option>
                ))}
              </select>
              {errors.tipo_protocolo_id && (
                <p className="mt-1 text-xs text-red-600">{errors.tipo_protocolo_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Estudiante <span className="text-red-500">*</span>
              </label>
              {selectedEstudiante ? (
                <div className="mt-1 flex items-center justify-between rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/20 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold flex items-center justify-center shadow-sm">
                      {selectedEstudiante.apellido?.[0] || selectedEstudiante.nombre?.[0] || 'E'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {selectedEstudiante.nombre} {selectedEstudiante.apellido}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        RUT: {selectedEstudiante.rut || 'Sin RUT'} {selectedEstudiante.es_pie && '• Programa PIE'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEstudiante(null)
                      setAlertaEscalada(null)
                      setIncidentesRelacionados([])
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition border border-red-200 dark:border-red-900/60"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Cambiar Estudiante</span>
                  </button>
                </div>
              ) : (
                <SelectorEstudianteCascada onSelectEstudiante={handleSelectEstudiante} />
              )}
            </div>

            {selectedEstudiante && (
              <div>
                <label htmlFor="incidente_id" className="block text-sm font-medium text-gray-700">
                  Incidente Relacionado (opcional)
                </label>
                {loadingIncidentes ? (
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Cargando incidentes...
                  </div>
                ) : (
                  <select
                    id="incidente_id"
                    {...register('incidente_id')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Sin incidente relacionado</option>
                    {incidentesRelacionados.map((inc) => (
                      <option key={inc.id} value={inc.id}>
                        {formatDate(inc.fecha)} - {inc.tipo_abordaje} ({inc.gravedad})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div>
              <label htmlFor="fecha_apertura" className="block text-sm font-medium text-gray-700">
                Fecha de Apertura <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="fecha_apertura"
                {...register('fecha_apertura', { required: 'La fecha es obligatoria' })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.fecha_apertura && (
                <p className="mt-1 text-xs text-red-600">{errors.fecha_apertura.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700">
                Observaciones Iniciales
              </label>
              <textarea
                id="observaciones"
                {...register('observaciones')}
                rows={4}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Detalles del caso, contexto, situación inicial..."
              />
            </div>

            <div className="flex justify-end gap-3 border-t pt-6">
              <button
                type="button"
                onClick={() => navigate('/protocolos')}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creando...
                  </span>
                ) : (
                  'Crear Protocolo'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
