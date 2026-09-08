import { TrendingUp, TrendingDown, AlertTriangle, FolderOpen } from 'lucide-react'

const ICON_COLORS = {
  blue: 'text-blue-600',
  red: 'text-red-600',
  yellow: 'text-yellow-600',
}

export default function ResumenCards({ data = {}, loading }) {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-300 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: 'Incidentes este mes',
      value: data.totalIncidentes ?? 0,
      change: data.variacion,
      icon: FolderOpen,
      color: 'blue',
    },
    {
      title: 'Incidentes abiertos',
      value: data.abiertos ?? 0,
      icon: AlertTriangle,
      color: 'red',
    },
    {
      title: 'Estudiantes en riesgo',
      value: data.estudiantesRiesgo ?? 0,
      description: '> 3 incidentes',
      icon: AlertTriangle,
      color: 'yellow',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, idx) => {
        const IconComponent = card.icon
        const iconColorClass = ICON_COLORS[card.color] || 'text-gray-600'

        return (
          <div key={idx} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">{card.title}</p>
              <IconComponent className={`w-5 h-5 ${iconColorClass}`} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{card.value}</p>
            {card.change !== undefined && (
              <div className="flex items-center mt-2">
                {card.change >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-red-600 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-green-600 mr-1" />
                )}
                <span className={`text-sm ${card.change >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {Math.abs(card.change)}% vs mes anterior
                </span>
              </div>
            )}
            {card.description && (
              <p className="text-xs text-gray-500 mt-1">{card.description}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
