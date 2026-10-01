/**
 * Formatea una fecha YYYY-MM-DD o timestamp a un string DD-MM-YYYY (local Chile)
 * sin sufrir desajustes por husos horarios.
 */
export const formatDate = (dateString) => {
  if (!dateString) return ''
  const datePart = dateString.split('T')[0] 
  const [year, month, day] = datePart.split('-')
  return `${day}-${month}-${year}`
}

export const formatDateTime = (dateString) => {
  if (!dateString) return ''
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return formatDate(dateString)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${day}-${month}-${year} ${hours}:${minutes} hrs`
  } catch {
    return formatDate(dateString)
  }
}
