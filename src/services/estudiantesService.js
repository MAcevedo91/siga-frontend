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

export const descargarPlantilla = () => {
  const csvContent = 'rut,nombre,apellido,fecha_nacimiento,genero,curso_id,apoderado_nombre,apoderado_email,apoderado_telefono\n12345678-9,Juan,Pérez,2010-05-15,M,1,María Pérez,maria@example.com,+56912345678'
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
