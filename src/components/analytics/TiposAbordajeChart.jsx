import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Sparkles } from 'lucide-react'

const PALETTE = [
  '#059669', // Emerald
  '#0d9488', // Teal
  '#2563eb', // Blue
  '#7c3aed', // Purple
  '#d97706', // Amber
  '#db2777', // Pink
  '#4f46e5', // Indigo
]

export default function TiposAbordajeChart({ data = [], loading = false }) {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-emerald-50/40 via-teal-50/20 to-white dark:from-slate-900 dark:via-slate-900 dark:to-gray-800 rounded-3xl p-6 shadow-2xs border border-emerald-200/70 dark:border-emerald-900/40 animate-pulse h-full">
        <div className="h-5 bg-emerald-100 dark:bg-gray-700 rounded w-1/3 mb-4" />
        <div className="h-64 bg-emerald-50/50 dark:bg-gray-700/40 rounded-2xl" />
      </div>
    )
  }

  const chartData = data && data.length > 0 ? data : []

  if (chartData.length === 0) {
    return (
      <div className="bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-white dark:from-slate-900 dark:via-slate-900 dark:to-gray-800 rounded-3xl p-6 shadow-2xs border border-emerald-200/80 dark:border-emerald-900/50 h-full flex flex-col justify-between">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Abordajes y Protocolos
        </h2>
        <div className="h-64 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 text-xs text-center">
          <Sparkles className="w-8 h-8 opacity-40 mb-2 text-emerald-500" />
          <p>Sin registros de abordajes formativos en este periodo.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-white dark:from-slate-900 dark:via-slate-900 dark:to-gray-800 rounded-3xl p-6 shadow-2xs border border-emerald-200/80 dark:border-emerald-900/50 h-full flex flex-col justify-between">
      {/* TÍTULO LIMPIO (SIN SUBTÍTULO VERBOSO) */}
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        Abordajes y Protocolos
      </h2>

      <div id="chart-abordaje" className="w-full flex-1 min-h-[260px]">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" className="dark:stroke-gray-700/60" />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#059669' }} stroke="#a7f3d0" />
            <YAxis
              dataKey="nombre"
              type="category"
              width={120}
              tick={{ fontSize: 11, fill: '#047857' }}
              stroke="#a7f3d0"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                color: '#fff',
                fontSize: '12px',
              }}
              formatter={(value) => [`${value} casos`, 'Frecuencia']}
              cursor={{ fill: 'rgba(5, 150, 105, 0.08)' }}
            />
            <Bar dataKey="cantidad" radius={[0, 8, 8, 0]}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
