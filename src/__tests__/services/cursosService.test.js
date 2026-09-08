import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/services/api'
import {
  getNiveles,
  getLetrasPorNivel,
  getEstudiantesPorCurso,
} from '@/services/cursosService'

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('cursosService (HU 5.5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getNiveles', () => {
    it('llama a GET /cursos/niveles y retorna la lista de niveles', async () => {
      const mockNiveles = ['1° Básico', '2° Básico', '3° Básico']
      api.get.mockResolvedValueOnce({
        data: { data: mockNiveles },
      })

      const result = await getNiveles()

      expect(api.get).toHaveBeenCalledWith('/cursos/niveles')
      expect(result).toEqual(mockNiveles)
    })
  })

  describe('getLetrasPorNivel', () => {
    it('llama a GET /cursos/letras con el parámetro nivel', async () => {
      const mockLetras = [
        { id: 'curso-1', letra: 'A', nombre: '1° Básico A', nivel: '1° Básico' },
        { id: 'curso-2', letra: 'B', nombre: '1° Básico B', nivel: '1° Básico' },
      ]
      api.get.mockResolvedValueOnce({
        data: { data: mockLetras },
      })

      const result = await getLetrasPorNivel('1° Básico')

      expect(api.get).toHaveBeenCalledWith('/cursos/letras', {
        params: { nivel: '1° Básico' },
      })
      expect(result).toEqual(mockLetras)
    })
  })

  describe('getEstudiantesPorCurso', () => {
    it('llama a GET /cursos/:id/estudiantes y retorna la nómina del curso', async () => {
      const mockEstudiantes = [
        { id: 'est-1', nombre: 'Juan', apellido: 'Araya', rut: '20.111.222-3', es_pie: false },
        { id: 'est-2', nombre: 'Sofía', apellido: 'Barrientos', rut: '20.333.444-5', es_pie: true },
      ]
      api.get.mockResolvedValueOnce({
        data: { data: mockEstudiantes },
      })

      const result = await getEstudiantesPorCurso('curso-1')

      expect(api.get).toHaveBeenCalledWith('/cursos/curso-1/estudiantes')
      expect(result).toEqual(mockEstudiantes)
    })
  })
})
