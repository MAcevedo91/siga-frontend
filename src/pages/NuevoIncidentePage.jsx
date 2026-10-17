import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { createIncidente, getTiposAbordaje } from '@/services/incidentesService'
import AlertaGrave from '@/components/incidentes/AlertaGrave'
import SelectorEstudianteCascada from '@/components/shared/SelectorEstudianteCascada'
import DashboardLayout from '@/components/layout/DashboardLayout'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Users,
  FileText,
  ShieldAlert,
  Check,
  X,
  Sparkles,
  HelpCircle,
  Clock,
  Layers,
  ChevronRight,
  UserCheck,
} from 'lucide-react'

export default function NuevoIncidentePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tiposAbordaje, setTiposAbordaje] = useState([])
  const [showAlerta, setShowAlerta] = useState(false)
  const [gravedadAlerta, setGravedadAlerta] = useState(null)

  // Modales de confirmación y descarte
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showDescartarModal, setShowDescartarModal] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
      tipo_abordaje_id: '',
      gravedad: '',
      relato: '',
      medidas: '',
      estudiantes: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'estudiantes',
  })

  // Observación de campos en tiempo real para barra de avance y checklist
  const fecha = watch('fecha')
  const tipoAbordajeId = watch('tipo_abordaje_id')
  const gravedad = watch('gravedad')
  const relato = watch('relato') || ''
  const medidas = watch('medidas') || ''

  useEffect(() => {
    loadTiposAbordaje()
  }, [])

  const loadTiposAbordaje = async () => {
    try {
      const data = await getTiposAbordaje()
      setTiposAbordaje(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error cargando abordajes:', err)
      setError('Error al cargar tipos de abordaje')
    }
  }

  const handleAddEstudiante = (estudiante) => {
    const yaAgregado = fields.some((f) => f.estudiante_id === estudiante.id)
    if (!yaAgregado) {
      append({
        estudiante_id: estudiante.id,
        nombre_completo: `${estudiante.nombre} ${estudiante.apellido}`,
        rut: estudiante.rut || '',
        curso_nombre: estudiante.curso?.nombre || '',
        es_victima: false,
        observacion: '',
      })
      toast.success(`${estudiante.nombre} agregado al registro`, { id: `add-${estudiante.id}` })
    } else {
      toast.error('Este estudiante ya se encuentra seleccionado', { id: `dup-${estudiante.id}` })
    }
  }

  // Comprobaciones del checklist (5 criterios indispensables)
  const checkAbordaje = Boolean(tipoAbordajeId)
  const checkFecha = Boolean(fecha)
  const checkGravedad = Boolean(gravedad)
  const checkEstudiantes = fields.length > 0
  const checkRelato = relato.trim().length >= 20

  const itemsCompletados = [
    checkAbordaje,
    checkFecha,
    checkGravedad,
    checkEstudiantes,
    checkRelato,
  ].filter(Boolean).length

  const porcentajeAvance = Math.round((itemsCompletados / 5) * 100)
  const formCompleto = itemsCompletados === 5

  // Detección de cambios sin guardar para proteger al usuario
  const isDirty = Boolean(
    tipoAbordajeId ||
    gravedad ||
    relato.trim().length > 0 ||
    medidas.trim().length > 0 ||
    fields.length > 0
  )

  const handleCancelClick = () => {
    if (isDirty) {
      setShowDescartarModal(true)
    } else {
      navigate('/incidentes')
    }
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
          es_victima: Boolean(e.es_victima),
          observacion: e.observacion || '',
        })),
      }

      await createIncidente(payload)
      setShowConfirmModal(false)

      if (data.gravedad === 'Grave' || data.gravedad === 'Gravísima') {
        setGravedadAlerta(data.gravedad)
        setShowAlerta(true)
        setTimeout(() => {
          navigate('/incidentes')
        }, 3000)
      } else {
        toast.success('Incidente registrado exitosamente')
        navigate('/incidentes')
      }
    } catch (err) {
      console.error('Error al registrar incidente:', err)
      setError(err.response?.data?.message || 'Error al registrar incidente')
      setShowConfirmModal(false)
    } finally {
      setLoading(false)
    }
  }

  // Nombre legible del abordaje seleccionado para el modal
  const tipoAbordajeSeleccionado = tiposAbordaje.find(
    (t) => String(t.id) === String(tipoAbordajeId)
  )?.nombre

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Cabecera / Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700/80 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              <span>Convivencia Escolar</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              <button
                type="button"
                onClick={handleCancelClick}
                className="hover:underline"
              >
                Incidentes
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-500 dark:text-gray-400">Nuevo Registro</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2.5">
              <span>Registrar Nuevo Incidente</span>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Complete los antecedentes del hecho para registrarlo en la bitácora oficial del establecimiento.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCancelClick}
            className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Incidentes</span>
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-50 dark:bg-rose-950/60 p-4 border border-rose-200 dark:border-rose-800 text-sm text-rose-800 dark:text-rose-200 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
            <div>
              <p className="font-bold">Error al procesar el formulario</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Layout en 2 Columnas (Contenido Principal vs Sidebar Resumen) */}
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
          {/* =================================================================== */}
          {/* COLUMNA IZQUIERDA: FORMULARIO PRINCIPAL                             */}
          {/* =================================================================== */}
          <div className="space-y-6">
            {/* CARD 1: DATOS GENERALES DEL INCIDENTE */}
            <section className="bg-gradient-to-br from-blue-100/90 via-indigo-100/40 to-white dark:from-blue-950/75 dark:via-slate-900/80 dark:to-gray-800 border border-blue-300/90 dark:border-blue-800/80 rounded-2xl p-5 sm:p-6 shadow-md space-y-5 transition-all">
              <div className="flex items-center gap-3 border-b border-blue-200 dark:border-blue-800/60 pb-3.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">
                    1. Datos del Incidente
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Indique el tipo de abordaje formativo, la fecha del suceso y la gravedad reglamentaria.
                  </p>
                </div>
              </div>

              {/* Grid: Tipo de Abordaje y Fecha */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Tipo de Abordaje (Chips seleccionables) */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Tipo de Abordaje <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tiposAbordaje.map((tipo) => {
                      const isSelected = String(tipoAbordajeId) === String(tipo.id)
                      return (
                        <button
                          key={tipo.id}
                          type="button"
                          onClick={() => setValue('tipo_abordaje_id', String(tipo.id), { shouldValidate: true })}
                          aria-pressed={isSelected}
                          className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-blue-50 text-blue-800 border-blue-500 font-bold dark:bg-blue-950/70 dark:text-blue-200 dark:border-blue-500 shadow-xs'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isSelected ? 'bg-blue-600 dark:bg-blue-400' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          />
                          <span>{tipo.nombre}</span>
                        </button>
                      )
                    })}
                  </div>
                  <input
                    type="hidden"
                    {...register('tipo_abordaje_id', {
                      required: 'Debe seleccionar un tipo de abordaje',
                    })}
                  />
                  {errors.tipo_abordaje_id && (
                    <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-1">
                      {errors.tipo_abordaje_id.message}
                    </p>
                  )}
                </div>

                {/* Fecha del Hecho */}
                <div className="space-y-2">
                  <label htmlFor="fecha" className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Fecha del Suceso <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="fecha"
                      {...register('fecha', { required: 'La fecha es obligatoria' })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                  {errors.fecha && (
                    <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-1">
                      {errors.fecha.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Gravedad (Chips Temáticos con color de semáforo) */}
              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700/60">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Nivel de Gravedad Reglamentaria <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Leve */}
                  <button
                    type="button"
                    onClick={() => setValue('gravedad', 'Leve', { shouldValidate: true })}
                    aria-pressed={gravedad === 'Leve'}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      gravedad === 'Leve'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-400 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-700 font-bold shadow-xs ring-1 ring-emerald-400'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-bold flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                        Leve
                      </span>
                      {gravedad === 'Leve' && <Check className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-normal">
                      Falta menor; se aborda con diálogo pedagógico o amonestación verbal.
                    </p>
                  </button>

                  {/* Grave */}
                  <button
                    type="button"
                    onClick={() => setValue('gravedad', 'Grave', { shouldValidate: true })}
                    aria-pressed={gravedad === 'Grave'}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      gravedad === 'Grave'
                        ? 'bg-amber-50 text-amber-900 border-amber-400 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-700 font-bold shadow-xs ring-1 ring-amber-400'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-bold flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                        Grave
                      </span>
                      {gravedad === 'Grave' && <Check className="w-4 h-4 text-amber-600" />}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-normal">
                      Falta reiterada o agresión verbal/física moderada. Notifica a Dirección.
                    </p>
                  </button>

                  {/* Gravísima */}
                  <button
                    type="button"
                    onClick={() => setValue('gravedad', 'Gravísima', { shouldValidate: true })}
                    aria-pressed={gravedad === 'Gravísima'}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      gravedad === 'Gravísima'
                        ? 'bg-rose-50 text-rose-900 border-rose-400 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-700 font-bold shadow-xs ring-1 ring-rose-400'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-bold flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                        Gravísima
                      </span>
                      {gravedad === 'Gravísima' && <Check className="w-4 h-4 text-rose-600" />}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-normal">
                      Agresión severa, armas o vulneración grave. Activa protocolo normativo.
                    </p>
                  </button>
                </div>
                <input
                  type="hidden"
                  {...register('gravedad', { required: 'Debe seleccionar un nivel de gravedad' })}
                />
                {errors.gravedad && (
                  <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-1">
                    {errors.gravedad.message}
                  </p>
                )}
              </div>
            </section>

            {/* CARD 2: ESTUDIANTES INVOLUCRADOS */}
            <section className="bg-gradient-to-br from-emerald-100/90 via-teal-100/40 to-white dark:from-emerald-950/75 dark:via-slate-900/80 dark:to-gray-800 border border-emerald-300/90 dark:border-teal-800/80 rounded-2xl p-5 sm:p-6 shadow-md space-y-5 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 dark:border-teal-800/60 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <span>2. Estudiantes Involucrados</span>
                      <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                        (Puedes agregar más de uno)
                      </span>
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Seleccione participantes mediante la estructura de cursos o el buscador directo.
                    </p>
                  </div>
                </div>

                <span className="self-start sm:self-auto text-xs font-bold px-3 py-1 rounded-full bg-emerald-200/90 text-emerald-900 dark:bg-emerald-900/90 dark:text-emerald-100 border border-emerald-400 dark:border-emerald-700 shadow-2xs">
                  {fields.length} seleccionado{fields.length === 1 ? '' : 's'}
                </span>
              </div>

              {/* Selector en Cascada Integrado */}
              <SelectorEstudianteCascada
                onSelectEstudiante={handleAddEstudiante}
                selectedEstudiantesIds={fields.map((f) => f.estudiante_id)}
                allowMultiple={true}
              />

              {/* Lista Detallada de Alumnos Involucrados con configuración de Rol */}
              {fields.length > 0 ? (
                <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-700/60">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Roles y Observaciones Individuales ({fields.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-850 p-3.5 space-y-2.5 shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-extrabold shrink-0">
                              {field.nombre_completo?.charAt(0) || 'E'}
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                {field.nombre_completo}
                              </p>
                              {field.rut && (
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                  {field.rut}
                                </p>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => remove(index)}
                            title="Quitar estudiante"
                            className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-2 pt-1 border-t border-gray-200/50 dark:border-gray-700/50">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              {...register(`estudiantes.${index}.es_victima`)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                              Es víctima
                            </span>
                          </label>

                          <textarea
                            {...register(`estudiantes.${index}.observacion`)}
                            placeholder="Observación específica o descargo..."
                            rows={1}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-center text-xs text-gray-500 dark:text-gray-400">
                  Seleccione al menos a un estudiante para continuar con el registro.
                </div>
              )}
            </section>

            {/* CARD 3: RELATO Y MEDIDAS PEDAGÓGICAS */}
            <section className="bg-gradient-to-br from-purple-100/90 via-violet-100/40 to-white dark:from-purple-950/75 dark:via-slate-900/80 dark:to-gray-800 border border-purple-300/90 dark:border-purple-800/80 rounded-2xl p-5 sm:p-6 shadow-md space-y-5 transition-all">
              <div className="flex items-center gap-3 border-b border-purple-200 dark:border-purple-800/60 pb-3.5">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>3. Relato y Medidas Adoptadas</span>
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Describa objetivamente lo ocurrido en tercera persona y las medidas tomadas.
                  </p>
                </div>
              </div>

              {/* Relato del Incidente */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="relato" className="font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Relato del Incidente <span className="text-rose-500">*</span>
                  </label>
                  <span
                    className={`text-[11px] font-semibold ${
                      relato.trim().length >= 20
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {relato.length} caracteres (mín. 20)
                  </span>
                </div>
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
                  placeholder="Describe lo ocurrido con neutralidad: qué pasó, en qué sector y quiénes estaban presentes..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 transition"
                />
                {errors.relato && (
                  <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                    {errors.relato.message}
                  </p>
                )}
              </div>

              {/* Medidas Adoptadas */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="medidas" className="font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Medidas Formativas / Reparatorias Adoptadas
                  </label>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">
                    {medidas.length} caracteres
                  </span>
                </div>
                <textarea
                  id="medidas"
                  {...register('medidas')}
                  rows={3}
                  placeholder="Acciones pedagógicas inmediatas (ej: contención emocional, diálogo formativo, citación apoderado)..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 transition"
                />
              </div>
            </section>
          </div>

          {/* =================================================================== */}
          {/* COLUMNA DERECHA: SIDEBAR RESUMEN STICKY                             */}
          {/* =================================================================== */}
          <aside className="sticky top-20">
            <div className="bg-gradient-to-br from-sky-100/90 via-indigo-100/40 to-white dark:from-slate-900/90 dark:via-indigo-950/60 dark:to-gray-800 border border-sky-300/90 dark:border-sky-800/80 rounded-2xl p-5 shadow-md space-y-5 transition-all">
              <div className="flex items-center gap-2.5 pb-2 border-b border-sky-200 dark:border-sky-800/60">
                <div className="w-7 h-7 rounded-lg bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                    Resumen del Registro
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Control de requisitos en tiempo real
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Progreso de llenado</span>
                  <span className="font-extrabold text-blue-600 dark:text-blue-400">
                    {porcentajeAvance}% completado
                  </span>
                </div>

                {/* Barra de Progreso */}
                <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mt-2">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      porcentajeAvance === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${porcentajeAvance}%` }}
                  />
                </div>
              </div>

              {/* Checklist Interactivo */}
              <div className="space-y-2 border-t border-gray-200 dark:border-gray-700/60 pt-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Requisitos del Incidente
                </span>
                <ul className="space-y-2 text-xs">
                  <li className="flex items-center gap-2.5">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        checkAbordaje
                          ? 'bg-emerald-500 text-white'
                          : 'border-2 border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {checkAbordaje && <Check className="w-3 h-3" />}
                    </span>
                    <span className={checkAbordaje ? 'text-gray-900 dark:text-gray-200 font-semibold' : 'text-gray-500 dark:text-gray-400'}>
                      Tipo de abordaje seleccionado
                    </span>
                  </li>

                  <li className="flex items-center gap-2.5">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        checkFecha
                          ? 'bg-emerald-500 text-white'
                          : 'border-2 border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {checkFecha && <Check className="w-3 h-3" />}
                    </span>
                    <span className={checkFecha ? 'text-gray-900 dark:text-gray-200 font-semibold' : 'text-gray-500 dark:text-gray-400'}>
                      Fecha del suceso definida
                    </span>
                  </li>

                  <li className="flex items-center gap-2.5">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        checkGravedad
                          ? 'bg-emerald-500 text-white'
                          : 'border-2 border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {checkGravedad && <Check className="w-3 h-3" />}
                    </span>
                    <span className={checkGravedad ? 'text-gray-900 dark:text-gray-200 font-semibold' : 'text-gray-500 dark:text-gray-400'}>
                      Nivel de gravedad reglamentaria
                    </span>
                  </li>

                  <li className="flex items-center gap-2.5">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        checkEstudiantes
                          ? 'bg-emerald-500 text-white'
                          : 'border-2 border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {checkEstudiantes && <Check className="w-3 h-3" />}
                    </span>
                    <span className={checkEstudiantes ? 'text-gray-900 dark:text-gray-200 font-semibold' : 'text-gray-500 dark:text-gray-400'}>
                      Al menos un estudiante ({fields.length})
                    </span>
                  </li>

                  <li className="flex items-center gap-2.5">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        checkRelato
                          ? 'bg-emerald-500 text-white'
                          : 'border-2 border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {checkRelato && <Check className="w-3 h-3" />}
                    </span>
                    <span className={checkRelato ? 'text-gray-900 dark:text-gray-200 font-semibold' : 'text-gray-500 dark:text-gray-400'}>
                      Relato objetivo ({relato.length}/20 car.)
                    </span>
                  </li>
                </ul>
              </div>

              {/* Pills de Alumnos Seleccionados */}
              <div className="space-y-2 border-t border-gray-200 dark:border-gray-700/60 pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-700 dark:text-gray-300">
                    Estudiantes seleccionados:
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {fields.length}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {fields.length > 0 ? (
                    fields.map((f, i) => (
                      <span
                        key={f.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white dark:bg-gray-750 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 shadow-2xs"
                      >
                        <span className="truncate max-w-[150px]">{f.nombre_completo}</span>
                        <button
                          type="button"
                          onClick={() => remove(i)}
                          className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-gray-400 hover:text-rose-600 transition"
                          aria-label={`Quitar ${f.nombre_completo}`}
                        >
                          ×
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                      Aún no hay estudiantes seleccionados.
                    </span>
                  )}
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="space-y-2.5 border-t border-gray-200 dark:border-gray-700/60 pt-4">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={!formCompleto || loading}
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition"
                >
                  Registrar Incidente
                </button>

                <button
                  type="button"
                  onClick={handleCancelClick}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-750 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </aside>

          {/* =================================================================== */}
          {/* MODAL DE CONFIRMACIÓN PREVIA AL ENVÍO                                */}
          {/* =================================================================== */}
          {showConfirmModal && (
            <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-gradient-to-br from-blue-100/90 via-indigo-50/60 to-white dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 border border-blue-300 dark:border-gray-700 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      Confirmar Registro de Incidente
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Revise los antecedentes antes de guardar en la bitácora escolar.
                    </p>
                  </div>
                </div>

                <dl className="grid grid-cols-3 gap-2 p-3.5 rounded-xl bg-gray-50/90 dark:bg-gray-900/40 text-xs border border-gray-100 dark:border-gray-700/60">
                  <dt className="text-gray-500 dark:text-gray-400 font-medium">Abordaje:</dt>
                  <dd className="col-span-2 font-bold text-gray-900 dark:text-white">
                    {tipoAbordajeSeleccionado || 'No especificado'}
                  </dd>

                  <dt className="text-gray-500 dark:text-gray-400 font-medium">Gravedad:</dt>
                  <dd className="col-span-2 font-bold text-gray-900 dark:text-white">
                    {gravedad}
                  </dd>

                  <dt className="text-gray-500 dark:text-gray-400 font-medium">Fecha:</dt>
                  <dd className="col-span-2 font-bold text-gray-900 dark:text-white">
                    {fecha}
                  </dd>

                  <dt className="text-gray-500 dark:text-gray-400 font-medium">Estudiantes:</dt>
                  <dd className="col-span-2 font-bold text-gray-900 dark:text-white">
                    {fields.map((f) => f.nombre_completo).join(', ')}
                  </dd>
                </dl>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Volver y Editar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition"
                  >
                    {loading ? 'Guardando...' : 'Confirmar Registro'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* MODAL DE ALERTA DE DESCARTE (SI EL FORMULARIO ESTÁ SUCIO)           */}
          {/* =================================================================== */}
          {showDescartarModal && (
            <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="w-full max-w-sm bg-gradient-to-br from-rose-100/90 via-amber-50/60 to-white dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 border border-rose-300 dark:border-gray-700 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      ¿Descartar este registro?
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Se perderán todos los datos que ha ingresado hasta ahora.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDescartarModal(false)}
                    className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Seguir Editando
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/incidentes')}
                    className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 transition"
                  >
                    Descartar
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Componente de Alerta para Casos Graves o Gravísimos */}
      <AlertaGrave
        show={showAlerta}
        gravedad={gravedadAlerta}
        onClose={() => setShowAlerta(false)}
      />
    </DashboardLayout>
  )
}
