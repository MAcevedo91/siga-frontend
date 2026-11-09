import { useState, useEffect } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import ResumenCards from '../components/analytics/ResumenCards'
import ReporteMensualModal from '../components/analytics/ReporteMensualModal'
import TendenciaChart from '../components/analytics/TendenciaChart'
import GravedadDonutChart from '../components/analytics/GravedadDonutChart'
import BarrasCursoChart from '../components/analytics/BarrasCursoChart'
import TiposAbordajeChart from '../components/analytics/TiposAbordajeChart'
import TopEstudiantesChart from '../components/analytics/TopEstudiantesChart'
import FuncionariosWidget from '../components/analytics/FuncionariosWidget'
import * as analyticsService from '../services/analyticsService'
import { getIncidentesPorCurso } from '../services/dashboardService'
import { captureAllDashboardCharts } from '../utils/chartExportHelper'
import { RefreshCw, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AnalyticsDashboard() {
  const [resumen, setResumen] = useState(null)
  const [tendencia, setTendencia] = useState([])
  const [porGravedad, setPorGravedad] = useState([])
  const [topEstudiantes, setTopEstudiantes] = useState([])
  const [porCurso, setPorCurso] = useState([])
  const [porAbordaje, setPorAbordaje] = useState([])
  const [usuariosActividad, setUsuariosActividad] = useState({ usuarios: [], totalIncidentesRegistrados: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [modalPdfOpen, setModalPdfOpen] = useState(false)

  useEffect(() => {
    loadAnalytics()
  }, [])

  async function loadAnalytics(isManual = false) {
    try {
      if (isManual) setRefreshing(true)
      else setLoading(true)

      const [
        resumenData,
        tendenciaData,
        gravedadData,
        topData,
        cursoData,
        abordajeData,
        usuariosData,
      ] = await Promise.all([
        analyticsService.getResumen().catch(() => null),
        analyticsService.getTendenciaMensual().catch(() => []),
        analyticsService.getPorGravedad().catch(() => []),
        analyticsService.getTopEstudiantes().catch(() => []),
        getIncidentesPorCurso().catch(() => []),
        analyticsService.getPorAbordaje().catch(() => []),
        analyticsService.getUsuariosActividad().catch(() => ({ usuarios: [], totalIncidentesRegistrados: 0 })),
      ])

      setResumen(resumenData)
      setTendencia(tendenciaData)
      setPorGravedad(gravedadData)
      setTopEstudiantes(topData)
      setPorCurso(cursoData)
      setPorAbordaje(abordajeData)
      setUsuariosActividad(usuariosData || { usuarios: [], totalIncidentesRegistrados: 0 })

      if (isManual) {
        toast.success('Métricas analíticas actualizadas')
      }
    } catch (error) {
      toast.error('Error al cargar métricas analíticas')
      console.error('Error analytics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function handleDescargarReportePdf() {
    try {
      const graficos = await captureAllDashboardCharts().catch(() => ({}))
      await analyticsService.descargarReporteMensualPdf(graficos)
      toast.success('Reporte mensual descargado exitosamente')
    } catch (error) {
      console.error('Error al descargar reporte mensual:', error)
      toast.error('Error al generar el reporte en PDF')
      throw error
    }
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 sm:space-y-8 pb-10 sm:pb-14">
        {/* CABECERA: TÍTULO DIRECTO Y ACCIONES SUPERIORES */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analítica
          </h1>

          <div className="flex items-center gap-2.5">
            {/* BOTÓN DESTACADO PARA ABRIR EL MODAL COMPACTO DE REPORTE PDF */}
            <button
              type="button"
              onClick={() => setModalPdfOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-xs hover:shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-lime-300" />
              <span>Reporte Mensual PDF</span>
            </button>

            {/* BOTÓN DE ACTUALIZACIÓN */}
            <button
              type="button"
              onClick={() => loadAnalytics(true)}
              disabled={loading || refreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
              <span>Actualizar datos</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            FILA 1 (SUPERIOR): 3 KPIS AMPLIAMENTE SEPARADOS (GAP-6 A GAP-8)
            ========================================================================= */}
        <ResumenCards data={resumen || {}} loading={loading} />

        {/* =========================================================================
            FILA 2 (CENTRAL 1): TENDENCIA TEMPORAL (50%) + DISTRIBUCIÓN POR GRAVEDAD (50%)
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <TendenciaChart data={tendencia} loading={loading} />
          <GravedadDonutChart data={porGravedad} loading={loading} />
        </div>

        {/* =========================================================================
            FILA 3 (CENTRAL 2): FRECUENCIA POR AULA (50%) + ABORDAJES Y PROTOCOLOS (50%)
            100% CENTRADOS Y EQUILIBRADOS
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <BarrasCursoChart data={porCurso} loading={loading} />
          <TiposAbordajeChart data={porAbordaje} loading={loading} />
        </div>

        {/* =========================================================================
            FILA 4 (INFERIOR): FOCALIZACIÓN PRIORITARIA (66%) + FUNCIONARIOS (34%)
            ESTILO TOP STORE + TEAM MEMBER DE LA MAQUETA DE REFERENCIA
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-8">
            <TopEstudiantesChart data={topEstudiantes} loading={loading} />
          </div>
          <div className="lg:col-span-4">
            <FuncionariosWidget usuariosData={usuariosActividad} loading={loading} />
          </div>
        </div>

        {/* =========================================================================
            MODAL COMPACTO DE REPORTE MENSUAL PDF (DISEÑO HOJA 3D + COPILOTO IA)
            ========================================================================= */}
        <ReporteMensualModal
          isOpen={modalPdfOpen}
          onClose={() => setModalPdfOpen(false)}
          onDownloadPdf={handleDescargarReportePdf}
        />
      </div>
    </DashboardLayout>
  )
}
