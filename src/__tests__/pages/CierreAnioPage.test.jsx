import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import CierreAnioPage from '@/pages/CierreAnioPage'
import * as cierreAnioService from '@/services/cierreAnioService'

vi.mock('@/services/cierreAnioService', () => ({
  getEstadoActual: vi.fn(),
  getPropuestaPromocion: vi.fn(),
  ejecutarCierreYPromocion: vi.fn(),
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

const mockPropuesta = {
  periodo_actual: { id: 'per-2026', anio: 2026, activo: true },
  nuevo_anio_sugerido: 2027,
  fecha_inicio_sugerida: '2027-03-01',
  fecha_fin_sugerida: '2027-12-31',
  cursos_proyectados: [
    { nombre: '1° Básico A', nivel: '1° Básico', letra: 'A', profesor_jefe_id: 'doc-1', profesor_jefe_nombre: 'Profesor Uno' },
    { nombre: '8° Básico A', nivel: '8° Básico', letra: 'A', profesor_jefe_id: null, profesor_jefe_nombre: null },
  ],
  alumnos_propuesta: [
    {
      estudiante_id: 'est-1',
      rut: '11.111.111-1',
      nombre: 'Sofía',
      apellido: 'Araya',
      es_pie: true,
      curso_anterior_id: 'cur-7',
      curso_anterior_nombre: '7° Básico A',
      nivel_anterior: '7° Básico',
      estado_propuesto: 'Promovido',
      nuevo_curso_nombre_sugerido: '8° Básico A',
      es_egresado_automatico: false,
    },
    {
      estudiante_id: 'est-2',
      rut: '22.222.222-2',
      nombre: 'Martín',
      apellido: 'González',
      es_pie: false,
      curso_anterior_id: 'cur-8',
      curso_anterior_nombre: '8° Básico A',
      nivel_anterior: '8° Básico',
      estado_propuesto: 'Egresado',
      nuevo_curso_nombre_sugerido: null,
      es_egresado_automatico: true,
    },
  ],
  resumen: {
    total_estudiantes: 2,
    promovidos_propuestos: 1,
    egresados_propuestos: 1,
  },
  docentes_disponibles: [
    { id: 'doc-1', nombre: 'Profesor', apellido: 'Uno', rol: 'Docente' },
  ],
}

describe('CierreAnioPage (Sprint 7 - Asistente de Promoción y Cierre de Año)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cierreAnioService.getPropuestaPromocion.mockResolvedValue(mockPropuesta)
    cierreAnioService.ejecutarCierreYPromocion.mockResolvedValue({
      success: true,
      nuevo_anio: 2027,
    })
  })

  it('renderiza correctamente el Paso 1 con el año que finaliza y el nuevo año sugerido', async () => {
    render(
      <BrowserRouter>
        <CierreAnioPage />
      </BrowserRouter>
    )

    expect(await screen.findByRole('heading', { level: 1, name: 'Cierre de Año y Promoción' })).toBeInTheDocument()
    expect(screen.getByText('Año Lectivo 2026')).toBeInTheDocument()
    expect(screen.getByDisplayValue(2027)).toBeInTheDocument()
    expect(screen.getByDisplayValue('2027-03-01')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2027-12-31')).toBeInTheDocument()
  })

  it('permite avanzar al Paso 2 y muestra cursos proyectados con jefatura sugerida', async () => {
    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <CierreAnioPage />
      </BrowserRouter>
    )

    await screen.findByRole('heading', { level: 1, name: 'Cierre de Año y Promoción' })
    const btnSiguiente = screen.getByRole('button', { name: /Siguiente: Cursos y Jefaturas/i })
    await user.click(btnSiguiente)

    expect(await screen.findByText('Cursos Proyectados y Profesores Jefes')).toBeInTheDocument()
    expect(screen.getByText('1° Básico A')).toBeInTheDocument()
    expect(screen.getByText('8° Básico A')).toBeInTheDocument()
  })

  it('permite avanzar al Paso 3, mostrando alumnos promovidos y 8° básico como egresado', async () => {
    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <CierreAnioPage />
      </BrowserRouter>
    )

    await screen.findByRole('heading', { level: 1, name: 'Cierre de Año y Promoción' })
    await user.click(screen.getByRole('button', { name: /Siguiente: Cursos y Jefaturas/i }))
    await user.click(await screen.findByRole('button', { name: /Siguiente: Nómina de Alumnos/i }))

    expect(await screen.findByText('Asistente de Promoción Automática')).toBeInTheDocument()
    expect(screen.getByText('Araya, Sofía')).toBeInTheDocument()
    expect(screen.getByText('González, Martín')).toBeInTheDocument()
    expect(screen.getAllByRole('option', { name: /🎓 Archivo Egresado/i }).length).toBeGreaterThan(0)
  })

  it('avanza al Paso 4, despliega KPIs de balance y modal de confirmación antes de ejecutar', async () => {
    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <CierreAnioPage />
      </BrowserRouter>
    )

    await screen.findByRole('heading', { level: 1, name: 'Cierre de Año y Promoción' })
    await user.click(screen.getByRole('button', { name: /Siguiente: Cursos y Jefaturas/i }))
    await user.click(await screen.findByRole('button', { name: /Siguiente: Nómina de Alumnos/i }))
    await user.click(await screen.findByRole('button', { name: /Siguiente: Resumen y Confirmación/i }))

    expect(await screen.findByText('Auditoría y Confirmación de Transición')).toBeInTheDocument()
    expect(screen.getByText('Total Nómina')).toBeInTheDocument()

    // Clic en Confirmar Cierre abre el modal seguro
    const btnConfirmar = screen.getByRole('button', { name: /Confirmar Cierre y Promover Cursos/i })
    await user.click(btnConfirmar)

    expect(await screen.findByText('¿Confirmar Cierre del Año Lectivo?')).toBeInTheDocument()

    // Confirmar en el modal llama a ejecutarCierreYPromocion
    const btnEjecutar = screen.getByRole('button', { name: /Sí, Ejecutar Ahora/i })
    await user.click(btnEjecutar)

    await waitFor(() => {
      expect(cierreAnioService.ejecutarCierreYPromocion).toHaveBeenCalledTimes(1)
      expect(cierreAnioService.ejecutarCierreYPromocion).toHaveBeenCalledWith(
        expect.objectContaining({
          nuevo_anio: 2027,
          periodo_anterior_id: 'per-2026',
        })
      )
    })
  })
})
