import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SigiAvatar from '@/components/rice/SigiAvatar'

describe('SigiAvatar - Avatar Oficial de Sigi Copiloto Escolar', () => {
  it('renderiza la imagen del avatar con alt accesible por defecto', () => {
    render(<SigiAvatar />)

    const avatarContainer = screen.getByTestId('sigi-avatar')
    expect(avatarContainer).toBeInTheDocument()

    const img = screen.getByAltText(/Sigi — Copiloto Escolar/i)
    expect(img).toBeInTheDocument()
  })

  it('aplica clases de tamaño personalizadas según el prop size', () => {
    const { rerender } = render(<SigiAvatar size="xs" />)
    expect(screen.getByTestId('sigi-avatar')).toHaveClass('w-5', 'h-5')

    rerender(<SigiAvatar size="xl" />)
    expect(screen.getByTestId('sigi-avatar')).toHaveClass('w-14', 'h-14')

    rerender(<SigiAvatar size="2xl" />)
    expect(screen.getByTestId('sigi-avatar')).toHaveClass('w-24', 'h-24')
  })

  it('aplica la animación animate-pulse cuando isThinking es true', () => {
    render(<SigiAvatar isThinking={true} />)
    const avatar = screen.getByTestId('sigi-avatar')
    expect(avatar).toHaveClass('animate-pulse')
  })

  it('soporta la variante badge con los activos del logo circular de Sigi', () => {
    render(<SigiAvatar variant="badge" />)

    const img = screen.getByAltText(/Sigi — Copiloto Escolar/i)
    expect(img).toHaveAttribute('src', '/assets/sigi-badge.png')
  })

  it('cambia a fallback SVG con los colores característicos si la imagen falla al cargar', () => {
    render(<SigiAvatar />)

    const img = screen.getByAltText(/Sigi — Copiloto Escolar/i)
    fireEvent.error(img)

    // Se renderiza el SVG de fallback con el aria-label correspondiente
    const svgElement = screen.getByRole('img', { name: /Sigi — Copiloto Escolar/i })
    expect(svgElement).toBeInTheDocument()
  })
})
