import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate } from './formatDate'

export function exportIncidentesToExcel(incidentes = []) {
  const data = incidentes.map((inc) => {
    const estudianteTexto = inc.estudiante
      ? `${inc.estudiante.nombre || ''} ${inc.estudiante.apellido || ''}`.trim()
      : inc.estudiantes_count !== undefined
      ? `${inc.estudiantes_count} involucrado(s)`
      : inc.estudiante_nombre || ''

    return {
      Fecha: inc.fecha ? formatDate(inc.fecha) : '',
      Estudiante: estudianteTexto,
      RUT: inc.estudiante?.rut || '',
      Gravedad: inc.gravedad || '',
      Estado: inc.estado || '',
      'Relato / Descripción': inc.relato || inc.descripcion || '',
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Incidentes')
  XLSX.writeFile(workbook, `incidentes_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export function exportIncidentesToPDF(incidentes = []) {
  const doc = new jsPDF()
  doc.text('Reporte de Incidentes', 14, 15)

  const head = [['Fecha', 'Estudiante', 'RUT', 'Gravedad', 'Estado', 'Relato / Descripción']]
  const body = incidentes.map((inc) => {
    const estudianteTexto = inc.estudiante
      ? `${inc.estudiante.nombre || ''} ${inc.estudiante.apellido || ''}`.trim()
      : inc.estudiantes_count !== undefined
      ? `${inc.estudiantes_count} involucrado(s)`
      : inc.estudiante_nombre || ''

    return [
      inc.fecha ? formatDate(inc.fecha) : '',
      estudianteTexto,
      inc.estudiante?.rut || '',
      inc.gravedad || '',
      inc.estado || '',
      (inc.relato || inc.descripcion || '').slice(0, 50),
    ]
  })

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
    Curso: (typeof est.curso === 'object' ? est.curso?.nombre : est.curso) || est.curso_nombre || 'Sin curso',
    'Estado Matrícula': est.estado_matricula || (est.activo !== undefined ? (est.activo ? 'Activo' : 'Inactivo') : 'Activo'),
    Apoderado: est.apoderado?.nombre
      ? `${est.apoderado.nombre} ${est.apoderado.apellido || ''}`.trim()
      : typeof est.apoderado === 'string'
      ? est.apoderado
      : 'Sin apoderado',
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
    (typeof est.curso === 'object' ? est.curso?.nombre : est.curso) || est.curso_nombre || 'Sin curso',
    est.estado_matricula || (est.activo !== undefined ? (est.activo ? 'Activo' : 'Inactivo') : 'Activo'),
    est.apoderado?.nombre
      ? `${est.apoderado.nombre} ${est.apoderado.apellido || ''}`.trim()
      : typeof est.apoderado === 'string'
      ? est.apoderado
      : 'Sin apoderado',
  ])

  autoTable(doc, {
    head,
    body,
    startY: 20,
    styles: { fontSize: 8 },
  })

  doc.save(`estudiantes_${new Date().toISOString().slice(0, 10)}.pdf`)
}
