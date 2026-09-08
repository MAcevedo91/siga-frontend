import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useNavigate } from 'react-router-dom'

export default function TopEstudiantesChart({ data = [], loading }) {
  const navigate = useNavigate()

  if (loading) {
    return <div className="bg-white rounded-lg shadow p-6 h-96 animate-pulse"></div>
  }

  const chartData = (data || []).map((est) => ({
    nombre: `${est.nombre} ${est.apellido}`,
    cantidad: est.cantidad_incidentes,
    id: est.estudiante_id || est.id,
  }))

  const handleBarClick = (entry) => {
    const studentId = entry?.id || entry?.payload?.id
    if (studentId) {
      navigate(`/estudiantes/${studentId}`)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Top 5 Estudiantes con más Incidentes</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="nombre" type="category" width={150} />
          <Tooltip />
          <Bar
            dataKey="cantidad"
            fill="#3b82f6"
            onClick={handleBarClick}
            style={{ cursor: 'pointer' }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
