---
description: Release Mobile App (iOS & Android)
---

# Release to iOS and Android

## Prerequisites
- **iOS**: Xcode installed (macOS only), Apple Developer Account.
- **Android**: Android Studio installed, Google Play Console Account.

## Build Process

1.  **Build Web Assets**:
    ```bash
    npm run build
    npx cap sync
    ```

2.  **iOS Release**:
    - Open Xcode:
        ```bash
        npx cap open ios
        ```
    - In Xcode, select your App Target.
    - Go to "Signing & Capabilities" and select your Team.
    - Update "Version" and "Build".
    - Go to **Product > Archive**.
    - Once archived, the Organizer window will open. Click **Distribute App**.
    - Select **App Store Connect** and follow the prompts to upload.

3.  **Android Release**:
    - Open Android Studio:
        ```bash
        npx cap open android
        ```
    - Go to **Build > Generate Signed Bundle / APK**.
    - Select **Android App Bundle**.
    - Create a new key store (if first time) or choose existing.
    - Select "release" build variant.
    - Click **Finish**.
    - Locate the generated `.aab` file and upload it to Google Play Console.

## Updating App Icon & Splash Screen
1.  Place your icon (1024x1024) and splash screen (2732x2732) in `assets/`.
2.  Run:
    ```bash
    npx @capacitor/assets generate
    ```
