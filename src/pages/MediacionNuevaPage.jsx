import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/store/useAuthStore'
import { getEstudiantes } from '@/services/estudiantesService'
import { getIncidenteById } from '@/services/incidentesService'
import {
  crearMediacion,
  notificarApoderados,
} from '@/services/mediacionesService'
import {
  mensajeError,
  nombreEstudiante,
  validarNuevaMediacion,
  ROLES_MEDIACION_GESTION,
} from '@/utils/mediaciones'
import {
  Field,
  ErrorBox,
  PageTitle,
  inputClass,
  buttonClass,
  secondaryClass,
} from '@/components/mediaciones/MediacionUI'
export default function MediacionNuevaPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const incidenteId = params.get('incidenteId')
  const [query, setQuery] = useState(''),
    [results, setResults] = useState([]),
    [people, setPeople] = useState([]),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [searching, setSearching] = useState(false),
    [created, setCreated] = useState(null)
  const [motivo, setMotivo] = useState(''),
    [fecha, setFecha] = useState(''),
    [lugar, setLugar] = useState('Oficina de convivencia'),
    [origen, setOrigen] = useState(
      incidenteId ? 'derivada_incidente' : 'preventiva_convivencia',
    ),
    [aviso, setAviso] = useState(ROLES_MEDIACION_GESTION.includes(user?.rol))
  useEffect(() => {
    let active = true
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const data = await getEstudiantes({
          search: query.trim(),
          activo: true,
        })
        if (active) setResults(Array.isArray(data) ? data : data?.items || [])
      } catch (e) {
        if (active) setError(mensajeError(e))
      } finally {
        if (active) setSearching(false)
      }
    }, 300)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [query])
  useEffect(() => {
    if (!incidenteId) return
    let active = true
    getIncidenteById(incidenteId)
      .then((data) => {
        if (!active) return
        const rows = data.incidente_estudiantes || data.estudiantes || []
        setPeople(
          rows
            .map((p) => ({
              ...(p.estudiantes || p),
              rol_participante: 'afectado',
            }))
            .filter((p) => p.id),
        )
        if (data.relato) setMotivo(data.relato)
      })
      .catch((e) => active && setError(mensajeError(e)))
    return () => {
      active = false
    }
  }, [incidenteId])
  async function sendNotice(id) {
    setBusy(true)
    try {
      await notificarApoderados(id, { medio_aviso: 'correo' })
      navigate(`/mediaciones/${id}`)
    } catch (e) {
      setError(
        `La mediación fue creada. El aviso no pudo enviarse: ${mensajeError(e)}`,
      )
    } finally {
      setBusy(false)
    }
  }
  async function submit(e) {
    e.preventDefault()
    setError('')
    const payload = {
      tipo_origen: origen,
      ...(incidenteId ? { incidente_id: incidenteId } : {}),
      motivo: motivo.trim(),
      fecha_programada: fecha ? new Date(fecha).toISOString() : '',
      lugar_sesion: lugar,
      participantes: people.map((p) => ({
        estudiante_id: p.id,
        rol_participante: p.rol_participante || 'afectado',
      })),
    }
    const invalid = validarNuevaMediacion(payload)
    if (invalid) {
      setError(invalid)
      return
    }
    setBusy(true)
    try {
      const med = await crearMediacion(payload)
      setCreated(med)
      if (aviso) await sendNotice(med.id)
      else navigate(`/mediaciones/${med.id}`)
    } catch (e2) {
      setError(mensajeError(e2))
    } finally {
      setBusy(false)
    }
  }
  return (
    <DashboardLayout>
      <div className="text-slate-900 mx-auto max-w-4xl p-4 sm:p-6">
        <PageTitle
          title="Nueva mediación escolar"
          subtitle="Un espacio de diálogo y acuerdos formativos"
        >
          <Link className={secondaryClass} to="/mediaciones">
            Volver
          </Link>
        </PageTitle>
        <ErrorBox>{error}</ErrorBox>
        {created ? (
          <div className="mt-5 space-y-4 rounded-2xl border bg-white p-6">
            <p>La mediación ya está registrada.</p>
            <button
              disabled={busy}
              onClick={() => sendNotice(created.id)}
              className={buttonClass}
            >
              Reintentar aviso
            </button>
            <Link
              className="ml-4 text-indigo-700"
              to={`/mediaciones/${created.id}`}
            >
              Abrir expediente
            </Link>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="mt-5 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <section>
              <h2 className="mb-3 font-semibold">Participantes</h2>
              <Field label="Buscar estudiantes">
                <input
                  className={inputClass}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nombre o RUT (mínimo 2 caracteres)"
                  autoComplete="off"
                />
              </Field>
              {searching && <p role="status">Buscando…</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                {results
                  .filter((p) => !people.some((x) => x.id === p.id))
                  .map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={secondaryClass}
                      onClick={() =>
                        setPeople((old) => [
                          ...old,
                          {
                            ...p,
                            rol_participante: old.length
                              ? 'parte_2'
                              : 'parte_1',
                          },
                        ])
                      }
                    >
                      Agregar {nombreEstudiante(p)} · {p.rut}
                    </button>
                  ))}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {people.map((p, i) => (
                  <article
                    key={p.id}
                    className={`rounded-xl border p-4 ${i % 2 ? 'border-purple-200 bg-purple-50' : 'border-cyan-200 bg-cyan-50'}`}
                  >
                    <p className="font-semibold">{nombreEstudiante(p)}</p>
                    <p className="text-sm">{p.rut}</p>
                    <Field label={`Participación de ${nombreEstudiante(p)}`}>
                      <select
                        className={inputClass}
                        value={p.rol_participante}
                        onChange={(e) =>
                          setPeople((old) =>
                            old.map((x) =>
                              x.id === p.id
                                ? { ...x, rol_participante: e.target.value }
                                : x,
                            ),
                          )
                        }
                      >
                        <option value="parte_1">Parte solicitante</option>
                        <option value="parte_2">Parte involucrada</option>
                        <option value="afectado">Persona afectada</option>
                        <option value="observador">Observador / testigo</option>
                        <option value="mediador_par">Mediador par</option>
                      </select>
                    </Field>
                    <button
                      className="mt-2 text-sm text-rose-700"
                      type="button"
                      onClick={() =>
                        setPeople((old) => old.filter((x) => x.id !== p.id))
                      }
                    >
                      Quitar participante
                    </button>
                  </article>
                ))}
              </div>
            </section>
            <Field label="Motivo de la mediación">
              <textarea
                required
                minLength={10}
                className={inputClass}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Fecha y hora de la sesión">
                <input
                  type="datetime-local"
                  required
                  className={inputClass}
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </Field>
              <Field label="Lugar de la sesión">
                <input
                  required
                  maxLength={100}
                  className={inputClass}
                  value={lugar}
                  onChange={(e) => setLugar(e.target.value)}
                />
              </Field>
              <Field label="Origen">
                <select
                  className={inputClass}
                  value={origen}
                  disabled={Boolean(incidenteId)}
                  onChange={(e) => setOrigen(e.target.value)}
                >
                  {[
                    ['preventiva_convivencia', 'Prevención de convivencia'],
                    ['derivada_incidente', 'Derivada de incidente'],
                    ['solicitud_estudiante', 'Solicitud de estudiante'],
                    ['solicitud_apoderado', 'Solicitud de apoderado'],
                  ].map(([v, t]) => (
                    <option key={v} value={v}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Mediador responsable">
                <input
                  className={inputClass}
                  readOnly
                  value={user?.nombre || 'Usuario actual'}
                />
              </Field>
            </div>
            {ROLES_MEDIACION_GESTION.includes(user?.rol) && (
              <label className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm">
                <input
                  type="checkbox"
                  checked={aviso}
                  onChange={(e) => setAviso(e.target.checked)}
                />
                <span>
                  Notificar por correo a los apoderados después de registrar la
                  mediación. El aviso comunica la convocatoria a la sesión.
                </span>
              </label>
            )}
            <button
              disabled={busy || people.length < 2}
              className={buttonClass}
            >
              {busy ? 'Registrando…' : 'Crear mediación'}
            </button>
          </form>
        )}
      </div>
    </DashboardLayout>
  )
}
