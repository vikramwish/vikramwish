import { branches, drawGarden, gardenSVG } from './art.mjs';
const threads = document.querySelector('#threads');
const drawing = document.querySelector('.drawing');
const controls = [...document.querySelectorAll('[data-branch]')];
const stories = [...document.querySelectorAll('.story')];
const welcome = document.querySelector('#welcome');
const reset = document.querySelector('#reset');
const status = document.querySelector('#art-status');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let seed = 2027;
let active = '';
let frame = 0;
let bend = { x: 0, y: 0 };
let target = { x: 0, y: 0 };
function render() { threads.innerHTML = drawGarden(seed, bend.x, bend.y, active); }
function select(id, scroll = false) {
  active = branches.some(branch => branch.id === id) ? id : '';
  controls.forEach(button => button.setAttribute('aria-expanded', String(button.dataset.branch === active)));
  stories.forEach(story => { story.hidden = story.id !== active; });
  welcome.hidden = Boolean(active);
  reset.hidden = !active;
  render();
  if (scroll && matchMedia('(max-width: 760px)').matches) {
    document.querySelector('#stories').scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'start' });
  }
}
function tick() {
  bend.x += (target.x - bend.x) * 0.12;
  bend.y += (target.y - bend.y) * 0.12;
  render();
  frame = Math.abs(target.x - bend.x) + Math.abs(target.y - bend.y) > 0.2 ? requestAnimationFrame(tick) : 0;
}
function move(x, y) {
  if (reduced.matches) return;
  target = { x, y };
  if (!frame) frame = requestAnimationFrame(tick);
}
drawing.addEventListener('pointermove', event => {
  // Touch remains normal page scrolling; named controls work with every input.
  if (event.pointerType === 'touch') return;
  const rect = drawing.getBoundingClientRect();
  move(((event.clientX - rect.left) / rect.width - 0.5) * 100, ((event.clientY - rect.top) / rect.height - 0.5) * 55);
});
drawing.addEventListener('pointerleave', () => move(0, 0));
reduced.addEventListener('change', () => {
  cancelAnimationFrame(frame);
  frame = 0;
  bend = target = { x: 0, y: 0 };
  render();
});
controls.forEach(button => button.addEventListener('click', () => {
  const id = button.dataset.branch === active ? '' : button.dataset.branch;
  select(id, Boolean(id));
  history.replaceState(null, '', id ? `#${id}` : location.pathname + location.search);
}));
reset.addEventListener('click', () => {
  const previous = active;
  select('');
  history.replaceState(null, '', location.pathname + location.search);
  controls.find(button => button.dataset.branch === previous)?.focus();
});
window.addEventListener('hashchange', () => select(location.hash.slice(1)));
document.querySelector('#regrow').addEventListener('click', () => {
  seed = crypto.getRandomValues(new Uint32Array(1))[0];
  render();
  status.textContent = `A new garden has grown. Drawing ${seed}.`;
});
document.querySelector('#save').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([gardenSVG(seed)], { type: 'image/svg+xml' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `vikram-signal-garden-${seed}.svg`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  status.textContent = 'Your garden drawing is ready to save as an SVG.';
});
select(location.hash.slice(1));
document.querySelector('.branch-controls').hidden = false;
document.querySelector('.art-tools').hidden = false;
