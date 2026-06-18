import api from './api'

export const getIncidentes = async (params = {}) => {
  const response = await api.get('/api/v1/incidentes', { params })
  return response.data.data
}

export const getIncidenteById = async (id) => {
  const response = await api.get(`/api/v1/incidentes/${id}`)
  return response.data.data
}

export const createIncidente = async (incidenteData) => {
  const response = await api.post('/api/v1/incidentes', incidenteData)
  return response.data.data
}

export const updateEstadoIncidente = async (id, estado) => {
  const response = await api.patch(`/api/v1/incidentes/${id}/estado`, { estado })
  return response.data.data
}

export const getTiposAbordaje = async () => {
  const response = await api.get('/api/v1/tipos-abordaje')
  return response.data.data
}

export const buscarEstudiantes = async (query) => {
  const response = await api.get('/api/v1/estudiantes/buscar', {
    params: { q: query },
  })
  return response.data.data
}
