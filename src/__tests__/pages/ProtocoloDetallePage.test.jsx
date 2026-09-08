import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProtocoloDetallePage from '@/pages/ProtocoloDetallePage'
import * as protocolosService from '@/services/protocolosService'
import * as estudiantesService from '@/services/estudiantesService'

vi.mock('@/store/useAuthStore', () => ({
  useAuth: vi.fn(() => ({
    user: { rol: 'Administrador', nombre: 'Director Admin' },
  })),
  default: vi.fn(() => ({
    user: { rol: 'Administrador', nombre: 'Director Admin' },
  })),
}))

vi.mock('@/services/protocolosService', () => ({
  getProtocoloById: vi.fn(),
  avanzarEstadoProtocolo: vi.fn(),
  getPasosProtocolo: vi.fn(),
  actualizarPasoProtocolo: vi.fn(),
}))

vi.mock('@/services/estudiantesService', () => ({
  getAntecedentesEscalada: vi.fn(),
}))

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('ProtocoloDetallePage con Checklist y Alerta de Escalada', () => {
  const dummyProtocolo = {
    id: 10,
    numero_caso: 'PROT-2026-010',
    tipo: 'Maltrato físico entre estudiantes',
    estado: 'En Investigación',
    estudiante_id: 1,
    estudiante: {
      id: 1,
      nombre: 'Juan',
      apellido: 'Pérez',
      curso: { nombre: '8° Básico A' },
    },
    descripcion: 'Incidente de agresión en patio central durante recreo.',
    created_at: '2026-09-01T12:00:00Z',
    updated_at: '2026-09-01T12:00:00Z',
  }

  const dummyPasosConPendientes = [
    {
      id: 1,
      orden: 1,
      accion: 'Entrevista a involucrados',
      plazo_dias: 2,
      completado: true,
      fecha_completado: '2026-09-02T10:00:00Z',
      responsable: { nombre: 'María', apellido: 'Gómez', rol: 'Encargada de Convivencia' },
      observacion: 'Entrevistas realizadas a ambas partes.',
    },
    {
      id: 2,
      orden: 2,
      accion: 'Citación a apoderados y firma de compromisos',
      plazo_dias: 3,
      completado: false,
      fecha_completado: null,
      responsable: null,
      observacion: null,
    },
  ]

  const dummyAlertaEscalada = {
    tiene_alerta: true,
    nivel: 'critico',
    motivos: ['Reincidencia reiterada de agresiones en últimos 15 días'],
    sugerencia_accion: 'Activar protocolo de convivencia nivel 2 con urgencia.',
    detalles: {
      ambitos_reincidentes: ['Agresión física'],
      patron_escalada: 'Patrón repetitivo de conflicto físico en recreos.',
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    protocolosService.getProtocoloById.mockResolvedValue(dummyProtocolo)
    protocolosService.getPasosProtocolo.mockResolvedValue(dummyPasosConPendientes)
    estudiantesService.getAntecedentesEscalada.mockResolvedValue(dummyAlertaEscalada)
  })

  it('renderiza la alerta de escalada preventiva y el checklist de pasos normativos', async () => {
    render(
      <MemoryRouter initialEntries={['/protocolos/10']}>
        <Routes>
          <Route path="/protocolos/:id" element={<ProtocoloDetallePage />} />
        </Routes>
      </MemoryRouter>
    )

    // Espera que cargue el protocolo
    await waitFor(() => {
      expect(screen.getByText('Protocolo RICE #10')).toBeInTheDocument()
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    // Verifica Alerta de escalada
    expect(screen.getByText('Alerta Crítica de Convivencia Escolar')).toBeInTheDocument()
    expect(screen.getByText('Activar protocolo de convivencia nivel 2 con urgencia.')).toBeInTheDocument()

    // Verifica Checklist normativo RICE
    expect(screen.getByText('Checklist de Pasos Normativos RICE')).toBeInTheDocument()
    expect(screen.getByText('1 de 2 pasos (50%)')).toBeInTheDocument()
    expect(screen.getByText('Entrevista a involucrados')).toBeInTheDocument()
    expect(screen.getByText('Citación a apoderados y firma de compromisos')).toBeInTheDocument()
  })

  it('bloquea visualmente el botón Avanzar Estado si hay pasos pendientes en el checklist', async () => {
    render(
      <MemoryRouter initialEntries={['/protocolos/10']}>
        <Routes>
          <Route path="/protocolos/:id" element={<ProtocoloDetallePage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Protocolo RICE #10')).toBeInTheDocument()
    })

    // Debe mostrar la advertencia de bloqueo normativo
    expect(
      screen.getByText(/Debe completar todos los pasos del checklist antes de cambiar de etapa/i)
    ).toBeInTheDocument()

    // El botón debe estar deshabilitado
    const avanzarBtn = screen.getByRole('button', { name: /Avanzar a "Derivado"/i })
    expect(avanzarBtn).toBeDisabled()
  })

  it('desbloquea el botón Avanzar Estado una vez que todos los pasos están completados', async () => {
    const todosCompletos = dummyPasosConPendientes.map((p) => ({
      ...p,
      completado: true,
      fecha_completado: '2026-09-02T10:00:00Z',
      observacion: 'Completado con éxito.',
    }))
    protocolosService.getPasosProtocolo.mockResolvedValue(todosCompletos)

    render(
      <MemoryRouter initialEntries={['/protocolos/10']}>
        <Routes>
          <Route path="/protocolos/:id" element={<ProtocoloDetallePage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Protocolo RICE #10')).toBeInTheDocument()
    })

    // No debe mostrar advertencia de bloqueo
    expect(
      screen.queryByText(/Debe completar todos los pasos del checklist antes de cambiar de etapa/i)
    ).not.toBeInTheDocument()

    // El botón Avanzar debe estar habilitado
    const avanzarBtn = screen.getByRole('button', { name: /Avanzar a "Derivado"/i })
    expect(avanzarBtn).toBeEnabled()

    // Al hacer clic, abre el formulario para ingresar la observación
    fireEvent.click(avanzarBtn)
    expect(screen.getByLabelText(/Observación/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Confirmar Avance/i })
    ).toBeInTheDocument()
  })
})

