'use strict';
// Overfitting vs Underfitting — scene code. Uses engine/core.js + engine/lib.js.
// Toy dataset used throughout: true pattern f(x) = 5 + 2.4 sin(0.62x − 0.9) on x in [0,10], plus noise.
//   overfit  = natural cubic spline through every training point (memorises the noise)
//   underfit = least-squares straight line (too simple)
//   good fit = the smooth true pattern
const TRUE = x => 5 + 2.4 * Math.sin(0.62 * x - 0.9);
const NOISE = [1.3, 1.2, -1.3, -1.1, 1.3, 1.2, -1.2, -1.3, 1.1, 1.3, -1.0];
const TRX = NOISE.map((_, i) => 0.5 + 0.9 * i), TRY = TRX.map((x, i) => TRUE(x) + NOISE[i]);
// unseen points: between training x's, with their own (small) noise
const TEST = [[0.95, -.15], [1.85, .2], [2.75, .15], [4.55, -.2], [5.45, .15], [6.35, .2], [8.15, -.15]].map(([x, n]) => ({ x, y: TRUE(x) + n }));
function spline(xs, ys) {
  const n = xs.length, h = [], al = [0], l = [1], mu = [0], z = [0], c = Array(n).fill(0), b = [], d = [];
  for (let i = 0; i < n - 1; i++) h.push(xs[i + 1] - xs[i]);
  for (let i = 1; i < n - 1; i++) al.push(3 / h[i] * (ys[i + 1] - ys[i]) - 3 / h[i - 1] * (ys[i] - ys[i - 1]));
  for (let i = 1; i < n - 1; i++) { l[i] = 2 * (xs[i + 1] - xs[i - 1]) - h[i - 1] * mu[i - 1]; mu[i] = h[i] / l[i]; z[i] = (al[i] - h[i - 1] * z[i - 1]) / l[i]; }
  for (let j = n - 2; j >= 0; j--) { c[j] = (z[j] || 0) - (mu[j] || 0) * c[j + 1]; b[j] = (ys[j + 1] - ys[j]) / h[j] - h[j] * (c[j + 1] + 2 * c[j]) / 3; d[j] = (c[j + 1] - c[j]) / (3 * h[j]); }
  return x => { let i = 0; while (i < n - 2 && x > xs[i + 1]) i++; const dx = x - xs[i]; return ys[i] + b[i] * dx + c[i] * dx * dx + d[i] * dx * dx * dx; };
}
const OVER = spline(TRX, TRY);
const LINE = (() => { const n = TRX.length, mx = TRX.reduce((a, b) => a + b) / n, my = TRY.reduce((a, b) => a + b) / n; let sxy = 0, sxx = 0; TRX.forEach((x, i) => { sxy += (x - mx) * (TRY[i] - my); sxx += (x - mx) ** 2; }); const m = sxy / sxx, b = my - m * mx; return x => m * x + b; })();
const mse = (fn, pts) => pts.reduce((a, p) => a + (fn(p.x) - p.y) ** 2, 0) / pts.length;
const TRP = TRX.map((x, i) => ({ x, y: TRY[i] }));
const ERR = { overTrain: mse(OVER, TRP), overTest: mse(OVER, TEST), lineTrain: mse(LINE, TRP), lineTest: mse(LINE, TEST) };
// model at a given complexity c in [0,10]: line -> true pattern (c = 4.4) -> spline
const SWEET = 4.4;
const fitAt = c => x => c <= SWEET ? lerp(LINE(x), TRUE(x), E.io(c / SWEET)) : lerp(TRUE(x), OVER(x), E.io((c - SWEET) / (10 - SWEET)));

// draw a curve into a clip rect
function curveIn(m, fn, xr, col, p, o = {}) { g.save(); g.beginPath(); g.rect(m.x - 4, m.y - 4, m.w + 8, m.h + 8); g.clip(); plot(m, fn, xr, col, p, o); g.restore(); }
// a small framed scatter-plot panel; returns mapper
function miniPanel(x, y, w, h, col, a) {
  panel(x, y, w, h, { a, stroke: rgba(col, .55), r: 22 });
  return { X: v => x + 16 + v / 10 * (w - 32), Y: v => y + h - 14 - v / 10 * (h - 28), x: x + 8, y: y + 8, w: w - 16, h: h - 16 };
}
function dots(m, pts, col, a = 1, r = 8, glow = 10) { pts.forEach(p => circ(m.X(p.x), m.Y(p.y), r, col, a, glow)); }
// a row of legend pills laid out left-to-right from x0; each item [label, col, alpha, scale]
function legend(items, x0, y, size = 22) {
  let x = x0; items.forEach(([lab, col, a, s]) => { const w = tw(lab, { size, weight: 700, font: F.m, ls: 1 }) + 40; if (a > 0) pill(x + w / 2, y, lab, col, { size, h: 44, w, a, s }); x += w + 14; });
}

// =============== HOOK ===============
SCN.hook = (t, s) => {
  const P = SCN.hook.P;
  let u = pr(t, P.tAce - .1, P.tAce + .2);
  if (u > 0) { g.save(); g.translate(540, 440); const k = lerp(1.5, 1, E.expo(u)); g.scale(k, k); txt('ACE TRAINING,', 0, 0, { size: 96, weight: 900, font: F.d, align: 'center', color: C.green, a: E.out(u), glow: 26 }); g.restore(); }
  u = pr(t, P.tFail - .1, P.tFail + .2);
  if (u > 0) { g.save(); g.translate(540, 552); const k = lerp(1.5, 1, E.expo(u)); g.scale(k, k); const o = { size: 84, weight: 900, font: F.d, align: 'center', color: C.red, a: E.out(u), glow: 26 }; o.size = fit('FAIL ON NEW DATA?', 900, o); txt('FAIL ON NEW DATA?', 0, 0, o); g.restore(); }
  // two panels: same wiggly model, training points vs new points
  [[108, 'TRAINING', C.green, P.tAce, 99, false], [530, 'NEW DATA', C.red, P.tFail, 62, true]].forEach(([x, lab, col, t0, pct, test]) => {
    const p = pop(t, t0, .5); if (p.a <= 0) return; const w = 392;
    g.save(); g.translate(x + w / 2, 900); g.scale(p.s, p.s); g.translate(-(x + w / 2), -900); g.globalAlpha *= p.a;
    const m = miniPanel(x, 660, w, 300, col, 1);
    txt(lab, x + 4, 642, { size: 24, font: F.m, weight: 700, ls: 3, color: col });
    curveIn(m, OVER, [.5, 9.5], C.amber, E.io(pr(t, t0 + .1, t0 + .8)), { lw: 4, glow: 12 });
    if (!test) dots(m, TRP, C.cyan, 1, 8);
    else { const k = E.out(pr(t, t0 + .5, t0 + .9)); TEST.forEach(q => { seg(m.X(q.x), m.Y(q.y), m.X(q.x), m.Y(OVER(q.x)), C.red, k * .9, 3); circ(m.X(q.x), m.Y(q.y), 8, C.violet, k, 10); }); }
    const n = Math.round(lerp(0, pct, E.out(pr(t, t0 + .2, t0 + 1.1))));
    txt('accuracy', x + w / 2, 1020, { size: 24, font: F.m, weight: 700, ls: 2, align: 'center', color: C.dim });
    txt(n + '%', x + w / 2, 1120, { size: 100, weight: 900, font: F.d, align: 'center', color: col, glow: 24 });
    const ck = pr(t, t0 + 1.1, t0 + 1.4); if (ck > 0) { if (test) cross(x + w / 2, 1190, 16, C.red, E.out(ck), 6); else check(x + w / 2 + 8, 1190, 18, C.green, 1, 6, ck); }
    g.restore();
  });
  const mp = pop(t, P.tMem - .05, .45); if (mp.a > 0) pill(540, 1300, 'MEMORIZED  ≠  LEARNED', C.red, { size: 40, h: 84, padX: 40, solid: true, glow: 30, a: mp.a, s: mp.s, font: F.d, weight: 900 });
  tint(C.red, .12 * pr(t, P.tFail + .6, P.tFail + 1.2) * (1 - pr(t, s.end - .6, s.end)));
};
SCN.hook.init = s => {
  const P = { tAce: cueT(s, [0, 'ace', -.1]), tFail: cueT(s, [0, 'fail', -.1]), tMem: cueT(s, [1, 'memorized', -.05]) }; SCN.hook.P = P;
  cue(P.tAce, 'thud', .8); cue(P.tAce + 1.1, 'confirm', .5); cue(P.tFail, 'impact', .9); cue(P.tFail + .6, 'error', .6); cue(P.tMem, 'thud', .9);
};

// =============== PROBLEM ===============
SCN.problem = (t, s) => {
  const P = SCN.problem.P, aa = E.out(pr(t, s.start + .05, s.start + .5));
  const m = axes(150, 450, 780, 640, { xr: [0, 10], yr: [0, 10], xLabel: 'input x', yLabel: 'target y', a: aa });
  // true pattern (revealed with the noise line)
  const tp = E.out(pr(t, P.tNoise - .1, P.tNoise + .5));
  if (tp > 0) curveIn(m, TRUE, [0, 10], C.green, 1, { lw: 4, dash: [12, 10], glow: 8, a: tp * .85 });
  // noise ticks: training point to true pattern
  if (tp > 0 && t < P.tNew + .4) TRP.forEach(q => seg(m.X(q.x), m.Y(q.y), m.X(q.x), m.Y(TRUE(q.x)), C.amber, tp * .8 * (1 - pr(t, P.tNew, P.tNew + .4)), 3, [4, 5]));
  // model through every point
  const mp = E.io(pr(t, P.tFit, P.tFit + 1.4));
  curveIn(m, OVER, [.5, 9.5], C.amber, mp, { lw: 5, glow: 16 });
  // training points
  TRP.forEach((q, i) => { const p = pop(t, P.tTrain + i * .07, .35); if (p.a <= 0) return; const hit = mp >= (q.x - .5) / 9; circ(m.X(q.x), m.Y(q.y), 11 * p.s, C.cyan, p.a, hit ? 22 : 10); if (hit && t < P.tNoise) ring(m.X(q.x), m.Y(q.y), 19, C.green, .8, 2.5); });
  // new points + their errors
  const ne = E.out(pr(t, P.tOff - .1, P.tOff + .4));
  TEST.forEach((q, i) => { const p = pop(t, P.tNew + i * .06, .35); if (p.a <= 0) return; if (ne > 0) seg(m.X(q.x), m.Y(q.y), m.X(q.x), m.Y(OVER(q.x)), C.red, ne, 4); circ(m.X(q.x), m.Y(q.y), 11 * p.s, C.violet, p.a, 14); });
  legend([['training data', C.cyan, pop(t, P.tTrain, .4).a, pop(t, P.tTrain, .4).s], ['model', C.amber, pop(t, P.tFit, .4).a, pop(t, P.tFit, .4).s], ['true pattern', C.green, pop(t, P.tNoise, .4).a, pop(t, P.tNoise, .4).s], ['new data', C.violet, pop(t, P.tNew, .4).a, pop(t, P.tNew, .4).s]], 112, 372);
  // readouts
  const ra = pop(t, P.tFit + 1.2, .45);
  if (ra.a > 0) {
    g.save(); g.globalAlpha *= ra.a; panel(110, 1190, 400, 120, { stroke: rgba(C.green, .5) });
    txt('TRAIN ERROR', 140, 1232, { size: 22, font: F.m, weight: 700, ls: 3, color: C.dim }); txt(ERR.overTrain.toFixed(2), 140, 1290, { size: 46, weight: 900, font: F.d, color: C.green }); g.restore();
    const ck = pr(t, P.tFit + 1.3, P.tFit + 1.6); if (ck > 0) check(450, 1250, 16, C.green, ra.a, 5, ck);
  }
  const rb = pop(t, P.tOff, .45);
  if (rb.a > 0) {
    g.save(); g.translate(745, 1250); g.scale(rb.s, rb.s); g.translate(-745, -1250); g.globalAlpha *= rb.a; panel(550, 1190, 390, 120, { stroke: rgba(C.red, .7), fill: mix(C.panel, C.red, .12) });
    txt('NEW-DATA ERROR', 580, 1232, { size: 22, font: F.m, weight: 700, ls: 3, color: C.dim }); txt(ERR.overTest.toFixed(2), 580, 1290, { size: 46, weight: 900, font: F.d, color: C.red }); cross(890, 1250, 13, C.red, 1, 5); g.restore();
  }
  tint(C.red, .1 * pr(t, P.tOff, P.tOff + .4));
};
SCN.problem.init = s => {
  const P = { tTrain: cueT(s, [0, 'examples', -.2]), tNever: cueT(s, [0, 'never', -.1]), tFit: cueT(s, [1, 'passes', -.1]), tNoise: cueT(s, [2, 'noise', -.15]), tNew: cueT(s, [3, 'new points', -.15]), tOff: cueT(s, [3, 'way off', -.15]) };
  SCN.problem.P = P;
  [0, 3, 6, 9].forEach(i => cue(P.tTrain + i * .07, 'pop', .3)); cue(P.tFit, 'swish', .5); cue(P.tFit + 1.2, 'confirm', .5); cue(P.tNoise, 'blip', .5); cue(P.tNew, 'pop', .5); cue(P.tOff, 'error', .8);
};

// =============== DEFINITION ===============
// three side-by-side fits: underfit | good fit | overfit
const DEFP = [{ x: 108, head: 'UNDERFIT', tag: 'too simple', col: C.amber, fn: LINE, xr: [0, 10] }, { x: 386, head: 'GOOD FIT', tag: 'the pattern', col: C.green, fn: TRUE, xr: [0, 10] }, { x: 664, head: 'OVERFIT', tag: 'the noise', col: C.red, fn: OVER, xr: [.5, 9.5] }];
SCN.definition = (t, s) => {
  const P = SCN.definition.P;
  // title cycles: Overfitting -> Underfitting -> Good fit
  const titles = [['Overfitting', C.red, P.tOver, P.tUnder], ['Underfitting', C.amber, P.tUnder, P.tGood], ['Just right', C.green, P.tGood, 1e9]];
  titles.forEach(([w, col, t0, t1]) => {
    const u = pr(t, t0 - .1, t0 + .25), o = 1 - pr(t, t1 - .25, t1 - .05); if (u <= 0 || o <= 0) return;
    g.save(); g.translate(540, 470); const k = lerp(1.4, 1, E.expo(u)); g.scale(k, k); txt(w, 0, 0, { size: 116, weight: 900, font: F.d, align: 'center', color: col, a: E.out(u) * o, glow: 30 }); g.restore();
  });
  const order = [P.tUnder + .2, P.tGood, P.tOver + .2];
  DEFP.forEach((d, i) => {
    const p = pop(t, order[i], .5); if (p.a <= 0) return; const w = 258, act = i === 0 ? (t >= P.tUnder && t < P.tGood ? 1 : .55) : i === 1 ? (t >= P.tGood ? 1 : .55) : (t < P.tUnder ? 1 : .55), foc = t >= P.tGood ? (i === 1 ? 1 : .5) : act;
    g.save(); g.translate(d.x + w / 2, 820); g.scale(p.s, p.s); g.translate(-(d.x + w / 2), -820); g.globalAlpha *= p.a * lerp(.45, 1, foc);
    const m = miniPanel(d.x, 640, w, 360, d.col, 1);
    dots(m, TRP, C.cyan, 1, 6, 6);
    curveIn(m, d.fn, d.xr, d.col, E.io(pr(t, order[i] + .1, order[i] + .9)), { lw: 4, glow: 12 });
    txt(d.head, d.x + w / 2, 1060, { size: 34, weight: 900, font: F.d, ls: 2, align: 'center', color: d.col });
    txt(d.tag, d.x + w / 2, 1100, { size: 24, font: F.m, weight: 700, align: 'center', color: C.dim });
    g.restore();
  });
  // complexity spectrum
  const sa = E.out(pr(t, P.tUnder + .4, P.tUnder + .9));
  if (sa > 0) {
    g.save(); g.globalAlpha *= sa; const x0 = 140, x1 = 890, y = 1200, gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, C.amber); gr.addColorStop(.5, C.green); gr.addColorStop(1, C.red);
    rr(x0, y - 7, x1 - x0, 14, 7); g.fillStyle = gr; g.fill();
    txt('too simple', x0, y + 48, { size: 24, font: F.m, weight: 700, color: C.amber }); txt('too complex', x1, y + 48, { size: 24, font: F.m, weight: 700, align: 'right', color: C.red }); txt('MODEL COMPLEXITY', 515, y - 26, { size: 22, font: F.m, weight: 700, ls: 4, align: 'center', color: C.dim });
    const tgt = t >= P.tGood ? .5 : t >= P.tUnder ? .08 : .92, prev = t >= P.tGood ? .08 : .92, mv = t >= P.tGood ? E.io(pr(t, P.tGood, P.tGood + .6)) : 1, xx = lerp(x0, x1, lerp(prev, tgt, mv));
    circ(xx, y, 20, '#FFFFFF', 1, 24); circ(xx, y, 9, t >= P.tGood ? C.green : C.amber, 1);
    g.restore();
  }
};
SCN.definition.init = s => {
  const P = { tOver: cueT(s, [0, 'overfitting', -.1]), tUnder: cueT(s, [1, 'underfitting', -.1]), tGood: cueT(s, [2, 'in between', -.3]) }; SCN.definition.P = P;
  cue(P.tOver, 'thud', .8); cue(P.tOver + .2, 'pop', .5); cue(P.tUnder, 'thud', .7); cue(P.tUnder + .2, 'pop', .5); cue(P.tGood, 'chime', .7); cue(P.tGood + .1, 'positive', .5);
};

// =============== HOW IT WORKS ===============
const TRE = c => 1 + 7.5 * Math.exp(-.35 * c), VAE = c => 1.9 + 7 * Math.exp(-.35 * c) + .06 * c * c;
SCN.how = (t, s) => {
  const P = SCN.how.P, aa = E.out(pr(t, s.start + .05, s.start + .5));
  const m = axes(170, 600, 760, 500, { xr: [0, 10], yr: [0, 10], xLabel: 'model complexity →', yLabel: 'error', a: aa });
  // zones
  const za = E.out(pr(t, P.tLeft - .1, P.tLeft + .4)), zb = E.out(pr(t, P.tRight - .1, P.tRight + .4));
  if (za > 0) { g.save(); g.globalAlpha *= za * (t >= P.tSweet ? .5 : 1); g.fillStyle = rgba(C.amber, .16); g.fillRect(m.X(0), m.y, m.X(2.6) - m.X(0), m.h); g.restore(); const p = pop(t, P.tUnderW, .4); pill(m.X(1.5) + 40, 1222, 'UNDERFIT · high bias', C.amber, { size: 22, h: 46, a: p.a, s: p.s }); }
  if (zb > 0) { g.save(); g.globalAlpha *= zb * (t >= P.tSweet ? .5 : 1); g.fillStyle = rgba(C.red, .14); g.fillRect(m.X(7), m.y, m.X(10) - m.X(7), m.h); g.restore(); const p = pop(t, P.tOverW, .4); pill(m.X(8.5) - 30, 1222, 'OVERFIT · high variance', C.red, { size: 22, h: 46, a: p.a, s: p.s }); }
  // curves
  curveIn(m, TRE, [0, 10], C.cyan, E.io(pr(t, P.tTrain, P.tTrain + 2)), { lw: 6, glow: 18 });
  curveIn(m, VAE, [0, 10], C.violet, E.io(pr(t, P.tVal, P.tVal + 2.2)), { lw: 6, glow: 18 });
  const l1 = pop(t, P.tTrain + 1.6, .4); if (l1.a > 0) pill(m.X(9.1), m.Y(TRE(10)) - 36, 'training', C.cyan, { size: 22, h: 42, a: l1.a, s: l1.s });
  const l2 = pop(t, P.tVal + 1.8, .4); if (l2.a > 0) pill(m.X(8.4), m.Y(VAE(10)) + 6, 'validation', C.violet, { size: 22, h: 42, a: l2.a, s: l2.s });
  // gap arrow on the right
  const gp = E.out(pr(t, P.tGap - .1, P.tGap + .4));
  if (gp > 0) { const x = m.X(8.6), ya = m.Y(TRE(8.6)) - 8, yb = m.Y(VAE(8.6)) + 8, mid = (ya + yb) / 2; arrow(x, mid, x, lerp(mid, yb, gp), C.red, 1, gp, 4); arrow(x, mid, x, lerp(mid, ya, gp), C.red, 1, gp, 4); txt('gap', x - 18, mid + 8, { size: 28, weight: 800, font: F.d, align: 'right', color: C.red, a: gp }); }
  // sweet spot
  const sp = pop(t, P.tSweet, .5);
  if (sp.a > 0) { const x = m.X(SWEET); seg(x, m.y + 30, x, m.y + m.h, C.green, sp.a, 3, [10, 8]); circ(x, m.Y(VAE(SWEET)), 13, C.green, sp.a, 26); pill(x, m.y + 4, 'SWEET SPOT', C.green, { size: 26, h: 52, solid: true, glow: 20, a: sp.a, s: sp.s }); }
  // complexity cursor + live model thumbnail
  const c = P.cur(t), ca = E.out(pr(t, P.tTrain - .2, P.tTrain + .3));
  if (ca > 0) {
    g.save(); g.globalAlpha *= ca;
    seg(m.X(c), m.y, m.X(c), m.y + m.h, 'rgba(255,255,255,.35)', 1, 2);
    circ(m.X(c), m.Y(TRE(c)), 9, C.cyan, pr(t, P.tTrain, P.tTrain + .3), 12);
    if (t >= P.tVal) circ(m.X(c), m.Y(VAE(c)), 9, C.violet, pr(t, P.tVal, P.tVal + .3), 12);
    const col = c < 2.6 ? C.amber : c > 7 ? C.red : C.green, tm = miniPanel(110, 340, 360, 200, col, 1);
    dots(tm, TRP, C.cyan, 1, 5, 4); curveIn(tm, fitAt(c), [.5, 9.5], col, 1, { lw: 3.5, glow: 10 });
    txt('TRAIN', 520, 392, { size: 22, font: F.m, weight: 700, ls: 3, color: C.dim }); txt(TRE(c).toFixed(1), 520, 450, { size: 50, weight: 900, font: F.d, color: C.cyan });
    if (t >= P.tVal) { const k = pr(t, P.tVal, P.tVal + .3); txt('VALIDATION', 700, 392, { size: 22, font: F.m, weight: 700, ls: 3, color: C.dim, a: k }); txt(VAE(c).toFixed(1), 700, 450, { size: 50, weight: 900, font: F.d, color: C.violet, a: k }); }
    txt('complexity ' + c.toFixed(1), 520, 516, { size: 22, font: F.m, weight: 400, color: C.dim });
    g.restore();
  }
};
SCN.how.init = s => {
  const P = { tTrain: cueT(s, [1, null, -.05]), tVal: cueT(s, [2, null, -.05]), tLeft: cueT(s, [3, 'left', -.1]), tUnderW: cueT(s, [3, 'underfitting', -.1]), tRight: cueT(s, [4, 'right', -.1]), tGap: cueT(s, [4, 'gap', -.1]), tOverW: cueT(s, [4, 'overfitting', -.1]), tSweet: cueT(s, [5, 'sweet', -.1]) };
  // complexity cursor keyframes [time, c]
  const K = [[P.tTrain, 0], [P.tTrain + 2, 10], [P.tVal, 0], [P.tVal + 2.2, 10], [P.tLeft, 10], [P.tLeft + .7, 1.2], [P.tRight, 1.2], [P.tRight + .8, 8.8], [P.tSweet, 8.8], [P.tSweet + .8, SWEET]];
  P.cur = t => { if (t <= K[0][0]) return 0; for (let i = 0; i < K.length - 1; i++) if (t < K[i + 1][0]) return lerp(K[i][1], K[i + 1][1], E.io(pr(t, K[i][0], K[i + 1][0]))); return SWEET; };
  // the cursor jumps from 10 back to 0 at tVal: make it a fast rewind
  K.splice(2, 0, [P.tVal - .3, 10]);
  SCN.how.P = P;
  cue(s.start + .1, 'swish', .4); cue(P.tTrain, 'riser', 1.8); cue(P.tVal - .3, 'swish', .4); cue(P.tVal + 1.4, 'error', .4); cue(P.tLeft, 'thud', .6); cue(P.tRight, 'thud', .6); cue(P.tGap, 'error', .6); cue(P.tSweet, 'chime', .7); cue(P.tSweet + .8, 'positive', .5);
};

// =============== REAL-WORLD EXAMPLE ===============
const TRL = e => .15 + .85 * Math.exp(-e / 7), VAL = e => .32 + .7 * Math.exp(-e / 5) + .00055 * e * e, BEST = 12;
SCN.example = (t, s) => {
  const P = SCN.example.P, aa = E.out(pr(t, s.start + .05, s.start + .5));
  // pipeline: payments -> model -> fraud? ok
  const pa = pop(t, s.start + .15, .5);
  if (pa.a > 0) {
    g.save(); g.globalAlpha *= pa.a;
    svc(240, 450, 250, 120, { label: 'Payments', icon: 'card', col: C.cyan, size: 30 });
    svc(560, 450, 230, 120, { label: 'Model', icon: 'brain', col: C.violet, size: 30 });
    arrow(368, 450, 440, 450, rgba(C.cyan, .7), 1, 1, 3); arrow(678, 450, 742, 450, rgba(C.violet, .7), 1, 1, 3);
    stream(t, 368, 450, 440, 450, s.start + .4, s.end - .5, .55, .35, C.cyan, { r: 7 });
    const flip = Math.floor((t - s.start) / .55) % 4 === 1; pill(850, 450, flip ? 'FRAUD' : 'OK', flip ? C.red : C.green, { size: 28, h: 60, w: 170 });
    g.restore();
  }
  const m = axes(170, 640, 760, 460, { xr: [0, 30], yr: [0, 1.2], ticksX: [0, 12, 30], xLabel: 'epoch', yLabel: 'loss', a: aa });
  // epoch progress
  const eT = 30 * E.io(pr(t, P.tTrain, P.tTrain + 2.2)), eV = 30 * E.io(pr(t, P.tVal, P.tVal + 2.6));
  if (eT > 0) plot(m, TRL, [0, 30], C.cyan, eT / 30, { lw: 6, glow: 16 });
  if (eV > 0) { plot(m, VAL, [0, Math.min(eV, BEST)], C.violet, 1, { lw: 6, glow: 16 }); if (eV > BEST) plot(m, VAL, [BEST, eV], C.red, 1, { lw: 6, glow: 16, a: t >= P.tStop ? .45 : 1 }); }
  const l1 = pop(t, P.tTrain + 1.8, .4); if (l1.a > 0) pill(m.X(26), m.Y(TRL(30)) + 40, 'training loss', C.cyan, { size: 22, h: 42, a: l1.a, s: l1.s });
  const l2 = pop(t, P.tVal + .6, .4); if (l2.a > 0) pill(m.X(19), m.Y(1.08), 'validation loss', C.violet, { size: 22, h: 42, a: l2.a, s: l2.s });
  const cl = pop(t, P.tClimb, .4); if (cl.a > 0) pill(m.X(20), m.Y(VAL(23)) - 84, 'climbing ↑ overfit', C.red, { size: 22, h: 42, a: cl.a * (t >= P.tStop ? .5 : 1), s: cl.s });
  // epoch readout
  const ep = Math.round(t < P.tVal ? eT : eV); if (eT > 0) { txt('epoch', 930, 610, { size: 22, font: F.m, weight: 700, align: 'right', color: C.dim, a: aa }); txt(String(ep).padStart(2, '0'), 930, 568, { size: 54, weight: 900, font: F.d, align: 'right', color: C.text, a: aa }); }
  // best epoch marker + early stopping
  const bm = pop(t, P.tTwelve, .45);
  if (bm.a > 0) { const x = m.X(BEST); seg(x, m.y + 10, x, m.y + m.h, C.green, bm.a, 3, [10, 8]); circ(x, m.Y(VAL(BEST)), 13, C.green, bm.a, 26); }
  const st = pop(t, P.tStop, .5);
  if (st.a > 0) {
    pill(540, 1200, '■  EARLY STOPPING', C.green, { size: 34, h: 72, padX: 34, solid: true, glow: 26, a: st.a, s: st.s, font: F.d, weight: 900 });
    const k = pop(t, P.tBest, .45); if (k.a > 0) txt(`checkpoint: epoch ${BEST}  ·  val loss ${VAL(BEST).toFixed(2)}`, 540, 1290, { size: 26, font: F.m, weight: 700, align: 'center', color: C.green, a: k.a });
  }
};
SCN.example.init = s => {
  const P = { tTrain: cueT(s, [1, 'training', -.2]), tVal: cueT(s, [2, null, -.05]), tClimb: cueT(s, [2, 'climbing', -.1]), tTwelve: cueT(s, [2, 'twelve', -.15]), tStop: cueT(s, [3, 'early', -.1]), tBest: cueT(s, [3, 'best', -.1]) };
  SCN.example.P = P;
  cue(s.start + .15, 'pop', .5); cue(P.tTrain, 'swish', .5); for (let k = 0; k < 6; k++) cue(P.tTrain + .2 + k * .35, 'tick', .3); cue(P.tVal, 'swish', .5); cue(P.tClimb, 'error', .6); cue(P.tTwelve, 'ping', .6); cue(P.tStop, 'switch', .8); cue(P.tBest, 'positive', .6);
};

// =============== BEFORE vs AFTER ===============
SCN.compare = compareScene({
  left: { head: 'OVERFIT', sub: 'memorizes the data', col: C.red, steps: [['Train accuracy 99%', [0, null, .05]], ['Learns the noise', [0, 'perfect', -.05]], ['Never validated', [0, 'in training', -.05]], ['Big train / val gap', [0, 'then', -.05]], ['FAILS IN PROD', [0, 'fails', -.05]]] },
  right: { head: 'WELL FIT', sub: 'learns the pattern', col: C.green, good: true, steps: [['Validation checks', [1, 'validated', -.1]], ['Regularized', [1, 'regularized', -.1]], ['Stopped early', [1, 'stopped', -.1]], ['Train ≈ validation', [1, 'so it', -.1]], ['GENERALIZES', [1, 'generalizes', -.1]]] },
  swapAt: [1, null, 0]
});

// =============== TAKEAWAYS ===============
SCN.takeaways = takeawaysScene({
  title: [['Remember ', C.text], ['3', C.cyan], [' things', C.text]],
  cards: [
    { title: 'Underfitting = high bias', sub: 'high error on train AND new data', col: C.amber, at: [1, null, -.1] },
    { title: 'Overfitting = high variance', sub: 'low train error · high validation error', col: C.red, at: [2, null, -.1] },
    { title: 'Fight overfitting', sub: 'more data · L1/L2 · dropout · early stopping', col: C.green, at: [3, null, -.1] }
  ],
  note: { segs: [['Underfit? ', C.amber], ['bigger model, more features, train longer', C.dim]], at: [3, '$end', -.8] },
  mono: { text: 'tune on validation  ·  report on test, once', at: [3, '$end', -.4] }
});

// =============== SUMMARY ===============
SCN.summary = summaryScene({
  label: 'A GOOD MODEL',
  glow: C.green,
  rows: [{ text: 'learns the pattern,', col: C.green, at: [0, 'learns', -.05] }, { text: 'not the noise.', col: C.red, at: [0, 'not the', -.05] }],
  icon: (t, s) => {
    const a = pop(t, s.start + .1, .5); if (a.a <= 0) return; g.save(); g.globalAlpha *= a.a;
    const m = { X: v => 300 + v * 48, Y: v => 640 - v * 26, x: 290, y: 360, w: 500, h: 290 };
    TRP.forEach(q => circ(m.X(q.x), m.Y(q.y), 8, C.cyan, 1, 8));
    curveIn(m, TRUE, [0, 10], C.green, E.io(pr(t, s.start + .2, s.start + 1.2)), { lw: 5, glow: 18 });
    g.restore();
  }
});

// =============== CTA ===============
SCN.cta = ctaScene({ big: 'AI Concepts', bigPhrase: 'ai concepts', sub: 'explained visually', subPhrase: 'explained' });
