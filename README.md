# XploraSG — Turismo Digital Inteligente

**Explora. Conecta. Vive la Sierra Gorda.**

Plataforma digital de turismo inteligente que conecta visitantes con lugares, rutas, naturaleza, cultura, gastronomía, hospedaje, experiencias y comunidades de la Sierra Gorda de Querétaro.

Este repositorio corresponde a la **Fase III — Implementación** del proyecto académico "Turismo Digital Inteligente", construida sobre las decisiones ya tomadas en la Fase I (investigación) y la Fase II (diseño y arquitectura).

---

## Objetivo

Responder, con una plataforma funcional, a las necesidades detectadas en la investigación de campo con turistas de la Sierra Gorda: búsqueda por municipio/categoría, mapa con geolocalización, funcionamiento sin conexión, opiniones y calificaciones verificadas, rutas sugeridas y reservaciones.

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite (PWA) |
| Backend | Node.js + Express |
| Base de datos | MySQL |
| API | REST |
| Autenticación | JWT |
| Mapas | Leaflet + OpenStreetMap *(decisión de implementación, ver nota abajo)* |
| Almacenamiento de imágenes | Firebase Storage *(decisión de implementación, ver nota abajo)* |
| Contenedores | Docker / Docker Compose |
| Control de versiones | Git / GitHub |

> **Nota — decisiones de implementación:** el brief de Fase III dejó abiertas dos opciones (Google Maps Platform vs. Leaflet+OSM, y Firebase Storage vs. Amazon S3). Se eligió **Leaflet + OpenStreetMap** (sin costo ni API key, ideal para una demo académica) y **Firebase Storage** (configuración más simple para el equipo). Ambas decisiones son reversibles sin cambiar la arquitectura general.

## Arquitectura

```
Usuario
  ↓
Frontend / PWA React  (frontend/)
  ↓  API REST (HTTPS/JSON)
Backend Node.js + Express  (backend/)
  ↓
MySQL
```

Servicios externos: mapas/geolocalización (Leaflet+OSM), almacenamiento de imágenes (Firebase Storage).

## Estructura del repositorio

```
xplorasg/
├── backend/
│   ├── config/       # conexión MySQL, variables de entorno
│   ├── routes/        # definición de endpoints
│   ├── controllers/   # lógica de cada endpoint
│   ├── models/        # acceso a datos (MySQL)
│   ├── middleware/    # JWT, roles, manejo de errores
│   ├── services/       # lógica de negocio (auth, etc.)
│   ├── seeds/          # scripts SQL + datos DEMO + seed de usuarios
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/       # Home, IniciarSesion, Registro, Lugares, LugarDetalle, Eventos, Perfil
│   │   ├── components/  # Navbar, Footer, LugarTarjeta, RutaProtegida
│   │   ├── context/      # AuthContext (sesión JWT)
│   │   ├── hooks/         # useConexion (estado online/offline)
│   │   ├── services/      # cliente Axios + funciones por recurso
│   │   └── styles/         # design tokens de marca (global.css)
│   ├── package.json
│   └── .env.example
├── docker-compose.yml
└── .gitignore
```

## Estado de avance (por Sprint)

| Sprint | Alcance | Estado |
|---|---|---|
| **Sprint 1** | Autenticación, roles, búsqueda por municipio/categoría | ✅ Implementado y probado |
| **Sprint 2** | Mapa interactivo, geolocalización, modo offline (PWA) | ✅ Implementado y probado |
| **Sprint 3** | Rutas sugeridas, reservaciones, opiniones/calificaciones | ✅ Implementado y probado |
| **Sprint 4** | Panel de prestador, panel de administración, aprobación de publicaciones | ✅ Implementado y probado |

**Los cuatro sprints definidos en la Fase III están completos.** El sistema cubre de punta a punta el flujo: un turista se registra y explora; un prestador registra un negocio; un administrador lo aprueba; el negocio aparece públicamente y puede recibir reservaciones y opiniones.

## Sprint 2 — Mapa y Conectividad (implementado)

### Mapa interactivo
- Página `/mapa` con **Leaflet + OpenStreetMap** (sin API key).
- Marcadores coloreados por categoría (paleta oficial de XploraSG).
- Filtros por categoría (chips) y popups con enlace al detalle del lugar.
- Botón **"Mi ubicación"** que usa `navigator.geolocation` para centrar el mapa en la posición real del usuario, con manejo de errores de permisos.

### Modo offline (PWA) — no es solo un botón visual
Implementado en dos capas complementarias:

1. **Caché de datos de la API** (`src/services/offlineCache.js` + `resources.js`): cada consulta exitosa a `/lugares`, `/municipios`, `/categorias` y `/eventos` se guarda en `localStorage`. Si la siguiente consulta falla por falta de red, se sirve automáticamente esa última respuesta, y la interfaz muestra un aviso ("Sin conexión: mostrando información guardada el [fecha]") mediante el componente `AvisoOffline`.
2. **Service Worker con Workbox** (vía `vite-plugin-pwa`, configurado en `vite.config.js`):
   - Precachea el *app shell* (HTML/CSS/JS) para que la app cargue sin conexión.
   - Estrategia `NetworkFirst` para los endpoints de datos turísticos (intenta red, cae a caché a los 4 segundos).
   - Estrategia `CacheFirst` para los tiles del mapa de OpenStreetMap (30 días), para poder ver zonas ya exploradas sin conexión.

**Qué funciona offline:** ver la última búsqueda de lugares, el detalle de un lugar ya visitado, municipios/categorías para armar filtros, y el mapa en las zonas ya cargadas.
**Qué requiere conexión:** iniciar sesión, registrarse, escribir opiniones, calificar, reservar, y ver datos nunca antes consultados.

### Indicador visual de conexión
El hook `useConexion` (`src/hooks/useConexion.js`) expone el estado real `navigator.onLine` y se muestra en el `Navbar` en todo momento ("En línea" / "Sin conexión").

### Instalación de la app (PWA)
- Manifest (`vite.config.js` → `manifest`) con nombre, colores oficiales (`#0D2B45` / `#F2EDE1`) e íconos generados desde el logo oficial (`frontend/public/icons/`).
- Componente `InstalarApp` que escucha el evento nativo `beforeinstallprompt` del navegador y ofrece instalar la app como PWA en el celular.
- **Verificado:** build de producción genera `sw.js`, `manifest.webmanifest` y precachea 14 archivos del app shell; todos los assets (`manifest.webmanifest`, `sw.js`, íconos) se sirven con HTTP 200 desde el build final.

## Sprint 3 — Experiencia Turística (implementado)

- **Rutas sugeridas** (`/rutas`, `/rutas/:id`): listado de rutas con número de paradas; detalle con mapa Leaflet mostrando las paradas en orden conectadas por una línea, y lista numerada con enlace a cada lugar.
- **Reservaciones** (`FormularioReserva.jsx` en el detalle de hospedaje): valida fecha (no permite fechas pasadas), valida que el hospedaje esté aprobado, requiere sesión iniciada. El detalle de lugar ahora expone `id_hospedaje` y `precio_noche` cuando el lugar es un hospedaje.
- **Opiniones y calificaciones** (`SeccionOpiniones.jsx` + `EstrellasInput.jsx`): selector de estrellas 1–5, un usuario solo puede opinar una vez por lugar (`409 OPINION_DUPLICADA` si repite), lista de opiniones ordenada por fecha.
- **Mi perfil**: el turista ve su lista real de reservaciones (lugar, fecha, estado) con enlace al lugar.
- **Verificado end-to-end**: registro de usuario nuevo → ver detalle de hospedaje → publicar opinión → crear reservación → consultar "mis reservaciones" — probado completo contra la base de datos real, incluyendo casos de error (fecha pasada, calificación fuera de rango, opinión duplicada).

## Sprint 4 — Prestadores y Administración (implementado)

- **Panel de prestador** (`/panel-prestador`): formulario para registrar un negocio (atractivo general, hospedaje o restaurante, con campos específicos según el tipo), lista de "Mis negocios" con estado de revisión, y lista de reservaciones recibidas.
- **Flujo de verificación de información** (sec. 13 del brief): todo negocio nuevo entra como `pendiente`; **no aparece en la búsqueda pública** hasta que un administrador lo aprueba. Editar un negocio ya aprobado lo regresa a `pendiente` para nueva revisión.
- **Panel de administración** (`/panel-admin`), con tres pestañas:
  - *Publicaciones*: filtra por estado (pendiente/aprobado/rechazado/todos), aprobar o rechazar con un clic.
  - *Usuarios*: lista todos los usuarios, permite activar/desactivar cuentas (con protección para que un admin no se desactive a sí mismo).
  - *Reportes*: totales del sistema (usuarios, lugares, reservaciones, calificación promedio general) y desgloses por rol/estado.
- **Autorización por rol reforzada**: todas las rutas de prestador/administrador están protegidas tanto en el backend (middleware `permitirRoles`) como en el frontend (`RutaProtegida` con `rolesPermitidos`).
- **Verificado end-to-end** contra la base de datos real: un prestador registra un hospedaje nuevo → se confirma que un turista no puede hacerlo (403) → se confirma que el negocio pendiente NO aparece en la búsqueda pública → el administrador lo aprueba → se confirma que SÍ aparece → se probaron los reportes con datos reales y la creación de catálogos (municipios/categorías).

---

## Instalación y configuración

### Requisitos previos
- Node.js 20+
- MySQL 8 (o Docker, ver más abajo)
- npm

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd xplorasg
```

### 2. Configurar la base de datos MySQL

**Opción A — MySQL local:**
```bash
mysql -u root -p < backend/seeds/01_schema.sql
mysql -u root -p < backend/seeds/02_seed_data.sql
```

**Opción B — Docker (recomendado):**
```bash
docker compose up -d mysql
```
El esquema y los datos DEMO se cargan automáticamente al crear el contenedor (usa `backend/.env` para la contraseña — configúralo primero, ver paso 3).

### 3. Configurar el backend
```bash
cd backend
cp .env.example .env
# Edita .env: credenciales de MySQL, JWT_SECRET, contraseñas de usuarios DEMO
npm install
npm run seed:users   # crea admin, prestador y turista de prueba con bcrypt
mysql -u root -p xplorasg < seeds/03_seed_relaciones_usuarios.sql
npm run dev           # http://localhost:4000
```

### 4. Configurar el frontend
```bash
cd frontend
cp .env.example .env   # ajusta VITE_API_URL si el backend no está en localhost:4000
npm install
npm run dev             # http://localhost:5173
```

### 5. Docker Compose (backend + MySQL juntos)
```bash
cp backend/.env.example backend/.env   # completar valores reales
docker compose up --build
```
El frontend se sigue corriendo aparte con `npm run dev` mientras se define el hosting final.

---

## Variables de entorno

Ver `backend/.env.example` y `frontend/.env.example` para la lista completa y comentada. **Nunca subas el archivo `.env` real a GitHub** — ya está excluido en `.gitignore`.

Variables clave del backend:
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — conexión MySQL.
- `JWT_SECRET` — cadena larga y aleatoria, distinta en cada entorno.
- `SEED_ADMIN_PASSWORD`, `SEED_PRESTADOR_PASSWORD`, `SEED_TURISTA_PASSWORD` — solo usadas por `npm run seed:users`.

## Usuarios de prueba

Creados con `npm run seed:users` (contraseñas definidas en tu `.env`):

| Rol | Correo | Variable de contraseña |
|---|---|---|
| Administrador | `xplora.sg8@gmail.com` | `SEED_ADMIN_PASSWORD` |
| Prestador de servicios | `prestador.demo@xplorasg.mx` | `SEED_PRESTADOR_PASSWORD` |
| Turista | `turista.demo@xplorasg.mx` | `SEED_TURISTA_PASSWORD` |

## API — endpoints implementados (Sprint 1)

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| POST | `/api/usuarios` | Registro (turista o prestador) | No |
| POST | `/api/login` | Inicio de sesión | No |
| GET | `/api/perfil` | Usuario autenticado | Sí |
| GET | `/api/lugares?municipio=&categoria=` | Búsqueda de lugares | No |
| GET | `/api/lugares/:id` | Detalle de lugar | No |
| GET | `/api/municipios` | Catálogo de municipios | No |
| GET | `/api/categorias` | Catálogo de categorías | No |
| GET | `/api/eventos?municipio=` | Próximos eventos | No |
| GET | `/api/recomendaciones` | Lugares recomendados | No |
| POST | `/api/reservas` | Crear reservación (hospedaje + fecha) | Sí |
| GET | `/api/reservas` | Mis reservaciones (usuario autenticado) | Sí |
| GET | `/api/lugares/:id/opiniones` | Listar opiniones de un lugar | No |
| POST | `/api/lugares/:id/opiniones` | Crear opinión (1 por usuario por lugar) | Sí |
| GET | `/api/rutas` | Listar rutas sugeridas | No |
| GET | `/api/rutas/:id` | Detalle de ruta con paradas en orden | No |
| POST | `/api/lugares` | Prestador registra un negocio (queda "pendiente") | Sí (prestador) |
| PUT | `/api/lugares/:id` | Prestador edita su propio negocio (vuelve a "pendiente") | Sí (prestador) |
| POST | `/api/lugares/:id/imagenes` | Prestador agrega una fotografía (URL) | Sí (prestador) |
| GET | `/api/prestador/lugares` | Negocios del prestador autenticado | Sí (prestador) |
| GET | `/api/prestador/reservaciones` | Reservaciones recibidas por el prestador | Sí (prestador) |
| GET | `/api/admin/lugares?estado=` | Publicaciones filtradas por estado | Sí (administrador) |
| PUT | `/api/admin/lugares/:id/aprobar` | Aprobar publicación | Sí (administrador) |
| PUT | `/api/admin/lugares/:id/rechazar` | Rechazar publicación | Sí (administrador) |
| GET | `/api/admin/usuarios` | Listar usuarios | Sí (administrador) |
| PUT | `/api/admin/usuarios/:id/estado` | Activar/desactivar usuario | Sí (administrador) |
| POST | `/api/admin/municipios` | Crear municipio | Sí (administrador) |
| POST | `/api/admin/categorias` | Crear categoría | Sí (administrador) |
| GET | `/api/admin/reportes` | Reportes básicos del sistema | Sí (administrador) |

Todas las respuestas de error siguen el formato:
```json
{ "error": { "codigo": "CODIGO_ERROR", "mensaje": "Descripción legible" } }
```

## Datos de demostración (DEMO)

Todos los lugares turísticos cargados en `02_seed_data.sql` son **ficticios** y están marcados explícitamente:
- Su nombre incluye el sufijo `(DEMO)`.
- El campo `es_demo = TRUE` en la base de datos.
- La interfaz muestra una etiqueta visual **"DEMO"** junto al nombre.

No representan información turística real ni verificada — se usan únicamente para demostrar el funcionamiento del sistema.

## Seguridad implementada

- Contraseñas hasheadas con bcrypt (nunca en texto plano).
- Autenticación JWT con expiración configurable.
- Autorización por rol vía middleware (`permitirRoles`).
- Variables de entorno para todas las credenciales (sin secretos en el código).
- CORS restringido al origen del frontend (`CORS_ORIGIN`).
- Formato de error consistente sin exponer detalles internos del servidor.
- Mensajes de login genéricos (no revelan si falló el correo o la contraseña).

## Decisiones de implementación pendientes de definición explícita

Estas decisiones se tomaron por no estar especificadas en los documentos de Fase I/II proporcionados. Están documentadas para que el equipo las confirme o ajuste:

1. **Mapas:** Leaflet + OpenStreetMap (en vez de Google Maps Platform).
2. **Almacenamiento de imágenes:** Firebase Storage (en vez de Amazon S3).
3. **Algoritmo de recomendaciones:** ordena por calificación promedio + volumen de opiniones (no había un algoritmo definido en el diseño).
4. **Logo:** integrado desde el archivo oficial proporcionado por el equipo (`frontend/src/assets/logo-xplorasg.png`).

## Estado del proyecto

Los cuatro sprints de la Fase III están implementados y probados de punta a punta. Lo que queda como trabajo natural de continuidad, fuera del alcance de esta fase:

- Subida real de imágenes a Firebase Storage (por ahora `POST /lugares/:id/imagenes` recibe una URL ya alojada externamente; falta la integración del SDK de subida en el frontend).
- Pruebas automatizadas (unitarias/end-to-end) — todo lo verificado en esta fase fue mediante pruebas manuales de integración contra la base de datos real, documentadas en cada sección de Sprint.
- Despliegue a un entorno de producción real (dominio, HTTPS, hosting definitivo).
- Verificación visual en navegador real — no fue posible tomar capturas de pantalla dentro del entorno de desarrollo usado para construir este proyecto (sin motor de renderizado moderno disponible); se recomienda una revisión visual manual antes de la entrega académica.

---

## Licencia / uso

Proyecto académico. Identidad visual, nombre y logo de XploraSG son propiedad del equipo del proyecto — no reutilizar fuera de este contexto académico.
