import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function exportIncidentesToExcel(incidentes = []) {
  const data = incidentes.map((inc) => ({
    Fecha: inc.fecha ? new Date(inc.fecha).toLocaleDateString('es-CL') : '',
    Estudiante: `${inc.estudiante?.nombre || ''} ${inc.estudiante?.apellido || ''}`.trim(),
    RUT: inc.estudiante?.rut || '',
    Gravedad: inc.gravedad || '',
    Estado: inc.estado || '',
    Descripción: inc.descripcion || '',
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Incidentes')
  XLSX.writeFile(workbook, `incidentes_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export function exportIncidentesToPDF(incidentes = []) {
  const doc = new jsPDF()
  doc.text('Reporte de Incidentes', 14, 15)

  const head = [['Fecha', 'Estudiante', 'RUT', 'Gravedad', 'Estado', 'Descripción']]
  const body = incidentes.map((inc) => [
    inc.fecha ? new Date(inc.fecha).toLocaleDateString('es-CL') : '',
    `${inc.estudiante?.nombre || ''} ${inc.estudiante?.apellido || ''}`.trim(),
    inc.estudiante?.rut || '',
    inc.gravedad || '',
    inc.estado || '',
    (inc.descripcion || '').slice(0, 50),
  ])

  autoTable(doc, {
    head,
    body,
    startY: 20,
    styles: { fontSize: 8 },
  })

  doc.save(`incidentes_${new Date().toISOString().slice(0, 10)}.pdf`)
}

export function exportEstudiantesToExcel(estudiantes = []) {
  const data = estudiantes.map((est) => ({
    RUT: est.rut || '',
    Nombre: `${est.nombre || ''} ${est.apellido || ''}`.trim(),
    Curso: est.curso || '',
    'Estado Matrícula': est.estado_matricula || '',
    Apoderado: est.apoderado?.nombre || 'Sin apoderado',
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Estudiantes')
  XLSX.writeFile(workbook, `estudiantes_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export function exportEstudiantesToPDF(estudiantes = []) {
  const doc = new jsPDF()
  doc.text('Listado de Estudiantes', 14, 15)

  const head = [['RUT', 'Nombre', 'Curso', 'Estado Matrícula', 'Apoderado']]
  const body = estudiantes.map((est) => [
    est.rut || '',
    `${est.nombre || ''} ${est.apellido || ''}`.trim(),
    est.curso || '',
    est.estado_matricula || '',
    est.apoderado?.nombre || 'Sin apoderado',
  ])

  autoTable(doc, {
    head,
    body,
    startY: 20,
    styles: { fontSize: 8 },
  })

  doc.save(`estudiantes_${new Date().toISOString().slice(0, 10)}.pdf`)
}
