import { useEffect, useState } from "react";
import {
  listarDocumentosMediacion,
  subirDocumentoMediacion,
  descargarDocumentoMediacion,
} from "@/services/mediacionesService";
import { descargarBlob, mensajeError, mostrarFecha } from "@/utils/mediaciones";
import {
  ErrorBox,
  Field,
  inputClass,
  buttonClass,
  secondaryClass,
} from "./MediacionUI";
export default function DocumentosMediacion({
  mediacion,
  canWrite,
  onUpdated,
}) {
  const available = Boolean(mediacion.version_documental);
  const [docs, setDocs] = useState(null),
    [file, setFile] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setDocs(null);
    setError("");
    if (!available) {
      setDocs([]);
      return;
    }
    listarDocumentosMediacion(mediacion.id)
      .then((r) => active && setDocs(r))
      .catch((e) => active && setError(mensajeError(e)));
    return () => {
      active = false;
    };
  }, [mediacion.id, mediacion.version_documental, available, revision]);
  async function upload(e) {
    e.preventDefault();
    if (!available) return;
    if (
      !file ||
      file.type !== "application/pdf" ||
      file.size > 5 * 1024 * 1024 ||
      !file.size
    ) {
      setError("Selecciona un PDF de hasta 5 MB.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await subirDocumentoMediacion(mediacion.id, {
        archivo: file,
        tipo: "acta_fisica",
        version: mediacion.version_documental,
      });
      setFile(null);
      setRevision((x) => x + 1);
      onUpdated?.();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setBusy(false);
    }
  }
  async function download(doc) {
    setBusy(true);
    setError("");
    try {
      const blob = await descargarDocumentoMediacion(mediacion.id, doc.id);
      await descargarBlob(
        blob,
        doc.tipo === "firma" ? "firma-mediacion.png" : "acta-fisica.pdf",
        doc.mime_type,
      );
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mt-5 rounded-2xl border bg-white p-5">
      <h2 className="mb-3 text-lg font-semibold">Firmas y acta física</h2>
      <ErrorBox>{error}</ErrorBox>
      {!available && (
        <p className="mb-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          El guardado de firmas y actas todavía no está habilitado. Puedes
          descargar el acta para firmarla y conservar una copia.
        </p>
      )}
      {!docs && !error && <p role="status">Consultando documentos…</p>}
      {docs?.length > 0 ? (
        <ul className="divide-y">
          {docs.map((d) => (
            <li
              key={d.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div>
                <p className="text-sm font-medium">
                  {d.tipo === "firma"
                    ? "Firma manuscrita"
                    : "Acta física firmada"}{" "}
                  · {mostrarFecha(d.created_at)}
                </p>
                <p className="text-xs text-slate-500">
                  {d.vigente
                    ? "Versión actual de los acuerdos"
                    : "Versión anterior de los acuerdos"}
                </p>
              </div>
              <button
                disabled={busy}
                className={secondaryClass}
                onClick={() => download(d)}
              >
                Descargar {d.tipo === "firma" ? "firma" : "acta física"}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        docs && (
          <p className="text-sm text-slate-500">
            Sin firmas ni actas físicas guardadas.
          </p>
        )
      )}
      {canWrite && !mediacion.cerrada_at && (
        <form
          onSubmit={upload}
          className="mt-4 space-y-3 rounded-xl bg-slate-50 p-4"
        >
          <Field label="Acta física firmada en PDF">
            <input
              disabled={!available || busy}
              type="file"
              accept="application/pdf"
              className={inputClass}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </Field>
          <p className="text-xs text-slate-500">
            Hasta 5 MB. El acta física vigente se utilizará en la vista previa y
            el despacho por correo.
          </p>
          <button className={buttonClass} disabled={busy || !available}>
            {busy ? "Guardando…" : "Guardar acta física"}
          </button>
        </form>
      )}
    </section>
  );
}
