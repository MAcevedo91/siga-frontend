import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { useAuth, getDefaultRouteByRole } from '@/store/useAuthStore'

export default function Breadcrumbs({ items = [] }) {
  const { user } = useAuth()
  const homeRoute = getDefaultRouteByRole(user?.rol)

  return (
    <nav className="flex mb-4" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2 text-sm text-gray-500">
        <li className="inline-flex items-center">
          <Link
            to={homeRoute}
            className="inline-flex items-center text-gray-500 hover:text-blue-600 transition-colors"
          >
            <Home className="w-4 h-4 mr-1.5" />
            Inicio
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={index} className="inline-flex items-center">
              <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
              {item.href && !isLast ? (
                <Link
                  to={item.href}
                  className="text-gray-500 hover:text-blue-600 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="font-medium text-gray-800">
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
