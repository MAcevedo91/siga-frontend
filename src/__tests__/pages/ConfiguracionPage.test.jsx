import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import ConfiguracionPage from '@/pages/ConfiguracionPage'
import * as configuracionService from '@/services/configuracionService'

vi.mock('@/services/configuracionService', () => ({
  getConfiguracion: vi.fn(),
  updateConfiguracion: vi.fn(),
  updateReglaProtocolo: vi.fn(),
}))

vi.mock('@/store/useAuthStore', () => ({
  useAuth: () => ({
    user: { id: 'admin-1', nombre: 'Admin', apellido: 'Sistema', rol: 'Administrador' },
    token: 'fake-token',
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

const { toastMock } = vi.hoisted(() => {
  const fn = vi.fn()
  fn.success = vi.fn()
  fn.error = vi.fn()
  return { toastMock: fn }
})

vi.mock('react-hot-toast', () => ({
  default: toastMock,
}))

const mockData = {
  parametros: {
    umbral_riesgo: 6,
    ventana_dias_riesgo: 30,
    ventana_dias_reincidencia: 45,
    ventana_dias_escalada: 15,
    updated_at: '2026-09-08T15:30:00.000Z',
  },
  reglas: [
    {
      id: 'regla-1',
      orden: 1,
      accion: 'Entrevista inicial con las partes involucradas',
      plazo_dias: 2,
      prorrogable: false,
      activo: true,
      tipo_protocolo_id: 1,
      tipo_protocolo: { id: 1, nombre: 'Maltrato entre estudiantes' },
    },
    {
      id: 'regla-2',
      orden: 2,
      accion: 'Citación y reunión con apoderados',
      plazo_dias: 5,
      prorrogable: true,
      activo: true,
      tipo_protocolo_id: 1,
      tipo_protocolo: { id: 1, nombre: 'Maltrato entre estudiantes' },
    },
    {
      id: 'regla-3',
      orden: 1,
      accion: 'Denuncia obligatoria ante Ministerio Público',
      plazo_dias: 1,
      prorrogable: false,
      activo: true,
      tipo_protocolo_id: 2,
      tipo_protocolo: { id: 2, nombre: 'Abuso sexual entre estudiantes' },
    },
  ],
}

describe('ConfiguracionPage (HU 5.3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    configuracionService.getConfiguracion.mockResolvedValue(mockData)
    configuracionService.updateConfiguracion.mockResolvedValue({
      ...mockData.parametros,
      umbral_riesgo: 8,
      updated_at: '2026-09-08T18:00:00.000Z',
    })
    configuracionService.updateReglaProtocolo.mockResolvedValue({
      id: 'regla-1',
      plazo_dias: 4,
    })
  })

  it('renderiza correctamente el título, los parámetros de riesgo y las reglas RICE', async () => {
    render(
      <BrowserRouter>
        <ConfiguracionPage />
      </BrowserRouter>
    )

    expect(screen.getByText(/Configuración y Calibración de Parámetros/i)).toBeInTheDocument()
    expect(screen.getByText(/Impacto Inmediato en el Motor Analítico/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByLabelText(/Umbral de Score de Riesgo/i)).toHaveValue(6)
      expect(screen.getByLabelText(/Ventana de Análisis de Riesgo/i)).toHaveValue(30)
      expect(screen.getByText('Entrevista inicial con las partes involucradas')).toBeInTheDocument()
      expect(screen.getByText('Denuncia obligatoria ante Ministerio Público')).toBeInTheDocument()
      expect(screen.getAllByText('Abuso sexual entre estudiantes').length).toBeGreaterThan(0)
    })
  })

  it('rechaza valores <= 0 o vacíos en los parámetros y no llama a updateConfiguracion', async () => {
    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <ConfiguracionPage />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/Umbral de Score de Riesgo/i)).toHaveValue(6)
    })

    const umbralInput = screen.getByLabelText(/Umbral de Score de Riesgo/i)
    await user.clear(umbralInput)
    await user.type(umbralInput, '0')

    const saveButton = screen.getByRole('button', { name: /Guardar Parámetros Generales/i })
    await user.click(saveButton)

    expect(screen.getByText(/debe ser un número entero positivo/i)).toBeInTheDocument()
    expect(configuracionService.updateConfiguracion).not.toHaveBeenCalled()
  })

  it('guarda exitosamente los parámetros modificados cuando son válidos', async () => {
    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <ConfiguracionPage />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/Umbral de Score de Riesgo/i)).toHaveValue(6)
    })

    const umbralInput = screen.getByLabelText(/Umbral de Score de Riesgo/i)
    await user.clear(umbralInput)
    await user.type(umbralInput, '8')

    const saveButton = screen.getByRole('button', { name: /Guardar Parámetros Generales/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(configuracionService.updateConfiguracion).toHaveBeenCalledWith({
        umbral_riesgo: 8,
        ventana_dias_riesgo: 30,
        ventana_dias_reincidencia: 45,
        ventana_dias_escalada: 15,
      })
      expect(screen.getByText(/Parámetros guardados exitosamente/i)).toBeInTheDocument()
    })
  })

  it('permite modificar el plazo en días de una regla y guardarlo individualmente', async () => {
    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <ConfiguracionPage />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Entrevista inicial con las partes involucradas')).toBeInTheDocument()
    })

    const plazoInput = screen.getByLabelText(/Plazo para Entrevista inicial con las partes involucradas/i)
    expect(plazoInput).toHaveValue(2)

    await user.clear(plazoInput)
    await user.type(plazoInput, '4')

    const guardarReglaBtn = screen.getByLabelText('Guardar regla regla-1')
    await user.click(guardarReglaBtn)

    await waitFor(() => {
      expect(configuracionService.updateReglaProtocolo).toHaveBeenCalledWith('regla-1', expect.objectContaining({
        plazo_dias: 4,
      }))
    })
  })

  it('filtra la tabla de reglas al cambiar el selector de protocolo', async () => {
    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <ConfiguracionPage />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Denuncia obligatoria ante Ministerio Público')).toBeInTheDocument()
      expect(screen.getByText('Entrevista inicial con las partes involucradas')).toBeInTheDocument()
    })

    const select = screen.getByRole('combobox', { name: /Filtrar por tipo de protocolo/i })
    await user.selectOptions(select, '2') // Abuso sexual entre estudiantes

    expect(screen.getByText('Denuncia obligatoria ante Ministerio Público')).toBeInTheDocument()
    expect(screen.queryByText('Entrevista inicial con las partes involucradas')).not.toBeInTheDocument()
  })

  it('filtra la tabla mediante el buscador de texto', async () => {
    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <ConfiguracionPage />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Entrevista inicial con las partes involucradas')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/Buscar acción o protocolo/i)
    await user.type(searchInput, 'Ministerio Público')

    expect(screen.getByText('Denuncia obligatoria ante Ministerio Público')).toBeInTheDocument()
    expect(screen.queryByText('Entrevista inicial con las partes involucradas')).not.toBeInTheDocument()
  })

  it('restablece los valores por defecto al pulsar "Valores por Defecto"', async () => {
    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <ConfiguracionPage />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/Umbral de Score de Riesgo/i)).toHaveValue(6)
    })

    const umbralInput = screen.getByLabelText(/Umbral de Score de Riesgo/i)
    await user.clear(umbralInput)
    await user.type(umbralInput, '12')
    expect(umbralInput).toHaveValue(12)

    const btnRestablecer = screen.getByRole('button', { name: /Valores por Defecto/i })
    await user.click(btnRestablecer)

    expect(screen.getByLabelText(/Umbral de Score de Riesgo/i)).toHaveValue(6)
  })
})
