import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import TabCitacionesEstudiante from '@/components/citaciones/TabCitacionesEstudiante'
import CitacionesPage from '@/pages/CitacionesPage'
import * as citacionesService from '@/services/citacionesService'

// Mock de layout
vi.mock('@/components/layout/DashboardLayout', () => ({
  default: ({ children }) => <div data-testid="dashboard-layout">{children}</div>,
}))

// Mock de modales
vi.mock('@/components/citaciones/NuevaCitacionModal', () => ({
  default: ({ isOpen, onClose }) =>
    isOpen ? (
      <div data-testid="modal-nueva-citacion">
        <button onClick={onClose}>Cerrar Nueva</button>
      </div>
    ) : null,
}))

vi.mock('@/components/citaciones/EntrevistaCitacionModal', () => ({
  default: ({ isOpen, onClose, citacion }) =>
    isOpen ? (
      <div data-testid="modal-entrevista-citacion">
        <span>Modal Entrevista para {citacion?.folio}</span>
        <button onClick={onClose}>Cerrar Entrevista</button>
      </div>
    ) : null,
}))

const mockCitaciones = [
  {
    id: 'cit-1',
    folio: 'CIT-2026-0001',
    motivo_categoria: 'refuerzo_academico',
    motivo_detalle: 'Acompañamiento colaborativo en matemáticas',
    fecha_hora_programada: '2026-11-15T10:00:00Z',
    lugar_entrevista: 'Sala Convivencia',
    modalidad: 'presencial',
    estado: 'realizada',
    tiene_acta: true,
    estudiantes: { nombre: 'Martina', apellido: 'Soto', cursos: { nombre: '6° Básico A' } },
    apoderados: { nombre: 'Patricia', apellido: 'Lagos', telefono: '+56987654321' },
    acuerdos: {
      hash_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      fecha_proximo_seguimiento: '2026-12-01',
      compromisos_colegio: ['Monitoreo semanal'],
      compromisos_apoderado: ['Rutina de estudio 20 min'],
    },
  },
  {
    id: 'cit-2',
    folio: 'CIT-2026-0002',
    motivo_categoria: 'habitos_asistencia',
    motivo_detalle: 'Revisión de atrasos reiterados en jornada de mañana',
    fecha_hora_programada: '2026-11-20T11:30:00Z',
    lugar_entrevista: 'Inspectoría General',
    modalidad: 'presencial',
    estado: 'confirmada',
    tiene_acta: false,
    estudiantes: { nombre: 'Benjamín', apellido: 'Rojas', cursos: { nombre: '7° Básico B' } },
    apoderados: { nombre: 'Jorge', apellido: 'Rojas', telefono: '+56912345678' },
    acuerdos: null,
  },
]

const mockMetricas = {
  totales: { total_convocadas: 2, realizadas: 1, confirmadas: 1 },
  tasas: { asistencia_efectiva: 100, adherencia_parental: 100, efectividad_acuerdos: 100 },
  distribucion_motivos: {},
  ranking_motivos: [],
}

describe('TASK 10.3.3 — Tablero de Control de Citaciones y Pestaña en Expediente', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(citacionesService, 'listarCitaciones').mockResolvedValue({
      status: 'success',
      data: mockCitaciones,
      total: 2,
    })
    vi.spyOn(citacionesService, 'obtenerMetricasCitaciones').mockResolvedValue(mockMetricas)
    vi.spyOn(citacionesService, 'obtenerHistorialCitacionesEstudiante').mockResolvedValue({
      estudiante: { id: 'est-1', nombre: 'Martina', apellido: 'Soto' },
      metricas_estudiante: {
        total_citaciones: 2,
        realizadas: 1,
        no_asiste: 0,
        tasa_asistencia: 100,
        compromisos_vigentes: 1,
      },
      citaciones: mockCitaciones,
    })
    vi.spyOn(citacionesService, 'descargarActaCitacionPdf').mockResolvedValue(true)
    vi.spyOn(citacionesService, 'descargarArchivoIcs').mockReturnValue()
  })

  describe('1. Componente TabCitacionesEstudiante', () => {
    it('renderiza correctamente los KPIs del estudiante y la lista de citaciones', async () => {
      render(
        <BrowserRouter>
          <TabCitacionesEstudiante estudianteId="est-1" citacionesIniciales={mockCitaciones} />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Citaciones Formativas y Acuerdos Mutuos')).toBeInTheDocument()
        expect(screen.getByText('CIT-2026-0001')).toBeInTheDocument()
        expect(screen.getByText('CIT-2026-0002')).toBeInTheDocument()
      })

      // Comprobar badges y estado
      expect(screen.getByText('✓ Realizada con Acuerdos')).toBeInTheDocument()
      expect(screen.getByText('✓ Asistencia Confirmada')).toBeInTheDocument()
      expect(screen.getByText('Sello SHA-256')).toBeInTheDocument()

      // Comprobar botones de acción
      expect(screen.getByRole('button', { name: /Acta Oficial PDF/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Registrar Acuerdos/i })).toBeInTheDocument()
    })

    it('ejecuta la descarga del acta oficial PDF al presionar el botón correspondiente', async () => {
      render(
        <BrowserRouter>
          <TabCitacionesEstudiante estudianteId="est-1" citacionesIniciales={mockCitaciones} />
        </BrowserRouter>
      )

      const btnDescarga = await screen.findByRole('button', { name: /Acta Oficial PDF/i })
      fireEvent.click(btnDescarga)

      await waitFor(() => {
        expect(citacionesService.descargarActaCitacionPdf).toHaveBeenCalledWith(
          'cit-1',
          'CIT-2026-0001'
        )
      })
    })

    it('abre el modal de entrevista al presionar "Registrar Acuerdos"', async () => {
      render(
        <BrowserRouter>
          <TabCitacionesEstudiante estudianteId="est-1" citacionesIniciales={mockCitaciones} />
        </BrowserRouter>
      )

      const btnAcuerdos = await screen.findByRole('button', { name: /Registrar Acuerdos/i })
      fireEvent.click(btnAcuerdos)

      await waitFor(() => {
        expect(screen.getByTestId('modal-entrevista-citacion')).toBeInTheDocument()
        expect(screen.getByText('Modal Entrevista para CIT-2026-0002')).toBeInTheDocument()
      })
    })

    it('renderiza mensaje amigable cuando el estudiante no tiene citaciones', async () => {
      vi.spyOn(citacionesService, 'obtenerHistorialCitacionesEstudiante').mockResolvedValue({
        estudiante: { id: 'est-2' },
        metricas_estudiante: { total_citaciones: 0, tasa_asistencia: 0 },
        citaciones: [],
      })

      render(
        <BrowserRouter>
          <TabCitacionesEstudiante estudianteId="est-2" citacionesIniciales={[]} />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Sin citaciones formativas registradas')).toBeInTheDocument()
        expect(
          screen.getByRole('button', { name: /Programar Primera Citación/i })
        ).toBeInTheDocument()
      })
    })
  })

  describe('2. Componente CitacionesPage', () => {
    it('renderiza la bandeja de control con cabecera y tarjetas de KPIs globales', async () => {
      render(
        <BrowserRouter>
          <CitacionesPage />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Bandeja de Citaciones Formativas')).toBeInTheDocument()
        expect(screen.getByTestId('kpis-citaciones')).toBeInTheDocument()
        expect(screen.getByText('Asistencia Efectiva')).toBeInTheDocument()
        expect(screen.getByText('Adherencia Móvil')).toBeInTheDocument()
        expect(screen.getByText('Efectividad Acuerdos')).toBeInTheDocument()
      })
    })

    it('permite filtrar reactivamente por término de búsqueda en tiempo real', async () => {
      render(
        <BrowserRouter>
          <CitacionesPage />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('CIT-2026-0001')).toBeInTheDocument()
        expect(screen.getByText('CIT-2026-0002')).toBeInTheDocument()
      })

      const inputSearch = screen.getByPlaceholderText(/Buscar por folio, estudiante o apoderado/i)
      fireEvent.change(inputSearch, { target: { value: 'Martina' } })

      // Martina debe permanecer, Benjamín debe filtrarse
      expect(screen.getByText('CIT-2026-0001')).toBeInTheDocument()
      expect(screen.queryByText('CIT-2026-0002')).not.toBeInTheDocument()

      // Restablecer filtros
      const btnReset = screen.getByRole('button', { name: /Restablecer Filtros/i })
      fireEvent.click(btnReset)

      expect(screen.getByText('CIT-2026-0002')).toBeInTheDocument()
    })

    it('permite filtrar por estado en el selector reactivo', async () => {
      render(
        <BrowserRouter>
          <CitacionesPage />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('CIT-2026-0001')).toBeInTheDocument()
      })

      const selectEstado = screen.getByLabelText(/Filtrar por estado/i)
      fireEvent.change(selectEstado, { target: { value: 'confirmada' } })

      await waitFor(() => {
        expect(citacionesService.listarCitaciones).toHaveBeenCalledWith(
          expect.objectContaining({ estado: 'confirmada' })
        )
      })
    })

    it('permite abrir el modal para programar una nueva citación', async () => {
      render(
        <BrowserRouter>
          <CitacionesPage />
        </BrowserRouter>
      )

      const btnNueva = screen.getByRole('button', { name: /Programar Citación/i })
      fireEvent.click(btnNueva)

      expect(screen.getByTestId('modal-nueva-citacion')).toBeInTheDocument()
    })

    it('permite exportar el archivo .ics al presionar el botón de calendario', async () => {
      render(
        <BrowserRouter>
          <CitacionesPage />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getAllByTitle(/Guardar evento en calendario/i)[0]).toBeInTheDocument()
      })

      const btnCal = screen.getAllByTitle(/Guardar evento en calendario/i)[0]
      fireEvent.click(btnCal)

      expect(citacionesService.descargarArchivoIcs).toHaveBeenCalled()
    })
  })
})
