import { useState, useEffect } from 'react'
import { X, ArrowLeftRight, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { cambiarCursoEstudiante } from '@/services/estudiantesService'
import api from '@/services/api'

const MOTIVOS_REASIGNACION = [
  'Resolución de conflicto / Convivencia escolar (separación de pares)',
  'Ajuste pedagógico o necesidades de aprendizaje',
  'Solicitud justificada de apoderado',
  'Reorganización administrativa institucional',
  'Otro motivo fundado',
]

export default function ReasignarCursoModal({
  isOpen,
  onClose,
  estudiante,
  cursos = [],
  onSuccess,
}) {
  const [listaCursos, setListaCursos] = useState(cursos)
  const [cursoDestinoId, setCursoDestinoId] = useState('')
  const [motivo, setMotivo] = useState(MOTIVOS_REASIGNACION[0])
  const [observacion, setObservacion] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (cursos && cursos.length > 0) {
      setListaCursos(cursos)
    } else if (isOpen) {
      api
        .get('/cursos')
        .then((res) => setListaCursos(res.data?.data || res.data || []))
        .catch(() => {})
    }
  }, [cursos, isOpen])

  if (!isOpen || !estudiante) return null

  const cursoActualId = estudiante.curso_id || estudiante.curso?.id
  const cursoActualNombre = estudiante.curso?.nombre || 'Sin curso asignado'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!cursoDestinoId) {
      setError('Debes seleccionar un curso de destino')
      return
    }

    if (String(cursoDestinoId) === String(cursoActualId)) {
      setError('El curso de destino debe ser diferente al curso actual')
      return
    }

    try {
      setSubmitting(true)
      const res = await cambiarCursoEstudiante(estudiante.id, {
        curso_id: Number(cursoDestinoId),
        motivo,
        observacion: observacion.trim() || undefined,
      })

      toast.success(
        `Estudiante ${estudiante.nombre} ${estudiante.apellido} reasignado exitosamente al curso ${res.curso?.nombre || ''}`
      )

      if (onSuccess) {
        onSuccess(res)
      }
      onClose()
    } catch (err) {
      console.error('Error al reasignar curso:', err)
      setError(
        err.response?.data?.message ||
        err.message ||
        'Ocurrió un error al intentar cambiar de curso al estudiante'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 dark:border-gray-700">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Reasignar Curso / Paralelo
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Cambio de sección durante el período lectivo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 p-3.5 text-xs text-rose-800 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Ficha rápida del estudiante */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 dark:bg-gray-750 dark:border-gray-700">
            <div className="flex justify-between items-center text-xs">
              <div>
                <span className="text-gray-500 block text-[11px] uppercase tracking-wider font-semibold">Estudiante</span>
                <span className="font-bold text-gray-900 text-sm dark:text-white">
                  {estudiante.nombre} {estudiante.apellido}
                </span>
                <span className="font-mono text-gray-500 ml-2">({estudiante.rut})</span>
              </div>
              <div className="text-right">
                <span className="text-gray-500 block text-[11px] uppercase tracking-wider font-semibold">Curso Actual</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  {cursoActualNombre}
                </span>
              </div>
            </div>
          </div>

          {/* Selector de Curso Destino */}
          <div>
            <label htmlFor="cursoDestinoId" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 dark:text-gray-300">
              Curso de Destino <span className="text-rose-500">*</span>
            </label>
            <select
              id="cursoDestinoId"
              value={cursoDestinoId}
              onChange={(e) => setCursoDestinoId(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Seleccione el nuevo curso o paralelo...</option>
              {listaCursos.map((c) => {
                const esActual = String(c.id) === String(cursoActualId)
                return (
                  <option key={c.id} value={c.id} disabled={esActual}>
                    {c.nombre} {esActual ? '(Curso actual)' : ''}
                  </option>
                )
              })}
            </select>
            <p className="mt-1 text-[11px] text-gray-500">
              Ejemplo: pase de 8° Básico A a 8° Básico B por resolución de conflicto.
            </p>
          </div>

          {/* Motivo de Reasignación */}
          <div>
            <label htmlFor="motivoReasignacion" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 dark:text-gray-300">
              Motivo de la Reasignación <span className="text-rose-500">*</span>
            </label>
            <select
              id="motivoReasignacion"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              {MOTIVOS_REASIGNACION.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Observación adicional */}
          <div>
            <label htmlFor="observacionReasignacion" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 dark:text-gray-300">
              Observación o Justificación del Equipo <span className="text-gray-400 font-normal">(Opcional)</span>
            </label>
            <textarea
              id="observacionReasignacion"
              rows={3}
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Indique acuerdos con apoderado, recomendación de Convivencia Escolar o antecedentes pedagógicos..."
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !cursoDestinoId}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:bg-blue-700 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Reasignando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Confirmar Reasignación</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
