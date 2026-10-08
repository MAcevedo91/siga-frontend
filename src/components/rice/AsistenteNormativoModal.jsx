import React, { useState } from 'react'
import {
  X,
  Sparkles,
  Search,
  BookOpen,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { consultarRiceRag } from '@/services/riceService'

const SUGERENCIAS_CONSULTA = [
  '¿Cuál es el protocolo y plazo ante agresión física o ciberacoso reiterado?',
  '¿Qué medidas formativas y pedagógicas deben agotarse antes de una suspensión?',
  '¿Cómo proceder ante sospecha de porte de armas o sustancias ilícitas?',
  '¿Cuáles son los plazos para citar al apoderado y otorgar derecho a descargos?',
]

export const AsistenteNormativoModal = ({
  isOpen,
  onClose,
  contextoIncidente = null,
  consultaInicial = '',
}) => {
  const [consulta, setConsulta] = useState(consultaInicial || '')
  const [consultando, setConsultando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [copiado, setCopiado] = useState(false)
  const [mostrarFuentes, setMostrarFuentes] = useState(true)

  const handleConsultar = async (textoPregunta) => {
    const q = textoPregunta || consulta
    if (!q || q.trim() === '') {
      toast.error('Ingrese una consulta para el asistente normativo')
      return
    }

    try {
      setConsultando(true)
      const data = await consultarRiceRag(q, contextoIncidente)
      setResultado(data)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error al consultar el RICE'
      toast.error(msg)
    } finally {
      setConsultando(false)
    }
  }

  const handleCopiar = () => {
    if (!resultado?.respuesta) return
    navigator.clipboard.writeText(resultado.respuesta)
    setCopiado(true)
    toast.success('Orientación copiada al portapapeles')
    setTimeout(() => setCopiado(false), 2500)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Copiloto Normativo RICE
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                  RAG Asistencial
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Orientación en convivencia escolar con apego al reglamento oficial del colegio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Banner de contexto si proviene de un incidente */}
          {contextoIncidente && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>
                Consultando con contexto activo del incidente (los datos personales fueron anonimizados por seguridad DLP).
              </span>
            </div>
          )}

          {/* Formulario de Consulta */}
          <div className="space-y-3">
            <div className="relative">
              <textarea
                value={consulta}
                onChange={(e) => setConsulta(e.target.value)}
                placeholder="Escriba su consulta jurídica o procedimental sobre el RICE del colegio..."
                rows={3}
                className="w-full p-3.5 pr-24 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                disabled={consultando}
              />
              <button
                type="button"
                onClick={() => handleConsultar(consulta)}
                disabled={consultando || !consulta.trim()}
                className="absolute right-3 bottom-3 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all"
              >
                {consultando ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" /> Consultar
                  </>
                )}
              </button>
            </div>

            {/* Sugerencias Rápidas */}
            {!resultado && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Consultas frecuentes recomendadas:
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGERENCIAS_CONSULTA.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setConsulta(sug)
                        handleConsultar(sug)
                      }}
                      className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-left transition-colors border border-slate-200 dark:border-slate-700"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Estado de Carga */}
          {consultando && (
            <div className="flex flex-col items-center justify-center py-10 space-y-3 text-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Buscando fragmentos normativos en el RICE y verificando plazos...
              </p>
              <p className="text-xs text-slate-400">
                Alineando con Circular N° 482 de la Superintendencia de Educación
              </p>
            </div>
          )}

          {/* Resultado de la Inferencia RAG */}
          {resultado && !consultando && (
            <div className="space-y-5 animate-in fade-in">
              {/* Caja de Respuesta */}
              <div className="p-5 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 space-y-3">
                <div className="flex items-center justify-between border-b border-indigo-100 dark:border-indigo-900/50 pb-3">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                    <BookOpen className="w-4 h-4" /> Orientación Normativa Institucional
                  </div>
                  <button
                    onClick={handleCopiar}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
                  >
                    {copiado ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiado ? 'Copiado' : 'Copiar respuesta'}
                  </button>
                </div>

                <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line font-normal">
                  {resultado.respuesta}
                </div>
              </div>

              {/* Fuentes y Artículos Citados */}
              {resultado.fuentes && resultado.fuentes.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/30 dark:bg-slate-800/20">
                  <button
                    type="button"
                    onClick={() => setMostrarFuentes(!mostrarFuentes)}
                    className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100/60 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Fuentes y Artículos Citados ({resultado.fuentes.length})
                    </span>
                    {mostrarFuentes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {mostrarFuentes && (
                    <div className="p-4 space-y-3">
                      {resultado.fuentes.map((fuente, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs space-y-1.5 shadow-sm"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-indigo-700 dark:text-indigo-300">
                              {fuente.articulo || 'Artículo'}
                            </span>
                            <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                              {fuente.seccion || 'Reglamento'}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 italic">
                            "{fuente.contenido}"
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Disclaimer de Responsabilidad */}
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>
                  Esta orientación es de carácter pedagógico y asistencial fundamentada en el RICE del colegio. Las decisiones disciplinarias o de derivación corresponden al criterio legal del Encargado de Convivencia y la Dirección Escolar.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default AsistenteNormativoModal
