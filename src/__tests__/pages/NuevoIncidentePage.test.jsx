import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import NuevoIncidentePage from '@/pages/NuevoIncidentePage'
import * as incidentesService from '@/services/incidentesService'
import * as cursosService from '@/services/cursosService'

vi.mock('@/services/incidentesService', () => ({
  createIncidente: vi.fn(),
  getTiposAbordaje: vi.fn(),
  buscarEstudiantes: vi.fn(),
}))

vi.mock('@/services/cursosService', () => ({
  getNiveles: vi.fn(),
  getLetrasPorNivel: vi.fn(),
  getEstudiantesPorCurso: vi.fn(),
}))

describe('NuevoIncidentePage con SelectorEstudianteCascada (HU 5.5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    incidentesService.getTiposAbordaje.mockResolvedValue([
      { id: 1, nombre: 'Formativo' },
    ])
    cursosService.getNiveles.mockResolvedValue(['1° Básico'])
    cursosService.getLetrasPorNivel.mockResolvedValue([
      { id: 'curso-1a', letra: 'A', nombre: '1° Básico A', nivel: '1° Básico' },
    ])
    cursosService.getEstudiantesPorCurso.mockResolvedValue([
      { id: 'est-1', nombre: 'Camila', apellido: 'Fuentes', rut: '23.111.222-3', es_pie: true },
      { id: 'est-2', nombre: 'Diego', apellido: 'Garrido', rut: '23.444.555-6', es_pie: false },
    ])
  })

  it('permite seleccionar múltiples estudiantes mediante el selector en cascada', async () => {
    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <NuevoIncidentePage />
      </BrowserRouter>
    )

    expect(screen.getByText('Registrar Nuevo Incidente')).toBeInTheDocument()

    // 1. Elegir nivel
    await waitFor(() => {
      expect(screen.getByRole('option', { name: '1° Básico' })).toBeInTheDocument()
    })
    await user.selectOptions(screen.getByLabelText(/Seleccionar Nivel Escolar/i), '1° Básico')

    // 2. Elegir letra
    await waitFor(() => {
      expect(screen.getByRole('option', { name: '1° Básico A' })).toBeInTheDocument()
    })
    await user.selectOptions(screen.getByLabelText(/Seleccionar Letra del Curso/i), 'curso-1a')

    // 3. Ver lista de alumnos
    await waitFor(() => {
      expect(screen.getByText('Fuentes')).toBeInTheDocument()
      expect(screen.getByText('Garrido')).toBeInTheDocument()
    })

    // 4. Agregar primer estudiante
    const selectButtons = screen.getAllByRole('button', { name: /Seleccionar/i })
    await user.click(selectButtons[0]) // Camila Fuentes

    // Debe aparecer en la lista de involucrados del formulario
    expect(screen.getByText('Camila Fuentes')).toBeInTheDocument()
    expect(screen.getByText('Es víctima')).toBeInTheDocument()

    // 5. Agregar segundo estudiante
    const remainingSelectButtons = screen.getAllByRole('button', { name: /Seleccionar/i })
    await user.click(remainingSelectButtons[0]) // Diego Garrido

    expect(screen.getByText('Diego Garrido')).toBeInTheDocument()
  })
})
