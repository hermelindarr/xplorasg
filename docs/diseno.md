# Sistema de diseño XploraSG

Basado en la hoja de marca oficial (`Iconografia.pdf`, `png Logo.pdf`). Objetivo: moderno, sofisticado, limpio y profesional.

## Marca
- **Logo**: sólo las imágenes oficiales en `frontend/public/brand/` mediante `<BrandLogo />` (`src/components/brand/BrandLogo.tsx`): `variant="horizontal" | "stacked" | "mark"`, `tone="dark"` (fondos claros) o `"light"` (fondos oscuros). Nunca redibujar el logo ni usar el texto "XploraSG" como logotipo.
- **Eslogan**: "Explora. Conecta. Vive la Sierra Gorda." (`common.slogan`). Tagline del logo: "Turismo inteligente".
- **Paleta (estricta)**: `brand-blue #0D2B45` (texto, superficies oscuras), `brand-green #2E7D4E` (acción principal / naturaleza), `brand-teal #1FA7A5` (acentos, ubicación, info), `brand-gold #C49A4E` (destacados, cultura, detalles finos como la línea del eyebrow), `brand-light #F2EDE1` (fondo). Blanco para tarjetas. Rojo/ámbar sólo para estados de error/aviso. Prohibido: emerald, stone, lime, gray-*, slate-*, colores fuera de paleta.
- **Tipografía**: Poppins. Titulares `font-bold` (700) con `tracking-tight`; texto `font-normal`; etiquetas `font-medium`/`font-semibold`. Evitar `font-black` (900): se ve pesado y no es parte de la marca.
- **Iconografía**: línea fina redondeada (`src/components/brand/icons.tsx`): NatureIcon, CultureIcon, AdventureIcon, RouteIcon, ExperienceIcon, CommunityIcon, LodgingIcon, FoodIcon, MissionIcon, MapIcon, CalendarIcon, CompassIcon, PinIcon, SearchIcon, ArrowRightIcon, CloseIcon, HeartIcon, ShieldIcon, WifiOffIcon, SparkleIcon, BirdMark (asistente). `categoryVisual(categoria)` → `{ Icon, tone, bg, solid }` para cada categoría. No usar emojis como iconos de interfaz.
- **Ilustración**: `<SierraLandscape />` (sierra en capas + ruta con nodos + misión + agaves). Usar como cierre de secciones/hero, con moderación.

## Utilidades (src/index.css)
- `btn` + `btn-primary` · `btn-accent` · `btn-secondary` · `btn-ghost`.
- `eyebrow` (antetítulo en mayúsculas con línea) · `section-title` (titular de sección fluido) · `field` (inputs) · `meta` (metadato de tarjeta) · `label-quiet` (rótulo de dato) · `font-display` (familia de titulares) · `accent` (acento editorial).
- `img-zoom` dentro de un `.group` para zoom suave de fotos · `reveal` (aparición al entrar en pantalla; se desactiva sola dentro de `.snap-rail`) · `snap-rail` (carril horizontal con scroll-snap).
- Retiradas en la Fase 2 por no tener usos: `bento`, `surface`, `chip`, `bg-topo`, `rule`, `legend-dot`.

## Sistema visual (Fase 2)
**Color** (tokens en `@theme`): verde `brand-green` #2F5D3E · terracota `brand-gold` #9E552F · crema `brand-paper` #FAF7F1 · tinta `brand-blue` #1F2C24. Las escalas `clay-*` (errores, avisos de cierre) y `ochre-*` (modo sin conexión, advertencias) se conservan.

**Tipografía por roles**: los componentes usan el rol, no la familia.
- `--font-sans` (Poppins 400/500/600/700): todo el contenido y la interfaz.
- `--font-heading`: h1, h2, `section-title`, `font-display`. Hoy apunta a Fraunces; cambiar esta línea a `var(--font-sans)` pasa todos los titulares a Poppins.
- `--font-accent` (Fraunces 400 cursiva): sólo la utilidad `accent`.
- Fraunces cargada: 400, 500 y 400 cursiva.

**Cursivas**: no hay cursivas automáticas. El único camino es `<Accented text accent>` (`components/ui/Accented.tsx`); el fragmento se elige a mano por idioma en una clave `…Accent` junto al título. El eslogan de la portada y del pie usa `sloganAccent` (`i18n/common.ts`); `stacked` lo pone en su propia línea y `accentClassName` cambia el color sobre fondos oscuros.

**Piezas compartidas** (`components/ui`):
- `SectionHeading` (`size="lg"` secciones de página, `size="md"` bloques de ficha; `eyebrow` opcional).
- `PageHero` (encabezado de página interior; `eyebrow` opcional).
- `Card`: `CardFrame` (marco blanco con elevación y foco), `CardMedia` (foto + velo `strong`/`soft` + etiqueta + contenido encima), `CardBadge`, `CardPlace`. Las usan `PlaceCard`, `ServiceCard` y el mosaico de la portada.
- `Photo` (foto que llena su contenedor, con nombre de respaldo), `TextLink` (enlace subrayado con flecha), `RelatedRail`.

**Catálogo** (`components/catalog`, `hooks/usePlaceSearch.ts`, `i18n/catalog.ts`): `CatalogSearchBar` y `PlaceResults` son comunes a la portada (`pages/HomePage.tsx`) y a Explorar (`pages/ExplorePage.tsx`). Explorar acepta `?q=&municipio=&categoria=` como filtros iniciales.

## Principios de layout
- Contenedor `mx-auto max-w-7xl px-5 lg:px-8`; secciones `py-16 lg:py-24`.
- Encabezado de página: eyebrow → título (`section-title` o `text-4xl sm:text-5xl font-bold tracking-tight`) → párrafo `text-brand-blue/65 leading-7 max-w-2xl`.
- Radios: tarjetas 24px (`rounded-3xl`), controles `rounded-full` o `rounded-2xl`.
- Sombras: `shadow-soft` reposo, `shadow-lift` hover. Sin bordes gruesos.
- Jerarquía con tamaño y peso, no con color. Texto secundario `text-brand-blue/60–70`.
- Microinteracciones: `transition-all duration-300`, hover `-translate-y-1`. Respetar `prefers-reduced-motion` (ya global).
- Móvil primero: hay barra inferior de 64px y el botón flotante del asistente abajo a la derecha (`bottom: 5.5rem` en móvil, `1.5rem` en escritorio): no poner acciones fijas en esa esquina.

## Gráficas (panel admin)
- Forma antes que color: KPI → tarjetas con número grande; distribuciones → barras horizontales de un solo tono (sequential, `brand-green`); metas → medidor (track del mismo tono + marca de meta).
- Categórico (máx. 3 series): `#2E7D4E, #C49A4E, #1FA7A5` (validado CVD; requiere etiquetas visibles porque dorado y teal tienen contraste < 3:1).
- Barras delgadas con extremos redondeados de 4px, separación 2px, etiquetas de valor en tinta de texto (no en el color de la serie), cuadrícula muy tenue, tooltip al pasar el cursor y una tabla accesible (`<details>` "Ver tabla").

## v3 · Editorial natural (vigente)
Referencia: plataformas de turismo premium y composición editorial tipo Pinterest. Debe parecer el sitio de una empresa turística real, no una plantilla.
- **Paleta** (tokens en `src/index.css`, mismos nombres de clase): tinta/bosque profundo `brand-blue #1F2C24`, verde bosque `brand-green #2F5D3E`, salvia `brand-teal #6E8B6F`, terracota `brand-gold #9E552F` (sólo detalles; cumple AA como texto), crema `brand-light #F3EDE2`, beige `brand-sand #E6DCCB`, blanco cálido `brand-paper #FAF7F1` (fondo general), blanco para tarjetas.
- **Estados**: arcilla `clay-*` (errores, acciones destructivas) y ocre `ochre-*` (avisos, sin conexión). Nunca `red-*`/`amber-*` de Tailwind. Texto: `clay-800`/`ochre-900` sobre su tono 50.
- **Texto secundario**: mínimo `text-brand-blue/70` (AA sobre papel y crema); cuerpo `/75` o más. Utilidades `meta` (municipio, pies de foto) y `label-quiet` (rótulos de campos y datos), en minúsculas naturales.
- **Mayúsculas espaciadas**: sólo en el eyebrow (uno por sección como máximo, sin repetir lo que ya dice el encabezado), encabezados del pie, tablas y bloques de fecha de la Agenda.
- **Movimiento**: un fundido de entrada (450 ms) en el titular y la foto del encabezado; sin cascadas en listas. Se conserva el movimiento que comunica estado (mensajes del chat, hoja del asistente, carga).
- **Tipografía**: titulares en serif **Fraunces** (`font-display`/`font-serif`, peso 400–500, nunca negritas pesadas; cursiva para una palabra de énfasis), interfaz y textos en **Poppins** 400/500. Eyebrow: mayúsculas pequeñas terracota con línea de 1px.
- **Composición**: mucho espacio en blanco (secciones `py-20 lg:py-28`), retícula editorial asimétrica (12 columnas), fotos grandes, mosaicos tipo Pinterest (columnas de alturas distintas), texto en columnas estrechas, separadores de 1px `brand-sand`.
- **Tarjetas limpias**: foto + texto debajo, radio pequeño (`rounded-xl`/`rounded-2xl`), sin sombras o casi imperceptibles, borde 1px sólo si hace falta.
- **Botones**: rectángulos redondeados o píldoras sobrias, verde bosque o tinta, secundario con borde fino; enlaces de texto subrayados con flecha.
- **Prohibido**: degradados decorativos (sólo un velo oscuro sutil y uniforme sobre fotos cuando el texto va encima), glassmorphism/backdrop-blur, tarjetas flotantes encimadas, colores saturados (teal/azul brillante), ilustraciones genéricas, emojis, palabras gigantes translúcidas, animaciones llamativas.
- **Fotografías**: sólo las del proyecto (vienen de la API: `imagenPrincipal`, `multimedia`, `lugar_imagen`; foto del equipo en `/equipo`). Se pueden recortar (`object-cover`, distintas proporciones) pero no sustituir. Sin foto: bloque crema/beige con el nombre en serif, nunca un dibujo genérico.
- **Logo**: `<BrandLogo />` oficial. Mascota guacamaya sólo como ícono discreto del asistente.
- **Chatboot** (asistente): único nombre en todo el sitio. Ícono `BirdMark` (guacamaya a una línea, 1.5 px). Voz manos libres opcional con la Web Speech API (`useVoice`: dictado + lectura en voz alta); si el navegador no la soporta, los botones no aparecen.
- **Clima de montaña** (`WeatherCard`): temperatura en serif, sensación térmica, viento, humedad e índice UV (escala OMS) y la posición del lugar (latitud, longitud y altitud en m.s.n.m.; la altitud sale de la ficha o del modelo de elevación de Open-Meteo).
- **Guías descargables** (`public/guias`): se generan con `scripts/guias` a partir de las fichas aprobadas; nunca con datos inventados.

## v4 · La sierra en corte (vigente desde nov-2026)
Misma paleta v3. Cambia cómo se usa y qué se dice.
- **Idea central**: lo que distingue a la Sierra Gorda es el desnivel (≈500 m a ≈2,700 m). La portada abre con el **corte real del terreno** de Peñamiller a Landa (`components/home/sierraTerrain.ts`, datos del modelo de elevación de Open-Meteo) y cada lugar del catálogo como un punto en su longitud y altitud (`HomeHero.tsx`). Tocar/enfocar un punto muestra el lugar.
- **La altitud es dato de primera clase**: tarjetas de lugar, mosaico de la portada y ficha (cifra grande en la cabecera). Fuente: `altitud` de la ficha o, si falta, `GET /api/viaje/altitudes?puntos=lat,lon|…` (caché en memoria en el servidor y en `localStorage` en el navegador; `services/elevationApi.ts`).
- **Se retiraron los tics de plantilla**: antetítulos en mayúsculas espaciadas (la utilidad `eyebrow` ahora es un rótulo en minúsculas y `SectionHeading`/`PageHero` ya no lo pintan), la palabra en cursiva de cada titular (`Accented` muestra el texto parejo), numeración 01/02/03 en cosas que no son pasos, flechas en todos los enlaces (`TextLink` sin flecha por defecto), etiquetas de categoría en mayúsculas sobre las fotos y bloques de cifras de relleno.
- **Tarjetas**: foto limpia arriba (sin velo ni etiquetas encima), texto debajo; el nombre es el enlace y se estira sobre la tarjeta. Sin botón-flecha extra.
- **Contenido**: no mostrar lo que no ayuda a decidir — precios tipo "Consultar tarifa vigente" (`informativePrice` en `utils/text.ts`), coordenadas en grados, URL crudas (se muestran como enlace con el dominio), textos repetidos en la misma pantalla. Nunca truncar horario o costo con "…".
- **Clima**: lecturas actuales + pronóstico de 3 días (decidir cuándo ir), sin bloque de coordenadas.
- **Movimiento**: un solo momento orquestado — el terreno se dibuja de oeste a este al cargar (`.terrain-reveal`, desactivado con "reducir movimiento").
