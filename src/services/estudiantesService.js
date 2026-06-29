import api from './api'

export const getEstudiantes = async (params = {}) => {
  const response = await api.get('/estudiantes', { params })
  return response.data.data
}

export const getEstudianteById = async (id) => {
  const response = await api.get(`/estudiantes/${id}/perfil`)
  return response.data.data
}

export const createEstudiante = async (estudianteData) => {
  const response = await api.post('/estudiantes', estudianteData)
  return response.data.data
}

export const updateEstudiante = async (id, estudianteData) => {
  const response = await api.put(`/estudiantes/${id}`, estudianteData)
  return response.data.data
}

export const importarEstudiantes = async (formData) => {
  const response = await api.post('/estudiantes/importar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data.data
}

export const descargarPDF = async (id, nombreArchivo) => {
  const response = await api.get(`/estudiantes/${id}/pdf`, {
    responseType: 'blob',
  })
  const url  = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href  = url
  link.setAttribute('download', nombreArchivo || `historial_${id}.pdf`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export const descargarPlantilla = () => {
  const csvContent = 'rut,nombre,apellido,curso,apoderado_nombre,apoderado_apellido,apoderado_telefono,apoderado_email\n11111111-1,Juan,Pérez,7° Básico A,María,González,+56912345678,maria@example.com'
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', 'plantilla_estudiantes.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
