import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CopilotoRobotChat from '@/components/rice/CopilotoRobotChat'
import { consultarRiceRag } from '@/services/riceService'
import * as authStore from '@/store/useAuthStore'

vi.mock('@/services/riceService', () => ({
  consultarRiceRag: vi.fn(),
}))

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('CopilotoRobotChat - Chatbot Flotante de Convivencia Escolar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    })
  })

  it('renderiza el botón flotante del robot con tooltip y elemento de saludo cuando está cerrado', () => {
    const onOpen = vi.fn()
    render(<CopilotoRobotChat isOpen={false} onOpen={onOpen} onClose={vi.fn()} />)

    const triggerBtn = screen.getByTestId('copiloto-robot-trigger')
    expect(triggerBtn).toBeInTheDocument()
    expect(screen.getByTestId('sigi-saludo-hand')).toBeInTheDocument()
    expect(screen.getByText(/Pregúntale a/i)).toBeInTheDocument()
    expect(screen.getByText('Sigi')).toBeInTheDocument()

    fireEvent.click(triggerBtn)
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('renderiza la ventana de chat con cabecera, bienvenida, cápsula oficial y selector de 2 modos cuando está abierto', () => {
    render(<CopilotoRobotChat isOpen={true} onOpen={vi.fn()} onClose={vi.fn()} />)

    expect(screen.getByTestId('copiloto-robot-panel')).toBeInTheDocument()
    expect(screen.getByText('Sigi — Copiloto Escolar')).toBeInTheDocument()
    expect(screen.getByText('RICE')).toBeInTheDocument()

    // Cápsula de convivencia escolar y exclusión de texto redundante
    expect(screen.getByText('Copiloto convivencia escolar')).toBeInTheDocument()
    expect(screen.queryByText('Convivencia y RICE')).not.toBeInTheDocument()

    // Los modos especializados (RICE y Normas, Pasos a Seguir)
    expect(screen.getByText('RICE y Normas')).toBeInTheDocument()
    expect(screen.getByText('Pasos a Seguir')).toBeInTheDocument()
    expect(screen.queryByText('Asistente Redacción')).not.toBeInTheDocument()

    // Mensaje inicial de bienvenida
    expect(screen.getByText(/tu copiloto de convivencia escolar/i)).toBeInTheDocument()
  })

  it('permite alternar entre los modos especializados y actualiza las sugerencias y el placeholder', () => {
    render(<CopilotoRobotChat isOpen={true} onOpen={vi.fn()} onClose={vi.fn()} />)

    const textarea = screen.getByPlaceholderText(/¿Qué plazo tengo para citar al apoderado/i)
    expect(textarea).toBeInTheDocument()

    // Cambiar a modo "Pasos a Seguir"
    const pasosBtn = screen.getByText('Pasos a Seguir')
    fireEvent.click(pasosBtn)

    expect(screen.getByPlaceholderText(/¿Cuáles son los pasos obligatorios ante una riña en patio/i)).toBeInTheDocument()
    expect(screen.getByText(/¿Cuáles son los 5 pasos obligatorios ante maltrato entre pares\?/i)).toBeInTheDocument()

    // Volver a modo "RICE y Normas"
    const normativaBtn = screen.getByText('RICE y Normas')
    fireEvent.click(normativaBtn)

    expect(screen.getByPlaceholderText(/¿Qué plazo tengo para citar al apoderado según el RICE/i)).toBeInTheDocument()
    expect(screen.getByText(/¿Cuáles son los plazos máximos para citar apoderados\?/i)).toBeInTheDocument()
  })

  it('envía una consulta a través del input y muestra la respuesta y fuentes normativas', async () => {
    consultarRiceRag.mockResolvedValueOnce({
      respuesta: 'De acuerdo al **Artículo 34** del RICE, el plazo máximo para notificar y citar al apoderado es de **24 horas hábiles**.',
      fuentes: [
        { articulo: '34', titulo: 'Citación a Entrevistas de Convivencia' },
      ],
      totalFuentes: 1,
    })

    render(<CopilotoRobotChat isOpen={true} onOpen={vi.fn()} onClose={vi.fn()} />)

    const textarea = screen.getByPlaceholderText(/¿Qué plazo tengo para citar al apoderado/i)
    const sendBtn = screen.getByLabelText('Enviar mensaje a Sigi')

    fireEvent.change(textarea, { target: { value: '¿Cuál es el plazo para citar apoderados?' } })
    fireEvent.click(sendBtn)

    // Se muestra el mensaje del usuario en el chat
    expect(screen.getByText('¿Cuál es el plazo para citar apoderados?')).toBeInTheDocument()

    // Esperar respuesta de Sigi
    await waitFor(() => {
      expect(consultarRiceRag).toHaveBeenCalledWith('¿Cuál es el plazo para citar apoderados?', null)
      expect(screen.getByText(/el plazo máximo para notificar y citar al apoderado es de/i)).toBeInTheDocument()
      expect(screen.getByText(/1 fuente\(s\)/i)).toBeInTheDocument()
    })
  })

  it('permite copiar la respuesta de Sigi al portapapeles', async () => {
    consultarRiceRag.mockResolvedValueOnce({
      respuesta: 'Orientación formativa sobre el protocolo.',
      fuentes: [],
    })

    render(<CopilotoRobotChat isOpen={true} onOpen={vi.fn()} onClose={vi.fn()} />)

    const sugBtn = screen.getByText('¿Cuáles son los plazos máximos para citar apoderados?')
    fireEvent.click(sugBtn)

    await waitFor(() => {
      expect(screen.getByText('Orientación formativa sobre el protocolo.')).toBeInTheDocument()
    })

    const copyButtons = screen.getAllByText('Copiar texto')
    const copyBtn = copyButtons[copyButtons.length - 1]
    fireEvent.click(copyBtn)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Orientación formativa sobre el protocolo.')
    expect(screen.getByText('Copiado')).toBeInTheDocument()
  })

  it('permite reiniciar la conversación con el botón correspondiente', async () => {
    consultarRiceRag.mockResolvedValueOnce({
      respuesta: 'Respuesta temporal.',
      fuentes: [],
    })

    render(<CopilotoRobotChat isOpen={true} onOpen={vi.fn()} onClose={vi.fn()} />)

    const textarea = screen.getByPlaceholderText(/¿Qué plazo tengo para citar al apoderado/i)
    fireEvent.change(textarea, { target: { value: 'Consulta de prueba' } })
    fireEvent.click(screen.getByLabelText('Enviar mensaje a Sigi'))

    await waitFor(() => {
      expect(screen.getByText('Consulta de prueba')).toBeInTheDocument()
    })

    const resetBtn = screen.getByLabelText('Reiniciar conversación')
    fireEvent.click(resetBtn)

    expect(screen.queryByText('Consulta de prueba')).not.toBeInTheDocument()
    expect(screen.getByText(/¡Conversación reiniciada!/i)).toBeInTheDocument()
  })

  it('permite cerrar el panel del copiloto con el botón X', () => {
    const onClose = vi.fn()
    render(<CopilotoRobotChat isOpen={true} onOpen={vi.fn()} onClose={onClose} />)

    const closeBtn = screen.getByLabelText('Cerrar copiloto')
    fireEvent.click(closeBtn)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('responde en lenguaje natural mencionando el nombre del usuario al saludar sin consultar el RAG', async () => {
    vi.spyOn(authStore, 'useAuth').mockReturnValue({
      user: { nombre: 'María González', rol: 'Docente' },
      isAuthenticated: true,
    })

    render(<CopilotoRobotChat isOpen={true} onOpen={vi.fn()} onClose={vi.fn()} />)

    // La bienvenida inicial debe incluir el nombre del usuario
    expect(screen.getByText(/¡Hola, /i)).toBeInTheDocument()
    expect(screen.getByText('María')).toBeInTheDocument()

    const textarea = screen.getByPlaceholderText(/¿Qué plazo tengo para citar al apoderado/i)
    fireEvent.change(textarea, { target: { value: 'Hola Sigi' } })
    fireEvent.click(screen.getByLabelText('Enviar mensaje a Sigi'))

    // Esperar respuesta conversacional
    await waitFor(() => {
      expect(screen.getByText(/¿Cómo estás\? Soy/i)).toBeInTheDocument()
      expect(screen.getAllByText('María').length).toBeGreaterThanOrEqual(1)
    })

    // No debe haber llamado al RAG para un simple saludo
    expect(consultarRiceRag).not.toHaveBeenCalled()
  })

  it('responde a agradecimientos en lenguaje natural con el nombre del usuario', async () => {
    vi.spyOn(authStore, 'useAuth').mockReturnValue({
      user: { nombre: 'Carlos Tapia', rol: 'Inspector' },
      isAuthenticated: true,
    })

    render(<CopilotoRobotChat isOpen={true} onOpen={vi.fn()} onClose={vi.fn()} />)

    const textarea = screen.getByPlaceholderText(/¿Qué plazo tengo para citar al apoderado/i)
    fireEvent.change(textarea, { target: { value: 'muchas gracias sigi' } })
    fireEvent.click(screen.getByLabelText('Enviar mensaje a Sigi'))

    await waitFor(() => {
      expect(screen.getByText(/¡De nada,/i)).toBeInTheDocument()
      expect(screen.getAllByText('Carlos').length).toBeGreaterThanOrEqual(1)
    })

    expect(consultarRiceRag).not.toHaveBeenCalled()
  })

  it('explica su identidad y capacidades pedagógicas al preguntarle quién es', async () => {
    vi.spyOn(authStore, 'useAuth').mockReturnValue({
      user: { nombre: 'Patricia Silva', rol: 'Orientador' },
      isAuthenticated: true,
    })

    render(<CopilotoRobotChat isOpen={true} onOpen={vi.fn()} onClose={vi.fn()} />)

    const textarea = screen.getByPlaceholderText(/¿Qué plazo tengo para citar al apoderado/i)
    fireEvent.change(textarea, { target: { value: '¿quién eres?' } })
    fireEvent.click(screen.getByLabelText('Enviar mensaje a Sigi'))

    await waitFor(() => {
      expect(screen.getByText(/(el|tu) copiloto escolar/i)).toBeInTheDocument()
      expect(screen.getAllByText('Patricia').length).toBeGreaterThanOrEqual(1)
    })

    expect(consultarRiceRag).not.toHaveBeenCalled()
  })
})
