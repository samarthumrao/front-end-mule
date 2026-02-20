@echo off
setlocal

echo ==========================================
echo Starting Mule Detect Application...
echo ==========================================

:: 1. Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not found in PATH. Please install Python.
    pause
    exit /b
)

:: 2. Check if Node is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in PATH. Please install Node.js.
    pause
    exit /b
)

echo.
echo [1/3] Starting Backend Server (Port 8001)...
start "Mule Detect - Backend" cmd /k "cd backend && python -m uvicorn app.api:app --reload --port 8001"

echo.
echo [2/3] Starting Frontend Server (Port 5173)...
start "Mule Detect - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo [3/3] Opening Application in Browser...
timeout /t 5 >nul
start http://localhost:5173

echo.
echo ==========================================
echo App started! Close the terminal windows to stop.
echo ==========================================
pause
