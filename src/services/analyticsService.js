import api from './api'

export async function getResumen() {
  const { data } = await api.get('/analytics/resumen')
  return data.data
}

export async function getTendenciaMensual() {
  const { data } = await api.get('/analytics/tendencia-mensual')
  return data.data
}

export async function getPorGravedad() {
  const { data } = await api.get('/analytics/por-gravedad')
  return data.data
}

export async function getTopEstudiantes() {
  const { data } = await api.get('/analytics/top-estudiantes')
  return data.data
}

export async function getTiempoResolucion() {
  const { data } = await api.get('/analytics/tiempo-resolucion')
  return data.data
}

export async function getMapaCalorCursos(anio) {
  const { data } = await api.get('/analytics/mapa-calor-cursos', {
    params: anio ? { anio } : {}
  })
  return data.data
}

export async function getDetalleCeldaMapaCalor({ cursoId, mes, anio }) {
  const { data } = await api.get('/analytics/mapa-calor-cursos/detalle', {
    params: { curso_id: cursoId, mes, anio }
  })
  return data.data
}

export async function getUsuariosActividad() {
  const { data } = await api.get('/analytics/usuarios-actividad')
  return data.data
}

export async function getPorAbordaje() {
  const { data } = await api.get('/analytics/por-abordaje')
  return data.data
}

export async function descargarReporteMensualPdf(graficos = {}) {
  const tieneGraficos = graficos && Object.keys(graficos).length > 0
  const response = tieneGraficos
    ? await api.post('/analytics/reporte-mensual-pdf', { graficos }, { responseType: 'blob' })
    : await api.get('/analytics/reporte-mensual-pdf', { responseType: 'blob' })

  const now = new Date()
  const mesStr = now.toLocaleDateString('es-CL', { month: '2-digit', year: 'numeric' }).replace('/', '-')
  const filename = `Reporte_Ejecutivo_Convivencia_${mesStr}.pdf`

  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
  return true
}
