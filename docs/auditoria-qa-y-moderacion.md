# Auditoría QA y flujo de moderación · XploraSG

Fecha: 18-nov-2026 · Rama: `ui/ajustes-hero-accesibilidad`

Este documento reúne los tres entregables de la reingeniería: el reporte de auditoría por perfil, la arquitectura del flujo Prestador → Administrador y el inventario del código modificado.

---

## 1. Reporte de auditoría QA

Severidad: **P0** bloquea o rompe una regla de negocio · **P1** falla funcional o de accesibilidad · **P2** fricción · **P3** detalle.
Estado: ✅ corregido en esta entrega · ⏳ requiere acción fuera del código.

### 1.1 Perfil Turista (vista pública)

| # | Sev. | Hallazgo | Estado |
|---|------|----------|--------|
| T1 | P2 | El mapa sí permite arrastre (ratón y toque), rueda, pellizco, doble clic y botones de zoom; verificado en Chromium escritorio y móvil con toque sintetizado. Los botones +/− y los pines medían 28–30 px en pantallas táctiles. | ✅ 44 px en táctil |
| T2 | P2 | Buscador compacto de Explorar: funciona (búsqueda "misión" → 5 resultados, sin errores de consola). El filtro de categoría estaba duplicado (selector + pastillas). | ✅ (rediseño previo) |
| T3 | P2 | Clima en la ficha: carga sin errores; mostraba coordenadas inútiles para el turista y no el pronóstico. | ✅ pronóstico de 3 días |
| T4 | P1 | Saltos visuales: CLS 0.222 en Explorar (cambio de fuente) y 0.097 en fichas (pie que salta). | ✅ CLS ≈ 0 |
| T5 | P2 | Estética de plantilla: antetítulos en mayúsculas, palabra en cursiva, 01/02/03, tarjetas con velo y etiquetas. | ✅ (rediseño previo) |
| T6 | P3 | Iconografía genérica en categorías; sin referencias a la flora de la Sierra. | ✅ íconos de línea: pino (Naturaleza), agave (Gastronomía), biznaga (sin resultados) |

### 1.2 Perfil Prestador (portal de captura)

| # | Sev. | Hallazgo | Estado |
|---|------|----------|--------|
| P1 | **P0** | **Los cambios del prestador se publicaban de inmediato.** `PATCH /api/prestador/servicios/:id` escribía directamente sobre el servicio aprobado, sin revisión. | ✅ ahora se guardan como propuesta |
| P2 | P1 | No existía forma de registrar un servicio nuevo: sólo editar los ya cargados por el equipo. | ✅ `POST /api/prestador/servicios` → `en_revision` |
| P3 | P1 | Validación débil: el servidor aceptaba descripciones vacías o de 2 letras y contactos sin teléfono; el formulario no mostraba errores por campo. | ✅ validación en cliente y servidor con mensaje por campo |
| P4 | P1 | Sin manejo de imágenes: el prestador no podía proponer una foto. | ✅ foto por enlace https con vista previa; se publica al aprobarse |
| P5 | P2 | El texto prometía "escribe, guarda y listo" y "lo que escribas aquí es lo que ven los turistas", contradiciendo la revisión. | ✅ copia corregida |
| P6 | P2 | Tras guardar no había confirmación de que la solicitud quedaba pendiente. | ✅ aviso "en espera de validación" con fecha de envío |
| P7 | P2 | Borrar una promoción usaba `window.confirm` del navegador. | ✅ modal accesible |
| P8 | P3 | Servicios suspendidos se podían seguir editando. | ✅ bloqueados con mensaje |

### 1.3 Perfil Administrador (control y reportes)

| # | Sev. | Hallazgo | Estado |
|---|------|----------|--------|
| A1 | **P0** | No había una bandeja única de solicitudes: las promociones se revisaban en el panel y los servicios en otra página, sin ver qué cambió. | ✅ `/admin/moderacion` con filtros y comparación publicado/propuesto |
| A2 | P1 | No se podía **editar** una ficha desde el panel ni **eliminar** contenido. | ✅ edición directa y borrado lógico con modal de confirmación |
| A3 | P1 | Servicios nuevos de prestadores nunca podían publicarse si les faltaba fuente o foto, y no había dónde completarlas. | ✅ el editor permite completar fuente y foto; al aprobar se re-validan los requisitos |
| A4 | P1 | Sin exportación de datos. | ✅ Excel (.xlsx), CSV por tabla, Word (.doc) e impresión/PDF |
| A5 | P2 | Rechazar mostraba un campo de texto dentro de cada tarjeta; eliminar evento usaba `window.confirm`. | ✅ modales con motivo obligatorio |
| A6 | P2 | Interfaz en tarjetas repetidas con antetítulos; densidad baja para revisar en serie. | ✅ tablas y listas limpias, sin antetítulos |

---

## 2. Arquitectura de roles y flujo de moderación

### 2.1 Estados

`public.servicios.estado_aprobacion`: `borrador · en_revision · aprobado · rechazado · suspendido`.
La vista pública (catálogo, mapa, agenda, asistente) **sólo** lee filas con `estado_aprobacion = 'aprobado'` y `deleted_at IS NULL`, y para servicios exige además el prestador aprobado. Esto ya existía y no se modificó.

Nuevo (migración `018_moderacion_cambios_prestador.sql`, sólo agrega columnas):

- `servicios.cambios_propuestos JSONB`: cambios del prestador pendientes, **no visibles** al público.
- `servicios.cambios_enviados_at`: cuándo se envió la última solicitud (ordena la bandeja).

### 2.2 Prestador → revisión (blindado en el servidor)

| Acción del prestador | Resultado | Visible al turista |
|---|---|---|
| Registrar servicio (`POST /api/prestador/servicios`) | Se crea con `estado_aprobacion = 'en_revision'`. El estado lo fija el servidor; cualquier `estado_aprobacion` enviado se ignora. | No |
| Editar servicio **publicado** (`PATCH …/servicios/:id`) | Se guarda en `cambios_propuestos` (sólo descripción, horario, precios, contacto, cómo reservar y foto). La fila pública no cambia. | Sí, la versión aprobada anterior |
| Editar servicio **no publicado** | Se actualiza y vuelve a `en_revision`. | No |
| Editar servicio **suspendido** | Rechazado (409). | — |
| Retirar propuesta (`DELETE …/servicios/:id/cambios`) | Se descarta la propuesta. | Sin cambios |
| Crear promoción | `en_revision` (ya existía). | No |

Garantías: la pertenencia se valida en SQL (`prestadores.usuario_id = usuario autenticado`); la edición usa `SELECT … FOR UPDATE` dentro de una transacción; los campos se filtran con listas blancas (`moderationService.ts`), probadas con 8 pruebas unitarias.

### 2.3 Administrador

Todas las rutas exigen `requireAuth` + `requireRole(['administrador'])`.

| Endpoint | Acción |
|---|---|
| `GET /api/admin/moderacion` | Bandeja: servicios nuevos, cambios a servicios publicados, promociones y lugares pendientes, de la solicitud más antigua a la más reciente, con requisitos faltantes y comparación campo a campo. |
| `POST /api/admin/moderacion/:tipo/:id/aprobar` | **Aprobar y publicar.** En una transacción: aplica la propuesta (y la foto como multimedia principal), verifica requisitos de publicación (descripción, ubicación, fuente, contacto, prestador, multimedia) y publica. Si falta algo, responde 409 con la lista y no cambia nada. |
| `POST /api/admin/moderacion/:tipo/:id/rechazar` | **Rechazar** con motivo obligatorio. Si era una propuesta sobre un servicio publicado, se descarta y la ficha pública sigue igual. |
| `GET` / `PATCH /api/admin/contenido/:tipo/:id` | **Editar directamente** (lista blanca de campos); se aplica de inmediato sin cambiar el estado. |
| `DELETE /api/admin/contenido/:tipo/:id` | **Eliminar** (borrado lógico con `deleted_at`): desaparece de la vista pública y de los paneles; recuperable desde la base. |
| `GET /api/admin/reportes` | Datos para exportar: prestadores (estatus, municipios, servicios, publicados, pendientes), lugares, servicios, municipios y métricas de actividad. |

En la interfaz, eliminar y rechazar siempre pasan por un modal (`ConfirmDialog`, `<dialog>` nativo con foco atrapado); rechazar exige un motivo de al menos 5 caracteres.

### 2.4 Exportación

Generada en el navegador sin dependencias nuevas (`utils/reportExport.ts`):

- **Excel (.xlsx)**: libro Office Open XML con una hoja por tabla, encabezados en negritas, fila superior fija y números como números. Validado abriéndolo con el lector ZIP de Windows y con un analizador XML.
- **CSV**: una tabla por archivo, UTF-8 con BOM (Excel muestra bien los acentos).
- **Word (.doc)**: documento con resumen y tablas que Word abre y edita.
- **Imprimir / PDF**: el mismo documento en un iframe oculto con el diálogo de impresión.

---

## 3. Código fuente modificado

**Base de datos**
- `database/migrations/018_moderacion_cambios_prestador.sql` (nueva).

**Backend**
- `src/services/moderationService.ts` (nuevo): validación, listas blancas, unión y aplicación de propuestas.
- `src/controllers/moderationController.ts` (nuevo): bandeja, aprobar, rechazar, editar, eliminar, reportes.
- `src/controllers/providerController.ts`: registrar servicio, edición como propuesta, retirar propuesta.
- `src/controllers/contentReviewController.ts`: exporta las consultas de requisitos para reutilizarlas.
- `src/routes/adminRoutes.ts`, `src/routes/providerRoutes.ts`: rutas nuevas.
- `test/moderationService.test.js` (nuevo, 8 pruebas).

**Frontend**
- `pages/AdminModerationPage.tsx` (nueva): bandeja de solicitudes.
- `pages/ProviderPage.tsx`: registrar servicio, estados de espera, errores por campo, foto, modales.
- `pages/AdminPanelPage.tsx`: resumen de pendientes, sección de reportes, sin antetítulos.
- `pages/AdminContentPage.tsx`: lista limpia con editar, rechazar y eliminar por modal.
- `pages/AdminAgendaPage.tsx`: eliminar evento con modal.
- `components/admin/ContentEditor.tsx`, `components/admin/ReportsPanel.tsx`, `components/ui/ConfirmDialog.tsx` (nuevos).
- `services/moderationApi.ts` (nuevo), `services/providerApi.ts`, `services/authorizedFetch.ts` (errores por campo).
- `utils/reportExport.ts`, `utils/adminReport.ts` (nuevos).
- `components/brand/icons.tsx` (pino, agave, biznaga), `components/catalog/PlaceResults.tsx`, `index.css` (área táctil de pines).
- Pruebas: `test/reportExport.test.ts` (4), `e2e/moderacion.spec.ts` (4 × 2 dispositivos).

**Resultados**: 87 e2e (1 omitida), 9 unitarias de frontend y 56 de backend en verde; build de producción correcto.

## 4. Pendiente para producción

1. Ejecutar la migración **018** en Supabase **antes** de desplegar el backend nuevo: sin esas columnas, "Mi negocio" y la bandeja responden error 500.
2. Las fotos del prestador se proponen por enlace https; subir archivos requeriría habilitar Supabase Storage con políticas para el rol prestador.
3. Los lugares turísticos los da de alta el equipo (no los prestadores); la bandeja también los muestra cuando están en revisión.
