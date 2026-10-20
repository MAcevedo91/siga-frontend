import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  createProtocolo,
  getTiposProtocolo,
  getIncidentesByEstudiante,
} from '@/services/protocolosService'
import { getAntecedentesEscalada } from '@/services/estudiantesService'
import SelectorEstudianteCascada from '@/components/shared/SelectorEstudianteCascada'
import AlertaEscaladaBanner from '@/components/shared/AlertaEscaladaBanner'
import { formatDate } from '@/utils/formatDate'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
  ShieldAlert,
  Users,
  Calendar,
  FileText,
  Check,
  AlertTriangle,
  ArrowLeft,
  X,
  BookOpen,
} from 'lucide-react'

export default function NuevoProtocoloPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tiposProtocolo, setTiposProtocolo] = useState([])
  const [selectedEstudiante, setSelectedEstudiante] = useState(null)
  const [alertaEscalada, setAlertaEscalada] = useState(null)
  const [incidentesRelacionados, setIncidentesRelacionados] = useState([])
  const [loadingIncidentes, setLoadingIncidentes] = useState(false)

  // Modales de control de flujo
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showDescartarModal, setShowDescartarModal] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      tipo_protocolo_id: '',
      fecha_apertura: new Date().toISOString().split('T')[0],
      incidente_id: '',
      observaciones: '',
    },
  })

  const tipoProtocoloId = watch('tipo_protocolo_id')
  const fechaApertura = watch('fecha_apertura')
  const incidenteId = watch('incidente_id')
  const observaciones = watch('observaciones') || ''

  useEffect(() => {
    loadTiposProtocolo()
  }, [])

  useEffect(() => {
    if (selectedEstudiante) {
      loadIncidentesEstudiante()
    } else {
      setIncidentesRelacionados([])
    }
  }, [selectedEstudiante])

  const loadTiposProtocolo = async () => {
    try {
      const data = await getTiposProtocolo()
      setTiposProtocolo(data || [])
    } catch (err) {
      setError('Error al cargar tipos de protocolo')
    }
  }

  const handleSelectEstudiante = async (estudiante) => {
    setSelectedEstudiante(estudiante)
    try {
      const diag = await getAntecedentesEscalada(estudiante.id)
      setAlertaEscalada(diag)
    } catch (err) {
      console.error('Error al consultar antecedentes:', err)
      setAlertaEscalada(null)
    }
  }

  const handleRemoveEstudiante = () => {
    setSelectedEstudiante(null)
    setAlertaEscalada(null)
    setIncidentesRelacionados([])
    setValue('incidente_id', '')
  }

  const loadIncidentesEstudiante = async () => {
    try {
      setLoadingIncidentes(true)
      const data = await getIncidentesByEstudiante(selectedEstudiante.id)
      setIncidentesRelacionados(data || [])
    } catch (err) {
      console.error('Error cargando incidentes', err)
      setIncidentesRelacionados([])
    } finally {
      setLoadingIncidentes(false)
    }
  }

  // Comprobaciones reactivas para checklist y barra de progreso
  const checkTipo = Boolean(tipoProtocoloId)
  const checkEstudiante = Boolean(selectedEstudiante)
  const checkFecha = Boolean(fechaApertura)
  const checkObservaciones = observaciones.trim().length >= 10
  const checkIncidente = Boolean(incidenteId)

  const porcentajeAvance = useMemo(() => {
    let puntos = 0
    if (checkTipo) puntos += 25
    if (checkEstudiante) puntos += 25
    if (checkFecha) puntos += 25
    if (checkObservaciones) puntos += 25
    return puntos
  }, [checkTipo, checkEstudiante, checkFecha, checkObservaciones])

  const formCompleto = checkTipo && checkEstudiante && checkFecha

  const tipoProtocoloSeleccionado = useMemo(() => {
    return tiposProtocolo.find((t) => String(t.id) === String(tipoProtocoloId))?.nombre || ''
  }, [tiposProtocolo, tipoProtocoloId])

  const incidenteSeleccionado = useMemo(() => {
    return incidentesRelacionados.find((i) => String(i.id) === String(incidenteId))
  }, [incidentesRelacionados, incidenteId])

  const handleCancelClick = () => {
    if (checkTipo || checkEstudiante || observaciones.trim().length > 0) {
      setShowDescartarModal(true)
    } else {
      navigate('/protocolos')
    }
  }

  const onSubmit = async (data) => {
    if (!selectedEstudiante) {
      setError('Debes seleccionar un estudiante')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const payload = {
        tipo_protocolo_id: Number(data.tipo_protocolo_id),
        estudiante_id: selectedEstudiante.id,
        incidente_id: data.incidente_id || null,
        fecha_apertura: data.fecha_apertura,
        observaciones: data.observaciones,
      }

      await createProtocolo(payload)
      navigate('/protocolos')
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear protocolo')
    } finally {
      setLoading(false)
      setShowConfirmModal(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Encabezado Superior */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
          <div className="space-y-1">
            <button
              type="button"
              onClick={handleCancelClick}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition mb-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Protocolos</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Nuevo Protocolo RICE
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Apertura y activación formal de protocolos según el Reglamento Interno de Convivencia Escolar.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
              <ShieldAlert className="w-3.5 h-3.5" />
              Actuación Normativa
            </span>
          </div>
        </div>

        {/* Mensaje de Error Global */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/90 dark:border-rose-900/60 dark:bg-rose-950/40 p-4 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-3 shadow-xs">
            <AlertTriangle className="w-4 h-4 mt-0.5 text-rose-600 dark:text-rose-400 shrink-0" />
            <div>
              <p className="font-bold">Error al procesar el protocolo</p>
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
            {/* SECCIÓN 1: CLASIFICACIÓN Y NORMATIVA RICE */}
            <section className="bg-gradient-to-br from-indigo-100/90 via-blue-100/40 to-white dark:from-indigo-950/75 dark:via-slate-900/80 dark:to-gray-800 border border-indigo-300/90 dark:border-indigo-800/80 rounded-2xl p-5 sm:p-6 shadow-md space-y-5 transition-all">
              <div className="flex items-center gap-3 border-b border-indigo-200 dark:border-indigo-800/60 pb-3.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>1. Clasificación del Protocolo RICE</span>
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Seleccione el protocolo normativo reglamentario aplicable según el hecho.
                  </p>
                </div>
              </div>

              {/* Chips Interactivos de Tipos de Protocolo */}
              <div className="space-y-2">
                <label htmlFor="tipo_protocolo_id" className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Tipo de Protocolo <span className="text-rose-500">*</span>
                </label>

                {tiposProtocolo.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {tiposProtocolo.map((tipo) => {
                      const isSelected = String(tipoProtocoloId) === String(tipo.id)
                      const descripcionValida = tipo.descripcion?.trim()
                      return (
                        <button
                          key={tipo.id}
                          type="button"
                          onClick={() => setValue('tipo_protocolo_id', String(tipo.id), { shouldValidate: true })}
                          aria-pressed={isSelected}
                          className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                            isSelected
                              ? 'bg-indigo-50 text-indigo-950 border-indigo-500 font-bold dark:bg-indigo-950/70 dark:text-indigo-200 dark:border-indigo-400 shadow-xs ring-1 ring-indigo-400'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <span
                            className={`w-3 h-3 rounded-full mt-1 shrink-0 ${
                              isSelected ? 'bg-indigo-600 dark:bg-indigo-400' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold leading-tight">{tipo.nombre}</p>
                            {descripcionValida ? (
                              <p className="text-[11px] font-normal text-gray-500 dark:text-gray-400 mt-1 leading-snug line-clamp-2">
                                {descripcionValida}
                              </p>
                            ) : null}
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">Cargando tipos de protocolo...</p>
                )}

                {/* Input oculto para validación y registro en formulario */}
                <input
                  type="hidden"
                  id="tipo_protocolo_id"
                  {...register('tipo_protocolo_id', { required: 'El tipo de protocolo es obligatorio' })}
                />

                {errors.tipo_protocolo_id && (
                  <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-1">
                    {errors.tipo_protocolo_id.message}
                  </p>
                )}
              </div>
            </section>

            {/* SECCIÓN 2: ESTUDIANTE TITULAR Y ALERTAS PREVENTIVAS */}
            <section className="bg-gradient-to-br from-emerald-100/90 via-teal-100/40 to-white dark:from-emerald-950/75 dark:via-slate-900/80 dark:to-gray-800 border border-emerald-300/90 dark:border-teal-800/80 rounded-2xl p-5 sm:p-6 shadow-md space-y-5 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 dark:border-teal-800/60 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <span>2. Estudiante Titular</span>
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Vincule al alumno involucrado para activar las etapas de acompañamiento y notificación.
                    </p>
                  </div>
                </div>

                {selectedEstudiante && (
                  <span className="self-start sm:self-auto text-xs font-bold px-3 py-1 rounded-full bg-emerald-200/90 text-emerald-900 dark:bg-emerald-900/90 dark:text-emerald-100 border border-emerald-400 dark:border-emerald-700 shadow-2xs">
                    Estudiante Vinculado
                  </span>
                )}
              </div>

              {/* Banner de Antecedentes y Riesgo de Escalada */}
              {alertaEscalada?.tiene_alerta && (
                <AlertaEscaladaBanner diagnostico={alertaEscalada} />
              )}

              {/* Selector en Cascada o Tarjeta del Estudiante Seleccionado */}
              {selectedEstudiante ? (
                <div className="rounded-xl border border-emerald-300 dark:border-teal-700 bg-white dark:bg-gray-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold flex items-center justify-center shadow-xs text-sm">
                      {selectedEstudiante.apellido?.[0] || selectedEstudiante.nombre?.[0] || 'E'}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900 dark:text-white">
                        {selectedEstudiante.nombre} {selectedEstudiante.apellido}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        <span>RUT: {selectedEstudiante.rut || 'Sin RUT'}</span>
                        {selectedEstudiante.es_pie && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            Programa PIE
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveEstudiante}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition border border-rose-200 dark:border-rose-900/60 self-start sm:self-auto"
                  >
                    <X className="w-4 h-4" />
                    <span>Cambiar Estudiante</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Búsqueda y Selección de Alumno <span className="text-rose-500">*</span>
                  </label>
                  <SelectorEstudianteCascada onSelectEstudiante={handleSelectEstudiante} />
                </div>
              )}
            </section>

            {/* SECCIÓN 3: FECHA Y ANTECEDENTE RELACIONADO */}
            <section className="bg-gradient-to-br from-amber-100/90 via-orange-100/40 to-white dark:from-amber-950/75 dark:via-slate-900/80 dark:to-gray-800 border border-amber-300/90 dark:border-amber-800/80 rounded-2xl p-5 sm:p-6 shadow-md space-y-5 transition-all">
              <div className="flex items-center gap-3 border-b border-amber-200 dark:border-amber-800/60 pb-3.5">
                <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>3. Fecha de Apertura y Antecedente Relacionado</span>
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Defina la fecha oficial de inicio de plazos y vincule el incidente origen si corresponde.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Fecha de Apertura */}
                <div className="space-y-1.5">
                  <label htmlFor="fecha_apertura" className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Fecha de Apertura <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="fecha_apertura"
                    {...register('fecha_apertura', { required: 'La fecha es obligatoria' })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  />
                  {errors.fecha_apertura && (
                    <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-1">
                      {errors.fecha_apertura.message}
                    </p>
                  )}
                </div>

                {/* Incidente Relacionado (Opcional) */}
                <div className="space-y-1.5">
                  <label htmlFor="incidente_id" className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Incidente Base Vinculado <span className="text-xs font-normal text-gray-500">(Opcional)</span>
                  </label>

                  {selectedEstudiante ? (
                    loadingIncidentes ? (
                      <div className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center gap-2 text-xs text-gray-500">
                        <div className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                        <span>Cargando incidentes previos del estudiante...</span>
                      </div>
                    ) : (
                      <select
                        id="incidente_id"
                        {...register('incidente_id')}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                      >
                        <option value="">Sin incidente previo relacionado</option>
                        {incidentesRelacionados.map((inc) => (
                          <option key={inc.id} value={inc.id}>
                            {formatDate(inc.fecha)} - {inc.tipo_abordaje} ({inc.gravedad})
                          </option>
                        ))}
                      </select>
                    )
                  ) : (
                    <div className="px-3.5 py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 text-xs text-gray-400 italic">
                      Seleccione primero a un estudiante para consultar sus incidentes.
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* SECCIÓN 4: OBSERVACIONES Y DILIGENCIAS */}
            <section className="bg-gradient-to-br from-purple-100/90 via-violet-100/40 to-white dark:from-purple-950/75 dark:via-slate-900/80 dark:to-gray-800 border border-purple-300/90 dark:border-purple-800/80 rounded-2xl p-5 sm:p-6 shadow-md space-y-5 transition-all">
              <div className="flex items-center gap-3 border-b border-purple-200 dark:border-purple-800/60 pb-3.5">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>4. Observaciones y Diligencias Iniciales</span>
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Consigne los hechos preliminares, medidas de resguardo urgentes o citaciones previas.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="observaciones" className="font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Detalle del Caso y Situación Inicial
                  </label>
                  <span
                    className={`text-[11px] font-semibold ${
                      observaciones.trim().length >= 10
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {observaciones.length} caracteres
                  </span>
                </div>
                <textarea
                  id="observaciones"
                  {...register('observaciones')}
                  rows={4}
                  placeholder="Describa el contexto de la situación, primeros antecedentes recibidos y medidas inmediatas tomadas por el establecimiento..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400 transition"
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
                <div className="w-7 h-7 rounded-lg bg-indigo-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  <BookOpen className="w-4 h-4 text-cyan-300" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                    Resumen del Protocolo
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Control de requisitos RICE
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Progreso de apertura</span>
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                    {porcentajeAvance}% completado
                  </span>
                </div>

                {/* Barra de Progreso */}
                <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mt-2">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      porcentajeAvance === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${porcentajeAvance}%` }}
                  />
                </div>
              </div>

              {/* Checklist de Requisitos RICE */}
              <div className="space-y-2 border-t border-gray-200 dark:border-gray-700/60 pt-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Requisitos de Activación
                </span>
                <ul className="space-y-2 text-xs">
                  <li className="flex items-center gap-2.5">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        checkTipo
                          ? 'bg-emerald-500 text-white'
                          : 'border-2 border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {checkTipo && <Check className="w-3 h-3" />}
                    </span>
                    <span className={checkTipo ? 'text-gray-900 dark:text-gray-200 font-semibold' : 'text-gray-500 dark:text-gray-400'}>
                      Tipo de protocolo reglamentario
                    </span>
                  </li>

                  <li className="flex items-center gap-2.5">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        checkEstudiante
                          ? 'bg-emerald-500 text-white'
                          : 'border-2 border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {checkEstudiante && <Check className="w-3 h-3" />}
                    </span>
                    <span className={checkEstudiante ? 'text-gray-900 dark:text-gray-200 font-semibold' : 'text-gray-500 dark:text-gray-400'}>
                      Estudiante titular vinculado
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
                      Fecha oficial de apertura
                    </span>
                  </li>

                  <li className="flex items-center gap-2.5">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        checkIncidente
                          ? 'bg-amber-500 text-white'
                          : 'border-2 border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {checkIncidente ? <Check className="w-3 h-3" /> : '•'}
                    </span>
                    <span className={checkIncidente ? 'text-gray-900 dark:text-gray-200 font-semibold' : 'text-gray-500 dark:text-gray-400'}>
                      Incidente base {checkIncidente ? 'vinculado' : '(opcional)'}
                    </span>
                  </li>

                  <li className="flex items-center gap-2.5">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        checkObservaciones
                          ? 'bg-emerald-500 text-white'
                          : 'border-2 border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {checkObservaciones && <Check className="w-3 h-3" />}
                    </span>
                    <span className={checkObservaciones ? 'text-gray-900 dark:text-gray-200 font-semibold' : 'text-gray-500 dark:text-gray-400'}>
                      Observaciones iniciales ({observaciones.length} car.)
                    </span>
                  </li>
                </ul>
              </div>

              {/* Pill del Estudiante Titular */}
              <div className="space-y-2 border-t border-gray-200 dark:border-gray-700/60 pt-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Estudiante Vinculado:
                </span>
                {selectedEstudiante ? (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="truncate">
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        Titular: {selectedEstudiante.nombre} {selectedEstudiante.apellido}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {selectedEstudiante.rut || 'Sin RUT'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveEstudiante}
                      className="p-1 rounded-lg text-gray-400 hover:text-rose-600 transition"
                      title="Quitar estudiante"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                    Sin estudiante asignado.
                  </p>
                )}
              </div>

              {/* Botones de Acción */}
              <div className="space-y-2.5 border-t border-gray-200 dark:border-gray-700/60 pt-4">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={!formCompleto || loading}
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition flex items-center justify-center gap-2"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Aperturar Protocolo RICE</span>
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
              <div className="w-full max-w-md bg-gradient-to-br from-indigo-100/90 via-blue-50/60 to-white dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 border border-indigo-300 dark:border-gray-700 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      Confirmar Apertura de Protocolo RICE
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Verifique los antecedentes antes de activar los plazos reglamentarios.
                    </p>
                  </div>
                </div>

                <dl className="grid grid-cols-3 gap-2 p-3.5 rounded-xl bg-gray-50/90 dark:bg-gray-900/40 text-xs border border-gray-100 dark:border-gray-700/60">
                  <dt className="text-gray-500 dark:text-gray-400 font-medium">Protocolo:</dt>
                  <dd className="col-span-2 font-bold text-gray-900 dark:text-white">
                    {tipoProtocoloSeleccionado || 'No seleccionado'}
                  </dd>

                  <dt className="text-gray-500 dark:text-gray-400 font-medium">Estudiante:</dt>
                  <dd className="col-span-2 font-bold text-gray-900 dark:text-white">
                    {selectedEstudiante
                      ? `${selectedEstudiante.nombre} ${selectedEstudiante.apellido}`
                      : 'No seleccionado'}
                  </dd>

                  <dt className="text-gray-500 dark:text-gray-400 font-medium">Fecha:</dt>
                  <dd className="col-span-2 font-bold text-gray-900 dark:text-white">
                    {fechaApertura}
                  </dd>

                  <dt className="text-gray-500 dark:text-gray-400 font-medium">Incidente Base:</dt>
                  <dd className="col-span-2 font-bold text-gray-900 dark:text-white">
                    {incidenteSeleccionado
                      ? `${formatDate(incidenteSeleccionado.fecha)} - ${incidenteSeleccionado.tipo_abordaje}`
                      : 'Sin incidente previo vinculado'}
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
                    className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 transition"
                  >
                    {loading ? 'Aperturando...' : 'Confirmar Apertura'}
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
                      ¿Descartar este protocolo?
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Se perderán todos los datos y selecciones ingresadas hasta ahora.
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
                    onClick={() => navigate('/protocolos')}
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
    </DashboardLayout>
  )
}
