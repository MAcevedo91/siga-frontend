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

  it('muestra badge de Circular N° 482 y banner de subsidiariedad cuando aplica normativa nacional', async () => {
    const mockResultadoNacional = {
      respuesta: 'Ante ciberacoso escolar, conforme a la Circular N° 482 de la Superintendencia...',
      fuentes: [
        {
          articulo: 'Protocolo 1: Ciberacoso y Violencia Digital',
          seccion: 'CIRCULAR N° 482',
          contenido: 'Notificación inmediata a apoderados en 24 horas y contención emocional.',
          es_normativa_nacional: true,
        },
      ],
      totalFuentes: 1,
      tiene_normativa_nacional: true,
    }
    vi.spyOn(riceService, 'consultarRiceRag').mockResolvedValueOnce(mockResultadoNacional)

    render(<AsistenteNormativoModal isOpen={true} onClose={vi.fn()} />)

    const textarea = screen.getByPlaceholderText(/Escriba su consulta jurídica o procedimental/i)
    fireEvent.change(textarea, { target: { value: '¿Qué hacer ante ciberacoso?' } })

    const btnConsultar = screen.getByRole('button', { name: /Consultar/i })
    fireEvent.click(btnConsultar)

    await waitFor(() => {
      expect(screen.getByText(/Ante ciberacoso escolar/i)).toBeInTheDocument()
      expect(screen.getByText(/Circular N° 482 \(Superintendencia\)/i)).toBeInTheDocument()
      expect(screen.getByText(/Aplicación de Normativa Nacional Subsidiaria:/i)).toBeInTheDocument()
    })
  })

  it('formatea correctamente elementos en negrita eliminando asteriscos literales', async () => {
    const mockResultadoFormato = {
      respuesta: 'Ante este hecho debe existir **contención inmediata** y citación en **24 horas**.\n\n### Procedimiento Obligatorio\n* Primer paso formativo.',
      fuentes: [],
      totalFuentes: 0,
    }
    vi.spyOn(riceService, 'consultarRiceRag').mockResolvedValueOnce(mockResultadoFormato)

    render(<AsistenteNormativoModal isOpen={true} onClose={vi.fn()} />)

    const textarea = screen.getByPlaceholderText(/Escriba su consulta jurídica o procedimental/i)
    fireEvent.change(textarea, { target: { value: 'consulta formato' } })

    const btnConsultar = screen.getByRole('button', { name: /Consultar/i })
    fireEvent.click(btnConsultar)

    await waitFor(() => {
      // Debe encontrar el texto dentro de tags strong
      const strongContencion = screen.getByText('contención inmediata')
      expect(strongContencion.tagName).toBe('STRONG')

      const strongHoras = screen.getByText('24 horas')
      expect(strongHoras.tagName).toBe('STRONG')

      // Debe renderizar el encabezado sin los ###
      expect(screen.getByText('Procedimiento Obligatorio')).toBeInTheDocument()
      expect(screen.queryByText(/###/)).toBeNull()
    })
  })
})
