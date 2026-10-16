'use strict';
// Saga Pattern — scene code. Uses engine/core.js + engine/lib.js.
const SV = [{ n: 'Order', ic: 'cart', col: C.cyan, db: 'orders db' }, { n: 'Payment', ic: 'card', col: C.violet, db: 'payments db' }, { n: 'Inventory', ic: 'container', col: C.amber, db: 'stock db' }];
const XS = [240, 540, 840];
function service(x, y, i, o = {}) { const d = SV[i]; svc(x, y, o.w ?? 240, o.h ?? 100, { label: d.n, sub: o.sub, subSize: 19, size: o.size ?? 27, icon: d.ic, col: o.col ?? d.col, a: o.a, s: o.s, glow: o.glow ?? .4, dashed: o.dashed, subCol: o.subCol }); }
// database cylinder with soft disc behind
function dbIcon(x, y, col, a = 1, s = 1) { if (a <= 0) return; g.save(); g.globalAlpha *= a; g.translate(x, y); g.scale(s, s); circ(0, 0, 50, rgba(col, .12)); ring(0, 0, 50, rgba(col, .5), 1, 2); glyph('db', 0, 0, 40, col); g.restore(); }
// status mark: 'ok' | 'bad' | 'undo'
function mark(kind, x, y, s, a = 1, p = 1) {
  if (a <= 0) return; const col = kind === 'ok' ? C.green : kind === 'bad' ? C.red : C.amber; circ(x, y, s, mix(C.panel, col, .3), a); ring(x, y, s, col, a, 3);
  if (kind === 'ok') check(x + s * .12, y - s * .05, s * .42, col, a, 4, p); else if (kind === 'bad') cross(x, y, s * .35, col, a * p, 4);
  else { const r = s * .45, e = 5.2; ring(x, y, r, col, a * p, 3.5, .7, e); arrowHead(x + r * Math.cos(e), y + r * Math.sin(e), e + Math.PI / 2, col, 9, a * p); }
}

// =============== HOOK ===============
SCN.hook = (t, s) => {
  const P = SCN.hook.P, z = lerp(1, 1.06, pr(t, s.start, s.end)), l0 = s.lines[0], l1 = s.lines[1];
  const sh = t >= P.tPress ? Math.pow(1 - pr(t, P.tPress, P.tPress + .45), 2) * 14 : 0;
  g.save(); g.translate(Math.sin(t * 91) * sh, Math.cos(t * 79) * sh);
  g.save(); g.translate(540, 860); g.scale(z, z); g.translate(-540, -860);
  XS.forEach((x, i) => {
    const p = pop(t, s.start + .1 + i * .12, .5); if (p.a <= 0) return;
    seg(x, 772, x, 860, 'rgba(120,150,230,.35)', p.a, 3);
    service(x, 720, i, { a: p.a, s: p.s });
    const lost = t >= P.tPress + .35, dcol = lost ? C.red : C.green; dbIcon(x, 905, dcol, p.a);
    const cp = pop(t, s.start + .9 + i * .35, .4); if (cp.a > 0) pill(x, 1000, lost ? 'can\'t undo' : 'committed', dcol, { size: 19, a: cp.a, s: cp.s, h: 36 });
    if (i < 2) arrow(x + 124, 720, XS[i + 1] - 128, 720, rgba(C.cyan, .7), E.out(pr(t, s.start + .5 + i * .35, s.start + .8 + i * .35)), p.a, 3);
  });
  // a transaction token hopping across the services
  for (let i = 0; i < 2; i++) pkt(XS[i] + 120, 720, XS[i + 1] - 120, 720, (t - (s.start + .7 + i * .35)) / .3, C.cyan, { r: 8 });
  // rollback button
  const bp = pop(t, l1.start - .25, .45);
  if (bp.a > 0) {
    const pressed = t >= P.tPress, pu = pr(t, P.tPress, P.tPress + .3), sc = pressed ? 1 - Math.sin(pu * Math.PI) * .08 : 1, col = pressed ? C.red : C.text;
    // dashed reach towards the databases, falling short
    if (pressed) XS.forEach((x, i) => { const u = E.out(pr(t, P.tPress + .05, P.tPress + .45)); const ex = lerp(540, x, .55 * u), ey = lerp(1150, 1000, .55 * u); seg(540, 1150, ex, ey, rgba(C.red, .8), 1, 3, [8, 8]); if (u >= 1) cross(ex, ey, 10, C.red, pr(t, P.tPress + .45, P.tPress + .6), 4); });
    g.save(); g.translate(540, 1200); g.scale(bp.s * sc, bp.s * sc); g.globalAlpha *= bp.a; rr(-230, -52, 460, 104, 52);
    g.shadowColor = rgba(col, .6); g.shadowBlur = pressed ? 40 : 20; g.fillStyle = mix(C.panel, col, pressed ? .25 : .1); g.fill(); g.shadowBlur = 0; g.lineWidth = 3; g.strokeStyle = col; g.stroke();
    txt('ROLLBACK ALL', 22, 3, { size: 38, weight: 900, font: F.d, ls: 2, align: 'center', base: 'middle', color: col });
    ring(-168, 0, 16, col, 1, 4, .7, 5.2); arrowHead(-168 + 16 * Math.cos(5.2), 16 * Math.sin(5.2), 5.2 + Math.PI / 2, col, 10); g.restore();
    if (pressed) { const xa = pop(t, P.tPress + .2, .4); g.save(); g.translate(540, 1200); g.scale(xa.s, xa.s); g.rotate(-.12); pill(0, -78, 'NOT AVAILABLE', C.red, { size: 22, solid: true, a: xa.a, glow: 18 }); g.restore(); }
  }
  g.restore();
  if (t >= P.tPress) tint(C.red, .26 * (1 - .5 * pr(t, P.tPress + .2, P.tPress + 1)));
  g.restore();
  let a = slide(t, l0.start - .2, .45, 50); txt('UNDO A TRANSACTION', 540, 400 + a.y, { size: 70, weight: 800, font: F.d, ls: 2, align: 'center', a: a.a });
  const u = pr(t, P.tAcross - .1, P.tAcross + .22); if (u > 0) { g.save(); g.translate(540, 506); const k = lerp(1.6, 1, E.expo(u)); g.scale(k, k); txt('ACROSS 3 SERVICES?', 0, 0, { size: 84, weight: 900, font: F.d, align: 'center', color: C.cyan, a: E.out(u), glow: 30 }); g.restore(); }
};
SCN.hook.init = s => {
  const P = { tAcross: cueT(s, [0, 'across', -.05]), tPress: cueT(s, [1, 'rollback', -.05]) }; SCN.hook.P = P;
  cue(s.lines[0].start - .25, 'whoosh', .7); [0, 1, 2].forEach(i => cue(s.start + .1 + i * .12, 'pop', .4)); cue(P.tAcross, 'thud', .8);
  cue(s.lines[1].start - .25, 'blip', .5); cue(P.tPress, 'click', .9); cue(P.tPress + .08, 'error', 1);
};

// =============== PROBLEM ===============
SCN.problem = (t, s) => {
  const P = SCN.problem.P, split = E.io(pr(t, P.tSplit, P.tSplit + .7)), mono = 1 - split;
  // monolith frame
  const fa = E.out(pr(t, s.start + .05, s.start + .45)) * mono;
  if (fa > 0) { g.save(); g.globalAlpha *= fa; panel(100, 590, 880, 210, { stroke: rgba(C.cyan, .5), r: 30 }); txt('MONOLITH', 130, 628, { size: 22, font: F.m, weight: 700, ls: 4, color: C.dim }); g.restore(); }
  XS.forEach((x, i) => {
    const p = pop(t, s.start + .2 + i * .1, .5), y = lerp(712, 690, split), w = lerp(232, 240, split);
    const failed = i === 2 && t >= P.tFail, pend = i === 0 && t >= P.tCharged, fl = failed ? 1 - pr(t, P.tFail, P.tFail + .6) : 0;
    service(x, y, i, { a: p.a, s: p.s * (1 + fl * .08), w, h: lerp(88, 100, split), col: failed ? C.red : undefined, sub: failed ? 'FAILED' : pend ? 'PENDING…' : undefined, subCol: failed ? C.red : C.amber, glow: failed ? .9 : .4 });
    if (fl > 0) ring(x, y, 90 + (1 - fl) * 110, C.red, fl * .7, 4);
    // service -> its db
    const dx = lerp(540, x, split), da = i === 1 ? 1 : split; seg(x, y + 50, dx, 868, 'rgba(120,150,230,.35)', p.a * (i === 1 ? 1 : split) + (i !== 1 ? mono * p.a : 0), 3);
    if (i === 1 || split > 0) { const col = i === 1 && t >= P.tPay ? C.green : failed ? C.red : (split > .5 ? SV[i].col : C.cyan); dbIcon(dx, 925, col, p.a * da); if (split > .3) txt(SV[i].db, x, 1004, { size: 20, font: F.m, weight: 400, align: 'center', color: C.dim, a: pr(split, .3, 1) }); }
  });
  if (mono > 0) { const ta = E.out(pr(t, P.tAll, P.tAll + .35)) * mono; pill(540, 1060, 'BEGIN … COMMIT  ·  all or nothing', C.cyan, { size: 24, a: ta, h: 50 }); txt('one database', 540, 1004, { size: 20, font: F.m, weight: 400, align: 'center', color: C.dim, a: mono * pop(t, s.start + .3).a }); }
  // payment commits
  if (t >= P.tPay - .5) pkt(XS[0] + 120, 690, XS[1] - 120, 690, (t - (P.tPay - .5)) / .4, C.cyan, { r: 8 });
  const pp = pop(t, P.tPay, .45); if (pp.a > 0) { mark('ok', 600, 880, 22, pp.a, pr(t, P.tPay, P.tPay + .4)); pill(540, 1062, '$49 charged ✓', C.green, { size: 24, a: pp.a, s: pp.s, h: 46 }); }
  if (t >= P.tFail - .45) pkt(XS[1] + 120, 690, XS[2] - 120, 690, (t - (P.tFail - .45)) / .4, C.violet, { r: 8 });
  const fp = pop(t, P.tFail, .45); if (fp.a > 0) { mark('bad', 900, 880, 22, fp.a); pill(840, 1062, 'out of stock ✕', C.red, { size: 24, a: fp.a, s: fp.s, h: 46 }); }
  const op = pop(t, P.tCharged + .1, .45); if (op.a > 0) pill(240, 1062, 'order stuck', C.amber, { size: 24, a: op.a, s: op.s, h: 46 });
  const wp = pop(t, P.tCharged + .5, .5); if (wp.a > 0) pill(540, 1210, 'Charged $49 · nothing ships', C.red, { size: 34, solid: true, a: wp.a, s: wp.s, glow: 30, font: F.d, weight: 800, h: 78, padX: 40 });
  tint(C.red, .12 * pr(t, P.tFail, P.tFail + .3) + .1 * pr(t, P.tCharged + .5, P.tCharged + .9));
};
SCN.problem.init = s => {
  const P = { tAll: cueT(s, [0, 'covers', -.1]), tSplit: cueT(s, [1, 'microservices', -.15]), tPay: cueT(s, [2, 'commits', -.1]), tFail: cueT(s, [2, 'fails', -.1]), tCharged: cueT(s, [3, 'charged', -.1]) }; SCN.problem.P = P;
  [0, 1, 2].forEach(i => cue(s.start + .2 + i * .1, 'pop', .35)); cue(P.tAll, 'confirm', .5); cue(P.tSplit, 'swish', .7); cue(P.tSplit + .5, 'pop', .5);
  cue(P.tPay - .5, 'whoosh', .3); cue(P.tPay, 'ping', .6); cue(P.tFail - .45, 'whoosh', .3); cue(P.tFail, 'error', 1); cue(P.tCharged + .5, 'impact', .8);
};

// =============== DEFINITION ===============
SCN.definition = (t, s) => {
  const P = SCN.definition.P, d = s.lines;
  let a = slide(t, d[0].start - .15, .4, 30); txt('THE FIX', 540, 372 + a.y, { size: 32, weight: 700, ls: 10, align: 'center', color: C.dim, a: a.a });
  let u = pr(t, P.tTitle, P.tTitle + .3); if (u > 0) { g.save(); g.translate(540, 474); const sc = lerp(1.45, 1, E.expo(u)); g.scale(sc, sc); txt('Saga Pattern', 0, 0, { size: 110, weight: 900, font: F.d, align: 'center', a: E.out(u), glow: 30, glowCol: rgba(C.cyan, .7) }); g.restore(); }
  // forward chain T1 -> T2 -> T3
  XS.forEach((x, i) => {
    const ts = P.tChain + i * .3, p = pop(t, ts, .45); if (p.a <= 0) return;
    if (i) arrow(XS[i - 1] + 112, 660, x - 116, 660, rgba(C.green, .8), E.out(pr(t, ts - .1, ts + .15)), p.a, 3.5);
    const sub = t >= P.tOne + i * .15 ? SV[i].n.toLowerCase() + ' svc' : 'local tx';
    svc(x, 660, 210, 100, { label: 'T' + (i + 1), sub, subSize: 20, size: 40, col: C.green, a: p.a, s: p.s, glow: .45, subCol: t >= P.tOne + i * .15 ? SV[i].col : undefined });
  });
  if (t >= P.tChain + .9) { const k = ((t - P.tChain - .9) * .55) % 1; const x = lerp(XS[0], XS[2], k); circ(x, 600, 7, C.green, 1, 14); }
  // compensations
  XS.forEach((x, i) => {
    const ts = P.tComp + i * .22, p = pop(t, ts, .45); if (p.a <= 0) return;
    qarrow([x + 60, 714], [x + 78, 790], [x + 40, 838], rgba(C.amber, .85), E.out(pr(t, ts - .1, ts + .3)), p.a, 3);
    svc(x, 880, 190, 84, { label: 'C' + (i + 1), sub: 'undo T' + (i + 1), subSize: 19, size: 34, col: C.amber, a: p.a, s: p.s, glow: .3, dashed: true });
  });
  const lines = [[P.tChain, [['Local transactions', C.green]], C.green], [P.tOne, [['One per ', C.text], ['service', C.cyan]], C.cyan], [P.tComp, [['Each has a ', C.text], ['compensation', C.amber]], C.amber]];
  lines.forEach((ln, i) => { const u2 = E.out(pr(t, ln[0], ln[0] + .4)); if (u2 <= 0) return; const yy = 1110 + i * 90, dx = (1 - u2) * -50; g.save(); g.globalAlpha *= u2; rr(96 + dx, yy - 46, 10, 56, 5); g.fillStyle = ln[2]; g.shadowColor = ln[2]; g.shadowBlur = 14; g.fill(); g.restore(); rich(ln[1], 136 + dx, yy, { size: 56, weight: 700, font: F.d, a: u2 }); });
};
SCN.definition.init = s => {
  const P = { tTitle: cueT(s, [0, 'saga', -.1]), tChain: cueT(s, [1, 'chain', -.1]), tOne: cueT(s, [1, 'one per', -.05]), tComp: cueT(s, [2, 'compensation', -.1]) }; SCN.definition.P = P;
  cue(P.tTitle, 'thud', .8); cue(P.tTitle + .05, 'chime', .6); [0, 1, 2].forEach(i => cue(P.tChain + i * .3, 'pop', .5)); cue(P.tOne, 'tick', .5); [0, 1, 2].forEach(i => cue(P.tComp + i * .22, 'switch', .4));
};

// =============== HOW IT WORKS ===============
SCN.how = (t, s) => {
  const P = SCN.how.P;
  // services
  XS.forEach((x, i) => {
    const p = pop(t, s.start + .1 + i * .1, .5), failed = i === 2 && t >= P.tFail, fl = failed ? 1 - pr(t, P.tFail, P.tFail + .6) : 0;
    service(x, 450, i, { a: p.a, s: p.s * (1 + fl * .08), col: failed ? C.red : undefined, glow: failed ? .8 : .35 });
    if (fl > 0) ring(x, 450, 90 + (1 - fl) * 100, C.red, fl * .7, 4);
    // status card
    const st = P.state(i, t); if (p.a <= 0) return; const sa = p.a;
    g.save(); g.globalAlpha *= sa; rr(x - 120, 548, 240, 100, 18); g.fillStyle = mix(C.panel, st.col, st.k ? .16 : .02); g.fill(); g.lineWidth = 2.5; g.strokeStyle = rgba(st.col, st.k ? .85 : .3); g.stroke();
    txt('T' + (i + 1) + ' · local tx', x, 580, { size: 18, font: F.m, weight: 700, ls: 1, align: 'center', color: C.dim });
    const bump = st.k ? 1 + (1 - pr(t, st.t, st.t + .35)) * .18 : 1; g.translate(x, 622); g.scale(bump, bump); const o = { size: 28, weight: 800, font: F.d }; o.size = fit(st.txt, 210, o); txt(st.txt, 0, 0, { ...o, align: 'center', base: 'middle', color: st.k ? st.col : C.faint, glow: st.k ? 10 : 0 }); g.restore();
  });
  // forward triggers
  [[0, P.tTrig], [1, P.tC1]].forEach(([i, ts]) => { const u = E.out(pr(t, ts, ts + .3)); arrow(XS[i] + 122, 450, XS[i + 1] - 126, 450, rgba(C.green, .9), u, u, 3.5); pkt(XS[i] + 120, 450, XS[i + 1] - 120, 450, (t - ts) / .35, C.green, { r: 8 }); });
  // backwards compensation lane
  const back = [[2, 1, P.tBack, 'refund'], [1, 0, P.tCancel - .35, 'cancel']];
  back.forEach(([from, to, ts, lab]) => {
    const u = E.io(pr(t, ts, ts + .45)); if (u <= 0) return; const p0 = [XS[from] - 30, 652], p1 = [(XS[from] + XS[to]) / 2, 790], p2 = [XS[to] + 30, 656];
    qarrow(p0, p1, p2, rgba(C.amber, .9), u, 1, 4); const k = (t - ts) / .45; if (k > 0 && k < 1) { const q = qp(p0, p1, p2, k); circ(q[0], q[1], 9, C.amber, 1, 18); }
    const la = pop(t, ts + .3, .4); if (la.a > 0) pill(p1[0], 740, '↺ ' + lab, C.amber, { size: 20, a: la.a, s: la.s, h: 36 });
  });
  // banner
  const bA = pop(t, P.tBack, .45), bB = pop(t, P.tNew, .45);
  if (bA.a > 0 && t < P.tNew) pill(540, 862, 'SAGA RUNS BACKWARDS', C.amber, { size: 26, a: bA.a, s: bA.s, h: 54, glow: 18 });
  if (bB.a > 0) pill(540, 862, 'NEW TRANSACTIONS · NOT A ROLLBACK', C.amber, { size: 24, a: bB.a, s: bB.s, h: 54, solid: true, glow: 22 });
  // saga log
  const la = E.out(pr(t, s.start + .3, s.start + .7));
  g.save(); g.globalAlpha *= la; panel(110, 920, 860, 410, { stroke: 'rgba(120,150,230,.3)' }); txt('SAGA LOG', 140, 964, { size: 20, font: F.m, weight: 700, ls: 4, color: C.dim }); g.restore();
  P.log.forEach((r, i) => {
    const sl = slide(t, r.t, .4, 20); if (sl.a <= 0) return; const y = 1022 + i * 62 + sl.y, col = r.k === 'ok' ? C.green : r.k === 'bad' ? C.red : C.amber;
    g.save(); g.globalAlpha *= sl.a; mark(r.k, 166, y, 20, 1, pr(t, r.t, r.t + .35));
    txt(r.tag, 204, y + 9, { size: 26, font: F.m, weight: 700, color: col }); txt(r.txt, 262, y + 9, { size: 30, weight: 700, color: C.text });
    if (r.note) txt(r.note, 940, y + 8, { size: 20, font: F.m, weight: 400, align: 'right', color: r.k === 'undo' ? C.amber : C.dim });
    g.restore();
  });
  if (t >= P.tFail) tint(C.red, .14 * (1 - pr(t, P.tFail + .2, P.tFail + 1.1)));
};
SCN.how.init = s => {
  const P = { tC0: cueT(s, [0, 'commit', -.05]), tTrig: cueT(s, [0, 'trigger', -.05]), tC1: cueT(s, [1, null, .1]), tCommit1: cueT(s, [1, 'commit', -.05]), tR: cueT(s, [2, null, .05]), tFail: cueT(s, [2, 'fails', -.1]),
    tBack: cueT(s, [3, 'backwards', -.3]), tRefund: cueT(s, [4, null, 0]), tCancel: cueT(s, [4, 'cancel', -.05]), tNew: cueT(s, [5, null, -.05]) };
  P.state = (i, t) => {
    const seq = [[[s.start, '—', C.faint, 0], [P.tC0, 'PENDING', C.amber, 1], [P.tCancel, 'CANCELLED', C.amber, 1]], [[s.start, '—', C.faint, 0], [P.tCommit1, '$49 CHARGED', C.green, 1], [P.tRefund, 'REFUNDED', C.amber, 1]], [[s.start, '—', C.faint, 0], [P.tR, 'reserving…', C.dim, 0], [P.tFail, 'OUT OF STOCK', C.red, 1]]][i];
    let r = seq[0]; seq.forEach(x => { if (t >= x[0]) r = x; }); return { t: r[0], txt: r[1], col: r[2], k: r[3] };
  };
  P.log = [{ t: P.tC0, k: 'ok', tag: 'T1', txt: 'Create order', note: 'commit' }, { t: P.tCommit1, k: 'ok', tag: 'T2', txt: 'Charge payment', note: 'commit' }, { t: P.tFail, k: 'bad', tag: 'T3', txt: 'Reserve stock', note: 'failed' },
    { t: P.tRefund, k: 'undo', tag: 'C2', txt: 'Refund payment', note: 'new tx' }, { t: P.tCancel, k: 'undo', tag: 'C1', txt: 'Cancel order', note: 'new tx' }];
  SCN.how.P = P;
  [0, 1, 2].forEach(i => cue(s.start + .1 + i * .1, 'pop', .35)); cue(P.tC0, 'confirm', .6); cue(P.tTrig, 'whoosh', .35); cue(P.tC1, 'whoosh', .35); cue(P.tCommit1, 'confirm', .6);
  cue(P.tR, 'tick', .5); cue(P.tFail, 'error', 1); cue(P.tBack, 'riser', 0.6); cue(P.tBack + .3, 'switch', .7); cue(P.tRefund, 'ping', .6); cue(P.tCancel, 'ping', .6); cue(P.tNew, 'impact', .6);
};

// =============== REAL-WORLD EXAMPLE ===============
SCN.example = (t, s) => {
  const P = SCN.example.P;
  // question
  const qa = E.out(pr(t, s.start + .05, s.start + .4)) * (1 - E.out(pr(t, P.tCh - .3, P.tCh)));
  if (qa > 0) { txt('WHO DRIVES', 540, 760, { size: 64, weight: 800, font: F.d, ls: 3, align: 'center', a: qa }); txt('THE SAGA?', 540, 860, { size: 96, weight: 900, font: F.d, align: 'center', color: C.cyan, a: qa, glow: 26 }); const k = pop(t, P.tTwo, .4); pill(540, 960, 'TWO STYLES', C.amber, { size: 26, a: k.a * qa, s: k.s, h: 50 }); }
  // --- choreography (top) ---
  const dimTop = lerp(1, .4, E.io(pr(t, P.tOr, P.tOr + .5))), ca = E.out(pr(t, P.tCh - .1, P.tCh + .3));
  if (ca > 0) {
    g.save(); g.globalAlpha *= ca * dimTop;
    txt('CHOREOGRAPHY', 90, 392, { size: 40, weight: 900, font: F.d, ls: 3, color: C.cyan, glow: 14 }); txt('events · no coordinator', 960, 390, { size: 21, font: F.m, weight: 400, align: 'right', color: C.dim });
    const bu = E.out(pr(t, P.tCh + .1, P.tCh + .5)); rr(120, 668, 840 * bu, 18, 9); g.fillStyle = rgba(C.cyan, .18); g.fill(); g.lineWidth = 2; g.strokeStyle = rgba(C.cyan, .5); g.stroke();
    txt('EVENT BUS', 940, 716, { size: 18, font: F.m, weight: 700, ls: 3, align: 'right', color: C.dim, a: bu });
    XS.forEach((x, i) => { const p = pop(t, P.tCh + i * .1, .45); seg(x, 566, x, 668, 'rgba(120,150,230,.35)', p.a, 3); const hot = P.evs.some(e => e.to === i && t >= e.t + .9 && t < e.t + 1.4); service(x, 520, i, { a: p.a, s: p.s * (hot ? 1.04 : 1), h: 92, glow: hot ? .9 : .35 }); });
    P.evs.forEach(e => {
      const u = (t - e.t) / 1.4; if (u <= 0 || u >= 1) return; const x0 = XS[e.from], x1 = XS[e.to];
      let x, y; if (u < .25) { x = x0; y = lerp(570, 677, u / .25); } else if (u < .75) { x = lerp(x0, x1, (u - .25) / .5); y = 677; } else { x = x1; y = lerp(677, 570, (u - .75) / .25); }
      circ(x, y, 9, C.cyan, 1, 18); if (u >= .2 && u < .8) pill(x, 630, e.name, C.cyan, { size: 22, h: 36, solid: true });
    });
    const ra = E.out(pr(t, P.tCh + .6, P.tCh + 1)) * (1 - E.out(pr(t, P.tOr - .3, P.tOr)));
    if (ra > 0) { rich([['listen', C.cyan], ['  →  ', C.dim], ['react', C.green], ['  →  ', C.dim], ['emit next event', C.amber]], 540, 860, { size: 38, weight: 800, font: F.d, align: 'center', a: ra }); txt('no one is in charge of the whole flow', 540, 930, { size: 24, font: F.m, weight: 400, align: 'center', color: C.dim, a: ra }); }
    g.restore();
  }
  // --- orchestration (bottom) ---
  const oa = E.out(pr(t, P.tOr - .1, P.tOr + .3));
  if (oa > 0) {
    g.save(); g.globalAlpha *= oa;
    txt('ORCHESTRATION', 90, 812, { size: 40, weight: 900, font: F.d, ls: 3, color: C.violet, glow: 14 }); txt('one coordinator', 960, 810, { size: 21, font: F.m, weight: 400, align: 'right', color: C.dim });
    const op = pop(t, P.tOr + .1, .5); svc(540, 925, 380, 100, { label: 'Orchestrator', sub: 'saga state machine', subSize: 19, size: 32, icon: 'cpu', col: C.violet, a: op.a, s: op.s, glow: .6 });
    XS.forEach((x, i) => {
      const p = pop(t, P.tOr + .3 + i * .1, .45); const p0 = [540 + (i - 1) * 110, 976], p2 = [x, 1098], p1 = [x, 1010];
      qarrow(p0, p1, p2, rgba(C.violet, .55), E.out(pr(t, P.tOr + .3 + i * .1, P.tOr + .7 + i * .1)), p.a, 2.5);
      service(x, 1150, i, { a: p.a, s: p.s, h: 92, glow: .3 });
      // command then reply, in sequence, repeating
      for (let cyc = P.tTell; cyc < s.end; cyc += 2.4) { const ts = cyc + i * .7, k = (t - ts) / .35, r = (t - ts - .4) / .3;
        if (k > 0 && k < 1) { const q = qp(p0, p1, p2, k); circ(q[0], q[1], 9, C.violet, 1, 18); }
        if (r > 0 && r < 1) { const q = qp(p0, p1, p2, 1 - r); circ(q[0], q[1], 7, C.green, 1, 14); } }
    });
    const ca2 = pop(t, P.tTell, .4); if (ca2.a > 0) { [['1 · create', 290], ['2 · charge', 540], ['3 · reserve', 790]].forEach(([lb, x]) => pill(x, 1046, lb, C.violet, { size: 19, h: 34, a: ca2.a, s: ca2.s })); }
    const tp = pop(t, P.tTools, .45), tq = pop(t, P.tTools2, .45);
    if (tp.a > 0) pill(370, 1272, 'Temporal', C.text, { size: 26, a: tp.a, s: tp.s, h: 52, font: F.d, weight: 800 });
    if (tq.a > 0) pill(680, 1272, 'AWS Step Functions', C.text, { size: 26, a: tq.a, s: tq.s, h: 52, font: F.d, weight: 800 });
    g.restore();
  }
};
SCN.example.init = s => {
  const P = { tTwo: cueT(s, [0, 'two', -.1]), tCh: cueT(s, [1, null, -.05]), tOr: cueT(s, [2, null, -.05]), tTell: cueT(s, [2, 'tells', -.1]), tTools: cueT(s, [3, 'temporal', -.1]), tTools2: cueT(s, [3, 'step', -.1]) };
  P.evs = []; for (let k = P.tCh + .35; k < P.tOr + 2.5; k += 2.8) { P.evs.push({ t: k, from: 0, to: 1, name: 'OrderCreated' }); P.evs.push({ t: k + 1.4, from: 1, to: 2, name: 'PaymentDone' }); }
  SCN.example.P = P;
  cue(s.start + .05, 'thud', .6); cue(P.tTwo, 'pop', .6); cue(P.tCh, 'swish', .6); P.evs.filter(e => e.t < P.tOr).forEach(e => cue(e.t + .35, 'blip', .35));
  cue(P.tOr, 'swish', .6); cue(P.tOr + .1, 'pop', .6); cue(P.tTell, 'switch', .5); cue(P.tTell + .7, 'tick', .4); cue(P.tTell + 1.4, 'tick', .4); cue(P.tTools, 'pop', .6); cue(P.tTools2, 'pop', .6);
};

// =============== BEFORE vs AFTER ===============
SCN.compare = compareScene({
  left: { head: 'WITHOUT', sub: 'sagas', col: C.red, steps: [['Payment commits', [0, null, .05]], ['Inventory fails', [0, 'half', -.1]], ['Nothing undoes it', [0, 'work', -.1]], ['Charged, no order', [0, 'inconsistent', -.15]], ['INCONSISTENT', [0, '$end', -.05]]] },
  right: { head: 'WITH', sub: 'sagas', col: C.green, good: true, steps: [['Payment commits', [1, null, .05]], ['Inventory fails', [1, 'failures', -.05]], ['Refund + cancel', [1, 'undone', -.15]], ['Order cancelled', [1, 'data', -.1]], ['CONSISTENT', [1, 'consistent', .05]]] },
  swapAt: [1, null, 0]
});

// =============== TAKEAWAYS ===============
SCN.takeaways = takeawaysScene({
  title: [['Remember ', C.text], ['3', C.cyan], [' things', C.text]],
  cards: [
    { title: 'Eventually consistent', sub: 'no isolation · others can see PENDING states', col: C.cyan, at: [1, null, -.1] },
    { title: 'Idempotent compensations', sub: 'messages repeat · undo must always succeed', col: C.amber, at: [2, null, -.1] },
    { title: 'Choreography vs orchestration', sub: 'events for simple flows · orchestrator for complex', col: C.violet, at: [3, null, -.1] }
  ],
  note: { segs: [['Why not ', C.dim], ['2PC', C.cyan], ['? It holds locks and blocks on failure.', C.dim]], at: [3, '$end', -.5] },
  mono: { text: 'local tx  ·  compensation  ·  coordinator', at: [3, '$end', -.3] }
});

// =============== SUMMARY ===============
SCN.summary = summaryScene({
  label: 'SAGA  =',
  rows: [{ text: 'A chain of local transactions,', at: [0, 'chain', -.05] }, { text: 'each with a compensation', col: C.amber, at: [0, 'each with', -.05] }, { text: 'to undo it.', col: C.green, at: [0, 'undo', -.05] }],
  icon: (t, s) => {
    const a = pop(t, s.start + .1, .5); if (a.a <= 0) return; g.save(); g.globalAlpha *= a.a; g.translate(540, 520); g.scale(a.s, a.s);
    const xs = [-180, 0, 180];
    xs.forEach((x, i) => { if (i) arrow(xs[i - 1] + 58, -30, x - 62, -30, rgba(C.green, .85), 1, 1, 3); rr(x - 54, -62, 108, 64, 16); g.fillStyle = mix(C.panel, C.green, .2); g.fill(); g.lineWidth = 2.5; g.strokeStyle = C.green; g.stroke(); txt('T' + (i + 1), x, -29, { size: 26, weight: 800, align: 'center', base: 'middle' });
      if (i) qarrow([x - 20, 4], [x - 90, 60], [xs[i - 1] + 20, 6], rgba(C.amber, .85), 1, 1, 3); });
    txt('↺ undo', -90, 74, { size: 20, font: F.m, weight: 700, align: 'center', color: C.amber }); txt('↺ undo', 90, 74, { size: 20, font: F.m, weight: 700, align: 'center', color: C.amber });
    g.restore();
  }
});

// =============== CTA ===============
SCN.cta = ctaScene({ big: 'System Design', bigPhrase: 'system', sub: 'explained visually', subPhrase: 'explained' });
