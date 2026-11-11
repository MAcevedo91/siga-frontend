import { Bell } from 'lucide-react'

export default function NotificationBadge({ count, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      aria-label={`${count} notificaciones no leídas`}
      title="Notificaciones"
    >
      <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
      {count > 0 && (
        <span className="absolute top-1 right-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-xs font-bold text-white bg-red-600 rounded-full shadow-sm animate-pulse">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  )
}
