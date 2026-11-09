import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function BarrasCursoChart({ data = [], loading = false }) {
  if (loading) {
    return <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 h-80 animate-pulse border border-gray-100 dark:border-gray-700"></div>
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-center h-80">
        <p className="text-gray-400 dark:text-gray-500 text-sm">Sin datos de incidentes por curso</p>
      </div>
    )
  }

  const chartData = data.map((item) => ({
    curso: item.curso || 'Sin curso',
    total: item.total || 0,
  }))

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">
        Frecuencia de Incidentes por Curso
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="curso" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
          />
          <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
