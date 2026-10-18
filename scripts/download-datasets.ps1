<#
CropCare AI - Dataset Download & Ingestion Helper
Downloads full PlantVillage and PlantDoc repositories and runs preparation splits.
#>

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " CropCare AI Dataset Download & Preparation " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

$DataRoot = "$PSScriptRoot\..\ai-service\data"
New-Item -ItemType Directory -Force -Path $DataRoot | Out-Null

Write-Host "`n1. PlantVillage Repository:" -ForegroundColor Yellow
Write-Host "   URL: https://github.com/spMohanty/PlantVillage-Dataset"
Write-Host "   Target: $DataRoot\plantvillage"

Write-Host "`n2. PlantDoc Field Dataset:" -ForegroundColor Yellow
Write-Host "   DOI: 10.1145/3371158.3371196"
Write-Host "   URL: https://github.com/pratik2708/plant-disease-detection"
Write-Host "   Target: $DataRoot\plantdoc"

Write-Host "`n[Action] Running automated sample preparation pipeline..." -ForegroundColor Green
Set-Location "$PSScriptRoot\..\ai-service"
.\.venv\Scripts\python training\prepare_dataset.py --sample-mode --samples-per-class 15

Write-Host "`nDataset manifests generated in ai-service/data/splits/splits.json" -ForegroundColor Green
