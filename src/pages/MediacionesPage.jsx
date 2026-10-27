import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  listarMediaciones,
  obtenerMediacion,
} from "@/services/mediacionesService";
import {
  getSemaforo,
  mensajeError,
  mostrarFecha,
  nombreEstudiante,
} from "@/utils/mediaciones";
import {
  PageTitle,
  ErrorBox,
  inputClass,
  buttonClass,
  secondaryClass,
} from "@/components/mediaciones/MediacionUI";
export function Semaforo({ mediacion }) {
  const s = getSemaforo(mediacion);
  const colors = {
    slate: "bg-slate-100 text-slate-700",
    emerald: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-900",
    rose: "bg-rose-100 text-rose-800",
  };
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${colors[s.color]}`}
    >
      {s.label}
    </span>
  );
}
export default function MediacionesPage() {
  const [rows, setRows] = useState([]),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0),
    [pages, setPages] = useState(1),
    [estado, setEstado] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [reload, setReload] = useState(0),
    [selectedId, setSelectedId] = useState(""),
    [semaforoFilter, setSemaforoFilter] = useState(""),
    [search, setSearch] = useState(""),
    [studentId, setStudentId] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    listarMediaciones({ page, limit: 12, ...(estado ? { estado } : {}) })
      .then(async (result) => {
        const details = await Promise.allSettled(
          (result.data || []).map((m) => obtenerMediacion(m.id)),
        );
        if (!active) return;
        setRows(
          details.map((r, i) =>
            r.status === "fulfilled"
              ? r.value
              : { ...result.data[i], detalle_no_disponible: true },
          ),
        );
        setTotal(result.total || 0);
        setPages(result.totalPages || 1);
        if (details.some((r) => r.status === "rejected"))
          setError(
            "Algunos plazos no pudieron consultarse. Actualiza para reintentar.",
          );
      })
      .catch((e) => {
        if (active) {
          setRows([]);
          setTotal(0);
          setError(mensajeError(e));
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page, estado, reload]);
  const activeRows = rows.filter((m) => !m.cerrada_at),
    expired = activeRows.filter((m) => getSemaforo(m).key === "vencido"),
    soon = activeRows.filter((m) => getSemaforo(m).key === "proximo");
  const visibleRows = rows.filter(
    (m) =>
      (!semaforoFilter || getSemaforo(m).key === semaforoFilter) &&
      (!search.trim() ||
        `${m.folio || ""} ${m.motivo || ""} ${(m.mediacion_participantes || []).map((p) => nombreEstudiante(p.estudiantes)).join(" ")}`
          .toLocaleLowerCase("es")
          .includes(search.toLocaleLowerCase("es").trim())),
  );
  const selected =
    visibleRows.find((m) => m.id === selectedId) || visibleRows[0];
  const participants = selected?.mediacion_participantes || [];
  const currentStudent =
    participants.find(
      (p) => (p.estudiante_id || p.estudiantes?.id) === studentId,
    ) || participants[0];
  const commitments = (selected?.mediacion_compromisos || []).filter(
    (c) =>
      !c.estudiante_id ||
      c.estudiante_id ===
        (currentStudent?.estudiante_id || currentStudent?.estudiantes?.id),
  );
  const countAgreements = rows.reduce(
    (n, m) => n + (m.mediacion_compromisos?.length || 0),
    0,
  );
  const fulfilled = rows.reduce(
    (n, m) =>
      n +
      (m.mediacion_compromisos || []).filter(
        (c) => c.cumplido || c.estado === "cumplido",
      ).length,
    0,
  );
  const names = (m) =>
    (m.mediacion_participantes || [])
      .map((p) => nombreEstudiante(p.estudiantes))
      .join(" y ");
  return (
    <DashboardLayout>
      <div className="mediation-design med-workspace med-screen-board">
        <PageTitle
          title="Seguimiento de Mediaciones y Expediente del Estudiante"
          mobileTitle="Seguimiento y Expediente"
          subtitle="Monitoreo de acuerdos formativos RICE, semáforo de plazos e historial individual integrado"
        >
          <Link to="/mediaciones/nueva" className={buttonClass}>
            + Nueva mediación
          </Link>
        </PageTitle>
        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          {[
            [
              "Mediaciones activas en seguimiento",
              activeRows.length,
              "#4435b5",
              "Abiertas en esta página",
            ],
            [
              "Cumplimiento de compromisos",
              countAgreements
                ? `${Math.round((100 * fulfilled) / countAgreements)}%`
                : "—",
              "#4a9471",
              "Acuerdos de los expedientes de esta página",
            ],
            [
              "Casos y acuerdos vencidos",
              expired.length,
              "#cf5353",
              `${soon.length} próximos a vencer en esta página`,
            ],
          ].map(([label, value, color, caption]) => (
            <section
              key={label}
              className="med-kpi-card rounded-lg border bg-white p-5"
              style={{
                borderLeft: `4px solid ${color}`,
                "--med-progress": `${countAgreements ? Math.round((100 * fulfilled) / countAgreements) : 0}%`,
              }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                <span className="med-kpi-label-desktop">{label}</span>
                <span className="med-kpi-label-mobile">
                  {label.startsWith("Mediaciones")
                    ? "ACTIVAS"
                    : label.startsWith("Cumplimiento")
                      ? "CUMPLIMIENTO"
                      : "VENCIDOS"}
                </span>
              </p>
              <strong className="mt-2 block text-3xl" style={{ color }}>
                {loading || error ? "—" : value}
              </strong>
              <p className="mt-2 text-xs text-slate-500">
                {error ? "Información no disponible" : caption}
              </p>
            </section>
          ))}
        </div>
        <div className="med-board-grid">
          <section className="med-board-panel">
            <h2>Bandeja de seguimiento activo</h2>
            <p>Selecciona un caso para abrir el expediente del estudiante.</p>
            <div
              className="med-filter-pills"
              role="group"
              aria-label="Filtrar por semáforo"
            >
              {[
                ["", "Todos", rows.length],
                ["vencido", "Vencidos", expired.length],
                ["proximo", "Por vencer", soon.length],
                [
                  "plazo",
                  "Al día",
                  activeRows.filter((m) => getSemaforo(m).key === "plazo")
                    .length,
                ],
              ].map(([key, label, count]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={semaforoFilter === key}
                  onClick={() => setSemaforoFilter(key)}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
            <input
              type="search"
              aria-label="Buscar mediaciones en esta página"
              placeholder="Buscar por estudiante o código MED…"
              className="med-board-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <p className="mt-2 text-[10px] text-slate-500">
              Filtros y búsqueda sobre los expedientes de esta página.
            </p>
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-slate-500">
                Estado y actualización
              </summary>
              <div className="flex flex-wrap items-end gap-2 mt-2">
                <label className="text-xs">
                  Estado
                  <select
                    className={inputClass}
                    value={estado}
                    onChange={(e) => {
                      setEstado(e.target.value);
                      setPage(1);
                      setSelectedId("");
                    }}
                  >
                    <option value="">Todos</option>
                    {[
                      "borrador",
                      "programada",
                      "en_sesion",
                      "acordada",
                      "sin_acuerdo",
                      "derivada_inspectoria",
                    ].map((st) => (
                      <option key={st} value={st}>
                        {st.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className={secondaryClass}
                  onClick={() => setReload((x) => x + 1)}
                >
                  Actualizar
                </button>
              </div>
            </details>
            <div className="mt-4">
              <ErrorBox>{error}</ErrorBox>
            </div>
            {loading ? (
              <p className="p-8" role="status">
                Cargando mediaciones…
              </p>
            ) : error && !visibleRows.length ? (
              <p className="py-8 text-sm text-slate-500">
                No se pudo cargar la bandeja. Reintenta con Actualizar.
              </p>
            ) : !visibleRows.length ? (
              <p className="py-8 text-sm text-slate-500">
                No hay mediaciones para este filtro.
              </p>
            ) : (
              <div className="med-case-list">
                {visibleRows.map((m) => {
                  const s = getSemaforo(m);
                  const cs = m.mediacion_compromisos || [];
                  const complete = cs.filter(
                    (c) => c.cumplido || c.estado === "cumplido",
                  ).length;
                  return (
                    <button
                      key={m.id}
                      className={`med-case ${s.color} ${selected?.id === m.id ? "selected" : ""}`}
                      onClick={() => setSelectedId(m.id)}
                      aria-pressed={selected?.id === m.id}
                    >
                      <div className="med-case-top">
                        <span>{m.folio || "Mediación"}</span>
                        {m.detalle_no_disponible ? (
                          <span>Plazo sin verificar</span>
                        ) : (
                          <Semaforo mediacion={m} />
                        )}
                      </div>
                      <h3>{names(m) || m.motivo}</h3>
                      <p>Sesión: {mostrarFecha(m.fecha_programada)}</p>
                      <p className="mt-2">
                        {m.detalle_no_disponible
                          ? "Acuerdos sin verificar"
                          : `Avance de compromisos: ${complete} de ${cs.length}`}
                      </p>
                      <div className="med-progress">
                        <span
                          style={{
                            width: cs.length
                              ? `${(100 * complete) / cs.length}%`
                              : "0%",
                          }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            <nav
              aria-label="Paginación de mediaciones"
              className="mt-5 flex items-center justify-between gap-2 text-xs"
            >
              <button
                className={secondaryClass}
                disabled={page <= 1 || loading}
                onClick={() => setPage((x) => x - 1)}
              >
                Anterior
              </button>
              <span>
                Página {page} de {pages}
              </span>
              <button
                className={secondaryClass}
                disabled={page >= pages || loading}
                onClick={() => setPage((x) => x + 1)}
              >
                Siguiente
              </button>
            </nav>
            {!error && (
              <p className="mt-3 text-xs text-slate-500">
                {total} expedientes encontrados
              </p>
            )}
            <aside className="mt-6 rounded-lg border bg-slate-50 p-4 text-xs leading-6">
              <b>SEMÁFORO DE SEGUIMIENTO</b>
              <p className="text-emerald-700">● Verde: al día / cumplido</p>
              <p className="text-amber-800">● Amarillo: próximo vencimiento</p>
              <p className="text-rose-700">
                ● Rojo: compromiso vencido sin evaluar
              </p>
            </aside>
          </section>
          <section
            className="med-board-panel"
            aria-label="Expediente seleccionado"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Expediente integral del estudiante · Ficha individual
            </p>
            {selected ? (
              <>
                {participants.length > 1 && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="rounded-md border px-3 py-2 text-xs"
                      onClick={() => {
                        const index = participants.indexOf(currentStudent);
                        const next =
                          participants[(index + 1) % participants.length];
                        setStudentId(
                          next.estudiante_id || next.estudiantes?.id,
                        );
                      }}
                    >
                      Cambiar estudiante ↔
                    </button>
                  </div>
                )}
                <header className="med-dossier-header">
                  <span className="med-avatar">
                    {currentStudent?.estudiantes?.nombre?.[0] || "M"}
                  </span>
                  <div>
                    <h3>
                      {nombreEstudiante(currentStudent?.estudiantes) ||
                        "Expediente de mediación"}
                    </h3>
                    <p>
                      {selected.folio} · {selected.estado?.replaceAll("_", " ")}
                    </p>
                  </div>
                </header>
                <div className="med-tabs">
                  <Link
                    className="p-3"
                    to={`/estudiantes/${currentStudent?.estudiante_id || currentStudent?.estudiantes?.id}`}
                  >
                    Resumen general
                  </Link>
                  <Link
                    className="p-3"
                    to={`/estudiantes/${currentStudent?.estudiante_id || currentStudent?.estudiantes?.id}`}
                  >
                    Incidentes RICE
                  </Link>
                  <span className="active">Mediaciones y acuerdos</span>
                </div>
                <h2>Historial formativo</h2>
                <p className="mt-2 text-sm text-slate-600">{selected.motivo}</p>
                <h3 className="mt-5 text-sm font-semibold">
                  Compromisos del caso activo
                </h3>
                {selected.detalle_no_disponible ? (
                  <p className="py-8 text-sm text-amber-800">
                    No se pudieron verificar los compromisos.
                  </p>
                ) : !commitments.length ? (
                  <p className="py-8 text-sm text-slate-500">
                    Este expediente todavía no tiene acuerdos registrados.
                  </p>
                ) : (
                  commitments.map((c, i) => {
                    const status = getSemaforo({
                      mediacion_compromisos: [c],
                      cerrada_at: selected.cerrada_at,
                    }).color;
                    return (
                      <article
                        key={c.id || i}
                        className={`med-followup-card ${status}`}
                      >
                        <span className="text-[10px] font-semibold uppercase">
                          {c.estado?.replaceAll("_", " ") || "Pendiente"} ·{" "}
                          {c.tipo_compromiso?.replaceAll("_", " ") ||
                            "Acuerdo formativo"}
                        </span>
                        <strong>
                          {i + 1}. {c.descripcion}
                        </strong>
                        <p>Plazo: {mostrarFecha(c.fecha_limite)}</p>
                      </article>
                    );
                  })
                )}
                <footer className="med-footer">
                  <div className="flex flex-wrap gap-2">
                    {participants.map((p) => (
                      <Link
                        key={p.id || p.estudiante_id}
                        className="text-xs text-indigo-700"
                        to={`/estudiantes/${p.estudiante_id || p.estudiantes?.id}`}
                      >
                        Perfil de {p.estudiantes?.nombre} ↗
                      </Link>
                    ))}
                  </div>
                  <Link
                    className={buttonClass}
                    to={`/mediaciones/${selected.id}`}
                  >
                    Abrir expediente →
                  </Link>
                </footer>
              </>
            ) : (
              <div className="py-24 text-center text-sm text-slate-500">
                {error
                  ? "El expediente estará disponible cuando se restablezca la consulta."
                  : "Selecciona una mediación de la bandeja."}
              </div>
            )}
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
