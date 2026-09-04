import { usePWA } from '@/hooks/usePWA'
import toast from 'react-hot-toast'
import { useEffect } from 'react'

export default function PWAUpdatePrompt() {
  const { needRefresh, offlineReady, updateServiceWorker } = usePWA()

  useEffect(() => {
    if (offlineReady) {
      toast.success('App lista para funcionar offline', { duration: 3000 })
    }
  }, [offlineReady])

  useEffect(() => {
    if (needRefresh) {
      toast((t) => (
        <div>
          <p className="font-semibold mb-2">Nueva versión disponible</p>
          <button
            onClick={() => {
              updateServiceWorker(true)
              toast.dismiss(t.id)
            }}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm mr-2"
          >
            Actualizar
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm"
          >
            Más tarde
          </button>
        </div>
      ), { duration: Infinity })
    }
  }, [needRefresh, updateServiceWorker])

  return null
}
