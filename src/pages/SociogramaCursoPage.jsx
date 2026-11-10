import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CursoSociogramaTab from "@/components/sociograma/CursoSociogramaTab";
import { obtenerCursosSociograma } from "@/services/sprint9Service";
import { mensajeError } from "@/utils/mediaciones";
import {
  PageTitle,
  ErrorBox,
  Field,
  inputClass,
} from "@/components/mediaciones/MediacionUI";

export default function SociogramaCursoPage() {
  const [params, setParams] = useSearchParams(),
    cursoId = params.get("curso") || "";
  const [courses, setCourses] = useState([]),
    [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    obtenerCursosSociograma()
      .then((r) => active && setCourses(Array.isArray(r) ? r : r?.items || []))
      .catch((e) => active && setError(mensajeError(e)));
    return () => {
      active = false;
    };
  }, []);

  const cursoSeleccionado = courses.find((c) => String(c.id) === String(cursoId));

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

        <CursoSociogramaTab
          cursoId={cursoId}
          cursoNombre={cursoSeleccionado?.nombre}
        />
      </div>
    </DashboardLayout>
  );
}
