import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getIncidentes } from '@/services/incidentesService'
import { useAuth } from '@/store/useAuthStore'

export default function IncidentesPage() {
  const navigate = useNavigate()
  const [incidentes, setIncidentes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [estadoFilter, setEstadoFilter] = useState('')
  const [gravedadFilter, setGravedadFilter] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const { user } = useAuth()

  const canCreate = ['Administrador', 'Coordinador', 'Inspector'].includes(user?.rol)

  useEffect(() => {
    loadIncidentes()
  }, [estadoFilter, gravedadFilter, fechaDesde, fechaHasta])

  const loadIncidentes = async () => {
    try {
      setLoading(true)
      const params = {}
      if (estadoFilter) params.estado = estadoFilter
      if (gravedadFilter) params.gravedad = gravedadFilter
      if (fechaDesde) params.fecha_desde = fechaDesde
      if (fechaHasta) params.fecha_hasta = fechaHasta
      const data = await getIncidentes(params)
      setIncidentes(data)
    } catch (err) {
      setError('Error al cargar incidentes')
    } finally {
      setLoading(false)
    }
  }

  const getEstadoBadge = (estado) => {
    const colors = {
      Abierto: 'bg-blue-100 text-blue-800',
      'En Investigación': 'bg-yellow-100 text-yellow-800',
      Resuelto: 'bg-green-100 text-green-800',
      Cerrado: 'bg-gray-100 text-gray-800',
    }
    return colors[estado] || 'bg-gray-100 text-gray-800'
  }

  const getGravedadBadge = (gravedad) => {
    const colors = {
      Leve: 'bg-yellow-100 text-yellow-800',
      Grave: 'bg-orange-100 text-orange-800',
      Gravísima: 'bg-red-100 text-red-800',
    }
    return colors[gravedad] || 'bg-gray-100 text-gray-800'
  }

  if (loading && incidentes.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 animate-spin text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="mt-2 text-gray-600">Cargando incidentes...</p>
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
            onClick={loadIncidentes}
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
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Incidentes</h1>
            <p className="mt-1 text-sm text-gray-600">
              {incidentes.length} caso{incidentes.length !== 1 ? 's' : ''} registrado{incidentes.length !== 1 ? 's' : ''}
            </p>
          </div>
          {canCreate && (
            <button
              onClick={() => navigate('/incidentes/nuevo')}
              className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Incidente
            </button>
          )}
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="estado" className="block text-sm font-medium text-gray-700">
              Estado
            </label>
            <select
              id="estado"
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="Abierto">Abierto</option>
              <option value="En Investigación">En Investigación</option>
              <option value="Resuelto">Resuelto</option>
              <option value="Cerrado">Cerrado</option>
            </select>
          </div>

          <div>
            <label htmlFor="gravedad" className="block text-sm font-medium text-gray-700">
              Gravedad
            </label>
            <select
              id="gravedad"
              value={gravedadFilter}
              onChange={(e) => setGravedadFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              <option value="Leve">Leve</option>
              <option value="Grave">Grave</option>
              <option value="Gravísima">Gravísima</option>
            </select>
          </div>

          <div>
            <label htmlFor="fecha_desde" className="block text-sm font-medium text-gray-700">
              Desde
            </label>
            <input
              type="date"
              id="fecha_desde"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="fecha_hasta" className="block text-sm font-medium text-gray-700">
              Hasta
            </label>
            <input
              type="date"
              id="fecha_hasta"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Tipo Abordaje
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Gravedad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Estudiantes
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {incidentes.map((incidente) => (
                  <tr key={incidente.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {new Date(incidente.fecha).toLocaleDateString('es-CL')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{incidente.tipo_abordaje}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getGravedadBadge(incidente.gravedad)}`}>
                        {incidente.gravedad}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getEstadoBadge(incidente.estado)}`}>
                        {incidente.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {incidente.estudiantes_count || 0} estudiante{incidente.estudiantes_count !== 1 ? 's' : ''}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/incidentes/${incidente.id}`)}
                        className="text-blue-600 hover:text-blue-900"
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
      </div>
    </div>
  )
}
