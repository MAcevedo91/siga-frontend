import { useOfflineSync } from '@/hooks/useOfflineSync'
import { WifiOff, Cloud, Loader2 } from 'lucide-react'

export default function OfflineIndicator() {
  const { isOnline, pendingCount, syncing } = useOfflineSync()

  if (isOnline && pendingCount === 0) return null

  return (
    <div className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${
      isOnline ? 'bg-blue-600 text-white' : 'bg-gray-800 text-white'
    }`}>
      {!isOnline && (
        <>
          <WifiOff className="w-5 h-5" />
          <span>Sin conexión</span>
        </>
      )}

      {isOnline && pendingCount > 0 && (
        <>
          {syncing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Sincronizando...</span>
            </>
          ) : (
            <>
              <Cloud className="w-5 h-5" />
              <span>{pendingCount} pendiente{pendingCount > 1 ? 's' : ''}</span>
            </>
          )}
        </>
      )}
    </div>
  )
}
