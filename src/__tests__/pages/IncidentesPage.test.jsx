import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import IncidentesPage from '@/pages/IncidentesPage'
import * as incidentesService from '@/services/incidentesService'
import * as cursosService from '@/services/cursosService'

vi.mock('@/services/incidentesService', () => ({
  getIncidentes: vi.fn(),
  buscarIncidentes: vi.fn(),
}))

vi.mock('@/services/cursosService', () => ({
  getCursos: vi.fn(),
}))

vi.mock('@/store/useAuthStore', () => ({
  useAuth: () => ({
    user: { id: 'user-1', nombre: 'Admin', rol: 'Administrador' },
  }),
  getDefaultRouteByRole: () => '/dashboard',
}))

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => ({
    notificaciones: [],
    unreadCount: 0,
    marcarLeida: vi.fn(),
    marcarTodasLeidas: vi.fn(),
  }),
}))

vi.mock('@/services/socketService', () => ({
  initSocket: vi.fn(),
  disconnectSocket: vi.fn(),
}))

vi.mock('@/components/ThemeToggle', () => ({
  default: () => <div data-testid="theme-toggle-mock" />,
}))

vi.mock('@/store/useDlpStore', () => ({
  useDlpStore: () => ({
    modoPrivacidadActivo: false,
    enmascararSensible: (val) => val,
  }),
}))

const mockIncidentes = [
  {
    id: 'inc-1',
    fecha: '2026-11-15T10:00:00Z',
    gravedad: 'Leve',
    estado: 'En Investigación',
    relato: 'Discusión en el patio durante el recreo',
    estudiantes: [
      {
        id: 'est-1',
        nombre: 'Agata',
        apellido: 'Acevedo',
        rut: '25796634-8',
        es_victima: false,
        cursos: { id: 'c-1', nombre: '4° Básico B' },
      },
      {
        id: 'est-2',
        nombre: 'Julieta',
        apellido: 'Rodríguez',
        rut: '24101017-1',
        es_victima: true,
        cursos: { id: 'c-1', nombre: '4° Básico B' },
      },
    ],
  },
  {
    id: 'inc-2',
    fecha: '2026-11-16T11:30:00Z',
    gravedad: 'Grave',
    estado: 'Derivado',
    relato: 'Incidente en pasillo central',
    estudiantes: [
      {
        id: 'est-3',
        nombre: 'Tomás',
        apellido: 'Bravo',
        rut: '23999888-7',
        es_victima: true,
        cursos: { id: 'c-2', nombre: '7° Básico A' },
      },
    ],
  },
]

describe('IncidentesPage con Filtros Cápsula y Columna Curso Separada', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    incidentesService.getIncidentes.mockResolvedValue(mockIncidentes)
    cursosService.getCursos.mockResolvedValue([
      { id: 'c-1', nombre: '4° Básico B' },
      { id: 'c-2', nombre: '7° Básico A' },
    ])
  })

  it('renderiza la tabla con columnas dedicadas para Estudiante(s) y Curso', async () => {
    render(
      <BrowserRouter>
        <IncidentesPage />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Registro de Incidentes')).toBeInTheDocument()
    })

    // Columnas de la tabla
    expect(screen.getByRole('columnheader', { name: /Estudiante\(s\)/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /Curso/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /Gravedad/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /Estado/i })).toBeInTheDocument()

    // Datos de los estudiantes
    expect(screen.getByText('Agata Acevedo')).toBeInTheDocument()
    expect(screen.getByText('Julieta Rodríguez')).toBeInTheDocument()
    expect(screen.getByText('Tomás Bravo')).toBeInTheDocument()

    // Cursos en la columna de curso
    expect(screen.getAllByText('4° Básico B').length).toBeGreaterThan(0)
    expect(screen.getAllByText('7° Básico A').length).toBeGreaterThan(0)

    // No debe mostrar badges de rol (agresor o víctima) en la lista de incidentes
    expect(screen.queryByText('Víctima')).not.toBeInTheDocument()
    expect(screen.queryByText('Agresor(a)')).not.toBeInTheDocument()
  })

  it('renderiza y permite filtrar usando las cápsulas de Gravedad', async () => {
    render(
      <BrowserRouter>
        <IncidentesPage />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Gravedad:')).toBeInTheDocument()
    })

    const botonLeve = screen.getByRole('button', { name: 'Leve' })
    const botonGrave = screen.getByRole('button', { name: 'Grave' })
    const botonGravisima = screen.getByRole('button', { name: 'Gravísima' })

    expect(botonLeve).toBeInTheDocument()
    expect(botonGrave).toBeInTheDocument()
    expect(botonGravisima).toBeInTheDocument()

    // Clic en Leve
    fireEvent.click(botonLeve)
    await waitFor(() => {
      expect(incidentesService.getIncidentes).toHaveBeenCalledWith(
        expect.objectContaining({ gravedad: 'Leve' })
      )
    })
  })

  it('renderiza y permite filtrar usando las cápsulas de Estado', async () => {
    render(
      <BrowserRouter>
        <IncidentesPage />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Estado:')).toBeInTheDocument()
    })

    const botonInvestigacion = screen.getByRole('button', { name: 'En Investigación' })
    const botonDerivado = screen.getByRole('button', { name: 'Derivado' })
    const botonCerrado = screen.getByRole('button', { name: 'Cerrado' })

    expect(botonInvestigacion).toBeInTheDocument()
    expect(botonDerivado).toBeInTheDocument()
    expect(botonCerrado).toBeInTheDocument()

    // Clic en Derivado
    fireEvent.click(botonDerivado)
    await waitFor(() => {
      expect(incidentesService.getIncidentes).toHaveBeenCalledWith(
        expect.objectContaining({ estado: 'Derivado' })
      )
    })
  })
})
