# Maintaining the Tree of Paths

The GitHub profile README and static GitHub Pages site share their biography in `content/chapters.mjs`. Edit that file, then run:

```sh
node scripts/build.mjs
```

Commit the generated `README.md` and `docs/index.html` alongside the content change. No third-party dependencies are required. GitHub Pages publishes `main /docs`.

## Preview

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open http://127.0.0.1:8765/docs/.

## Behavior

Each memory is a native link to a readable chronicle entry. With JavaScript, it opens a native modal dialog, lights its path, and marks the memory visited for this visit. Next/previous controls follow the chapter sequence. Escape and the close button return focus to the opener. Deep links open the matching memory; former garden links remain supported. There is no stored visitor data.

Reduced-motion preferences suppress animation. The Stillness control pauses the atmospheric lights. Without JavaScript, the tree artwork and all nine native chronicle disclosures remain available.

Before publishing, verify all memories, next/previous boundaries, escape/backdrop close, focus restoration, deep links, no-JavaScript links, reduced motion, mobile layout, and the artwork download. Confirm the GitHub-rendered README preserves all disclosures.

## Artwork provenance

`docs/tree-of-paths.png` is an original illustration generated with the built-in image generation tool. The exact prompt is in `content/art-prompt.txt`. Inspiration: the Tree of Life and the atmosphere of Attack on Titan; all biographical chapters are Vikram's own. Facts come from the original public profile README and public GitHub repository descriptions, not inferred private history.
