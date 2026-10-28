# Simple Calculator Mobile

A responsive HTML, CSS, and JavaScript calculator that runs in a browser or as an Android app through Capacitor.

## Features

- Familiar calculator notation: enter `%` directly, group expressions with parentheses, and use intuitive `×`, `÷`, and `−` symbols.
- Natural grouping with implicit multiplication, such as `2(3 + 4)` evaluating to `14`.
- Context-aware percentages: `200 + 50%` evaluates to `300`, while `200 × 10%` evaluates to `20`.
- Live result preview, light and dark themes, keyboard input, clear/backspace/sign controls, and a persistent history of the 50 most recent calculations.
- A custom arithmetic parser; entered expressions are never executed as JavaScript.

## Run in a browser

From the project folder, start a local server:

    python -m http.server 8000 --bind 0.0.0.0

Open [http://localhost:8000](http://localhost:8000). To open it on a phone connected to the same Wi-Fi, use `http://<computer-IP>:8000`. Keep the server running while testing. The server is for browser preview; it does not build the Android app.

## Build the Android app

After completing the [Windows setup and Android build guide](docs/android-build.md), run this from the project root:

    npm.cmd run android:build

The debug APK is created at `android\app\build\outputs\apk\debug\app-debug.apk`.

## Documentation

- [Windows setup and Android build](docs/android-build.md)
- [Calculator behavior](docs/calculator-behavior.md)
- [Input and touch diagnostics](docs/input-debugging.md)
- [Build troubleshooting](docs/build-troubleshooting.md)

## Project map

- `index.html` and `style.css`: page structure and responsive interface.
- `script.js`: DOM events and rendering.
- `calculator-core.mjs`, `calculator-state.mjs`, and `history-store.mjs`: arithmetic, calculator state, and history persistence.
- `input-debug.mjs`: optional touch/click logging and JSON export.
- `www/`: generated web assets; edit the source files in the project root instead.

This repository is the Mobile version. Keep changes here rather than in the separate `simple-JavaScript-calculator V2` project.
