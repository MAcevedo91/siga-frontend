import React, { useState, useEffect } from 'react'
import {
  X,
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getRiceActivo, uploadRice } from '@/services/riceService'
import { formatDate } from '@/utils/formatDate'

export const GestionRiceModal = ({ isOpen, onClose, onRiceActualizado }) => {
  const [riceActivo, setRiceActivo] = useState(null)
  const [cargandoActivo, setCargandoActivo] = useState(false)
  const [archivo, setArchivo] = useState(null)
  const [anioVigencia, setAnioVigencia] = useState(new Date().getFullYear())
  const [subiendo, setSubiendo] = useState(false)
  const [resultadoSubida, setResultadoSubida] = useState(null)

  useEffect(() => {
    if (isOpen) {
      cargarActivo()
      setArchivo(null)
      setResultadoSubida(null)
    }
  }, [isOpen])

  const cargarActivo = async () => {
    try {
      setCargandoActivo(true)
      const data = await getRiceActivo()
      setRiceActivo(data)
    } catch (err) {
      console.error('Error al cargar RICE activo:', err)
    } finally {
      setCargandoActivo(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pdf', 'md', 'txt'].includes(ext)) {
      toast.error('Formato no permitido. Solo se aceptan archivos PDF (.pdf) o Markdown (.md)')
      return
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error('El archivo excede el tamaño máximo permitido de 25 MB')
      return
    }

    setArchivo(file)
    setResultadoSubida(null)
  }

  const handleSubir = async (e) => {
    e.preventDefault()
    if (!archivo) {
      toast.error('Seleccione un archivo antes de continuar')
      return
    }

    try {
      setSubiendo(true)
      const formData = new FormData()
      formData.append('archivo', archivo)
      formData.append('anio_vigencia', anioVigencia)

      const resultado = await uploadRice(formData)
      setResultadoSubida(resultado)
      toast.success('RICE procesado y vectorizado exitosamente')
      await cargarActivo()
      if (onRiceActualizado) onRiceActualizado()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error al procesar el archivo'
      toast.error(msg)
    } finally {
      setSubiendo(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Gestión del Reglamento Interno (RICE)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Modelo RAG vectorial institucional y aseguramiento normativo
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
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Tarjeta de RICE Activo */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              RICE Oficial Vigente
            </h4>
            {cargandoActivo ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando estado...
              </div>
            ) : riceActivo ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {riceActivo.nombre_archivo}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Año {riceActivo.anio_vigencia}
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" /> {riceActivo.total_chunks} fragmentos indexados
                      </span>
                    </div>
                  </div>
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 self-start sm:self-center">
                  Activo
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-sm text-amber-600 dark:text-amber-400 py-1">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p>No hay un RICE cargado para este establecimiento. Suba uno para habilitar el asistente RAG.</p>
              </div>
            )}
          </div>

          {/* Formulario de Carga */}
          <form onSubmit={handleSubir} className="space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Cargar Nueva Versión Oficial
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Año de Vigencia Escolar
                </label>
                <input
                  type="number"
                  min="2020"
                  max="2035"
                  value={anioVigencia}
                  onChange={(e) => setAnioVigencia(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Formatos Aceptados
                </label>
                <div className="text-xs text-slate-500 dark:text-slate-400 py-2">
                  PDF oficial (.pdf) o Markdown estructurado (.md)
                </div>
              </div>
            </div>

            {/* Dropzone */}
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-indigo-500 transition-colors bg-slate-50/50 dark:bg-slate-800/20">
              <input
                type="file"
                id="archivoRice"
                accept=".pdf,.md,.txt"
                onChange={handleFileChange}
                className="hidden"
                disabled={subiendo}
              />
              <label
                htmlFor="archivoRice"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-full">
                  <Upload className="w-6 h-6" />
                </div>
                {archivo ? (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {archivo.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {(archivo.size / (1024 * 1024)).toFixed(2)} MB • Haga clic para cambiar de archivo
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Haga clic para seleccionar o arrastre el archivo aquí
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Máximo 25 MB. El documento será convertido a Markdown y vectorizado automáticamente.
                    </p>
                  </div>
                )}
              </label>
            </div>

            {/* Resumen de Ingesta tras finalizar */}
            {resultadoSubida && (
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-indigo-700 dark:text-indigo-300">
                  <Sparkles className="w-4 h-4" /> Indexación Vectorial Completada
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Se generaron y almacenaron {resultadoSubida.resumen.totalChunks} fragmentos semánticos con embeddings de 768 dimensiones.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                disabled={subiendo}
              >
                Cerrar
              </button>
              <button
                type="submit"
                disabled={!archivo || subiendo}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
              >
                {subiendo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Procesando y Vectorizando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" /> Confirmar y Activar RICE
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default GestionRiceModal
