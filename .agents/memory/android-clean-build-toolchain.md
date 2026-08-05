---
name: Android clean-build toolchain
description: Environment-specific requirements and evidence standards for validating Scanner Pro Android releases.
---

For local Scanner Pro release verification, compose a minimal Android SDK with platform 36 and Build Tools 35.0.0 plus 36.0.0. Android Gradle Plugin may request Build Tools 35 even when the project compiles against API 36.

**Why:** A platform-36/build-tools-36-only SDK caused Gradle to attempt installing Build Tools 35 into the read-only Nix store. The full default Android SDK derivation also downloads unnecessary emulator images and is too slow.

**How to apply:** Use a minimal Nix `composeAndroidPackages` SDK without emulator/system images, run release signing and debug tasks separately, and inspect manifests/signatures/assets. A launcher “keeps stopping” screenshot is not a stack trace; do not assign a crash root cause without `adb logcat` or an Android crash report.