import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ConfirmacionCitacionPublicPage from '@/pages/ConfirmacionCitacionPublicPage'
import NuevaCitacionModal from '@/components/citaciones/NuevaCitacionModal'
import * as citacionesService from '@/services/citacionesService'

vi.mock('@/services/citacionesService', () => ({
  obtenerCitacionPublica: vi.fn(),
  responderCitacionPublica: vi.fn(),
  programarCitacion: vi.fn(),
  generarUrlGoogleCalendar: vi.fn(() => 'https://calendar.google.com/calendar/render?action=TEMPLATE'),
  descargarArchivoIcs: vi.fn(),
  CATEGORIAS_FORMATIVAS: {
    refuerzo_academico: {
      label: 'Refuerzo Académico',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      descripcion: 'Acompañamiento colaborativo para potenciar el aprendizaje y estrategias de estudio.',
    },
    habitos_asistencia: {
      label: 'Hábitos y Asistencia',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      descripcion: 'Acuerdos mutuos para fortalecer la puntualidad, asistencia y rutinas escolares.',
    },
    reconocimiento_felicitacion: {
      label: 'Reconocimiento y Felicitación',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      descripcion: 'Puesta en valor de logros significativos, compromiso y avances positivos del estudiante.',
    },
    acuerdos_convivencia: {
      label: 'Acuerdos de Convivencia',
      color: 'bg-sky-50 text-sky-700 border-sky-200',
      descripcion: 'Diálogo restaurativo para consolidar un trato respetuoso y bienestar en aula.',
    },
    seguimiento_formativo: {
      label: 'Seguimiento Formativo',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      descripcion: 'Evaluación periódica de compromisos previos en alianza familia-escuela.',
    },
  },
}))

describe('TASK 10.1.4 — Frontend: Citaciones Formativas y Confirmación Móvil', () => {
  const mockCitacionData = {
    id: 'cit-123',
    folio: 'CIT-2026-0042',
    motivo_categoria: 'acuerdos_convivencia',
    motivo_detalle: 'Reunión de seguimiento al acuerdo de convivencia escolar.',
    fecha_hora_programada: '2026-11-10T10:30:00.000Z',
    duracion_minutos: 45,
    modalidad: 'presencial',
    lugar_entrevista: 'Oficina Convivencia Escolar - Sala 2',
    enlace_virtual: null,
    estado: 'programada',
    estudiante: {
      nombre: 'Valentina',
      apellido: 'Baeza Miranda',
      curso: '8° Básico B',
    },
    apoderado: {
      nombre: 'Carlos',
      apellido: 'Baeza Toledo',
    },
    docente: {
      nombre: 'Prof. Mario Casas',
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('ConfirmacionCitacionPublicPage (Vista Móvil sin Login)', () => {
    it('muestra los datos sanitizados de la citación para el móvil del apoderado', async () => {
      citacionesService.obtenerCitacionPublica.mockResolvedValue(mockCitacionData)

      render(
        <MemoryRouter initialEntries={['/citaciones/confirmacion/valid-token-123']}>
          <Routes>
            <Route path="/citaciones/confirmacion/:token" element={<ConfirmacionCitacionPublicPage />} />
          </Routes>
        </MemoryRouter>
      )

      expect(screen.getByText(/cargando convocatoria/i)).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByText(/CIT-2026-0042/)).toBeInTheDocument()
        expect(screen.getByText(/Valentina Baeza Miranda/)).toBeInTheDocument()
        expect(screen.getByText(/Prof. Mario Casas/)).toBeInTheDocument()
        expect(screen.getByText(/Oficina Convivencia Escolar - Sala 2/)).toBeInTheDocument()
        expect(screen.getByText(/Acuerdos de Convivencia/)).toBeInTheDocument()
      })
    })

    it('permite al apoderado confirmar la asistencia en 1-clic y descargar calendario', async () => {
      citacionesService.obtenerCitacionPublica.mockResolvedValue(mockCitacionData)
      citacionesService.responderCitacionPublica.mockResolvedValue({
        citacion: {
          ...mockCitacionData,
          estado: 'confirmada',
        },
        mensaje: 'Su asistencia ha sido confirmada correctamente.',
      })

      render(
        <MemoryRouter initialEntries={['/citaciones/confirmacion/valid-token-123']}>
          <Routes>
            <Route path="/citaciones/confirmacion/:token" element={<ConfirmacionCitacionPublicPage />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /confirmar mi asistencia/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /confirmar mi asistencia/i }))

      await waitFor(() => {
        expect(citacionesService.responderCitacionPublica).toHaveBeenCalledWith({
          token: 'valid-token-123',
          accion: 'confirmar',
          comentario: null,
          nueva_fecha_solicitada: null,
        })
        expect(screen.getByText(/¡asistencia confirmada!/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /guardar en mi calendario/i })).toBeInTheDocument()
        expect(screen.getByText(/google calendar/i)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /guardar en mi calendario/i }))
      expect(citacionesService.descargarArchivoIcs).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'cit-123',
          estado: 'confirmada',
        })
      )
    })

    it('permite al apoderado proponer reprogramación indicando comentario y nueva fecha', async () => {
      citacionesService.obtenerCitacionPublica.mockResolvedValue(mockCitacionData)
      citacionesService.responderCitacionPublica.mockResolvedValue({
        citacion: {
          ...mockCitacionData,
          estado: 'reprogramacion_solicitada',
        },
        mensaje: 'Su propuesta de reprogramación ha sido enviada al docente.',
      })

      render(
        <MemoryRouter initialEntries={['/citaciones/confirmacion/valid-token-123']}>
          <Routes>
            <Route path="/citaciones/confirmacion/:token" element={<ConfirmacionCitacionPublicPage />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /solicitar reprogramación/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /solicitar reprogramación/i }))

      expect(screen.getByText(/proponer nueva fecha/i)).toBeInTheDocument()
      const comentarioInput = screen.getByPlaceholderText(/por motivos de trabajo/i)
      fireEvent.change(comentarioInput, {
        target: { value: 'Solicito coordinar en horario de la tarde por motivos laborales.' },
      })

      const fechaInput = screen.getByLabelText(/propuesta de fecha y horario/i)
      fireEvent.change(fechaInput, { target: { value: '2026-11-12T15:00' } })

      fireEvent.click(screen.getByRole('button', { name: /enviar propuesta de reprogramación/i }))

      await waitFor(() => {
        expect(citacionesService.responderCitacionPublica).toHaveBeenCalledWith({
          token: 'valid-token-123',
          accion: 'reprogramar',
          comentario: 'Solicito coordinar en horario de la tarde por motivos laborales.',
          nueva_fecha_solicitada: '2026-11-12T15:00',
        })
        expect(screen.getByText(/solicitud de reprogramación enviada/i)).toBeInTheDocument()
      })
    })

    it('muestra pantalla de enlace expirado cuando el token supera las 72 horas (HTTP 410)', async () => {
      const expiredError = {
        response: {
          status: 410,
          data: {
            code: 'TOKEN_EXPIRADO',
            message: 'El enlace de confirmación ha expirado tras 72 horas.',
          },
        },
      }
      citacionesService.obtenerCitacionPublica.mockRejectedValue(expiredError)

      render(
        <MemoryRouter initialEntries={['/citaciones/confirmacion/token-expirado-72h']}>
          <Routes>
            <Route path="/citaciones/confirmacion/:token" element={<ConfirmacionCitacionPublicPage />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText(/enlace expirado/i)).toBeInTheDocument()
        expect(screen.getByText(/72 horas/i)).toBeInTheDocument()
        expect(screen.getByText(/¿cómo proceder\?/i)).toBeInTheDocument()
      })
    })
  })

  describe('NuevaCitacionModal (Agendamiento por Docente/Directivo)', () => {
    const mockEstudiante = {
      id: 'est-101',
      nombre: 'Martina',
      apellido: 'Lagos Pérez',
      curso: '7° Básico A',
    }

    const mockApoderado = {
      id: 'apo-202',
      nombre: 'Lorena',
      apellido: 'Pérez Silva',
      email: 'lorena.perez@example.com',
      telefono: '+56987654321',
    }

    it('valida que el motivo pedagógico tenga al menos 10 caracteres', async () => {
      render(
        <NuevaCitacionModal
          isOpen={true}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
          estudiante={mockEstudiante}
          apoderado={mockApoderado}
        />
      )

      expect(screen.getByText(/programar citación formativa/i)).toBeInTheDocument()

      const motivoInput = screen.getByLabelText(/mensaje de convocatoria/i)
      fireEvent.change(motivoInput, { target: { value: 'Corto' } })

      fireEvent.click(screen.getByRole('button', { name: /programar y despachar/i }))

      await waitFor(() => {
        expect(screen.getByText(/debe contener al menos 10 caracteres/i)).toBeInTheDocument()
      })
      expect(citacionesService.programarCitacion).not.toHaveBeenCalled()
    })

    it('alerta y previene conflicto de horario 409 cuando el docente tiene otra citación en el bloque', async () => {
      const conflictError = {
        response: {
          status: 409,
          data: {
            message: 'Conflicto de horario: Ya cuenta con una citación agendada en ese bloque horario (ventana de 45 min).',
          },
        },
      }
      citacionesService.programarCitacion.mockRejectedValue(conflictError)
      const onSuccessMock = vi.fn()

      render(
        <NuevaCitacionModal
          isOpen={true}
          onClose={vi.fn()}
          onSuccess={onSuccessMock}
          estudiante={mockEstudiante}
          apoderado={mockApoderado}
        />
      )

      const motivoInput = screen.getByLabelText(/mensaje de convocatoria/i)
      fireEvent.change(motivoInput, {
        target: { value: 'Reunión de seguimiento al acuerdo pedagógico de matemáticas.' },
      })

      fireEvent.click(screen.getByRole('button', { name: /programar y despachar/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/conflicto de horario/i)
      })
      expect(onSuccessMock).not.toHaveBeenCalled()
    })

    it('crea la citación exitosamente y notifica al componente padre', async () => {
      const responseData = {
        id: 'cit-999',
        folio: 'CIT-2026-0099',
        fecha_hora_programada: '2026-11-10T10:30:00.000Z',
        estado: 'programada',
        token_confirmacion: 'uuid-token-seguro-72h',
      }
      citacionesService.programarCitacion.mockResolvedValue(responseData)
      const onSuccessMock = vi.fn()

      render(
        <NuevaCitacionModal
          isOpen={true}
          onClose={vi.fn()}
          onSuccess={onSuccessMock}
          estudiante={mockEstudiante}
          apoderado={mockApoderado}
        />
      )

      const motivoInput = screen.getByLabelText(/mensaje de convocatoria/i)
      fireEvent.change(motivoInput, {
        target: { value: 'Reunión colaborativa para revisar plan de apoyo formativo.' },
      })

      fireEvent.click(screen.getByRole('button', { name: /programar y despachar/i }))

      await waitFor(() => {
        expect(citacionesService.programarCitacion).toHaveBeenCalledWith(
          expect.objectContaining({
            estudiante_id: 'est-101',
            apoderado_id: 'apo-202',
            motivo_categoria: 'refuerzo_academico',
            motivo_detalle: 'Reunión colaborativa para revisar plan de apoyo formativo.',
            modalidad: 'presencial',
          })
        )
        expect(onSuccessMock).toHaveBeenCalledWith(responseData)
        expect(screen.getByText(/¡citación formativa programada!/i)).toBeInTheDocument()
      })
    })
  })
})
