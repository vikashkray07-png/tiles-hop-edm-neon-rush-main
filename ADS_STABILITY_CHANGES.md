# Ads and Android rendering stability changes

This archive is based on the uploaded Tiles Hop EDM Neon Rush source project. The existing game UI, levels, skins, gameplay, and assets have been left in place.

## Files changed

- `src/lib/admob.ts`
  - Registers rewarded, dismissed, and failed-to-show listeners before opening the native ad.
  - Does not start a full-screen ad if the dismissal lifecycle listener cannot be registered.
  - Waits for both the plugin show result and Android's dismissed event before returning success.
  - Returns `false` on load/show/dismissal failure or timeout; it no longer grants a reward merely because a reward callback happened before a later dismissal timeout.

- `src/game/GameEngine.ts`
  - Pauses the Three.js animation loop when the Android WebView becomes hidden (for example, while a full-screen AdMob Activity is in front).
  - Resizes the renderer/camera and resumes the loop when the WebView becomes visible again.
  - Keeps the existing WebGL context-lost/context-restored handling and cleans up the visibility listener on destroy.

## Verification status

- ZIP archive integrity was checked after creation.
- A full npm install/build could not be completed in the build environment because dependency installation timed out. The environment also reports that several locked Firebase packages require Node.js 24.12 or newer, while the available runtime is Node.js 22.16.
- No Android APK build or real-device AdMob test has been performed here. These changes are intended to address the observed lifecycle/rendering failure, but they are not a guarantee that every device-specific white-screen or crash issue is resolved.

## Before release

Build the Android project using a Node.js version compatible with the lockfile, then test rewarded-ad completion, ad dismissal, offline transitions, level-complete ads, replay, next level, and home navigation on the target Android phone. Use Google's test ad IDs until the test flow is confirmed.
