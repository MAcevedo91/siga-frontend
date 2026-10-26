import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '@/services/api'
import * as mediaciones from '@/services/mediacionesService'
import {
  getSemaforo,
  validarNuevaMediacion,
  fechaLocal,
} from '@/utils/mediaciones'
vi.mock('@/services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn() },
}))
beforeEach(() => vi.resetAllMocks())
describe('Contratos de mediación', () => {
  it('preserva paginación y obtiene el detalle sin perder participantes', async () => {
    api.get.mockResolvedValueOnce({
      data: { data: [{ id: 'm' }], total: 21, totalPages: 3 },
    })
    expect(await mediaciones.listarMediaciones({ page: 2 })).toMatchObject({
      total: 21,
      totalPages: 3,
    })
    expect(api.get).toHaveBeenCalledWith('/mediaciones', {
      params: { page: 2 },
    })
    api.get.mockResolvedValueOnce({
      data: { data: { id: 'm', mediacion_participantes: [] } },
    })
    expect(await mediaciones.obtenerMediacion('m')).toHaveProperty(
      'mediacion_participantes',
    )
  })
  it('separa crear del aviso y no declara éxito si falla el despacho', async () => {
    api.post.mockResolvedValueOnce({ data: { data: { id: 'm' } } })
    expect(await mediaciones.crearMediacion({ motivo: 'Prueba' })).toEqual({
      id: 'm',
    })
    expect(api.post).toHaveBeenCalledOnce()
    api.post.mockRejectedValueOnce(new Error('Sin correo'))
    await expect(mediaciones.despacharActa('m')).rejects.toThrow('Sin correo')
  })
  it('envía acuerdos, evaluaciones y cierre con los métodos del backend', async () => {
    for (const method of ['put', 'patch'])
      api[method].mockResolvedValue({ data: { data: { ok: true } } })
    await mediaciones.guardarCompromisos('m', { compromisos: [] })
    await mediaciones.evaluarCompromisos('m', { evaluaciones: [] })
    await mediaciones.cerrarMediacion('m', { estado: 'acordada' })
    expect(api.put).toHaveBeenCalledWith('/mediaciones/m/compromisos', {
      compromisos: [],
    })
    expect(api.patch).toHaveBeenCalledWith(
      '/mediaciones/m/evaluar-compromisos',
      { evaluaciones: [] },
    )
    expect(api.patch).toHaveBeenCalledWith('/mediaciones/m/cerrar', {
      estado: 'acordada',
    })
  })
})
describe('Semáforo de compromisos', () => {
  const now = new Date('2026-10-26T15:00:00-03:00')
  it('distingue vencido, próximo y en plazo con fechas sin hora', () => {
    expect(
      getSemaforo(
        { mediacion_compromisos: [{ fecha_limite: '2026-10-25' }] },
        now,
      ).key,
    ).toBe('vencido')
    expect(
      getSemaforo(
        { mediacion_compromisos: [{ fecha_limite: '2026-10-27' }] },
        now,
      ).key,
    ).toBe('proximo')
    expect(
      getSemaforo(
        { mediacion_compromisos: [{ fecha_limite: '2026-11-01' }] },
        now,
      ).key,
    ).toBe('plazo')
  })
  it('no cierra una mediación acordada sin sello ni marca acuerdos cumplidos como vencidos', () => {
    expect(
      getSemaforo(
        {
          estado: 'acordada',
          mediacion_compromisos: [{ fecha_limite: '2026-10-20' }],
        },
        now,
      ).key,
    ).toBe('vencido')
    expect(getSemaforo({ cerrada_at: now.toISOString() }, now).key).toBe(
      'cerrada',
    )
    expect(
      getSemaforo(
        {
          mediacion_compromisos: [
            { fecha_limite: '2026-10-20', estado: 'cumplido' },
          ],
        },
        now,
      ).key,
    ).toBe('evaluado')
  })
  it('rechaza participantes duplicados y muestra una fecha chilena válida', () => {
    expect(
      validarNuevaMediacion({
        motivo: 'Relato suficiente',
        fecha_programada: '2026-11-01T10:00',
        participantes: [{ estudiante_id: '1' }, { estudiante_id: '1' }],
      }),
    ).toMatch(/distintos/i)
    expect(fechaLocal(now)).toBe('2026-10-26')
  })
})
