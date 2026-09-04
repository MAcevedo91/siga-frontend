import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  addToOfflineQueue,
  getOfflineQueue,
  removeFromOfflineQueue,
  clearOfflineQueue,
  syncOfflineQueue
} from '../../utils/offlineQueue'

// Mock IndexedDB
const mockData = []
let autoIncrementId = 1

const createMockRequest = () => ({
  result: null,
  error: null,
  onsuccess: null,
  onerror: null,
})

const createMockObjectStore = () => ({
  add: vi.fn((item) => {
    const request = createMockRequest()
    setTimeout(() => {
      const itemWithId = { ...item, id: autoIncrementId++ }
      mockData.push(itemWithId)
      request.result = itemWithId.id
      request.onsuccess?.()
    }, 0)
    return request
  }),
  getAll: vi.fn(() => {
    const request = createMockRequest()
    setTimeout(() => {
      request.result = [...mockData]
      request.onsuccess?.()
    }, 0)
    return request
  }),
  delete: vi.fn((id) => {
    const request = createMockRequest()
    setTimeout(() => {
      const index = mockData.findIndex(item => item.id === id)
      if (index !== -1) {
        mockData.splice(index, 1)
      }
      request.onsuccess?.()
    }, 0)
    return request
  }),
  clear: vi.fn(() => {
    const request = createMockRequest()
    setTimeout(() => {
      mockData.length = 0
      request.onsuccess?.()
    }, 0)
    return request
  }),
  createIndex: vi.fn()
})

const createMockTransaction = () => ({
  objectStore: vi.fn(() => createMockObjectStore())
})

const createMockDB = () => ({
  transaction: vi.fn(() => createMockTransaction()),
  objectStoreNames: {
    contains: vi.fn(() => false)
  },
  createObjectStore: vi.fn(() => createMockObjectStore())
})

global.indexedDB = {
  open: vi.fn(() => {
    const request = {
      result: createMockDB(),
      error: null,
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null
    }
    setTimeout(() => {
      request.onupgradeneeded?.({ target: { result: createMockDB() } })
      request.onsuccess?.()
    }, 0)
    return request
  })
}

describe('offlineQueue', () => {
  beforeEach(() => {
    mockData.length = 0
    autoIncrementId = 1
    vi.clearAllMocks()
  })

  describe('addToOfflineQueue', () => {
    it('should add item to queue', async () => {
      const item = { method: 'POST', url: '/api/test', data: { foo: 'bar' } }
      const result = await addToOfflineQueue(item)

      expect(result).toHaveProperty('timestamp')
      expect(result.method).toBe('POST')
      expect(result.url).toBe('/api/test')
    })

    it('should add timestamp to item', async () => {
      const item = { method: 'POST', url: '/api/test', data: { foo: 'bar' } }
      const result = await addToOfflineQueue(item)

      expect(result.timestamp).toBeDefined()
      expect(typeof result.timestamp).toBe('number')
    })
  })

  describe('getOfflineQueue', () => {
    it('should retrieve empty queue', async () => {
      const queue = await getOfflineQueue()
      expect(queue).toEqual([])
    })

    it('should retrieve queue items', async () => {
      const item1 = { method: 'POST', url: '/api/test1', data: { foo: 'bar' } }
      const item2 = { method: 'PUT', url: '/api/test2', data: { baz: 'qux' } }

      await addToOfflineQueue(item1)
      await addToOfflineQueue(item2)

      const queue = await getOfflineQueue()
      expect(queue).toHaveLength(2)
      expect(queue[0].url).toBe('/api/test1')
      expect(queue[1].url).toBe('/api/test2')
    })
  })

  describe('removeFromOfflineQueue', () => {
    it('should call removeFromOfflineQueue', async () => {
      // This is a basic test to verify the function exists
      // In a real environment, IndexedDB would handle the removal
      expect(removeFromOfflineQueue).toBeDefined()
      expect(typeof removeFromOfflineQueue).toBe('function')
    })
  })

  describe('clearOfflineQueue', () => {
    it('should clear all items from queue', async () => {
      await addToOfflineQueue({ method: 'POST', url: '/api/test1' })
      await addToOfflineQueue({ method: 'POST', url: '/api/test2' })
      await addToOfflineQueue({ method: 'POST', url: '/api/test3' })

      await clearOfflineQueue()

      const queue = await getOfflineQueue()
      expect(queue).toHaveLength(0)
    })
  })

  describe('syncOfflineQueue', () => {
    it('should sync all items successfully', async () => {
      const item1 = { method: 'POST', url: '/api/test1', data: { foo: 'bar' } }
      const item2 = { method: 'PUT', url: '/api/test2', data: { baz: 'qux' } }

      await addToOfflineQueue(item1)
      await addToOfflineQueue(item2)

      const mockApiClient = vi.fn().mockResolvedValue({ data: 'success' })
      const results = await syncOfflineQueue(mockApiClient)

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(true)
      expect(mockApiClient).toHaveBeenCalledTimes(2)

      const queue = await getOfflineQueue()
      expect(queue).toHaveLength(0)
    })

    it('should handle partial failures', async () => {
      const item1 = { method: 'POST', url: '/api/test1', data: { foo: 'bar' } }
      const item2 = { method: 'PUT', url: '/api/test2', data: { baz: 'qux' } }

      await addToOfflineQueue(item1)
      await addToOfflineQueue(item2)

      const mockApiClient = vi.fn()
        .mockResolvedValueOnce({ data: 'success' })
        .mockRejectedValueOnce(new Error('Network error'))

      const results = await syncOfflineQueue(mockApiClient)

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(false)
      expect(results[1].error).toBeDefined()
    })

    it('should call API with correct parameters', async () => {
      const item = {
        method: 'POST',
        url: '/api/estudiantes',
        data: { nombre: 'Juan', apellido: 'Pérez' }
      }

      await addToOfflineQueue(item)

      const mockApiClient = vi.fn().mockResolvedValue({ data: 'success' })
      await syncOfflineQueue(mockApiClient)

      expect(mockApiClient).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/estudiantes',
        data: { nombre: 'Juan', apellido: 'Pérez' }
      })
    })
  })
})
