import { useAuth } from '@/store/useAuthStore'
import { useNavigate } from 'react-router-dom'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <p className="text-gray-600">
            Bienvenido, <span className="font-semibold">{user?.nombre || 'Usuario'}</span>
          </p>
          <p className="text-sm text-gray-400 mt-1">Rol: {user?.rol || '—'}</p>
        </div>
      </div>
    </div>
  )
}
