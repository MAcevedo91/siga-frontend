import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ReporteMensualCard from '@/components/analytics/ReporteMensualCard'

describe('ReporteMensualCard Component (Diseño Interactivo)', () => {
  it('debe renderizar la tarjeta con encabezado, badge IA, sello del mes y botón de descarga', () => {
    render(<ReporteMensualCard onDownloadPdf={vi.fn()} />)

    expect(screen.getByText('Reporte mensual')).toBeInTheDocument()
    expect(screen.getByText('IA')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /descargar pdf/i })).toBeInTheDocument()
    expect(screen.getByText(/análisis directivo con ia/i)).toBeInTheDocument()
  })

  it('debe disparar onDownloadPdf y mostrar el estado busy y progreso al hacer clic', async () => {
    let resolver
    const mockDownload = vi.fn().mockImplementation(() => new Promise((resolve) => {
      resolver = resolve
    }))

    render(<ReporteMensualCard onDownloadPdf={mockDownload} />)

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
