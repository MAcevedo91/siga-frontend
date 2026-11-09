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
  HeartHandshake,
  Sparkles,
  BookOpen
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
      containerCard: 'bg-gradient-to-br from-rose-200/90 via-rose-100/50 to-white dark:from-rose-950/70 dark:via-slate-900 dark:to-gray-800 border-2 border-rose-300/90 dark:border-rose-800/80',
      icono: ShieldAlert,
      texto: 'Alerta Alta / Intervención'
    },
    amarillo: {
      clases: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700',
      containerCard: 'bg-gradient-to-br from-amber-200/90 via-amber-100/50 to-white dark:from-amber-950/70 dark:via-slate-900 dark:to-gray-800 border-2 border-amber-300/90 dark:border-amber-800/80',
      icono: AlertTriangle,
      texto: 'Alerta Preventiva'
    },
    verde: {
      clases: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700',
      containerCard: 'bg-gradient-to-br from-emerald-200/90 via-teal-100/50 to-white dark:from-emerald-950/70 dark:via-slate-900 dark:to-gray-800 border-2 border-emerald-300/90 dark:border-emerald-800/80',
      icono: CheckCircle2,
      texto: 'Clima Favorable'
    }
  }[diag.nivel_alerta] || {
    clases: 'bg-gray-100 text-gray-800 border-gray-300',
    containerCard: 'bg-gradient-to-br from-slate-200/90 via-slate-100/50 to-white dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 border-2 border-slate-300',
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
      <div className="relative w-full max-w-2xl bg-gradient-to-br from-blue-100/90 via-indigo-50/60 to-white dark:from-slate-900 dark:via-slate-900 dark:to-gray-800 rounded-2xl shadow-2xl border-2 border-blue-300/90 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera con degradado temático institucional */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-300/80 dark:border-blue-900/60 bg-gradient-to-r from-blue-200/90 via-indigo-100/70 to-white dark:from-blue-950/80 dark:via-indigo-950/40 dark:to-gray-900">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-sm shadow-xs shrink-0">
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
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/80 dark:hover:bg-gray-800 transition"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto space-y-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Cargando diagnóstico del curso...</p>
            </div>
          ) : (
            <>
              {/* Badge y Semáforo */}
              <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl shadow-xs transition-all ${badgeAlerta.containerCard}`}>
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

              {/* Métricas Resumidas (Cards con colores diferenciados e intensificados) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-200/90 via-blue-100/40 to-white dark:from-blue-950/60 dark:to-gray-800 border-2 border-blue-300/90 dark:border-blue-800/60 shadow-xs text-center transition-all">
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Total Casos</p>
                  <p className="text-2xl font-black text-blue-950 dark:text-blue-100 mt-1">
                    {diag.total_incidentes || 0}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-200/90 via-emerald-100/40 to-white dark:from-emerald-950/60 dark:to-gray-800 border-2 border-emerald-300/90 dark:border-emerald-800/60 shadow-xs text-center transition-all">
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Leves</p>
                  <p className="text-2xl font-black text-emerald-950 dark:text-emerald-100 mt-1">
                    {diag.gravedad?.Leve || 0}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-200/90 via-amber-100/40 to-white dark:from-amber-950/60 dark:to-gray-800 border-2 border-amber-300/90 dark:border-amber-800/60 shadow-xs text-center transition-all">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide">Graves</p>
                  <p className="text-2xl font-black text-amber-950 dark:text-amber-100 mt-1">
                    {diag.gravedad?.Grave || 0}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-rose-200/90 via-rose-100/40 to-white dark:from-rose-950/60 dark:to-gray-800 border-2 border-rose-300/90 dark:border-rose-800/60 shadow-xs text-center transition-all">
                  <p className="text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wide">Gravísimas</p>
                  <p className="text-2xl font-black text-rose-950 dark:text-rose-100 mt-1">
                    {diag.gravedad?.['Gravísima'] || 0}
                  </p>
                </div>
              </div>

              {/* Tipologías Predominantes */}
              <div className="bg-gradient-to-br from-slate-200/80 via-blue-50/50 to-white dark:from-slate-900/80 dark:to-gray-800 border-2 border-slate-300/90 dark:border-gray-700 rounded-xl p-4.5 shadow-xs space-y-3">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-300/70 dark:border-gray-700/60">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    Tipologías y Abordajes Frecuentes
                  </h4>
                </div>
                {diag.tipologias && diag.tipologias.length > 0 ? (
                  <div className="space-y-2.5 pt-1">
                    {diag.tipologias.map((tipo, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-700 dark:text-gray-300">
                          <span className="font-semibold truncate max-w-[80%]">{tipo.nombre}</span>
                          <span className="font-bold text-slate-900 dark:text-white">{tipo.cantidad} ({tipo.porcentaje}%)</span>
                        </div>
                        <div className="w-full bg-slate-300/80 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
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

              {/* Recomendación Pedagógica Orientativa (IA + RICE) */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-200/90 via-violet-100/50 to-white dark:from-purple-950/75 dark:via-slate-900/80 dark:to-gray-800 border-2 border-purple-300/90 dark:border-purple-800/80 shadow-md space-y-3 transition-all">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-purple-200/60 dark:border-purple-800/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                      <HeartHandshake className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-purple-950 dark:text-purple-200">
                        Orientación de Convivencia Escolar
                      </h4>
                      <p className="text-[11px] text-purple-700/80 dark:text-purple-300/70">
                        Protocolos recomendados y medidas formativas
                      </p>
                    </div>
                  </div>
                  {diag.es_ia ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 border border-purple-300 dark:border-purple-700 shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      Asesor IA • RICE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      Heurística RICE
                    </span>
                  )}
                </div>

                <p className="text-sm text-purple-950 dark:text-purple-100 leading-relaxed whitespace-pre-line font-medium">
                  {diag.recomendacion_pedagogica || 'Mantener monitoreo regular del curso.'}
                </p>

                {diag.fuentes_rice && diag.fuentes_rice.length > 0 && (
                  <div className="pt-2.5 border-t border-purple-200/60 dark:border-purple-800/40 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="flex items-center gap-1 text-[11px] font-bold text-purple-900 dark:text-purple-300">
                      <BookOpen className="w-3.5 h-3.5" />
                      Fundamento RICE:
                    </span>
                    {diag.fuentes_rice.map((f, idx) => (
                      <span
                        key={idx}
                        className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/90 dark:bg-gray-800 text-purple-900 dark:text-purple-200 border border-purple-200/90 dark:border-purple-700 shadow-2xs"
                      >
                        {f.articulo ? `${f.articulo}` : f.seccion || 'Reglamento Interno'}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Resguardo Ético y Privacidad */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-50/80 dark:bg-gray-900/40 text-slate-600 dark:text-gray-400 text-xs border border-slate-200/80 dark:border-gray-800">
                <Info className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
                <p>
                  {diag.nota_privacidad || 'Información agregada con fines estrictamente formativos y de gestión de convivencia (Ley N° 19.628).'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-gray-200/80 dark:border-gray-700 bg-gradient-to-r from-gray-50 via-slate-50 to-gray-100/80 dark:from-gray-900 dark:to-gray-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-slate-800 to-gray-900 hover:from-slate-700 hover:to-gray-800 text-white shadow-xs transition"
          >
            Cerrar Diagnóstico
          </button>
        </div>
      </div>
    </div>
  )
}
