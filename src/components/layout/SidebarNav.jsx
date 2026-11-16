import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  BarChart3,
  GraduationCap,
  AlertTriangle,
  ShieldAlert,
  Scale,
  CalendarCheck,
  Calendar,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  School,
} from 'lucide-react'
import { ROLES_DASHBOARD_ANALYTICS, ROLES_CIERRE_ANIO } from '@/constants/roles'
import { ROLES_MEDIACION_LECTURA } from '@/utils/mediaciones'
import DlpSensitiveText from '@/components/dlp/DlpSensitiveText'
import logoSidebar from '@/assets/logo_sidebar.png'

export default function SidebarNav({
  isOpen,
  setIsOpen,
  isCollapsed,
  setIsCollapsed,
  user,
  onLogout,
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname

  const allNavItems = [
    {
      icon: LayoutDashboard,
      label: 'Panel Principal',
      path: '/dashboard',
      roles: ROLES_DASHBOARD_ANALYTICS,
      activeColor: 'bg-cyan-500 text-white shadow-md shadow-cyan-500/40',
      activeTextColor: 'text-cyan-700 dark:text-cyan-400 font-bold',
      hoverBg: 'hover:bg-slate-800/80 text-slate-300 hover:text-white',
    },
    {
      icon: BarChart3,
      label: 'Analítica',
      path: '/analytics',
      roles: ROLES_DASHBOARD_ANALYTICS,
      activeColor: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40',
      activeTextColor: 'text-indigo-700 dark:text-indigo-400 font-bold',
      hoverBg: 'hover:bg-slate-800/80 text-slate-300 hover:text-white',
    },
    {
      icon: GraduationCap,
      label: 'Cursos',
      path: '/estudiantes',
      activeColor: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/40',
      activeTextColor: 'text-emerald-700 dark:text-emerald-400 font-bold',
      hoverBg: 'hover:bg-slate-800/80 text-slate-300 hover:text-white',
    },
    {
      icon: AlertTriangle,
      label: 'Incidentes',
      path: '/incidentes',
      activeColor: 'bg-amber-500 text-white shadow-md shadow-amber-500/40',
      activeTextColor: 'text-amber-700 dark:text-amber-400 font-bold',
      hoverBg: 'hover:bg-slate-800/80 text-slate-300 hover:text-white',
    },
    {
      icon: ShieldAlert,
      label: 'Protocolos RICE',
      path: '/protocolos',
      roles: ROLES_DASHBOARD_ANALYTICS,
      activeColor: 'bg-rose-500 text-white shadow-md shadow-rose-500/40',
      activeTextColor: 'text-rose-700 dark:text-rose-400 font-bold',
      hoverBg: 'hover:bg-slate-800/80 text-slate-300 hover:text-white',
    },
    {
      icon: Scale,
      label: 'Mediaciones',
      path: '/mediaciones',
      roles: ROLES_MEDIACION_LECTURA,
      activeColor: 'bg-purple-600 text-white shadow-md shadow-purple-600/40',
      activeTextColor: 'text-purple-700 dark:text-purple-400 font-bold',
      hoverBg: 'hover:bg-slate-800/80 text-slate-300 hover:text-white',
    },
    {
      icon: CalendarCheck,
      label: 'Citaciones',
      path: '/citaciones',
      activeColor: 'bg-sky-500 text-white shadow-md shadow-sky-500/40',
      activeTextColor: 'text-sky-700 dark:text-sky-400 font-bold',
      hoverBg: 'hover:bg-slate-800/80 text-slate-300 hover:text-white',
    },
    {
      icon: Calendar,
      label: 'Cierre de Año',
      path: '/cierre-anio',
      roles: ROLES_CIERRE_ANIO,
      activeColor: 'bg-pink-500 text-white shadow-md shadow-pink-500/40',
      activeTextColor: 'text-pink-700 dark:text-pink-400 font-bold',
      hoverBg: 'hover:bg-slate-800/80 text-slate-300 hover:text-white',
    },
    {
      icon: Users,
      label: 'Usuarios',
      path: '/usuarios',
      roles: ['Administrador'],
      activeColor: 'bg-teal-500 text-white shadow-md shadow-teal-500/40',
      activeTextColor: 'text-teal-700 dark:text-teal-400 font-bold',
      hoverBg: 'hover:bg-slate-800/80 text-slate-300 hover:text-white',
    },
    {
      icon: Settings,
      label: 'Configuración',
      path: '/configuracion',
      roles: ['Administrador'],
      activeColor: 'bg-slate-600 text-white shadow-md shadow-slate-600/40',
      activeTextColor: 'text-slate-800 dark:text-slate-200 font-bold',
      hoverBg: 'hover:bg-slate-800/80 text-slate-300 hover:text-white',
    },
  ]

  const navItems = allNavItems.filter((item) => !item.roles || item.roles.includes(user?.rol))

  const getInitials = (nombre, apellido) => {
    return `${nombre?.[0] || ''}${apellido?.[0] || ''}`.toUpperCase()
  }

  return (
    <>
      {/* Backdrop con desenfoque para pantallas móviles */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Contenedor Principal del Sidebar con el color oscuro original */}
      <aside
        data-testid="sidebar-nav"
        className={`
          fixed inset-y-0 left-0 z-30 flex flex-col h-full
          bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-white
          transition-all duration-300 ease-in-out shadow-2xl md:shadow-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:flex-shrink-0
          ${isCollapsed ? 'w-[76px]' : 'w-64'}
        `}
      >
        {/* Cabecera del Sidebar con Logotipo Institucional sobre fondo blanco */}
        <div className="h-16 flex items-center justify-between px-3 border-b border-slate-200/90 dark:border-slate-800 bg-white shrink-0">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img
                src={logoSidebar}
                alt="SIGA Escolar"
                className="h-10 w-auto object-contain max-w-[170px]"
              />
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <button
                type="button"
                onClick={() => setIsCollapsed(false)}
                title="Expandir menú"
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-blue-600/30 hover:scale-105 transition-transform"
              >
                <School className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Botón de toggle en escritorio */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
            aria-label={isCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
            className="hidden md:flex p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Botón de cerrar en móvil */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar barra lateral"
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Navegación con Notched Curved Tabs */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3">
          {!isCollapsed && (
            <p className="px-4 text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-2">
              Menú Principal
            </p>
          )}

          <nav className="flex flex-col space-y-1.5">
            {navItems.map((item, idx) => {
              const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/')

              return (
                <div key={idx} className="relative">
                  {/* Curva cóncava superior de apertura hacia la pantalla (24px) */}
                  {isActive && (
                    <svg
                      className="absolute -top-6 right-0 w-6 h-6 pointer-events-none text-slate-100 dark:text-slate-950 z-20"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path d="M24,0 C24,13.2548 13.2548,24 0,24 L24,24 Z" fill="currentColor" />
                    </svg>
                  )}

                  {/* Curva cóncava inferior de apertura hacia la pantalla (24px) */}
                  {isActive && (
                    <svg
                      className="absolute -bottom-6 right-0 w-6 h-6 pointer-events-none text-slate-100 dark:text-slate-950 z-20"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path d="M0,0 C13.2548,0 24,10.7452 24,24 L24,0 Z" fill="currentColor" />
                    </svg>
                  )}

                  {/* Botón del ítem de navegación */}
                  <button
                    type="button"
                    onClick={() => {
                      navigate(item.path)
                      setIsOpen(false)
                    }}
                    title={item.label}
                    className={`
                      relative flex items-center transition-all duration-200 outline-none
                      ${
                        isActive
                          ? 'bg-slate-100 dark:bg-slate-950 rounded-l-full py-2.5 pl-2.5 ml-2 -mr-px w-[calc(100%-8px+1px)] z-10'
                          : `py-2 rounded-xl mx-2 ${
                              isCollapsed ? 'justify-center px-0' : 'px-3'
                            } ${item.hoverBg}`
                      }
                    `}
                  >
                    {/* Botón circular con icono (Pastilla vibrante que flota dentro de la cápsula) */}
                    <div
                      className={`
                        flex items-center justify-center shrink-0 transition-all duration-200
                        ${
                          isActive
                            ? `w-10 h-10 rounded-full ${item.activeColor}`
                            : 'w-9 h-9 rounded-lg text-slate-400 group-hover:text-white'
                        }
                      `}
                    >
                      <item.icon className="w-5 h-5" />
                    </div>

                    {/* Texto del ítem de menú (visible en modo expandido) */}
                    {!isCollapsed && (
                      <span
                        className={`
                          ml-3 text-sm truncate text-left transition-colors duration-200 tracking-wide
                          ${
                            isActive
                              ? `${item.activeTextColor} font-extrabold`
                              : 'font-medium text-slate-300'
                          }
                        `}
                      >
                        {item.label}
                      </span>
                    )}
                  </button>
                </div>
              )
            })}
          </nav>
        </div>

        {/* Pie del Sidebar con el color oscuro original */}
        <div className="p-3 border-t border-slate-800/80 shrink-0 bg-slate-900/95 dark:bg-slate-950/95">
          {!isCollapsed ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0 overflow-hidden ring-2 ring-slate-700">
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

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">
                    <DlpSensitiveText value={`${user?.nombre || ''} ${user?.apellido || ''}`.trim()} tipo="nombre" />
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {user?.rol || 'Funcionario'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onLogout}
                data-testid="logout-button"
                title="Cerrar sesión institucional"
                aria-label="Cerrar sesión"
                className="p-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2.5">
              <div
                title={`${user?.nombre || ''} ${user?.apellido || ''} (${user?.rol || ''})`}
                className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0 overflow-hidden ring-2 ring-slate-700 cursor-default"
              >
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

              <button
                type="button"
                onClick={onLogout}
                data-testid="logout-button-collapsed"
                title="Cerrar sesión institucional"
                aria-label="Cerrar sesión"
                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
