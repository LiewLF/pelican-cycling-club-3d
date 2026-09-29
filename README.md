# Pelican Cycling Club

**慢慢骑，去看海。** A tiny interactive 3D coastal escape, featuring a pelican on a bicycle.

## Experience

- Procedural pelican, bicycle, island, palm trees, sailboat, and lighthouse.
- Pedal-linked legs, rotating spokes, moving road markings, fluttering scarf, blinking eyes, and gentle coastal motion.
- Day, sunset, and moonlight; stars and a rotating lighthouse beam at night.
- Orbit / zoom, pause / resume, speed adjustment, simulated trip distance, synthesized bell and optional sea breeze.
- Save a 1600 × 1200 PNG postcard, with the current camera angle and mood.
- Responsive Chinese interface, keyboard controls, reduced-motion support, and WebGL failure messaging.

Drag the scene to orbit; scroll or pinch to zoom. Space pauses / resumes, B rings the bell, R resets the view. Form controls retain their native keyboard behavior. Distance is playful simulation, not location tracking. The illustrated coordinates are fictional.

## Run

Serve this directory using any static HTTP server. For example, `python3 -m http.server 8769`, then open `http://localhost:8769`.

No package installation, build, API keys, analytics, remote fonts, or runtime third-party requests. Requires a modern browser with WebGL 2 and ES modules. Sound begins only after interaction. Browser download and audio policies still apply.

## Upstream

Reuses [Three.js r180](https://github.com/mrdoob/three.js/releases/tag/r180) and its official [OrbitControls](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/controls/OrbitControls.js). Rendering and orbit mechanics are reused; the pelican, bike, island, artwork, and interactions are original procedural geometry. The version is pinned; the release notes and [import documentation issue](https://github.com/mrdoob/three.js/issues/25437) informed the local import-map setup.

Vendored browser modules were downloaded from the `three@0.180.0` npm distribution via jsDelivr. Its MIT license is retained in `vendor/THREE-LICENSE.txt`.

Designed for static hosting on GitHub Pages. All served assets are public; there is no backend or collection of personal data.
