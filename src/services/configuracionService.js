import api from './api'

/**
 * Obtiene la configuración general del establecimiento y la matriz de reglas de protocolos.
 * @returns {Promise<{ parametros: Object, reglas: Array }>}
 */
export const getConfiguracion = async () => {
  const response = await api.get('/configuracion')
  return response.data.data
}

/**
 * Actualiza los parámetros de análisis y umbrales de riesgo del tenant.
 * @param {Object} configData
 * @param {number} [configData.umbral_riesgo]
 * @param {number} [configData.ventana_dias_riesgo]
 * @param {number} [configData.ventana_dias_reincidencia]
 * @param {number} [configData.ventana_dias_escalada]
 * @returns {Promise<Object>}
 */
export const updateConfiguracion = async (configData) => {
  const response = await api.put('/configuracion', configData)
  return response.data.data
}

/**
 * Modifica el plazo normativo en días u opciones de una regla de protocolo RICE.
 * @param {string} id - ID de la regla de protocolo
 * @param {Object} reglaData
 * @param {number} [reglaData.plazo_dias]
 * @param {string} [reglaData.accion]
 * @param {boolean} [reglaData.prorrogable]
 * @param {boolean} [reglaData.activo]
 * @returns {Promise<Object>}
 */
export const updateReglaProtocolo = async (id, reglaData) => {
  const response = await api.put(`/configuracion/reglas/${id}`, reglaData)
  return response.data.data
}

export default {
  getConfiguracion,
  updateConfiguracion,
  updateReglaProtocolo,
}
