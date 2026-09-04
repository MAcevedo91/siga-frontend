import { useEffect, useState } from 'react'
import { useOnlineStatus } from './useOnlineStatus'
import { syncOfflineQueue, getOfflineQueue } from '@/utils/offlineQueue'
import api from '@/services/api'
import toast from 'react-hot-toast'

export function useOfflineSync() {
  const isOnline = useOnlineStatus()
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)

  // Update pending count
  useEffect(() => {
    async function updateCount() {
      const queue = await getOfflineQueue()
      setPendingCount(queue.length)
    }

    updateCount()
    const interval = setInterval(updateCount, 5000)
    return () => clearInterval(interval)
  }, [])

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && pendingCount > 0 && !syncing) {
      setSyncing(true)

      syncOfflineQueue(api)
        .then(results => {
          const successful = results.filter(r => r.success).length
          const failed = results.filter(r => !r.success).length

          if (successful > 0) {
            toast.success(`${successful} cambios sincronizados`)
          }
          if (failed > 0) {
            toast.error(`${failed} cambios fallaron al sincronizar`)
          }

          setPendingCount(failed)
        })
        .catch(error => {
          console.error('Sync error:', error)
          toast.error('Error al sincronizar cambios')
        })
        .finally(() => {
          setSyncing(false)
        })
    }
  }, [isOnline, pendingCount, syncing])

  return {
    isOnline,
    pendingCount,
    syncing
  }
}
