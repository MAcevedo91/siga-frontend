import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getIncidentes } from '@/services/incidentesService'
import { searchIncidentes } from '@/services/searchService'
import { useAuth } from '@/store/useAuthStore'
import DashboardLayout from '@/components/layout/DashboardLayout'
import TableSkeleton from '@/components/shared/TableSkeleton'
import Breadcrumbs from '@/components/shared/Breadcrumbs'
import Pagination from '@/components/shared/Pagination'
import SearchBar from '@/components/search/SearchBar'
import { AlertTriangle, Plus, FileDown, FileText, Filter, X, Calendar } from 'lucide-react'
import { exportIncidentesToExcel, exportIncidentesToPDF } from '@/utils/exportUtils'

export default function IncidentesPageMejorada() {
  const navigate = useNavigate()
  const [incidentes, setIncidentes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [estadoFilter, setEstadoFilter] = useState('')
  const [gravedadFilter, setGravedadFilter] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const itemsPerPage = 20
  const { user } = useAuth()

  const canCreate = ['Administrador', 'Equipo de Formación', 'Inspector'].includes(user?.rol)

  useEffect(() => {
    loadIncidentes()
  }, [estadoFilter, gravedadFilter, fechaDesde, fechaHasta])

  useEffect(() => {
    setCurrentPage(1)
  }, [estadoFilter, gravedadFilter, fechaDesde, fechaHasta])

  const handleSearch = async (query) => {
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
      if (fechaDesde) params.fecha_desde = fechaDesde
      if (fechaHasta) params.fecha_hasta = fechaHasta
      const data = await getIncidentes(params)
      setIncidentes(data)
      toast.success(`${data.length} incidentes cargados`)
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
      Abierto: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30',
      'En Investigación': 'bg-gradient-to-r from-yellow-500 to-orange-400 text-white shadow-lg shadow-yellow-500/30',
      Resuelto: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30',
      Cerrado: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg shadow-gray-400/30',
    }
    return styles[estado] || 'bg-gray-100 text-gray-800'
  }

  const handleExportExcel = () => {
    exportIncidentesToExcel(paginatedIncidentes)
    toast.success('Exportado a Excel exitosamente')
  }

  const handleExportPDF = () => {
    exportIncidentesToPDF(paginatedIncidentes)
    toast.success('Exportado a PDF exitosamente')
  }

  const clearFilters = () => {
    setEstadoFilter('')
    setGravedadFilter('')
    setFechaDesde('')
    setFechaHasta('')
    setSearchResults(null)
    toast.success('Filtros limpiados')
  }

  const hasActiveFilters = estadoFilter || gravedadFilter || fechaDesde || fechaHasta
  const filterCount = [estadoFilter, gravedadFilter, fechaDesde, fechaHasta].filter(Boolean).length

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

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Estado</label>
                <select
                  value={estadoFilter}
                  onChange={(e) => setEstadoFilter(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  <option value="Abierto">Abierto</option>
                  <option value="En Investigación">En Investigación</option>
                  <option value="Resuelto">Resuelto</option>
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

        {loading ? (
          <TableSkeleton rows={10} columns={6} />
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
                        Estudiante
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Gravedad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Descripción
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
                            {new Date(incidente.fecha).toLocaleDateString('es-CL')}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {incidente.estudiante?.nombre || ''} {incidente.estudiante?.apellido || ''}
                          </div>
                          <div className="text-xs text-gray-500">{incidente.estudiante?.rut || ''}</div>
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
                          <div className="text-sm text-gray-600 truncate">{incidente.descripcion}</div>
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
                totalItems={incidentes.length}
              />
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
