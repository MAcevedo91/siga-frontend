import { useState, useEffect } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import ResumenCards from '../components/analytics/ResumenCards'
import TendenciaChart from '../components/analytics/TendenciaChart'
import GravedadDonutChart from '../components/analytics/GravedadDonutChart'
import TopEstudiantesChart from '../components/analytics/TopEstudiantesChart'
import BarrasCursoChart from '../components/analytics/BarrasCursoChart'
import * as analyticsService from '../services/analyticsService'
import { getIncidentesPorCurso } from '../services/dashboardService'
import { TrendingUp, Users } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AnalyticsDashboard() {
  const [resumen, setResumen] = useState(null)
  const [tendencia, setTendencia] = useState([])
  const [porGravedad, setPorGravedad] = useState([])
  const [topEstudiantes, setTopEstudiantes] = useState([])
  const [porCurso, setPorCurso] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  async function loadAnalytics() {
    try {
      setLoading(true)
      const [resumenData, tendenciaData, gravedadData, topData, cursoData] = await Promise.all([
        analyticsService.getResumen(),
        analyticsService.getTendenciaMensual(),
        analyticsService.getPorGravedad(),
        analyticsService.getTopEstudiantes(),
        getIncidentesPorCurso().catch(() => []),
      ])

      setResumen(resumenData)
      setTendencia(tendenciaData)
      setPorGravedad(gravedadData)
      setTopEstudiantes(topData)
      setPorCurso(cursoData)
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
        {/* Cabecera de la sección */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analítica y Estadísticas</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Métricas consolidadas, tendencias temporales y diagnóstico pedagógico institucional.
            </p>
          </div>
        </div>

        <div className="space-y-6 animate-fade-in">
          {/* MÓDULO 1: TARJETAS DE RESUMEN EJECUTIVO */}
          <section aria-labelledby="resumen-metrics-title">
            <h2 id="resumen-metrics-title" className="sr-only">Resumen de Métricas</h2>
            <ResumenCards data={resumen || {}} loading={loading} />
          </section>

          {/* MÓDULO 2: EVOLUCIÓN TEMPORAL DE INCIDENTES */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Evolución Temporal de Incidentes
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Comportamiento histórico y variaciones mensuales clasificadas por nivel de severidad.
                </p>
              </div>
            </div>
            <TendenciaChart data={tendencia} loading={loading} />
          </section>

          {/* MÓDULO 3: FRECUENCIA POR CURSO Y DISTRIBUCIÓN POR GRAVEDAD */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <BarrasCursoChart data={porCurso} loading={loading} />
            </div>
            <div className="space-y-2">
              <GravedadDonutChart data={porGravedad} loading={loading} />
            </div>
          </section>

          {/* MÓDULO 4: REINCIDENCIA Y SEGUIMIENTO INDIVIDUAL */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Estudiantes con Mayor Frecuencia de Incidentes
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Focalización para intervención de la dupla psicosocial y planes de acompañamiento formativo.
                </p>
              </div>
            </div>
            <TopEstudiantesChart data={topEstudiantes} loading={loading} />
          </section>
        </div>
      </div>
    </DashboardLayout>
  )
}
