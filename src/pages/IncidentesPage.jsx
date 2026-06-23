import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getIncidentes } from '@/services/incidentesService'
import { useAuth } from '@/store/useAuthStore'
import DashboardLayout from '@/components/layout/DashboardLayout'

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

  const canCreate = ['Administrador', 'Equipo de Formación', 'Inspector'].includes(user?.rol)

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

  const getCardGradient = (gravedad) => {
    const gradients = {
      Leve: 'from-cyan-50 via-cyan-100/50 to-white',
      Grave: 'from-orange-50 via-orange-100/50 to-white',
      Gravísima: 'from-red-50 via-purple-100/50 to-white',
    }
    return gradients[gravedad] || 'from-gray-50 to-white'
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

  const getGravedadBadge = (gravedad) => {
    const styles = {
      Leve: 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30',
      Grave: 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30',
      Gravísima: 'bg-gradient-to-r from-red-600 to-purple-600 text-white shadow-lg shadow-red-600/40',
    }
    return styles[gravedad] || 'bg-gray-100 text-gray-800'
  }

  if (loading && incidentes.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 animate-spin text-blue-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="mt-2 text-gray-600">Cargando incidentes...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
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
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="bg-gradient-to-r from-cyan-600 via-purple-600 to-orange-600 bg-clip-text text-3xl font-bold text-transparent">
                Gestión de Incidentes
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                {incidentes.length} caso{incidentes.length !== 1 ? 's' : ''} registrado{incidentes.length !== 1 ? 's' : ''}
              </p>
            </div>
            {canCreate && (
              <button
                onClick={() => navigate('/incidentes/nuevo')}
                className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 via-purple-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-purple-500/30 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/40"
              >
                <svg className="h-5 w-5 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nuevo Incidente
              </button>
            )}
          </div>

          {/* Filtros */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="group">
              <label htmlFor="estado" className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <svg className="h-4 w-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Estado
              </label>
              <select
                id="estado"
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 shadow-sm transition-all focus:border-cyan-500 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 group-hover:border-cyan-300"
              >
                <option value="">Todos</option>
                <option value="Abierto">Abierto</option>
                <option value="En Investigación">En Investigación</option>
                <option value="Resuelto">Resuelto</option>
                <option value="Cerrado">Cerrado</option>
              </select>
            </div>

            <div className="group">
              <label htmlFor="gravedad" className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <svg className="h-4 w-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Gravedad
              </label>
              <select
                id="gravedad"
                value={gravedadFilter}
                onChange={(e) => setGravedadFilter(e.target.value)}
                className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 shadow-sm transition-all focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/20 group-hover:border-orange-300"
              >
                <option value="">Todas</option>
                <option value="Leve">Leve</option>
                <option value="Grave">Grave</option>
                <option value="Gravísima">Gravísima</option>
              </select>
            </div>

            <div className="group">
              <label htmlFor="fecha_desde" className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Desde
              </label>
              <input
                type="date"
                id="fecha_desde"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 shadow-sm transition-all focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20 group-hover:border-purple-300"
              />
            </div>

            <div className="group">
              <label htmlFor="fecha_hasta" className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Hasta
              </label>
              <input
                type="date"
                id="fecha_hasta"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 shadow-sm transition-all focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20 group-hover:border-purple-300"
              />
            </div>
          </div>

          {/* Grid de Cards */}
          {incidentes.length === 0 ? (
            <div className="flex min-h-[300px] items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50">
              <div className="text-center">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">No hay incidentes registrados</h3>
                <p className="mt-2 text-sm text-gray-600">Los incidentes aparecerán aquí cuando se registren</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {incidentes.map((incidente) => (
                <div
                  key={incidente.id}
                  className={`group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-gradient-to-br ${getCardGradient(incidente.gravedad)} p-6 shadow-lg transition-all hover:scale-[1.02] hover:border-gray-300 hover:shadow-2xl`}
                >
                  {/* Badges superiores */}
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${getGravedadBadge(incidente.gravedad)}`}>
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {incidente.gravedad}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${getEstadoBadge(incidente.estado)}`}>
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {incidente.estado}
                    </span>
                  </div>

                  {/* Contenido */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Fecha del Incidente</p>
                      <p className="mt-1 flex items-center gap-2 text-lg font-bold text-gray-900">
                        <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(incidente.fecha).toLocaleDateString('es-CL')}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tipo de Abordaje</p>
                      <p className="mt-1 flex items-center gap-2 text-base font-semibold text-gray-900">
                        <svg className="h-5 w-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {incidente.tipo_abordaje}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl bg-white/70 px-4 py-3 backdrop-blur-sm">
                      <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Estudiantes Involucrados</p>
                        <p className="text-lg font-bold text-gray-900">
                          {incidente.estudiantes_count || 0} estudiante{incidente.estudiantes_count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Botón de acción */}
                  <button
                    onClick={() => navigate(`/incidentes/${incidente.id}`)}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-gray-900 hover:to-black hover:shadow-xl"
                  >
                    Ver Detalle
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Efecto decorativo */}
                  <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-white/20 to-transparent blur-2xl transition-transform group-hover:scale-150" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
