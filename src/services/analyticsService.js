import api from './api'

const withRefresh = (refresh) => (refresh ? { params: { refresh: 'true' } } : {})

export async function getResumen(refresh = false) {
  const { data } = await api.get('/analytics/resumen', withRefresh(refresh))
  return data.data
}

export async function getTendenciaMensual(refresh = false) {
  const { data } = await api.get('/analytics/tendencia-mensual', withRefresh(refresh))
  return data.data
}

export async function getPorGravedad(refresh = false) {
  const { data } = await api.get('/analytics/por-gravedad', withRefresh(refresh))
  return data.data
}

export async function getTopEstudiantes(refresh = false) {
  const { data } = await api.get('/analytics/top-estudiantes', withRefresh(refresh))
  return data.data
}

export async function getTiempoResolucion(refresh = false) {
  const { data } = await api.get('/analytics/tiempo-resolucion', withRefresh(refresh))
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

export async function getUsuariosActividad(refresh = false) {
  const { data } = await api.get('/analytics/usuarios-actividad', withRefresh(refresh))
  return data.data
}

export async function getPorAbordaje(refresh = false) {
  const { data } = await api.get('/analytics/por-abordaje', withRefresh(refresh))
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
