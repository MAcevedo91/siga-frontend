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

export const getPasosProtocolo = async (id) => {
  const response = await api.get(`/protocolos/${id}/pasos`)
  return response.data.data
}

export const actualizarPasoProtocolo = async (id, pasoId, data) => {
  const response = await api.patch(`/protocolos/${id}/pasos/${pasoId}`, data)
  return response.data.data
}

export const subirEvidenciaPaso = async (id, pasoId, archivo) => {
  const formData = new FormData()
  formData.append('archivo', archivo)
  const response = await api.post(`/protocolos/${id}/pasos/${pasoId}/evidencias`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data.data
}

export const eliminarEvidenciaPaso = async (id, pasoId, evidenciaId) => {
  const response = await api.delete(`/protocolos/${id}/pasos/${pasoId}/evidencias/${evidenciaId}`)
  return response.data.data
}

export const descargarExpedientePDF = async (id, nombreSugerido = null) => {
  const response = await api.get(`/protocolos/${id}/expediente-pdf`, {
    responseType: 'blob',
  })
  const blob = new Blob([response.data], { type: 'application/pdf' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', nombreSugerido || `Expediente_RICE_${id}.pdf`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

