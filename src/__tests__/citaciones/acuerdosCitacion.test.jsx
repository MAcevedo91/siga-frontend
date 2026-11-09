import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import CerrarCitacionAcuerdosModal from '@/components/citaciones/CerrarCitacionAcuerdosModal'
import * as citacionesService from '@/services/citacionesService'

vi.mock('@/services/citacionesService', () => ({
  registrarAcuerdosCitacion: vi.fn(),
  descargarActaCitacionPdf: vi.fn(),
}))

const mockCitacion = {
  id: 'cit-uuid-1234',
  folio: 'CIT-2026-0055',
  motivo_categoria: 'refuerzo_academico',
  estudiante: {
    nombre: 'Agustín',
    apellido: 'Tapia',
  },
  apoderado: {
    nombre: 'Lorena',
    apellido: 'Tapia',
  },
}

describe('TASK 10.2.3 — Componente CerrarCitacionAcuerdosModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(
      <CerrarCitacionAcuerdosModal
        isOpen={false}
        onClose={vi.fn()}
        citacion={mockCitacion}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('muestra el membrete, folio, estudiante y apoderado al abrirse', () => {
    render(
      <CerrarCitacionAcuerdosModal
        isOpen={true}
        onClose={vi.fn()}
        citacion={mockCitacion}
      />
    )

    expect(screen.getByText('CIT-2026-0055')).toBeInTheDocument()
    expect(screen.getByText('Cierre de Entrevista y Acuerdos Mutuos')).toBeInTheDocument()
    expect(screen.getByText('Agustín Tapia')).toBeInTheDocument()
    expect(screen.getByText('Lorena Tapia')).toBeInTheDocument()
    expect(screen.getByText('Compromisos del Colegio')).toBeInTheDocument()
    expect(screen.getByText('Compromisos del Apoderado')).toBeInTheDocument()
  })

  it('permite agregar nuevos campos de compromisos para el colegio y apoderado', () => {
    render(
      <CerrarCitacionAcuerdosModal
        isOpen={true}
        onClose={vi.fn()}
        citacion={mockCitacion}
      />
    )

    const botonesAgregar = screen.getAllByRole('button', { name: /Agregar/i })
    // Agregar compromiso colegio
    fireEvent.click(botonesAgregar[0])
    // Agregar compromiso apoderado
    fireEvent.click(botonesAgregar[1])

    const textareas = screen.getAllByRole('textbox')
    expect(textareas.length).toBe(4) // 2 para colegio, 2 para apoderado
  })

  it('envía los acuerdos mutuos y muestra el hash SHA-256 en pantalla de éxito', async () => {
    const mockHash = 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9'
    citacionesService.registrarAcuerdosCitacion.mockResolvedValue({
      acuerdos: { id: 'acuerdo-1' },
      hash_sha256: mockHash,
    })

    const handleSuccess = vi.fn()

    render(
      <CerrarCitacionAcuerdosModal
        isOpen={true}
        onClose={vi.fn()}
        citacion={mockCitacion}
        onSuccess={handleSuccess}
      />
    )

    const botonEnviar = screen.getByRole('button', { name: /Registrar Acuerdos y Emitir Acta/i })
    fireEvent.click(botonEnviar)

    await waitFor(() => {
      expect(citacionesService.registrarAcuerdosCitacion).toHaveBeenCalledWith(
        'cit-uuid-1234',
        expect.objectContaining({
          compromisos_colegio: expect.any(Array),
          compromisos_apoderado: expect.any(Array),
        })
      )
    })

    expect(await screen.findByText('¡Entrevista Concluida y Acta Oficial Emitida!')).toBeInTheDocument()
    expect(screen.getByText(mockHash)).toBeInTheDocument()
    expect(handleSuccess).toHaveBeenCalled()
  })

  it('permite descargar el Acta Oficial PDF tras el registro exitoso', async () => {
    citacionesService.registrarAcuerdosCitacion.mockResolvedValue({
      acuerdos: { id: 'acuerdo-1' },
      hash_sha256: 'sha256-test',
    })
    citacionesService.descargarActaCitacionPdf.mockResolvedValue(true)

    render(
      <CerrarCitacionAcuerdosModal
        isOpen={true}
        onClose={vi.fn()}
        citacion={mockCitacion}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Registrar Acuerdos y Emitir Acta/i }))

    const botonDescargar = await screen.findByRole('button', { name: /Descargar Acta Oficial PDF/i })
    fireEvent.click(botonDescargar)

    await waitFor(() => {
      expect(citacionesService.descargarActaCitacionPdf).toHaveBeenCalledWith(
        'cit-uuid-1234',
        'CIT-2026-0055'
      )
    })
  })
})
