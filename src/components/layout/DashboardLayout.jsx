import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/store/useAuthStore'
import { initSocket, disconnectSocket } from '@/services/socketService'
import { useNotifications } from '@/hooks/useNotifications'
import NotificationBadge from '@/components/notifications/NotificationBadge'
import NotificationCenter from '@/components/notifications/NotificationCenter'
import ThemeToggle from '@/components/ThemeToggle'
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  ShieldAlert,
  Search,
  Menu,
  ChevronDown,
  BarChart3,
  Settings,
  GraduationCap,
  Sparkles,
} from 'lucide-react'
import AsistenteNormativoModal from '@/components/rice/AsistenteNormativoModal'
import NavbarStudentSearch from '@/components/layout/NavbarStudentSearch'

import logoSidebar from '@/assets/logo_sidebar.png'

const Sidebar = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const currentPath = location.pathname

  const allNavItems = [
    { icon: LayoutDashboard, label: 'Panel Principal', path: '/dashboard', roles: ['Administrador', 'Equipo de Formación', 'Directivo'] },
    { icon: BarChart3, label: 'Analítica', path: '/analytics', roles: ['Administrador', 'Equipo de Formación', 'Directivo'] },
    { icon: Users, label: 'Estudiantes', path: '/estudiantes' },
    { icon: AlertTriangle, label: 'Incidentes', path: '/incidentes' },
    { icon: ShieldAlert, label: 'Protocolos RICE', path: '/protocolos', roles: ['Administrador', 'Equipo de Formación', 'Directivo'] },
    { icon: GraduationCap, label: 'Cierre de Año', path: '/cierre-anio', roles: ['Administrador', 'Inspector', 'Equipo de Formación', 'Directivo'] },
    { icon: Users, label: 'Usuarios', path: '/usuarios', roles: ['Administrador'] },
    { icon: Settings, label: 'Configuración', path: '/configuracion', roles: ['Administrador'] },
  ]

  const navItems = allNavItems.filter((item) => !item.roles || item.roles.includes(user?.rol))

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-800/50 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-white transition-transform duration-300 ease-in-out shadow-2xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:flex-shrink-0
      `}>
        <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <img
            src={logoSidebar}
            alt="SIGA Escolar"
            className="h-11 w-auto object-contain max-w-[210px]"
          />
        </div>

        <div className="p-4">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mb-4">Menú Principal</p>
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
                      : 'text-slate-300 hover:bg-slate-800/80 dark:hover:bg-slate-900/80 hover:text-white hover:translate-x-1'
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

const Header = ({ setIsOpen, unreadCount, onNotificationClick, onOpenAsistenteRice }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    disconnectSocket()
    logout()
    navigate('/login')
  }

  const getInitials = (nombre, apellido) => {
    return `${nombre?.[0] || ''}${apellido?.[0] || ''}`.toUpperCase()
  }

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-4 sm:px-6 z-10 sticky top-0">
      <div className="flex items-center gap-4">
        <button
          className="md:hidden p-2 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>
        <NavbarStudentSearch />
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onOpenAsistenteRice}
          title="Consultar Copiloto Normativo RICE"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="hidden md:inline">Copiloto RICE</span>
        </button>
        <ThemeToggle />
        <NotificationBadge
          count={unreadCount}
          onClick={onNotificationClick}
        />
        <div className="flex items-center gap-3 border-l border-gray-200 dark:border-gray-700 pl-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md overflow-hidden">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={`${user.nombre || ''} ${user.apellido || ''}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              getInitials(user?.nombre, user?.apellido)
            )}
          </div>
          <div className="hidden sm:block text-sm">
            <p className="font-semibold text-gray-700 dark:text-gray-200">{user?.nombre} {user?.apellido}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user?.rol}</p>
          </div>
          <button onClick={handleLogout} data-testid="logout-button" className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false)
  const [asistenteRiceOpen, setAsistenteRiceOpen] = useState(false)
  const { token } = useAuth()
  const { notificaciones, unreadCount, marcarLeida, marcarTodasLeidas } = useNotifications()

  // Initialize socket on mount
  useEffect(() => {
    if (token) {
      initSocket(token)
    }
  }, [token])

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gray-900 font-sans overflow-hidden text-gray-900 dark:text-gray-100">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          setIsOpen={setIsSidebarOpen}
          unreadCount={unreadCount}
          onNotificationClick={() => setNotificationCenterOpen(true)}
          onOpenAsistenteRice={() => setAsistenteRiceOpen(true)}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-gray-900">
          {children}
        </main>
      </div>

      {/* Notification Center Drawer */}
      <NotificationCenter
        isOpen={notificationCenterOpen}
        onClose={() => setNotificationCenterOpen(false)}
        notificaciones={notificaciones}
        onMarcarLeida={marcarLeida}
        onMarcarTodasLeidas={marcarTodasLeidas}
      />

      {/* Copiloto Normativo RICE Modal */}
      <AsistenteNormativoModal
        isOpen={asistenteRiceOpen}
        onClose={() => setAsistenteRiceOpen(false)}
      />
    </div>
  )
}
