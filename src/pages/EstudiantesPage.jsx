import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEstudiantes } from '@/services/estudiantesService'
import { useDebounce } from '@/hooks/useDebounce'
import ImportarEstudiantesModal from '@/components/estudiantes/ImportarEstudiantesModal'
import { useAuth } from '@/store/useAuthStore'

export default function EstudiantesPage() {
  const [estudiantes, setEstudiantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [cursoFilter, setCursoFilter] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  const debouncedSearch = useDebounce(searchTerm, 300)

  const canWrite = ['Administrador', 'Equipo de Formación'].includes(user?.rol)

  useEffect(() => {
    loadEstudiantes()
  }, [debouncedSearch, cursoFilter])

  const loadEstudiantes = async () => {
    try {
      setLoading(true)
      const params = {}
      if (debouncedSearch) params.search = debouncedSearch
      if (cursoFilter) params.curso_id = cursoFilter
      const data = await getEstudiantes(params)
      setEstudiantes(data)
    } catch (err) {
      setError('Error al cargar estudiantes')
    } finally {
      setLoading(false)
    }
  }

  const handleImportSuccess = (resumen) => {
    loadEstudiantes()
    alert(`Importación completada:\n${resumen.importados} importados\n${resumen.actualizados} actualizados\n${resumen.errores} errores`)
  }

  const handleVerPerfil = (id) => {
    navigate(`/estudiantes/${id}`)
  }

  if (loading && estudiantes.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 animate-spin text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="mt-2 text-gray-600">Cargando estudiantes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg bg-red-50 p-6 text-center">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadEstudiantes}
            className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Estudiantes</h1>
            <p className="mt-1 text-sm text-gray-600">
              {estudiantes.length} estudiante{estudiantes.length !== 1 ? 's' : ''} registrado{estudiantes.length !== 1 ? 's' : ''}
            </p>
          </div>
          {canWrite && (
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Importar Estudiantes
            </button>
          )}
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nombre o RUT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <svg
                className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="sm:w-64">
            <select
              value={cursoFilter}
              onChange={(e) => setCursoFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Todos los cursos</option>
              <option value="1">1° Básico</option>
              <option value="2">2° Básico</option>
              <option value="3">3° Básico</option>
              <option value="4">4° Básico</option>
              <option value="5">5° Básico</option>
              <option value="6">6° Básico</option>
              <option value="7">7° Básico</option>
              <option value="8">8° Básico</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
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
                    Apoderado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {estudiantes.map((estudiante) => (
                  <tr key={estudiante.id} className="hover:bg-gray-50">
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
                      <div className="text-sm text-gray-600">{estudiante.apoderado?.nombre || 'Sin apoderado'}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => handleVerPerfil(estudiante.id)}
                        className="text-blue-600 hover:text-blue-900"
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
      </div>

      {canWrite && (
        <ImportarEstudiantesModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={handleImportSuccess}
        />
      )}
    </div>
  )
}
