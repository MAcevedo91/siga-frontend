import api from './api'
export const obtenerSociograma = async (cursoId) =>
  (await api.get(`/sociograma/curso/${encodeURIComponent(cursoId)}`)).data
export const obtenerCursosSociograma = async () =>
  (await api.get('/cursos')).data.data
export const generarInformeEspecialista = async (id, params) =>
  (
    await api.get(`/estudiantes/${encodeURIComponent(id)}/ficha-medica-pdf`, {
      params,
      responseType: 'blob',
    })
  ).data
export const listarInformesEspecialista = async (id, params = {}) => {
  const body = (
    await api.get(`/estudiantes/${encodeURIComponent(id)}/informes-medicos`, {
      params,
    })
  ).data
  return body.data || body
}

export const obtenerInformeOriginal = async (estudianteId, informeId) =>
  (
    await api.get(
      `/estudiantes/${encodeURIComponent(estudianteId)}/informes-medicos/${encodeURIComponent(informeId)}/pdf`,
      { responseType: 'blob' },
    )
  ).data
