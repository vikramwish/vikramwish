/*!
 * VECTUS exploded-view engine — three.js (global THREE, r187).
 * Illustrative concept art. Geometry is procedural and fictional;
 * it encodes no real dimensions, capabilities or specifications.
 * Exposes window.VectusEngine.create(canvas, options).
 */
(function (global) {
  'use strict';

  /* ------------------------------------------------------------------ math */
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function scl(a, s) { return [a[0] * s, a[1] * s, a[2] * s]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function len(a) { return Math.sqrt(dot(a, a)); }
  function norm(a) { var l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function smoothstep(a, b, x) { return smooth((x - a) / (b - a)); }
  function sgn(x) { return x < 0 ? -1 : 1; }

  function perspective(fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
  }
  function lookAt(eye, c, up) {
    var z = norm(sub(eye, c)), x = norm(cross(up, z)), y = cross(z, x);
    return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0,
      -dot(x, eye), -dot(y, eye), -dot(z, eye), 1];
  }
  function mul(a, b) {
    var o = new Array(16);
    for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
    return o;
  }
  function xf(m, p) {
    return [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
      m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
      m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14],
      m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15]];
  }

  /* -------------------------------------------------------------- geometry */
  function Geo() { this.p = []; this.s = []; this.i = []; }
  Geo.prototype.v = function (p, shade) { this.p.push(p[0], p[1], p[2]); this.s.push(shade == null ? 1 : shade); return this.p.length / 3 - 1; };
  Geo.prototype.t = function (a, b, c) { this.i.push(a, b, c); };
  Geo.prototype.q = function (a, b, c, d) { this.i.push(a, b, c, a, c, d); };
  // rows: array of point arrays (same length). closeU wraps each row.
  Geo.prototype.grid = function (rows, closeU, shade) {
    var n = rows[0].length, idx = [], r, k;
    for (r = 0; r < rows.length; r++) { idx.push([]); for (k = 0; k < n; k++) idx[r].push(this.v(rows[r][k], shade)); }
    var m = closeU ? n : n - 1;
    for (r = 0; r < rows.length - 1; r++) for (k = 0; k < m; k++) {
      var k2 = (k + 1) % n;
      this.q(idx[r][k], idx[r + 1][k], idx[r + 1][k2], idx[r][k2]);
    }
    return idx;
  };
  Geo.prototype.fan = function (ring, shade) {
    var c = [0, 0, 0], k;
    for (k = 0; k < ring.length; k++) c = add(c, ring[k]);
    c = scl(c, 1 / ring.length);
    var ci = this.v(c, shade), ids = [];
    for (k = 0; k < ring.length; k++) ids.push(this.v(ring[k], shade));
    for (k = 0; k < ring.length; k++) this.t(ci, ids[k], ids[(k + 1) % ring.length]);
  };
  Geo.prototype.merge = function (g) {
    var base = this.p.length / 3;
    this.p = this.p.concat(g.p); this.s = this.s.concat(g.s);
    for (var k = 0; k < g.i.length; k++) this.i.push(g.i[k] + base);
    return this;
  };
  Geo.prototype.normals = function () {
    var n = new Float32Array(this.p.length), p = this.p, i = this.i, k;
    for (k = 0; k < i.length; k += 3) {
      var a = i[k] * 3, b = i[k + 1] * 3, c = i[k + 2] * 3;
      var e1 = [p[b] - p[a], p[b + 1] - p[a + 1], p[b + 2] - p[a + 2]];
      var e2 = [p[c] - p[a], p[c + 1] - p[a + 1], p[c + 2] - p[a + 2]];
      var f = cross(e1, e2);
      for (var j = 0; j < 3; j++) { var o = i[k + j] * 3; n[o] += f[0]; n[o + 1] += f[1]; n[o + 2] += f[2]; }
    }
    for (k = 0; k < n.length; k += 3) {
      var l = Math.sqrt(n[k] * n[k] + n[k + 1] * n[k + 1] + n[k + 2] * n[k + 2]) || 1;
      n[k] /= l; n[k + 1] /= l; n[k + 2] /= l;
    }
    return n;
  };
  // Feature edges: boundaries and creases sharper than `deg`.
  Geo.prototype.edges = function (deg) {
    var p = this.p, ix = this.i, keyOf = {}, uid = 0, canon = [], pos = [];
    function key(v) {
      var k = Math.round(p[v * 3] * 1e4) + ',' + Math.round(p[v * 3 + 1] * 1e4) + ',' + Math.round(p[v * 3 + 2] * 1e4);
      if (keyOf[k] == null) { keyOf[k] = uid++; pos.push([p[v * 3], p[v * 3 + 1], p[v * 3 + 2]]); }
      return keyOf[k];
    }
    var map = {}, k, out = [], th = Math.cos(deg * Math.PI / 180);
    for (k = 0; k < ix.length; k += 3) {
      var a = key(ix[k]), b = key(ix[k + 1]), c = key(ix[k + 2]);
      if (a === b || b === c || a === c) continue;
      var fn = norm(cross(sub(pos[b], pos[a]), sub(pos[c], pos[a])));
      [[a, b], [b, c], [c, a]].forEach(function (e) {
        var lo = Math.min(e[0], e[1]), hi = Math.max(e[0], e[1]), h = lo + '_' + hi;
        (map[h] || (map[h] = { a: lo, b: hi, n: [] })).n.push(fn);
      });
    }
    for (var h in map) {
      var e = map[h], feat = e.n.length === 1;
      if (!feat) { var d = Math.abs(dot(e.n[0], e.n[1])); feat = d < th; }
      if (feat) out.push(pos[e.a], pos[e.b]);
    }
    return out;
  };

  /* --- primitive builders ------------------------------------------------ */
  function supEll(theta, w, ht, hb, nTop, nBot, yc) {
    var c = Math.cos(theta), s = Math.sin(theta);
    var nz = s >= 0 ? nTop : nBot, h = s >= 0 ? ht : hb;
    return [sgn(c) * w * Math.pow(Math.abs(c), 2 / nz), sgn(s) * h * Math.pow(Math.abs(s), 2 / nz) + (yc || 0)];
  }

  // Fuselage section profile (fictional proportions). s: 0 = tail, 1 = nose tip.
  var BODY_L = 10, BODY_X0 = -5;
  function sx(s) { return BODY_X0 + s * BODY_L; }
  function prof(s) {
    var w = 1.10 * Math.pow(Math.max(0, 1 - Math.pow(s, 2.3)), 0.62) * (0.80 + 0.20 * smoothstep(0, 0.22, s));
    var ht = 0.74 * Math.pow(Math.max(0, 1 - Math.pow(s, 1.9)), 0.72) * (0.48 + 0.52 * smoothstep(0.02, 0.42, s));
    var hb = 0.42 * Math.pow(Math.max(0, 1 - Math.pow(s, 2.1)), 0.7) * (0.62 + 0.38 * smoothstep(0, 0.3, s));
    var yc = -0.04 * s;
    return { w: Math.max(w, 0.0005), ht: Math.max(ht, 0.0005), hb: Math.max(hb, 0.0005), yc: yc };
  }
  function ring(s, th0, th1, nTh, k, inset) {
    var P = prof(s), pts = [], x = sx(s), d = inset || 0;
    for (var j = 0; j <= nTh; j++) {
      var th = lerp(th0, th1, j / nTh);
      var q = supEll(th, Math.max(P.w * k - d, 0.001), Math.max(P.ht * k - d, 0.001), Math.max(P.hb * k - d, 0.001), 1.55, 1.75, P.yc);
      pts.push([x, q[1], q[0]]);
    }
    return pts;
  }

  // Layered shell panel lofted between stations, with inner skin and rims.
  function shell(s0, s1, nS, th0, th1, nTh, k, thick) {
    var g = new Geo(), outer = [], inner = [], i;
    for (i = 0; i <= nS; i++) {
      var s = lerp(s0, s1, Math.pow(i / nS, 1));
      outer.push(ring(s, th0, th1, nTh, k, 0));
      inner.push(ring(s, th0, th1, nTh, k, thick));
    }
    g.grid(outer, false, 1);
    g.grid(inner, false, 0.42);
    // rims along theta edges
    var rimA = [], rimB = [];
    for (i = 0; i <= nS; i++) { rimA.push([outer[i][0], inner[i][0]]); rimB.push([outer[i][nTh], inner[i][nTh]]); }
    g.grid(rimA, false, 0.7); g.grid(rimB, false, 0.7);
    // end rims
    g.grid([outer[0], inner[0]], false, 0.7);
    g.grid([outer[nS], inner[nS]], false, 0.7);
    return g;
  }

  // Swept lifting surface. map(x, t, w) -> world point. t is thickness axis, w span axis.
  function surface(o) {
    var g = new Geo(), rows = [], nS = o.nS || 10, nC = o.nC || 14, k, j;
    for (k = 0; k <= nS; k++) {
      var f = k / nS, w = lerp(o.span0, o.span1, f);
      var le = lerp(o.rootLE, o.tipLE, f), te = lerp(o.rootTE, o.tipTE, f), c = le - te;
      var t = lerp(o.tRoot, o.tTip, f), row = [];
      for (j = 0; j <= nC; j++) { var u = j / nC; row.push(o.map(le - u * c, 0.5 * t * th(u), w)); }
      for (j = nC - 1; j >= 1; j--) { var u2 = j / nC; row.push(o.map(le - u2 * c, -0.5 * t * th(u2), w)); }
      rows.push(row);
    }
    function th(u) { return Math.min(1, 2.6 * Math.sqrt(u) * (1 - u)); }
    g.grid(rows, true, 1);
    g.fan(rows[0], 0.6);
    g.fan(rows[rows.length - 1], 0.85);
    return g;
  }

  // Cylinder along x. r0 at x0, r1 at x1. Optional z-scale for flattened sections.
  function cyl(x0, x1, r0, r1, cy, cz, seg, zs, caps, shade) {
    var g = new Geo(), a = [], b = [], k;
    zs = zs || 1;
    for (k = 0; k < seg; k++) {
      var t = k / seg * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
      a.push([x0, cy + r0 * s, cz + r0 * c * zs]);
      b.push([x1, cy + r1 * s, cz + r1 * c * zs]);
    }
    g.grid([a, b], true, shade == null ? 1 : shade);
    if (caps) { g.fan(a, 0.8); g.fan(b, 0.8); }
    return g;
  }
  function box(c, sz, shade) {
    var g = new Geo(), hx = sz[0] / 2, hy = sz[1] / 2, hz = sz[2] / 2;
    var P = function (x, y, z) { return [c[0] + x * hx, c[1] + y * hy, c[2] + z * hz]; };
    var faces = [
      [P(1, -1, -1), P(1, 1, -1), P(1, 1, 1), P(1, -1, 1)],
      [P(-1, -1, 1), P(-1, 1, 1), P(-1, 1, -1), P(-1, -1, -1)],
      [P(-1, 1, -1), P(-1, 1, 1), P(1, 1, 1), P(1, 1, -1)],
      [P(-1, -1, 1), P(-1, -1, -1), P(1, -1, -1), P(1, -1, 1)],
      [P(-1, -1, 1), P(1, -1, 1), P(1, 1, 1), P(-1, 1, 1)],
      [P(1, -1, -1), P(-1, -1, -1), P(-1, 1, -1), P(1, 1, -1)]
    ];
    var sh = shade == null ? 1 : shade;
    faces.forEach(function (f) {
      var a = g.v(f[0], sh), b = g.v(f[1], sh), cc = g.v(f[2], sh), d = g.v(f[3], sh);
      g.q(a, b, cc, d);
    });
    return g;
  }

  /* --------------------------------------------------------- the aircraft */
  var PI = Math.PI;
  function buildParts() {
    var parts = [];
    function part(o) { parts.push(o); return o; }

    // 01 Nose
    (function () {
      var g = new Geo(), rows = [], n = 18, i;
      for (i = 0; i <= n; i++) {
        var s = lerp(0.80, 0.995, i / n);
        var r = ring(s, 0, 2 * PI, 40, 1, 0); r.pop(); rows.push(r);
      }
      g.grid(rows, true, 1);
      var tip = sx(1);
      var ti = g.v([tip, prof(1).yc, 0], 1), last = rows.length - 1, base = g.p.length / 3 - 1 - 0;
      // close tip
      var lastIdx = [];
      for (i = 0; i < rows[last].length; i++) lastIdx.push(g.v(rows[last][i], 1));
      for (i = 0; i < lastIdx.length; i++) g.t(lastIdx[i], lastIdx[(i + 1) % lastIdx.length], ti);
      g.fan(rows[0], 0.45);
      // sensor window band (abstract)
      var band = shell(0.86, 0.905, 3, PI * 0.08, PI * 0.92, 20, 1.015, 0.012);
      g.merge(band);
      part({ id: 'nose', code: 'NOSE', name: 'Perception nose', group: 'shell', geo: g,
        anchor: [sx(0.9), prof(0.9).ht * 0.85, 0.12], off: [2.3, 0.18, 0], delay: 0.06,
        desc: 'Forward fairing around an abstract sensing module. Form study only; no performance is implied.' });
    })();

    // 02 Dorsal access panel
    part({ id: 'panel', code: 'PANEL', name: 'Dorsal access panel', group: 'shell',
      geo: shell(0.40, 0.66, 10, PI * 0.30, PI * 0.70, 16, 1.03, 0.035),
      anchor: [sx(0.56), prof(0.56).ht * 1.03, 0.0], off: [0.15, 3.55, 0], delay: 0.0,
      desc: 'The outermost layer: a removable spine panel that opens the shell for service.' });

    // 03 Upper shell
    part({ id: 'upper', code: 'UPPER', name: 'Upper shell', group: 'shell',
      geo: shell(0.0, 0.80, 26, 0, PI, 30, 1, 0.05),
      anchor: [sx(0.28), prof(0.28).ht * 0.92, -0.42], off: [0, 2.3, 0], delay: 0.02,
      desc: 'Dorsal skin that wraps the swept body and blends it into the wing roots.' });

    // 04 Lower hull
    part({ id: 'lower', code: 'HULL', name: 'Lower hull', group: 'shell',
      geo: shell(0.0, 0.80, 26, PI, 2 * PI, 30, 1, 0.05),
      anchor: [sx(0.45), -prof(0.45).hb * 0.96 + prof(0.45).yc, 0.30], off: [0, -2.3, 0], delay: 0.03,
      desc: 'Ventral hull. Its chine line meets the upper shell to form one continuous edge.' });

    // 05/06 Wings
    [1, -1].forEach(function (side) {
      var dih = -0.035;
      var g = surface({ rootLE: 1.5, rootTE: -4.45, tipLE: -3.05, tipTE: -4.25, span0: 0.55, span1: 4.35,
        tRoot: 0.30, tTip: 0.05, nS: 12, nC: 16,
        map: function (x, t, w) { return [x, t + (w - 0.55) * dih - 0.02, side * w]; } });
      part({ id: side > 0 ? 'wingR' : 'wingL', code: side > 0 ? 'WING R' : 'WING L',
        name: side > 0 ? 'Starboard wing' : 'Port wing', group: 'wing', geo: g,
        anchor: [-2.35, 0.08, side * 2.9], off: [-0.2, 0.15, side * 2.5], delay: 0.1,
        desc: 'Swept, cranked-arrow surface. One of two mirrored wings; planform is purely aesthetic.' });
    });

    // 07/08 Canted fins
    [1, -1].forEach(function (side) {
      var cant = 0.52, base = [0, prof(0.15).ht * 0.55, side * 0.62];
      var span = [0, Math.cos(cant), side * Math.sin(cant)];
      var thk = [0, -side * Math.sin(cant) * side * 0, 1];
      thk = norm(cross([1, 0, 0], span));
      var g = surface({ rootLE: -2.55, rootTE: -4.75, tipLE: -4.15, tipTE: -5.0, span0: 0, span1: 1.75,
        tRoot: 0.12, tTip: 0.035, nS: 8, nC: 12,
        map: function (x, t, w) { return [x, base[1] + span[1] * w + thk[1] * t, base[2] + span[2] * w + thk[2] * t]; } });
      part({ id: side > 0 ? 'finR' : 'finL', code: side > 0 ? 'FIN R' : 'FIN L',
        name: side > 0 ? 'Starboard canted fin' : 'Port canted fin', group: 'wing', geo: g,
        anchor: [-4.25, base[1] + span[1] * 1.2, base[2] + span[2] * 1.2],
        off: [-0.35, 1.05, side * 0.95], delay: 0.14,
        desc: 'Outward-canted tail fin, one of a pair. Angle chosen for silhouette, not stated function.' });
    });

    // 09 Autonomy core (abstract)
    (function () {
      var g = new Geo(), y0 = 0.02;
      for (var k = 0; k < 3; k++) g.merge(box([1.55, y0 + k * 0.17, 0], [1.35, 0.055, 0.82], 1));
      g.merge(box([1.55, y0 + 0.17 * 3 - 0.03, 0], [0.55, 0.11, 0.42], 1));
      g.merge(box([0.80, y0 + 0.17, 0], [0.06, 0.40, 0.70], 0.8));
      part({ id: 'core', code: 'CORE', name: 'Autonomy core', group: 'internal', geo: g,
        anchor: [1.55, y0 + 0.17 * 3 + 0.03, 0.1], off: [0.7, 1.15, 0], delay: 0.2,
        desc: 'Abstract stack of compute boards that stands in for the decision-making layer. Symbolic only.' });
    })();

    // 10 Power module
    (function () {
      var g = new Geo();
      [-0.33, 0.33].forEach(function (z) {
        g.merge(cyl(-0.95, 0.75, 0.19, 0.19, -0.08, z, 28, 1, true, 1));
        g.merge(cyl(0.75, 0.86, 0.13, 0.13, -0.08, z, 28, 1, true, 0.9));
      });
      g.merge(box([-0.1, -0.08, 0], [1.2, 0.06, 0.66], 0.85));
      part({ id: 'power', code: 'POWER', name: 'Power module', group: 'internal', geo: g,
        anchor: [0.2, 0.11, -0.33], off: [0.35, -1.15, 0], delay: 0.22,
        desc: 'Twin cells on a shared tray, drawn as a generic energy store.' });
    })();

    // 11 Propulsion core
    (function () {
      var g = new Geo(), segs = [[-1.25, -1.55, 0.40, 0.44], [-1.55, -2.6, 0.44, 0.46], [-2.6, -3.0, 0.46, 0.43], [-3.0, -3.75, 0.43, 0.38]];
      segs.forEach(function (s, k) { g.merge(cyl(s[0], s[1], s[2], s[3], 0.02, 0, 36, 1, false, 1)); });
      g.merge(cyl(-1.18, -1.25, 0.30, 0.40, 0.02, 0, 36, 1, true, 0.75));
      g.merge(cyl(-1.05, -1.18, 0.10, 0.30, 0.02, 0, 36, 1, true, 0.9));
      g.merge(cyl(-3.75, -3.80, 0.38, 0.30, 0.02, 0, 36, 1, true, 0.6));
      part({ id: 'prop', code: 'PROP', name: 'Propulsion core', group: 'internal', geo: g,
        anchor: [-2.1, 0.48, 0.0], off: [-0.65, 0.12, 0], delay: 0.18,
        desc: 'Segmented cylinder representing a propulsion unit. Abstracted; no type or output is specified.' });
    })();

    // 12 Exhaust
    (function () {
      var g = new Geo(), outer = [], inner = [], n = 8, i;
      for (i = 0; i <= n; i++) {
        var f = i / n, x = lerp(-3.85, -5.2, f);
        var w = lerp(0.42, 0.78, f), h = lerp(0.36, 0.11, smooth(f));
        var ro = [], ri = [];
        for (var j = 0; j < 40; j++) {
          var t = j / 40 * 2 * PI, q = supEll(t, w, h, h, 4.2, 4.2, 0.02), qi = supEll(t, w - 0.04, h - 0.03, h - 0.03, 4.2, 4.2, 0.02);
          ro.push([x, q[1], q[0]]); ri.push([x, qi[1], qi[0]]);
        }
        outer.push(ro); inner.push(ri);
      }
      g.grid(outer, true, 1); g.grid(inner, true, 0.35);
      g.grid([outer[n], inner[n]], true, 0.7); g.grid([outer[0], inner[0]], true, 0.7);
      part({ id: 'exhaust', code: 'EXHAUST', name: 'Exhaust fairing', group: 'internal', geo: g,
        anchor: [-4.9, 0.17, 0.25], off: [-2.45, 0.05, 0], delay: 0.12,
        desc: 'Flattened trailing nozzle that resolves the body into a clean, wide tail edge.' });
    })();

    // 13 Structural frames
    (function () {
      var g = new Geo();
      [0.16, 0.32, 0.48, 0.64, 0.78].forEach(function (s) {
        var x0 = sx(s) - 0.035, x1 = sx(s) + 0.035;
        function loop(x, k, d) { var r = ring(s, 0, 2 * PI, 48, k, d); r.pop(); return r.map(function (p) { return [x, p[1], p[2]]; }); }
        var oA = loop(x0, 0.955, 0), oB = loop(x1, 0.955, 0), iA = loop(x0, 0.955, 0.09), iB = loop(x1, 0.955, 0.09);
        g.grid([oA, oB], true, 0.95); g.grid([iA, iB], true, 0.6);
        g.grid([oA, iA], true, 0.8); g.grid([oB, iB], true, 0.8);
      });
      part({ id: 'frames', code: 'FRAMES', name: 'Structural frames', group: 'internal', geo: g,
        anchor: [sx(0.64), prof(0.64).ht * 0.9, -prof(0.64).w * 0.45], off: [0, 0, 0], delay: 0,
        desc: 'Five bulkhead rings that set the cross-section. Every other layer hangs from them.' });
    })();

    parts.forEach(function (p, k) { p.index = k; p.num = (k + 1 < 10 ? '0' : '') + (k + 1); });
    return parts;
  }

  /* --------------------------------------------------------------- shaders */
  // Mesh: graphite ramp with ordered (Bayer 8x8) dithering in screen space.
  var MESH_VS = [
    'attribute float aS;',
    'varying vec3 vN; varying vec3 vW; varying float vS;',
    'void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normal; vS = aS;',
    '  gl_Position = projectionMatrix * viewMatrix * w; }'
  ].join('\n');
  var MESH_FS = [
    'varying vec3 vN; varying vec3 vW; varying float vS;',
    'uniform vec3 uKey; uniform vec3 uFill; uniform float uDither; uniform float uCell;',
    'uniform float uFade; uniform vec3 uBg; uniform float uLift;',
    'uniform vec3 uC0; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3; uniform vec3 uC4;',
    'float b2(vec2 a){ a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }',
    'float b4(vec2 a){ return b2(0.5 * a) * 0.25 + b2(a); }',
    'float b8(vec2 a){ return b4(0.5 * a) * 0.25 + b2(a); }',
    'vec3 rampS(float t){ t = clamp(t, 0.0, 1.0) * 4.0;',
    '  if (t < 1.0) return mix(uC0, uC1, t); if (t < 2.0) return mix(uC1, uC2, t - 1.0);',
    '  if (t < 3.0) return mix(uC2, uC3, t - 2.0); return mix(uC3, uC4, t - 3.0); }',
    'vec3 rampQ(float l){ if (l < 0.5) return uC0; if (l < 1.5) return uC1; if (l < 2.5) return uC2; if (l < 3.5) return uC3; return uC4; }',
    'void main(){',
    '  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;',
    '  vec3 V = normalize(cameraPosition - vW);',
    '  float k = max(dot(N, uKey), 0.0); float f = max(dot(N, uFill), 0.0);',
    '  float rim = pow(1.0 - max(dot(N, V), 0.0), 2.6);',
    '  float sp = pow(max(dot(N, normalize(uKey + V)), 0.0), 36.0);',
    '  float L = 0.06 + 0.50 * k + 0.13 * f + 0.10 * (N.y * 0.5 + 0.5) + 0.20 * rim + 0.22 * sp;',
    '  L = L * mix(0.55, 1.0, vS) + uLift;',
    '  float bay = b8(gl_FragCoord.xy / uCell);',
    '  vec3 col;',
    '  if (uDither > 0.5) { float l = clamp(L, 0.0, 1.0) * 3.999; float fr = smoothstep(0.22, 0.78, fract(l)); col = rampQ(floor(l) + step(bay + 0.001, fr)); }',
    '  else { col = rampS(L); }',
    '  if (uFade > 0.0) {',
    '    if (uDither > 0.5) { if (bay < uFade * 0.74) discard; col = mix(col, uBg, uFade * 0.25); }',
    '    else { col = mix(col, uBg, uFade * 0.62); }',
    '  }',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');
  // Screen-space quad lines: crisp, DPR-aware widths, optional dashes.
  var LINE_VS = [
    'attribute vec3 aA; attribute vec3 aB; attribute float aSide; attribute float aEnd;',
    'uniform vec3 uOffA; uniform vec3 uOffB; uniform vec2 uRes; uniform float uW; uniform float uBias;',
    'varying float vT;',
    'void main(){',
    '  mat4 vp = projectionMatrix * viewMatrix;',
    '  vec4 ca = vp * vec4(aA + uOffA, 1.0); vec4 cb = vp * vec4(aB + uOffB, 1.0);',
    '  vec4 c = mix(ca, cb, aEnd);',
    '  vec2 d = (cb.xy / cb.w - ca.xy / ca.w) * uRes; float l = length(d);',
    '  vec2 dir = l > 1e-5 ? d / l : vec2(1.0, 0.0);',
    '  vec2 n = vec2(-dir.y, dir.x);',
    '  c.xy += n * aSide * uW / uRes * c.w;',
    '  c.z -= uBias * c.w;',
    '  vT = aEnd; gl_Position = c; }'
  ].join('\n');
  var LINE_FS = [
    'uniform vec3 uColor; uniform float uAlpha; uniform float uDash; uniform float uDashOn;',
    'varying float vT;',
    'void main(){ if (uDash > 0.0 && fract(vT * uDash) > uDashOn) discard; gl_FragColor = vec4(uColor, uAlpha); }'
  ].join('\n');

  function hex(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255]; }

  var THEME = {
    bg: '#E8EBEE',
    ramp: ['#0F1114', '#262A2F', '#454B52', '#737A82', '#B6BCC2'],
    edgeDither: '#C4CACF', edgeClean: '#14171A',
    leader: '#5E666E', axis: '#8A929A'
  };

  /* ---------------------------------------------------------------- engine */
  function create(canvas, opts) {
    opts = opts || {};
    var THREE = opts.THREE || global.THREE;
    if (!THREE) { if (opts.onError) opts.onError('three'); return null; }
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, preserveDrawingBuffer: !!opts.preserveDrawingBuffer });
    } catch (err) { if (opts.onError) opts.onError('webgl'); return null; }
    renderer.setClearColor(0x000000, 0);
    renderer.autoClear = true;

    var reduced = !!opts.reducedMotion;
    var parts = buildParts();
    var LAND = { az: -2.25, el: 0.42, zoom: 1, explode: 0.74 };
    var PORT = opts.portraitPose || { az: -2.6, el: 0.6, zoom: 1, explode: 0.74, ys: 1.9, xs: 0.75 };
    var DEFAULTS = LAND;
    (function () { var r = canvas.getBoundingClientRect(); if (r.width && r.height && r.width / r.height < 0.8) DEFAULTS = PORT; })();
    var st = {
      az: DEFAULTS.az, el: DEFAULTS.el, zoom: DEFAULTS.zoom,
      vaz: 0, vel: 0,
      explode: reduced || opts.noIntro ? DEFAULTS.explode : 0, target: DEFAULTS.explode,
      mode: 'dither', selected: null, hover: null,
      w: 1, h: 1, dpr: 1, dirty: true
    };

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
    var V3 = function (a) { return new THREE.Vector3(a[0], a[1], a[2]); };
    var C = THEME.ramp.map(function (h) { return V3(hex(h)); });

    // Shared uniforms (same object instances across every part material).
    var U = {
      uKey: { value: new THREE.Vector3(0, 1, 0) }, uFill: { value: new THREE.Vector3(1, 0, 0) },
      uDither: { value: 1 }, uCell: { value: 2 }, uBg: { value: V3(hex(opts.bg || THEME.bg)) },
      uC0: { value: C[0] }, uC1: { value: C[1] }, uC2: { value: C[2] }, uC3: { value: C[3] }, uC4: { value: C[4] },
      uRes: { value: new THREE.Vector2(1, 1) }
    };

    function lineGeom(segs) {
      var A = [], B = [], S = [], E = [], I = [], n = 0;
      for (var k = 0; k < segs.length; k += 2) {
        var a = segs[k], b = segs[k + 1];
        for (var j = 0; j < 4; j++) { A.push(a[0], a[1], a[2]); B.push(b[0], b[1], b[2]); }
        S.push(-1, 1, -1, 1); E.push(0, 0, 1, 1);
        I.push(n, n + 1, n + 2, n + 1, n + 3, n + 2); n += 4;
      }
      var g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(A, 3));
      g.setAttribute('aA', new THREE.Float32BufferAttribute(A, 3));
      g.setAttribute('aB', new THREE.Float32BufferAttribute(B, 3));
      g.setAttribute('aSide', new THREE.Float32BufferAttribute(S, 1));
      g.setAttribute('aEnd', new THREE.Float32BufferAttribute(E, 1));
      g.setIndex(I);
      return g;
    }
    function lineMat(o) {
      return new THREE.ShaderMaterial({
        vertexShader: LINE_VS, fragmentShader: LINE_FS, transparent: true, depthWrite: false,
        depthTest: o.depthTest !== false,
        uniforms: {
          uOffA: { value: new THREE.Vector3() }, uOffB: { value: new THREE.Vector3() }, uRes: U.uRes,
          uW: { value: o.w || 1 }, uBias: { value: o.bias || 0 },
          uColor: { value: V3(hex(o.color)) }, uAlpha: { value: o.alpha == null ? 1 : o.alpha },
          uDash: { value: o.dash || 0 }, uDashOn: { value: o.dashOn || 0.5 }
        }
      });
    }
    function lineObj(segs, o, order) {
      var m = new THREE.Mesh(lineGeom(segs), lineMat(o));
      m.frustumCulled = false; m.renderOrder = order; scene.add(m); return m;
    }

    var meshes = [], tmp = new THREE.Vector3();
    parts.forEach(function (p, idx) {
      var g = p.geo, bg = new THREE.BufferGeometry();
      bg.setAttribute('position', new THREE.Float32BufferAttribute(g.p, 3));
      bg.setAttribute('normal', new THREE.BufferAttribute(g.normals(), 3));
      bg.setAttribute('aS', new THREE.Float32BufferAttribute(g.s, 1));
      bg.setIndex(g.i);
      bg.computeBoundingSphere();
      var mat = new THREE.ShaderMaterial({
        vertexShader: MESH_VS, fragmentShader: MESH_FS, side: THREE.DoubleSide,
        polygonOffset: true, polygonOffsetFactor: 1.2, polygonOffsetUnits: 1.2,
        uniforms: {
          uKey: U.uKey, uFill: U.uFill, uDither: U.uDither, uCell: U.uCell, uBg: U.uBg,
          uC0: U.uC0, uC1: U.uC1, uC2: U.uC2, uC3: U.uC3, uC4: U.uC4,
          uFade: { value: 0 }, uLift: { value: 0 }
        }
      });
      var mesh = new THREE.Mesh(bg, mat);
      mesh.userData.partId = p.id; mesh.renderOrder = 0;
      scene.add(mesh); meshes.push(mesh); p.mesh = mesh;
      p.edgeObj = lineObj(g.edges(p.group === 'internal' ? 34 : 26), { color: THEME.edgeDither, alpha: 0.62, w: 0.9, bias: 0.00002 }, 1);
      p.leaderObj = lineObj([p.anchor, p.anchor], { color: THEME.leader, alpha: 0.42, w: 0.8, dash: 8, dashOn: 0.5, depthTest: false }, 3);
      p.lmin = [1e9, 1e9, 1e9]; p.lmax = [-1e9, -1e9, -1e9];
      for (var k = 0; k < g.p.length; k += 3) for (var j = 0; j < 3; j++) {
        p.lmin[j] = Math.min(p.lmin[j], g.p[k + j]); p.lmax[j] = Math.max(p.lmax[j], g.p[k + j]);
      }
      p.e = 0; p.cur = [0, 0, 0];
      p.geo = null;
    });
    var axisObj = lineObj([[-8.6, 0, 0], [8.6, 0, 0]], { color: THEME.axis, alpha: 0.55, w: 0.75, dash: 46, dashOn: 0.62 }, 2);

    var DMAX = 0.22;
    function partE(p, e) { return smooth((e - p.delay) / (1 - DMAX)); }
    function bounds(e) {
      var mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
      parts.forEach(function (p) {
        var t = partE(p, e);
        for (var j = 0; j < 3; j++) { mn[j] = Math.min(mn[j], p.lmin[j] + p.off[j] * t); mx[j] = Math.max(mx[j], p.lmax[j] + p.off[j] * t); }
      });
      return { c: scl(add(mn, mx), 0.5), r: len(sub(mx, mn)) * 0.5 };
    }
    var B0, B1;
    parts.forEach(function (p) { p.off0 = p.off.slice(); });
    function applyPose() {
      var ys = DEFAULTS.ys || 1, xs = DEFAULTS.xs || 1;
      parts.forEach(function (p) { p.off = [p.off0[0] * xs, p.off0[1] * ys, p.off0[2]]; });
      B0 = bounds(0); B1 = bounds(1);
    }
    applyPose();

    // ----- auto-fit: measure the projected composition at the DEFAULT pose so the
    // scale stays stable while the viewer orbits.
    var fitCam = new THREE.PerspectiveCamera(30, 1, 0.1, 400), fitCache = { k: '', v: 1 };
    function autoFit(e, c, dist0, aspect) {
      var key = e.toFixed(3) + '|' + st.w + '|' + st.h + '|' + opts.safeTop + '|' + opts.safeBottom;
      if (fitCache.k === key) return fitCache.v;
      var ce = Math.cos(DEFAULTS.el);
      fitCam.aspect = aspect; fitCam.near = 0.1; fitCam.far = dist0 * 4;
      fitCam.position.set(c[0] - dist0 * ce * Math.sin(DEFAULTS.az), c[1] + dist0 * Math.sin(DEFAULTS.el), c[2] + dist0 * ce * Math.cos(DEFAULTS.az));
      fitCam.lookAt(c[0], c[1], c[2]); fitCam.updateProjectionMatrix(); fitCam.updateMatrixWorld(true);
      var mnx = 1e9, mny = 1e9, mxx = -1e9, mxy = -1e9;
      parts.forEach(function (p) {
        var t = partE(p, e);
        for (var q = 0; q < 8; q++) {
          tmp.set(((q & 1) ? p.lmax[0] : p.lmin[0]) + p.off[0] * t, ((q & 2) ? p.lmax[1] : p.lmin[1]) + p.off[1] * t,
            ((q & 4) ? p.lmax[2] : p.lmin[2]) + p.off[2] * t).project(fitCam);
          mnx = Math.min(mnx, tmp.x); mxx = Math.max(mxx, tmp.x); mny = Math.min(mny, tmp.y); mxy = Math.max(mxy, tmp.y);
        }
      });
      var side = st.w < 640 ? 34 : Math.min(130, st.w * 0.1);
      var sTop = opts.safeTop != null ? opts.safeTop : 56, sBot = opts.safeBottom != null ? opts.safeBottom : 80;
      var availW = 2 * (1 - 2 * side / st.w), availH = 2 * Math.max(0.2, (st.h - sTop - sBot - 24) / st.h);
      var v = clamp(Math.min(availW / (mxx - mnx), availH / (mxy - mny)) * (opts.fill || (st.w < 640 ? 1.06 : 0.97)), 0.3, 6);
      fitCache.k = key; fitCache.v = v;
      return v;
    }

    // ----- camera (custom spherical orbit around the composition centre)
    var FOV = 30 * PI / 180;
    function updateCamera() {
      var e = st.explode, aspect = st.w / st.h;
      var c = [lerp(B0.c[0], B1.c[0], e), lerp(B0.c[1], B1.c[1], e) * 0.85, lerp(B0.c[2], B1.c[2], e)];
      var R = lerp(B0.r, B1.r, smooth(e));
      var hf = 2 * Math.atan(Math.tan(FOV / 2) * aspect), f = Math.min(FOV, hf);
      var dist0 = R / Math.sin(f / 2);
      var dist = dist0 / autoFit(e, c, dist0, aspect) / st.zoom;
      var ce = Math.cos(st.el);
      var eye = [c[0] - dist * ce * Math.sin(st.az), c[1] + dist * Math.sin(st.el), c[2] + dist * ce * Math.cos(st.az)];
      camera.aspect = aspect; camera.near = Math.max(0.1, dist - R * 3); camera.far = dist + R * 3;
      camera.position.set(eye[0], eye[1], eye[2]);
      camera.up.set(0, 1, 0);
      camera.lookAt(c[0], c[1], c[2]);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld(true);
      // Centre the projected composition inside the safe area (a pure 2D pan,
      // so orbiting never changes apparent scale).
      var mnx = 1e9, mny = 1e9, mxx = -1e9, mxy = -1e9;
      parts.forEach(function (p) {
        var t = partE(p, e);
        for (var q = 0; q < 8; q++) {
          tmp.set(((q & 1) ? p.lmax[0] : p.lmin[0]) + p.off[0] * t,
            ((q & 2) ? p.lmax[1] : p.lmin[1]) + p.off[1] * t,
            ((q & 4) ? p.lmax[2] : p.lmin[2]) + p.off[2] * t).project(camera);
          mnx = Math.min(mnx, tmp.x); mxx = Math.max(mxx, tmp.x); mny = Math.min(mny, tmp.y); mxy = Math.max(mxy, tmp.y);
        }
      });
      var sTop = opts.safeTop != null ? opts.safeTop : 56, sBot = opts.safeBottom != null ? opts.safeBottom : 80;
      var ty = 1 - (sTop + (st.h - sBot)) / st.h + (opts.shiftY || 0);
      camera.projectionMatrix.elements[8] = (mnx + mxx) / 2;
      camera.projectionMatrix.elements[9] = (mny + mxy) / 2 - ty;
      camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
      var fwd = norm(sub(c, eye)), right = norm(cross(fwd, [0, 1, 0])), up = cross(right, fwd);
      var key = norm(add(add(scl(right, -0.45), scl(up, 0.85)), scl(fwd, -0.55)));
      var fill = norm(add(add(scl(right, 0.8), scl(up, -0.15)), scl(fwd, -0.3)));
      U.uKey.value.set(key[0], key[1], key[2]); U.uFill.value.set(fill[0], fill[1], fill[2]);
    }

    // ----- resize
    function resize() {
      var r = canvas.getBoundingClientRect();
      var dpr = Math.min(global.devicePixelRatio || 1, 2);
      var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
      if (w !== st.w || h !== st.h || dpr !== st.dpr) {
        st.w = w; st.h = h; st.dpr = dpr;
        renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
        var nd = w / h < 0.8 ? PORT : LAND;
        if (nd !== DEFAULTS) { var daz = st.az - DEFAULTS.az, del = st.el - DEFAULTS.el; DEFAULTS = nd; st.az = nd.az + daz; st.el = clamp(nd.el + del, -1.2, 1.35); fitCache.k = ''; applyPose(); }
        st.dirty = true; kick();
      }
    }
    var ro = global.ResizeObserver ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(canvas); else global.addEventListener('resize', resize);

    // ----- draw
    function render() {
      updateCamera();
      var dith = st.mode === 'dither';
      var ec = hex(dith ? THEME.edgeDither : THEME.edgeClean);
      U.uDither.value = dith ? 1 : 0;
      U.uCell.value = Math.max(2, Math.round(st.dpr * 1.5));
      U.uRes.value.set(Math.round(st.w * st.dpr), Math.round(st.h * st.dpr));
      parts.forEach(function (p) {
        p.e = partE(p, st.explode); p.cur = scl(p.off, p.e);
        var sel = st.selected === p.id, faded = st.selected && !sel;
        p.mesh.position.set(p.cur[0], p.cur[1], p.cur[2]);
        p.mesh.material.uniforms.uFade.value = faded ? 1 : 0;
        p.mesh.material.uniforms.uLift.value = sel ? 0.10 : (st.hover === p.id ? 0.06 : 0);
        var eu = p.edgeObj.material.uniforms;
        eu.uOffA.value.set(p.cur[0], p.cur[1], p.cur[2]); eu.uOffB.value.copy(eu.uOffA.value);
        eu.uColor.value.set(ec[0], ec[1], ec[2]);
        eu.uAlpha.value = sel ? (dith ? 0.95 : 1) : dith ? (faded ? 0.28 : 0.62) : (faded ? 0.22 : 0.9);
        eu.uW.value = (dith ? 0.9 : 0.85) * st.dpr;
        var lu = p.leaderObj.material.uniforms, show = p.e >= 0.02 && len(p.off) > 0.01;
        p.leaderObj.visible = show;
        if (show) {
          lu.uOffB.value.set(p.cur[0], p.cur[1], p.cur[2]);
          lu.uDash.value = Math.max(4, Math.round(len(p.cur) / 0.11));
          lu.uAlpha.value = (sel ? 0.85 : 0.42) * smoothstep(0.02, 0.3, p.e);
          lu.uW.value = (sel ? 1 : 0.8) * st.dpr;
        }
      });
      axisObj.material.uniforms.uW.value = 0.75 * st.dpr;
      renderer.render(scene, camera);
      st.dirty = false;
      emit();
    }

    // ----- callout layout (screen space, CSS px)
    var lastSig = '';
    function project(p3) {
      tmp.set(p3[0], p3[1], p3[2]).project(camera);
      return { x: (tmp.x * 0.5 + 0.5) * st.w, y: (1 - (tmp.y * 0.5 + 0.5)) * st.h, z: tmp.z };
    }
    function layout() {
      var top = opts.safeTop != null ? opts.safeTop : 56, bottom = st.h - (opts.safeBottom != null ? opts.safeBottom : 80);
      var cx = st.w / 2, compact = st.w < 640;
      var items = parts.map(function (p) {
        var a = project(add(p.anchor, p.cur));
        var side = a.x < cx ? -1 : 1;
        var vis = p.group === 'internal' && p.id !== 'frames' ? smoothstep(0.18, 0.55, p.e) : (p.id === 'frames' ? smoothstep(0.3, 0.7, st.explode) : 1);
        var gap = compact ? 18 : 30;
        return { id: p.id, num: p.num, code: p.code, name: p.name, ax: a.x, ay: a.y, side: side,
          lx: a.x + side * gap, ly: a.y - (compact ? 12 : 18), opacity: vis, selected: st.selected === p.id };
      });
      [-1, 1].forEach(function (side) {
        var g = items.filter(function (it) { return it.side === side && it.opacity > 0.05; }).sort(function (a, b) { return a.ly - b.ly; });
        // Keep the expanded touch targets separate, even on narrow screens.
        var lo = top + 20, hi = bottom - 20;
        var minGap = Math.min(compact ? 44 : 40, (hi - lo) / Math.max(g.length - 1, 1));
        g.forEach(function (it, k) { it.ly = Math.max(clamp(it.ly, lo, hi), k ? g[k - 1].ly + minGap : lo); });
        if (g.length) {
          g[g.length - 1].ly = Math.min(g[g.length - 1].ly, hi);
          for (var k = g.length - 2; k >= 0; k--) g[k].ly = Math.min(g[k].ly, g[k + 1].ly - minGap);
        }
      });
      items.forEach(function (it) {
        it.lx = clamp(it.lx, 10, st.w - 10);
        it.ax = Math.round(it.ax * 10) / 10; it.ay = Math.round(it.ay * 10) / 10;
        it.lx = Math.round(it.lx * 10) / 10; it.ly = Math.round(it.ly * 10) / 10;
      });
      return items;
    }
    function emit() {
      if (!opts.onUpdate) return;
      var items = layout();
      var sig = items.map(function (i) { return i.lx + ',' + i.ly + ',' + i.ax + ',' + i.ay + ',' + i.opacity.toFixed(2) + i.selected; }).join('|') + st.mode + st.target + st.selected;
      if (sig === lastSig) return;
      lastSig = sig;
      opts.onUpdate({ callouts: items, explode: st.explode, target: st.target, mode: st.mode, selected: st.selected,
        part: st.selected ? info(st.selected) : null, width: st.w, height: st.h });
    }
    function info(id) {
      for (var k = 0; k < parts.length; k++) if (parts[k].id === id) {
        var p = parts[k]; return { id: p.id, num: p.num, code: p.code, name: p.name, desc: p.desc };
      }
      return null;
    }

    // ----- loop (renders only while something changes)
    var raf = 0, lastT = 0, intro = false;
    function kick() { if (!raf) raf = global.requestAnimationFrame(frame); }
    function frame(t) {
      raf = 0;
      var dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0.016; lastT = t;
      var active = false;
      var d = st.target - st.explode;
      if (Math.abs(d) > 0.0005) {
        if (reduced) st.explode = st.target;
        else st.explode += d * (1 - Math.exp(-dt * (intro ? 2.6 : 6.5)));
        active = true;
      } else if (st.explode !== st.target) { st.explode = st.target; active = true; }
      else intro = false;
      if (!dragging && (Math.abs(st.vaz) > 1e-4 || Math.abs(st.vel) > 1e-4)) {
        if (reduced) { st.vaz = st.vel = 0; }
        else {
          st.az += st.vaz * dt; st.el = clamp(st.el + st.vel * dt, -1.2, 1.35);
          var decay = Math.exp(-dt * 5); st.vaz *= decay; st.vel *= decay; active = true;
        }
      }
      if (active || st.dirty) render();
      if (active) kick(); else lastT = 0;
    }

    // ----- interaction: drag orbit, pinch / wheel zoom, click to select
    var el = opts.interactionEl || canvas;
    var pointers = {}, dragging = false, downAt = null, moved = 0, pinch0 = 0, zoom0 = 1;
    function pcount() { return Object.keys(pointers).length; }
    function vals() { return Object.keys(pointers).map(function (k) { return pointers[k]; }); }
    function onDown(e) {
      if (e.button != null && e.button > 0) return;
      if (e.target !== canvas) return;
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
      if (pcount() === 1) { dragging = true; downAt = { x: e.clientX, y: e.clientY }; moved = 0; st.vaz = st.vel = 0; canvas.style.cursor = 'grabbing'; }
      if (pcount() === 2) { var ps = vals(); pinch0 = Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y); zoom0 = st.zoom; }
    }
    function onMove(e) {
      if (!pointers[e.pointerId]) { hoverPick(e); return; }
      var prev = pointers[e.pointerId], dx = e.clientX - prev.x, dy = e.clientY - prev.y;
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (pcount() === 2) {
        var ps = vals(), d = Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y);
        if (pinch0 > 0) { st.zoom = clamp(zoom0 * d / pinch0, 0.55, 2.6); st.dirty = true; kick(); }
        moved += 10; return;
      }
      moved += Math.abs(dx) + Math.abs(dy);
      var k = 0.0068;
      st.az += dx * k; st.el = clamp(st.el + dy * k, -1.2, 1.35);
      if (!reduced) { st.vaz = dx * k * 18; st.vel = dy * k * 18; }
      st.dirty = true; kick();
    }
    function onUp(e) {
      if (!pointers[e.pointerId]) return;
      delete pointers[e.pointerId];
      if (pcount() === 0) {
        dragging = false; canvas.style.cursor = '';
        if (moved < 6 && downAt) {
          st.vaz = st.vel = 0;
          var id = pick(e.clientX, e.clientY);
          select(id === st.selected ? null : id, true);
        }
        kick();
      }
    }
    function onWheel(e) {
      if (opts.wheelZoom === false) return;
      e.preventDefault();
      st.zoom = clamp(st.zoom * Math.exp(-e.deltaY * 0.0012), 0.55, 2.6); st.dirty = true; kick();
    }
    var hoverT = 0;
    function hoverPick(e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      var now = performance.now(); if (now - hoverT < 50) return; hoverT = now;
      var id = e.target === canvas ? pick(e.clientX, e.clientY) : null;
      canvas.style.cursor = id ? 'pointer' : '';
      if (id !== st.hover) { st.hover = id; st.dirty = true; kick(); }
    }
    function onLeave() { if (st.hover) { st.hover = null; st.dirty = true; kick(); } }
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('pointerleave', onLeave);
    el.addEventListener('wheel', onWheel, { passive: false });

    var ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    function pick(clientX, clientY) {
      var r = canvas.getBoundingClientRect();
      ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      var hit = ray.intersectObjects(meshes, false)[0];
      return hit ? hit.object.userData.partId : null;
    }

    // ----- public api
    function select(id, fromPointer) {
      st.selected = id || null; st.dirty = true; lastSig = ''; kick();
      if (opts.onSelect) opts.onSelect(st.selected ? info(st.selected) : null, !!fromPointer);
    }
    function setExplode(v) { st.target = clamp(v, 0, 1); intro = false; lastSig = ''; kick(); }
    function setMode(m) { st.mode = m === 'clean' ? 'clean' : 'dither'; st.dirty = true; lastSig = ''; kick(); }
    function orbit(daz, del) { st.az += daz; st.el = clamp(st.el + del, -1.2, 1.35); st.vaz = st.vel = 0; st.dirty = true; kick(); }
    function zoomBy(f) { st.zoom = clamp(st.zoom * f, 0.55, 2.6); st.dirty = true; kick(); }
    function reset() {
      st.az = DEFAULTS.az; st.el = DEFAULTS.el; st.zoom = DEFAULTS.zoom; st.vaz = st.vel = 0;
      st.mode = 'dither'; setExplode(DEFAULTS.explode); select(null); st.dirty = true; kick();
    }
    function handleKey(key, shift) {
      var step = shift ? 0.26 : 0.1;
      switch (key) {
        case 'ArrowLeft': orbit(-step, 0); return true;
        case 'ArrowRight': orbit(step, 0); return true;
        case 'ArrowUp': orbit(0, -step * 0.8); return true;
        case 'ArrowDown': orbit(0, step * 0.8); return true;
        case '+': case '=': zoomBy(1.12); return true;
        case '-': case '_': zoomBy(1 / 1.12); return true;
        case ']': case 'PageUp': setExplode(st.target + 0.1); return true;
        case '[': case 'PageDown': setExplode(st.target - 0.1); return true;
        case 'e': case 'E': setExplode(st.target > 0.5 ? 0 : DEFAULTS.explode); return true;
        case 'v': case 'V': setMode(st.mode === 'dither' ? 'clean' : 'dither'); return true;
        case 'r': case 'R': case 'Home': reset(); return true;
        case 'Escape': if (st.selected) { select(null); return true; } return false;
      }
      return false;
    }
    function setReducedMotion(r) { reduced = !!r; if (reduced) { st.explode = st.target; st.vaz = st.vel = 0; st.dirty = true; kick(); } }
    function destroy() {
      if (raf) global.cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      el.removeEventListener('pointerdown', onDown); el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp); el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('pointerleave', onLeave); el.removeEventListener('wheel', onWheel);
      scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      renderer.dispose();
    }

    resize();
    if (!reduced && !opts.noIntro) { intro = true; st.az = DEFAULTS.az - 0.28; st.vaz = 0.28 * 2.2; }
    st.dirty = true; kick();

    return {
      parts: parts.map(function (p) { return info(p.id); }),
      get defaults() { return DEFAULTS; },
      select: select, setExplode: setExplode, setMode: setMode, orbit: orbit, zoomBy: zoomBy,
      reset: reset, handleKey: handleKey, setReducedMotion: setReducedMotion, destroy: destroy,
      resize: resize,
      get state() { return { explode: st.explode, target: st.target, mode: st.mode, selected: st.selected, az: st.az, el: st.el, zoom: st.zoom }; },
      renderNow: function () { lastSig = ''; render(); }
    };
  }

  global.VectusEngine = { create: create, theme: THEME, version: '1.0.0' };
})(typeof window !== 'undefined' ? window : this);
