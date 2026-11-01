# Maintaining the garden

The profile README uses `assets/signal-garden.svg` and native GitHub disclosures. The interactive version is a static site in `docs/`, hosted with GitHub Pages from `main /docs`.

No dependencies or build step are required for the site. Preview from the repository root:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open http://127.0.0.1:8765/docs/.

Edit the biography in `README.md` and `docs/index.html`. The artwork is generated in `docs/art.mjs`; after changing it, update the committed README print and no-JavaScript fallback:

```sh
node scripts/render-art.mjs
```

Before publishing, check all four branches, returning to the garden, regrowing, SVG download, keyboard access, mobile layout, and reduced-motion behavior. With JavaScript disabled, the static artwork and all four stories remain readable.
