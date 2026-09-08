import { useState } from 'react'
import PropTypes from 'prop-types'
import {
  AlertTriangle,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Info,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react'

export default function AlertaEscaladaBanner({
  diagnostico,
  className = '',
}) {
  const [mostrarDetalle, setMostrarDetalle] = useState(false)

  if (!diagnostico || !diagnostico.tiene_alerta) return null

  const esCritico = diagnostico.nivel === 'critico'

  return (
    <div
      role="alert"
      className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-sm ${
        esCritico
          ? 'bg-red-50/90 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-200'
          : 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
      } ${className}`}
    >
      {/* Encabezado del Banner */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-xl shrink-0 mt-0.5 ${
              esCritico
                ? 'bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400'
                : 'bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400'
            }`}
          >
            {esCritico ? (
              <ShieldAlert className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-bold tracking-tight">
                {esCritico
                  ? 'Alerta Crítica de Convivencia Escolar'
                  : 'Advertencia Preventiva de Reincidencia'}
              </h4>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  esCritico
                    ? 'bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200'
                    : 'bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                }`}
              >
                {diagnostico.nivel}
              </span>
            </div>

            <p className="text-xs opacity-90 leading-relaxed max-w-3xl">
              {diagnostico.sugerencia_accion}
            </p>
          </div>
        </div>

        {/* Botón para desplegar antecedentes */}
        <button
          type="button"
          onClick={() => setMostrarDetalle(!mostrarDetalle)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold self-start sm:self-center transition shrink-0 ${
            esCritico
              ? 'bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900 text-red-800 dark:text-red-200'
              : 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-200'
          }`}
        >
          <span>{mostrarDetalle ? 'Ocultar antecedentes' : 'Ver detalle de antecedentes'}</span>
          {mostrarDetalle ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Lista de Motivos Detectados */}
      {Array.isArray(diagnostico.motivos) && diagnostico.motivos.length > 0 && (
        <ul className="mt-3 ml-11 space-y-1 text-xs list-disc pl-3 opacity-95">
          {diagnostico.motivos.map((motivo, index) => (
            <li key={index}>{motivo}</li>
          ))}
        </ul>
      )}

      {/* Detalle Desplegable de Antecedentes sin salir de la vista */}
      {mostrarDetalle && (
        <div className="mt-4 pt-3 border-t border-current/15 text-xs space-y-3 animate-fadeIn">
          {/* Ámbitos Reincidentes */}
          {diagnostico.detalles?.ambitos_reincidentes?.length > 0 && (
            <div className="space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Reincidencia por Ámbito Normativo:</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-5">
                {diagnostico.detalles.ambitos_reincidentes.map((a, i) => {
                  const esObjeto = typeof a === 'object' && a !== null
                  const nombreAmbito = esObjeto ? (a.nombre || a.ambito || a.titulo) : a
                  const cantidad = esObjeto ? a.cantidad : null

                  return (
                    <div
                      key={i}
                      className="p-2 rounded-lg bg-white/70 dark:bg-gray-900/60 border border-current/10"
                    >
                      <span className="font-semibold">{nombreAmbito}</span>
                      {cantidad != null ? (
                        <span>: {cantidad} faltas registradas en los últimos 45 días</span>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Patrón de Escalada */}
          {Boolean(diagnostico.detalles?.patron_escalada) && (
            <div className="space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Patrón de Conducta Identificado:</span>
              </p>
              <div className="space-y-1.5 pl-5">
                {Array.isArray(diagnostico.detalles.patron_escalada) ? (
                  diagnostico.detalles.patron_escalada.map((p, i) => (
                    typeof p === 'object' && p !== null ? (
                      <div
                        key={i}
                        className="p-2 rounded-lg bg-white/70 dark:bg-gray-900/60 border border-current/10 flex flex-wrap items-center gap-2"
                      >
                        <span>
                          {p.fecha_anterior} ({p.gravedad_anterior})
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-red-500" />
                        <span className="font-bold text-red-600 dark:text-red-400">
                          {p.fecha_posterior} ({p.gravedad_posterior})
                        </span>
                        <span className="text-[11px] opacity-75">
                          — {p.dias_diferencia} día(s) de diferencia
                        </span>
                      </div>
                    ) : (
                      <p key={i} className="text-xs">{p}</p>
                    )
                  ))
                ) : (
                  <p className="text-xs p-2 rounded-lg bg-white/70 dark:bg-gray-900/60 border border-current/10">
                    {diagnostico.detalles.patron_escalada}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-1 text-[11px] opacity-75 pt-1">
            <Info className="w-3 h-3" />
            <span>
              Total de incidentes recientes analizados en el período: {diagnostico.total_incidentes_recientes || 0}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

AlertaEscaladaBanner.propTypes = {
  diagnostico: PropTypes.shape({
    tiene_alerta: PropTypes.bool,
    nivel: PropTypes.oneOf(['critico', 'advertencia']),
    motivos: PropTypes.arrayOf(PropTypes.string),
    sugerencia_accion: PropTypes.string,
    total_incidentes_recientes: PropTypes.number,
    detalles: PropTypes.shape({
      ambitos_reincidentes: PropTypes.array,
      patron_escalada: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
    }),
  }),
  className: PropTypes.string,
}
