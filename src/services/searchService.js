import api from './api'

export async function searchEstudiantes(query, limit = 20) {
  const { data } = await api.get('/search/estudiantes', {
    params: { q: query, limit }
  })
  return data.data
}

export async function searchIncidentes(query, limit = 20) {
  const { data } = await api.get('/search/incidentes', {
    params: { q: query, limit }
  })
  return data.data
}
