import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import AsistenciaChecklist from '@/components/asistencia/AsistenciaChecklist'
import api from '@/services/api'

vi.mock('@/services/api')

describe('AsistenciaChecklist', () => {
  const mockCurso = {
    id: 1,
    nombre: '1ro A'
  }

  const mockEstudiantes = [
    { estudianteId: 1, nombre: 'Juan', apellido: 'Pérez', estado: null },
    { estudianteId: 2, nombre: 'María', apellido: 'García', estado: 'Presente' }
  ]

  const mockOnGuardar = vi.fn()
  const mockOnCancelar = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockResolvedValue({
      data: { data: mockEstudiantes }
    })
  })

  it('should render curso name and fecha', async () => {
    render(
      <AsistenciaChecklist
        curso={mockCurso}
        fecha="2026-07-02"
        onGuardar={mockOnGuardar}
        onCancelar={mockOnCancelar}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('1ro A')).toBeInTheDocument()
      expect(screen.getByText('2026-07-02')).toBeInTheDocument()
    })
  })

  it('should fetch and display estudiantes', async () => {
    render(
      <AsistenciaChecklist
        curso={mockCurso}
        fecha="2026-07-02"
        onGuardar={mockOnGuardar}
        onCancelar={mockOnCancelar}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Pérez, Juan')).toBeInTheDocument()
      expect(screen.getByText('García, María')).toBeInTheDocument()
    })
  })

  it('should call onGuardar with asistencias when guardar is clicked', async () => {
    render(
      <AsistenciaChecklist
        curso={mockCurso}
        fecha="2026-07-02"
        onGuardar={mockOnGuardar}
        onCancelar={mockOnCancelar}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Guardar Asistencia')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Guardar Asistencia'))

    expect(mockOnGuardar).toHaveBeenCalledWith([
      { estudianteId: 1, estado: 'Presente' },
      { estudianteId: 2, estado: 'Presente' }
    ])
  })

  it('should call onCancelar when cancelar is clicked', async () => {
    render(
      <AsistenciaChecklist
        curso={mockCurso}
        fecha="2026-07-02"
        onGuardar={mockOnGuardar}
        onCancelar={mockOnCancelar}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Cancelar')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Cancelar'))

    expect(mockOnCancelar).toHaveBeenCalled()
  })

  it('should mark all students as Presente when button is clicked', async () => {
    render(
      <AsistenciaChecklist
        curso={mockCurso}
        fecha="2026-07-02"
        onGuardar={mockOnGuardar}
        onCancelar={mockOnCancelar}
      />
    )

    await waitFor(() => {
      expect(screen.getByTestId('marcar-todos-presente')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('marcar-todos-presente'))
    fireEvent.click(screen.getByText('Guardar Asistencia'))

    expect(mockOnGuardar).toHaveBeenCalledWith([
      { estudianteId: 1, estado: 'Presente' },
      { estudianteId: 2, estado: 'Presente' }
    ])
  })

  it('should allow changing individual student estado', async () => {
    render(
      <AsistenciaChecklist
        curso={mockCurso}
        fecha="2026-07-02"
        onGuardar={mockOnGuardar}
        onCancelar={mockOnCancelar}
      />
    )

    await waitFor(() => {
      expect(screen.getByTestId('estudiante-1-ausente')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('estudiante-1-ausente'))
    fireEvent.click(screen.getByText('Guardar Asistencia'))

    expect(mockOnGuardar).toHaveBeenCalledWith([
      { estudianteId: 1, estado: 'Ausente' },
      { estudianteId: 2, estado: 'Presente' }
    ])
  })
})
