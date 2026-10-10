import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import EstudiantesPage from '@/pages/EstudiantesPage'
import { getEstudiantes } from '@/services/estudiantesService'
import { getIncidentes } from '@/services/incidentesService'
import api from '@/services/api'

vi.unmock('react-router-dom')
vi.mock('@/services/estudiantesService', () => ({ getEstudiantes: vi.fn() }))
vi.mock('@/services/incidentesService', () => ({ getIncidentes: vi.fn() }))
vi.mock('@/services/searchService', () => ({ searchEstudiantes: vi.fn() }))
vi.mock('@/services/api')
vi.mock('@/store/useAuthStore', () => ({ useAuth: () => ({ user: { rol: 'Administrador' } }), getDefaultRouteByRole: () => '/dashboard' }))
vi.mock('@/components/layout/DashboardLayout', () => ({ default: ({ children }) => <main>{children}</main> }))
vi.mock('@/components/estudiantes/ImportarEstudiantesModal', () => ({ default: () => null }))

const estudiantes = [
  { id: 'a', curso_id: '8a', curso: { id: '8a', nombre: '8° Básico A' }, nombre: 'Ana', apellido: 'Rojas', rut: '11111111-1' },
  { id: 'b', curso_id: '8a', curso: { id: '8a', nombre: '8° Básico A' }, nombre: 'Luis', apellido: 'Pérez', rut: '22222222-2' },
  { id: 'c', curso_id: '7b', curso: { id: '7b', nombre: '7° Básico B' }, nombre: 'Eva', apellido: 'Díaz', rut: '33333333-3' },
]
const incidentes = [
  { id: 'i1', fecha: `${new Date().getFullYear()}-05-02`, gravedad: 'Leve', incidente_estudiantes: [{ estudiante_id: 'a' }, { estudiante_id: 'b' }] },
  { id: 'i2', fecha: `${new Date().getFullYear()}-05-03`, gravedad: 'Grave', incidente_estudiantes: [{ estudiante_id: 'a' }] },
]

function montar() {
  return render(<MemoryRouter initialEntries={['/estudiantes']}>
    <Routes>
      <Route path="/estudiantes" element={<EstudiantesPage />} />
      <Route path="/estudiantes/:id" element={<h1>Perfil del estudiante</h1>} />
    </Routes>
  </MemoryRouter>)
}

describe('Directorio por cursos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getEstudiantes.mockResolvedValue(estudiantes)
    getIncidentes.mockResolvedValue(incidentes)
    api.get.mockImplementation((url) => {
      if (url === '/cursos') return Promise.resolve({ data: { data: [
        { id: '8a', nombre: '8° Básico A', anio_academico: new Date().getFullYear() },
        { id: '7b', nombre: '7° Básico B', anio_academico: new Date().getFullYear() },
      ] } })
      if (url === '/riesgo/estudiantes') return Promise.resolve({ data: [] })
      throw new Error(`Ruta inesperada: ${url}`)
    })
  })

  it('muestra tarjetas con cantidad de alumnos, profesor sin asignar y gravedad diferenciada', async () => {
    montar()
    const tarjeta = await screen.findByRole('button', { name: /8° Básico A/ })
    expect(tarjeta).toHaveTextContent('2 estudiantes')
    expect(tarjeta).toHaveTextContent('Profesor jefe: Sin asignar')
    expect(within(tarjeta).getByText('1', { selector: '[data-gravedad="Leve"] *' })).toBeInTheDocument()
    expect(within(tarjeta).getByText('1', { selector: '[data-gravedad="Grave"] *' })).toBeInTheDocument()
    expect(within(tarjeta).getByText('0', { selector: '[data-gravedad="Gravísima"] *' })).toBeInTheDocument()
    expect(tarjeta).toHaveClass('dark:bg-gray-800')
  })

  it('abre solo los alumnos del curso y permite volver a las tarjetas', async () => {
    montar()
    fireEvent.click(await screen.findByRole('button', { name: /8° Básico A/ }))
    expect(await screen.findByText('Ana Rojas')).toBeInTheDocument()
    expect(screen.getByText('Luis Pérez')).toBeInTheDocument()
    expect(screen.queryByText('Eva Díaz')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Volver a cursos/i }))
    expect(await screen.findByRole('button', { name: /7° Básico B/ })).toBeInTheDocument()
  })

  it('mantiene acceso al perfil desde el listado del curso', async () => {
    montar()
    fireEvent.click(await screen.findByRole('button', { name: /8° Básico A/ }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Ver Perfil' })[0])
    expect(await screen.findByRole('heading', { name: 'Perfil del estudiante' })).toBeInTheDocument()
  })

  it('no muestra ceros como si fueran datos reales cuando falla la consulta de incidentes', async () => {
    getIncidentes.mockRejectedValue(new Error('sin conexión'))
    montar()
    const tarjeta = await screen.findByRole('button', { name: /8° Básico A/ })
    await waitFor(() => expect(tarjeta).toHaveTextContent('Indicadores no disponibles'))
  })

  it('muestra mensaje atractivo invitando a cargar la nómina cuando no hay cursos', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/cursos') return Promise.resolve({ data: { data: [] } })
      if (url === '/riesgo/estudiantes') return Promise.resolve({ data: [] })
      throw new Error(`Ruta inesperada: ${url}`)
    })
    getEstudiantes.mockResolvedValue([])

    montar()

    expect(await screen.findByText('Aún no hay cursos ni estudiantes registrados')).toBeInTheDocument()
    expect(screen.getByText(/Los cursos y sus niveles se reconocen automáticamente al cargar la nómina/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cargar Nómina de Estudiantes \(Excel\)/i })).toBeInTheDocument()
  })
})
