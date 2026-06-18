import { Routes, Route, Navigate } from 'react-router-dom'
import PrivateRoute from './PrivateRoute'
import RoleRoute from './RoleRoute'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import UnauthorizedPage from '@/pages/UnauthorizedPage'
import UsuariosPage from '@/pages/UsuariosPage'
import EstudiantesPage from '@/pages/EstudiantesPage'
import EstudiantePerfilPage from '@/pages/EstudiantePerfilPage'
import IncidentesPage from '@/pages/IncidentesPage'
import NuevoIncidentePage from '@/pages/NuevoIncidentePage'
import IncidenteDetallePage from '@/pages/IncidenteDetallePage'
import ProtocolosPage from '@/pages/ProtocolosPage'
import NuevoProtocoloPage from '@/pages/NuevoProtocoloPage'
import ProtocoloDetallePage from '@/pages/ProtocoloDetallePage'
import { useAuth } from '@/store/useAuthStore'

export default function AppRouter() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/no-autorizado" element={<UnauthorizedPage />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/usuarios"
        element={
          <RoleRoute allowedRoles={['Administrador']}>
            <UsuariosPage />
          </RoleRoute>
        }
      />
      <Route
        path="/estudiantes"
        element={
          <PrivateRoute>
            <EstudiantesPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/estudiantes/:id"
        element={
          <PrivateRoute>
            <EstudiantePerfilPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/incidentes"
        element={
          <PrivateRoute>
            <IncidentesPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/incidentes/nuevo"
        element={
          <RoleRoute allowedRoles={['Administrador', 'Coordinador', 'Inspector']}>
            <NuevoIncidentePage />
          </RoleRoute>
        }
      />
      <Route
        path="/incidentes/:id"
        element={
          <PrivateRoute>
            <IncidenteDetallePage />
          </PrivateRoute>
        }
      />
      <Route
        path="/protocolos"
        element={
          <RoleRoute allowedRoles={['Administrador', 'Coordinador']}>
            <ProtocolosPage />
          </RoleRoute>
        }
      />
      <Route
        path="/protocolos/nuevo"
        element={
          <RoleRoute allowedRoles={['Administrador', 'Coordinador']}>
            <NuevoProtocoloPage />
          </RoleRoute>
        }
      />
      <Route
        path="/protocolos/:id"
        element={
          <RoleRoute allowedRoles={['Administrador', 'Coordinador']}>
            <ProtocoloDetallePage />
          </RoleRoute>
        }
      />
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
      />
    </Routes>
  )
}
