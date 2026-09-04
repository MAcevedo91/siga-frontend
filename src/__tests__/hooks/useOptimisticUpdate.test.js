import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useOptimisticUpdate } from '../../hooks/useOptimisticUpdate'
import toast from 'react-hot-toast'

vi.mock('react-hot-toast')

describe('useOptimisticUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should execute optimistic update successfully', async () => {
    const updateFn = vi.fn()
    const apiFn = vi.fn().mockResolvedValue()
    const successMessage = 'Success'

    const { result } = renderHook(() => useOptimisticUpdate())

    await act(async () => {
      await result.current({ updateFn, apiFn, successMessage })
    })

    expect(updateFn).toHaveBeenCalled()
    expect(apiFn).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith(successMessage)
  })

  it('should execute optimistic update without success message', async () => {
    const updateFn = vi.fn()
    const apiFn = vi.fn().mockResolvedValue()

    const { result } = renderHook(() => useOptimisticUpdate())

    await act(async () => {
      await result.current({ updateFn, apiFn })
    })

    expect(updateFn).toHaveBeenCalled()
    expect(apiFn).toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('should rollback on API error', async () => {
    const updateFn = vi.fn()
    const rollbackFn = vi.fn()
    const apiFn = vi.fn().mockRejectedValue(new Error('API Error'))
    const errorMessage = 'Failed'

    const { result } = renderHook(() => useOptimisticUpdate())

    await act(async () => {
      await result.current({ updateFn, apiFn, rollbackFn, errorMessage })
    })

    expect(updateFn).toHaveBeenCalled()
    expect(rollbackFn).toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith(errorMessage)
  })

  it('should use default error message if not provided', async () => {
    const updateFn = vi.fn()
    const rollbackFn = vi.fn()
    const apiFn = vi.fn().mockRejectedValue(new Error('API Error'))

    const { result } = renderHook(() => useOptimisticUpdate())

    await act(async () => {
      await result.current({ updateFn, apiFn, rollbackFn })
    })

    expect(updateFn).toHaveBeenCalled()
    expect(rollbackFn).toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith('Error al actualizar')
  })
})
