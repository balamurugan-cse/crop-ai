# CropCare AI - Automated Test Runner
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Running CropCare AI Full Verification " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Backend Integration Tests (Jest)
Write-Host "`n[1/2] Running Backend Jest Integration Tests..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\..\backend"
npm test

if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend tests failed!" -ForegroundColor Red
    exit $LASTEXITCODE
}

# 2. AI Service Unit & API Tests (pytest)
Write-Host "`n[2/2] Running Python AI Service Pytest Tests..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\..\ai-service"
.\.venv\Scripts\pytest -v

if ($LASTEXITCODE -ne 0) {
    Write-Host "AI Service tests failed!" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host " All Automated Tests Succeeded (100% Pass) " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
