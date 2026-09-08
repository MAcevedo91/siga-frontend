import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SelectorEstudianteCascada from '@/components/shared/SelectorEstudianteCascada'
import * as cursosService from '@/services/cursosService'
import * as incidentesService from '@/services/incidentesService'

vi.mock('@/services/cursosService', () => ({
  getNiveles: vi.fn(),
  getLetrasPorNivel: vi.fn(),
  getEstudiantesPorCurso: vi.fn(),
}))

vi.mock('@/services/incidentesService', () => ({
  buscarEstudiantes: vi.fn(),
}))

const mockNiveles = ['1° Básico', '2° Básico']
const mockLetras = [
  { id: 'curso-1a', letra: 'A', nombre: '1° Básico A', nivel: '1° Básico' },
  { id: 'curso-1b', letra: 'B', nombre: '1° Básico B', nivel: '1° Básico' },
]
const mockEstudiantesCurso = [
  { id: 'est-1', nombre: 'Carlos', apellido: 'Alvarado', rut: '22.111.333-4', es_pie: false },
  { id: 'est-2', nombre: 'María', apellido: 'Bustos', rut: '22.444.555-6', es_pie: true },
]

describe('SelectorEstudianteCascada (HU 5.5 & 5.5.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cursosService.getNiveles.mockResolvedValue(mockNiveles)
    cursosService.getLetrasPorNivel.mockResolvedValue(mockLetras)
    cursosService.getEstudiantesPorCurso.mockResolvedValue(mockEstudiantesCurso)
    incidentesService.buscarEstudiantes.mockResolvedValue([
      { id: 'est-direct-1', nombre: 'Pedro', apellido: 'Soto', rut: '21.000.111-2', es_pie: false },
    ])
  })

  it('renderiza selector de nivel y mantiene el selector de letra deshabilitado inicialmente', async () => {
    render(<SelectorEstudianteCascada onSelectEstudiante={vi.fn()} />)

    const nivelSelect = screen.getByLabelText(/Seleccionar Nivel Escolar/i)
    const letraSelect = screen.getByLabelText(/Seleccionar Letra del Curso/i)

    expect(nivelSelect).toBeInTheDocument()
    expect(letraSelect).toBeDisabled()

    await waitFor(() => {
      expect(screen.getByRole('option', { name: '1° Básico' })).toBeInTheDocument()
    })
  })

  it('al seleccionar nivel escolar habilita y puebla el selector de letra', async () => {
    const user = userEvent.setup()
    render(<SelectorEstudianteCascada onSelectEstudiante={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByRole('option', { name: '1° Básico' })).toBeInTheDocument()
    })

    const nivelSelect = screen.getByLabelText(/Seleccionar Nivel Escolar/i)
    await user.selectOptions(nivelSelect, '1° Básico')

    await waitFor(() => {
      expect(cursosService.getLetrasPorNivel).toHaveBeenCalledWith('1° Básico')
      const letraSelect = screen.getByLabelText(/Seleccionar Letra del Curso/i)
      expect(letraSelect).not.toBeDisabled()
      expect(screen.getByRole('option', { name: '1° Básico A' })).toBeInTheDocument()
    })
  })

  it('al seleccionar letra despliega la lista de estudiantes con RUT y badge PIE', async () => {
    const user = userEvent.setup()
    render(<SelectorEstudianteCascada onSelectEstudiante={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByRole('option', { name: '1° Básico' })).toBeInTheDocument()
    })

    await user.selectOptions(screen.getByLabelText(/Seleccionar Nivel Escolar/i), '1° Básico')

    await waitFor(() => {
      expect(screen.getByRole('option', { name: '1° Básico A' })).toBeInTheDocument()
    })

    await user.selectOptions(screen.getByLabelText(/Seleccionar Letra del Curso/i), 'curso-1a')

    await waitFor(() => {
      expect(cursosService.getEstudiantesPorCurso).toHaveBeenCalledWith('curso-1a')
      expect(screen.getByText('Alvarado')).toBeInTheDocument()
      expect(screen.getByText('Bustos')).toBeInTheDocument()
      expect(screen.getByText('RUT: 22.111.333-4')).toBeInTheDocument()
      expect(screen.getByText('PIE')).toBeInTheDocument()
    })
  })

  it('transfiere el estudiante seleccionado con onSelectEstudiante al pulsar Seleccionar', async () => {
    const user = userEvent.setup()
    const handleSelect = vi.fn()
    render(<SelectorEstudianteCascada onSelectEstudiante={handleSelect} />)

    await waitFor(() => {
      expect(screen.getByRole('option', { name: '1° Básico' })).toBeInTheDocument()
    })
    await user.selectOptions(screen.getByLabelText(/Seleccionar Nivel Escolar/i), '1° Básico')

    await waitFor(() => {
      expect(screen.getByRole('option', { name: '1° Básico A' })).toBeInTheDocument()
    })
    await user.selectOptions(screen.getByLabelText(/Seleccionar Letra del Curso/i), 'curso-1a')

    await waitFor(() => {
      expect(screen.getByText('Alvarado')).toBeInTheDocument()
    })

    const selectButtons = screen.getAllByRole('button', { name: /Seleccionar/i })
    await user.click(selectButtons[0])

    expect(handleSelect).toHaveBeenCalledWith(mockEstudiantesCurso[0])
  })

  it('muestra estado Agregado cuando el estudiante ya está en selectedEstudiantesIds', async () => {
    const user = userEvent.setup()
    render(
      <SelectorEstudianteCascada
        onSelectEstudiante={vi.fn()}
        selectedEstudiantesIds={['est-1']}
        allowMultiple={true}
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('option', { name: '1° Básico' })).toBeInTheDocument()
    })
    await user.selectOptions(screen.getByLabelText(/Seleccionar Nivel Escolar/i), '1° Básico')

    await waitFor(() => {
      expect(screen.getByRole('option', { name: '1° Básico A' })).toBeInTheDocument()
    })
    await user.selectOptions(screen.getByLabelText(/Seleccionar Letra del Curso/i), 'curso-1a')

    await waitFor(() => {
      expect(screen.getByText(/Agregado/i)).toBeInTheDocument()
    })
  })

  it('permite alternar a Búsqueda directa por RUT/Nombre y seleccionar alumno', async () => {
    const user = userEvent.setup()
    const handleSelect = vi.fn()
    render(<SelectorEstudianteCascada onSelectEstudiante={handleSelect} />)

    const btnDirecta = screen.getByRole('button', { name: /Búsqueda por RUT\/Nombre/i })
    await user.click(btnDirecta)

    const inputDirecta = screen.getByPlaceholderText(/Escriba RUT o nombre del alumno/i)
    await user.type(inputDirecta, 'Pedro')

    await waitFor(() => {
      expect(incidentesService.buscarEstudiantes).toHaveBeenCalledWith('Pedro')
      expect(screen.getByText(/Pedro Soto/i)).toBeInTheDocument()
    })

    await user.click(screen.getByText(/Pedro Soto/i))
    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'est-direct-1', nombre: 'Pedro' })
    )
  })
})
