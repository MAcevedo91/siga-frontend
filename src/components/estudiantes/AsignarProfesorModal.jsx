import { useState, useEffect } from 'react'
import { getUsuarios } from '@/services/usuariosService'
import { asignarProfesorJefe } from '@/services/cursosService'
import { UserCheck, KeyRound, Eye, EyeOff, AlertTriangle, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AsignarProfesorModal({ isOpen, onClose, curso, onProfesorActualizado }) {
  const [docentes, setDocentes] = useState([])
  const [loadingDocentes, setLoadingDocentes] = useState(true)
  const [profesorSeleccionado, setProfesorSeleccionado] = useState('')
  const [passwordConfirmacion, setPasswordConfirmacion] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen) {
      setPasswordConfirmacion('')
      setError(null)
      setShowPassword(false)
      // Inicializar con el profesor jefe actual
      const actualId = curso?.profesor_jefe?.id || (typeof curso?.profesor_jefe === 'object' ? curso?.profesor_jefe?.id : '')
      setProfesorSeleccionado(actualId || '')
      cargarDocentes()
    }
  }, [isOpen, curso])

  const cargarDocentes = async () => {
    try {
      setLoadingDocentes(true)
      const todos = await getUsuarios()
      // Filtrar únicamente docentes registrados y activos
      const disponibles = (todos || []).filter(
        (u) => u.activo && (u.rol === 'Docente' || u.rol === 'Profesor')
      )
      setDocentes(disponibles)
    } catch (err) {
      console.error('Error cargando docentes:', err)
      toast.error('No se pudo cargar la lista de docentes')
    } finally {
      setLoadingDocentes(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!passwordConfirmacion) {
      setError('Debes ingresar tu contraseña para autorizar el cambio')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const payload = {
        profesor_jefe_id: profesorSeleccionado || null,
        password_confirmacion: passwordConfirmacion,
      }

      const res = await asignarProfesorJefe(curso.id, payload)
      toast.success(
        res.profesor_jefe
          ? `Profesor jefe ${res.profesor_jefe.nombre} asignado a ${curso.nombre}`
          : `Jefatura desasignada de ${curso.nombre}`
      )
      onProfesorActualizado(res.profesor_jefe)
      onClose()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error al asignar profesor jefe'
      setError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen || !curso) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800 dark:border dark:border-gray-700">
        {/* Cabecera Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/80 dark:text-blue-300">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Asignar Profesor Jefe
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Curso: <span className="font-semibold text-blue-600 dark:text-blue-400">{curso.nombre}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl bg-red-50 p-3 text-xs text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Selector de Docente */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Docente Asignado
            </label>
            <select
              value={profesorSeleccionado}
              onChange={(e) => setProfesorSeleccionado(e.target.value)}
              disabled={loadingDocentes || submitting}
              className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">-- Sin profesor jefe asignado --</option>
              {docentes.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre} {d.apellido} - {d.email}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">
              Solo se listan docentes registrados y activos en el establecimiento.
            </p>
          </div>

          {/* Campo de Contraseña de Autorización */}
          <div className="rounded-xl bg-amber-50/70 p-4 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800/60">
            <div className="flex items-center gap-2 mb-2">
              <KeyRound className="h-4 w-4 text-amber-700 dark:text-amber-400" />
              <label className="text-xs font-bold text-amber-900 dark:text-amber-300">
                Confirmación de Seguridad Obligatoria
              </label>
            </div>
            <p className="text-xs text-amber-800/90 dark:text-amber-300/80 mb-3 leading-relaxed">
              Para garantizar que este cambio institucional está debidamente autorizado, ingresa tu contraseña institucional de inicio de sesión:
            </p>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordConfirmacion}
                onChange={(e) => setPasswordConfirmacion(e.target.value)}
                placeholder="Ingresa tu contraseña actual"
                disabled={submitting}
                required
                className="w-full rounded-xl border border-amber-300 bg-white py-2 pl-3.5 pr-10 text-sm text-gray-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-60 transition-all"
            >
              {submitting ? 'Verificando y Guardando...' : 'Autorizar y Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
