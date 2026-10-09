#!/usr/bin/env bash
# ------------------------------------------------------------------------------
# Oprino Mobile — Production Release APK Build Script (Bash)
# ------------------------------------------------------------------------------

set -euo pipefail

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
flutter "${BUILD_ARGS[@]}"

echo "=================================================="
echo " [SUCCESS] Oprino Mobile Release Build Complete!  "
echo " Output: apps/mobile/build/app/outputs/flutter-apk/"
echo "=================================================="
