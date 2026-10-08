import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import GestionRiceModal from '@/components/rice/GestionRiceModal'
import * as riceService from '@/services/riceService'

vi.mock('@/services/riceService')
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('GestionRiceModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(
      <GestionRiceModal isOpen={false} onClose={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('muestra datos del RICE activo cuando está disponible', async () => {
    vi.spyOn(riceService, 'getRiceActivo').mockResolvedValueOnce({
      id: 'doc-123',
      nombre_archivo: 'RICE_Oficial_2026.pdf',
      anio_vigencia: 2026,
      total_chunks: 42,
    })

    render(<GestionRiceModal isOpen={true} onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('RICE_Oficial_2026.pdf')).toBeInTheDocument()
      expect(screen.getByText(/Año 2026/i)).toBeInTheDocument()
      expect(screen.getByText(/42 fragmentos indexados/i)).toBeInTheDocument()
    })
  })
})
