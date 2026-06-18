@echo off
title NemyCookies - Iniciando...
color 0A

echo.
echo  =============================================
echo   NemyCookies - Iniciando todos os servicos
echo  =============================================
echo.

:: 1. Banco de dados (Docker)
echo [1/3] Subindo banco de dados MySQL (Docker)...
docker-compose -f "%~dp0docker-compose.yml" up -d
if %errorlevel% neq 0 (
    echo.
    echo  ERRO: Docker nao encontrado ou falhou.
    echo  Verifique se o Docker Desktop esta aberto.
    pause
    exit /b 1
)
echo  Banco de dados iniciado!
echo.

:: 2. Backend
echo [2/3] Abrindo janela do Backend...
start "NemyCookies - Backend" cmd /k "%~dp0backend\start.bat"
echo  Janela do backend aberta!
echo.

echo  Aguardando backend iniciar (5s)...
timeout /t 5 /nobreak >nul

:: 3. Frontend
echo [3/3] Abrindo janela do Frontend...
start "NemyCookies - Frontend" cmd /k "%~dp0frontend\start.bat"
echo  Janela do frontend aberta!
echo.

echo  =============================================
echo   Tudo iniciado! Acesse:
echo.
echo   Site:  http://localhost:5173
echo   Admin: http://localhost:5173/admin
echo  =============================================
echo.
pause
