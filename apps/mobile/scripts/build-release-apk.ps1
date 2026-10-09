# ------------------------------------------------------------------------------
# Oprino Mobile - Production Release APK Build Script (PowerShell)
# ------------------------------------------------------------------------------

param (
    [switch]$SplitPerAbi = $false,
    [string]$Flavor = "production"
)

$ErrorActionPreference = "Stop"

# Auto-detect Flutter CLI if not present in system PATH
if (-not (Get-Command flutter -ErrorAction SilentlyContinue)) {
    if (Test-Path "D:\flutter\bin\flutter.bat") {
        $env:PATH = "D:\flutter\bin;$env:PATH"
    } elseif (Test-Path "C:\flutter\bin\flutter.bat") {
        $env:PATH = "C:\flutter\bin;$env:PATH"
    }
}

# Auto-detect Android SDK if not defined
if (-not $env:ANDROID_HOME) {
    if (Test-Path "D:\android-sdk") {
        $env:ANDROID_HOME = "D:\android-sdk"
    } elseif (Test-Path "$HOME\AppData\Local\Android\Sdk") {
        $env:ANDROID_HOME = "$HOME\AppData\Local\Android\Sdk"
    }
}

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   Oprino Mobile - Production Build Pipeline     " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$KeyPropertiesPath = Join-Path $PSScriptRoot "..\android\key.properties"

if (-not (Test-Path $KeyPropertiesPath)) {
    Write-Host "[WARN] key.properties not detected in android/. Falling back to debug signing." -ForegroundColor Yellow
    Write-Host "[WARN] For signed OEM release, create android/key.properties from android/key.properties.example." -ForegroundColor Yellow
} else {
    Write-Host "[INFO] Release signing keystore configuration located: $KeyPropertiesPath" -ForegroundColor Green
}

$MobileAppDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Write-Host "[INFO] Mobile App directory: $MobileAppDir" -ForegroundColor Cyan

Push-Location $MobileAppDir
try {
    if ($SplitPerAbi) {
        Write-Host "[INFO] Building split APKs per target ABI..." -ForegroundColor Cyan
        flutter build apk --release --split-per-abi
    } else {
        Write-Host "[INFO] Building unified release APK..." -ForegroundColor Cyan
        flutter build apk --release
    }
    $BuildExitCode = $LASTEXITCODE
} finally {
    Pop-Location
}

if ($BuildExitCode -eq 0) {
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host " [SUCCESS] Oprino Mobile Release Build Complete!  " -ForegroundColor Green
    Write-Host " Output directory: apps/mobile/build/app/outputs/flutter-apk/" -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Build failed with exit code $BuildExitCode" -ForegroundColor Red
    exit $BuildExitCode
}
