'use strict';
// Reusable components and scene factories. Loaded after core.js, before a video's scenes.js.
// Canvas is 1080x1920. Safe content area: x 70..960 (keep key text <= 940 below y 1050), y 330..1340.
// The caption band sits at y ~1390..1490 on scenes with "captions": true.

// ---------- cue helper ----------
// A cue is a time spec relative to a scene:
//   number            -> seconds after scene start
//   [i]               -> start of line i
//   [i, 'phrase']     -> when 'phrase' is spoken in line i (linear by characters)
//   [i, 'phrase', off]-> same, plus off seconds
//   [i, '$end', off]  -> end of line i, plus off
function cueT(s, c) {
  if (typeof c === 'number') return s.start + c;
  const l = s.lines[c[0]]; if (!l) throw new Error(`scene ${s.id}: no line ${c[0]}`);
  if (c[1] == null) return l.start + (c[2] || 0);
  if (c[1] === '$end') return l.end + (c[2] || 0);
  return at(l, c[1], c[2] || 0);
}

// ---------- extra glyphs (extend core glyph) ----------
const _glyph = glyph;
glyph = function (kind, x, y, s, col) {
  if (!['db', 'queue', 'container', 'globe', 'doc', 'user', 'lock', 'cpu', 'brain'].includes(kind)) return _glyph(kind, x, y, s, col);
  g.save(); g.translate(x, y); g.strokeStyle = col; g.fillStyle = col; g.lineWidth = Math.max(2.5, s * .11); g.lineCap = 'round'; g.lineJoin = 'round';
  if (kind === 'db') { g.beginPath(); g.ellipse(0, -s * .45, s * .6, s * .2, 0, 0, 7); g.stroke(); g.beginPath(); g.moveTo(-s * .6, -s * .45); g.lineTo(-s * .6, s * .45); g.ellipse(0, s * .45, s * .6, s * .2, 0, Math.PI, 0, true); g.lineTo(s * .6, -s * .45); g.stroke(); g.beginPath(); g.ellipse(0, 0, s * .6, s * .2, 0, 0, Math.PI); g.stroke(); }
  else if (kind === 'queue') { for (let i = 0; i < 4; i++) { rr(-s * .7 + i * s * .37, -s * .3, s * .28, s * .6, s * .06); g.stroke(); } }
  else if (kind === 'container') { rr(-s * .7, -s * .5, s * 1.4, s, s * .1); g.stroke(); for (const dx of [-s * .35, 0, s * .35]) { g.beginPath(); g.moveTo(dx, -s * .32); g.lineTo(dx, s * .32); g.stroke(); } }
  else if (kind === 'globe') { g.beginPath(); g.arc(0, 0, s * .62, 0, 7); g.stroke(); g.beginPath(); g.ellipse(0, 0, s * .28, s * .62, 0, 0, 7); g.stroke(); g.beginPath(); g.moveTo(-s * .62, 0); g.lineTo(s * .62, 0); g.stroke(); }
  else if (kind === 'doc') { g.beginPath(); g.moveTo(-s * .45, -s * .62); g.lineTo(s * .2, -s * .62); g.lineTo(s * .45, -s * .37); g.lineTo(s * .45, s * .62); g.lineTo(-s * .45, s * .62); g.closePath(); g.stroke(); for (const dy of [-s * .1, s * .15, s * .38]) { g.beginPath(); g.moveTo(-s * .25, dy); g.lineTo(s * .25, dy); g.stroke(); } }
  else if (kind === 'user') { g.beginPath(); g.arc(0, -s * .28, s * .26, 0, 7); g.stroke(); g.beginPath(); g.arc(0, s * .62, s * .55, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
  else if (kind === 'lock') { rr(-s * .5, -s * .08, s, s * .7, s * .1); g.stroke(); g.beginPath(); g.arc(0, -s * .1, s * .3, Math.PI, 0); g.stroke(); }
  else if (kind === 'cpu') { rr(-s * .45, -s * .45, s * .9, s * .9, s * .1); g.stroke(); for (const k of [-.22, 0, .22]) { g.beginPath(); g.moveTo(k * s, -s * .45); g.lineTo(k * s, -s * .68); g.moveTo(k * s, s * .45); g.lineTo(k * s, s * .68); g.moveTo(-s * .45, k * s); g.lineTo(-s * .68, k * s); g.moveTo(s * .45, k * s); g.lineTo(s * .68, k * s); g.stroke(); } }
  else if (kind === 'brain') { const P = [[-.45, -.2], [0, -.45], [.45, -.2], [-.45, .3], [0, .1], [.45, .3]]; for (const [a, b] of [[0, 1], [1, 2], [0, 4], [2, 4], [3, 4], [4, 5], [0, 3], [2, 5]]) { g.beginPath(); g.moveTo(P[a][0] * s, P[a][1] * s); g.lineTo(P[b][0] * s, P[b][1] * s); g.stroke(); } for (const p of P) { g.beginPath(); g.arc(p[0] * s, p[1] * s, s * .1, 0, 7); g.fill(); } }
  g.restore();
};

// ---------- state machine node ----------
function stateNode(cx, cy, w, h, label, col, act, a, s) {
  if (a <= 0) return; g.save(); g.translate(cx, cy); g.scale(s, s); g.globalAlpha *= a; rr(-w / 2, -h / 2, w, h, h / 2);
  g.shadowColor = rgba(col, .75 * act); g.shadowBlur = 56 * act; g.fillStyle = mix(C.panel, col, .04 + .24 * act); g.fill(); g.shadowBlur = 0; g.lineWidth = lerp(2.5, 4.5, act); g.strokeStyle = rgba(col, lerp(.45, 1, act)); g.stroke();
  const lw = tw(label, { size: 33, weight: 800, ls: 2 }); circ(-lw / 2 - 12, 0, 9, col, lerp(.5, 1, act), 14 * act); txt(label, 14, 2, { size: 33, weight: 800, ls: 2, align: 'center', base: 'middle', color: mix(C.dim, '#FFFFFF', act) }); g.restore();
}

// ---------- periodic packet stream between two points ----------
// spawns every `every` seconds in [t0,t1); each packet takes `dur` seconds
function stream(t, x1, y1, x2, y2, t0, t1, every, dur, col, o = {}) { for (let sp = t0; sp < t1; sp += every) pkt(x1, y1, x2, y2, (t - sp) / dur, col, o); }

// ---------- message log / partition (row of cells) ----------
// cells: number of slots; filled: how many filled (can be fractional for slide-in); offsets shown as small numbers
function logRow(x, y, w, h, cells, filled, col, o = {}) {
  const gap = 6, cw = (w - gap * (cells - 1)) / cells;
  for (let i = 0; i < cells; i++) {
    const cx = x + i * (cw + gap), f = clamp(filled - i), read = o.readUpTo != null && i < o.readUpTo;
    rr(cx, y, cw, h, 8); g.fillStyle = f > 0 ? rgba(read ? C.faint : col, .22 + .5 * f * (read ? .3 : 1)) : 'rgba(255,255,255,.04)'; g.fill(); g.lineWidth = 1.5; g.strokeStyle = f > 0 ? rgba(read ? C.faint : col, .9) : 'rgba(255,255,255,.14)'; g.stroke();
    if (o.labels && f > .5) txt(String(i), cx + cw / 2, y + h / 2 + 1, { size: Math.min(20, h * .45), font: F.m, weight: 700, align: 'center', base: 'middle', color: read ? C.dim : '#06101C' });
  }
  return { cellX: i => x + i * (cw + gap) + cw / 2, cw };
}

// ---------- charts: axes + function plots (sigmoid, loss curves, fits) ----------
// returns a mapper; o: {xr:[min,max], yr:[min,max], xLabel, yLabel, ticksX:[...], ticksY:[...], a}
function axes(x, y, w, h, o) {
  const [x0, x1] = o.xr, [y0, y1] = o.yr, X = v => x + (v - x0) / (x1 - x0) * w, Y = v => y + h - (v - y0) / (y1 - y0) * h, a = o.a ?? 1;
  g.save(); g.globalAlpha *= a; g.strokeStyle = 'rgba(140,170,255,.10)'; g.lineWidth = 1.5;
  for (const v of (o.ticksY || [])) { g.beginPath(); g.moveTo(x, Y(v)); g.lineTo(x + w, Y(v)); g.stroke(); txt(String(v), x - 14, Y(v) + 7, { size: 20, font: F.m, weight: 400, align: 'right', color: C.dim }); }
  for (const v of (o.ticksX || [])) txt(String(v), X(v), y + h + 32, { size: 20, font: F.m, weight: 400, align: 'center', color: C.dim });
  g.strokeStyle = 'rgba(200,215,255,.55)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + h); g.lineTo(x + w, y + h); g.stroke();
  if (o.xLabel) txt(o.xLabel, x + w, y + h + 64, { size: 22, font: F.m, weight: 700, align: 'right', color: C.dim, ls: 2 });
  if (o.yLabel) txt(o.yLabel, x, y - 22, { size: 22, font: F.m, weight: 700, color: C.dim, ls: 2 });
  g.restore(); return { X, Y, x, y, w, h };
}
// draw fn over [xr] progressively (p 0..1), optional glow
function plot(m, fn, xr, col, p = 1, o = {}) {
  if (p <= 0) return; const N = o.n ?? 160, xs = xr[0], xe = lerp(xr[0], xr[1], p);
  g.save(); g.globalAlpha *= o.a ?? 1; g.strokeStyle = col; g.lineWidth = o.lw ?? 5; g.lineJoin = 'round'; g.lineCap = 'round'; if (o.dash) g.setLineDash(o.dash); if (o.glow !== false) { g.shadowColor = col; g.shadowBlur = o.glow ?? 18; }
  g.beginPath(); for (let i = 0; i <= N; i++) { const v = lerp(xs, xe, i / N), px = m.X(v), py = m.Y(fn(v)); i ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); g.restore();
}

// ---------- tokens + attention arcs (transformers, NLP) ----------
// words laid out in a row; returns centres. arcs: [{from, to, w(0..1)}] drawn above the row
function tokenRow(words, cx, y, o = {}) {
  const size = o.size ?? 36, gap = o.gap ?? 16, pad = 22, ws = words.map(w => tw(w, { size, weight: 700 }) + pad * 2), tot = ws.reduce((a, b) => a + b, 0) + gap * (words.length - 1); let x = cx - tot / 2; const cs = [];
  words.forEach((w, i) => {
    const hl = o.highlight ? o.highlight(i) : 0, col = o.col ? o.col(i) : C.cyan, a = o.a ? o.a(i) : 1;
    g.save(); g.globalAlpha *= a; rr(x, y - 34, ws[i], 68, 18); g.shadowColor = rgba(col, .8 * hl); g.shadowBlur = 30 * hl; g.fillStyle = mix(C.panel, col, .08 + .3 * hl); g.fill(); g.shadowBlur = 0; g.lineWidth = 2.5; g.strokeStyle = rgba(col, .5 + .5 * hl); g.stroke();
    txt(w, x + ws[i] / 2, y + 2, { size, weight: 700, align: 'center', base: 'middle', color: mix(C.dim, '#FFFFFF', .5 + .5 * hl) }); g.restore();
    cs.push(x + ws[i] / 2); x += ws[i] + gap;
  });
  return cs;
}
function attnArc(x1, x2, y, w, col, p = 1) { if (p <= 0 || w <= 0) return; const h = 40 + Math.abs(x2 - x1) * .45, mx = (x1 + x2) / 2; g.save(); g.globalAlpha *= clamp(w * 1.4) * p; g.strokeStyle = col; g.lineWidth = 2 + w * 9; g.lineCap = 'round'; g.shadowColor = col; g.shadowBlur = 14 * w; g.beginPath(); g.moveTo(x1, y); g.quadraticCurveTo(mx, y - h * 2 * p, lerp(x1, x2, p), lerp(y, y, p)); g.stroke(); g.restore(); }

// ---------- generic scene factories ----------
// BEFORE vs AFTER split screen.
// cfg = { left:{head, sub, col, steps:[[text, cue], ...5]}, right:{...}, swapAt: cue (when focus moves right) }
// The 5th step of each side is drawn as a solid result chip.
function compareScene(cfg) {
  const fn = (t, s) => {
    const P = fn.P, xs = [280, 744], w = 404, ys = [536, 700, 864, 1028, 1212], dimL = lerp(1, .6, E.io(pr(t, P.swap - .1, P.swap + .4)));
    seg(512, 360, 512, 1290, 'rgba(140,170,255,.18)', E.out(pr(t, s.start + .1, s.start + .6)), 2, [4, 10]);
    [cfg.left, cfg.right].forEach((side, ci) => {
      const x = xs[ci], col = side.col, ts = P.ts[ci], dim = ci ? 1 : dimL, ha = slide(t, ci ? P.swap - .25 : s.start + .1, .4, 30), pre = ci ? lerp(.3, 1, ha.a) * E.out(pr(t, s.start + .3, s.start + .7)) : ha.a;
      g.save(); g.globalAlpha *= dim; txt(side.head, x, 392, { size: 50, weight: 900, font: F.d, ls: 5, align: 'center', color: col, a: pre, glow: 18 }); if (side.sub) txt(side.sub, x, 432, { size: 24, font: F.m, weight: 400, align: 'center', color: C.dim, a: pre });
      side.steps.forEach(([label], i) => {
        const p = pop(t, ts[i], .45); if (p.a <= 0) return; const y = ys[i], fin = i === side.steps.length - 1, hgt = fin ? 136 : 116;
        if (i) { const pa = E.out(pr(t, ts[i] - .12, ts[i] + .15)); arrow(x, ys[i - 1] + 66, x, y - hgt / 2 - 12, rgba(col, .75), pa, pa, 3); }
        g.save(); g.translate(x, y); g.scale(p.s, p.s); g.globalAlpha *= p.a; rr(-w / 2, -hgt / 2, w, hgt, 22);
        if (fin) { g.shadowColor = rgba(col, .8); g.shadowBlur = 40; g.fillStyle = col; g.fill(); g.shadowBlur = 0; const o = { size: 38, weight: 900, font: F.d, ls: 2 }; o.size = fit(label, w - 124, o); txt(label, 18, 2, { ...o, align: 'center', base: 'middle', color: '#06101C' }); const lw2 = tw(label, o); if (side.good) check(-lw2 / 2 - 22, 0, 12, '#06101C', 1, 5); else cross(-lw2 / 2 - 22, 0, 10, '#06101C', 1, 5); }
        else { g.fillStyle = mix(C.panel, col, .10); g.fill(); g.lineWidth = 2.5; g.strokeStyle = rgba(col, .75); g.stroke(); circ(-w / 2 + 40, 0, 17, rgba(col, .2)); txt(String(i + 1), -w / 2 + 40, 2, { size: 22, font: F.m, weight: 700, align: 'center', base: 'middle', color: col }); const o = { size: 34, weight: 700 }; o.size = fit(label, w - 96, o); txt(label, -w / 2 + 74, 2, { ...o, base: 'middle' }); }
        g.restore();
      }); g.restore();
    });
    if (!cfg.left.good) tint(cfg.left.col, .12 * pr(t, P.ts[0][4], P.ts[0][4] + .2) * (1 - pr(t, P.swap - .2, P.swap + .3)));
  };
  fn.init = s => {
    fn.P = { ts: [cfg.left, cfg.right].map(side => side.steps.map(st => cueT(s, st[1]))), swap: cueT(s, cfg.swapAt ?? [1]) };
    fn.P.ts.forEach((arr, ci) => arr.forEach((x, i) => cue(x, i === arr.length - 1 ? ([cfg.left, cfg.right][ci].good ? 'positive' : 'error') : 'pop', i === arr.length - 1 ? .85 : .5)));
  };
  return fn;
}

// Key-takeaway cards.
// cfg = { title: [[text,col],...], cards:[{num, title, sub?, chips?:[[label,col],...], col, at: cue}], note?: {segs:[[text,col],...], at}, mono?: {text, at} }
function takeawaysScene(cfg) {
  const fn = (t, s) => {
    const P = fn.P; let a = slide(t, P.title, .45, 40); rich(cfg.title, 540, 420 + a.y, { size: 82, weight: 900, font: F.d, align: 'center', a: a.a });
    cfg.cards.forEach((cd, i) => {
      const ts = P.cards[i], p = pop(t, ts, .5); if (p.a <= 0) return; const col = cd.col, y = 612 + i * 246, x = 524, w = 872, h = 216, dx = (1 - E.out(p.u)) * 90;
      g.save(); g.translate(x + dx, y); g.scale(p.s, p.s); g.globalAlpha *= p.a; rr(-w / 2, -h / 2, w, h, 28); g.shadowColor = rgba(col, .35); g.shadowBlur = 40; g.fillStyle = C.panel; g.fill(); g.shadowBlur = 0;
      const gr = g.createLinearGradient(-w / 2, 0, w / 2, 0); gr.addColorStop(0, rgba(col, .2)); gr.addColorStop(.6, rgba(col, .03)); g.fillStyle = gr; g.fill(); g.lineWidth = 2.5; g.strokeStyle = rgba(col, .7); g.stroke();
      txt(cd.num ?? String(i + 1).padStart(2, '0'), -w / 2 + 44, 26, { size: 84, weight: 900, font: F.d, color: col, glow: 20 });
      const tx = -w / 2 + 190, o = { size: 48, weight: 800, font: F.d }; o.size = fit(cd.title, w - 230, o); txt(cd.title, tx, cd.sub || cd.chips ? -16 : 16, o);
      if (cd.sub) { const so = { size: 25, font: F.m, weight: 400 }; so.size = fit(cd.sub, w - 230, so); txt(cd.sub, tx, 44, { ...so, color: C.dim }); }
      if (cd.chips) { let xx = tx; cd.chips.forEach(([lb, c], j) => { const pa = pop(t, ts + .35 + j * .28, .4), ww = tw(lb, { size: 23, weight: 700, font: F.m, ls: 1 }) + 40; pill(xx + ww / 2, 40, lb, c, { size: 23, a: pa.a, s: pa.s, w: ww, h: 48 }); xx += ww + 14; if (j < cd.chips.length - 1) { txt('→', xx, 48, { size: 26, color: C.dim, a: pa.a, weight: 400 }); xx += 38; } }); }
      g.restore();
    });
    if (cfg.note) { a = slide(t, P.note, .45, 30); const o = { size: 29, weight: 600, align: 'center', a: a.a }; rich(cfg.note.segs, 524, 1296 + a.y, o); }
    if (cfg.mono) { a = slide(t, P.mono, .45, 30); txt(cfg.mono.text, 524, 1346 + a.y, { size: 24, font: F.m, weight: 400, align: 'center', color: C.faint, a: a.a }); }
  };
  fn.init = s => { fn.P = { title: cueT(s, cfg.titleAt ?? [0, null, -.2]), cards: cfg.cards.map(c => cueT(s, c.at)), note: cfg.note ? cueT(s, cfg.note.at) : 0, mono: cfg.mono ? cueT(s, cfg.mono.at) : 0 }; cue(fn.P.title, 'swish', .5); fn.P.cards.forEach(x => cue(x, 'pop', .8)); };
  return fn;
}

// One-line summary with slam-in rows and slow push-in.
// cfg = { label: 'TOPIC  =', rows:[{text, col, at}], icon?: (t, s, P) => draw at ~y 520 }
function summaryScene(cfg) {
  const fn = (t, s) => {
    const P = fn.P, z = lerp(1, 1.09, E.io(pr(t, s.start, s.end)));
    g.save(); g.translate(540, 860); g.scale(z, z); g.translate(-540, -860);
    const gr = g.createRadialGradient(540, 860, 0, 540, 860, 620); gr.addColorStop(0, rgba(cfg.glow ?? C.cyan, .16)); gr.addColorStop(1, rgba(cfg.glow ?? C.cyan, 0)); g.save(); g.globalAlpha *= E.out(pr(t, s.start, s.start + .8)); g.fillStyle = gr; g.fillRect(0, 200, W, 1400); g.restore();
    if (cfg.icon) cfg.icon(t, s, P);
    let a = slide(t, s.lines[0].start - .1, .4, 30); txt(cfg.label, 540, 700 + a.y, { size: 36, font: F.m, weight: 700, ls: 4, align: 'center', color: cfg.glow ?? C.cyan, a: a.a });
    const n = cfg.rows.length, y0 = 830 + (4 - n) * 56;
    cfg.rows.forEach((r, i) => { const ts = P.rows[i], u = pr(t, ts, ts + .35); if (u <= 0) return; g.save(); g.translate(540, y0 + i * 112); const sc = lerp(1.25, 1, E.expo(u)); g.scale(sc, sc); const o = { size: 92, weight: 900, font: F.d, align: 'center', a: E.out(u), glow: r.col && r.col !== C.text ? 26 : 0 }; o.size = fit(r.text, 900, o); rich([[r.text, r.col ?? C.text]], 0, 0, o); g.restore(); });
    g.restore();
  };
  fn.init = s => { fn.P = { rows: cfg.rows.map(r => cueT(s, r.at)) }; cue(s.lines[0].start - .1, 'thud', 1); cue(s.lines[0].start, 'chime', .8); cue(fn.P.rows[fn.P.rows.length - 1], 'positive', .7); if (cfg.cues) cfg.cues(s, fn.P); };
  return fn;
}

// Call to action. Narration expected: line 0 "Follow for more <big>, explained visually."  line 1 "And save this for your next interview."
// cfg = { big: 'System Design', bigPhrase: 'system', sub: 'explained visually', subPhrase: 'explained' }
function heart(x, y, s, col, fill) { g.save(); g.translate(x, y); g.scale(s, s); g.beginPath(); g.moveTo(0, 9); g.bezierCurveTo(-22, -7, -12, -24, 0, -11); g.bezierCurveTo(12, -24, 22, -7, 0, 9); g.closePath(); if (fill) { g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 8; g.fill(); } else { g.strokeStyle = col; g.lineWidth = 2.6; g.lineJoin = 'round'; g.stroke(); } g.restore(); }
function bookmark(x, y, s, col, fill) { g.save(); g.translate(x, y); g.scale(s, s); g.beginPath(); g.moveTo(-10, -15); g.lineTo(10, -15); g.lineTo(10, 15); g.lineTo(0, 7); g.lineTo(-10, 15); g.closePath(); if (fill) { g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 8; g.fill(); } else { g.strokeStyle = col; g.lineWidth = 2.6; g.lineJoin = 'round'; g.stroke(); } g.restore(); }
function bell(x, y, s, col, rot, fill) { g.save(); g.translate(x, y - 16 * s); g.rotate(rot); g.translate(0, 16 * s); g.scale(s, s); g.beginPath(); g.moveTo(-13, 9); g.quadraticCurveTo(-9, 4, -9, -4); g.quadraticCurveTo(-9, -15, 0, -15); g.quadraticCurveTo(9, -15, 9, -4); g.quadraticCurveTo(9, 4, 13, 9); g.closePath(); g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 2.6; g.lineJoin = 'round'; if (fill) { g.shadowColor = col; g.shadowBlur = 8; g.fill(); } else g.stroke(); g.beginPath(); g.arc(0, 13, 3.4, 0, 7); g.fill(); g.restore(); }
function ctaScene(cfg = {}) {
  const big = cfg.big ?? 'System Design', bigPhrase = cfg.bigPhrase ?? 'system', sub = cfg.sub ?? 'explained visually', subPhrase = cfg.subPhrase ?? 'explained';
  const fn = (t, s) => {
    const P = fn.P, c0 = s.lines[0], c1 = s.lines[1];
    let a = slide(t, c0.start - .15, .4, 40); txt('Follow for more', 540, 520 + a.y, { size: 50, weight: 600, align: 'center', color: C.dim, a: a.a });
    let u = pr(t, P.tBig - .1, P.tBig + .25); if (u > 0) { g.save(); g.translate(540, 640); const sc = lerp(1.35, 1, E.expo(u)); g.scale(sc, sc); const o = { size: 118, weight: 900, font: F.d, align: 'center', a: E.out(u), glow: 30, glowCol: rgba(C.cyan, .6) }; o.size = fit(big, 920, o); txt(big, 0, 0, o); g.restore(); }
    a = slide(t, P.tSub - .1, .4, 30); txt(sub, 540, 730 + a.y, { size: 52, weight: 700, align: 'center', color: C.cyan, a: a.a });
    const fp = pop(t, c0.start + .5, .5), pressed = t >= P.tFollow, pu = pr(t, P.tFollow, P.tFollow + .35), press = pressed ? 1 - Math.sin(pu * Math.PI) * .1 : 1;
    if (fp.a > 0) { g.save(); g.translate(540, 920); g.scale(fp.s * press, fp.s * press); g.globalAlpha *= fp.a; const w = 380, h = 104; rr(-w / 2, -h / 2, w, h, h / 2);
      if (!pressed) { g.shadowColor = rgba(C.cyan, .7); g.shadowBlur = 40; g.fillStyle = C.cyan; g.fill(); g.shadowBlur = 0; txt('+  Follow', 0, 3, { size: 44, weight: 800, font: F.d, align: 'center', base: 'middle', color: '#06101C' }); }
      else { g.fillStyle = mix(C.panel, C.cyan, .14); g.fill(); g.lineWidth = 3; g.strokeStyle = C.cyan; g.stroke(); const o = { size: 42, weight: 800, font: F.d }, lw = tw('Following', o); txt('Following', -lw / 2 + 22, 3, { ...o, base: 'middle', color: C.cyan }); check(-lw / 2 - 16, 0, 13, C.cyan, 1, 5, pr(t, P.tFollow + .05, P.tFollow + .35)); }
      g.restore(); if (pressed && pu < 1) ring(540, 920, 120 + E.out(pu) * 170, C.cyan, (1 - pu) * .7, 4); }
    [[330, 'Like', P.tLike, C.red], [540, 'Save', P.tSave, C.amber], [750, 'Subscribe', P.tBell, C.cyan]].forEach(([x, lab, ta, col], i) => {
      const p = pop(t, c0.end - .35 + i * .12, .5); if (p.a <= 0) return; const on = t >= ta, ou = pr(t, ta, ta + .4), bounce = on ? 1 + Math.sin(ou * Math.PI) * .25 : 1, y = 1110;
      g.save(); g.translate(x, y); g.scale(p.s * bounce, p.s * bounce); g.globalAlpha *= p.a; g.beginPath(); g.arc(0, 0, 62, 0, 7); g.shadowColor = rgba(col, on ? .6 : 0); g.shadowBlur = 34; g.fillStyle = mix(C.panel, col, on ? .2 : .04); g.fill(); g.shadowBlur = 0; g.lineWidth = 2.5; g.strokeStyle = on ? col : 'rgba(150,170,220,.4)'; g.stroke();
      const ic = on ? col : '#C9D3EE'; if (i === 0) heart(0, 2, 2.1, ic, on); if (i === 1) bookmark(0, 0, 1.75, ic, on); if (i === 2) bell(0, 0, 1.9, ic, on ? Math.sin(ou * Math.PI * 5) * .35 * (1 - ou) : 0, on); g.restore();
      if (on && ou < 1) ring(x, y, 62 + E.out(ou) * 60, col, (1 - ou) * .8, 3);
      txt(lab, x, y + 108, { size: 26, weight: 600, align: 'center', color: on ? C.text : C.dim, a: p.a });
    });
    if (c1) { a = slide(t, c1.start - .05, .45, 30); rich([['Save this', C.amber], [' for your next interview', C.text]], 540, 1338 + a.y, { size: 46, weight: 800, font: F.d, align: 'center', a: a.a }); }
  };
  fn.init = s => {
    const c0 = s.lines[0], c1 = s.lines[1] || s.lines[0], P = { tBig: at(c0, bigPhrase), tSub: at(c0, subPhrase), tFollow: c0.end - .05, tLike: c0.end + .12, tSave: s.lines[1] ? at(c1, 'save', .12) : c0.end + .4, tBell: c1.end - .1 };
    fn.P = P; cue(P.tBig - .1, 'thud', .6); cue(P.tFollow, 'click', 1); cue(P.tLike, 'pop', .7); cue(P.tSave, 'click', .9); cue(P.tBell, 'bell', .9);
  };
  return fn;
}
