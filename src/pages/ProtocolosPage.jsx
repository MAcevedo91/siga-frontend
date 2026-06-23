import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProtocolos, getTiposProtocolo } from '@/services/protocolosService'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ShieldAlert, Clock, CheckCircle, AlertTriangle, Calendar, User, FileText, Plus, Filter, X } from 'lucide-react'

export default function ProtocolosPage() {
  const navigate = useNavigate()
  const [protocolos, setProtocolos] = useState([])
  const [tiposProtocolo, setTiposProtocolo] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [estadoFilter, setEstadoFilter] = useState('')
  const [tipoFilter, setTipoFilter] = useState('')

  useEffect(() => {
    loadTipos()
  }, [])

  useEffect(() => {
    loadProtocolos()
  }, [estadoFilter, tipoFilter])

  const loadTipos = async () => {
    try {
      const data = await getTiposProtocolo()
      setTiposProtocolo(data)
    } catch (err) {
      console.error('Error al cargar tipos', err)
    }
  }

  const loadProtocolos = async () => {
    try {
      setLoading(true)
      const params = {}
      if (estadoFilter) params.estado = estadoFilter
      if (tipoFilter) params.tipo_protocolo_id = tipoFilter
      const data = await getProtocolos(params)
      setProtocolos(data)
    } catch (err) {
      setError('Error al cargar protocolos')
    } finally {
      setLoading(false)
    }
  }

  const getEstadoBadge = (estado) => {
    const colors = {
      'En Investigación': 'bg-blue-100 text-blue-800',
      Derivado: 'bg-purple-100 text-purple-800',
      Cerrado: 'bg-gray-100 text-gray-800',
    }
    return colors[estado] || 'bg-gray-100 text-gray-800'
  }

  if (loading && protocolos.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 animate-spin text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="mt-2 text-gray-600">Cargando protocolos...</p>
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
            onClick={loadProtocolos}
            className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Protocolos RICE</h1>
            <p className="mt-1 text-sm text-gray-600">
              {protocolos.length} protocolo{protocolos.length !== 1 ? 's' : ''} activo{protocolos.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => navigate('/protocolos/nuevo')}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Protocolo
          </button>
        </div>

        <div className="mb-6 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Filtros</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                Estado del Protocolo
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setEstadoFilter('')}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    estadoFilter === ''
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setEstadoFilter('En Investigación')}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    estadoFilter === 'En Investigación'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  <Clock className="w-3 h-3 inline mr-1" />
                  En Investigación
                </button>
                <button
                  onClick={() => setEstadoFilter('Derivado')}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    estadoFilter === 'Derivado'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  Derivado
                </button>
                <button
                  onClick={() => setEstadoFilter('Cerrado')}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    estadoFilter === 'Cerrado'
                      ? 'bg-gradient-to-r from-gray-600 to-slate-600 text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <CheckCircle className="w-3 h-3 inline mr-1" />
                  Cerrado
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                Tipo de Protocolo
              </label>
              <select
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Todos los tipos</option>
                {tiposProtocolo.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Fecha Apertura
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Estudiante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {protocolos.map((protocolo) => (
                  <tr key={protocolo.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {new Date(protocolo.fecha_apertura).toLocaleDateString('es-CL')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{protocolo.tipo_protocolo}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {protocolo.estudiante?.nombre} {protocolo.estudiante?.apellido}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getEstadoBadge(protocolo.estado)}`}>
                        {protocolo.estado}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/protocolos/${protocolo.id}`)}
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
    </DashboardLayout>
  )
}
