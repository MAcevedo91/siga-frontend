import { io } from 'socket.io-client'

let socket = null

export function initSocket(token) {
  if (socket && socket.connected) {
    return socket
  }
  if (socket) {
    socket.disconnect()
  }

  const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

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
