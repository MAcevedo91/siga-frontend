import api from './api'

export const loginRequest = async (email, password) => {
  const response = await api.post('/auth/login', { email, password })
  return response.data.data
}
