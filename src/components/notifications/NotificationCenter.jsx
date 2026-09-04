import { X, CheckCheck, Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function NotificationCenter({ isOpen, onClose, notificaciones, onMarcarLeida, onMarcarTodasLeidas }) {
  const navigate = useNavigate()

  const handleNotificationClick = (notificacion) => {
    // Optimistic update handled by useNotifications hook
    if (!notificacion.leida) {
      onMarcarLeida(notificacion.id)
    }

    if (notificacion.url) {
      navigate(notificacion.url)
      onClose()
    }
  }

  const handleMarcarTodasLeidas = async () => {
    // Optimistic update handled by useNotifications hook
    await onMarcarTodasLeidas()
  }

  if (!isOpen) return null

  const noLeidas = notificaciones.filter(n => !n.leida)

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 dark:bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-96 bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notificaciones</h2>
            {noLeidas.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{noLeidas.length} sin leer</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        {noLeidas.length > 0 && (
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <button
              onClick={handleMarcarTodasLeidas}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1"
            >
              <CheckCheck className="w-4 h-4" />
              Marcar todas como leídas
            </button>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {notificaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
              <Bell className="w-16 h-16 mb-3" />
              <p>No hay notificaciones</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notificaciones.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                    !notif.leida ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium ${!notif.leida ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                          {notif.titulo}
                        </p>
                        {!notif.leida && (
                          <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-1" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{notif.mensaje}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        {new Date(notif.created_at).toLocaleString('es-CL')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
