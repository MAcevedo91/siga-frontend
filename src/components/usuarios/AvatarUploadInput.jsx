import React, { useState, useEffect, useRef } from 'react'
import { Camera, Trash2, Upload, UserRound } from 'lucide-react'
import toast from 'react-hot-toast'

const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function AvatarUploadInput({
  currentAvatarUrl = null,
  nombre = '',
  apellido = '',
  onFileSelect,
  onRemoveCurrent,
  disabled = false,
}) {
  const [previewUrl, setPreviewUrl] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    // Si cambia el currentAvatarUrl y no hay preview local activo, sincronizar
    if (!previewUrl) {
      // previewUrl es null
    }
  }, [currentAvatarUrl])

  // Limpiar URL del preview al desmontar
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo MIME
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      toast.error('Formato no válido. Solo se permiten imágenes JPEG, PNG o WebP.')
      e.target.value = ''
      return
    }

    // Validar tamaño máximo
    if (file.size > MAX_SIZE_BYTES) {
      toast.error('La imagen excede el límite de 2 MB permitido.')
      e.target.value = ''
      return
    }

    // Revocar preview anterior si era blob
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }

    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    if (onFileSelect) {
      onFileSelect(file)
    }
  }

  const handleRemove = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (onFileSelect) {
      onFileSelect(null)
    }
    if (onRemoveCurrent) {
      onRemoveCurrent()
    }
  }

  const getInitials = () => {
    const n = (nombre || '').trim()[0] || ''
    const a = (apellido || '').trim()[0] || ''
    return (n + a).toUpperCase() || '?'
  }

  const activeImage = previewUrl || currentAvatarUrl

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-xl border border-dashed border-gray-200 bg-gray-50/60">
      {/* Contenedor del avatar circular */}
      <div className="relative group shrink-0">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-white shadow-md flex items-center justify-center text-white">
          {activeImage ? (
            <img
              src={activeImage}
              alt={`Foto de ${nombre || 'usuario'}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback a iniciales si la URL falla
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <span className="text-xl font-bold tracking-wider">{getInitials()}</span>
          )}
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
          className="absolute inset-0 rounded-full bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
          title="Cambiar foto de perfil"
        >
          <Camera className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium">Cambiar</span>
        </button>
      </div>

      {/* Acciones y textos de ayuda */}
      <div className="flex-1 text-center sm:text-left">
        <p className="text-xs font-semibold text-gray-800 mb-1">Foto de Perfil Profesional</p>
        <p className="text-[11px] text-gray-500 mb-2.5 leading-relaxed">
          PNG, JPG o WebP. Máximo 2 MB. Se optimizará y guardará en Supabase Storage.
        </p>

        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={disabled}
            className="hidden"
          />

          <button
            type="button"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-xs disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            {activeImage ? 'Reemplazar foto' : 'Subir foto'}
          </button>

          {activeImage && (
            <button
              type="button"
              disabled={disabled}
              onClick={handleRemove}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
              title="Quitar foto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Quitar foto
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
