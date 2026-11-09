import { useState } from 'react'
import PropTypes from 'prop-types'
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
} from 'lucide-react'

export default function CerrarCitacionAcuerdosModal({
  isOpen,
  onClose,
  citacion,
  onSuccess,
}) {
  const [compromisosColegio, setCompromisosColegio] = useState([
    'Adecuación de estrategias pedagógicas de refuerzo en aula',
  ])
  const [compromisosApoderado, setCompromisosApoderado] = useState([
    'Acompañamiento diario de 20 minutos en rutinas de lectura y estudio en el hogar',
  ])
  const [fechaSeguimiento, setFechaSeguimiento] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) // 14 días sugeridos
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [resultado, setResultado] = useState(null)
  const [descargandoPdf, setDescargandoPdf] = useState(false)

  if (!isOpen || !citacion) return null

  const handleAddColegio = () => {
    setCompromisosColegio((prev) => [...prev, ''])
  }

  const handleRemoveColegio = (index) => {
    if (compromisosColegio.length <= 1) return
    setCompromisosColegio((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpdateColegio = (index, value) => {
    setCompromisosColegio((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const handleAddApoderado = () => {
    setCompromisosApoderado((prev) => [...prev, ''])
  }

  const handleRemoveApoderado = (index) => {
    if (compromisosApoderado.length <= 1) return
    setCompromisosApoderado((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpdateApoderado = (index, value) => {
    setCompromisosApoderado((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Filtrar compromisos no vacíos
    const limpiosColegio = compromisosColegio.map((c) => c.trim()).filter((c) => c.length >= 3)
    const limpiosApoderado = compromisosApoderado.map((c) => c.trim()).filter((c) => c.length >= 3)

    if (limpiosColegio.length === 0) {
      setError('Debe ingresar al menos un compromiso formal por parte del colegio.')
      return
    }

    if (limpiosApoderado.length === 0) {
      setError('Debe ingresar al menos un compromiso formal por parte del apoderado.')
      return
    }

    setLoading(true)

    try {
      const data = await registrarAcuerdosCitacion(citacion.id, {
        compromisos_colegio: limpiosColegio,
        compromisos_apoderado: limpiosApoderado,
        fecha_proximo_seguimiento: fechaSeguimiento || null,
      })

      setResultado(data)
      if (onSuccess) onSuccess(data)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error al registrar los acuerdos'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleDescargarPdf = async () => {
    try {
      setDescargandoPdf(true)
      await descargarActaCitacionPdf(citacion.id, citacion.folio)
    } catch (err) {
      setError('No se pudo descargar el archivo PDF. Intente nuevamente.')
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
      : 'Apoderado'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-acuerdos-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
    >
      <div className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden my-8">
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
            <div className="w-11 h-11 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-200 shadow-inner">
              <FileCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-500/40 text-indigo-100 border border-indigo-400/30">
                  {citacion.folio || 'FOLIO CITACIÓN'}
                </span>
                <span className="text-xs text-indigo-200">
                  Escuela Coeducacional N°1 El Salvador
                </span>
              </div>
              <h2
                id="modal-acuerdos-title"
                className="text-xl font-extrabold text-white mt-1 tracking-tight"
              >
                Cierre de Entrevista y Acuerdos Mutuos
              </h2>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-4 text-xs text-indigo-200">
            <div>
              <span className="text-indigo-400">Estudiante: </span>
              <strong className="text-white">{estudianteNombre}</strong>
            </div>
            <div>
              <span className="text-indigo-400">Apoderado: </span>
              <strong className="text-white">{apoderadoNombre}</strong>
            </div>
          </div>
        </div>

        {/* CONTENIDO DEL FORMULARIO */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 p-4 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {resultado ? (
            /* VISTA DE ÉXITO TRAS REGISTRAR ACUERDOS */
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  ¡Entrevista Concluida y Acta Oficial Emitida!
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  Los compromisos fueron sellados criptográficamente. Se despachó el correo
                  institucional con el documento PDF adjunto al apoderado titular y al profesor jefe.
                </p>
              </div>

              {resultado.hash_sha256 && (
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
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition"
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
                  Finalizar
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* TABLA COMPARATIVA: COMPROMISOS COLEGIO VS APODERADO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* COLUMNA 1: COMPROMISOS COLEGIO */}
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
                      onClick={handleAddColegio}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {compromisosColegio.map((comp, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <textarea
                          rows={2}
                          value={comp}
                          onChange={(e) => handleUpdateColegio(idx, e.target.value)}
                          placeholder="Ej: Refuerzo en comprensión lectora 2 veces por semana..."
                          className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden resize-none"
                          required
                        />
                        {compromisosColegio.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveColegio(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition mt-1"
                            title="Eliminar este compromiso"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* COLUMNA 2: COMPROMISOS APODERADO */}
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
                      onClick={handleAddApoderado}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-800"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {compromisosApoderado.map((comp, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <textarea
                          rows={2}
                          value={comp}
                          onChange={(e) => handleUpdateApoderado(idx, e.target.value)}
                          placeholder="Ej: Supervisar tareas diarias y preparar mochila la noche anterior..."
                          className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-none"
                          required
                        />
                        {compromisosApoderado.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveApoderado(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition mt-1"
                            title="Eliminar este compromiso"
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
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span>Fecha de Próximo Seguimiento Pedagógico (Opcional):</span>
                </label>
                <input
                  type="date"
                  value={fechaSeguimiento}
                  onChange={(e) => setFechaSeguimiento(e.target.value)}
                  className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Define un plazo para revisar de manera conjunta el cumplimiento de los acuerdos.
                </p>
              </div>

              {/* NOTA DE SEGURIDAD Y DESPACHO AUTOMÁTICO */}
              <div className="p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                <div className="space-y-0.5">
                  <strong className="font-bold">Seguridad y Validez Oficial:</strong>
                  <p className="text-[11px] text-indigo-800 dark:text-indigo-300 leading-relaxed">
                    Al confirmar, el sistema sella los acuerdos con código criptográfico SHA-256,
                    actualiza la citación a estado <em>Realizada</em> y envía una copia en PDF al
                    Apoderado Titular y al Profesor Jefe del curso.
                  </p>
                </div>
              </div>

              {/* ACCIONES DEL FORMULARIO */}
              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>
                    {loading ? 'Sellando y Despachando...' : 'Registrar Acuerdos y Emitir Acta'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

CerrarCitacionAcuerdosModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  citacion: PropTypes.object,
  onSuccess: PropTypes.func,
}
