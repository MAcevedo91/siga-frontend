import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { useAuth } from '@/store/useAuthStore'

const getHomeRouteByRole = (rol) => {
  if (rol === 'Docente') return '/estudiantes'
  if (rol === 'Inspector') return '/incidentes'
  return '/dashboard'
}

export default function Breadcrumbs({ items = [] }) {
  const { user } = useAuth()
  const homeRoute = getHomeRouteByRole(user?.rol)

  return (
    <nav className="flex mb-4" aria-label="Breadcrumb">
      <ol className="inline-flex items-center flex-wrap gap-1 sm:gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100/90 dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700/80 shadow-2xs text-xs sm:text-sm">
        <li className="inline-flex items-center">
          <Link
            to={homeRoute}
            className="inline-flex items-center gap-1.5 font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Home className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 shrink-0" />
            <span>Inicio</span>
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={index} className="inline-flex items-center gap-1 sm:gap-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" aria-hidden="true" />
              {item.onClick ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {item.label}
                </button>
              ) : item.href && !isLast ? (
                <Link
                  to={item.href}
                  className="font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="font-bold text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
