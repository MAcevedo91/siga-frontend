import { Link } from 'react-router-dom'

const SEMAFORO = {
  vencido: { clases: 'bg-red-50 text-red-800', punto: 'bg-red-500', etiqueta: 'Vencido' },
  urgente: { clases: 'bg-amber-50 text-amber-800', punto: 'bg-amber-500', etiqueta: 'Urgente' },
  ok: { clases: 'bg-green-50 text-green-800', punto: 'bg-green-500', etiqueta: 'En plazo' },
}

export default function AccionesPendientesWidget({ acciones = [], error = false }) {
  return (
    <section aria-labelledby="acciones-pendientes-title" className="mb-8 rounded-xl border border-gray-200 bg-white p-4 shadow-md dark:border-gray-700 dark:bg-gray-800 sm:p-6">
      <h2 id="acciones-pendientes-title" className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Acciones Pendientes</h2>
      {error ? (
        <p role="status" className="text-sm text-gray-600 dark:text-gray-300">No se pudieron cargar las acciones pendientes. Vuelve a intentarlo al recargar el Dashboard.</p>
      ) : acciones.length === 0 ? (
        <p className="text-sm text-green-800 dark:text-green-300">Sin acciones pendientes — todo al día ✓</p>
      ) : (
        <ul className="space-y-3">
          {acciones.slice(0, 5).map((accion, index) => {
            const estado = SEMAFORO[accion.estado_semaforo] || { clases: 'bg-gray-50 text-gray-800', punto: 'bg-gray-400', etiqueta: 'Estado no disponible' }
            return (
              <li key={`${accion.protocolo_id}-${index}`}>
                <Link to={`/protocolos/${accion.protocolo_id}`} className={`flex items-start gap-3 rounded-lg p-4 transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 ${estado.clases}`}>
                  <span aria-hidden="true" className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${estado.punto}`} />
                  <div className="min-w-0 flex-1 break-words">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <p className="font-semibold">{accion.estudiante_nombre}</p>
                      <span className="shrink-0 text-sm font-bold">
                        {accion.estado_semaforo === 'vencido' ? 'VENCIDO' : `${accion.dias_restantes} ${Number(accion.dias_restantes) === 1 ? 'día restante' : 'días restantes'}`}
                      </span>
                    </div>
                    <p className="mt-1 text-sm">{accion.tipo_protocolo}</p>
                    <p className="mt-1 text-sm">{accion.accion_pendiente}</p>
                    <span className="sr-only">{estado.etiqueta}</span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
      {!error && acciones.length > 5 && (
        <Link to="/protocolos" className="mt-4 inline-block text-sm font-semibold text-blue-700 underline dark:text-blue-300">Ver todos los protocolos</Link>
      )}
    </section>
  )
}
