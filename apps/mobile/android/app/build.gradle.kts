import java.io.FileInputStream
import java.util.Properties

plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

val keystoreProperties = Properties()
val keystorePropertiesFile = rootProject.file("key.properties")
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

android {
    namespace = "com.oprino.app.oprino_mobile"
    compileSdk = 35
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        applicationId = "com.oprino.app.oprino_mobile"
        minSdk = 24
        targetSdk = 35
        // Uses the version code from pubspec.yaml. When using split APKs, 1000 * ABI_VERSION
        // is added automatically by Flutter. (https://developer.android.com/studio/build/configure-apk-splits#configure-APK-versions)
        // You can force using the value of versionCode by specifying the `-P force-version-code-ignoring-abi=true`
        // flag during build.
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        create("release") {
            val keyStoreFilePath = keystoreProperties.getProperty("storeFile")
                ?: System.getenv("OPRINO_KEYSTORE_PATH")
            val keyStorePassword = keystoreProperties.getProperty("storePassword")
                ?: System.getenv("OPRINO_KEYSTORE_PASSWORD")
            val keyAliasStr = keystoreProperties.getProperty("keyAlias")
                ?: System.getenv("OPRINO_KEY_ALIAS")
            val keyPasswordStr = keystoreProperties.getProperty("keyPassword")
                ?: System.getenv("OPRINO_KEY_PASSWORD")

            if (keyStoreFilePath != null && file(keyStoreFilePath).exists()) {
                storeFile = file(keyStoreFilePath)
                storePassword = keyStorePassword
                keyAlias = keyAliasStr
                keyPassword = keyPasswordStr
            } else {
                // Fallback to debug signing for development convenience if release keystore is not yet configured
                val debugConfig = signingConfigs.getByName("debug")
                storeFile = debugConfig.storeFile
                storePassword = debugConfig.storePassword
                keyAlias = debugConfig.keyAlias
                keyPassword = debugConfig.keyPassword
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("release")
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
