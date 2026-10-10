import { useState, useEffect, useMemo } from 'react'
import {
  Calendar,
  Filter,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Eye,
  Layers,
  Sparkles
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
  const [soloConIncidentes, setSoloConIncidentes] = useState(true)
  const [nivelesExpandidos, setNivelesExpandidos] = useState(() => new Set())
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

  const toggleNivel = (nivelNombre) => {
    setNivelesExpandidos(prev => {
      const next = new Set(prev)
      if (next.has(nivelNombre)) {
        next.delete(nivelNombre)
      } else {
        next.add(nivelNombre)
      }
      return next
    })
  }

  const expandirTodos = () => {
    const todos = new Set((data?.niveles_agrupados || []).map(n => n.nivel))
    setNivelesExpandidos(todos)
  }

  const colapsarTodos = () => {
    setNivelesExpandidos(new Set())
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

  // Filtrado de niveles según ciclo y si tienen incidentes
  const nivelesFiltrados = useMemo(() => {
    const lista = data?.niveles_agrupados || []
    return lista.filter((grupo) => {
      // Filtro de solo con incidentes
      if (soloConIncidentes && grupo.total_anual === 0) {
        return false
      }

      // Filtro de ciclo
      if (cicloFiltro === 'TODOS') return true
      const nivel = (grupo.nivel || '').toLowerCase()
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
  }, [data?.niveles_agrupados, soloConIncidentes, cicloFiltro])

  const meses = data?.meses || []
  const resumen = data?.resumen_global || {}
  const totalIncidentesGlobal = resumen.total_incidentes || 0

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
      {/* Cabecera y Controles */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>Clima Escolar por Cursos</span>
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Monitoreo mensual por nivel. Clic en una celda para ver el diagnóstico.
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Año */}
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900/50 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
            <Calendar className="w-4 h-4 ml-2 text-gray-500" />
            <select
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="bg-transparent text-sm font-semibold text-gray-800 dark:text-gray-200 pr-2 py-1 outline-none cursor-pointer"
            >
              <option value={2026}>Año 2026</option>
              <option value={2025}>Año 2025</option>
            </select>
          </div>

          {/* Selector de Ciclo */}
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900/50 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
            <Filter className="w-4 h-4 ml-2 text-gray-500" />
            <select
              value={cicloFiltro}
              onChange={(e) => setCicloFiltro(e.target.value)}
              className="bg-transparent text-sm font-semibold text-gray-800 dark:text-gray-200 pr-2 py-1 outline-none cursor-pointer"
            >
              {Object.entries(CICLOS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Solo con Incidentes */}
          <button
            type="button"
            onClick={() => setSoloConIncidentes(!soloConIncidentes)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              soloConIncidentes
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 shadow-sm'
                : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{soloConIncidentes ? 'Solo con incidentes' : 'Todos los cursos'}</span>
          </button>

          {/* Botones de Expandir / Colapsar Todos */}
          <div className="flex items-center bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 p-0.5">
            <button
              type="button"
              onClick={expandirTodos}
              title="Expandir todas las secciones"
              className="px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              Expandir
            </button>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <button
              type="button"
              onClick={colapsarTodos}
              title="Colapsar a nivel general"
              className="px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              Colapsar
            </button>
          </div>

          <button
            type="button"
            onClick={cargarMapaCalor}
            title="Recargar datos"
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Resumen Global Rápido */}
      {!loading && data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-gray-50/80 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Anual</p>
              <p className="text-lg font-extrabold text-gray-900 dark:text-white">
                {resumen.total_incidentes || 0} casos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Estables</p>
              <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">
                {resumen.cursos_verdes || 0}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">En Alerta</p>
              <p className="text-lg font-extrabold text-amber-700 dark:text-amber-400">
                {resumen.cursos_amarillos || 0}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold text-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Críticos</p>
              <p className="text-lg font-extrabold text-rose-700 dark:text-rose-400">
                {resumen.cursos_rojos || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Matriz Jerárquica del Mapa de Calor */}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Generando mapa de calor por niveles...</p>
          </div>
        ) : nivelesFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 ring-8 ring-emerald-50/50 dark:ring-emerald-950/30">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {totalIncidentesGlobal === 0
                ? 'Clima Escolar 100% Estable'
                : 'Sin incidentes para los filtros seleccionados'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mt-1.5">
              {totalIncidentesGlobal === 0
                ? `No se registran incidentes de convivencia en ningún curso durante el año lectivo ${anio}. La convivencia escolar se encuentra en óptimo estado.`
                : 'No se encontraron cursos con incidentes en este ciclo. Puedes desactivar el filtro "Solo con incidentes" para auditar todos los niveles.'}
            </p>
            {soloConIncidentes && totalIncidentesGlobal > 0 && (
              <button
                type="button"
                onClick={() => setSoloConIncidentes(false)}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 hover:bg-blue-100 transition"
              >
                Ver todos los cursos del colegio
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                <th className="py-3 px-4 sticky left-0 bg-gray-50 dark:bg-gray-900 z-10 border-r border-gray-200 dark:border-gray-700 min-w-[200px]">
                  Nivel / Curso
                </th>
                {meses.map((m) => (
                  <th key={m.numero} className="py-3 px-3 text-center min-w-[62px]">
                    {m.nombre}
                  </th>
                ))}
                <th className="py-3 px-4 text-center border-l border-gray-200 dark:border-gray-700 min-w-[90px]">
                  Total Anual
                </th>
                <th className="py-3 px-4 text-center min-w-[110px]">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
              {nivelesFiltrados.map((grupo) => {
                const estaExpandido = nivelesExpandidos.has(grupo.nivel)
                const tieneMultiplesCursos = (grupo.cursos || []).length > 1

                const badgeClaseNivel = {
                  rojo: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300',
                  amarillo: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300',
                  verde: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300',
                }[grupo.alerta_general] || 'bg-gray-100 text-gray-700'

                const badgeTextoNivel = {
                  rojo: 'Crítico',
                  amarillo: 'Atención',
                  verde: 'Estable',
                }[grupo.alerta_general] || 'Normal'

                return (
                  <tbody key={grupo.nivel} className="group border-b border-gray-200/60 dark:border-gray-700/60 last:border-0">
                    {/* Fila del Nivel Consolidado (Padre) */}
                    <tr className="bg-slate-50/70 dark:bg-gray-800/60 font-semibold hover:bg-slate-100/80 dark:hover:bg-gray-700/40 transition-colors">
                      <td className="py-3 px-4 sticky left-0 bg-slate-50 dark:bg-gray-800 z-10 border-r border-gray-200 dark:border-gray-700">
                        <button
                          type="button"
                          onClick={() => toggleNivel(grupo.nivel)}
                          className="flex items-center gap-2.5 text-left w-full group/btn"
                        >
                          <span className="p-1 rounded-md text-gray-400 group-hover/btn:text-blue-600 group-hover/btn:bg-blue-50 dark:group-hover/btn:bg-blue-950/50 transition">
                            {estaExpandido ? (
                              <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </span>
                          <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                            {grupo.nivel}
                          </span>
                          <span className="text-[11px] font-normal text-gray-400 dark:text-gray-500 bg-gray-200/60 dark:bg-gray-700/60 px-1.5 py-0.5 rounded-full">
                            {grupo.cursos.length} {grupo.cursos.length === 1 ? 'sección' : 'secciones'}
                          </span>
                        </button>
                      </td>

                      {/* Celdas Consolidadas del Nivel */}
                      {meses.map((m) => {
                        const celda = grupo.meses?.[m.numero] || { total: 0, alerta: 'verde' }
                        const totalCelda = celda.total || 0

                        let estiloCelda = 'bg-transparent text-gray-400 dark:text-gray-500'
                        if (celda.alerta === 'rojo') {
                          estiloCelda = 'bg-rose-100 text-rose-900 font-extrabold border border-rose-300 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-800'
                        } else if (celda.alerta === 'amarillo') {
                          estiloCelda = 'bg-amber-100 text-amber-900 font-bold border border-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800'
                        } else if (totalCelda > 0) {
                          estiloCelda = 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                        }

                        return (
                          <td key={m.numero} className="py-2 px-1.5 text-center">
                            <div className={`w-full py-1.5 rounded-lg text-xs flex items-center justify-center font-bold ${estiloCelda}`}>
                              {totalCelda > 0 ? totalCelda : '—'}
                            </div>
                          </td>
                        )
                      })}

                      {/* Total Anual Consolidado */}
                      <td className="py-2 px-4 text-center font-extrabold text-gray-900 dark:text-white border-l border-gray-200 dark:border-gray-700 bg-slate-100/60 dark:bg-gray-900/40">
                        {grupo.total_anual}
                      </td>

                      {/* Semáforo del Nivel */}
                      <td className="py-2 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${badgeClaseNivel}`}>
                          {badgeTextoNivel}
                        </span>
                      </td>
                    </tr>

                    {/* Filas Hijas: Cursos / Secciones (visibles si está expandido) */}
                    {estaExpandido &&
                      grupo.cursos.map((curso) => {
                        // Si está activado "soloConIncidentes", solo mostrar cursos con incidentes
                        if (soloConIncidentes && curso.total_anual === 0) return null

                        const badgeClaseCurso = {
                          rojo: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
                          amarillo: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
                          verde: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
                        }[curso.alerta_general] || 'bg-gray-100 text-gray-700'

                        return (
                          <tr
                            key={curso.id}
                            className="bg-white dark:bg-gray-800/90 hover:bg-blue-50/30 dark:hover:bg-gray-700/30 transition-colors"
                          >
                            {/* Columna Curso con Indentación */}
                            <td className="py-2 pl-9 pr-4 text-xs font-medium text-gray-700 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800 z-10 border-r border-gray-200 dark:border-gray-700">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-300 dark:text-gray-600">↳</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                <span className="font-semibold text-gray-800 dark:text-gray-200">{curso.nombre}</span>
                              </div>
                            </td>

                            {/* Celdas Clicables del Curso Específico */}
                            {meses.map((m) => {
                              const celda = curso.meses?.[m.numero] || { total: 0, alerta: 'verde' }
                              const totalCelda = celda.total || 0

                              let estiloCelda = 'bg-gray-50/40 text-gray-400 hover:bg-gray-100 dark:bg-gray-900/20 dark:text-gray-500'
                              if (celda.alerta === 'rojo') {
                                estiloCelda = 'bg-rose-100/90 text-rose-900 font-extrabold border border-rose-300 hover:bg-rose-200 shadow-sm dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800'
                              } else if (celda.alerta === 'amarillo') {
                                estiloCelda = 'bg-amber-100/80 text-amber-900 font-bold border border-amber-200 hover:bg-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800'
                              } else if (totalCelda > 0) {
                                estiloCelda = 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                              }

                              return (
                                <td key={m.numero} className="py-1 px-1.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleCeldaClick(curso, m.numero)}
                                    title={`${curso.nombre} • ${m.nombre}: ${totalCelda} caso(s). Clic para diagnóstico.`}
                                    className={`w-full py-1 rounded-md text-xs transition transform active:scale-95 flex items-center justify-center font-medium ${estiloCelda}`}
                                  >
                                    {totalCelda > 0 ? totalCelda : '—'}
                                  </button>
                                </td>
                              )
                            })}

                            {/* Total Anual de la Sección */}
                            <td className="py-1.5 px-4 text-center font-bold text-xs text-gray-800 dark:text-gray-200 border-l border-gray-200 dark:border-gray-700 bg-gray-50/20 dark:bg-gray-900/10">
                              {curso.total_anual}
                            </td>

                            {/* Estado de la Sección */}
                            <td className="py-1.5 px-4 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${badgeClaseCurso}`}>
                                {curso.total_anual === 0 ? 'Sin casos' : `${curso.total_anual} reg.`}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Leyenda y Explicación Metodológica */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-gray-50/70 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold text-gray-700 dark:text-gray-300">Niveles de Clima:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            <span>Estable (0 a 1 leves)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
            <span>En Alerta (2 a 4 leves o 1 grave)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
            <span>Crítico (≥ 5 casos o gravísimas)</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 italic">
          <HelpCircle className="w-4 h-4 shrink-0" />
          <span>Datos anónimos y agregados por aula (Ley N° 19.628).</span>
        </div>
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
