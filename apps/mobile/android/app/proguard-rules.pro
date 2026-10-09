# ------------------------------------------------------------------------------
# Oprino Mobile — ProGuard / R8 Rules for Release Hardening
# ------------------------------------------------------------------------------

# Flutter Core & Embedding
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.**  { *; }
-keep class io.flutter.util.**  { *; }
-keep class io.flutter.view.**  { *; }
-keep class io.flutter.**  { *; }
-keep class io.flutter.plugins.**  { *; }
-dontwarn io.flutter.embedding.**

# Drift SQLite Offline Outbox & Database FFI
-keep class com.simolus3.drift.** { *; }
-keepclassmembers class com.simolus3.drift.** { *; }
-keep class org.sqlite.** { *; }
-keep class sqlite3.** { *; }
-keep class * extends com.simolus3.drift.GeneratedDatabase { *; }
-keep class * extends com.simolus3.drift.Table { *; }
-dontwarn com.simolus3.drift.**

# Transistor Background Geolocation Native Services
-keep class com.transistorsoft.locationmanager.** { *; }
-keepclassmembers class com.transistorsoft.locationmanager.** { *; }
-keep class com.transistorsoft.flutter.backgroundgeolocation.** { *; }
-dontwarn com.transistorsoft.**

# Flutter Secure Storage & Platform Keystore Cryptography
-keep class androidx.security.crypto.** { *; }
-keep class com.it_nomads.fluttersecurestorage.** { *; }
-keepclassmembers class com.it_nomads.fluttersecurestorage.** { *; }

# Google Play Services & Fused Location Provider
-keep class com.google.android.gms.location.** { *; }
-keep class com.google.android.gms.common.** { *; }
-dontwarn com.google.android.gms.**

# Protocol Buffers / Serialization (if used)
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}
