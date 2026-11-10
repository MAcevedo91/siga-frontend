import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'

vi.mock('@/store/useAuthStore', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/services/socketService', () => ({
  initSocket: vi.fn(),
  disconnectSocket: vi.fn(),
}))

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => ({
    unreadCount: 0,
    notifications: [],
    markAllAsRead: vi.fn(),
  }),
}))

vi.mock('@/components/notifications/NotificationBadge', () => ({
  default: () => <div data-testid="notification-badge" />,
}))

vi.mock('@/components/notifications/NotificationCenter', () => ({
  default: () => <div data-testid="notification-center" />,
}))

vi.mock('@/components/ThemeToggle', () => ({
  default: () => <button data-testid="theme-toggle">Theme</button>,
}))

vi.mock('@/components/layout/NavbarStudentSearch', () => ({
  default: () => <div data-testid="navbar-search" />,
}))

vi.mock('@/components/rice/AsistenteNormativoModal', () => ({
  default: () => null,
}))

import { useAuth } from '@/store/useAuthStore'

describe('DashboardLayout - Navegación y Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('no muestra el ítem "Sociograma" en el sidebar para el Equipo de Formación y muestra "Cursos"', () => {
    useAuth.mockReturnValue({
      user: {
        id: 'user-formacion',
        nombre: 'Encargado Convivencia',
        rol: 'Equipo de Formación',
        tenant_id: 'tenant-demo',
      },
      logout: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DashboardLayout>
          <div>Contenido de prueba</div>
        </DashboardLayout>
      </MemoryRouter>
    )

    // Debe mostrar Cursos y Mediaciones
    expect(screen.getByText('Cursos')).toBeInTheDocument()
    expect(screen.getByText('Mediaciones')).toBeInTheDocument()

    // El enlace directo de Sociograma ya no debe existir en el sidebar
    expect(screen.queryByText('Sociograma')).not.toBeInTheDocument()
    expect(screen.queryByText('Sociograma de aula')).not.toBeInTheDocument()
  })

  it('no muestra "Sociograma" en el sidebar para el Administrador', () => {
    useAuth.mockReturnValue({
      user: {
        id: 'user-admin',
        nombre: 'Administrador Demo',
        rol: 'Administrador',
        tenant_id: 'tenant-demo',
      },
      logout: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DashboardLayout>
          <div>Contenido Admin</div>
        </DashboardLayout>
      </MemoryRouter>
    )

    expect(screen.getByText('Cursos')).toBeInTheDocument()
    expect(screen.getByText('Usuarios')).toBeInTheDocument()
    expect(screen.queryByText('Sociograma')).not.toBeInTheDocument()
  })

  it('muestra solo opciones operativas de aula para el rol Docente', () => {
    useAuth.mockReturnValue({
      user: {
        id: 'user-docente',
        nombre: 'Profesor Jefe',
        rol: 'Docente',
        tenant_id: 'tenant-demo',
      },
      logout: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/estudiantes']}>
        <DashboardLayout>
          <div>Vista Docente</div>
        </DashboardLayout>
      </MemoryRouter>
    )

    // Opciones autorizadas para Docente
    expect(screen.getByText('Cursos')).toBeInTheDocument()
    expect(screen.getByText('Incidentes')).toBeInTheDocument()
    expect(screen.getByText('Mediaciones')).toBeInTheDocument()
    expect(screen.getByText('Citaciones')).toBeInTheDocument()

    // Opciones restringidas
    expect(screen.queryByText('Panel Principal')).not.toBeInTheDocument()
    expect(screen.queryByText('Analítica')).not.toBeInTheDocument()
    expect(screen.queryByText('Protocolos RICE')).not.toBeInTheDocument()
    expect(screen.queryByText('Cierre de Año')).not.toBeInTheDocument()
    expect(screen.queryByText('Usuarios')).not.toBeInTheDocument()
    expect(screen.queryByText('Configuración')).not.toBeInTheDocument()
  })

  it('muestra opciones de patio y disciplina para el rol Inspector', () => {
    useAuth.mockReturnValue({
      user: {
        id: 'user-inspector',
        nombre: 'Inspector General',
        rol: 'Inspector',
        tenant_id: 'tenant-demo',
      },
      logout: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/incidentes']}>
        <DashboardLayout>
          <div>Vista Inspector</div>
        </DashboardLayout>
      </MemoryRouter>
    )

    // Opciones autorizadas para Inspector
    expect(screen.getByText('Cursos')).toBeInTheDocument()
    expect(screen.getByText('Incidentes')).toBeInTheDocument()
    expect(screen.getByText('Mediaciones')).toBeInTheDocument()
    expect(screen.getByText('Citaciones')).toBeInTheDocument()
    expect(screen.getByText('Cierre de Año')).toBeInTheDocument()

    // Opciones restringidas para Inspector
    expect(screen.queryByText('Panel Principal')).not.toBeInTheDocument()
    expect(screen.queryByText('Analítica')).not.toBeInTheDocument()
    expect(screen.queryByText('Protocolos RICE')).not.toBeInTheDocument()
    expect(screen.queryByText('Usuarios')).not.toBeInTheDocument()
    expect(screen.queryByText('Configuración')).not.toBeInTheDocument()
  })

  it('muestra opciones de gestión directiva para el rol Directivo', () => {
    useAuth.mockReturnValue({
      user: {
        id: 'user-directivo',
        nombre: 'Directora',
        rol: 'Directivo',
        tenant_id: 'tenant-demo',
      },
      logout: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DashboardLayout>
          <div>Vista Directiva</div>
        </DashboardLayout>
      </MemoryRouter>
    )

    // Opciones autorizadas para Directivo
    expect(screen.getByText('Panel Principal')).toBeInTheDocument()
    expect(screen.getByText('Analítica')).toBeInTheDocument()
    expect(screen.getByText('Cursos')).toBeInTheDocument()
    expect(screen.getByText('Incidentes')).toBeInTheDocument()
    expect(screen.getByText('Protocolos RICE')).toBeInTheDocument()
    expect(screen.getByText('Mediaciones')).toBeInTheDocument()
    expect(screen.getByText('Citaciones')).toBeInTheDocument()
    expect(screen.getByText('Cierre de Año')).toBeInTheDocument()

    // Exclusivas de Administrador
    expect(screen.queryByText('Usuarios')).not.toBeInTheDocument()
    expect(screen.queryByText('Configuración')).not.toBeInTheDocument()
  })
})
