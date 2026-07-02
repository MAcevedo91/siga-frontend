import { useState, useEffect, useCallback } from 'react'
import { getSocket } from '@/services/socketService'
import { getNotificaciones, marcarComoLeida, getContadorNoLeidas } from '@/services/notificacionesService'
import toast from 'react-hot-toast'

export function useNotifications() {
  const [notificaciones, setNotificaciones] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadNotificaciones = useCallback(async () => {
    try {
      const data = await getNotificaciones()
      setNotificaciones(data)

      const { count } = await getContadorNoLeidas()
      setUnreadCount(count)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotificaciones()

    // Listen for real-time notifications
    const socket = getSocket()

    socket.on('notificacion:nueva', (notificacion) => {
      console.log('Nueva notificación recibida:', notificacion)

      // Add to list
      setNotificaciones(prev => [notificacion, ...prev])
      setUnreadCount(prev => prev + 1)

      // Show toast
      toast.success(notificacion.titulo, {
        duration: 4000,
        icon: '🔔'
      })
    })

    return () => {
      socket.off('notificacion:nueva')
    }
  }, [loadNotificaciones])

  const marcarLeida = useCallback(async (notificacionId) => {
    try {
      await marcarComoLeida(notificacionId)

      setNotificaciones(prev =>
        prev.map(n =>
          n.id === notificacionId ? { ...n, leida: true } : n
        )
      )

      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Error al marcar como leída')
    }
  }, [])

  return {
    notificaciones,
    unreadCount,
    loading,
    marcarLeida,
    refresh: loadNotificaciones
  }
}
