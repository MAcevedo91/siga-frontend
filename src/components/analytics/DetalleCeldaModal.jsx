import { useEffect } from 'react'
import {
  X,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Users,
  Info,
  Calendar,
  Layers,
  HeartHandshake
} from 'lucide-react'

export default function DetalleCeldaModal({ data, loading, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!data && !loading) return null

  const curso = data?.curso || {}
  const mes = data?.mes || {}
  const diag = data?.diagnostico || {}

  const badgeAlerta = {
    rojo: {
      clases: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700',
      icono: ShieldAlert,
      texto: 'Alerta Alta / Intervención'
    },
    amarillo: {
      clases: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700',
      icono: AlertTriangle,
      texto: 'Alerta Preventiva'
    },
    verde: {
      clases: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700',
      icono: CheckCircle2,
      texto: 'Clima Favorable'
    }
  }[diag.nivel_alerta] || {
    clases: 'bg-gray-100 text-gray-800 border-gray-300',
    icono: Info,
    texto: 'Sin Alertas'
  }

  const IconoAlerta = badgeAlerta.icono

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-sm">
              {curso.letra || 'C'}
            </span>
            <div>
              <h3 id="modal-titulo" className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {curso.nombre || 'Curso'}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  • {mes.nombre || 'Mes'} {mes.anio}
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Diagnóstico pedagógico y situacional de convivencia
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Cargando diagnóstico del curso...</p>
            </div>
          ) : (
            <>
              {/* Badge y Semáforo */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2.5">
                  <IconoAlerta className="w-5 h-5 text-gray-700 dark:text-gray-300 shrink-0" />
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badgeAlerta.clases}`}>
                    {badgeAlerta.texto}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Período: {mes.nombre} {mes.anio}
                </div>
              </div>

              {/* Métricas Resumidas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-center">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Total Casos</p>
                  <p className="text-2xl font-extrabold text-blue-900 dark:text-blue-100 mt-1">
                    {diag.total_incidentes || 0}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-center">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Leves</p>
                  <p className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-100 mt-1">
                    {diag.gravedad?.Leve || 0}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-center">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Graves</p>
                  <p className="text-2xl font-extrabold text-amber-900 dark:text-amber-100 mt-1">
                    {diag.gravedad?.Grave || 0}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-center">
                  <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">Gravísimas</p>
                  <p className="text-2xl font-extrabold text-rose-900 dark:text-rose-100 mt-1">
                    {diag.gravedad?.['Gravísima'] || 0}
                  </p>
                </div>
              </div>

              {/* Tipologías Predominantes */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-gray-500" />
                  Tipologías y Abordajes Frecuentes
                </h4>
                {diag.tipologias && diag.tipologias.length > 0 ? (
                  <div className="space-y-2">
                    {diag.tipologias.map((tipo, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-700 dark:text-gray-300">
                          <span className="font-medium truncate max-w-[80%]">{tipo.nombre}</span>
                          <span className="font-bold">{tipo.cantidad} ({tipo.porcentaje}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(tipo.porcentaje, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                    Sin tipologías registradas para este mes.
                  </p>
                )}
              </div>

              {/* Recomendación Pedagógica Orientativa */}
              <div className="p-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Orientación de Convivencia Escolar
                </h4>
                <p className="text-sm text-indigo-900/90 dark:text-indigo-100 leading-relaxed">
                  {diag.recomendacion_pedagogica || 'Mantener monitoreo regular del curso.'}
                </p>
              </div>

              {/* Resguardo Ético y Privacidad */}
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/30 text-gray-500 dark:text-gray-400 text-xs border border-gray-200 dark:border-gray-800">
                <Info className="w-4 h-4 shrink-0 text-gray-400 mt-0.5" />
                <p>
                  {diag.nota_privacidad || 'Información agregada con fines estrictamente formativos y de gestión de convivencia (Ley N° 19.628).'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            Cerrar Diagnóstico
          </button>
        </div>
      </div>
    </div>
  )
}
