import { useState, useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'
import {
  getNiveles,
  getLetrasPorNivel,
  getEstudiantesPorCurso,
} from '@/services/cursosService'
import { buscarEstudiantes } from '@/services/incidentesService'
import {
  GraduationCap,
  Layers,
  Users,
  Search,
  Check,
  Plus,
  RefreshCw,
  AlertCircle,
  Sparkles,
} from 'lucide-react'

export default function SelectorEstudianteCascada({
  onSelectEstudiante,
  selectedEstudiantesIds = [],
  allowMultiple = false,
  className = '',
}) {
  // Modo de búsqueda: 'cascada' (por curso) o 'directa' (por RUT/Nombre)
  const [modoBusqueda, setModoBusqueda] = useState('cascada')

  // Estados para búsqueda en cascada
  const [niveles, setNiveles] = useState([])
  const [loadingNiveles, setLoadingNiveles] = useState(false)
  const [selectedNivel, setSelectedNivel] = useState('')

  const [letras, setLetras] = useState([])
  const [loadingLetras, setLoadingLetras] = useState(false)
  const [selectedCursoId, setSelectedCursoId] = useState('')

  const [estudiantesCurso, setEstudiantesCurso] = useState([])
  const [loadingEstudiantes, setLoadingEstudiantes] = useState(false)
  const [filtroAlumnoCurso, setFiltroAlumnoCurso] = useState('')

  // Estados para búsqueda directa
  const [queryDirecta, setQueryDirecta] = useState('')
  const [loadingDirecta, setLoadingDirecta] = useState(false)
  const [resultadosDirecta, setResultadosDirecta] = useState([])

  // Cargar niveles disponibles al montar
  useEffect(() => {
    cargarNiveles()
  }, [])

  const cargarNiveles = async () => {
    try {
      setLoadingNiveles(true)
      const data = await getNiveles()
      setNiveles(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error al cargar niveles:', err)
      setNiveles([])
    } finally {
      setLoadingNiveles(false)
    }
  }

  // Cuando cambia el nivel, cargar las letras de ese nivel
  useEffect(() => {
    if (!selectedNivel) {
      setLetras([])
      setSelectedCursoId('')
      setEstudiantesCurso([])
      return
    }

    const cargarLetras = async () => {
      try {
        setLoadingLetras(true)
        setSelectedCursoId('')
        setEstudiantesCurso([])
        const data = await getLetrasPorNivel(selectedNivel)
        setLetras(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error(`Error al cargar letras para nivel ${selectedNivel}:`, err)
        setLetras([])
      } finally {
        setLoadingLetras(false)
      }
    }

    cargarLetras()
  }, [selectedNivel])

  // Cuando cambia el curso (letra), cargar los estudiantes de ese curso
  useEffect(() => {
    if (!selectedCursoId) {
      setEstudiantesCurso([])
      return
    }

    const cargarEstudiantes = async () => {
      try {
        setLoadingEstudiantes(true)
        const data = await getEstudiantesPorCurso(selectedCursoId)
        setEstudiantesCurso(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error(`Error al cargar estudiantes del curso ${selectedCursoId}:`, err)
        setEstudiantesCurso([])
      } finally {
        setLoadingEstudiantes(false)
      }
    }

    cargarEstudiantes()
  }, [selectedCursoId])

  // Búsqueda directa con debounce
  useEffect(() => {
    if (modoBusqueda !== 'directa' || queryDirecta.trim().length < 2) {
      setResultadosDirecta([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        setLoadingDirecta(true)
        const data = await buscarEstudiantes(queryDirecta.trim())
        setResultadosDirecta(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Error en búsqueda directa:', err)
        setResultadosDirecta([])
      } finally {
        setLoadingDirecta(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [queryDirecta, modoBusqueda])

  // Manejar selección de un estudiante
  const handleSelect = (estudiante) => {
    if (onSelectEstudiante) {
      onSelectEstudiante(estudiante)
    }

    if (!allowMultiple) {
      // En modo único, limpiamos búsquedas
      setQueryDirecta('')
      setResultadosDirecta([])
    }
  }

  // Filtrado rápido de alumnos en la lista del curso
  const estudiantesFiltrados = useMemo(() => {
    if (!filtroAlumnoCurso.trim()) return estudiantesCurso
    const query = filtroAlumnoCurso.toLowerCase()
    return estudiantesCurso.filter((e) => {
      const nombreCompleto = `${e.apellido} ${e.nombre}`.toLowerCase()
      const rut = (e.rut || '').toLowerCase()
      return nombreCompleto.includes(query) || rut.includes(query)
    })
  }, [estudiantesCurso, filtroAlumnoCurso])

  return (
    <div className={`bg-slate-50/70 dark:bg-gray-850 border border-slate-200 dark:border-gray-700/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 ${className}`}>
      {/* Selector de modo: Cascada vs Directa */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-700/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Seleccionar Estudiante
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Elija mediante la estructura de cursos del colegio o busque por RUT
            </p>
          </div>
        </div>

        {/* Botones de alternancia rápida */}
        <div className="flex items-center bg-gray-200/70 dark:bg-gray-750 p-1 rounded-xl text-xs font-medium self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setModoBusqueda('cascada')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              modoBusqueda === 'cascada'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 font-bold shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Por Curso (Recomendado)</span>
          </button>
          <button
            type="button"
            onClick={() => setModoBusqueda('directa')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              modoBusqueda === 'directa'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 font-bold shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Búsqueda por RUT/Nombre</span>
          </button>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* MODO 1: BÚSQUEDA EN CASCADA (Nivel -> Letra -> Lista)                     */}
      {/* ======================================================================= */}
      {modoBusqueda === 'cascada' && (
        <div className="space-y-4">
          {/* Selectores de Nivel y Letra */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Paso 1: Nivel Escolar */}
            <div>
              <label
                htmlFor="selector-nivel"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5"
              >
                1. Nivel Escolar
              </label>
              <div className="relative">
                <select
                  id="selector-nivel"
                  aria-label="Seleccionar Nivel Escolar"
                  value={selectedNivel}
                  onChange={(e) => setSelectedNivel(e.target.value)}
                  disabled={loadingNiveles}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition"
                >
                  <option value="">
                    {loadingNiveles ? 'Cargando niveles...' : 'Seleccionar nivel...'}
                  </option>
                  {niveles.map((nivel) => (
                    <option key={nivel} value={nivel}>
                      {nivel}
                    </option>
                  ))}
                </select>
                {loadingNiveles && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                  </div>
                )}
              </div>
            </div>

            {/* Paso 2: Letra del Curso */}
            <div>
              <label
                htmlFor="selector-letra"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5"
              >
                2. Letra del Curso
              </label>
              <div className="relative">
                <select
                  id="selector-letra"
                  aria-label="Seleccionar Letra del Curso"
                  value={selectedCursoId}
                  onChange={(e) => setSelectedCursoId(e.target.value)}
                  disabled={!selectedNivel || loadingLetras || letras.length === 0}
                  className={`w-full px-3 py-2 text-sm rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                    !selectedNivel
                      ? 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed bg-gray-100/50 dark:bg-gray-800/50'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">
                    {!selectedNivel
                      ? 'Primero elija un nivel escolar'
                      : loadingLetras
                      ? 'Cargando letras...'
                      : letras.length === 0
                      ? 'Sin cursos registrados'
                      : 'Seleccionar letra / curso...'}
                  </option>
                  {letras.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre || `Curso ${c.letra}`}
                    </option>
                  ))}
                </select>
                {loadingLetras && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Paso 3: Nómina de Estudiantes del Curso */}
          {selectedCursoId && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 sm:p-4 shadow-sm space-y-3 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                    3. Alumnos del Curso ({estudiantesFiltrados.length})
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    — Ordenados alfabéticamente por apellido
                  </span>
                </div>

                {/* Filtro rápido dentro de la nómina del curso */}
                {estudiantesCurso.length > 5 && (
                  <div className="relative w-full sm:w-56">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filtrar en esta nómina..."
                      value={filtroAlumnoCurso}
                      onChange={(e) => setFiltroAlumnoCurso(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Lista scrollable de estudiantes */}
              {loadingEstudiantes ? (
                <div className="py-8 text-center text-gray-400 text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                  <span>Cargando nómina oficial de estudiantes...</span>
                </div>
              ) : estudiantesFiltrados.length === 0 ? (
                <div className="py-6 text-center text-gray-500 dark:text-gray-400 text-xs">
                  {filtroAlumnoCurso
                    ? 'No se encontraron alumnos con ese nombre o RUT en este curso.'
                    : 'No hay estudiantes matriculados en este curso.'}
                </div>
              ) : (
                <ul
                  role="list"
                  aria-label="Lista de alumnos del curso"
                  className="divide-y divide-gray-100 dark:divide-gray-700/60 max-h-60 sm:max-h-72 overflow-y-auto pr-1"
                >
                  {estudiantesFiltrados.map((estudiante) => {
                    const yaAgregado = selectedEstudiantesIds.includes(estudiante.id)
                    return (
                      <li
                        key={estudiante.id}
                        className={`flex items-center justify-between gap-2 py-2 px-2.5 rounded-lg transition ${
                          yaAgregado
                            ? 'bg-blue-50/50 dark:bg-blue-950/20 opacity-80'
                            : 'hover:bg-slate-100 dark:hover:bg-gray-750'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                            {estudiante.apellido?.[0] || 'E'}
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                              <span className="font-bold">{estudiante.apellido}</span>, {estudiante.nombre}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                              RUT: {estudiante.rut || 'Sin RUT'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Badge de PIE */}
                          {estudiante.es_pie && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                              title="Estudiante del Programa de Integración Escolar"
                            >
                              <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                              PIE
                            </span>
                          )}

                          {/* Botón de selección */}
                          <button
                            type="button"
                            onClick={() => handleSelect(estudiante)}
                            disabled={yaAgregado && !allowMultiple}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                              yaAgregado
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:scale-[1.02]'
                            }`}
                          >
                            {yaAgregado ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Agregado</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>Seleccionar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODO 2: BÚSQUEDA DIRECTA POR RUT O NOMBRE                              */}
      {/* ======================================================================= */}
      {modoBusqueda === 'directa' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Escriba RUT o nombre del alumno (mínimo 2 caracteres)..."
              value={queryDirecta}
              onChange={(e) => setQueryDirecta(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
            />
            {loadingDirecta && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
              </div>
            )}
          </div>

          {/* Resultados de búsqueda directa */}
          {queryDirecta.trim().length >= 2 && !loadingDirecta && resultadosDirecta.length === 0 && (
            <div className="py-4 text-center text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>No se encontraron estudiantes para &quot;{queryDirecta}&quot;.</span>
            </div>
          )}

          {resultadosDirecta.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-md max-h-60 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/60">
              {resultadosDirecta.map((estudiante) => {
                const yaAgregado = selectedEstudiantesIds.includes(estudiante.id)
                return (
                  <button
                    key={estudiante.id}
                    type="button"
                    onClick={() => handleSelect(estudiante)}
                    className={`w-full flex items-center justify-between p-3 text-left transition ${
                      yaAgregado
                        ? 'bg-blue-50/50 dark:bg-blue-950/20 opacity-80'
                        : 'hover:bg-slate-50 dark:hover:bg-gray-750'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {estudiante.nombre} {estudiante.apellido}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        RUT: {estudiante.rut || 'Sin RUT'} {estudiante.curso && `— ${estudiante.curso}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {estudiante.es_pie && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                          PIE
                        </span>
                      )}
                      {yaAgregado ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <Check className="w-3.5 h-3.5" /> Agregado
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                          + Agregar
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

SelectorEstudianteCascada.propTypes = {
  onSelectEstudiante: PropTypes.func.isRequired,
  selectedEstudiantesIds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  allowMultiple: PropTypes.bool,
  className: PropTypes.string,
}
