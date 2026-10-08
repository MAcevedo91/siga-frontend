import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/services/api'
import {
  getRiceActivo,
  uploadRice,
  consultarRiceRag,
} from '@/services/riceService'

vi.mock('@/services/api')

describe('riceService (Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getRiceActivo llama a /rice/documento-activo y retorna datos', async () => {
    const mockData = { id: 'doc-1', nombre_archivo: 'rice.pdf', total_chunks: 10 }
    api.get.mockResolvedValueOnce({ data: { data: mockData } })

    const res = await getRiceActivo()
    expect(api.get).toHaveBeenCalledWith('/rice/documento-activo')
    expect(res).toEqual(mockData)
  })

  it('uploadRice envía FormData con multipart/form-data', async () => {
    const formData = new FormData()
    formData.append('archivo', new Blob(['test']), 'rice.pdf')

    const mockResponse = { documento: { id: 'doc-1' } }
    api.post.mockResolvedValueOnce({ data: { data: mockResponse } })

    const res = await uploadRice(formData)
    expect(api.post).toHaveBeenCalledWith(
      '/rice/upload',
      formData,
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    )
    expect(res).toEqual(mockResponse)
  })

  it('consultarRiceRag envía consulta y contexto opcional', async () => {
    const mockRes = {
      respuesta: 'Orientación RICE',
      fuentes: [{ articulo: 'Art. 1', seccion: 'Sec 1' }],
    }
    api.post.mockResolvedValueOnce({ data: { data: mockRes } })

    const res = await consultarRiceRag('¿Falta grave?', { id: 'inc-1' })
    expect(api.post).toHaveBeenCalledWith('/rice/consultar', {
      consulta: '¿Falta grave?',
      contexto_incidente: { id: 'inc-1' },
    })
    expect(res).toEqual(mockRes)
  })
})
