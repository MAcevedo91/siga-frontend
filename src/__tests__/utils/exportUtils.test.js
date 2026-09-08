import { describe, it, expect, vi } from 'vitest'
import {
  exportIncidentesToExcel,
  exportIncidentesToPDF,
  exportEstudiantesToExcel,
  exportEstudiantesToPDF,
} from '@/utils/exportUtils'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'

vi.mock('xlsx', () => ({
  utils: {
    json_to_sheet: vi.fn(() => ({})),
    book_new: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}))

vi.mock('jspdf', () => {
  return {
    default: vi.fn().mockImplementation(function () {
      this.text = vi.fn()
      this.save = vi.fn()
    }),
  }
})

vi.mock('jspdf-autotable', () => ({
  default: vi.fn(),
}))

describe('exportUtils', () => {
  const incidentes = [
    {
      id: 1,
      fecha: '2026-03-01T10:00:00Z',
      estudiante: { nombre: 'Juan', apellido: 'Pérez', rut: '12.345.678-9' },
      gravedad: 'Grave',
      estado: 'Abierto',
      descripcion: 'Incidente de prueba',
    },
  ]

  const estudiantes = [
    {
      id: 1,
      rut: '12.345.678-9',
      nombre: 'Juan',
      apellido: 'Pérez',
      curso: '1° Básico A',
      estado_matricula: 'Activo',
      apoderado: { nombre: 'María Pérez' },
    },
  ]

  it('exports incidentes to Excel', () => {
    exportIncidentesToExcel(incidentes)
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalled()
    expect(XLSX.writeFile).toHaveBeenCalled()
  })

  it('exports incidentes to PDF', () => {
    exportIncidentesToPDF(incidentes)
    expect(jsPDF).toHaveBeenCalled()
  })

  it('exports estudiantes to Excel', () => {
    exportEstudiantesToExcel(estudiantes)
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalled()
    expect(XLSX.writeFile).toHaveBeenCalled()
  })

  it('exports estudiantes to PDF', () => {
    exportEstudiantesToPDF(estudiantes)
    expect(jsPDF).toHaveBeenCalled()
  })
})
