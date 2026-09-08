import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getEstudianteById } from '@/services/estudiantesService'
import { getEstudiantesEnRiesgo } from '@/services/dashboardService'
import DownloadPDFButton from '../components/reports/DownloadPDFButton'
import { formatDate } from '@/utils/formatDate'
import { MapPin } from 'lucide-react'

export default function EstudiantePerfilPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [estudiante, setEstudiante] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [riesgoEstudianteId, setRiesgoEstudianteId] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    setRiesgoEstudianteId(null)

    getEstudianteById(id)
      .then((data) => {
        if (active) setEstudiante(data)
      })
      .catch(() => {
        if (active) setError('Error al cargar perfil del estudiante')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    getEstudiantesEnRiesgo()
      .then((estudiantesEnRiesgo) => {
        // El backend filtra los scores >= 6 de los últimos 30 días.
        if (active && estudiantesEnRiesgo.some((estudiante) => String(estudiante.id) === id)) {
          setRiesgoEstudianteId(id)
        }
      })
      .catch(() => {
        // Una falla de esta consulta no debe impedir consultar el perfil o su PDF.
        if (active) setRiesgoEstudianteId(null)
      })

    return () => { active = false }
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 animate-spin text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="mt-2 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (error || !estudiante) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg bg-red-50 p-6 text-center">
          <p className="text-red-800">{error || 'Estudiante no encontrado'}</p>
          <button
            onClick={() => navigate('/estudiantes')}
            className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Volver a Estudiantes
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => navigate('/estudiantes')}
          className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Estudiantes
        </button>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-bold text-white">
                      {estudiante.nombre} {estudiante.apellido}
                    </h1>
                    {(estudiante.es_pie || estudiante.pie) && (
                      <span
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 shadow-sm"
                        title="Estudiante del Programa de Integración Escolar (PIE)"
                      >
                        PIE
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-mono text-blue-100">{estudiante.rut}</p>
                </div>
                <DownloadPDFButton
                  estudianteId={estudiante.id}
                  estudianteNombre={`${estudiante.nombre}-${estudiante.apellido}`}
                />
              </div>
            </div>

            {riesgoEstudianteId === id && (
              <div role="status" className="mx-6 mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
                <span aria-hidden="true">⚠️</span>{' '}
                Este estudiante acumula múltiples incidentes recientes. Evalúe si corresponde activar o escalar el protocolo vigente.
              </div>
            )}

            <div className="grid gap-6 p-6 sm:grid-cols-2">
              <div>
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Datos Personales</h2>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Fecha de Nacimiento</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatDate(estudiante.fecha_nacimiento)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Género</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {estudiante.genero === 'M' ? 'Masculino' : 'Femenino'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Curso</dt>
                    <dd className="mt-1 text-sm text-gray-900">{estudiante.curso?.nombre || 'Sin curso'}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-1.5 text-sm font-medium text-gray-500">
                      <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>Domicilio</span>
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {estudiante.direccion || 'Sin domicilio registrado'}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Apoderado</h2>
                {estudiante.apoderado ? (
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Nombre</dt>
                      <dd className="mt-1 text-sm text-gray-900">{estudiante.apoderado.nombre}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="mt-1 text-sm text-gray-900">{estudiante.apoderado.email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                      <dd className="mt-1 text-sm text-gray-900">{estudiante.apoderado.telefono}</dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1.5 text-sm font-medium text-gray-500">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>Domicilio</span>
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {estudiante.apoderado.direccion || estudiante.direccion || 'Sin domicilio registrado'}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-sm text-gray-500">Sin apoderado registrado</p>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Historial de Incidentes</h2>
            </div>
            <div className="p-6">
              {estudiante.incidentes && estudiante.incidentes.length > 0 ? (
                <div className="space-y-4">
                  {estudiante.incidentes
                    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                    .map((incidente) => (
                      <div
                        key={incidente.id}
                        className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                  incidente.gravedad === 'Leve'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : incidente.gravedad === 'Grave'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {incidente.gravedad}
                              </span>
                              <span className="text-sm text-gray-500">
                                {formatDate(incidente.fecha)}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-gray-900">{incidente.tipo_abordaje}</p>
                            <p className="mt-1 text-sm text-gray-600">{incidente.relato}</p>
                            {incidente.es_victima && (
                              <span className="mt-2 inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                                Víctima
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">Sin incidentes registrados</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
