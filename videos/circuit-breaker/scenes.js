'use strict';
// =============== 1. HOOK ===============
SCN.hook = (t, s) => {
  const P = SCN.hook.P, { tDown, tSpread, nodes, l0, l1 } = P, cx = 540, cy = 900;
  const sh = t >= tDown ? Math.pow(1 - pr(t, tDown, tDown + .5), 2) * 16 : 0;
  g.save(); g.translate(Math.sin(t * 95) * sh, Math.cos(t * 83) * sh);
  tint(C.red, t >= tDown ? .30 * (1 - .6 * pr(t, tDown + .1, tDown + .9)) + .22 * pr(t, tSpread, l1.end) : 0);
  const z = lerp(1, 1.07, pr(t, 0, s.end)); g.save(); g.translate(cx, cy); g.scale(z, z); g.translate(-cx, -cy);
  // edges
  nodes.forEach((n, i) => {
    if (!i) return; const a = E.out(pr(t, .1 + i * .04, .5 + i * .04)), dead = pr(t, n.f, n.f + .25);
    seg(cx, cy, n.x, n.y, rgba(mix(C.cyan, C.red, Math.max(dead, pr(t, tDown, tDown + .2) * .55)), .38), a, 3);
    const m = nodes[1 + (i % 10)]; seg(n.x, n.y, m.x, m.y, rgba(mix(C.cyan, C.red, Math.min(dead, pr(t, m.f, m.f + .25))), .16), a, 2);
    if (t < tDown) { const u = ((t * .9 + i * .37) % 1); pkt(cx, cy, n.x, n.y, (i % 2) ? u : 1 - u, C.cyan, { r: 6, a: a }); }
    else if (t < n.f) { const u = ((t * 2.6 + i * .37) % 1); pkt(n.x, n.y, cx, cy, u, C.amber, { r: 6 }); }
  });
  // shockwave
  if (t >= tDown) for (const k of [0, 1]) { const u = pr(t, tDown + k * .16, tDown + 1.0 + k * .16); ring(cx, cy, 60 + E.out(u) * 520, C.red, (1 - u) * .8, 6 - 4 * u); }
  // nodes
  nodes.forEach((n, i) => {
    const p = pop(t, .05 + i * .04, .5), dead = pr(t, n.f, n.f + .18), col = mix(C.cyan, C.red, dead), fl = t >= n.f ? 1 - pr(t, n.f, n.f + .5) : 0;
    if (fl > 0 && i) ring(n.x, n.y, n.r + (1 - fl) * 46, C.red, fl * .8, 4);
    g.save(); g.translate(n.x, n.y); g.scale(p.s * (1 + fl * .12), p.s * (1 + fl * .12)); g.globalAlpha *= p.a;
    g.shadowColor = rgba(col, .8); g.shadowBlur = i ? 26 + fl * 30 : 50; g.fillStyle = mix('#0A1020', col, .16 + .2 * dead); g.beginPath(); g.arc(0, 0, n.r, 0, 7); g.fill(); g.shadowBlur = 0; g.lineWidth = i ? 3 : 4; g.strokeStyle = col; g.stroke();
    if (dead > .5) cross(0, 0, n.r * .3, C.red, dead, i ? 5 : 8); else glyph('server', 0, 0, n.r * .42, col); g.restore();
  });
  g.restore();
  // typography
  let a = slide(t, l0.start - .2, .45, 50); txt('ONE MICROSERVICE', 540, 372 + a.y, { size: 70, weight: 800, font: F.d, ls: 3, align: 'center', a: a.a });
  let u = pr(t, tDown - .1, tDown + .22); if (u > 0) { g.save(); g.translate(540, 468); const sc = lerp(1.7, 1, E.expo(u)); g.scale(sc, sc); txt('JUST WENT DOWN.', 0, 0, { size: 84, weight: 900, font: F.d, ls: 1, align: 'center', color: C.red, a: E.out(u), glow: 34 }); g.restore(); }
  a = slide(t, l1.start - .08, .4, 40); txt('SO WHY ARE', 540, 1340 + a.y, { size: 52, weight: 700, ls: 10, align: 'center', color: C.dim, a: a.a });
  u = pr(t, P.tTen - .12, P.tTen + .22); if (u > 0) { g.save(); g.translate(540, 1440); const sc = lerp(1.5, 1, E.expo(u)); g.scale(sc, sc); g.globalAlpha *= E.out(u); const o = { size: 90, weight: 900, font: F.d, align: 'center' }; o.size = fit('10 OTHERS FAILING?', 900, o); rich([['10', C.red], [' OTHERS FAILING?', C.text]], 0, 0, o); g.restore(); }
  g.restore();
};
SCN.hook.init = s => {
  const l0 = L('hook', 0), l1 = L('hook', 1), tDown = at(l0, 'went down', .05), tSpread = l1.start + .05, cx = 540, cy = 900, nodes = [{ x: cx, y: cy, r: 62, f: tDown }], r = rnd(11);
  const order = [...Array(10).keys()].sort(() => r() - .5);
  for (let i = 0; i < 10; i++) { const ang = -Math.PI / 2 + i * Math.PI * 2 / 10 + .18, rad = i % 2 ? 222 : 312; nodes.push({ x: cx + Math.cos(ang) * rad * 1.04, y: cy + Math.sin(ang) * rad, r: i % 2 ? 40 : 46, f: tSpread + order[i] * ((l1.end - .15 - tSpread) / 9) }); }
  SCN.hook.P = { l0, l1, tDown, tSpread, nodes, tTen: at(l1, 'ten', -.05) };
  cue(l0.start - .25, 'whoosh', .7); cue(tDown, 'impact', 1); nodes.slice(1).forEach(n => cue(n.f, 'blip', .5)); cue(at(l1, 'ten', -.1), 'thud', .7);
};

// =============== 2. PROBLEM ===============
SCN.problem = (t, s) => {
  const P = SCN.problem.P, { tFail, tRetry, tThr, tExh, tCasc } = P, t0 = s.start;
  const A = { x: 540, y: 715, w: 680, h: 250 }, B = { x: 540, y: 1075, w: 500, h: 136 }, Cc = { x: 540, y: 1272, w: 330, h: 88 }, uy = 425, ups = [{ x: 220, l: 'Web', i: 'phone' }, { x: 540, l: 'Mobile', i: 'phone' }, { x: 860, l: 'Service D', i: 'server' }];
  const aTop = A.y - A.h / 2, aBot = A.y + A.h / 2, bTop = B.y - B.h / 2, bBot = B.y + B.h / 2, cTop = Cc.y - Cc.h / 2;
  const failU = pr(t, tFail, tFail + .25), exhU = pr(t, tExh, tExh + .3);
  tint(C.red, .14 * failU + .22 * pr(t, tExh, tExh + .5));
  const sh = (t >= tFail ? (1 - pr(t, tFail, tFail + .4)) * 9 : 0) + (t >= tExh ? (1 - pr(t, tExh, tExh + .5)) * 13 : 0);
  g.save(); g.translate(Math.sin(t * 90) * sh, Math.cos(t * 77) * sh * .6);
  const rA = pop(t, t0 + .1), rB = pop(t, t0 + .28), rC = pop(t, t0 + .46), rU = i => pop(t, t0 + .5 + i * .09);
  const cu = i => pr(t, tCasc + .12 + i * .2, tCasc + .36 + i * .2), colAB = mix(C.cyan, C.red, failU), colA = mix(mix(C.cyan, C.amber, pr(t, tThr, tExh) * .9), C.red, exhU);
  seg(540, aBot, 540, bTop, rgba(colAB, .42), rB.a, 3); seg(540, bBot, 540, cTop, rgba(mix(C.cyan, C.faint, failU), .35), rC.a, 3);
  ups.forEach((u, i) => seg(u.x, uy + 42, 540 + (u.x - 540) * .5, aTop, rgba(mix(C.cyan, C.red, cu(i)), .42), rU(i).a, 3));
  // upstream traffic
  ups.forEach((u, i) => { const x2 = 540 + (u.x - 540) * .5; for (let sp = t0 + .95 + i * .23; sp < tExh; sp += .7) { pkt(u.x, uy + 42, x2, aTop, (t - sp) / .4, C.cyan, { r: 7 }); if (sp + .4 < tFail + .1) pkt(x2 + 14, aTop, u.x + 14, uy + 42, (t - sp - .5) / .4, C.green, { r: 7 }); } });
  // B -> C traffic while healthy
  for (let sp = t0 + 1.0; sp < tFail - .3; sp += .5) pkt(540, bBot, 540, cTop, (t - sp) / .3, C.cyan, { r: 7 });
  // A -> B requests
  let pile = 0;
  for (const sp of P.sp) {
    const u = (t - sp) / .42, ok = sp + .42 < tFail;
    if (ok) { pkt(528, aBot, 528, bTop, u, C.cyan); pkt(552, bTop, 552, aBot, (t - sp - .52) / .42, C.green); }
    else { pkt(540, aBot, 540, bTop - 16, u, sp > tRetry ? C.amber : C.cyan); if (u >= 1) pile++; }
  }
  const pr2 = rnd(5); for (let i = 0; i < Math.min(pile, 34); i++) { const x = 540 + (pr2() - .5) * 430, y = bTop - 15 - Math.floor(pr2() * 3) * 17; circ(x + Math.sin(t * 9 + i) * 1.5, y, 7, i % 3 ? C.red : C.amber, .9, 10); }
  // boxes
  ups.forEach((u, i) => { const p = rU(i), c = cu(i); svc(u.x, uy, 250, 84, { label: u.l, size: 28, icon: u.i, col: mix(C.cyan, C.red, c), a: p.a, s: p.s, glow: .35 + c * .5 }); if (c > 0 && c < 1) ring(u.x, uy, 60 + c * 70, C.red, (1 - c) * .7, 4); });
  svc(A.x, A.y, A.w, A.h, { col: colA, a: rA.a, s: rA.s, glow: .45 + exhU * .5 * (.7 + .3 * Math.sin(t * 9)) });
  g.save(); g.globalAlpha *= rA.a;
  txt('Service A', 236, 652, { size: 38, weight: 700 }); txt('caller', 236 + tw('Service A', { size: 38, weight: 700 }) + 18, 650, { size: 23, font: F.m, weight: 400, color: C.dim });
  const nb = P.bt.filter(x => t >= x).length;
  txt(`THREADS ${nb}/10 BLOCKED`, 844, 650, { size: 23, font: F.m, weight: 700, align: 'right', color: nb >= 10 ? C.red : nb ? C.amber : C.dim });
  for (let i = 0; i < 10; i++) {
    const x = 240 + i * 61, y = 737, bl = t >= P.bt[i], age = bl ? pr(t, P.bt[i], P.bt[i] + .5) : 0, busy = !bl && t < tExh && ((Math.floor(t / .23) + i * 3) % 7 === 0);
    const col = bl ? mix(C.amber, C.red, Math.max(age * .6, exhU)) : C.cyan, p = bl ? 1 + (1 - age) * .25 : 1;
    g.save(); g.translate(x + 23, y + 23); g.scale(p, p); rr(-23, -23, 46, 46, 11); g.fillStyle = bl ? rgba(col, .85) : busy ? rgba(C.cyan, .5) : 'rgba(255,255,255,.05)'; if (bl) { g.shadowColor = col; g.shadowBlur = 14; } g.fill(); g.shadowBlur = 0; g.lineWidth = 2; g.strokeStyle = rgba(col, bl ? 1 : .45); g.stroke();
    if (bl) { g.strokeStyle = '#0A101D'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.arc(0, 0, 10, 0, 7); g.moveTo(0, -6); g.lineTo(0, 0); g.lineTo(5, 3); g.stroke(); } g.restore();
  }
  const la = E.out(pr(t, tThr, tThr + .35)) * (1 - exhU); txt('each call holds a thread until the timeout', 540, 818, { size: 22, font: F.m, weight: 400, align: 'center', color: C.amber, a: la });
  if (exhU > 0) txt('THREAD POOL EXHAUSTED', 540, 820, { size: 26, font: F.m, weight: 700, align: 'center', color: C.red, a: exhU, ls: 3, glow: 16 });
  g.restore();
  svc(B.x, B.y, B.w, B.h, { label: 'Service B', sub: failU > .5 ? 'NOT RESPONDING' : '200 OK · 42 ms', icon: 'server', col: colAB, subCol: failU > .5 ? C.red : C.green, a: rB.a, s: rB.s, glow: .4 + failU * .55 * (.65 + .35 * Math.sin(t * 8)) });
  if (failU > 0) { const u = pr(t, tFail, tFail + .8); ring(B.x, B.y, 90 + E.out(u) * 330, C.red, (1 - u) * .7, 5); }
  svc(Cc.x, Cc.y, Cc.w, Cc.h, { label: 'Service C', size: 27, sub: failU > .5 ? 'no traffic' : null, subSize: 19, col: mix(C.cyan, C.faint, failU), a: rC.a * lerp(1, .6, failU), s: rC.s, glow: .3 * (1 - failU) });
  // metric chips
  const ca = E.out(pr(t, t0 + .7, t0 + 1.1)) * (1 - pr(t, tCasc, tCasc + .2));
  if (ca > 0) {
    const lat = t < tFail ? '42 ms' : Math.min(30, (t - tFail) * 5.2).toFixed(1) + ' s', rt = P.sp.filter(x => x >= tRetry && x <= t).length;
    for (const [x, lab, val, col] of [[90, 'LATENCY', lat, t < tFail ? C.green : C.red], [680, 'RETRIES', String(rt), rt ? C.amber : C.dim]]) {
      panel(x, 880, 310, 72, { a: ca, r: 18, stroke: rgba(col, .45) }); txt(lab, x + 24, 925, { size: 21, font: F.m, weight: 400, color: C.dim, a: ca }); txt(val, x + 286, 928, { size: 31, font: F.m, weight: 700, color: col, align: 'right', a: ca });
    }
  }
  const bp = pop(t, tCasc + .2, .5); if (bp.a > 0) pill(540, 916, 'CASCADING FAILURE', C.red, { size: 36, solid: true, s: bp.s, a: bp.a, glow: 40, ls: 3, padX: 36, h: 78, font: F.d, weight: 900 });
  g.restore();
};
SCN.problem.init = s => {
  const p = [0, 1, 2, 3].map(i => L('problem', i)), P = { tFail: at(p[0], 'stops', 0), tRetry: at(p[1], 'keeps', 0), tThr: p[2].start, tExh: at(p[3], 'run out', .2), tCasc: at(p[3], 'cascades', 0) };
  P.sp = []; let x = s.start + .55; while (x < P.tExh) { P.sp.push(x); x += x < P.tRetry ? .46 : lerp(.34, .08, E.io(pr(x, P.tRetry, P.tExh))); }
  P.bt = []; for (let i = 0; i < 10; i++) P.bt.push(i < 3 ? lerp(P.tFail + .45, P.tThr, (i + .6) / 3) : lerp(P.tThr, P.tExh, (i - 2) / 7));
  SCN.problem.P = P; cue(s.start + .15, 'ping', .35); cue(P.tFail, 'error', 1); cue(P.tRetry, 'riser', P.tExh - P.tRetry); P.bt.forEach(b => cue(b, 'tick', .5)); cue(P.tExh, 'impact', .9); cue(P.tCasc + .2, 'error', .9);
};

// =============== 3. DEFINITION ===============
SCN.definition = (t, s) => {
  const P = SCN.definition.P, { tTitle, tWrap, tWatch, tMany, tOpen, tRec, d } = P, y = 712;
  let a = slide(t, d[0].start - .15, .4, 30); txt('THE FIX IS A', 540, 372 + a.y, { size: 32, weight: 700, ls: 10, align: 'center', color: C.dim, a: a.a });
  let u = pr(t, tTitle, tTitle + .3); if (u > 0) {
    g.save(); g.translate(540, 470); const sc = lerp(1.45, 1, E.expo(u)); g.scale(sc, sc); txt('Circuit Breaker', 0, 0, { size: 104, weight: 900, font: F.d, align: 'center', a: E.out(u), glow: 30, glowCol: rgba(C.cyan, .7) }); g.restore();
    const lu = E.out(pr(t, tTitle + .15, tTitle + .7)), gr = g.createLinearGradient(540 - 330, 0, 540 + 330, 0); gr.addColorStop(0, rgba(C.cyan, 0)); gr.addColorStop(.5, C.cyan); gr.addColorStop(1, rgba(C.cyan, 0)); g.save(); g.globalAlpha *= lu; g.fillStyle = gr; g.fillRect(540 - 330 * lu, 506, 660 * lu, 4); g.restore();
  }
  const opU = E.back(pr(t, tOpen, tOpen + .32)), isOpen = t >= tOpen, wrap = E.io(pr(t, tWrap, tWrap + .65));
  const rec = pr(t, tRec, s.end - 1.1), colB = rec <= 0 ? C.red : mix(mix(C.red, C.amber, pr(rec, 0, .45)), C.green, pr(rec, .55, 1));
  const brCol = isOpen ? C.red : mix(C.cyan, C.green, wrap);
  const pA = pop(t, s.start + .1), pB = pop(t, s.start + .22);
  seg(290, y, 790, y, 'rgba(120,150,230,.35)', Math.min(pA.a, pB.a), 3);
  // traffic
  for (let sp = s.start + .45; sp < s.end; sp += .5) {
    if (sp < tOpen - .3) { pkt(290, y - 9, 790, y - 9, (t - sp) / .7, C.cyan); pkt(790, y + 11, 290, y + 11, (t - sp - .78) / .7, C.red); }
    else if (sp >= tOpen) { pkt(290, y - 9, 432, y - 9, (t - sp) / .24, C.cyan); pkt(432, y + 11, 290, y + 11, (t - sp - .26) / .24, C.amber); const k = pr(t, sp + .2, sp + .5); if (k > 0 && k < 1) cross(420, y - 44, 9, C.amber, 1 - k, 4); }
  }
  svc(180, y, 220, 124, { label: 'Service A', size: 29, col: C.cyan, a: pA.a, s: pA.s });
  svc(900, y, 220, 124, { label: 'Service B', size: 29, sub: rec <= 0 ? 'failing' : rec < 1 ? 'recovering' : 'healthy', col: colB, a: pB.a, s: pB.s, glow: .5 });
  if (rec > 0 && rec < 1) { const k = (t * 1.3) % 1; ring(900, y, 80 + k * 60, colB, (1 - k) * .6, 3); }
  if (wrap > 0) {
    breaker(540, y, { open: opU, col: brCol, wrap, a: clamp(wrap * 3) });
    const la = E.out(pr(t, tWrap + .3, tWrap + .7)); pill(540, y + 104, isOpen ? 'OPEN' : 'CLOSED', brCol, { size: 23, a: la, s: 1 + (isOpen ? (1 - pr(t, tOpen, tOpen + .3)) * .25 : 0) });
    if (isOpen) { const k = pr(t, tOpen, tOpen + .7); ring(540, y, 70 + E.out(k) * 220, C.red, (1 - k) * .8, 5); }
  }
  // failure watcher
  const wa = E.out(pr(t, tWatch - .1, tWatch + .25)); if (wa > 0) {
    txt('FAILURES', 540, y - 140, { size: 20, font: F.m, weight: 700, ls: 4, align: 'center', color: C.dim, a: wa });
    for (let i = 0; i < 5; i++) { const x = 540 + (i - 2) * 46, ft = P.fk[i], on = pr(t, ft, ft + .18), pp = 1 + (t >= ft ? (1 - pr(t, ft, ft + .3)) * .4 : 0); g.save(); g.globalAlpha *= wa; g.translate(x, y - 104); g.scale(pp, pp); rr(-17, -17, 34, 34, 9); g.fillStyle = on > 0 ? rgba(C.red, .25 + .6 * on) : 'rgba(255,255,255,.06)'; g.fill(); g.lineWidth = 2; g.strokeStyle = on > 0 ? C.red : 'rgba(255,255,255,.25)'; g.stroke(); if (on > 0) cross(0, 0, 7, '#fff', on, 3.5); g.restore(); }
  }
  // definition lines
  const lines = [[tWrap, [['Wraps ', C.text], ['the call', C.cyan]], C.cyan], [tWatch, [['Watches for ', C.text], ['failures', C.red]], C.red], [tOpen - .1, [['Stops calling', C.amber], [' a failing service', C.text]], C.amber], [tRec, [['Gives it ', C.text], ['time to recover', C.green]], C.green]];
  lines.forEach((ln, i) => { const u2 = E.out(pr(t, ln[0], ln[0] + .4)); if (u2 <= 0) return; const yy = 1016 + i * 92, dx = (1 - u2) * -50; g.save(); g.globalAlpha *= u2; rr(96 + dx, yy - 46, 10, 56, 5); g.fillStyle = ln[2]; g.shadowColor = ln[2]; g.shadowBlur = 14; g.fill(); g.restore(); rich(ln[1], 136 + dx, yy, { size: 56, weight: 700, font: F.d, a: u2 }); });
  if (isOpen) tint(C.red, .1 * (1 - pr(t, tOpen, tOpen + .8)));
};
SCN.definition.init = s => {
  const d = [0, 1, 2].map(i => L('definition', i)), P = { d, tTitle: at(d[0], 'circuit', -.1), tWrap: at(d[1], 'wraps', -.05), tWatch: at(d[1], 'watches', -.05), tMany: d[2].start, tOpen: at(d[2], 'stops calling', 0), tRec: at(d[2], 'giving', 0) };
  P.fk = [0, 1, 2, 3, 4].map(k => lerp(P.tWatch + .15, P.tMany + .3, k / 4)); SCN.definition.P = P;
  cue(P.tTitle, 'thud', .8); cue(P.tTitle + .05, 'chime', .6); cue(P.tWrap, 'swish', .5); P.fk.forEach(f => cue(f, 'blip', .45)); cue(P.tOpen, 'switch', 1); cue(s.end - 1.1, 'positive', .6);
};

// =============== 4. HOW IT WORKS ===============
function stateNode(cx, cy, w, h, label, col, act, a, s) {
  if (a <= 0) return; g.save(); g.translate(cx, cy); g.scale(s, s); g.globalAlpha *= a; rr(-w / 2, -h / 2, w, h, h / 2);
  g.shadowColor = rgba(col, .75 * act); g.shadowBlur = 56 * act; g.fillStyle = mix(C.panel, col, .04 + .24 * act); g.fill(); g.shadowBlur = 0; g.lineWidth = lerp(2.5, 4.5, act); g.strokeStyle = rgba(col, lerp(.45, 1, act)); g.stroke();
  const lw = tw(label, { size: 33, weight: 800, ls: 2 }); circ(-lw / 2 - 12, 0, 9, col, lerp(.5, 1, act), 14 * act); txt(label, 14, 2, { size: 33, weight: 800, ls: 2, align: 'center', base: 'middle', color: mix(C.dim, '#FFFFFF', act) }); g.restore();
}
SCN.how = (t, s) => {
  const P = SCN.how.P, { h, tTrip, tHalf, tClose, tAlt, tReopen } = P;
  // state + activation
  let ti = 0; P.tr.forEach((x, i) => { if (t >= x.t) ti = i; }); const cur = P.tr[ti].to, prev = ti ? P.tr[ti - 1].to : null, tu = E.out(pr(t, P.tr[ti].t, P.tr[ti].t + .3)), act = { C: 0, O: 0, H: 0 }; act[cur] = ti ? tu : E.out(pr(t, h[1].start - .1, h[1].start + .25)); if (prev && prev !== cur) act[prev] = 1 - tu;
  const SCOL = { C: C.green, O: C.red, H: C.amber }, col = SCOL[cur], since = t - P.tr[ti].t;
  if (cur === 'O') tint(C.red, .12 * (1 - pr(since, 0, .9)));
  const CL = [540, 440], OP = [815, 800], HO = [265, 800];
  // arrows (drawn when first discussed)
  const A1 = [[632, 492], [800, 545], [822, 742]], A3 = [[258, 742], [280, 545], [448, 492]];
  const a1 = E.io(pr(t, tTrip - .05, tTrip + .45)), a2 = E.io(pr(t, tHalf - .05, tHalf + .45)), a3 = E.io(pr(t, tClose - .05, tClose + .45)), a4 = E.io(pr(t, tAlt + .35, tAlt + .85));
  const hot = (t0, d = 1.2) => t >= t0 ? 1 - pr(t, t0 + .4, t0 + d) : 0;
  const ac = (c, t0) => mix('#6E7CA3', c, hot(t0));
  qarrow(A1[0], A1[1], A1[2], ac(C.red, tTrip), a1, 1, 3.5); qarrow(A3[0], A3[1], A3[2], ac(C.green, tClose), a3, 1, 3.5);
  arrow(690, 822, 408, 822, ac(C.amber, tHalf), a2, 1, 3.5); arrow(408, 778, 690, 778, ac(C.red, tAlt + .4), a4, 1, 3.5);
  const lab = (s1, s2, x, y, al, a, c) => { txt(s1, x, y, { size: 24, font: F.m, weight: 700, align: al, color: c, a }); if (s2) txt(s2, x, y + 31, { size: 24, font: F.m, weight: 400, align: al, color: C.dim, a }); };
  lab('failure rate', '≥ 50%', 806, 590, 'left', a1, mix(C.dim, C.red, .6 + .4 * hot(tTrip))); lab('trial calls', 'succeed', 276, 590, 'right', a3, mix(C.dim, C.green, .6 + .4 * hot(tClose)));
  lab('wait elapsed', null, 549, 862, 'center', a2, mix(C.dim, C.amber, .6 + .4 * hot(tHalf))); lab('trial fails', null, 549, 756, 'center', a4, mix(C.dim, C.red, .6 + .4 * hot(tAlt + .4)));
  // pulses travelling on freshly drawn arrows
  for (const [arr, t0, c] of [[A1, tTrip, C.red], [A3, tClose, C.green]]) { const u = pr(t, t0, t0 + .45); if (u > 0 && u < 1) { const p = qp(arr[0], arr[1], arr[2], E.io(u)); circ(p[0], p[1], 10, c, 1, 26); } }
  // state nodes
  const n0 = s.start + .16, pC = pop(t, n0), pO = pop(t, n0 + .22), pH = pop(t, n0 + .44);
  stateNode(CL[0], CL[1], 300, 104, 'CLOSED', C.green, act.C, pC.a, pC.s * (1 + .05 * act.C));
  stateNode(OP[0], OP[1], 230, 104, 'OPEN', C.red, act.O, pO.a, pO.s * (1 + .05 * act.O));
  stateNode(HO[0], HO[1], 286, 104, 'HALF-OPEN', C.amber, act.H, pH.a, pH.s * (1 + .05 * act.H));
  if (ti && since < .7) { const c = { C: CL, O: OP, H: HO }[cur]; ring(c[0], c[1], 80 + E.out(since / .7) * 150, col, (1 - since / .7) * .7, 4); }
  // ---- live lane ----
  const pa = E.out(pr(t, h[1].start - .25, h[1].start + .2)); if (pa <= 0) return;
  g.save(); g.globalAlpha *= pa; g.translate(0, (1 - pa) * 40);
  panel(50, 932, 924, 400, { stroke: rgba(col, .35) });
  const ly = 1136, bx = 502, cxA = 152, cxS = 860, x1 = 242, xb1 = 398, xb2 = 606, x2 = 764;
  seg(x1, ly, xb1, ly, 'rgba(120,150,230,.35)', 1, 3); seg(xb2, ly, x2, ly, cur === 'O' ? 'rgba(120,150,230,.14)' : 'rgba(120,150,230,.35)', 1, 3, cur === 'O' ? [8, 10] : null);
  // traffic per phase
  let svcCol = C.cyan, svcSub = 'healthy';
  const hop = .42;
  const drawCall = (c, okCol) => { pkt(x1, ly - 9, x2, ly - 9, (t - c.s) / hop, C.cyan); pkt(x2, ly + 11, x1, ly + 11, (t - c.s - hop) / hop, c.ok ? C.green : C.red); };
  for (const c of P.calls) if (c.c - .02 <= tTrip + .01) drawCall(c);
  for (const c of P.calls2) drawCall(c);
  for (const sp of P.rej) { pkt(x1, ly - 9, xb1 + 6, ly - 9, (t - sp) / .2, C.cyan); pkt(xb1 + 6, ly + 11, x1, ly + 11, (t - sp - .21) / .2, C.amber); const k = pr(t, sp + .17, sp + .5); if (k > 0 && k < 1) cross(xb1 - 4, ly - 46, 9, C.amber, 1 - k, 4); }
  for (const c of P.trials) { pkt(x1, ly - 9, x2, ly - 9, (t - c.s) / .5, C.amber, { r: 10 }); pkt(x2, ly + 11, x1, ly + 11, (t - c.s - .5) / .5, c.ok ? C.green : C.red, { r: 10 }); }
  const firstFail = P.calls.find(c => !c.ok).s + hop;
  if (t >= firstFail && t < tTrip) { svcCol = mix(C.amber, C.red, pr(t, firstFail, tTrip - .6)); svcSub = 'errors'; } else if (t >= tTrip && t < tHalf) { svcCol = mix(C.red, C.amber, pr(t, tTrip + .6, tHalf)); svcSub = 'no load'; } else if (t >= tHalf && t < tAlt) { svcCol = mix(C.amber, C.green, pr(t, tHalf + .5, tHalf + 1.6)); svcSub = t < tHalf + 1.4 ? 'recovering' : 'healthy'; } else if (t >= tAlt) { svcCol = mix(C.amber, C.red, pr(t, tAlt + .3, tAlt + .6)); svcSub = t < tAlt + .45 ? 'recovering' : 'still failing'; }
  svc(cxA, ly, 180, 112, { label: 'Caller', size: 29, col: C.cyan, glow: .3 });
  svc(cxS, ly, 192, 112, { label: 'Service', size: 29, sub: svcSub, subSize: 20, col: svcCol, glow: .4 });
  const TG = { C: 0, O: 1, H: .42 }, openAmt = lerp(prev ? TG[prev] : 0, TG[cur], cur === 'O' ? E.back(pr(since, 0, .3)) : E.out(pr(since, 0, .3)));
  breaker(bx, ly, { open: openAmt, col, w: 208, h: 116 });
  txt('BREAKER', bx, ly - 84, { size: 19, font: F.m, weight: 700, ls: 4, align: 'center', color: C.dim });
  if (cur === 'O') { const u = t < tHalf ? pr(t, tTrip, tHalf) : pr(t, tReopen, tReopen + 6), wa = E.out(pr(since, .1, .4)); g.save(); g.globalAlpha *= wa; rr(bx - 104, ly + 74, 208, 8, 4); g.fillStyle = 'rgba(255,255,255,.12)'; g.fill(); rr(bx - 104, ly + 74, Math.max(8, 208 * u), 8, 4); g.fillStyle = C.amber; g.shadowColor = C.amber; g.shadowBlur = 10; g.fill(); g.restore(); txt('WAIT DURATION', bx, ly + 106, { size: 17, font: F.m, weight: 700, ls: 3, align: 'center', color: C.amber, a: wa * .9 }); }
  // top strip: sliding window or trial slots
  const sy = 986;
  if (cur === 'H') {
    txt('TRIAL CALLS', 84, sy + 8, { size: 22, font: F.m, weight: 700, ls: 2, color: C.dim });
    const tr = t >= tAlt ? P.trials.slice(3) : P.trials.slice(0, 3), n = t >= tAlt ? 1 : 3;
    for (let i = 0; i < n; i++) { const c = tr[i], done = t >= c.s + 1.0, x = 314 + i * 62; rr(x - 22, sy - 22, 44, 44, 12); g.fillStyle = done ? rgba(c.ok ? C.green : C.red, .25) : 'rgba(255,255,255,.05)'; g.fill(); g.lineWidth = 2.5; g.strokeStyle = done ? (c.ok ? C.green : C.red) : rgba(C.amber, .7); g.stroke(); if (done) { if (c.ok) check(x - 2, sy, 10, C.green, 1, 4, pr(t, c.s + 1.0, c.s + 1.2)); else cross(x, sy, 8, C.red, 1, 4); } }
    txt('limited traffic only', 944, sy + 8, { size: 22, font: F.m, weight: 400, align: 'right', color: C.amber });
  } else {
    const src = t < tHalf ? P.calls : (t >= tClose && t < tAlt) ? P.calls2 : [], win = src.filter(c => c.c <= t).slice(-10), fails = win.filter(c => !c.ok).length, rate = fails * 10, frozen = cur === 'O';
    txt('LAST 10 CALLS', 84, sy + 8, { size: 22, font: F.m, weight: 700, ls: 2, color: C.dim });
    for (let i = 0; i < 10; i++) { const c = win[i], x = 318 + i * 41; if (!c) { ring(x, sy, 12, 'rgba(255,255,255,.18)', 1, 2); continue; } const fresh = 1 - pr(t, c.c, c.c + .3); circ(x, sy, 13 + fresh * 5, c.ok ? C.green : C.red, frozen ? .55 : 1, c.ok ? 6 : 14); }
    const rc = rate >= 50 ? C.red : rate >= 30 ? C.amber : C.green, pp = t >= tTrip && t < tTrip + .5 ? 1 + (1 - pr(t, tTrip, tTrip + .5)) * .3 : 1;
    g.save(); g.translate(944, sy + 10); g.scale(pp, pp); txt(t >= tReopen ? 'calls rejected' : `${rate}% failed`, 0, 0, { size: 26, font: F.m, weight: 700, align: 'right', color: t >= tReopen ? C.red : rc, glow: rate >= 50 ? 16 : 0 }); g.restore();
  }
  // readout
  const R = P.read[ti], ra = E.out(pr(since, .02, .3)), ry = 1280;
  const o1 = { size: 27, weight: 800, font: F.m, ls: 1 }, o2 = { size: 33, weight: 600 }, w1 = tw(R[0], o1) + 44, w2 = tw(R[1], o2), tot = w1 + 22 + w2, xx = 512 - tot / 2;
  pill(xx + w1 / 2, ry, R[0], col, { size: 27, weight: 800, a: ra, solid: true, w: w1, h: 52, glow: 18 }); txt(R[1], xx + w1 + 22, ry + 2, { ...o2, base: 'middle', a: ra });
  g.restore();
};
SCN.how.init = s => {
  const h = [0, 1, 2, 3, 4, 5, 6].map(i => L('how', i)), hop = .42;
  const tTrip = at(h[2], 'trips', .08), tHalf = at(h[4], 'half-open', .05), tClose = at(h[5], 'closes', -.05), tAlt = h[6].start - .08, tReopen = Math.max(at(h[6], 'opens', .05), tAlt + .95);
  const calls = []; let k = 0; for (let c = tTrip; c - 2 * hop > h[1].start + .1; c -= .44, k++) calls.push({ s: c - 2 * hop, c, ok: ![0, 1, 3, 5, 7].includes(k) }); calls.reverse();
  const calls2 = []; for (let sp = tClose + .22; sp < tAlt - .25; sp += .44) calls2.push({ s: sp, c: sp + 2 * hop, ok: true });
  const rej = []; for (let sp = tTrip + .3; sp < tHalf - .35; sp += .36) rej.push(sp);
  const tTrial = at(h[4], 'lets', .1), trials = [0, 1, 2].map(i => ({ s: tTrial + i * .55, ok: true })); trials.push({ s: tAlt + .0, ok: false });
  const tr = [{ t: -1, to: 'C' }, { t: tTrip, to: 'O' }, { t: tHalf, to: 'H' }, { t: tClose, to: 'C' }, { t: tAlt, to: 'H' }, { t: tReopen, to: 'O' }];
  const read = [['CLOSED', 'requests pass through'], ['OPEN', 'fail fast · no call made'], ['HALF-OPEN', 'a few trial requests'], ['CLOSED', 'recovered · traffic resumes'], ['HALF-OPEN', 'what if a trial fails?'], ['OPEN', 'back to waiting']];
  SCN.how.P = { h, tTrip, tHalf, tClose, tAlt, tReopen, calls, calls2, rej, trials, tr, read };
  [0, 1, 2].forEach(i => cue(s.start + .16 + i * .22, 'pop', .6)); calls.filter(c => !c.ok).forEach(c => cue(c.c, 'blip', .5)); cue(tTrip, 'switch', 1); cue(tTrip + .02, 'error', .5);
  rej.forEach((r, i) => { if (i % 2 === 0) cue(r + .2, 'tick', .45); }); cue(tHalf, 'confirm', .7); trials.slice(0, 3).forEach(c => cue(c.s + 1.0, 'ping', .6)); cue(tClose, 'positive', .9); cue(tAlt + .98, 'blip', .7); cue(tReopen, 'switch', .9);
};

// =============== 5. REAL-WORLD EXAMPLE ===============
SCN.example = (t, s) => {
  const P = SCN.example.P, { e, tBank, tOpen, tFb, tRq, rv } = P, X = 350, N = [{ y: 385, h: 84, w: 300 }, { y: 535, h: 100, w: 440 }, { y: 705, h: 100, w: 440 }, { y: 875, h: 100, w: 440 }, { y: 1142, h: 110, w: 440 }];
  const SEG = [[N[0].y + 42, N[1].y - 50], [N[1].y + 50, N[2].y - 50], [N[2].y + 50, N[3].y - 50], [N[3].y + 50, N[4].y - 55]];
  const down = pr(t, tBank, tBank + .25), open = t >= tOpen, pp = rv.map(x => pop(t, x));
  tint(C.red, .12 * down * (1 - .6 * pr(t, tOpen, tOpen + 1)));
  SEG.forEach((sg, k) => seg(X, sg[0], X, sg[1], k === 3 ? rgba(mix(C.cyan, C.red, down), .4) : 'rgba(120,150,230,.38)', Math.min(pp[k].a, pp[k + 1].a), 3));
  // requests
  let okCount = 0;
  for (const r of P.req) { for (const lg of r.legs) { const sg = SEG[lg.k], u = (t - lg.a) / lg.d, y0 = lg.y0 ?? (lg.dir > 0 ? sg[0] : sg[1]), y1 = lg.y1 ?? (lg.dir > 0 ? sg[1] : sg[0]), dx = lg.dir > 0 ? -11 : 11; pkt(X + dx, y0, X + dx, y1, u, lg.col, { r: 9 }); } if (r.okAt && t >= r.okAt) okCount++; }
  // nodes
  const bankCol = mix(C.cyan, C.red, down), brCol = open ? C.red : C.green;
  svc(X, N[0].y, N[0].w, N[0].h, { label: 'Checkout', size: 30, icon: 'cart', col: C.violet, a: pp[0].a, s: pp[0].s, glow: .35 });
  svc(X, N[1].y, N[1].w, N[1].h, { label: 'API Gateway', size: 32, icon: 'gateway', col: C.cyan, a: pp[1].a, s: pp[1].s, glow: .35 });
  svc(X, N[2].y, N[2].w, N[2].h, { label: 'Order Service', size: 32, icon: 'server', col: C.cyan, a: pp[2].a, s: pp[2].s, glow: .35 });
  svc(X, N[3].y, N[3].w, N[3].h, { label: 'Payment Service', size: 32, icon: 'card', col: C.cyan, a: pp[3].a, s: pp[3].s, glow: .35 });
  svc(X, N[4].y, N[4].w, N[4].h, { label: 'Bank API', sub: down > .5 ? 'DOWN · timeouts' : 'external', size: 32, icon: 'bank', dashed: true, col: bankCol, subCol: down > .5 ? C.red : C.dim, a: pp[4].a, s: pp[4].s, glow: .35 + down * .5 * (.65 + .35 * Math.sin(t * 8)) });
  if (down > 0) { const u = pr(t, tBank, tBank + .8); ring(X, N[4].y, 80 + E.out(u) * 300, C.red, (1 - u) * .7, 5); }
  const by = (SEG[3][0] + SEG[3][1]) / 2 + 2;
  breaker(X, by, { rot: Math.PI / 2, w: 96, h: 92, col: brCol, open: open ? E.back(pr(t, tOpen, tOpen + .3)) : 0, a: pp[4].a });
  pill(X + 150, by, open ? 'OPEN' : 'CLOSED', brCol, { size: 22, a: pp[4].a, s: 1 + (open ? (1 - pr(t, tOpen, tOpen + .35)) * .3 : 0), glow: open ? 20 : 0 });
  txt('BREAKER', X - 66, by + 7, { size: 19, font: F.m, weight: 700, ls: 3, align: 'right', color: C.dim, a: pp[4].a });
  if (open) { const u = pr(t, tOpen, tOpen + .7); ring(X, by, 50 + E.out(u) * 200, C.red, (1 - u) * .8, 5); }
  // right column: orders counter
  const ca = slide(t, e[1].start + .2, .45, 30); if (ca.a > 0) {
    g.save(); g.globalAlpha *= ca.a; g.translate(0, ca.y); panel(626, 462, 350, 176, { stroke: rgba(C.green, .4) });
    txt('ORDERS ACCEPTED', 654, 512, { size: 22, font: F.m, weight: 700, ls: 2, color: C.dim });
    const last = P.req.filter(r => r.okAt && t >= r.okAt).pop(), bump = last ? 1 - pr(t, last.okAt, last.okAt + .3) : 0;
    g.save(); g.translate(654, 600); g.scale(1 + bump * .08, 1 + bump * .08); txt((1204 + okCount).toLocaleString('en-US'), 0, 0, { size: 76, weight: 800, font: F.d, color: mix(C.green, '#FFFFFF', bump * .6), glow: 14 + bump * 20, glowCol: C.green }); g.restore(); g.restore();
  }
  // fallback card
  const fa = slide(t, tFb, .45, 30); if (fa.a > 0) {
    g.save(); g.globalAlpha *= fa.a; g.translate((1 - fa.a) * 40, 0); seg(570, 875, 626, 875, rgba(C.amber, .7), 1, 3, [6, 8]); panel(626, 782, 350, 196, { stroke: rgba(C.amber, .6) });
    txt('FALLBACK RESPONSE', 654, 830, { size: 21, font: F.m, weight: 700, ls: 2, color: C.amber });
    const full = ['202 Accepted', '"status":', '"PAYMENT_PENDING"'], cols = [C.text, C.dim, C.amber], nCh = Math.floor(pr(t, tFb + .2, tFb + 1.3) * 40); let used = 0;
    full.forEach((ln, i) => { const sh = ln.slice(0, Math.max(0, nCh - used)); used += ln.length; txt(sh, 654, 876 + i * 37, { size: 27, font: F.m, weight: i === 2 ? 700 : 400, color: cols[i] }); }); g.restore();
  }
  // retry queue
  const qa = slide(t, tRq, .45, 30); if (qa.a > 0) {
    g.save(); g.globalAlpha *= qa.a; g.translate(0, qa.y); panel(626, 1052, 350, 164, { stroke: 'rgba(120,150,230,.35)' }); txt('RETRY QUEUE', 654, 1100, { size: 21, font: F.m, weight: 700, ls: 2, color: C.dim });
    const q = P.req.filter(r => r.mode === 'open' && r.okAt && t >= r.okAt - .5).length;
    for (let i = 0; i < 5; i++) { const on = i < Math.max(1, q), x = 654 + i * 59; rr(x, 1128, 44, 58, 10); g.fillStyle = on ? rgba(C.amber, .22) : 'rgba(255,255,255,.04)'; g.fill(); g.lineWidth = 2; g.strokeStyle = on ? C.amber : 'rgba(255,255,255,.14)'; g.stroke(); if (on) glyph('card', x + 22, 1157, 13, C.amber); }
    g.restore();
  }
  // punchline
  const fa2 = slide(t, e[4].start - .1, .4, 30); if (fa2.a > 0) rich([['Bank is down. ', C.red], ['Checkout still works.', C.green]], 540, 1312 + fa2.y, { size: 44, weight: 800, font: F.d, align: 'center', a: fa2.a });
};
SCN.example.init = s => {
  const e = [0, 1, 2, 3, 4].map(i => L('example', i)), tBank = at(e[2], 'goes down', 0), tOpen = at(e[3], 'opens', -.08), tFb = at(e[3], 'fallback', -.2), tRq = at(e[3], "we'll retry", -.15);
  const pay2 = e[1].start + e[1].text.indexOf('payments calls') / e[1].text.length * (e[1].end - e[1].start);
  const rv = [s.start + .12, e[0].start + .5, e[1].start - .02, at(e[1], 'payments', -.2), pay2 + .15];
  const req = [];
  // first request: narrated hop by hop
  const d0 = [e[0].start + .62, e[1].start + .12, at(e[1], 'payments', -.02), pay2 + .42], legs0 = d0.map((a, k) => ({ a, d: .4, k, dir: 1, col: C.cyan })); let b = pay2 + 1.0; for (let k = 3; k >= 0; k--) { legs0.push({ a: b, d: .2, k, dir: -1, col: C.green }); b += .2; } req.push({ legs: legs0, okAt: b, mode: 'ok' });
  const H = .24, mk = (st) => { const legs = []; for (let k = 0; k < 3; k++) legs.push({ a: st + k * H, d: H, k, dir: 1, col: C.cyan }); const tp = st + 3 * H; let bb, mode;
    if (tp >= tOpen) { mode = 'open'; legs.push({ a: tp, d: .12, k: 3, dir: 1, col: C.cyan, y0: 925, y1: 950 }); legs.push({ a: tp + .13, d: .12, k: 3, dir: -1, col: C.amber, y0: 950, y1: 925 }); bb = tp + .3; for (let k = 2; k >= 0; k--) { legs.push({ a: bb, d: .2, k, dir: -1, col: C.amber }); bb += .2; } return { legs, okAt: bb, mode }; }
    legs.push({ a: tp, d: H, k: 3, dir: 1, col: C.cyan }); if (tp + H < tBank) { mode = 'ok'; bb = tp + H + .12; for (let k = 3; k >= 0; k--) { legs.push({ a: bb, d: .2, k, dir: -1, col: C.green }); bb += .2; } return { legs, okAt: bb, mode }; }
    mode = 'timeout'; bb = tp + H + .55; for (let k = 3; k >= 0; k--) { legs.push({ a: bb, d: .2, k, dir: -1, col: C.red }); bb += .2; } return { legs, failAt: tp + H + .55, mode }; };
  req.push(mk(e[2].start + .3)); req.push(mk(e[2].start + .95)); for (let st = tOpen - 3 * H + .12; st < s.end - .4; st += .58) req.push(mk(st));
  SCN.example.P = { e, tBank, tOpen, tFb, tRq, rv, req };
  rv.forEach((x, i) => cue(x, 'pop', .5)); cue(req[0].okAt, 'ping', .7); cue(tBank, 'error', 1); req.filter(r => r.failAt).forEach(r => cue(r.failAt, 'blip', .6)); cue(tOpen, 'switch', 1); cue(tFb, 'confirm', .7); cue(tRq, 'pop', .5);
  req.filter(r => r.mode === 'open').forEach(r => cue(r.okAt, 'ping', .4)); cue(e[4].start - .1, 'positive', .8);
};

// =============== 6. BEFORE vs AFTER ===============
SCN.compare = (t, s) => {
  const P = SCN.compare.P, c0 = L('compare', 0), c1 = L('compare', 1), xs = [280, 744], w = 404, ys = [536, 700, 864, 1028, 1212];
  const dimL = lerp(1, .6, E.io(pr(t, c1.start - .1, c1.start + .4)));
  seg(512, 360, 512, 1290, 'rgba(140,170,255,.18)', E.out(pr(t, s.start + .1, s.start + .6)), 2, [4, 10]);
  [['WITHOUT', C.red, P.tL, dimL], ['WITH', C.green, P.tR, 1]].forEach(([head, col, ts, dim], ci) => {
    const x = xs[ci], ha = slide(t, ci ? c1.start - .25 : s.start + .1, .4, 30), pre = ci ? lerp(.3, 1, ha.a) * E.out(pr(t, s.start + .3, s.start + .7)) : ha.a;
    g.save(); g.globalAlpha *= dim; txt(head, x, 392, { size: 50, weight: 900, font: F.d, ls: 5, align: 'center', color: col, a: pre, glow: 18 }); txt('circuit breaker', x, 432, { size: 24, font: F.m, weight: 400, align: 'center', color: C.dim, a: pre });
    P.steps[ci].forEach((label, i) => {
      const p = pop(t, ts[i], .45); if (p.a <= 0) return; const y = ys[i], fin = i === 4, hgt = fin ? 136 : 116;
      if (i) { const pa = E.out(pr(t, ts[i] - .12, ts[i] + .15)); arrow(x, ys[i - 1] + 58 + 8, x, y - hgt / 2 - 12, rgba(col, .75), pa, pa, 3); }
      g.save(); g.translate(x, y); g.scale(p.s, p.s); g.globalAlpha *= p.a; rr(-w / 2, -hgt / 2, w, hgt, 22);
      if (fin) { g.shadowColor = rgba(col, .8); g.shadowBlur = 40; g.fillStyle = col; g.fill(); g.shadowBlur = 0; const o = { size: 38, weight: 900, font: F.d, ls: 2 }; o.size = fit(label, w - 124, o); txt(label, 18, 2, { ...o, align: 'center', base: 'middle', color: '#06101C' }); const lw2 = tw(label, o); if (ci) check(-lw2 / 2 - 22, 0, 12, '#06101C', 1, 5); else cross(-lw2 / 2 - 22, 0, 10, '#06101C', 1, 5); }
      else { g.fillStyle = mix(C.panel, col, .10); g.fill(); g.lineWidth = 2.5; g.strokeStyle = rgba(col, .75); g.stroke(); circ(-w / 2 + 40, 0, 17, rgba(col, .2)); txt(String(i + 1), -w / 2 + 40, 2, { size: 22, font: F.m, weight: 700, align: 'center', base: 'middle', color: col }); const o = { size: 34, weight: 700 }; o.size = fit(label, w - 96, o); txt(label, -w / 2 + 74, 2, { ...o, base: 'middle' }); }
      g.restore();
    }); g.restore();
  });
  tint(C.red, .12 * pr(t, P.tL[4], P.tL[4] + .2) * (1 - pr(t, c1.start - .2, c1.start + .3)));
};
SCN.compare.init = s => {
  const c0 = L('compare', 0), c1 = L('compare', 1);
  SCN.compare.P = { steps: [['Service fails', 'Retries pile up', 'Threads exhausted', 'Cascading failure', 'SYSTEM DOWN'], ['Service fails', 'Failure detected', 'Breaker opens', 'Fail fast + fallback', 'SYSTEM STABLE']],
    tL: [c0.start + .1, at(c0, 'retries', -.1), at(c0, 'exhausted', -.1), at(c0, 'cascading', -.15), c0.end - .05], tR: [c1.start + .05, c1.start + .4, at(c1, 'requests', -.05), at(c1, 'fall back', -.25), at(c1, 'stays', -.05)] };
  const P = SCN.compare.P; P.tL.forEach((x, i) => cue(x, i === 4 ? 'error' : 'pop', i === 4 ? .8 : .5)); P.tR.forEach((x, i) => cue(x, i === 4 ? 'positive' : 'pop', i === 4 ? .9 : .5));
};

// =============== 7. TAKEAWAYS ===============
SCN.takeaways = (t, s) => {
  const k = [0, 1, 2, 3].map(i => L('takeaways', i));
  let a = slide(t, k[0].start - .2, .45, 40); rich([['Remember ', C.text], ['3', C.cyan], [' things', C.text]], 540, 420 + a.y, { size: 82, weight: 900, font: F.d, align: 'center', a: a.a });
  const cards = [[k[1].start - .1, '01', 'Stops cascading failures', C.red], [k[2].start - .1, '02', '3 states', C.amber], [k[3].start - .1, '03', 'Pair with timeouts + fallback', C.green]];
  cards.forEach(([ts, num, title, col], i) => {
    const p = pop(t, ts, .5); if (p.a <= 0) return; const y = 612 + i * 246, x = 524, w = 872, h = 216, dx = (1 - E.out(p.u)) * 90;
    g.save(); g.translate(x + dx, y); g.scale(p.s, p.s); g.globalAlpha *= p.a; rr(-w / 2, -h / 2, w, h, 28); g.shadowColor = rgba(col, .35); g.shadowBlur = 40; g.fillStyle = C.panel; g.fill(); g.shadowBlur = 0;
    const gr = g.createLinearGradient(-w / 2, 0, w / 2, 0); gr.addColorStop(0, rgba(col, .2)); gr.addColorStop(.6, rgba(col, .03)); g.fillStyle = gr; g.fill(); g.lineWidth = 2.5; g.strokeStyle = rgba(col, .7); g.stroke();
    txt(num, -w / 2 + 44, 26, { size: 84, weight: 900, font: F.d, color: col, glow: 20 });
    const tx = -w / 2 + 190, o = { size: 48, weight: 800, font: F.d }; o.size = fit(title, w - 230, o); txt(title, tx, -16, o);
    if (i === 0) txt('one bad dependency stays one bad dependency', tx, 44, { size: 25, font: F.m, weight: 400, color: C.dim });
    if (i === 1) { let xx = tx; [['CLOSED', C.green], ['OPEN', C.red], ['HALF-OPEN', C.amber]].forEach(([lb, c], j) => { const pa = pop(t, ts + .35 + j * .28, .4), ww = tw(lb, { size: 23, weight: 700, font: F.m, ls: 1 }) + 40; pill(xx + ww / 2, 40, lb, c, { size: 23, a: pa.a, s: pa.s, w: ww, h: 48 }); xx += ww + 14; if (j < 2) { txt('→', xx, 48, { size: 26, color: C.dim, a: pa.a, weight: 400 }); xx += 38; } }); }
    if (i === 2) txt('without a fallback, you just fail faster', tx, 44, { size: 25, font: F.m, weight: 400, color: C.dim });
    g.restore();
  });
  a = slide(t, k[3].end - .5, .45, 30); rich([['Not a retry: ', C.cyan], ['retries handle blips, breakers handle outages', C.dim]], 524, 1296 + a.y, { size: 29, weight: 600, align: 'center', a: a.a });
  a = slide(t, k[3].end - .3, .45, 30); txt('Resilience4j  ·  Polly  ·  Istio', 524, 1346 + a.y, { size: 24, font: F.m, weight: 400, align: 'center', color: C.faint, a: a.a });
};
SCN.takeaways.init = s => { const k = [0, 1, 2, 3].map(i => L('takeaways', i)); cue(k[0].start - .2, 'swish', .5);[1, 2, 3].forEach(i => cue(k[i].start - .1, 'pop', .8)); };

// =============== 8. SUMMARY ===============
SCN.summary = (t, s) => {
  const l = L('summary', 0), z = lerp(1, 1.09, E.io(pr(t, s.start, s.end)));
  g.save(); g.translate(540, 860); g.scale(z, z); g.translate(-540, -860);
  const gr = g.createRadialGradient(540, 860, 0, 540, 860, 620); gr.addColorStop(0, rgba(C.cyan, .16)); gr.addColorStop(1, rgba(C.cyan, 0)); g.save(); g.globalAlpha *= E.out(pr(t, s.start, s.start + .8)); g.fillStyle = gr; g.fillRect(0, 200, W, 1400); g.restore();
  const ba = pop(t, s.start + .1, .5); breaker(540, 520, { w: 250, h: 136, col: mix(C.green, C.red, pr(t, at(l, 'stops'), at(l, 'stops') + .2)), open: E.back(pr(t, at(l, 'stops'), at(l, 'stops') + .32)), a: ba.a, s: ba.s });
  let a = slide(t, l.start - .1, .4, 30); txt('CIRCUIT BREAKER  =', 540, 700 + a.y, { size: 36, font: F.m, weight: 700, ls: 4, align: 'center', color: C.cyan, a: a.a });
  const rows = [[[['Stop calling', C.text]], l.start + .25], [[["what's broken,", C.red]], at(l, "what's", -.05)], [[['so everything else', C.text]], at(l, 'so everything', -.05)], [[['keeps working.', C.green]], at(l, 'keeps', -.05)]];
  rows.forEach(([segs, ts], i) => { const u = pr(t, ts, ts + .35); if (u <= 0) return; g.save(); g.translate(540, 830 + i * 112); const sc = lerp(1.25, 1, E.expo(u)); g.scale(sc, sc); rich(segs, 0, 0, { size: 92, weight: 900, font: F.d, align: 'center', a: E.out(u), glow: segs[0][1] === C.text ? 0 : 26 }); g.restore(); });
  g.restore();
};
SCN.summary.init = s => { const l = L('summary', 0); cue(l.start - .1, 'thud', 1); cue(l.start, 'chime', .8); cue(at(l, 'stops'), 'switch', .7); cue(at(l, 'keeps', -.05), 'positive', .7); };

// =============== 9. CTA ===============
function heart(x, y, s, col, fill) { g.save(); g.translate(x, y); g.scale(s, s); g.beginPath(); g.moveTo(0, 9); g.bezierCurveTo(-22, -7, -12, -24, 0, -11); g.bezierCurveTo(12, -24, 22, -7, 0, 9); g.closePath(); if (fill) { g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 8; g.fill(); } else { g.strokeStyle = col; g.lineWidth = 2.6; g.lineJoin = 'round'; g.stroke(); } g.restore(); }
function bookmark(x, y, s, col, fill) { g.save(); g.translate(x, y); g.scale(s, s); g.beginPath(); g.moveTo(-10, -15); g.lineTo(10, -15); g.lineTo(10, 15); g.lineTo(0, 7); g.lineTo(-10, 15); g.closePath(); if (fill) { g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 8; g.fill(); } else { g.strokeStyle = col; g.lineWidth = 2.6; g.lineJoin = 'round'; g.stroke(); } g.restore(); }
function bell(x, y, s, col, rot, fill) { g.save(); g.translate(x, y - 16 * s); g.rotate(rot); g.translate(0, 16 * s); g.scale(s, s); g.beginPath(); g.moveTo(-13, 9); g.quadraticCurveTo(-9, 4, -9, -4); g.quadraticCurveTo(-9, -15, 0, -15); g.quadraticCurveTo(9, -15, 9, -4); g.quadraticCurveTo(9, 4, 13, 9); g.closePath(); g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 2.6; g.lineJoin = 'round'; if (fill) { g.shadowColor = col; g.shadowBlur = 8; g.fill(); } else g.stroke(); g.beginPath(); g.arc(0, 13, 3.4, 0, 7); g.fill(); g.restore(); }
SCN.cta = (t, s) => {
  const P = SCN.cta.P, { c0, c1, tFollow, tLike, tSave, tBell } = P;
  let a = slide(t, c0.start - .15, .4, 40); txt('Follow for more', 540, 520 + a.y, { size: 50, weight: 600, align: 'center', color: C.dim, a: a.a });
  let u = pr(t, at(c0, 'system', -.1), at(c0, 'system', .25)); if (u > 0) { g.save(); g.translate(540, 640); const sc = lerp(1.35, 1, E.expo(u)); g.scale(sc, sc); txt('System Design', 0, 0, { size: 118, weight: 900, font: F.d, align: 'center', a: E.out(u), glow: 30, glowCol: rgba(C.cyan, .6) }); g.restore(); }
  a = slide(t, at(c0, 'explained', -.1), .4, 30); txt('explained visually', 540, 730 + a.y, { size: 52, weight: 700, align: 'center', color: C.cyan, a: a.a });
  // follow button
  const fp = pop(t, c0.start + .5, .5), pressed = t >= tFollow, pu = pr(t, tFollow, tFollow + .35), press = pressed ? 1 - Math.sin(pu * Math.PI) * .1 : 1;
  if (fp.a > 0) { g.save(); g.translate(540, 920); g.scale(fp.s * press, fp.s * press); g.globalAlpha *= fp.a; const w = 380, h = 104; rr(-w / 2, -h / 2, w, h, h / 2);
    if (!pressed) { g.shadowColor = rgba(C.cyan, .7); g.shadowBlur = 40; g.fillStyle = C.cyan; g.fill(); g.shadowBlur = 0; txt('+  Follow', 0, 3, { size: 44, weight: 800, font: F.d, align: 'center', base: 'middle', color: '#06101C' }); }
    else { g.fillStyle = mix(C.panel, C.cyan, .14); g.fill(); g.lineWidth = 3; g.strokeStyle = C.cyan; g.stroke(); const o = { size: 42, weight: 800, font: F.d }, lw = tw('Following', o); txt('Following', -lw / 2 + 22, 3, { ...o, base: 'middle', color: C.cyan }); check(-lw / 2 - 16, 0, 13, C.cyan, 1, 5, pr(t, tFollow + .05, tFollow + .35)); }
    g.restore(); if (pressed && pu < 1) ring(540, 920, 120 + E.out(pu) * 170, C.cyan, (1 - pu) * .7, 4); }
  // icon row
  const icons = [[330, 'Like', tLike, C.red], [540, 'Save', tSave, C.amber], [750, 'Subscribe', tBell, C.cyan]];
  icons.forEach(([x, lab, ta, col], i) => {
    const p = pop(t, c0.end - .35 + i * .12, .5); if (p.a <= 0) return; const on = t >= ta, ou = pr(t, ta, ta + .4), bounce = on ? 1 + Math.sin(ou * Math.PI) * .25 : 1, y = 1110;
    g.save(); g.translate(x, y); g.scale(p.s * bounce, p.s * bounce); g.globalAlpha *= p.a; g.beginPath(); g.arc(0, 0, 62, 0, 7); g.shadowColor = rgba(col, on ? .6 : 0); g.shadowBlur = 34; g.fillStyle = mix(C.panel, col, on ? .2 : .04); g.fill(); g.shadowBlur = 0; g.lineWidth = 2.5; g.strokeStyle = on ? col : 'rgba(150,170,220,.4)'; g.stroke();
    const ic = on ? col : '#C9D3EE'; if (i === 0) heart(0, 2, 2.1, ic, on); if (i === 1) bookmark(0, 0, 1.75, ic, on); if (i === 2) bell(0, 0, 1.9, ic, on ? Math.sin(ou * Math.PI * 5) * .35 * (1 - ou) : 0, on); g.restore();
    if (on && ou < 1) ring(x, y, 62 + E.out(ou) * 60, col, (1 - ou) * .8, 3);
    txt(lab, x, y + 108, { size: 26, weight: 600, align: 'center', color: on ? C.text : C.dim, a: p.a });
  });
  a = slide(t, c1.start - .05, .45, 30); rich([['Save this', C.amber], [' for your next interview', C.text]], 540, 1338 + a.y, { size: 46, weight: 800, font: F.d, align: 'center', a: a.a });
};
SCN.cta.init = s => {
  const c0 = L('cta', 0), c1 = L('cta', 1), P = { c0, c1, tFollow: c0.end - .05, tLike: c0.end + .12, tSave: at(c1, 'save', .12), tBell: c1.end - .1 };
  SCN.cta.P = P; cue(at(c0, 'system', -.1), 'thud', .6); cue(P.tFollow, 'click', 1); cue(P.tLike, 'pop', .7); cue(P.tSave, 'click', .9); cue(P.tBell, 'bell', .9);
};
