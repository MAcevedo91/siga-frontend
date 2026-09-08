import { useState, useEffect, useMemo } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Breadcrumbs from '@/components/shared/Breadcrumbs'
import {
  getConfiguracion,
  updateConfiguracion,
  updateReglaProtocolo,
} from '@/services/configuracionService'
import toast from 'react-hot-toast'
import {
  Settings,
  Sliders,
  Shield,
  Clock,
  AlertTriangle,
  RefreshCw,
  Save,
  Search,
  CheckCircle,
  Info,
  Calendar,
  Check,
  RotateCcw,
} from 'lucide-react'

const DEFAULT_CONFIG = {
  umbral_riesgo: 6,
  ventana_dias_riesgo: 30,
  ventana_dias_reincidencia: 45,
  ventana_dias_escalada: 15,
}

export default function ConfiguracionPage() {
  const [loading, setLoading] = useState(true)
  const [savingParams, setSavingParams] = useState(false)
  const [savingReglaId, setSavingReglaId] = useState(null)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // Parámetros analíticos
  const [parametros, setParametros] = useState(DEFAULT_CONFIG)
  const [errorsParams, setErrorsParams] = useState({})
  const [lastUpdated, setLastUpdated] = useState(null)

  // Reglas de protocolos
  const [reglas, setReglas] = useState([])
  const [searchFilter, setSearchFilter] = useState('')
  const [protocoloFilter, setProtocoloFilter] = useState('all')

  // Feedback temporal por fila al guardar regla individual
  const [savedRowSuccess, setSavedRowSuccess] = useState({})

  useEffect(() => {
    cargarConfiguracion()
  }, [])

  const cargarConfiguracion = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getConfiguracion()
      if (data?.parametros) {
        setParametros({
          umbral_riesgo: data.parametros.umbral_riesgo ?? DEFAULT_CONFIG.umbral_riesgo,
          ventana_dias_riesgo: data.parametros.ventana_dias_riesgo ?? DEFAULT_CONFIG.ventana_dias_riesgo,
          ventana_dias_reincidencia: data.parametros.ventana_dias_reincidencia ?? DEFAULT_CONFIG.ventana_dias_reincidencia,
          ventana_dias_escalada: data.parametros.ventana_dias_escalada ?? DEFAULT_CONFIG.ventana_dias_escalada,
        })
        if (data.parametros.updated_at) {
          setLastUpdated(new Date(data.parametros.updated_at).toLocaleString())
        }
      }
      if (Array.isArray(data?.reglas)) {
        setReglas(data.reglas)
      }
    } catch (err) {
      console.error('Error al cargar configuración:', err)
      setError('No se pudo cargar la configuración del establecimiento. Intente nuevamente.')
      toast.error('Error al conectar con el servidor de configuración')
    } finally {
      setLoading(false)
    }
  }

  // Validación de parámetros analíticos
  const validarParametros = () => {
    const errs = {}
    const campos = [
      { key: 'umbral_riesgo', label: 'Umbral de Score de Riesgo' },
      { key: 'ventana_dias_riesgo', label: 'Ventana de Análisis de Riesgo' },
      { key: 'ventana_dias_reincidencia', label: 'Ventana de Reincidencia' },
      { key: 'ventana_dias_escalada', label: 'Ventana de Escalada' },
    ]

    campos.forEach(({ key, label }) => {
      const val = parametros[key]
      if (val === '' || val === null || val === undefined) {
        errs[key] = `${label} es requerido`
      } else {
        const num = Number(val)
        if (!Number.isInteger(num) || num <= 0) {
          errs[key] = `${label} debe ser un número entero positivo (> 0)`
        }
      }
    })

    setErrorsParams(errs)
    return Object.keys(errs).length === 0
  }

  const handleParamChange = (field, value) => {
    const parsed = value === '' ? '' : Number(value)
    setParametros((prev) => ({ ...prev, [field]: parsed }))
    if (errorsParams[field]) {
      setErrorsParams((prev) => ({ ...prev, [field]: null }))
    }
  }

  const handleGuardarParametros = async (e) => {
    if (e) e.preventDefault()
    if (!validarParametros()) {
      toast.error('Por favor corrija los valores numéricos antes de guardar')
      return
    }

    try {
      setSavingParams(true)
      setError(null)
      const payload = {
        umbral_riesgo: Number(parametros.umbral_riesgo),
        ventana_dias_riesgo: Number(parametros.ventana_dias_riesgo),
        ventana_dias_reincidencia: Number(parametros.ventana_dias_reincidencia),
        ventana_dias_escalada: Number(parametros.ventana_dias_escalada),
      }

      const res = await updateConfiguracion(payload)
      const nowStr = new Date().toLocaleString()
      setLastUpdated(res?.updated_at ? new Date(res.updated_at).toLocaleString() : nowStr)
      setSuccessMsg('Parámetros guardados exitosamente. Los endpoints analíticos y alertas se han actualizado.')
      toast.success('Parámetros actualizados con impacto analítico inmediato')
      setTimeout(() => setSuccessMsg(null), 5000)
    } catch (err) {
      console.error('Error al guardar parámetros:', err)
      const msg = err.response?.data?.message || 'Error al guardar parámetros de configuración'
      setError(msg)
      toast.error(msg)
    } finally {
      setSavingParams(false)
    }
  }

  const handleRestablecerDefecto = () => {
    setParametros(DEFAULT_CONFIG)
    setErrorsParams({})
    toast('Valores por defecto restablecidos en el formulario. Recuerde guardar los cambios.', {
      icon: 'ℹ️',
    })
  }

  // Manejo de reglas de protocolo
  const handleReglaPlazoChange = (id, nuevoPlazo) => {
    const parsed = nuevoPlazo === '' ? '' : Number(nuevoPlazo)
    setReglas((prev) =>
      prev.map((r) => (r.id === id ? { ...r, plazo_dias: parsed } : r))
    )
  }

  const handleGuardarRegla = async (regla) => {
    const plazoNum = Number(regla.plazo_dias)
    if (!Number.isInteger(plazoNum) || plazoNum <= 0) {
      toast.error('El plazo en días debe ser un número entero mayor a 0')
      return
    }

    try {
      setSavingReglaId(regla.id)
      await updateReglaProtocolo(regla.id, {
        plazo_dias: plazoNum,
        accion: regla.accion,
        prorrogable: regla.prorrogable,
        activo: regla.activo,
      })

      setSavedRowSuccess((prev) => ({ ...prev, [regla.id]: true }))
      toast.success(`Plazo para "${regla.accion}" actualizado a ${plazoNum} días`)
      setTimeout(() => {
        setSavedRowSuccess((prev) => ({ ...prev, [regla.id]: false }))
      }, 3000)
    } catch (err) {
      console.error('Error al actualizar regla:', err)
      const msg = err.response?.data?.message || 'Error al actualizar el plazo de la regla'
      toast.error(msg)
    } finally {
      setSavingReglaId(null)
    }
  }

  // Tipos únicos de protocolo para el filtro
  const tiposDisponibles = useMemo(() => {
    const tiposMap = new Map()
    reglas.forEach((r) => {
      const tipo = r.tipo_protocolo
      if (tipo && !tiposMap.has(tipo.id)) {
        tiposMap.set(tipo.id, tipo.nombre)
      }
    })
    return Array.from(tiposMap.entries()).map(([id, nombre]) => ({ id, nombre }))
  }, [reglas])

  // Filtrado de reglas
  const reglasFiltradas = useMemo(() => {
    return reglas.filter((r) => {
      const matchSearch =
        searchFilter === '' ||
        r.accion.toLowerCase().includes(searchFilter.toLowerCase()) ||
        r.tipo_protocolo?.nombre?.toLowerCase().includes(searchFilter.toLowerCase())

      const matchProtocolo =
        protocoloFilter === 'all' ||
        String(r.tipo_protocolo_id) === String(protocoloFilter)

      return matchSearch && matchProtocolo
    })
  }, [reglas, searchFilter, protocoloFilter])

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        <Breadcrumbs items={[{ label: 'Configuración de Parámetros' }]} />

        {/* Encabezado Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl text-white shadow-md shadow-blue-500/20">
                <Settings className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Configuración y Calibración de Parámetros
              </h1>
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 max-w-3xl">
              Calibre los umbrales de detección de riesgo y los plazos legales de los 10 protocolos RICE para
              adaptar el sistema a actualizaciones normativas sin requerir cambios en el código fuente.
            </p>
          </div>

          {lastUpdated && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60 self-start sm:self-center">
              <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Última actualización: {lastUpdated}</span>
            </div>
          )}
        </div>

        {/* Notificaciones y Alertas de Estado */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Aviso de configuración</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{successMsg}</p>
          </div>
        )}

        {/* Banner Informativo de Impacto Analítico Inmediato (Criterio 5) */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/80 dark:to-indigo-950/30 border border-blue-200 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-sm">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <p className="font-semibold text-gray-900 dark:text-white">
              Impacto Inmediato en el Motor Analítico y de Alertas
            </p>
            <p>
              Cualquier cambio guardado en los umbrales o ventanas temporales se aplica inmediatamente en las
              métricas de riesgo del establecimiento, el listado de estudiantes en riesgo y los tableros de control.
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECCIÓN 1: Calibración de Umbrales y Ventanas de Análisis (Criterio 2)     */}
        {/* ========================================================================= */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Umbrales de Riesgo y Ventanas Temporales
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Parámetros matemáticos que determinan la criticidad de alertas y antecedentes de convivencia
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRestablecerDefecto}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Valores por Defecto
              </button>
            </div>
          </div>

          <form noValidate onSubmit={handleGuardarParametros} className="p-5 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Umbral de Score de Riesgo */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-900/50 border border-slate-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="umbral_riesgo" className="block text-sm font-bold text-gray-900 dark:text-white">
                    Umbral de Score de Riesgo
                  </label>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    Defecto: 6
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Puntaje mínimo acumulado para considerar que un estudiante se encuentra en estado crítico o requiere activación de protocolo.
                </p>
                <div className="relative">
                  <input
                    id="umbral_riesgo"
                    type="number"
                    min="1"
                    step="1"
                    value={parametros.umbral_riesgo}
                    onChange={(e) => handleParamChange('umbral_riesgo', e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-lg border text-sm font-semibold bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition ${
                      errorsParams.umbral_riesgo
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs text-gray-400">
                    puntos
                  </div>
                </div>
                {errorsParams.umbral_riesgo && (
                  <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errorsParams.umbral_riesgo}</p>
                )}
              </div>

              {/* Ventana de Análisis de Riesgo */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-900/50 border border-slate-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="ventana_dias_riesgo" className="block text-sm font-bold text-gray-900 dark:text-white">
                    Ventana de Análisis de Riesgo
                  </label>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    Defecto: 30 días
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Rango de días hacia atrás considerado para contabilizar la frecuencia y gravedad de incidentes en el cálculo de riesgo.
                </p>
                <div className="relative">
                  <input
                    id="ventana_dias_riesgo"
                    type="number"
                    min="1"
                    step="1"
                    value={parametros.ventana_dias_riesgo}
                    onChange={(e) => handleParamChange('ventana_dias_riesgo', e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-lg border text-sm font-semibold bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition ${
                      errorsParams.ventana_dias_riesgo
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs text-gray-400">
                    días
                  </div>
                </div>
                {errorsParams.ventana_dias_riesgo && (
                  <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errorsParams.ventana_dias_riesgo}</p>
                )}
              </div>

              {/* Ventana de Reincidencia */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-900/50 border border-slate-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="ventana_dias_reincidencia" className="block text-sm font-bold text-gray-900 dark:text-white">
                    Ventana de Reincidencia
                  </label>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    Defecto: 45 días
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Período máximo para relacionar un nuevo incidente con faltas anteriores del mismo tenor.
                </p>
                <div className="relative">
                  <input
                    id="ventana_dias_reincidencia"
                    type="number"
                    min="1"
                    step="1"
                    value={parametros.ventana_dias_reincidencia}
                    onChange={(e) => handleParamChange('ventana_dias_reincidencia', e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-lg border text-sm font-semibold bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition ${
                      errorsParams.ventana_dias_reincidencia
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs text-gray-400">
                    días
                  </div>
                </div>
                {errorsParams.ventana_dias_reincidencia && (
                  <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errorsParams.ventana_dias_reincidencia}</p>
                )}
              </div>

              {/* Ventana de Escalada Normativa */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-900/50 border border-slate-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="ventana_dias_escalada" className="block text-sm font-bold text-gray-900 dark:text-white">
                    Ventana de Escalada Normativa
                  </label>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    Defecto: 15 días
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Límite temporal antes de gatillar notificaciones preventivas y escalamiento directivo ante inacción.
                </p>
                <div className="relative">
                  <input
                    id="ventana_dias_escalada"
                    type="number"
                    min="1"
                    step="1"
                    value={parametros.ventana_dias_escalada}
                    onChange={(e) => handleParamChange('ventana_dias_escalada', e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-lg border text-sm font-semibold bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition ${
                      errorsParams.ventana_dias_escalada
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs text-gray-400">
                    días
                  </div>
                </div>
                {errorsParams.ventana_dias_escalada && (
                  <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errorsParams.ventana_dias_escalada}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingParams || loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-50 transition"
              >
                {savingParams ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Guardando parámetros...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar Parámetros Generales</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* ========================================================================= */}
        {/* SECCIÓN 2: Tabla Editable de Plazos de los 10 Protocolos RICE (Criterio 3)*/}
        {/* ========================================================================= */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 rounded-lg">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Matriz Normativa de Plazos – 10 Protocolos RICE
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Modifique los plazos legales en días exigidos para cada hito de los protocolos sin modificar código
                  </p>
                </div>
              </div>

              {/* Filtros de búsqueda */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Selector de Protocolo */}
                <select
                  aria-label="Filtrar por tipo de protocolo"
                  value={protocoloFilter}
                  onChange={(e) => setProtocoloFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-medium bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los protocolos ({tiposDisponibles.length || 10})</option>
                  {tiposDisponibles.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </option>
                  ))}
                </select>

                {/* Buscador de acción */}
                <div className="relative w-full sm:w-60">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar acción o protocolo..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de Reglas */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-900/60 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th scope="col" className="px-5 py-3.5">
                    Protocolo RICE
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-center w-16">
                    Paso
                  </th>
                  <th scope="col" className="px-5 py-3.5 min-w-[240px]">
                    Acción Normativa
                  </th>
                  <th scope="col" className="px-5 py-3.5 w-48 text-center">
                    Plazo Normativo (Días)
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-center w-28">
                    Prorrogable
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-center w-24">
                    Estado
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-center w-28">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                      Cargando matriz de reglas normativas...
                    </td>
                  </tr>
                ) : reglasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No se encontraron reglas para el filtro seleccionado.
                    </td>
                  </tr>
                ) : (
                  reglasFiltradas.map((regla) => {
                    const isSaving = savingReglaId === regla.id
                    const isSaved = savedRowSuccess[regla.id]
                    const plazoInvalido =
                      regla.plazo_dias === '' ||
                      !Number.isInteger(Number(regla.plazo_dias)) ||
                      Number(regla.plazo_dias) <= 0

                    return (
                      <tr
                        key={regla.id}
                        className="hover:bg-gray-50/70 dark:hover:bg-gray-750 transition-colors"
                      >
                        {/* Tipo de protocolo */}
                        <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-gray-700 text-slate-800 dark:text-slate-200">
                            {regla.tipo_protocolo?.nombre || `Protocolo Tipo #${regla.tipo_protocolo_id}`}
                          </span>
                        </td>

                        {/* Paso / Orden */}
                        <td className="px-3 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 text-xs font-bold">
                            {regla.orden}
                          </span>
                        </td>

                        {/* Acción */}
                        <td className="px-5 py-4 text-gray-800 dark:text-gray-200 font-medium">
                          {regla.accion}
                        </td>

                        {/* Plazo en días (editable) */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              aria-label={`Plazo para ${regla.accion}`}
                              value={regla.plazo_dias}
                              onChange={(e) => handleReglaPlazoChange(regla.id, e.target.value)}
                              className={`w-24 px-2.5 py-1.5 text-center text-sm font-bold rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition ${
                                plazoInvalido
                                  ? 'border-red-500 focus:border-red-500'
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}
                            />
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                              {regla.plazo_dias === 1 ? 'día' : 'días'}
                            </span>
                          </div>
                          {plazoInvalido && (
                            <p className="text-[11px] text-red-500 text-center mt-1">
                              Debe ser &gt; 0
                            </p>
                          )}
                        </td>

                        {/* Prorrogable */}
                        <td className="px-4 py-4 text-center">
                          {regla.prorrogable ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                              Sí
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                              No
                            </span>
                          )}
                        </td>

                        {/* Estado */}
                        <td className="px-4 py-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              regla.activo !== false
                                ? 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300'
                                : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300'
                            }`}
                          >
                            {regla.activo !== false ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>

                        {/* Botón de Guardado Individual */}
                        <td className="px-5 py-4 text-center">
                          <button
                            type="button"
                            aria-label={`Guardar regla ${regla.id}`}
                            onClick={() => handleGuardarRegla(regla)}
                            disabled={isSaving || plazoInvalido}
                            className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm ${
                              isSaved
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 hover:bg-cyan-600 hover:text-white dark:hover:bg-cyan-600 text-gray-700 dark:text-gray-200'
                            } disabled:opacity-40 disabled:cursor-not-allowed`}
                          >
                            {isSaving ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : isSaved ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Listo</span>
                              </>
                            ) : (
                              <>
                                <Save className="w-3.5 h-3.5" />
                                <span>Guardar</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}
