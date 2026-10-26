# Sprint 9 — validación del frontend

Fecha: 26 de octubre de 2026. Base frontend develop d90ad04; contratos contrastados con backend develop be4a0aa. No se modificaron estados de Jira ni la base compartida.

## Alcance de Daniel

| Tarea | Implementación frontend | Validación disponible |
|---|---|---|
| SE-118 | Formulario de mediación, participantes distintos, búsqueda con debounce, precarga desde incidente y aviso opcional | Componentes y flujo de creación en navegador |
| SE-122 | Banco de acuerdos y acuerdos personalizados, responsables, fechas y guardado | Validación de fechas, edición y protección de acuerdos evaluados |
| SE-127 | Firma con mouse/táctil, descarga PNG, visor PDF y carga de acta física | Captura y carga con API simulada; compatibilidad con API sin anexos |
| SE-131 / HU-128 | Tablero, semáforo, evaluación, cierre e historial por estudiante | Flujo de cierre y errores; prevención de datos de expedientes anteriores |
| SE-136 | Sociograma interactivo, selección, desplazamiento y zoom | Selección en navegador e interacciones compartidas en componente |
| SE-140 | Métricas, orientaciones de acompañamiento y exportación PNG/PDF | Métricas de API, pesos negativos y exportación PNG en navegador |
| SE-145 | Modal de informe para especialista y descarga PDF con roles autorizados | Contratos, validación del formulario y permisos |
| SE-149 | Historial de emisiones y descarga del original cuando está disponible | Historial por estudiante y errores al recuperar original |

La implementación del frontend no equivale a validación con la base compartida. Los ensayos automatizados utilizan datos ficticios y respuestas controladas; no certifican entrega real de correos.

## Evidencia automatizada

- Vitest: 41 archivos, 196 pruebas aprobadas.
- Playwright: 21 pruebas aprobadas, siete escenarios por motor Chromium, Firefox y WebKit, con API simulada.
- Compilación de producción: aprobada.
- ESLint de los componentes, páginas, servicios y utilidades nuevos: sin errores.
- Revisión independiente: corregidos datos antiguos al cambiar de expediente/estudiante, bloqueo de reemplazo de acuerdos evaluados y representación de pesos negativos en sociograma.

## Dependencias de Marcelo

La API actual permite trabajar con mediaciones, acuerdos, evaluación, cierre, sociograma y generación de informes. El guardado persistente de firmas/actas y la descarga de originales necesitan los contratos descritos en `Dependencias-Sprint9-Marcelo.md`. El frontend desactiva el guardado cuando el backend no informa capacidad documental. Daniel no debe ejecutar migraciones de backend para esta entrega.

## Prueba visual pendiente con Daniel

Usar la demostración local con datos ficticios, sin iniciar sesión real ni enviar correos. Para comprobar persistencia con datos reales, coordinar una sesión de prueba con Marcelo y destinatarios de prueba.

1. Crear mediación con dos estudiantes, motivo y fecha; guardar y abrir el expediente.
2. Añadir, editar y eliminar acuerdos; probar fecha pasada y responsable; guardar y volver a abrir.
3. Capturar firma y descargar PNG. Si la API habilita anexos, guardar firma y acta física; si no, sus botones de guardado deben permanecer deshabilitados.
4. Evaluar compromisos y cerrar: verificar conclusiones y bloqueo de edición posterior.
5. Abrir el perfil de otro estudiante: comprobar que no conserva el historial anterior.
6. Seleccionar curso en sociograma, arrastrar, ampliar, seleccionar estudiante y exportar PNG/PDF.
7. Con rol autorizado, generar informe para especialista y revisar historial. Originales no almacenados deben indicar su indisponibilidad.
8. Con Docente no se permite cerrar/despachar; roles ajenos a la API no acceden a los módulos protegidos.

El propietario solicitó explícitamente publicar en develop con commits separados por tarea después de las verificaciones automatizadas. La revisión funcional con base compartida sigue pendiente de coordinación con Marcelo; no se certifica como realizada. Los commits conservan la identidad Git del usuario sin coautorías ni atribuciones a asistentes.

## Jira consultado

Backend Listo (Marcelo): SE-120, SE-124, SE-125, SE-129, SE-134, SE-138, SE-142, SE-143 y SE-147. Diseño Listo (Claudia): SE-126, SE-130, SE-135, SE-139, SE-144 y SE-148. No se cambiaron estados.
