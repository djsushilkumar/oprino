#!/usr/bin/env bash
# ------------------------------------------------------------------------------
# Oprino Mobile — Production Release APK Build Script (Bash)
# ------------------------------------------------------------------------------

set -euo pipefail

# Auto-detect Flutter CLI if not present in system PATH
if ! command -v flutter &> /dev/null; then
    if [ -f "/d/flutter/bin/flutter" ] || [ -f "D:/flutter/bin/flutter.bat" ]; then
        export PATH="D:/flutter/bin:$PATH"
    elif [ -f "/c/flutter/bin/flutter" ] || [ -f "C:/flutter/bin/flutter.bat" ]; then
        export PATH="C:/flutter/bin:$PATH"
    fi
fi

# Auto-detect Android SDK if not defined
if [ -z "${ANDROID_HOME:-}" ]; then
    if [ -d "D:/android-sdk" ]; then
        export ANDROID_HOME="D:/android-sdk"
    elif [ -d "$HOME/AppData/Local/Android/Sdk" ]; then
        export ANDROID_HOME="$HOME/AppData/Local/Android/Sdk"
    fi
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KEY_PROPERTIES="$SCRIPT_DIR/../android/key.properties"

echo "=================================================="
echo "   Oprino Mobile — Production Build Pipeline     "
echo "=================================================="

if [ ! -f "$KEY_PROPERTIES" ]; then
    echo "[WARN] key.properties not detected in android/. Falling back to debug signing."
    echo "[WARN] For signed OEM release, create android/key.properties from android/key.properties.example."
else
    echo "[INFO] Release signing keystore configuration located: $KEY_PROPERTIES"
fi

BUILD_ARGS=("build" "apk" "--release")

if [ "${1:-}" == "--split-per-abi" ]; then
    BUILD_ARGS+=("--split-per-abi")
    echo "[INFO] Building split APKs per target ABI..."
else
    echo "[INFO] Building unified fat APK..."
fi

echo "[INFO] Executing: flutter ${BUILD_ARGS[*]}"
cd "$SCRIPT_DIR/.."
flutter "${BUILD_ARGS[@]}"

echo "=================================================="
echo " [SUCCESS] Oprino Mobile Release Build Complete!  "
echo " Output: apps/mobile/build/app/outputs/flutter-apk/"
echo "=================================================="
