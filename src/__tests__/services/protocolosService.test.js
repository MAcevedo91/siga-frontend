import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/services/api'
import {
  getProtocolos,
  getProtocoloById,
  subirEvidenciaPaso,
  eliminarEvidenciaPaso,
  descargarExpedientePDF,
} from '@/services/protocolosService'

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('protocolosService — Evidencias y Expediente RICE (Hallazgo 7)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('subirEvidenciaPaso debe enviar FormData por POST', async () => {
    const mockFile = new File(['dummy content'], 'acta.pdf', { type: 'application/pdf' })
    const mockResponse = { id: 'ev-1', nombre_archivo: 'acta.pdf' }

    api.post.mockResolvedValueOnce({
      data: { data: mockResponse },
    })

    const resultado = await subirEvidenciaPaso('prot-123', 'paso-456', mockFile)

    expect(api.post).toHaveBeenCalledWith(
      '/protocolos/prot-123/pasos/paso-456/evidencias',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    )
    expect(resultado).toEqual(mockResponse)
  })

  it('eliminarEvidenciaPaso debe invocar DELETE al endpoint correspondiente', async () => {
    api.delete.mockResolvedValueOnce({
      data: { data: { success: true, id: 'ev-1' } },
    })

    const resultado = await eliminarEvidenciaPaso('prot-123', 'paso-456', 'ev-1')

    expect(api.delete).toHaveBeenCalledWith('/protocolos/prot-123/pasos/paso-456/evidencias/ev-1')
    expect(resultado).toEqual({ success: true, id: 'ev-1' })
  })

  it('descargarExpedientePDF debe solicitar el blob al backend y gatillar la descarga en el DOM', async () => {
    const mockBlobData = new Blob(['%PDF-1.4 Mock Expediente'], { type: 'application/pdf' })
    api.get.mockResolvedValueOnce({
      data: mockBlobData,
    })

    // Mock de URL.createObjectURL y revokeObjectURL
    const originalCreateObjectURL = window.URL.createObjectURL
    const originalRevokeObjectURL = window.URL.revokeObjectURL
    window.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/mock-blob-url')
    window.URL.revokeObjectURL = vi.fn()

    const appendChildSpy = vi.spyOn(document.body, 'appendChild')
    const removeChildSpy = vi.spyOn(document.body, 'removeChild')

    await descargarExpedientePDF('prot-123', 'Expediente_RICE_001.pdf')

    expect(api.get).toHaveBeenCalledWith('/protocolos/prot-123/expediente-pdf', {
      responseType: 'blob',
    })
    expect(window.URL.createObjectURL).toHaveBeenCalled()
    expect(appendChildSpy).toHaveBeenCalled()
    expect(removeChildSpy).toHaveBeenCalled()
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/mock-blob-url')

    window.URL.createObjectURL = originalCreateObjectURL
    window.URL.revokeObjectURL = originalRevokeObjectURL
    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
  })
})
