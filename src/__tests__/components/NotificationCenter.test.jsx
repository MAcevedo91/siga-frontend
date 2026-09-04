import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import NotificationCenter from '../../components/notifications/NotificationCenter'

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('NotificationCenter', () => {
  const mockNotificaciones = [
    { id: 1, titulo: 'Test 1', mensaje: 'Message 1', leida: false, created_at: '2024-01-01T10:00:00Z' },
    { id: 2, titulo: 'Test 2', mensaje: 'Message 2', leida: true, created_at: '2024-01-01T11:00:00Z' }
  ]

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    notificaciones: mockNotificaciones,
    onMarcarLeida: vi.fn(),
    onMarcarTodasLeidas: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render when isOpen is false', () => {
    const { container } = renderWithRouter(
      <NotificationCenter {...defaultProps} isOpen={false} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('should render notification list', () => {
    renderWithRouter(<NotificationCenter {...defaultProps} />)

    expect(screen.getByText('Test 1')).toBeInTheDocument()
    expect(screen.getByText('Test 2')).toBeInTheDocument()
    expect(screen.getByText('Message 1')).toBeInTheDocument()
    expect(screen.getByText('Message 2')).toBeInTheDocument()
  })

  it('should display unread count', () => {
    renderWithRouter(<NotificationCenter {...defaultProps} />)

    expect(screen.getByText('1 sin leer')).toBeInTheDocument()
  })

  it('should show "Marcar todas como leídas" button when there are unread notifications', () => {
    renderWithRouter(<NotificationCenter {...defaultProps} />)

    expect(screen.getByText('Marcar todas como leídas')).toBeInTheDocument()
  })

  it('should not show "Marcar todas como leídas" button when all are read', () => {
    const allReadNotifications = mockNotificaciones.map(n => ({ ...n, leida: true }))

    renderWithRouter(
      <NotificationCenter {...defaultProps} notificaciones={allReadNotifications} />
    )

    expect(screen.queryByText('Marcar todas como leídas')).not.toBeInTheDocument()
  })

  it('should call onMarcarLeida when clicking unread notification', () => {
    const mockOnMarcarLeida = vi.fn()
    renderWithRouter(
      <NotificationCenter {...defaultProps} onMarcarLeida={mockOnMarcarLeida} />
    )

    fireEvent.click(screen.getByText('Test 1'))
    expect(mockOnMarcarLeida).toHaveBeenCalledWith(1)
  })

  it('should not call onMarcarLeida when clicking read notification', () => {
    const mockOnMarcarLeida = vi.fn()
    renderWithRouter(
      <NotificationCenter {...defaultProps} onMarcarLeida={mockOnMarcarLeida} />
    )

    fireEvent.click(screen.getByText('Test 2'))
    expect(mockOnMarcarLeida).not.toHaveBeenCalled()
  })

  it('should call onMarcarTodasLeidas when clicking button', async () => {
    const mockOnMarcarTodasLeidas = vi.fn()
    renderWithRouter(
      <NotificationCenter {...defaultProps} onMarcarTodasLeidas={mockOnMarcarTodasLeidas} />
    )

    fireEvent.click(screen.getByText('Marcar todas como leídas'))
    expect(mockOnMarcarTodasLeidas).toHaveBeenCalled()
  })

  it('should call onClose when clicking close button', () => {
    const mockOnClose = vi.fn()
    renderWithRouter(
      <NotificationCenter {...defaultProps} onClose={mockOnClose} />
    )

    const closeButton = screen.getAllByRole('button').find(btn =>
      btn.querySelector('svg')?.classList.contains('lucide-x')
    )
    fireEvent.click(closeButton)
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should call onClose when clicking overlay', () => {
    const mockOnClose = vi.fn()
    const { container } = renderWithRouter(
      <NotificationCenter {...defaultProps} onClose={mockOnClose} />
    )

    const overlay = container.querySelector('.fixed.inset-0.bg-black')
    fireEvent.click(overlay)
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should show empty state when no notifications', () => {
    renderWithRouter(
      <NotificationCenter {...defaultProps} notificaciones={[]} />
    )

    expect(screen.getByText('No hay notificaciones')).toBeInTheDocument()
  })

  it('should highlight unread notifications', () => {
    const { container } = renderWithRouter(<NotificationCenter {...defaultProps} />)

    const notifications = container.querySelectorAll('[class*="p-4"]')
    const unreadNotification = Array.from(notifications).find(n =>
      n.textContent.includes('Test 1')
    )

    expect(unreadNotification.className).toContain('bg-blue-50')
  })
})
