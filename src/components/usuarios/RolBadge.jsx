const ROL_COLORS = {
  Administrador: 'bg-purple-100 text-purple-800',
  'Equipo de Formación': 'bg-blue-100 text-blue-800',
  Directivo: 'bg-indigo-100 text-indigo-800',
  Inspector: 'bg-green-100 text-green-800',
  Docente: 'bg-yellow-100 text-yellow-800',
}

export default function RolBadge({ rol }) {
  const colorClass = ROL_COLORS[rol] || 'bg-gray-100 text-gray-800'

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${colorClass}`}>
      {rol}
    </span>
  )
}
