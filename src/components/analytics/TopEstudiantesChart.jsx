import { useNavigate } from 'react-router-dom'
import { Users, ChevronRight, ExternalLink } from 'lucide-react'

const AVATAR_COLORS = [
  'bg-purple-200 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300',
  'bg-indigo-200 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300',
  'bg-blue-200 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300',
  'bg-teal-200 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300',
  'bg-amber-200 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300',
]

function getInitials(nombre = '', apellido = '') {
  const n = (nombre || '').trim()[0] || ''
  const a = (apellido || '').trim()[0] || ''
  return (n + a).toUpperCase() || 'E'
}

function getNivelAlerta(cantidad = 0) {
  if (cantidad >= 5) {
    return {
      label: 'Alto Riesgo',
      badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300/80 dark:border-rose-900/60',
    }
  }
  if (cantidad >= 3) {
    return {
      label: 'Seguimiento',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/80 dark:border-amber-900/60',
    }
  }
  return {
    label: 'Atención',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300/80 dark:border-blue-900/60',
  }
}

export default function TopEstudiantesChart({ data = [], loading = false }) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-50/40 via-indigo-50/20 to-white dark:from-slate-900 dark:via-slate-900 dark:to-gray-800 rounded-3xl p-6 shadow-2xs border border-purple-200/70 dark:border-purple-900/40 animate-pulse h-full flex flex-col justify-between">
        <div className="h-5 bg-purple-100 dark:bg-gray-700 rounded w-1/4 mb-4" />
        <div className="space-y-3 flex-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-purple-50/50 dark:bg-gray-700/40 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const estudiantes = Array.isArray(data) ? data : []

  if (estudiantes.length === 0) {
    return (
      <div className="bg-gradient-to-br from-purple-50/50 via-indigo-50/25 to-white dark:from-slate-900 dark:via-slate-900 dark:to-gray-800 p-6 rounded-3xl border border-purple-200/80 dark:border-purple-900/50 shadow-2xs h-full flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Focalización Prioritaria
          </h2>
        </div>
        <div className="h-64 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 text-xs text-center">
          <Users className="w-8 h-8 opacity-40 mb-2 text-purple-500" />
          <p>No se registran estudiantes con reiteración de incidentes en este periodo.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-purple-50/50 via-indigo-50/25 to-white dark:from-slate-900 dark:via-slate-900 dark:to-gray-800 p-6 rounded-3xl border border-purple-200/80 dark:border-purple-900/50 shadow-2xs h-full flex flex-col justify-between">
      {/* CABECERA LIMPIA: TÍTULO DIRECTO */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Focalización Prioritaria
        </h2>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100/90 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800">
          {estudiantes.length} {estudiantes.length === 1 ? 'estudiante focalizado' : 'estudiantes focalizados'}
        </span>
      </div>

      {/* TABLA EJECUTIVA ESTILO TOP STORE (MAQUETA DE REFERENCIA) */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-purple-100 dark:border-purple-900/40 text-purple-900/70 dark:text-purple-300/80 uppercase tracking-wider text-[11px]">
              <th className="py-2.5 px-3 font-semibold">Estudiante</th>
              <th className="py-2.5 px-3 font-semibold">Curso</th>
              <th className="py-2.5 px-3 font-semibold text-center">Incidentes</th>
              <th className="py-2.5 px-3 font-semibold">Nivel de Riesgo</th>
              <th className="py-2.5 px-3 font-semibold text-right">Ficha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-100/60 dark:divide-purple-900/30">
            {estudiantes.map((est, idx) => {
              const studentId = est.estudiante_id || est.id
              const count = est.cantidad_incidentes || 0
              const alerta = getNivelAlerta(count)
              const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length]

              return (
                <tr
                  key={studentId || idx}
                  onClick={() => studentId && navigate(`/estudiantes/${studentId}`)}
                  className="hover:bg-purple-100/40 dark:hover:bg-purple-950/40 transition-colors cursor-pointer group"
                >
                  {/* ESTUDIANTE (AVATAR + NOMBRE) */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${avatarColor}`}
                      >
                        {getInitials(est.nombre, est.apellido)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">
                          {est.nombre} {est.apellido}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* CURSO */}
                  <td className="py-3 px-3 text-gray-700 dark:text-gray-300 font-medium">
                    {est.curso_nombre || 'Sin curso'}
                  </td>

                  {/* INCIDENTES REGISTRADOS */}
                  <td className="py-3 px-3 text-center">
                    <span className="font-bold text-gray-900 dark:text-white text-sm">
                      {count}
                    </span>
                  </td>

                  {/* NIVEL DE RIESGO */}
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${alerta.badge}`}
                    >
                      {alerta.label}
                    </span>
                  </td>

                  {/* ACCIÓN: FICHA */}
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (studentId) navigate(`/estudiantes/${studentId}`)
                      }}
                      className="p-1 rounded-lg text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors"
                      title="Ver ficha del estudiante"
                    >
                      <ExternalLink className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
