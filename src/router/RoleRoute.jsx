import { Navigate } from 'react-router-dom'
import { useAuth } from '@/store/useAuthStore'

export default function RoleRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user?.rol)) {
    return <Navigate to="/no-autorizado" replace />
  }

  return children
}
