import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import SociogramaGrafoView from '@/components/sociograma/SociogramaGrafoView'
it('presenta nodos accesibles, relación real y selección de estudiante', () => {
  const select = vi.fn()
  render(
    <SociogramaGrafoView
      nodes={[
        { id: 'a', nombre: 'Ana Rojas', conflictividad_total: 2 },
        { id: 'b', nombre: 'Luis Pérez', conflictividad_total: 1 },
      ]}
      links={[
        { source: 'a', target: 'b', weight: 2, tipo_vinculo: 'incidente' },
      ]}
      onSelect={select}
    />,
  )
  fireEvent.click(
    screen.getByRole('button', { name: 'Ver estudiante Ana Rojas' }),
  )
  expect(select).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }))
  expect(
    screen.getByRole('img', { name: 'Red de interacciones del curso' }),
  ).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Acercar red' }))
  expect(
    screen.getByRole('button', { name: 'Restablecer vista' }),
  ).toBeInTheDocument()
})
