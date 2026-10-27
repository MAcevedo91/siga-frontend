import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/store/useAuthStore";
import {
  obtenerMediacion,
  guardarCompromisos,
} from "@/services/mediacionesService";
import {
  mostrarFecha,
  nombreEstudiante,
  mensajeError,
  ROLES_MEDIACION_GESTION,
} from "@/utils/mediaciones";
import AsistenteAcuerdosFormativos from "@/components/mediaciones/AsistenteAcuerdosFormativos";
import ModalEvaluarCierre from "@/components/mediaciones/ModalEvaluarCierre";
import DocumentosMediacion from "@/components/mediaciones/DocumentosMediacion";
import LienzoFirmaModal from "@/components/mediaciones/LienzoFirmaModal";
import VisorActaModal from "@/components/mediaciones/VisorActaModal";
import { Semaforo } from "./MediacionesPage";
import {
  PageTitle,
  ErrorBox,
  buttonClass,
  secondaryClass,
} from "@/components/mediaciones/MediacionUI";
export default function MediacionDetallePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [med, setMed] = useState(null),
    [error, setError] = useState(""),
    [modal, setModal] = useState(""),
    [version, setVersion] = useState(0),
    [success, setSuccess] = useState("");
  const manage = ROLES_MEDIACION_GESTION.includes(user?.rol);
  useEffect(() => {
    setSuccess("");
  }, [id]);
  useEffect(() => {
    let active = true;
    setMed(null);
    setModal("");
    setError("");
    obtenerMediacion(id)
      .then((m) => active && setMed(m))
      .catch((e) => active && setError(mensajeError(e)));
    return () => {
      active = false;
    };
  }, [id, version]);
  async function save(payload) {
    await guardarCompromisos(id, payload);
    setSuccess("Acuerdos guardados en el expediente.");
    setVersion((v) => v + 1);
  }
  return (
    <DashboardLayout>
      <div className="mediation-design med-workspace med-screen-assistant">
        <div className="med-topbar">
          <PageTitle
            title="Asistente Guiado de Mediación Escolar"
            subtitle={`Caso ${med?.folio || "·"} · Diálogo, acuerdos y seguimiento`}
          >
            <Link to="/mediaciones" className={secondaryClass}>
              Volver al tablero
            </Link>
          </PageTitle>
        </div>
        <ErrorBox>{error}</ErrorBox>
        {success && (
          <p
            role="status"
            className="mb-4 rounded-xl bg-emerald-50 p-4 text-emerald-800"
          >
            {success}
          </p>
        )}
        {med?.id === id ? (
          <>
            <details className="my-3 rounded-lg border bg-white p-4">
              <summary className="cursor-pointer text-xs font-semibold text-slate-600">
                Datos de la sesión y participantes
              </summary>
              <section className="mt-3">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <Semaforo mediacion={med} />
                  <p className="text-sm text-slate-500">
                    Sesión: {mostrarFecha(med.fecha_programada)} ·{" "}
                    {med.lugar_sesion}
                  </p>
                </div>
                <p className="mb-4 text-slate-700">{med.motivo}</p>
                <div className="flex flex-wrap gap-2">
                  {med.mediacion_participantes?.map((p) => (
                    <Link
                      className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-700"
                      key={p.estudiante_id || p.id}
                      to={`/estudiantes/${p.estudiante_id || p.estudiantes?.id}`}
                    >
                      {nombreEstudiante(p.estudiantes)}
                    </Link>
                  ))}
                </div>
              </section>
            </details>
            <section className="mt-4">
              <AsistenteAcuerdosFormativos
                key={`${id}-${version}`}
                mediacion={med}
                onSave={save}
                onContinue={() => setModal("acta")}
                readOnly={Boolean(med.cerrada_at)}
              />
            </section>
            <DocumentosMediacion
              key={`${id}-docs-${version}`}
              mediacion={med}
              canWrite
              onUpdated={() => {
                setSuccess("Documento guardado en el expediente.");
                setVersion((v) => v + 1);
              }}
            />
            <section className="mt-5 flex flex-wrap gap-3">
              <button
                className={secondaryClass}
                onClick={() => setModal("acta")}
              >
                {med.cerrada_at ? "Ver acta de cierre PDF" : "Ver acta PDF"}
              </button>
              {!med.cerrada_at && (
                <button
                  className={secondaryClass}
                  onClick={() => setModal("firma")}
                >
                  Capturar firma
                </button>
              )}
              {manage && !med.cerrada_at && (
                <button
                  className={buttonClass}
                  onClick={() => setModal("cerrar")}
                >
                  Evaluar y cerrar
                </button>
              )}
            </section>
            {med.cerrada_at && (
              <section className="mt-5 rounded-xl bg-slate-100 p-5">
                <h2 className="font-semibold">
                  Conclusiones del cierre · {mostrarFecha(med.cerrada_at)}
                </h2>
                <p className="mt-2 whitespace-pre-wrap text-sm">
                  {med.conclusiones_cierre}
                </p>
              </section>
            )}
            {modal === "acta" && (
              <VisorActaModal
                mediacion={med}
                canSend={manage}
                onClose={() => {
                  setModal("");
                  setVersion((v) => v + 1);
                }}
              />
            )}
            {modal === "firma" && (
              <LienzoFirmaModal
                mediacion={med}
                onClose={() => setModal("")}
                onSaved={() => {
                  setVersion((v) => v + 1);
                  setSuccess("Firma guardada en el expediente.");
                }}
              />
            )}
            {modal === "cerrar" && (
              <ModalEvaluarCierre
                mediacion={med}
                onClose={() => setModal("")}
                onEvaluated={(evaluaciones) =>
                  setMed((current) =>
                    current?.id === id
                      ? {
                          ...current,
                          mediacion_compromisos:
                            current.mediacion_compromisos.map((c) => ({
                              ...c,
                              estado:
                                evaluaciones.find(
                                  (e) => e.compromiso_id === c.id,
                                )?.estado || c.estado,
                            })),
                        }
                      : current,
                  )
                }
                onSaved={() => {
                  setModal("");
                  setVersion((v) => v + 1);
                  setSuccess("Expediente cerrado correctamente.");
                }}
              />
            )}
          </>
        ) : (
          !error && <p role="status">Cargando expediente…</p>
        )}
      </div>
    </DashboardLayout>
  );
}
