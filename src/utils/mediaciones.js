export const ROLES_MEDIACION_LECTURA = [
  'Administrador',
  'Directivo',
  'Equipo de Formación',
  'Inspector',
  'Docente',
]
export const ROLES_MEDIACION_GESTION = [
  'Administrador',
  'Directivo',
  'Equipo de Formación',
  'Inspector',
]
export const ROLES_INFORMES_SALUD = [
  'Administrador',
  'Directivo',
  'Equipo de Formación',
]
export const nombreEstudiante = (e = {}) =>
  [e.nombre, e.apellido].filter(Boolean).join(' ') || 'Estudiante'
export const mensajeError = (e) =>
  e?.response?.data?.message ||
  e?.message ||
  'No se pudo completar la operación. Intenta nuevamente.'
export const fechaLocal = (date = new Date()) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
export const mostrarFecha = (value) => {
  if (!value) return 'Sin fecha'
  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value,
  )
  return Number.isNaN(date.getTime())
    ? 'Fecha inválida'
    : new Intl.DateTimeFormat('es-CL', {
        timeZone: 'America/Santiago',
        dateStyle: 'medium',
      }).format(date)
}
export function getSemaforo(mediacion, now = new Date()) {
  if (mediacion.cerrada_at)
    return { key: 'cerrada', label: 'Cerrada', color: 'slate' }
  const compromisos =
    mediacion.mediacion_compromisos || mediacion.compromisos || []
  const pendientes = compromisos.filter(
    (c) => !c.cumplido && (!c.estado || c.estado === 'pendiente'),
  )
  if (!pendientes.length)
    return compromisos.length
      ? { key: 'evaluado', label: 'Evaluados', color: 'emerald' }
      : { key: 'sin_acuerdos', label: 'Sin acuerdos', color: 'slate' }
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  )
  const wallNow = Date.UTC(
    +parts.year,
    +parts.month - 1,
    +parts.day,
    +parts.hour,
    +parts.minute,
    +parts.second,
  )
  const deadlines = pendientes
    .map((c) => {
      if (!c.fecha_limite) return Infinity
      if (/^\d{4}-\d{2}-\d{2}$/.test(c.fecha_limite))
        return (Date.parse(`${c.fecha_limite}T23:59:59Z`) - wallNow) / 3600000
      return (new Date(c.fecha_limite).getTime() - now.getTime()) / 3600000
    })
    .filter(Number.isFinite)
  if (!deadlines.length)
    return { key: 'sin_fecha', label: 'Sin plazo registrado', color: 'slate' }
  const hours = Math.min(...deadlines)
  return hours < 0
    ? { key: 'vencido', label: 'Vencido sin evaluar', color: 'rose' }
    : hours < 48
      ? { key: 'proximo', label: 'Vence en menos de 48 h', color: 'amber' }
      : { key: 'plazo', label: 'En plazo', color: 'emerald' }
}
export function validarNuevaMediacion(data) {
  const ids = (data.participantes || []).map((p) => p.estudiante_id)
  if (ids.length < 2 || new Set(ids).size !== ids.length)
    return 'Selecciona al menos dos estudiantes distintos.'
  if ((data.motivo || '').trim().length < 10)
    return 'El motivo debe tener al menos 10 caracteres.'
  if (!data.fecha_programada || Number.isNaN(Date.parse(data.fecha_programada)))
    return 'Ingresa una fecha y hora válida.'
  return ''
}
export async function descargarBlob(blob, nombre, mime = 'application/pdf') {
  if (
    !(blob instanceof Blob) ||
    !blob.size ||
    (blob.type &&
      !blob.type.includes(mime) &&
      !blob.type.includes('octet-stream'))
  )
    throw new Error('El servidor no devolvió un PDF válido.')
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nombre
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
