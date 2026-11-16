import { useEffect, useRef, useState } from 'react'
import { usePrivacyStore } from '@/store/usePrivacyStore'

const IDLE_TIMEOUT_MS = 2 * 60 * 1000 // 2 minutos de inactividad

/**
 * Escudo de protección contra miradas indiscretas y puestos desatendidos.
 * Se activa automáticamente al minimizar/cambiar de pestaña (visibilitychange) o tras 2 minutos de inactividad.
 */
export default function PrivacyShieldOverlay() {
  const { pantallaProtegida, bloquearPantalla, desbloquearPantalla } = usePrivacyStore()
  const [isUnlocking, setIsUnlocking] = useState(false)
  const idleTimerRef = useRef(null)

  // Reset del temporizador de inactividad
  const resetIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    idleTimerRef.current = setTimeout(() => {
      bloquearPantalla()
    }, IDLE_TIMEOUT_MS)
  }

  useEffect(() => {
    // 1. Escuchar cambio de visibilidad de la pestaña (ej. minimizar o cambiar de app)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        bloquearPantalla()
      }
    }

    // 2. Escuchar actividad del usuario para resetear inactividad
    const activityEvents = ['mousemove', 'keydown', 'scroll', 'touchstart']
    const handleUserActivity = () => {
      resetIdleTimer()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true })
    })

    resetIdleTimer()

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleUserActivity)
      })
    }
  }, [bloquearPantalla])

  // Reset del estado visual de desbloqueo al cambiar la propiedad en el store
  useEffect(() => {
    if (!pantallaProtegida) {
      setIsUnlocking(false)
    }
  }, [pantallaProtegida])

  if (!pantallaProtegida) {
    return null
  }

  const handleResume = (e) => {
    if (e) e.stopPropagation()
    if (isUnlocking) return

    setIsUnlocking(true)

    const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test'
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

    if (isTest || prefersReducedMotion) {
      desbloquearPantalla()
    } else {
      setTimeout(() => {
        desbloquearPantalla()
      }, 320)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-title"
      data-testid="privacy-shield-overlay"
      onClick={handleResume}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 cursor-pointer select-none privacy-shield-root privacy-shield-backdrop ${
        isUnlocking ? 'is-open' : ''
      }`}
    >
      <main
        onClick={(e) => e.stopPropagation()}
        className="privacy-shield-card cursor-default"
      >
        <svg viewBox="0 0 300 180" aria-hidden="true" className="privacy-shield-svg">
          <defs>
            <linearGradient id="privacy-scan-gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#0f9d8a" stopOpacity="0" />
              <stop offset="0.5" stopColor="#0f9d8a" stopOpacity="0.35" />
              <stop offset="1" stopColor="#0f9d8a" stopOpacity="0" />
            </linearGradient>
            <clipPath id="privacy-clip-box">
              <rect x="20" y="66" width="260" height="114" rx="10" />
            </clipPath>
          </defs>

          {/* Fichas de estudiantes con censura/redacción animada */}
          <g>
            <rect className="privacy-row-bg" x="20" y="70" width="260" height="32" rx="9" />
            <circle className="privacy-av" cx="40" cy="86" r="9" />
            <rect className="privacy-ln" x="60" y="78" width="110" height="6" rx="3" />
            <rect className="privacy-ln" x="60" y="89" width="70" height="5" rx="2.5" />
            <rect className="privacy-bar" x="58" y="76" width="140" height="20" rx="4" />

            <rect className="privacy-row-bg" x="20" y="108" width="260" height="32" rx="9" />
            <circle className="privacy-av" cx="40" cy="124" r="9" />
            <rect className="privacy-ln" x="60" y="116" width="95" height="6" rx="3" />
            <rect className="privacy-ln" x="60" y="127" width="80" height="5" rx="2.5" />
            <rect
              className="privacy-bar"
              style={{ animationDelay: '0.3s' }}
              x="58"
              y="114"
              width="140"
              height="20"
              rx="4"
            />

            <rect className="privacy-row-bg" x="20" y="146" width="260" height="32" rx="9" />
            <circle className="privacy-av" cx="40" cy="162" r="9" />
            <rect className="privacy-ln" x="60" y="154" width="120" height="6" rx="3" />
            <rect className="privacy-ln" x="60" y="165" width="60" height="5" rx="2.5" />
            <rect
              className="privacy-bar"
              style={{ animationDelay: '0.6s' }}
              x="58"
              y="152"
              width="140"
              height="20"
              rx="4"
            />
          </g>

          {/* Haz de barrido luminoso */}
          <g clipPath="url(#privacy-clip-box)">
            <rect className="privacy-scan" x="20" y="48" width="260" height="22" fill="url(#privacy-scan-gradient)" />
          </g>

          {/* Escudo con candado dinámico */}
          <g transform="translate(150 34)">
            <circle className="privacy-ring" r="26" />
            <path
              className="privacy-sh"
              d="M0-28c10 6 20 8 26 8 0 24-6 40-26 50C-20 20-26-4-26-20c6 0 16-2 26-8z"
            />
            <g className="privacy-lock">
              <path
                className="privacy-shackle"
                d="M-6-4v-4a6 6 0 0112 0v4"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <rect
                className="privacy-lockbody"
                x="-9"
                y="-3"
                width="18"
                height="14"
                rx="3.5"
                fill="var(--accent)"
              />
            </g>
          </g>
        </svg>

        <h1
          id="privacy-title"
          className="text-[22px] font-bold tracking-tight text-[var(--ink)] mt-5 mb-1.5"
        >
          Sesión protegida
        </h1>

        <p className="text-[14.5px] leading-relaxed text-[var(--muted)] mb-5">
          Los datos de los estudiantes están ocultos.
          <span className="sr-only">Pantalla Protegida por Privacidad</span>
        </p>

        <button
          id="go"
          type="button"
          onClick={handleResume}
          data-testid="resume-session-button"
          className="w-full font-semibold text-[15px] text-white bg-[var(--accent)] hover:bg-[var(--accent-d)] rounded-xl py-3 px-5 transition-all duration-200 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] shadow-md shadow-emerald-950/20"
        >
          {isUnlocking ? 'Sesión reanudada' : 'Reanudar sesión'}
        </button>
      </main>
    </div>
  )
}
