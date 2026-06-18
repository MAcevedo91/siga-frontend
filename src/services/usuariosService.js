import api from './api'

export const getUsuarios = async () => {
  const response = await api.get('/api/v1/usuarios')
  return response.data.data
}

export const createUsuario = async (usuarioData) => {
  const response = await api.post('/api/v1/usuarios', usuarioData)
  return response.data.data
}

export const updateUsuario = async (id, usuarioData) => {
  const response = await api.put(`/api/v1/usuarios/${id}`, usuarioData)
  return response.data.data
}

export const desactivarUsuario = async (id) => {
  const response = await api.patch(`/api/v1/usuarios/${id}/desactivar`)
  return response.data.data
}
