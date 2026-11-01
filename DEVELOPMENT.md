# Profile viewers

A static personal site with a three.js globe, an ordered Bayer / halftone post-process, selectable geographic locations, and an accessible profile index. The page contains only the atlas panel and entry tabs. The GitHub README contains only a linked VECTUS preview, since GitHub does not run WebGL inside READMEs. The atlas remains available at the site root.

## Build and preview

```sh
npm ci
npm run build
python3 -m http.server 8765 --bind 127.0.0.1
```

Open http://127.0.0.1:8765/docs/. GitHub Pages publishes the committed `docs/` directory from `main`. No runtime CDN or third-party service is required.

- `content/chapters.mjs`: public biography and project descriptions.
- `content/locations.mjs`: seven places: Sydney, Dubai, Los Angeles, Ithaca, New Zealand, India, and Amsterdam. New Zealand and India use explicitly labeled country-level pins until cities are specified. Experiences without a confirmed location have no map pin.
- `src/atlas.mjs`: three.js scene, orbital controls, post-processing, bounded canvas allocations, rendering lifecycle, and resource cleanup.
- `src/app.mjs`: profile selection, renderer controls, deep links, and fallback behavior.
- `scripts/build.mjs`: generates the README, HTML, geographic SVG texture, static previews, and browser bundle. The README preview is captured from the standalone VECTUS page.
- `docs/style.css`: presentation.

Run the build after changing source or content; commit generated assets along with source changes. Do not edit generated `docs/atlas.js`, `docs/index.html`, SVGs, or `README.md` directly. After changing visible content or layout, open the local page at a 1440 × 1100 viewport, wait for the globe and fonts to load, and capture the `#atlas-preview` element to `docs/atlas-preview.png`. The default view is the Projects entry; capture only the panel and tabs.

## Interaction and accessibility

Drag to orbit or focus the canvas and use arrow keys. Select a city from the projected pins or the permanent location list. Profile entries also work without a mapped location. Bayer, halftone, and clean modes, grain adjustment, spin, and reset controls change the view.

Motion is user-triggered; reduced-motion preferences disable spin and make location transitions immediate. Rendering pauses when the canvas leaves the viewport. Native anchor links switch the selected panel through CSS target states, and a geographic SVG fallback remains readable with JavaScript disabled. WebGL failure or context loss returns to the static globe while preserving profile navigation.

Check rendering, mouse and keyboard rotation, all locations, all twelve entries, rendering controls, motion preferences, deep links, mobile overflow, no-JavaScript navigation, and WebGL failure before publishing. Verify the live Pages site and GitHub-rendered README after deployment.

## Sources and attribution

The dither approach is adapted from the Canvas UI `DitheredObject` source supplied by the user. This implementation uses the existing static architecture and three.js directly rather than adding React and a generic asset loader. It implements Bayer, halftone, and clean rendering; Floyd–Steinberg diffusion and arbitrary uploaded models are outside this site's scope.

Geographic outlines: Natural Earth 1:110m land, public domain. See `content/geography/README.md`. Barlow Condensed is distributed under the SIL Open Font License in `docs/fonts/OFL.txt`. Three.js license notices are preserved in `docs/atlas.js.LEGAL.txt`.

The design takes visual cues from industrial and Anduril-style interfaces; it is a personal portfolio and has no affiliation with Anduril.

## VECTUS exploded view

Open http://127.0.0.1:8765/docs/vectus/ locally or https://vikramwish.github.io/vikramwish/vectus/ on Pages. The original Claude Design export is integrated directly into `docs/vectus/`; it needs no build step. Edit `assets/vectus-engine.js` for geometry and rendering, `assets/app.js` for controls, and `assets/style.css` for presentation. The thirteen parts are illustrative concept art.

Capture `docs/vectus/preview.png` from `?poster` at 840 × 472 CSS pixels and device scale 2, after `document.fonts.ready` and `html[data-ready="1"]`. This produces a 1680 × 944 README image. Run `npm run build` to regenerate the single linked image in README.

Check all thirteen callout selections, separation, assemble/explode, dither/clean, drag and keyboard orbit, zoom/reset, mobile layouts, reduced motion, and static fallback before publishing.

Design and procedural model: Claude Design export supplied by the profile owner. Three.js MIT license is in `docs/vectus/assets/vendor/LICENSE-three.txt`. Archivo and IBM Plex Mono are self-hosted with their SIL Open Font Licenses in `docs/vectus/assets/fonts/`.
