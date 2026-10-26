import { useRef, useState } from "react";
import {
  Modal,
  Field,
  ErrorBox,
  inputClass,
  buttonClass,
  secondaryClass,
} from "./MediacionUI";
import { subirDocumentoMediacion } from "@/services/mediacionesService";
import { mensajeError, nombreEstudiante } from "@/utils/mediaciones";
export default function LienzoFirmaModal({ mediacion, onClose, onSaved }) {
  const available = Boolean(mediacion?.version_documental);
  const canvas = useRef(null),
    drawing = useRef(false),
    [hasInk, setHasInk] = useState(false),
    [firmante, setFirmante] = useState("mediador"),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  function point(e) {
    const r = canvas.current.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) * canvas.current.width) / r.width,
      y: ((e.clientY - r.top) * canvas.current.height) / r.height,
    };
  }
  function start(e) {
    e.preventDefault();
    canvas.current.setPointerCapture(e.pointerId);
    drawing.current = true;
    const p = point(e),
      ctx = canvas.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a";
  }
  function move(e) {
    if (!drawing.current) return;
    const p = point(e),
      ctx = canvas.current.getContext("2d");
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setHasInk(true);
  }
  function clear() {
    canvas.current.getContext("2d").clearRect(0, 0, 800, 300);
    setHasInk(false);
  }
  async function save() {
    if (!available || !hasInk || !consent) return;
    setBusy(true);
    setError("");
    try {
      const blob = await new Promise((resolve) =>
        canvas.current.toBlob(resolve, "image/png"),
      );
      if (!blob)
        throw new Error("No se pudo capturar la firma. Intenta nuevamente.");
      await subirDocumentoMediacion(mediacion.id, {
        archivo: new File([blob], "firma.png", { type: "image/png" }),
        tipo: "firma",
        firmante,
        conformidad: true,
        version: mediacion.version_documental,
      });
      onSaved?.();
      onClose();
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setBusy(false);
    }
  }
  function download() {
    const a = document.createElement("a");
    a.href = canvas.current.toDataURL("image/png");
    a.download = "firma-mediacion.png";
    a.click();
  }
  return (
    <Modal title="Firma de conformidad" onClose={busy ? () => {} : onClose}>
      <p className="mb-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
        La firma corresponde a los acuerdos guardados en el expediente. Verifica
        su contenido antes de firmar.
      </p>
      <ErrorBox>{error}</ErrorBox>
      {!available && (
        <p className="mb-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          El guardado de firmas todavía no está habilitado. Puedes capturarla y
          descargar el PNG para conservarlo con el acta.
        </p>
      )}
      <div className="mb-4">
        <Field label="Persona que firma">
          <select
            disabled={busy}
            className={inputClass}
            value={firmante}
            onChange={(e) => {
              setFirmante(e.target.value);
              clear();
              setConsent(false);
            }}
          >
            <option value="mediador">Mediador responsable</option>
            {mediacion?.mediacion_participantes?.map((p) => (
              <option key={p.estudiante_id} value={p.estudiante_id}>
                {nombreEstudiante(p.estudiantes)}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <canvas
        ref={canvas}
        width={800}
        height={300}
        aria-label="Lienzo para firma manuscrita"
        className="w-full touch-none rounded-xl border border-slate-300 bg-slate-50"
        onPointerDown={busy ? undefined : start}
        onPointerMove={move}
        onPointerUp={() => {
          drawing.current = false;
        }}
        onPointerCancel={() => {
          drawing.current = false;
        }}
      />
      <label className="mt-4 flex gap-3 text-sm">
        <input
          type="checkbox"
          disabled={busy}
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        El firmante confirma su conformidad con los acuerdos y autoriza
        registrar esta firma en el expediente.
      </label>
      <div className="mt-4 flex flex-wrap gap-3">
        <button className={secondaryClass} disabled={busy} onClick={clear}>
          Limpiar firma
        </button>
        <button
          disabled={!hasInk || busy}
          className={secondaryClass}
          onClick={download}
        >
          Descargar firma PNG
        </button>
        <button
          disabled={!available || !hasInk || !consent || busy}
          className={buttonClass}
          onClick={save}
        >
          {busy ? "Guardando…" : "Guardar firma en expediente"}
        </button>
      </div>
    </Modal>
  );
}
