import { create } from 'zustand'

const getStoredUser = () => {
  try {
    const item = localStorage.getItem('user')
    return item ? JSON.parse(item) : null
  } catch {
    return null
  }
}

export const getDefaultRouteByRole = (rol) => {
  switch (rol) {
    case 'Docente':
      return '/asistencia'
    case 'Inspector':
      return '/incidentes'
    case 'Administrador':
    case 'Equipo de Formación':
    case 'Directivo':
    default:
      return '/dashboard'
  }
}

const useAuthStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  user: getStoredUser(),
  isAuthenticated: !!localStorage.getItem('token'),

  login: (token, user) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ token, user, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ token: null, user: null, isAuthenticated: false })
  },
}))

export const useAuth = () => useAuthStore()

export default useAuthStore

