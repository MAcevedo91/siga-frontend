import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/store/useAuthStore'
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  FileText,
  Settings,
  Bell,
  Search,
  Menu,
  ChevronDown,
  TrendingUp,
  ShieldAlert,
  UserCheck,
  Calendar
} from 'lucide-react'

const Sidebar = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate()
  const currentPath = window.location.pathname

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Directorio Estudiantes', path: '/estudiantes' },
    { icon: AlertTriangle, label: 'Registro Incidentes', path: '/incidentes' },
    { icon: ShieldAlert, label: 'Protocolos RICE', path: '/protocolos' },
    { icon: Users, label: 'Gestión de Usuarios', path: '/usuarios' },
  ]

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-800/50 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transition-transform duration-300 ease-in-out shadow-2xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:flex-shrink-0
      `}>
        <div className="flex items-center justify-center h-16 border-b border-slate-700/50 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-wider">SIGA<span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">escolar</span></span>
          </div>
        </div>

        <div className="p-4">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-4">Menú Principal</p>
          <nav className="space-y-1">
            {navItems.map((item, idx) => {
              const isActive = currentPath === item.path
              return (
                <button
                  key={idx}
                  onClick={() => {
                    navigate(item.path)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/50'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white hover:translate-x-1'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>
    </>
  )
}

const Header = ({ setIsOpen }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getInitials = (nombre, apellido) => {
    return `${nombre?.[0] || ''}${apellido?.[0] || ''}`.toUpperCase()
  }

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 z-10 sticky top-0">
      <div className="flex items-center gap-4">
        <button
          className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="hidden sm:flex items-center bg-gray-100 rounded-lg px-3 py-1.5 w-64">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Buscar estudiante (RUT o Nombre)..."
            className="bg-transparent border-none focus:outline-none text-sm w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-400 hover:text-gray-600">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
        <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
            {getInitials(user?.nombre, user?.apellido)}
          </div>
          <div className="hidden sm:block text-sm">
            <p className="font-semibold text-gray-700">{user?.nombre} {user?.apellido}</p>
            <p className="text-xs text-gray-500">{user?.rol}</p>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}

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
    <div className="pt-3 border-t border-gray-100 flex items-center gap-1.5">
      <span className={`text-sm font-bold flex items-center ${trendUp ? 'text-red-600' : 'text-emerald-600'}`}>
        <TrendingUp className={`w-4 h-4 mr-1 ${!trendUp && 'rotate-180'}`} />
        {trend}
      </span>
      <span className="text-sm text-gray-500">vs mes anterior</span>
    </div>
  </div>
)

const BarChart = () => {
  const data = [
    { label: '5° Básico', value: 12, color: 'from-cyan-400 to-blue-500' },
    { label: '6° Básico', value: 8, color: 'from-blue-400 to-indigo-500' },
    { label: '7° Básico', value: 24, color: 'from-indigo-400 to-purple-500' },
    { label: '8° Básico', value: 18, color: 'from-purple-400 to-pink-500' },
    { label: '1° Medio', value: 15, color: 'from-pink-400 to-rose-500' },
    { label: '2° Medio', value: 9, color: 'from-rose-400 to-red-500' },
  ]
  const max = Math.max(...data.map(d => d.value))

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-md flex flex-col h-full hover:shadow-xl transition-shadow">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Frecuencia de Incidentes por Nivel</h3>
      <div className="flex-1 flex items-end justify-between gap-3 mt-auto pb-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex flex-col items-center flex-1 group">
            <div className="relative w-full flex justify-center">
              <span className="absolute -top-8 text-sm font-bold text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-2 py-1 rounded shadow-md">
                {item.value}
              </span>
              <div
                className={`w-full max-w-[45px] bg-gradient-to-t ${item.color} rounded-t-lg hover:shadow-lg transition-all cursor-pointer transform hover:scale-105`}
                style={{ height: `${(item.value / max) * 180}px` }}
              ></div>
            </div>
            <span className="text-xs font-medium text-gray-600 mt-3 text-center whitespace-nowrap">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const DonutChart = () => {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
      <h3 className="text-base font-semibold text-gray-800 mb-6">Distribución por Gravedad</h3>
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative w-40 h-40">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f3f4f6" strokeWidth="20" />
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3b82f6" strokeWidth="20" strokeDasharray="251.2" strokeDashoffset="113.04" />
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f59e0b" strokeWidth="20" strokeDasharray="251.2" strokeDashoffset="175.84" className="origin-center" style={{ transform: 'rotate(198deg)' }} />
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ef4444" strokeWidth="20" strokeDasharray="251.2" strokeDashoffset="213.52" className="origin-center" style={{ transform: 'rotate(306deg)' }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-3xl font-bold text-gray-800">86</span>
            <span className="text-xs text-gray-500">Casos Totales</span>
          </div>
        </div>
        <div className="mt-6 flex justify-center gap-4 w-full flex-wrap">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-xs text-gray-600">Leve (55%)</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-500"></div><span className="text-xs text-gray-600">Grave (30%)</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500"></div><span className="text-xs text-gray-600">Grav. (15%)</span></div>
        </div>
      </div>
    </div>
  )
}

const RecentActivityList = () => {
  const activities = [
    { id: 1, type: 'protocol', title: 'Protocolo RICE #042 Activado', desc: 'Acoso escolar reportado en 7° Básico B', time: 'Hace 2 horas', severity: 'high' },
    { id: 2, type: 'incident', title: 'Incidente Leve Registrado', desc: 'Conflicto durante el recreo (8° Básico A)', time: 'Hace 4 horas', severity: 'low' },
    { id: 3, type: 'interview', title: 'Entrevista Apoderado', desc: 'Citación preventiva completada - Juan Pérez', time: 'Ayer', severity: 'info' },
    { id: 4, type: 'incident', title: 'Incidente Grave Registrado', desc: 'Agresión física en gimnasio (1° Medio)', time: 'Ayer', severity: 'medium' },
  ]

  const getSeverityStyles = (severity) => {
    switch(severity) {
      case 'high': return 'bg-red-50 text-red-600 border-red-200'
      case 'medium': return 'bg-amber-50 text-amber-600 border-amber-200'
      case 'low': return 'bg-blue-50 text-blue-600 border-blue-200'
      default: return 'bg-gray-50 text-gray-600 border-gray-200'
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
        <h3 className="text-base font-semibold text-gray-800">Actividad Reciente</h3>
        <button className="text-sm text-blue-600 font-medium hover:text-blue-700">Ver todo</button>
      </div>
      <div className="divide-y divide-gray-100">
        {activities.map((item) => (
          <div key={item.id} className="p-4 sm:px-6 hover:bg-gray-50 transition-colors flex gap-4">
            <div className={`mt-1 w-10 h-10 rounded-full border flex items-center justify-center flex-shrink-0 ${getSeverityStyles(item.severity)}`}>
              {item.type === 'protocol' && <ShieldAlert className="w-5 h-5" />}
              {item.type === 'incident' && <AlertTriangle className="w-5 h-5" />}
              {item.type === 'interview' && <UserCheck className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
              <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
              <span className="text-xs text-gray-400 mt-2 block flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {item.time}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden text-gray-900">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header setIsOpen={setIsSidebarOpen} />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Panel de Convivencia</h1>
            <p className="text-sm text-gray-500 mt-1">Visión general institucional • Escuela Coeducacional N°1</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <KpiCard
              title="Incidentes Totales (Mes)"
              value="86"
              trend="+12%"
              trendUp={true}
              icon={AlertTriangle}
              colorClasses="bg-gradient-to-br from-orange-400 to-amber-500 text-white"
            />
            <KpiCard
              title="Protocolos RICE Activos"
              value="8"
              trend="-2"
              trendUp={false}
              icon={ShieldAlert}
              colorClasses="bg-gradient-to-br from-rose-500 to-purple-600 text-white"
            />
            <KpiCard
              title="Entrevistas Apoderados"
              value="42"
              trend="+15%"
              trendUp={true}
              icon={Users}
              colorClasses="bg-gradient-to-br from-cyan-500 to-blue-600 text-white"
            />
            <KpiCard
              title="Derivaciones Externas"
              value="15"
              trend="0%"
              trendUp={false}
              icon={UserCheck}
              colorClasses="bg-gradient-to-br from-teal-500 to-emerald-600 text-white"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            <div className="lg:col-span-2">
              <BarChart />
            </div>
            <div className="lg:col-span-1">
              <DonutChart />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <RecentActivityList />

            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl shadow-xl p-6 text-white flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>

              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-2">Acciones Rápidas</h3>
                <p className="text-purple-100 text-sm mb-6">Registra una intervención o activa un protocolo inmediatamente desde tu dispositivo.</p>

                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/incidentes/nuevo')}
                    className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 transition-all py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold hover:scale-105 transform shadow-lg"
                  >
                    <AlertTriangle className="w-5 h-5" />
                    Registrar Incidente en Patio
                  </button>
                  <button
                    onClick={() => navigate('/protocolos/nuevo')}
                    className="w-full bg-white text-purple-700 hover:bg-purple-50 transition-all py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg hover:scale-105 transform"
                  >
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                    Activar Protocolo Normativo (RICE)
                  </button>
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
