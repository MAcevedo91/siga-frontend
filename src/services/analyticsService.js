import api from './api'

export async function getResumen() {
  const { data } = await api.get('/analytics/resumen')
  return data.data
}

export async function getTendenciaMensual() {
  const { data } = await api.get('/analytics/tendencia-mensual')
  return data.data
}

export async function getPorGravedad() {
  const { data } = await api.get('/analytics/por-gravedad')
  return data.data
}

export async function getTopEstudiantes() {
  const { data } = await api.get('/analytics/top-estudiantes')
  return data.data
}

export async function getTiempoResolucion() {
  const { data } = await api.get('/analytics/tiempo-resolucion')
  return data.data
}
