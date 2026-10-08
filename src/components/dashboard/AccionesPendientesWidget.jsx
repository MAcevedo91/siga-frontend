import { Link } from 'react-router-dom'

export default function AccionesPendientesWidget({ acciones = [], error = false }) {
  return (
    <section aria-labelledby="acciones-pendientes-title" className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <h2 id="acciones-pendientes-title" className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-white">
            Acciones Pendientes
          </h2>
          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
            Pizarra activa
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500 dark:text-gray-400">
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block h-2.5 w-2.5 rounded-sm shadow-sm" style={{ background: '#ffb3b3' }} />
            Vencido
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block h-2.5 w-2.5 rounded-sm shadow-sm" style={{ background: '#ffe27a' }} />
            Por vencer
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block h-2.5 w-2.5 rounded-sm shadow-sm" style={{ background: '#b9eac3' }} />
            Completado / En plazo
          </span>
        </div>
      </div>

      {error ? (
        <p role="status" className="py-4 text-sm text-gray-600 dark:text-gray-300">
          No se pudieron cargar las acciones pendientes. Vuelve a intentarlo al recargar el Dashboard.
        </p>
      ) : acciones.length === 0 ? (
        <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 p-6 text-center dark:border-emerald-800/40 dark:bg-emerald-950/20">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            Sin acciones pendientes — todo al día ✓
          </p>
        </div>
      ) : (
        <ul className="postit-board">
          {acciones.slice(0, 5).map((accion, index) => {
            let variantClass = ''
            let tagClasses = ''
            let statusText = ''

            if (accion.estado_semaforo === 'vencido') {
              variantClass = ''
              tagClasses = 'bg-red-50 text-red-800'
              statusText = 'VENCIDO'
            } else if (accion.estado_semaforo === 'urgente') {
              variantClass = 'warn'
              tagClasses = 'bg-amber-50 text-amber-800'
              statusText = 'POR VENCER'
            } else {
              variantClass = 'ok'
              tagClasses = 'bg-green-50 text-green-800'
              statusText = 'EN PLAZO'
            }

            const diasTexto = `${accion.dias_restantes} ${Number(accion.dias_restantes) === 1 ? 'día restante' : 'días restantes'}`

            return (
              <li key={`${accion.protocolo_id}-${index}`} className="postit-item">
                <Link
                  to={`/protocolos/${accion.protocolo_id}`}
                  className={`postit-note ${variantClass} ${tagClasses}`}
                  title={`Ver protocolo de ${accion.estudiante_nombre}`}
                >
                  <h3 className="postit-name">{accion.estudiante_nombre}</h3>
                  <p className="postit-case">{accion.tipo_protocolo}</p>
                  <p className="postit-todo">{accion.accion_pendiente}</p>
                  <div className="postit-status">
                    {accion.estado_semaforo === 'vencido' ? (
                      <span>VENCIDO</span>
                    ) : (
                      <span>
                        {statusText} <small>· {diasTexto}</small>
                      </span>
                    )}
                  </div>
                  <span className="sr-only">
                    {accion.estado_semaforo === 'vencido' ? 'Vencido' : accion.estado_semaforo === 'urgente' ? 'Urgente' : 'En plazo'}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      {!error && acciones.length > 5 && (
        <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-700">
          <Link
            to="/protocolos"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Ver todos los protocolos
          </Link>
        </div>
      )}
    </section>
  )
}
