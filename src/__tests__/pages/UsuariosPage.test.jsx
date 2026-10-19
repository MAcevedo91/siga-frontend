import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import UsuariosPage from '@/pages/UsuariosPage'
import * as usuariosService from '@/services/usuariosService'

vi.mock('@/services/usuariosService', () => ({
  getUsuarios: vi.fn(),
  createUsuario: vi.fn(),
  updateUsuario: vi.fn(),
  desactivarUsuario: vi.fn(),
  subirAvatarUsuario: vi.fn(),
  eliminarAvatarUsuario: vi.fn(),
}))

vi.mock('@/store/useAuthStore', () => ({
  useAuth: () => ({
    user: { id: 'admin-1', nombre: 'Admin', apellido: 'General', rol: 'Administrador' },
    updateUser: vi.fn(),
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

const mockUsuarios = [
  { id: '1', nombre: 'Carlos', apellido: 'DocenteUno', email: 'carlos@colegio.cl', rol: 'Docente', activo: true },
  { id: '2', nombre: 'Ana', apellido: 'AdminUno', email: 'ana@colegio.cl', rol: 'Administrador', activo: true },
  { id: '3', nombre: 'Pedro', apellido: 'PsicoUno', email: 'pedro@colegio.cl', rol: 'Psicólogo', activo: true },
  { id: '4', nombre: 'Beatriz', apellido: 'DirectoraUno', email: 'beatriz@colegio.cl', rol: 'Directiva', activo: true },
  { id: '5', nombre: 'Juan', apellido: 'InactivoDocente', email: 'juan@colegio.cl', rol: 'Docente', activo: false },
]

describe('UsuariosPage - Ordenamiento y Filtros', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usuariosService.getUsuarios.mockResolvedValue(mockUsuarios)
  })

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <UsuariosPage />
      </BrowserRouter>
    )

  it('renderiza y ordena los usuarios por jerarquía de rol automáticamente', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Ana AdminUno')).toBeInTheDocument()
    })

    // Obtenemos todos los nombres de usuarios mostrados en las tarjetas
    const nombres = screen.getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent.trim())
      .filter((txt) => !txt.match(/Total|Usuarios|Administradores|Convivencia|\d+/))

    // El primer usuario ordenado debe ser el Administrador, luego Directiva, Psicólogo, Docente
    expect(nombres[0]).toContain('Ana AdminUno')
    expect(nombres[1]).toContain('Beatriz DirectoraUno')
    expect(nombres[2]).toContain('Pedro PsicoUno')
  })

  it('permite filtrar por rol haciendo clic en el chip correspondiente', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Ana AdminUno')).toBeInTheDocument()
    })

    // Hacemos clic en el chip de Psicólogos
    const chipPsicologos = screen.getByRole('button', { name: /Psicólogos/i })
    fireEvent.click(chipPsicologos)

    // Solo debe aparecer Pedro PsicoUno
    expect(screen.getByText('Pedro PsicoUno')).toBeInTheDocument()
    expect(screen.queryByText('Ana AdminUno')).not.toBeInTheDocument()
    expect(screen.queryByText('Carlos DocenteUno')).not.toBeInTheDocument()
  })

  it('permite filtrar en tiempo real mediante el buscador de texto', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Carlos DocenteUno')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/Buscar por nombre, apellido, email o rol/i)
    fireEvent.change(searchInput, { target: { value: 'carlos' } })

    expect(screen.getByText('Carlos DocenteUno')).toBeInTheDocument()
    expect(screen.queryByText('Ana AdminUno')).not.toBeInTheDocument()
  })

  it('muestra estado vacío amigable cuando ningún usuario coincide con el filtro', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Ana AdminUno')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/Buscar por nombre, apellido, email o rol/i)
    fireEvent.change(searchInput, { target: { value: 'nombre_inexistente_xyz' } })

    expect(screen.getByText(/No se encontraron usuarios/i)).toBeInTheDocument()

    // Clic en restablecer filtros
    const resetBtn = screen.getByRole('button', { name: /Restablecer Filtros/i })
    fireEvent.click(resetBtn)

    expect(screen.getByText('Ana AdminUno')).toBeInTheDocument()
  })
})
