import { useState } from 'react'
import PropTypes from 'prop-types'
import LienzoFirmaCitacion from './LienzoFirmaCitacion'
import {
  registrarAcuerdosCitacion,
  descargarActaCitacionPdf,
} from '@/services/citacionesService'
import {
  X,
  FileCheck,
  School,
  Users,
  Calendar,
  Plus,
  Trash2,
  CheckCircle,
  Download,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  PenTool,
} from 'lucide-react'

// Banco de compromisos pedagógicos sugeridos
const SUGERENCIAS_COLEGIO = [
  'Adecuación de estrategias pedagógicas de refuerzo en aula',
  'Monitoreo semanal de avances por el profesor jefe',
  'Derivación a dupla psicosocial para acompañamiento formativo',
  'Flexibilidad en tiempos y formatos de evaluación formativa',
  'Estrategias de mediación escolar y sana convivencia en recreos',
]

const SUGERENCIAS_APODERADO = [
  'Acompañamiento diario de 20 minutos en rutinas de lectura y estudio en el hogar',
  'Supervisión diaria del cuaderno escolar y libreta de comunicaciones',
  'Establecer horarios fijos de descanso y limitar el uso de pantallas',
  'Fomentar la puntualidad en el ingreso a la jornada escolar',
  'Mantener comunicación regular y constructiva con el profesor jefe',
]

export default function EntrevistaCitacionModal({
  isOpen,
  onClose,
  citacion,
  onSuccess,
}) {
  const [paso, setPaso] = useState(1) // 1: Acuerdos, 2: Firmas, 3: Éxito
  const [compromisosColegio, setCompromisosColegio] = useState([
    'Adecuación de estrategias pedagógicas de refuerzo en aula',
  ])
  const [compromisosApoderado, setCompromisosApoderado] = useState([
    'Acompañamiento diario de 20 minutos en rutinas de lectura y estudio en el hogar',
  ])
  const [fechaSeguimiento, setFechaSeguimiento] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  )
  const [firmas, setFirmas] = useState({ docente: null, apoderado: null })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [resultado, setResultado] = useState(null)
  const [descargandoPdf, setDescargandoPdf] = useState(false)

  if (!isOpen || !citacion) return null

  // Manejo de sugerencias tipo chip
  const handleAgregarSugerenciaColegio = (sug) => {
    if (!compromisosColegio.includes(sug)) {
      setCompromisosColegio((prev) => [...prev, sug])
    }
  }

  const handleAgregarSugerenciaApoderado = (sug) => {
    if (!compromisosApoderado.includes(sug)) {
      setCompromisosApoderado((prev) => [...prev, sug])
    }
  }

  // Manejo de firmas en canvas
  const handleFirmaChange = (tipo, dataUrl) => {
    setFirmas((prev) => ({
      ...prev,
      [tipo]: dataUrl,
    }))
  }

  // Validación y cambio de paso
  const handleAvanzarAFirmas = (e) => {
    e.preventDefault()
    setError(null)

    const limpiosColegio = compromisosColegio.map((c) => c.trim()).filter((c) => c.length >= 3)
    const limpiosApoderado = compromisosApoderado.map((c) => c.trim()).filter((c) => c.length >= 3)

    if (limpiosColegio.length === 0) {
      setError('Debe registrar al menos un compromiso formal del colegio.')
      return
    }

    if (limpiosApoderado.length === 0) {
      setError('Debe registrar al menos un compromiso formal del apoderado.')
      return
    }

    setPaso(2)
  }

  // Guardar y emitir acta oficial
  const handleFinalizarEntrevista = async () => {
    setError(null)
    setLoading(true)

    const limpiosColegio = compromisosColegio.map((c) => c.trim()).filter((c) => c.length >= 3)
    const limpiosApoderado = compromisosApoderado.map((c) => c.trim()).filter((c) => c.length >= 3)

    try {
      const data = await registrarAcuerdosCitacion(citacion.id, {
        compromisos_colegio: limpiosColegio,
        compromisos_apoderado: limpiosApoderado,
        fecha_proximo_seguimiento: fechaSeguimiento || null,
        firma_docente: firmas.docente,
        firma_apoderado: firmas.apoderado,
      })

      setResultado(data)
      setPaso(3)
      if (onSuccess) onSuccess(data)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error al emitir el acta oficial'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleDescargarPdf = async () => {
    try {
      setDescargandoPdf(true)
      await descargarActaCitacionPdf(citacion.id, citacion.folio)
    } catch {
      setError('Error al descargar el PDF del acta oficial.')
    } finally {
      setDescargandoPdf(false)
    }
  }

  const estudianteNombre =
    citacion.estudiante?.nombre
      ? `${citacion.estudiante.nombre} ${citacion.estudiante.apellido || ''}`
      : citacion.estudiantes?.nombre
      ? `${citacion.estudiantes.nombre} ${citacion.estudiantes.apellido || ''}`
      : 'Estudiante'

  const apoderadoNombre =
    citacion.apoderado?.nombre
      ? `${citacion.apoderado.nombre} ${citacion.apoderado.apellido || ''}`
      : citacion.apoderados?.nombre
      ? `${citacion.apoderados.nombre} ${citacion.apoderados.apellido || ''}`
      : 'Apoderado Titular'

  const docenteNombre =
    citacion.docente?.nombre
      ? `${citacion.docente.nombre} ${citacion.docente.apellido || ''}`
      : citacion.usuarios?.nombre
      ? `${citacion.usuarios.nombre} ${citacion.usuarios.apellido || ''}`
      : 'Docente Convocante'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-entrevista-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
    >
      <div className="relative w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden my-8">
        {/* CABECERA INSTITUCIONAL */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-200 shadow-inner">
              <FileCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-500/40 text-indigo-100 border border-indigo-400/30">
                  {citacion.folio || 'CITACIÓN OFICIAL'}
                </span>
                <span className="text-xs text-indigo-200">
                  Escuela Coeducacional N°1 El Salvador · RBD 9876-5
                </span>
              </div>
              <h2
                id="modal-entrevista-title"
                className="text-xl font-extrabold text-white mt-1 tracking-tight"
              >
                Entrevista Presencial de Acompañamiento y Acuerdos Mutuos
              </h2>
            </div>
          </div>

          {/* INDICADOR DE PASOS */}
          <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span
                className={`font-bold flex items-center gap-1.5 ${
                  paso === 1 ? 'text-amber-300' : 'text-slate-300'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[11px]">
                  1
                </span>
                Acuerdos Mutuos
              </span>
              <span>➔</span>
              <span
                className={`font-bold flex items-center gap-1.5 ${
                  paso === 2 ? 'text-amber-300' : 'text-slate-300'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[11px]">
                  2
                </span>
                Firmas Presenciales
              </span>
              <span>➔</span>
              <span
                className={`font-bold flex items-center gap-1.5 ${
                  paso === 3 ? 'text-emerald-300' : 'text-slate-400'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[11px]">
                  3
                </span>
                Acta Oficial
              </span>
            </div>

            <div className="text-xs text-indigo-200 hidden sm:block">
              Alumno: <strong className="text-white">{estudianteNombre}</strong>
            </div>
          </div>
        </div>

        {/* CUERPO DEL MODAL */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 p-4 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* =================================================================== */}
          {/* PASO 1: FORMULARIO DE ACUERDOS Y SELECTOR DE SUGERENCIAS */}
          {/* =================================================================== */}
          {paso === 1 && (
            <form onSubmit={handleAvanzarAFirmas} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* COLUMNA 1: COLEGIO */}
                <div className="space-y-3 rounded-xl border border-indigo-100 dark:border-indigo-950/60 bg-indigo-50/40 dark:bg-indigo-950/20 p-4">
                  <div className="flex items-center justify-between pb-2 border-b border-indigo-100 dark:border-indigo-900/40">
                    <div className="flex items-center gap-2">
                      <School className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
                        Compromisos del Colegio
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCompromisosColegio((p) => [...p, ''])}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar</span>
                    </button>
                  </div>

                  {/* SELECTOR DE SUGERENCIAS RÁPIDAS (CHIPS) */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      Sugerencias pedagógicas rápidas (clic para añadir):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {SUGERENCIAS_COLEGIO.map((sug, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleAgregarSugerenciaColegio(sug)}
                          className="text-[10px] bg-white dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 rounded-lg px-2 py-1 text-left transition"
                          title="Clic para incorporar este compromiso"
                        >
                          + {sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CAMPOS EDITABLES */}
                  <div className="space-y-2 pt-2">
                    {compromisosColegio.map((comp, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <textarea
                          rows={2}
                          value={comp}
                          onChange={(e) => {
                            const val = e.target.value
                            setCompromisosColegio((prev) => {
                              const next = [...prev]
                              next[idx] = val
                              return next
                            })
                          }}
                          placeholder="Redactar compromiso del colegio..."
                          className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 resize-none"
                          required
                        />
                        {compromisosColegio.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setCompromisosColegio((p) => p.filter((_, i) => i !== idx))
                            }
                            className="p-1 text-slate-400 hover:text-rose-500 rounded-md mt-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* COLUMNA 2: APODERADO */}
                <div className="space-y-3 rounded-xl border border-emerald-100 dark:border-emerald-950/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-4">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-100 dark:border-emerald-900/40">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950 dark:text-emerald-200">
                        Compromisos del Apoderado
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCompromisosApoderado((p) => [...p, ''])}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-800"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar</span>
                    </button>
                  </div>

                  {/* SELECTOR DE SUGERENCIAS RÁPIDAS (CHIPS) */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-500" />
                      Sugerencias para el hogar (clic para añadir):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {SUGERENCIAS_APODERADO.map((sug, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleAgregarSugerenciaApoderado(sug)}
                          className="text-[10px] bg-white dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 rounded-lg px-2 py-1 text-left transition"
                          title="Clic para incorporar este compromiso"
                        >
                          + {sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CAMPOS EDITABLES */}
                  <div className="space-y-2 pt-2">
                    {compromisosApoderado.map((comp, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <textarea
                          rows={2}
                          value={comp}
                          onChange={(e) => {
                            const val = e.target.value
                            setCompromisosApoderado((prev) => {
                              const next = [...prev]
                              next[idx] = val
                              return next
                            })
                          }}
                          placeholder="Redactar compromiso de la familia..."
                          className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 resize-none"
                          required
                        />
                        {compromisosApoderado.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setCompromisosApoderado((p) => p.filter((_, i) => i !== idx))
                            }
                            className="p-1 text-slate-400 hover:text-rose-500 rounded-md mt-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* FECHA DE PRÓXIMO SEGUIMIENTO */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <span>Fecha de Próximo Seguimiento Formativo:</span>
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Establece el horizonte temporal para evaluar los compromisos mutuos acordados.
                  </p>
                </div>
                <input
                  type="date"
                  value={fechaSeguimiento}
                  onChange={(e) => setFechaSeguimiento(e.target.value)}
                  className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 self-start sm:self-auto"
                />
              </div>

              {/* BOTONES NAVEGACIÓN */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition"
                >
                  <span>Continuar a Firmas Presenciales</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* =================================================================== */}
          {/* PASO 2: CAPTURA DE FIRMAS DIGITALES A 60 FPS */}
          {/* =================================================================== */}
          {paso === 2 && (
            <div className="space-y-6">
              <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
                <PenTool className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <p>
                  Por favor, invite a las partes a firmar con su dedo, lápiz o ratón en la pantalla
                  para dar fe de la suscripción formal del acta.
                </p>
              </div>

              {/* COMPONENTE DE LIENZO DUAL A 60 FPS */}
              <LienzoFirmaCitacion
                firmas={firmas}
                onFirmaChange={handleFirmaChange}
                docenteNombre={docenteNombre}
                apoderadoNombre={apoderadoNombre}
              />

              {/* BOTONES DE ACCIÓN */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setPaso(1)}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Volver a Acuerdos</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinalizarEntrevista}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>
                    {loading ? 'Sellando y Despachando...' : 'Finalizar y Sellar Acta Oficial 🔒'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* PASO 3: ÉXITO Y DESCARGA DIRECTA DEL ACTA PDF */}
          {/* =================================================================== */}
          {paso === 3 && (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  ¡Entrevista Presencial Concluida Exitosamente!
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  El acta oficial ha sido sellada con las firmas y el hash criptográfico SHA-256. Se
                  enviaron copias automáticas al apoderado y al profesor jefe.
                </p>
              </div>

              {resultado?.hash_sha256 && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 max-w-lg mx-auto text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Código de Seguridad SHA-256
                  </span>
                  <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300 break-all select-all">
                    {resultado.hash_sha256}
                  </p>
                </div>
              )}

              <div className="pt-4 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={handleDescargarPdf}
                  disabled={descargandoPdf}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {descargandoPdf ? 'Descargando Acta...' : 'Descargar Acta Oficial PDF'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

EntrevistaCitacionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  citacion: PropTypes.object,
  onSuccess: PropTypes.func,
}
