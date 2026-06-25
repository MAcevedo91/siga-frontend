import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/store/useAuthStore'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts'
import {
  AlertTriangle,
  ShieldAlert,
  Users,
  UserCheck,
  TrendingUp,
  Calendar,
  FileText
} from 'lucide-react'
import {
  getDashboardResumen,
  getIncidentesPorCurso,
  getIncidentesPorGravedad,
  getTendenciaMensual
} from '@/services/dashboardService'

const KpiCard = ({ title, value, trend, icon: Icon, trendUp, colorClasses }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
    <div className="flex justify-between items-start mb-4">
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl shadow-lg ${colorClasses}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
    {trend && (
      <div className="pt-3 border-t border-gray-100 flex items-center gap-1.5">
        <span className={`text-sm font-bold flex items-center ${trendUp ? 'text-red-600' : 'text-emerald-600'}`}>
          <TrendingUp className={`w-4 h-4 mr-1 ${!trendUp && 'rotate-180'}`} />
          {trend}
        </span>
        <span className="text-sm text-gray-500">vs mes anterior</span>
      </div>
    )}
  </div>
)

const CURSO_COLORS = [
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
]

const GRAVEDAD_CONFIG = {
  'Leve': { color: '#10b981', label: 'Leve' },
  'Grave': { color: '#f59e0b', label: 'Grave' },
  'Gravísima': { color: '#ef4444', label: 'Gravísima' }
}

const GraficoBarrasCurso = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-md flex items-center justify-center h-full">
        <p className="text-gray-400 text-sm">Sin datos de incidentes por curso</p>
      </div>
    )
  }

  const chartData = data.map(item => ({
    curso: item.curso || 'Sin curso',
    total: item.total || 0
  }))

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-md h-full hover:shadow-xl transition-shadow">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Frecuencia de Incidentes por Curso</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="curso" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
          />
          <Bar dataKey="total" fill="#3b82f6" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

const GraficoTortaGravedad = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-md flex items-center justify-center h-full">
        <p className="text-gray-400 text-sm">Sin datos de distribución por gravedad</p>
      </div>
    )
  }

  const chartData = data.map(item => ({
    name: item.gravedad,
    value: item.cantidad,
    porcentaje: item.porcentaje
  }))

  const COLORS_ARRAY = chartData.map(item => GRAVEDAD_CONFIG[item.name]?.color || '#94a3b8')

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-md h-full hover:shadow-xl transition-shadow">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Distribución por Gravedad</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ porcentaje }) => `${porcentaje}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS_ARRAY[index]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            formatter={(value, name) => [`${value} casos`, name]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => GRAVEDAD_CONFIG[value]?.label || value}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

const GraficoTendenciaMensual = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-md flex items-center justify-center h-full">
        <p className="text-gray-400 text-sm">Sin datos de tendencia mensual</p>
      </div>
    )
  }

  const chartData = data.map(item => ({
    mes: item.mes,
    incidentes: item.total || 0
  }))

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-md h-full hover:shadow-xl transition-shadow">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Tendencia Mensual de Incidentes</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            cursor={{ stroke: 'rgba(59, 130, 246, 0.3)' }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="incidentes"
            stroke="#8b5cf6"
            strokeWidth={3}
            dot={{ fill: '#8b5cf6', r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

const AccionesRapidas = () => {
  const navigate = useNavigate()

  return (
    <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl shadow-xl p-6 text-white flex flex-col justify-center relative overflow-hidden h-full">
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>

      <div className="relative z-10">
        <h3 className="text-2xl font-bold mb-2">Acciones Rápidas</h3>
        <p className="text-purple-100 text-sm mb-6">
          Registra una intervención o activa un protocolo inmediatamente desde tu dispositivo.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/incidentes/nuevo')}
            className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 transition-all py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold hover:scale-105 transform shadow-lg"
          >
            <AlertTriangle className="w-5 h-5" />
            Registrar Incidente
          </button>
          <button
            onClick={() => navigate('/protocolos/nuevo')}
            className="w-full bg-white text-purple-700 hover:bg-purple-50 transition-all py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg hover:scale-105 transform"
          >
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            Activar Protocolo RICE
          </button>
        </div>
      </div>
    </div>
  )
}

const EstadoVacio = () => (
  <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay datos disponibles</h3>
    <p className="text-sm text-gray-500 mb-6">
      Aún no se han registrado incidentes en el sistema. Comienza registrando el primer incidente para ver las estadísticas.
    </p>
    <button
      onClick={() => window.location.href = '/incidentes/nuevo'}
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      <AlertTriangle className="w-4 h-4" />
      Registrar Primer Incidente
    </button>
  </div>
)

export default function DashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [resumen, setResumen] = useState(null)
  const [porCurso, setPorCurso] = useState([])
  const [porGravedad, setPorGravedad] = useState([])
  const [tendencia, setTendencia] = useState([])

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true)
        const [resumenData, cursoData, gravedadData, tendenciaData] = await Promise.all([
          getDashboardResumen(),
          getIncidentesPorCurso(),
          getIncidentesPorGravedad(),
          getTendenciaMensual()
        ])
        setResumen(resumenData)
        setPorCurso(cursoData)
        setPorGravedad(gravedadData)
        setTendencia(tendenciaData)
      } catch (err) {
        console.error('Error cargando dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const sinDatos = !resumen || resumen.total_incidentes === 0

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Panel de Convivencia Escolar</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Visión general institucional • Escuela Coeducacional N°1
          </p>
        </div>

        {sinDatos ? (
          <EstadoVacio />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
              <KpiCard
                title="Incidentes Totales"
                value={resumen.total_incidentes}
                trend=""
                trendUp={true}
                icon={AlertTriangle}
                colorClasses="bg-gradient-to-br from-orange-400 to-amber-500 text-white"
              />
              <KpiCard
                title="Incidentes Graves"
                value={resumen.total_graves}
                trend=""
                trendUp={true}
                icon={ShieldAlert}
                colorClasses="bg-gradient-to-br from-rose-500 to-purple-600 text-white"
              />
              <KpiCard
                title="Protocolos RICE Activos"
                value={resumen.protocolos_activos}
                trend=""
                trendUp={false}
                icon={Users}
                colorClasses="bg-gradient-to-br from-cyan-500 to-blue-600 text-white"
              />
              <KpiCard
                title="Estudiantes en Seguimiento"
                value={resumen.estudiantes_con_incidentes}
                trend=""
                trendUp={false}
                icon={UserCheck}
                colorClasses="bg-gradient-to-br from-teal-500 to-emerald-600 text-white"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
              <div className="lg:col-span-2">
                <GraficoBarrasCurso data={porCurso} />
              </div>
              <div className="lg:col-span-1">
                <GraficoTortaGravedad data={porGravedad} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
              <GraficoTendenciaMensual data={tendencia} />
              <AccionesRapidas />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
