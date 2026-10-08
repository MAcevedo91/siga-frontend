import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AsistenteNormativoModal from '@/components/rice/AsistenteNormativoModal'
import * as riceService from '@/services/riceService'

vi.mock('@/services/riceService')
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('AsistenteNormativoModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(
      <AsistenteNormativoModal isOpen={false} onClose={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renderiza cabecera, buscador y sugerencias cuando isOpen es true', () => {
    render(<AsistenteNormativoModal isOpen={true} onClose={vi.fn()} />)

    expect(screen.getByText('Copiloto Normativo RICE')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(/Escriba su consulta jurídica o procedimental/i)
    ).toBeInTheDocument()
    expect(screen.getByText('Consultas frecuentes recomendadas:')).toBeInTheDocument()
  })

  it('ejecuta consulta y muestra respuesta con fuentes citadas', async () => {
    const mockResultado = {
      respuesta: 'Según el Artículo 15 del RICE, las agresiones conllevan medidas pedagógicas.',
      fuentes: [
        {
          articulo: 'Artículo 15: Faltas Graves',
          seccion: 'TÍTULO II',
          contenido: 'Texto normativo citado de prueba.',
        },
      ],
      totalFuentes: 1,
    }
    vi.spyOn(riceService, 'consultarRiceRag').mockResolvedValueOnce(mockResultado)

    render(<AsistenteNormativoModal isOpen={true} onClose={vi.fn()} />)

    const textarea = screen.getByPlaceholderText(/Escriba su consulta jurídica o procedimental/i)
    fireEvent.change(textarea, { target: { value: '¿Qué hacer ante agresión?' } })

    const btnConsultar = screen.getByRole('button', { name: /Consultar/i })
    fireEvent.click(btnConsultar)

    await waitFor(() => {
      expect(screen.getByText(/Según el Artículo 15 del RICE/i)).toBeInTheDocument()
      expect(screen.getByText(/Artículo 15: Faltas Graves/i)).toBeInTheDocument()
      expect(screen.getByText(/"Texto normativo citado de prueba."/i)).toBeInTheDocument()
    })
  })
})
