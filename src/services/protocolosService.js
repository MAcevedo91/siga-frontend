import api from './api'

export const getProtocolos = async (params = {}) => {
  const response = await api.get('/protocolos', { params })
  return response.data.data
}

export const getProtocoloById = async (id) => {
  const response = await api.get(`/protocolos/${id}`)
  return response.data.data
}

export const createProtocolo = async (protocoloData) => {
  const response = await api.post('/protocolos', protocoloData)
  return response.data.data
}

export const avanzarEstadoProtocolo = async (id, nuevoEstado, observaciones) => {
  const response = await api.patch(`/protocolos/${id}/estado`, {
    estado: nuevoEstado,
    observaciones,
  })
  return response.data.data
}

export const getTiposProtocolo = async () => {
  const response = await api.get('/protocolos/tipos-protocolo')
  return response.data.data
}

export const getIncidentesByEstudiante = async (estudianteId) => {
  const response = await api.get('/incidentes', {
    params: { estudiante_id: estudianteId },
  })
  return response.data.data
}
