# PROGRESS XploraSG — Fases 3 a 8

Rama: `fase-3-8-rediseno` (desde `fase-2-arquitectura` / commit `70deec2`).
`main` no se ha tocado. No se ha publicado en Vercel. No se ha modificado Supabase, Auth, RLS, migraciones, `.env` ni backend.

Leyenda: **Implementado** = código hecho · **Probado** = verificado con pruebas o medición · **Pendiente** = falta algo.

## Fase 3 — Portada y Explorar
- Implementado: portada con carriles horizontales en móvil (`snap-rail`), mosaico de destinos desde `sm`, numeración decorativa retirada, espacios reducidos; Explorar sin estadísticas en la cabecera, buscador sin título duplicado, tarjetas compactas en móvil, rejilla 2/3/4 columnas, estados de carga, vacío y error con botón de reintento (`usePlaceSearch.retry`).
- Probado: capturas y medición en 7 anchos (360 a 1440 px) sin desbordamiento horizontal de página; prueba e2e de Inicio y Explorar.
- Pendiente: nada crítico en esta fase.

## Fase 4 — Servicios y promociones
- Implementado: tarjetas de servicio compactas en móvil, filtros por municipio y categoría en forma de chips, carril de promociones alimentado por `/api/agenda/promociones`. Las promociones marcadas como ejemplo se muestran con etiqueta «Ejemplo» y nota `role="note"`; vigencia visible («Termina hoy», «Quedan N días» si faltan 14 o menos). El enlace «Ver prestador» solo aparece si la promoción tiene un servicio real asociado. WhatsApp solo si hay teléfono real.
- Probado: e2e de Servicios; captura móvil revisada.
- Pendiente: promociones reales (contenido). Hoy solo hay ejemplos etiquetados.

## Fase 5 — Agenda
- Implementado: destacado del próximo evento («En N días»), resto agrupado por mes, fechas tentativas sin etiqueta «Por confirmar» (solo mes y año), promociones con `PromoCard`.
- Probado: capturas móviles revisadas. Sin prueba e2e específica de Agenda (pendiente añadirla).
- Pendiente: eventos reales (contenido). No se inventaron fechas.

## Fase 6 — Consistencia visual, responsive y accesibilidad
- Implementado: nombre accesible del logo alineado con el texto visible; botón de lectura en voz alta del asistente con nombre «Leer en voz alta»; carrusel de promociones enfocable con teclado (`tabIndex=0`, `aria-labelledby`).
- Probado: axe-core en las rutas principales. Avisos `label-content-name-mismatch` y `scrollable-region-focusable` corregidos. Aviso `color-contrast` en Servicios solo aparece durante la animación `.reveal`; no se reproduce con movimiento reducido, se documenta como limitación de la medición.
- Pendiente: revisión completa de teclado y lector de pantalla en dispositivos reales.

## Fase 7 — Fotos, rendimiento y offline
- Fotos de Wikimedia: no verificable desde el entorno de trabajo (las peticiones a `upload.wikimedia.org` y `thumb.wikimedia.org` no salen del entorno). **Pendiente**: comprobar en navegador real qué fotos fallan.
- Créditos de foto: la API no devuelve `derechos_fuente`. Mostrarlos requiere cambiar el backend, así que **necesita autorización**.
- Rendimiento: JS total en gzip 257.9 KB frente a 256.1 KB de la fase 2 (+1.8 KB, +0.7 %). Entrada en gzip 138.3 KB frente a 136.6 KB.
- Offline: `pwa:verify` correcto (manifest, registro, precache). Comprobado en navegador: tras una visita online, IndexedDB guarda municipios, categorías, lugares, servicios, agenda y promociones; sin conexión, Explorar muestra 7 municipios, 3 categorías y 20 tarjetas. No se cambiaron las claves de `offlineCatalog.ts` ni el mecanismo de almacenamiento.
- Pendiente: el script `scripts/e2e-offline.mjs` falla por tres razones de la propia prueba (no de la app): (1) cuenta opciones de filtro en cuanto aparece el encabezado, antes de que llegue la respuesta; (2) espera exactamente 7 categorías, y la base local tiene 3 presentes en el catálogo; (3) usa `.last()` sobre un texto `sr-only` del indicador de conexión. Se documenta; no se modificó el script.

## Fase 8 — Auditoría funcional y favoritos
- **Favoritos (corregido en frontend)**: `services/favoritesApi.ts` solo leía el token de la sesión de Supabase. Con el inicio de sesión de desarrollo (token en `localStorage.token`) no había cabecera `Authorization`, así que `addFavorite` salía sin hacer ninguna petición y sin error: el botón cambiaba en pantalla y el favorito nunca se guardaba. Ahora usa el mismo token que `AuthContext` y, si no existe, la sesión de Supabase. Además, `addFavorite`/`removeFavorite` lanzan error cuando no hay sesión, para que el estado optimista se revierta y se muestre el mensaje.
  - Probado en local: clic → `POST /api/favoritos/10`; tras recargar sigue marcado; quitar → `DELETE`.
  - Versión publicada (copia local en 4175): mismo fallo, ningún `POST`, y tras recargar aparece sin guardar. El problema es previo a las fases 3 a 6.
  - Pendiente: confirmar en producción (Vercel) tras publicar. No se publicó.
- Auditoría de 21 puntos: parcial. Cubiertos por las 77 pruebas e2e: navegación, barra móvil, buscador y filtros, fichas, favoritos anónimos, mapa, asistente, acceso a /admin sin sesión, estados sin conexión. **No verificados en esta pasada**: compartir, WhatsApp con teléfono real, i18n completo, cierre de sesión en producción, PWA instalada en dispositivo.
- Datos de prueba: se eliminaron las 36 filas de fotos de relleno (URLs inventadas de `thumb.wikimedia.org/x/...`) de la base local `xv2`. No se tocó Supabase.

## Pruebas (última ejecución)
- `tsc -b`: sin errores.
- `oxlint`: sin avisos.
- `vitest`: 5/5.
- Backend `npm test`: 48/48.
- Playwright e2e: 77 pasan, 1 omitida (igual que antes).
- `pwa:verify`: correcto.
- `test:offline`: falla por la causa descrita arriba (prueba, no app).

## Pendientes que requieren autorización
- Backend para exponer créditos de foto (`derechos_fuente`).
- Migración 016 en Supabase (pendiente desde antes).
- Configuración de Auth en Supabase (Site URL).
- Variable `OPEN_ROUTE_SERVICE_API_KEY` en Vercel.
- Contenido real de eventos, promociones, teléfonos y fotos.
- Copia a la carpeta del equipo `Proyecto_XploraSG_v2` (no realizada).

## Ejecutar en local
- Backend: `cd backend && npm run dev` (puerto 3000).
- Frontend: `cd frontend && npm run dev`.
- Pruebas: `npm test` (backend), `npm run test` y `npm run test:e2e` (frontend).
