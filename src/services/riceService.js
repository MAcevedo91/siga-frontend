import api from './api'

/**
 * Obtiene los metadatos del RICE activo del establecimiento.
 * @returns {Promise<Object|null>} Metadatos del RICE vigente
 */
export const getRiceActivo = async () => {
  const response = await api.get('/rice/documento-activo')
  return response.data.data
}

/**
 * Sube y vectoriza un nuevo documento RICE (PDF o MD). Exclusivo Administrador.
 * @param {FormData} formData - Objeto con campo 'archivo' y 'anio_vigencia'
 * @returns {Promise<Object>} Resumen del procesamiento
 */
export const uploadRice = async (formData) => {
  const response = await api.post('/rice/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data.data
}

/**
 * Realiza una consulta RAG en lenguaje natural sobre el RICE del colegio.
 * @param {string} consulta - Pregunta o consulta del usuario
 * @param {Object} [contextoIncidente] - Datos del incidente opcional para contexto
 * @returns {Promise<Object>} { respuesta, fuentes, totalFuentes }
 */
export const consultarRiceRag = async (consulta, contextoIncidente = null) => {
  const payload = {
    consulta,
    ...(contextoIncidente ? { contexto_incidente: contextoIncidente } : {}),
  }
  const response = await api.post('/rice/consultar', payload)
  return response.data.data
}
