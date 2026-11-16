import { useState, useEffect, useRef } from 'react'
import { Eye, EyeOff, ShieldAlert } from 'lucide-react'
import { usePrivacyStore } from '@/store/usePrivacyStore'

/**
 * Enmascara un valor sensible de acuerdo a su tipo
 */
export function enmascararValor(valor, tipo) {
  if (!valor) return ''
  const str = String(valor).trim()

  switch (tipo) {
    case 'rut': {
      // 12.345.678-9 -> 12.***.***-*
      const partes = str.split('-')
      if (partes.length === 2) {
        const cuerpo = partes[0]
        const primerSegmento = cuerpo.slice(0, 2)
        return `${primerSegmento}.***.***-*`
      }
      return `${str.slice(0, 2)}***-**`
    }
    case 'nombre': {
      // "Juan Pérez González" -> "J*** P*** G***"
      return str
        .split(' ')
        .filter(Boolean)
        .map((p) => `${p[0]}***`)
        .join(' ')
    }
    case 'diagnostico':
      return '[Diagnóstico Clínico/PIE Reservado]'
    case 'relato':
      return '[Relato confidencial de convivencia escolar protegido por DLP]'
    default:
      return str.length > 4 ? `${str.slice(0, 2)}••••${str.slice(-2)}` : '••••'
  }
}

/**
 * Componente atómico DLP para renderizar información sensible con protección
 * contra miradas indiscretas (shoulder surfing) y filtraciones visuales.
 */
export default function DlpSensitiveText({
  value,
  children,
  tipo = 'texto',
  placeholder = '—',
  className = '',
  alwaysBlur = false,
  showIcon = true,
  revealDurationMs = 5000,
}) {
  const { modoPrivacidad } = usePrivacyStore()
  const [isRevealed, setIsRevealed] = useState(false)
  const timerRef = useRef(null)

  const rawValue = value !== undefined && value !== null
    ? String(value)
    : (children !== undefined && children !== null
      ? (Array.isArray(children)
        ? children.map((c) => (typeof c === 'string' || typeof c === 'number' ? c : '')).join('')
        : String(children))
      : '')

  const debeProtegerse = modoPrivacidad || alwaysBlur

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  if (!rawValue) {
    return <span className={`text-gray-400 italic ${className}`}>{placeholder}</span>
  }

  const handleToggleReveal = (e) => {
    e.stopPropagation()
    if (!debeProtegerse) return

    if (isRevealed) {
      if (timerRef.current) clearTimeout(timerRef.current)
      setIsRevealed(false)
    } else {
      setIsRevealed(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setIsRevealed(false)
      }, revealDurationMs)
    }
  }

  if (!debeProtegerse) {
    return <span className={className}>{rawValue}</span>
  }

  const textoMostrar = isRevealed ? rawValue : enmascararValor(rawValue, tipo)

  return (
    <span
      onClick={handleToggleReveal}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleToggleReveal(e)
        }
      }}
      title={isRevealed ? 'Clic para ocultar inmediatamente' : 'Dato protegido por DLP escolar. Clic para develar por 5 segundos.'}
      className={`group relative inline-flex items-center gap-1.5 cursor-pointer select-none transition-all duration-200 rounded px-1 -mx-1 ${
        isRevealed
          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60'
          : 'bg-slate-100 hover:bg-slate-200 dark:bg-gray-800/80 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200'
      } ${className}`}
    >
      <span
        className={`transition-all duration-200 ${
          isRevealed ? 'filter-none font-medium' : 'blur-[3px] opacity-75 group-hover:opacity-90 font-mono tracking-wider'
        }`}
      >
        {textoMostrar}
      </span>

      {showIcon && (
        <span
          className={`inline-flex items-center justify-center transition-colors ${
            isRevealed
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'
          }`}
          aria-label={isRevealed ? 'Ocultar' : 'Develar temporalmente'}
        >
          {isRevealed ? (
            <EyeOff className="w-3.5 h-3.5" />
          ) : (
            <Eye className="w-3.5 h-3.5" />
          )}
        </span>
      )}
    </span>
  )
}
