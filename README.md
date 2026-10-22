# R2 ULTRA — Holographic Audio System

> **A futuristic holographic smoked-glass music application, real-time Web Audio DSP equalizer, spatial ambience simulator, and 3D reactive audio visualizer.**

---

## ⚡ Overview

**R2 ULTRA** is designed with a cyberpunk liquid-future aesthetic inspired by futuristic server heads-up displays and holographic translucent interfaces. It combines procedural synth soundscapes, real-time Web Audio API signal processing, and persistent local audio playback.

### Key Capabilities
- **Holographic Smoked-Glass Interface**: Multi-layer translucent panels, cyan `#00f0ff` luminous borders, violet reflections, and subtle pointer-driven 3D perspective tilt.
- **Responsive Architecture**: Adapts seamlessly from 360–440px portrait smartphone screens (top and bottom quick-access widget docks with a full-width central console) to large desktop multi-panel 3D stages. Minimum 44px touch targets ensure smooth touch control.
- **Measured Web Audio Telemetry**: Eliminates simulated or fabricated metrics. Displays actual measured Web Audio hardware sample rates (e.g. 44.1 kHz / 48.0 kHz), calibrated RMS energy in dB, peak signal level, active frequency band energy, and audio clipping warnings.
- **10-Band Biquad Graphic Equalizer**: Real Web Audio `BiquadFilterNode` peak/shelf stages from 32 Hz to 16 kHz with factory presets and custom preset storage.
- **Acoustic Effects Lab**: Stereo delay ambience simulation, dynamic range compressor, treble exciter, bass boost, stereo panner, variable speed control (0.5x–2.0x), and autonomous sleep timer.
- **Reliable IndexedDB Persistence**: Stores imported audio Blobs directly in IndexedDB (`r2_ultra_db`). A dedicated hydration gate prevents default state from overwriting saved configurations. When reopened, audio files are restored with fresh object URLs, paused position state, and persistent queue/favorites.

---

## 📱 Android Test APK (Capacitor 8)

The application includes an automated build pipeline for creating a standalone Android test APK (`com.routpro.r2ultra`).

### Build Architecture
- **Framework**: Capacitor 8 (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`).
- **Offline Self-Contained Assets**: Essential UI typography uses system font fallbacks (`system-ui`, `-apple-system`, `BlinkMacSystemFont`, `monospace`) so the app functions fully offline without remote font dependencies.
- **CI / CD Pipeline**: GitHub Actions workflow at `.github/workflows/android-apk.yml` triggers on pushes to `main` and `workflow_dispatch`.

### GitHub Actions Workflow Summary
1. Checks out repository and configures **Node.js 22** and **Java 21 (Temurin)**.
2. Runs web build (`npm run build`) to generate the production `dist/` directory.
3. Automatically initialises and synchronizes Capacitor Android platform (`npx cap sync android`).
4. Compiles the debug test APK via `./gradlew assembleDebug --no-daemon`.
5. Renames the binary to `R2-ULTRA-test.apk` and generates an accompanying `R2-ULTRA-test.apk.sha256` checksum file.
6. Uploads the build artifacts and creates/updates a GitHub Pre-Release tagged `android-test` using the built-in `GITHUB_TOKEN`.

### Sideloading & Testing Instructions
1. Download `R2-ULTRA-test.apk` from the GitHub Pre-Release or GitHub Actions artifact tab.
2. (Optional) Verify the file integrity against `R2-ULTRA-test.apk.sha256`:
   ```bash
   sha256sum -c R2-ULTRA-test.apk.sha256
   ```
3. Transfer the APK to an Android device (Android 8.0+ recommended).
4. Tap the APK to install. When prompted, allow **"Install unknown apps"** for your file manager or browser.
5. Open **R2 ULTRA**. Tap any procedural track or use **Import Audio** to load MP3/WAV/AAC/FLAC files from your device storage.

---

## ⚠️ Internal Test Build Notice & Known Scope

- **Debug Test Binary**: This APK is signed with the standard Android debug keystore for internal developer evaluation and sideloading; it is **not** a production Google Play Store release.
- **Audio File Access**: Files are imported via the standard Android system document picker and cached in IndexedDB. It does not perform invasive background disk scanning.
- **Background Playback**: MediaSession handlers (`play`, `pause`, `nexttrack`, `previoustrack`) and playback position sync are implemented. Full uninterrupted background playback when the device screen is off depends on Android battery optimization settings (disable battery restrictions for uninterrupted WebAudio playback in WebView).

---

## 🛠 Local Development

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Run TypeScript and production build
npm run build
```
