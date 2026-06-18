import { useState, useEffect } from 'react'
import { getUsuarios, createUsuario, updateUsuario, desactivarUsuario } from '@/services/usuariosService'
import CrearUsuarioModal from '@/components/usuarios/CrearUsuarioModal'
import EditarUsuarioModal from '@/components/usuarios/EditarUsuarioModal'
import RolBadge from '@/components/usuarios/RolBadge'
import EstadoBadge from '@/components/usuarios/EstadoBadge'
import { useAuth } from '@/store/useAuthStore'

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 animate-spin text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="mt-2 text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
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
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
            <p className="mt-1 text-sm text-gray-600">
              {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} registrado{usuarios.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowCrearModal(true)}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Usuario
          </button>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {usuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {usuario.nombre} {usuario.apellido}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-600">{usuario.email}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <RolBadge rol={usuario.rol} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <EstadoBadge activo={usuario.activo} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditar(usuario)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {usuario.activo && (
                          <button
                            onClick={() => handleDesactivar(usuario)}
                            className="text-red-600 hover:text-red-900"
                            title="Desactivar"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Confirmar Desactivación</h3>
            <p className="mt-2 text-sm text-gray-600">
              ¿Estás seguro de desactivar a <span className="font-semibold">{confirmDelete.nombre} {confirmDelete.apellido}</span>?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDesactivar}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Desactivar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
