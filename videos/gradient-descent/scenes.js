'use strict';
// Gradient Descent — scene code. Uses engine/core.js + engine/lib.js.
// Loss valley used throughout: L(w) = 0.5 (w - 4)^2 + 0.6, so dL/dw = w - 4, minimum at w = 4.
const LV = w => 0.5 * (w - 4) * (w - 4) + 0.6, dLV = w => w - 4;
// run gradient descent: returns [w0, w1, ...]
function gdPath(w0, eta, n, grad = dLV) { const ws = [w0]; for (let i = 0; i < n; i++) ws.push(ws[i] - eta * grad(ws[i])); return ws; }
// position of a ball hopping along a curve between successive points ws at times ts (each hop takes dur)
function hop(m, fn, ws, ts, t, dur = .32, arc = 46) {
  let i = 0; while (i + 1 < ts.length && t >= ts[i + 1]) i++;
  if (t < ts[0]) return { x: m.X(ws[0]), y: m.Y(fn(ws[0])), i: 0, w: ws[0] };
  const u = E.io(pr(t, ts[i], ts[i] + dur)), wa = ws[i], wb = ws[Math.min(i + 1, ws.length - 1)], w = lerp(wa, wb, u);
  const lift = Math.sin(u * Math.PI) * Math.min(arc, Math.abs(m.X(wb) - m.X(wa)) * .35);
  return { x: m.X(w), y: m.Y(fn(w)) - lift, i: u >= 1 ? i + 1 : i, w };
}
function ball(x, y, col, a = 1, r = 18) { circ(x, y - r, r, col, a, 28); circ(x - r * .3, y - r * 1.3, r * .32, '#FFFFFF', a * .85); }
// w_new = w_old − η · ∇L   (hl: which part glows 0 none, 1 eta, 2 grad)
function updateRule(cx, y, size, a = 1, o = {}) {
  const fo = { size, weight: 800, font: F.d }, parts = [['w', C.cyan], ['  ←  ', C.dim], ['w', C.cyan], ['  −  ', C.text], ['η', C.amber], [' · ', C.text], ['∇L', C.red]];
  const ws = parts.map(p => tw(p[0], fo)), tot = ws.reduce((s, v) => s + v, 0); let x = cx - tot / 2;
  parts.forEach((p, i) => { const glow = (o.hl === 1 && i === 4) || (o.hl === 2 && i === 6) ? 22 : 0; txt(p[0], x, y, { ...fo, color: p[1], a, glow }); x += ws[i]; });
  return tot;
}

// =============== HOOK ===============
SCN.hook = (t, s) => {
  const P = SCN.hook.P, z = lerp(1, 1.05, pr(t, s.start, s.end));
  g.save(); g.translate(540, 860); g.scale(z, z); g.translate(-540, -860);
  const ca = E.out(pr(t, s.start + .05, s.start + .7)), m = { X: w => 150 + (w + .3) / 8.6 * 780, Y: L => 1250 - L / 9.5 * 600 };
  // valley fill + curve
  if (ca > 0) {
    g.save(); g.globalAlpha *= ca * .5; g.beginPath(); for (let i = 0; i <= 80; i++) { const w = lerp(-.3, 8.3, i / 80); i ? g.lineTo(m.X(w), m.Y(LV(w))) : g.moveTo(m.X(w), m.Y(LV(w))); } g.lineTo(m.X(8.3), 1260); g.lineTo(m.X(-.3), 1260); g.closePath();
    const gr = g.createLinearGradient(0, 640, 0, 1260); gr.addColorStop(0, rgba(C.cyan, 0)); gr.addColorStop(1, rgba(C.cyan, .28)); g.fillStyle = gr; g.fill(); g.restore();
    plot(m, LV, [-.3, 8.3], C.cyan, E.io(pr(t, s.start + .05, s.start + .9)), { lw: 6, glow: 20 });
    txt('LOSS', 150, 604, { size: 22, font: F.m, weight: 700, ls: 4, color: C.dim, a: ca });
  }
  // footprints + ball
  const b = hop(m, LV, P.ws, P.ts, t, .3, 60);
  for (let k = 0; k < b.i; k++) circ(m.X(P.ws[k]), m.Y(LV(P.ws[k])) + 2, 6, C.amber, .7 * ca, 10);
  const bp = pop(t, s.start + .4, .45); ball(b.x, b.y, t >= P.ts[0] ? C.amber : C.red, bp.a * ca);
  if (b.i === P.ws.length - 1) { const k = pop(t, P.ts[P.ts.length - 1] + .3, .4); pill(m.X(4), m.Y(.6) + 60, 'minimum', C.green, { size: 22, h: 40, a: k.a, s: k.s }); }
  // loss readout
  const lv = LV(b.w), ra = pop(t, s.start + .5, .45);
  if (ra.a > 0) { g.save(); g.translate(700, 700); g.scale(ra.s, ra.s); g.globalAlpha *= ra.a; rr(-120, -58, 240, 116, 22); const col = lv > 3 ? C.red : lv > 1.2 ? C.amber : C.green; g.fillStyle = mix(C.panel, col, .14); g.fill(); g.lineWidth = 3; g.strokeStyle = col; g.stroke();
    txt('loss', 0, -20, { size: 20, font: F.m, weight: 700, ls: 3, align: 'center', color: C.dim }); txt(lv.toFixed(2), 0, 36, { size: 52, weight: 900, font: F.d, align: 'center', color: col }); g.restore(); }
  if (t >= P.ts[0]) { const k = Math.min(b.i, P.ws.length - 1); txt(`step ${k}`, 700, 800, { size: 24, font: F.m, weight: 700, align: 'center', color: C.amber, a: ra.a }); }
  g.restore();
  let a = slide(t, s.lines[0].start - .2, .45, 50); txt('HOW DOES AI', 540, 392 + a.y, { size: 70, weight: 800, font: F.d, ls: 2, align: 'center', a: a.a });
  const u = pr(t, P.tLearn - .1, P.tLearn + .22); if (u > 0) { g.save(); g.translate(540, 500); const k = lerp(1.6, 1, E.expo(u)); g.scale(k, k); txt('LEARN?', 0, 0, { size: 96, weight: 900, font: F.d, align: 'center', color: C.cyan, a: E.out(u), glow: 30 }); g.restore(); }
  const dp = pop(t, P.tDown - .05, .45); if (dp.a > 0) pill(540, 1330, '↓  WALK DOWNHILL', C.green, { size: 36, h: 76, padX: 36, solid: true, glow: 26, a: dp.a, s: dp.s, font: F.d, weight: 900 });
  if (t < P.ts[0]) tint(C.red, .1 * pr(t, s.start + .4, s.start + 1));
};
SCN.hook.init = s => {
  const P = { tLearn: cueT(s, [0, 'learn', -.05]), tDown: cueT(s, [1, 'downhill', -.1]) };
  P.ws = gdPath(.1, .38, 7); P.ts = P.ws.slice(0, -1).map((_, i) => P.tDown + .1 + i * .34); SCN.hook.P = P;
  cue(s.start + .4, 'pop', .5); cue(P.tLearn, 'thud', .8); cue(P.tDown, 'impact', .7); P.ts.forEach((x, i) => cue(x + .28, 'tick', .45 - i * .03)); cue(P.ts[P.ts.length - 1] + .3, 'chime', .6);
};

// =============== PROBLEM ===============
const NETL = [[200, [470, 590, 710]], [400, [440, 550, 660, 770]], [600, [590]]];
const WR = (() => { const r = rnd(11); return Array.from({ length: 16 }, () => (r() * 2 - 1)); })();
SCN.problem = (t, s) => {
  const P = SCN.problem.P;
  // network with random weights (edge colour/width = weight)
  const na = 1 - .65 * E.io(pr(t, P.tMil - .2, P.tMil + .5));
  g.save(); g.globalAlpha *= na;
  let e = 0;
  NETL.forEach(([x, ys], li) => ys.forEach((y, ni) => {
    const p = pop(t, s.start + .1 + li * .16 + ni * .04, .45); if (p.a <= 0) return;
    if (li) NETL[li - 1][1].forEach(y0 => { const wv = WR[e++ % WR.length] * Math.cos(t * 3 + e) * (t < P.tRand + .8 ? 1 : 0) + WR[e % WR.length] * (t >= P.tRand + .8 ? 1 : 0), col = wv >= 0 ? C.cyan : C.violet; seg(NETL[li - 1][0] + 22, y0, x - 22, y, rgba(col, .25 + .5 * Math.abs(wv)), p.a, 1 + 4 * Math.abs(wv)); });
    const out = li === 2; circ(x, y, (out ? 30 : 22) * p.s, mix(C.panel, out ? C.amber : C.cyan, .3), p.a); ring(x, y, (out ? 30 : 22) * p.s, out ? C.amber : C.cyan, p.a, 3);
  }));
  const rp = pop(t, P.tRand, .4); if (rp.a > 0) pill(300, 838, 'random weights', C.violet, { size: 22, h: 42, a: rp.a, s: rp.s });
  // prediction vs actual
  const wp = pop(t, P.tWrong, .45);
  if (wp.a > 0) {
    arrow(636, 590, 700, 590, rgba(C.amber, .8), E.out(pr(t, P.tWrong, P.tWrong + .3)), wp.a, 3);
    g.save(); g.translate(830, 590); g.scale(wp.s, wp.s); g.globalAlpha *= wp.a; rr(-120, -96, 240, 192, 24); g.fillStyle = mix(C.panel, C.red, .12); g.fill(); g.lineWidth = 3; g.strokeStyle = C.red; g.stroke();
    txt('predicted', 0, -56, { size: 20, font: F.m, weight: 700, align: 'center', color: C.dim }); txt('0.91', 0, -12, { size: 44, weight: 900, font: F.d, align: 'center', color: C.red });
    txt('actual', 0, 28, { size: 20, font: F.m, weight: 700, align: 'center', color: C.dim }); txt('0.20', 0, 72, { size: 44, weight: 900, font: F.d, align: 'center', color: C.green }); g.restore();
    const xk = pop(t, P.tWrong + .3, .35); if (xk.a > 0) pill(830, 718, '✕ wrong', C.red, { size: 22, h: 42, a: xk.a * wp.a, s: xk.s, solid: true });
  }
  g.restore();
  // loss gauge
  const la = pop(t, P.tLoss, .45);
  if (la.a > 0) {
    const y = 960; g.save(); g.globalAlpha *= la.a * lerp(1, .55, E.io(pr(t, P.tMil - .2, P.tMil + .5)));
    panel(150, y - 70, 780, 140, { stroke: rgba(C.amber, .6) });
    txt('LOSS', 190, y - 20, { size: 22, font: F.m, weight: 700, ls: 4, color: C.dim }); txt('(0.91 − 0.20)² ≈ 0.50', 190, y + 30, { size: 30, font: F.m, weight: 700, color: C.text, a: E.out(pr(t, P.tLoss + .2, P.tLoss + .6)) });
    const lb = pop(t, P.tLower, .4); if (lb.a > 0) pill(800, y, 'lower = better ↓', C.green, { size: 24, h: 50, a: lb.a, s: lb.s });
    g.restore();
  }
  // millions of weights: a grid of tiny weight cells
  const ga = E.out(pr(t, P.tMil - .1, P.tMil + .4));
  if (ga > 0) {
    const cols = 30, rows = 8, x0 = 150, y0 = 1080, cw = 26, n = Math.floor(cols * rows * E.out(pr(t, P.tMil - .1, P.tMil + 1.1)));
    for (let k = 0; k < n; k++) { const i = k % cols, j = Math.floor(k / cols), v = Math.sin(k * 12.9898) * 43758.5453 % 1, ask = t >= P.tWhich && (k * 7) % 11 === 0, col = ask ? C.amber : v > 0 ? C.cyan : C.violet;
      rr(x0 + i * cw, y0 + j * cw, cw - 6, cw - 6, 4); g.fillStyle = rgba(col, ask ? .9 : .2 + .5 * Math.abs(v)); g.fill(); }
    txt('× 1,000,000+ weights', 930, 1064, { size: 24, font: F.m, weight: 700, align: 'right', color: C.cyan, a: ga });
  }
  const wq = pop(t, P.tWhich, .45); if (wq.a > 0) pill(540, 1345, 'WHICH WAY?  ↑ or ↓', C.amber, { size: 34, h: 72, padX: 34, solid: true, glow: 26, a: wq.a, s: wq.s, font: F.d, weight: 900 });
  tint(C.red, .1 * pop(t, P.tWrong, .4).a * (1 - pr(t, P.tLoss, P.tLoss + .5)));
};
SCN.problem.init = s => {
  const P = { tRand: cueT(s, [0, 'random', -.1]), tWrong: cueT(s, [0, 'wrong', -.15]), tLoss: cueT(s, [1, 'the loss', -.1]), tLower: cueT(s, [1, 'lower', -.1]), tMil: cueT(s, [2, 'millions', -.1]), tWhich: cueT(s, [3, null, -.05]) };
  SCN.problem.P = P;
  [0, 1, 2].forEach(i => cue(s.start + .1 + i * .16, 'pop', .3)); cue(P.tRand, 'blip', .5); cue(P.tWrong, 'error', .7); cue(P.tLoss, 'thud', .6); cue(P.tLower, 'ping', .5); cue(P.tMil, 'riser', 1.2); cue(P.tWhich, 'impact', .7);
};

// =============== DEFINITION ===============
// three weights, each nudged downhill; loss bar falls each round
const DW = [{ w0: .15, tgt: .72, lab: 'w₁', col: C.cyan }, { w0: .85, tgt: .38, lab: 'w₂', col: C.violet }, { w0: .3, tgt: .6, lab: 'w₃', col: C.green }];
SCN.definition = (t, s) => {
  const P = SCN.definition.P, d = s.lines;
  let a = slide(t, d[0].start - .15, .4, 30); txt('THE FIX', 540, 372 + a.y, { size: 32, weight: 700, ls: 10, align: 'center', color: C.dim, a: a.a });
  const u = pr(t, P.tTitle, P.tTitle + .3); if (u > 0) { g.save(); g.translate(540, 490); const sc = lerp(1.45, 1, E.expo(u)); g.scale(sc, sc); const o = { size: 112, weight: 900, font: F.d, align: 'center', a: E.out(u), glow: 30, glowCol: rgba(C.cyan, .7) }; o.size = fit('Gradient Descent', 920, o); txt('Gradient Descent', 0, 0, o); g.restore(); }
  // rounds: how many nudges have happened by t (fractional)
  const round = P.rounds.reduce((acc, r) => acc + E.io(pr(t, r, r + .45)), 0), fr = k => 1 - Math.pow(.45, k);
  const sa = E.out(pr(t, P.tTitle + .3, P.tTitle + .8));
  DW.forEach((w, i) => {
    const y = 680 + i * 130, x0 = 150, x1 = 720, val = lerp(w.w0, w.tgt, fr(round)), px = lerp(x0, x1, val); if (sa <= 0) return;
    g.save(); g.globalAlpha *= sa; txt(w.lab, x0 - 10, y - 30, { size: 30, weight: 800, font: F.d, color: w.col });
    rr(x0, y - 6, x1 - x0, 12, 6); g.fillStyle = 'rgba(255,255,255,.08)'; g.fill(); seg(lerp(x0, x1, w.tgt), y - 22, lerp(x0, x1, w.tgt), y + 22, rgba(C.green, .5), 1, 2, [4, 5]);
    circ(px, y, 20, w.col, 1, 22); circ(px, y, 8, '#FFFFFF', .9);
    // nudge arrow showing the direction of the next move (−gradient)
    const nextR = P.rounds.find(r => r > t - .45), dir = Math.sign(w.tgt - val);
    if (nextR && t > nextR - .5 && Math.abs(w.tgt - val) > .01) { const k = E.out(pr(t, nextR - .5, nextR)); arrow(px + dir * 30, y - 40, px + dir * 100, y - 40, C.amber, k, k, 4); }
    g.restore();
  });
  // loss bar
  if (sa > 0) {
    const lv = lerp(1, .12, fr(round)), y0 = 1000, h = 380, x = 840; g.save(); g.globalAlpha *= sa;
    txt('LOSS', x + 30, y0 - h - 22, { size: 22, font: F.m, weight: 700, ls: 4, align: 'center', color: C.dim });
    rr(x, y0 - h, 60, h, 14); g.fillStyle = 'rgba(255,255,255,.06)'; g.fill(); const col = lv > .55 ? mix(C.red, C.amber, (1 - lv) / .45) : mix(C.amber, C.green, (.55 - lv) / .43); rr(x, y0 - h * lv, 60, h * lv, 14); g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 20; g.fill(); g.restore();
  }
  const ra = pop(t, P.tNudge + .3, .45); if (ra.a > 0) rich([['direction: ', C.dim], ['− gradient', C.amber]], 440, 1110, { size: 36, weight: 700, font: F.d, align: 'center', a: ra.a });
  const rp = pop(t, P.tAgain, .45); if (rp.a > 0) { const k = Math.round(round); pill(540, 1250, `↻  repeat  ·  step ${k}`, C.cyan, { size: 32, h: 72, padX: 34, a: rp.a, s: rp.s, glow: 18 }); }
};
SCN.definition.init = s => {
  const P = { tTitle: cueT(s, [0, 'gradient', -.1]), tNudge: cueT(s, [1, 'nudges', -.1]), tLow: cueT(s, [1, 'lowers', -.1]), tAgain: cueT(s, [2, 'again', -.1]) };
  P.rounds = [P.tLow, cueT(s, [2, 'again', -.05]), cueT(s, [2, 'and again', 0]), cueT(s, [2, '$end', .2]), cueT(s, [2, '$end', .7])]; SCN.definition.P = P;
  cue(P.tTitle, 'thud', .8); cue(P.tTitle + .05, 'chime', .6); cue(P.tNudge, 'swish', .4); P.rounds.forEach(r => cue(r, 'tick', .5)); cue(P.tAgain, 'pop', .5);
};

// =============== HOW IT WORKS ===============
SCN.how = (t, s) => {
  const P = SCN.how.P, aa = E.out(pr(t, s.start + .05, s.start + .5)), main = 1 - E.io(pr(t, P.tLR - .3, P.tLR + .2));
  // update rule at the top
  const fa = slide(t, P.tRule - .1, .45, 30); if (fa.a > 0) updateRule(540, 420 + fa.y, 60, fa.a, { hl: t >= P.tEta && t < P.tGradW ? 1 : t >= P.tGradW && t < P.tShrink ? 2 : 0 });
  if (main > 0) {
    g.save(); g.globalAlpha *= main;
    const m = axes(170, 520, 770, 560, { xr: [0, 8], yr: [0, 10], ticksY: [0, 5, 10], ticksX: [0, 2, 4, 6, 8], xLabel: 'weight w', yLabel: 'loss L(w)', a: aa });
    plot(m, LV, [0, 8], C.cyan, E.io(pr(t, s.lines[0].start, s.lines[0].end + .2)), { lw: 6, glow: 22 });
    const b = hop(m, LV, P.ws, P.ts, t, .3, 50), bp = pop(t, P.tGrad - .2, .4);
    for (let k = 0; k < b.i; k++) { circ(m.X(P.ws[k]), m.Y(LV(P.ws[k])), 6, C.amber, .7, 8); if (k) seg(m.X(P.ws[k - 1]), 1092, m.X(P.ws[k]), 1092, rgba(C.amber, .8), E.out(pr(t, P.ts[k - 1], P.ts[k - 1] + .3)), 4); }
    if (b.i >= 1) { seg(m.X(P.ws[b.i - 1]), 1092, m.X(P.ws[b.i]), 1092, rgba(C.amber, .8), E.out(pr(t, P.ts[b.i - 1], P.ts[b.i - 1] + .3)), 4); }
    // tangent (gradient) at the current point, before each step
    const tg = pop(t, P.tGrad, .4);
    if (tg.a > 0 && t < P.tShrink + 1.6) {
      const w = P.ws[b.i], sl = dLV(w), y0 = LV(w), x0 = w - 1.3, x1 = w + 1.3, hopping = b.i < P.ws.length - 1 && t >= P.ts[b.i] && t < P.ts[b.i] + .3 ? 0 : 1;
      g.save(); g.beginPath(); g.rect(170, 520, 770, 560); g.clip(); seg(m.X(x0), m.Y(y0 + sl * (x0 - w)), m.X(x1), m.Y(y0 + sl * (x1 - w)), C.red, tg.a * hopping * .9, 3.5, [10, 7]); g.restore();
      if (t < P.tStep + .4) { const du = Math.sign(sl), ex = w + du * .75; arrow(m.X(w), m.Y(y0), m.X(ex), m.Y(y0 + sl * (ex - w)), '#FF8A9A', E.out(pr(t, P.tUp, P.tUp + .4)), tg.a, 8); const k = pop(t, P.tUp, .4); pill(m.X(2.6), m.Y(9.3), '∇L points uphill', C.red, { size: 22, h: 42, a: k.a, s: k.s }); }
    }
    // the opposite step arrow
    const st = pop(t, P.tStep, .4); if (st.a > 0 && t < P.ts[0] + .4) { const w = P.ws[0]; arrow(m.X(w), m.Y(LV(w)) + 40, m.X(P.ws[1]), m.Y(LV(w)) + 40, C.green, E.out(pr(t, P.tStep, P.tStep + .35)), st.a, 5); pill(m.X(5.6), m.Y(8.2), 'step = −η · ∇L', C.green, { size: 22, h: 42, a: st.a, s: st.s }); }
    ball(b.x, b.y, C.amber, bp.a, 17);
    if (bp.a > 0) { const wc = b.w; rich([['w = ', C.dim], [wc.toFixed(2), C.cyan], ['     ∇L = ', C.dim], [dLV(wc).toFixed(2), C.red]], 540, 1240, { size: 40, weight: 800, font: F.m, align: 'center', a: bp.a }); }
    // steps shrink callout
    const sk = pop(t, P.tShrink, .45); if (sk.a > 0) { pill(m.X(4), m.Y(0) - 140, 'slope → 0  ·  steps shrink', C.green, { size: 24, h: 46, a: sk.a, s: sk.s }); }
    txt('step size', 170, 1150, { size: 20, font: F.m, weight: 700, color: C.amber, a: bp.a * .9 });
    g.restore();
  }
  // learning-rate comparison
  const la = E.out(pr(t, P.tLR - .1, P.tLR + .35));
  if (la > 0) {
    [[300, 'η too big', C.red, P.big, P.tLR + .2, 'overshoots', P.tOver], [780, 'η too small', C.amber, P.small, P.tLR + .2, 'crawls', P.tCrawl]].forEach(([cx, lab, col, ws, t0, tag, tt]) => {
      g.save(); g.globalAlpha *= la; const m = { X: w => cx + (w - 4) * 44, Y: L => 1150 - L * 52 };
      panel(cx - 220, 560, 440, 640, { stroke: rgba(col, .5) }); txt(lab, cx, 620, { size: 36, weight: 800, font: F.d, align: 'center', color: col });
      plot(m, LV, [-.6, 8.6], C.cyan, 1, { lw: 4, glow: 10 });
      const ts = ws.slice(0, -1).map((_, i) => t0 + i * .32), b = hop(m, LV, ws, ts, t, .26, 30);
      for (let k = 1; k <= b.i; k++) seg(m.X(ws[k - 1]), m.Y(LV(ws[k - 1])), m.X(ws[k]), m.Y(LV(ws[k])), rgba(col, .7), 1, 2.5);
      ball(b.x, b.y, col, 1, 13);
      const k = pop(t, tt, .4); pill(cx, 1260, tag, col, { size: 28, h: 56, solid: true, a: k.a, s: k.s, glow: 18 }); g.restore();
    });
  }
};
SCN.how.init = s => {
  const P = { tGrad: cueT(s, [1, 'gradient', -.1]), tUp: cueT(s, [1, 'uphill', -.1]), tStep: cueT(s, [2, 'step', -.1]), tRule: cueT(s, [3, null, -.1]), tEta: cueT(s, [3, 'learning', -.1]), tGradW: cueT(s, [3, 'times gradient', -.05]),
    tShrink: cueT(s, [4, 'shrink', -.2]), tLR: cueT(s, [5, null, -.1]), tTiny: cueT(s, [5, 'a tiny', -.1]), tOver: cueT(s, [5, 'overshoots', -.1]), tCrawl: cueT(s, [5, 'crawls', -.1]) };
  P.ws = gdPath(1, .35, 9);
  const st = cueT(s, [2, 'opposite', 0]), fl = cueT(s, [4, 'flattens', -.1]);
  P.ts = [st, cueT(s, [3, 'old', 0]), cueT(s, [3, 'gradient', 0]), cueT(s, [4, null, 0]), cueT(s, [4, 'slope', 0]), fl, fl + .45, fl + .8, fl + 1.1];
  P.big = gdPath(3, 2.35, 5); P.small = gdPath(.2, .05, 10); SCN.how.P = P;
  cue(s.start + .1, 'swish', .4); cue(P.tGrad, 'blip', .5); cue(P.tUp, 'error', .45); cue(P.tStep, 'confirm', .5); cue(P.tRule, 'swish', .5); P.ts.forEach((x, i) => cue(x + .26, 'tick', .5 - i * .03));
  cue(P.tShrink, 'ping', .6); cue(P.tLR, 'whoosh', .5); P.big.slice(1).forEach((_, i) => cue(P.tLR + .2 + i * .32 + .24, 'error', .25)); cue(P.tOver, 'error', .6); cue(P.tCrawl, 'thud', .5);
};

// =============== REAL-WORLD EXAMPLE ===============
// houses: size (x) vs price (y); model: price = w · size; MSE loss is convex in w
const HOUSES = (() => { const r = rnd(5); return Array.from({ length: 12 }, (_, i) => { const x = 1 + i * .72 + r() * .3; return { x, y: .82 * x + (r() - .5) * 1.4 }; }); })();
const hGrad = w => HOUSES.reduce((a, h) => a + 2 * h.x * (w * h.x - h.y), 0) / HOUSES.length, hLoss = w => HOUSES.reduce((a, h) => a + (w * h.x - h.y) ** 2, 0) / HOUSES.length;
const HX2 = HOUSES.reduce((a, h) => a + h.x * h.x, 0) / HOUSES.length;
SCN.example = (t, s) => {
  const P = SCN.example.P, aa = E.out(pr(t, s.start + .05, s.start + .5));
  const m = axes(190, 420, 720, 470, { xr: [0, 10], yr: [0, 10], xLabel: 'size', yLabel: 'price', a: aa });
  // current weight: interpolate through the GD path at step times
  let i = 0; while (i + 1 < P.ts.length && t >= P.ts[i + 1]) i++;
  const wv = t < P.ts[0] ? P.ws[0] : lerp(P.ws[i], P.ws[Math.min(i + 1, P.ws.length - 1)], E.io(pr(t, P.ts[i], P.ts[i] + .35))), done = t < P.ts[0] ? 0 : (t >= P.ts[i] + .35 ? i + 1 : i);
  // batch highlight
  const batch = k => t >= P.tBatch && t < P.tStep2 + 2 && P.batchSets[Math.max(0, done) % P.batchSets.length].includes(k);
  // residuals
  const ra = E.out(pr(t, P.tErr - .1, P.tErr + .3));
  HOUSES.forEach((h, k) => {
    const p = pop(t, s.start + .15 + k * .06, .35); if (p.a <= 0) return; const hx = m.X(h.x), hy = m.Y(h.y), ly = m.Y(wv * h.x), bt = batch(k);
    if (ra > 0 && (bt || t >= P.tStep2 + 2)) seg(hx, hy, hx, ly, rgba(C.red, .8), ra * (bt ? 1 : .5), 2.5, [5, 5]);
    circ(hx, hy, 12 * p.s, bt ? C.amber : C.cyan, p.a, bt ? 22 : 10); if (bt) ring(hx, hy, 20, C.amber, .7, 2);
  });
  // model line
  const la = pop(t, P.tLine, .45); if (la.a > 0) { const x2 = Math.min(10, 10 / Math.max(wv, .01)); g.save(); g.globalAlpha *= la.a; seg(m.X(0), m.Y(0), m.X(x2), m.Y(wv * x2), C.green, 1, 6); g.restore();
    const lr = pill(810, 470, `w = ${wv.toFixed(2)}`, C.green, { size: 28, h: 56, a: la.a, s: la.s }); }
  const bp = pop(t, P.tBatch, .4); if (bp.a > 0 && t < P.tStep2 + 2) pill(330, 470, 'batch of houses', C.amber, { size: 22, h: 42, a: bp.a, s: bp.s });
  // tilt arrow
  const tp = pop(t, P.tTilt, .45); if (tp.a > 0 && t < P.tStep2 + 1.2) { const cx = m.X(0), cy = m.Y(0), r = 300, a0 = -Math.atan2(m.Y(0) - m.Y(wv * 6), m.X(6) - m.X(0)); g.save(); g.globalAlpha *= tp.a; g.strokeStyle = C.amber; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, r, a0 + .02, a0 - .32, true); g.stroke(); g.restore(); arrowHead(cx + r * Math.cos(a0 - .32), cy + r * Math.sin(a0 - .32), a0 - .32 - Math.PI / 2, C.amber, 18, tp.a); pill(cx + r * Math.cos(a0 - .16) + 80, cy + r * Math.sin(a0 - .16) - 10, '−η · ∇L', C.amber, { size: 22, h: 42, a: tp.a, s: tp.s }); }
  // loss vs step chart
  const ca = E.out(pr(t, P.tErr - .2, P.tErr + .3));
  if (ca > 0) {
    const n = P.ws.length - 1, mc = axes(190, 1030, 720, 210, { xr: [0, n], yr: [0, P.l0 * 1.1], ticksX: [0, n], xLabel: 'step', yLabel: 'loss', a: ca });
    g.save(); g.globalAlpha *= ca; g.strokeStyle = C.red; g.lineWidth = 4; g.shadowColor = C.red; g.shadowBlur = 12; g.beginPath();
    for (let k = 0; k <= done && k <= n; k++) { const px = mc.X(k), py = mc.Y(hLoss(P.ws[k])); k ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); g.restore();
    for (let k = 0; k <= done && k <= n; k++) circ(mc.X(k), mc.Y(hLoss(P.ws[k])), 7, k === done ? C.amber : C.red, ca, 10);
    const lp = pop(t, P.tFits, .45); if (lp.a > 0) pill(mc.X(n) - 70, mc.Y(P.l0 * .8), 'converged ✓', C.green, { size: 24, h: 46, a: lp.a, s: lp.s, solid: true, glow: 18 });
  }
};
SCN.example.init = s => {
  const P = { tLine: cueT(s, [0, 'a line', -.1]), tBatch: cueT(s, [1, 'batch', -.1]), tErr: cueT(s, [1, 'error', -.1]), tTilt: cueT(s, [2, 'tilt', -.1]), tStep2: cueT(s, [3, null, 0]), tFits: cueT(s, [3, 'fits', -.1]) };
  P.ws = gdPath(.12, .3 / HX2, 7, hGrad); P.l0 = hLoss(P.ws[0]);
  P.ts = [cueT(s, [2, 'line', -.05]), cueT(s, [3, 'step', 0]), cueT(s, [3, 'after', 0]), cueT(s, [3, 'step,', 0]), cueT(s, [3, 'loss', 0]), cueT(s, [3, 'falling', 0]), cueT(s, [3, 'and the', 0])];
  P.batchSets = [[0, 3, 6, 9, 11], [1, 4, 7, 10], [2, 5, 8, 11], [0, 2, 6, 9]];
  SCN.example.P = P;
  HOUSES.forEach((_, k) => k % 3 === 0 && cue(s.start + .15 + k * .06, 'pop', .25)); cue(P.tLine, 'swish', .5); cue(P.tBatch, 'blip', .5); cue(P.tErr, 'error', .5); cue(P.tTilt, 'switch', .5); P.ts.forEach(x => cue(x + .3, 'tick', .45)); cue(P.tFits, 'positive', .7);
};

// =============== BEFORE vs AFTER ===============
SCN.compare = compareScene({
  left: { head: 'WITHOUT', sub: 'gradient descent', col: C.red, steps: [['Random weights', [0, null, .05]], ['Guess new values', [0, 'random', -.05]], ['No direction', [0, 'guesses', -.05]], ['Loss stays high', [0, 'the loss', -.05]], ['NO PROGRESS', [0, 'barely', -.05]]] },
  right: { head: 'WITH', sub: 'gradient descent', col: C.green, good: true, steps: [['Random weights', [1, null, .05]], ['Compute gradient', [1, 'every', -.05]], ['Step downhill', [1, 'downhill', -.1]], ['Loss keeps falling', [1, 'until', -.05]], ['CONVERGES', [1, 'bottoms', -.05]]] },
  swapAt: [1, null, 0]
});

// =============== TAKEAWAYS ===============
SCN.takeaways = takeawaysScene({
  title: [['Remember ', C.text], ['3', C.cyan], [' things', C.text]],
  cards: [
    { title: 'w ← w − η · ∇L', sub: 'backprop computes ∇L · GD applies it', col: C.cyan, at: [1, null, -.1] },
    { title: 'Learning rate η = step size', sub: 'too big diverges · too small is slow', col: C.amber, at: [2, null, -.1] },
    { title: 'Mini-batch SGD', sub: 'plus variants: momentum, Adam', col: C.violet, at: [3, null, -.1] }
  ],
  note: { segs: [['Non-convex loss: ', C.dim], ['local minima & saddle points', C.amber]], at: [3, '$end', -.8] },
  mono: { text: 'batch = all data  ·  SGD = 1 example  ·  mini-batch = 32–512', at: [3, '$end', -.4] }
});

// =============== SUMMARY ===============
SCN.summary = summaryScene({
  label: 'GRADIENT DESCENT  =',
  rows: [{ text: 'Follow the slope', at: [0, 'follow', -.05] }, { text: 'downhill,', col: C.green, at: [0, 'downhill', -.05] }, { text: 'one step at a time.', col: C.cyan, at: [0, 'one step', -.05] }],
  icon: (t, s) => {
    const a = pop(t, s.start + .1, .5); if (a.a <= 0) return; g.save(); g.globalAlpha *= a.a;
    const m = { X: w => 540 + (w - 4) * 42, Y: L => 600 - L * 22 };
    plot(m, LV, [-.6, 8.6], C.cyan, E.io(pr(t, s.start + .1, s.start + .9)), { lw: 5, glow: 18 });
    const ws = gdPath(.2, .4, 6), ts = ws.slice(0, -1).map((_, i) => s.start + .8 + i * .4), b = hop(m, LV, ws, ts, t, .3, 20);
    ball(b.x, b.y, C.amber, 1, 12); g.restore();
  }
});

// =============== CTA ===============
SCN.cta = ctaScene({ big: 'AI Concepts', bigPhrase: 'ai concepts', sub: 'explained visually', subPhrase: 'explained' });
