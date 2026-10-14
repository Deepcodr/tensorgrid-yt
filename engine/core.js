'use strict';
const W = 1080, H = 1920, cv = document.getElementById('c'), g = cv.getContext('2d');
const F = { d: '"Inter Display","Inter",sans-serif', s: '"Inter",sans-serif', m: '"DejaVu Sans Mono",monospace' };
const C = { panel: '#0C1322', stroke: '#26324F', text: '#EEF3FF', dim: '#93A0C0', faint: '#56617F', cyan: '#41D9FF', green: '#2FE3A0', red: '#FF4D63', amber: '#FFB52E', violet: '#8E7BFF' };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, u) => a + (b - a) * u, pr = (t, a, b) => clamp((t - a) / (b - a));
const E = {
  out: u => 1 - Math.pow(1 - u, 3), in: u => u * u * u, io: u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2,
  back: u => { const c = 1.70158; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); }, expo: u => u >= 1 ? 1 : 1 - Math.pow(2, -10 * u)
};
function hex(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgba(h, a) { const [r, gg, b] = hex(h); return `rgba(${r},${gg},${b},${a})`; }
function mix(a, b, u) { const A = hex(a), B = hex(b); u = clamp(u); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], u)).toString(16).padStart(2, '0')).join(''); }
function rnd(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------- primitives ----------
function rr(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function setFont(o) { g.font = `${o.weight ?? 600} ${o.size ?? 40}px ${o.font ?? F.s}`; g.letterSpacing = (o.ls ?? 0) + 'px'; }
function tw(s, o = {}) { g.save(); setFont(o); const w = g.measureText(s).width; g.restore(); return w; }
function txt(s, x, y, o = {}) {
  g.save(); setFont(o); g.textAlign = o.align ?? 'left'; g.textBaseline = o.base ?? 'alphabetic';
  if (o.a != null) g.globalAlpha *= o.a; if (o.glow) { g.shadowColor = o.glowCol || o.color || C.text; g.shadowBlur = o.glow; }
  g.fillStyle = o.color ?? C.text; g.fillText(s, x, y); g.restore();
}
// fit a single line into maxW by shrinking the size
function fit(s, maxW, o) { let size = o.size; while (size > 12 && tw(s, { ...o, size }) > maxW) size -= 1; return size; }
// segments [[text,color],...] drawn as one line
function rich(segs, x, y, o = {}) {
  const ws = segs.map(s => tw(s[0], o)), tot = ws.reduce((a, b) => a + b, 0); let cx = (o.align === 'center') ? x - tot / 2 : (o.align === 'right' ? x - tot : x);
  segs.forEach((s, i) => { txt(s[0], cx, y, { ...o, align: 'left', color: s[1] ?? o.color, a: (o.a ?? 1) * (s[2] ?? 1) }); cx += ws[i]; }); return tot;
}
function seg(x1, y1, x2, y2, col, a = 1, lw = 3, dash) { if (a <= 0) return; g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; if (dash) g.setLineDash(dash); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.restore(); }
function circ(x, y, r, col, a = 1, glow = 0) { if (a <= 0 || r <= 0) return; g.save(); g.globalAlpha *= a; if (glow) { g.shadowColor = col; g.shadowBlur = glow; } g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.restore(); }
function ring(x, y, r, col, a = 1, lw = 3, a0 = 0, a1 = 7) { if (a <= 0 || r <= 0) return; g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.beginPath(); g.arc(x, y, r, a0, a1); g.stroke(); g.restore(); }
function arrowHead(x, y, ang, col, size = 16, a = 1) { g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(ang); g.fillStyle = col; g.beginPath(); g.moveTo(0, 0); g.lineTo(-size, -size * .58); g.lineTo(-size, size * .58); g.closePath(); g.fill(); g.restore(); }
function arrow(x1, y1, x2, y2, col, p = 1, a = 1, lw = 3) { if (p <= 0 || a <= 0) return; const ex = lerp(x1, x2, p), ey = lerp(y1, y2, p); seg(x1, y1, ex, ey, col, a, lw); arrowHead(ex + Math.cos(Math.atan2(y2 - y1, x2 - x1)) * 4, ey + Math.sin(Math.atan2(y2 - y1, x2 - x1)) * 4, Math.atan2(y2 - y1, x2 - x1), col, 15, a); }
function qp(p0, p1, p2, u) { const v = 1 - u; return [v * v * p0[0] + 2 * v * u * p1[0] + u * u * p2[0], v * v * p0[1] + 2 * v * u * p1[1] + u * u * p2[1]]; }
function qarrow(p0, p1, p2, col, p = 1, a = 1, lw = 3) {
  if (p <= 0 || a <= 0) return; g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.beginPath(); g.moveTo(p0[0], p0[1]);
  const N = 40; let last = p0, prev = p0; for (let i = 1; i <= N; i++) { const u = i / N * p; prev = last; last = qp(p0, p1, p2, u); g.lineTo(last[0], last[1]); } g.stroke(); g.restore();
  const b = qp(p0, p1, p2, Math.max(0, p - .04)); arrowHead(last[0], last[1], Math.atan2(last[1] - b[1], last[0] - b[0]), col, 16, a);
}
// a request packet travelling on a segment, u in 0..1
function pkt(x1, y1, x2, y2, u, col, o = {}) {
  if (u <= 0 || u >= 1) return; const r = o.r ?? 9, tail = o.tail ?? .28, hx = lerp(x1, x2, u), hy = lerp(y1, y2, u), u0 = Math.max(0, u - tail), tx = lerp(x1, x2, u0), ty = lerp(y1, y2, u0);
  g.save(); g.globalAlpha *= (o.a ?? 1); const gr = g.createLinearGradient(tx, ty, hx, hy); gr.addColorStop(0, rgba(col, 0)); gr.addColorStop(1, rgba(col, .8));
  g.strokeStyle = gr; g.lineWidth = r * 1.25; g.lineCap = 'round'; g.beginPath(); g.moveTo(tx, ty); g.lineTo(hx, hy); g.stroke();
  g.shadowColor = col; g.shadowBlur = 24; g.fillStyle = col; g.beginPath(); g.arc(hx, hy, r, 0, 7); g.fill(); g.shadowBlur = 0; g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(hx, hy, r * .45, 0, 7); g.fill(); g.restore();
}
function cross(x, y, s, col, a = 1, lw = 5) { seg(x - s, y - s, x + s, y + s, col, a, lw); seg(x - s, y + s, x + s, y - s, col, a, lw); }
function check(x, y, s, col, a = 1, lw = 5, p = 1) { if (a <= 0 || p <= 0) return; g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(x - s, y); const p1 = Math.min(1, p * 2), p2 = clamp(p * 2 - 1); g.lineTo(x - s + s * .7 * p1, y + s * .7 * p1); if (p2 > 0) g.lineTo(x - s * .3 + s * 1.3 * p2, y + s * .7 - s * 1.5 * p2); g.stroke(); g.restore(); }
function pop(t, t0, d = .5) { const u = pr(t, t0, t0 + d); return { a: E.out(pr(t, t0, t0 + d * .55)), s: lerp(.72, 1, E.back(u)), u }; }
function slide(t, t0, d = .5, dy = 40) { const u = E.out(pr(t, t0, t0 + d)); return { a: u, y: (1 - u) * dy }; }

// ---------- components ----------
function glyph(kind, x, y, s, col) {
  g.save(); g.translate(x, y); g.strokeStyle = col; g.fillStyle = col; g.lineWidth = Math.max(2.5, s * .11); g.lineCap = 'round'; g.lineJoin = 'round';
  if (kind === 'server') { for (const dy of [-s * .34, s * .34]) { rr(-s * .62, dy - s * .24, s * 1.24, s * .48, s * .12); g.stroke(); g.beginPath(); g.arc(-s * .34, dy, s * .07, 0, 7); g.fill(); } }
  else if (kind === 'bank') { g.beginPath(); g.moveTo(-s * .7, -s * .2); g.lineTo(0, -s * .68); g.lineTo(s * .7, -s * .2); g.closePath(); g.stroke(); for (const dx of [-s * .42, 0, s * .42]) { g.beginPath(); g.moveTo(dx, -s * .02); g.lineTo(dx, s * .42); g.stroke(); } g.beginPath(); g.moveTo(-s * .7, s * .64); g.lineTo(s * .7, s * .64); g.stroke(); }
  else if (kind === 'phone') { rr(-s * .4, -s * .66, s * .8, s * 1.32, s * .16); g.stroke(); g.beginPath(); g.moveTo(-s * .12, s * .44); g.lineTo(s * .12, s * .44); g.stroke(); }
  else if (kind === 'gateway') { g.beginPath(); g.moveTo(-s * .62, -s * .28); g.lineTo(s * .5, -s * .28); g.moveTo(s * .24, -s * .54); g.lineTo(s * .52, -s * .28); g.lineTo(s * .24, -s * .02); g.moveTo(s * .62, s * .3); g.lineTo(-s * .5, s * .3); g.moveTo(-s * .24, s * .04); g.lineTo(-s * .52, s * .3); g.lineTo(-s * .24, s * .56); g.stroke(); }
  else if (kind === 'cart') { g.beginPath(); g.moveTo(-s * .7, -s * .5); g.lineTo(-s * .44, -s * .5); g.lineTo(-s * .2, s * .22); g.lineTo(s * .5, s * .22); g.lineTo(s * .66, -s * .26); g.lineTo(-s * .36, -s * .26); g.stroke(); g.beginPath(); g.arc(-s * .12, s * .5, s * .09, 0, 7); g.arc(s * .42, s * .5, s * .09, 0, 7); g.fill(); }
  else if (kind === 'card') { rr(-s * .68, -s * .46, s * 1.36, s * .92, s * .14); g.stroke(); g.beginPath(); g.moveTo(-s * .68, -s * .14); g.lineTo(s * .68, -s * .14); g.stroke(); }
  g.restore();
}
// service box. o: label, sub, col, a, s, glow, icon, dashed, size, subCol
function svc(cx, cy, w, h, o = {}) {
  const col = o.col || C.cyan, a = o.a ?? 1, s = o.s ?? 1, glow = o.glow ?? .45; if (a <= .001) return;
  g.save(); g.translate(cx, cy); g.scale(s, s); g.globalAlpha *= a;
  rr(-w / 2, -h / 2, w, h, o.r ?? 22); g.shadowColor = rgba(col, .65 * glow); g.shadowBlur = 50 * glow; g.fillStyle = C.panel; g.fill(); g.shadowBlur = 0; g.shadowColor = 'transparent';
  const gr = g.createLinearGradient(0, -h / 2, 0, h / 2); gr.addColorStop(0, rgba(col, .22)); gr.addColorStop(1, rgba(col, .04)); g.fillStyle = gr; g.fill();
  g.lineWidth = o.lw ?? 3; g.strokeStyle = rgba(col, .95); if (o.dashed) g.setLineDash([12, 9]); g.stroke(); g.setLineDash([]);
  if (o.label) {
    const size = o.size ?? 34, hasIcon = !!o.icon, isz = Math.min(h - 34, 58);
    const lw = tw(o.label, { size, weight: 700 }), sw = o.sub ? tw(o.sub, { size: o.subSize ?? 22, font: F.m, weight: 400 }) : 0, textW = Math.max(lw, sw), tot = textW + (hasIcon ? isz + 22 : 0);
    let x0 = -tot / 2;
    if (hasIcon) { rr(x0, -isz / 2, isz, isz, 14); g.fillStyle = rgba(col, .16); g.fill(); glyph(o.icon, x0 + isz / 2, 0, isz * .36, col); x0 += isz + 22; }
    const ly = o.sub ? -15 : 1;
    txt(o.label, x0, ly, { size, weight: 700, base: 'middle' });
    if (o.sub) txt(o.sub, x0, 22, { size: o.subSize ?? 22, font: F.m, weight: 400, color: o.subCol || rgba(col, .95), base: 'middle' });
  }
  g.restore();
}
function pill(cx, cy, label, col, o = {}) {
  const size = o.size ?? 26, padX = o.padX ?? 22, h = o.h ?? size + 24, w = o.w ?? tw(label, { size, weight: o.weight ?? 700, font: o.font ?? F.m, ls: o.ls ?? 1 }) + padX * 2;
  g.save(); g.translate(cx, cy); g.scale(o.s ?? 1, o.s ?? 1); g.globalAlpha *= o.a ?? 1; rr(-w / 2, -h / 2, w, h, h / 2);
  if (o.glow) { g.shadowColor = rgba(col, .7); g.shadowBlur = o.glow; } g.fillStyle = o.solid ? col : mix(C.panel, col, .2); g.fill(); g.shadowBlur = 0; if (!o.solid) { g.lineWidth = 2.5; g.strokeStyle = rgba(col, .9); g.stroke(); }
  txt(label, 0, 2, { size, weight: o.weight ?? 700, font: o.font ?? F.m, ls: o.ls ?? 1, align: 'center', base: 'middle', color: o.solid ? '#06101C' : (o.textCol ?? col) }); g.restore(); return w;
}
// circuit breaker switch. o: open 0..1, col, a, wrap 0..1, w, h, rot
function breaker(cx, cy, o = {}) {
  const w = o.w ?? 210, h = o.h ?? 120, col = o.col ?? C.green, op = o.open ?? 0, wp = o.wrap ?? 1; if ((o.a ?? 1) <= 0) return;
  g.save(); g.translate(cx, cy); if (o.rot) g.rotate(o.rot); g.scale(o.s ?? 1, o.s ?? 1); g.globalAlpha *= o.a ?? 1;
  rr(-w / 2, -h / 2, w, h, 26); g.save(); g.globalAlpha *= clamp(wp * 2); g.shadowColor = rgba(col, .55); g.shadowBlur = 36; g.fillStyle = '#0A101D'; g.fill(); g.restore();
  g.fillStyle = rgba(col, .10 * clamp(wp * 2)); g.fill();
  const per = 2 * (w + h); g.lineWidth = 3.5; g.strokeStyle = col; g.setLineDash([per * wp, per]); g.stroke(); g.setLineDash([]);
  const tx = w * .26; g.lineCap = 'round'; g.lineWidth = 6; g.strokeStyle = col;
  g.beginPath(); g.moveTo(-w / 2, 0); g.lineTo(-tx, 0); g.moveTo(tx, 0); g.lineTo(w / 2, 0); g.stroke();
  g.save(); g.translate(-tx, 0); g.rotate(-op * .68); g.shadowColor = col; g.shadowBlur = 16; g.lineWidth = 7; g.beginPath(); g.moveTo(0, 0); g.lineTo(tx * 2, 0); g.stroke(); g.restore();
  g.fillStyle = '#0A101D'; g.lineWidth = 5; for (const x of [-tx, tx]) { g.beginPath(); g.arc(x, 0, 10, 0, 7); g.fill(); g.stroke(); }
  g.restore();
}
function panel(x, y, w, h, o = {}) { g.save(); g.globalAlpha *= o.a ?? 1; rr(x, y, w, h, o.r ?? 28); g.fillStyle = o.fill ?? 'rgba(12,19,34,.78)'; g.fill(); g.lineWidth = 2; g.strokeStyle = o.stroke ?? 'rgba(120,150,230,.22)'; g.stroke(); g.restore(); }

// ---------- timeline helpers ----------
const SCN = {}, SC = {};
const L = (id, i) => SC[id].lines[i];
function at(l, ph, off = 0) { const i = l.text.toLowerCase().indexOf(ph.toLowerCase()); if (i < 0) throw new Error('phrase not found: ' + ph); return l.start + i / l.text.length * (l.end - l.start) + off; }

// ---------- background ----------
const PART = (() => { const r = rnd(7); return Array.from({ length: 46 }, () => ({ x: r() * W, y: r() * H, s: 8 + r() * 26, z: .4 + r() * 1.6, p: r() * 7 })); })();
function bg(t) {
  let gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#081022'); gr.addColorStop(.45, '#060A15'); gr.addColorStop(1, '#04060C'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const bx = 540 + Math.sin(t * .21) * 180, by = 520 + Math.cos(t * .17) * 120; gr = g.createRadialGradient(bx, by, 0, bx, by, 900); gr.addColorStop(0, 'rgba(48,96,220,.22)'); gr.addColorStop(1, 'rgba(48,96,220,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const cx = 300 + Math.cos(t * .13) * 200, cy = 1500 + Math.sin(t * .19) * 120; gr = g.createRadialGradient(cx, cy, 0, cx, cy, 800); gr.addColorStop(0, 'rgba(120,70,230,.14)'); gr.addColorStop(1, 'rgba(120,70,230,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.save(); g.strokeStyle = 'rgba(140,170,255,.05)'; g.lineWidth = 1; const off = (t * 9) % 90; g.beginPath(); for (let x = 0; x <= W; x += 90) { g.moveTo(x + .5, 0); g.lineTo(x + .5, H); } for (let y = -90 + off; y <= H; y += 90) { g.moveTo(0, y + .5); g.lineTo(W, y + .5); } g.stroke(); g.restore();
  for (const p of PART) { const y = ((p.y - t * p.s * p.z) % H + H) % H, a = .10 + .09 * Math.sin(t * 1.3 + p.p); g.fillStyle = `rgba(150,200,255,${a})`; g.beginPath(); g.arc(p.x + Math.sin(t * .4 + p.p) * 14, y, 1.2 + p.z, 0, 7); g.fill(); }
  gr = g.createRadialGradient(W / 2, H / 2, 520, W / 2, H / 2, 1250); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.6)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
}
function tint(col, a) { if (a <= 0) return; const gr = g.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 1250); gr.addColorStop(0, rgba(col, 0)); gr.addColorStop(1, rgba(col, a)); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore(); }

// ---------- header + captions ----------
function header(t) {
  const x0 = 70, x1 = 1010, y = 232, gap = 8, n = TL.scenes.length, tot = TL.duration; let x = x0; const availW = x1 - x0 - gap * (n - 1);
  const a0 = E.out(pr(t, .15, .7));
  TL.scenes.forEach(s => {
    const w = availW * (s.end - s.start) / tot, f = pr(t, s.start, s.end);
    g.save(); g.globalAlpha = a0; rr(x, y, w, 6, 3); g.fillStyle = 'rgba(255,255,255,.13)'; g.fill(); if (f > 0) { rr(x, y, Math.max(6, w * f), 6, 3); g.fillStyle = f < 1 ? C.cyan : 'rgba(255,255,255,.6)'; if (f < 1) { g.shadowColor = C.cyan; g.shadowBlur = 12; } g.fill(); } g.restore(); x += w + gap;
  });
  TL.scenes.forEach((s, i) => {
    const lab = s.label; if (!lab || t < s.start || t >= s.end) return; const a = E.out(pr(t, s.start + .05, s.start + .45)) * (1 - pr(t, s.end - .22, s.end)), dx = (1 - E.out(pr(t, s.start + .05, s.start + .5))) * -30;
    g.save(); g.globalAlpha = a; g.translate(dx, 0); const num = String(i).padStart(2, '0');
    txt(num, 72, 300, { size: 26, font: F.m, weight: 700, color: C.cyan }); const nw = tw(num, { size: 26, font: F.m, weight: 700 });
    seg(72 + nw + 14, 291, 72 + nw + 54, 291, rgba(C.cyan, .6), 1, 2); txt(lab, 72 + nw + 68, 300, { size: 26, weight: 700, ls: 4, color: C.dim }); g.restore();
  });
}
// keyword colours for captions come from script.json "keywords": {red:[], green:[], amber:[], cyan:[], violet:[]}
const KWMAP = {};
let CAPS = [];
function buildCaps() {
  CAPS = [];
  for (const s of TL.scenes) {
    if (!s.captions) continue;
    for (const l of s.lines) {
      const words = l.text.split(/\s+/), wts = words.map(w => w.length + 1 + (/[,:.?!]$/.test(w) ? 3 : 0)), tot = wts.reduce((a, b) => a + b, 0); let acc = 0;
      const ws = words.map((w, i) => { const st = l.start + acc / tot * (l.end - l.start); acc += wts[i]; return { w, st }; });
      // split into clauses at punctuation, then balance each clause into short chunks
      const STOP = new Set(['a', 'an', 'the', 'and', 'on', 'it', 'its', 'to', 'of', 'for', 'while', 'so', 'if', 'but', 'say', 'with']);
      const clauses = []; let cl = []; ws.forEach(x => { cl.push(x); if (/[,:.?!]$/.test(x.w)) { clauses.push(cl); cl = []; } }); if (cl.length) clauses.push(cl);
      // merge one-word clauses into a neighbour
      for (let i = 0; i < clauses.length; i++) if (clauses[i].length === 1 && clauses.length > 1) { if (i + 1 < clauses.length) { clauses[i + 1] = clauses[i].concat(clauses[i + 1]); clauses.splice(i, 1); i--; } else { clauses[i - 1] = clauses[i - 1].concat(clauses[i]); clauses.splice(i, 1); } }
      const groups = [];
      for (const c of clauses) {
        const chars = c.reduce((a, b) => a + b.w.length + 1, 0), k = Math.max(Math.ceil(chars / 22), Math.ceil(c.length / 4)), target = chars / k; let grp = [], acc2 = 0;
        c.forEach((x, i) => { grp.push(x); acc2 += x.w.length + 1; const left = c.length - i - 1, key = x.w.toLowerCase().replace(/[^a-z]/g, ''); if (left > 0 && acc2 >= target - 2 && !STOP.has(key) && groups.length + 1 < 99) { groups.push(grp); grp = []; acc2 = 0; } }); if (grp.length) groups.push(grp);
      }
      groups.forEach((gq, i) => CAPS.push({ words: gq, start: gq[0].st, end: i + 1 < groups.length ? groups[i + 1][0].st : l.end + .22 }));
    }
  }
  for (let i = 0; i < CAPS.length - 1; i++) if (CAPS[i].end > CAPS[i + 1].start) CAPS[i].end = CAPS[i + 1].start;
}
function captions(t) {
  const c = CAPS.find(c => t >= c.start - .04 && t < c.end); if (!c) return;
  const o = { size: 58, weight: 800, font: F.d, ls: 1 }, sp = 18, ws = c.words.map(x => tw(x.w.toUpperCase(), o)), tot = ws.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
  const a = E.out(pr(t, c.start - .04, c.start + .12)), y = 1452; let x = W / 2 - tot / 2;
  g.save(); g.globalAlpha = a; rr(W / 2 - tot / 2 - 34, y - 62, tot + 68, 90, 24); g.fillStyle = 'rgba(4,7,14,.78)'; g.fill(); g.lineWidth = 1.5; g.strokeStyle = 'rgba(140,170,255,.18)'; g.stroke();
  c.words.forEach((x0, i) => {
    const said = t >= x0.st - .03, key = x0.w.toLowerCase().replace(/[^a-z'\-]/g, ''), col = KWMAP[key] || C.text, u = E.back(pr(t, x0.st - .03, x0.st + .16));
    g.save(); g.translate(x + ws[i] / 2, y); const s = said ? lerp(.88, 1, u) : .96; g.scale(s, s); txt(x0.w.toUpperCase(), 0, 0, { ...o, align: 'center', color: said ? col : 'rgba(238,243,255,.32)', glow: said && KWMAP[key] ? 18 : 0 }); g.restore(); x += ws[i] + sp;
  }); g.restore();
}

// ---------- main ----------
function renderFrame(t) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.shadowBlur = 0; bg(t);
  const lastId = TL.scenes[TL.scenes.length - 1].id;
  for (const s of TL.scenes) {
    if (t < s.start || t >= s.end) continue; const lt = t - s.start, d = s.end - s.start, first = s === TL.scenes[0], last = s.id === lastId;
    const ain = first ? 1 : E.out(pr(lt, 0, .42)), aout = last ? 1 : 1 - E.in(pr(lt, d - .24, d));
    const sc = lerp(.955, 1, ain) * lerp(1.05, 1, aout);
    g.save(); g.translate(W / 2, 860); g.scale(sc, sc); g.translate(-W / 2, -860); g.globalAlpha = ain * aout; SCN[s.id](t, s, lt, d); g.restore();
  }
  header(t); captions(t);
  const fin = pr(t, TL.duration - .45, TL.duration - .02); if (fin > 0) { g.fillStyle = `rgba(3,5,10,${E.io(fin)})`; g.fillRect(0, 0, W, H); }
}
window.CUES = []; const cue = (t, k, v = 1) => window.CUES.push({ t: +t.toFixed(3), k, v });
function initReel() { const KW = TL.keywords || {}; for (const k in KW) for (const w of KW[k]) KWMAP[w.toLowerCase()] = C[k] || C.cyan; for (const s of TL.scenes) SC[s.id] = s; buildCaps(); for (const s of TL.scenes) { if (!SCN[s.id]) throw new Error('scenes.js has no SCN.' + s.id); if (SCN[s.id].init) SCN[s.id].init(s); } TL.scenes.forEach((s, i) => { if (i) cue(s.start - .12, 'whoosh', .8); }); window.CUES.sort((a, b) => a.t - b.t); }
