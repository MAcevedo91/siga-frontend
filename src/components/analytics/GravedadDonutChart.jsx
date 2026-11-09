import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { AlertCircle } from 'lucide-react'

const COLORS = {
  Leve: '#10b981',
  Grave: '#f59e0b',
  Gravísima: '#ef4444',
  Gravísimo: '#ef4444',
}

export default function GravedadDonutChart({ data = [], loading }) {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-rose-50/40 via-amber-50/20 to-white dark:from-slate-900 dark:via-slate-900 dark:to-gray-800 rounded-3xl shadow-2xs p-6 h-full animate-pulse border border-rose-200/70 dark:border-rose-900/40" />
    )
  }

  const chartData = data && data.length > 0 ? data : []

  if (chartData.length === 0) {
    return (
      <div className="bg-gradient-to-br from-rose-50/50 via-amber-50/30 to-white dark:from-slate-900 dark:via-slate-900 dark:to-gray-800 p-6 rounded-3xl border border-rose-200/80 dark:border-rose-900/50 shadow-2xs h-full flex flex-col justify-between">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Distribución por Gravedad
        </h2>
        <div className="h-64 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 text-xs text-center">
          <AlertCircle className="w-8 h-8 opacity-40 mb-2 text-rose-500" />
          <p>Sin incidentes registrados para calcular distribución por gravedad.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-rose-50/50 via-amber-50/30 to-white dark:from-slate-900 dark:via-slate-900 dark:to-gray-800 p-6 rounded-3xl border border-rose-200/80 dark:border-rose-900/50 shadow-2xs h-full flex flex-col justify-between">
      {/* TÍTULO LIMPIO (SIN SUBTÍTULO VERBOSO) */}
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
        Distribución por Gravedad
      </h2>

      <div id="chart-gravedad" className="w-full flex-1 min-h-[260px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="cantidad"
              nameKey="gravedad"
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={3}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.gravedad] || '#94a3b8'}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                color: '#fff',
                fontSize: '12px',
              }}
              formatter={(value, name, props) => [
                `${value} incidentes (${props.payload.porcentaje}%)`,
                props.payload.gravedad,
              ]}
            />
            <Legend
              verticalAlign="bottom"
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              formatter={(value, entry) => (
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {value} ({entry.payload.porcentaje}%)
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
