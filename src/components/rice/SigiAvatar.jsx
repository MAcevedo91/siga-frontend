import React, { useState } from 'react'

/**
 * Componente de Avatar Oficial para «Sigi: Copiloto Escolar IA».
 * Representa al robot de cartón escolar con mochila, resortes dorados, antenas arcoíris y stickers pedagógicos.
 */
export default function SigiAvatar({
  size = 'md',
  variant = 'avatar', // 'avatar' | 'full' | 'head' | 'badge'
  isThinking = false,
  isWaving = false,
  className = '',
  alt = 'Sigi — Copiloto Escolar',
}) {
  const [imageError, setImageError] = useState(false)

  // Mapeo de tamaños
  const sizeClasses = {
    xs: 'w-5 h-5 min-w-[20px]',
    sm: 'w-7 h-7 min-w-[28px]',
    md: 'w-9 h-9 min-w-[36px]',
    lg: 'w-12 h-12 min-w-[48px]',
    xl: 'w-14 h-14 min-w-[56px]',
    '2xl': 'w-24 h-24 min-w-[96px]',
    '3xl': 'w-32 h-32 min-w-[128px]',
  }

  const containerSize = sizeClasses[size] || sizeClasses.md

  let assetSrc = '/assets/sigi-avatar.webp'
  let fallbackPng = '/assets/sigi-avatar.png'

  if (variant === 'full') {
    assetSrc = '/assets/sigi-robot.webp'
    fallbackPng = '/assets/sigi-robot.png'
  } else if (variant === 'badge' || variant === 'button') {
    assetSrc = '/assets/sigi-badge.webp'
    fallbackPng = '/assets/sigi-badge.png'
  }

  return (
    <div
      data-testid="sigi-avatar"
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${containerSize} ${className} ${
        isThinking ? 'animate-pulse' : ''
      } ${isWaving ? 'hover:-rotate-3 transition-transform duration-300' : ''}`}
    >
      {!imageError ? (
        <picture className="w-full h-full flex items-center justify-center">
          <source srcSet={assetSrc} type="image/webp" />
          <img
            src={fallbackPng}
            alt={alt}
            onError={() => setImageError(true)}
            loading="lazy"
            className="w-full h-full object-contain drop-shadow-sm pointer-events-none"
          />
        </picture>
      ) : (
        /* Fallback vectorial SVG con la anatomía artesanal de Sigi */
        <svg
          role="img"
          aria-label={alt}
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-sm"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Antenas en espiral de colores */}
          <path
            d="M32 24 C28 16 35 10 32 4 C30 1 35 0 37 3"
            stroke="#f59e0b"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M68 24 C72 16 65 10 68 4 C70 1 65 0 63 3"
            stroke="#ec4899"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Cabeza de cartón turquesa */}
          <rect
            x="20"
            y="22"
            width="60"
            height="46"
            rx="6"
            fill="#06b6d4"
            stroke="#0891b2"
            strokeWidth="3"
          />

          {/* Textura de cartón corrugado en la parte superior */}
          <line x1="26" y1="26" x2="74" y2="26" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="3 2" />

          {/* Ojo Izquierdo (Círculo con iris verde y pupila negra) */}
          <circle cx="38" cy="40" r="10" fill="#a7f3d0" />
          <circle cx="38" cy="40" r="7" fill="#10b981" />
          <circle cx="39" cy="39" r="3.5" fill="#0f172a" />
          <circle cx="41" cy="37" r="1.5" fill="#ffffff" />

          {/* Ojo Derecho (Curioso con aro amarillo y pupila oscura) */}
          <circle cx="62" cy="40" r="10" fill="#fef08a" />
          <circle cx="62" cy="40" r="6" fill="#eab308" />
          <circle cx="61" cy="40" r="3.5" fill="#0f172a" />
          <circle cx="63" cy="38" r="1.5" fill="#ffffff" />

          {/* Boca: Ecualizador de colores (barritas de cartón) */}
          <rect x="34" y="56" width="32" height="6" rx="2" fill="#0e7490" />
          <rect x="36" y="57" width="5" height="4" rx="1" fill="#ef4444" />
          <rect x="43" y="57" width="5" height="4" rx="1" fill="#f59e0b" />
          <rect x="50" y="57" width="5" height="4" rx="1" fill="#10b981" />
          <rect x="57" y="57" width="5" height="4" rx="1" fill="#3b82f6" />

          {/* Cuello de resorte corrugado dorado */}
          <rect x="42" y="68" width="16" height="12" rx="3" fill="#eab308" stroke="#ca8a04" strokeWidth="2" />
          <line x1="42" y1="72" x2="58" y2="72" stroke="#fef08a" strokeWidth="1.5" />
          <line x1="42" y1="76" x2="58" y2="76" stroke="#fef08a" strokeWidth="1.5" />

          {/* Torso superior / Mochila azul visible */}
          <path d="M26 80 L74 80 L70 100 L30 100 Z" fill="#0891b2" />
          <circle cx="35" cy="88" r="3" fill="#ec4899" />
          <circle cx="50" cy="88" r="2.5" fill="#eab308" />
          <rect x="58" y="85" width="8" height="6" rx="1" fill="#ffffff" />
        </svg>
      )}
    </div>
  )
}
