import { useState, useEffect, useCallback } from 'react'
import { getSocket } from '@/services/socketService'
import { getNotificaciones, marcarComoLeida, getContadorNoLeidas, marcarTodasComoLeidas } from '@/services/notificacionesService'
import { useOptimisticUpdate } from './useOptimisticUpdate'
import toast from 'react-hot-toast'

export function useNotifications() {
  const [notificaciones, setNotificaciones] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const optimisticUpdate = useOptimisticUpdate()

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
    // Capture state at update time to avoid stale closures
    let oldNotificaciones
    let oldUnreadCount

    await optimisticUpdate({
      updateFn: () => {
        // Optimistic: mark as read immediately in UI
        setNotificaciones(prev => {
          oldNotificaciones = [...prev]  // Capture at update time
          return prev.map(n =>
            n.id === notificacionId ? { ...n, leida: true } : n
          )
        })
        setUnreadCount(prev => {
          oldUnreadCount = prev
          return Math.max(0, prev - 1)
        })
      },
      apiFn: () => marcarComoLeida(notificacionId),
      rollbackFn: () => {
        // Rollback to previous state on error
        setNotificaciones(oldNotificaciones)
        setUnreadCount(oldUnreadCount)
      },
      errorMessage: 'Error al marcar como leída'
    })
  }, [optimisticUpdate])

  const marcarTodasLeidas = useCallback(async () => {
    // Capture state at update time to avoid stale closures
    let oldNotificaciones
    let oldUnreadCount

    await optimisticUpdate({
      updateFn: () => {
        // Optimistic: mark all as read immediately in UI
        setNotificaciones(prev => {
          oldNotificaciones = [...prev]  // Capture at update time
          return prev.map(n => ({ ...n, leida: true }))
        })
        setUnreadCount(prev => {
          oldUnreadCount = prev
          return 0
        })
      },
      apiFn: () => marcarTodasComoLeidas(),
      rollbackFn: () => {
        // Rollback to previous state on error
        setNotificaciones(oldNotificaciones)
        setUnreadCount(oldUnreadCount)
      },
      successMessage: 'Todas las notificaciones marcadas como leídas',
      errorMessage: 'Error al marcar todas como leídas'
    })
  }, [optimisticUpdate])

  return {
    notificaciones,
    unreadCount,
    loading,
    marcarLeida,
    marcarTodasLeidas,
    refresh: loadNotificaciones
  }
}
