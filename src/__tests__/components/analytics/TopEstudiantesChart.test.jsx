import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import TopEstudiantesChart from '@/components/analytics/TopEstudiantesChart'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('TopEstudiantesChart Component (Tabla Ejecutiva)', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('debe renderizar estado vacío honesto cuando no hay estudiantes', () => {
    render(
      <BrowserRouter>
        <TopEstudiantesChart data={[]} loading={false} />
      </BrowserRouter>
    )

    expect(screen.getByText('Focalización Prioritaria')).toBeInTheDocument()
    expect(
      screen.getByText(/no se registran estudiantes con reiteración de incidentes/i)
    ).toBeInTheDocument()
  })

  it('debe renderizar la tabla con estudiantes reales, cursos y alertas correspondientes', () => {
    const mockData = [
      {
        id: 'est-1',
        estudiante_id: 'est-1',
        nombre: 'Carlos',
        apellido: 'Pérez',
        curso_nombre: '8° Básico A',
        cantidad_incidentes: 5,
      },
      {
        id: 'est-2',
        estudiante_id: 'est-2',
        nombre: 'Ana',
        apellido: 'Gómez',
        curso_nombre: '1° Medio B',
        cantidad_incidentes: 2,
      },
    ]

    render(
      <BrowserRouter>
        <TopEstudiantesChart data={mockData} loading={false} />
      </BrowserRouter>
    )

    expect(screen.getByText('Focalización Prioritaria')).toBeInTheDocument()
    expect(screen.getByText('Carlos Pérez')).toBeInTheDocument()
    expect(screen.getByText('8° Básico A')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('Alto Riesgo')).toBeInTheDocument()

    expect(screen.getByText('Ana Gómez')).toBeInTheDocument()
    expect(screen.getByText('1° Medio B')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Atención')).toBeInTheDocument()

    // Clic en la fila
    fireEvent.click(screen.getByText('Carlos Pérez'))
    expect(mockNavigate).toHaveBeenCalledWith('/estudiantes/est-1')
  })
})
