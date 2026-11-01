const dialog = document.querySelector('#memory-dialog');
const content = document.querySelector('#memory-content');
const memories = [...document.querySelectorAll('.memories [data-memory]')];
const ids = memories.map(link => link.dataset.memory);
const paths = [...document.querySelectorAll('[data-path]')];
const previous = document.querySelector('#previous-memory');
const next = document.querySelector('#next-memory');
const motion = document.querySelector('#motion');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const visited = new Set();
const aliases = { build: 'cogniti', teach: 'teaching', research: 'signal', wander: 'roots' };
let active = -1;
let returnFocus = null;
let returnScroll = 0;
let manualStillness = false;

function applyMotion() {
  const still = reduced.matches || manualStillness;
  document.body.classList.toggle('still', still);
  motion.setAttribute('aria-pressed', String(still));
  motion.textContent = still ? 'Stillness on' : 'Stillness';
  motion.disabled = reduced.matches;
  motion.title = reduced.matches ? 'Your device prefers reduced motion.' : 'Pause or resume the drifting lights.';
}

function openMemory(id, updateURL = true) {
  id = aliases[id] || id;
  const index = ids.indexOf(id);
  if (index < 0) return false;
  if (!dialog.open) {
    returnFocus = document.activeElement;
    returnScroll = window.scrollY;
    document.querySelector('.world').scrollIntoView({ behavior: 'instant', block: 'start' });
  }
  active = index;
  visited.add(id);
  content.replaceChildren(document.querySelector(`#chapter-${id} .chapter-content`).cloneNode(true));
  const heading = content.querySelector('h3');
  heading.id = 'memory-title';
  heading.tabIndex = -1;
  document.querySelector('#memory-position').textContent = `Memory ${String(index + 1).padStart(2, '0')} / ${String(ids.length).padStart(2, '0')}`;
  document.querySelector('#progress').textContent = visited.size === ids.length ? 'Every chapter visited. The story keeps growing.' : `${visited.size} of ${ids.length} chapters visited`;
  memories.forEach(link => {
    link.classList.toggle('visited', visited.has(link.dataset.memory));
    if (link.dataset.memory === id) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
  paths.forEach(path => path.classList.toggle('active', path.dataset.path === id));
  previous.disabled = index === 0;
  next.textContent = index === ids.length - 1 ? 'Return to the tree' : 'Next chapter ↗';
  if (updateURL) history.replaceState(null, '', `#${id}`);
  if (!dialog.open) dialog.showModal();
  document.body.classList.add('memory-open');
  dialog.scrollTop = 0;
  heading.focus({ preventScroll: true });
  return true;
}

function closeMemory() { dialog.close(); }

document.querySelectorAll('[data-memory]').forEach(link => {
  // Native anchor behavior remains available if the module cannot initialize.
  link.addEventListener('click', event => {
    event.preventDefault();
    openMemory(link.dataset.memory);
  });
});
document.querySelector('#close-memory').addEventListener('click', closeMemory);
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeMemory();
});
dialog.addEventListener('close', () => {
  document.body.classList.remove('memory-open');
  window.scrollTo({ top: returnScroll, behavior: 'instant' });
  paths.forEach(path => path.classList.remove('active'));
  memories.forEach(link => link.removeAttribute('aria-current'));
  if (ids.includes(location.hash.slice(1)) || aliases[location.hash.slice(1)]) history.replaceState(null, '', location.pathname + location.search);
  if (returnFocus instanceof HTMLElement && returnFocus !== document.body) returnFocus.focus({ preventScroll: true });
  else memories[active]?.focus({ preventScroll: true });
});
previous.addEventListener('click', () => { if (active > 0) openMemory(ids[active - 1]); });
next.addEventListener('click', () => { if (active < ids.length - 1) openMemory(ids[active + 1]); else closeMemory(); });
motion.addEventListener('click', () => { manualStillness = !manualStillness; applyMotion(); });
reduced.addEventListener('change', applyMotion);
window.addEventListener('hashchange', () => {
  if (!openMemory(location.hash.slice(1), false) && dialog.open) closeMemory();
});
// Standard anchor links still lead to the readable chronicle without JavaScript.
memories.forEach(link => { link.href = `#${link.dataset.memory}`; });
motion.hidden = false;
applyMotion();
openMemory(location.hash.slice(1), false);
