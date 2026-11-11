import { io } from 'socket.io-client'

let socket = null

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '')
  }
  return 'http://localhost:3000'
}

export function initSocket(token) {
  if (socket && socket.connected) {
    return socket
  }
  if (socket) {
    socket.disconnect()
  }

  const socketUrl = getSocketUrl()

  socket = io(socketUrl, {
    auth: {
      token
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  })

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id)
  })

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason)
  })

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message)
  })

  return socket
}

export function getSocket() {
  if (!socket) {
    console.warn('Socket not initialized. Call initSocket first.')
    return null
  }
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
