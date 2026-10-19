const ROL_COLORS = {
  Administrador: 'bg-purple-100 text-purple-800',
  'Equipo de Formación': 'bg-blue-100 text-blue-800',
  'Coordinador de Convivencia Escolar': 'bg-teal-100 text-teal-800',
  Orientador: 'bg-sky-100 text-sky-800',
  Psicólogo: 'bg-violet-100 text-violet-800',
  'Asistente Social': 'bg-emerald-100 text-emerald-800',
  Directiva: 'bg-indigo-100 text-indigo-800',
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
