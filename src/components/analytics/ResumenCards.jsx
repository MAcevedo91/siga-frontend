import { FolderOpen, AlertTriangle, Users, TrendingUp, TrendingDown } from 'lucide-react'

export default function ResumenCards({ data = {}, loading = false }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-7 lg:gap-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl p-5 sm:p-6 shadow-2xs animate-pulse bg-gray-100 dark:bg-gray-800 min-h-[120px]"
          />
        ))}
      </div>
    )
  }

  const kpis = [
    {
      title: 'Incidentes del Mes',
      value: data.totalIncidentes ?? 0,
      change: data.variacion,
      icon: FolderOpen,
      iconBg: 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-2xs',
      cardBg:
        'bg-gradient-to-br from-purple-100/90 via-indigo-50/50 to-white dark:from-purple-950/70 dark:via-slate-900/80 dark:to-gray-800 border border-purple-300/90 dark:border-purple-800/80 text-purple-950 dark:text-purple-100',
    },
    {
      title: 'Casos Abiertos',
      value: data.abiertos ?? 0,
      subtext: 'En investigación activa',
      icon: AlertTriangle,
      iconBg: 'bg-gradient-to-tr from-blue-600 to-cyan-600 text-white shadow-2xs',
      cardBg:
        'bg-gradient-to-br from-blue-100/90 via-sky-50/50 to-white dark:from-blue-950/70 dark:via-slate-900/80 dark:to-gray-800 border border-blue-300/90 dark:border-blue-800/80 text-blue-950 dark:text-blue-100',
    },
    {
      title: 'Estudiantes en Riesgo',
      value: data.estudiantesRiesgo ?? 0,
      subtext: 'Focalización prioritaria',
      icon: Users,
      iconBg: 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-2xs',
      cardBg:
        'bg-gradient-to-br from-emerald-100/90 via-teal-50/50 to-white dark:from-emerald-950/70 dark:via-slate-900/80 dark:to-gray-800 border border-emerald-300/90 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-100',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-7 lg:gap-8">
      {kpis.map((card, idx) => {
        const IconComponent = card.icon

        return (
          <div
            key={idx}
            className={`rounded-2xl p-5 sm:p-6 shadow-2xs transition-all flex flex-col justify-between min-h-[120px] ${card.cardBg}`}
          >
            {/* CABECERA: ICONO SQUIRCLE + TÍTULO LIMPIO */}
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}
              >
                <IconComponent className="w-4 h-4" />
              </div>
              <h2 className="text-xs font-bold uppercase tracking-wider opacity-90 truncate">
                {card.title}
              </h2>
            </div>

            {/* CIFRA PRINCIPAL ENORME Y DESAHOGADA */}
            <div className="my-2.5">
              <p className="text-3xl sm:text-4xl font-black tracking-tight leading-none">
                {card.value}
              </p>
            </div>

            {/* SUBTEXTO / VARIACIÓN */}
            <div className="text-[11px] opacity-80 font-medium flex items-center gap-1 truncate">
              {card.change !== undefined ? (
                <>
                  {card.change >= 0 ? (
                    <TrendingUp className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  )}
                  <span>
                    {card.change >= 0 ? `+${card.change}` : card.change}% vs mes anterior
                  </span>
                </>
              ) : (
                <span>{card.subtext}</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
