import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import TablaUsuariosActividad from '../../../components/analytics/TablaUsuariosActividad'

describe('TablaUsuariosActividad Component', () => {
  const mockUsuariosData = {
    totalUsuarios: 3,
    totalIncidentesRegistrados: 10,
    usuarios: [
      {
        id: 'u1',
        nombre: 'Carlos',
        apellido: 'Valenzuela',
        nombreCompleto: 'Carlos Valenzuela',
        email: 'carlos@el-salvador.cl',
        rol: 'Inspector',
        activo: true,
        totalIncidentes: 6,
        porcentajeDelTotal: 60,
        ultimoRegistro: '2026-10-15',
      },
      {
        id: 'u2',
        nombre: 'María',
        apellido: 'Soto',
        nombreCompleto: 'María Soto',
        email: 'maria@el-salvador.cl',
        rol: 'Docente',
        activo: true,
        totalIncidentes: 4,
        porcentajeDelTotal: 40,
        ultimoRegistro: '2026-10-10',
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
        porcentajeDelTotal: 0,
        ultimoRegistro: null,
      },
    ],
  }

  it('renderiza correctamente el título, total de incidentes y filas de usuarios', () => {
    render(<TablaUsuariosActividad usuariosData={mockUsuariosData} loading={false} />)

    expect(screen.getByText('Registro de Incidentes por Usuario')).toBeInTheDocument()
    expect(screen.getByText('Carlos Valenzuela')).toBeInTheDocument()
    expect(screen.getByText('María Soto')).toBeInTheDocument()
    expect(screen.getByText('Pedro Araya')).toBeInTheDocument()

    // Verifica badges de roles (pueden aparecer también como opción en el select)
    expect(screen.getAllByText('Inspector').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Docente').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Directivo').length).toBeGreaterThanOrEqual(1)

    // Verifica estado
    expect(screen.getAllByText('Activo')).toHaveLength(2)
    expect(screen.getByText('Inactivo')).toBeInTheDocument()
  })

  it('filtra usuarios por término de búsqueda en tiempo real', () => {
    render(<TablaUsuariosActividad usuariosData={mockUsuariosData} loading={false} />)

    const searchInput = screen.getByPlaceholderText(/Buscar por nombre/i)
    fireEvent.change(searchInput, { target: { value: 'Soto' } })

    expect(screen.getByText('María Soto')).toBeInTheDocument()
    expect(screen.queryByText('Carlos Valenzuela')).not.toBeInTheDocument()
    expect(screen.queryByText('Pedro Araya')).not.toBeInTheDocument()
  })

  it('filtra usuarios por rol seleccionado en el menú desplegable', () => {
    render(<TablaUsuariosActividad usuariosData={mockUsuariosData} loading={false} />)

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'Inspector' } })

    expect(screen.getByText('Carlos Valenzuela')).toBeInTheDocument()
    expect(screen.queryByText('María Soto')).not.toBeInTheDocument()
    expect(screen.queryByText('Pedro Araya')).not.toBeInTheDocument()
  })

  it('muestra estado vacío si ninguna búsqueda coincide', () => {
    render(<TablaUsuariosActividad usuariosData={mockUsuariosData} loading={false} />)

    const searchInput = screen.getByPlaceholderText(/Buscar por nombre/i)
    fireEvent.change(searchInput, { target: { value: 'Inexistente' } })

    expect(
      screen.getByText(/No se encontraron usuarios registrados/i)
    ).toBeInTheDocument()
  })

  it('muestra skeleton loader cuando loading es true', () => {
    const { container } = render(
      <TablaUsuariosActividad usuariosData={mockUsuariosData} loading={true} />
    )
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })
})
