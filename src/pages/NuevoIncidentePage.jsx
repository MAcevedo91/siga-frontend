import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { createIncidente, getTiposAbordaje, buscarEstudiantes } from '@/services/incidentesService'
import AlertaGrave from '@/components/incidentes/AlertaGrave'
import { useDebounce } from '@/hooks/useDebounce'

export default function NuevoIncidentePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tiposAbordaje, setTiposAbordaje] = useState([])
  const [showAlerta, setShowAlerta] = useState(false)
  const [gravedadAlerta, setGravedadAlerta] = useState(null)
  const [estudianteSearch, setEstudianteSearch] = useState('')
  const [estudianteResults, setEstudianteResults] = useState([])
  const [searchingEstudiantes, setSearchingEstudiantes] = useState(false)

  const debouncedSearch = useDebounce(estudianteSearch, 300)

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
  } = useForm({
    defaultValues: {
      estudiantes: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'estudiantes',
  })

  const gravedad = watch('gravedad')

  useEffect(() => {
    loadTiposAbordaje()
  }, [])

  useEffect(() => {
    if (debouncedSearch.length >= 2) {
      searchEstudiantes()
    } else {
      setEstudianteResults([])
    }
  }, [debouncedSearch])

  const loadTiposAbordaje = async () => {
    try {
      const data = await getTiposAbordaje()
      setTiposAbordaje(data)
    } catch (err) {
      setError('Error al cargar tipos de abordaje')
    }
  }

  const searchEstudiantes = async () => {
    try {
      setSearchingEstudiantes(true)
      const data = await buscarEstudiantes(debouncedSearch)
      setEstudianteResults(data)
    } catch (err) {
      console.error('Error buscando estudiantes', err)
    } finally {
      setSearchingEstudiantes(false)
    }
  }

  const handleAddEstudiante = (estudiante) => {
    const yaAgregado = fields.some((f) => f.estudiante_id === estudiante.id)
    if (!yaAgregado) {
      append({
        estudiante_id: estudiante.id,
        nombre_completo: `${estudiante.nombre} ${estudiante.apellido}`,
        es_victima: false,
        observacion: '',
      })
    }
    setEstudianteSearch('')
    setEstudianteResults([])
  }

  const onSubmit = async (data) => {
    setLoading(true)
    setError(null)
    try {
      const payload = {
        tipo_abordaje_id: Number(data.tipo_abordaje_id),
        fecha: data.fecha,
        gravedad: data.gravedad,
        relato: data.relato,
        medidas: data.medidas,
        estudiantes: data.estudiantes.map((e) => ({
          estudiante_id: e.estudiante_id,
          es_victima: e.es_victima,
          observacion: e.observacion,
        })),
      }

      await createIncidente(payload)

      if (data.gravedad === 'Grave' || data.gravedad === 'Gravísima') {
        setGravedadAlerta(data.gravedad)
        setShowAlerta(true)
        setTimeout(() => {
          navigate('/incidentes')
        }, 3000)
      } else {
        navigate('/incidentes')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar incidente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => navigate('/incidentes')}
          className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Incidentes
        </button>

        <div className="rounded-lg bg-white p-6 shadow">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">Registrar Nuevo Incidente</h1>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="tipo_abordaje_id" className="block text-sm font-medium text-gray-700">
                  Tipo de Abordaje <span className="text-red-500">*</span>
                </label>
                <select
                  id="tipo_abordaje_id"
                  {...register('tipo_abordaje_id', { required: 'El tipo de abordaje es obligatorio' })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Seleccionar tipo</option>
                  {tiposAbordaje.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </option>
                  ))}
                </select>
                {errors.tipo_abordaje_id && (
                  <p className="mt-1 text-xs text-red-600">{errors.tipo_abordaje_id.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="fecha" className="block text-sm font-medium text-gray-700">
                  Fecha <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="fecha"
                  {...register('fecha', { required: 'La fecha es obligatoria' })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.fecha && (
                  <p className="mt-1 text-xs text-red-600">{errors.fecha.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="gravedad" className="block text-sm font-medium text-gray-700">
                  Gravedad <span className="text-red-500">*</span>
                </label>
                <select
                  id="gravedad"
                  {...register('gravedad', { required: 'La gravedad es obligatoria' })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Seleccionar gravedad</option>
                  <option value="Leve">Leve</option>
                  <option value="Grave">Grave</option>
                  <option value="Gravísima">Gravísima</option>
                </select>
                {errors.gravedad && (
                  <p className="mt-1 text-xs text-red-600">{errors.gravedad.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Estudiantes Involucrados <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  placeholder="Buscar estudiante (mínimo 2 caracteres)..."
                  value={estudianteSearch}
                  onChange={(e) => setEstudianteSearch(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {searchingEstudiantes && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="h-5 w-5 animate-spin text-gray-400" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                )}
                {estudianteResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg">
                    {estudianteResults.map((est) => (
                      <button
                        key={est.id}
                        type="button"
                        onClick={() => handleAddEstudiante(est)}
                        className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                      >
                        {est.nombre} {est.apellido} - {est.rut}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {fields.length > 0 && (
                <div className="mt-4 space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="rounded-md border border-gray-200 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-medium text-gray-900">{field.nombre_completo}</span>
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            {...register(`estudiantes.${index}.es_victima`)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Es víctima</span>
                        </label>
                        <textarea
                          {...register(`estudiantes.${index}.observacion`)}
                          placeholder="Observación sobre su participación..."
                          rows={2}
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="relato" className="block text-sm font-medium text-gray-700">
                Relato del Incidente <span className="text-red-500">*</span>
              </label>
              <textarea
                id="relato"
                {...register('relato', {
                  required: 'El relato es obligatorio',
                  minLength: {
                    value: 20,
                    message: 'El relato debe tener al menos 20 caracteres',
                  },
                })}
                rows={4}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Describe lo ocurrido..."
              />
              {errors.relato && (
                <p className="mt-1 text-xs text-red-600">{errors.relato.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="medidas" className="block text-sm font-medium text-gray-700">
                Medidas Adoptadas
              </label>
              <textarea
                id="medidas"
                {...register('medidas')}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Acciones tomadas frente al incidente..."
              />
            </div>

            <div className="flex justify-end gap-3 border-t pt-6">
              <button
                type="button"
                onClick={() => navigate('/incidentes')}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Guardando...
                  </span>
                ) : (
                  'Registrar Incidente'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <AlertaGrave show={showAlerta} gravedad={gravedadAlerta} onClose={() => setShowAlerta(false)} />
    </div>
  )
}
