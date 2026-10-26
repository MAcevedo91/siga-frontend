import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import MediacionDetallePage from '@/pages/MediacionDetallePage'
import AsistenteAcuerdosFormativos from '@/components/mediaciones/AsistenteAcuerdosFormativos'
import SeguimientoFormativo from '@/components/estudiantes/SeguimientoFormativo'
import SociogramaGrafoView from '@/components/sociograma/SociogramaGrafoView'
import * as api from '@/services/mediacionesService'
vi.unmock('react-router-dom')
vi.mock('@/components/layout/DashboardLayout', () => ({
  default: ({ children }) => <main>{children}</main>,
}))
vi.mock('@/store/useAuthStore', () => ({
  useAuth: () => ({ user: { rol: 'Administrador' } }),
}))
vi.mock('@/services/mediacionesService', () => ({
  listarDocumentosMediacion: vi.fn().mockResolvedValue([]),
  obtenerMediacion: vi.fn(),
  guardarCompromisos: vi.fn(),
  obtenerHistorialMediaciones: vi.fn(),
}))
beforeEach(() => vi.clearAllMocks())
it('oculta el expediente anterior mientras carga otro y después de un fallo', async () => {
  api.obtenerMediacion
    .mockResolvedValueOnce({
      id: 'a',
      folio: 'MED-A',
      mediacion_compromisos: [
        {
          id: 'c',
          descripcion: 'Acuerdo exclusivo de Ana',
          fecha_limite: '2030-01-01',
        },
      ],
    })
    .mockRejectedValueOnce(new Error('Expediente no disponible'))
  render(
    <MemoryRouter initialEntries={['/mediaciones/a']}>
      <Link to="/mediaciones/b">Otro expediente</Link>
      <Routes>
        <Route path="/mediaciones/:id" element={<MediacionDetallePage />} />
      </Routes>
    </MemoryRouter>,
  )
  expect(
    await screen.findByDisplayValue('Acuerdo exclusivo de Ana'),
  ).toBeInTheDocument()
  fireEvent.click(screen.getByRole('link', { name: 'Otro expediente' }))
  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Expediente no disponible',
    ),
  )
  expect(
    screen.queryByDisplayValue('Acuerdo exclusivo de Ana'),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Guardar acuerdos' }),
  ).not.toBeInTheDocument()
})
it('impide reemplazar acuerdos que ya fueron evaluados aunque el expediente siga abierto', () => {
  render(
    <AsistenteAcuerdosFormativos
      mediacion={{
        mediacion_compromisos: [
          {
            id: 'c',
            descripcion: 'Acuerdo ya evaluado',
            estado: 'parcial',
            fecha_limite: '2030-01-01',
          },
        ],
      }}
      onSave={vi.fn()}
    />,
  )
  expect(
    screen.queryByRole('button', { name: 'Guardar acuerdos' }),
  ).not.toBeInTheDocument()
  expect(screen.getByLabelText('Descripción del acuerdo 1')).toBeDisabled()
})
it('no mantiene el historial del estudiante anterior cuando la nueva consulta falla', async () => {
  api.obtenerHistorialMediaciones
    .mockResolvedValueOnce({
      mediaciones: [{ mediacion_id: 'm', folio: 'MED-SOLO-ANA' }],
    })
    .mockRejectedValueOnce(new Error('Historial no disponible'))
  const view = render(
    <MemoryRouter>
      <SeguimientoFormativo estudianteId="a" />
    </MemoryRouter>,
  )
  fireEvent.click(
    screen.getByRole('button', { name: 'Mediaciones', exact: true }),
  )
  expect(await screen.findByText('MED-SOLO-ANA')).toBeInTheDocument()
  view.rerender(
    <MemoryRouter>
      <SeguimientoFormativo estudianteId="b" />
    </MemoryRouter>,
  )
  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Historial no disponible',
    ),
  )
  expect(screen.queryByText('MED-SOLO-ANA')).not.toBeInTheDocument()
})
it('renderiza vínculos de reparación con peso neto negativo sin anchos inválidos', () => {
  const { container } = render(
    <SociogramaGrafoView
      nodes={[
        { id: 'a', nombre: 'Ana' },
        { id: 'b', nombre: 'Luis' },
      ]}
      links={[{ source: 'a', target: 'b', weight: -2, mediaciones_count: 1 }]}
      onSelect={vi.fn()}
    />,
  )
  const line = container.querySelector('line')
  expect(Number.isFinite(Number(line.getAttribute('stroke-width')))).toBe(true)
  expect(line.textContent).toContain('Peso neto: -2')
})
it('bloquea el editor cuando la evaluación llega después de abrirlo', () => {
  const med = {
    mediacion_compromisos: [
      {
        id: 'c',
        descripcion: 'Acuerdo en seguimiento',
        estado: 'pendiente',
        fecha_limite: '2030-01-01',
      },
    ],
  }
  const view = render(
    <AsistenteAcuerdosFormativos mediacion={med} onSave={vi.fn()} />,
  )
  expect(
    screen.getByRole('button', { name: 'Guardar acuerdos' }),
  ).toBeInTheDocument()
  view.rerender(
    <AsistenteAcuerdosFormativos
      mediacion={{
        ...med,
        mediacion_compromisos: med.mediacion_compromisos.map((c) => ({
          ...c,
          estado: 'cumplido',
        })),
      }}
      onSave={vi.fn()}
    />,
  )
  expect(
    screen.queryByRole('button', { name: 'Guardar acuerdos' }),
  ).not.toBeInTheDocument()
})
