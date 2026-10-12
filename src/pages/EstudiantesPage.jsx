import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getEstudiantes } from '@/services/estudiantesService'
import { getIncidentes } from '@/services/incidentesService'
import { resumirIncidentesPorCurso } from '@/utils/cursosResumen'
import { searchEstudiantes } from '@/services/searchService'
import { useDebounce } from '@/hooks/useDebounce'
import ImportarEstudiantesModal from '@/components/estudiantes/ImportarEstudiantesModal'
import AsignarProfesorModal from '@/components/estudiantes/AsignarProfesorModal'
import { useAuth } from '@/store/useAuthStore'
import DashboardLayout from '@/components/layout/DashboardLayout'
import TableSkeleton from '@/components/shared/TableSkeleton'
import Breadcrumbs from '@/components/shared/Breadcrumbs'
import SearchBar from '@/components/search/SearchBar'
import RiskBadge from '@/components/risk/RiskBadge'
import { Search, Upload, FileDown, FileText, X, Filter, ArrowUpRight, UserRound, Calendar, GraduationCap, FileSpreadsheet, Mail, LayoutGrid, List, Puzzle, Users, ShieldAlert } from 'lucide-react'
import { exportEstudiantesToExcel, exportEstudiantesToPDF } from '@/utils/exportUtils'
import api from '@/services/api'

const PALETA_CURSOS = [
  {
    barra: 'from-orange-400 via-orange-500 to-rose-500',
    cabecera: 'from-orange-50 to-rose-50 dark:from-orange-950/70 dark:to-gray-800',
    titulo: 'text-orange-700 dark:text-orange-300',
    avatar: 'bg-orange-500',
    borde: 'hover:border-orange-300 dark:hover:border-orange-500',
    heroBg: 'bg-gradient-to-br from-orange-50/80 via-white to-rose-50/50 dark:from-orange-950/30 dark:via-gray-800 dark:to-gray-800',
    heroBorder: 'border-orange-200/90 dark:border-orange-900/60',
    cardMatriculados: 'bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-orange-500/25',
    tagAnio: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
    botonVolver: 'text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300',
    botonAsignar: 'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-950/80 dark:text-orange-300 dark:hover:bg-orange-900',
  },
  {
    barra: 'from-fuchsia-500 via-pink-500 to-rose-500',
    cabecera: 'from-fuchsia-50 to-pink-50 dark:from-fuchsia-950/70 dark:to-gray-800',
    titulo: 'text-fuchsia-700 dark:text-fuchsia-300',
    avatar: 'bg-fuchsia-600',
    borde: 'hover:border-fuchsia-300 dark:hover:border-fuchsia-500',
    heroBg: 'bg-gradient-to-br from-fuchsia-50/80 via-white to-pink-50/50 dark:from-fuchsia-950/30 dark:via-gray-800 dark:to-gray-800',
    heroBorder: 'border-pink-200/90 dark:border-pink-900/60',
    cardMatriculados: 'bg-gradient-to-br from-fuchsia-600 to-pink-600 text-white shadow-fuchsia-600/25',
    tagAnio: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-950/60 dark:text-fuchsia-300 dark:border-fuchsia-800',
    botonVolver: 'text-fuchsia-600 hover:text-fuchsia-800 dark:text-fuchsia-400 dark:hover:text-fuchsia-300',
    botonAsignar: 'bg-fuchsia-100 text-fuchsia-800 hover:bg-fuchsia-200 dark:bg-fuchsia-950/80 dark:text-fuchsia-300 dark:hover:bg-fuchsia-900',
  },
  {
    barra: 'from-sky-400 via-cyan-500 to-teal-400',
    cabecera: 'from-sky-50 to-cyan-50 dark:from-sky-950/70 dark:to-gray-800',
    titulo: 'text-sky-700 dark:text-sky-300',
    avatar: 'bg-sky-500',
    borde: 'hover:border-sky-300 dark:hover:border-sky-500',
    heroBg: 'bg-gradient-to-br from-sky-50/80 via-white to-cyan-50/50 dark:from-sky-950/30 dark:via-gray-800 dark:to-gray-800',
    heroBorder: 'border-sky-200/90 dark:border-sky-900/60',
    cardMatriculados: 'bg-gradient-to-br from-sky-600 to-cyan-600 text-white shadow-sky-600/25',
    tagAnio: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
    botonVolver: 'text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300',
    botonAsignar: 'bg-sky-100 text-sky-800 hover:bg-sky-200 dark:bg-sky-950/80 dark:text-sky-300 dark:hover:bg-sky-900',
  },
]

export default function EstudiantesPageMejorada() {
  const [searchParams] = useSearchParams()
  const initialSearch = searchParams.get('search') || ''
  const initialCurso = searchParams.get('curso') || ''

  const [estudiantes, setEstudiantes] = useState([])
  const [filteredEstudiantes, setFilteredEstudiantes] = useState([])
  const [cursos, setCursos] = useState([])
  const [incidentesCurso, setIncidentesCurso] = useState(null)
  const [errorIndicadores, setErrorIndicadores] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [cursoFilter, setCursoFilter] = useState(initialCurso)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showAsignarProfesorModal, setShowAsignarProfesorModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [riskScores, setRiskScores] = useState({})
  const [loadingRisks, setLoadingRisks] = useState(false)
  const [anioSeleccionado, setAnioSeleccionado] = useState(null)
  const [vistaModo, setVistaModo] = useState('lista') // 'lista' | 'tarjetas'
  const [filtroSoloPie, setFiltroSoloPie] = useState(false)
  const [filtroRiesgo, setFiltroRiesgo] = useState('') // '' | 'alto' | 'medio' | 'bajo'
  const { user } = useAuth()
  const navigate = useNavigate()

  // Sincronizar parámetros de búsqueda y curso desde URL
  useEffect(() => {
    const sParam = searchParams.get('search')
    if (sParam !== null) {
      setSearchTerm(sParam)
    }
    const cParam = searchParams.get('curso')
    if (cParam !== null) {
      setCursoFilter(cParam)
    }
  }, [searchParams])

  const handleSelectCurso = (id) => {
    setCursoFilter(String(id))
    setSearchResults(null)
    navigate(`/estudiantes?curso=${id}`, { replace: true })
  }

  const handleVolverACursos = () => {
    setCursoFilter('')
    setSearchResults(null)
    setFiltroSoloPie(false)
    setFiltroRiesgo('')
    navigate('/estudiantes', { replace: true })
  }

  const debouncedSearch = useDebounce(searchTerm, 300)

  const canWrite = ['Administrador', 'Equipo de Formación'].includes(user?.rol)

  // Años lectivos disponibles según la oferta de cursos
  const aniosDisponibles = useMemo(() => {
    const aniosSet = new Set()
    cursos.forEach((c) => {
      if (c.anio_academico) aniosSet.add(Number(c.anio_academico))
    })
    const arr = Array.from(aniosSet).sort((a, b) => b - a)
    if (arr.length === 0) arr.push(new Date().getFullYear())
    return arr
  }, [cursos])

  useEffect(() => {
    if (aniosDisponibles.length > 0 && !anioSeleccionado) {
      setAnioSeleccionado(aniosDisponibles[0])
    }
  }, [aniosDisponibles, anioSeleccionado])

  useEffect(() => {
    loadEstudiantes()
    loadCursos()
  }, [])

  useEffect(() => {
    if (anioSeleccionado) {
      loadIncidentesCurso(anioSeleccionado)
    }
  }, [anioSeleccionado])

  useEffect(() => {
    filterEstudiantes()
  }, [debouncedSearch, cursoFilter, estudiantes, filtroSoloPie, filtroRiesgo, riskScores])

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

  const loadIncidentesCurso = async (anioObjetivo) => {
    try {
      const anio = anioObjetivo || new Date().getFullYear()
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

    if (cursoFilter === '__EGRESADOS__') {
      filtered = filtered.filter((e) => e.estado_matricula === 'Egresado')
    } else if (cursoFilter === '__RETIRADOS__') {
      filtered = filtered.filter((e) => e.estado_matricula === 'Retirado')
    } else if (cursoFilter) {
      filtered = filtered.filter((e) => String(e.curso_id || e.curso?.id) === String(cursoFilter))
    }

    if (filtroSoloPie) {
      filtered = filtered.filter((e) => e.es_pie === true || e.es_pie === 'true' || e.es_pie === 1)
    }

    if (filtroRiesgo) {
      filtered = filtered.filter((e) => {
        const r = riskScores[e.id]?.level?.toLowerCase()
        return r === filtroRiesgo.toLowerCase()
      })
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
    const cursoParam = cursoFilter ? `?curso=${cursoFilter}` : ''
    navigate(`/estudiantes/${id}${cursoParam}`)
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
    setFiltroSoloPie(false)
    setFiltroRiesgo('')
    setSearchResults(null)
    navigate('/estudiantes', { replace: true })
    toast.success('Filtros limpiados')
  }

  const hasActiveFilters = searchTerm || cursoFilter || filtroSoloPie || filtroRiesgo
  const displayEstudiantes = searchResults || filteredEstudiantes

  const anioVigente = anioSeleccionado || aniosDisponibles[0] || new Date().getFullYear()

  const cursosDisponibles = useMemo(() => {
    if (cursos.length === 0) {
      return Array.from(
        new Map(
          estudiantes
            .filter((e) => (e.curso?.id || e.curso_id) && (e.curso?.nombre || e.curso_nombre))
            .map((e) => [e.curso?.id || e.curso_id, { id: e.curso?.id || e.curso_id, nombre: e.curso?.nombre || e.curso_nombre }])
        ).values()
      )
    }
    return cursos.filter((curso) => !curso.anio_academico || Number(curso.anio_academico) === Number(anioVigente))
  }, [cursos, anioVigente, estudiantes])

  const resumenPorCurso = incidentesCurso ? resumirIncidentesPorCurso(estudiantes, incidentesCurso, anioVigente) : {}
  const cursoSeleccionado = cursosDisponibles.find((curso) => String(curso.id) === String(cursoFilter))

  const estiloCursoSeleccionado = useMemo(() => {
    if (!cursoSeleccionado) return PALETA_CURSOS[0]
    const index = cursosDisponibles.findIndex((c) => String(c.id) === String(cursoSeleccionado.id))
    return PALETA_CURSOS[index >= 0 ? index % PALETA_CURSOS.length : 0]
  }, [cursoSeleccionado, cursosDisponibles])

  const breadcrumbItems = cursoSeleccionado
    ? [
        { label: 'Cursos', onClick: handleVolverACursos },
        { label: 'Estudiantes' },
      ]
    : [{ label: 'Cursos' }]

  // Métricas específicas del curso seleccionado
  const metricasCurso = useMemo(() => {
    if (!cursoSeleccionado) return { total: 0, pie: 0, regulares: 0 }
    const alumnosDelCurso = estudiantes.filter(
      (e) => String(e.curso_id || e.curso?.id) === String(cursoSeleccionado.id)
    )
    const pieCount = alumnosDelCurso.filter(
      (e) => e.es_pie === true || e.es_pie === 'true' || e.es_pie === 1
    ).length
    return {
      total: alumnosDelCurso.length,
      pie: pieCount,
      regulares: alumnosDelCurso.length - pieCount,
    }
  }, [cursoSeleccionado, estudiantes])

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
        <Breadcrumbs items={breadcrumbItems} />

        {cursoSeleccionado ? (
          /* =========================================================================
             VISTA DETALLADA DEL CURSO: HERO BANNER + CONTROLES (Estilo imagen usuario)
             ========================================================================= */
          <div className="space-y-6 mb-6">
            {/* Botón Volver con breadcrumb contextual */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleVolverACursos}
                className={`inline-flex items-center gap-1.5 text-sm font-semibold transition-colors ${estiloCursoSeleccionado.botonVolver}`}
              >
                <span>← Volver a cursos</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Año lectivo:</span>
                <span className={`rounded-md px-2.5 py-1 text-xs font-bold border ${estiloCursoSeleccionado.tagAnio}`}>
                  {cursoSeleccionado.anio_academico || anioVigente}
                </span>
              </div>
            </div>

            {/* Banner Hero del Curso con la misma tonalidad de su tarjeta */}
            <div className={`overflow-hidden rounded-2xl border shadow-sm ${estiloCursoSeleccionado.heroBorder} ${estiloCursoSeleccionado.heroBg}`}>
              {/* Barra superior de acento idéntica a la tarjeta del curso */}
              <span aria-hidden="true" className={`block h-2 bg-gradient-to-r ${estiloCursoSeleccionado.barra}`} />

              <div className="p-5 sm:p-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  {/* Información del Profesor Jefe */}
                  <div className="flex items-start sm:items-center gap-4">
                    <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white shadow-md overflow-hidden ${estiloCursoSeleccionado.avatar}`}>
                      {typeof cursoSeleccionado.profesor_jefe === 'object' && cursoSeleccionado.profesor_jefe?.avatar_url ? (
                        <img
                          src={cursoSeleccionado.profesor_jefe.avatar_url}
                          alt="Profesor Jefe"
                          className="h-full w-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                      ) : (
                        <UserRound size={32} />
                      )}
                    </div>
                    <div>
                      <span className={`inline-block text-xs font-bold uppercase tracking-wider ${estiloCursoSeleccionado.titulo}`}>
                        Profesor Jefe • {cursoSeleccionado.nombre}
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                          {typeof cursoSeleccionado.profesor_jefe === 'string'
                            ? cursoSeleccionado.profesor_jefe
                            : cursoSeleccionado.profesor_jefe?.nombre || 'Sin profesor asignado'}
                        </h2>
                        {canWrite && (
                          <button
                            type="button"
                            onClick={() => setShowAsignarProfesorModal(true)}
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${estiloCursoSeleccionado.botonAsignar}`}
                          >
                            {cursoSeleccionado.profesor_jefe ? 'Cambiar Profesor' : '+ Asignar Profesor'}
                          </button>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>
                          {typeof cursoSeleccionado.profesor_jefe === 'object' && cursoSeleccionado.profesor_jefe?.email
                            ? cursoSeleccionado.profesor_jefe.email
                            : 'contacto@colegioelsalvador.cl'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Métricas destacadas del curso */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    {/* Tarjeta Alumnos Matriculados */}
                    <div className={`flex flex-1 sm:flex-initial min-w-[150px] items-center gap-3.5 rounded-xl px-4 py-3 shadow-md ${estiloCursoSeleccionado.cardMatriculados}`}>
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/20">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-2xl font-black leading-none">{metricasCurso.total}</div>
                        <div className="text-xs font-medium text-white/90 mt-1">Matriculados activos</div>
                      </div>
                    </div>

                    {/* Tarjeta Estudiantes PIE */}
                    <div className="flex flex-1 sm:flex-initial min-w-[150px] items-center gap-3.5 rounded-xl bg-purple-700 px-4 py-3 text-white shadow-md shadow-purple-700/20">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/20">
                      <Puzzle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-black leading-none">{metricasCurso.pie}</div>
                      <div className="text-xs font-medium text-purple-100 mt-1">Estudiantes con apoyo PIE</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Barra de Acciones y Filtros del Curso */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Buscador dentro del curso */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre, apellido o RUT..."
                  className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Botones de Vista (Lista / Tarjetas) y Exportación */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Selector Lista / Tarjetas */}
                <div className="flex items-center rounded-xl border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800">
                  <button
                    type="button"
                    onClick={() => setVistaModo('lista')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      vistaModo === 'lista'
                        ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Lista</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVistaModo('tarjetas')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      vistaModo === 'tarjetas'
                        ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Tarjetas</span>
                  </button>
                </div>

                {/* Botón Excel */}
                <button
                  type="button"
                  onClick={handleExportExcel}
                  data-testid="export-excel-button"
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>

                {/* Botón PDF */}
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </div>
            </div>

            {/* Chips de Filtrado Rápido */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setFiltroSoloPie(!filtroSoloPie)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all border ${
                  filtroSoloPie
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
                }`}
              >
                <Puzzle className="w-3.5 h-3.5" />
                <span>Solo PIE ({metricasCurso.pie})</span>
                {filtroSoloPie && <X className="w-3 h-3 ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => setFiltroRiesgo(filtroRiesgo === 'alto' ? '' : 'alto')}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all border ${
                  filtroRiesgo === 'alto'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span>Riesgo Alto</span>
                {filtroRiesgo === 'alto' && <X className="w-3 h-3 ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => setFiltroRiesgo(filtroRiesgo === 'medio' ? '' : 'medio')}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all border ${
                  filtroRiesgo === 'medio'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>Riesgo Medio</span>
                {filtroRiesgo === 'medio' && <X className="w-3 h-3 ml-0.5" />}
              </button>

              {(filtroSoloPie || filtroRiesgo || searchTerm) && (
                <button
                  type="button"
                  onClick={() => {
                    setFiltroSoloPie(false)
                    setFiltroRiesgo('')
                    setSearchTerm('')
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 underline font-medium ml-2 dark:text-gray-400"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        ) : (
          /* =========================================================================
             VISTA GENERAL: DIRECTORIO DE CURSOS
             ========================================================================= */
          <>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cursos y estudiantes</h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
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

              <div className="flex gap-2 flex-wrap items-center">
                {aniosDisponibles.length > 0 && (
                  <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 shadow-sm dark:border-gray-600 dark:bg-gray-800">
                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Año lectivo:</span>
                    <select
                      aria-label="Seleccionar año escolar"
                      value={anioVigente}
                      onChange={(e) => {
                        const nuevo = Number(e.target.value)
                        setAnioSeleccionado(nuevo)
                        setCursoFilter('')
                        setSearchResults(null)
                      }}
                      className="bg-transparent text-sm font-bold text-gray-900 dark:text-white focus:outline-none cursor-pointer"
                    >
                      {aniosDisponibles.map((a) => (
                        <option key={a} value={a} className="dark:bg-gray-800 text-gray-900 dark:text-white">
                          {a} {a === aniosDisponibles[0] ? '(Vigente)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
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
              <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4 shadow-sm animate-in slide-in-from-top duration-200 dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 dark:text-gray-300">
                    <Filter className="w-4 h-4" />
                    Filtros de búsqueda
                  </h3>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 dark:text-blue-400"
                    >
                      <X className="w-3 h-3" />
                      Limpiar filtros
                    </button>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2 dark:text-gray-400">
                      Búsqueda de texto completo
                    </label>
                    <SearchBar
                      onSearch={handleSearch}
                      placeholder="Buscar estudiante (nombre, RUT, apoderado)..."
                    />
                    {searching && (
                      <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">Buscando...</p>
                    )}
                    {searchResults && (
                      <p className="text-xs text-blue-600 mt-1 dark:text-blue-400">
                        {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} encontrado{searchResults.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2 dark:text-gray-400">Filtrar por curso</label>
                    <select
                      value={cursoFilter}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val) handleSelectCurso(val)
                        else handleVolverACursos()
                      }}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Todos los cursos</option>
                      {cursosDisponibles.map((curso) => (
                        <option key={curso.id} value={curso.id}>
                          {curso.nombre}
                        </option>
                      ))}
                      <option value="__EGRESADOS__">🎓 Egresados</option>
                      <option value="__RETIRADOS__">📁 Retirados</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {loading ? (
          <TableSkeleton rows={8} columns={5} />
        ) : !cursoFilter && !searchResults ? (
          cursosDisponibles.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-gradient-to-b from-blue-50/60 via-white to-gray-50/80 p-8 sm:p-12 text-center shadow-sm dark:border-blue-900/50 dark:from-gray-800 dark:via-gray-850 dark:to-gray-900">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-inner dark:bg-blue-950/80 dark:text-blue-400">
                <GraduationCap className="h-10 w-10 animate-bounce duration-1000" />
              </div>

              <h3 className="mt-5 text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
                Aún no hay cursos ni estudiantes registrados
              </h3>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                Los cursos y sus niveles se reconocen automáticamente al cargar la nómina de estudiantes. No necesitas crearlos manualmente uno a uno.
              </p>

              <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-50/80 px-3.5 py-1.5 text-xs font-medium text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                <FileSpreadsheet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Compatible con archivos Excel (.xlsx) y CSV con el formato oficial</span>
              </div>

              {canWrite && (
                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                  >
                    <Upload className="h-4 w-4" />
                    Cargar Nómina de Estudiantes (Excel)
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {cursosDisponibles.map((curso, index) => {
                const cantidad = estudiantes.filter((estudiante) => String(estudiante.curso_id || estudiante.curso?.id) === String(curso.id)).length
                const indicadores = resumenPorCurso[curso.id] || { Leve: 0, Grave: 0, 'Gravísima': 0 }
                const profesor = curso.profesor_jefe
                const nombreProfesor = typeof profesor === 'string' ? profesor : profesor?.nombre
                const estilo = PALETA_CURSOS[index % PALETA_CURSOS.length]
                return (
                  <button
                    type="button"
                    key={curso.id}
                    onClick={() => handleSelectCurso(curso.id)}
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
        ) : vistaModo === 'tarjetas' ? (
          /* =========================================================================
             VISTA EN TARJETAS (Grid de Estudiantes)
             ========================================================================= */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayEstudiantes.map((estudiante) => {
              const esPie = estudiante.es_pie === true || estudiante.es_pie === 'true' || estudiante.es_pie === 1
              const riesgo = riskScores[estudiante.id]

              return (
                <div
                  key={estudiante.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
                >
                  <div>
                    {/* Cabecera Tarjeta: Avatar y Badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-base font-bold text-white shadow-sm">
                        {estudiante.nombre?.charAt(0)}
                        {estudiante.apellido?.charAt(0)}
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        {esPie && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            <Puzzle className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                            PIE
                          </span>
                        )}

                        {riesgo ? (
                          <RiskBadge level={riesgo.level} score={riesgo.score} />
                        ) : (
                          <span className="text-xs text-gray-400">Sin riesgo</span>
                        )}
                      </div>
                    </div>

                    {/* Datos del Estudiante */}
                    <div className="mt-4">
                      <h4 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors dark:text-white dark:group-hover:text-blue-400">
                        {estudiante.nombre} {estudiante.apellido}
                      </h4>
                      <p className="font-mono text-xs text-gray-500 mt-0.5 dark:text-gray-400">{estudiante.rut}</p>
                    </div>

                    {/* Información adicional */}
                    <div className="mt-4 space-y-1.5 border-t border-gray-100 pt-3 text-xs text-gray-600 dark:border-gray-700/60 dark:text-gray-300">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Curso:</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {estudiante.curso?.nombre || 'Sin curso'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Apoderado:</span>
                        <span className="font-medium text-gray-700 truncate max-w-[140px] dark:text-gray-300" title={estudiante.apoderado?.nombre}>
                          {estudiante.apoderado?.nombre || 'Sin registrar'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botón Acción Ver Perfil */}
                  <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-700/60">
                    <button
                      type="button"
                      onClick={() => handleVerPerfil(estudiante.id)}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-50 py-2 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-600 hover:text-white dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:text-white"
                    >
                      <span>Ver Ficha del Estudiante</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* =========================================================================
             VISTA EN LISTA (Tabla de Estudiantes)
             ========================================================================= */
          <div
            className={`overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-opacity duration-200 dark:border-gray-700 dark:bg-gray-800 ${
              loading ? 'opacity-50' : 'opacity-100'
            }`}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50/80 dark:bg-gray-750">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      RUT
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Nombre Completo
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Curso
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Apoyo PIE
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Nivel de Riesgo
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Apoderado Titular
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                  {displayEstudiantes.map((estudiante) => {
                    const esPie = estudiante.es_pie === true || estudiante.es_pie === 'true' || estudiante.es_pie === 1

                    return (
                      <tr key={estudiante.id} className="hover:bg-gray-50/80 transition-colors dark:hover:bg-gray-750">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm font-mono text-gray-900 dark:text-gray-200">{estudiante.rut}</div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm font-bold text-gray-900 dark:text-white">
                            {estudiante.nombre} {estudiante.apellido}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {estudiante.curso?.nombre ? (
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{estudiante.curso.nombre}</div>
                          ) : estudiante.estado_matricula === 'Egresado' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-sm">
                              🎓 Egresado
                            </span>
                          ) : estudiante.estado_matricula === 'Retirado' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-sm">
                              📁 Retirado
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Sin curso</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {esPie ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              <Puzzle className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                              Programa PIE
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Regular</span>
                          )}
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
                          <div className="text-sm text-gray-600 dark:text-gray-300">{estudiante.apoderado?.nombre || 'Sin registrar'}</div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <button
                            onClick={() => handleVerPerfil(estudiante.id)}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 transition-colors font-bold dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <span>Ver Perfil</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
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

        {canWrite && cursoSeleccionado && (
          <AsignarProfesorModal
            isOpen={showAsignarProfesorModal}
            onClose={() => setShowAsignarProfesorModal(false)}
            curso={cursoSeleccionado}
            onProfesorActualizado={(nuevoProfesor) => {
              // Actualizar en el arreglo de cursos para reflejar inmediatamente el cambio
              setCursos((prev) =>
                prev.map((c) =>
                  String(c.id) === String(cursoSeleccionado.id)
                    ? { ...c, profesor_jefe: nuevoProfesor }
                    : c
                )
              )
            }}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
