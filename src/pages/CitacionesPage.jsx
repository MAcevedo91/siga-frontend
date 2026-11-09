import { useState, useEffect, useMemo } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
  listarCitaciones,
  obtenerMetricasCitaciones,
  descargarActaCitacionPdf,
  descargarArchivoIcs,
  CATEGORIAS_FORMATIVAS,
} from '@/services/citacionesService'
import NuevaCitacionModal from '@/components/citaciones/NuevaCitacionModal'
import EntrevistaCitacionModal from '@/components/citaciones/EntrevistaCitacionModal'
import {
  CalendarCheck,
  CalendarPlus,
  Search,
  Filter,
  Download,
  FileCheck,
  Clock,
  MapPin,
  Video,
  User,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  Users,
  Award,
  Calendar,
  AlertCircle,
  FileText,
  BookOpen,
} from 'lucide-react'

// Píldoras de estado con estilos cromáticos modernos
const ESTADOS_PILLS = [
  { key: 'todos', label: 'Todos' },
  { key: 'programada', label: 'Programadas', color: 'bg-amber-50 text-amber-800 border-amber-300' },
  { key: 'confirmada', label: 'Confirmadas', color: 'bg-blue-50 text-blue-800 border-blue-300' },
  { key: 'realizada', label: 'Realizadas', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
  { key: 'reprogramacion_solicitada', label: 'Reprogramadas', color: 'bg-purple-50 text-purple-800 border-purple-300' },
  { key: 'no_asiste', label: 'Inasistencias', color: 'bg-rose-50 text-rose-800 border-rose-300' },
]

export default function CitacionesPage() {
  const [citaciones, setCitaciones] = useState([])
  const [metricas, setMetricas] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filtros reactivos
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroMotivo, setFiltroMotivo] = useState('todos')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  // Modales
  const [showNuevaModal, setShowNuevaModal] = useState(false)
  const [citacionEntrevista, setCitacionEntrevista] = useState(null)
  const [descargandoId, setDescargandoId] = useState(null)

  const cargarDatos = async () => {
    try {
      setLoading(true)
      setError(null)

      const [resCitaciones, resMetricas] = await Promise.allSettled([
        listarCitaciones({
          estado: filtroEstado !== 'todos' ? filtroEstado : undefined,
          limit: 100,
        }),
        obtenerMetricasCitaciones({
          fecha_desde: fechaDesde || undefined,
          fecha_hasta: fechaHasta || undefined,
        }),
      ])

      if (resCitaciones.status === 'fulfilled' && resCitaciones.value?.data) {
        setCitaciones(resCitaciones.value.data)
      } else {
        setCitaciones([])
      }

      if (resMetricas.status === 'fulfilled' && resMetricas.value) {
        setMetricas(resMetricas.value)
      }
    } catch (err) {
      console.error('Error al cargar citaciones formativas:', err)
      setError('Error al consultar citaciones formativas. Por favor intente más tarde.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [filtroEstado, fechaDesde, fechaHasta])

  // Filtrado reactivo en memoria para búsqueda de texto y motivo
  const citacionesFiltradas = useMemo(() => {
    return citaciones.filter((c) => {
      // Filtro de texto (folio, estudiante o apoderado)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase()
        const folio = (c.folio || '').toLowerCase()
        const estNombre = `${c.estudiantes?.nombre || ''} ${c.estudiantes?.apellido || ''}`.toLowerCase()
        const apodNombre = `${c.apoderados?.nombre || ''} ${c.apoderados?.apellido || ''}`.toLowerCase()
        const motivo = (c.motivo_detalle || '').toLowerCase()

        const coincide =
          folio.includes(term) ||
          estNombre.includes(term) ||
          apodNombre.includes(term) ||
          motivo.includes(term)

        if (!coincide) return false
      }

      // Filtro por motivo_categoria
      if (filtroMotivo !== 'todos' && c.motivo_categoria !== filtroMotivo) {
        return false
      }

      return true
    })
  }, [citaciones, searchTerm, filtroMotivo])

  const handleDescargarActa = async (citacionId, folio) => {
    try {
      setDescargandoId(citacionId)
      await descargarActaCitacionPdf(citacionId, folio)
    } catch (err) {
      console.error('Error al descargar acta:', err)
    } finally {
      setDescargandoId(null)
    }
  }

  const handleDescargarIcs = (cit) => {
    descargarArchivoIcs({
      folio: cit.folio,
      estudianteNombre: `${cit.estudiantes?.nombre || ''} ${cit.estudiantes?.apellido || ''}`.trim(),
      motivoDetalle: cit.motivo_detalle,
      fechaHoraProgramada: cit.fecha_hora_programada,
      lugarEntrevista: cit.lugar_entrevista,
      modalidad: cit.modalidad,
      enlaceVirtual: cit.enlace_virtual,
    })
  }

  const handleResetFiltros = () => {
    setSearchTerm('')
    setFiltroEstado('todos')
    setFiltroMotivo('todos')
    setFechaDesde('')
    setFechaHasta('')
  }

  const renderBadgeEstado = (estado) => {
    const map = {
      programada: { label: 'Programada', bg: 'bg-amber-100 text-amber-800 border-amber-200' },
      confirmada: { label: 'Confirmada', bg: 'bg-blue-100 text-blue-800 border-blue-200' },
      realizada: { label: 'Realizada', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      reprogramacion_solicitada: { label: 'Reprogramada', bg: 'bg-purple-100 text-purple-800 border-purple-200' },
      justificada: { label: 'Justificada', bg: 'bg-slate-100 text-slate-800 border-slate-200' },
      no_asiste: { label: 'No Asiste', bg: 'bg-rose-100 text-rose-800 border-rose-200' },
      cancelada: { label: 'Cancelada', bg: 'bg-gray-100 text-gray-700 border-gray-200' },
    }
    const c = map[estado] || { label: estado, bg: 'bg-gray-100 text-gray-700' }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${c.bg}`}>
        {c.label}
      </span>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto" data-testid="citaciones-page">
        {/* CABECERA PRINCIPAL MODERNA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <CalendarCheck className="w-3.5 h-3.5" />
                Convivencia y Familia
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {citaciones.length} citacion{citaciones.length !== 1 ? 'es' : ''} activa{citaciones.length !== 1 ? 's' : ''}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Bandeja de Citaciones Formativas
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setShowNuevaModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Programar Citación</span>
          </button>
        </div>

        {/* TARJETAS DE KPIS ANALÍTICOS (ESTILO LIMPIO CON SQUIRCLES) */}
        {metricas && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4" data-testid="kpis-citaciones">
            {/* KPI 1: Total */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Total Citaciones
                </span>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {metricas.totales?.total_convocadas || citaciones.length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 2: Asistencia Efectiva */}
            <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">
                  Asistencia Efectiva
                </span>
                <p className="text-2xl font-black text-emerald-800 dark:text-emerald-300 mt-1">
                  {metricas.tasas?.asistencia_efectiva || 0}%
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 3: Adherencia Móvil */}
            <div className="p-4 rounded-2xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/40 dark:bg-blue-950/20 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-blue-800 dark:text-blue-400 uppercase tracking-wider block">
                  Adherencia Móvil
                </span>
                <p className="text-2xl font-black text-blue-800 dark:text-blue-300 mt-1">
                  {metricas.tasas?.adherencia_parental || 0}%
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center text-blue-700 dark:text-blue-300 shrink-0">
                <Users className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 4: Efectividad Acuerdos */}
            <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-400 uppercase tracking-wider block">
                  Efectividad Acuerdos
                </span>
                <p className="text-2xl font-black text-indigo-800 dark:text-indigo-300 mt-1">
                  {metricas.tasas?.efectividad_acuerdos || 0}%
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center text-indigo-700 dark:text-indigo-300 shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
            </div>
          </div>
        )}

        {/* BARRA DE FILTROS ESTILO INCIDENTES/PROTOCOLOS */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs space-y-3.5">
          {/* Píldoras de Estado Rápido */}
          <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 dark:border-slate-700/60 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Estado:
            </span>
            {ESTADOS_PILLS.map((pill) => {
              const isSelected = filtroEstado === pill.key
              return (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => setFiltroEstado(pill.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {pill.label}
                </button>
              )
            })}

            {/* Select nativo sincronizado para compatibilidad con accesibilidad y tests */}
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              aria-label="Filtrar por estado"
              className="sr-only"
            >
              <option value="todos">Todos los Estados</option>
              <option value="programada">Programadas</option>
              <option value="confirmada">Confirmadas</option>
              <option value="realizada">Realizadas con Acuerdos</option>
              <option value="reprogramacion_solicitada">Reprogramación Solicitada</option>
              <option value="justificada">Justificadas</option>
              <option value="no_asiste">No Asiste</option>
              <option value="cancelada">Canceladas</option>
            </select>
          </div>

          {/* Buscador de texto y selects compactos */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Buscador */}
            <div className="relative md:col-span-5">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por folio, estudiante o apoderado..."
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Categoría Formativa */}
            <div className="md:col-span-3">
              <select
                value={filtroMotivo}
                onChange={(e) => setFiltroMotivo(e.target.value)}
                aria-label="Filtrar por categoría formativa"
                className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todas las Categorías</option>
                {Object.entries(CATEGORIAS_FORMATIVAS).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Rango de fechas compacto */}
            <div className="md:col-span-4 flex items-center gap-2">
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                title="Fecha desde"
                className="w-1/2 px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              />
              <span className="text-slate-400 text-xs">a</span>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                title="Fecha hasta"
                className="w-1/2 px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              />
              {(searchTerm || filtroEstado !== 'todos' || filtroMotivo !== 'todos' || fechaDesde || fechaHasta) && (
                <button
                  type="button"
                  onClick={handleResetFiltros}
                  title="Restablecer Filtros"
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition shrink-0"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="sr-only">Restablecer Filtros</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* LISTADO / TABLA DE CITACIONES */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Cargando citaciones formativas...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-600 space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto" />
              <p className="text-sm font-semibold">{error}</p>
              <button
                type="button"
                onClick={cargarDatos}
                className="text-xs underline text-blue-600 hover:text-blue-700"
              >
                Reintentar
              </button>
            </div>
          ) : citacionesFiltradas.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No se encontraron citaciones
              </p>
              <p className="text-xs text-slate-400">
                Intente ajustar los filtros de búsqueda o registre una nueva citación formativa.
              </p>
              <button
                type="button"
                onClick={handleResetFiltros}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Restablecer Filtros
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Folio</th>
                    <th className="py-3.5 px-4">Estudiante / Curso</th>
                    <th className="py-3.5 px-4">Apoderado Titular</th>
                    <th className="py-3.5 px-4">Propósito</th>
                    <th className="py-3.5 px-4">Fecha / Modalidad</th>
                    <th className="py-3.5 px-4">Estado</th>
                    <th className="py-3.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {citacionesFiltradas.map((cit) => {
                    const est = cit.estudiantes || cit.estudiante || {}
                    const apod = cit.apoderados || cit.apoderado || {}
                    const catInfo = CATEGORIAS_FORMATIVAS[cit.motivo_categoria] || {}

                    return (
                      <tr
                        key={cit.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-750/50 transition-colors"
                      >
                        {/* Folio */}
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {cit.folio || 'CIT-2026-XXXX'}
                        </td>

                        {/* Estudiante y Curso */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs shrink-0">
                              {est.nombre?.[0] || 'E'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">
                                {est.nombre} {est.apellido}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {est.cursos?.nombre || est.curso?.nombre || est.curso || 'Sin curso'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Apoderado */}
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-900 dark:text-white">
                            {apod.nombre} {apod.apellido}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {apod.telefono || apod.email || 'Sin datos de contacto'}
                          </p>
                        </td>

                        {/* Propósito */}
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            {catInfo.label || cit.motivo_categoria}
                          </span>
                          <p className="text-[11px] text-slate-400 truncate max-w-[200px]" title={cit.motivo_detalle}>
                            {cit.motivo_detalle}
                          </p>
                        </td>

                        {/* Fecha y Modalidad */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              {new Date(cit.fecha_hora_programada).toLocaleString('es-CL', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            {cit.modalidad === 'virtual' ? (
                              <>
                                <Video className="w-3 h-3 text-blue-500" />
                                <span>Online</span>
                              </>
                            ) : (
                              <>
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span>{cit.lugar_entrevista || 'Presencial'}</span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Estado */}
                        <td className="py-3 px-4">{renderBadgeEstado(cit.estado)}</td>

                        {/* Acciones */}
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Botón calendario ICS */}
                            <button
                              type="button"
                              onClick={() => handleDescargarIcs(cit)}
                              title="Guardar evento en calendario (.ics)"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                            >
                              <Calendar className="w-4 h-4" />
                            </button>

                            {/* Botón Entrevista (cuando está programada o confirmada) */}
                            {cit.estado !== 'realizada' && cit.estado !== 'cancelada' && (
                              <button
                                type="button"
                                onClick={() => setCitacionEntrevista(cit)}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 transition flex items-center gap-1"
                              >
                                <FileCheck className="w-3.5 h-3.5" />
                                <span>Realizar Entrevista</span>
                              </button>
                            )}

                            {/* Botón Acta Oficial PDF (cuando ya está realizada) */}
                            {cit.estado === 'realizada' && (
                              <button
                                type="button"
                                onClick={() => handleDescargarActa(cit.id, cit.folio)}
                                disabled={descargandoId === cit.id}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-800 transition flex items-center gap-1"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>{descargandoId === cit.id ? 'Descargando...' : 'Acta Oficial PDF'}</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL 1: PROGRAMAR NUEVA CITACIÓN */}
        {showNuevaModal && (
          <NuevaCitacionModal
            isOpen={showNuevaModal}
            onClose={() => setShowNuevaModal(false)}
            onSuccess={() => {
              setShowNuevaModal(false)
              cargarDatos()
            }}
          />
        )}

        {/* MODAL 2: ENTREVISTA Y REGISTRO DE ACUERDOS */}
        {citacionEntrevista && (
          <EntrevistaCitacionModal
            isOpen={Boolean(citacionEntrevista)}
            onClose={() => setCitacionEntrevista(null)}
            citacion={citacionEntrevista}
            onSuccess={() => {
              setCitacionEntrevista(null)
              cargarDatos()
            }}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
