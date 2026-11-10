import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import CursoSociogramaTab from '@/components/sociograma/CursoSociogramaTab'

vi.mock('@/services/sprint9Service', () => ({
  obtenerSociograma: vi.fn().mockResolvedValue({
    data: {
      curso: { id: 'curso-1', nombre: '4° Básico A' },
      nodes: [
        { id: '1', nombre: 'Lucas Castillo', conflictividad_total: 2, grado_centralidad: 2 },
        { id: '2', nombre: 'Mateo Araya', conflictividad_total: 1, grado_centralidad: 1 },
      ],
      links: [
        {
          source: '1',
          target: '2',
          weight: 1,
          tipo_vinculo: 'conflicto_leve',
          incidentes_count: 1,
          mediaciones_count: 1,
        },
      ],
      metricas: {
        total_estudiantes: 10,
        total_aristas_activas: 1,
        densidad_red_pct: 4.44,
        tasa_integracion_pct: 30,
        indice_cohesion: 59,
        diagnostico_clima: 'Cohesión moderada con dinámicas estables',
        estudiantes_aislados: 7,
      },
    },
  }),
}))

describe('CursoSociogramaTab', () => {
  it('renderiza las métricas de red, el grafo y la leyenda semafórica para el curso', async () => {
    render(<CursoSociogramaTab cursoId="curso-1" cursoNombre="4° Básico A" />)

    // Verifica que cargue los KPIs
    expect(await screen.findByText('Estudiantes en Red')).toBeInTheDocument()
    expect(screen.getByText('Densidad de la Red')).toBeInTheDocument()
    expect(screen.getByText('Tasa de Integración')).toBeInTheDocument()
    expect(screen.getByText('Índice de Cohesión')).toBeInTheDocument()

    // Verifica que se muestre el diagnóstico de clima
    expect(
      screen.getByText('Cohesión moderada con dinámicas estables'),
    ).toBeInTheDocument()

    // Verifica que se renderice el nombre del curso
    expect(screen.getByText('4° Básico A')).toBeInTheDocument()

    // Verifica botones de exportación
    expect(screen.getByRole('button', { name: /Exportar PNG/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Exportar PDF/i })).toBeInTheDocument()
  })

  it('muestra mensaje informativo cuando no se pasa un cursoId', () => {
    render(<CursoSociogramaTab cursoId="" />)
    expect(screen.getByText('Selecciona un curso')).toBeInTheDocument()
  })
})
