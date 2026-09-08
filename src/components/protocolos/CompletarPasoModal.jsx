import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { CheckCircle2, AlertCircle, X, RefreshCw } from 'lucide-react'

export default function CompletarPasoModal({
  isOpen,
  onClose,
  onConfirm,
  paso,
  loading = false,
}) {
  const [observacion, setObservacion] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen) {
      setObservacion('')
      setError(null)
    }
  }, [isOpen])

  if (!isOpen || !paso) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = observacion.trim()
    if (trimmed.length < 5) {
      setError('La glosa u observación de respaldo debe contener al menos 5 caracteres')
      return
    }
    onConfirm(trimmed)
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
