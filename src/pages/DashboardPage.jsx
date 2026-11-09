import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/store/useAuthStore'
import AccionesPendientesWidget from '@/components/dashboard/AccionesPendientesWidget'
import MapaCalorCursos from '@/components/analytics/MapaCalorCursos'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
  AlertTriangle,
  ShieldAlert,
  Users,
  UserCheck,
  FileText,
} from 'lucide-react'
import {
  getDashboardResumen,
  getIncidentesPorCurso,
  getIncidentesPorGravedad,
  getTendenciaMensual,
  getAccionesPendientes,
} from '@/services/dashboardService'
import {
  ROLES_CREACION_INCIDENTES,
  ROLES_GESTION_CASOS,
  ROLES_DASHBOARD_ANALYTICS,
} from '@/constants/roles'

// Tarjeta KPI superior: ícono al lado del título y valor numérico centrado abajo con gradiente temático
const KpiCard = ({ title, value, icon: Icon, colorClasses, bgClasses, borderClasses }) => (
  <div className={`rounded-2xl p-3.5 shadow-2xs transition-all hover:shadow-xs flex flex-col justify-between min-h-[96px] ${bgClasses || 'bg-white dark:bg-gray-800'} ${borderClasses || 'border border-gray-100 dark:border-gray-700/80'}`}>
    {/* Cabecera: Ícono squircle al lado del título */}
    <div className="flex items-center gap-2.5">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-2xs shrink-0 ${colorClasses}`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-[10.5px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide leading-tight">
        {title}
      </span>
    </div>

    {/* Cuerpo: Métrica cuantitativa centrada abajo */}
    <div className="flex-1 flex items-center justify-center pt-2 pb-0.5">
      <p className="text-3xl font-black text-gray-950 dark:text-white text-center tracking-tight leading-none">
        {value}
      </p>
    </div>
  </div>
)

// Módulo de Acciones Rápidas — card con botones verticales lado a lado
const AccionesRapidas = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const canCreateIncidente = ROLES_CREACION_INCIDENTES.includes(user?.rol)
  const canCreateProtocolo = ROLES_GESTION_CASOS.includes(user?.rol)

  return (
    <div className="bg-gradient-to-br from-slate-100/90 via-indigo-50/40 to-white dark:from-slate-900 dark:to-gray-800 rounded-2xl border border-slate-300/80 dark:border-slate-700 p-3.5 sm:p-4 shadow-2xs">
      <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-2.5">
        Acciones Rápidas
      </h3>
      <div className="grid grid-cols-2 gap-2.5">
        {canCreateIncidente && (
          <button
            type="button"
            onClick={() => navigate('/incidentes/nuevo')}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white transition-all py-3.5 px-2 rounded-xl flex flex-col items-center justify-center gap-1.5 text-xs font-bold shadow-xs hover:shadow-sm"
          >
            <AlertTriangle className="w-5 h-5" />
            <span>Registrar Incidente</span>
          </button>
        )}
        {canCreateProtocolo && (
          <button
            type="button"
            onClick={() => navigate('/protocolos/nuevo')}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transition-all py-3.5 px-2 rounded-xl flex flex-col items-center justify-center gap-1.5 text-xs font-bold shadow-xs hover:shadow-sm"
          >
            <ShieldAlert className="w-5 h-5" />
            <span>Activar Protocolo RICE</span>
          </button>
        )}
        {!canCreateIncidente && !canCreateProtocolo && (
          <button
            type="button"
            onClick={() => navigate('/incidentes')}
            className="col-span-2 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transition-all py-3.5 px-2 rounded-xl flex flex-col items-center justify-center gap-1.5 text-xs font-bold shadow-xs hover:shadow-sm"
          >
            <FileText className="w-5 h-5" />
            <span>Ver Incidentes</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [resumen, setResumen] = useState(null)

  const [accionesPendientes, setAccionesPendientes] = useState([])
  const [errorAcciones, setErrorAcciones] = useState(false)
  const puedeVerAcciones = ROLES_DASHBOARD_ANALYTICS.includes(user?.rol)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true)
        setErrorAcciones(false)
        const [resumenData, , , , accionesData] = await Promise.all([
          getDashboardResumen(),
          getIncidentesPorCurso().catch(() => []),
          getIncidentesPorGravedad().catch(() => []),
          getTendenciaMensual().catch(() => []),
          puedeVerAcciones
            ? getAccionesPendientes().catch(() => {
                setErrorAcciones(true)
                return []
              })
            : Promise.resolve([]),
        ])
        setResumen(resumenData)
        setAccionesPendientes(accionesData)
      } catch (err) {
        console.error('Error cargando dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [puedeVerAcciones])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[40vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
            <p className="text-xs text-gray-500">Cargando panel...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const datosResumen = resumen || {
    total_incidentes: 0,
    total_graves: 0,
    protocolos_activos: 0,
    estudiantes_con_incidentes: 0,
  }

  return (
    <DashboardLayout>
      <div className="p-3 sm:p-4 max-w-[1600px] mx-auto min-h-[calc(100vh-4.5rem)] flex flex-col justify-between">
        {/* Título de encabezado para accesibilidad y navegación */}
        <h1 className="sr-only">Panel Principal</h1>

        {/* ESTRUCTURA EXACTA A LA MAQUETA: 2 COLUMNAS PARALELAS (25% / 75%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch flex-1">
          {/* COLUMNA IZQUIERDA (~25% ancho): Acciones Pendientes + Acciones Rápidas */}
          <div className="lg:col-span-3 flex flex-col justify-between gap-3 h-full">
            {puedeVerAcciones && (
              <AccionesPendientesWidget
                acciones={accionesPendientes}
                error={errorAcciones}
              />
            )}
            <AccionesRapidas />
          </div>

          {/* COLUMNA DERECHA (~75% ancho): 4 KPIs en una fila + Mapa de Calor por Cursos */}
          <div className={`${puedeVerAcciones ? 'lg:col-span-9' : 'lg:col-span-12'} flex flex-col justify-between gap-3 h-full`}>
            {/* 1. Fila Horizontal de 4 KPIs con fondos cromáticos temáticos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              <KpiCard
                title="Incidentes Totales"
                value={datosResumen.total_incidentes}
                icon={AlertTriangle}
                colorClasses="bg-gradient-to-tr from-amber-500 to-orange-500 text-white"
                bgClasses="bg-gradient-to-br from-amber-100/90 via-orange-50/45 to-white dark:from-amber-950/70 dark:via-slate-900/80 dark:to-gray-800"
                borderClasses="border border-amber-300/90 dark:border-amber-800/80"
              />
              <KpiCard
                title="Incidentes Graves"
                value={datosResumen.total_graves}
                icon={ShieldAlert}
                colorClasses="bg-gradient-to-tr from-rose-500 to-red-600 text-white"
                bgClasses="bg-gradient-to-br from-rose-100/90 via-rose-50/45 to-white dark:from-rose-950/70 dark:via-slate-900/80 dark:to-gray-800"
                borderClasses="border border-rose-300/90 dark:border-rose-800/80"
              />
              <KpiCard
                title="Protocolos RICE Activos"
                value={datosResumen.protocolos_activos}
                icon={Users}
                colorClasses="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white"
                bgClasses="bg-gradient-to-br from-blue-100/90 via-indigo-50/45 to-white dark:from-blue-950/70 dark:via-slate-900/80 dark:to-gray-800"
                borderClasses="border border-blue-300/90 dark:border-blue-800/80"
              />
              <KpiCard
                title="Estudiantes en Seguimiento"
                value={datosResumen.estudiantes_con_incidentes}
                icon={UserCheck}
                colorClasses="bg-gradient-to-tr from-teal-600 to-emerald-600 text-white"
                bgClasses="bg-gradient-to-br from-teal-100/90 via-emerald-50/45 to-white dark:from-teal-950/70 dark:via-slate-900/80 dark:to-gray-800"
                borderClasses="border border-teal-300/90 dark:border-teal-800/80"
              />
            </div>

            {/* 2. Clima Escolar por Cursos */}
            <MapaCalorCursos />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
