import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import NavbarStudentSearch from '@/components/layout/NavbarStudentSearch'
import * as estudiantesService from '@/services/estudiantesService'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/services/estudiantesService', () => ({
  getEstudiantes: vi.fn(),
}))

const mockEstudiantes = [
  {
    id: 101,
    nombre: 'Juan',
    apellido: 'Pérez',
    rut: '12.345.678-9',
    es_pie: true,
    estado_matricula: 'Regular',
    curso: { id: 1, nombre: '5° Básico A' },
  },
  {
    id: 102,
    nombre: 'Juana',
    apellido: 'López',
    rut: '18.765.432-1',
    es_pie: false,
    estado_matricula: 'Egresado',
    curso: { id: 2, nombre: '8° Básico B' },
  },
]

describe('NavbarStudentSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza el input de búsqueda de estudiantes', () => {
    render(
      <BrowserRouter>
        <NavbarStudentSearch />
      </BrowserRouter>
    )

    expect(
      screen.getByPlaceholderText('Buscar estudiante (RUT o Nombre)...')
    ).toBeInTheDocument()
  })

  it('muestra resultados en el menú flotante al buscar con 2 o más caracteres', async () => {
    estudiantesService.getEstudiantes.mockResolvedValueOnce(mockEstudiantes)

    render(
      <BrowserRouter>
        <NavbarStudentSearch />
      </BrowserRouter>
    )

    const input = screen.getByPlaceholderText('Buscar estudiante (RUT o Nombre)...')
    fireEvent.change(input, { target: { value: 'Juan' } })

    await waitFor(() => {
      expect(estudiantesService.getEstudiantes).toHaveBeenCalledWith({ search: 'Juan' })
    })

    expect(await screen.findByText('Juan Pérez')).toBeInTheDocument()
    expect(screen.getByText('5° Básico A')).toBeInTheDocument()
    expect(screen.getByText('PIE')).toBeInTheDocument()
    expect(screen.getByText('Juana López')).toBeInTheDocument()
    expect(screen.getByText('Egresado')).toBeInTheDocument()
  })

  it('navega a la ficha del estudiante al hacer clic en un resultado sugerido', async () => {
    estudiantesService.getEstudiantes.mockResolvedValueOnce(mockEstudiantes)

    render(
      <BrowserRouter>
        <NavbarStudentSearch />
      </BrowserRouter>
    )

    const input = screen.getByPlaceholderText('Buscar estudiante (RUT o Nombre)...')
    fireEvent.change(input, { target: { value: 'Juan' } })

    const estudianteBtn = await screen.findByText('Juan Pérez')
    fireEvent.click(estudianteBtn)

    expect(mockNavigate).toHaveBeenCalledWith('/estudiantes/101')
  })

  it('navega al directorio general al enviar el formulario (Enter)', async () => {
    render(
      <BrowserRouter>
        <NavbarStudentSearch />
      </BrowserRouter>
    )

    const input = screen.getByPlaceholderText('Buscar estudiante (RUT o Nombre)...')
    fireEvent.change(input, { target: { value: 'González' } })
    fireEvent.submit(input.closest('form'))

    expect(mockNavigate).toHaveBeenCalledWith('/estudiantes?search=Gonz%C3%A1lez')
  })

  it('muestra mensaje cuando no hay coincidencias', async () => {
    estudiantesService.getEstudiantes.mockResolvedValueOnce([])

    render(
      <BrowserRouter>
        <NavbarStudentSearch />
      </BrowserRouter>
    )

    const input = screen.getByPlaceholderText('Buscar estudiante (RUT o Nombre)...')
    fireEvent.change(input, { target: { value: 'Inexistente' } })

    expect(await screen.findByText('Sin coincidencias')).toBeInTheDocument()
    expect(
      screen.getByText(/No se encontraron alumnos con el término/)
    ).toBeInTheDocument()
  })
})
