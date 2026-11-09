import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import EntrevistaCitacionModal from '@/components/citaciones/EntrevistaCitacionModal'
import LienzoFirmaCitacion from '@/components/citaciones/LienzoFirmaCitacion'
import * as citacionesService from '@/services/citacionesService'

vi.mock('@/services/citacionesService', () => ({
  registrarAcuerdosCitacion: vi.fn(),
  descargarActaCitacionPdf: vi.fn(),
}))

const mockCitacion = {
  id: 'cit-uuid-7777',
  folio: 'CIT-2026-0077',
  motivo_categoria: 'habitos_asistencia',
  estudiante: {
    nombre: 'Martina',
    apellido: 'Soto',
  },
  apoderado: {
    nombre: 'Carlos',
    apellido: 'Soto',
  },
  docente: {
    nombre: 'Prof. Juan Valenzuela',
  },
}

describe('TASK 10.2.4 — Componente de Entrevista Presencial y Firmas en React', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock de métodos de canvas en jsdom
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      clearRect: vi.fn(),
      drawImage: vi.fn(),
    })
    HTMLCanvasElement.prototype.setPointerCapture = vi.fn()
    HTMLCanvasElement.prototype.releasePointerCapture = vi.fn()
    HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,mockPngSignature')
  })

  describe('1. Componente LienzoFirmaCitacion (Captura a 60 FPS)', () => {
    it('renderiza las pestañas de firmantes y permite alternar entre Docente y Apoderado', () => {
      const handleFirmaChange = vi.fn()
      render(
        <LienzoFirmaCitacion
          firmas={{ docente: null, apoderado: null }}
          onFirmaChange={handleFirmaChange}
          docenteNombre="Profesor Convocante"
          apoderadoNombre="Apoderado Responsable"
        />
      )

      expect(screen.getByText('Docente / Directivo')).toBeInTheDocument()
      expect(screen.getByText('Apoderado Titular')).toBeInTheDocument()
      expect(screen.getByText(/Profesor Convocante/i)).toBeInTheDocument()

      // Cambiar a pestaña apoderado
      fireEvent.click(screen.getByText('Apoderado Titular'))
      expect(screen.getByText(/Apoderado Responsable/i)).toBeInTheDocument()
    })

    it('captura trazos y notifica el PNG base64 generado', () => {
      const handleFirmaChange = vi.fn()
      render(
        <LienzoFirmaCitacion
          firmas={{ docente: null, apoderado: null }}
          onFirmaChange={handleFirmaChange}
        />
      )

      const canvas = screen.getByLabelText(/Lienzo de firma/i)
      fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 50, clientY: 50 })
      fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 100, clientY: 100 })
      fireEvent.pointerUp(canvas, { pointerId: 1 })

      expect(handleFirmaChange).toHaveBeenCalledWith('docente', 'data:image/png;base64,mockPngSignature')
    })

    it('permite limpiar el trazo con el botón Limpiar Trazo', () => {
      const handleFirmaChange = vi.fn()
      render(
        <LienzoFirmaCitacion
          firmas={{ docente: 'data:image/png;base64,existente', apoderado: null }}
          onFirmaChange={handleFirmaChange}
        />
      )

      fireEvent.click(screen.getByText(/Limpiar Trazo/i))
      expect(handleFirmaChange).toHaveBeenCalledWith('docente', null)
    })
  })

  describe('2. Componente EntrevistaCitacionModal (Flujo Guiado de Entrevista)', () => {
    it('Criterio 1: presenta el selector de sugerencias rápidas y campos editables', () => {
      render(
        <EntrevistaCitacionModal
          isOpen={true}
          onClose={vi.fn()}
          citacion={mockCitacion}
        />
      )

      expect(screen.getByText('CIT-2026-0077')).toBeInTheDocument()
      expect(screen.getByText('Martina Soto')).toBeInTheDocument()
      expect(screen.getByText(/Sugerencias pedagógicas rápidas/i)).toBeInTheDocument()
      expect(screen.getByText(/Sugerencias para el hogar/i)).toBeInTheDocument()

      // Clic en sugerencia para agregar compromiso
      const chipSugerencia = screen.getByText('+ Monitoreo semanal de avances por el profesor jefe')
      fireEvent.click(chipSugerencia)

      expect(screen.getByDisplayValue('Monitoreo semanal de avances por el profesor jefe')).toBeInTheDocument()
    })

    it('Criterio 2: avanza a firmas presenciales y permite registrar ambas firmas', async () => {
      render(
        <EntrevistaCitacionModal
          isOpen={true}
          onClose={vi.fn()}
          citacion={mockCitacion}
        />
      )

      // Paso 1: Avanzar a Firmas
      const botonContinuar = screen.getByRole('button', { name: /Continuar a Firmas Presenciales/i })
      fireEvent.click(botonContinuar)

      // Paso 2: Vista de Firmas
      expect(screen.getByText(/Por favor, invite a las partes a firmar/i)).toBeInTheDocument()
      expect(screen.getByText(/Finalizar y Sellar Acta Oficial/i)).toBeInTheDocument()

      // Puede volver al paso 1
      fireEvent.click(screen.getByRole('button', { name: /Volver a Acuerdos/i }))
      expect(screen.getByText(/Compromisos del Colegio/i)).toBeInTheDocument()
    })

    it('Criterio 3: registra acuerdos, firmas y permite la descarga directa del PDF', async () => {
      citacionesService.registrarAcuerdosCitacion.mockResolvedValue({
        acuerdos: { id: 'acuerdo-777' },
        hash_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      })
      citacionesService.descargarActaCitacionPdf.mockResolvedValue(true)

      const handleSuccess = vi.fn()

      render(
        <EntrevistaCitacionModal
          isOpen={true}
          onClose={vi.fn()}
          citacion={mockCitacion}
          onSuccess={handleSuccess}
        />
      )

      // Avanzar al paso de firmas
      fireEvent.click(screen.getByRole('button', { name: /Continuar a Firmas Presenciales/i }))

      // Finalizar entrevista
      const botonFinalizar = screen.getByRole('button', { name: /Finalizar y Sellar Acta Oficial/i })
      fireEvent.click(botonFinalizar)

      await waitFor(() => {
        expect(citacionesService.registrarAcuerdosCitacion).toHaveBeenCalledWith(
          'cit-uuid-7777',
          expect.objectContaining({
            compromisos_colegio: expect.any(Array),
            compromisos_apoderado: expect.any(Array),
          })
        )
      })

      // Paso 3: Éxito y descarga
      expect(await screen.findByText('¡Entrevista Presencial Concluida Exitosamente!')).toBeInTheDocument()
      expect(screen.getByText('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')).toBeInTheDocument()

      // Probar botón de descarga
      const botonDescarga = screen.getByRole('button', { name: /Descargar Acta Oficial PDF/i })
      fireEvent.click(botonDescarga)

      await waitFor(() => {
        expect(citacionesService.descargarActaCitacionPdf).toHaveBeenCalledWith(
          'cit-uuid-7777',
          'CIT-2026-0077'
        )
      })
    })
  })
})
