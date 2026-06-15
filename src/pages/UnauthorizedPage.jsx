import { useNavigate } from 'react-router-dom'

export default function UnauthorizedPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-300 mb-2">403</h1>
        <p className="text-lg font-semibold text-gray-700">Acceso no autorizado</p>
        <p className="text-sm text-gray-500 mt-2 mb-6">
          No tienes permisos para acceder a esta sección.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  )
}
