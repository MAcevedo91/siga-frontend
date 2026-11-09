import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import FuncionariosWidget from '../../../components/analytics/FuncionariosWidget'

describe('FuncionariosWidget Component', () => {
  const mockUsuariosData = {
    totalUsuarios: 3,
    totalIncidentesRegistrados: 12,
    usuarios: [
      {
        id: 'u1',
        nombre: 'Carlos',
        apellido: 'Valenzuela',
        nombreCompleto: 'Carlos Valenzuela',
        email: 'carlos@el-salvador.cl',
        rol: 'Inspector',
        activo: true,
        totalIncidentes: 7,
      },
      {
        id: 'u2',
        nombre: 'María',
        apellido: 'Soto',
        nombreCompleto: 'María Soto',
        email: 'maria@el-salvador.cl',
        rol: 'Docente',
        activo: true,
        totalIncidentes: 5,
      },
      {
        id: 'u3',
        nombre: 'Pedro',
        apellido: 'Araya',
        nombreCompleto: 'Pedro Araya',
        email: 'pedro@el-salvador.cl',
        rol: 'Directivo',
        activo: false,
        totalIncidentes: 0,
      },
    ],
  }

  it('renderiza el título Funcionarios y los miembros del equipo', () => {
    render(<FuncionariosWidget usuariosData={mockUsuariosData} loading={false} />)

    expect(screen.getByText('Funcionarios')).toBeInTheDocument()
    expect(screen.getByText('Carlos Valenzuela')).toBeInTheDocument()
    expect(screen.getByText('María Soto')).toBeInTheDocument()
    expect(screen.getByText('Pedro Araya')).toBeInTheDocument()

    // Roles visibles
    expect(screen.getByText('Inspector')).toBeInTheDocument()
    expect(screen.getByText('Docente')).toBeInTheDocument()
    expect(screen.getByText('Directivo')).toBeInTheDocument()

    // Casos reportados
    expect(screen.getByText('7 casos')).toBeInTheDocument()
    expect(screen.getByText('5 casos')).toBeInTheDocument()
  })

  it('permite buscar funcionarios al activar la barra de búsqueda', () => {
    render(<FuncionariosWidget usuariosData={mockUsuariosData} loading={false} />)

    const searchButton = screen.getByTitle('Buscar funcionario')
    fireEvent.click(searchButton)

    const searchInput = screen.getByPlaceholderText(/Filtrar por nombre o rol/i)
    fireEvent.change(searchInput, { target: { value: 'Soto' } })

    expect(screen.getByText('María Soto')).toBeInTheDocument()
    expect(screen.queryByText('Carlos Valenzuela')).not.toBeInTheDocument()
    expect(screen.queryByText('Pedro Araya')).not.toBeInTheDocument()
  })

  it('muestra skeleton loader cuando loading es true', () => {
    const { container } = render(
      <FuncionariosWidget usuariosData={mockUsuariosData} loading={true} />
    )
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })
})
