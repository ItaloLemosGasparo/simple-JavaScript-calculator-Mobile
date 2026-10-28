# Windows setup and Android build

This guide covers the local Windows toolchain and the debug APK build. The Android project is already included in this repository.

## Requirements

Install these tools once; skip anything already installed:

1. [Node.js 20 or newer](https://nodejs.org/en/download/) using the Windows LTS installer. It also installs npm.
2. **JDK 21** for Windows x64. Use the [Eclipse Temurin JDK 21 MSI installer](https://adoptium.net/temurin/releases/?version=21&package=jdk&os=windows&arch=x64).
3. The Android CLI. If it is missing, install it with winget:

       winget install --id Google.AndroidCLI

   If winget is unavailable, use Google's [Android CLI download for Windows](https://developer.android.com/tools/agents/android-cli/download).
4. The SDK packages used by this setup:

       android sdk install platforms/android-36 build-tools/36.0.0

   Accept any license prompts. The project targets API 35; Gradle can download any required project SDK packages that are missing.

## Set persistent Windows environment variables

Open **Edit environment variables for your account** from the Start menu. Under **User variables**, create or edit:

| Name | Value |
| --- | --- |
| `JAVA_HOME` | Installed JDK 21 folder, for example `C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot` |
| `ANDROID_HOME` | `%LOCALAPPDATA%\Android\Sdk` |
| `ANDROID_USER_HOME` | `%USERPROFILE%\.android` |

Add `%JAVA_HOME%\bin` to the user `Path`. Confirm the dialogs and reopen PowerShell (and Codex, if applicable) so the new values load. Do not add quotes or extra spaces to the paths.

`ANDROID_USER_HOME` keeps Android tools from trying to create their configuration folder at an invalid location. On Windows, it is usually the `.android` folder inside the user profile.

Check the setup in the new PowerShell window:

    java -version
    node --version
    npm.cmd --version
    android -V
    Test-Path "$env:JAVA_HOME\bin\java.exe"
    Test-Path "$env:ANDROID_HOME"

Java should report version 21 or newer, Node.js version 20 or newer, and both `Test-Path` commands should return `True`. If `android -V` is not recognized after installation, reopen PowerShell so the updated `Path` is loaded.

Use `npm.cmd` for npm commands in PowerShell. This avoids the `npm.ps1` execution-policy issue; changing the script execution policy is unnecessary.

## Install project dependencies

From the project root (the folder containing `package.json`), run:

    npm.cmd install

The `android/` folder is already part of this repository. Skip `android:add` when it exists. If the folder is missing in a checkout, create the native project once with:

    npm.cmd run android:add

This command prepares the web assets and creates the native Android structure through Capacitor.

## Build or update the APK

Run this from the project root:

    npm.cmd run android:build

The command prepares the current web source files in `www/`, syncs them into the Android project through Capacitor, and runs Gradle's `assembleDebug` task. After changing the HTML, CSS, JavaScript, or imported `.mjs` files, use `android:build`; a separate `android:sync` is not needed.

If you need to sync without building, run:

    npm.cmd run android:sync

The debug APK is written to:

    android\app\build\outputs\apk\debug\app-debug.apk

The debug APK is for development and testing. Distribution requires signing and a release build. The Android application ID is `com.simplecalc.mobile`.

If setup or compilation fails, see [Build troubleshooting](build-troubleshooting.md).
