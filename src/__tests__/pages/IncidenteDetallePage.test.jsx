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
})
