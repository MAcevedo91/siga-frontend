import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function usePWA() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)

  const {
    needRefresh: [needRefreshState, setNeedRefreshState],
    offlineReady: [offlineReadyState, setOfflineReadyState],
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r)
    },
    onRegisterError(error) {
      console.error('SW registration error', error)
    }
  })

  useEffect(() => {
    setNeedRefresh(needRefreshState)
    setOfflineReady(offlineReadyState)
  }, [needRefreshState, offlineReadyState])

  return {
    needRefresh,
    offlineReady,
    updateServiceWorker
  }
}
