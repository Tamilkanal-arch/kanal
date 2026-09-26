@echo off
title NEST Leave & Attendance Management System
echo ============================================================
echo   NEST Kuwait - Leave & Attendance Management System
echo ============================================================
echo   Starting local web server and opening website...

:: Check if server on port 8080 is already responding
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:8080/' -UseBasicParsing -TimeoutSec 1; exit 0 } catch { exit 1 }"
if %ERRORLEVEL% NEQ 0 (
    echo   Starting background server...
    start /min powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0server.ps1"
    timeout /t 2 /nobreak >nul
)

echo   Opening http://localhost:8080/ in your web browser...
start "" "http://localhost:8080/"
exit
