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
- Nota: las tres fragilidades de `scripts/e2e-offline.mjs` que aquí se describían quedaron corregidas en la fase final (ver abajo).

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
- `test:offline`: corregido en la fase final; pasa.

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

---

# Fase final: estabilización y validación (17 nov 2026)

Rama `fase-3-8-rediseno`. No se publicó, no hay push a `main`, no se integró a producción. No se modificaron Supabase, Auth, RLS, migraciones, backend, `.env` ni credenciales. La única consulta a producción fue de lectura (`SELECT`) sobre `multimedia`.

## Pruebas completadas
- **Sesión** (backend real): inicio con la cuenta de prueba, panel, cierre de sesión y redirección a `/login`. Pasa.
- **Favoritos** (backend real): guardar (`POST`), recargar y seguir marcado, aparece en Favoritos, quitar (`DELETE`), recargar y quedar sin marcar. Pasa.
- **Compartir**: copia el enlace de la ficha y muestra «¡Enlace copiado!». Pasa (ambos proyectos).
- **WhatsApp**: unitarias con números ficticios (10 pruebas en `test/whatsapp.test.ts`). E2E recorre las 16 fichas de servicio de la API: las que tienen teléfono aproximado no ofrecen enlace; las demás ofrecen `wa.me/52…` correcto. Pasa.
- **Idioma**: español e inglés en Explorar, Servicios, Agenda, Mapa y Favoritos. Pasa.
- **Navegación**: 12 rutas principales sin página 404 y sin errores de consola (se ignoran solo los errores de recursos externos). Control negativo: una ruta inexistente sí muestra 404. Pasa.
- **Agenda y promociones**: la agenda carga su contenido; Servicios muestra el carril de promociones. Pasa.
- **Mapa**: carga el encabezado y el selector de municipios. Pasa.
- **PWA**: manifiesto 200 con nombre y `display`; el Service Worker toma el control. Pasa.
- **Sin conexión**: con datos guardados, el aviso «Sin conexión» aparece, la lista de municipios se mantiene y al volver a conectar el aviso desaparece. Pasa (escritorio y móvil).

**Resultado de la suite Playwright** (ambos proyectos): antes de la última corrección, 108 pasaban, 1 fallaba (recuperación de conexión en móvil) y 1 se omitía. Tras ajustar esa prueba, pasa en ambos proyectos. No he vuelto a lanzar la suite completa tras el ajuste.

## Pruebas pendientes
- Auditoría de los 21 puntos del prompt maestro: ahora cubiertos por pruebas, salvo **PWA instalada en un dispositivo real** (requiere un teléfono).
- Lectura de pantalla y navegación por teclado en dispositivos reales (solo verificado con axe).
- Foco y estados de carga de las tarjetas, no cubiertos por prueba específica.

## Pruebas offline corregidas (`scripts/e2e-offline.mjs`)
Las tres fragilidades se corrigieron sin cambiar la lógica de verificación:
1. **Carrera**: ahora espera a que el filtro tenga los municipios (`waitForFunction`) antes de contar.
2. **Datos fijos**: los valores esperados se leen de la API (`/api/catalogo/municipios` y `/categorias`), no se fijan en 7. Las categorías se validan contra los nombres que devuelve la API.
3. **Selector**: el indicador se localiza con `visible: true` en vez de `.last()`.
Resultado: pasa con 43 respuestas en caché, 7 municipios, 20 tarjetas sin conexión y navegación sin red.

Nota: en esta corrida el script se ejecutó con `PWA_BASE_URL=http://localhost:5173` y con la API local.

## Fotografías
- En el repositorio no hay ninguna URL de Wikimedia; las imágenes reales no están en git (`content/fichas/media` está vacío).
- **Producción (solo lectura)**: 70 filas en `multimedia`. 35 son marcadores SVG en línea (`data:image/svg+xml`), no fotos. Las otras 35 son reales: 34 en `thumb.wikimedia.org` y 1 en `upload.wikimedia.org`.
- **Derechos**: `content/fichas/multimedia_auditoria.json` (3 oct 2026) indica que de 36 imágenes, **0 tienen derechos verificados**, 31 quedan en revisión privada, 5 no deben cargarse, 2 tienen marca de agua y 3 no corresponden a su ficha. Esto es un riesgo para publicar.
- **Disponibilidad**: no se puede comprobar desde este entorno (`upload.wikimedia.org` y `commons.wikimedia.org` no responden). Tampoco se pudo comprobar desde el navegador.
- **Créditos**: la API no devuelve `derechos_fuente`. Mostrarlos requiere cambiar el backend: **necesita autorización**.
- **Decisión**: no se sustituyó ninguna imagen ni se cambió el backend.

## Rendimiento (compilación de producción, 1440 px)
- **JS en gzip**: 257.9 KB en total; entrada 138.3 KB. Fase 2: 256.1 KB y 136.6 KB (+0.7 %).
- **Peticiones por página**: 58–61 (≈40 de tipo `fetch`). Sin fallos de red en la portada, Explorar, Servicios, Agenda, Favoritos y fichas.
- **Precarga de fichas en la portada**: ~43 KB de 20 lugares y 16 servicios. Es **deliberada**: alimenta la caché sin conexión. No se recorta porque afectaría la oferta offline y el beneficio medible es pequeño.
- **Fallos esperados**: el Mapa intenta cargar teselas de OpenStreetMap, que no alcanzan este entorno (20 fallos). En las fichas, `/api/analitica` se cancela al navegar (normal).
- **Tiempos**: DOMContentLoaded entre 74 y 108 ms en local. LCP no se midió (el navegador sin interacción no lo registró).
- **Optimizaciones propuestas**: ninguna con beneficio medible claro en este cambio. Las fuentes (Fraunces y Poppins) y las imágenes no se midieron por separado.

## Validación responsive (7 anchos: 360 a 1440 px)
- Revisadas 13 rutas × 7 anchos = 91 páginas: Home, Explorar, Servicios, Agenda, Mapa, Favoritos, fichas de lugar y de servicio, asistente, encuesta, login, nosotros y 404.
- **Desbordamiento horizontal de página**: ninguno.
- **Errores de consola**: ninguno.
- **Carriles**: sin tarjetas ocultas por animación.
- **Avisos de axe**:
  - `color-contrast` en Servicios (≈12–19 nodos) con movimiento normal, **0 con movimiento reducido**. Es el efecto de la animación `.reveal`, no un defecto de color.
  - `region` (1 nodo) en el asistente: burbuja `hidden` fuera de un punto de referencia. Severidad baja; no se corrigió.
- **Elementos fuera del viewport en Mapa**: son teselas de Leaflet dentro de un contenedor con recorte. La página no se desplaza.
- **Defectos reales**: ninguno confirmado, así que no hubo cambios de código por esta causa.
- **Observación**: en pantallas de menos de 420 px el indicador de conexión de la cabecera se oculta; la señal visible es el aviso «Sin conexión». Es una decisión de diseño, no un fallo.

## Favoritos
- Estado: corregido en local (ver fase anterior). Verificado con prueba automática en escritorio y móvil.
- Pendiente: confirmar en producción tras publicar. No se publicó.

## Errores corregidos en esta fase
- Ninguna corrección de código de la app. Esta fase corrigió **pruebas**: `e2e-offline.mjs` (tres fragilidades) y una prueba propia que buscaba el indicador oculto en móvil.
- Se restauró el servicio local de Postgres (instancia `/home/claude/pg`) y el backend, que estaban caídos tras reiniciar el entorno. Sin cambios en el repositorio.

## Archivos modificados en esta fase
- `frontend/scripts/e2e-offline.mjs` (corregido)
- `frontend/e2e/auditoria.spec.ts` (nuevo)
- `frontend/test/whatsapp.test.ts` (nuevo)
- `PROGRESS_XPLORASG.md`

## Riesgos antes de publicar
1. **Derechos de las fotos de Wikimedia**: ~35 imágenes en producción sin derechos verificados. Revisar o retirar antes de publicar.
2. **Favoritos en producción**: el arreglo está probado en local, no en Vercel.
3. **Contenido de prueba visible**: los carriles de promociones muestran etiquetas «Ejemplo»; eventos y promociones reales faltan.
4. **Datos de contacto**: los teléfonos del catálogo son de negocios reales. Esta fase no los usó en pruebas ni en el informe.
5. **Migración 016 y configuración de Auth** siguen pendientes en Supabase (fuera de alcance).

## Recomendación
Integrar la rama tras (a) decidir sobre las fotos de Wikimedia, (b) confirmar el favorito en un entorno de vista previa de Vercel y (c) revisar el contenido de ejemplo. El código está listo para revisión; no se recomienda publicar a producción sin esos tres puntos.
