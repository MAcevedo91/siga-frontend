import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getIncidentes } from '@/services/incidentesService'
import { getCursos } from '@/services/cursosService'
import { searchIncidentes } from '@/services/searchService'
import { useAuth } from '@/store/useAuthStore'
import DashboardLayout from '@/components/layout/DashboardLayout'
import TableSkeleton from '@/components/shared/TableSkeleton'
import Breadcrumbs from '@/components/shared/Breadcrumbs'
import Pagination from '@/components/shared/Pagination'
import SearchBar from '@/components/search/SearchBar'
import DlpSensitiveText from '@/components/dlp/DlpSensitiveText'
import { AlertTriangle, Plus, FileDown, FileText, Filter, X, Calendar } from 'lucide-react'
import { exportIncidentesToExcel, exportIncidentesToPDF } from '@/utils/exportUtils'
import { formatDate } from '@/utils/formatDate'
import { ROLES_CREACION_INCIDENTES } from '@/constants/roles'

export default function IncidentesPageMejorada() {
  const navigate = useNavigate()
  const [incidentes, setIncidentes] = useState([])
  const [cursos, setCursos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [estadoFilter, setEstadoFilter] = useState('')
  const [gravedadFilter, setGravedadFilter] = useState('')
  const [cursoFilter, setCursoFilter] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const itemsPerPage = 20
  const { user } = useAuth()

  const canCreate = ROLES_CREACION_INCIDENTES.includes(user?.rol)

  useEffect(() => {
    async function loadCursosList() {
      try {
        const data = await getCursos()
        setCursos(data || [])
      } catch (err) {
        console.error('Error al cargar cursos para filtros:', err)
      }
    }
    loadCursosList()
  }, [])

  useEffect(() => {
    loadIncidentes()
  }, [estadoFilter, gravedadFilter, cursoFilter, fechaDesde, fechaHasta])

  useEffect(() => {
    setCurrentPage(1)
  }, [estadoFilter, gravedadFilter, cursoFilter, fechaDesde, fechaHasta])

  const handleSearch = async (query) => {
    setCurrentPage(1)
    if (!query) {
      setSearchResults(null)
      return
    }

    try {
      setSearching(true)
      const results = await searchIncidentes(query)
      setSearchResults(results)
    } catch (error) {
      toast.error('Error en búsqueda')
      console.error('Search error:', error)
    } finally {
      setSearching(false)
    }
  }

  const loadIncidentes = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = {}
      if (estadoFilter) params.estado = estadoFilter
      if (gravedadFilter) params.gravedad = gravedadFilter
      if (cursoFilter) params.curso_id = cursoFilter
      if (fechaDesde) params.fecha_desde = fechaDesde
      if (fechaHasta) params.fecha_hasta = fechaHasta
      const data = await getIncidentes(params)
      setIncidentes(data)
    } catch (err) {
      setError('Error al cargar incidentes')
      toast.error('Error al cargar incidentes')
    } finally {
      setLoading(false)
    }
  }

  const getGravedadBadge = (gravedad) => {
    const styles = {
      Leve: 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30',
      Grave: 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30',
      Gravísima: 'bg-gradient-to-r from-red-600 to-purple-600 text-white shadow-lg shadow-red-600/40',
    }
    return styles[gravedad] || 'bg-gray-100 text-gray-800'
  }

  const getEstadoBadge = (estado) => {
    const styles = {
      'En Investigación': 'bg-gradient-to-r from-yellow-500 to-orange-400 text-white shadow-lg shadow-yellow-500/30',
      Derivado: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30',
      Cerrado: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg shadow-gray-400/30',
    }
    return styles[estado] || 'bg-gray-100 text-gray-800'
  }

  const handleExportExcel = () => {
    exportIncidentesToExcel(displayIncidentes)
    toast.success('Exportado a Excel exitosamente')
  }

  const handleExportPDF = () => {
    exportIncidentesToPDF(displayIncidentes)
    toast.success('Exportado a PDF exitosamente')
  }

  const clearFilters = () => {
    setEstadoFilter('')
    setGravedadFilter('')
    setCursoFilter('')
    setFechaDesde('')
    setFechaHasta('')
    setSearchResults(null)
    toast.success('Filtros limpiados')
  }

  const hasActiveFilters = Boolean(estadoFilter || gravedadFilter || cursoFilter || fechaDesde || fechaHasta)
  const filterCount = [estadoFilter, gravedadFilter, cursoFilter, fechaDesde, fechaHasta].filter(Boolean).length

  const displayIncidentes = searchResults || incidentes
  const totalPages = Math.ceil(displayIncidentes.length / itemsPerPage)
  const paginatedIncidentes = displayIncidentes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="rounded-lg bg-red-50 p-6 text-center">
            <p className="text-red-800 mb-4">{error}</p>
            <button
              onClick={loadIncidentes}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <Breadcrumbs items={[{ label: 'Incidentes' }]} />

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Registro de Incidentes</h1>
            <p className="mt-1 text-sm text-gray-600">
              {loading ? (
                <span className="inline-block w-20 h-4 bg-gray-200 rounded animate-pulse"></span>
              ) : (
                <>
                  {displayIncidentes.length} incidente{displayIncidentes.length !== 1 ? 's' : ''}
                  {(hasActiveFilters || searchResults) && ` (${incidentes.length} total)`}
                </>
              )}
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filtros
              {hasActiveFilters && (
                <span className="ml-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                  {filterCount}
                </span>
              )}
            </button>

            {displayIncidentes.length > 0 && (
              <>
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                  disabled={loading}
                >
                  <FileDown className="w-4 h-4" />
                  Excel
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                  disabled={loading}
                >
                  <FileText className="w-4 h-4" />
                  PDF
                </button>
              </>
            )}

            {canCreate && (
              <button
                onClick={() => navigate('/incidentes/nuevo')}
                data-testid="nuevo-incidente-button"
                className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nuevo Incidente
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4 shadow-sm animate-in slide-in-from-top duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filtros avanzados
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Limpiar filtros
                </button>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Búsqueda de texto completo
              </label>
              <SearchBar
                onSearch={handleSearch}
                placeholder="Buscar incidente (descripción, estudiante, testigos)..."
              />
              {searching && (
                <p className="text-xs text-gray-500 mt-1">Buscando...</p>
              )}
              {searchResults && (
                <p className="text-xs text-blue-600 mt-1">
                  {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} encontrado{searchResults.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Estado</label>
                <select
                  value={estadoFilter}
                  onChange={(e) => setEstadoFilter(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  <option value="En Investigación">En Investigación</option>
                  <option value="Derivado">Derivado</option>
                  <option value="Cerrado">Cerrado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Gravedad</label>
                <select
                  value={gravedadFilter}
                  onChange={(e) => setGravedadFilter(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Todas</option>
                  <option value="Leve">Leve</option>
                  <option value="Grave">Grave</option>
                  <option value="Gravísima">Gravísima</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Curso</label>
                <select
                  value={cursoFilter}
                  onChange={(e) => setCursoFilter(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Todos los cursos</option>
                  {cursos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Fecha desde</label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Fecha hasta</label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* FILTROS TIPO CÁPSULA (PILLS) PARA GRAVEDAD Y ESTADO CON SUS COLORES RESPECTIVOS */}
        <div className="mb-5 flex flex-col gap-3 bg-white dark:bg-gray-850 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xs">
          {/* Fila 1: Filtro de Gravedad */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mr-1">
              Gravedad:
            </span>
            {[
              {
                id: '',
                label: 'Todas',
                dot: 'bg-gray-400',
                inactivo: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
                activo: 'bg-gray-900 text-white border-gray-900 shadow-sm dark:bg-white dark:text-gray-900',
              },
              {
                id: 'Leve',
                label: 'Leve',
                dot: 'bg-cyan-500',
                inactivo: 'bg-cyan-50 text-cyan-800 border-cyan-200 hover:bg-cyan-100 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800',
                activo: 'bg-cyan-600 text-white border-cyan-600 shadow-sm',
              },
              {
                id: 'Grave',
                label: 'Grave',
                dot: 'bg-amber-500',
                inactivo: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
                activo: 'bg-amber-600 text-white border-amber-600 shadow-sm',
              },
              {
                id: 'Gravísima',
                label: 'Gravísima',
                dot: 'bg-rose-500',
                inactivo: 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
                activo: 'bg-rose-600 text-white border-rose-600 shadow-sm',
              },
            ].map((g) => {
              const isSelected = gravedadFilter === g.id
              return (
                <button
                  key={g.id || 'todas-g'}
                  type="button"
                  onClick={() => {
                    setGravedadFilter(isSelected && g.id !== '' ? '' : g.id)
                    setCurrentPage(1)
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all border ${
                    isSelected ? g.activo : g.inactivo
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${isSelected ? 'bg-white' : g.dot}`} />
                  <span>{g.label}</span>
                  {isSelected && g.id !== '' && <X className="w-3 h-3 ml-0.5" />}
                </button>
              )
            })}
          </div>

          {/* Fila 2: Filtro de Estado */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mr-1">
              Estado:
            </span>
            {[
              {
                id: '',
                label: 'Todos',
                dot: 'bg-gray-400',
                inactivo: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
                activo: 'bg-gray-900 text-white border-gray-900 shadow-sm dark:bg-white dark:text-gray-900',
              },
              {
                id: 'En Investigación',
                label: 'En Investigación',
                dot: 'bg-yellow-500',
                inactivo: 'bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-950/60 dark:text-yellow-300 dark:border-yellow-800',
                activo: 'bg-yellow-600 text-white border-yellow-600 shadow-sm',
              },
              {
                id: 'Derivado',
                label: 'Derivado',
                dot: 'bg-indigo-500',
                inactivo: 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
                activo: 'bg-indigo-600 text-white border-indigo-600 shadow-sm',
              },
              {
                id: 'Cerrado',
                label: 'Cerrado',
                dot: 'bg-slate-500',
                inactivo: 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-800',
                activo: 'bg-slate-700 text-white border-slate-700 shadow-sm',
              },
            ].map((e) => {
              const isSelected = estadoFilter === e.id
              return (
                <button
                  key={e.id || 'todos-e'}
                  type="button"
                  onClick={() => {
                    setEstadoFilter(isSelected && e.id !== '' ? '' : e.id)
                    setCurrentPage(1)
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all border ${
                    isSelected ? e.activo : e.inactivo
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${isSelected ? 'bg-white' : e.dot}`} />
                  <span>{e.label}</span>
                  {isSelected && e.id !== '' && <X className="w-3 h-3 ml-0.5" />}
                </button>
              )
            })}

            {(gravedadFilter || estadoFilter) && (
              <button
                type="button"
                onClick={() => {
                  setGravedadFilter('')
                  setEstadoFilter('')
                  setCurrentPage(1)
                }}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline font-medium ml-2"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={10} columns={7} />
        ) : displayIncidentes.length === 0 ? (
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {hasActiveFilters ? 'No se encontraron incidentes' : 'No hay incidentes registrados'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {hasActiveFilters
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Comienza registrando el primer incidente del sistema'}
            </p>
            {canCreate && !hasActiveFilters && (
              <button
                onClick={() => navigate('/incidentes/nuevo')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Registrar Primer Incidente
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-lg bg-white shadow">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Estudiante(s)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Curso
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Gravedad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Relato / Descripción
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {paginatedIncidentes.map((incidente) => (
                      <tr key={incidente.id} className="hover:bg-gray-50 transition-colors">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm text-gray-900 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {formatDate(incidente.fecha)}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {incidente.estudiantes && incidente.estudiantes.length > 0 ? (
                            <div className="flex flex-col gap-2">
                              {incidente.estudiantes.map((est, idx) => (
                                <div key={est.id || idx} className="text-sm">
                                  <div className="font-semibold text-gray-900 leading-tight">
                                    <DlpSensitiveText tipo="nombre">
                                      {`${est.nombre || ''} ${est.apellido || ''}`.trim() || 'Estudiante'}
                                    </DlpSensitiveText>
                                  </div>
                                  {est.rut && (
                                    <div className="text-xs text-gray-400 font-mono mt-0.5">
                                      <DlpSensitiveText tipo="rut">{est.rut}</DlpSensitiveText>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : incidente.estudiante ? (
                            <div className="text-sm">
                              <div className="font-semibold text-gray-900">
                                <DlpSensitiveText tipo="nombre">
                                  {`${incidente.estudiante.nombre || ''} ${incidente.estudiante.apellido || ''}`.trim() || 'Estudiante'}
                                </DlpSensitiveText>
                              </div>
                              {incidente.estudiante.rut && (
                                <div className="text-xs text-gray-400 font-mono mt-0.5">
                                  <DlpSensitiveText tipo="rut">{incidente.estudiante.rut}</DlpSensitiveText>
                                </div>
                              )}
                            </div>
                          ) : incidente.estudiantes_count !== undefined ? (
                            <div className="text-sm font-medium text-gray-900">
                              {incidente.estudiantes_count} estudiante(s)
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">-</div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {incidente.estudiantes && incidente.estudiantes.length > 0 ? (
                            <div className="flex flex-col gap-1.5">
                              {Array.from(new Set(
                                incidente.estudiantes
                                  .map(e => e.cursos?.nombre || e.curso)
                                  .filter(Boolean)
                              )).map((cursoNombre, cIdx) => (
                                <span
                                  key={cIdx}
                                  className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-gray-700 w-fit"
                                >
                                  {cursoNombre}
                                </span>
                              ))}
                              {incidente.estudiantes.every(e => !(e.cursos?.nombre || e.curso)) && (
                                <span className="text-xs text-gray-400">Sin curso</span>
                              )}
                            </div>
                          ) : incidente.estudiante?.cursos?.nombre || incidente.estudiante?.curso ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-gray-700 w-fit">
                              {incidente.estudiante.cursos?.nombre || incidente.estudiante.curso}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getGravedadBadge(incidente.gravedad)}`}>
                            {incidente.gravedad}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getEstadoBadge(incidente.estado)}`}>
                            {incidente.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <div className="text-sm text-gray-600 truncate" title={incidente.relato || incidente.descripcion}>
                            {incidente.relato || incidente.descripcion || '-'}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <button
                            onClick={() => navigate(`/incidentes/${incidente.id}`)}
                            className="text-blue-600 hover:text-blue-900 transition-colors font-medium"
                          >
                            Ver Detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={displayIncidentes.length}
              />
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
