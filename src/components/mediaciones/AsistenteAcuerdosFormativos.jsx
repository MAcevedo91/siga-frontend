import { useRef, useState } from "react";
import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";
import {
  fechaLocal,
  mensajeError,
  nombreEstudiante,
  mostrarFecha,
} from "@/utils/mediaciones";
import {
  Field,
  ErrorBox,
  inputClass,
  buttonClass,
  secondaryClass,
  MediationSteps,
} from "./MediacionUI";
const BANK = [
  {
    tipo_compromiso: "reparacion_relacional",
    descripcion:
      "Realizar una acción de reparación acordada con la persona afectada.",
  },
  {
    tipo_compromiso: "actitud_aula",
    descripcion: "Practicar una estrategia de diálogo y respeto en el aula.",
  },
  {
    tipo_compromiso: "cuidado_espacios",
    descripcion:
      "Participar en una actividad de cuidado de los espacios comunes.",
  },
];
export default function AsistenteAcuerdosFormativos({
  mediacion,
  onSave,
  readOnly = false,
  onContinue,
}) {
  const storeRef = useRef(null);
  if (!storeRef.current)
    storeRef.current = createStore((set) => ({
      rows: (mediacion.mediacion_compromisos || []).map((c) => ({
        ...c,
        key: c.id,
      })),
      update: (fn) => set((s) => ({ rows: fn(s.rows) })),
    }));
  const { rows, update } = useStore(storeRef.current);
  const [activeStudent, setActiveStudent] = useState(0),
    [editing, setEditing] = useState({}),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [seguimiento, setSeguimiento] = useState(
      mediacion.fecha_seguimiento?.slice(0, 10) || "",
    );
  const students = (mediacion.mediacion_participantes || [])
    .map((p) => p.estudiantes)
    .filter(Boolean);
  const locked =
    readOnly ||
    [...rows, ...(mediacion.mediacion_compromisos || [])].some(
      (c) => c.cumplido || (c.estado && c.estado !== "pendiente"),
    );
  const unsaved =
    rows.length !== (mediacion.mediacion_compromisos || []).length ||
    rows.some((r) => {
      const original = (mediacion.mediacion_compromisos || []).find(
        (c) => c.id === r.key,
      );
      return (
        !original ||
        [
          "descripcion",
          "estudiante_id",
          "tipo_compromiso",
          "fecha_limite",
        ].some((field) => (r[field] || "") !== (original[field] || ""))
      );
    }) ||
    seguimiento !== (mediacion.fecha_seguimiento?.slice(0, 10) || "");
  const minDate = [fechaLocal(), mediacion.fecha_programada?.slice(0, 10) || ""]
    .sort()
    .at(-1);
  function add(preset = {}) {
    const key = crypto.randomUUID();
    setEditing((old) => ({ ...old, [key]: true }));
    const index = students.findIndex(
      (student) => student.id === preset.estudiante_id,
    );
    if (index >= 0) setActiveStudent(index);
    update((old) => [
      ...old,
      {
        key,
        estudiante_id: students[0]?.id || "",
        tipo_compromiso: "otro",
        descripcion: "",
        fecha_limite: "",
        ...preset,
      },
    ]);
  }
  function edit(key, field, value) {
    update((old) =>
      old.map((r) => (r.key === key ? { ...r, [field]: value } : r)),
    );
  }
  async function save(e) {
    e.preventDefault();
    if (locked) return;
    const invalid = rows.find(
      (r) =>
        r.descripcion.trim().length < 5 ||
        r.descripcion.trim().length > 1000 ||
        !r.fecha_limite ||
        r.fecha_limite < minDate,
    );
    if (invalid) {
      setEditing((old) => ({ ...old, [invalid.key]: true }));
      const index = students.findIndex(
        (student) => student.id === invalid.estudiante_id,
      );
      setActiveStudent(index >= 0 ? index : 0);
      setError(
        "Completa cada acuerdo con una descripción de 5 a 1000 caracteres y una fecha vigente.",
      );
      return;
    }
    if (seguimiento && seguimiento < minDate) {
      setError("La fecha de seguimiento debe ser vigente.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSave({
        compromisos: rows.map(({ key: _key, ...r }) => ({
          ...r,
          estudiante_id: r.estudiante_id || null,
        })),
        ...(seguimiento ? { fecha_seguimiento: seguimiento } : {}),
      });
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form noValidate onSubmit={save} className="space-y-5">
      <MediationSteps current={3} />
      <ErrorBox>{error}</ErrorBox>
      {locked && !readOnly && (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          Los acuerdos ya evaluados se conservan sin modificaciones. Puedes
          continuar con el cierre del expediente.
        </p>
      )}
      <div className="med-agreements">
        {!locked && (
          <aside className="med-catalog">
            <h3>Catálogo de Compromisos RICE</h3>
            <p>Selecciona una acción y adáptala con cada estudiante.</p>
            <div className="flex flex-wrap gap-1 text-[10px]">
              <span className="rounded-full bg-sky-100 px-2 py-1">
                Reparatorios
              </span>
              <span className="rounded-full bg-purple-100 px-2 py-1">
                Pedagógicos
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-1">
                Comunitarios
              </span>
            </div>
            <div className="med-catalog-items">
              {BANK.map((p) => (
                <div key={p.tipo_compromiso} className="med-catalog-card">
                  <h4>
                    {p.tipo_compromiso === "reparacion_relacional"
                      ? "Disculpas formales y acuerdo de respeto"
                      : p.tipo_compromiso === "actitud_aula"
                        ? "Taller de gestión de emociones en recreo"
                        : "Proyecto colaborativo en biblioteca"}
                  </h4>
                  <p>{p.descripcion}</p>
                  <div className="flex flex-wrap gap-1">
                    {students.map((student) => (
                      <button
                        type="button"
                        key={student.id}
                        onClick={() => add({ ...p, estudiante_id: student.id })}
                      >
                        + {student.nombre}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => add({ ...p, estudiante_id: "" })}
                    >
                      + Ambos
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className={secondaryClass}
              onClick={() => add()}
            >
              Agregar acuerdo personalizado
            </button>
          </aside>
        )}
        <div
          className="med-student-tabs"
          role="tablist"
          aria-label="Acuerdos por estudiante"
        >
          {students.map((student, index) => (
            <button
              key={student.id}
              type="button"
              role="tab"
              aria-selected={activeStudent === index}
              aria-controls={`student-column-${student.id}`}
              onClick={() => setActiveStudent(index)}
            >
              {student.nombre} (
              {
                rows.filter(
                  (r) =>
                    r.estudiante_id === student.id ||
                    (!r.estudiante_id && index === 0),
                ).length
              }
              )
            </button>
          ))}
        </div>
        {(students.length
          ? students
          : [{ id: "", nombre: "Participantes" }]
        ).map((student, column) => (
          <section
            key={student.id}
            id={`student-column-${student.id}`}
            className={`med-student-column ${activeStudent === column ? "is-active" : ""}`}
          >
            <header className="med-person-header">
              <span className="med-avatar">{`${student.nombre?.[0] || ""}${student.apellido?.[0] || ""}`}</span>
              <div>
                <b>{nombreEstudiante(student)}</b>
                <small>
                  {student.rut ? `RUT: ${student.rut}` : "Acuerdos compartidos"}{" "}
                  ·{" "}
                  {{
                    parte_1: "Solicitante",
                    parte_2: "Involucrado",
                    observador: "Testigo",
                    afectado: "Persona afectada",
                    mediador_par: "Mediador par",
                  }[
                    mediacion.mediacion_participantes?.find(
                      (p) =>
                        (p.estudiante_id || p.estudiantes?.id) === student.id,
                    )?.rol_participante
                  ] || "Participante"}
                </small>
              </div>
            </header>
            <div className="space-y-3">
              {rows
                .filter(
                  (r) =>
                    r.estudiante_id === student.id ||
                    (!r.estudiante_id && column === 0),
                )
                .map((r) => {
                  const i = rows.indexOf(r);
                  return (
                    <article
                      key={r.key}
                      className={`med-agreement-card space-y-3 kind-${r.tipo_compromiso} ${editing[r.key] ? "is-editing" : ""}`}
                    >
                      <div className="med-card-preview">
                        <span className="med-card-kind">
                          {r.tipo_compromiso?.replaceAll("_", " ") ||
                            "Acuerdo formativo"}
                        </span>
                        {!locked && (
                          <button
                            type="button"
                            className="med-card-tools"
                            aria-label={`Editar acuerdo ${i + 1}`}
                            onClick={() =>
                              setEditing((old) => ({ ...old, [r.key]: true }))
                            }
                          >
                            Editar
                          </button>
                        )}
                        <h4 className="med-card-description">
                          {r.descripcion || "Nuevo acuerdo formativo"}
                        </h4>
                        <div className="med-card-meta">
                          <div>
                            <small>Plazo de revisión</small>
                            {mostrarFecha(r.fecha_limite)}
                          </div>
                          <div>
                            <small>Participante</small>
                            {r.estudiante_id
                              ? nombreEstudiante(
                                  students.find(
                                    (s) => s.id === r.estudiante_id,
                                  ),
                                )
                              : "Ambos estudiantes"}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`med-edit-fields ${editing[r.key] ? "is-editing" : ""}`}
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
                            onChange={(e) =>
                              edit(r.key, "descripcion", e.target.value)
                            }
                          />
                        </Field>
                        <Field label={`Responsable del acuerdo ${i + 1}`}>
                          <select
                            disabled={locked}
                            className={inputClass}
                            value={r.estudiante_id || ""}
                            onChange={(e) =>
                              edit(r.key, "estudiante_id", e.target.value)
                            }
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
                            onChange={(e) =>
                              edit(r.key, "tipo_compromiso", e.target.value)
                            }
                          >
                            {[
                              "reparacion_relacional",
                              "disculpa_comunitaria",
                              "cuidado_espacios",
                              "actitud_aula",
                              "apoyo_academico",
                              "otro",
                            ].map((t) => (
                              <option key={t} value={t}>
                                {t.replaceAll("_", " ")}
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
                            value={r.fecha_limite?.slice(0, 10) || ""}
                            onChange={(e) =>
                              edit(r.key, "fecha_limite", e.target.value)
                            }
                          />
                        </Field>
                        {!locked && (
                          <button
                            className="text-sm font-medium text-rose-700"
                            type="button"
                            aria-label={`Eliminar acuerdo ${i + 1}`}
                            onClick={() =>
                              update((old) =>
                                old.filter((x) => x.key !== r.key),
                              )
                            }
                          >
                            Eliminar acuerdo
                          </button>
                        )}
                        {!locked && (
                          <button
                            type="button"
                            className={secondaryClass}
                            onClick={() =>
                              setEditing((old) => ({ ...old, [r.key]: false }))
                            }
                          >
                            Listo
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
            </div>
            {!rows.some(
              (r) =>
                r.estudiante_id === student.id ||
                (!r.estudiante_id && column === 0),
            ) && (
              <p className="py-8 text-center text-xs text-slate-400">
                Sin acuerdos asignados todavía.
              </p>
            )}
            {!locked && (
              <button
                type="button"
                className="w-full rounded-md border border-dashed border-sky-300 p-3 text-left text-xs text-sky-800"
                onClick={() => add({ estudiante_id: student.id })}
              >
                + Escribir nuevo acuerdo para {student.nombre}
              </button>
            )}
            <div className="med-acceptance">
              <b>
                {student.nombre}:{" "}
                {
                  rows.filter(
                    (r) =>
                      r.estudiante_id === student.id ||
                      (!r.estudiante_id && column === 0),
                  ).length
                }{" "}
                acuerdos formativos
              </b>
              El cumplimiento se registra durante el seguimiento. La conformidad
              se confirma mediante la firma.
            </div>
          </section>
        ))}
      </div>
      {!rows.length && (
        <p className="rounded-xl border border-dashed p-8 text-center text-slate-500">
          Agrega el primer acuerdo de la sesión.
        </p>
      )}
      <div className="med-footer">
        <div className="max-w-xs">
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
        </div>
        <p>{rows.length} acuerdos formativos en este expediente</p>
        {!locked && (
          <button className={buttonClass} disabled={!rows.length || busy}>
            {busy ? "Guardando…" : "Guardar acuerdos"}
          </button>
        )}
        {onContinue && (
          <button
            type="button"
            className="med-next"
            disabled={unsaved || busy}
            title={
              unsaved ? "Guarda los acuerdos antes de continuar" : undefined
            }
            onClick={onContinue}
          >
            Avanzar al Paso 4: Cierre y Acta →
          </button>
        )}
      </div>
    </form>
  );
}
