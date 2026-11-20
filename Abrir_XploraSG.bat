@echo off
title XploraSG v2 - iniciar
cd /d "%~dp0"
where node >nul 2>nul || (echo No se encontro Node.js. Instalalo desde https://nodejs.org y vuelve a intentar. & pause & exit /b)
if not exist backend\node_modules (echo Instalando dependencias del servidor, solo la primera vez... & pushd backend & call npm install & popd)
if not exist frontend\node_modules (echo Instalando dependencias de la pagina, solo la primera vez... & pushd frontend & call npm install & popd)
echo Iniciando servidor (backend)...
start "XploraSG v2 backend - no cerrar" cmd /k "cd /d %~dp0backend && npm run dev"
echo Iniciando pagina web (frontend)...
start "XploraSG v2 frontend - no cerrar" cmd /k "cd /d %~dp0frontend && npm run dev -- --port 5180 --strictPort"
echo Esperando a que arranque...
timeout /t 15 /nobreak >nul
start "" http://localhost:5180
echo Listo. Para apagar la app, cierra las dos ventanas negras.
timeout /t 5 >nul
