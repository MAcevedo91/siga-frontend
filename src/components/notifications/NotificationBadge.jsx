import { Bell } from 'lucide-react'

export default function NotificationBadge({ count, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      aria-label={`${count} notificaciones no leídas`}
    >
      <Bell className="w-6 h-6" />
      {count > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  )
}
