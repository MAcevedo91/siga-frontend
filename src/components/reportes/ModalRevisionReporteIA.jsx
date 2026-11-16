import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  Pencil,
  Save,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Loader2,
  ExternalLink,
  Mail,
  ShieldAlert,
} from 'lucide-react'
import toast from 'react-hot-toast'
import DlpSensitiveText from '@/components/dlp/DlpSensitiveText'
import {
  guardarBorradorReporte,
  aprobarReporte,
  generarBorradoresReporte,
  descargarReportePdf,
} from '@/services/reportesService'
import { ROLES_APROBACION_REPORTES } from '@/constants/roles'
import { formatDate, formatDateTime } from '@/utils/formatDate'

const SECCIONES_CONFIG = [
  {
    key: 'contexto',
    titulo: '1. Contexto Institucional y Espacial',
    placeholder: 'Describa el entorno y circunstancias donde se produjo el hecho...',
    minRows: 3,
  },
  {
    key: 'hechos_objetivos',
    titulo: '2. Hechos Objetivos Constatados',
    placeholder: 'Detalle los hechos observados y declaraciones recogidas de forma cronológica...',
    minRows: 4,
  },
  {
    key: 'medidas_adoptadas',
    titulo: '3. Medidas Inmediatas Adoptadas',
    placeholder: 'Especifique las medidas de apoyo, contención o resguardo activadas...',
    minRows: 3,
  },
  {
    key: 'acuerdos_compromisos',
    titulo: '4. Acuerdos y Compromisos Pedagógicos',
    placeholder: 'Registre los compromisos formativos suscritos por las partes...',
    minRows: 3,
  },
  {
    key: 'plan_seguimiento',
    titulo: '5. Plan de Acompañamiento y Seguimiento',
    placeholder: 'Indique los hitos y responsables del seguimiento formativo posterior...',
    minRows: 3,
  },
]

export default function ModalRevisionReporteIA({
  isOpen,
  onClose,
  incidente,
  reportes = [],
  initialReporteId = null,
  currentUser,
  onReportesActualizados,
}) {
  const [reportesList, setReportesList] = useState([])
  const [selectedReporteId, setSelectedReporteId] = useState(null)
  const [edicionesPorReporte, setEdicionesPorReporte] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [aprobando, setAprobando] = useState(false)
  const [regenerando, setRegenerando] = useState(false)
  const [descargandoPdf, setDescargandoPdf] = useState(false)
  const [mostrarConfirmAprobacion, setMostrarConfirmAprobacion] = useState(false)
  const [mostrarConfirmRegenerar, setMostrarConfirmRegenerar] = useState(false)
  const prevIsOpenRef = useRef(false)
  const prevInitialReporteIdRef = useRef(initialReporteId)

  // Roles con permiso para aprobar formalmente (excluye Inspector y Docente)
  const puedeAprobar = ROLES_APROBACION_REPORTES.includes(currentUser?.rol)

  // Inicializar o sincronizar reportes al abrir sin bloquear selección manual de pestañas
  useEffect(() => {
    if (isOpen && reportes.length > 0) {
      setReportesList(reportes)

      const isNewlyOpened = !prevIsOpenRef.current && isOpen
      const initialChanged = prevInitialReporteIdRef.current !== initialReporteId

      if (isNewlyOpened || initialChanged || !selectedReporteId) {
        const targetId =
          initialReporteId && reportes.some((r) => r.id === initialReporteId)
            ? initialReporteId
            : reportes.find((r) => r.estado !== 'Aprobado')?.id || reportes[0].id
        setSelectedReporteId(targetId)
      } else if (!reportes.some((r) => r.id === selectedReporteId)) {
        setSelectedReporteId(reportes[0].id)
      }

      prevIsOpenRef.current = isOpen
      prevInitialReporteIdRef.current = initialReporteId

      // Preservar ediciones previas o inicializar con contenido más reciente
      setEdicionesPorReporte((prev) => {
        const nuevasEdiciones = { ...prev }
        reportes.forEach((rep) => {
          if (!nuevasEdiciones[rep.id]) {
            const contenidoBase =
              rep.contenido_aprobado || rep.contenido_editado || rep.contenido_borrador || {}
            nuevasEdiciones[rep.id] = {
              contexto: contenidoBase.contexto || '',
              hechos_objetivos: contenidoBase.hechos_objetivos || '',
              medidas_adoptadas: contenidoBase.medidas_adoptadas || '',
              acuerdos_compromisos: contenidoBase.acuerdos_compromisos || '',
              plan_seguimiento: contenidoBase.plan_seguimiento || '',
            }
          }
        })
        return nuevasEdiciones
      })
    } else if (!isOpen) {
      prevIsOpenRef.current = false
    }
  }, [isOpen, reportes, initialReporteId, selectedReporteId])

  if (!isOpen) return null

  const reporteActual = reportesList.find((r) => r.id === selectedReporteId) || reportesList[0]
  const contenidoActual = edicionesPorReporte[reporteActual?.id] || {
    contexto: '',
    hechos_objetivos: '',
    medidas_adoptadas: '',
    acuerdos_compromisos: '',
    plan_seguimiento: '',
  }

  const esReporteAprobado = reporteActual?.estado === 'Aprobado'

  // Información del aprobador y fecha
  const nombreAprobador = reporteActual?.aprobador
    ? `${reporteActual.aprobador.nombre} ${reporteActual.aprobador.apellido} (${reporteActual.aprobador.rol})`
    : 'Jefatura Institucional'
  const fechaAprobacion = reporteActual?.fecha_aprobacion
    ? formatDate(reporteActual.fecha_aprobacion)
    : formatDate(new Date().toISOString())

  // Información del apoderado y despacho de correo
  const apoderadoTitular =
    reporteActual?.estudiantes?.apoderados?.find((a) => a.es_titular) ||
    reporteActual?.estudiantes?.apoderados?.[0] ||
    null
  const apoderadoEmail = apoderadoTitular?.email
  const emailEnviado = !!reporteActual?.email_apoderado_enviado
  const fechaEnvioEmail = reporteActual?.fecha_envio_email

  // Manejador de cambio en inputs
  const handleSeccionChange = (key, value) => {
    if (esReporteAprobado || !reporteActual) return
    setEdicionesPorReporte((prev) => ({
      ...prev,
      [reporteActual.id]: {
        ...prev[reporteActual.id],
        [key]: value,
      },
    }))
  }

  // Guardar borrador en el servidor
  const handleGuardarBorrador = async () => {
    if (!reporteActual) return
    try {
      setGuardando(true)
      const dataActualizada = await guardarBorradorReporte(
        incidente.id,
        reporteActual.id,
        contenidoActual
      )

      toast.success('Borrador de informe guardado exitosamente')

      const nuevaLista = reportesList.map((r) => (r.id === reporteActual.id ? dataActualizada : r))
      setReportesList(nuevaLista)
      if (onReportesActualizados) {
        onReportesActualizados(nuevaLista)
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al guardar el borrador del informe'
      toast.error(msg)
    } finally {
      setGuardando(false)
    }
  }

  // Confirmar y aprobar reporte actual
  const handleAprobarReporte = async () => {
    if (!puedeAprobar || !reporteActual) return
    try {
      setAprobando(true)
      const dataAprobada = await aprobarReporte(incidente.id, reporteActual.id, contenidoActual)

      toast.success('Informe aprobado y oficializado con éxito')
      setMostrarConfirmAprobacion(false)

      const nuevaLista = reportesList.map((r) => (r.id === reporteActual.id ? dataAprobada : r))
      setReportesList(nuevaLista)
      if (onReportesActualizados) {
        onReportesActualizados(nuevaLista)
      }

      // Si quedan otros reportes en borrador, mover el foco automáticamente al siguiente pendiente
      const siguientePendiente = nuevaLista.find((r) => r.estado !== 'Aprobado')
      if (siguientePendiente) {
        setSelectedReporteId(siguientePendiente.id)
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al aprobar el informe'
      toast.error(msg)
    } finally {
      setAprobando(false)
    }
  }

  // Regenerar propuesta asistida
  const handleRegenerarPropuesta = async () => {
    try {
      setRegenerando(true)
      const nuevosReportes = await generarBorradoresReporte(incidente.id)

      toast.success('Propuestas regeneradas exitosamente')
      setMostrarConfirmRegenerar(false)
      setReportesList(nuevosReportes)

      const edicionesNuevas = {}
      nuevosReportes.forEach((rep) => {
        const contenidoBase = rep.contenido_borrador || {}
        edicionesNuevas[rep.id] = {
          contexto: contenidoBase.contexto || '',
          hechos_objetivos: contenidoBase.hechos_objetivos || '',
          medidas_adoptadas: contenidoBase.medidas_adoptadas || '',
          acuerdos_compromisos: contenidoBase.acuerdos_compromisos || '',
          plan_seguimiento: contenidoBase.plan_seguimiento || '',
        }
      })
      setEdicionesPorReporte(edicionesNuevas)

      if (onReportesActualizados) {
        onReportesActualizados(nuevosReportes)
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al regenerar la propuesta asistida'
      toast.error(msg)
    } finally {
      setRegenerando(false)
    }
  }

  // Descargar o abrir en pestaña PDF del reporte actual
  const handleDescargarPdf = async (abrirEnNuevaPestana = false) => {
    if (!reporteActual) return
    try {
      setDescargandoPdf(true)
      const apellidoLimpio = (reporteActual.estudiantes?.apellido || 'Estudiante')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_')
      const esPreview = !esReporteAprobado
      const prefix = esPreview ? 'Validacion_Borrador' : 'Informe_Incidente'
      const filename = `${prefix}_${incidente.id}_${apellidoLimpio}.pdf`

      if (esPreview) {
        await descargarReportePdf(incidente.id, reporteActual.id, filename, abrirEnNuevaPestana, true)
      } else {
        await descargarReportePdf(incidente.id, reporteActual.id, filename, abrirEnNuevaPestana)
      }

      if (abrirEnNuevaPestana) {
        toast.success(
          esPreview
            ? 'Abriendo vista previa para validación del documento'
            : 'Abriendo PDF oficial en nueva pestaña'
        )
      } else {
        toast.success(`Descarga iniciada: ${filename}`)
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al generar el archivo PDF'
      toast.error(msg)
    } finally {
      setDescargandoPdf(false)
    }
  }

  const incidenteCorrelativo = String(incidente.id || '').replace(/-/g, '').slice(0, 8)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 sm:p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-reporte-titulo"
    >
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col rounded-2xl bg-white dark:bg-gray-900 shadow-2xl transition-all overflow-hidden border border-gray-100 dark:border-gray-800">
        {/* ENCABEZADO MINIMALISTA */}
        <header className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2
              id="modal-reporte-titulo"
              className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2"
            >
              <span>Informe de incidente</span>
              <span className="sr-only">Asistente de Redacción Normativa RICE</span>
              <span
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-800/60"
                title="Redactado con IA y revisado por una persona"
              >
                <Pencil className="w-3.5 h-3.5" />
                IA + revisión
              </span>
            </h2>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
              #{incidenteCorrelativo} · Escuela Coeducacional N°1 El Salvador
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* SELECTOR DE PESTAÑAS (TABS) CUANDO HAY INFORMES DIFERENCIADOS */}
        {reportesList.length > 0 && (
          <div
            className="flex gap-2 px-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-850 overflow-x-auto"
            role="tablist"
          >
            {reportesList.map((rep, idx) => {
              const est = rep.estudiantes || {}
              const isSelected = rep.id === selectedReporteId
              const isAprobado = rep.estado === 'Aprobado'
              return (
                <button
                  key={rep.id}
                  type="button"
                  aria-selected={isSelected}
                  onClick={() => setSelectedReporteId(rep.id)}
                  className={`flex items-center gap-2 px-3 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap -mb-[1px] ${
                    isSelected
                      ? 'border-indigo-600 text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      isAprobado ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  <DlpSensitiveText tipo="nombre">
                    {est.nombre ? `${est.nombre} ${est.apellido}` : `Estudiante ${idx + 1}`}
                  </DlpSensitiveText>
                </button>
              )
            })}
          </div>
        )}

        {/* CUERPO PRINCIPAL DEL MODAL */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* BANNER DE ESTADO */}
          {esReporteAprobado ? (
            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <b className="block text-base font-bold text-emerald-900 dark:text-emerald-100">
                  Aprobado
                </b>
                <span className="text-xs text-emerald-700 dark:text-emerald-400">
                  {fechaAprobacion} · {nombreAprobador}
                </span>
                <span className="sr-only">
                  Informe Oficial Aprobado por {nombreAprobador} el {fechaAprobacion}
                </span>
              </div>
              <div className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 text-right">
                <Mail className="w-4 h-4 shrink-0" />
                <span>
                  {emailEnviado
                    ? `Correo entregado con PDF a ${apoderadoEmail || 'apoderado'}`
                    : apoderadoEmail
                    ? `Apoderado notificado: ${apoderadoEmail}`
                    : 'Apoderado sin correo'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/60 flex-wrap sm:flex-nowrap">
              <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Pencil className="w-5 h-5 text-white" />
              </div>
              <div>
                <b className="block text-base font-bold text-amber-900 dark:text-amber-100">
                  Borrador
                </b>
                <span className="text-xs text-amber-700 dark:text-amber-400">
                  Falta tu aprobación
                </span>
              </div>
              <div className="sm:ml-auto flex items-center gap-3 text-xs font-semibold text-amber-800 dark:text-amber-300 text-right flex-wrap">
                <button
                  type="button"
                  onClick={() => setMostrarConfirmRegenerar(true)}
                  disabled={regenerando || guardando || aprobando}
                  aria-label="Regenerar Propuesta"
                  title="Volver a redactar borrador asistido"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white/90 dark:bg-amber-900/50 hover:bg-white dark:hover:bg-amber-900 text-amber-900 dark:text-amber-100 transition-colors shadow-2xs text-xs font-medium disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Regenerar propuesta</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>
                    {apoderadoEmail
                      ? `Se notificará a ${apoderadoEmail} al aprobar`
                      : 'Apoderado sin correo registrado'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ALERTA DE APODERADO SIN CORREO SI YA ESTÁ APROBADO */}
          {!apoderadoEmail && esReporteAprobado && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-50 border border-amber-300 px-4 py-2.5 text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  Apoderado sin correo registrado. Imprimir copia para citación presencial.
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDescargarPdf(false)}
                className="font-semibold text-amber-900 underline hover:text-amber-950 transition-colors"
              >
                Imprimir copia oficial &rarr;
              </button>
            </div>
          )}

          {/* SECCIONES FORMATIVAS Y OBJETIVAS */}
          <div className="space-y-4">
            {SECCIONES_CONFIG.map((seccion) => {
              const valor = contenidoActual[seccion.key] || ''
              const charCount = valor.length

              return (
                <section key={seccion.key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor={`seccion-${seccion.key}`}
                      className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      {seccion.titulo}
                    </label>
                    {!esReporteAprobado && (
                      <em className="not-italic text-xs font-mono text-gray-400">
                        {charCount} caracteres
                      </em>
                    )}
                  </div>
                  {esReporteAprobado ? (
                    <p className="m-0 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700 text-sm leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                      {valor || 'Sin registro en esta sección.'}
                    </p>
                  ) : (
                    <textarea
                      id={`seccion-${seccion.key}`}
                      aria-label={seccion.titulo}
                      rows={seccion.minRows || 3}
                      value={valor}
                      onChange={(e) => handleSeccionChange(seccion.key, e.target.value)}
                      placeholder={seccion.placeholder}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3.5 text-sm leading-relaxed text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-y transition-colors min-h-[72px]"
                    />
                  )}
                </section>
              )
            })}
          </div>
        </div>

        {/* DIÁLOGO MODAL INTERNO: CONFIRMAR APROBACIÓN */}
        {mostrarConfirmAprobacion && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs rounded-2xl">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 text-emerald-600 mb-3">
                <CheckCircle className="h-6 w-6 shrink-0" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Oficializar y Aprobar Informe
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                Al oficializar este informe, adquirirá <strong>validez institucional formal</strong> conforme
                a la Circular N° 482 y el RICE. Se formalizará la aprobación y se enviará la copia oficial al apoderado titular.
              </p>
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setMostrarConfirmAprobacion(false)}
                  disabled={aprobando}
                  className="rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAprobarReporte}
                  disabled={aprobando}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm transition-colors disabled:opacity-50"
                >
                  {aprobando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Confirmar Aprobación
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DIÁLOGO MODAL INTERNO: CONFIRMAR REGENERACIÓN */}
        {mostrarConfirmRegenerar && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs rounded-2xl">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 text-indigo-600 mb-3">
                <RefreshCw className="h-6 w-6 shrink-0" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Regenerar Propuesta con IA
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                ¿Deseas volver a redactar la propuesta con el asistente pedagógico?{' '}
                <strong className="text-gray-900 dark:text-white">
                  Se descartarán las modificaciones manuales no guardadas.
                </strong>
              </p>
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setMostrarConfirmRegenerar(false)}
                  disabled={regenerando}
                  className="rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleRegenerarPropuesta}
                  disabled={regenerando}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm transition-colors disabled:opacity-50"
                >
                  {regenerando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Sí, Regenerar Propuesta
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PIE DEL MODAL (FOOTER MINIMALISTA: ABRIR EN PESTAÑA Y APROBAR / DESCARGAR) */}
        <footer className="flex items-center gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-850">
          <button
            type="button"
            onClick={() => handleDescargarPdf(true)}
            disabled={descargandoPdf}
            title="Ver en pestaña nueva"
            aria-label="Ver en pestaña"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors shadow-2xs disabled:opacity-50"
          >
            <ExternalLink className="w-4 h-4 text-gray-500" />
            <span className="hidden sm:inline">Abrir en pestaña</span>
            <span className="sm:hidden">Ver</span>
          </button>

          {!esReporteAprobado && (
            <button
              type="button"
              onClick={handleGuardarBorrador}
              disabled={guardando || aprobando}
              aria-label="Guardar Borrador"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors shadow-2xs disabled:opacity-50"
            >
              {guardando ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
              ) : (
                <Save className="w-4 h-4 text-gray-500" />
              )}
              <span className="hidden sm:inline">Guardar borrador</span>
              <span className="sm:hidden">Guardar</span>
            </button>
          )}

          {/* BOTÓN PRINCIPAL (DERECHA) */}
          <div className="ml-auto flex items-center gap-2">
            {esReporteAprobado ? (
              <button
                type="button"
                onClick={() => handleDescargarPdf(false)}
                disabled={descargandoPdf}
                aria-label="Descargar PDF Oficial"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-950 hover:bg-gray-900 dark:bg-white dark:text-gray-950 text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs disabled:opacity-50"
              >
                {descargandoPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Descargar PDF</span>
              </button>
            ) : puedeAprobar ? (
              <button
                type="button"
                onClick={() => setMostrarConfirmAprobacion(true)}
                disabled={guardando || aprobando}
                aria-label="Aprobar y Oficializar"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs disabled:opacity-50"
              >
                {aprobando ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>Aprobar y notificar</span>
              </button>
            ) : (
              <div
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 text-xs sm:text-sm font-semibold cursor-not-allowed border border-gray-200 dark:border-gray-700"
                title="Aprobación reservada a Jefatura y Convivencia Escolar"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Aprobación reservada a Jefatura</span>
              </div>
            )}
          </div>
        </footer>
      </div>
    </div>
  )
}
