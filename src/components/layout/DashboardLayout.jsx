import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/store/useAuthStore'
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  ShieldAlert,
  Bell,
  Search,
  Menu,
  ChevronDown,
} from 'lucide-react'

const Sidebar = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate()
  const currentPath = window.location.pathname

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Directorio Estudiantes', path: '/estudiantes' },
    { icon: AlertTriangle, label: 'Registro Incidentes', path: '/incidentes' },
    { icon: ShieldAlert, label: 'Protocolos RICE', path: '/protocolos' },
    { icon: Users, label: 'Gestión de Usuarios', path: '/usuarios' },
  ]

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-800/50 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transition-transform duration-300 ease-in-out shadow-2xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:flex-shrink-0
      `}>
        <div className="flex items-center justify-center h-16 border-b border-slate-700/50 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-wider">SIGA<span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">escolar</span></span>
          </div>
        </div>

        <div className="p-4">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-4">Menú Principal</p>
          <nav className="space-y-1">
            {navItems.map((item, idx) => {
              const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/')
              return (
                <button
                  key={idx}
                  onClick={() => {
                    navigate(item.path)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/50'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white hover:translate-x-1'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>
    </>
  )
}

const Header = ({ setIsOpen }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getInitials = (nombre, apellido) => {
    return `${nombre?.[0] || ''}${apellido?.[0] || ''}`.toUpperCase()
  }

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 z-10 sticky top-0">
      <div className="flex items-center gap-4">
        <button
          className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="hidden sm:flex items-center bg-gray-100 rounded-lg px-3 py-1.5 w-64">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Buscar estudiante (RUT o Nombre)..."
            className="bg-transparent border-none focus:outline-none text-sm w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-400 hover:text-gray-600">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
        <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
            {getInitials(user?.nombre, user?.apellido)}
          </div>
          <div className="hidden sm:block text-sm">
            <p className="font-semibold text-gray-700">{user?.nombre} {user?.apellido}</p>
            <p className="text-xs text-gray-500">{user?.rol}</p>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden text-gray-900">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header setIsOpen={setIsSidebarOpen} />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  )
}
