import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/services/api'
import {
  getReportesIncidente,
  getReporteById,
  generarBorradoresReporte,
  guardarBorradorReporte,
  aprobarReporte,
  descargarReportePdf,
} from '@/services/reportesService'

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('reportesService (HU 6.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getReportesIncidente', () => {
    it('llama a GET /incidentes/:id/reportes y retorna la lista de reportes', async () => {
      const mockReportes = [
        { id: 'rep-1', estado: 'Borrador', estudiante_id: 'est-1' },
      ]
      api.get.mockResolvedValueOnce({
        data: { data: mockReportes },
      })

      const result = await getReportesIncidente('inc-123')

      expect(api.get).toHaveBeenCalledWith('/incidentes/inc-123/reportes')
      expect(result).toEqual(mockReportes)
    })
  })

  describe('getReporteById', () => {
    it('llama a GET /incidentes/:id/reportes/:reporteId y retorna el reporte', async () => {
      const mockReporte = { id: 'rep-1', estado: 'Borrador' }
      api.get.mockResolvedValueOnce({
        data: { data: mockReporte },
      })

      const result = await getReporteById('inc-123', 'rep-1')

      expect(api.get).toHaveBeenCalledWith('/incidentes/inc-123/reportes/rep-1')
      expect(result).toEqual(mockReporte)
    })
  })

  describe('generarBorradoresReporte', () => {
    it('llama a POST /incidentes/:id/borrador-reporte y retorna los borradores creados', async () => {
      const mockReportesGenerados = [
        { id: 'rep-1', estado: 'Borrador', contenido_borrador: { contexto: 'Patio escolar' } },
      ]
      api.post.mockResolvedValueOnce({
        data: { data: mockReportesGenerados },
      })

      const result = await generarBorradoresReporte('inc-123')

      expect(api.post).toHaveBeenCalledWith('/incidentes/inc-123/borrador-reporte')
      expect(result).toEqual(mockReportesGenerados)
    })
  })

  describe('guardarBorradorReporte', () => {
    it('llama a PATCH /incidentes/:id/reportes/:reporteId con contenido_editado', async () => {
      const contenidoEditado = {
        contexto: 'Contexto editado',
        hechos_objetivos: 'Hechos objetivos',
        medidas_adoptadas: 'Medidas',
        acuerdos_compromisos: 'Acuerdos',
        plan_seguimiento: 'Seguimiento',
      }
      const mockActualizado = { id: 'rep-1', contenido_editado: contenidoEditado }

      api.patch.mockResolvedValueOnce({
        data: { data: mockActualizado },
      })

      const result = await guardarBorradorReporte('inc-123', 'rep-1', contenidoEditado)

      expect(api.patch).toHaveBeenCalledWith('/incidentes/inc-123/reportes/rep-1', {
        contenido_editado: contenidoEditado,
      })
      expect(result).toEqual(mockActualizado)
    })
  })

  describe('aprobarReporte', () => {
    it('llama a POST /incidentes/:id/reportes/:reporteId/aprobar con contenido_final', async () => {
      const contenidoFinal = {
        contexto: 'Contexto definitivo',
      }
      const mockAprobado = { id: 'rep-1', estado: 'Aprobado', contenido_aprobado: contenidoFinal }

      api.post.mockResolvedValueOnce({
        data: { data: mockAprobado },
      })

      const result = await aprobarReporte('inc-123', 'rep-1', contenidoFinal)

      expect(api.post).toHaveBeenCalledWith('/incidentes/inc-123/reportes/rep-1/aprobar', {
        contenido_final: contenidoFinal,
      })
      expect(result).toEqual(mockAprobado)
    })
  })

  describe('descargarReportePdf', () => {
    it('solicita blob PDF y dispara la descarga en el DOM', async () => {
      const mockBlob = new Blob(['pdf-binary-mock'], { type: 'application/pdf' })
      api.get.mockResolvedValueOnce({
        data: mockBlob,
      })

      // Mocks de URL y appendChild
      window.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/mock-url')
      window.URL.revokeObjectURL = vi.fn()

      await descargarReportePdf('inc-123', 'rep-1', 'test_informe.pdf')

      expect(api.get).toHaveBeenCalledWith('/incidentes/inc-123/reportes/rep-1/pdf', {
        responseType: 'blob',
      })
      expect(window.URL.createObjectURL).toHaveBeenCalled()
      expect(window.URL.revokeObjectURL).toHaveBeenCalled()
    })
  })
})
