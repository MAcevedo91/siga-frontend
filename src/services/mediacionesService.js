import api from './api'
export const listarMediaciones = async (params = {}) =>
  (await api.get('/mediaciones', { params })).data
export const obtenerMediacion = async (id) =>
  (await api.get(`/mediaciones/${encodeURIComponent(id)}`)).data.data
export const crearMediacion = async (payload) =>
  (await api.post('/mediaciones', payload)).data.data
export const notificarApoderados = async (id, payload) =>
  (
    await api.post(
      `/mediaciones/${encodeURIComponent(id)}/notificar-apoderados`,
      payload,
    )
  ).data.data
export const guardarCompromisos = async (id, payload) =>
  (await api.put(`/mediaciones/${encodeURIComponent(id)}/compromisos`, payload))
    .data.data
export const evaluarCompromisos = async (id, payload) =>
  (
    await api.patch(
      `/mediaciones/${encodeURIComponent(id)}/evaluar-compromisos`,
      payload,
    )
  ).data.data
export const cerrarMediacion = async (id, payload) =>
  (await api.patch(`/mediaciones/${encodeURIComponent(id)}/cerrar`, payload))
    .data.data
export const despacharActa = async (id) =>
  (await api.post(`/mediaciones/${encodeURIComponent(id)}/despachar-acta`)).data
    .data
export const obtenerHistorialMediaciones = async (id) =>
  (await api.get(`/mediaciones/estudiante/${encodeURIComponent(id)}`)).data.data
export const obtenerActaPDF = async (id) =>
  (
    await api.get(`/mediaciones/${encodeURIComponent(id)}/acta-pdf`, {
      responseType: 'blob',
    })
  ).data

export const listarDocumentosMediacion = async (id) =>
  (await api.get(`/mediaciones/${encodeURIComponent(id)}/documentos`)).data.data
export const subirDocumentoMediacion = async (
  id,
  { archivo, tipo, firmante, conformidad, version },
) => {
  const form = new FormData()
  form.append('archivo', archivo)
  form.append('tipo', tipo)
  if (version) form.append('version', version)
  if (firmante) form.append('firmante', firmante)
  if (conformidad) form.append('conformidad', 'true')
  return (
    await api.post(`/mediaciones/${encodeURIComponent(id)}/documentos`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  ).data.data
}
export const descargarDocumentoMediacion = async (id, documentoId) =>
  (
    await api.get(
      `/mediaciones/${encodeURIComponent(id)}/documentos/${encodeURIComponent(documentoId)}`,
      { responseType: 'blob' },
    )
  ).data
