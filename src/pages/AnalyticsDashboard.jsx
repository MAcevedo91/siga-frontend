import { useState, useEffect } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import ResumenCards from '../components/analytics/ResumenCards'
import TendenciaChart from '../components/analytics/TendenciaChart'
import GravedadDonutChart from '../components/analytics/GravedadDonutChart'
import TopEstudiantesChart from '../components/analytics/TopEstudiantesChart'
import * as analyticsService from '../services/analyticsService'
import toast from 'react-hot-toast'

export default function AnalyticsDashboard() {
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
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Analytics Dashboard</h1>

        <ResumenCards data={resumen || {}} loading={loading} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <TendenciaChart data={tendencia} loading={loading} />
          <GravedadDonutChart data={porGravedad} loading={loading} />
        </div>

        <TopEstudiantesChart data={topEstudiantes} loading={loading} />
      </div>
    </DashboardLayout>
  )
}
