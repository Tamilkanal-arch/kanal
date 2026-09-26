# Launcher script for Leave & Attendance Management System
$port = 8080
$url = "http://localhost:$port/"
$serverRunning = $false

try {
    $res = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 1
    if ($res.StatusCode -eq 200) { $serverRunning = $true }
} catch {
    $serverRunning = $false
}

if (-not $serverRunning) {
    Write-Host "Starting background web server..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$PSScriptRoot\server.ps1`"" -WindowStyle Hidden
    Start-Sleep -Seconds 2
}

Write-Host "Opening $url in your web browser..." -ForegroundColor Green
Start-Process $url
