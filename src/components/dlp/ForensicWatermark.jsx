import { useMemo } from 'react'
import { useAuth } from '@/store/useAuthStore'
import { usePrivacyStore } from '@/store/usePrivacyStore'

/**
 * Marca de agua forense translúcida repetida diagonalmente sobre la vista activa.
 * Proporciona no-repudio y disuasión contundente ante capturas de pantalla o fotos tomadas con teléfonos.
 */
export default function ForensicWatermark() {
  const { user } = useAuth()
  const { watermarkHabilitada } = usePrivacyStore()

  const watermarkText = useMemo(() => {
    if (!user) return ''
    const nombre = `${user.nombre || ''} ${user.apellido || ''}`.trim() || 'Funcionario'
    const email = user.email || user.username || 'SIGA Escolar'
    const rol = user.rol || 'Personal Autorizado'
    const fecha = new Date().toLocaleDateString('es-CL')
    return `${nombre} · ${email} · ${rol} · ${fecha} · SIGA ESCOLAR · LEY 19.628`
  }, [user])

  if (!watermarkHabilitada || !user) {
    return null
  }

  return (
    <div
      aria-hidden="true"
      data-testid="forensic-watermark"
      className="pointer-events-none fixed inset-0 z-30 select-none overflow-hidden"
    >
      <svg className="w-full h-full opacity-[0.035] dark:opacity-[0.065]">
        <defs>
          <pattern
            id="forensic-pattern"
            width="420"
            height="180"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-22)"
          >
            <text
              x="20"
              y="40"
              fontSize="10"
              fontWeight="bold"
              fontFamily="sans-serif"
              fill="currentColor"
              className="text-slate-900 dark:text-slate-100"
            >
              {watermarkText}
            </text>
            <text
              x="20"
              y="120"
              fontSize="9"
              fontWeight="semibold"
              fontFamily="sans-serif"
              fill="currentColor"
              className="text-slate-700 dark:text-slate-300"
            >
              CONFIDENCIAL — PROHIBIDA SU DIFUSIÓN O FOTOGRAFÍA
            </text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#forensic-pattern)" />
      </svg>
    </div>
  )
}
