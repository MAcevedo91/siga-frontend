import api from './api'

export const getDashboardResumen = async () => {
  const response = await api.get('/dashboard/resumen')
  return response.data.data
}

export const getIncidentesPorCurso = async () => {
  const response = await api.get('/dashboard/incidentes-por-curso')
  return response.data.data
}

export const getIncidentesPorGravedad = async () => {
  const response = await api.get('/dashboard/por-gravedad')
  return response.data.data
}

export const getTendenciaMensual = async () => {
  const response = await api.get('/dashboard/tendencia-mensual')
  return response.data.data
}
