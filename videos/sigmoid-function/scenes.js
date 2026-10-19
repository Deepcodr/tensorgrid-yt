'use strict';
// Sigmoid Function — scene code. Uses engine/core.js + engine/lib.js.
const sig = x => 1 / (1 + Math.exp(-x));
const dsig = x => sig(x) * (1 - sig(x));
const f2 = v => v.toFixed(2);
// sigma(x) = 1 / (1 + e^-x), centred at cx; returns width
function formula(cx, y, size, a = 1, o = {}) {
  const fo = { size, weight: 800, font: F.d }, so = { size: size * .58, weight: 800, font: F.d };
  const parts = [['σ(x)', C.cyan, fo, 0], [' = 1 / (1 + e', C.text, fo, 0], ['−x', C.amber, so, -size * .42], [')', C.text, fo, 0]];
  const ws = parts.map(p => tw(p[0], p[2])), tot = ws.reduce((s, v) => s + v, 0) + 4; let x = cx - tot / 2;
  parts.forEach((p, i) => { txt(p[0], x, y + p[3], { ...p[2], color: p[1], a, glow: o.glow && i === 0 ? o.glow : 0 }); x += ws[i] + (i === 1 ? 2 : 0); });
  return tot;
}
// horizontal probability bar 0..1. returns mapper
function probBar(x0, x1, y, a = 1, o = {}) {
  if (a <= 0) return v => lerp(x0, x1, v);
  g.save(); g.globalAlpha *= a; rr(x0, y - 9, x1 - x0, 18, 9);
  const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, rgba(C.cyan, .25)); gr.addColorStop(1, rgba(C.green, .45)); g.fillStyle = gr; g.fill(); g.lineWidth = 2; g.strokeStyle = 'rgba(160,190,255,.45)'; g.stroke();
  for (const v of (o.ticks ?? [0, .5, 1])) { const x = lerp(x0, x1, v); seg(x, y - 20, x, y + 20, 'rgba(200,215,255,.6)', 1, 2); txt(String(v), x, y + 52, { size: 24, font: F.m, weight: 700, align: 'center', color: C.dim }); }
  if (o.label) txt(o.label, x0, y - 36, { size: 22, font: F.m, weight: 700, ls: 3, color: C.dim });
  g.restore(); return v => lerp(x0, x1, v);
}
function sigBox(cx, cy, w, h, a, s, label, col = C.cyan, glow = .6) { svc(cx, cy, w, h, { col, a, s, glow }); if (a > 0) { g.save(); g.translate(cx, cy); g.scale(s, s); txt(label, 0, 4, { size: h * .48, weight: 900, font: F.d, align: 'center', base: 'middle', color: col, a, glow: 16 }); g.restore(); } }

// =============== HOOK ===============
SCN.hook = (t, s) => {
  const P = SCN.hook.P, z = lerp(1, 1.05, pr(t, s.start, s.end));
  g.save(); g.translate(540, 860); g.scale(z, z); g.translate(-540, -860);
  // function box
  const bp = pop(t, s.start + .1, .5), rev = pr(t, P.tTiny, P.tTiny + .35), sh = t >= P.tTiny ? Math.pow(1 - pr(t, P.tTiny, P.tTiny + .4), 2) : 0;
  g.save(); g.translate(Math.sin(t * 90) * sh * 10, 0);
  sigBox(540, 860, 300, 150, bp.a, bp.s * (1 + sh * .08), rev > .5 ? 'σ(x)' : '?', rev > .5 ? C.green : C.cyan, .5 + sh);
  if (sh > 0) ring(540, 860, 150 + (1 - sh) * 160, C.green, sh * .7, 4);
  g.restore();
  txt('IN', 540, 760, { size: 20, font: F.m, weight: 700, ls: 4, align: 'center', color: C.dim, a: bp.a }); txt('OUT', 540, 978, { size: 20, font: F.m, weight: 700, ls: 4, align: 'center', color: C.dim, a: bp.a });
  const ba = E.out(pr(t, s.start + .3, s.start + .8)), X = probBar(140, 940, 1190, ba); txt('PROBABILITY', 540, 1290, { size: 22, font: F.m, weight: 700, ls: 4, align: 'center', color: C.dim, a: ba });
  P.nums.forEach(n => {
    const u1 = (t - n.t) / .45, u2 = (t - n.t - .5) / .45, p = sig(n.v), tx = X(p);
    if (u1 > 0 && u1 < 1) { const y = lerp(640, 780, E.in(u1)); pill(540 + (n.dx * (1 - u1)), y, String(n.v), C.text, { size: 30, h: 56, a: clamp(u1 * 4) }); }
    if (u2 > 0 && u2 < 1) { const y = lerp(950, 1140, E.out(u2)), x = lerp(540, tx, E.io(u2)); pill(x, y, f2(p), C.green, { size: 28, h: 52, solid: true }); }
    if (u2 >= 1) { const k = pop(t, n.t + .95, .35); circ(tx, 1190, 13 * k.s, C.green, k.a, 16); txt(f2(p), tx, 1150, { size: 20, font: F.m, weight: 700, align: 'center', color: C.green, a: k.a * (1 - pr(t, n.t + 2.2, n.t + 2.6)) }); }
  });
  g.restore();
  let a = slide(t, s.lines[0].start - .2, .45, 50); txt('ANY NUMBER', 540, 400 + a.y, { size: 76, weight: 800, font: F.d, ls: 2, align: 'center', a: a.a });
  const u = pr(t, P.tProb - .1, P.tProb + .22); if (u > 0) { g.save(); g.translate(540, 508); const k = lerp(1.6, 1, E.expo(u)); g.scale(k, k); txt('→ PROBABILITY?', 0, 0, { size: 84, weight: 900, font: F.d, align: 'center', color: C.cyan, a: E.out(u), glow: 30 }); g.restore(); }
};
SCN.hook.init = s => {
  const P = { tProb: cueT(s, [0, 'probability', -.05]), tTiny: cueT(s, [1, 'tiny', -.05]) };
  P.nums = [{ v: -12, dx: -160 }, { v: 42, dx: 160 }, { v: 1.5, dx: -90 }, { v: -0.6, dx: 120 }, { v: 0, dx: -40 }, { v: 3, dx: 80 }].map((n, i) => ({ ...n, t: s.start + .35 + i * .62 }));
  SCN.hook.P = P; cue(s.start + .1, 'pop', .5); P.nums.forEach(n => { cue(n.t + .4, 'blip', .35); cue(n.t + .95, 'tick', .35); }); cue(P.tProb, 'thud', .8); cue(P.tTiny, 'impact', .8); cue(P.tTiny + .05, 'chime', .6);
};

// =============== PROBLEM ===============
const NET = { L: [[180, [480, 610, 740]], [370, [430, 543, 657, 770]], [560, [610]]] };
SCN.problem = (t, s) => {
  const P = SCN.problem.P;
  // tiny network
  NET.L.forEach(([x, ys], li) => ys.forEach((y, ni) => {
    const p = pop(t, s.start + .1 + li * .18 + ni * .04, .45); if (p.a <= 0) return;
    if (li) NET.L[li - 1][1].forEach(y0 => seg(NET.L[li - 1][0] + 24, y0, x - 24, y, rgba(C.cyan, .25), p.a, 2));
    const out = li === 2; circ(x, y, (out ? 30 : 22) * p.s, mix(C.panel, out ? C.amber : C.cyan, .3), p.a); ring(x, y, (out ? 30 : 22) * p.s, out ? C.amber : C.cyan, p.a, 3);
  }));
  // forward pulses through the net
  for (let k = s.start + .6; k < s.end; k += 1.1) for (const [x0, y0] of [[180, 480], [180, 740], [370, 543], [370, 657]]) { const u = (t - k) / .5; if (u > 0 && u < 1) { const tx = x0 === 180 ? 370 : 560, ty = x0 === 180 ? 610 : 610; circ(lerp(x0, tx, u), lerp(y0, ty, u), 5, C.cyan, .8, 10); } }
  const la = pop(t, P.tLast, .45); if (la.a > 0) txt('last layer', 560, 680, { size: 20, font: F.m, weight: 700, align: 'center', color: C.amber, a: la.a });
  // logit readout
  const ra = pop(t, P.tScore, .45), val = P.val(t), bump = 1 + (1 - pr(t, P.lastChange(t), P.lastChange(t) + .3)) * .14, bad = Math.abs(val) > 5;
  if (ra.a > 0) {
    arrow(596, 610, 676, 610, rgba(C.amber, .8), E.out(pr(t, P.tScore, P.tScore + .3)), ra.a, 3);
    g.save(); g.translate(820, 610); g.scale(ra.s, ra.s); g.globalAlpha *= ra.a; rr(-130, -90, 260, 180, 26); g.fillStyle = mix(C.panel, bad ? C.red : C.amber, .14); g.fill(); g.lineWidth = 3; g.strokeStyle = bad ? C.red : C.amber; g.stroke();
    txt(t >= P.tLogit ? 'LOGIT' : 'RAW SCORE', 0, -46, { size: 22, font: F.m, weight: 700, ls: 3, align: 'center', color: C.dim });
    g.scale(bump, bump); txt(String(val), 0, 36, { size: 76, weight: 900, font: F.d, align: 'center', color: bad ? C.red : C.text, glow: bad ? 16 : 0 }); g.restore();
  }
  // number line with the tiny 0..1 band
  const na = E.out(pr(t, P.tAny - .2, P.tAny + .3)), sq = E.io(pr(t, P.tSquash, P.tSquash + .9)), half = lerp(430, 180, sq), Xn = v => 540 + v * 8 * lerp(1, .42, sq);
  if (na > 0) {
    g.save(); g.globalAlpha *= na; seg(540 - half, 1010, 540 + half, 1010, sq > 0 ? mix('#AFC3FF', C.amber, sq) : 'rgba(175,195,255,.6)', 1, 3);
    arrowHead(540 + half + 6, 1010, 0, 'rgba(175,195,255,.7)', 14); arrowHead(540 - half - 6, 1010, Math.PI, 'rgba(175,195,255,.7)', 14);
    txt('−∞', 540 - half - 30, 1060, { size: 24, font: F.m, weight: 700, align: 'center', color: C.dim }); txt('+∞', 540 + half + 30, 1060, { size: 24, font: F.m, weight: 700, align: 'center', color: C.dim });
    for (const v of [-40, -20, 20, 40]) { const x = Xn(v); if (Math.abs(x - 540) < half) { seg(x, 998, x, 1022, 'rgba(175,195,255,.4)', 1 - sq, 2); txt(String(v), x, 1060, { size: 20, font: F.m, weight: 400, align: 'center', color: C.faint, a: 1 - sq }); } }
    g.restore();
    // logit dot
    const lx = Xn(clamp(val, -50, 50)); circ(lx, 1010, 14, bad ? C.red : C.amber, na * (1 - sq), 18); if (na * (1 - sq) > 0) txt(String(val), lx, 975, { size: 24, font: F.m, weight: 700, align: 'center', color: bad ? C.red : C.amber, a: na * (1 - sq) });
    if (bad && t < P.tSquash) { const k = pop(t, P.lastChange(t) + .1, .35); pill(lx, 1110, '✕ not a probability', C.red, { size: 22, h: 42, a: k.a * na, s: k.s }); }
  }
  // 0..1 band
  const bA = E.out(pr(t, P.tBetween - .15, P.tBetween + .3)), bw = lerp(12, 300, E.io(pr(t, P.tSquash + .3, P.tSquash + 1.1)));
  if (bA > 0) {
    g.save(); g.globalAlpha *= bA; rr(540 - bw / 2, 996, bw, 28, 8); g.shadowColor = C.green; g.shadowBlur = 26; g.fillStyle = rgba(C.green, .75); g.fill(); g.restore();
    if (t < P.tSquash + .2) { const k = pop(t, P.tBetween, .4); pill(540, 1180, 'probability lives in [0, 1]', C.green, { size: 24, h: 48, a: k.a * bA, s: k.s }); seg(540, 1030, 540, 1150, rgba(C.green, .6), k.a * bA, 2, [5, 6]); }
    else { txt('0', 540 - bw / 2, 1070, { size: 24, font: F.m, weight: 700, align: 'center', color: C.green, a: bA }); txt('1', 540 + bw / 2, 1070, { size: 24, font: F.m, weight: 700, align: 'center', color: C.green, a: bA }); }
  }
  if (sq > 0) { const k = pop(t, P.tSquash, .45); for (const d of [-1, 1]) { const x = 540 + d * (half + 80); arrow(x + d * 60, 1010, x - d * 10, 1010, C.amber, 1, k.a, 5); } pill(540, 1210, 'SQUASH IT?', C.amber, { size: 34, h: 70, solid: true, glow: 26, a: k.a, s: k.s, font: F.d, weight: 900 }); }
  tint(C.red, .1 * (bad && t < P.tSquash ? 1 : 0) * na);
};
SCN.problem.init = s => {
  const P = { tLast: cueT(s, [0, 'last layer', -.1]), tScore: cueT(s, [0, 'raw score', -.1]), tLogit: cueT(s, [0, 'logit', -.1]), tAny: cueT(s, [1, 'anything', -.1]), tM12: cueT(s, [1, 'minus 12', -.05]), t0: cueT(s, [1, '0,', -.05]), t42: cueT(s, [1, '42', -.1]),
    tBetween: cueT(s, [2, 'between', -.1]), tSquash: cueT(s, [3, 'squash', -.15]) };
  const seq = [[s.start, 2.3], [P.tM12, -12], [P.t0, 0], [P.t42, 42]];
  P.val = t => { let v = seq[0][1]; seq.forEach(x => { if (t >= x[0]) v = x[1]; }); return v; };
  P.lastChange = t => { let v = seq[0][0]; seq.forEach(x => { if (t >= x[0]) v = x[0]; }); return v; };
  SCN.problem.P = P;
  [0, 1, 2].forEach(i => cue(s.start + .1 + i * .18, 'pop', .3)); cue(P.tScore, 'blip', .5); cue(P.tLogit, 'tick', .5); cue(P.tAny, 'swish', .5);
  cue(P.tM12, 'error', .6); cue(P.t0, 'tick', .5); cue(P.t42, 'error', .7); cue(P.tBetween, 'ping', .6); cue(P.tSquash, 'riser', .7); cue(P.tSquash + .7, 'switch', .6);
};

// =============== DEFINITION ===============
const DEF_X = [-6, -4, -2, -1, 0, 1, 2, 4, 6];
SCN.definition = (t, s) => {
  const P = SCN.definition.P, d = s.lines;
  let a = slide(t, d[0].start - .15, .4, 30); txt('THE FIX', 540, 372 + a.y, { size: 32, weight: 700, ls: 10, align: 'center', color: C.dim, a: a.a });
  let u = pr(t, P.tTitle, P.tTitle + .3); if (u > 0) { g.save(); g.translate(540, 480); const sc = lerp(1.45, 1, E.expo(u)); g.scale(sc, sc); txt('Sigmoid', 0, 0, { size: 120, weight: 900, font: F.d, align: 'center', a: E.out(u), glow: 30, glowCol: rgba(C.cyan, .7) }); g.restore(); }
  a = slide(t, P.tTitle + .35, .4, 20); if (a.a > 0) formula(540, 570 + a.y, 44, a.a);
  // input line (wide) -> output bar (narrow)
  const ia = E.out(pr(t, P.tSq - .3, P.tSq + .2)), Xi = v => 540 + v * 70, yI = 700, yO = 1010, Xo = v => lerp(330, 750, v);
  if (ia > 0) {
    g.save(); g.globalAlpha *= ia; seg(110, yI, 970, yI, 'rgba(175,195,255,.6)', 1, 3); txt('ANY REAL NUMBER', 110, yI - 66, { size: 20, font: F.m, weight: 700, ls: 3, color: C.dim });
    for (const v of [-6, -4, -2, 0, 2, 4, 6]) { seg(Xi(v), yI - 10, Xi(v), yI + 10, 'rgba(175,195,255,.5)', 1, 2); }
    rr(330, yO - 9, 420, 18, 9); g.fillStyle = rgba(C.green, .35); g.fill(); g.lineWidth = 2; g.strokeStyle = rgba(C.green, .8); g.stroke();
    txt('0', 330, yO + 50, { size: 26, font: F.m, weight: 700, align: 'center', color: C.text }); txt('1', 750, yO + 50, { size: 26, font: F.m, weight: 700, align: 'center', color: C.text }); txt('0.5', 540, yO + 50, { size: 22, font: F.m, weight: 400, align: 'center', color: C.dim });
    g.restore();
  }
  DEF_X.forEach((v, i) => {
    const ts = P.tSq + i * .14, p = E.io(pr(t, ts, ts + .6)); if (p <= 0) return;
    const hiR = v > 2 && t >= P.tBig, hiL = v < -2 && t >= P.tNeg, col = hiR ? C.green : hiL ? C.violet : C.cyan, w = hiR || hiL ? 1 : (t >= P.tBig ? .45 : .85);
    const x0 = Xi(v), x1 = Xo(sig(v)); g.save(); g.globalAlpha *= w; g.strokeStyle = rgba(col, .6); g.lineWidth = 2.5; g.beginPath(); g.moveTo(x0, yI); g.bezierCurveTo(x0, yI + 150, x1, yO - 150, lerp(x0, x1, 1), lerp(yI, yO, p)); g.stroke(); g.restore();
    // travelling dot then rest on bar
    const q = clamp(p), bx = Math.pow(1 - q, 3) * x0 + 3 * Math.pow(1 - q, 2) * q * x0 + 3 * (1 - q) * q * q * x1 + q * q * q * x1, by = Math.pow(1 - q, 3) * yI + 3 * Math.pow(1 - q, 2) * q * (yI + 150) + 3 * (1 - q) * q * q * (yO - 150) + q * q * q * yO;
    circ(x0, yI, 9, col, 1, 10); circ(bx, by, 9, col, w, 14);
    txt(String(v), x0, yI - 26 - (i % 2) * 0, { size: 20, font: F.m, weight: 700, align: 'center', color: hiR ? C.green : hiL ? C.violet : C.dim, a: (i % 2 ? 1 : 1) * w });
  });
  // takeaways
  const rows = [[P.tBig, [['Big input', C.text], ['  →  ', C.dim], ['≈ 1', C.green]], C.green], [P.tNeg, [['Very negative', C.text], ['  →  ', C.dim], ['≈ 0', C.violet]], C.violet]];
  rows.forEach((ln, i) => { const u2 = E.out(pr(t, ln[0], ln[0] + .4)); if (u2 <= 0) return; const yy = 1170 + i * 90, dx = (1 - u2) * -50; g.save(); g.globalAlpha *= u2; rr(150 + dx, yy - 46, 10, 56, 5); g.fillStyle = ln[2]; g.shadowColor = ln[2]; g.shadowBlur = 14; g.fill(); g.restore(); rich(ln[1], 190 + dx, yy, { size: 54, weight: 700, font: F.d, a: u2 }); });
  if (t >= P.tSq + .3 && t < P.tBig) { const k = pop(t, P.tBetween, .4); pill(540, 1180, 'output always between 0 and 1', C.green, { size: 26, h: 52, a: k.a, s: k.s }); }
};
SCN.definition.init = s => {
  const P = { tTitle: cueT(s, [0, 'sigmoid', -.1]), tSq: cueT(s, [1, 'squashes', -.1]), tBetween: cueT(s, [1, 'between', -.1]), tBig: cueT(s, [2, 'big', -.1]), tNeg: cueT(s, [2, 'very negative', -.1]) }; SCN.definition.P = P;
  cue(P.tTitle, 'thud', .8); cue(P.tTitle + .05, 'chime', .6); cue(P.tTitle + .35, 'swish', .4); DEF_X.forEach((v, i) => cue(P.tSq + i * .14 + .55, 'tick', .25)); cue(P.tBetween, 'confirm', .5); cue(P.tBig, 'pop', .6); cue(P.tNeg, 'pop', .6);
};

// =============== HOW IT WORKS ===============
SCN.how = (t, s) => {
  const P = SCN.how.P, aa = E.out(pr(t, s.start + .05, s.start + .5));
  let a = slide(t, s.start + .1, .45, 30); formula(540, 410 + a.y, 56, a.a, { glow: 14 });
  const m = axes(160, 520, 780, 520, { xr: [-6, 6], yr: [0, 1], ticksY: [0, 0.5, 1], ticksX: [-6, -4, -2, 0, 2, 4, 6], xLabel: 'x (logit)', yLabel: 'σ(x)', a: aa });
  // saturation bands
  const sa = E.out(pr(t, P.tFlat, P.tFlat + .5));
  if (sa > 0) { g.save(); g.globalAlpha *= sa * .9; for (const [v0, v1] of [[-6, -4], [4, 6]]) { rr(m.X(v0), 520, m.X(v1) - m.X(v0), 520, 10); g.fillStyle = rgba(C.amber, .1); g.fill(); g.lineWidth = 2; g.strokeStyle = rgba(C.amber, .45); g.setLineDash([8, 8]); g.stroke(); g.setLineDash([]); } g.restore();
    const k = pop(t, P.tSat, .4); pill(m.X(-5), 960, 'saturated', C.amber, { size: 20, h: 36, a: k.a, s: k.s }); pill(m.X(5), 600, 'saturated', C.amber, { size: 20, h: 36, a: k.a, s: k.s }); }
  // curve
  plot(m, sig, [-6, 6], C.cyan, E.io(pr(t, s.lines[0].start + .3, s.lines[0].end + .3)), { lw: 6, glow: 22 });
  // derivative curve
  const da = E.out(pr(t, P.tSlope, P.tSlope + .6)); if (da > 0) { plot(m, dsig, [-6, 6], C.red, E.io(pr(t, P.tSlope, P.tSlope + .8)), { lw: 3.5, dash: [10, 8], glow: 8, a: da }); txt('σ′(x) · max 0.25', m.X(0.5), m.Y(.30), { size: 22, font: F.m, weight: 700, color: C.red, a: da }); }
  // probe dot
  if (t >= P.t0 - .1) {
    const xv = P.xv(t), yv = sig(xv), px = m.X(xv), py = m.Y(yv), k = pop(t, P.t0 - .1, .4);
    seg(px, py, px, 1040, rgba(C.text, .45), k.a, 2, [6, 7]); seg(160, py, px, py, rgba(C.text, .45), k.a, 2, [6, 7]);
    circ(px, py, 15 * k.s, t >= P.tVan ? C.red : C.green, k.a, 26); circ(px, py, 6, '#FFFFFF', k.a);
    const lab = P.label(t), ch = P.lastT(t), b = 1 + (1 - pr(t, ch, ch + .3)) * .15;
    g.save(); g.translate(540, 1250); g.scale(b * k.s, b * k.s); pill(0, 0, lab, t >= P.tVan ? C.red : C.green, { size: 38, h: 82, padX: 40, a: k.a, solid: false, glow: 18, font: F.d, weight: 900 }); g.restore();
  }
  // vanishing slope: tangent at x=5
  const tg = pop(t, P.tVan, .45);
  if (tg.a > 0) { const xv = 5.2, y0 = sig(xv), sl = dsig(xv), x0 = 3.6, x1 = 6; seg(m.X(x0), m.Y(y0 + sl * (x0 - xv)), m.X(x1), m.Y(y0 + sl * (x1 - xv)), C.red, tg.a, 4); }
  if (t >= P.tVan) tint(C.red, .1 * pr(t, P.tVan, P.tVan + .4));
};
SCN.how.init = s => {
  const P = { t0: cueT(s, [1, 'zero', -.1]), tHalf: cueT(s, [1, 'one half', -.1]), t2: cueT(s, [2, null, 0]), t88: cueT(s, [2, '0.88', -.1]), tm2: cueT(s, [3, null, 0]), t12: cueT(s, [3, '0.12', -.1]),
    tFlat: cueT(s, [4, 'flattens', -.1]), tSat: cueT(s, [4, 'saturates', -.1]), tSlope: cueT(s, [5, 'slope', -.15]), tVan: cueT(s, [5, 'vanish', -.15]) };
  const key = [[P.t0 - .1, 0], [P.t2, 2], [P.tm2, -2], [P.tFlat + .1, 5.2]];
  P.xv = t => { let v = 0; for (let i = 0; i < key.length; i++) { if (t >= key[i][0]) { const nx = key[i + 1]; v = key[i][1]; if (i > 0) { const u = E.io(pr(t, key[i][0], key[i][0] + .7)); v = lerp(key[i - 1][1], key[i][1], u); } } } return v; };
  const labs = [[P.t0 - .1, 'σ(0) = 0.50'], [P.t88, 'σ(2) ≈ 0.88'], [P.t12, 'σ(−2) ≈ 0.12'], [P.tFlat + .6, 'σ(5.2) ≈ 0.99'], [P.tVan, 'slope ≈ 0.005 · gradients vanish']];
  P.label = t => { let r = labs[0][1]; labs.forEach(x => { if (t >= x[0]) r = x[1]; }); return r; };
  P.lastT = t => { let r = labs[0][0]; labs.forEach(x => { if (t >= x[0]) r = x[0]; }); return r; };
  SCN.how.P = P;
  cue(s.start + .1, 'swish', .5); cue(s.lines[0].start + .3, 'riser', 3); cue(P.t0, 'pop', .6); cue(P.tHalf, 'ping', .6); cue(P.t2, 'swish', .35); cue(P.t88, 'ping', .6); cue(P.tm2, 'swish', .35); cue(P.t12, 'ping', .6);
  cue(P.tFlat, 'switch', .5); cue(P.tSat, 'thud', .6); cue(P.tSlope, 'blip', .5); cue(P.tVan, 'error', .8);
};

// =============== REAL-WORLD EXAMPLE ===============
const FEATS = [['unknown sender', '+1.2'], ['"FREE prize!!"', '+1.9'], ['3 links', '+0.6'], ['bias', '−1.2']];
SCN.example = (t, s) => {
  const P = SCN.example.P;
  // email card
  const ep = pop(t, s.start + .05, .5), fly = E.io(pr(t, P.tGo, P.tGo + .8));
  if (ep.a > 0) {
    g.save(); g.translate(300, 560); g.scale(ep.s, ep.s); g.globalAlpha *= ep.a; rr(-200, -170, 400, 340, 26); g.fillStyle = C.panel; g.fill(); g.lineWidth = 2.5; g.strokeStyle = rgba(C.cyan, .6); g.stroke();
    txt('EMAIL', -170, -128, { size: 22, font: F.m, weight: 700, ls: 4, color: C.dim }); glyph('doc', 150, -136, 26, C.cyan);
    FEATS.forEach(([f, w], i) => { const y = -64 + i * 66, on = t >= P.tFeat + i * .3, k = pop(t, P.tFeat + i * .3, .35); rr(-176, y - 26, 352, 52, 14); g.fillStyle = on ? rgba(i === 3 ? C.violet : C.amber, .16) : 'rgba(255,255,255,.04)'; g.fill();
      txt(f, -160, y + 9, { size: 24, weight: 700, color: on ? C.text : C.dim }); if (on) txt(w, 160, y + 9, { size: 24, font: F.m, weight: 700, align: 'right', color: i === 3 ? C.violet : C.amber, a: k.a }); });
    g.restore();
  }
  // sum node
  const sp = pop(t, P.tFeat + .2, .45);
  if (sp.a > 0) {
    FEATS.forEach((_, i) => { const y = 496 + i * 66, u = (t - P.tFeat - i * .3) / .5; arrow(504, y, 700, 560, rgba(C.amber, .45), E.out(pr(t, P.tFeat + i * .3, P.tFeat + i * .3 + .3)), sp.a, 2.5); if (u > 0 && u < 1) circ(lerp(504, 700, u), lerp(y, 560, u), 8, C.amber, 1, 14); });
    g.save(); g.translate(790, 560); g.scale(sp.s, sp.s); g.globalAlpha *= sp.a; circ(0, 0, 86, mix(C.panel, C.amber, .16)); ring(0, 0, 86, C.amber, 1, 3); txt('Σ', 0, -6, { size: 64, weight: 900, font: F.d, align: 'center', base: 'middle', color: C.amber }); txt('w·x + b', 0, 46, { size: 20, font: F.m, weight: 700, align: 'center', color: C.dim }); g.restore();
  }
  const sc = pop(t, P.tScore, .45); if (sc.a > 0) pill(790, 700, 'score = 2.5', C.amber, { size: 30, h: 60, a: sc.a, s: sc.s, solid: true, glow: 18 });
  // sigmoid box
  const sg = pop(t, P.tSig, .45);
  if (sg.a > 0) { qarrow([790, 734], [520, 735], [520, 790], rgba(C.amber, .8), E.out(pr(t, P.tSig - .1, P.tSig + .3)), sg.a, 3); sigBox(520, 860, 240, 110, sg.a, sg.s, 'σ(2.5)', C.cyan, .6); const u = (t - P.tSig + .1) / .45; if (u > 0 && u < 1) { const q = qp([790, 734], [520, 735], [520, 790], u); circ(q[0], q[1], 9, C.amber, 1, 16); } }
  const pp = pop(t, P.t92, .45); if (pp.a > 0) { arrow(646, 860, 720, 860, rgba(C.green, .8), E.out(pr(t, P.t92 - .1, P.t92 + .2)), pp.a, 3); g.save(); g.translate(840, 860); g.scale(pp.s, pp.s); txt('0.92', 0, 6, { size: 72, weight: 900, font: F.d, align: 'center', base: 'middle', color: C.green, a: pp.a, glow: 24 }); txt('P(spam)', 0, 62, { size: 20, font: F.m, weight: 700, align: 'center', color: C.dim, a: pp.a }); g.restore(); }
  // probability bar with threshold
  const ba = E.out(pr(t, P.t92 + .1, P.t92 + .5)), X = probBar(160, 920, 1060, ba, { ticks: [0, 1] });
  if (ba > 0) {
    const th = t >= P.tTh, tk = pop(t, P.tTh, .4), tx = X(.5); seg(tx, 1025, tx, 1095, th ? C.amber : 'rgba(255,181,46,.6)', ba, th ? 5 : 3); txt('threshold 0.5', tx, 1010, { size: 22, font: F.m, weight: 700, align: 'center', color: C.amber, a: ba * (th ? 1 : .6) }); if (th) ring(tx, 1060, 30 + tk.u * 40, C.amber, (1 - tk.u) * .8, 3);
    const mx = X(lerp(.5, .92, E.out(pr(t, P.t92 + .2, P.t92 + .8)))); circ(mx, 1060, 16, C.green, ba, 22); txt('0.92', mx, 1112, { size: 22, font: F.m, weight: 700, align: 'center', color: C.green, a: ba });
  }
  // folders
  const fa = pop(t, P.tTh + .2, .45);
  if (fa.a > 0) {
    [[320, 'INBOX', C.cyan, 'not spam  < 0.5'], [760, 'SPAM', C.red, 'spam  ≥ 0.5']].forEach(([x, lab, col, sub], i) => { const hot = i === 1 && fly >= 1; svc(x, 1240, 300, 96, { label: lab, sub, subSize: 18, size: 32, col, a: fa.a * (i === 0 && fly >= 1 ? .5 : 1), s: fa.s * (hot ? 1 + (1 - pr(t, P.tGo + .8, P.tGo + 1.2)) * .1 : 1), glow: hot ? 1 : .35 }); });
    if (fly > 0 && fly < 1) { const x = lerp(840, 760, fly), y = lerp(1060, 1190, fly) - Math.sin(fly * Math.PI) * 60; g.save(); g.translate(x, y); g.scale(1 - fly * .4, 1 - fly * .4); glyph('doc', 0, 0, 40, C.text); g.restore(); }
  }
};
SCN.example.init = s => {
  const P = { tFeat: cueT(s, [1, 'features', -.2]), tScore: cueT(s, [1, '2.5', -.1]), tSig: cueT(s, [2, 'sigmoid', -.05]), t92: cueT(s, [2, '92', -.1]), tTh: cueT(s, [3, 'threshold', -.1]), tGo: cueT(s, [3, 'goes to spam', -.1]) }; SCN.example.P = P;
  cue(s.start + .05, 'pop', .6); FEATS.forEach((_, i) => cue(P.tFeat + i * .3, 'tick', .4)); cue(P.tScore, 'confirm', .6); cue(P.tSig, 'whoosh', .4); cue(P.tSig + .1, 'switch', .5); cue(P.t92, 'ping', .7); cue(P.tTh, 'blip', .6); cue(P.tGo, 'whoosh', .5); cue(P.tGo + .8, 'impact', .6);
};

// =============== BEFORE vs AFTER ===============
SCN.compare = compareScene({
  left: { head: 'WITHOUT', sub: 'sigmoid', col: C.red, steps: [['Raw score 2.5', [0, null, .05]], ['No upper bound', [0, 'raw', -.05]], ['Or −12, or 42', [0, 'scores', -.05]], ['No fixed threshold', [0, "can't", -.1]], ['NOT A PROBABILITY', [0, 'probabilities', -.1]]] },
  right: { head: 'WITH', sub: 'sigmoid', col: C.green, good: true, steps: [['Raw score 2.5', [1, null, .05]], ['Apply σ(x)', [1, 'sigmoid', -.05]], ['p = 0.92', [1, 'clean', -.1]], ['Bounded 0 to 1', [1, 'between', -.1]], ['PROBABILITY', [1, 'one', -.05]]] },
  swapAt: [1, null, 0]
});

// =============== TAKEAWAYS ===============
SCN.takeaways = takeawaysScene({
  title: [['Remember ', C.text], ['3', C.cyan], [' things', C.text]],
  cards: [
    { title: 'Binary output layer', sub: 'trained with binary cross-entropy', col: C.cyan, at: [1, null, -.1] },
    { title: 'Multi-class → softmax', sub: 'multi-label: one sigmoid per label', col: C.violet, at: [2, null, -.1] },
    { title: 'Hidden layers → ReLU', sub: 'saturation → vanishing gradients', col: C.amber, at: [3, null, -.1] }
  ],
  note: { segs: [['σ′(x) = ', C.dim], ['σ(x) · (1 − σ(x))', C.cyan]], at: [3, '$end', -.6] },
  mono: { text: 'σ(0) = 0.5  ·  range (0, 1)  ·  σ(−x) = 1 − σ(x)', at: [3, '$end', -.3] }
});

// =============== SUMMARY ===============
SCN.summary = summaryScene({
  label: 'SIGMOID  =',
  rows: [{ text: 'Any number in,', at: [0, 'any', -.05] }, { text: 'a probability out,', col: C.green, at: [0, 'probability', -.05] }, { text: 'between 0 and 1.', col: C.cyan, at: [0, 'between', -.05] }],
  icon: (t, s) => {
    const a = pop(t, s.start + .1, .5); if (a.a <= 0) return; g.save(); g.globalAlpha *= a.a;
    const m = { X: v => 540 + v * 30, Y: v => 590 - v * 130 };
    seg(360, 590, 720, 590, 'rgba(175,195,255,.4)', 1, 2); seg(360, 460, 720, 460, 'rgba(175,195,255,.18)', 1, 2, [5, 7]);
    plot(m, sig, [-6, 6], C.cyan, E.io(pr(t, s.start + .1, s.start + 1.1)), { lw: 6, glow: 20 });
    txt('0', 340, 598, { size: 22, font: F.m, weight: 700, align: 'right', color: C.dim }); txt('1', 340, 468, { size: 22, font: F.m, weight: 700, align: 'right', color: C.dim });
    g.restore();
  }
});

// =============== CTA ===============
SCN.cta = ctaScene({ big: 'AI Concepts', bigPhrase: 'ai concepts', sub: 'explained visually', subPhrase: 'explained' });
