import { useRef, useState } from 'react'
import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { fechaLocal, mensajeError, nombreEstudiante } from '@/utils/mediaciones'
import {
  Field,
  ErrorBox,
  inputClass,
  buttonClass,
  secondaryClass,
} from './MediacionUI'
const BANK = [
  {
    tipo_compromiso: 'reparacion_relacional',
    descripcion:
      'Realizar una acción de reparación acordada con la persona afectada.',
  },
  {
    tipo_compromiso: 'actitud_aula',
    descripcion: 'Practicar una estrategia de diálogo y respeto en el aula.',
  },
  {
    tipo_compromiso: 'cuidado_espacios',
    descripcion:
      'Participar en una actividad de cuidado de los espacios comunes.',
  },
]
export default function AsistenteAcuerdosFormativos({
  mediacion,
  onSave,
  readOnly = false,
}) {
  const storeRef = useRef(null)
  if (!storeRef.current)
    storeRef.current = createStore((set) => ({
      rows: (mediacion.mediacion_compromisos || []).map((c) => ({
        ...c,
        key: c.id,
      })),
      update: (fn) => set((s) => ({ rows: fn(s.rows) })),
    }))
  const { rows, update } = useStore(storeRef.current)
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [seguimiento, setSeguimiento] = useState(
      mediacion.fecha_seguimiento?.slice(0, 10) || '',
    )
  const students = (mediacion.mediacion_participantes || [])
    .map((p) => p.estudiantes)
    .filter(Boolean)
  const locked =
    readOnly ||
    [...rows, ...(mediacion.mediacion_compromisos || [])].some(
      (c) => c.cumplido || (c.estado && c.estado !== 'pendiente'),
    )
  const minDate = [fechaLocal(), mediacion.fecha_programada?.slice(0, 10) || '']
    .sort()
    .at(-1)
  function add(preset = {}) {
    update((old) => [
      ...old,
      {
        key: crypto.randomUUID(),
        estudiante_id: students[0]?.id || '',
        tipo_compromiso: 'otro',
        descripcion: '',
        fecha_limite: '',
        ...preset,
      },
    ])
  }
  function edit(key, field, value) {
    update((old) =>
      old.map((r) => (r.key === key ? { ...r, [field]: value } : r)),
    )
  }
  async function save(e) {
    e.preventDefault()
    if (locked) return
    if (
      rows.some(
        (r) =>
          r.descripcion.trim().length < 5 ||
          !r.fecha_limite ||
          r.fecha_limite < minDate,
      )
    ) {
      setError(
        'Completa cada acuerdo con una descripción de al menos 5 caracteres y una fecha vigente.',
      )
      return
    }
    setBusy(true)
    setError('')
    try {
      await onSave({
        compromisos: rows.map(({ key: _key, ...r }) => ({
          ...r,
          estudiante_id: r.estudiante_id || null,
        })),
        ...(seguimiento ? { fecha_seguimiento: seguimiento } : {}),
      })
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setBusy(false)
    }
  }
  return (
    <form onSubmit={save} className="space-y-5">
      <header className="rounded-xl bg-gradient-to-r from-indigo-700 to-violet-600 p-5 text-white">
        <h2 className="text-xl font-bold">Asistente de acuerdos formativos</h2>
        <p className="mt-1 text-sm">
          Definan acciones concretas, responsables y plazos verificables.
        </p>
      </header>
      <ErrorBox>{error}</ErrorBox>
      {locked && !readOnly && (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          Los acuerdos ya evaluados se conservan sin modificaciones. Puedes
          continuar con el cierre del expediente.
        </p>
      )}
      {!locked && (
        <aside className="rounded-xl border bg-slate-50 p-4">
          <h3 className="font-semibold">Banco de acciones sugeridas</h3>
          <p className="mb-3 text-sm text-slate-500">
            Adapta cada acción a lo acordado durante la sesión.
          </p>
          <div className="flex flex-wrap gap-2">
            {BANK.map((p) => (
              <button
                key={p.tipo_compromiso}
                type="button"
                className={secondaryClass}
                onClick={() => add(p)}
              >
                {p.tipo_compromiso === 'reparacion_relacional'
                  ? 'Reparación y diálogo'
                  : p.tipo_compromiso === 'actitud_aula'
                    ? 'Aprendizaje en el aula'
                    : 'Cuidado comunitario'}
              </button>
            ))}
            <button
              type="button"
              className={secondaryClass}
              onClick={() => add()}
            >
              Agregar acuerdo personalizado
            </button>
          </div>
        </aside>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map((r, i) => (
          <article
            key={r.key}
            className={`space-y-3 rounded-xl border p-4 ${i % 2 ? 'border-purple-200 bg-purple-50/40' : 'border-cyan-200 bg-cyan-50/40'}`}
          >
            <h3 className="font-semibold">Acuerdo {i + 1}</h3>
            <Field label={`Descripción del acuerdo ${i + 1}`}>
              <textarea
                disabled={locked}
                className={inputClass}
                required
                minLength={5}
                maxLength={1000}
                rows={3}
                value={r.descripcion}
                onChange={(e) => edit(r.key, 'descripcion', e.target.value)}
              />
            </Field>
            <Field label={`Responsable del acuerdo ${i + 1}`}>
              <select
                disabled={locked}
                className={inputClass}
                value={r.estudiante_id || ''}
                onChange={(e) => edit(r.key, 'estudiante_id', e.target.value)}
              >
                <option value="">Todos los participantes</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {nombreEstudiante(s)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={`Tipo del acuerdo ${i + 1}`}>
              <select
                disabled={locked}
                className={inputClass}
                value={r.tipo_compromiso}
                onChange={(e) => edit(r.key, 'tipo_compromiso', e.target.value)}
              >
                {[
                  'reparacion_relacional',
                  'disculpa_comunitaria',
                  'cuidado_espacios',
                  'actitud_aula',
                  'apoyo_academico',
                  'otro',
                ].map((t) => (
                  <option key={t} value={t}>
                    {t.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={`Fecha límite del acuerdo ${i + 1}`}>
              <input
                disabled={locked}
                className={inputClass}
                required
                type="date"
                min={minDate}
                value={r.fecha_limite?.slice(0, 10) || ''}
                onChange={(e) => edit(r.key, 'fecha_limite', e.target.value)}
              />
            </Field>
            {!locked && (
              <button
                className="text-sm font-medium text-rose-700"
                type="button"
                aria-label={`Eliminar acuerdo ${i + 1}`}
                onClick={() =>
                  update((old) => old.filter((x) => x.key !== r.key))
                }
              >
                Eliminar acuerdo
              </button>
            )}
          </article>
        ))}
      </div>
      {!rows.length && (
        <p className="rounded-xl border border-dashed p-8 text-center text-slate-500">
          Agrega el primer acuerdo de la sesión.
        </p>
      )}
      <Field label="Fecha de seguimiento">
        <input
          disabled={locked}
          className={inputClass}
          type="date"
          min={minDate}
          value={seguimiento}
          onChange={(e) => setSeguimiento(e.target.value)}
        />
      </Field>
      {!locked && (
        <button className={buttonClass} disabled={!rows.length || busy}>
          {busy ? 'Guardando…' : 'Guardar acuerdos'}
        </button>
      )}
    </form>
  )
}
