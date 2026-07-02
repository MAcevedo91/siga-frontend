import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const COLORS = {
  'Leve': '#10b981',
  'Grave': '#f59e0b',
  'Gravísimo': '#ef4444'
}

export default function GravedadDonutChart({ data, loading }) {
  if (loading) {
    return <div className="bg-white rounded-lg shadow p-6 h-96 animate-pulse"></div>
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Distribucion por Gravedad</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="cantidad"
            nameKey="gravedad"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            label={({ gravedad, porcentaje }) => `${gravedad}: ${porcentaje}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.gravedad]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
