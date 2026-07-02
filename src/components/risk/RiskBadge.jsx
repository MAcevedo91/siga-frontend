import React from 'react'
import { AlertTriangle } from 'lucide-react'

const RISK_COLORS = {
  'Bajo': 'bg-green-100 text-green-800 border-green-300',
  'Medio': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'Alto': 'bg-orange-100 text-orange-800 border-orange-300',
  'Crítico': 'bg-red-100 text-red-800 border-red-300'
}

export default function RiskBadge({ level, score, size = 'sm' }) {
  if (level === 'Bajo' && score === 0) return null

  const colorClass = RISK_COLORS[level] || RISK_COLORS['Bajo']
  const sizeClass = size === 'lg' ? 'px-3 py-2 text-base' : 'px-2 py-1 text-xs'

  return (
    <div className={`inline-flex items-center gap-1 rounded border ${colorClass} ${sizeClass} font-semibold`}>
      {(level === 'Alto' || level === 'Crítico') && (
        <AlertTriangle className="w-3 h-3" />
      )}
      {level} ({score})
    </div>
  )
}
