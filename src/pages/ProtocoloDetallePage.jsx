import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getProtocoloById,
  avanzarEstadoProtocolo,
  getPasosProtocolo,
  actualizarPasoProtocolo,
} from '@/services/protocolosService'
import { getAntecedentesEscalada } from '@/services/estudiantesService'
import ChecklistProtocolo from '@/components/protocolos/ChecklistProtocolo'
import AlertaEscaladaBanner from '@/components/shared/AlertaEscaladaBanner'
import { useAuth } from '@/store/useAuthStore'
import { formatDate } from '@/utils/formatDate'
import toast from 'react-hot-toast'
import { Lock } from 'lucide-react'

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

  // Estados para checklist y alerta de escalada
  const [pasos, setPasos] = useState([])
  const [loadingPasos, setLoadingPasos] = useState(false)
  const [alertaEscalada, setAlertaEscalada] = useState(null)

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

      // Cargar pasos normativos del protocolo
      loadPasos()

      // Cargar antecedentes preventivos del estudiante
      const estId = data?.estudiante_id || data?.estudiante?.id
      if (estId) {
        getAntecedentesEscalada(estId)
          .then((diag) => setAlertaEscalada(diag))
          .catch((err) => console.error('Error al cargar antecedentes:', err))
      }
    } catch (err) {
      setError('Error al cargar protocolo')
    } finally {
      setLoading(false)
    }
  }

  const loadPasos = async () => {
    try {
      setLoadingPasos(true)
      const data = await getPasosProtocolo(id)
      setPasos(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error al cargar pasos del protocolo:', err)
      setPasos([])
    } finally {
      setLoadingPasos(false)
    }
  }

  const handleCompletarPaso = async (pasoId, observacionPaso) => {
    try {
      const updatedPaso = await actualizarPasoProtocolo(id, pasoId, {
        completado: true,
        observacion: observacionPaso,
      })
      // Actualización reactiva instantánea sin recargar la página
      setPasos((prev) =>
        prev.map((p) =>
          p.id === pasoId
            ? {
                ...p,
                ...updatedPaso,
                completado: true,
                observacion: observacionPaso,
                fecha_completado: updatedPaso?.fecha_completado || new Date().toISOString(),
              }
            : p
        )
      )
      toast.success('Paso normativo completado exitosamente')
    } catch (err) {
      console.error('Error al certificar paso:', err)
      const msg = err.response?.data?.message || 'Error al completar el paso normativo'
      toast.error(msg)
      throw err
    }
  }

  const handleAvanzarEstado = async () => {
    if (!observacion.trim()) {
      toast.error('La observación es obligatoria para avanzar el estado')
      return
    }

    const estadoActualIndex = ESTADOS.indexOf(protocolo.estado)
    if (estadoActualIndex === ESTADOS.length - 1) {
      toast.error('El protocolo ya está en el estado final')
      return
    }

    const nuevoEstado = ESTADOS[estadoActualIndex + 1]

    try {
      setUpdatingEstado(true)
      const updated = await avanzarEstadoProtocolo(id, nuevoEstado, observacion)
      setProtocolo(updated)
      setObservacion('')
      setShowAvanzarForm(false)
      toast.success(`Protocolo avanzado a "${nuevoEstado}" exitosamente`)
    } catch (err) {
      toast.error('Error al avanzar estado del protocolo')
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
  const tienePasosPendientes = pasos.length > 0 && pasos.some((p) => !p.completado)

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
          {/* Banner de alerta preventiva de antecedentes RICE si corresponde */}
          {alertaEscalada?.tiene_alerta && (
            <AlertaEscaladaBanner diagnostico={alertaEscalada} />
          )}

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
                  <p className="text-sm text-gray-600">
                    {typeof protocolo.estudiante?.curso === 'object'
                      ? protocolo.estudiante?.curso?.nombre
                      : protocolo.estudiante?.curso}
                  </p>
                </div>

                <div>
                  <h2 className="mb-2 text-sm font-medium text-gray-500">Fecha de Apertura</h2>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDate(protocolo.fecha_apertura)}
                  </p>
                </div>
              </div>

              {protocolo.incidente && (
                <div>
                  <h2 className="mb-2 text-sm font-medium text-gray-500">Incidente Relacionado</h2>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-900">
                      {formatDate(protocolo.incidente.fecha)} - {protocolo.incidente.tipo_abordaje}
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

          {/* Checklist de Pasos Normativos RICE */}
          <ChecklistProtocolo
            pasos={pasos}
            loading={loadingPasos}
            canEdit={canEdit}
            onCompletarPaso={handleCompletarPaso}
            protocoloCerrado={protocolo.estado === 'Cerrado'}
          />

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
                {tienePasosPendientes && (
                  <div
                    role="alert"
                    className="mb-4 flex items-center gap-2.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 p-3.5 text-xs text-amber-800 dark:text-amber-200"
                  >
                    <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="font-medium">
                      Debe completar todos los pasos del checklist antes de cambiar de etapa.
                    </span>
                  </div>
                )}

                {!showAvanzarForm ? (
                  <button
                    disabled={tienePasosPendientes}
                    onClick={() => setShowAvanzarForm(true)}
                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition ${
                      tienePasosPendientes
                        ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-60'
                        : 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20'
                    }`}
                  >
                    Avanzar a &quot;{ESTADOS[estadoActualIndex + 1]}&quot;
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
