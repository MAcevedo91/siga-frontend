import { useState, useEffect } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import ResumenCards from '../components/analytics/ResumenCards'
import TendenciaChart from '../components/analytics/TendenciaChart'
import GravedadDonutChart from '../components/analytics/GravedadDonutChart'
import TopEstudiantesChart from '../components/analytics/TopEstudiantesChart'
import MapaCalorCursos from '../components/analytics/MapaCalorCursos'
import * as analyticsService from '../services/analyticsService'
import { Flame, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AnalyticsDashboard() {
  const [tabActiva, setTabActiva] = useState('mapa-calor')
  const [resumen, setResumen] = useState(null)
  const [tendencia, setTendencia] = useState([])
  const [porGravedad, setPorGravedad] = useState([])
  const [topEstudiantes, setTopEstudiantes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  async function loadAnalytics() {
    try {
      setLoading(true)
      const [resumenData, tendenciaData, gravedadData, topData] = await Promise.all([
        analyticsService.getResumen(),
        analyticsService.getTendenciaMensual(),
        analyticsService.getPorGravedad(),
        analyticsService.getTopEstudiantes()
      ])

      setResumen(resumenData)
      setTendencia(tendenciaData)
      setPorGravedad(gravedadData)
      setTopEstudiantes(topData)
    } catch (error) {
      toast.error('Error al cargar analytics')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analítica y Clima Escolar</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Indicadores preventivos y evolución del clima escolar.
            </p>
          </div>

          {/* Selector de Pestañas */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setTabActiva('mapa-calor')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${
                tabActiva === 'mapa-calor'
                  ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Flame className="w-4 h-4 text-orange-500" />
              <span>Mapa de Calor</span>
            </button>
            <button
              type="button"
              onClick={() => setTabActiva('tendencias')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${
                tabActiva === 'tendencias'
                  ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-blue-500" />
              <span>Tendencias Globales</span>
            </button>
          </div>
        </div>

        {tabActiva === 'mapa-calor' ? (
          <div className="space-y-6">
            <MapaCalorCursos />
          </div>
        ) : (
          <div className="space-y-6">
            <ResumenCards data={resumen || {}} loading={loading} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TendenciaChart data={tendencia} loading={loading} />
              <GravedadDonutChart data={porGravedad} loading={loading} />
            </div>

            <TopEstudiantesChart data={topEstudiantes} loading={loading} />
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
