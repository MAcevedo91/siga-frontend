import { useEffect, useState } from 'react'

export default function AlertaGrave({ show, gravedad, onClose }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        onClose()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  if (!visible) return null

  const isGravísima = gravedad === 'Gravísima'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4">
      <div
        className={`mt-20 w-full max-w-md animate-bounce rounded-lg p-6 shadow-2xl ${
          isGravísima ? 'bg-red-600' : 'bg-orange-500'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">
              {isGravísima ? '¡ALERTA: Incidente Gravísimo!' : 'Alerta: Incidente Grave'}
            </h3>
            <p className="mt-2 text-sm text-white">
              Se ha registrado un incidente de gravedad <span className="font-bold">{gravedad}</span>.
              {isGravísima && ' Se requiere acción inmediata.'}
            </p>
          </div>
          <button onClick={() => setVisible(false)} className="flex-shrink-0 text-white hover:text-gray-200">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
