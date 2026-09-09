import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import LoginPage from '@/pages/LoginPage'
import * as authService from '@/services/authService'
import * as authStore from '@/store/useAuthStore'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

vi.mock('@/services/authService', () => ({
  loginRequest: vi.fn()
}))

describe('LoginPage - Nueva Interfaz SIGA Escolar', () => {
  const mockLogin = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(authStore, 'useAuth').mockReturnValue({
      login: mockLogin,
      user: null,
      token: null,
      isAuthenticated: false
    })
  })

  it('renderiza la interfaz con logo, ilustración, campos de email y contraseña', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    )

    // Logo e ilustración
    expect(screen.getByAltText(/SIGA Escolar/i)).toBeInTheDocument()
    const studentsImg = screen.getByAltText(/Comunidad escolar/i)
    expect(studentsImg).toBeInTheDocument()

    // Ocultar ilustración en pantallas pequeñas (hidden en mobile, md:flex)
    const illustrationSection = studentsImg.closest('section')
    expect(illustrationSection).toHaveClass('hidden')
    expect(illustrationSection).toHaveClass('md:flex')

    // Título y campos
    expect(screen.getByRole('heading', { level: 1, name: /Acceder/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Email', { exact: true })).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña', { exact: true })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Acceder a SIGA Escolar/i })).toBeInTheDocument()

    // Enlaces al pie
    expect(screen.getByRole('button', { name: /Términos y Servicios/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Contáctanos/i })).toBeInTheDocument()
  })

  it('muestra mensajes de validación al enviar campos vacíos', async () => {
    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    )

    const submitBtn = screen.getByRole('button', { name: /Acceder a SIGA Escolar/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Introduce tu email institucional')).toBeInTheDocument()
      expect(screen.getByText('Introduce tu contraseña')).toBeInTheDocument()
    })
    expect(authService.loginRequest).not.toHaveBeenCalled()
  })

  it('muestra error de formato si el correo es inválido', async () => {
    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    )

    const emailInput = screen.getByLabelText('Email', { exact: true })
    const passwordInput = screen.getByLabelText('Contraseña', { exact: true })
    const submitBtn = screen.getByRole('button', { name: /Acceder a SIGA Escolar/i })

    await user.type(emailInput, 'correo-no-valido')
    await user.type(passwordInput, 'secreto123')
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Introduce un formato de correo válido')).toBeInTheDocument()
    })
    expect(authService.loginRequest).not.toHaveBeenCalled()
  })

  it('permite alternar la visibilidad de la contraseña', async () => {
    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    )

    const passwordInput = screen.getByLabelText('Contraseña', { exact: true })
    expect(passwordInput).toHaveAttribute('type', 'password')

    const toggleBtn = screen.getByRole('button', { name: /Ver texto de la contraseña/i })
    await user.click(toggleBtn)

    expect(passwordInput).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: /Ocultar texto de la contraseña/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Ocultar texto de la contraseña/i }))
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('inicia sesión exitosamente y redirige según el rol', async () => {
    const user = userEvent.setup()
    authService.loginRequest.mockResolvedValueOnce({
      token: 'jwt-fake-token',
      user: { id: 1, email: 'admin@colegio.cl', rol: 'ADMINISTRADOR' }
    })

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    )

    await user.type(screen.getByLabelText('Email', { exact: true }), 'admin@colegio.cl')
    await user.type(screen.getByLabelText('Contraseña', { exact: true }), 'password123')
    await user.click(screen.getByRole('button', { name: /Acceder a SIGA Escolar/i }))

    await waitFor(() => {
      expect(authService.loginRequest).toHaveBeenCalledWith('admin@colegio.cl', 'password123')
      expect(mockLogin).toHaveBeenCalledWith('jwt-fake-token', {
        id: 1,
        email: 'admin@colegio.cl',
        rol: 'ADMINISTRADOR'
      })
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('muestra error cuando las credenciales son incorrectas', async () => {
    const user = userEvent.setup()
    authService.loginRequest.mockRejectedValueOnce({
      response: { status: 401 }
    })

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    )

    await user.type(screen.getByLabelText('Email', { exact: true }), 'docente@colegio.cl')
    await user.type(screen.getByLabelText('Contraseña', { exact: true }), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /Acceder a SIGA Escolar/i }))

    await waitFor(() => {
      expect(
        screen.getByText('Credenciales incorrectas. Verifica tu email y contraseña.')
      ).toBeInTheDocument()
    })
  })

  it('muestra mensaje de bloqueo temporal ante error 403', async () => {
    const user = userEvent.setup()
    authService.loginRequest.mockRejectedValueOnce({
      response: { status: 403 }
    })

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    )

    await user.type(screen.getByLabelText('Email', { exact: true }), 'docente@colegio.cl')
    await user.type(screen.getByLabelText('Contraseña', { exact: true }), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /Acceder a SIGA Escolar/i }))

    await waitFor(() => {
      expect(
        screen.getByText('Cuenta bloqueada temporalmente por seguridad. Intenta en 15 minutos.')
      ).toBeInTheDocument()
    })
  })

  it('abre y cierra el modal de Términos y Servicios', async () => {
    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    )

    await user.click(screen.getByRole('button', { name: /Términos y Servicios/i }))
    expect(screen.getByRole('heading', { name: /Términos y Servicios/i })).toBeInTheDocument()

    // Cerrar modal
    await user.click(screen.getByRole('button', { name: /Entendido/i }))
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /Términos y Servicios/i })).not.toBeInTheDocument()
    })
  })

  it('abre y cierra el modal de Contáctanos', async () => {
    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    )

    await user.click(screen.getByRole('button', { name: /Contáctanos/i }))
    expect(screen.getByRole('heading', { name: /Soporte y Contacto/i })).toBeInTheDocument()
    expect(screen.getByText(/soporte@sigaescolar.cl/i)).toBeInTheDocument()

    // Cerrar modal con botón X
    await user.click(screen.getByRole('button', { name: /Cerrar modal/i }))
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /Soporte y Contacto/i })).not.toBeInTheDocument()
    })
  })
})
