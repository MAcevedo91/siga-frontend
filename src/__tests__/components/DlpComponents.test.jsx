import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { usePrivacyStore } from '@/store/usePrivacyStore'
import { useAuth } from '@/store/useAuthStore'
import DlpSensitiveText, { enmascararValor } from '@/components/dlp/DlpSensitiveText'
import ForensicWatermark from '@/components/dlp/ForensicWatermark'
import PrivacyShieldOverlay from '@/components/dlp/PrivacyShieldOverlay'

vi.mock('@/store/useAuthStore', () => ({
  useAuth: vi.fn(),
}))

describe('DLP Escolar: Funciones Auxiliares y Enmascaramiento', () => {
  it('enmascara correctamente un RUT escolar', () => {
    expect(enmascararValor('12.345.678-9', 'rut')).toBe('12.***.***-*')
    expect(enmascararValor('25.999.888-K', 'rut')).toBe('25.***.***-*')
  })

  it('enmascara nombres de estudiantes', () => {
    expect(enmascararValor('Agata Acevedo Silva', 'nombre')).toBe('A*** A*** S***')
  })

  it('enmascara diagnósticos clínicos y relatos disciplinarios', () => {
    expect(enmascararValor('TDAH severo', 'diagnostico')).toBe('[Diagnóstico Clínico/PIE Reservado]')
    expect(enmascararValor('Discusión en el patio', 'relato')).toContain('[Relato confidencial')
  })
})

describe('DLP Component: DlpSensitiveText', () => {
  beforeEach(() => {
    usePrivacyStore.setState({ modoPrivacidad: false })
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('muestra el texto sin desenfoque cuando el modo privacidad está inactivo', () => {
    render(<DlpSensitiveText value="25.796.634-8" tipo="rut" />)
    expect(screen.getByText('25.796.634-8')).toBeInTheDocument()
    expect(screen.queryByLabelText('Develar temporalmente')).not.toBeInTheDocument()
  })

  it('desenfoca el texto y muestra el ícono de ojo cuando el modo privacidad está activo', () => {
    usePrivacyStore.setState({ modoPrivacidad: true })
    render(<DlpSensitiveText value="Agata Acevedo" tipo="nombre" />)

    const elemento = screen.getByRole('button')
    expect(elemento).toBeInTheDocument()
    expect(screen.getByLabelText('Develar temporalmente')).toBeInTheDocument()
  })

  it('revela el texto al hacer clic y se vuelve a ocultar automáticamente tras 5 segundos', () => {
    usePrivacyStore.setState({ modoPrivacidad: true })
    render(<DlpSensitiveText value="Agata Acevedo" tipo="nombre" revealDurationMs={5000} />)

    const button = screen.getByRole('button')
    // Clic para revelar
    fireEvent.click(button)
    expect(screen.getByLabelText('Ocultar')).toBeInTheDocument()

    // Avanzar temporizador 5 segundos
    act(() => {
      vi.advanceTimersByTime(5000)
    })

    // Debe volver a estar oculto
    expect(screen.getByLabelText('Develar temporalmente')).toBeInTheDocument()
  })
})

describe('DLP Component: ForensicWatermark', () => {
  it('renderiza la marca de agua forense con el usuario autenticado', () => {
    useAuth.mockReturnValue({
      user: {
        nombre: 'Marcelo',
        apellido: 'Acevedo',
        email: 'marcelo@colegio.cl',
        rol: 'Encargado de Convivencia',
      },
    })
    usePrivacyStore.setState({ watermarkHabilitada: true })

    render(<ForensicWatermark />)
    const watermark = screen.getByTestId('forensic-watermark')
    expect(watermark).toBeInTheDocument()
    expect(screen.getByText(/Marcelo Acevedo · marcelo@colegio\.cl/)).toBeInTheDocument()
  })

  it('no renderiza nada si no hay usuario autenticado o la marca de agua está deshabilitada', () => {
    useAuth.mockReturnValue({ user: null })
    const { container } = render(<ForensicWatermark />)
    expect(container.firstChild).toBeNull()
  })
})

describe('DLP Component: PrivacyShieldOverlay', () => {
  beforeEach(() => {
    usePrivacyStore.setState({ pantallaProtegida: false })
  })

  it('no renderiza la cortina cuando pantallaProtegida es false', () => {
    render(<PrivacyShieldOverlay />)
    expect(screen.queryByTestId('privacy-shield-overlay')).not.toBeInTheDocument()
  })

  it('renderiza la cortina de bloqueo cuando pantallaProtegida es true', () => {
    usePrivacyStore.setState({ pantallaProtegida: true })
    render(<PrivacyShieldOverlay />)

    expect(screen.getByTestId('privacy-shield-overlay')).toBeInTheDocument()
    expect(screen.getByText('Pantalla Protegida por Privacidad')).toBeInTheDocument()
  })

  it('desbloquea la pantalla al hacer clic en el botón de reanudar', () => {
    usePrivacyStore.setState({ pantallaProtegida: true })
    render(<PrivacyShieldOverlay />)

    const resumeBtn = screen.getByTestId('resume-session-button')
    fireEvent.click(resumeBtn)

    expect(usePrivacyStore.getState().pantallaProtegida).toBe(false)
  })
})
