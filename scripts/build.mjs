import { readFile, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { chapters } from '../content/chapters.mjs';
import { locations } from '../content/locations.mjs';

const root=new URL('../',import.meta.url);
const geography=JSON.parse(await readFile(new URL('content/geography/land.geojson',root),'utf8'));
const polygons=geography.features.flatMap(f=>f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates);
const shape=polygons.map(rings=>`<path d="${rings.map(ring=>ring.map(([lon,lat],i)=>`${i?'L':'M'}${((lon+180)/360*2048).toFixed(2)},${((90-lat)/180*1024).toFixed(2)}`).join(' ')+'Z').join(' ')}"/>`).join('');
await writeFile(new URL('docs/land.svg',root),`<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="1024"><rect width="2048" height="1024" fill="#68756b"/><g fill="#e3e8dc" fill-rule="evenodd">${shape}</g></svg>`);
function inRing(lon,lat,ring){let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const [x,y]=ring[i],[px,py]=ring[j];if((y>lat)!==(py>lat)&&lon<(px-x)*(lat-y)/(py-y)+x)inside=!inside;}return inside;}
const land=(lon,lat)=>polygons.some(rings=>inRing(lon,lat,rings[0])&&!rings.slice(1).some(r=>inRing(lon,lat,r)));
const radians=Math.PI/180,viewLat=-18*radians,viewLon=130*radians;
function project(lat,lon){lat*=radians;lon=lon*radians-viewLon;return{x:Math.cos(lat)*Math.sin(lon),y:Math.cos(viewLat)*Math.sin(lat)-Math.sin(viewLat)*Math.cos(lat)*Math.cos(lon),z:Math.sin(viewLat)*Math.sin(lat)+Math.cos(viewLat)*Math.cos(lat)*Math.cos(lon)};}
let points='';
for(let lat=-88;lat<89;lat+=1.55){const step=1.55/Math.max(Math.cos(lat*radians),.08);for(let lon=-180;lon<180;lon+=step){const p=project(lat,lon);if(p.z>0&&land(lon,lat))points+=`<circle cx="${(450+p.x*250).toFixed(2)}" cy="${(325-p.y*250).toFixed(2)}" r="${(1.1+p.z*.65).toFixed(2)}"/>`;}}
let grid='';
for(const latitude of [-60,-30,0,30,60]){let d='';for(let l=-180;l<=180;l+=2){const p=project(latitude,l);if(p.z>0)d+=`${d?'L':'M'}${(450+p.x*252).toFixed(2)},${(325-p.y*252).toFixed(2)} `;else if(d){grid+=`<path d="${d}"/>`;d='';}}if(d)grid+=`<path d="${d}"/>`;}
const globe=`<g><ellipse cx="450" cy="325" rx="327" ry="94" transform="rotate(-21 450 325)" fill="none" stroke="#929b8e" stroke-width="1"/><circle cx="450" cy="325" r="250" fill="#e4e7df" stroke="#727c6e"/><g fill="#182018">${points}</g><g fill="none" stroke="#7d8979" stroke-width=".65" opacity=".55">${grid}</g><path d="M440 325h20M450 315v20" stroke="#e04a25"/></g>`;
await writeFile(new URL('docs/globe.svg',root),`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="650" viewBox="0 0 900 650"><title>Vikram’s orbital atlas, centered on Asia and Australia</title>${globe}</svg>`);


const entry=c=>`<p class="entry-meta">${c.place} <span>/</span> ${c.time}</p><h3>${c.title}</h3><div class="entry-body">${c.body}</div>`;
const entries=chapters.map(c=>`<div class="entry-copy${c.id==='workshop'?' default-entry':''}" id="entry-${c.id}">${entry(c)}</div>`).join('\n');
const locationButtons=locations.map((l,i)=>`<a href="#entry-${l.chapter}" data-location="${l.id}" class="station"><span class="station-code">${l.code}</span><strong>${l.name}</strong><span>${l.detail}</span><i aria-hidden="true">↗</i></a>`).join('');
const pins=locations.map(l=>`<button class="pin" data-pin="${l.id}" aria-label="Explore ${l.name}: ${l.detail}" hidden><span class="pin-dot" aria-hidden="true"></span><span>${l.code}</span></button>`).join('');
const tabs=chapters.map((c,i)=>`<a href="#entry-${c.id}" data-chapter="${c.id}"><span>${String(i+1).padStart(2,'0')}</span>${c.name}</a>`).join('');

const html=`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f2f3ef"><meta name="description" content="Vikram's orbital atlas. Explore software, research, teaching, and a life across places through an interactive dithered globe."><title>Vikram / Orbital Atlas</title><link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23182018'/%3E%3Cpath d='M8 10L18 30L29 10M33 10L22 30' stroke='%23f2f3ef' fill='none' stroke-width='2'/%3E%3C/svg%3E"><link rel="preload" as="font" href="fonts/BarlowCondensed-SemiBold.ttf" type="font/ttf" crossorigin><link rel="stylesheet" href="style.css"><script type="module" src="atlas.js"></script></head>
<body><a class="skip-link" href="#profile-tabs">Skip to profile entries</a>
<main class="atlas-preview" id="atlas-preview">
<section class="atlas-layout" aria-labelledby="atlas-title">
  <div class="atlas-main">
    <div class="instrument-header"><h1 id="atlas-title">Orbital atlas</h1><p id="view-label">Explore the globe</p><span class="instrument-cross" aria-hidden="true">+</span></div>
    <div class="viewport" id="viewport"><div class="registration" aria-hidden="true"><span>90° N</span><span>0°</span><span>90° S</span></div><img id="globe-fallback" src="globe.svg" width="900" height="650" alt="A geographic globe showing Asia and Australia, with orbital rings."><canvas id="globe-canvas" tabindex="0" role="img" aria-label="Interactive globe. Drag or use arrow keys to rotate. Select a place using the location buttons." aria-describedby="globe-help" hidden></canvas><div id="pin-layer">${pins}</div><div class="viewport-label"><span class="live-dot" aria-hidden="true"></span><span id="location-readout">Profile entry / no mapped location</span></div><p id="globe-help" hidden>Drag to orbit · Arrow keys also work</p><p id="fallback-message" role="status" hidden>3D view unavailable. Explore using the location list and entry tabs.</p></div>
    <div class="render-controls" id="render-controls" hidden><fieldset><legend>Render</legend><button type="button" data-render="bayer" aria-pressed="true">Bayer</button><button type="button" data-render="halftone" aria-pressed="false">Halftone</button><button type="button" data-render="clean" aria-pressed="false">Clean</button></fieldset><label class="grain">Grain <input id="grain" type="range" min="2" max="8" value="2" step="1"><output id="grain-value" for="grain">2</output></label><div class="orbit-tools"><button id="spin" type="button" aria-pressed="false">Spin</button><button id="reset-view" type="button">Reset view ↺</button></div></div>
    <nav class="stations" aria-label="Explore locations" style="--location-count:${locations.length}">${locationButtons}</nav>
  </div>
  <aside class="field-note" aria-label="Selected profile entry"><div class="note-top"><span>Selected entry</span><span id="note-number" hidden></span></div><div id="selected-copy">${entries}</div><div class="note-navigation"><button id="previous-entry" type="button" hidden>← Previous</button><button id="next-entry" type="button" hidden>Next →</button></div><p class="note-footer">A location is a starting point.<br>The work tells the rest.</p></aside>
</section>
<p class="sr-only" id="selection-status" role="status"></p><nav class="profile-tabs" id="profile-tabs" aria-label="Select a profile entry" style="--entry-count:${chapters.length}">${tabs}</nav>
</main>
</body></html>`;
await writeFile(new URL('docs/index.html',root),html);
const readme=`<a href="https://vikramwish.github.io/vikramwish/vectus/"><img src="docs/vectus/preview.png" width="100%" alt="VECTUS — interactive exploded aircraft concept. Click to rotate the model, separate its thirteen components, and inspect each part."></a>\n`;
await writeFile(new URL('README.md',root),readme);
await build({entryPoints:[new URL('src/app.mjs',root).pathname],outfile:new URL('docs/atlas.js',root).pathname,bundle:true,minify:true,format:'esm',target:['es2022'],legalComments:'linked'});
console.log('Built atlas and README; standalone Vectus viewer retained.');
