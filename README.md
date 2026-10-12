# Outside the ordinary

Erik Wijnbladh’s portfolio: an orbital design observatory built with Next.js 16,
React 19, TypeScript, and Three.js. Dark olive, electric orange, editorial type,
and a real, procedural 3D instrument.

## Run locally

```sh
npm ci
npm run dev
```

The portfolio needs no API keys, downloaded models, or remote image assets.
Geist and Instrument Serif are fetched by Next.js at build time and hosted with
the application.

```sh
npm run lint
npx tsc --noEmit
npm run build
npm start
```

## The experience

- Drag the orbital instrument, or focus it and use the arrow keys. Home resets
  its orientation.
- Switch between chrome, clay, and wireframe, separate its rings with Explode,
  or pause its automatic rotation.
- Open any exploration for its concept and construction notes. Escape closes
  the dialog and returns focus to its trigger.
- Contact links open the visitor’s email client. The adjacent button copies the
  email address, with an email-link fallback when clipboard access is unavailable.

The three explorations are independent visual concepts, not client case studies.
Career and contact information come from `src/lib/data.ts`.

## Implementation

| File                               | Responsibility                                                    |
| ---------------------------------- | ----------------------------------------------------------------- |
| `src/components/observatory.tsx`   | Portfolio sections, artwork, controls, and native project dialogs |
| `src/components/orbital-scene.tsx` | Lazy-loaded WebGL scene, materials, input, and resource lifecycle |
| `src/app/observatory.css`          | Responsive design and procedural CSS artwork                      |
| `src/app/layout.tsx`               | Fonts, metadata, and analytics                                    |
| `src/app/opengraph-image.tsx`      | Matching social preview                                           |

The sculpture uses procedural geometry, instanced index marks, and a generated
studio reflection environment. Device pixel ratio is capped. Rendering stops
when the object is offscreen, the tab is hidden, or a paused scene has settled.
Reduced-motion preferences disable automatic rotation and animated transitions.
If WebGL cannot initialize or its context is lost, a static CSS sculpture remains.

The previous chat, contact API, Spotify integrations, and their components remain
in the repository but are not mounted by this design. Their optional configuration
is documented in `.env.example`.

## Browser verification

Check the rendered production build at desktop and phone sizes:

1. Rotate using drag and arrow keys, then reset with Home.
2. Switch every material; explode, assemble, pause, and resume.
3. Open each exploration, close it with Escape, and check restored keyboard focus.
4. Follow section navigation and copy the email address.
5. Enable reduced motion and confirm the sculpture stays still until interacted with.
6. Disable WebGL and confirm the static artwork and portfolio remain usable.

No backend calls are needed for these interactions.
