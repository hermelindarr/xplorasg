# Despliegue de XploraSG en cPanel

> Complementa a `DEPLOY.md` (Render + Vercel). Esta guía cubre el despliegue en un hosting con cPanel.

## Arquitectura

| Pieza | Tecnología | Dónde vive en producción |
|---|---|---|
| Web / PWA | React 19 + Vite 8 + Tailwind (SPA estática) | `public_html/` (dominio principal) |
| API | Node + Express 5 + TypeScript (compilado a `dist/`) | **App Node.js de cPanel**, fuera de `public_html`, en `api.tudominio.com`. Alternativa: seguir en Render |
| Base de datos + Auth + imágenes | Supabase (PostgreSQL) | Se queda en Supabase. **No** se migra a MySQL de cPanel |

> **No hay PHP en el proyecto.** `public_html` solo recibe archivos estáticos compilados.

---

## 1. Clasificación de archivos

### a) Producción (lo único que se sube)

**A `public_html/`**: el **contenido** de `frontend/dist/` después de compilar:

- `index.html`, `.htaccess` (lo copia Vite desde `frontend/public/.htaccess`)
- `assets/` (JS, CSS y fuentes con hash)
- `sw.js`, `registerSW.js`, `workbox-*.js`, `manifest.webmanifest` (PWA)
- `brand/`, `equipo/`, `guias/` (logos, foto del equipo, PDFs descargables)
- `favicon-*.png`, `apple-touch-icon.png`, `xplorasg-icon-*.png`

**A la app Node (`/home/USUARIO/xplorasg_api/`)**: solo si la API va en cPanel:

- `backend/dist/` (JS compilado), `backend/package.json`, `backend/package-lock.json`
- Las variables de entorno se capturan en el panel de cPanel. **No** se sube ningún `.env`.

**En Supabase (SQL Editor)**: las migraciones de `database/migrations/` que falten (de 012 a 015).

### b) Solo desarrollo / local (NO subir)

| Elemento | Motivo |
|---|---|
| `frontend/node_modules/`, `backend/node_modules/` | Dependencias locales (cPanel instala las suyas con "Run NPM Install") |
| `frontend/src/`, `backend/src/`, `*.ts`, `tsconfig*.json`, `vite.config.ts` | Código fuente sin compilar |
| `frontend/dev-dist/` | Service worker del modo `npm run dev` |
| `frontend/e2e/`, `frontend/test/`, `backend/test/`, `playwright.config.ts`, `vitest.config.ts`, `.oxlintrc.json` | Pruebas y linter |
| `frontend/scripts/`, `backend/scripts/`, `scripts/` | Utilidades (iconos PWA, carga de fichas a Supabase, generación de guías) |
| `.git/`, `.gitignore`, `.dockerignore` | Control de versiones |
| `docker-compose.yml`, `Dockerfile` ×2 | Entorno local con Docker |
| `render.yaml`, `frontend/vercel.json` | Solo sirven si usas Render/Vercel |
| `database/` (migraciones y seeds) | Se ejecutan en Supabase, no en el hosting |
| `content/fichas/`, `recursos/imagenes/` | Material fuente. Las imágenes se sirven desde Supabase Storage |
| **`.env`, `.env.backup`, `frontend/.env.local`** | **Contienen secretos. Nunca se suben** |
| `.env.example`, `backend/.env.example`, `frontend/.env.example`, `frontend/env.production.ejemplo` | Plantillas |

### c) Innecesarios / documentación (no subir; conviene sacarlos de la carpeta del código)

- `README.md`, `DEPLOY.md`, `DEPLOY_CPANEL.md`, `SEGURIDAD.md`, `docs/`, `frontend/README.md`
- `_historial/` (respaldos y entregas anteriores en .tar.gz)
- `documentos/fichas/` (fichas y servicios en Word) y `documentos/proyecto/` (bitácora, exposición, idea del proyecto, catálogo de interfaces, gráficas)
- `documentos/marca/` (logos, iconografía e imágenes de referencia)
- **`documentos/video/Interfacez app.mp4` (642 MB)**: OneDrive lo sincroniza y puede bloquear archivos durante `npm install`. Se recomienda moverlo fuera del proyecto.
- `frontend/dist/` actual: **está desactualizado** (es anterior a los últimos cambios y no incluye `brand/`, `equipo/` ni `guias/`). Se regenera al compilar.

---

## 2. Compilación

### Requisitos

- Node.js 22.12 o superior en tu PC (`node --version`).
- Saber qué URL tendrá la API: `https://api.tudominio.com` (cPanel) o `https://xplorasg-api.onrender.com` (Render).

### Paso 1: variables de producción del frontend (obligatorio)

Vite **incrusta** las variables `VITE_*` en el JavaScript al compilar. Sin este archivo, la app compilada intentaría hablar con `http://localhost:3000` y no cargaría ningún dato.

1. Copia `frontend/env.production.ejemplo` como `frontend/.env.production`.
2. Rellena `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_WHATSAPP_RESERVAS` y `VITE_CONTACTO_PRIVACIDAD`.

### Paso 2: compilar y empaquetar

**Opción Docker (recomendada: no depende de lo que tengas instalado en Windows).**
Con Docker Desktop abierto, en PowerShell dentro de `Proyecto_XploraSG`:

```powershell
docker build -f Dockerfile.cpanel --output type=local,dest=_cpanel .
```

En contenedores Linux con Node 22 limpios, el build hace lo siguiente:

1. Valida `frontend/.env.production`: que la URL de la API sea `https://` y que no haya claves secretas.
2. Compila el frontend y comprueba que existan `index.html`, `.htaccess`, `sw.js` y `manifest.webmanifest`.
3. Compila la API y prueba que cargue solo con las dependencias de producción.
4. Deja `public_html.zip` y `xplorasg_api.zip` en `_cpanel\`.

Ningún `.env` con secretos entra en la imagen (ver `Dockerfile.cpanel.dockerignore`). La primera vez tarda unos minutos porque descarga la imagen de Node y las dependencias; las siguientes, segundos.
Si cambias `frontend/.env.production`, vuelve a ejecutar el mismo comando.

**Opción A (sin Docker).** En PowerShell, dentro de `Proyecto_XploraSG`:

```powershell
powershell -ExecutionPolicy Bypass -File .\preparar_cpanel.ps1
# Si la API se queda en Render:
powershell -ExecutionPolicy Bypass -File .\preparar_cpanel.ps1 -SoloFrontend
```

El script valida `.env.production`, compila ambas partes y crea:

- `_cpanel\public_html.zip`
- `_cpanel\xplorasg_api.zip`

**Opción B (manual):**

```powershell
cd frontend
npm install
npm run build          # = tsc -b && vite build  ->  frontend\dist\

cd ..\backend
npm install --include=dev
npm run build          # = tsc  ->  backend\dist\
```

Después, comprime el **contenido** de `frontend\dist` (no la carpeta) y, por separado, `backend\dist` + `package.json` + `package-lock.json`.
Puedes usar `tar.exe -a -c -f public_html.zip -C frontend\dist .`. Si usas "Enviar a > Carpeta comprimida", selecciona los archivos **dentro** de `dist` (incluido `.htaccess`), no la carpeta.

### Árbol final listo para subir

```
public_html/                        <- contenido de frontend/dist
├── .htaccess                       <- rutas SPA, HTTPS, cabeceras, caché
├── index.html
├── manifest.webmanifest
├── registerSW.js
├── sw.js
├── workbox-xxxxxxxx.js
├── favicon-32.png
├── favicon-64.png
├── apple-touch-icon.png
├── xplorasg-icon-192.png
├── xplorasg-icon-512.png
├── xplorasg-icon-maskable-512.png
├── assets/
│   ├── index-xxxxxxxx.js
│   ├── index-xxxxxxxx.css
│   ├── MapPage-xxxxxxxx.js / .css
│   ├── supabase-xxxxxxxx.js
│   └── poppins-*.woff2 / fraunces-*.woff2 ...
├── brand/      (logos .webp)
├── equipo/     (foto del equipo .webp)
└── guias/      (xplorasg-catalogo-de-vistas.pdf, xplorasg-guia-de-bolsillo.pdf)

/home/USUARIO/xplorasg_api/         <- FUERA de public_html (solo si la API va en cPanel)
├── package.json
├── package-lock.json
├── dist/
│   ├── server.js                   <- archivo de arranque
│   ├── app.js
│   ├── auth/  config/  controllers/  middlewares/  routes/  services/
└── node_modules/                   <- lo crea cPanel con "Run NPM Install"
```

---

## 3. Subida a cPanel paso a paso

### 3.0 Antes de empezar

- [ ] El dominio apunta al hosting y **SSL/TLS Status → Run AutoSSL** muestra el certificado activo.
- [ ] Si la API va en cPanel: tu plan debe tener **"Setup Node.js App"** (CloudLinux/Passenger) con **Node 22.12 o superior** (mínimo absoluto 20.19). `jwks-rsa@4` lo exige y `uuid@14` es un módulo ES que la API carga con `require`. Si no lo tiene, deja la API en Render (`-SoloFrontend`).
- [ ] Pregunta a tu proveedor si permite **conexiones salientes a los puertos 5432 y 6543**, porque la API se conecta a Supabase por ahí. Algunos hostings compartidos los bloquean.
- [ ] Supabase → SQL Editor: migraciones 012 a 015 aplicadas.

### 3.1 Frontend en `public_html`

1. cPanel → **Administrador de archivos** → `public_html`.
2. **Configuración** (arriba a la derecha) → activa **"Mostrar archivos ocultos (dotfiles)"**.
3. Si hay archivos de un sitio anterior (`index.html`, `default.html`, `index.php`, `.htaccess` viejo), descárgalos como respaldo y elimínalos. **No borres** `.well-known/` ni `cgi-bin/`.
4. **Cargar** → sube `public_html.zip`.
5. Clic derecho en el zip → **Extraer** → destino `/public_html` → Extraer.
6. Verifica que `index.html`, `.htaccess` y `assets/` quedaron **directamente** en `public_html` (no en `public_html/dist/`).
7. Elimina `public_html.zip`.

> La app debe vivir en la **raíz** del dominio (`https://tudominio.com/`). El manifiesto PWA y las rutas usan `/`; en una subcarpeta no funcionaría sin recompilar con otra base.

### 3.2 API Node en cPanel (si no usas Render)

1. **Dominios** → **Crear un nuevo dominio** → `api.tudominio.com` (desmarca "compartir raíz del documento"). Ejecuta AutoSSL de nuevo.
2. **Administrador de archivos** → en `/home/USUARIO/` crea `xplorasg_api` → sube `xplorasg_api.zip` → **Extraer** ahí → borra el zip.
3. **Setup Node.js App** → **Create Application**:

   | Campo | Valor |
   |---|---|
   | Node.js version | 22.12+ (o la más alta disponible; nunca menor a 20.19) |
   | Application mode | Production |
   | Application root | `xplorasg_api` |
   | Application URL | `api.tudominio.com` (ruta vacía) |
   | Application startup file | `dist/server.js` |

4. En **Environment variables**, agrega (copiando los valores de tu `.env` local, sin compartirlos):

   | Variable | Valor |
   |---|---|
   | `NODE_ENV` | `production` |
   | `TRUST_PROXY` | `1` |
   | `AUTH_MODE` | `supabase` |
   | `SUPABASE_JWT_AUDIENCE` | `authenticated` |
   | `DATABASE_URL` | Cadena del **pooler** de Supabase |
   | `SUPABASE_URL` | `https://TU-PROYECTO.supabase.co` |
   | `CORS_ORIGINS` | `https://tudominio.com,https://www.tudominio.com` |
   | `OPEN_ROUTE_SERVICE_API_KEY` | tu clave |
   | *(opcional)* `ANTHROPIC_API_KEY` + `ANTHROPIC_MODEL` u `OPENAI_API_KEY` + `OPENAI_MODEL` | asistente con IA |

   No definas `PORT`: Passenger lo asigna.
5. **Create** → **Run NPM Install** → espera a que termine → **Restart**.
6. Abre `https://api.tudominio.com/api/health` → debe responder `{"status":"ok",...}`.

### 3.3 Supabase Auth

Authentication → **URL Configuration**:

- **Site URL:** `https://tudominio.com`
- **Redirect URLs:** `https://tudominio.com/**`, `https://www.tudominio.com/**` (conserva `http://localhost:5173/**` para desarrollo)

Si la API se queda en Render, cambia `CORS_ORIGINS` allí a `https://tudominio.com,https://www.tudominio.com` y haz redeploy.

### 3.4 Verificación

| Prueba | Resultado esperado |
|---|---|
| `https://tudominio.com` | Carga con candado 🔒; `http://` redirige a `https://` |
| Recargar (F5) en `/explorar`, `/mapa`, `/lugares/<slug>` | Abre la página, **no** error 404 (confirma `.htaccess`) |
| `https://api.tudominio.com/api/health` | `{"status":"ok"}` |
| `https://api.tudominio.com/api/catalogo/municipios` | JSON con municipios (confirma la conexión a Supabase) |
| Explorar | Muestra los 20 lugares y los prestadores |
| F12 → Consola | Sin errores de CORS ni de `localhost:3000` |
| F12 → Application → Service Workers | `sw.js` activo; la app se puede instalar |
| "Usar mi ubicación" / "Trazar ruta" | Pide permiso y dibuja la ruta |
| Registro, login, `/admin` | Funcionan; `/admin` solo abre con la cuenta administradora |
| `/encuesta` | Guarda y aparece en el panel |
| Asistente → micrófono | El dictado por voz pide permiso |

### 3.5 Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| 404 al recargar una ruta | No se subió `.htaccess` (activa "mostrar archivos ocultos") o el hosting tiene `mod_rewrite` desactivado |
| La página carga pero sin datos; la consola muestra `localhost:3000` | Se compiló sin `frontend/.env.production`. Créalo, recompila y vuelve a subir |
| `Origen no permitido por CORS` | `CORS_ORIGINS` no incluye exactamente `https://tudominio.com` (y `www`). Corrige y reinicia la app |
| `/api/health` OK pero el catálogo da error 500 | El hosting bloquea la salida a Supabase (puertos 5432/6543). Pide que lo abran o deja la API en Render |
| La app Node no arranca / `ERR_REQUIRE_ESM` | Versión de Node menor a 22.12 (o 20.19). Elige una más nueva en "Setup Node.js App" |
| `docker build` falla con `*** Falta frontend/.env.production ***` o `*** VITE_API_URL ... ***` | Crea o corrige `frontend/.env.production` (ver Paso 1) |
| `docker build`: `failed to connect to the docker API` | Docker Desktop no está abierto. Ábrelo y espera a que diga "Engine running" |
| Se sigue viendo la versión vieja | Caché de la PWA: cierra todas las pestañas o en F12 → Application → "Unregister" y recarga |
| Login/recuperar contraseña redirige a localhost | Falta actualizar Site URL / Redirect URLs en Supabase |

### 3.6 Actualizaciones futuras

1. `powershell -ExecutionPolicy Bypass -File .\preparar_cpanel.ps1`
2. `public_html`: borra `assets/` y los archivos sueltos, **conserva** `.well-known/`, sube y extrae el nuevo `public_html.zip`.
3. API: reemplaza `xplorasg_api/dist/` (y `package*.json` si cambiaron dependencias → **Run NPM Install**) → **Restart**.
