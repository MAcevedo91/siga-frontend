import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getEstudianteById } from '@/services/estudiantesService'

export default function EstudiantePerfilPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [estudiante, setEstudiante] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadEstudiante()
  }, [id])

  const loadEstudiante = async () => {
    try {
      setLoading(true)
      const data = await getEstudianteById(id)
      setEstudiante(data)
    } catch (err) {
      setError('Error al cargar perfil del estudiante')
    } finally {
      setLoading(false)
    }
  }

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
              <h1 className="text-3xl font-bold text-white">
                {estudiante.nombre} {estudiante.apellido}
              </h1>
              <p className="mt-1 font-mono text-blue-100">{estudiante.rut}</p>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-2">
              <div>
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Datos Personales</h2>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Fecha de Nacimiento</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(estudiante.fecha_nacimiento).toLocaleDateString('es-CL')}
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
                                {new Date(incidente.fecha).toLocaleDateString('es-CL')}
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
