import { useEffect, useState } from "react";
import { obtenerActaPDF, despacharActa } from "@/services/mediacionesService";
import { descargarBlob, mensajeError } from "@/utils/mediaciones";
import { Modal, ErrorBox, buttonClass, secondaryClass } from "./MediacionUI";
export default function VisorActaModal({ mediacion, canSend, onClose }) {
  const [blob, setBlob] = useState(null),
    [url, setUrl] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [result, setResult] = useState(null);
  useEffect(() => {
    let active = true,
      objectUrl;
    obtenerActaPDF(mediacion.id)
      .then((b) => {
        if (!active) return;
        if (
          !(b instanceof Blob) ||
          !b.size ||
          (b.type && !b.type.includes("pdf"))
        )
          throw new Error("No se recibió un PDF válido.");
        objectUrl = URL.createObjectURL(b);
        setBlob(b);
        setUrl(objectUrl);
      })
      .catch((e) => active && setError(mensajeError(e)));
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [mediacion.id]);
  async function send() {
    setBusy(true);
    setError("");
    try {
      const r = await despacharActa(mediacion.id);
      setResult(r);
      if (r.destinatarios?.some((d) => d.estado === "fallido"))
        setError(
          "El envío tuvo destinatarios fallidos. Revisa el resultado antes de reintentar.",
        );
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Acta de mediación" onClose={busy ? () => {} : onClose}>
      <ErrorBox>{error}</ErrorBox>
      {url ? (
        <iframe
          title="Vista previa del acta PDF"
          src={url}
          className="mt-4 h-[55vh] w-full rounded-xl border"
        />
      ) : (
        !error && <p role="status">Preparando acta…</p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          disabled={!blob}
          className={secondaryClass}
          onClick={() =>
            descargarBlob(
              blob,
              `${mediacion.folio || "mediacion"}-acta.pdf`,
            ).catch((e) => setError(mensajeError(e)))
          }
        >
          Descargar acta PDF
        </button>
        {canSend && (
          <button
            className={buttonClass}
            disabled={!blob || busy || Boolean(result)}
            onClick={send}
          >
            {busy ? "Enviando…" : "Enviar acta por correo"}
          </button>
        )}
      </div>
      {result && (
        <div className="mt-4 rounded-xl bg-slate-50 p-4" role="status">
          <p>
            Resultado del despacho: {result.total_destinatarios ?? 0}{" "}
            destinatarios.
          </p>
          {result.destinatarios?.map((d, i) => (
            <p key={i} className="text-sm">
              {d.email || d.nombre || `Destinatario ${i + 1}`}:{" "}
              {d.estado === "enviado" ? "Enviado" : "No enviado"}
            </p>
          ))}
        </div>
      )}
      <p className="mt-4 text-xs text-slate-500">
        {mediacion.version_documental
          ? "Se enviará el acta física vigente si está adjunta; de lo contrario, el acta generada con las firmas guardadas."
          : "Puedes descargar e imprimir el acta para su firma. El despacho utiliza el PDF generado por el sistema."}
      </p>
    </Modal>
  );
}
