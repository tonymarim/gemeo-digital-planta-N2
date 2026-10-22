@echo off
cd /d "%~dp0"
echo Gemeo SMART 4.0 N2 - simulacao local
echo Abra http://127.0.0.1:4173 no navegador.
echo Para encerrar, pressione Ctrl+C.
node server.mjs
pause
