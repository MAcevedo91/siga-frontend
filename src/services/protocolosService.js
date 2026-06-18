import api from './api'

export const getProtocolos = async (params = {}) => {
  const response = await api.get('/api/v1/protocolos', { params })
  return response.data.data
}

export const getProtocoloById = async (id) => {
  const response = await api.get(`/api/v1/protocolos/${id}`)
  return response.data.data
}

export const createProtocolo = async (protocoloData) => {
  const response = await api.post('/api/v1/protocolos', protocoloData)
  return response.data.data
}

export const avanzarEstadoProtocolo = async (id, nuevoEstado, observacion) => {
  const response = await api.patch(`/api/v1/protocolos/${id}/avanzar`, {
    estado: nuevoEstado,
    observacion,
  })
  return response.data.data
}

export const getTiposProtocolo = async () => {
  const response = await api.get('/api/v1/tipos-protocolo')
  return response.data.data
}

export const getIncidentesByEstudiante = async (estudianteId) => {
  const response = await api.get(`/api/v1/estudiantes/${estudianteId}/incidentes`)
  return response.data.data
}
