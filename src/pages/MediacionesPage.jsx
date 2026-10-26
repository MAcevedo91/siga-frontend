import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
  listarMediaciones,
  obtenerMediacion,
} from '@/services/mediacionesService'
import { getSemaforo, mensajeError, mostrarFecha } from '@/utils/mediaciones'
import {
  PageTitle,
  ErrorBox,
  inputClass,
  buttonClass,
  secondaryClass,
} from '@/components/mediaciones/MediacionUI'
export function Semaforo({ mediacion }) {
  const s = getSemaforo(mediacion)
  const colors = {
    slate: 'bg-slate-100 text-slate-700',
    emerald: 'bg-emerald-100 text-emerald-800',
    amber: 'bg-amber-100 text-amber-900',
    rose: 'bg-rose-100 text-rose-800',
  }
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${colors[s.color]}`}
    >
      {s.label}
    </span>
  )
}
export default function MediacionesPage() {
  const [rows, setRows] = useState([]),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0),
    [pages, setPages] = useState(1),
    [estado, setEstado] = useState(''),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true),
    [reload, setReload] = useState(0)
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    listarMediaciones({ page, limit: 12, ...(estado ? { estado } : {}) })
      .then(async (result) => {
        const details = await Promise.allSettled(
          (result.data || []).map((m) => obtenerMediacion(m.id)),
        )
        if (!active) return
        setRows(
          details.map((r, i) =>
            r.status === 'fulfilled'
              ? r.value
              : { ...result.data[i], detalle_no_disponible: true },
          ),
        )
        setTotal(result.total || 0)
        setPages(result.totalPages || 1)
        if (details.some((r) => r.status === 'rejected'))
          setError(
            'Algunos plazos no pudieron consultarse. Actualiza para reintentar.',
          )
      })
      .catch((e) => active && setError(mensajeError(e)))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [page, estado, reload])
  const activeRows = rows.filter((m) => !m.cerrada_at),
    expired = activeRows.filter((m) => getSemaforo(m).key === 'vencido'),
    soon = activeRows.filter((m) => getSemaforo(m).key === 'proximo')
  return (
    <DashboardLayout>
      <div className="text-slate-900 mx-auto max-w-7xl p-4 sm:p-6">
        <PageTitle
          title="Mediaciones escolares"
          subtitle="Seguimiento de sesiones, acuerdos y resultados"
        >
          <Link to="/mediaciones/nueva" className={buttonClass}>
            Nueva mediación
          </Link>
        </PageTitle>
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            ['Abiertas en esta página', activeRows.length],
            ['Próximas a vencer', soon.length],
            ['Vencidas sin evaluar', expired.length],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border bg-white p-5">
              <p className="text-sm text-slate-500">{label}</p>
              <strong className="text-3xl text-indigo-700">
                {loading ? '—' : value}
              </strong>
            </div>
          ))}
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="text-sm">
            Estado
            <select
              className={inputClass}
              value={estado}
              onChange={(e) => {
                setEstado(e.target.value)
                setPage(1)
              }}
            >
              <option value="">Todos</option>
              {[
                'borrador',
                'programada',
                'en_sesion',
                'acordada',
                'sin_acuerdo',
                'derivada_inspectoria',
              ].map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </label>
          <button
            className={secondaryClass}
            onClick={() => setReload((x) => x + 1)}
          >
            Actualizar
          </button>
          <p className="text-sm text-slate-500">
            {total} expedientes encontrados
          </p>
        </div>
        <ErrorBox>{error}</ErrorBox>
        {loading ? (
          <p className="p-8" role="status">
            Cargando mediaciones…
          </p>
        ) : !rows.length ? (
          <div className="rounded-2xl border border-dashed p-12 text-center text-slate-500">
            No hay mediaciones para este filtro.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((m) => (
              <Link
                key={m.id}
                to={`/mediaciones/${m.id}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-400"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <strong className="text-indigo-700">
                    {m.folio || 'Mediación'}
                  </strong>
                  {m.detalle_no_disponible ? (
                    <span className="text-xs text-amber-800">
                      Plazo sin verificar
                    </span>
                  ) : (
                    <Semaforo mediacion={m} />
                  )}
                </div>
                <p className="line-clamp-3 text-sm text-slate-700">
                  {m.motivo}
                </p>
                <p className="mt-4 text-xs text-slate-500">
                  Sesión: {mostrarFecha(m.fecha_programada)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Estado: {m.estado?.replaceAll('_', ' ')}
                </p>
                <p className="mt-4 text-sm font-semibold text-indigo-600">
                  Abrir expediente →
                </p>
              </Link>
            ))}
          </div>
        )}
        <nav
          aria-label="Paginación de mediaciones"
          className="mt-6 flex items-center justify-between"
        >
          <button
            className={secondaryClass}
            disabled={page <= 1 || loading}
            onClick={() => setPage((x) => x - 1)}
          >
            Anterior
          </button>
          <span className="text-sm">
            Página {page} de {pages}
          </span>
          <button
            className={secondaryClass}
            disabled={page >= pages || loading}
            onClick={() => setPage((x) => x + 1)}
          >
            Siguiente
          </button>
        </nav>
      </div>
    </DashboardLayout>
  )
}
