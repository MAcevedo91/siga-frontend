import React, { useState, useEffect } from 'react'
import { Clock, User, AlertCircle } from 'lucide-react'
import DiffViewer from '../components/audit/DiffViewer'
import api from '../services/api'

/**
 * AuditLog - Página para visualizar el historial de cambios de un registro
 * @param {Object} props
 * @param {string} props.tabla - Nombre de la tabla (ej: 'incidentes', 'estudiantes')
 * @param {string} props.registroId - ID del registro a auditar
 */
export default function AuditLog({ tabla, registroId }) {
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchAuditLog() {
      if (!tabla || !registroId) {
        setError('Faltan parámetros: tabla y registroId son requeridos')
        setLoading(false)
        return
      }

      try {
        const { data } = await api.get('/auditoria/timeline', {
          params: { tabla, registroId }
        })
        setAuditLogs(data)
      } catch (err) {
        console.error('Error fetching audit log:', err)
        setError(err.response?.data?.error || 'Error al cargar el historial de auditoría')
      } finally {
        setLoading(false)
      }
    }

    fetchAuditLog()
  }, [tabla, registroId])

  // Función para formatear fecha en español chileno
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Función para obtener el color del badge según la acción
  const getActionBadgeClass = (accion) => {
    switch (accion) {
      case 'CREATE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'DELETE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'LOGIN':
      case 'LOGOUT':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  // Función para traducir acciones
  const translateAction = (accion) => {
    const translations = {
      CREATE: 'Creación',
      UPDATE: 'Actualización',
      DELETE: 'Eliminación',
      LOGIN: 'Inicio de sesión',
      LOGOUT: 'Cierre de sesión',
      LOGIN_FAILED: 'Intento de inicio de sesión fallido'
    }
    return translations[accion] || accion
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Error</span>
        </div>
        <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>
      </div>
    )
  }

  if (auditLogs.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
        <Clock className="w-12 h-12 mx-auto text-gray-400 mb-2" />
        <p className="text-gray-600 dark:text-gray-400">
          No hay historial de cambios para este registro
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Historial de Cambios
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {auditLogs.length} {auditLogs.length === 1 ? 'registro' : 'registros'} de auditoría
        </p>
      </div>

      <div className="space-y-4">
        {auditLogs.map((log, index) => (
          <div
            key={log.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-5 transition-all hover:shadow-lg"
          >
            {/* Header del log */}
            <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-2">
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {log.usuarios?.nombre} {log.usuarios?.apellido}
                  </div>
                  {log.usuarios?.email && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {log.usuarios.email}
                    </div>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getActionBadgeClass(log.accion)}`}>
                  {translateAction(log.accion)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                <Clock className="w-4 h-4" />
                <span>{formatDate(log.fecha_hora)}</span>
              </div>
            </div>

            {/* Diff Viewer */}
            {log.cambios && Object.keys(log.cambios).length > 0 ? (
              <DiffViewer changes={log.cambios} />
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                {log.accion === 'CREATE'
                  ? 'Registro creado'
                  : log.accion === 'DELETE'
                  ? 'Registro eliminado'
                  : 'Sin cambios específicos'}
              </p>
            )}

            {/* Additional metadata */}
            {log.ip && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  IP: {log.ip}
                </span>
              </div>
            )}

            {/* Timeline indicator */}
            {index < auditLogs.length - 1 && (
              <div className="absolute left-8 h-8 w-0.5 bg-gray-300 dark:bg-gray-600 mt-2"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
