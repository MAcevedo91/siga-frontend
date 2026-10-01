import React, { useState, useEffect } from 'react'
import {
  X,
  Sparkles,
  Save,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  FileText,
  User,
  Clock,
  ShieldAlert,
  Loader2,
  ExternalLink,
  MailCheck,
  Mail,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  guardarBorradorReporte,
  aprobarReporte,
  generarBorradoresReporte,
  descargarReportePdf,
} from '@/services/reportesService'
import { formatDate, formatDateTime } from '@/utils/formatDate'

const SECCIONES_CONFIG = [
  {
    key: 'contexto',
    titulo: '1. Contexto Institucional y Espacial',
    descripcion: 'Espacio físico, fecha aproximada, condiciones ambientales y dinámica del entorno.',
    placeholder: 'Describa el entorno y circunstancias donde se produjo el hecho...',
    minRows: 3,
  },
  {
    key: 'hechos_objetivos',
    titulo: '2. Hechos Objetivos Constatados',
    descripcion: 'Relato factual en tercera persona, observable, fidedigno y libre de sesgos o condenas prematuras.',
    placeholder: 'Detalle los hechos observados y declaraciones recogidas de forma cronológica...',
    minRows: 4,
  },
  {
    key: 'medidas_adoptadas',
    titulo: '3. Medidas Inmediatas Adoptadas',
    descripcion: 'Acciones de contención, mediación o resguardo pedagógico implementadas por el personal escolar.',
    placeholder: 'Especifique las medidas de apoyo, contención o resguardo activadas...',
    minRows: 3,
  },
  {
    key: 'acuerdos_compromisos',
    titulo: '4. Acuerdos y Compromisos Pedagógicos',
    descripcion: 'Compromisos de convivencia, formativos o reparatorios convenidos con el estudiante y su familia.',
    placeholder: 'Registre los compromisos formativos suscritos por las partes...',
    minRows: 3,
  },
  {
    key: 'plan_seguimiento',
    titulo: '5. Plan de Acompañamiento y Seguimiento',
    descripcion: 'Plan de observación y acompañamiento por parte de la Dupla Psicosocial, Profesor/a Jefe o Convivencia.',
    placeholder: 'Indique los hitos y responsables del seguimiento formativo posterior...',
    minRows: 3,
  },
]

export default function ModalRevisionReporteIA({
  isOpen,
  onClose,
  incidente,
  reportes = [],
  currentUser,
  onReportesActualizados,
}) {
  const [reportesList, setReportesList] = useState([])
  const [selectedReporteId, setSelectedReporteId] = useState(null)
  // Diccionario para preservar ediciones en vivo por reporteId sin perder cambios al cambiar de tab
  const [edicionesPorReporte, setEdicionesPorReporte] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [aprobando, setAprobando] = useState(false)
  const [regenerando, setRegenerando] = useState(false)
  const [descargandoPdf, setDescargandoPdf] = useState(false)
  const [mostrarConfirmAprobacion, setMostrarConfirmAprobacion] = useState(false)
  const [mostrarConfirmRegenerar, setMostrarConfirmRegenerar] = useState(false)

  // Roles con permiso para aprobar formalmente (excluye Inspector y Docente)
  const puedeAprobar = ['Administrador', 'Directivo', 'Equipo de Formación'].includes(currentUser?.rol)

  // Inicializar o sincronizar reportes al abrir
  useEffect(() => {
    if (isOpen && reportes.length > 0) {
      setReportesList(reportes)
      if (!selectedReporteId || !reportes.some((r) => r.id === selectedReporteId)) {
        setSelectedReporteId(reportes[0].id)
      }

      // Inicializar el diccionario de ediciones con el contenido más reciente disponible
      const edicionesIniciales = {}
      reportes.forEach((rep) => {
        const contenidoBase = rep.contenido_aprobado || rep.contenido_editado || rep.contenido_borrador || {}
        edicionesIniciales[rep.id] = {
          contexto: contenidoBase.contexto || '',
          hechos_objetivos: contenidoBase.hechos_objetivos || '',
          medidas_adoptadas: contenidoBase.medidas_adoptadas || '',
          acuerdos_compromisos: contenidoBase.acuerdos_compromisos || '',
          plan_seguimiento: contenidoBase.plan_seguimiento || '',
        }
      })
      setEdicionesPorReporte(edicionesIniciales)
    }
  }, [isOpen, reportes])

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

  // Información del apoderado y despacho de correo (HU 6.4.2)
  const apoderadoTitular =
    reporteActual?.estudiantes?.apoderados?.find((a) => a.es_titular) ||
    reporteActual?.estudiantes?.apoderados?.[0] ||
    null
  const apoderadoEmail = apoderadoTitular?.email
  const emailEnviado = !!reporteActual?.email_apoderado_enviado
  const fechaEnvioEmail = reporteActual?.fecha_envio_email

  // Verifica si el texto actual difiere del contenido original de la IA
  const estaEditadoManualmente = () => {
    if (!reporteActual) return false
    const borradorOriginal = reporteActual.contenido_borrador || {}
    return SECCIONES_CONFIG.some((s) => (contenidoActual[s.key] || '').trim() !== (borradorOriginal[s.key] || '').trim())
  }

  // Manejador de cambio en inputs
  const handleSeccionChange = (key, value) => {
    if (esReporteAprobado) return // No editable si ya está aprobado
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

      // Actualizar lista en estado local
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

  // Confirmar y aprobar reporte
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
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al aprobar el informe'
      toast.error(msg)
    } finally {
      setAprobando(false)
    }
  }

  // Regenerar propuesta asistida por IA
  const handleRegenerarPropuesta = async () => {
    try {
      setRegenerando(true)
      const nuevosReportes = await generarBorradoresReporte(incidente.id)

      toast.success('Propuestas regeneradas exitosamente')
      setMostrarConfirmRegenerar(false)
      setReportesList(nuevosReportes)

      // Actualizar estado de ediciones
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

  // Descargar o abrir en pestaña PDF del reporte actual (HU 6.3.2)
  const handleDescargarPdf = async (abrirEnNuevaPestana = false) => {
    if (!reporteActual) return
    try {
      setDescargandoPdf(true)
      const apellidoLimpio = (reporteActual.estudiantes?.apellido || 'Estudiante')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_')
      const filename = `Informe_Incidente_${incidente.id}_${apellidoLimpio}.pdf`

      await descargarReportePdf(incidente.id, reporteActual.id, filename, abrirEnNuevaPestana)

      if (abrirEnNuevaPestana) {
        toast.success('Abriendo PDF oficial en nueva pestaña')
      } else {
        toast.success(`Descarga iniciada: ${filename}`)
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al descargar el archivo PDF oficial'
      toast.error(msg)
    } finally {
      setDescargandoPdf(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 sm:p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-reporte-titulo"
    >
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl transition-all">
        {/* ENCABEZADO */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-blue-900 to-indigo-900 px-6 py-4 text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-blue-200">
              <Sparkles className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h2 id="modal-reporte-titulo" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Asistente de Redacción Normativa RICE
                <span className="rounded-full bg-blue-500/30 px-2.5 py-0.5 text-xs font-medium text-blue-100 border border-blue-400/30">
                  Human-in-the-Loop
                </span>
              </h2>
              <p className="text-xs text-blue-200/80">
                Incidente #{incidente.id} — Escuela Coeducacional N°1 El Salvador
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-blue-200 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* SELECTOR DE PESTAÑAS (TABS) CUANDO HAY INFORMES DIFERENCIADOS */}
        {reportesList.length > 1 && (
          <div className="flex border-b border-gray-200 bg-gray-50 px-6 pt-3 overflow-x-auto gap-2">
            {reportesList.map((rep, idx) => {
              const est = rep.estudiantes || {}
              const isSelected = rep.id === selectedReporteId
              return (
                <button
                  key={rep.id}
                  onClick={() => setSelectedReporteId(rep.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap rounded-t-lg ${
                    isSelected
                      ? 'border-blue-600 bg-white text-blue-700 shadow-sm'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span>
                    {est.nombre ? `${est.nombre} ${est.apellido}` : `Informe Estudiante ${idx + 1}`}
                  </span>
                  {rep.estado === 'Aprobado' ? (
                    <span className="ml-1.5 rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[11px] font-semibold">
                      Aprobado
                    </span>
                  ) : (
                    <span className="ml-1.5 rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[11px] font-semibold">
                      Borrador
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* METADATOS Y BADGES DEL INFORME ACTIVO */}
        {reporteActual && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-slate-50/70 px-6 py-2.5 text-xs text-gray-600">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-gray-700">Estudiante Foco:</span>
              <span className="rounded bg-blue-100 px-2 py-0.5 font-medium text-blue-800">
                {reporteActual.estudiantes
                  ? `${reporteActual.estudiantes.nombre} ${reporteActual.estudiantes.apellido}`
                  : 'Estudiante'}
              </span>
              {reporteActual.estudiantes?.rut && (
                <span className="font-mono text-gray-500">({reporteActual.estudiantes.rut})</span>
              )}
              {reporteActual.estudiantes?.es_pie && (
                <span className="rounded-full bg-purple-100 text-purple-700 px-2 py-0.5 font-semibold text-[10px]">
                  PIE
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Badge de IA */}
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[11px] font-medium text-indigo-700">
                <Sparkles className="h-3 w-3 text-indigo-500" />
                Propuesta IA Gemini Flash
              </span>

              {/* Badge de Edición Manual */}
              {estaEditadoManualmente() && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-medium text-amber-800">
                  <Clock className="h-3 w-3 text-amber-600" />
                  Editado manualmente
                </span>
              )}

              {/* Badge de Estado */}
              {esReporteAprobado ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                  <CheckCircle className="h-3 w-3 text-emerald-600" />
                  Oficializado / Aprobado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 border border-yellow-300 px-2.5 py-0.5 text-[11px] font-semibold text-yellow-800">
                  Borrador en revisión
                </span>
              )}
            </div>
          </div>
        )}

        {/* SECCIÓN ESPECIAL CUANDO EL REPORTE ESTÁ OFICIALIZADO (HU 6.3.2 & HU 6.4.2) */}
        {esReporteAprobado && (
          <div className="mx-6 mt-4 space-y-3">
            {/* BADGE VERDE CON CHECK Y DATOS DE APROBACIÓN */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50 border border-emerald-300 p-3.5 text-xs text-emerald-950 shadow-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-emerald-900 text-sm">
                    Informe Oficial Aprobado por {nombreAprobador} el {fechaAprobacion}
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    El documento formal cuenta con validez legal e institucional conforme a la Circular N° 482 y RICE.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDescargarPdf(true)}
                  disabled={descargandoPdf}
                  title="Abrir PDF oficial en nueva pestaña para lectura o impresión"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Ver en pestaña
                </button>
                <button
                  type="button"
                  onClick={() => handleDescargarPdf(false)}
                  disabled={descargandoPdf}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-50 transition-colors"
                >
                  {descargandoPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  Descargar PDF Oficial
                </button>
              </div>
            </div>

            {/* FEEDBACK VISUAL DE DESPACHO DE CORREO AL APODERADO (HU 6.4.2) */}
            {emailEnviado ? (
              <div
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50/70 border border-emerald-200 px-4 py-3 text-xs text-emerald-900"
                title="El sistema despachó automáticamente el PDF oficial adjunto al correo electrónico registrado del apoderado titular."
              >
                <div className="flex items-center gap-2.5">
                  <MailCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-emerald-950">Notificación al Apoderado Titular:</span>{' '}
                    <span>
                      Enviado a <strong>{apoderadoEmail || 'apoderado titular'}</strong> el{' '}
                      {formatDateTime(fechaEnvioEmail) || formatDate(fechaEnvioEmail)}
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                  <Mail className="h-3 w-3" /> Correo entregado con PDF
                </span>
              </div>
            ) : apoderadoEmail ? (
              <div
                className="flex items-center gap-2.5 rounded-xl bg-blue-50 border border-blue-200 px-4 py-2.5 text-xs text-blue-900"
                title="El informe fue aprobado y se encuentra en la cola de salida para envío al correo del apoderado."
              >
                <Clock className="h-4 w-4 text-blue-600 shrink-0" />
                <span>
                  Despacho de correo en proceso para el apoderado: <strong>{apoderadoEmail}</strong>
                </span>
              </div>
            ) : (
              <div
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-50 border border-amber-300 px-4 py-3 text-xs text-amber-900"
                title="El estudiante no cuenta con un apoderado con correo electrónico registrado. Se debe imprimir el informe físico para firma en inspectoría general."
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold text-amber-950">Atención de entrega:</span>{' '}
                    <span>Apoderado sin correo registrado. Imprimir copia para citación presencial.</span>
                  </div>
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
          </div>
        )}

        {/* CUERPO DEL MODAL: 5 SECCIONES MODULARES */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {SECCIONES_CONFIG.map((seccion) => {
            const valor = contenidoActual[seccion.key] || ''
            const charCount = valor.length

            return (
              <div
                key={seccion.key}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor={`seccion-${seccion.key}`}
                    className="text-sm font-semibold text-gray-900 flex items-center gap-1.5"
                  >
                    <FileText className="h-4 w-4 text-blue-600" />
                    {seccion.titulo}
                  </label>
                  <span className="text-[11px] text-gray-400 font-mono">
                    {charCount} caracteres
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2.5">{seccion.descripcion}</p>
                <textarea
                  id={`seccion-${seccion.key}`}
                  rows={seccion.minRows}
                  value={valor}
                  disabled={esReporteAprobado}
                  onChange={(e) => handleSeccionChange(seccion.key, e.target.value)}
                  placeholder={seccion.placeholder}
                  className={`w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all leading-relaxed ${
                    esReporteAprobado ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white'
                  }`}
                />
              </div>
            )
          })}
        </div>

        {/* DIÁLOGO MODAL INTERNO: CONFIRMAR APROBACIÓN */}
        {mostrarConfirmAprobacion && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs rounded-2xl">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-gray-100">
              <div className="flex items-center gap-3 text-amber-600 mb-3">
                <AlertTriangle className="h-6 w-6 shrink-0" />
                <h3 className="text-base font-bold text-gray-900">Oficializar y Aprobar Informe</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Al oficializar este informe, adquirirá <strong>validez institucional formal</strong> conforme a la
                Circular N° 482 de la Superintendencia de Educación. Se fijará la firma de Jefatura y quedará habilitado
                el despacho y emisión del PDF definitivo.
              </p>
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setMostrarConfirmAprobacion(false)}
                  disabled={aprobando}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAprobarReporte}
                  disabled={aprobando}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm transition-colors disabled:opacity-50"
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
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-gray-100">
              <div className="flex items-center gap-3 text-blue-600 mb-3">
                <RefreshCw className="h-6 w-6 shrink-0" />
                <h3 className="text-base font-bold text-gray-900">Regenerar Propuesta con IA</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                ¿Deseas volver a redactar la propuesta con Google Gemini Flash?{' '}
                <strong className="text-gray-900">Se descartarán las modificaciones manuales que no hayan sido guardadas.</strong>
              </p>
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setMostrarConfirmRegenerar(false)}
                  disabled={regenerando}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleRegenerarPropuesta}
                  disabled={regenerando}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50"
                >
                  {regenerando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Sí, Regenerar Propuesta
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PIE DEL MODAL: ACCIONES Y CONTROLES RBAC */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 rounded-b-2xl">
          <div className="flex items-center gap-2">
            {!esReporteAprobado && (
              <button
                type="button"
                onClick={() => setMostrarConfirmRegenerar(true)}
                disabled={regenerando || guardando || aprobando}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors disabled:opacity-50"
              >
                <RefreshCw className="h-3.5 w-3.5 text-gray-500" />
                Regenerar Propuesta
              </button>
            )}

            {esReporteAprobado && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDescargarPdf(true)}
                  disabled={descargandoPdf}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-gray-500" />
                  Ver en pestaña
                </button>
                <button
                  type="button"
                  onClick={() => handleDescargarPdf(false)}
                  disabled={descargandoPdf}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 shadow-sm transition-colors disabled:opacity-50"
                >
                  {descargandoPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  Descargar PDF Oficial
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cerrar
            </button>

            {!esReporteAprobado && (
              <>
                <button
                  type="button"
                  onClick={handleGuardarBorrador}
                  disabled={guardando || aprobando}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-600 bg-white px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  {guardando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Guardar Borrador
                </button>

                {puedeAprobar ? (
                  <button
                    type="button"
                    onClick={() => setMostrarConfirmAprobacion(true)}
                    disabled={guardando || aprobando}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Aprobar y Oficializar
                  </button>
                ) : (
                  <div
                    className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-[11px] font-medium text-gray-500 border border-gray-200 cursor-not-allowed"
                    title="Solo Administradores, Directivos y Equipo de Formación pueden oficializar informes"
                  >
                    <ShieldAlert className="h-3.5 w-3.5 text-gray-400" />
                    Aprobación reservada a Jefatura
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
