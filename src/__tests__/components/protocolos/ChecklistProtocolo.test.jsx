import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ChecklistProtocolo from '@/components/protocolos/ChecklistProtocolo'

describe('ChecklistProtocolo', () => {
  const dummyPasos = [
    {
      id: 101,
      orden: 1,
      accion: 'Entrevista inicial con apoderado y estudiante',
      plazo_dias: 2,
      completado: true,
      fecha_completado: '2026-09-01T10:00:00Z',
      responsable: { nombre: 'María', apellido: 'Pérez', rol: 'Encargado Convivencia' },
      observacion: 'Se realizó la entrevista y se firmaron acuerdos iniciales.',
    },
    {
      id: 102,
      orden: 2,
      accion: 'Derivación formal a dupla psicosocial',
      plazo_dias: 5,
      completado: false,
      fecha_completado: null,
      responsable: null,
      observacion: null,
    },
  ]

  it('renderiza correctamente el estado de carga', () => {
    render(<ChecklistProtocolo loading={true} pasos={[]} />)
    expect(screen.getByText(/Cargando lista de pasos normativos/i)).toBeInTheDocument()
  })

  it('muestra mensaje si la lista de pasos está vacía', () => {
    render(<ChecklistProtocolo loading={false} pasos={[]} />)
    expect(screen.getByText(/No hay pasos normativos registrados/i)).toBeInTheDocument()
  })

  it('calcula y muestra correctamente la barra de progreso y el porcentaje', () => {
    render(<ChecklistProtocolo loading={false} pasos={dummyPasos} />)

    // 1 de 2 pasos completados = 50%
    expect(screen.getByText('1 de 2 pasos (50%)')).toBeInTheDocument()

    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '50')
    expect(progressBar).toHaveStyle({ width: '50%' })
  })

  it('muestra el detalle de pasos completados y pendientes', () => {
    render(<ChecklistProtocolo loading={false} pasos={dummyPasos} />)

    expect(screen.getByText('Paso #1')).toBeInTheDocument()
    expect(screen.getByText('Entrevista inicial con apoderado y estudiante')).toBeInTheDocument()
    expect(screen.getByText('Completado')).toBeInTheDocument()
    expect(screen.getByText(/María Pérez/i)).toBeInTheDocument()
    expect(screen.getByText(/Se realizó la entrevista y se firmaron acuerdos iniciales./i)).toBeInTheDocument()

    expect(screen.getByText('Paso #2')).toBeInTheDocument()
    expect(screen.getByText('Derivación formal a dupla psicosocial')).toBeInTheDocument()
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
  })

  it('abre el modal y llama a onCompletarPaso al ingresar observación válida', async () => {
    const handleCompletar = vi.fn().mockResolvedValue({})

    render(
      <ChecklistProtocolo
        loading={false}
        pasos={dummyPasos}
        canEdit={true}
        onCompletarPaso={handleCompletar}
      />
    )

    const completarBtn = screen.getByRole('button', { name: /Completar/i })
    expect(completarBtn).toBeInTheDocument()

    // Abrir modal
    fireEvent.click(completarBtn)

    expect(screen.getByText('Completar Paso Normativo')).toBeInTheDocument()
    expect(screen.getAllByText(/Paso #2/i).length).toBeGreaterThanOrEqual(1)

    const textarea = screen.getByLabelText(/Glosa de Respaldo/i)
    const submitBtn = screen.getByRole('button', { name: /Certificar Paso Realizado/i })

    // Intentar certificar con texto corto (< 5 caracteres)
    fireEvent.change(textarea, { target: { value: 'abc' } })
    fireEvent.click(submitBtn)

    expect(
      screen.getByText('La glosa u observación de respaldo debe contener al menos 5 caracteres')
    ).toBeInTheDocument()
    expect(handleCompletar).not.toHaveBeenCalled()

    // Ingresar observación válida
    fireEvent.change(textarea, {
      target: { value: 'Se completó la derivación psicosocial de forma satisfactoria.' },
    })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(handleCompletar).toHaveBeenCalledWith(
        102,
        'Se completó la derivación psicosocial de forma satisfactoria.'
      )
    })
  })
})
