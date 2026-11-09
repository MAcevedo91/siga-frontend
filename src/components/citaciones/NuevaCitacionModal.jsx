import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import {
  programarCitacion,
  CATEGORIAS_FORMATIVAS,
} from '@/services/citacionesService'
import { getEstudianteById } from '@/services/estudiantesService'
import SelectorEstudianteCascada from '@/components/shared/SelectorEstudianteCascada'
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
  BookOpen,
  Award,
  ShieldCheck,
  Users,
  Search,
  Check,
  CalendarPlus,
  RefreshCw,
} from 'lucide-react'

// Mapeo temático de colores e íconos por categoría formativa
const MOTIVO_CHIPS = [
  {
    key: 'refuerzo_academico',
    label: 'Refuerzo Académico',
    icon: BookOpen,
    colorActive: 'bg-blue-50 text-blue-800 border-blue-500 ring-1 ring-blue-500 dark:bg-blue-950/70 dark:text-blue-200',
    dot: 'bg-blue-600 dark:bg-blue-400',
  },
  {
    key: 'habitos_asistencia',
    label: 'Hábitos y Asistencia',
    icon: Clock,
    colorActive: 'bg-amber-50 text-amber-900 border-amber-500 ring-1 ring-amber-500 dark:bg-amber-950/70 dark:text-amber-200',
    dot: 'bg-amber-500 dark:bg-amber-400',
  },
  {
    key: 'acuerdos_convivencia',
    label: 'Acuerdos de Convivencia',
    icon: ShieldCheck,
    colorActive: 'bg-purple-50 text-purple-900 border-purple-500 ring-1 ring-purple-500 dark:bg-purple-950/70 dark:text-purple-200',
    dot: 'bg-purple-600 dark:bg-purple-400',
  },
  {
    key: 'reconocimiento_felicitacion',
    label: 'Reconocimiento / Felicitación',
    icon: Award,
    colorActive: 'bg-emerald-50 text-emerald-900 border-emerald-500 ring-1 ring-emerald-500 dark:bg-emerald-950/70 dark:text-emerald-200',
    dot: 'bg-emerald-600 dark:bg-emerald-400',
  },
  {
    key: 'seguimiento_formativo',
    label: 'Seguimiento Formativo',
    icon: Users,
    colorActive: 'bg-indigo-50 text-indigo-900 border-indigo-500 ring-1 ring-indigo-500 dark:bg-indigo-950/70 dark:text-indigo-200',
    dot: 'bg-indigo-600 dark:bg-indigo-400',
  },
]

export default function NuevaCitacionModal({
  isOpen,
  onClose,
  onSuccess,
  estudiante: initialEstudiante = null,
  apoderado: initialApoderado = null,
}) {
  const [selectedEstudiante, setSelectedEstudiante] = useState(initialEstudiante)
  const [selectedApoderado, setSelectedApoderado] = useState(initialApoderado)
  const [loadingEstudianteData, setLoadingEstudianteData] = useState(false)

  const [motivoCategoria, setMotivoCategoria] = useState('refuerzo_academico')
  const [motivoDetalle, setMotivoDetalle] = useState('')
  const [fechaHora, setFechaHora] = useState('')
  const [modalidad, setModalidad] = useState('presencial')
  const [lugar, setLugar] = useState('Sala de Convivencia Escolar')
  const [enlaceVirtual, setEnlaceVirtual] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [citacionCreada, setCitacionCreada] = useState(null)

  // Sincronizar props entrantes
  useEffect(() => {
    setSelectedEstudiante(initialEstudiante)
    setSelectedApoderado(initialApoderado)
  }, [initialEstudiante, initialApoderado])

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

  // Manejar selección de estudiante desde SelectorEstudianteCascada
  const handleSelectEstudianteCascada = async (alumno) => {
    try {
      setLoadingEstudianteData(true)
      setError(null)
      setSelectedEstudiante(alumno)

      // Cargar perfil completo para obtener apoderado titular asignado
      const perfil = await getEstudianteById(alumno.id)
      if (perfil) {
        setSelectedEstudiante((prev) => ({ ...prev, ...perfil }))
        const apod = perfil.apoderado || perfil.apoderados?.[0] || null
        setSelectedApoderado(apod)
        if (!apod) {
          setError('El estudiante seleccionado no tiene un apoderado titular asignado.')
        }
      }
    } catch {
      // Si falla, usar datos básicos del objeto seleccionado
      if (alumno.apoderado) setSelectedApoderado(alumno.apoderado)
    } finally {
      setLoadingEstudianteData(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const estId = selectedEstudiante?.id || initialEstudiante?.id
    const apodId = selectedApoderado?.id || initialApoderado?.id

    if (!estId) {
      setError('Debe seleccionar un estudiante para la citación.')
      setLoading(false)
      return
    }

    if (!apodId) {
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
        estudiante_id: estId,
        apoderado_id: apodId,
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
        const msg =
          err.response?.data?.message ||
          err.message ||
          'Error al programar la citación formativa.'
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const estActual = selectedEstudiante || initialEstudiante
  const apodActual = selectedApoderado || initialApoderado

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-nueva-citacion-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
    >
      <div className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* CABECERA ESTILO INSTITUCIONAL */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 shadow-inner">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-nueva-citacion-title" className="text-lg sm:text-xl font-bold tracking-tight">
                Programar Citación Formativa
              </h2>
              <p className="text-xs text-blue-200">
                Convocatoria a familias y acuerdos de corresponsabilidad
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENIDO DEL MODAL */}
        <div className="p-5 sm:p-6 max-h-[80vh] overflow-y-auto">
          {citacionCreada ? (
            <div className="text-center py-6 space-y-5 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 rounded-full mx-auto flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  ¡Citación Formativa Programada!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Se envió la citación y enlace de confirmación al apoderado.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left text-xs text-slate-700 dark:text-slate-300 space-y-2 max-w-md mx-auto">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="font-semibold text-slate-500">Folio Oficial:</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                    {citacionCreada.folio}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Estudiante:</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {estActual?.nombre} {estActual?.apellido}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Apoderado:</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {apodActual?.nombre} {apodActual?.apellido}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Fecha y Hora:</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {new Date(citacionCreada.fecha_hora_programada).toLocaleString('es-CL', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full max-w-xs py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition"
              >
                Entendido y Cerrar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* SECCIÓN 1: ESTUDIANTE Y FAMILIA CONVOCADA */}
              <section className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-600" />
                    1. Estudiante y Familia Convocada
                  </span>
                  {estActual && !initialEstudiante && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEstudiante(null)
                        setSelectedApoderado(null)
                      }}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                    >
                      Cambiar alumno
                    </button>
                  )}
                </div>

                {estActual ? (
                  <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-sm shrink-0">
                        {estActual.nombre?.[0]}
                        {estActual.apellido?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {estActual.nombre} {estActual.apellido}
                        </p>
                        <p className="text-xs text-slate-500">
                          {estActual.curso?.nombre || estActual.curso || 'Sin curso asignado'} · RUT: {estActual.rut || 'Sin RUT'}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-400 sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0">
                      <span className="block font-semibold text-slate-700 dark:text-slate-300">
                        Apoderado Titular:
                      </span>
                      <span>
                        {apodActual
                          ? `${apodActual.nombre} ${apodActual.apellido} (${apodActual.email || apodActual.telefono || 'Sin contacto'})`
                          : 'Sin apoderado registrado'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <SelectorEstudianteCascada
                      onSelectEstudiante={handleSelectEstudianteCascada}
                      allowMultiple={false}
                    />
                    {loadingEstudianteData && (
                      <p className="text-xs text-blue-600 flex items-center gap-1.5 font-medium">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Cargando antecedentes del apoderado...
                      </p>
                    )}
                  </div>
                )}
              </section>

              {/* SECCIÓN 2: PROPÓSITO FORMATIVO (CHIPS INTERACTIVOS) */}
              <section className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  2. Propósito de la Citación <span className="text-rose-500">*</span>
                </span>

                {/* Chips temáticos clicables */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {MOTIVO_CHIPS.map((chip) => {
                    const isSelected = motivoCategoria === chip.key
                    const IconComp = chip.icon
                    return (
                      <button
                        key={chip.key}
                        type="button"
                        onClick={() => setMotivoCategoria(chip.key)}
                        aria-pressed={isSelected}
                        className={`p-2.5 rounded-xl text-left border text-xs font-medium transition flex items-center justify-between gap-2 ${
                          isSelected
                            ? chip.colorActive
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${chip.dot}`} />
                          <IconComp className="w-3.5 h-3.5 shrink-0 opacity-80" />
                          <span className="truncate">{chip.label}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    )
                  })}
                </div>

                {/* Detalle o mensaje para la familia */}
                <div className="pt-2">
                  <label
                    htmlFor="motivo-detalle"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Mensaje de Convocatoria para la Familia <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="motivo-detalle"
                    rows={3}
                    required
                    value={motivoDetalle}
                    onChange={(e) => setMotivoDetalle(e.target.value)}
                    placeholder="Describa brevemente el contexto formativo a tratar en la entrevista..."
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                  />
                  <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                    <span>Mínimo 10 caracteres</span>
                    <span>{motivoDetalle.length} caracteres</span>
                  </div>
                </div>
              </section>

              {/* SECCIÓN 3: AGENDA Y MODALIDAD */}
              <section className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  3. Agenda y Modalidad <span className="text-rose-500">*</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Fecha y Hora */}
                  <div>
                    <label
                      htmlFor="fecha-hora"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Fecha y Hora
                    </label>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        id="fecha-hora"
                        required
                        value={fechaHora}
                        onChange={(e) => setFechaHora(e.target.value)}
                        className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Modalidad Toggle */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Modalidad
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setModalidad('presencial')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                          modalidad === 'presencial'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Presencial</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalidad('virtual')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                          modalidad === 'virtual'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Online</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Campo condicional según modalidad */}
                {modalidad === 'presencial' ? (
                  <div>
                    <label
                      htmlFor="lugar-citacion"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Lugar o Sala de Entrevista
                    </label>
                    <input
                      type="text"
                      id="lugar-citacion"
                      required
                      value={lugar}
                      onChange={(e) => setLugar(e.target.value)}
                      placeholder="Ej: Sala de Convivencia Escolar / Inspectoría"
                      className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="enlace-virtual"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Enlace de Videollamada (Google Meet / Zoom)
                    </label>
                    <input
                      type="url"
                      id="enlace-virtual"
                      required
                      value={enlaceVirtual}
                      onChange={(e) => setEnlaceVirtual(e.target.value)}
                      placeholder="https://meet.google.com/xyz-abcd-efg"
                      className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </section>

              {/* BOTONES DE ACCIÓN */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-md flex items-center gap-1.5 transition"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Despachando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Programar y Despachar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

NuevaCitacionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  estudiante: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    nombre: PropTypes.string,
    apellido: PropTypes.string,
    curso: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    rut: PropTypes.string,
  }),
  apoderado: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    nombre: PropTypes.string,
    apellido: PropTypes.string,
    email: PropTypes.string,
    telefono: PropTypes.string,
  }),
}
