import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import AlertasAusentismoWidget from '@/components/asistencia/AlertasAusentismoWidget'
import api from '@/services/api'

vi.mock('@/services/api')

describe('AlertasAusentismoWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show no alerts message when no alerts exist', async () => {
    api.get.mockResolvedValue({
      data: { data: [] }
    })

    render(<AlertasAusentismoWidget />)

    await waitFor(() => {
      expect(screen.getByText(/No hay estudiantes con ausentismo crítico/i)).toBeInTheDocument()
    })
  })

  it('should show alert count when alerts exist', async () => {
    const mockAlertas = [
      {
        estudianteId: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        curso: '1ro A',
        porcentajeAsistencia: 70,
        diasAusente: 10
      },
      {
        estudianteId: 2,
        nombre: 'María',
        apellido: 'García',
        curso: '2do B',
        porcentajeAsistencia: 65,
        diasAusente: 15
      }
    ]

    api.get.mockResolvedValue({
      data: { data: mockAlertas }
    })

    render(<AlertasAusentismoWidget />)

    await waitFor(() => {
      expect(screen.getByText(/2 estudiantes con más de 15% de ausencias/i)).toBeInTheDocument()
    })
  })

  it('should toggle detail view when button is clicked', async () => {
    const mockAlertas = [
      {
        estudianteId: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        curso: '1ro A',
        porcentajeAsistencia: 70,
        diasAusente: 10
      }
    ]

    api.get.mockResolvedValue({
      data: { data: mockAlertas }
    })

    render(<AlertasAusentismoWidget />)

    await waitFor(() => {
      expect(screen.getByText('Ver Detalle')).toBeInTheDocument()
    })

    // Initially details should not be visible
    expect(screen.queryByText('Pérez, Juan')).not.toBeInTheDocument()

    // Click to show details
    fireEvent.click(screen.getByText('Ver Detalle'))

    await waitFor(() => {
      expect(screen.getByText('Pérez, Juan')).toBeInTheDocument()
      expect(screen.getByText('70%')).toBeInTheDocument()
      expect(screen.getByText('10 días ausente')).toBeInTheDocument()
    })

    // Button text should change
    expect(screen.getByText('Ocultar')).toBeInTheDocument()

    // Click to hide details
    fireEvent.click(screen.getByText('Ocultar'))

    await waitFor(() => {
      expect(screen.queryByText('Pérez, Juan')).not.toBeInTheDocument()
    })
  })

  it('should display all alert details when expanded', async () => {
    const mockAlertas = [
      {
        estudianteId: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        curso: '1ro A',
        porcentajeAsistencia: 70,
        diasAusente: 10
      },
      {
        estudianteId: 2,
        nombre: 'María',
        apellido: 'García',
        curso: '2do B',
        porcentajeAsistencia: 65,
        diasAusente: 15
      }
    ]

    api.get.mockResolvedValue({
      data: { data: mockAlertas }
    })

    render(<AlertasAusentismoWidget />)

    await waitFor(() => {
      expect(screen.getByText('Ver Detalle')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Ver Detalle'))

    await waitFor(() => {
      expect(screen.getByText('Pérez, Juan')).toBeInTheDocument()
      expect(screen.getByText('García, María')).toBeInTheDocument()
      expect(screen.getByText('70%')).toBeInTheDocument()
      expect(screen.getByText('65%')).toBeInTheDocument()
    })
  })
})
