// A single incident can involve several students in the same course.
// Count it once for each affected course in the selected academic year.
export function resumirIncidentesPorCurso(estudiantes, incidentes, anio) {
  const cursoPorEstudiante = new Map(
    estudiantes.map((estudiante) => [String(estudiante.id), estudiante.curso_id || estudiante.curso?.id])
  )
  const resumen = {}

  for (const incidente of incidentes) {
    if (String(incidente.fecha || '').slice(0, 4) !== String(anio)) continue
    if (!['Leve', 'Grave', 'Gravísima'].includes(incidente.gravedad)) continue

    const cursosDelIncidente = new Set(
      (incidente.incidente_estudiantes || [])
        .map(({ estudiante_id }) => cursoPorEstudiante.get(String(estudiante_id)))
        .filter(Boolean)
    )

    for (const cursoId of cursosDelIncidente) {
      resumen[cursoId] ||= { Leve: 0, Grave: 0, 'Gravísima': 0 }
      resumen[cursoId][incidente.gravedad] += 1
    }
  }

  return resumen
}
