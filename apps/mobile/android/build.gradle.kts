allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    // On Windows, external Flutter plugins cached on a different drive (e.g. C:\Users\...\Pub\Cache)
    // cannot have their buildDirectory redirected to this project's drive (D:\...) because AGP/Gradle
    // task configuration relativizes paths, throwing java.lang.IllegalArgumentException: this and base files have different roots.
    val projectRoot = project.projectDir.toPath().root
    val buildRoot = newBuildDir.asFile.toPath().root
    if (projectRoot == buildRoot) {
        val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
        project.layout.buildDirectory.value(newSubprojectBuildDir)
    }
}
subprojects {
    project.evaluationDependsOn(":app")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
