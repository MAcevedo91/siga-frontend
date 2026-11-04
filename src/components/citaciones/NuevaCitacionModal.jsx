import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import {
  programarCitacion,
  CATEGORIAS_FORMATIVAS,
} from '@/services/citacionesService'
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  User,
  AlertCircle,
  CheckCircle,
  X,
  Send,
  Sparkles,
} from 'lucide-react'

export default function NuevaCitacionModal({
  isOpen,
  onClose,
  onSuccess,
  estudiante = null,
  apoderado = null,
}) {
  const [motivoCategoria, setMotivoCategoria] = useState('refuerzo_academico')
  const [motivoDetalle, setMotivoDetalle] = useState('')
  const [fechaHora, setFechaHora] = useState('')
  const [modalidad, setModalidad] = useState('presencial')
  const [lugar, setLugar] = useState('Sala de Entrevistas / Convivencia Escolar')
  const [enlaceVirtual, setEnlaceVirtual] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [citacionCreada, setCitacionCreada] = useState(null)

  // Configurar fecha mínima: hoy + 1 hora
  const minFechaHora = new Date(Date.now() + 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16)

  useEffect(() => {
    if (isOpen) {
      setError(null)
      setCitacionCreada(null)
      setMotivoDetalle('')
      // Sugerir fecha por defecto: mañana a las 10:00
      const manana = new Date()
      manana.setDate(manana.getDate() + 1)
      manana.setHours(10, 0, 0, 0)
      setFechaHora(manana.toISOString().slice(0, 16))
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!estudiante?.id) {
      setError('Debe seleccionar un estudiante para la citación.')
      setLoading(false)
      return
    }

    if (!apoderado?.id) {
      setError('El estudiante no tiene un apoderado titular asignado para convocar.')
      setLoading(false)
      return
    }

    if (motivoDetalle.trim().length < 10) {
      setError('El detalle del motivo pedagógico debe contener al menos 10 caracteres.')
      setLoading(false)
      return
    }

    try {
      const payload = {
        estudiante_id: estudiante.id,
        apoderado_id: apoderado.id,
        motivo_categoria: motivoCategoria,
        motivo_detalle: motivoDetalle.trim(),
        fecha_hora_programada: new Date(fechaHora).toISOString(),
        modalidad,
        lugar_entrevista: modalidad === 'presencial' ? lugar.trim() : null,
        enlace_virtual: modalidad === 'virtual' ? enlaceVirtual.trim() : null,
      }

      const res = await programarCitacion(payload)
      setCitacionCreada(res)
      if (onSuccess) onSuccess(res)
    } catch (err) {
      if (err.response?.status === 409) {
        setError(
          err.response.data?.message ||
            'Conflicto de horario: Ya cuenta con una citación agendada en ese bloque horario (ventana de 45 min).'
        )
      } else {
        setError(err.response?.data?.message || 'Error al programar la citación formativa.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {citacionCreada ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full mx-auto flex items-center justify-center text-emerald-600">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              ¡Citación Formativa Programada!
            </h2>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-700 space-y-2">
              <p>
                <strong>Folio Oficial:</strong>{' '}
                <span className="font-mono text-indigo-600 font-semibold">{citacionCreada.folio}</span>
              </p>
              <p>
                <strong>Estudiante:</strong> {estudiante?.nombre} {estudiante?.apellido}
              </p>
              <p>
                <strong>Apoderado Convocado:</strong> {apoderado?.nombre} {apoderado?.apellido} ({apoderado?.email || 'Sin correo'})
              </p>
              <p>
                <strong>Fecha y Hora:</strong> {new Date(citacionCreada.fecha_hora_programada).toLocaleString('es-CL')}
              </p>
            </div>
            <p className="text-xs text-slate-500">
              Se ha emitido el token criptográfico seguro de 72 horas y se ha encolado la colilla digital al correo del apoderado.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors"
            >
              Entendido y Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Alianza Familia-Escuela · Épica 10</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Programar Citación Formativa
              </h2>
              <p className="text-xs text-slate-500">
                Convocatoria colaborativa orientada al acompañamiento y bienestar pedagógico.
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2" role="alert">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Datos del Estudiante y Apoderado */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <User className="w-4 h-4 text-indigo-600" />
                <span>Estudiante: {estudiante?.nombre} {estudiante?.apellido}</span>
              </div>
              <div className="text-xs text-slate-600 pl-6">
                <span>Apoderado Titular: <strong>{apoderado?.nombre} {apoderado?.apellido}</strong> ({apoderado?.email || 'Sin correo'})</span>
              </div>
            </div>

            {/* Categoría del Motivo */}
            <div>
              <label htmlFor="motivo-categoria" className="block text-xs font-semibold text-slate-700 mb-1">
                Propósito de la Citación
              </label>
              <select
                id="motivo-categoria"
                value={motivoCategoria}
                onChange={(e) => setMotivoCategoria(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {Object.entries(CATEGORIAS_FORMATIVAS).map(([key, cat]) => (
                  <option key={key} value={key}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1 italic">
                {CATEGORIAS_FORMATIVAS[motivoCategoria]?.descripcion}
              </p>
            </div>

            {/* Detalle del Motivo */}
            <div>
              <label htmlFor="motivo-detalle" className="block text-xs font-semibold text-slate-700 mb-1">
                Mensaje de Convocatoria para la Familia (Mín. 10 caracteres)
              </label>
              <textarea
                id="motivo-detalle"
                rows={3}
                required
                value={motivoDetalle}
                onChange={(e) => setMotivoDetalle(e.target.value)}
                placeholder="Describa el objetivo pedagógico o los temas a coordinar con la familia..."
                className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* Fecha y Hora */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="fecha-hora" className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Fecha y Hora</span>
                </label>
                <input
                  id="fecha-hora"
                  type="datetime-local"
                  required
                  min={minFechaHora}
                  value={fechaHora}
                  onChange={(e) => setFechaHora(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="modalidad" className="block text-xs font-semibold text-slate-700 mb-1">
                  Modalidad
                </label>
                <select
                  id="modalidad"
                  value={modalidad}
                  onChange={(e) => setModalidad(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="presencial">Presencial en Escuela</option>
                  <option value="virtual">Reunión Virtual (Online)</option>
                </select>
              </div>
            </div>

            {/* Lugar o Enlace Virtual */}
            {modalidad === 'presencial' ? (
              <div>
                <label htmlFor="lugar" className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>Lugar de Atención</span>
                </label>
                <input
                  id="lugar"
                  type="text"
                  value={lugar}
                  onChange={(e) => setLugar(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ) : (
              <div>
                <label htmlFor="enlace-virtual" className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Video className="w-3.5 h-3.5 text-slate-500" />
                  <span>Enlace de Videollamada (Meet / Zoom)</span>
                </label>
                <input
                  id="enlace-virtual"
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={enlaceVirtual}
                  onChange={(e) => setEnlaceVirtual(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Botones de Acción */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 transition-colors shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? 'Programando...' : 'Programar y Despachar'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

NuevaCitacionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  estudiante: PropTypes.object,
  apoderado: PropTypes.object,
}
