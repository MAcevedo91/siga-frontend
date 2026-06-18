export default function EstadoBadge({ activo }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
        activo
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
      }`}
    >
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  )
}
