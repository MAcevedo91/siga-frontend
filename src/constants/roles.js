/**
 * Definición centralizada de roles y grupos de permisos RBAC para SIGA Escolar.
 * Soporta los nuevos perfiles de Convivencia Escolar y mantiene retrocompatibilidad.
 */

export const ROLES = {
  ADMINISTRADOR: 'Administrador',
  COORDINADOR_CONVIVENCIA: 'Coordinador de Convivencia Escolar',
  ORIENTADOR: 'Orientador',
  PSICOLOGO: 'Psicólogo',
  ASISTENTE_SOCIAL: 'Asistente Social',
  DIRECTIVA: 'Directiva',
  DIRECTIVO: 'Directivo', // Retrocompatibilidad
  INSPECTOR: 'Inspector',
  DOCENTE: 'Docente',
  EQUIPO_FORMACION: 'Equipo de Formación', // Retrocompatibilidad
}

// Lista oficial para selectores de asignación de usuarios
export const ROLES_DISPONIBLES = [
  ROLES.ADMINISTRADOR,
  ROLES.COORDINADOR_CONVIVENCIA,
  ROLES.ORIENTADOR,
  ROLES.PSICOLOGO,
  ROLES.ASISTENTE_SOCIAL,
  ROLES.DIRECTIVA,
  ROLES.INSPECTOR,
  ROLES.DOCENTE,
]

// Roles que desmenuzan el Equipo de Formación / Convivencia Escolar
export const ROLES_CONVIVENCIA = [
  ROLES.COORDINADOR_CONVIVENCIA,
  ROLES.ORIENTADOR,
  ROLES.PSICOLOGO,
  ROLES.ASISTENTE_SOCIAL,
  ROLES.EQUIPO_FORMACION,
]

// Roles Directivos
export const ROLES_DIRECTIVOS = [
  ROLES.DIRECTIVA,
  ROLES.DIRECTIVO,
]

// Permisos agrupados
export const ROLES_GESTION_CASOS = [
  ROLES.ADMINISTRADOR,
  ...ROLES_CONVIVENCIA,
]

export const ROLES_DASHBOARD_ANALYTICS = [
  ROLES.ADMINISTRADOR,
  ...ROLES_CONVIVENCIA,
  ...ROLES_DIRECTIVOS,
]

export const ROLES_CIERRE_ANIO = [
  ROLES.ADMINISTRADOR,
  ROLES.INSPECTOR,
  ...ROLES_CONVIVENCIA,
  ...ROLES_DIRECTIVOS,
]

export const ROLES_CREACION_INCIDENTES = [
  ROLES.ADMINISTRADOR,
  ...ROLES_CONVIVENCIA,
  ROLES.INSPECTOR,
  ROLES.DOCENTE,
]

export const ROLES_GESTION_REPORTES = [
  ROLES.ADMINISTRADOR,
  ...ROLES_DIRECTIVOS,
  ...ROLES_CONVIVENCIA,
  ROLES.INSPECTOR,
]

export const ROLES_APROBACION_REPORTES = [
  ROLES.ADMINISTRADOR,
  ...ROLES_DIRECTIVOS,
  ...ROLES_CONVIVENCIA,
]
