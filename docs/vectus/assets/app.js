/* VECTUS standalone viewer: binds the engine to the HTML controls. */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var app = $('#app'), stage = $('#stage'), canvas = $('#gl'), svg = $('#leaders'), layer = $('#callouts');
  var sep = $('#sep'), sepOut = $('#sepOut'), toggleBtn = $('#toggleExplode');
  var infoEl = $('#info'), infoK = $('#infoK'), infoName = $('#infoName'), infoDesc = $('#infoDesc');
  var params = new URLSearchParams(location.search);
  var poster = params.has('poster');
  if (poster) { app.classList.add('is-poster'); var chip = $('#openChip'); chip.removeAttribute('aria-hidden'); chip.removeAttribute('tabindex'); }

  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var SVGNS = 'http://www.w3.org/2000/svg';
  var refs = {};
  var opts = {
    THREE: window.THREE,
    reducedMotion: mq.matches || params.has('still'),
    noIntro: poster || params.has('still'),
    preserveDrawingBuffer: poster,
    interactionEl: stage,
    safeTop: 64, safeBottom: 140,
    onUpdate: onUpdate, onSelect: onSelect, onError: onError
  };

  function measure() {
    var w = stage.clientWidth, compact = w < 720;
    if (poster) { opts.safeTop = 70; opts.safeBottom = 60; opts.shiftY = 0; return; }
    var controls = document.querySelector('.controls').getBoundingClientRect();
    var top = stage.getBoundingClientRect().top;
    opts.safeTop = compact ? 64 : 70;
    opts.safeBottom = Math.round(stage.clientHeight - (controls.top - top)) + (compact ? 40 : 34);
    opts.shiftY = 0;
  }
  measure();

  var eng = window.VectusEngine && window.VectusEngine.create(canvas, opts);
  if (!eng) { onError(); return; }
  window.__vectus = eng;

  // Callouts: real buttons so they are tabbable and announced.
  eng.parts.forEach(function (p) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'callout'; b.dataset.id = p.id;
    b.setAttribute('aria-pressed', 'false');
    b.setAttribute('aria-label', p.num + ', ' + p.name);
    b.innerHTML = '<span class="n">' + p.num + '</span><span class="c">' + p.code + '</span>';
    b.addEventListener('click', function () { eng.select(eng.state.selected === p.id ? null : p.id); });
    layer.appendChild(b);
    var g = document.createElementNS(SVGNS, 'g');
    var line = document.createElementNS(SVGNS, 'line'), dot = document.createElementNS(SVGNS, 'circle');
    dot.setAttribute('r', '2.5'); g.appendChild(line); g.appendChild(dot); svg.appendChild(g);
    refs[p.id] = { b: b, g: g, line: line, dot: dot };
  });

  function onUpdate(s) {
    s.callouts.forEach(function (c) {
      var r = refs[c.id]; if (!r) return;
      var b = r.b, w = b.offsetWidth, h = b.offsetHeight;
      var x = c.side < 0 ? c.lx - w : c.lx, y = c.ly - h / 2;
      x = Math.max(8, Math.min(x, s.width - w - 8));
      b.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      b.style.opacity = c.opacity;
      var hidden = c.opacity < 0.08;
      b.classList.toggle('is-hidden', hidden);
      b.tabIndex = hidden ? -1 : 0;
      if (hidden) b.setAttribute('aria-hidden', 'true'); else b.removeAttribute('aria-hidden');
      b.setAttribute('aria-pressed', c.selected ? 'true' : 'false');
      r.line.setAttribute('x1', c.ax); r.line.setAttribute('y1', c.ay);
      r.line.setAttribute('x2', c.lx); r.line.setAttribute('y2', c.ly);
      r.dot.setAttribute('cx', c.ax); r.dot.setAttribute('cy', c.ay);
      r.g.style.opacity = c.opacity * (c.selected ? 1 : 0.7);
      r.g.classList.toggle('sel', c.selected);
    });
    var pct = Math.round(s.target * 100);
    if (document.activeElement !== sep) sep.value = pct;
    sepOut.textContent = pct + '%';
    sep.setAttribute('aria-valuetext', pct === 0 ? 'Assembled' : pct + ' percent exploded');
    var assembled = s.target < 0.5;
    toggleBtn.textContent = assembled ? 'Explode' : 'Assemble';
    toggleBtn.setAttribute('aria-label', assembled ? 'Explode' : 'Assemble');
    app.dataset.mode = s.mode;
    document.querySelectorAll('.seg button').forEach(function (bt) { bt.setAttribute('aria-pressed', bt.dataset.mode === s.mode ? 'true' : 'false'); });
    if (!window.__vectusReady) { window.__vectusReady = true; document.documentElement.dataset.ready = '1'; }
  }

  function onSelect(p) {
    if (p) {
      infoK.textContent = p.num + ' / ' + p.code;
      infoName.textContent = p.name;
      infoDesc.textContent = p.desc;
      infoEl.classList.remove('is-empty'); app.classList.add('has-selection');
    } else {
      infoK.textContent = 'Index';
      infoName.textContent = 'Select a component';
      infoDesc.textContent = 'Choose a callout or click the model. Drag to orbit.';
      infoEl.classList.add('is-empty'); app.classList.remove('has-selection');
    }
  }
  infoEl.classList.add('is-empty');

  function onError() {
    var fb = $('#fallback'); if (fb) fb.hidden = false;
  }

  sep.addEventListener('input', function () { eng.setExplode(sep.value / 100); });
  toggleBtn.addEventListener('click', function () { eng.setExplode(eng.state.target < 0.5 ? eng.defaults.explode : 0); });
  document.querySelectorAll('.seg button').forEach(function (bt) {
    bt.addEventListener('click', function () { eng.setMode(bt.dataset.mode); });
  });
  $('#reset').addEventListener('click', function () { eng.reset(); });
  stage.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (eng.handleKey(e.key, e.shiftKey)) e.preventDefault();
  });
  if (mq.addEventListener) mq.addEventListener('change', function (e) { eng.setReducedMotion(e.matches); });
  window.addEventListener('resize', function () { measure(); eng.resize(); eng.renderNow(); });
  canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); onError(); });
  canvas.addEventListener('webglcontextrestored', function () { $('#fallback').hidden = true; eng.renderNow(); });
  if (document.fonts) document.fonts.ready.then(function () { measure(); eng.resize(); eng.renderNow(); });
  if (params.get('view') === 'clean') eng.setMode('clean');
})();
