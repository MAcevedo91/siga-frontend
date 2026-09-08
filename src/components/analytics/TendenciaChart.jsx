import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function TendenciaChart({ data, loading }) {
  if (loading) {
    return <div className="bg-white rounded-lg shadow p-6 h-96 animate-pulse"></div>
  }

  const chartData = (data || []).map((item) => ({
    ...item,
    Gravísima: item.Gravísima ?? item.Gravísimo ?? 0,
  }))

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Tendencia de Incidentes (Últimos 12 meses)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mes" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="Leve" stroke="#10b981" strokeWidth={2} />
          <Line type="monotone" dataKey="Grave" stroke="#f59e0b" strokeWidth={2} />
          <Line type="monotone" dataKey="Gravísima" stroke="#ef4444" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
