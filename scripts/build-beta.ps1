$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$ToolchainRoot = "C:\Users\0\Documents\Codex\toolchains"
$env:JAVA_HOME = Join-Path $ToolchainRoot "jdk-21.0.8+9"
$env:ANDROID_HOME = Join-Path $ToolchainRoot "android-sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:GRADLE_USER_HOME = Join-Path $ToolchainRoot "gradle-home"
$env:Path = "C:\Users\0\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"

Set-Location $ProjectRoot
& "C:\Users\0\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" scripts\prepare-web.js
& ".\node_modules\.bin\cap.CMD" sync android

Set-Location (Join-Path $ProjectRoot "android")
& ".\gradlew.bat" assembleDebug

$SourceApk = Join-Path $ProjectRoot "android\app\build\outputs\apk\debug\app-debug.apk"
$OutputApk = "C:\Users\0\Documents\Codex\2026-07-08\new-chat\outputs\personal-os-beta-debug.apk"
Copy-Item -Path $SourceApk -Destination $OutputApk -Force
Write-Host "Beta APK:" $OutputApk
