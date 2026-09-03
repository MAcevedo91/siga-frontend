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
