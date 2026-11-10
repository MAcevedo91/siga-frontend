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
})
