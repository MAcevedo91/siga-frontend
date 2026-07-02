import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useNotifications } from '../../hooks/useNotifications'
import * as socketService from '../../services/socketService'
import * as notificacionesService from '../../services/notificacionesService'
import toast from 'react-hot-toast'

vi.mock('react-hot-toast')
vi.mock('../../services/socketService')
vi.mock('../../services/notificacionesService')
vi.mock('../../hooks/useOptimisticUpdate', () => ({
  useOptimisticUpdate: () => vi.fn(async ({ updateFn, apiFn, rollbackFn, errorMessage }) => {
    try {
      updateFn()
      await apiFn()
    } catch (error) {
      rollbackFn()
    }
  })
}))

describe('useNotifications', () => {
  const mockSocket = {
    on: vi.fn(),
    off: vi.fn()
  }

  const mockNotificaciones = [
    { id: 1, titulo: 'Test 1', mensaje: 'Message 1', leida: false },
    { id: 2, titulo: 'Test 2', mensaje: 'Message 2', leida: true }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    socketService.getSocket.mockReturnValue(mockSocket)
    notificacionesService.getNotificaciones.mockResolvedValue(mockNotificaciones)
    notificacionesService.getContadorNoLeidas.mockResolvedValue({ count: 1 })
    notificacionesService.marcarComoLeida.mockResolvedValue()
    notificacionesService.marcarTodasComoLeidas.mockResolvedValue()
  })

  it('should load notifications on mount', async () => {
    const { result } = renderHook(() => useNotifications())

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.notificaciones).toEqual(mockNotificaciones)
    expect(result.current.unreadCount).toBe(1)
  })

  it('should setup socket listener for new notifications', async () => {
    renderHook(() => useNotifications())

    await waitFor(() => {
      expect(mockSocket.on).toHaveBeenCalledWith('notificacion:nueva', expect.any(Function))
    })
  })

  it('should add new notification from socket event', async () => {
    const { result } = renderHook(() => useNotifications())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const newNotificacion = { id: 3, titulo: 'New', mensaje: 'New message', leida: false }
    const socketCallback = mockSocket.on.mock.calls.find(call => call[0] === 'notificacion:nueva')[1]

    act(() => {
      socketCallback(newNotificacion)
    })

    await waitFor(() => {
      expect(result.current.notificaciones[0]).toEqual(newNotificacion)
      expect(result.current.unreadCount).toBe(2)
    })
  })

  it('should mark notification as read', async () => {
    const { result } = renderHook(() => useNotifications())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.marcarLeida(1)
    })

    expect(notificacionesService.marcarComoLeida).toHaveBeenCalledWith(1)
  })

  it('should mark all notifications as read', async () => {
    const { result } = renderHook(() => useNotifications())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.marcarTodasLeidas()
    })

    expect(notificacionesService.marcarTodasComoLeidas).toHaveBeenCalled()
  })

  it('should cleanup socket listener on unmount', async () => {
    const { unmount } = renderHook(() => useNotifications())

    await waitFor(() => {
      expect(mockSocket.on).toHaveBeenCalled()
    })

    unmount()

    expect(mockSocket.off).toHaveBeenCalledWith('notificacion:nueva')
  })
})
