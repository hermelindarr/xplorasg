@echo off
title Claude - XploraSG
cd /d "%~dp0"
where claude >/dev/null 2>/dev/null || (echo No se encontro Claude Code en este equipo. & pause & exit /b)
start "Claude - XploraSG" cmd /k "cd /d %~dp0 && claude"
