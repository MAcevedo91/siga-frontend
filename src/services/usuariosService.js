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

export const subirAvatarUsuario = async (id, file) => {
  const formData = new FormData()
  formData.append('avatar', file)
  const response = await api.post(`/usuarios/${id}/avatar`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data.data
}

export const eliminarAvatarUsuario = async (id) => {
  const response = await api.delete(`/usuarios/${id}/avatar`)
  return response.data.data
}
