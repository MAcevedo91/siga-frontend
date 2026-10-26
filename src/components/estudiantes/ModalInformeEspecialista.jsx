import { useState } from 'react'
import { generarInformeEspecialista } from '@/services/sprint9Service'
import { descargarBlob, mensajeError } from '@/utils/mediaciones'
import {
  Modal,
  Field,
  ErrorBox,
  inputClass,
  buttonClass,
} from '@/components/mediaciones/MediacionUI'
export default function ModalInformeEspecialista({
  estudianteId,
  onClose,
  onGenerated,
}) {
  const [especialista, setEspecialista] = useState(''),
    [motivo, setMotivo] = useState(''),
    [notas, setNotas] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('')
  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const blob = await generarInformeEspecialista(estudianteId, {
        especialista: especialista.trim(),
        motivo: motivo.trim(),
        ...(notas.trim() ? { notas: notas.trim() } : {}),
      })
      await descargarBlob(blob, 'informe-especialista.pdf')
      onGenerated()
      onClose()
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal
      title="Informe para especialista"
      onClose={busy ? () => {} : onClose}
    >
      <form className="space-y-4" onSubmit={submit}>
        <p className="rounded-xl bg-indigo-50 p-4 text-sm text-indigo-900">
          Genera un documento confidencial para la atención del estudiante.
          Comparte el archivo únicamente con el profesional autorizado.
        </p>
        <ErrorBox>{error}</ErrorBox>
        <Field label="Especialista destinatario">
          <input
            required
            minLength={3}
            maxLength={200}
            className={inputClass}
            value={especialista}
            onChange={(e) => setEspecialista(e.target.value)}
          />
        </Field>
        <Field label="Motivo de derivación">
          <textarea
            required
            minLength={5}
            maxLength={500}
            rows={3}
            className={inputClass}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </Field>
        <Field label="Observaciones adicionales">
          <textarea
            maxLength={2000}
            rows={3}
            className={inputClass}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
        </Field>
        <button className={buttonClass} disabled={busy}>
          {busy ? 'Generando…' : 'Generar y descargar PDF'}
        </button>
      </form>
    </Modal>
  )
}
