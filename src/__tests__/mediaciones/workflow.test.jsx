import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MediacionNuevaPage from '@/pages/MediacionNuevaPage'
import AsistenteAcuerdosFormativos from '@/components/mediaciones/AsistenteAcuerdosFormativos'
import ModalEvaluarCierre from '@/components/mediaciones/ModalEvaluarCierre'
import * as api from '@/services/mediacionesService'
import { getEstudiantes } from '@/services/estudiantesService'
vi.mock('@/components/layout/DashboardLayout', () => ({
  default: ({ children }) => <main>{children}</main>,
}))
vi.mock('@/store/useAuthStore', () => ({
  useAuth: () => ({
    user: { id: 'u', nombre: 'Daniel', rol: 'Administrador' },
  }),
}))
vi.mock('@/services/mediacionesService', () => ({
  crearMediacion: vi.fn(),
  notificarApoderados: vi.fn(),
  evaluarCompromisos: vi.fn(),
  cerrarMediacion: vi.fn(),
}))
vi.mock('@/services/estudiantesService', () => ({ getEstudiantes: vi.fn() }))
vi.mock('@/services/incidentesService', () => ({ getIncidenteById: vi.fn() }))
const people = [
  { id: 'a', nombre: 'Ana', apellido: 'Rojas', rut: '1-9' },
  { id: 'b', nombre: 'Luis', apellido: 'Pérez', rut: '2-7' },
]
beforeEach(() => {
  vi.clearAllMocks()
  getEstudiantes.mockResolvedValue(people)
})
describe('Flujo de mediación', () => {
  it('busca con 300 ms, agrega participantes distintos y conserva la creación al fallar el aviso', async () => {
    vi.useFakeTimers()
    render(
      <MemoryRouter>
        <MediacionNuevaPage />
      </MemoryRouter>,
    )
    fireEvent.change(screen.getByLabelText('Buscar estudiantes'), {
      target: { value: 'Ana' },
    })
    await act(() => vi.advanceTimersByTimeAsync(299))
    expect(getEstudiantes).not.toHaveBeenCalled()
    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(getEstudiantes).toHaveBeenCalledWith({ search: 'Ana', activo: true })
    fireEvent.click(screen.getByRole('button', { name: /Agregar Ana Rojas/ }))
    fireEvent.click(screen.getByRole('button', { name: /Agregar Luis Pérez/ }))
    fireEvent.change(screen.getByLabelText(/Motivo/), {
      target: { value: 'Resolver conflicto de convivencia' },
    })
    fireEvent.change(screen.getByLabelText(/Fecha y hora/), {
      target: { value: '2026-11-02T10:00' },
    })
    api.crearMediacion.mockResolvedValue({ id: 'm' })
    api.notificarApoderados.mockRejectedValue(new Error('Correo no disponible'))
    fireEvent.click(screen.getByRole('button', { name: 'Crear mediación' }))
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(screen.getByRole('alert')).toHaveTextContent(
      'La mediación fue creada',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar aviso' }))
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(api.crearMediacion).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })
  it('no permite guardar acuerdos vacíos ni fechas pasadas, y permite editar y eliminar', () => {
    const onSave = vi.fn()
    render(
      <AsistenteAcuerdosFormativos
        mediacion={{
          fecha_programada: '2026-10-20',
          mediacion_participantes: people.map((estudiantes) => ({
            estudiantes,
          })),
        }}
        onSave={onSave}
      />,
    )
    expect(
      screen.getByRole('button', { name: 'Guardar acuerdos' }),
    ).toBeDisabled()
    fireEvent.click(
      screen.getByRole('button', { name: 'Agregar acuerdo personalizado' }),
    )
    const description = screen.getByLabelText('Descripción del acuerdo 1')
    fireEvent.change(description, {
      target: { value: 'Primer acuerdo personalizado' },
    })
    expect(screen.getByLabelText('Fecha límite del acuerdo 1')).toHaveAttribute(
      'min',
    )
    fireEvent.change(description, { target: { value: 'Acuerdo actualizado' } })
    expect(description).toHaveValue('Acuerdo actualizado')
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar acuerdo 1' }))
    expect(
      screen.getByRole('button', { name: 'Guardar acuerdos' }),
    ).toBeDisabled()
  })
  it('no cierra si falla la evaluación y conserva el error para reintentar', async () => {
    api.evaluarCompromisos.mockRejectedValue(new Error('No se pudo evaluar'))
    render(
      <ModalEvaluarCierre
        mediacion={{
          id: 'm',
          mediacion_compromisos: [
            { id: 'c', descripcion: 'Reparar cuaderno', estado: 'pendiente' },
          ],
        }}
        onClose={() => {}}
        onSaved={() => {}}
      />,
    )
    fireEvent.change(screen.getByLabelText('Evaluación del compromiso 1'), {
      target: { value: 'cumplido' },
    })
    fireEvent.change(
      screen.getByLabelText('Reflexión y conclusiones de cierre'),
      { target: { value: 'Se verificó el cumplimiento de los acuerdos.' } },
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Evaluar y cerrar expediente' }),
    )
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('No se pudo evaluar'),
    )
    expect(api.cerrarMediacion).not.toHaveBeenCalled()
  })
})

it('conserva el foco al escribir conclusiones dentro de la ventana de cierre', () => {
  render(
    <ModalEvaluarCierre
      mediacion={{ id: 'm', mediacion_compromisos: [] }}
      onClose={() => {}}
      onSaved={() => {}}
    />,
  )
  const field = screen.getByLabelText('Reflexión y conclusiones de cierre')
  field.focus()
  fireEvent.change(field, { target: { value: 'Reflexión inicial' } })
  expect(field).toHaveFocus()
})
