import { useState, useEffect } from 'react'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { CalendarDays, ClipboardCheck, UsersRound } from 'lucide-react'

const ESTADOS = {
  Presente: { icon: '✓', color: 'bg-green-500', label: 'Presente' },
  Ausente: { icon: '✗', color: 'bg-red-500', label: 'Ausente' },
  Atrasado: { icon: '⏰', color: 'bg-yellow-500', label: 'Atrasado' }
}

export default function AsistenciaChecklist({ curso, fecha, onGuardar, onCancelar }) {
  const [estudiantes, setEstudiantes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAsistencia()
  }, [curso.id, fecha])

  const fetchAsistencia = async () => {
    try {
      const response = await api.get(`/asistencia/curso/${curso.id}/fecha/${fecha}`)
      setEstudiantes(response.data.data)
    } catch (error) {
      toast.error('Error cargando asistencia')
    } finally {
      setLoading(false)
    }
  }

  const handleEstadoChange = (estudianteId, nuevoEstado) => {
    setEstudiantes(prev =>
      prev.map(est =>
        est.estudianteId === estudianteId
          ? { ...est, estado: nuevoEstado }
          : est
      )
    )
  }

  const handleMarcarTodos = (estado) => {
    setEstudiantes(prev => prev.map(est => ({ ...est, estado })))
  }

  const handleGuardar = () => {
    const asistencias = estudiantes.map(est => ({
      estudianteId: est.estudianteId,
      estado: est.estado || 'Presente' // Default a Presente si no se marcó
    }))

    onGuardar(asistencias)
  }

  if (loading) return <div className="rounded-2xl bg-white p-8 text-center text-gray-600 dark:bg-gray-800 dark:text-gray-300">Cargando...</div>

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-cyan-100 bg-gradient-to-r from-cyan-50 via-blue-50 to-indigo-50 p-5 dark:border-gray-700 dark:from-cyan-950/60 dark:via-blue-950/40 dark:to-gray-800 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-700 dark:text-cyan-300">Registro de asistencia</span>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">{curso.nombre}</h2>
            <p className="mt-2 flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300"><CalendarDays size={16} />{fecha}</p>
          </div>
          <span className="flex items-center gap-2 self-start rounded-full border border-cyan-200 bg-white/80 px-3 py-1.5 text-sm font-semibold text-cyan-800 dark:border-cyan-800 dark:bg-gray-900/60 dark:text-cyan-200"><UsersRound size={16} />{estudiantes.length} estudiantes</span>
        </div>
      </div>
      <div className="p-4 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">Marca presente, ausente o atrasado para cada estudiante.</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleMarcarTodos('Presente')}
              data-testid="marcar-todos-presente"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500"
            >
              Marcar todos Presente
            </button>
            <button
              onClick={onCancelar}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            >
              Cancelar
            </button>
          </div>
        </div>

      <div className="mb-6 space-y-3">
        {estudiantes.map((estudiante) => (
          <div
            key={estudiante.estudianteId}
            className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700 dark:bg-gray-900/40"
          >
            <span className="font-semibold text-gray-900 dark:text-white">
              {estudiante.apellido}, {estudiante.nombre}
            </span>

            <div className="flex gap-2">
              {Object.entries(ESTADOS).map(([estado, config]) => (
                <button
                  key={estado}
                  type="button"
                  data-testid={`estudiante-${estudiante.estudianteId}-${estado.toLowerCase()}`}
                  onClick={() => handleEstadoChange(estudiante.estudianteId, estado)}
                  aria-label={`${estado}: ${estudiante.apellido}, ${estudiante.nombre}`}
                  aria-pressed={estudiante.estado === estado}
                  className={`
                    flex h-11 w-11 items-center justify-center rounded-xl font-bold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500
                    ${estudiante.estado === estado ? `${config.color} scale-105 text-white shadow-md ring-2 ring-offset-2 ring-blue-300 dark:ring-offset-gray-800` : 'bg-white text-gray-500 ring-1 ring-gray-300 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:ring-gray-600'}
                  `}
                  title={config.label}
                >
                  {config.icon}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

        <button
          onClick={handleGuardar}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 py-3 font-bold text-white shadow-md shadow-blue-500/20 hover:from-cyan-700 hover:to-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          <ClipboardCheck size={19} />Guardar Asistencia
        </button>
      </div>
    </div>
  )
}
