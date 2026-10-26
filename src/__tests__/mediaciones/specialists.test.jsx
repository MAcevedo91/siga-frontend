import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import ModalInformeEspecialista from '@/components/estudiantes/ModalInformeEspecialista'
import HistorialInformesMedicosCard from '@/components/estudiantes/HistorialInformesMedicosCard'
import * as api from '@/services/sprint9Service'
vi.mock('@/services/sprint9Service', () => ({
  generarInformeEspecialista: vi.fn(),
  listarInformesEspecialista: vi.fn(),
}))
beforeEach(() => vi.clearAllMocks())
it('no informa descarga exitosa cuando el servidor falla', async () => {
  api.generarInformeEspecialista.mockRejectedValue(
    new Error('Servicio no disponible'),
  )
  render(
    <ModalInformeEspecialista
      estudianteId="a"
      onClose={() => {}}
      onGenerated={() => {}}
    />,
  )
  fireEvent.change(screen.getByLabelText('Especialista destinatario'), {
    target: { value: 'Psicóloga externa' },
  })
  fireEvent.change(screen.getByLabelText('Motivo de derivación'), {
    target: { value: 'Evaluación de acompañamiento formativo' },
  })
  fireEvent.click(
    screen.getByRole('button', { name: 'Generar y descargar PDF' }),
  )
  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Servicio no disponible',
    ),
  )
})
it('muestra el historial real sin ofrecer una copia histórica inexistente', async () => {
  api.listarInformesEspecialista.mockResolvedValue({
    items: [
      {
        id: 'h',
        fecha_emision: '2026-10-26',
        especialista_destino: 'Psicóloga externa',
        motivo: 'Seguimiento',
        hash_sha256: 'abc',
      },
    ],
    pagination: { total: 1, totalPages: 1 },
  })
  render(<HistorialInformesMedicosCard estudianteId="a" />)
  expect(await screen.findByText('Psicóloga externa')).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: /Descargar copia/ }),
  ).not.toBeInTheDocument()
})
