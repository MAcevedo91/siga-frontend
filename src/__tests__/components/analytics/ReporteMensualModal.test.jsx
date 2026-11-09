import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ReporteMensualModal from '@/components/analytics/ReporteMensualModal'

describe('ReporteMensualModal Component (Modal Compacto Interactivo)', () => {
  it('no debe renderizar nada cuando isOpen es false', () => {
    const { container } = render(
      <ReporteMensualModal isOpen={false} onClose={vi.fn()} onDownloadPdf={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('debe renderizar el modal compacto con título, badge IA, botón de cierre y botón de descarga cuando isOpen es true', () => {
    const handleClose = vi.fn()
    render(
      <ReporteMensualModal isOpen={true} onClose={handleClose} onDownloadPdf={vi.fn()} />
    )

    expect(screen.getByText('Reporte mensual')).toBeInTheDocument()
    expect(screen.getByText('IA')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /descargar pdf/i })).toBeInTheDocument()
    expect(screen.getByText(/análisis directivo con ia/i)).toBeInTheDocument()

    // Botón de cierre
    const btnCerrar = screen.getByRole('button', { name: /cerrar modal/i })
    expect(btnCerrar).toBeInTheDocument()
    fireEvent.click(btnCerrar)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('debe disparar onDownloadPdf y mostrar el estado busy y progreso al hacer clic en descargar', async () => {
    let resolver
    const mockDownload = vi.fn().mockImplementation(() => new Promise((resolve) => {
      resolver = resolve
    }))

    render(
      <ReporteMensualModal isOpen={true} onClose={vi.fn()} onDownloadPdf={mockDownload} />
    )

    const btn = screen.getByRole('button', { name: /descargar pdf/i })
    fireEvent.click(btn)

    expect(mockDownload).toHaveBeenCalledTimes(1)
    expect(screen.getByText(/analizando datos…/i)).toBeInTheDocument()

    // Resolver la descarga
    resolver()

    await waitFor(() => {
      expect(screen.getByText(/listo ✓/i)).toBeInTheDocument()
    })
  })
})
