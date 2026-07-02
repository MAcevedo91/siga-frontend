import { io } from 'socket.io-client'

let socket = null

export function initSocket(token) {
  if (socket) {
    socket.disconnect()
  }

  socket = io(import.meta.env.VITE_SOCKET_URL, {
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
    throw new Error('Socket not initialized. Call initSocket first.')
  }
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
