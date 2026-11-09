import { useState, useMemo } from 'react'
import {
  Users,
  Search,
  FileText,
  Calendar,
  CheckCircle2,
  XCircle,
  Filter,
  BarChart3
} from 'lucide-react'

const ROLE_BADGES = {
  Administrador: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  Directivo: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  Inspector: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  'Equipo de Formación': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  Docente: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
}

const AVATAR_COLORS = [
  'bg-blue-500 text-white',
  'bg-purple-500 text-white',
  'bg-emerald-500 text-white',
  'bg-amber-500 text-white',
  'bg-indigo-500 text-white',
  'bg-teal-500 text-white',
  'bg-rose-500 text-white',
]

function getInitials(nombre = '', apellido = '') {
  const n = (nombre || '').trim()[0] || ''
  const a = (apellido || '').trim()[0] || ''
  return (n + a).toUpperCase() || 'U'
}

function getAvatarColor(str = '') {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

function formatDate(dateStr) {
  if (!dateStr) return 'Sin registros aún'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return 'Sin registros aún'
    return d.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return 'Sin registros aún'
  }
}

export default function TablaUsuariosActividad({
  usuariosData = { usuarios: [], totalIncidentesRegistrados: 0 },
  loading = false,
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('TODOS')

  const { usuarios = [], totalIncidentesRegistrados = 0 } = usuariosData || {}

  // Extraer roles únicos disponibles
  const availableRoles = useMemo(() => {
    const rolesSet = new Set((usuarios || []).map((u) => u.rol).filter(Boolean))
    return ['TODOS', ...Array.from(rolesSet)]
  }, [usuarios])

  // Filtrar usuarios según búsqueda y rol
  const filteredUsers = useMemo(() => {
    return (usuarios || []).filter((u) => {
      const matchRole = selectedRole === 'TODOS' || u.rol === selectedRole
      const query = searchTerm.toLowerCase().trim()
      if (!query) return matchRole

      const fullName = `${u.nombre || ''} ${u.apellido || ''}`.toLowerCase()
      const email = (u.email || '').toLowerCase()
      const rol = (u.rol || '').toLowerCase()

      return matchRole && (fullName.includes(query) || email.includes(query) || rol.includes(query))
    })
  }, [usuarios, searchTerm, selectedRole])

  // Calcular usuario con más registros
  const maxRegistros = useMemo(() => {
    if (!usuarios || usuarios.length === 0) return 1
    return Math.max(...usuarios.map((u) => u.totalIncidentes || 0), 1)
  }, [usuarios])

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700" />
            <div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-64" />
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-gray-100 dark:bg-gray-700/50 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      {/* CABECERA DEL RECUADRO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Registro de Incidentes por Usuario
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {usuarios.length} {usuarios.length === 1 ? 'Usuario' : 'Usuarios'}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Trazabilidad institucional y volumen de incidentes reportados por cada funcionario.
            </p>
          </div>
        </div>

        {/* CONTADORES RÁPIDOS */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700 flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-xs text-gray-600 dark:text-gray-300">
              Total reportados:{' '}
              <strong className="text-gray-900 dark:text-white font-bold">
                {totalIncidentesRegistrados}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* CONTROLES: BÚSQUEDA Y FILTRO DE ROL */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, correo o rol..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs sm:text-sm bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
          >
            {availableRoles.map((role) => (
              <option key={role} value={role}>
                {role === 'TODOS' ? 'Todos los roles' : role}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLA RESPONSIVA */}
      <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-gray-50 dark:bg-gray-750/70 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
            <tr>
              <th className="py-3 px-4 font-semibold">Funcionario</th>
              <th className="py-3 px-4 font-semibold">Rol Asignado</th>
              <th className="py-3 px-4 font-semibold text-center">Estado</th>
              <th className="py-3 px-4 font-semibold text-right">Incidentes Registrados</th>
              <th className="py-3 px-4 font-semibold text-right">Último Reporte</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400 dark:text-gray-500">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No se encontraron usuarios registrados que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const total = u.totalIncidentes || 0
                const percentRelative = maxRegistros > 0 ? (total / maxRegistros) * 100 : 0
                const percentOfTotal = u.porcentajeDelTotal || 0
                const roleBadgeClass =
                  ROLE_BADGES[u.rol] ||
                  'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-gray-200'
                const avatarColor = getAvatarColor(u.email || u.nombreCompleto)

                return (
                  <tr
                    key={u.id}
                    className="hover:bg-gray-50/70 dark:hover:bg-gray-750/40 transition-colors"
                  >
                    {/* NOMBRE Y AVATAR */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${avatarColor}`}
                        >
                          {getInitials(u.nombre, u.apellido)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">
                            {u.nombreCompleto}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* ROL INSTITUCIONAL */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleBadgeClass}`}
                      >
                        {u.rol}
                      </span>
                    </td>

                    {/* ESTADO ACTIVO */}
                    <td className="py-3 px-4 text-center">
                      {u.activo ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-rose-500 font-medium">
                          <XCircle className="w-3.5 h-3.5" />
                          Inactivo
                        </span>
                      )}
                    </td>

                    {/* TOTAL INCIDENTES REGISTRADOS + BARRA RELATIVA */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {total}
                          </span>
                          <span className="text-[11px] text-gray-400 dark:text-gray-500">
                            ({percentOfTotal}%)
                          </span>
                        </div>
                        {/* Barra de progreso relativo */}
                        <div className="w-24 sm:w-28 bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(Math.max(percentRelative, total > 0 ? 8 : 0), 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* FECHA ÚLTIMO REPORTE */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{formatDate(u.ultimoRegistro)}</span>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PIE CON NOTA DE RESGUARDO INSTITUCIONAL */}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-400 dark:text-gray-500 gap-2">
        <p>
          Mostrando <strong>{filteredUsers.length}</strong> de <strong>{usuarios.length}</strong> usuarios institucionales registrados.
        </p>
        <p className="italic">
          Datos de auditoría protegidos bajo la Ley N° 19.628 sobre protección de datos.
        </p>
      </div>
    </div>
  )
}
