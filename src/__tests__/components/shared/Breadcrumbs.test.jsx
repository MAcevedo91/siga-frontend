import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Breadcrumbs from '@/components/shared/Breadcrumbs'

describe('Breadcrumbs', () => {
  it('renders home link and breadcrumb items', () => {
    render(
      <BrowserRouter>
        <Breadcrumbs items={[{ label: 'Incidentes' }]} />
      </BrowserRouter>
    )

    expect(screen.getByText('Inicio')).toBeInTheDocument()
    expect(screen.getByText('Incidentes')).toBeInTheDocument()
  })

  it('renders link if href is provided and not the last item', () => {
    render(
      <BrowserRouter>
        <Breadcrumbs
          items={[
            { label: 'Incidentes', href: '/incidentes' },
            { label: 'Detalle' },
          ]}
        />
      </BrowserRouter>
    )

    const incidentesLink = screen.getByRole('link', { name: 'Incidentes' })
    expect(incidentesLink).toHaveAttribute('href', '/incidentes')
    expect(screen.getByText('Detalle')).toBeInTheDocument()
  })
})
