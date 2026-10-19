import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import IncidenteDetallePage from '@/pages/IncidenteDetallePage'
import * as incidentesService from '@/services/incidentesService'
import * as reportesService from '@/services/reportesService'
import { useAuth } from '@/store/useAuthStore'

vi.mock('@/store/useAuthStore', () => ({
  useAuth: vi.fn(),
  default: vi.fn(),
}))

vi.mock('@/services/incidentesService', () => ({
  getIncidenteById: vi.fn(),
  updateEstadoIncidente: vi.fn(),
  updateObservacionEstudiante: vi.fn(),
}))

vi.mock('@/services/reportesService', () => ({
  getReportesIncidente: vi.fn(),
  generarBorradoresReporte: vi.fn(),
  guardarBorradorReporte: vi.fn(),
  aprobarReporte: vi.fn(),
  descargarReportePdf: vi.fn(),
}))

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('IncidenteDetallePage con Asistente de Reportes IA (HU 6.2, HU 6.3.2, HU 6.4.2)', () => {
  const dummyIncidente = {
    id: 15,
    fecha: '2026-09-15',
    gravedad: 'Grave',
    tipo_abordaje: 'Mediación formativa',
    relato: 'Discusión entre estudiantes en el patio principal.',
    medidas: 'Contención inicial y derivación.',
    estado: 'En Investigación',
    estudiantes: [
      { id: 'est-1', nombre: 'Juan', apellido: 'Pérez', curso: '1° Medio A', es_victima: true },
      { id: 'est-2', nombre: 'Diego', apellido: 'Araya', curso: '1° Medio B', es_victima: false },
    ],
  }

  const dummyReportes = [
    {
      id: 'rep-1',
      incidente_id: 15,
      estudiante_id: 'est-1',
      estado: 'Borrador',
      contenido_borrador: {
        contexto: 'Patio escolar',
        hechos_objetivos: 'Discusión observada',
        medidas_adoptadas: 'Contención',
        acuerdos_compromisos: 'Diálogo',
        plan_seguimiento: 'Acompañamiento',
      },
      estudiantes: { id: 'est-1', nombre: 'Juan', apellido: 'Pérez', rut: '21.000.111-2' },
    },
  ]

  const dummyReporteAprobadoConEmail = [
    {
      id: 'rep-1',
      incidente_id: 15,
      estudiante_id: 'est-1',
      estado: 'Aprobado',
      fecha_aprobacion: '2026-09-16T11:00:00Z',
      aprobador: { id: 'usr-1', nombre: 'Roberto', apellido: 'Miranda', rol: 'Directivo' },
      email_apoderado_enviado: true,
      fecha_envio_email: '2026-09-16T11:05:00Z',
      estudiantes: {
        id: 'est-1',
        nombre: 'Juan',
        apellido: 'Pérez',
        rut: '21.000.111-2',
        apoderados: [
          { id: 'apo-1', nombre: 'Carmen', apellido: 'Pérez', email: 'carmen.perez@correo.cl', es_titular: true },
        ],
      },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    incidentesService.getIncidenteById.mockResolvedValue(dummyIncidente)
    reportesService.getReportesIncidente.mockResolvedValue([])
    reportesService.generarBorradoresReporte.mockResolvedValue([])
  })

  const renderComponent = (rol = 'Administrador') => {
    useAuth.mockReturnValue({
      user: { user_id: 'usr-1', nombre: 'Test User', rol },
    })

    return render(
      <MemoryRouter initialEntries={['/incidentes/15']}>
        <Routes>
          <Route path="/incidentes/:id" element={<IncidenteDetallePage />} />
        </Routes>
      </MemoryRouter>
    )
  }

  it('renderiza botón "Generar Informe Oficial con IA" cuando no hay reportes previos para rol autorizado', async () => {
    reportesService.getReportesIncidente.mockResolvedValue([])
    renderComponent('Administrador')

    expect(await screen.findByText('Incidente #15')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Generar Informe Oficial con IA/i })).toBeInTheDocument()
  })

  it('no muestra el botón de asistente de reportes para rol Docente', async () => {
    reportesService.getReportesIncidente.mockResolvedValue([])
    renderComponent('Docente')

    expect(await screen.findByText('Incidente #15')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Informe Oficial con IA/i })).not.toBeInTheDocument()
  })

  it('muestra botón "Ver / Editar Informes Oficiales (1)" y banner cuando ya existen reportes', async () => {
    reportesService.getReportesIncidente.mockResolvedValue(dummyReportes)
    renderComponent('Directivo')

    expect(await screen.findByText('Incidente #15')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /Ver \/ Editar Informes Oficiales \(1\)/i })).toBeInTheDocument()
    expect(screen.getByText(/1 informe\(s\) normativo\(s\) disponible\(s\)/i)).toBeInTheDocument()
  })

  it('al pulsar "Generar Informe Oficial con IA" invoca la generación asistida y abre el modal', async () => {
    reportesService.getReportesIncidente.mockResolvedValue([])
    reportesService.generarBorradoresReporte.mockResolvedValue(dummyReportes)

    renderComponent('Inspector')

    const botonGenerar = await screen.findByRole('button', { name: /Generar Informe Oficial con IA/i })
    fireEvent.click(botonGenerar)

    await waitFor(() => {
      expect(reportesService.generarBorradoresReporte).toHaveBeenCalledWith('15')
    })
    expect(await screen.findByText(/Asistente de Redacción Normativa RICE/i)).toBeInTheDocument()
  })

  it('renderiza sección de reportes aprobados con botones de descarga PDF y feedback de correo (HU 6.3.2 y 6.4.2)', async () => {
    reportesService.getReportesIncidente.mockResolvedValue(dummyReporteAprobadoConEmail)
    renderComponent('Directivo')

    expect(await screen.findByText(/Informes Normativos Oficiales \(RICE\)/i)).toBeInTheDocument()

    // Badge verde oficial
    expect(screen.getByText(/Informe Oficial Aprobado por Roberto Miranda \(Directivo\) el 16-09-2026/i)).toBeInTheDocument()

    // Feedback visual correo enviado
    expect(screen.getByText(/carmen.perez@correo.cl/i)).toBeInTheDocument()

    // Botón descargar PDF
    const btnDescargar = screen.getByRole('button', { name: /Descargar PDF Oficial/i })
    expect(btnDescargar).toBeInTheDocument()
    fireEvent.click(btnDescargar)

    await waitFor(() => {
      expect(reportesService.descargarReportePdf).toHaveBeenCalledWith(
        15,
        'rep-1',
        'Informe_Incidente_15_Perez.pdf',
        false
      )
    })

    // Botón ver en pestaña
    const btnPestana = screen.getByRole('button', { name: /Ver en pestaña/i })
    fireEvent.click(btnPestana)

    await waitFor(() => {
      expect(reportesService.descargarReportePdf).toHaveBeenCalledWith(
        15,
        'rep-1',
        'Informe_Incidente_15_Perez.pdf',
        true
      )
    })
  })

  it('humaniza el título del encabezado mostrando los estudiantes involucrados', async () => {
    renderComponent('Administrador')

    expect(await screen.findByText('Juan Pérez y Diego Araya')).toBeInTheDocument()
    expect(screen.getByText(/Incidente #15/i)).toBeInTheDocument()
  })

  it('renderiza stepper de estado y permite abrir modal de justificación para actualizar estado', async () => {
    incidentesService.updateEstadoIncidente.mockResolvedValue({
      ...dummyIncidente,
      estado: 'Derivado',
    })

    renderComponent('Administrador')

    expect(await screen.findByText('Estado del Incidente')).toBeInTheDocument()
    expect(screen.getByText('Actual')).toBeInTheDocument()

    // Cambiar select de estado a "Derivado"
    const select = screen.getByLabelText(/Cambiar Estado/i)
    fireEvent.change(select, { target: { value: 'Derivado' } })

    // El botón se habilita
    const btnActualizar = screen.getByRole('button', { name: /Actualizar Estado/i })
    expect(btnActualizar).not.toBeDisabled()
    fireEvent.click(btnActualizar)

    // Se abre el modal de justificación
    expect(await screen.findByText('Confirmar Cambio de Estado')).toBeInTheDocument()
    expect(screen.getByText(/El estado del caso cambiará de/i)).toBeInTheDocument()

    // Confirmar en el modal
    const btnConfirmar = screen.getByRole('button', { name: /Confirmar Actualización/i })
    fireEvent.click(btnConfirmar)

    await waitFor(() => {
      expect(incidentesService.updateEstadoIncidente).toHaveBeenCalledWith(
        '15',
        'Derivado',
        expect.objectContaining({
          justificacion: '',
          observacionesEstudiantes: expect.any(Array),
        })
      )
    })
  })

  it('permite ingresar observaciones individuales por alumno al derivar y gestionarlas en su tarjeta (Hallazgo 5)', async () => {
    incidentesService.updateEstadoIncidente.mockResolvedValue({
      ...dummyIncidente,
      estado: 'Derivado',
      estudiantes: [
        { id: 'est-1', nombre: 'Juan', apellido: 'Pérez', curso: '1° Medio A', observacion: 'Derivado a psicólogo por contención' },
        { id: 'est-2', nombre: 'Diego', apellido: 'Araya', curso: '1° Medio B', observacion: 'Derivado a orientación y citación' },
      ],
    })

    incidentesService.updateObservacionEstudiante.mockResolvedValue({
      incidente_id: 15,
      estudiante_id: 'est-1',
      observacion: 'Derivado a psicólogo por contención',
    })

    renderComponent('Administrador')

    expect(await screen.findByText('Estado del Incidente')).toBeInTheDocument()

    // Cambiar select de estado a "Derivado"
    const select = screen.getByLabelText(/Cambiar Estado/i)
    fireEvent.change(select, { target: { value: 'Derivado' } })

    const btnActualizar = screen.getByRole('button', { name: /Actualizar Estado/i })
    fireEvent.click(btnActualizar)

    // Se verifica que aparezca la sección de observaciones individuales por alumno
    expect(await screen.findByText(/Observaciones Individuales de Derivación por Alumno/i)).toBeInTheDocument()

    const inputObservacionJuan = screen.getByPlaceholderText(/Observación individual de derivación para Juan/i)
    fireEvent.change(inputObservacionJuan, {
      target: { value: 'Derivado a psicólogo por contención emocional inmediata' },
    })

    const inputObservacionDiego = screen.getByPlaceholderText(/Observación individual de derivación para Diego/i)
    fireEvent.change(inputObservacionDiego, {
      target: { value: 'Derivado a taller formativo de resolución de conflictos' },
    })

    // Confirmar actualización
    const btnConfirmar = screen.getByRole('button', { name: /Confirmar Actualización/i })
    fireEvent.click(btnConfirmar)

    await waitFor(() => {
      expect(incidentesService.updateEstadoIncidente).toHaveBeenCalledWith(
        '15',
        'Derivado',
        expect.objectContaining({
          observacionesEstudiantes: expect.arrayContaining([
            { estudiante_id: 'est-1', observacion: 'Derivado a psicólogo por contención emocional inmediata' },
            { estudiante_id: 'est-2', observacion: 'Derivado a taller formativo de resolución de conflictos' },
          ]),
        })
      )
    })
  })

  it('permite abrir el modal individual y actualizar la observación de un estudiante específico', async () => {
    incidentesService.updateObservacionEstudiante.mockResolvedValue({
      incidente_id: 15,
      estudiante_id: 'est-1',
      observacion: 'Nueva observación individualizada',
    })

    renderComponent('Administrador')

    // Click en "+ Agregar Observación Individual" del primer estudiante
    const btnsAgregar = await screen.findAllByRole('button', { name: /\+ Agregar Observación Individual/i })
    fireEvent.click(btnsAgregar[0])

    // Se abre el modal individual
    expect(await screen.findByText('Observación Individual de Derivación')).toBeInTheDocument()
    expect(screen.getByText(/Detalle de la Derivación o Actuación Individual/i)).toBeInTheDocument()

    const textarea = screen.getByLabelText(/Detalle de la Derivación o Actuación Individual/i)
    fireEvent.change(textarea, { target: { value: 'Derivado a dupla psicosocial para seguimiento quincenal' } })

    const btnGuardar = screen.getByRole('button', { name: /Guardar Observación/i })
    fireEvent.click(btnGuardar)

    await waitFor(() => {
      expect(incidentesService.updateObservacionEstudiante).toHaveBeenCalledWith(
        15,
        'est-1',
        'Derivado a dupla psicosocial para seguimiento quincenal'
      )
    })
  })

  it('muestra acceso directo contextual para aperturar protocolo RICE en incidentes graves', async () => {
    renderComponent('Administrador')

    expect(await screen.findByText(/Aperturar Protocolo RICE/i)).toBeInTheDocument()
    expect(screen.getByText(/Iniciar Mediación Escolar/i)).toBeInTheDocument()
  })
})
