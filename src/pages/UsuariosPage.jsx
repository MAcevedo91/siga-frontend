import { useState, useEffect, useMemo } from 'react'
import {
  getUsuarios,
  createUsuario,
  updateUsuario,
  desactivarUsuario,
  subirAvatarUsuario,
  eliminarAvatarUsuario,
} from '@/services/usuariosService'
import CrearUsuarioModal from '@/components/usuarios/CrearUsuarioModal'
import EditarUsuarioModal from '@/components/usuarios/EditarUsuarioModal'
import RolBadge from '@/components/usuarios/RolBadge'
import EstadoBadge from '@/components/usuarios/EstadoBadge'
import { useAuth } from '@/store/useAuthStore'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
  Users,
  UserPlus,
  Edit,
  UserX,
  Shield,
  UserCheck,
  Activity,
  Search,
  Filter,
  X,
  ArrowUpDown,
  Sparkles,
  GraduationCap,
  HeartHandshake,
} from 'lucide-react'
import { ROLES_DISPONIBLES, ROLES_CONVIVENCIA } from '@/constants/roles'
import toast from 'react-hot-toast'

// Jerarquía institucional para el ordenamiento primario de los usuarios
const JERARQUIA_ROLES = {
  'Administrador': 1,
  'Directiva': 2,
  'Directivo': 2,
  'Coordinador de Convivencia Escolar': 3,
  'Orientador': 4,
  'Psicólogo': 5,
  'Asistente Social': 6,
  'Equipo de Formación': 7,
  'Inspector': 8,
  'Docente': 9,
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCrearModal, setShowCrearModal] = useState(false)
  const [showEditarModal, setShowEditarModal] = useState(false)
  const [selectedUsuario, setSelectedUsuario] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const { user: currentUser, updateUser } = useAuth()

  // Estados de filtrado y búsqueda
  const [rolFilter, setRolFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [soloActivos, setSoloActivos] = useState(false)

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

  const handleCrearUsuario = async (data, avatarFile) => {
    const nuevoUsuario = await createUsuario(data)
    let usuarioFinal = nuevoUsuario

    if (avatarFile) {
      try {
        const uploadRes = await subirAvatarUsuario(nuevoUsuario.id, avatarFile)
        usuarioFinal = uploadRes.usuario || { ...nuevoUsuario, avatar_url: uploadRes.avatar_url }
      } catch (uploadErr) {
        toast.error('El usuario fue creado, pero ocurrió un error al subir la foto de perfil')
      }
    }

    setUsuarios((prev) => [...prev, usuarioFinal])
    toast.success(`Usuario ${usuarioFinal.nombre} ${usuarioFinal.apellido} creado exitosamente`)
  }

  const handleEditarUsuario = async (id, data, avatarOptions = {}) => {
    const usuarioActualizado = await updateUsuario(id, data)
    let usuarioFinal = usuarioActualizado

    if (avatarOptions.avatarFile) {
      try {
        const uploadRes = await subirAvatarUsuario(id, avatarOptions.avatarFile)
        usuarioFinal = uploadRes.usuario || { ...usuarioActualizado, avatar_url: uploadRes.avatar_url }
      } catch (uploadErr) {
        toast.error('Datos actualizados, pero ocurrió un error al subir la foto de perfil')
      }
    } else if (avatarOptions.eliminarAvatar) {
      try {
        const deleteRes = await eliminarAvatarUsuario(id)
        usuarioFinal = deleteRes.usuario || { ...usuarioActualizado, avatar_url: null }
      } catch (delErr) {
        toast.error('Datos actualizados, pero no se pudo eliminar la foto de perfil')
      }
    }

    setUsuarios((prev) => prev.map((u) => (u.id === id ? usuarioFinal : u)))

    if ((currentUser?.id === id || currentUser?.user_id === id) && updateUser) {
      updateUser({
        avatar_url: usuarioFinal.avatar_url,
        nombre: usuarioFinal.nombre,
        apellido: usuarioFinal.apellido,
      })
    }

    toast.success(`Usuario ${usuarioFinal.nombre} ${usuarioFinal.apellido} actualizado exitosamente`)
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
      case 'Coordinador de Convivencia Escolar':
        return 'from-teal-500 to-emerald-600'
      case 'Orientador':
        return 'from-sky-500 to-blue-600'
      case 'Psicólogo':
        return 'from-violet-500 to-purple-600'
      case 'Asistente Social':
        return 'from-emerald-500 to-teal-600'
      case 'Directiva':
      case 'Directivo':
        return 'from-indigo-500 to-slate-700'
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
      case 'Coordinador de Convivencia Escolar':
        return 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white'
      case 'Orientador':
        return 'bg-gradient-to-r from-sky-500 to-blue-600 text-white'
      case 'Psicólogo':
        return 'bg-gradient-to-r from-violet-500 to-purple-600 text-white'
      case 'Asistente Social':
        return 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
      case 'Directiva':
      case 'Directivo':
        return 'bg-gradient-to-r from-indigo-500 to-slate-700 text-white'
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
      'Equipo de Formación': usuarios.filter(u => [
        'Equipo de Formación',
        'Coordinador de Convivencia Escolar',
        'Orientador',
        'Psicólogo',
        'Asistente Social'
      ].includes(u.rol)).length,
      'Inspector': usuarios.filter(u => u.rol === 'Inspector').length,
      'Docente': usuarios.filter(u => u.rol === 'Docente').length,
    }
  }

  // Conteo individual por rol exacto
  const conteosPorRol = useMemo(() => {
    const counts = {}
    usuarios.forEach((u) => {
      counts[u.rol] = (counts[u.rol] || 0) + 1
    })
    return counts
  }, [usuarios])

  // Lista ordenada y filtrada de usuarios
  const usuariosProcesados = useMemo(() => {
    return usuarios
      .filter((u) => {
        // Filtro por rol / categoría
        if (rolFilter !== 'ALL') {
          if (rolFilter === 'CONVIVENCIA') {
            const esConvivencia = [
              'Coordinador de Convivencia Escolar',
              'Orientador',
              'Psicólogo',
              'Asistente Social',
              'Equipo de Formación',
            ].includes(u.rol)
            if (!esConvivencia) return false
          } else if (rolFilter === 'Directiva') {
            if (u.rol !== 'Directiva' && u.rol !== 'Directivo') return false
          } else if (u.rol !== rolFilter) {
            return false
          }
        }

        // Filtro solo activos
        if (soloActivos && !u.activo) return false

        // Búsqueda por texto (nombre, apellido, email, rol)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim()
          const nombreCompleto = `${u.nombre || ''} ${u.apellido || ''}`.toLowerCase()
          const email = (u.email || '').toLowerCase()
          const rol = (u.rol || '').toLowerCase()
          if (!nombreCompleto.includes(q) && !email.includes(q) && !rol.includes(q)) {
            return false
          }
        }

        return true
      })
      .sort((a, b) => {
        // 1. Jerarquía institucional de rol
        const pesoA = JERARQUIA_ROLES[a.rol] || 99
        const pesoB = JERARQUIA_ROLES[b.rol] || 99
        if (pesoA !== pesoB) {
          return pesoA - pesoB
        }
        // 2. Apellido alfabético
        const apeA = (a.apellido || '').toLowerCase()
        const apeB = (b.apellido || '').toLowerCase()
        if (apeA !== apeB) {
          return apeA.localeCompare(apeB)
        }
        // 3. Nombre alfabético
        return (a.nombre || '').toLowerCase().localeCompare((b.nombre || '').toLowerCase())
      })
  }, [usuarios, rolFilter, soloActivos, searchQuery])

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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <button
              type="button"
              onClick={() => { setRolFilter('ALL'); setSoloActivos(false); }}
              className={`text-left bg-white rounded-xl border p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 ${
                rolFilter === 'ALL' && !soloActivos ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Total Usuarios</p>
                  <h3 className="text-3xl font-bold text-gray-900">{stats.total}</h3>
                </div>
                <div className="p-3 rounded-xl shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSoloActivos(!soloActivos)}
              className={`text-left bg-white rounded-xl border p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 ${
                soloActivos ? 'ring-2 ring-emerald-500 border-emerald-500' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Usuarios Activos</p>
                  <h3 className="text-3xl font-bold text-gray-900">{stats.activos}</h3>
                </div>
                <div className="p-3 rounded-xl shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                  <Activity className="w-6 h-6" />
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRolFilter(rolFilter === 'Administrador' ? 'ALL' : 'Administrador')}
              className={`text-left bg-white rounded-xl border p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 ${
                rolFilter === 'Administrador' ? 'ring-2 ring-purple-500 border-purple-500' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Administradores</p>
                  <h3 className="text-3xl font-bold text-gray-900">{stats.porRol['Administrador']}</h3>
                </div>
                <div className="p-3 rounded-xl shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                  <Shield className="w-6 h-6" />
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRolFilter(rolFilter === 'CONVIVENCIA' ? 'ALL' : 'CONVIVENCIA')}
              className={`text-left bg-white rounded-xl border p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 ${
                rolFilter === 'CONVIVENCIA' ? 'ring-2 ring-cyan-500 border-cyan-500' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Convivencia Escolar</p>
                  <h3 className="text-3xl font-bold text-gray-900">{stats.porRol['Equipo de Formación']}</h3>
                </div>
                <div className="p-3 rounded-xl shadow-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                  <UserCheck className="w-6 h-6" />
                </div>
              </div>
            </button>
          </div>

          {/* BARRA DE CONTROLES: BÚSQUEDA Y FILTRADO POR ROLES */}
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Buscador de texto */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, apellido, email o rol..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-9 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    title="Limpiar búsqueda"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Selector desplegable de rol */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500 shrink-0" />
                <select
                  value={rolFilter}
                  onChange={(e) => setRolFilter(e.target.value)}
                  className="rounded-xl border border-gray-300 py-2.5 pl-3 pr-8 text-sm font-medium text-gray-700 bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">Todos los roles ({usuarios.length})</option>
                  <optgroup label="Grupos Funcionales">
                    <option value="CONVIVENCIA">
                      Equipo de Convivencia Escolar ({stats.porRol['Equipo de Formación']})
                    </option>
                  </optgroup>
                  <optgroup label="Roles Institucionales">
                    <option value="Docente">Docente ({conteosPorRol['Docente'] || 0})</option>
                    <option value="Psicólogo">Psicólogo ({conteosPorRol['Psicólogo'] || 0})</option>
                    <option value="Orientador">Orientador ({conteosPorRol['Orientador'] || 0})</option>
                    <option value="Asistente Social">Asistente Social ({conteosPorRol['Asistente Social'] || 0})</option>
                    <option value="Coordinador de Convivencia Escolar">Coordinador de Convivencia ({conteosPorRol['Coordinador de Convivencia Escolar'] || 0})</option>
                    <option value="Directiva">Directiva ({ (conteosPorRol['Directiva'] || 0) + (conteosPorRol['Directivo'] || 0) })</option>
                    <option value="Inspector">Inspector ({conteosPorRol['Inspector'] || 0})</option>
                    <option value="Administrador">Administrador ({conteosPorRol['Administrador'] || 0})</option>
                  </optgroup>
                </select>
              </div>

              {/* Toggle Solo activos */}
              <button
                type="button"
                onClick={() => setSoloActivos(!soloActivos)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all border ${
                  soloActivos
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                <span>Solo Activos</span>
              </button>
            </div>

            {/* Chips de filtro rápido por rol */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
              <span className="text-gray-400 font-medium mr-1 text-[11px] uppercase tracking-wider shrink-0 flex items-center gap-1">
                <ArrowUpDown className="h-3 w-3" />
                Roles:
              </span>
              {[
                { id: 'ALL', label: 'Todos', count: usuarios.length },
                { id: 'Docente', label: 'Docentes', count: conteosPorRol['Docente'] || 0 },
                { id: 'Psicólogo', label: 'Psicólogos', count: conteosPorRol['Psicólogo'] || 0 },
                { id: 'Orientador', label: 'Orientadores', count: conteosPorRol['Orientador'] || 0 },
                { id: 'Asistente Social', label: 'Asistentes Sociales', count: conteosPorRol['Asistente Social'] || 0 },
                { id: 'Coordinador de Convivencia Escolar', label: 'Coord. Convivencia', count: conteosPorRol['Coordinador de Convivencia Escolar'] || 0 },
                { id: 'CONVIVENCIA', label: 'Toda Convivencia', count: stats.porRol['Equipo de Formación'] },
                { id: 'Inspector', label: 'Inspectores', count: conteosPorRol['Inspector'] || 0 },
                { id: 'Directiva', label: 'Directiva', count: (conteosPorRol['Directiva'] || 0) + (conteosPorRol['Directivo'] || 0) },
                { id: 'Administrador', label: 'Administradores', count: conteosPorRol['Administrador'] || 0 },
              ].map((chip) => {
                const activo = rolFilter === chip.id
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setRolFilter(chip.id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium whitespace-nowrap transition-colors shrink-0 ${
                      activo
                        ? 'bg-blue-600 text-white shadow-xs font-semibold'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <span>{chip.label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                        activo ? 'bg-white/20 text-white' : 'bg-white text-gray-700 shadow-2xs'
                      }`}
                    >
                      {chip.count}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Barra de estado del filtrado */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                <span>
                  Mostrando <strong className="text-gray-900 font-bold">{usuariosProcesados.length}</strong> de {usuarios.length} usuarios (ordenados jerárquicamente por rol)
                </span>
              </span>

              {(rolFilter !== 'ALL' || searchQuery || soloActivos) && (
                <button
                  type="button"
                  onClick={() => {
                    setRolFilter('ALL')
                    setSearchQuery('')
                    setSoloActivos(false)
                  }}
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>

          {usuariosProcesados.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center shadow-xs">
              <Users className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-3 text-base font-bold text-gray-900">No se encontraron usuarios</h3>
              <p className="mt-1 text-sm text-gray-500">
                Ningún usuario coincide con los criterios de búsqueda o filtro de rol seleccionado.
              </p>
              <button
                type="button"
                onClick={() => {
                  setRolFilter('ALL')
                  setSearchQuery('')
                  setSoloActivos(false)
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <X className="h-4 w-4" />
                Restablecer Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {usuariosProcesados.map((usuario) => (
              <div
                key={usuario.id}
                className="bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                <div className={`h-24 bg-gradient-to-br ${getRolGradient(usuario.rol)} relative`}>
                  <div className="absolute -bottom-12 left-6">
                    <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${getRolGradient(usuario.rol)} shadow-xl flex items-center justify-center border-4 border-white overflow-hidden bg-white`}>
                      {usuario.avatar_url ? (
                        <img
                          src={usuario.avatar_url}
                          alt={`${usuario.nombre} ${usuario.apellido}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            const fallback = e.currentTarget.parentElement?.querySelector('.avatar-fallback-initials')
                            if (fallback) fallback.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      <span
                        className={`avatar-fallback-initials text-3xl font-bold text-white w-full h-full flex items-center justify-center bg-gradient-to-br ${getRolGradient(usuario.rol)} ${
                          usuario.avatar_url ? 'hidden' : ''
                        }`}
                      >
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
        )}
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
