import api from './api'

export const CATEGORIAS_FORMATIVAS = {
  refuerzo_academico: {
    label: 'Refuerzo Académico',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    descripcion: 'Acompañamiento colaborativo para potenciar el aprendizaje y estrategias de estudio.',
  },
  habitos_asistencia: {
    label: 'Hábitos y Asistencia',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    descripcion: 'Acuerdos mutuos para fortalecer la puntualidad, asistencia y rutinas escolares.',
  },
  reconocimiento_felicitacion: {
    label: 'Reconocimiento y Felicitación',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    descripcion: 'Puesta en valor de logros significativos, compromiso y avances positivos del estudiante.',
  },
  acuerdos_convivencia: {
    label: 'Acuerdos de Convivencia',
    color: 'bg-sky-50 text-sky-700 border-sky-200',
    descripcion: 'Diálogo restaurativo para consolidar un trato respetuoso y bienestar en aula.',
  },
  seguimiento_formativo: {
    label: 'Seguimiento Formativo',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    descripcion: 'Evaluación periódica de compromisos previos en alianza familia-escuela.',
  },
}

/**
 * Consulta pública de una citación mediante Token Criptográfico (Sin login).
 */
export const obtenerCitacionPublica = async (token) => {
  const response = await api.get(`/citaciones/public/token/${encodeURIComponent(token)}`)
  return response.data.data
}

/**
 * Responde a una citación desde la vista pública móvil (confirmar, reprogramar, justificar).
 */
export const responderCitacionPublica = async ({
  token,
  accion,
  comentario = null,
  nueva_fecha_solicitada = null,
}) => {
  const response = await api.post('/citaciones/public/responder', {
    token,
    accion,
    comentario,
    nueva_fecha_solicitada,
  })
  return response.data
}

/**
 * Programa una nueva citación formativa (Privado - Docente/Directivo).
 */
export const programarCitacion = async (payload) => {
  const response = await api.post('/citaciones', payload)
  return response.data.data
}

/**
 * Consulta la lista paginada de citaciones del colegio (Privado).
 */
export const listarCitaciones = async (params = {}) => {
  const response = await api.get('/citaciones', { params })
  return response.data
}

/**
 * Genera la URL para agregar la citación a Google Calendar con 1 clic.
 */
export const generarUrlGoogleCalendar = (citacion) => {
  if (!citacion || !citacion.fecha_hora_programada) return '#'

  const fechaInicio = new Date(citacion.fecha_hora_programada)
  const fechaFin = new Date(fechaInicio.getTime() + 45 * 60 * 1000) // 45 minutos de duración

  const formatoUtc = (d) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

  const title = encodeURIComponent(
    `Entrevista Formativa: ${citacion.estudiante?.nombre || 'Estudiante'} — Escuela El Salvador`
  )
  const details = encodeURIComponent(
    `Citación de colaboración pedagógica-formativa.\nFolio: ${citacion.folio}\nDocente: ${citacion.docente?.nombre || 'Profesor'}\nMotivo: ${citacion.motivo_detalle || ''}`
  )
  const location = encodeURIComponent(
    citacion.modalidad === 'virtual'
      ? `Reunión Virtual: ${citacion.enlace_virtual || 'Por definir'}`
      : citacion.lugar_entrevista || 'Escuela Básica El Salvador'
  )

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatoUtc(fechaInicio)}/${formatoUtc(fechaFin)}&details=${details}&location=${location}`
}

/**
 * Descarga un archivo iCalendar (.ics) compatible con Apple Calendar, Outlook y dispositivos móviles.
 */
export const descargarArchivoIcs = (citacion) => {
  if (!citacion || !citacion.fecha_hora_programada) return

  const fechaInicio = new Date(citacion.fecha_hora_programada)
  const fechaFin = new Date(fechaInicio.getTime() + 45 * 60 * 1000)

  const formatoUtc = (d) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SIGA Escolar//Citaciones Formativas//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${citacion.folio || 'citacion'}-${Date.now()}@sigaescolar.cl`,
    `DTSTAMP:${formatoUtc(new Date())}`,
    `DTSTART:${formatoUtc(fechaInicio)}`,
    `DTEND:${formatoUtc(fechaFin)}`,
    `SUMMARY:Entrevista Formativa: ${citacion.estudiante?.nombre || 'Estudiante'} (Escuela El Salvador)`,
    `DESCRIPTION:${(citacion.motivo_detalle || 'Entrevista de colaboración pedagógica').replace(/\n/g, '\\n')}`,
    `LOCATION:${(citacion.modalidad === 'virtual' ? citacion.enlace_virtual : citacion.lugar_entrevista) || 'Escuela Básica El Salvador'}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.setAttribute('download', `citacion-${citacion.folio || 'formativa'}.ics`)
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

/**
 * Registra los acuerdos mutuos y cierra formalmente la entrevista formativa (Privado - Docente / Directivo).
 */
export const registrarAcuerdosCitacion = async (citacionId, payload) => {
  const response = await api.post(`/citaciones/${citacionId}/acuerdos`, payload)
  return response.data.data
}

/**
 * Descarga el Buffer del Acta Oficial de Citación en PDF (Privado).
 */
export const descargarActaCitacionPdf = async (citacionId, folio = 'formativa') => {
  const response = await api.get(`/citaciones/${citacionId}/acta-pdf`, {
    responseType: 'blob',
  })
  const blob = new Blob([response.data], { type: 'application/pdf' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.setAttribute('download', `Acta_Citacion_${folio}.pdf`)
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
  return true
}

/**
 * Consulta la analítica agregada de participación familiar y motivos formativos (TASK 10.3.1).
 */
export const obtenerMetricasCitaciones = async (params = {}) => {
  const response = await api.get('/citaciones/metricas', { params })
  return response.data.data
}

/**
 * Consulta el historial cronológico y resumen analítico de citaciones de un estudiante (TASK 10.3.1).
 */
export const obtenerHistorialCitacionesEstudiante = async (estudianteId) => {
  const response = await api.get(`/citaciones/estudiante/${estudianteId}`)
  return response.data.data
}

