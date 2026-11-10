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
  Landmark,
  School,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { consultarRiceRag } from '@/services/riceService'

const SUGERENCIAS_CONSULTA = [
  '¿Cuál es el protocolo y plazo ante agresión física o ciberacoso reiterado?',
  '¿Qué medidas formativas y pedagógicas deben agotarse antes de una suspensión?',
  '¿Cómo proceder ante sospecha de porte de armas o sustancias ilícitas?',
  '¿Cuáles son los plazos para citar al apoderado y otorgar derecho a descargos?',
]

/**
 * Procesa segmentos de texto para formatear negritas (**texto**) de forma semántica
 */
const formatearTextoInline = (texto) => {
  if (!texto) return ''
  const partes = texto.split(/(\*\*[^*]+\*\*)/g)
  return partes.map((parte, i) => {
    if (parte.startsWith('**') && parte.endsWith('**')) {
      const contenido = parte.slice(2, -2)
      return (
        <strong key={i} className="font-bold text-slate-900 dark:text-white">
          {contenido}
        </strong>
      )
    }
    return parte
  })
}

/**
 * Renderiza el texto estructurado en Markdown (títulos ###, listas, negritas y separadores)
 */
const RenderizadorMarkdown = ({ texto }) => {
  if (!texto) return null
  const lineas = texto.split('\n')

  return (
    <div className="space-y-2">
      {lineas.map((linea, idx) => {
        const trimmed = linea.trim()
        if (!trimmed) {
          return <div key={idx} className="h-1" />
        }

        // Separador horizontal --- o ***
        if (trimmed === '---' || trimmed === '***') {
          return <hr key={idx} className="my-3 border-indigo-200/60 dark:border-indigo-900/40" />
        }

        // Encabezados nivel 3
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-sm font-bold text-indigo-950 dark:text-indigo-200 mt-3 mb-1">
              {formatearTextoInline(trimmed.replace(/^###\s+/, ''))}
            </h4>
          )
        }

        // Encabezados nivel 2
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="text-base font-bold text-indigo-950 dark:text-indigo-200 mt-3 mb-1">
              {formatearTextoInline(trimmed.replace(/^##\s+/, ''))}
            </h3>
          )
        }

        // Viñetas no ordenadas (* o - o •)
        if (/^[*•-]\s+/.test(trimmed)) {
          return (
            <div key={idx} className="flex items-start gap-2 ml-3 text-sm text-slate-800 dark:text-slate-200">
              <span className="text-indigo-500 dark:text-indigo-400 font-bold mt-1 text-xs leading-none">•</span>
              <span className="flex-1 leading-relaxed">{formatearTextoInline(trimmed.replace(/^[*•-]\s+/, ''))}</span>
            </div>
          )
        }

        // Listas numeradas (1. 2. etc.)
        const matchNum = trimmed.match(/^(\d+)\.\s+(.*)/)
        if (matchNum) {
          return (
            <div key={idx} className="flex items-start gap-2 ml-1 text-sm text-slate-800 dark:text-slate-200">
              <span className="font-bold text-indigo-700 dark:text-indigo-300 min-w-[1.25rem]">{matchNum[1]}.</span>
              <span className="flex-1 leading-relaxed">{formatearTextoInline(matchNum[2])}</span>
            </div>
          )
        }

        // Párrafo normal
        return (
          <p key={idx} className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
            {formatearTextoInline(linea)}
          </p>
        )
      })}
    </div>
  )
}

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
      <div className="w-full max-w-3xl bg-gradient-to-br from-indigo-100/90 via-purple-50/60 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 rounded-2xl shadow-2xl border-2 border-indigo-300/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-indigo-300/80 dark:border-slate-800 bg-gradient-to-r from-indigo-200/90 via-purple-100/70 to-white dark:from-indigo-950/80 dark:via-purple-950/40 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-xl shadow-md shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Copiloto Normativo RICE
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
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
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-white/80 dark:hover:bg-slate-800 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Banner de contexto si proviene de un incidente */}
          {contextoIncidente && (
            <div className="p-3.5 bg-gradient-to-br from-blue-100/90 via-blue-50/40 to-white dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl text-xs text-blue-900 dark:text-blue-300 flex items-center gap-2.5 shadow-xs">
              <ShieldCheck className="w-4 h-4 flex-shrink-0 text-blue-600" />
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
                className="w-full p-3.5 pr-28 text-sm rounded-xl border border-indigo-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none shadow-xs"
                disabled={consultando}
              />
              <button
                type="button"
                onClick={() => handleConsultar(consulta)}
                disabled={consultando || !consulta.trim()}
                className="absolute right-3 bottom-3 inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all"
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
                      className="text-xs px-3 py-1.5 bg-white hover:bg-indigo-50/70 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-left transition-colors border border-indigo-100 dark:border-slate-700 shadow-2xs"
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
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-100/80 via-purple-50/40 to-white dark:from-indigo-950/50 dark:via-slate-900 dark:to-gray-800 border border-indigo-200/90 dark:border-indigo-900/50 shadow-md space-y-3">
                <div className="flex items-center justify-between border-b border-indigo-200/60 dark:border-indigo-900/50 pb-3">
                  <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-bold text-sm">
                    <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Orientación Normativa Institucional
                  </div>
                  <button
                    onClick={handleCopiar}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white/90 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-slate-700 shadow-2xs transition-colors"
                  >
                    {copiado ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiado ? 'Copiado' : 'Copiar respuesta'}
                  </button>
                </div>

                <div className="text-sm text-slate-900 dark:text-slate-200 leading-relaxed font-medium">
                  <RenderizadorMarkdown texto={resultado.respuesta} />
                </div>
              </div>

              {/* Fuentes y Artículos Citados */}
              {resultado.fuentes && resultado.fuentes.length > 0 && (
                <div className="border border-indigo-200/70 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/20 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setMostrarFuentes(!mostrarFuentes)}
                    className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 bg-indigo-50/60 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
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
                          className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-indigo-100 dark:border-slate-700 text-xs space-y-2 shadow-2xs"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {fuente.es_normativa_nacional ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                                  <Landmark className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Circular N° 482 (Superintendencia)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                                  <School className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> RICE Establecimiento
                                </span>
                              )}
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {fuente.articulo || 'Artículo'}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-semibold bg-indigo-50/70 dark:bg-slate-700 px-2 py-0.5 rounded-full border border-indigo-100/80 dark:border-slate-600">
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

              {/* Banner de Subsidiariedad Normativa si aplica */}
              {resultado.tiene_normativa_nacional && (
                <div className="flex items-start gap-2.5 p-3.5 bg-gradient-to-br from-amber-50 to-orange-50/40 dark:from-amber-950/30 dark:to-slate-900 border border-amber-300/80 dark:border-amber-900 rounded-xl text-xs text-amber-900 dark:text-amber-200 shadow-xs">
                  <Landmark className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <span className="font-bold">Aplicación de Normativa Nacional Subsidiaria:</span>
                    <p className="mt-0.5 text-slate-700 dark:text-slate-300 leading-relaxed">
                      Al detectarse una laguna u omisión de protocolo específico en el RICE del colegio, se aplicó la <strong>Circular N° 482 de la Superintendencia de Educación</strong> de forma supletoria y obligatoria. Se recomienda al Encargado/a de Convivencia actualizar el reglamento interno para incorporar formalmente este protocolo.
                    </p>
                  </div>
                </div>
              )}

              {/* Disclaimer de Responsabilidad */}
              <div className="flex items-start gap-2.5 p-3.5 bg-gradient-to-br from-amber-100/90 via-amber-50/40 to-white dark:from-amber-950/30 dark:to-gray-800 border border-amber-300/80 dark:border-amber-900 rounded-xl text-xs text-amber-900 dark:text-amber-200 shadow-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <p>
                  Esta orientación es de carácter pedagógico y asistencial fundamentada en el RICE del colegio. Las decisiones disciplinarias o de derivación corresponden al criterio legal del Encargado de Convivencia y la Dirección Escolar.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-indigo-100 dark:border-slate-800 bg-gradient-to-r from-gray-50 via-slate-50 to-gray-100/80 dark:from-slate-900 dark:to-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-slate-800 to-gray-900 hover:from-slate-700 hover:to-gray-800 rounded-xl shadow-xs transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default AsistenteNormativoModal
