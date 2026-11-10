import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import SociogramaGrafoView, {
  obtenerEstiloArista,
} from '@/components/sociograma/SociogramaGrafoView'

describe('SociogramaGrafoView', () => {
  it('presenta nodos accesibles, relación real y selección de estudiante', () => {
    const select = vi.fn()
    render(
      <SociogramaGrafoView
        nodes={[
          { id: 'a', nombre: 'Ana Rojas', conflictividad_total: 2 },
          { id: 'b', nombre: 'Luis Pérez', conflictividad_total: 1 },
        ]}
        links={[
          { source: 'a', target: 'b', weight: 2, tipo_vinculo: 'conflicto_leve' },
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

    // Verifica que la barra de leyenda semafórica formativa se renderice
    expect(screen.getByText('Tipos de Vínculo:')).toBeInTheDocument()
    expect(screen.getByText('Acuerdo Restaurativo (-2)')).toBeInTheDocument()
    expect(screen.getByText('Mediación en Curso')).toBeInTheDocument()
    expect(screen.getByText('Conflicto Leve (+1)')).toBeInTheDocument()
    expect(screen.getByText('Conflicto Moderado (+3)')).toBeInTheDocument()
    expect(screen.getByText('Conflicto Severo (≥+5)')).toBeInTheDocument()
  })

  it('obtenerEstiloArista asigna los colores semafóricos institucionales correctamente', () => {
    // 1. Acuerdo restaurativo neto (verde esmeralda)
    const estiloRestaurativo = obtenerEstiloArista({ weight: -1, tipo_vinculo: 'acuerdo_restaurativo' })
    expect(estiloRestaurativo.stroke).toBe('#10b981')
    expect(estiloRestaurativo.dashArray).toBe('5,5')
    expect(estiloRestaurativo.etiqueta).toBe('Acuerdo Restaurativo')

    // 2. Conflicto severo (rojo intenso)
    const estiloSevero = obtenerEstiloArista({ weight: 5, tipo_vinculo: 'conflicto_severo' })
    expect(estiloSevero.stroke).toBe('#ef4444')
    expect(estiloSevero.etiqueta).toBe('Conflicto Severo')

    // 3. Conflicto moderado (naranja)
    const estiloModerado = obtenerEstiloArista({ weight: 3, tipo_vinculo: 'conflicto_moderado' })
    expect(estiloModerado.stroke).toBe('#f97316')
    expect(estiloModerado.etiqueta).toBe('Conflicto Moderado')

    // 4. Con mediación activa en curso pero tensión residual (morado / violeta)
    const estiloMediacion = obtenerEstiloArista({ weight: 1, mediaciones_count: 1 })
    expect(estiloMediacion.stroke).toBe('#8b5cf6')
    expect(estiloMediacion.etiqueta).toBe('Mediación en Curso')

    // 5. Conflicto leve (ámbar)
    const estiloLeve = obtenerEstiloArista({ weight: 1, mediaciones_count: 0 })
    expect(estiloLeve.stroke).toBe('#f59e0b')
    expect(estiloLeve.etiqueta).toBe('Conflicto Leve')

    // 6. Neutro / caso borde
    const estiloNeutro = obtenerEstiloArista(null)
    expect(estiloNeutro.stroke).toBe('#94a3b8')
  })
})
