import { useState, useEffect } from 'react'
import { getUsuarios, createUsuario, updateUsuario, desactivarUsuario } from '@/services/usuariosService'
import CrearUsuarioModal from '@/components/usuarios/CrearUsuarioModal'
import EditarUsuarioModal from '@/components/usuarios/EditarUsuarioModal'
import RolBadge from '@/components/usuarios/RolBadge'
import EstadoBadge from '@/components/usuarios/EstadoBadge'
import { useAuth } from '@/store/useAuthStore'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Users, UserPlus, Edit, UserX, Shield, UserCheck, Activity } from 'lucide-react'

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCrearModal, setShowCrearModal] = useState(false)
  const [showEditarModal, setShowEditarModal] = useState(false)
  const [selectedUsuario, setSelectedUsuario] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const { user: currentUser } = useAuth()

  useEffect(() => {
    loadUsuarios()
  }, [])

  const loadUsuarios = async () => {
    try {
      setLoading(true)
      const data = await getUsuarios()
      setUsuarios(data)
    } catch (err) {
      setError('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  const handleCrearUsuario = async (data) => {
    const nuevoUsuario = await createUsuario(data)
    setUsuarios([...usuarios, nuevoUsuario])
  }

  const handleEditarUsuario = async (id, data) => {
    const usuarioActualizado = await updateUsuario(id, data)
    setUsuarios(usuarios.map((u) => (u.id === id ? usuarioActualizado : u)))
  }

  const handleDesactivar = async (usuario) => {
    const adminCount = usuarios.filter((u) => u.rol === 'Administrador' && u.activo).length

    if (usuario.rol === 'Administrador' && adminCount === 1) {
      alert('No puedes desactivar al último administrador del sistema')
      return
    }

    setConfirmDelete(usuario)
  }

  const confirmDesactivar = async () => {
    try {
      const usuarioActualizado = await desactivarUsuario(confirmDelete.id)
      setUsuarios(usuarios.map((u) => (u.id === confirmDelete.id ? usuarioActualizado : u)))
      setConfirmDelete(null)
    } catch (err) {
      alert(err.response?.data?.message || 'Error al desactivar usuario')
      setConfirmDelete(null)
    }
  }

  const handleEditar = (usuario) => {
    setSelectedUsuario(usuario)
    setShowEditarModal(true)
  }

  const getInitials = (nombre, apellido) => {
    return `${nombre?.[0] || ''}${apellido?.[0] || ''}`.toUpperCase()
  }

  const getRolGradient = (rol) => {
    switch (rol) {
      case 'Administrador':
        return 'from-purple-500 to-indigo-600'
      case 'Equipo de Formación':
        return 'from-cyan-500 to-blue-600'
      case 'Inspector':
        return 'from-green-500 to-emerald-600'
      case 'Docente':
        return 'from-orange-500 to-amber-600'
      default:
        return 'from-gray-500 to-slate-600'
    }
  }

  const getRolBadge = (rol) => {
    switch (rol) {
      case 'Administrador':
        return 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white'
      case 'Equipo de Formación':
        return 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
      case 'Inspector':
        return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
      case 'Docente':
        return 'bg-gradient-to-r from-orange-500 to-amber-600 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const stats = {
    total: usuarios.length,
    activos: usuarios.filter(u => u.activo).length,
    porRol: {
      'Administrador': usuarios.filter(u => u.rol === 'Administrador').length,
      'Equipo de Formación': usuarios.filter(u => u.rol === 'Equipo de Formación').length,
      'Inspector': usuarios.filter(u => u.rol === 'Inspector').length,
      'Docente': usuarios.filter(u => u.rol === 'Docente').length,
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 animate-spin text-blue-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="mt-2 text-gray-600">Cargando usuarios...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="rounded-lg bg-red-50 p-6 text-center">
            <p className="text-red-800">{error}</p>
            <button
              onClick={loadUsuarios}
              className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Control de accesos y permisos del sistema
                </p>
              </div>
              <button
                onClick={() => setShowCrearModal(true)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/60 transition-all hover:-translate-y-0.5"
              >
                <UserPlus className="h-5 w-5" />
                Nuevo Usuario
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md hover:shadow-xl transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Total Usuarios</p>
                  <h3 className="text-3xl font-bold text-gray-900">{stats.total}</h3>
                </div>
                <div className="p-3 rounded-xl shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md hover:shadow-xl transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Usuarios Activos</p>
                  <h3 className="text-3xl font-bold text-gray-900">{stats.activos}</h3>
                </div>
                <div className="p-3 rounded-xl shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                  <Activity className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md hover:shadow-xl transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Administradores</p>
                  <h3 className="text-3xl font-bold text-gray-900">{stats.porRol['Administrador']}</h3>
                </div>
                <div className="p-3 rounded-xl shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                  <Shield className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md hover:shadow-xl transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Equipo Formación</p>
                  <h3 className="text-3xl font-bold text-gray-900">{stats.porRol['Equipo de Formación']}</h3>
                </div>
                <div className="p-3 rounded-xl shadow-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                  <UserCheck className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {usuarios.map((usuario) => (
              <div
                key={usuario.id}
                className="bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                <div className={`h-24 bg-gradient-to-br ${getRolGradient(usuario.rol)} relative`}>
                  <div className="absolute -bottom-12 left-6">
                    <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${getRolGradient(usuario.rol)} shadow-xl flex items-center justify-center border-4 border-white`}>
                      <span className="text-3xl font-bold text-white">
                        {getInitials(usuario.nombre, usuario.apellido)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-16 px-6 pb-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {usuario.nombre} {usuario.apellido}
                      </h3>
                      <p className="text-sm text-gray-600 break-all">{usuario.email}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mb-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-md ${getRolBadge(usuario.rol)}`}>
                      {usuario.rol}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${usuario.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleEditar(usuario)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors font-semibold"
                    >
                      <Edit className="h-5 w-5" />
                      Editar
                    </button>
                    {usuario.activo && (
                      <button
                        onClick={() => handleDesactivar(usuario)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors font-semibold"
                      >
                        <UserX className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <CrearUsuarioModal
          isOpen={showCrearModal}
          onClose={() => setShowCrearModal(false)}
          onSuccess={handleCrearUsuario}
        />

        <EditarUsuarioModal
          isOpen={showEditarModal}
          onClose={() => {
            setShowEditarModal(false)
            setSelectedUsuario(null)
          }}
          onSuccess={handleEditarUsuario}
          usuario={selectedUsuario}
        />

        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto">
                <UserX className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center">Confirmar Desactivación</h3>
              <p className="mt-3 text-sm text-gray-600 text-center">
                ¿Estás seguro de desactivar a <span className="font-semibold">{confirmDelete.nombre} {confirmDelete.apellido}</span>?
              </p>
              <p className="mt-2 text-xs text-gray-500 text-center">
                El usuario perderá acceso al sistema inmediatamente.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDesactivar}
                  className="flex-1 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:from-red-700 hover:to-red-800 shadow-lg transition-all"
                >
                  Desactivar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
