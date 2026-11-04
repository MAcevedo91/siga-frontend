import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  obtenerCitacionPublica,
  responderCitacionPublica,
  generarUrlGoogleCalendar,
  descargarArchivoIcs,
  CATEGORIAS_FORMATIVAS,
} from '@/services/citacionesService'
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  User,
  CheckCircle2,
  CalendarDays,
  CalendarClock,
  AlertTriangle,
  School,
  Download,
  Send,
  XCircle,
} from 'lucide-react'

export default function ConfirmacionCitacionPublicPage() {
  const { token } = useParams()
  const [citacion, setCitacion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isExpired, setIsExpired] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [modoAccion, setModoAccion] = useState(null) // 'reprogramar' | 'justificar' | null
  const [comentario, setComentario] = useState('')
  const [nuevaFecha, setNuevaFecha] = useState('')
  const [mensajeExito, setMensajeExito] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    setIsExpired(false)

    obtenerCitacionPublica(token)
      .then((data) => {
        if (active) setCitacion(data)
      })
      .catch((err) => {
        if (!active) return
        if (err.response?.status === 410 || err.response?.data?.code === 'TOKEN_EXPIRADO') {
          setIsExpired(true)
        } else {
          setError(err.response?.data?.message || 'No se pudo cargar la citación solicitada.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [token])

  const formatearFechaHora = (isoString) => {
    if (!isoString) return ''
    const fecha = new Date(isoString)
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'America/Santiago',
    }).format(fecha)
  }

  const handleResponder = async (accion) => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await responderCitacionPublica({
        token,
        accion,
        comentario: comentario.trim() || null,
        nueva_fecha_solicitada: accion === 'reprogramar' && nuevaFecha ? nuevaFecha : null,
      })

      setCitacion(res.citacion)
      setMensajeExito(res.mensaje)
      setModoAccion(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al enviar su respuesta. Intente nuevamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-sm border border-slate-200 text-center animate-pulse" role="status">
          <div className="w-12 h-12 bg-indigo-100 rounded-full mx-auto mb-4 flex items-center justify-center text-indigo-600">
            <Calendar className="w-6 h-6 animate-spin" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800">Cargando convocatoria...</h2>
          <p className="text-sm text-slate-500 mt-1">Obteniendo los detalles de su citación formativa.</p>
        </div>
      </main>
    )
  }

  if (isExpired) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-sm border border-amber-200 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full mx-auto mb-4 flex items-center justify-center text-amber-600">
            <Clock className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Enlace Expirado</h1>
          <p className="text-sm text-slate-600 mt-2">
            Por seguridad y resguardo de la información, los enlaces de citación tienen una validez estricta de <strong>72 horas</strong> desde su emisión.
          </p>
          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left space-y-1">
            <p className="font-semibold text-slate-800">¿Cómo proceder?</p>
            <p>Comuníquese con el profesor jefe de su pupilo o con la secretaría de la Escuela Básica El Salvador para renovar la convocatoria.</p>
          </div>
        </div>
      </main>
    )
  }

  if (error && !citacion) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-sm border border-rose-200 text-center">
          <div className="w-16 h-16 bg-rose-100 rounded-full mx-auto mb-4 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Citación No Disponible</h1>
          <p className="text-sm text-slate-600 mt-2">{error}</p>
        </div>
      </main>
    )
  }

  const categoriaInfo =
    CATEGORIAS_FORMATIVAS[citacion?.motivo_categoria] || {
      label: 'Citación Pedagógica',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      descripcion: 'Entrevista de colaboración familia-escuela.',
    }

  const estadoActual = citacion?.estado

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
      <div className="max-w-xl w-full mx-auto space-y-4">
        {/* Encabezado Institucional */}
        <header className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
            <School className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">Escuela Coeducacional N° 1 El Salvador</h1>
            <p className="text-xs text-slate-500">Gestor de Citaciones Formativas · Alianza Familia-Escuela</p>
          </div>
        </header>

        {/* Tarjeta Principal de la Convocatoria */}
        <main className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Folio: {citacion?.folio || 'CIT-2026'}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${categoriaInfo.color}`}>
              {categoriaInfo.label}
            </span>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Convocatoria a Entrevista Formativa
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Estimado/a <strong>{citacion?.apoderado?.nombre} {citacion?.apoderado?.apellido}</strong>:
            </p>
            <p className="text-sm text-slate-600 mt-1">
              Le invitamos a este espacio colaborativo enfocado en el desarrollo formativo y bienestar escolar de su pupilo/a:
            </p>
          </div>

          {/* Datos del Estudiante */}
          <section className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-slate-800 text-sm font-semibold">
              <User className="w-4 h-4 text-indigo-600" />
              <span>{citacion?.estudiante?.nombre} {citacion?.estudiante?.apellido}</span>
              {citacion?.estudiante?.curso && (
                <span className="text-xs font-normal text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  {citacion?.estudiante?.curso}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 italic">
              Convocada por: <strong>{citacion?.docente?.nombre || 'Profesor Jefe'}</strong>
            </p>
          </section>

          {/* Fecha, Hora y Modalidad */}
          <section className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
              <CalendarDays className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-indigo-900">Fecha y Hora Programada</p>
                <p className="text-sm font-semibold text-slate-900 capitalize">
                  {formatearFechaHora(citacion?.fecha_hora_programada)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              {citacion?.modalidad === 'virtual' ? (
                <Video className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              ) : (
                <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-xs font-medium text-slate-700">
                  {citacion?.modalidad === 'virtual' ? 'Modalidad Virtual' : 'Lugar Presencial'}
                </p>
                <p className="text-sm text-slate-800 font-medium">
                  {citacion?.modalidad === 'virtual'
                    ? (citacion?.enlace_virtual ? <a href={citacion.enlace_virtual} target="_blank" rel="noreferrer" className="text-indigo-600 underline">Unirse a la sesión online</a> : 'Enlace será enviado por el docente')
                    : (citacion?.lugar_entrevista || 'Sala de Entrevistas / Convivencia Escolar')}
                </p>
              </div>
            </div>
          </section>

          {/* Motivo Pedagógico */}
          <section className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Propósito Colaborativo
            </p>
            <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">
              {citacion?.motivo_detalle}
            </p>
          </section>

          {/* Mensajes de Confirmación y Feedback */}
          {mensajeExito && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3" role="alert">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
              <div className="text-sm">
                <p className="font-semibold">Respuesta registrada con éxito</p>
                <p>{mensajeExito}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3" role="alert">
              <XCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
              <div className="text-sm">
                <p className="font-semibold">Atención</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Acciones según el Estado Actual */}
          {estadoActual === 'confirmada' && (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <h3 className="text-base font-bold text-emerald-900">¡Asistencia Confirmada!</h3>
                <p className="text-xs text-emerald-700 mt-1">
                  Muchas gracias por su compromiso. Le esperamos en el día y horario programado.
                </p>
              </div>

              {/* Integración con Calendarios Móviles (Opción B: Guardado Directo) */}
              <div className="pt-2 space-y-2.5 text-center">
                <button
                  type="button"
                  onClick={() => descargarArchivoIcs(citacion)}
                  className="w-full inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-sm"
                >
                  <CalendarDays className="w-5 h-5" />
                  <span>Guardar en mi Calendario</span>
                </button>

                <p className="text-xs text-slate-500">
                  ¿Prefieres Google Calendar?{' '}
                  <a
                    href={generarUrlGoogleCalendar(citacion)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 font-semibold underline hover:text-indigo-800 transition-colors"
                  >
                    Toca aquí para agendar
                  </a>
                </p>
              </div>
            </div>
          )}

          {estadoActual === 'reprogramacion_solicitada' && (
            <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-center">
              <CalendarClock className="w-8 h-8 text-sky-600 mx-auto mb-2" />
              <h3 className="text-base font-bold text-sky-900">Solicitud de Reprogramación Enviada</h3>
              <p className="text-xs text-sky-700 mt-1">
                El docente revisará su solicitud y se pondrá en contacto para coordinar una fecha que acomode a ambas partes.
              </p>
            </div>
          )}

          {estadoActual === 'justificada' && (
            <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-center">
              <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-900">Inasistencia Justificada</h3>
              <p className="text-xs text-slate-600 mt-1">
                Se ha tomado constancia de su motivo de inasistencia.
              </p>
            </div>
          )}

          {estadoActual === 'programada' && !modoAccion && (
            <div className="space-y-3 pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleResponder('confirmar')}
                className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-emerald-600 text-white font-bold text-base hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirmar Mi Asistencia</span>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setModoAccion('reprogramar')}
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/60 text-indigo-700 font-medium text-sm hover:bg-indigo-100 active:bg-indigo-200 transition-colors"
                >
                  Solicitar Reprogramación
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setModoAccion('justificar')}
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-medium text-sm hover:bg-slate-50 active:bg-slate-100 transition-colors"
                >
                  No Podré Asistir
                </button>
              </div>
            </div>
          )}

          {/* Formulario de Reprogramación */}
          {estadoActual === 'programada' && modoAccion === 'reprogramar' && (
            <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-200 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-indigo-900">Proponer Nueva Fecha</h3>
                <button
                  type="button"
                  onClick={() => setModoAccion(null)}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  Cancelar
                </button>
              </div>

              <div>
                <label htmlFor="nueva-fecha" className="block text-xs font-medium text-slate-700 mb-1">
                  Propuesta de fecha y horario que le acomode
                </label>
                <input
                  id="nueva-fecha"
                  type="datetime-local"
                  value={nuevaFecha}
                  onChange={(e) => setNuevaFecha(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="comentario-reprogramar" className="block text-xs font-medium text-slate-700 mb-1">
                  Motivo de reprogramación (opcional)
                </label>
                <textarea
                  id="comentario-reprogramar"
                  rows={2}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Ej. Por motivos de trabajo puedo después de las 15:00 hrs..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <button
                type="button"
                disabled={submitting || (!nuevaFecha && !comentario.trim())}
                onClick={() => handleResponder('reprogramar')}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Enviando...' : 'Enviar Propuesta de Reprogramación'}</span>
              </button>
            </div>
          )}

          {/* Formulario de Justificación */}
          {estadoActual === 'programada' && modoAccion === 'justificar' && (
            <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">Justificar Inasistencia</h3>
                <button
                  type="button"
                  onClick={() => setModoAccion(null)}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  Cancelar
                </button>
              </div>

              <div>
                <label htmlFor="comentario-justificar" className="block text-xs font-medium text-slate-700 mb-1">
                  Motivo por el cual no podrá acudir (mínimo 5 caracteres)
                </label>
                <textarea
                  id="comentario-justificar"
                  rows={3}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Indique el motivo de fuerza mayor o situación laboral..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-none"
                />
              </div>

              <button
                type="button"
                disabled={submitting || comentario.trim().length < 5}
                onClick={() => handleResponder('justificar')}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-700 text-white font-bold text-sm hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Enviando...' : 'Registrar Justificación'}</span>
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Pie de página institucional */}
      <footer className="text-center text-xs text-slate-400 mt-8">
        <p>Sistema de Gestión y Acompañamiento Escolar (SIGA Escolar) · 2026</p>
      </footer>
    </div>
  )
}
