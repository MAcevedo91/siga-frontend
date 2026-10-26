# Integración documental Sprint 9 — coordinación con Marcelo

Responsabilidad: backend y base de datos, a cargo de Marcelo. No se requiere que Daniel ejecute SQL. Este documento describe los contratos que consume el frontend; no confirma que estén publicados.

## Capacidad documental

El detalle de mediación debe incluir `version_documental` cuando permite persistir anexos. Su ausencia mantiene operativo el expediente y desactiva la carga persistente. La captura local y descarga de firma PNG siguen disponibles.

- GET `/mediaciones/:id/documentos`: lista en `data` con id, tipo (`firma` o `acta_fisica`), mime_type, created_at y vigente.
- POST `/mediaciones/:id/documentos`: multipart `archivo`, `tipo`, `version`; firmas además `firmante` y `conformidad=true`.
- GET `/mediaciones/:id/documentos/:documentoId`: archivo binario autorizado del mismo establecimiento y expediente.
- Rechazar versiones documentales obsoletas, cambios no autorizados y cargas a expedientes cerrados. Actualizar versión cuando cambian acuerdos o responsables.

## Original de informe para especialista

El historial indica `archivo_disponible=true` únicamente cuando existe una copia almacenada. GET `/estudiantes/:id/informes-medicos/:informeId/pdf` devuelve ese PDF original, con autorización y pertenencia al estudiante/establecimiento. No regenerar un informe actual como si fuera una emisión histórica.

## Complemento conservado, sin publicar

Los cambios exploratorios del backend están preservados en el stash de siga-backend con mensaje `complemento-documental-sprint9-pendiente-marcelo-20261026`. El checkout del backend permanece limpio. No se aplicó SQL en Supabase ni se publicó este complemento. Marcelo debe revisar su integración y la activación correspondiente.

## Criterios de aceptación conjunta

Persistencia al recargar; aislamiento de establecimiento; permisos; rechazo de versiones antiguas; descarga del mismo archivo original; manejo de errores de almacenamiento; despacho real únicamente a destinatarios de prueba autorizados.
