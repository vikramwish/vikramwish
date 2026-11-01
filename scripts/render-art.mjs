import { mkdir, writeFile } from 'node:fs/promises';
import { drawGarden, gardenSVG } from '../docs/art.mjs';
const root = new URL('../', import.meta.url);
await mkdir(new URL('assets/', root), { recursive: true });
await writeFile(new URL('docs/garden.svg', root), gardenSVG());
const banner = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600">
  <title>Vikram's signal garden — enter to explore</title>
  <desc>A self-portrait in four flowering threads: build, teach, research and wander. Click to enter an interactive garden.</desc>
  <rect width="1200" height="600" rx="8" fill="#eef3f7"/>
  <g font-family="Georgia,serif" fill="#223e67">
    <text x="55" y="80" font-size="33">vikram<tspan fill="#ab482e"> ✳</tspan></text>
    <text x="55" y="232" font-size="57">A little</text>
    <text x="55" y="296" font-size="57" font-style="italic">curiosity.</text>
  </g>
  <g font-family="Arial,sans-serif" fill="#223e67" font-size="17">
    <text x="57" y="346">Software, science &amp; the things between.</text>
    <text x="57" y="374">Sydney, Australia</text>
    <rect x="55" y="425" width="222" height="49" rx="25" fill="#223e67"/>
    <text x="79" y="456" fill="#ffffff">Enter the garden ↗</text>
    <text x="57" y="548" font-size="13" fill="#526783">An interactive self-portrait. Come explore.</text>
  </g>
  <g transform="translate(427 22) scale(.82)">${drawGarden()}</g>
  <g font-family="Arial,sans-serif" font-size="15" text-anchor="middle">
    <g fill="#184fc6"><rect x="544" y="278" width="78" height="37" rx="19" fill="#eef3f7"/><text x="583" y="302">Build</text></g>
    <g fill="#ab482e"><rect x="869" y="134" width="84" height="37" rx="19" fill="#eef3f7"/><text x="911" y="158">Teach</text></g>
    <g fill="#087773"><rect x="977" y="314" width="107" height="37" rx="19" fill="#eef3f7"/><text x="1030" y="338">Research</text></g>
    <g fill="#75549e"><rect x="646" y="105" width="94" height="37" rx="19" fill="#eef3f7"/><text x="693" y="129">Wander</text></g>
  </g>
</svg>`;
await writeFile(new URL('assets/signal-garden.svg', root), banner);
