import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SociogramaGrafoView from "@/components/sociograma/SociogramaGrafoView";
import {
  obtenerCursosSociograma,
  obtenerSociograma,
} from "@/services/sprint9Service";
import { mensajeError } from "@/utils/mediaciones";
import {
  PageTitle,
  ErrorBox,
  Field,
  Modal,
  inputClass,
  secondaryClass,
} from "@/components/mediaciones/MediacionUI";
export default function SociogramaCursoPage() {
  const [params, setParams] = useSearchParams(),
    cursoId = params.get("curso") || "";
  const [courses, setCourses] = useState([]),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [selected, setSelected] = useState(null),
    [exporting, setExporting] = useState(false);
  const svg = useRef(null);
  useEffect(() => {
    let active = true;
    obtenerCursosSociograma()
      .then((r) => active && setCourses(Array.isArray(r) ? r : r?.items || []))
      .catch((e) => active && setError(mensajeError(e)));
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    setData(null);
    if (!cursoId) return;
    let active = true;
    setLoading(true);
    setError("");
    obtenerSociograma(cursoId)
      .then((r) => active && setData(r.data || r))
      .catch((e) => active && setError(mensajeError(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [cursoId]);
  async function exportGraph(type) {
    if (!svg.current) return;
    setExporting(true);
    setError("");
    let url;
    try {
      const clone = svg.current.cloneNode(true);
      clone.setAttribute("width", "1600");
      clone.setAttribute("height", "1024");
      url = URL.createObjectURL(
        new Blob([new XMLSerializer().serializeToString(clone)], {
          type: "image/svg+xml;charset=utf-8",
        }),
      );
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = url;
      });
      const canvas = document.createElement("canvas");
      canvas.width = 1600;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, 1600, 1024);
      ctx.drawImage(image, 0, 0, 1600, 1024);
      const png = canvas.toDataURL("image/png");
      if (type === "pdf") {
        const pdf = new jsPDF({ orientation: "landscape" });
        pdf.setFontSize(15);
        pdf.text(`Sociograma · ${data.curso?.nombre || "Curso"}`, 12, 14);
        pdf.addImage(png, "PNG", 12, 23, 273, 175);
        pdf.save("sociograma-curso.pdf");
      } else {
        const a = document.createElement("a");
        a.href = png;
        a.download = "sociograma-curso.png";
        a.click();
      }
    } catch (e) {
      setError(`No fue posible exportar el sociograma. ${mensajeError(e)}`);
    } finally {
      if (url) URL.revokeObjectURL(url);
      setExporting(false);
    }
  }
  const metrics = data?.metricas || {},
    nodes = data?.nodes || [],
    links = data?.links || [];
  return (
    <DashboardLayout>
      <div className="text-slate-900 mx-auto max-w-7xl p-4 sm:p-6">
        <PageTitle
          title="Sociograma del curso"
          subtitle="Explora interacciones registradas y oportunidades de acompañamiento"
        />
        <div className="mb-5 max-w-md">
          <Field label="Curso">
            <select
              className={inputClass}
              value={cursoId}
              onChange={(e) =>
                setParams(e.target.value ? { curso: e.target.value } : {})
              }
            >
              <option value="">Selecciona un curso</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre || `${c.nivel} ${c.letra}`}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <ErrorBox>{error}</ErrorBox>
        {loading ? (
          <p role="status">Construyendo red de interacciones…</p>
        ) : (
          data && (
            <>
              <div className="mb-5 grid gap-3 sm:grid-cols-3">
                {[
                  ["Estudiantes", metrics.total_estudiantes ?? nodes.length],
                  ["Densidad de la red", `${metrics.densidad_red_pct ?? 0}%`],
                  [
                    "Integración registrada",
                    `${metrics.tasa_integracion_pct ?? 0}%`,
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border bg-white p-5">
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="text-2xl font-bold text-indigo-700">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
              <section className="rounded-2xl border bg-white p-5">
                <div className="mb-4 flex flex-wrap justify-between gap-3">
                  <h2 className="font-semibold">
                    {data.curso?.nombre || "Red del curso"}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      disabled={!nodes.length || exporting}
                      className={secondaryClass}
                      onClick={() => exportGraph("png")}
                    >
                      Exportar imagen
                    </button>
                    <button
                      disabled={!nodes.length || exporting}
                      className={secondaryClass}
                      onClick={() => exportGraph("pdf")}
                    >
                      Exportar PDF
                    </button>
                  </div>
                </div>
                {nodes.length ? (
                  <SociogramaGrafoView
                    ref={svg}
                    nodes={nodes}
                    links={links}
                    onSelect={setSelected}
                  />
                ) : (
                  <p className="p-8 text-center text-slate-500">
                    El curso no tiene estudiantes disponibles.
                  </p>
                )}
              </section>
              <aside className="mt-5 rounded-xl border bg-indigo-50 p-5">
                <h2 className="font-semibold">
                  Orientaciones de acompañamiento
                </h2>
                <p className="mt-2 text-sm">
                  {metrics.diagnostico_clima ||
                    "Revisa la red junto al equipo de convivencia y contrasta con observaciones del curso."}
                </p>
                {metrics.estudiantes_aislados > 0 && (
                  <p className="mt-2 text-sm">
                    Hay {metrics.estudiantes_aislados} estudiantes sin vínculos
                    registrados. Verifica participación y disponibilidad de
                    antecedentes antes de concluir aislamiento social.
                  </p>
                )}
                {(metrics.estudiantes_en_riesgo?.length > 0 ||
                  metrics.pares_criticos?.length > 0) && (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {metrics.estudiantes_en_riesgo?.length > 0 && (
                      <section className="rounded-xl bg-white p-4">
                        <h3 className="font-semibold">
                          Revisión de acompañamiento
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Contrasta los antecedentes y acuerda apoyos con el
                          equipo de convivencia.
                        </p>
                        <ul className="mt-3 space-y-2">
                          {metrics.estudiantes_en_riesgo.map((e) => (
                            <li
                              key={e.id}
                              className="flex flex-wrap items-center justify-between gap-2 text-sm"
                            >
                              <Link
                                className="font-medium text-indigo-700"
                                to={`/estudiantes/${e.id}`}
                              >
                                {e.nombre}
                              </Link>
                              <span className="text-xs text-slate-500">
                                {e.nivel_acompanamiento ||
                                  "Revisar antecedentes"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                    {metrics.pares_criticos?.length > 0 && (
                      <section className="rounded-xl bg-white p-4">
                        <h3 className="font-semibold">Vínculos para revisar</h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Revisa los registros compartidos antes de proponer una
                          intervención.
                        </p>
                        <ul className="mt-3 space-y-2">
                          {metrics.pares_criticos.map((p, i) => (
                            <li
                              key={`${p.source_id}-${p.target_id}-${i}`}
                              className="text-sm"
                            >
                              {p.source_nombre} · {p.target_nombre}
                              <span className="block text-xs text-slate-500">
                                Peso neto registrado: {p.weight}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                  </div>
                )}
                <p className="mt-2 text-xs text-slate-600">
                  Los indicadores apoyan la revisión profesional; no reemplazan
                  la entrevista ni determinan sanciones.
                </p>
              </aside>
            </>
          )
        )}
        {!cursoId && (
          <p className="rounded-xl border border-dashed p-10 text-center text-slate-500">
            Selecciona un curso para consultar su red.
          </p>
        )}
        {selected && (
          <Modal title={selected.nombre} onClose={() => setSelected(null)}>
            <dl className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4">
              <dt>Incidentes</dt>
              <dd>{selected.incidentes_count || 0}</dd>
              <dt>Mediaciones</dt>
              <dd>{selected.mediaciones_count || 0}</dd>
              <dt>Vínculos registrados</dt>
              <dd>{selected.grado_centralidad || 0}</dd>
              <dt>Acompañamiento</dt>
              <dd>{selected.nivel_acompanamiento || "Sin clasificación"}</dd>
            </dl>
            <section className="mt-4">
              <h3 className="font-semibold">
                Interacciones compartidas registradas
              </h3>
              {links.filter(
                (l) =>
                  (typeof l.source === "object" ? l.source.id : l.source) ===
                    selected.id ||
                  (typeof l.target === "object" ? l.target.id : l.target) ===
                    selected.id,
              ).length ? (
                <ul className="mt-3 divide-y">
                  {links
                    .filter(
                      (l) =>
                        (typeof l.source === "object"
                          ? l.source.id
                          : l.source) === selected.id ||
                        (typeof l.target === "object"
                          ? l.target.id
                          : l.target) === selected.id,
                    )
                    .map((l, i) => {
                      const source =
                          typeof l.source === "object" ? l.source.id : l.source,
                        target =
                          typeof l.target === "object" ? l.target.id : l.target;
                      const peer = nodes.find(
                        (n) =>
                          n.id === (source === selected.id ? target : source),
                      );
                      return (
                        <li key={`${source}-${target}-${i}`} className="py-3">
                          <p className="text-sm font-medium">
                            {peer?.nombre || "Estudiante vinculado"}
                          </p>
                          <p className="text-sm text-slate-600">
                            Incidentes compartidos:{" "}
                            {l.incidentes_count ??
                              l.co_ocurrencias_incidentes ??
                              0}{" "}
                            · Mediaciones compartidas:{" "}
                            {l.mediaciones_count ??
                              l.mediaciones_realizadas ??
                              0}
                          </p>
                        </li>
                      );
                    })}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  Sin interacciones compartidas registradas.
                </p>
              )}
            </section>
            <Link
              className="mt-4 inline-block font-semibold text-indigo-700"
              to={`/estudiantes/${selected.id}`}
            >
              Ver historial del estudiante →
            </Link>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
}
