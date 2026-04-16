# NetPulse | Unified Network Control - Launch Script

Write-Host "--- Initializing NetPulse Network Monitor ---" -ForegroundColor Green

# Cleanup existing processes
Write-Host "Checking for existing processes..." -ForegroundColor Gray
$ports = @(5000, 5173)
foreach ($port in $ports) {
    $proc = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Host "Cleaning up port $port..." -ForegroundColor Yellow
        Stop-Process -Id $proc.OwningProcess -Force
    }
}

# Start Backend
Write-Host "Starting Backend Engine..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Title", "NetPulse-Backend", "-Command", "cd backend; npm start"

# Start Frontend
Write-Host "Starting Dashboard Interface..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Title", "NetPulse-Frontend", "-Command", "cd frontend; npm run dev"

# Wait for startup
Write-Host "Warming up systems..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# Launch Browser
Write-Host "Launching Dashboard..." -ForegroundColor Green
Start-Process "http://localhost:5173"

Write-Host "------------------------------------------" -ForegroundColor Green
Write-Host "Backend API:  http://localhost:5000"
Write-Host "Dashboard UI: http://localhost:5173"
Write-Host "------------------------------------------" -ForegroundColor Green
Write-Host "System Operational." -ForegroundColor Cyan
