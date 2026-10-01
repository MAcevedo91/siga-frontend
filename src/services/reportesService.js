import api from './api'

/**
 * Obtiene todos los reportes asociados a un incidente.
 * @param {string} incidenteId - UUID del incidente
 * @returns {Promise<Array>} Lista de reportes
 */
export const getReportesIncidente = async (incidenteId) => {
  const response = await api.get(`/incidentes/${incidenteId}/reportes`)
  return response.data.data || []
}

/**
 * Obtiene el detalle de un reporte individual.
 * @param {string} incidenteId - UUID del incidente
 * @param {string} reporteId - UUID del reporte
 * @returns {Promise<Object>} Datos del reporte
 */
export const getReporteById = async (incidenteId, reporteId) => {
  const response = await api.get(`/incidentes/${incidenteId}/reportes/${reporteId}`)
  return response.data.data
}

/**
 * Genera borradores asistidos con IA para todos los estudiantes involucrados en un incidente.
 * @param {string} incidenteId - UUID del incidente
 * @returns {Promise<Array>} Lista de borradores generados
 */
export const generarBorradoresReporte = async (incidenteId) => {
  const response = await api.post(`/incidentes/${incidenteId}/borrador-reporte`)
  return response.data.data || []
}

/**
 * Guarda las modificaciones realizadas a un borrador sin oficializarlo.
 * @param {string} incidenteId - UUID del incidente
 * @param {string} reporteId - UUID del reporte
 * @param {Object} contenidoEditado - Objeto con las 5 secciones editadas
 * @returns {Promise<Object>} Reporte actualizado
 */
export const guardarBorradorReporte = async (incidenteId, reporteId, contenidoEditado) => {
  const response = await api.patch(`/incidentes/${incidenteId}/reportes/${reporteId}`, {
    contenido_editado: contenidoEditado,
  })
  return response.data.data
}

/**
 * Aprueba y oficializa formalmente un reporte de incidente.
 * @param {string} incidenteId - UUID del incidente
 * @param {string} reporteId - UUID del reporte
 * @param {Object} [contenidoFinal] - Contenido definitivo opcional
 * @returns {Promise<Object>} Reporte aprobado
 */
export const aprobarReporte = async (incidenteId, reporteId, contenidoFinal = null) => {
  const payload = contenidoFinal ? { contenido_final: contenidoFinal } : {}
  const response = await api.post(`/incidentes/${incidenteId}/reportes/${reporteId}/aprobar`, payload)
  return response.data.data
}

/**
 * Descarga o visualiza el archivo PDF oficial con membrete y firmas institucionales.
 * @param {string} incidenteId - UUID del incidente
 * @param {string} reporteId - UUID del reporte
 * @param {string} [nombreSugerido] - Nombre del archivo a descargar
 * @param {boolean} [abrirEnNuevaPestana] - Si es true, abre el PDF en nueva pestaña para lectura/impresión
 */
export const descargarReportePdf = async (
  incidenteId,
  reporteId,
  nombreSugerido = 'informe_incidente.pdf',
  abrirEnNuevaPestana = false
) => {
  const response = await api.get(`/incidentes/${incidenteId}/reportes/${reporteId}/pdf`, {
    responseType: 'blob',
  })

  const blob = new Blob([response.data], { type: 'application/pdf' })
  const url = window.URL.createObjectURL(blob)

  if (abrirEnNuevaPestana) {
    window.open(url, '_blank')
    setTimeout(() => {
      window.URL.revokeObjectURL(url)
    }, 10000)
    return
  }

  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', nombreSugerido)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export default {
  getReportesIncidente,
  getReporteById,
  generarBorradoresReporte,
  guardarBorradorReporte,
  aprobarReporte,
  descargarReportePdf,
}
