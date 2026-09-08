import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/services/api'
import {
  getConfiguracion,
  updateConfiguracion,
  updateReglaProtocolo,
} from '@/services/configuracionService'

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}))

describe('configuracionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getConfiguracion', () => {
    it('llama a GET /configuracion y retorna los datos recibidos', async () => {
      const mockResponse = {
        data: {
          data: {
            parametros: {
              umbral_riesgo: 6,
              ventana_dias_riesgo: 30,
              ventana_dias_reincidencia: 45,
              ventana_dias_escalada: 15,
            },
            reglas: [
              {
                id: 'regla-1',
                accion: 'Notificación apoderado',
                plazo_dias: 2,
                prorrogable: false,
                activo: true,
              },
            ],
          },
        },
      }
      api.get.mockResolvedValueOnce(mockResponse)

      const result = await getConfiguracion()

      expect(api.get).toHaveBeenCalledWith('/configuracion')
      expect(result).toEqual(mockResponse.data.data)
    })
  })

  describe('updateConfiguracion', () => {
    it('llama a PUT /configuracion con el payload correspondiente', async () => {
      const payload = {
        umbral_riesgo: 7,
        ventana_dias_riesgo: 35,
        ventana_dias_reincidencia: 50,
        ventana_dias_escalada: 20,
      }
      const mockResponse = {
        data: {
          data: {
            ...payload,
            updated_at: '2026-09-08T18:00:00.000Z',
          },
        },
      }
      api.put.mockResolvedValueOnce(mockResponse)

      const result = await updateConfiguracion(payload)

      expect(api.put).toHaveBeenCalledWith('/configuracion', payload)
      expect(result).toEqual(mockResponse.data.data)
    })
  })

  describe('updateReglaProtocolo', () => {
    it('llama a PUT /configuracion/reglas/:id con el payload de plazo u opciones', async () => {
      const reglaId = 'regla-uuid-123'
      const payload = { plazo_dias: 5, prorrogable: true }
      const mockResponse = {
        data: {
          data: {
            id: reglaId,
            plazo_dias: 5,
            prorrogable: true,
          },
        },
      }
      api.put.mockResolvedValueOnce(mockResponse)

      const result = await updateReglaProtocolo(reglaId, payload)

      expect(api.put).toHaveBeenCalledWith(`/configuracion/reglas/${reglaId}`, payload)
      expect(result).toEqual(mockResponse.data.data)
    })
  })
})
