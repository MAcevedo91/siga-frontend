import React from 'react'

/**
 * DiffViewer - Componente para visualizar cambios entre estados antes/después
 * @param {Object} props
 * @param {Object} props.changes - Objeto con los campos que cambiaron { field: { before, after } }
 */
export default function DiffViewer({ changes }) {
  if (!changes || Object.keys(changes).length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400 text-sm italic">
        Sin cambios registrados
      </p>
    )
  }

  // Función para formatear valores
  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">null</span>
    }
    if (typeof value === 'boolean') {
      return <span className="font-mono">{value ? 'true' : 'false'}</span>
    }
    if (typeof value === 'object') {
      return (
        <pre className="text-xs whitespace-pre-wrap break-words">
          {JSON.stringify(value, null, 2)}
        </pre>
      )
    }
    return <span className="break-words">{String(value)}</span>
  }

  // Función para traducir nombres de campos comunes
  const translateField = (field) => {
    const translations = {
      estado: 'Estado',
      gravedad: 'Gravedad',
      relato: 'Relato',
      medidas: 'Medidas',
      fecha: 'Fecha',
      tipo_abordaje_id: 'Tipo de Abordaje',
      usuario_id: 'Usuario',
      fecha_creacion: 'Fecha de Creación',
      fecha_actualizacion: 'Fecha de Actualización'
    }
    return translations[field] || field
  }

  return (
    <div className="space-y-3">
      {Object.entries(changes).map(([field, { before, after }]) => (
        <div
          key={field}
          className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 py-2 bg-gray-50 dark:bg-gray-900/50 rounded-r"
        >
          <div className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">
            {translateField(field)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Antes */}
            <div>
              <span className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide">
                Antes
              </span>
              <div className="mt-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded text-sm text-gray-800 dark:text-gray-200">
                {formatValue(before)}
              </div>
            </div>
            {/* Después */}
            <div>
              <span className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
                Después
              </span>
              <div className="mt-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 rounded text-sm text-gray-800 dark:text-gray-200">
                {formatValue(after)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
