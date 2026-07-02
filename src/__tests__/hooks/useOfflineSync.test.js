import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useOfflineSync } from '../../hooks/useOfflineSync'
import * as offlineQueue from '../../utils/offlineQueue'
import toast from 'react-hot-toast'

vi.mock('react-hot-toast')
vi.mock('../../hooks/useOnlineStatus', () => ({
  useOnlineStatus: vi.fn(() => true)
}))
vi.mock('../../utils/offlineQueue')
vi.mock('../../services/api')

describe('useOfflineSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    offlineQueue.getOfflineQueue.mockResolvedValue([])
    offlineQueue.syncOfflineQueue.mockResolvedValue([])
  })

  it('should initialize and return isOnline status', async () => {
    const { result } = renderHook(() => useOfflineSync())

    expect(result.current.isOnline).toBe(true)
    expect(result.current.pendingCount).toBe(0)
    expect(result.current.syncing).toBe(false)
  })

  it('should call getOfflineQueue on mount', async () => {
    renderHook(() => useOfflineSync())

    await waitFor(() => {
      expect(offlineQueue.getOfflineQueue).toHaveBeenCalled()
    })
  })

  it('should have correct initial state structure', () => {
    const { result } = renderHook(() => useOfflineSync())

    expect(result.current).toHaveProperty('isOnline')
    expect(result.current).toHaveProperty('pendingCount')
    expect(result.current).toHaveProperty('syncing')
  })

  it('should expose isOnline, pendingCount, and syncing properties', () => {
    const { result } = renderHook(() => useOfflineSync())

    expect(typeof result.current.isOnline).toBe('boolean')
    expect(typeof result.current.pendingCount).toBe('number')
    expect(typeof result.current.syncing).toBe('boolean')
  })
})
