import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/store/useAuthStore'
import {
  obtenerHistorialMediaciones,
  obtenerActaPDF,
} from '@/services/mediacionesService'
import {
  descargarBlob,
  mensajeError,
  mostrarFecha,
  ROLES_MEDIACION_LECTURA,
  ROLES_INFORMES_SALUD,
} from '@/utils/mediaciones'
import {
  ErrorBox,
  buttonClass,
  secondaryClass,
} from '@/components/mediaciones/MediacionUI'
import ModalInformeEspecialista from './ModalInformeEspecialista'
import HistorialInformesMedicosCard from './HistorialInformesMedicosCard'
function MediacionesHistorial({ estudianteId }) {
  const [data, setData] = useState(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState('')
  useEffect(() => {
    let active = true
    setData(null)
    setError('')
    setBusy('')
    obtenerHistorialMediaciones(estudianteId)
      .then((r) => active && setData(r))
      .catch((e) => active && setError(mensajeError(e)))
    return () => {
      active = false
    }
  }, [estudianteId])
  async function download(m) {
    setBusy(m.mediacion_id)
    try {
      await descargarBlob(
        await obtenerActaPDF(m.mediacion_id),
        `${m.folio || 'mediacion'}-acta.pdf`,
      )
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setBusy('')
    }
  }
  return (
    <div>
      <ErrorBox>{error}</ErrorBox>
      {!data && !error ? (
        <p role="status">Cargando historial de mediaciones…</p>
      ) : (
        data && (
          <>
            {!data.mediaciones?.length ? (
              <p className="text-sm text-slate-500">
                Sin mediaciones registradas.
              </p>
            ) : (
              <ul className="divide-y">
                {data.mediaciones.map((m) => (
                  <li
                    className="flex flex-wrap items-center justify-between gap-3 py-4"
                    key={m.mediacion_id}
                  >
                    <div>
                      <Link
                        className="font-semibold text-indigo-700"
                        to={`/mediaciones/${m.mediacion_id}`}
                      >
                        {m.folio}
                      </Link>
                      <p className="text-sm">{m.motivo}</p>
                      <p className="text-xs text-slate-500">
                        {mostrarFecha(m.fecha_programada)} ·{' '}
                        {m.cerrada_at ? 'Cerrada' : 'Abierta'}
                      </p>
                    </div>
                    <button
                      disabled={Boolean(busy)}
                      onClick={() => download(m)}
                      className={secondaryClass}
                    >
                      {busy === m.mediacion_id
                        ? 'Preparando…'
                        : 'Descargar acta'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )
      )}
    </div>
  )
}
export default function SeguimientoFormativo({ estudianteId }) {
  const { user } = useAuth()
  const [tab, setTab] = useState(''),
    [show, setShow] = useState(false),
    [version, setVersion] = useState(0)
  const canMed = ROLES_MEDIACION_LECTURA.includes(user?.rol),
    canHealth = ROLES_INFORMES_SALUD.includes(user?.rol)
  if (!canMed && !canHealth) return null
  return (
    <section className="text-slate-900 mt-6 rounded-2xl border bg-white p-5">
      <h2 className="mb-4 text-lg font-semibold">Seguimiento formativo</h2>
      <div className="mb-4 flex flex-wrap gap-3">
        {canMed && (
          <button
            aria-pressed={tab === 'mediaciones'}
            className={tab === 'mediaciones' ? buttonClass : secondaryClass}
            onClick={() => setTab('mediaciones')}
          >
            Mediaciones
          </button>
        )}
        {canHealth && (
          <>
            <button
              aria-pressed={tab === 'informes'}
              className={tab === 'informes' ? buttonClass : secondaryClass}
              onClick={() => setTab('informes')}
            >
              Informes para especialistas
            </button>
            <button className={secondaryClass} onClick={() => setShow(true)}>
              Generar informe para especialista
            </button>
          </>
        )}
      </div>
      {tab === 'mediaciones' && (
        <MediacionesHistorial key={estudianteId} estudianteId={estudianteId} />
      )}
      {tab === 'informes' && (
        <HistorialInformesMedicosCard
          estudianteId={estudianteId}
          version={version}
        />
      )}
      {show && (
        <ModalInformeEspecialista
          estudianteId={estudianteId}
          onClose={() => setShow(false)}
          onGenerated={() => {
            setTab('informes')
            setVersion((x) => x + 1)
          }}
        />
      )}
    </section>
  )
}
