import api from './api'

export const loginRequest = (email, password) =>
  api.post('/auth/login', { email, password })
