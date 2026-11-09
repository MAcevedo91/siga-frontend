import { Link } from 'react-router-dom'

export default function AccionesPendientesWidget({ acciones = [], error = false }) {
  return (
    <section aria-labelledby="acciones-pendientes-title" className="rounded-2xl border border-slate-300/80 bg-gradient-to-br from-slate-100/90 via-blue-50/40 to-white p-3.5 shadow-2xs dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-gray-800 sm:p-4 flex flex-col justify-between flex-1">
      {/* Encabezado: Título y Badge Pizarra activa */}
      <div className="mb-2.5 flex items-center justify-between">
        <h2 id="acciones-pendientes-title" className="text-base font-extrabold tracking-tight text-gray-900 dark:text-white">
          Acciones Pendientes
        </h2>
        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
          Pizarra activa
        </span>
      </div>

      {/* Pizarra Blanca con Post-its */}
      <div className="cork-board-canvas">
        {error ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <p role="status" className="text-xs font-semibold text-slate-800 bg-slate-100 rounded-lg p-2.5 shadow-xs text-center dark:text-slate-200 dark:bg-slate-700">
              No se pudieron cargar las acciones pendientes. Vuelve a intentarlo al recargar el Dashboard.
            </p>
          </div>
        ) : acciones.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="rounded-lg border border-dashed border-slate-300 bg-white/90 p-4 text-center shadow-xs dark:bg-slate-800/80 dark:border-slate-600">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Sin acciones pendientes — todo al día ✓
              </p>
            </div>
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
      </div>

      {/* Leyenda Semafórica al pie del corcho */}
      <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[10px] font-medium text-gray-500 dark:text-gray-400">
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block h-2 w-2 rounded-xs" style={{ background: '#ff8a8a' }} />
          Vencido
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block h-2 w-2 rounded-xs" style={{ background: '#f5cf4a' }} />
          Por vencer
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block h-2 w-2 rounded-xs" style={{ background: '#7cd992' }} />
          Completado / En plazo
        </span>
      </div>

      {!error && acciones.length > 5 && (
        <div className="mt-2.5 border-t border-gray-100 pt-2 dark:border-gray-700">
          <Link
            to="/protocolos"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Ver todos los protocolos
          </Link>
        </div>
      )}
    </section>
  )
}
