@echo off
TITLE "NetPulse Unified Control - Launching Systems"

echo --------------------------------------------------
echo [NetPulse] Initializing Network Monitoring Engine...
echo --------------------------------------------------

REM Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install it from nodejs.org
    pause
    exit /b
)

REM Cleanup any old processes
echo [1/3] Cleaning up previous sessions...
powershell -Command "Get-NetTCPConnection -LocalPort 5000, 5173 -ErrorAction SilentlyContinue | Foreach-Object { Stop-Process -Id $_.OwningProcess -Force }" >nul 2>nul

REM Start Backend
echo [2/3] Starting Backend Engine (Port 5000)...
start "NetPulse-Backend" cmd /c "cd backend && npm start"

REM Start Frontend
echo [3/3] Starting Dashboard UI (Port 5173)...
start "NetPulse-Frontend" cmd /c "cd frontend && npm run dev"

echo --------------------------------------------------
echo [STATUS] Warming up systems...
timeout /t 5 /nobreak >nul

echo [STATUS] Systems operational. Launching browser...
start "" "http://localhost:5173"

echo --------------------------------------------------
echo [READY] NetPulse is now active.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo --------------------------------------------------
pause
