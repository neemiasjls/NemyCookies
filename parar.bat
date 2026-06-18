@echo off
title NemyCookies - Encerrando...
color 0C

echo.
echo  =============================================
echo   NemyCookies - Encerrando todos os servicos
echo  =============================================
echo.

:: 1. Encerra o frontend (node / vite na porta 5173)
echo [1/3] Encerrando Frontend (porta 5173)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
echo  Frontend encerrado!
echo.

:: 2. Encerra o backend (java na porta 5000)
echo [2/3] Encerrando Backend (porta 5000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
echo  Backend encerrado!
echo.

:: 3. Para o banco de dados (Docker)
echo [3/3] Parando banco de dados MySQL (Docker)...
cd /d %~dp0
docker-compose down
echo  Banco de dados parado!
echo.

echo  =============================================
echo   Tudo encerrado com sucesso!
echo  =============================================
echo.
pause
