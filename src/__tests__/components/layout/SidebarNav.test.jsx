import { render, screen, fireEvent } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import SidebarNav from '@/components/layout/SidebarNav'

const mockedNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  }
})

describe('SidebarNav - Diseño Notched Curved Sidebar', () => {
  const defaultUser = {
    id: 'user-1',
    nombre: 'Profesor',
    apellido: 'Demostrativo',
    rol: 'Docente',
    avatar_url: null,
  }

  const defaultProps = {
    isOpen: true,
    setIsOpen: vi.fn(),
    isCollapsed: false,
    setIsCollapsed: vi.fn(),
    user: defaultUser,
    onLogout: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza la lista de navegación para rol Docente en modo expandido', () => {
    render(
      <MemoryRouter initialEntries={['/estudiantes']}>
        <SidebarNav {...defaultProps} />
      </MemoryRouter>
    )

    // Debe mostrar los módulos autorizados para Docente
    expect(screen.getByText('Cursos')).toBeInTheDocument()
    expect(screen.getByText('Incidentes')).toBeInTheDocument()
    expect(screen.getByText('Mediaciones')).toBeInTheDocument()
    expect(screen.getByText('Citaciones')).toBeInTheDocument()

    // No debe mostrar opciones exclusivas de Directivo o Admin
    expect(screen.queryByText('Panel Principal')).not.toBeInTheDocument()
    expect(screen.queryByText('Usuarios')).not.toBeInTheDocument()

    // Debe mostrar el nombre del docente en el pie
    expect(screen.getByText('Profesor Demostrativo')).toBeInTheDocument()
    expect(screen.getByText('Docente')).toBeInTheDocument()
  })

  it('permite alternar el estado de colapso con el botón toggle de escritorio', () => {
    const setIsCollapsed = vi.fn()
    render(
      <MemoryRouter initialEntries={['/estudiantes']}>
        <SidebarNav {...defaultProps} isCollapsed={false} setIsCollapsed={setIsCollapsed} />
      </MemoryRouter>
    )

    const toggleBtn = screen.getByLabelText('Colapsar barra lateral')
    fireEvent.click(toggleBtn)

    expect(setIsCollapsed).toHaveBeenCalledWith(true)
  })

  it('en modo colapsado oculta los textos de los ítems pero mantiene los botones accesibles', () => {
    render(
      <MemoryRouter initialEntries={['/estudiantes']}>
        <SidebarNav {...defaultProps} isCollapsed={true} />
      </MemoryRouter>
    )

    // Los textos de los labels se ocultan del DOM visual del botón en modo colapsado
    expect(screen.queryByText('Cursos')).not.toBeInTheDocument()

    // El botón sigue existiendo con su atributo title
    expect(screen.getByTitle('Cursos')).toBeInTheDocument()
    expect(screen.getByTitle('Incidentes')).toBeInTheDocument()
  })

  it('dispara la navegación y cierra el drawer móvil al pulsar un ítem', () => {
    const setIsOpen = vi.fn()
    render(
      <MemoryRouter initialEntries={['/estudiantes']}>
        <SidebarNav {...defaultProps} setIsOpen={setIsOpen} />
      </MemoryRouter>
    )

    const incidentesBtn = screen.getByText('Incidentes').closest('button')
    fireEvent.click(incidentesBtn)

    expect(mockedNavigate).toHaveBeenCalledWith('/incidentes')
    expect(setIsOpen).toHaveBeenCalledWith(false)
  })

  it('dispara onLogout al pulsar el botón de cerrar sesión en el pie', () => {
    const onLogout = vi.fn()
    render(
      <MemoryRouter initialEntries={['/estudiantes']}>
        <SidebarNav {...defaultProps} onLogout={onLogout} />
      </MemoryRouter>
    )

    const logoutBtn = screen.getByLabelText('Cerrar sesión')
    fireEvent.click(logoutBtn)

    expect(onLogout).toHaveBeenCalledTimes(1)
  })
})
