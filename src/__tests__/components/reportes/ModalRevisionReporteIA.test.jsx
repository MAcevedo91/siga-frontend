import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ModalRevisionReporteIA from '@/components/reportes/ModalRevisionReporteIA'
import * as reportesService from '@/services/reportesService'

// Mock de reportesService
vi.mock('@/services/reportesService', () => ({
  guardarBorradorReporte: vi.fn(),
  aprobarReporte: vi.fn(),
  generarBorradoresReporte: vi.fn(),
  descargarReportePdf: vi.fn(),
}))

// Mock de react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('ModalRevisionReporteIA (HU 6.2, HU 6.3.2, HU 6.4.2)', () => {
  const dummyIncidente = {
    id: 42,
    fecha: '2026-09-20',
    gravedad: 'Grave',
    relato: 'Discusión en el patio durante el recreo',
    medidas: 'Entrevista con inspectoría',
  }

  const dummyReportes = [
    {
      id: 'rep-uuid-1',
      incidente_id: 42,
      estudiante_id: 'est-uuid-1',
      version: 1,
      estado: 'Borrador',
      contenido_borrador: {
        contexto: 'Patio central de la escuela en recreo matutino.',
        hechos_objetivos: 'Se constata discusión entre dos alumnos.',
        medidas_adoptadas: 'Se traslada a inspectoría para contención.',
        acuerdos_compromisos: 'El alumno se compromete a respetar a sus pares.',
        plan_seguimiento: 'Seguimiento por profesor jefe durante 2 semanas.',
      },
      estudiantes: {
        id: 'est-uuid-1',
        rut: '22.333.444-5',
        nombre: 'Matías',
        apellido: 'González',
        es_pie: false,
        apoderados: [
          { id: 'apo-1', nombre: 'Carlos', apellido: 'González', email: 'carlos.gonzalez@correo.cl', es_titular: true },
        ],
      },
    },
    {
      id: 'rep-uuid-2',
      incidente_id: 42,
      estudiante_id: 'est-uuid-2',
      version: 1,
      estado: 'Borrador',
      contenido_borrador: {
        contexto: 'Patio central de la escuela en recreo matutino.',
        hechos_objetivos: 'Alumno involucrado en controversia verbal.',
        medidas_adoptadas: 'Atención pedagógica inmediata.',
        acuerdos_compromisos: 'Colaboración activa y diálogo formativo.',
        plan_seguimiento: 'Reunión con apoderado y seguimiento psicosocial.',
      },
      estudiantes: {
        id: 'est-uuid-2',
        rut: '23.444.555-6',
        nombre: 'Lucas',
        apellido: 'Silva',
        es_pie: true,
        apoderados: [
          { id: 'apo-2', nombre: 'Patricia', apellido: 'Silva', email: null, es_titular: true },
        ],
      },
    },
  ]

  const userDirectivo = {
    user_id: 'usr-1',
    nombre: 'Roberto',
    apellido: 'Miranda',
    rol: 'Directivo',
  }

  const userInspector = {
    user_id: 'usr-2',
    nombre: 'Carlos',
    apellido: 'Jorquera',
    rol: 'Inspector',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('no renderiza nada si isOpen es false', () => {
    const { container } = render(
      <ModalRevisionReporteIA
        isOpen={false}
        onClose={vi.fn()}
        incidente={dummyIncidente}
        reportes={dummyReportes}
        currentUser={userDirectivo}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renderiza el modal con las 5 secciones cuando isOpen es true', () => {
    render(
      <ModalRevisionReporteIA
        isOpen={true}
        onClose={vi.fn()}
        incidente={dummyIncidente}
        reportes={dummyReportes}
        currentUser={userDirectivo}
      />
    )

    expect(screen.getByText(/Asistente de Redacción Normativa RICE/i)).toBeInTheDocument()
    expect(screen.getByText(/Human-in-the-Loop/i)).toBeInTheDocument()
    expect(screen.getByText('1. Contexto Institucional y Espacial')).toBeInTheDocument()
    expect(screen.getByText('2. Hechos Objetivos Constatados')).toBeInTheDocument()
    expect(screen.getByText('3. Medidas Inmediatas Adoptadas')).toBeInTheDocument()
    expect(screen.getByText('4. Acuerdos y Compromisos Pedagógicos')).toBeInTheDocument()
    expect(screen.getByText('5. Plan de Acompañamiento y Seguimiento')).toBeInTheDocument()
  })

  it('renderiza selector de pestañas (tabs) para informes diferenciados si hay más de 1 reporte', () => {
    render(
      <ModalRevisionReporteIA
        isOpen={true}
        onClose={vi.fn()}
        incidente={dummyIncidente}
        reportes={dummyReportes}
        currentUser={userDirectivo}
      />
    )

    expect(screen.getByRole('button', { name: /Matías González/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Lucas Silva/i })).toBeInTheDocument()
  })

  it('preserva las ediciones locales sin borrarlas al alternar entre pestañas', async () => {
    render(
      <ModalRevisionReporteIA
        isOpen={true}
        onClose={vi.fn()}
        incidente={dummyIncidente}
        reportes={dummyReportes}
        currentUser={userDirectivo}
      />
    )

    // Editar contexto del primer estudiante (Matías)
    const contextoInput = screen.getByLabelText(/1. Contexto Institucional y Espacial/i)
    fireEvent.change(contextoInput, { target: { value: 'Contexto editado especialmente para Matías' } })
    expect(contextoInput.value).toBe('Contexto editado especialmente para Matías')

    // Cambiar a la pestaña de Lucas Silva
    const tabLucas = screen.getByRole('button', { name: /Lucas Silva/i })
    fireEvent.click(tabLucas)

    // Verificar que Lucas tiene su propio contexto inicial
    const contextoLucas = screen.getByLabelText(/1. Contexto Institucional y Espacial/i)
    expect(contextoLucas.value).toBe('Patio central de la escuela en recreo matutino.')

    // Volver a la pestaña de Matías
    const tabMatias = screen.getByRole('button', { name: /Matías González/i })
    fireEvent.click(tabMatias)

    // La edición no guardada de Matías debe seguir existiendo
    const contextoMatiasRecuperado = screen.getByLabelText(/1. Contexto Institucional y Espacial/i)
    expect(contextoMatiasRecuperado.value).toBe('Contexto editado especialmente para Matías')
  })

  it('guarda el borrador exitosamente con feedback de toast', async () => {
    reportesService.guardarBorradorReporte.mockResolvedValueOnce({
      ...dummyReportes[0],
      contenido_editado: {
        ...dummyReportes[0].contenido_borrador,
        contexto: 'Texto guardado',
      },
    })

    render(
      <ModalRevisionReporteIA
        isOpen={true}
        onClose={vi.fn()}
        incidente={dummyIncidente}
        reportes={dummyReportes}
        currentUser={userDirectivo}
      />
    )

    const guardarBtn = screen.getByRole('button', { name: /Guardar Borrador/i })
    fireEvent.click(guardarBtn)

    await waitFor(() => {
      expect(reportesService.guardarBorradorReporte).toHaveBeenCalledWith(
        dummyIncidente.id,
        dummyReportes[0].id,
        expect.any(Object)
      )
    })
  })

  it('restringe la aprobación a roles directivos/coordinación e impide al Inspector aprobar', () => {
    render(
      <ModalRevisionReporteIA
        isOpen={true}
        onClose={vi.fn()}
        incidente={dummyIncidente}
        reportes={dummyReportes}
        currentUser={userInspector}
      />
    )

    expect(screen.queryByRole('button', { name: /Aprobar y Oficializar/i })).not.toBeInTheDocument()
    expect(screen.getByText(/Aprobación reservada a Jefatura/i)).toBeInTheDocument()
  })

  it('permite al rol Directivo solicitar confirmación y aprobar el reporte', async () => {
    reportesService.aprobarReporte.mockResolvedValueOnce({
      ...dummyReportes[0],
      estado: 'Aprobado',
    })

    render(
      <ModalRevisionReporteIA
        isOpen={true}
        onClose={vi.fn()}
        incidente={dummyIncidente}
        reportes={dummyReportes}
        currentUser={userDirectivo}
      />
    )

    const aprobarBtn = screen.getByRole('button', { name: /Aprobar y Oficializar/i })
    fireEvent.click(aprobarBtn)

    expect(screen.getByText('Oficializar y Aprobar Informe')).toBeInTheDocument()
    expect(screen.getByText(/Al oficializar este informe, adquirirá/i)).toBeInTheDocument()

    const confirmarBtn = screen.getByRole('button', { name: /Confirmar Aprobación/i })
    fireEvent.click(confirmarBtn)

    await waitFor(() => {
      expect(reportesService.aprobarReporte).toHaveBeenCalledWith(
        dummyIncidente.id,
        dummyReportes[0].id,
        expect.any(Object)
      )
    })
  })

  it('permite regenerar propuesta tras confirmación en diálogo modal', async () => {
    reportesService.generarBorradoresReporte.mockResolvedValueOnce(dummyReportes)

    render(
      <ModalRevisionReporteIA
        isOpen={true}
        onClose={vi.fn()}
        incidente={dummyIncidente}
        reportes={dummyReportes}
        currentUser={userDirectivo}
      />
    )

    const regenerarBtn = screen.getByRole('button', { name: /Regenerar Propuesta/i })
    fireEvent.click(regenerarBtn)

    expect(screen.getByText('Regenerar Propuesta con IA')).toBeInTheDocument()
    const confirmRegenerarBtn = screen.getByRole('button', { name: /Sí, Regenerar Propuesta/i })
    fireEvent.click(confirmRegenerarBtn)

    await waitFor(() => {
      expect(reportesService.generarBorradoresReporte).toHaveBeenCalledWith(dummyIncidente.id)
    })
  })

  it('renderiza badge oficial de aprobación y feedback de correo enviado cuando el reporte está aprobado (HU 6.3.2 y 6.4.2)', async () => {
    const reporteAprobadoConEmail = [
      {
        ...dummyReportes[0],
        estado: 'Aprobado',
        fecha_aprobacion: '2026-09-21T10:30:00Z',
        aprobador: { id: 'usr-1', nombre: 'Roberto', apellido: 'Miranda', rol: 'Directivo' },
        email_apoderado_enviado: true,
        fecha_envio_email: '2026-09-21T10:35:00Z',
      },
    ]

    render(
      <ModalRevisionReporteIA
        isOpen={true}
        onClose={vi.fn()}
        incidente={dummyIncidente}
        reportes={reporteAprobadoConEmail}
        currentUser={userDirectivo}
      />
    )

    // Badge oficial de aprobación con check y nombre/fecha
    expect(screen.getByText(/Informe Oficial Aprobado por Roberto Miranda \(Directivo\) el 21-09-2026/i)).toBeInTheDocument()

    // Feedback visual de despacho de correo al apoderado (HU 6.4.2)
    expect(screen.getByText(/carlos.gonzalez@correo.cl/i)).toBeInTheDocument()
    expect(screen.getByText(/Correo entregado con PDF/i)).toBeInTheDocument()

    // Botones de descarga y previsualización (HU 6.3.2)
    const btnDescargar = screen.getAllByRole('button', { name: /Descargar PDF Oficial/i })[0]
    expect(btnDescargar).toBeInTheDocument()
    fireEvent.click(btnDescargar)

    await waitFor(() => {
      expect(reportesService.descargarReportePdf).toHaveBeenCalledWith(
        dummyIncidente.id,
        dummyReportes[0].id,
        'Informe_Incidente_42_Gonzalez.pdf',
        false
      )
    })

    // Botón ver en pestaña
    const btnPestana = screen.getAllByRole('button', { name: /Ver en pestaña/i })[0]
    fireEvent.click(btnPestana)

    await waitFor(() => {
      expect(reportesService.descargarReportePdf).toHaveBeenCalledWith(
        dummyIncidente.id,
        dummyReportes[0].id,
        'Informe_Incidente_42_Gonzalez.pdf',
        true
      )
    })
  })

  it('muestra alerta ámbar cuando el apoderado no tiene correo registrado (HU 6.4.2)', () => {
    const reporteAprobadoSinEmail = [
      {
        ...dummyReportes[1],
        estado: 'Aprobado',
        fecha_aprobacion: '2026-09-21T10:30:00Z',
        aprobador: { id: 'usr-1', nombre: 'Roberto', apellido: 'Miranda', rol: 'Directivo' },
        email_apoderado_enviado: false,
        fecha_envio_email: null,
      },
    ]

    render(
      <ModalRevisionReporteIA
        isOpen={true}
        onClose={vi.fn()}
        incidente={dummyIncidente}
        reportes={reporteAprobadoSinEmail}
        currentUser={userDirectivo}
      />
    )

    // Alerta ámbar de apoderado sin correo
    expect(screen.getByText(/Apoderado sin correo registrado\. Imprimir copia para citación presencial\./i)).toBeInTheDocument()
    expect(screen.getByText(/Imprimir copia oficial →/i)).toBeInTheDocument()
  })
})
