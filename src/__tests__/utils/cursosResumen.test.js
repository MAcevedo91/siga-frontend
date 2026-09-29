import { describe, expect, it } from 'vitest'
import { resumirIncidentesPorCurso } from '@/utils/cursosResumen'

const estudiantes = [
  { id: 'a', curso_id: '8a' },
  { id: 'b', curso_id: '8a' },
  { id: 'c', curso_id: '7b' },
]
const incidente = (id, fecha, gravedad, ids) => ({
  id, fecha, gravedad, incidente_estudiantes: ids.map((estudiante_id) => ({ estudiante_id })),
})

describe('resumirIncidentesPorCurso', () => {
  it('cuenta una vez por curso un incidente que involucra a varios alumnos y separa la gravedad', () => {
    const resumen = resumirIncidentesPorCurso(estudiantes, [
      incidente('i1', '2026-05-01', 'Leve', ['a', 'b']),
      incidente('i2', '2026-05-02', 'Grave', ['a', 'c']),
      incidente('i3', '2026-05-03', 'Gravísima', ['c']),
    ], 2026)
    expect(resumen['8a']).toEqual({ Leve: 1, Grave: 1, 'Gravísima': 0 })
    expect(resumen['7b']).toEqual({ Leve: 0, Grave: 1, 'Gravísima': 1 })
  })

  it('excluye años distintos, alumnos desconocidos y gravedades no reconocidas', () => {
    const resumen = resumirIncidentesPorCurso(estudiantes, [
      incidente('i1', '2025-12-31', 'Grave', ['a']),
      incidente('i2', '2026-01-01', 'Leve', ['desconocido']),
      incidente('i3', '2026-02-01', 'Otra', ['a']),
    ], 2026)
    expect(resumen).toEqual({})
  })
})
