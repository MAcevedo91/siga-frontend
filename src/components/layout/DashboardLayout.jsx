import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/store/useAuthStore'
import { initSocket, disconnectSocket } from '@/services/socketService'
import { useNotifications } from '@/hooks/useNotifications'
import NotificationBadge from '@/components/notifications/NotificationBadge'
import NotificationCenter from '@/components/notifications/NotificationCenter'
import ThemeToggle from '@/components/ThemeToggle'
import ForensicWatermark from '@/components/dlp/ForensicWatermark'
import PrivacyShieldOverlay from '@/components/dlp/PrivacyShieldOverlay'
import { usePrivacyStore } from '@/store/usePrivacyStore'
import {
  Menu,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react'
import AsistenteNormativoModal from '@/components/rice/AsistenteNormativoModal'
import NavbarStudentSearch from '@/components/layout/NavbarStudentSearch'
import SidebarNav from '@/components/layout/SidebarNav'

const Header = ({ setIsOpen, unreadCount, onNotificationClick, onOpenAsistenteRice }) => {
  const { modoPrivacidad, toggleModoPrivacidad } = usePrivacyStore()

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800/80 h-16 flex items-center justify-between px-4 sm:px-6 z-20 sticky top-0 transition-colors">
      <div className="flex items-center gap-4">
        <button
          className="md:hidden p-2 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => setIsOpen(true)}
          aria-label="Abrir menú de navegación"
        >
          <Menu className="w-6 h-6" />
        </button>
        <NavbarStudentSearch />
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Botón DLP: Modo Privacidad Anti-Shoulder Surfing */}
        <button
          type="button"
          onClick={toggleModoPrivacidad}
          title={
            modoPrivacidad
              ? 'Modo Privacidad ACTIVO: Los datos sensibles de estudiantes están desenfocados (Alt + P)'
              : 'Activar Modo Privacidad: Desenfoca datos de alumnos para protegerlos de miradas ajenas (Alt + P)'
          }
          data-testid="privacy-toggle-button"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-sm border ${
            modoPrivacidad
              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700 ring-2 ring-amber-400/30'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
          }`}
        >
          {modoPrivacidad ? (
            <EyeOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
          ) : (
            <Eye className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
          )}
          <span className="hidden xl:inline">
            {modoPrivacidad ? 'Privacidad Activa' : 'Privacidad'}
          </span>
        </button>

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
      </div>
    </header>
  )
}

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('siga_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })

  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false)
  const [asistenteRiceOpen, setAsistenteRiceOpen] = useState(false)
  const { token, user, logout } = useAuth()
  const navigate = useNavigate()
  const { toggleModoPrivacidad } = usePrivacyStore()
  const { notificaciones, unreadCount, marcarLeida, marcarTodasLeidas } = useNotifications()

  const handleToggleCollapse = (val) => {
    setIsSidebarCollapsed(val)
    try {
      localStorage.setItem('siga_sidebar_collapsed', String(val))
    } catch {
      // Ignorar error de storage
    }
  }

  const handleLogout = () => {
    disconnectSocket()
    logout()
    navigate('/login')
  }

  // Initialize socket on mount
  useEffect(() => {
    if (token) {
      initSocket(token)
    }
  }, [token])

  // Listener global para atajo Alt + P (alternar Modo Privacidad en cualquier vista)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault()
        toggleModoPrivacidad()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleModoPrivacidad])

  return (
    <div className="fixed inset-0 flex bg-slate-100 dark:bg-slate-950 font-sans overflow-hidden text-gray-900 dark:text-gray-100">
      {/* DLP: Marca de agua forense disuasoria contra fotos y capturas */}
      <ForensicWatermark />

      {/* DLP: Escudo de privacidad por desatención o minimización */}
      <PrivacyShieldOverlay />

      <SidebarNav
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={handleToggleCollapse}
        user={user}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <Header
          setIsOpen={setIsSidebarOpen}
          unreadCount={unreadCount}
          onNotificationClick={() => setNotificationCenterOpen(true)}
          onOpenAsistenteRice={() => setAsistenteRiceOpen(true)}
        />

        <main className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto bg-slate-100 dark:bg-slate-950">
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
