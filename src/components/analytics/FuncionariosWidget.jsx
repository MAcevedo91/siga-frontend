import { useState, useMemo } from 'react'
import { Users, ChevronRight, Search, ShieldCheck } from 'lucide-react'

const AVATAR_COLORS = [
  'bg-gradient-to-tr from-indigo-500 to-blue-600 text-white',
  'bg-gradient-to-tr from-purple-500 to-indigo-600 text-white',
  'bg-gradient-to-tr from-teal-500 to-emerald-600 text-white',
  'bg-gradient-to-tr from-amber-500 to-orange-600 text-white',
  'bg-gradient-to-tr from-rose-500 to-pink-600 text-white',
  'bg-gradient-to-tr from-cyan-500 to-blue-500 text-white',
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

export default function FuncionariosWidget({
  usuariosData = { usuarios: [], totalIncidentesRegistrados: 0 },
  loading = false,
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const { usuarios = [] } = usuariosData || {}

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return usuarios
    const q = searchTerm.toLowerCase().trim()
    return usuarios.filter(
      (u) =>
        (u.nombreCompleto || '').toLowerCase().includes(q) ||
        (u.rol || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
    )
  }, [usuarios, searchTerm])

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-100/70 via-blue-50/20 to-white dark:from-slate-900 dark:via-slate-900 dark:to-gray-800 rounded-3xl p-6 shadow-2xs border border-slate-300/70 dark:border-slate-700 animate-pulse h-full flex flex-col justify-between">
        <div className="h-5 bg-slate-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
        <div className="space-y-3 flex-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-gray-700 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-slate-200 dark:bg-gray-700 rounded w-1/2" />
                <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-slate-100/80 via-blue-50/30 to-white dark:from-slate-900 dark:via-slate-900 dark:to-gray-800 rounded-3xl p-6 shadow-2xs border border-slate-300/80 dark:border-slate-700 h-full flex flex-col justify-between">
      {/* CABECERA CON TÍTULO LIMPIO (SIN SUBTÍTULOS VERBOSOS) */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Funcionarios
        </h2>
        <button
          type="button"
          onClick={() => setShowSearch(!showSearch)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-gray-750 transition-colors cursor-pointer"
          title="Buscar funcionario"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* BUSCADOR EXPANDIBLE */}
      {showSearch && (
        <div className="mb-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por nombre o rol..."
            className="w-full px-3 py-1.5 text-xs rounded-xl bg-white/90 dark:bg-gray-750 border border-slate-300 dark:border-gray-750 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-400/30"
            autoFocus
          />
        </div>
      )}

      {/* LISTA DE FUNCIONARIOS ESTILO TEAM MEMBER */}
      <div className="space-y-2 flex-1 overflow-y-auto max-h-[340px] pr-1">
        {filteredUsers.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400 dark:text-gray-500">
            No se encontraron funcionarios registrados
          </div>
        ) : (
          filteredUsers.map((u) => {
            const avatarColor = getAvatarColor(u.email || u.nombreCompleto)
            const count = u.totalIncidentes || 0

            return (
              <div
                key={u.id}
                className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition-all cursor-pointer group"
              >
                {/* AVATAR + NOMBRE Y ROL */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${avatarColor}`}
                  >
                    {getInitials(u.nombre, u.apellido)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">
                      {u.nombreCompleto}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {u.rol}
                    </p>
                  </div>
                </div>

                {/* CONTEO Y FLECHA LATERAL */}
                <div className="flex items-center gap-1.5 shrink-0 pl-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shadow-2xs">
                    {count} {count === 1 ? 'caso' : 'casos'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* PIE DE TARJETA CON ESTADÍSTICA TOTAL */}
      <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          {usuarios.length} registrados
        </span>
        <span className="text-[11px] font-semibold">
          {usuariosData.totalIncidentesRegistrados || 0} incidentes asignados
        </span>
      </div>
    </div>
  )
}
