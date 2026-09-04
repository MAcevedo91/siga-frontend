import { useCallback } from 'react'
import toast from 'react-hot-toast'

/**
 * Hook for optimistic UI updates with automatic rollback on error
 *
 * Provides instant user feedback by updating UI immediately, then syncing
 * with the backend. If the API call fails, automatically rolls back to
 * the previous state.
 *
 * @returns {Function} optimisticUpdate function
 *
 * @example
 * // Example 1: Mark notification as read
 * const optimisticUpdate = useOptimisticUpdate()
 * const oldNotificaciones = [...notificaciones]
 *
 * await optimisticUpdate({
 *   updateFn: () => setNotificaciones(prev =>
 *     prev.map(n => n.id === id ? { ...n, leida: true } : n)
 *   ),
 *   apiFn: () => marcarComoLeida(id),
 *   rollbackFn: () => setNotificaciones(oldNotificaciones),
 *   errorMessage: 'Error al marcar como leída'
 * })
 *
 * @example
 * // Example 2: Update estudiante data
 * const oldEstudiantes = [...estudiantes]
 *
 * await optimisticUpdate({
 *   updateFn: () => setEstudiantes(prev =>
 *     prev.map(e => e.id === id ? { ...e, ...updatedData } : e)
 *   ),
 *   apiFn: () => updateEstudiante(id, updatedData),
 *   rollbackFn: () => setEstudiantes(oldEstudiantes),
 *   successMessage: 'Estudiante actualizado',
 *   errorMessage: 'Error al actualizar estudiante'
 * })
 *
 * @example
 * // Example 3: Delete incidente
 * const oldIncidentes = [...incidentes]
 *
 * await optimisticUpdate({
 *   updateFn: () => setIncidentes(prev => prev.filter(i => i.id !== id)),
 *   apiFn: () => deleteIncidente(id),
 *   rollbackFn: () => setIncidentes(oldIncidentes),
 *   successMessage: 'Incidente eliminado',
 *   errorMessage: 'Error al eliminar incidente'
 * })
 */
export function useOptimisticUpdate() {
  const optimisticUpdate = useCallback(async ({
    updateFn,
    apiFn,
    rollbackFn,
    successMessage,
    errorMessage = 'Error al actualizar'
  }) => {
    try {
      // 1. Optimistic update - apply UI changes immediately
      updateFn()

      // 2. API call - persist to backend
      await apiFn()

      // 3. Success feedback (optional)
      if (successMessage) {
        toast.success(successMessage)
      }
    } catch (error) {
      // 4. Rollback on error - restore previous state
      rollbackFn()
      toast.error(errorMessage)
      console.error('Optimistic update failed:', error)
    }
  }, [])

  return optimisticUpdate
}
