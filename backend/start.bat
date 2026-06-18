@echo off
title NemyCookies - Backend
color 0B
cd /d %~dp0

echo.
echo  =============================================
echo   NemyCookies - Backend (porta 5000)
echo  =============================================
echo.
echo  Iniciando... aguarde a mensagem:
echo  "Started NemyCookiesApplication"
echo.

mvn spring-boot:run

echo.
echo  Backend encerrado.
pause
