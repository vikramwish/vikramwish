import { createAtlas } from './atlas.mjs';
import { locations } from '../content/locations.mjs';
import { chapters } from '../content/chapters.mjs';

const canvas=document.querySelector('#globe-canvas');
const pins=[...document.querySelectorAll('[data-pin]')];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const spin=document.querySelector('#spin');
const aliases={build:'cogniti',teach:'teaching',research:'signal',wander:'roots'};
let active='workshop';
let atlas=null;
function coords(location){if(location.countryLevel)return `${location.name} / country-level pin`;return `${Math.abs(location.lat).toFixed(4)}° ${location.lat<0?'S':'N'} / ${Math.abs(location.lon).toFixed(4)}° ${location.lon<0?'W':'E'}`;}
function select(id,{focusGlobe=true,updateURL=true,focusNote=false}={}){
  id=id.replace(/^entry-/, '');
  id=aliases[id]||id;
  const index=chapters.findIndex(c=>c.id===id);
  if(index<0)return;
  active=id;
  document.querySelector("#selection-status").textContent=`Selected ${chapters[index].name}, ${chapters[index].place}, ${chapters[index].time}.`;
  const chapter=chapters[index];
  const location=locations.find(l=>l.id===chapter.location);
  const copy=document.querySelector(`#entry-${id}`);
  document.querySelector('#note-title')?.removeAttribute('id');
  document.querySelectorAll('#selected-copy > .entry-copy').forEach(entry=>{entry.hidden=entry!==copy;});
  const title=copy.querySelector('h3');title.id='note-title';title.tabIndex=-1;
  document.querySelector('#note-number').textContent=`${String(index+1).padStart(2,'0')} / ${String(chapters.length).padStart(2,'0')}`;
  document.querySelectorAll('[data-chapter]').forEach(link=>link.setAttribute('aria-current',String(link.dataset.chapter===id)));
  document.querySelectorAll('[data-location]').forEach(link=>link.setAttribute('aria-current',String(link.dataset.location===chapter.location)));
  pins.forEach(pin=>pin.setAttribute('aria-pressed',String(pin.dataset.pin===chapter.location)));
  document.querySelector('#location-readout').textContent=location?coords(location):'Profile entry / no mapped location';
  document.querySelector('#view-label').textContent=location?(location.countryLevel?location.name:`${location.name} / ${location.country}`):'Explore the globe';
  document.querySelector('#previous-entry').disabled=index===0;
  document.querySelector('#next-entry').disabled=index===chapters.length-1;
  spin.setAttribute('aria-pressed','false');
  atlas?.setSpin(false);
  if(location&&focusGlobe)atlas?.focus(location);
  if(updateURL)history.replaceState(null,'',`#${id}`);
  if(focusNote){title.focus({preventScroll:true});if(matchMedia('(max-width: 900px)').matches)document.querySelector('.field-note').scrollIntoView({block:'start',behavior:'instant'});}
}
function showFallback(){
  document.querySelector('#globe-fallback').hidden=false;
  document.querySelector('#fallback-message').hidden=false;
  document.querySelector('#globe-help').hidden=true;
  document.querySelector('#render-controls').hidden=true;
  canvas.hidden=true;pins.forEach(pin=>pin.hidden=true);
}
// Profile navigation remains functional even if creating WebGL fails.
document.querySelectorAll('[data-chapter]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();select(link.dataset.chapter,{focusNote:true});}));
document.querySelectorAll('[data-location]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();select(locations.find(l=>l.id===link.dataset.location).chapter);}));
pins.forEach(pin=>pin.addEventListener('click',()=>select(locations.find(l=>l.id===pin.dataset.pin).chapter)));
document.querySelector('#previous-entry').addEventListener('click',()=>{const index=chapters.findIndex(c=>c.id===active);if(index>0)select(chapters[index-1].id,{focusNote:true});});
document.querySelector('#next-entry').addEventListener('click',()=>{const index=chapters.findIndex(c=>c.id===active);if(index<chapters.length-1)select(chapters[index+1].id,{focusNote:true});});
document.documentElement.classList.add('js-ready');
document.querySelector('#note-number').hidden=false;
document.querySelector('#previous-entry').hidden=false;document.querySelector('#next-entry').hidden=false;
canvas.hidden=false;
try {
  atlas=createAtlas({canvas,
    onProject(projected){for(const point of projected){const pin=pins.find(p=>p.dataset.pin===point.id);pin.hidden=!point.visible;pin.style.left=`${point.x*100}%`;pin.style.top=`${point.y*100}%`;}},
    onReady(){document.querySelector('#globe-help').hidden=false;document.querySelector('#globe-fallback').hidden=true;document.querySelector('#render-controls').hidden=false;document.querySelector('#viewport').dataset.ready='true';},
    onError:showFallback
  });
}catch{showFallback();}
document.querySelectorAll('[data-render]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('[data-render]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  atlas?.setMethod(button.dataset.render);
  document.querySelector('#grain').disabled=button.dataset.render==='clean';
}));
document.querySelector('#grain').addEventListener('input',event=>{document.querySelector('#grain-value').value=event.target.value;atlas?.setGrid(event.target.value);});
spin.addEventListener('click',()=>{const value=spin.getAttribute('aria-pressed')!=='true';spin.setAttribute('aria-pressed',String(value));atlas?.setSpin(value);});
canvas.addEventListener('pointerdown',()=>spin.setAttribute('aria-pressed','false'));
canvas.addEventListener('keydown',event=>{if(event.key.startsWith('Arrow'))spin.setAttribute('aria-pressed','false');});
document.querySelector('#reset-view').addEventListener('click',()=>{spin.setAttribute('aria-pressed','false');atlas?.setSpin(false);atlas?.reset();});
function motion(){spin.disabled=reduced.matches;if(reduced.matches){spin.setAttribute('aria-pressed','false');atlas?.setSpin(false);}}
reduced.addEventListener('change',motion);motion();
window.addEventListener('hashchange',()=>select(location.hash.slice(1),{updateURL:false}));
select(location.hash.slice(1)||'workshop',{updateURL:false,focusGlobe:Boolean(location.hash)});
window.addEventListener('pagehide',event=>{if(!event.persisted)atlas?.destroy();});
