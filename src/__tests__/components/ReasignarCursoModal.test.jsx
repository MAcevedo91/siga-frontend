import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ReasignarCursoModal from '@/components/estudiantes/ReasignarCursoModal'
import * as estudiantesService from '@/services/estudiantesService'

vi.mock('@/services/estudiantesService', () => ({
  cambiarCursoEstudiante: vi.fn(),
}))

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('ReasignarCursoModal', () => {
  const mockEstudiante = {
    id: 101,
    nombre: 'Vicente',
    apellido: 'López',
    rut: '22.333.444-5',
    curso_id: 1,
    curso: { id: 1, nombre: '8° Básico A' },
  }

  const mockCursos = [
    { id: 1, nombre: '8° Básico A' },
    { id: 2, nombre: '8° Básico B' },
    { id: 3, nombre: '7° Básico A' },
  ]

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    estudiante: mockEstudiante,
    cursos: mockCursos,
    onSuccess: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('no debe renderizar nada si isOpen es false o estudiante es null', () => {
    const { container: c1 } = render(
      <ReasignarCursoModal {...defaultProps} isOpen={false} />
    )
    expect(c1.firstChild).toBeNull()

    const { container: c2 } = render(
      <ReasignarCursoModal {...defaultProps} estudiante={null} />
    )
    expect(c2.firstChild).toBeNull()
  })

  it('renderiza la ficha del estudiante y curso actual', () => {
    render(<ReasignarCursoModal {...defaultProps} />)

    expect(screen.getByText('Reasignar Curso / Paralelo')).toBeInTheDocument()
    expect(screen.getByText('Vicente López')).toBeInTheDocument()
    expect(screen.getByText('(22.333.444-5)')).toBeInTheDocument()
    expect(screen.getByText('8° Básico A')).toBeInTheDocument()
  })

  it('deshabilita el curso actual en el selector de cursos', () => {
    render(<ReasignarCursoModal {...defaultProps} />)

    const select = screen.getByLabelText(/Curso de Destino/i)
    expect(select).toBeInTheDocument()

    // El option del curso 1 debe tener (Curso actual) y estar deshabilitado
    const optionActual = screen.getByRole('option', { name: /8° Básico A \(Curso actual\)/i })
    expect(optionActual).toBeDisabled()

    // El option del curso 2 (paralelo B) debe estar habilitado
    const optionDestino = screen.getByRole('option', { name: '8° Básico B' })
    expect(optionDestino).not.toBeDisabled()
  })

  it('envía los datos de reasignación y llama onSuccess al confirmar', async () => {
    const mockRespuesta = {
      estudiante: { ...mockEstudiante, curso_id: 2 },
      curso: { id: 2, nombre: '8° Básico B' },
    }
    vi.mocked(estudiantesService.cambiarCursoEstudiante).mockResolvedValueOnce(mockRespuesta)

    render(<ReasignarCursoModal {...defaultProps} />)

    // Seleccionar curso de destino (8° Básico B)
    const select = screen.getByLabelText(/Curso de Destino/i)
    fireEvent.change(select, { target: { value: '2' } })

    // Seleccionar motivo
    const selectMotivo = screen.getByLabelText(/Motivo de la Reasignación/i)
    fireEvent.change(selectMotivo, {
      target: { value: 'Resolución de conflicto / Convivencia escolar (separación de pares)' },
    })

    // Escribir observación
    const inputObs = screen.getByPlaceholderText(/Indique acuerdos con apoderado/i)
    fireEvent.change(inputObs, {
      target: { value: 'Se traslada al paralelo B por resolución del comité de convivencia' },
    })

    // Click en Confirmar Reasignación
    const btnSubmit = screen.getByRole('button', { name: /Confirmar Reasignación/i })
    fireEvent.click(btnSubmit)

    await waitFor(() => {
      expect(estudiantesService.cambiarCursoEstudiante).toHaveBeenCalledWith(101, {
        curso_id: 2,
        motivo: 'Resolución de conflicto / Convivencia escolar (separación de pares)',
        observacion: 'Se traslada al paralelo B por resolución del comité de convivencia',
      })
      expect(defaultProps.onSuccess).toHaveBeenCalledWith(mockRespuesta)
      expect(defaultProps.onClose).toHaveBeenCalled()
    })
  })
})
