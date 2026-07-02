const DB_NAME = 'siga-offline-queue'
const STORE_NAME = 'pending-requests'
const DB_VERSION = 1

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

export async function addToOfflineQueue(request) {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)

  const item = {
    ...request,
    timestamp: Date.now()
  }

  await store.add(item)
  return item
}

export async function getOfflineQueue() {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)

  return new Promise((resolve, reject) => {
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function removeFromOfflineQueue(id) {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)

  await store.delete(id)
}

export async function clearOfflineQueue() {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)

  await store.clear()
}

export async function syncOfflineQueue(apiClient) {
  const queue = await getOfflineQueue()

  const results = []
  for (const item of queue) {
    try {
      const response = await apiClient({
        method: item.method,
        url: item.url,
        data: item.data
      })

      await removeFromOfflineQueue(item.id)
      results.push({ success: true, item })
    } catch (error) {
      results.push({ success: false, item, error })
    }
  }

  return results
}
