# ------------------------------------------------------------------------------
# Oprino Mobile — Production Release APK Build Script (PowerShell)
# ------------------------------------------------------------------------------

param (
    [switch]$SplitPerAbi = $false,
    [string]$Flavor = "production"
)

$ErrorActionPreference = "Stop"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   Oprino Mobile — Production Build Pipeline     " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$KeyPropertiesPath = Join-Path $PSScriptRoot "..\android\key.properties"

if (-not (Test-Path $KeyPropertiesPath)) {
    Write-Host "[WARN] key.properties not detected in android/. Falling back to debug signing." -ForegroundColor Yellow
    Write-Host "[WARN] For signed OEM release, create android/key.properties from android/key.properties.example." -ForegroundColor Yellow
} else {
    Write-Host "[INFO] Release signing keystore configuration located: $KeyPropertiesPath" -ForegroundColor Green
}

$Flags = @("build", "apk", "--release")

if ($SplitPerAbi) {
    $Flags += "--split-per-abi"
    Write-Host "[INFO] Building split APKs per target ABI (armeabi-v7a, arm64-v8a, x86_64)..." -ForegroundColor Cyan
} else {
    Write-Host "[INFO] Building unified fat APK..." -ForegroundColor Cyan
}

Write-Host "[INFO] Executing: flutter $($Flags -join ' ')" -ForegroundColor Cyan
flutter @Flags

if ($LASTEXITCODE -eq 0) {
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host " [SUCCESS] Oprino Mobile Release Build Complete!  " -ForegroundColor Green
    Write-Host " Output directory: apps/mobile/build/app/outputs/flutter-apk/" -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Build failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}
