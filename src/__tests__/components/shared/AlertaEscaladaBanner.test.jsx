import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import AlertaEscaladaBanner from '@/components/shared/AlertaEscaladaBanner'

describe('AlertaEscaladaBanner', () => {
  const dummyAdvertencia = {
    tiene_alerta: true,
    nivel: 'advertencia',
    motivos: ['Acumulación de 3 faltas leves en 30 días'],
    sugerencia_accion: 'Revisar medidas formativas antes de activar protocolo formal.',
    detalles: {
      ambitos_reincidentes: ['Agresión verbal', 'Disrupción en aula'],
      patron_escalada: 'Incremento sostenido en la frecuencia de incidentes.',
      incidentes_previos_count: 3,
      protocolos_previos_count: 0,
    },
  }

  const dummyCritico = {
    tiene_alerta: true,
    nivel: 'critico',
    motivos: [
      'Reincidencia grave en agresión física',
      'Protocolo previo cerrado con reincidencia',
    ],
    sugerencia_accion: 'Activar protocolo ministerial de manera inmediata y citar apoderado.',
    detalles: {
      ambitos_reincidentes: ['Agresión física'],
      patron_escalada: 'Escalada de faltas leves a graves en menos de 15 días.',
      incidentes_previos_count: 5,
      protocolos_previos_count: 1,
    },
  }

  it('no renderiza nada si diagnostico es nulo o no tiene alerta', () => {
    const { container: c1 } = render(<AlertaEscaladaBanner diagnostico={null} />)
    expect(c1).toBeEmptyDOMElement()

    const { container: c2 } = render(
      <AlertaEscaladaBanner diagnostico={{ tiene_alerta: false }} />
    )
    expect(c2).toBeEmptyDOMElement()
  })

  it('renderiza correctamente el banner en nivel advertencia', () => {
    render(<AlertaEscaladaBanner diagnostico={dummyAdvertencia} />)

    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveClass('bg-amber-50/90')
    expect(
      screen.getByText('Advertencia Preventiva de Reincidencia')
    ).toBeInTheDocument()
    expect(screen.getByText('advertencia')).toBeInTheDocument()
    expect(
      screen.getByText('Revisar medidas formativas antes de activar protocolo formal.')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Acumulación de 3 faltas leves en 30 días')
    ).toBeInTheDocument()
  })

  it('renderiza correctamente el banner en nivel crítico', () => {
    render(<AlertaEscaladaBanner diagnostico={dummyCritico} />)

    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveClass('bg-red-50/90')
    expect(
      screen.getByText('Alerta Crítica de Convivencia Escolar')
    ).toBeInTheDocument()
    expect(screen.getByText('critico')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Activar protocolo ministerial de manera inmediata y citar apoderado.'
      )
    ).toBeInTheDocument()
  })

  it('despliega y oculta el acordeón de antecedentes al presionar el botón', () => {
    render(<AlertaEscaladaBanner diagnostico={dummyCritico} />)

    const toggleButton = screen.getByRole('button', {
      name: /Ver detalle de antecedentes/i,
    })
    expect(toggleButton).toBeInTheDocument()

    // Inicialmente los detalles no se muestran
    expect(
      screen.queryByText('Patrón de Conducta Identificado:')
    ).not.toBeInTheDocument()

    // Clic para desplegar
    fireEvent.click(toggleButton)
    expect(
      screen.getByText('Patrón de Conducta Identificado:')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Escalada de faltas leves a graves en menos de 15 días.')
    ).toBeInTheDocument()
    expect(screen.getByText('Agresión física')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Ocultar antecedentes/i })
    ).toBeInTheDocument()

    // Clic para ocultar
    fireEvent.click(
      screen.getByRole('button', { name: /Ocultar antecedentes/i })
    )
    expect(
      screen.queryByText('Patrón de Conducta Identificado:')
    ).not.toBeInTheDocument()
  })
})
