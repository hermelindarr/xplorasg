# =============================================================================
# preparar_cpanel.ps1 - Compila XploraSG y genera los paquetes para cPanel
#
# Uso (PowerShell abierto en la carpeta Proyecto_XploraSG):
#   powershell -ExecutionPolicy Bypass -File .\preparar_cpanel.ps1
#   powershell -ExecutionPolicy Bypass -File .\preparar_cpanel.ps1 -SoloFrontend   (si la API sigue en Render)
#
# Resultado en la carpeta _cpanel\ :
#   public_html.zip   -> se extrae DENTRO de public_html
#   xplorasg_api.zip  -> se extrae en la carpeta de la app Node (fuera de public_html)
# =============================================================================
param([switch]$SoloFrontend)

$ErrorActionPreference = 'Stop'
$raiz     = $PSScriptRoot
$frontend = Join-Path $raiz 'frontend'
$backend  = Join-Path $raiz 'backend'
$salida   = Join-Path $raiz '_cpanel'

function Paso($texto) { Write-Host "`n==> $texto" -ForegroundColor Cyan }
function Fallo($texto) { Write-Host "`nERROR: $texto" -ForegroundColor Red; exit 1 }
function Npm([string[]]$argumentos) {
  & npm @argumentos
  if ($LASTEXITCODE -ne 0) { Fallo "fallo 'npm $($argumentos -join ' ')'" }
}

# --- 0. Comprobaciones -------------------------------------------------------
Paso 'Comprobando requisitos'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Fallo 'Node.js no esta instalado.' }
if (-not (Get-Command tar.exe -ErrorAction SilentlyContinue)) { Fallo 'No se encontro tar.exe (viene con Windows 10/11).' }
Write-Host "Node $(node --version)"

$envProd = Join-Path $frontend '.env.production'
if (-not (Test-Path $envProd)) {
  Fallo "Falta frontend\.env.production. Copia frontend\.env.production.ejemplo con ese nombre y rellena los valores."
}
$contenido = Get-Content $envProd -Raw
$m = [regex]::Match($contenido, '(?m)^\s*VITE_API_URL\s*=\s*(.*?)\s*$')
$apiUrl = if ($m.Success) { $m.Groups[1].Value } else { '' }
if (-not $apiUrl.StartsWith('https://') -or $apiUrl -match 'localhost|tudominio') {
  Fallo "VITE_API_URL en frontend\.env.production debe ser la URL https real de la API (valor actual: '$apiUrl')."
}
if ($contenido -match '(?m)^\s*VITE_SUPABASE_PUBLISHABLE_KEY\s*=\s*$' -and $contenido -notmatch '(?m)^\s*VITE_SUPABASE_ANON_KEY\s*=\s*\S') {
  Fallo 'VITE_SUPABASE_PUBLISHABLE_KEY esta vacia en frontend\.env.production.'
}
if ($contenido -match 'service_role|SERVICE_ROLE') { Fallo 'frontend\.env.production no debe contener la service_role.' }
Write-Host "API de produccion: $apiUrl"

# --- 1. Frontend -------------------------------------------------------------
Paso 'Compilando el frontend (React + Vite)'
Push-Location $frontend
try {
  Npm @('install')
  if (Test-Path 'dist') { Remove-Item 'dist' -Recurse -Force }
  Npm @('run', 'build')
} finally { Pop-Location }

$dist = Join-Path $frontend 'dist'
foreach ($f in 'index.html', '.htaccess', 'sw.js', 'manifest.webmanifest') {
  if (-not (Test-Path (Join-Path $dist $f))) { Fallo "Falta dist\$f despues de compilar." }
}

# --- 2. Backend --------------------------------------------------------------
if (-not $SoloFrontend) {
  Paso 'Compilando la API (Node + Express + TypeScript)'
  Push-Location $backend
  try {
    Npm @('install', '--include=dev')
    if (Test-Path 'dist') { Remove-Item 'dist' -Recurse -Force }
    Npm @('run', 'build')
  } finally { Pop-Location }
  if (-not (Test-Path (Join-Path $backend 'dist\server.js'))) { Fallo 'Falta backend\dist\server.js despues de compilar.' }
}

# --- 3. Empaquetado ----------------------------------------------------------
Paso 'Generando paquetes en _cpanel\'
if (Test-Path $salida) { Remove-Item $salida -Recurse -Force }
New-Item -ItemType Directory $salida | Out-Null

# public_html.zip contiene el CONTENIDO de dist (no la carpeta dist)
& tar.exe -a -c -f (Join-Path $salida 'public_html.zip') -C $dist .
if ($LASTEXITCODE -ne 0) { Fallo 'No se pudo crear public_html.zip' }

if (-not $SoloFrontend) {
  $api = Join-Path $salida 'xplorasg_api'
  New-Item -ItemType Directory $api | Out-Null
  Copy-Item (Join-Path $backend 'dist') (Join-Path $api 'dist') -Recurse
  Copy-Item (Join-Path $backend 'package.json'), (Join-Path $backend 'package-lock.json') $api
  & tar.exe -a -c -f (Join-Path $salida 'xplorasg_api.zip') -C $api .
  if ($LASTEXITCODE -ne 0) { Fallo 'No se pudo crear xplorasg_api.zip' }
  Remove-Item $api -Recurse -Force
}

Paso 'Listo'
Get-ChildItem $salida | ForEach-Object { '{0,-20} {1,10:N0} KB' -f $_.Name, ($_.Length / 1KB) }
Write-Host "`nSigue la guia DEPLOY_CPANEL.md para subirlos." -ForegroundColor Green
