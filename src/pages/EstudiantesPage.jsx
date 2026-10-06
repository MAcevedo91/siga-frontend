import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getEstudiantes } from '@/services/estudiantesService'
import { getIncidentes } from '@/services/incidentesService'
import { resumirIncidentesPorCurso } from '@/utils/cursosResumen'
import { searchEstudiantes } from '@/services/searchService'
import { useDebounce } from '@/hooks/useDebounce'
import ImportarEstudiantesModal from '@/components/estudiantes/ImportarEstudiantesModal'
import { useAuth } from '@/store/useAuthStore'
import DashboardLayout from '@/components/layout/DashboardLayout'
import TableSkeleton from '@/components/shared/TableSkeleton'
import Breadcrumbs from '@/components/shared/Breadcrumbs'
import SearchBar from '@/components/search/SearchBar'
import RiskBadge from '@/components/risk/RiskBadge'
import { Search, Upload, FileDown, FileText, X, Filter, ArrowUpRight, UserRound } from 'lucide-react'
import { exportEstudiantesToExcel, exportEstudiantesToPDF } from '@/utils/exportUtils'
import api from '@/services/api'

export default function EstudiantesPageMejorada() {
  const [estudiantes, setEstudiantes] = useState([])
  const [filteredEstudiantes, setFilteredEstudiantes] = useState([])
  const [cursos, setCursos] = useState([])
  const [incidentesCurso, setIncidentesCurso] = useState(null)
  const [errorIndicadores, setErrorIndicadores] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [cursoFilter, setCursoFilter] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [riskScores, setRiskScores] = useState({})
  const [loadingRisks, setLoadingRisks] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  const debouncedSearch = useDebounce(searchTerm, 300)

  const canWrite = ['Administrador', 'Equipo de Formación'].includes(user?.rol)

  useEffect(() => {
    loadEstudiantes()
    loadCursos()
    loadIncidentesCurso()
  }, [])

  useEffect(() => {
    filterEstudiantes()
  }, [debouncedSearch, cursoFilter, estudiantes])

  const loadCursos = async () => {
    try {
      const response = await api.get('/cursos')
      if (response.data?.data) {
        setCursos(response.data.data)
      }
    } catch (err) {
      console.error('Error cargando cursos:', err)
    }
  }

  const loadIncidentesCurso = async () => {
    try {
      const anio = new Date().getFullYear()
      const data = await getIncidentes({
        fecha_desde: `${anio}-01-01`,
        fecha_hasta: `${anio}-12-31`,
      })
      setIncidentesCurso(data)
      setErrorIndicadores(false)
    } catch (err) {
      console.error('Error cargando indicadores por curso:', err)
      setErrorIndicadores(true)
    }
  }

  const loadEstudiantes = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getEstudiantes()
      setEstudiantes(data)

      // Load risk scores
      loadRiskScores(data)
    } catch (err) {
      setError('Error al cargar estudiantes')
      toast.error('Error al cargar estudiantes')
    } finally {
      setLoading(false)
    }
  }

  const loadRiskScores = async (estudiantesList) => {
    try {
      setLoadingRisks(true)

      // OPTIMIZATION: Use batch endpoint to fetch all risk scores in ONE request
      const { data: estudiantesConRiesgo } = await api.get('/riesgo/estudiantes')

      // Map risk scores by student ID
      const scores = {}
      for (const estudiante of estudiantesConRiesgo) {
        scores[estudiante.id] = estudiante.riesgo
      }

      setRiskScores(scores)
    } catch (error) {
      console.error('Error loading risk scores:', error)
    } finally {
      setLoadingRisks(false)
    }
  }

  const handleSearch = async (query) => {
    if (!query) {
      setSearchResults(null)
      return
    }

    try {
      setSearching(true)
      const results = await searchEstudiantes(query)
      setSearchResults(results)
    } catch (error) {
      toast.error('Error en búsqueda')
      console.error('Search error:', error)
    } finally {
      setSearching(false)
    }
  }

  const filterEstudiantes = () => {
    let filtered = [...estudiantes]

    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase()
      filtered = filtered.filter(
        (e) =>
          e.nombre?.toLowerCase().includes(searchLower) ||
          e.apellido?.toLowerCase().includes(searchLower) ||
          e.rut?.toLowerCase().includes(searchLower)
      )
    }

    if (cursoFilter) {
      filtered = filtered.filter((e) => String(e.curso_id || e.curso?.id) === String(cursoFilter))
    }

    setFilteredEstudiantes(filtered)
  }

  const handleImportSuccess = (resumen) => {
    loadEstudiantes()
    toast.success(
      `Importación completada: ${resumen.importados} importados, ${resumen.actualizados} actualizados`,
      { duration: 5000 }
    )
    if (resumen.errores > 0) {
      toast.error(`${resumen.errores} registros con errores`, { duration: 5000 })
    }
  }

  const handleVerPerfil = (id) => {
    navigate(`/estudiantes/${id}`)
  }

  const handleExportExcel = () => {
    exportEstudiantesToExcel(filteredEstudiantes)
    toast.success('Exportado a Excel exitosamente')
  }

  const handleExportPDF = () => {
    exportEstudiantesToPDF(filteredEstudiantes)
    toast.success('Exportado a PDF exitosamente')
  }

  const clearFilters = () => {
    setSearchTerm('')
    setCursoFilter('')
    setSearchResults(null)
    toast.success('Filtros limpiados')
  }

  const hasActiveFilters = searchTerm || cursoFilter
  const displayEstudiantes = searchResults || filteredEstudiantes

  const anioActual = new Date().getFullYear()
  const cursosDisponibles = cursos.length > 0 ? cursos.filter((curso) => !curso.anio_academico || Number(curso.anio_academico) === anioActual) : Array.from(
    new Map(
      estudiantes
        .filter((e) => (e.curso?.id || e.curso_id) && (e.curso?.nombre || e.curso_nombre))
        .map((e) => [e.curso?.id || e.curso_id, { id: e.curso?.id || e.curso_id, nombre: e.curso?.nombre || e.curso_nombre }])
    ).values()
  )

  const resumenPorCurso = incidentesCurso ? resumirIncidentesPorCurso(estudiantes, incidentesCurso, anioActual) : {}
  const cursoSeleccionado = cursosDisponibles.find((curso) => String(curso.id) === String(cursoFilter))

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="rounded-lg bg-red-50 p-6 text-center">
            <p className="text-red-800 mb-4">{error}</p>
            <button
              onClick={loadEstudiantes}
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
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <Breadcrumbs items={[{ label: 'Estudiantes' }]} />

        {cursoSeleccionado && (
          <button
            type="button"
            onClick={() => { setCursoFilter(''); setSearchResults(null) }}
            className="mb-4 text-sm font-semibold text-blue-700 hover:underline dark:text-blue-300"
          >
            ← Volver a cursos
          </button>
        )}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{cursoSeleccionado ? `Estudiantes de ${cursoSeleccionado.nombre}` : 'Cursos y estudiantes'}</h1>
            <p className="mt-1 text-sm text-gray-600">
              {loading ? (
                <span className="inline-block w-20 h-4 bg-gray-200 rounded animate-pulse"></span>
              ) : (
                <>
                  {displayEstudiantes.length} estudiante{displayEstudiantes.length !== 1 ? 's' : ''}
                  {(hasActiveFilters || searchResults) && ` (${estudiantes.length} total)`}
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
                  {(searchTerm ? 1 : 0) + (cursoFilter ? 1 : 0)}
                </span>
              )}
            </button>

            {displayEstudiantes.length > 0 && (
              <>
                <button
                  onClick={handleExportExcel}
                  data-testid="export-excel-button"
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

            {canWrite && (
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Importar
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4 shadow-sm animate-in slide-in-from-top duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filtros de búsqueda
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Búsqueda de texto completo
                </label>
                <SearchBar
                  onSearch={handleSearch}
                  placeholder="Buscar estudiante (nombre, RUT, apoderado)..."
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

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Filtrar por curso</label>
                <select
                  value={cursoFilter}
                  onChange={(e) => setCursoFilter(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Todos los cursos</option>
                  {cursosDisponibles.map((curso) => (
                    <option key={curso.id} value={curso.id}>
                      {curso.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <TableSkeleton rows={8} columns={5} />
        ) : !cursoFilter && !searchResults ? (
          cursosDisponibles.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              No hay cursos disponibles para este año escolar.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {cursosDisponibles.map((curso, index) => {
                const cantidad = estudiantes.filter((estudiante) => String(estudiante.curso_id || estudiante.curso?.id) === String(curso.id)).length
                const indicadores = resumenPorCurso[curso.id] || { Leve: 0, Grave: 0, 'Gravísima': 0 }
                const profesor = curso.profesor_jefe
                const nombreProfesor = typeof profesor === 'string' ? profesor : profesor?.nombre
                const estilo = [
                  { barra: 'from-orange-400 via-orange-500 to-rose-500', cabecera: 'from-orange-50 to-rose-50 dark:from-orange-950/70 dark:to-gray-800', titulo: 'text-orange-700 dark:text-orange-300', avatar: 'bg-orange-500', borde: 'hover:border-orange-300 dark:hover:border-orange-500' },
                  { barra: 'from-fuchsia-500 via-pink-500 to-rose-500', cabecera: 'from-fuchsia-50 to-pink-50 dark:from-fuchsia-950/70 dark:to-gray-800', titulo: 'text-fuchsia-700 dark:text-fuchsia-300', avatar: 'bg-fuchsia-600', borde: 'hover:border-fuchsia-300 dark:hover:border-fuchsia-500' },
                  { barra: 'from-sky-400 via-cyan-500 to-teal-400', cabecera: 'from-sky-50 to-cyan-50 dark:from-sky-950/70 dark:to-gray-800', titulo: 'text-sky-700 dark:text-sky-300', avatar: 'bg-sky-500', borde: 'hover:border-sky-300 dark:hover:border-sky-500' },
                ][index % 3]
                return (
                  <button
                    type="button"
                    key={curso.id}
                    onClick={() => { setCursoFilter(String(curso.id)); setSearchResults(null) }}
                    className={`group overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-md shadow-gray-200/60 transition duration-200 hover:-translate-y-1 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:shadow-black/20 ${estilo.borde}`}
                  >
                    <span aria-hidden="true" className={`block h-2 bg-gradient-to-r ${estilo.barra}`} />
                    <span className={`block bg-gradient-to-br px-5 pb-6 pt-5 sm:px-6 ${estilo.cabecera}`}>
                      <span className="flex flex-wrap items-start justify-between gap-3">
                        <span className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${estilo.titulo}`}>{curso.nombre}</span>
                        <span className="rounded-full border border-white/80 bg-white/80 px-3 py-1 text-sm font-semibold text-gray-700 shadow-sm dark:border-gray-600 dark:bg-gray-900/70 dark:text-gray-200">{cantidad} {cantidad === 1 ? 'estudiante' : 'estudiantes'}</span>
                      </span>
                      <span className="mt-6 flex items-center gap-3">
                        <span aria-hidden="true" className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-md overflow-hidden ${estilo.avatar}`}>
                          {(typeof profesor === 'object' && profesor?.avatar_url) ? (
                            <img
                              src={profesor.avatar_url}
                              alt={nombreProfesor || 'Profesor jefe'}
                              className="h-full w-full object-cover"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <UserRound size={23} />
                          )}
                        </span>
                        <span className="min-w-0"><span className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-300">Profesor jefe: </span><span className="block truncate text-base font-bold text-gray-900 dark:text-white">{nombreProfesor || 'Sin asignar'}</span></span>
                      </span>
                    </span>
                    <span className="block px-5 pb-5 pt-4 sm:px-6">
                      <span className="mb-3 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Incidentes del año</span>
                      <span className="block">
                        {errorIndicadores ? (
                          <span className="text-sm text-gray-500 dark:text-gray-300">Indicadores no disponibles</span>
                        ) : incidentesCurso === null ? (
                          <span className="text-sm text-gray-500 dark:text-gray-300">Cargando indicadores…</span>
                        ) : (
                          <span className="grid grid-cols-3 gap-2">
                            {[
                              { gravedad: 'Leve', clases: 'bg-sky-100 text-sky-900 ring-sky-200 dark:bg-sky-900/70 dark:text-sky-100 dark:ring-sky-700' },
                              { gravedad: 'Grave', clases: 'bg-orange-100 text-orange-900 ring-orange-200 dark:bg-orange-900/70 dark:text-orange-100 dark:ring-orange-700' },
                              { gravedad: 'Gravísima', clases: 'bg-rose-100 text-rose-900 ring-rose-200 dark:bg-rose-900/70 dark:text-rose-100 dark:ring-rose-700' },
                            ].map(({ gravedad, clases }) => (
                              <span data-gravedad={gravedad} key={gravedad} className={`rounded-xl px-1 py-3 text-center ring-1 ${clases}`}>
                                <span className="block text-2xl font-extrabold leading-none">{indicadores[gravedad]}</span>
                                <span className="mt-1 block text-xs font-semibold">{gravedad}</span>
                              </span>
                            ))}
                          </span>
                        )}
                      </span>
                      <span className={`mt-4 flex items-center justify-end gap-1 text-sm font-semibold ${estilo.titulo}`}>Ver estudiantes <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
                    </span>
                  </button>
                )
              })}
            </div>
          )
        ) : displayEstudiantes.length === 0 ? (
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {hasActiveFilters ? 'No se encontraron resultados' : 'No hay estudiantes registrados'}
            </h3>
            <p className="text-sm text-gray-500">
              {hasActiveFilters
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Comienza importando estudiantes desde un archivo Excel o CSV'}
            </p>
          </div>
        ) : (
          <div
            className={`overflow-hidden rounded-lg bg-white shadow transition-opacity duration-200 ${
              loading ? 'opacity-50' : 'opacity-100'
            }`}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      RUT
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Nombre Completo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Curso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Riesgo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Apoderado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {displayEstudiantes.map((estudiante) => (
                    <tr key={estudiante.id} className="hover:bg-gray-50 transition-colors">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm font-mono text-gray-900">{estudiante.rut}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {estudiante.nombre} {estudiante.apellido}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-600">{estudiante.curso?.nombre || 'Sin curso'}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {loadingRisks ? (
                          <div className="w-20 h-5 bg-gray-200 rounded animate-pulse"></div>
                        ) : riskScores[estudiante.id] ? (
                          <RiskBadge
                            level={riskScores[estudiante.id].level}
                            score={riskScores[estudiante.id].score}
                          />
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-600">{estudiante.apoderado?.nombre || 'Sin apoderado'}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <button
                          onClick={() => handleVerPerfil(estudiante.id)}
                          className="text-blue-600 hover:text-blue-900 transition-colors font-medium"
                        >
                          Ver Perfil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {canWrite && (
          <ImportarEstudiantesModal
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            onSuccess={handleImportSuccess}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
