import { useState } from 'react'
import { importarEstudiantes, descargarPlantilla } from '@/services/estudiantesService'

export default function ImportarEstudiantesModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)

  const handleClose = () => {
    setFile(null)
    setError(null)
    setProgress(0)
    onClose()
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async () => {
    if (!file) {
      setError('Debes seleccionar un archivo')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    setLoading(true)
    setError(null)
    setProgress(0)

    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90))
    }, 200)

    try {
      const resumen = await importarEstudiantes(formData)
      clearInterval(progressInterval)
      setProgress(100)
      setTimeout(() => {
        onSuccess(resumen)
        handleClose()
      }, 500)
    } catch (err) {
      clearInterval(progressInterval)
      setError(err.response?.data?.message || 'Error al importar archivo')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Importar Estudiantes</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="mb-4">
          <button
            onClick={descargarPlantilla}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Descargar plantilla CSV de ejemplo
          </button>
        </div>

        <div
          className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
            disabled={loading}
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              {file ? (
                <span className="font-semibold text-blue-600">{file.name}</span>
              ) : (
                <>
                  <span className="font-semibold text-blue-600">Haz clic para seleccionar</span> o arrastra un
                  archivo aquí
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-gray-500">CSV o Excel (máximo 10 MB)</p>
          </label>
        </div>

        {loading && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-gray-600">Procesando archivo...</span>
              <span className="font-semibold text-blue-600">{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !file}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Importando...' : 'Importar'}
          </button>
        </div>
      </div>
    </div>
  )
}
