import api from './api'

/**
 * Obtiene el estado actual del período lectivo y cursos vigentes.
 */
export const getEstadoActual = async () => {
  const { data } = await api.get('/cierre-anio/estado-actual')
  return data.data
}

/**
 * Genera la propuesta automática de promoción para todos los alumnos.
 * @param {Object} [params]
 * @param {'BASICA'|'MEDIA'} [params.tipo_establecimiento]
 */
export const getPropuestaPromocion = async (params = {}) => {
  const { data } = await api.get('/cierre-anio/propuesta', { params })
  return data.data
}

/**
 * Ejecuta el cierre del año lectivo y la promoción masiva atómica.
 */
export const ejecutarCierreYPromocion = async (payload) => {
  const { data } = await api.post('/cierre-anio/ejecutar', payload)
  return data
}
