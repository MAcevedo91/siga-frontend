import ActaLectura from "./ActaLectura";
import LienzoFirmaModal from "./LienzoFirmaModal";
import { useEffect, useState } from "react";
import {
  obtenerActaPDF,
  despacharActa,
  listarDocumentosMediacion,
} from "@/services/mediacionesService";
import { descargarBlob, mensajeError } from "@/utils/mediaciones";
import { Modal, ErrorBox, secondaryClass } from "./MediacionUI";
export default function VisorActaModal({ mediacion, canSend, onClose }) {
  const [blob, setBlob] = useState(null),
    [url, setUrl] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [result, setResult] = useState(null),
    [pdfRevision, setPdfRevision] = useState(0),
    [documents, setDocuments] = useState([]),
    [documentError, setDocumentError] = useState(""),
    [expandedPdf, setExpandedPdf] = useState(false);
  useEffect(() => {
    let active = true,
      objectUrl;
    setBlob(null);
    setUrl("");
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
  }, [mediacion.id, pdfRevision]);
  useEffect(() => {
    let active = true;
    if (!mediacion.version_documental) return;
    setDocumentError("");
    listarDocumentosMediacion(mediacion.id)
      .then((data) => {
        if (active) setDocuments(data || []);
      })
      .catch(() => {
        if (active) {
          setDocuments([]);
          setDocumentError("No se pudo verificar el estado de las firmas.");
        }
      });
    return () => {
      active = false;
    };
  }, [mediacion.id, mediacion.version_documental, pdfRevision]);
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
    <Modal
      title="Firma Digital Manuscrita, Visor de Acta y Envío Oficial"
      className="med-sign-modal"
      onClose={busy ? () => {} : onClose}
    >
      <p className="mb-4 text-xs text-slate-500">
        Paso 4 · Cierre y acta · {mediacion.folio}
      </p>
      <div className="med-sign-grid">
        <section className="med-sign-panel">
          <div className="med-pdf-toolbar">
            <span>{mediacion.folio || "Mediación"} · Acta PDF</span>
            <button
              type="button"
              onClick={() => setExpandedPdf((value) => !value)}
            >
              {expandedPdf ? "Vista de lectura" : "Expandir PDF"}
            </button>
          </div>
          <ErrorBox>{error}</ErrorBox>
          {!expandedPdf && (
            <ActaLectura mediacion={mediacion} documents={documents} />
          )}
          {url ? (
            <iframe
              title="Vista previa del acta PDF"
              src={url}
              className={
                expandedPdf
                  ? "mt-4 h-[65vh] w-full rounded-xl border"
                  : "sr-only"
              }
            />
          ) : (
            !error && <p role="status">Preparando acta…</p>
          )}
        </section>
        <section className="space-y-4">
          <div className="med-sign-panel">
            <h3 className="mb-3">1. Captura de firma digital manuscrita</h3>
            {!mediacion.cerrada_at ? (
              <LienzoFirmaModal
                embedded
                documents={documents}
                mediacion={mediacion}
                onClose={() => {}}
                onSaved={() => {
                  setResult(null);
                  setPdfRevision((v) => v + 1);
                }}
              />
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                El expediente está cerrado. Se conserva el acta registrada.
              </p>
            )}
          </div>
          <div className="med-sign-panel">
            <h3>2. Confirmación de Envío: Apoderados y Profesor Jefe</h3>
            <p className="mt-2 text-xs text-slate-500">
              El resultado del despacho se mostrará cuando responda el servicio.
              Verifica los destinatarios antes de enviar.
            </p>
            <ErrorBox>{documentError}</ErrorBox>
            <div className="med-recipient-list">
              {result?.destinatarios?.length ? (
                result.destinatarios.map((d, i) => (
                  <div
                    key={i}
                    className={`med-recipient ${d.estado === "fallido" ? "failed" : ""}`}
                  >
                    <span className="med-avatar">
                      {(d.nombre || d.email || "D").slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <b>{d.nombre || "Destinatario"}</b>
                      <p>{d.email || "Sin correo informado"}</p>
                    </div>
                    <small>
                      {d.estado === "enviado"
                        ? "En cola de envío"
                        : "No enviado"}
                    </small>
                  </div>
                ))
              ) : (
                <div className="med-recipient pending">
                  <span className="med-avatar">—</span>
                  <div>
                    <b>Destinatarios pendientes de confirmación</b>
                    <p>
                      El backend informará el resultado de cada destinatario al
                      despachar.
                    </p>
                  </div>
                </div>
              )}
            </div>
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
          </div>
          <div className="med-sign-panel">
            <h3>3. Estado del despacho</h3>
            <div className="med-dispatch-status">
              <div className={result && !error ? "success" : "pending"}>
                <b>
                  {result && !error
                    ? "✓ Solicitud procesada"
                    : "○ Pendiente de despacho"}
                </b>
                <p>
                  {result && !error
                    ? "Consulta el resultado individual de los destinatarios."
                    : "No se ha confirmado un envío desde esta vista."}
                </p>
              </div>
              <div className={error ? "failed" : "pending"}>
                <b>{error ? "! Revisar despacho" : "Canal de entrega"}</b>
                <p>
                  {error ||
                    "Los errores de destinatarios se mostrarán cuando los confirme el servicio."}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
      <footer className="med-sign-footer">
        <button type="button" className={secondaryClass} onClick={onClose}>
          ← Volver al Paso 3
        </button>
        <p>
          {
            new Set(
              documents
                .filter((d) => d.tipo === "firma" && d.vigente)
                .map((d) => d.firmante)
                .filter(Boolean),
            ).size
          }{" "}
          firmas registradas en el expediente
        </p>
        {canSend && (
          <button
            type="button"
            className="med-next"
            disabled={!blob || busy || Boolean(result)}
            onClick={send}
            aria-label="Enviar acta por correo"
          >
            {busy ? "Enviando…" : "Confirmar, Emitir Acta y Enviar →"}
          </button>
        )}
      </footer>
    </Modal>
  );
}
