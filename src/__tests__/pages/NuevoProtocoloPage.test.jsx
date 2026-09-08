import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import NuevoProtocoloPage from '@/pages/NuevoProtocoloPage'
import * as protocolosService from '@/services/protocolosService'
import * as cursosService from '@/services/cursosService'

vi.mock('@/services/protocolosService', () => ({
  createProtocolo: vi.fn(),
  getTiposProtocolo: vi.fn(),
  getIncidentesByEstudiante: vi.fn(),
}))

vi.mock('@/services/cursosService', () => ({
  getNiveles: vi.fn(),
  getLetrasPorNivel: vi.fn(),
  getEstudiantesPorCurso: vi.fn(),
}))

vi.mock('@/services/incidentesService', () => ({
  buscarEstudiantes: vi.fn(),
}))

vi.mock('@/services/estudiantesService', () => ({
  getAntecedentesEscalada: vi.fn().mockResolvedValue(null),
}))

describe('NuevoProtocoloPage con SelectorEstudianteCascada (HU 5.5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    protocolosService.getTiposProtocolo.mockResolvedValue([
      { id: 1, nombre: 'Maltrato entre estudiantes' },
    ])
    protocolosService.getIncidentesByEstudiante.mockResolvedValue([])
    cursosService.getNiveles.mockResolvedValue(['2° Básico'])
    cursosService.getLetrasPorNivel.mockResolvedValue([
      { id: 'curso-2b', letra: 'B', nombre: '2° Básico B', nivel: '2° Básico' },
    ])
    cursosService.getEstudiantesPorCurso.mockResolvedValue([
      { id: 'est-10', nombre: 'Lucas', apellido: 'Morales', rut: '24.777.888-9', es_pie: true },
    ])
  })

  it('permite vincular al estudiante del protocolo mediante flujo en cascada y cambiarlo si se requiere', async () => {
    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <NuevoProtocoloPage />
      </BrowserRouter>
    )

    expect(screen.getByText('Nuevo Protocolo RICE')).toBeInTheDocument()

    // 1. Elegir nivel
    await waitFor(() => {
      expect(screen.getByRole('option', { name: '2° Básico' })).toBeInTheDocument()
    })
    await user.selectOptions(screen.getByLabelText(/Seleccionar Nivel Escolar/i), '2° Básico')

    // 2. Elegir letra
    await waitFor(() => {
      expect(screen.getByRole('option', { name: '2° Básico B' })).toBeInTheDocument()
    })
    await user.selectOptions(screen.getByLabelText(/Seleccionar Letra del Curso/i), 'curso-2b')

    // 3. Ver y seleccionar alumno
    await waitFor(() => {
      expect(screen.getByText('Morales')).toBeInTheDocument()
    })

    const selectBtn = screen.getByRole('button', { name: /Seleccionar/i })
    await user.click(selectBtn)

    // 4. Se muestra la tarjeta de estudiante seleccionado con botón Cambiar
    await waitFor(() => {
      expect(screen.getByText('Lucas Morales')).toBeInTheDocument()
      expect(screen.getByText(/Programa PIE/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Cambiar Estudiante/i })).toBeInTheDocument()
      expect(protocolosService.getIncidentesByEstudiante).toHaveBeenCalledWith('est-10')
    })

    // 5. Al pulsar Cambiar Estudiante, vuelve a desplegarse el selector
    const cambiarBtn = screen.getByRole('button', { name: /Cambiar Estudiante/i })
    await user.click(cambiarBtn)

    expect(screen.getByLabelText(/Seleccionar Nivel Escolar/i)).toBeInTheDocument()
  })
})
