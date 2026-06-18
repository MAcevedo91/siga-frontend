import api from './api'

export const getUsuarios = async () => {
  const response = await api.get('/usuarios')
  return response.data.data
}

export const createUsuario = async (usuarioData) => {
  const response = await api.post('/usuarios', usuarioData)
  return response.data.data
}

export const updateUsuario = async (id, usuarioData) => {
  const response = await api.put(`/usuarios/${id}`, usuarioData)
  return response.data.data
}

export const desactivarUsuario = async (id) => {
  const response = await api.patch(`/usuarios/${id}/desactivar`)
  return response.data.data
}
