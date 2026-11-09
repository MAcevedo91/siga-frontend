import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export default function TendenciaChart({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-indigo-50/40 via-slate-50/20 to-white dark:from-slate-900 dark:via-slate-900 dark:to-gray-800 rounded-3xl p-6 shadow-2xs border border-indigo-200/70 dark:border-indigo-900/40 animate-pulse h-full">
        <div className="h-5 bg-indigo-100 dark:bg-gray-700 rounded w-1/4 mb-6" />
        <div className="h-72 bg-indigo-50/50 dark:bg-gray-700/40 rounded-2xl" />
      </div>
    )
  }

  const chartData = (data || []).map((item) => ({
    ...item,
    Gravísima: item.Gravísima ?? item.Gravísimo ?? 0,
  }))

  return (
    <div className="bg-gradient-to-br from-indigo-50/60 via-slate-50/30 to-white dark:from-slate-900 dark:via-slate-900 dark:to-gray-800 rounded-3xl p-6 shadow-2xs border border-indigo-200/80 dark:border-indigo-900/50 h-full flex flex-col justify-between">
      {/* TÍTULO LIMPIO (SIN SUBTÍTULO VERBOSO) */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Tendencia Temporal
        </h2>
        <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
          Últimos 12 meses
        </span>
      </div>

      <div id="chart-tendencia" className="w-full flex-1 min-h-[280px]">
        <ResponsiveContainer width="100%" height={290}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" className="dark:stroke-gray-700/60" />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#6366f1' }} stroke="#c7d2fe" />
            <YAxis tick={{ fontSize: 11, fill: '#6366f1' }} stroke="#c7d2fe" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                color: '#fff',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Line
              type="monotone"
              dataKey="Leve"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#10b981' }}
              name="Leve"
            />
            <Line
              type="monotone"
              dataKey="Grave"
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#f59e0b' }}
              name="Grave"
            />
            <Line
              type="monotone"
              dataKey="Gravísima"
              stroke="#ef4444"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#ef4444' }}
              name="Gravísima"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
