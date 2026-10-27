import { mostrarFecha, nombreEstudiante } from "@/utils/mediaciones";
export default function ActaLectura({ mediacion, documents = [] }) {
  const people = mediacion.mediacion_participantes || [];
  return (
    <article className="med-acta-sheet">
      <header>
        <span className="med-acta-mark">●</span>
        <div>
          <b>SIGA ESCOLAR</b>
          <small>ACTA DE MEDIACIÓN ESCOLAR · ACUERDOS FORMATIVOS</small>
        </div>
      </header>
      <section className="med-acta-identification">
        <b>
          FOLIO: {mediacion.folio || "Sin folio"} · FECHA:{" "}
          {mostrarFecha(mediacion.fecha_programada)}
        </b>
        <p>{mediacion.lugar_sesion || "Sesión de mediación"}</p>
      </section>
      <h4>1. SÍNTESIS DE COMPROMISOS FORMATIVOS</h4>
      {people.map((p, i) => (
        <section
          key={p.id || p.estudiante_id}
          className={`med-acta-student student-${i % 2}`}
        >
          <b>
            Estudiante {i + 1}: {nombreEstudiante(p.estudiantes)}{" "}
            {p.estudiantes?.rut ? `(RUT ${p.estudiantes.rut})` : ""}
          </b>
          <ul>
            {(mediacion.mediacion_compromisos || [])
              .filter(
                (c) =>
                  !c.estudiante_id ||
                  c.estudiante_id === (p.estudiante_id || p.estudiantes?.id),
              )
              .map((c, j) => (
                <li key={c.id || j}>
                  • {c.descripcion} · Plazo: {mostrarFecha(c.fecha_limite)}
                </li>
              ))}
          </ul>
        </section>
      ))}
      <h4>2. REGISTRO DE FIRMAS DEL EXPEDIENTE</h4>
      <div className="med-acta-signatures">
        {[
          ...people.map((p) => ({
            id: p.estudiante_id || p.estudiantes?.id,
            name: nombreEstudiante(p.estudiantes),
          })),
          { id: "mediador", name: "Mediador responsable" },
        ].map((person) => {
          const signature = documents.find(
            (d) => d.tipo === "firma" && d.firmante === person.id && d.vigente,
          );
          return (
            <div key={person.id} className={signature ? "signed" : ""}>
              <span>{signature ? "✓" : "—"}</span>
              <b>{person.name}</b>
              <small>
                {signature ? "Firma registrada" : "Firma pendiente de registro"}
              </small>
            </div>
          );
        })}
      </div>
      <footer>
        <b>TRAZABILIDAD DEL EXPEDIENTE</b>
        <p>
          Vista de lectura de los acuerdos registrados. El archivo oficial
          corresponde al PDF descargable del servicio.
        </p>
        {mediacion.hash_sha256 && <code>SHA-256: {mediacion.hash_sha256}</code>}
      </footer>
    </article>
  );
}
