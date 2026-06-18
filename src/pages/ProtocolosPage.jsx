import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProtocolos } from '@/services/protocolosService'

export default function ProtocolosPage() {
  const navigate = useNavigate()
  const [protocolos, setProtocolos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [estadoFilter, setEstadoFilter] = useState('')
  const [tipoFilter, setTipoFilter] = useState('')

  useEffect(() => {
    loadProtocolos()
  }, [estadoFilter, tipoFilter])

  const loadProtocolos = async () => {
    try {
      setLoading(true)
      const params = {}
      if (estadoFilter) params.estado = estadoFilter
      if (tipoFilter) params.tipo = tipoFilter
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
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
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

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
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
              <option value="En Investigación">En Investigación</option>
              <option value="Derivado">Derivado</option>
              <option value="Cerrado">Cerrado</option>
            </select>
          </div>

          <div>
            <label htmlFor="tipo" className="block text-sm font-medium text-gray-700">
              Tipo de Protocolo
            </label>
            <select
              id="tipo"
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="Vulneración de Derechos">Vulneración de Derechos</option>
              <option value="Maltrato Infantil">Maltrato Infantil</option>
              <option value="Abuso Sexual">Abuso Sexual</option>
              <option value="Embarazo Adolescente">Embarazo Adolescente</option>
              <option value="Accidente Escolar">Accidente Escolar</option>
              <option value="Deserción Escolar">Deserción Escolar</option>
              <option value="Ideación Suicida">Ideación Suicida</option>
              <option value="Consumo de Sustancias">Consumo de Sustancias</option>
              <option value="Violencia Intrafamiliar">Violencia Intrafamiliar</option>
              <option value="Bullying">Bullying</option>
            </select>
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
    </div>
  )
}
