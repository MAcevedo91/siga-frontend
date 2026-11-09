/**
 * Helper para exportar elementos SVG de gráficos (Recharts) a imágenes PNG en base64
 * para su inclusión de alta resolución en los reportes ejecutivos en PDF.
 */

export async function captureSvgAsPng(elementId) {
  if (typeof window === 'undefined') return null

  const container = document.getElementById(elementId)
  if (!container) return null

  const svg = container.querySelector('svg')
  if (!svg) return null

  try {
    const clonedSvg = svg.cloneNode(true)
    const rect = svg.getBoundingClientRect()
    const width = rect.width || svg.clientWidth || 600
    const height = rect.height || svg.clientHeight || 280

    clonedSvg.setAttribute('width', width)
    clonedSvg.setAttribute('height', height)

    // Clonar estilos computados básicos para mantener fuentes y colores
    const svgString = new XMLSerializer().serializeToString(clonedSvg)
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const URL = window.URL || window.webkitURL || window
    const blobURL = URL.createObjectURL(svgBlob)

    return new Promise((resolve) => {
      const image = new Image()
      image.crossOrigin = 'anonymous'

      image.onload = () => {
        const scale = 2 // Escala 2x para nitidez retina en PDF
        const canvas = document.createElement('canvas')
        canvas.width = width * scale
        canvas.height = height * scale

        const ctx = canvas.getContext('2d')
        ctx.scale(scale, scale)

        // Fondo blanco nítido para impresión/PDF
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)

        ctx.drawImage(image, 0, 0, width, height)
        URL.revokeObjectURL(blobURL)
        resolve(canvas.toDataURL('image/png'))
      }

      image.onerror = () => {
        URL.revokeObjectURL(blobURL)
        resolve(null)
      }

      image.src = blobURL
    })
  } catch (err) {
    console.warn(`Error capturando gráfico ${elementId}:`, err)
    return null
  }
}

/**
 * Captura todos los gráficos analíticos simultáneamente
 */
export async function captureAllDashboardCharts() {
  try {
    const [tendencia, gravedad, cursos, abordajes] = await Promise.all([
      captureSvgAsPng('chart-tendencia').catch(() => null),
      captureSvgAsPng('chart-gravedad').catch(() => null),
      captureSvgAsPng('chart-curso').catch(() => null),
      captureSvgAsPng('chart-abordaje').catch(() => null),
    ])

    return {
      tendencia,
      gravedad,
      cursos,
      abordajes,
    }
  } catch (error) {
    console.warn('Error capturando conjunto de gráficos:', error)
    return {}
  }
}
