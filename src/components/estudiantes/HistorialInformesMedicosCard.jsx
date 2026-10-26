import { useEffect, useState } from 'react'
import {
  listarInformesEspecialista,
  obtenerInformeOriginal,
} from '@/services/sprint9Service'
import { descargarBlob, mostrarFecha, mensajeError } from '@/utils/mediaciones'
import { ErrorBox, secondaryClass } from '@/components/mediaciones/MediacionUI'
export default function HistorialInformesMedicosCard({
  estudianteId,
  version = 0,
}) {
  const [data, setData] = useState(null),
    [page, setPage] = useState(1),
    [error, setError] = useState(''),
    [reload, setReload] = useState(0),
    [busy, setBusy] = useState('')
  useEffect(() => {
    let active = true
    setData(null)
    setError('')
    listarInformesEspecialista(estudianteId, { page, limit: 10 })
      .then((r) => active && setData(r))
      .catch((e) => active && setError(mensajeError(e)))
    return () => {
      active = false
    }
  }, [estudianteId, page, version, reload])
  async function download(item) {
    setBusy(item.id)
    setError('')
    try {
      await descargarBlob(
        await obtenerInformeOriginal(estudianteId, item.id),
        'informe-original.pdf',
      )
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setBusy('')
    }
  }

  return (
    <section className="rounded-xl border bg-white p-5">
      <h2 className="mb-4 text-lg font-semibold">
        Historial de informes para especialistas
      </h2>
      <ErrorBox>{error}</ErrorBox>
      {error && (
        <button
          className={secondaryClass}
          onClick={() => setReload((x) => x + 1)}
        >
          Reintentar
        </button>
      )}
      {!data && !error ? (
        <p role="status">Consultando historial…</p>
      ) : (
        data && (
          <>
            {!data.items?.length ? (
              <p className="text-sm text-slate-500">
                No hay emisiones registradas.
              </p>
            ) : (
              <ul className="divide-y">
                {data.items.map((item) => (
                  <li key={item.id} className="space-y-1 py-4">
                    <div className="flex flex-wrap justify-between gap-2">
                      <h3 className="font-medium">
                        {item.especialista_destino}
                      </h3>
                      <time className="text-sm text-slate-500">
                        {mostrarFecha(item.fecha_emision)}
                      </time>
                    </div>
                    <p className="text-sm text-slate-700">{item.motivo}</p>
                    <p className="text-xs text-slate-500">
                      Emitido por:{' '}
                      {item.usuarios?.nombre || 'Profesional autorizado'}
                    </p>
                    {item.archivo_disponible ? (
                      <button
                        disabled={Boolean(busy)}
                        className={secondaryClass}
                        onClick={() => download(item)}
                      >
                        {busy === item.id
                          ? 'Recuperando…'
                          : 'Descargar original'}
                      </button>
                    ) : (
                      <p className="text-xs text-slate-500">
                        La descarga del original no está disponible para esta emisión.
                      </p>
                    )}
                    {item.hash_sha256 && (
                      <details className="text-xs text-slate-500">
                        <summary>Huella de autenticidad</summary>
                        <p className="break-all">{item.hash_sha256}</p>
                      </details>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <nav
              className="mt-4 flex items-center justify-between"
              aria-label="Paginación del historial"
            >
              <button
                className={secondaryClass}
                disabled={page <= 1}
                onClick={() => setPage((x) => x - 1)}
              >
                Anterior
              </button>
              <span className="text-sm">
                {page} / {data.pagination?.totalPages || 1}
              </span>
              <button
                className={secondaryClass}
                disabled={page >= (data.pagination?.totalPages || 1)}
                onClick={() => setPage((x) => x + 1)}
              >
                Siguiente
              </button>
            </nav>
          </>
        )
      )}
      <p className="mt-4 text-xs text-slate-500">
        Las descargas recuperan el archivo original conservado al emitir el
        informe. Las emisiones anteriores sin archivo se identifican
        expresamente.
      </p>
    </section>
  )
}
