import api from './api'

export async function getNotificaciones() {
  const { data } = await api.get('/notificaciones')
  return data.data
}

export async function marcarComoLeida(notificacionId) {
  const { data } = await api.put(`/notificaciones/${notificacionId}/leer`)
  return data
}

export async function getContadorNoLeidas() {
  const { data } = await api.get('/notificaciones/contador')
  return data.data
}

export async function marcarTodasComoLeidas() {
  const { data } = await api.put('/notificaciones/leer-todas')
  return data
}
