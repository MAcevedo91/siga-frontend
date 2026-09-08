import { useState } from 'react'
import PropTypes from 'prop-types'
import CompletarPasoModal from './CompletarPasoModal'
import { formatDate } from '@/utils/formatDate'
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  User,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react'

export default function ChecklistProtocolo({
  pasos = [],
  loading = false,
  canEdit = false,
  onCompletarPaso,
  protocoloCerrado = false,
}) {
  const [selectedPaso, setSelectedPaso] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [completing, setCompleting] = useState(false)

  const totalPasos = pasos.length
  const pasosCompletados = pasos.filter((p) => p.completado).length
  const porcentaje = totalPasos > 0 ? Math.round((pasosCompletados / totalPasos) * 100) : 0

  const handleOpenModal = (paso) => {
    setSelectedPaso(paso)
    setModalOpen(true)
  }

  const handleConfirmCompletar = async (observacion) => {
    if (!selectedPaso || !onCompletarPaso) return
    try {
      setCompleting(true)
      await onCompletarPaso(selectedPaso.id, observacion)
      setModalOpen(false)
      setSelectedPaso(null)
    } finally {
      setCompleting(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Encabezado del Checklist */}
      <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Checklist de Pasos Normativos RICE
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Lista de verificación legal obligatoria antes de avanzar de etapa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                porcentaje === 100
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
              }`}
            >
              {pasosCompletados} de {totalPasos} pasos ({porcentaje}%)
            </span>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden shadow-inner">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              porcentaje === 100
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600'
            }`}
            style={{ width: `${porcentaje}%` }}
            role="progressbar"
            aria-valuenow={porcentaje}
            aria-valuemin="0"
            aria-valuemax="100"
          />
        </div>
      </div>

      {/* Lista de pasos normativos */}
      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
            <span>Cargando lista de pasos normativos...</span>
          </div>
        ) : pasos.length === 0 ? (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
            No hay pasos normativos registrados para este protocolo.
          </div>
        ) : (
          <div className="space-y-3.5">
            {pasos.map((paso) => {
              const isDone = Boolean(paso.completado)

              return (
                <div
                  key={paso.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isDone
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                      : 'bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 shadow-sm'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Indicador y detalles */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="mt-0.5 shrink-0">
                        {isDone ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center font-bold text-xs">
                            {paso.orden}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5 flex-1 min-w-0">
                        {/* Badges de orden y plazo */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-300">
                            Paso #{paso.orden}
                          </span>
                          <span className="text-[11px] font-semibold inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            <Clock className="w-3 h-3" />
                            Plazo: {paso.plazo_dias} {paso.plazo_dias === 1 ? 'día' : 'días'}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              isDone
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {isDone ? 'Completado' : 'Pendiente'}
                          </span>
                        </div>

                        {/* Título de la acción */}
                        <p
                          className={`text-sm font-semibold ${
                            isDone
                              ? 'text-gray-900 dark:text-white'
                              : 'text-gray-800 dark:text-gray-200'
                          }`}
                        >
                          {paso.accion}
                        </p>

                        {/* Metadatos si está completado */}
                        {isDone && (
                          <div className="pt-1.5 space-y-1 text-xs text-gray-600 dark:text-gray-300 border-t border-emerald-100 dark:border-emerald-900/40">
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500 dark:text-gray-400">
                              {paso.fecha_completado && (
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-emerald-600" />
                                  {formatDate(paso.fecha_completado)}
                                </span>
                              )}
                              {paso.responsable && (
                                <span className="inline-flex items-center gap-1">
                                  <User className="w-3 h-3 text-emerald-600" />
                                  {paso.responsable.nombre} {paso.responsable.apellido} ({paso.responsable.rol})
                                </span>
                              )}
                            </div>

                            {/* Observación de respaldo */}
                            {paso.observacion && (
                              <div className="mt-1 p-2.5 rounded-lg bg-white/80 dark:bg-gray-900/60 border border-emerald-100 dark:border-emerald-900/40 flex items-start gap-2 text-xs">
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <p className="italic text-gray-700 dark:text-gray-300">
                                  &ldquo;{paso.observacion}&rdquo;
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botón para completar paso */}
                    {!isDone && canEdit && !protocoloCerrado && (
                      <button
                        type="button"
                        onClick={() => handleOpenModal(paso)}
                        className="self-end sm:self-center inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 shadow-sm transition shrink-0"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completar</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de certificación */}
      <CompletarPasoModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedPaso(null)
        }}
        onConfirm={handleConfirmCompletar}
        paso={selectedPaso}
        loading={completing}
      />
    </div>
  )
}

ChecklistProtocolo.propTypes = {
  pasos: PropTypes.array,
  loading: PropTypes.bool,
  canEdit: PropTypes.bool,
  onCompletarPaso: PropTypes.func,
  protocoloCerrado: PropTypes.bool,
}
