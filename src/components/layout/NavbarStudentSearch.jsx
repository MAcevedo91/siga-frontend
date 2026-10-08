import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Loader2, UserRound, GraduationCap, ArrowRight } from 'lucide-react'
import { getEstudiantes } from '@/services/estudiantesService'
import { useDebounce } from '@/hooks/useDebounce'

export default function NavbarStudentSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const debouncedQuery = useDebounce(query, 250)
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const mobileInputRef = useRef(null)
  const navigate = useNavigate()

  // Buscar estudiantes cuando cambia el query debounced
  useEffect(() => {
    const trimmed = debouncedQuery.trim()
    if (trimmed.length >= 2) {
      let isMounted = true
      setLoading(true)

      getEstudiantes({ search: trimmed })
        .then((data) => {
          if (isMounted) {
            setResults(Array.isArray(data) ? data.slice(0, 7) : [])
            setIsOpen(true)
          }
        })
        .catch((err) => {
          console.error('Error buscando estudiantes en navbar:', err)
          if (isMounted) setResults([])
        })
        .finally(() => {
          if (isMounted) setLoading(false)
        })

      return () => {
        isMounted = false
      }
    } else {
      setResults([])
      if (trimmed.length === 0) {
        setIsOpen(false)
      }
    }
  }, [debouncedQuery])

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        setIsMobileOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed) {
      setIsOpen(false)
      setIsMobileOpen(false)
      navigate(`/estudiantes?search=${encodeURIComponent(trimmed)}`)
    }
  }

  const handleSelectEstudiante = (estudianteId) => {
    setIsOpen(false)
    setIsMobileOpen(false)
    setQuery('')
    navigate(`/estudiantes/${estudianteId}`)
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    if (inputRef.current) inputRef.current.focus()
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Botón de lupa en móvil */}
      <button
        type="button"
        onClick={() => {
          setIsMobileOpen(true)
          setTimeout(() => mobileInputRef.current?.focus(), 50)
        }}
        className="sm:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="Abrir buscador de estudiantes"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* Barra de búsqueda para escritorio */}
      <form
        onSubmit={handleSubmit}
        className="hidden sm:flex items-center bg-gray-100 dark:bg-gray-700/80 hover:bg-gray-200/70 dark:hover:bg-gray-700 rounded-xl px-3 py-1.5 w-64 md:w-80 transition-all border border-transparent focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:bg-white dark:focus-within:bg-gray-800"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mr-2 shrink-0 animate-spin" />
        ) : (
          <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2 shrink-0" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (e.target.value.trim().length >= 2) setIsOpen(true)
          }}
          onFocus={() => {
            if (query.trim().length >= 2 && results.length > 0) setIsOpen(true)
          }}
          placeholder="Buscar estudiante (RUT o Nombre)..."
          className="bg-transparent border-none focus:outline-none text-sm w-full text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="p-0.5 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 rounded"
            aria-label="Limpiar búsqueda"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* Modal / Barra expandida en móvil */}
      {isMobileOpen && (
        <div className="fixed inset-x-0 top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 sm:hidden shadow-lg animate-fade-slide-up">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="flex-1 flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
              {loading ? (
                <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mr-2 shrink-0 animate-spin" />
              ) : (
                <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2 shrink-0" />
              )}
              <input
                ref={mobileInputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  if (e.target.value.trim().length >= 2) setIsOpen(true)
                }}
                placeholder="RUT o Nombre de estudiante..."
                className="bg-transparent border-none focus:outline-none text-sm w-full text-gray-900 dark:text-white"
              />
              {query && (
                <button type="button" onClick={handleClear} className="p-1 text-gray-400">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setIsMobileOpen(false)
                setIsOpen(false)
              }}
              className="text-xs font-semibold text-gray-600 dark:text-gray-300 px-2 py-1"
            >
              Cancelar
            </button>
          </form>
        </div>
      )}

      {/* Menú desplegable flotante de resultados en vivo (Typeahead) */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 sm:right-auto sm:w-96 top-full mt-2 z-50 rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
          <div className="px-3.5 py-2 bg-gray-50/80 dark:bg-gray-900/60 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Estudiantes encontrados
            </span>
            {loading && (
              <span className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 font-medium">
                <Loader2 className="w-3 h-3 animate-spin" /> Buscando...
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/60">
            {results.length > 0 ? (
              results.map((estudiante) => {
                const nombreCompleto = `${estudiante.nombre} ${estudiante.apellido}`
                const cursoNombre = estudiante.curso?.nombre || 'Sin curso'

                return (
                  <button
                    key={estudiante.id}
                    type="button"
                    onClick={() => handleSelectEstudiante(estudiante.id)}
                    className="w-full text-left px-3.5 py-2.5 flex items-center gap-3 hover:bg-indigo-50/70 dark:hover:bg-gray-700/70 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      {estudiante.nombre?.[0] || 'E'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                          {nombreCompleto}
                        </p>
                        {estudiante.es_pie && (
                          <span className="shrink-0 px-1.5 py-0.2 text-[10px] font-bold rounded bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300">
                            PIE
                          </span>
                        )}
                        {estudiante.estado_matricula === 'Egresado' && (
                          <span className="shrink-0 px-1.5 py-0.2 text-[10px] font-bold rounded bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300">
                            Egresado
                          </span>
                        )}
                        {estudiante.estado_matricula === 'Retirado' && (
                          <span className="shrink-0 px-1.5 py-0.2 text-[10px] font-bold rounded bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                            Retirado
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        <span className="font-mono text-gray-600 dark:text-gray-300">{estudiante.rut}</span>
                        <span>•</span>
                        <span className="truncate flex items-center gap-1">
                          <GraduationCap className="w-3 h-3 shrink-0" />
                          {cursoNombre}
                        </span>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                )
              })
            ) : !loading ? (
              <div className="p-6 text-center">
                <UserRound className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Sin coincidencias
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  No se encontraron alumnos con el término &ldquo;{query}&rdquo;
                </p>
              </div>
            ) : null}
          </div>

          {/* Pie de acción directa: Ver en el directorio */}
          <div className="p-2.5 bg-gray-50 dark:bg-gray-900/80 text-center">
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 py-1 flex items-center justify-center gap-1.5"
            >
              Ver todos los resultados en el directorio
              <span className="text-gray-400 font-normal">(&#x21B5; Enter)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
