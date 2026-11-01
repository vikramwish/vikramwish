# VECTUS · Exploded View

Interactive exploded 3D view of VECTUS, an original AI dogfighter aircraft concept. This is illustrative concept art. The geometry is procedural and fictional, and it encodes no real dimensions, capabilities or specifications.

## Files

```
index.html                    page shell, controls, fallback
preview.png                   README still (1680×944), captured with bundled fonts
assets/style.css              industrial monochrome UI
assets/app.js                 binds the engine to the HTML controls
assets/vectus-engine.js       renderer + procedural geometry (editable source)
assets/vendor/three-vectus.js three.js r187 IIFE build (global THREE), MIT
```

No build step is needed. Everything is plain classic `<script>` tags, so it runs as-is on GitHub Pages.

## Run locally

```
cd vectus && python3 -m http.server 8000
# open http://localhost:8000/
```

## Deploy on GitHub Pages

1. Copy this folder into a repo, e.g. `docs/vectus/` or a dedicated `vectus` repo.
2. Go to Settings → Pages → Deploy from branch, then pick the branch and folder.
3. The viewer will be served at `https://<user>.github.io/<repo>/` (adjust the path to match your setup).

## README embed (one clickable image)

```markdown
<a href="https://<user>.github.io/<repo>/">
  <img src="https://<user>.github.io/<repo>/preview.png" alt="VECTUS: interactive exploded 3D view of an original aircraft concept. Click to open." width="100%">
</a>
```

## Re-shooting `preview.png`

Open `index.html?poster` at an 840×472 viewport with device pixel ratio 2. This gives a 1680×944 image, which displays 1:1 on retina screens at GitHub's ~840px README width and keeps the Bayer pattern from going moiré. Poster mode hides the controls, shows the "Open interactive 3D view" chip and skips the intro animation.

The included `preview.png` is captured locally with the bundled Archivo and IBM Plex Mono fonts loaded.

## URL flags

| Flag | Effect |
|---|---|
| `?poster` | README still frame: no controls, no intro |
| `?still` | skip intro animation |
| `?view=clean` | start in clean (non-dithered) shading |

## Controls

- **Pointer:** drag to orbit, wheel or pinch to zoom, click a part or callout to select it.
- **Keyboard** (with the 3D stage focused): arrow keys orbit (hold Shift for bigger steps), `+`/`−` zoom, `[` `]` change separation, `E` toggles assembled/exploded, `V` switches dither/clean, `R` resets, `Esc` clears the selection.
- **Callouts** are real buttons, reachable with Tab.
- **`prefers-reduced-motion`** turns off the intro, eased separation and orbit inertia.
- **Phones** get a separate portrait pose with taller vertical separation, and the callouts collapse to numbers.

## Editing the design

All of these live in `assets/vectus-engine.js`:

- **`buildParts()`**: each component's geometry, callout anchor, explode offset `off`, stagger `delay`, name and description.
- **`prof(s)`**: the fuselage cross-section along its length, giving width, top and bottom height. `ring()` and `shell()` loft the layered shells from it.
- **`THEME`**: background, graphite ramp (5 tones) and line colours.
- **`MESH_FS`**: lighting plus 8×8 Bayer dithering. `uCell` sets the dither cell size in device pixels.
- **`LAND`** and **`PORT`**: default camera poses for landscape and portrait.

## Credits

Renderer: [three.js](https://threejs.org) (MIT, © three.js authors), bundled unmodified as an IIFE build. Concept, geometry and UI are original.
