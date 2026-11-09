import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { School } from 'lucide-react'

export default function BarrasCursoChart({ data = [], loading = false }) {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-sky-50/40 via-blue-50/20 to-white dark:from-slate-900 dark:via-slate-900 dark:to-gray-800 rounded-3xl shadow-2xs p-6 h-full animate-pulse border border-sky-200/70 dark:border-sky-900/40" />
    )
  }

  const chartData = (data && data.length > 0)
    ? data.map((item) => ({
        curso: item.curso || 'Sin curso',
        total: item.total || 0,
      }))
    : []

  if (chartData.length === 0) {
    return (
      <div className="bg-gradient-to-br from-sky-50/60 via-blue-50/30 to-white dark:from-slate-900 dark:via-slate-900 dark:to-gray-800 p-6 rounded-3xl border border-sky-200/80 dark:border-sky-900/50 shadow-2xs h-full flex flex-col justify-between">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Frecuencia por Aula
        </h2>
        <div className="h-64 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 text-xs text-center">
          <School className="w-8 h-8 opacity-40 mb-2 text-sky-500" />
          <p>Sin incidentes registrados por curso en este periodo.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-sky-50/60 via-blue-50/30 to-white dark:from-slate-900 dark:via-slate-900 dark:to-gray-800 p-6 rounded-3xl border border-sky-200/80 dark:border-sky-900/50 shadow-2xs h-full flex flex-col justify-between">
      {/* TÍTULO LIMPIO (SIN SUBTÍTULO VERBOSO) */}
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        Frecuencia por Aula
      </h2>

      <div id="chart-curso" className="w-full flex-1 min-h-[260px]">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" className="dark:stroke-gray-700/60" />
            <XAxis dataKey="curso" tick={{ fontSize: 11, fill: '#0284c7' }} stroke="#bae6fd" />
            <YAxis tick={{ fontSize: 11, fill: '#0284c7' }} stroke="#bae6fd" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                color: '#fff',
                fontSize: '12px',
              }}
              cursor={{ fill: 'rgba(14, 165, 233, 0.08)' }}
            />
            <Bar dataKey="total" fill="#0284c7" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
