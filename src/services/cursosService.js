import api from './api'

/**
 * Obtiene la lista ordenada de niveles disponibles en el período escolar activo.
 * GET /api/v1/cursos/niveles
 * @returns {Promise<string[]>} Ej: ["1° Básico", "2° Básico", ...]
 */
export const getNiveles = async () => {
  const response = await api.get('/cursos/niveles')
  return response.data.data
}

/**
 * Obtiene las letras de curso disponibles para un nivel específico.
 * GET /api/v1/cursos/letras?nivel=X
 * @param {string} nivel - Ej: "1° Básico"
 * @returns {Promise<Array<{ id: string, letra: string, nombre: string, nivel: string }>>}
 */
export const getLetrasPorNivel = async (nivel) => {
  const response = await api.get('/cursos/letras', {
    params: { nivel },
  })
  return response.data.data
}

/**
 * Obtiene la nómina de estudiantes activos de un curso específico, ordenada alfabéticamente por apellido.
 * GET /api/v1/cursos/:id/estudiantes
 * @param {string} cursoId - UUID del curso
 * @returns {Promise<Array<{ id: string, nombre: string, apellido: string, rut: string, es_pie: boolean }>>}
 */
export const getEstudiantesPorCurso = async (cursoId) => {
  const response = await api.get(`/cursos/${cursoId}/estudiantes`)
  return response.data.data
}

export default {
  getNiveles,
  getLetrasPorNivel,
  getEstudiantesPorCurso,
}
