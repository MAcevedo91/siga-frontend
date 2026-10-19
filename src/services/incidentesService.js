import api from './api'

export const getIncidentes = async (params = {}) => {
  const response = await api.get('/incidentes', { params })
  return response.data.data
}

export const getIncidenteById = async (id) => {
  const response = await api.get(`/incidentes/${id}`)
  return response.data.data
}

export const createIncidente = async (incidenteData) => {
  const response = await api.post('/incidentes', incidenteData)
  return response.data.data
}

export const updateEstadoIncidente = async (id, estado, payload = {}) => {
  const response = await api.patch(`/incidentes/${id}/estado`, { estado, ...payload })
  return response.data.data
}

export const updateObservacionEstudiante = async (incidenteId, estudianteId, observacion) => {
  const response = await api.patch(`/incidentes/${incidenteId}/estudiantes/${estudianteId}/observacion`, {
    observacion,
  })
  return response.data.data
}

export const getTiposAbordaje = async () => {
  const response = await api.get('/incidentes/tipos-abordaje')
  return response.data.data
}

export const buscarEstudiantes = async (query) => {
  const response = await api.get('/estudiantes', {
    params: { search: query },
  })
  return response.data.data
}
