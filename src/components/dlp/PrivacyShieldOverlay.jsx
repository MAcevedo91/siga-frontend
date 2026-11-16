import { useEffect, useRef } from 'react'
import { ShieldAlert, Lock, Unlock, Eye } from 'lucide-react'
import { usePrivacyStore } from '@/store/usePrivacyStore'

const IDLE_TIMEOUT_MS = 2 * 60 * 1000 // 2 minutos de inactividad

/**
 * Escudo de protección contra miradas indiscretas y puestos desatendidos.
 * Se activa automáticamente al minimizar/cambiar de pestaña (visibilitychange) o tras 2 minutos de inactividad.
 */
export default function PrivacyShieldOverlay() {
  const { pantallaProtegida, bloquearPantalla, desbloquearPantalla } = usePrivacyStore()
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

  if (!pantallaProtegida) {
    return null
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pantalla protegida"
      data-testid="privacy-shield-overlay"
      onClick={desbloquearPantalla}
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xl bg-slate-900/85 p-4 cursor-pointer select-none animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-gray-700 text-center animate-scaleUp"
      >
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-4 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
          Pantalla Protegida por Privacidad
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
          La vista se ha ocultado preventivamente para evitar miradas externas no autorizadas y proteger antecedentes sensibles de los estudiantes (Ley N° 19.628 y Circular N° 482).
        </p>

        <button
          type="button"
          onClick={desbloquearPantalla}
          data-testid="resume-session-button"
          className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Unlock className="w-4 h-4" />
          <span>Reanudar sesión y visualizar datos</span>
        </button>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
          O haz clic en cualquier parte del fondo para continuar
        </p>
      </div>
    </div>
  )
}
