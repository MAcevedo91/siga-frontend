import { useState } from 'react'
import {
  evaluarCompromisos,
  cerrarMediacion,
} from '@/services/mediacionesService'
import { mensajeError } from '@/utils/mediaciones'
import { Modal, Field, ErrorBox, inputClass, buttonClass } from './MediacionUI'
export default function ModalEvaluarCierre({
  mediacion,
  onClose,
  onSaved,
  onEvaluated,
}) {
  const rows = mediacion.mediacion_compromisos || []
  const [values, setValues] = useState(
      Object.fromEntries(
        rows.map((c) => [
          c.id,
          c.estado === 'pendiente'
            ? ''
            : c.estado || (c.cumplido ? 'cumplido' : ''),
        ]),
      ),
    ),
    [conclusion, setConclusion] = useState(''),
    [estado, setEstado] = useState('acordada'),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('')
  async function submit(e) {
    e.preventDefault()
    if (rows.some((c) => !values[c.id]) || conclusion.trim().length < 10) {
      setError(
        'Evalúa todos los acuerdos e ingresa conclusiones de al menos 10 caracteres.',
      )
      return
    }
    setBusy(true)
    setError('')
    try {
      if (rows.length) {
        await evaluarCompromisos(mediacion.id, {
          evaluaciones: rows.map((c) => ({
            compromiso_id: c.id,
            estado: values[c.id],
          })),
        })
        onEvaluated?.(
          rows.map((c) => ({ compromiso_id: c.id, estado: values[c.id] })),
        )
      }
      await cerrarMediacion(mediacion.id, {
        estado,
        conclusiones_cierre: conclusion.trim(),
      })
      onSaved()
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal
      title="Evaluar y cerrar mediación"
      onClose={busy ? () => {} : onClose}
    >
      <form className="space-y-4" onSubmit={submit}>
        <ErrorBox>{error}</ErrorBox>
        {rows.map((c, i) => (
          <div className="rounded-xl border p-4" key={c.id}>
            <p className="mb-2 text-sm">{c.descripcion}</p>
            <Field label={`Evaluación del compromiso ${i + 1}`}>
              <select
                required
                className={inputClass}
                value={values[c.id]}
                onChange={(e) =>
                  setValues((old) => ({ ...old, [c.id]: e.target.value }))
                }
              >
                <option value="">Selecciona un resultado</option>
                <option value="cumplido">Cumplido</option>
                <option value="parcial">Cumplimiento parcial</option>
                <option value="incumplido">Incumplido</option>
              </select>
            </Field>
          </div>
        ))}
        <Field label="Resultado de la mediación">
          <select
            className={inputClass}
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            <option value="acordada">Con acuerdo</option>
            <option value="sin_acuerdo">Sin acuerdo</option>
            <option value="derivada_inspectoria">Derivada a inspectoría</option>
          </select>
        </Field>
        <Field label="Reflexión y conclusiones de cierre">
          <textarea
            required
            minLength={10}
            maxLength={3000}
            rows={4}
            className={inputClass}
            value={conclusion}
            onChange={(e) => setConclusion(e.target.value)}
          />
        </Field>
        <p className="text-sm text-slate-500">
          El cierre registra el resultado definitivo del expediente.
        </p>
        <button className={buttonClass} disabled={busy}>
          {busy ? 'Guardando…' : 'Evaluar y cerrar expediente'}
        </button>
      </form>
    </Modal>
  )
}
