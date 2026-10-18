<#
CropCare AI - Unified Service Launcher
Launches AI Service, Application Backend, and Frontend.
#>

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " Launching CropCare AI Microservices " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

$Root = Split-Path -Parent $PSScriptRoot

# 1. Start AI Microservice on Port 8000
Write-Host "[1/3] Starting Python FastAPI AI Service on port 8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\ai-service'; .\.venv\Scripts\activate; uvicorn app.main:app --port 8000 --reload"

Start-Sleep -Seconds 2

# 2. Start Application Backend on Port 5000
Write-Host "[2/3] Starting Node.js Backend API on port 5000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\backend'; npm run dev"

Start-Sleep -Seconds 2

# 3. Start Frontend Dev Server on Port 5173
Write-Host "[3/3] Starting Vite React Frontend on port 5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\frontend'; npm run dev"

Write-Host "`nAll services launched successfully!" -ForegroundColor Green
Write-Host "Frontend Portal:  http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend API:      http://localhost:5000/api" -ForegroundColor Cyan
Write-Host "AI Service Docs:  http://localhost:8000/docs" -ForegroundColor Cyan
