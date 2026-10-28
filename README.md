# Simple Calculator Mobile

A responsive calculator built with HTML, CSS, and JavaScript. It can run in a browser or be packaged as an Android app with Capacitor.

## Features

- Addition, subtraction, multiplication, division, decimals, percentages, and parentheses.
- Live result preview as you type.
- Implicit multiplication: 2(3 + 4) evaluates to 14.
- Light and dark themes, physical keyboard support, clear, delete, and change-sign buttons.
- A calculation history that keeps the 50 most recent completed calculations on the device; select an entry to reuse its result, delete entries individually, or clear the entire history.
- A custom arithmetic parser; expressions are not executed as JavaScript.

## Try it in a browser

Open PowerShell in the project folder and start a local server:

    python -m http.server 8000 --bind 0.0.0.0

Open http://localhost:8000 on your computer. To test on a phone on the same Wi-Fi network, use http://&lt;computer-IP&gt;:8000. This server is only for browser testing; it is not used to build the APK.

## Building on Windows

### Install the requirements

Set this up once on the computer. If an item is already installed, skip its installation.

1. Install [Node.js 20 or newer](https://nodejs.org/en/download/) using the Windows LTS installer. The Node.js installer also installs [npm](https://docs.npmjs.com/about-npm/), which this project uses to download dependencies and run commands.
2. Install **JDK 21** for Windows x64. This project needs Java 21; use the Windows x64 MSI installer from [Eclipse Temurin JDK 21](https://adoptium.net/temurin/releases/?version=21&package=jdk&os=windows&arch=x64).
3. If the Android CLI is missing, install it with winget:

       winget install --id Google.AndroidCLI

   If winget is unavailable, use Google's [Android CLI download for Windows](https://developer.android.com/tools/agents/android-cli/download).
4. Install the SDK packages used for this setup:

       android sdk install platforms/android-36 build-tools/36.0.0

   Accept any license prompts. The project targets API 35; after licenses are accepted, Gradle can download any project-required SDK packages that are missing.

### Create persistent Windows environment variables

Save the variables in Windows so they remain available in new terminals:

1. Open the Start menu and search for **Edit environment variables for your account**.
2. Under **User variables**, create or edit these entries:

   | Name | Value |
   | --- | --- |
   | JAVA_HOME | The installed JDK 21 folder, for example C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot |
   | ANDROID_HOME | %LOCALAPPDATA%\Android\Sdk |
   | ANDROID_USER_HOME | %USERPROFILE%\.android |

3. In the user **Path** variable, click **Edit > New** and add %JAVA_HOME%\bin.
4. Confirm all dialogs with **OK**. Close and reopen PowerShell (and Codex if its terminal is being used) so the new values are loaded. Do not add quotes or extra spaces to the paths.

ANDROID_USER_HOME prevents Android tools from trying to create their configuration folder at an invalid location. Set it to the .android folder inside your Windows user profile.

Check the installations in the new PowerShell window:

    java -version
    node --version
    npm.cmd --version
    android -V
    Test-Path "$env:JAVA_HOME\bin\java.exe"
    Test-Path "$env:ANDROID_HOME"

Java should show version 21 or newer, Node.js should show version 20 or newer, android -V should show the CLI version, and both Test-Path commands should return True. If android -V is not recognized after installing the CLI, close and reopen PowerShell (and Codex, if applicable) so the updated Path is loaded.

In PowerShell, use npm.cmd for the commands below. This avoids npm.ps1 being blocked by the local script execution policy; you do not need to change that policy.

## First-time project setup

Open PowerShell in the project root (the folder containing package.json) and install dependencies:

    npm.cmd install

The android/ folder is already included in this repository. If it exists in your checkout, skip android:add and go to **Build or update the APK**. android:add is only needed to create the native Android project when the android/ folder is missing:

    npm.cmd run android:add

This command prepares the web files in www/ and creates the native Android structure with Capacitor. It is normally run once per checkout.

## Build or update the APK

Always run this command from the project root:

    npm.cmd run android:build

The command runs two steps:

1. android:sync prepares the current web source files in www/, then syncs them into the Android project through Capacitor.
2. Gradle runs assembleDebug and creates the debug APK.

If you notive that the build is not generating a updated APK, run the Sync manually.

After changing HTML, CSS, or JavaScript, run android:build; you do not need to run android:sync separately. Sync copies updated web content into the Android app. Gradle alone only compiles the files already in the native project.

The APK is written to:

    android\app\build\outputs\apk\debug\app-debug.apk

The debug APK is for development and testing; distribution requires configuring signing and creating a release build.

## Troubleshooting

For Gradle errors, JDK or Android SDK paths, and UP-TO-DATE messages, see [Build troubleshooting](docs/build-troubleshooting.md).

### Inspecting missed keypad taps

To log pointer, touch, and click events while testing in a browser, open the calculator with `?debugInput=1`, for example `http://localhost:8000/?debugInput=1`. The console logs the event sequence and whether the calculator processed the key; a **Download input log** button saves the recent records as JSON. Touch keypad keys are processed on `pointerdown` except `=`, which waits for a complete click; the following touch-generated click is logged as `pointerdown-click-suppressed` and ignored. Mouse and keyboard input still use clicks. In the developer console, use `window.setCalculatorInputDebug(true)` to enable logging and show the download button, or inspect the records directly in `window.__CALC_INPUT_LOG__`.

## Project structure

- index.html: page structure and accessible calculator regions.
- style.css: responsive layout, keys, themes, and motion preferences.
- script.js: keypad, input, preview, history, and interface event handling.
- calculator-core.mjs: pure arithmetic parser and number formatting.
- calculator-state.mjs: calculator state transitions and commands, independent of the DOM.
- history-store.mjs: history persistence and the 50-entry limit, with injectable storage.
- input-debug.mjs: optional pointer/touch/click diagnostics and log download.
- scripts/build-web.mjs: recreates www/ from the web source files in the project root.
- www/: web content prepared for Capacitor; recreated during sync.
- capacitor.config.json: app name, identifier, and web directory.
- android/: native Android project and Gradle configuration.

## Calculator behavior

- Division by zero is shown as an undefined result.
- A percentage after `+` or `-` uses the running total as its base, including when followed by multiplication: `200 + 50% * -(1)` evaluates to `100`.
- For direct multiplication, a percentage remains a fraction: `200 * 10%` evaluates to `20`.
- The Android application ID is com.simplecalc.mobile.
- simple-JavaScript-calculator V2 is a separate version; make changes for this Mobile version in this project only.
