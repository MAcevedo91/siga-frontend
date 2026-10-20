import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import {
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Paperclip,
  FileText,
  UploadCloud,
} from 'lucide-react'

export default function CompletarPasoModal({
  isOpen,
  onClose,
  onConfirm,
  paso,
  loading = false,
}) {
  const [observacion, setObservacion] = useState('')
  const [archivo, setArchivo] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setObservacion('')
      setArchivo(null)
      setError(null)
    }
  }, [isOpen])

  if (!isOpen || !paso) return null

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    // Validar tamaño máximo 10 MB
    if (selected.size > 10 * 1024 * 1024) {
      setError('El archivo excede el tamaño máximo permitido de 10 MB')
      return
    }

    setArchivo(selected)
    setError(null)
  }

  const handleRemoveFile = () => {
    setArchivo(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = observacion.trim()
    if (trimmed.length < 5) {
      setError('La glosa u observación de respaldo debe contener al menos 5 caracteres')
      return
    }
    onConfirm(trimmed, archivo)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl border border-gray-200 dark:border-gray-700 space-y-4">
        {/* Encabezado */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 dark:border-gray-700/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Completar Paso Normativo
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Paso #{paso.orden} — Plazo legal de {paso.plazo_dias} {paso.plazo_dias === 1 ? 'día' : 'días'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Detalle de la acción */}
        <div className="bg-slate-50 dark:bg-gray-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-gray-700">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            Acción del Protocolo
          </p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            {paso.accion}
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="observacion-paso"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Glosa de Respaldo / Observación <span className="text-red-500">*</span>
            </label>
            <textarea
              id="observacion-paso"
              rows={4}
              value={observacion}
              onChange={(e) => {
                setObservacion(e.target.value)
                if (error) setError(null)
              }}
              placeholder="Describa brevemente las gestiones realizadas para certificar el cumplimiento de este hito..."
              className={`w-full px-3 py-2 text-sm rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition ${
                error
                  ? 'border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            <div className="flex items-center justify-between mt-1 text-[11px] text-gray-500 dark:text-gray-400">
              <span>Mínimo 5 caracteres de respaldo</span>
              <span className={observacion.trim().length < 5 ? 'text-amber-500' : 'text-emerald-500'}>
                {observacion.trim().length}/5
              </span>
            </div>
            {error && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </p>
            )}
          </div>

          {/* Campo de carga de evidencia probatoria (Hallazgo 7) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              Evidencia Adjunta / Documento Probatorio <span className="text-gray-400 font-normal lowercase">(opcional)</span>
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
            />

            {!archivo ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 hover:border-emerald-500 dark:hover:border-emerald-400 bg-gray-50/60 dark:bg-gray-700/40 text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-medium">Adjuntar PDF, Acta o Imagen (máx. 10 MB)</span>
              </button>
            ) : (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-950 dark:text-emerald-100">
                <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                  <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-semibold truncate">{archivo.name}</span>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-300 shrink-0">
                    ({(archivo.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1 rounded-lg text-emerald-700 hover:text-red-600 dark:text-emerald-300 dark:hover:text-red-400 transition shrink-0"
                  title="Quitar archivo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Certificar Paso Realizado</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

CompletarPasoModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  paso: PropTypes.object,
  loading: PropTypes.bool,
}
