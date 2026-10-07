# Erik’s little world

The homepage is a procedural Three.js diorama: a CRT workstation, a record player, a tiny skateboard plaza, a resident under a tree, and a mailbox. Click an object or use the five location buttons to open the existing portfolio content. Drag the scene to orbit; the moon/sun control changes lighting; the reset control restores the camera.

The original portfolio remains at /classic, including the AI assistant, contact dock, GitHub activity, and music. Its activity section streams independently so a slow GitHub response cannot block navigation.

## Implementation

- src/components/world/scene.ts: geometry, canvas labels, lighting, picking, orbit controls, and disposal. No model downloads or external textures.
- src/components/world/world.tsx: accessible native dialog, section navigation, day/night controls, and lazy scene loading.
- src/components/world/stops.ts: shared section metadata, separate from the Three.js bundle.
- src/components/world/world.css: responsive presentation.
- Existing profile, experience, education, photos, and links come from src/lib/data.ts.
- The record player mounts the existing listening widget on demand, which polls /api/playing.
- Contact reuses the existing form and /api/contact without modifying delivery behavior.

Pixel ratio is capped; shadow maps are cached. Rendering pauses in hidden tabs and while a section is open. Reduced-motion mode disables ambient object animation and renders on interaction. WebGL initialization failure or context loss leaves every section reachable through HTML buttons. The reading-mode link remains available before JavaScript loads.

## Verification

Run npm run build, npm run lint, and npm run test:e2e. Install Playwright Chromium with npx playwright install chromium, or set PLAYWRIGHT_CHROMIUM_EXECUTABLE to a system Chromium binary.

The browser suite covers desktop navigation, clicking actual scene geometry, day/night mode, photos, mobile overflow, keyboard focus restoration, reduced motion, reading mode, unavailable/lost WebGL, and the music/contact request contracts.

Contact and music responses are mocked in their integration checks: tests do not send real email or claim to verify external provider delivery. The existing lint warning in src/lib/dossier.ts is unrelated to this change.
