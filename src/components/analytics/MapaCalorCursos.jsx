import { useState, useEffect } from 'react'
import {
  Calendar,
  Filter,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  RefreshCw
} from 'lucide-react'
import { getMapaCalorCursos, getDetalleCeldaMapaCalor } from '@/services/analyticsService'
import DetalleCeldaModal from './DetalleCeldaModal'
import toast from 'react-hot-toast'

const CICLOS = {
  TODOS: 'Todos los Niveles',
  PARVULARIA: 'Educación Parvularia',
  PRIMER_CICLO: '1° Ciclo Básico (1° a 4°)',
  SEGUNDO_CICLO: '2° Ciclo Básico (5° a 8°)',
}

export default function MapaCalorCursos() {
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [cicloFiltro, setCicloFiltro] = useState('TODOS')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Estado para el modal de drill-down
  const [celdaSeleccionada, setCeldaSeleccionada] = useState(null)
  const [detalleData, setDetalleData] = useState(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)

  useEffect(() => {
    cargarMapaCalor()
  }, [anio])

  const cargarMapaCalor = async () => {
    try {
      setLoading(true)
      const res = await getMapaCalorCursos(anio)
      setData(res)
    } catch (err) {
      console.error('Error cargando mapa de calor:', err)
      toast.error('No se pudo cargar el mapa de calor por cursos')
    } finally {
      setLoading(false)
    }
  }

  const handleCeldaClick = async (curso, mesNumero) => {
    try {
      setCeldaSeleccionada({ curso, mesNumero })
      setLoadingDetalle(true)
      const detalle = await getDetalleCeldaMapaCalor({
        cursoId: curso.id,
        mes: mesNumero,
        anio
      })
      setDetalleData(detalle)
    } catch (err) {
      console.error('Error cargando detalle de celda:', err)
      toast.error('Error al cargar diagnóstico pedagógico de la celda')
      setCeldaSeleccionada(null)
    } finally {
      setLoadingDetalle(false)
    }
  }

  const cerrarModal = () => {
    setCeldaSeleccionada(null)
    setDetalleData(null)
  }

  // Filtrado por ciclo
  const cursosFiltrados = (data?.cursos || []).filter((curso) => {
    if (cicloFiltro === 'TODOS') return true
    const nivel = (curso.nivel || '').toLowerCase()
    if (cicloFiltro === 'PARVULARIA') {
      return nivel.includes('kínder') || nivel.includes('kinder')
    }
    if (cicloFiltro === 'PRIMER_CICLO') {
      return ['1°', '2°', '3°', '4°'].some((prefix) => nivel.startsWith(prefix))
    }
    if (cicloFiltro === 'SEGUNDO_CICLO') {
      return ['5°', '6°', '7°', '8°'].some((prefix) => nivel.startsWith(prefix))
    }
    return true
  })

  const meses = data?.meses || []
  const resumen = data?.resumen_global || {}

  return (
    <div className="bg-gradient-to-br from-blue-50/50 via-sky-50/20 to-white dark:from-slate-900 dark:via-slate-900 dark:to-gray-800 rounded-2xl p-4 sm:p-5 shadow-2xs border border-blue-200/80 dark:border-gray-700 h-full flex flex-col justify-between space-y-3.5 flex-1">
      {/* Cabecera y Controles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2 tracking-tight">
            <span>Clima Escolar</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Monitoreo mensual por nivel. Clic en una celda para ver el diagnóstico.
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Año */}
          <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900/50 px-2 py-0.5 rounded-lg border border-gray-200 dark:border-gray-700">
            <Calendar className="w-3.5 h-3.5 text-gray-500" />
            <select
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="bg-transparent text-xs font-semibold text-gray-800 dark:text-gray-200 pr-1 py-0.5 outline-none cursor-pointer"
            >
              <option value={2026}>Año 2026</option>
              <option value={2025}>Año 2025</option>
            </select>
          </div>

          {/* Selector de Ciclo */}
          <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900/50 px-2 py-0.5 rounded-lg border border-gray-200 dark:border-gray-700">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <select
              value={cicloFiltro}
              onChange={(e) => setCicloFiltro(e.target.value)}
              className="bg-transparent text-xs font-semibold text-gray-800 dark:text-gray-200 pr-1 py-0.5 outline-none cursor-pointer"
            >
              {Object.entries(CICLOS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={cargarMapaCalor}
            title="Recargar datos"
            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Resumen Global Rápido con degradados cromáticos */}
      {!loading && data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gradient-to-br from-blue-100/90 via-blue-50/50 to-white dark:from-blue-950/60 dark:to-gray-800 border border-blue-300/80 dark:border-blue-800/60 shadow-xs">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Total Anual</p>
              <p className="text-sm font-black text-blue-950 dark:text-white">
                {resumen.total_incidentes || 0} casos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gradient-to-br from-emerald-100/90 via-emerald-50/50 to-white dark:from-emerald-950/60 dark:to-gray-800 border border-emerald-300/80 dark:border-emerald-800/60 shadow-xs">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Estables</p>
              <p className="text-sm font-black text-emerald-950 dark:text-emerald-300">
                {resumen.cursos_verdes || 0}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gradient-to-br from-amber-100/90 via-amber-50/50 to-white dark:from-amber-950/60 dark:to-gray-800 border border-amber-300/80 dark:border-amber-800/60 shadow-xs">
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide">En Alerta</p>
              <p className="text-sm font-black text-amber-950 dark:text-amber-300">
                {resumen.cursos_amarillos || 0}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gradient-to-br from-rose-100/90 via-rose-50/50 to-white dark:from-rose-950/60 dark:to-gray-800 border border-rose-300/80 dark:border-rose-800/60 shadow-xs">
            <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wide">Críticos</p>
              <p className="text-sm font-black text-rose-950 dark:text-rose-300">
                {resumen.cursos_rojos || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Matriz del Mapa de Calor */}
      <div className="overflow-x-auto border border-gray-100 dark:border-gray-700/80 rounded-xl flex-1 flex flex-col justify-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Generando mapa de calor por cursos...</p>
          </div>
        ) : cursosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No se encontraron cursos para el ciclo seleccionado.
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-700 text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                <th className="py-2.5 px-3 sticky left-0 bg-gray-50 dark:bg-gray-900 z-10 border-r border-gray-200 dark:border-gray-700 min-w-[125px]">
                  Curso
                </th>
                {meses.map((m) => (
                  <th key={m.numero} className="py-2.5 px-1 text-center min-w-[36px] sm:min-w-[42px]">
                    {m.nombre}
                  </th>
                ))}
                <th className="py-2.5 px-2 text-center border-l border-gray-200 dark:border-gray-700 min-w-[60px]">
                  Total
                </th>
                <th className="py-2.5 px-2 text-center min-w-[75px]">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
              {cursosFiltrados.map((curso) => {
                const badgeClase = {
                  rojo: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300',
                  amarillo: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300',
                  verde: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300',
                }[curso.alerta_general] || 'bg-gray-100 text-gray-700'

                const badgeTexto = {
                  rojo: 'Crítico',
                  amarillo: 'Alerta',
                  verde: 'Estable',
                }[curso.alerta_general] || 'Normal'

                return (
                  <tr key={curso.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                    {/* Columna Curso */}
                    <td className="py-3.5 px-3 font-bold text-gray-900 dark:text-gray-100 sticky left-0 bg-white dark:bg-gray-800 z-10 border-r border-gray-200 dark:border-gray-700 shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0 bg-blue-500" />
                        <span className="truncate text-xs sm:text-[13px]">{curso.nombre}</span>
                      </div>
                    </td>

                    {/* Celdas de Meses (Mar a Dic) */}
                    {meses.map((m) => {
                      const celda = curso.meses?.[m.numero] || { total: 0, alerta: 'verde' }
                      const totalCelda = celda.total || 0

                      let estiloCelda = 'bg-gray-50/60 text-gray-400 hover:bg-gray-100 dark:bg-gray-900/30 dark:text-gray-500'
                      if (celda.alerta === 'rojo') {
                        estiloCelda =
                          'bg-rose-100/90 text-rose-900 font-extrabold border border-rose-300 hover:bg-rose-200 shadow-2xs dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800'
                      } else if (celda.alerta === 'amarillo') {
                        estiloCelda =
                          'bg-amber-100/80 text-amber-900 font-bold border border-amber-200 hover:bg-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800'
                      } else if (totalCelda > 0) {
                        estiloCelda =
                          'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                      }

                      return (
                        <td key={m.numero} className="py-2.5 px-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleCeldaClick(curso, m.numero)}
                            title={`${curso.nombre} • ${m.nombre}: ${totalCelda} caso(s). Clic para diagnóstico.`}
                            className={`w-full py-2 rounded-md text-xs transition transform active:scale-95 flex items-center justify-center font-semibold ${estiloCelda}`}
                          >
                            {totalCelda > 0 ? totalCelda : '—'}
                          </button>
                        </td>
                      )
                    })}

                    {/* Total Anual del Curso */}
                    <td className="py-3.5 px-2 text-center font-black text-gray-900 dark:text-white border-l border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/20 text-xs">
                      {curso.total_anual}
                    </td>

                    {/* Estado / Semáforo General */}
                    <td className="py-3.5 px-2 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${badgeClase}`}>
                        {badgeTexto}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Leyenda y Explicación Metodológica */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 text-[11px] text-gray-500 dark:text-gray-400">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold text-gray-700 dark:text-gray-300">Niveles de Clima:</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Estable (0 a 1 leves)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            <span>En Alerta (2 a 4 leves o 1 grave)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            <span>Crítico (≥ 5 casos o gravísimas)</span>
          </span>
        </div>
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          Datos anónimos y agregados por aula (Ley N° 19.628)
        </span>
      </div>

      {/* Modal de Detalle / Drill-Down */}
      {celdaSeleccionada && (
        <DetalleCeldaModal
          data={detalleData}
          loading={loadingDetalle}
          onClose={cerrarModal}
        />
      )}
    </div>
  )
}
