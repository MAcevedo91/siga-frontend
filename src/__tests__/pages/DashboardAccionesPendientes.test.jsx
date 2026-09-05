import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DashboardPage from '@/pages/DashboardPage'
import api from '@/services/api'
import useAuthStore from '@/store/useAuthStore'
import { ThemeContext } from '@/contexts/ThemeContext'

vi.hoisted(() => {
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {} })
})

vi.unmock('react-router-dom')
vi.mock('@/services/api')
vi.mock('@/services/socketService', () => ({ initSocket: vi.fn(), disconnectSocket: vi.fn(), getSocket: vi.fn() }))

const accion = (id, estado = 'ok', dias = 5) => ({
  protocolo_id: id, estudiante_nombre: `Estudiante ${id}`, tipo_protocolo: 'Convivencia escolar',
  accion_pendiente: 'Realizar seguimiento', dias_restantes: dias, estado_semaforo: estado,
})
const respuesta = (data) => ({ data: { data } })
function montar(acciones = [], rol = 'Administrador', pendientes) {
  useAuthStore.setState({ user: { nombre: 'Usuario', rol }, isAuthenticated: true, token: null })
  api.get.mockImplementation((url) => {
    if (url === '/protocolos/acciones-pendientes') return pendientes || Promise.resolve(respuesta(acciones))
    if (url === '/dashboard/resumen') return Promise.resolve(respuesta({ total_incidentes: 0 }))
    if (url.includes('contador')) return Promise.resolve(respuesta({ count: 0 }))
    return Promise.resolve(respuesta([]))
  })
  const router = createMemoryRouter([
    { path: '/dashboard', element: <DashboardPage /> },
    { path: '/protocolos', element: <h1>Lista de protocolos</h1> },
    { path: '/protocolos/:id', element: <h1>Detalle de protocolo</h1> },
  ], { initialEntries: ['/dashboard'] })
  render(<ThemeContext.Provider value={{ theme: 'light', toggleTheme: vi.fn() }}><RouterProvider router={router} /></ThemeContext.Provider>)
  return router
}

describe('Acciones pendientes integradas al Dashboard', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each(['Administrador', 'Equipo de Formación', 'Directivo'])('muestra todo al día para %s incluso sin incidentes', async (rol) => {
    montar([], rol)
    expect(await screen.findByText('Sin acciones pendientes — todo al día ✓')).toBeInTheDocument()
  })

  it('muestra colores según semáforo, plazos y enlaces a cada protocolo', async () => {
    const router = montar([accion(11, 'vencido', -1), accion(12, 'urgente', 1), accion(13, 'ok', 0)])
    const widget = await screen.findByRole('region', { name: 'Acciones Pendientes' })
    const filas = within(widget).getAllByRole('link')
    expect(filas[0]).toHaveClass('bg-red-50', 'text-red-800')
    expect(filas[0]).toHaveTextContent('VENCIDO')
    expect(filas[1]).toHaveClass('bg-amber-50', 'text-amber-800')
    expect(filas[1]).toHaveTextContent('1 día restante')
    expect(filas[2]).toHaveClass('bg-green-50', 'text-green-800')
    expect(filas[2]).toHaveTextContent('0 días restantes')
    for (const [i, fila] of filas.entries()) expect(fila).toHaveAttribute('href', `/protocolos/${11 + i}`)
    fireEvent.click(filas[1])
    expect(await screen.findByText('Detalle de protocolo')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/protocolos/12')
  })

  it('limita a cinco filas y permite ver todos cuando hay más', async () => {
    montar(Array.from({ length: 6 }, (_, i) => accion(i + 1)))
    const widget = await screen.findByRole('region', { name: 'Acciones Pendientes' })
    expect(within(widget).getAllByRole('listitem')).toHaveLength(5)
    expect(within(widget).queryByText('Estudiante 6')).not.toBeInTheDocument()
    fireEvent.click(within(widget).getByRole('link', { name: 'Ver todos los protocolos' }))
    expect(await screen.findByText('Lista de protocolos')).toBeInTheDocument()
  })

  it('no ofrece ver todos cuando hay exactamente cinco filas', async () => {
    montar(Array.from({ length: 5 }, (_, i) => accion(i + 1)))
    await screen.findByRole('region', { name: 'Acciones Pendientes' })
    expect(screen.queryByRole('link', { name: 'Ver todos los protocolos' })).not.toBeInTheDocument()
  })

  it('no informa todo al día si falla el endpoint y conserva el Dashboard', async () => {
    montar([], 'Administrador', Promise.reject(new Error('Sin conexión')))
    expect(await screen.findByText(/No se pudieron cargar las acciones pendientes/)).toBeInTheDocument()
    expect(screen.queryByText('Sin acciones pendientes — todo al día ✓')).not.toBeInTheDocument()
    expect(screen.getByText('Panel de Convivencia Escolar')).toBeInTheDocument()
  })

  it('inicia los cinco endpoints sin esperar la respuesta de acciones pendientes', async () => {
    let resolve
    montar([], 'Administrador', new Promise((r) => { resolve = r }))
    const urls = api.get.mock.calls.map(([url]) => url)
    expect(urls).toEqual(expect.arrayContaining(['/dashboard/resumen', '/dashboard/incidentes-por-curso', '/dashboard/por-gravedad', '/dashboard/tendencia-mensual', '/protocolos/acciones-pendientes']))
    await act(() => resolve(respuesta([])))
    expect(await screen.findByText('Sin acciones pendientes — todo al día ✓')).toBeInTheDocument()
  })

  it.each(['Docente', 'Inspector'])('no consulta ni muestra el widget para %s', async (rol) => {
    montar([], rol)
    await screen.findByText('Panel de Convivencia Escolar')
    expect(screen.queryByRole('region', { name: 'Acciones Pendientes' })).not.toBeInTheDocument()
    expect(api.get.mock.calls.map(([url]) => url)).not.toContain('/protocolos/acciones-pendientes')
  })
})
