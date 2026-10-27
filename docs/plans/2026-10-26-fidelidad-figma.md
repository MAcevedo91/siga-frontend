# Fidelidad visual de mediaciones — Sprint 9

Referencia inspeccionada: Figma Sites 8KLbgzeLrxYXByPm42EyvV, Inicio, /page, /page-2 y /page-3.

Solicitud aprobada: reproducir estos diseños en las cuatro pantallas de mediación, conservando contratos y permisos existentes. No publicar nuevas modificaciones sin petición posterior.

1. Modal de creación: superficie blanca compacta, participantes con avatar y selección por píldoras, aviso ámbar con interruptor y acciones inferiores.
2. Asistente: cabecera morada, etapas, catálogo y columnas por participante (azul/morado), tarjetas editables y pie de acciones.
3. Firma: visor PDF a la izquierda, captura de firma y estado de despacho a la derecha; estados reales sin firmas ni entregas inventadas.
4. Seguimiento: tres indicadores, bandeja lateral y expediente seleccionado con compromisos en semáforo. En errores no presentar cero como dato confirmado.
5. Verificar pruebas existentes, compilación, navegadores y capturas de cuatro vistas desktop/móvil usando registros ficticios. El error real PGRST201 permanece dependencia de backend.

Diferencias funcionales necesarias: conservar campos obligatorios de API no dibujados en prototipo; no mostrar falsas certificaciones legales, consentimiento, porcentajes globales o destinatarios no confirmados por API.

## Verificación

197 pruebas unitarias/integración; 21 pruebas navegador Chromium/Firefox/WebKit; build de producción y ESLint aprobados. Revisión independiente corrigió roles eliminados, PDF desactualizado tras firma y colores inconsistentes de compromisos. Capturas desktop de las cuatro pantallas y móvil inspeccionadas. Cambios locales, aún sin publicar. Servicios locales frontend5173, API3000, WebSocket3001 y Redis6379. Backend sin cambios; PGRST201 de relación de usuarios y error de columna en notificaciones siguen pendientes de Marcelo.

## Segunda revisión de fidelidad (referencias completas del usuario)
Marco de mediaciones blanco y encabezados morados, asistente sin menú lateral como Figma, breakpoint móvil 1..1279, tarjetas compactas editables, pestañas por estudiante, búsqueda y filtros de página, selección estudiante, firmas por persona, vista de lectura del acta junto al lienzo y estados de despacho basados en respuesta API. El PDF oficial descargable sigue siendo el archivo del backend; la vista de lectura lo identifica expresamente. Sin afirmar conformidad, SMS, certificación, artículos de RICE ni entregas no verificadas.

Revisión independiente: resueltos campos required ocultos abriendo tarjeta/pestaña inválida y preservados roles móviles. Continuar al paso4 bloquea acuerdos sin guardar. Validación final:197 pruebas/42archivos,27 pruebas navegador (Chromium/Firefox/WebKit),build aprobado,ESLint archivosnuevos sinerrores. No commit/push deesta revisión.

Vista interactiva ficticia con cuatro pestañas: /tmp/siga-figma-revision.mjs. Capturas cuatrodesktop y cuatro móvil: /tmp/siga-figma-*.png. Servicios reales permanecen activos.


## Preferencia visual corregida por Daniel
Mantener la navegación global idéntica al Panel Principal: barra lateral oscura, iconos, selección azul/cian, logo y barra superior con búsqueda, usuario y notificaciones. Figma se aplica al contenido interno de mediaciones, no al marco global. Restaurado DashboardLayout de HEAD y eliminadas las reglas que recoloreaban u ocultaban sidebar/header. Las tres páginas usan layout compartido, estilos internos aislados med-screen-*. Verificación197unit,27browser ybuild aprobados. Cambios locales sinpublicar.

## Estado antes de publicación
El usuario autoriza publicar los ajustes actuales en develop. Las cuatro vistas están implementadas con aproximación a Figma y navegación global original. La fidelidad visual no se considera100%; siguen diferencias de detalle y queda pendiente la validación integral con el backend corregido. No se certifica la persistencia documental, entrega de correo ni estados no confirmados por API.
