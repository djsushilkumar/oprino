# Oprino — Local Development Troubleshooting Guide

**Document:** Common Issues, Root Causes & Verified Resolutions  
**Auditor:** Principal DevOps Engineer & Support Lead  
**Branch:** `release/v1-stabilization`  

---

## 1. Android Build Issues

### Issue 1: `IllegalArgumentException: this and base files have different roots`
* **Symptoms:** Gradle build fails when running `assembleDebug` or `.\gradlew.bat tasks` on Windows.
* **Root Cause:** Project repository is on one drive letter (e.g. `D:\oprino\oprino`), while global Flutter Pub cache is on another drive letter (e.g. `C:\Users\...\Pub\Cache`). AGP path relativization fails across Windows drive letters.
* **Resolution:** Ensure [`apps/mobile/android/build.gradle.kts`](../../apps/mobile/android/build.gradle.kts) includes the drive root check in `subprojects`:
  ```kotlin
  subprojects {
      val projectRoot = project.projectDir.toPath().root
      val buildRoot = newBuildDir.asFile.toPath().root
      if (projectRoot == buildRoot) {
          project.layout.buildDirectory.value(newBuildDir.dir(project.name))
      }
  }
  ```

### Issue 2: `flutter.sdk not set in local.properties`
* **Symptoms:** Gradle reports `flutter.sdk not set in local.properties`.
* **Resolution:** Create or update `apps/mobile/android/local.properties` with absolute Windows paths using escaped backslashes:
  ```properties
  sdk.dir=D:\\android-sdk
  flutter.sdk=D:\\flutter
  ```

---

## 2. Port & Process Conflicts

### Issue 3: `EADDRINUSE: address already in use :::3001`
* **Symptoms:** API or isolated pilot server fails to bind on port 3001.
* **Resolution:**
  - On Windows PowerShell, find and terminate the blocking process:
    ```powershell
    Get-NetTCPConnection -LocalPort 3001 | Select-Object OwningProcess
    Stop-Process -Id <PID> -Force
    ```

---

## 3. Flutter & Monorepo Build Cache Invalidation

### Issue 4: Stale Generated Contracts or Tokens
* **Symptoms:** TypeScript or Flutter complains about missing types or outdated endpoint parameters.
* **Resolution:**
  ```bash
  # In monorepo root:
  pnpm turbo build --force
  
  # In apps/mobile:
  cd apps/mobile
  flutter clean
  flutter pub get
  ```
