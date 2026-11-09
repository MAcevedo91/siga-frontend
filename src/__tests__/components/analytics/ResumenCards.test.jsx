import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ResumenCards from '@/components/analytics/ResumenCards'

describe('ResumenCards Component', () => {
  const mockData = {
    totalIncidentes: 18,
    variacion: 12,
    abiertos: 4,
    estudiantesRiesgo: 2,
  }

  it('debe renderizar las 3 tarjetas de KPIs con sus valores y variaciones', () => {
    render(<ResumenCards data={mockData} loading={false} />)

    // Títulos en mayúsculas / formato limpio
    expect(screen.getByText('Incidentes del Mes')).toBeInTheDocument()
    expect(screen.getByText('Casos Abiertos')).toBeInTheDocument()
    expect(screen.getByText('Estudiantes en Riesgo')).toBeInTheDocument()

    // Valores
    expect(screen.getByText('18')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('+12% vs mes anterior')).toBeInTheDocument()
  })

  it('debe mostrar estado de carga esqueleto cuando loading es true', () => {
    const { container } = render(<ResumenCards data={mockData} loading={true} />)
    const pulses = container.querySelectorAll('.animate-pulse')
    expect(pulses.length).toBe(3)
  })
})
