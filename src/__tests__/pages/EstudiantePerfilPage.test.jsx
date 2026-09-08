import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import EstudiantePerfilPage from '@/pages/EstudiantePerfilPage'
import api from '@/services/api'

vi.unmock('react-router-dom')
vi.mock('@/services/api')

const mensaje = 'Este estudiante acumula múltiples incidentes recientes. Evalúe si corresponde activar o escalar el protocolo vigente.'
const perfil = (id) => ({
  id, nombre: 'Estudiante', apellido: `Prueba ${id}`, rut: '11111111-1',
  fecha_nacimiento: '2012-01-01', genero: 'M', curso: { nombre: '7° A' },
  apoderado: null, incidentes: [],
})
const respuesta = (data) => ({ data: { status: 'success', data } })

function montar(riesgo) {
  api.get.mockImplementation((url) => {
    if (url === '/dashboard/estudiantes-en-riesgo') return riesgo()
    const match = url.match(/^\/estudiantes\/(\d+)\/perfil$/)
    if (match) return Promise.resolve(respuesta(perfil(Number(match[1]))))
    if (url === '/reportes/estudiante/1/perfil.pdf') return Promise.resolve({ data: new Blob(['pdf']) })
    throw new Error(`URL inesperada: ${url}`)
  })
  const router = createMemoryRouter([
    { path: '/estudiantes/:id', element: <EstudiantePerfilPage /> },
    { path: '/estudiantes', element: <h1>Listado de estudiantes</h1> },
  ], { initialEntries: ['/estudiantes/1'] })
  render(<RouterProvider router={router} />)
  return router
}

describe('Alerta contextual del perfil', () => {
  beforeEach(() => vi.resetAllMocks())

  it.each([6, 9])('muestra la alerta para un estudiante listado con score %s, antes de sus datos', async (score) => {
    montar(() => Promise.resolve(respuesta([{ id: 1, score_riesgo: score }])))
    const alerta = await screen.findByRole('status')
    expect(alerta).toHaveTextContent(mensaje)
    expect(alerta).toHaveClass('bg-amber-50', 'border', 'border-amber-200', 'text-amber-800')
    expect(screen.getByRole('heading', { level: 1 }).compareDocumentPosition(alerta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(alerta.compareDocumentPosition(screen.getByText('Datos Personales')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByRole('button', { name: /Descargar PDF/ })).toBeEnabled()
  })

  it.each([[], [{ id: 2, score_riesgo: 8 }]])('no muestra alerta si el estudiante no pertenece a la lista: %j', async (lista) => {
    montar(() => Promise.resolve(respuesta(lista)))
    await screen.findByText('Datos Personales')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('mantiene el perfil disponible cuando falla la consulta de riesgo', async () => {
    montar(() => Promise.reject(new Error('Sin conexión')))
    await screen.findByText('Datos Personales')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Descargar PDF/ })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Volver a Estudiantes' }))
    expect(await screen.findByText('Listado de estudiantes')).toBeInTheDocument()
  })

  it('ignora una respuesta tardía del perfil anterior al cambiar de estudiante', async () => {
    let resolver
    let consultas = 0
    const router = montar(() => ++consultas === 1
      ? new Promise((resolve) => { resolver = resolve })
      : Promise.resolve(respuesta([])))
    await screen.findByText('Datos Personales')
    await act(() => router.navigate('/estudiantes/2'))
    await screen.findByRole('heading', { name: 'Estudiante Prueba 2' })
    expect(consultas).toBe(2)
    await act(() => resolver(respuesta([{ id: 1, score_riesgo: 6 }])))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('permite descargar el PDF y volver al listado con la alerta visible', async () => {
    montar(() => Promise.resolve(respuesta([{ id: 1, score_riesgo: 6 }])))
    await screen.findByRole('status')
    const crearUrl = vi.fn(() => 'blob:perfil')
    vi.stubGlobal('URL', class extends URL { static createObjectURL = crearUrl })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    fireEvent.click(screen.getByRole('button', { name: /Descargar PDF/ }))
    await waitFor(() => expect(click).toHaveBeenCalledOnce())
    expect(api.get).toHaveBeenCalledWith('/reportes/estudiante/1/perfil.pdf', { responseType: 'blob' })
    click.mockRestore()
    vi.unstubAllGlobals()
    fireEvent.click(screen.getByRole('button', { name: 'Volver a Estudiantes' }))
    expect(await screen.findByText('Listado de estudiantes')).toBeInTheDocument()
  })

  it('muestra el badge PIE y las direcciones de domicilio cuando están disponibles', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/dashboard/estudiantes-en-riesgo') return Promise.resolve(respuesta([]))
      if (url.match(/^\/estudiantes\/(\d+)\/perfil$/)) {
        return Promise.resolve(
          respuesta({
            id: 1,
            nombre: 'Camila',
            apellido: 'González',
            rut: '22.333.444-5',
            fecha_nacimiento: '2012-05-15',
            genero: 'F',
            curso: { nombre: '6° Básico B' },
            pie: true,
            direccion: 'Avenida Siempre Viva 742',
            apoderado: {
              nombre: 'Homero',
              apellido: 'González',
              relacion: 'Padre',
              telefono: '+56912345678',
              email: 'homero@springfield.cl',
              direccion: 'Avenida Siempreviva 742',
            },
            incidentes: [],
          })
        )
      }
      throw new Error(`URL inesperada: ${url}`)
    })

    const router = createMemoryRouter(
      [
        { path: '/estudiantes/:id', element: <EstudiantePerfilPage /> },
        { path: '/estudiantes', element: <h1>Listado de estudiantes</h1> },
      ],
      { initialEntries: ['/estudiantes/1'] }
    )
    render(<RouterProvider router={router} />)

    await screen.findByText('Datos Personales')

    // Badge PIE
    const badgePie = screen.getByText('PIE')
    expect(badgePie).toBeInTheDocument()
    expect(badgePie).toHaveClass('bg-purple-100', 'text-purple-800')

    // Domicilio del estudiante
    expect(screen.getByText('Avenida Siempre Viva 742')).toBeInTheDocument()

    // Domicilio del apoderado
    expect(screen.getByText('Avenida Siempreviva 742')).toBeInTheDocument()
  })
})

