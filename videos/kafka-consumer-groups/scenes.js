'use strict';
// Kafka Consumer Groups — scene code. Uses engine/core.js + engine/lib.js.
const CC = ['#41D9FF', '#8E7BFF', '#2FE3A0', '#FFB52E', '#FF7AC6']; // consumer colours C1..C5

// scrolling message log inside a horizontal topic bar
function topicBar(t, x, y, w, h, o = {}) {
  const a = o.a ?? 1; if (a <= 0) return; g.save(); g.globalAlpha *= a;
  panel(x, y, w, h, { stroke: rgba(o.col ?? C.cyan, .45), r: 22 });
  txt('TOPIC', x + 28, y + h / 2 - 8, { size: 19, font: F.m, weight: 700, ls: 3, color: C.dim }); txt(o.name ?? 'orders', x + 28, y + h / 2 + 26, { size: 32, weight: 800, font: F.d });
  const cx0 = x + 200, cw = 54, gap = 8, rate = o.rate ?? 3, base = (o.base ?? 1030) + t * rate, fr = base % 1, n = Math.ceil((w - 220) / (cw + gap)) + 1;
  g.save(); rr(cx0 - 4, y + 10, w - 210, h - 20, 12); g.clip();
  for (let k = 0; k < n; k++) {
    const cx = cx0 + (k - fr) * (cw + gap), num = Math.floor(base) + k - n + 1, lagged = o.lagFrom != null && k >= n - (o.lagCells ?? 0);
    const col = lagged ? C.amber : (o.col ?? C.cyan); rr(cx, y + h / 2 - 32, cw, 64, 10); g.fillStyle = rgba(col, .18); g.fill(); g.lineWidth = 1.5; g.strokeStyle = rgba(col, .7); g.stroke();
    txt(String(num % 10000), cx + cw / 2, y + h / 2 + 7, { size: 16, font: F.m, weight: 700, align: 'center', color: lagged ? C.amber : C.dim });
  }
  g.restore(); g.restore();
}
const consumer = (x, y, w, h, label, col, o = {}) => svc(x, y, w, h, { label, sub: o.sub, subSize: 19, size: o.size ?? 30, icon: o.icon ?? 'cpu', col, a: o.a, s: o.s, glow: o.glow ?? .4, dashed: o.dashed, subCol: o.subCol });

// =============== HOOK ===============
SCN.hook = (t, s) => {
  const P = SCN.hook.P, z = lerp(1, 1.06, pr(t, s.start, s.end));
  g.save(); g.translate(540, 860); g.scale(z, z); g.translate(-540, -860);
  const tp = pop(t, s.start + .05, .5); g.save(); g.translate(540, 640); g.scale(tp.s, tp.s); g.translate(-540, -640); topicBar(t, 110, 580, 860, 120, { a: tp.a, rate: 3.4 }); g.restore();
  const xs = [250, 540, 830];
  xs.forEach((x, i) => {
    const p = pop(t, s.start + .3 + i * .1, .5); seg(x, 700, x, 996, 'rgba(120,150,230,.35)', p.a, 3);
    if (t < P.tDup - .2) stream(t, x, 700, x, 996, s.start + .7 + i * .17, P.tDup - .5, .55, .45, C.cyan, { r: 8 });
    const hit = (i === 0 || i === 2) && t >= P.tHit, fl = hit ? 1 - pr(t, P.tHit, P.tHit + .6) : 0;
    consumer(x, 1052, 220, 112, `C${i + 1}`, hit ? C.red : C.cyan, { sub: 'consumer', a: p.a, s: p.s * (1 + fl * .08), glow: .4 + fl * .6 });
    if (hit) { const bp = pop(t, P.tHit, .4); pill(x, 1146, '#1042', C.red, { size: 22, solid: true, a: bp.a, s: bp.s, glow: 18 }); if (fl > 0) ring(x, 1052, 90 + (1 - fl) * 90, C.red, fl * .7, 4); }
  });
  // the duplicated message
  if (t >= P.tDup - .1) {
    const u = pr(t, P.tDup, P.tHit); if (u < 1) { pill(540, lerp(640, 700, u), '#1042', C.amber, { size: 22, solid: true, glow: 20, a: 1 - u * .5 }); }
    pkt(540, 700, 250, 996, u, C.amber, { r: 11 }); pkt(540, 700, 830, 996, u, C.amber, { r: 11 });
    const xa = pop(t, P.tHit + .1, .45); if (xa.a > 0) { g.save(); g.translate(540, 880); g.scale(xa.s, xa.s); txt('×2', 0, 12, { size: 60, weight: 900, font: F.d, align: 'center', color: C.red, a: xa.a, glow: 24 }); g.restore(); }
  }
  if (t >= P.tHit) tint(C.red, .22 * (1 - .5 * pr(t, P.tHit + .2, P.tHit + 1)));
  g.restore();
  let a = slide(t, s.lines[0].start - .2, .45, 50); txt('MULTIPLE CONSUMERS,', 540, 372 + a.y, { size: 64, weight: 800, font: F.d, ls: 2, align: 'center', a: a.a });
  let u = pr(t, P.tTopic - .1, P.tTopic + .22); if (u > 0) { g.save(); g.translate(540, 468); g.scale(lerp(1.6, 1, E.expo(u)), lerp(1.6, 1, E.expo(u))); txt('ONE KAFKA TOPIC.', 0, 0, { size: 84, weight: 900, font: F.d, align: 'center', color: C.cyan, a: E.out(u), glow: 30 }); g.restore(); }
  a = slide(t, s.lines[1].start - .08, .4, 40); txt('WITHOUT READING', 540, 1300 + a.y, { size: 50, weight: 700, ls: 10, align: 'center', color: C.dim, a: a.a });
  u = pr(t, P.tSame - .12, P.tSame + .22); if (u > 0) { g.save(); g.translate(540, 1400); g.scale(lerp(1.5, 1, E.expo(u)), lerp(1.5, 1, E.expo(u))); g.globalAlpha *= E.out(u); const o = { size: 84, weight: 900, font: F.d, align: 'center' }; o.size = fit('THE SAME MESSAGE TWICE?', 900, o); rich([['THE SAME MESSAGE ', C.text], ['TWICE?', C.red]], 0, 0, o); g.restore(); }
};
SCN.hook.init = s => {
  const P = { tTopic: cueT(s, [0, 'one kafka', -.05]), tSame: cueT(s, [1, 'the same', -.05]), tDup: cueT(s, [1, 'reading', -.1]) }; P.tHit = P.tDup + .55; SCN.hook.P = P;
  cue(s.lines[0].start - .25, 'whoosh', .7); cue(P.tTopic, 'thud', .8); cue(P.tDup, 'swish', .5); cue(P.tHit, 'error', .9); cue(P.tSame, 'impact', .8);
};

// =============== PROBLEM ===============
SCN.problem = (t, s) => {
  const P = SCN.problem.P, { tSpike, tMore, tDup } = P;
  const pp = pop(t, s.start + .1), tp = pop(t, s.start + .22);
  svc(540, 420, 380, 92, { label: 'Producers', sub: 'orders in', icon: 'cart', col: C.violet, size: 30, a: pp.a, s: pp.s, glow: .35 });
  const spike = pr(t, tSpike, tSpike + .6), lagCells = t < tSpike ? 0 : Math.min(8, Math.floor((t - tSpike) * 3.2));
  topicBar(t, 110, 545, 860, 112, { a: tp.a, rate: lerp(1.6, 4.5, spike), base: 2040, lagFrom: 1, lagCells });
  // producer -> topic traffic, much denser after the spike
  for (let sp = s.start + .4; sp < s.end; sp += lerp(.5, .11, pr(sp, tSpike, tSpike + .5))) { const dx = ((sp * 97) % 1 - .5) * 180; pkt(540 + dx, 466, 540 + dx, 545, (t - sp) / .3, C.violet, { r: 7 }); }
  const more = pr(t, tMore, tMore + .5), xs = [lerp(540, 240, E.io(more)), 540, 840];
  for (let i = 0; i < 3; i++) {
    const p = i === 0 ? pop(t, s.start + .35) : pop(t, tMore + .05 + i * .1), x = xs[i], dupd = i > 0 && t >= P.tStamp;
    if (p.a <= 0) continue; seg(540, 657, x, 806, 'rgba(120,150,230,.35)', p.a, 3);
    consumer(x, 862, 250, 110, i ? `Copy ${i}` : 'Consumer', dupd ? C.red : C.cyan, { sub: i ? 'reads all' : 'reads all', a: p.a, s: p.s, glow: dupd ? .8 : .4, icon: 'cpu', size: 28 });
    if (dupd) { const sp2 = pop(t, P.tStamp + i * .12, .4); g.save(); g.translate(x, 930); g.rotate(-.08); g.scale(sp2.s, sp2.s); pill(0, 0, 'DUPLICATE', C.red, { size: 21, solid: true, a: sp2.a, glow: 16 }); g.restore(); }
  }
  // topic -> consumer reads
  if (t < tMore) for (let sp = s.start + .6; sp < tMore; sp += .7) pkt(540, 657, 540, 806, (t - sp) / .45, C.cyan, { r: 8 });
  else for (let sp = tMore + .4; sp < s.end; sp += .7) for (let i = 0; i < 3; i++) pkt(540, 657, xs[i], 806, (t - sp) / .45, sp >= tDup - .3 ? C.amber : C.cyan, { r: 8 });
  // lag meter
  const la = E.out(pr(t, s.start + .5, s.start + .9)) * (1 - pr(t, tDup - .2, tDup + .2));
  if (la > 0) {
    const lag = Math.round(t < tSpike ? 40 + (t - s.start) * 25 : 40 + (tSpike - s.start) * 25 + Math.pow(t - tSpike, 2.2) * 5200), lc = lag > 5000 ? C.red : lag > 800 ? C.amber : C.green, f = clamp(Math.log10(lag) / 5);
    g.save(); g.globalAlpha *= la; panel(190, 1000, 700, 150, { stroke: rgba(lc, .5) }); txt('CONSUMER LAG', 222, 1046, { size: 22, font: F.m, weight: 700, ls: 3, color: C.dim });
    txt(lag.toLocaleString('en-US') + ' msgs', 858, 1052, { size: 34, font: F.m, weight: 700, align: 'right', color: lc, glow: lag > 5000 ? 16 : 0 });
    rr(222, 1084, 636, 18, 9); g.fillStyle = 'rgba(255,255,255,.08)'; g.fill(); rr(222, 1084, Math.max(18, 636 * f), 18, 9); g.fillStyle = lc; g.shadowColor = lc; g.shadowBlur = 12; g.fill(); g.restore();
    if (t >= tSpike) { const k = pop(t, tSpike, .4); pill(540, 1196, 'TRAFFIC SPIKE', C.amber, { size: 24, a: k.a * la, s: k.s }); }
  }
  const wa = pop(t, P.tStamp + .3, .45); if (wa.a > 0) pill(540, 1110, 'order #1042 charged 3×', C.red, { size: 30, solid: true, a: wa.a, s: wa.s, glow: 30, font: F.d, weight: 800, h: 70, padX: 34 });
  tint(C.red, .1 * pr(t, tSpike + 1, tSpike + 1.5) + .14 * pr(t, P.tStamp, P.tStamp + .3));
};
SCN.problem.init = s => {
  const P = { tSpike: cueT(s, [1, 'spikes', -.25]), tMore: cueT(s, [2, null, -.05]), tDup: cueT(s, [2, 'read the same', -.2]) }; P.tStamp = P.tDup + .55; SCN.problem.P = P;
  cue(s.start + .3, 'ping', .4); cue(P.tSpike, 'riser', 2.0); cue(P.tMore + .1, 'pop', .6); cue(P.tStamp, 'error', 1);
};

// =============== DEFINITION ===============
SCN.definition = (t, s) => {
  const P = SCN.definition.P, d = s.lines;
  let a = slide(t, d[0].start - .15, .4, 30); txt("KAFKA'S ANSWER", 540, 372 + a.y, { size: 32, weight: 700, ls: 10, align: 'center', color: C.dim, a: a.a });
  let u = pr(t, P.tTitle, P.tTitle + .3); if (u > 0) { g.save(); g.translate(540, 470); const sc = lerp(1.45, 1, E.expo(u)); g.scale(sc, sc); txt('Consumer Group', 0, 0, { size: 100, weight: 900, font: F.d, align: 'center', a: E.out(u), glow: 30, glowCol: rgba(C.cyan, .7) }); g.restore(); }
  const px = [220, 420, 620, 820], owner = [0, 0, 1, 1], cx = [320, 760], split = E.io(pr(t, P.tSplit, P.tSplit + .7)), one = t >= P.tOne;
  px.forEach((x, i) => { const p = pop(t, s.start + .2 + i * .07), col = mix('#6E7CA3', CC[owner[i]], split); g.save(); g.translate(x, 640); g.scale(p.s, p.s); g.globalAlpha *= p.a; rr(-76, -38, 152, 76, 18); g.fillStyle = mix(C.panel, col, .15 + .1 * split); g.fill(); g.lineWidth = 2.5; g.strokeStyle = col; g.stroke(); txt('P' + i, 0, 2, { size: 30, weight: 800, font: F.d, align: 'center', base: 'middle' }); g.restore(); });
  txt('TOPIC orders · 4 partitions', 540, 568, { size: 20, font: F.m, weight: 700, ls: 2, align: 'center', color: C.dim, a: pop(t, s.start + .2).a });
  // group outline + label
  const ga = E.io(pr(t, P.tGroup, P.tGroup + .6)); if (ga > 0) { g.save(); rr(110, 800, 860, 210, 26); const per = 2 * (860 + 210); g.setLineDash([per * ga, per]); g.lineWidth = 3; g.strokeStyle = rgba(C.cyan, .8); g.stroke(); g.setLineDash([]); g.restore();
    const lab = 'group.id = "payments"', n = Math.floor(pr(t, P.tGroup + .1, P.tGroup + .8) * lab.length); txt(lab.slice(0, n), 124, 1048, { size: 24, font: F.m, weight: 700, color: C.cyan }); }
  // assignment lines
  px.forEach((x, i) => { const c = owner[i], p = clamp(split * 1.4 - i * .1); if (p <= 0) return; const p0 = [x, 680], p2 = [cx[c], 868], p1 = [x, 790]; qarrow(p0, p1, p2, rgba(CC[c], .85), p, 1, 3.5);
    if (one) { const k = ((t - P.tOne) * .9 + i * .25) % 1, q = qp(p0, p1, p2, k); circ(q[0], q[1], 8, CC[c], 1, 18); } });
  [0, 1].forEach(c => { const p = pop(t, s.start + .45 + c * .12); consumer(cx[c], 920, 260, 104, `C${c + 1}`, CC[c], { sub: split > .5 ? (c ? 'reads P2, P3' : 'reads P0, P1') : 'consumer', a: p.a, s: p.s }); });
  if (one) { const bp = pop(t, P.tOne + .2, .4); px.forEach((x, i) => pill(x + 52, 598, '1 owner', CC[owner[i]], { size: 17, a: bp.a, s: bp.s, h: 30, padX: 10 })); }
  const lines = [[P.tGroup, [['Share a ', C.text], ['group ID', C.cyan]], C.cyan], [P.tSplit, [['Split the ', C.text], ['partitions', C.amber]], C.amber], [P.tOne, [['One ', C.text], ['consumer per partition', C.green]], C.green]];
  lines.forEach((ln, i) => { const u2 = E.out(pr(t, ln[0], ln[0] + .4)); if (u2 <= 0) return; const yy = 1140 + i * 90, dx = (1 - u2) * -50; g.save(); g.globalAlpha *= u2; rr(96 + dx, yy - 46, 10, 56, 5); g.fillStyle = ln[2]; g.shadowColor = ln[2]; g.shadowBlur = 14; g.fill(); g.restore(); rich(ln[1], 136 + dx, yy, { size: 56, weight: 700, font: F.d, a: u2 }); });
};
SCN.definition.init = s => {
  const P = { tTitle: cueT(s, [0, 'consumer group', -.1]), tGroup: cueT(s, [1, 'share', -.05]), tSplit: cueT(s, [1, 'split', -.05]), tOne: cueT(s, [2, 'exactly', -.1]) }; SCN.definition.P = P;
  cue(P.tTitle, 'thud', .8); cue(P.tTitle + .05, 'chime', .6); cue(P.tGroup, 'swish', .5); cue(P.tSplit, 'confirm', .7); cue(P.tOne, 'ping', .6);
};

// =============== HOW IT WORKS ===============
SCN.how = (t, s) => {
  const P = SCN.how.P, colX = [210, 415, 620, 825], rows = 6, cellH = 40, gapY = 6, top = 452, bot = top + rows * (cellH + gapY) - gapY;
  // which phase are we in?
  let pi = 0; P.ph.forEach((p, i) => { if (t >= p.tj) pi = i; }); const ph = P.ph[pi], rebal = ph.tr != null && t >= ph.tj && t < ph.tr, after = ph.tr == null || t >= ph.tr;
  const asg = after ? ph.asg : (P.ph[pi - 1] ? P.ph[pi - 1].asg : ph.asg);
  // topic panel + partition columns
  const ta = E.out(pr(t, s.start + .05, s.start + .5)); g.save(); g.globalAlpha *= ta; panel(100, 345, 880, 470, { stroke: 'rgba(120,150,230,.3)' }); txt('TOPIC', 130, 386, { size: 20, font: F.m, weight: 700, ls: 3, color: C.dim }); txt('orders', 214, 386, { size: 26, weight: 800, font: F.d }); g.restore();
  colX.forEach((x, p) => {
    const cp = pop(t, s.start + .25 + p * .12, .5); if (cp.a <= 0) return; const own = asg[p], live = own >= 0 && !rebal && !(ph.dead === own && after === false) && !(P.deadAt != null && own === P.deadIdx && t >= P.deadAt && !(pi === P.ph.length - 1 && after));
    const off = P.off(p, t), fr = off % 1, col = own >= 0 && (!rebal) ? CC[own] : '#6E7CA3';
    g.save(); g.globalAlpha *= cp.a; g.translate(0, (1 - cp.s) * 30);
    txt('P' + p, x, 432, { size: 26, weight: 800, font: F.d, align: 'center', color: own >= 0 ? col : C.dim });
    g.save(); rr(x - 70, top - 4, 140, bot - top + 8, 12); g.clip();
    for (let k = -1; k < rows; k++) { const y = bot - cellH - k * (cellH + gapY) + fr * (cellH + gapY); rr(x - 62, y, 124, cellH, 9); g.fillStyle = rgba(col, .2); g.fill(); g.lineWidth = 1.5; g.strokeStyle = rgba(col, .6); g.stroke(); txt(String(Math.floor(off) + k + 1), x, y + cellH / 2 + 7, { size: 17, font: F.m, weight: 700, align: 'center', color: C.dim }); }
    g.restore();
    const oc = t >= P.tOff ? C.green : C.dim, op = t >= P.tOff ? 1 + (1 - pr(t, P.tOff + p * .15, P.tOff + p * .15 + .4)) * .25 * (t >= P.tOff + p * .15 ? 1 : 0) : 1;
    g.save(); g.translate(x, 768); g.scale(op, op); txt('@' + Math.floor(off), 0, 0, { size: 21, font: F.m, weight: 700, align: 'center', color: oc, glow: t >= P.tOff ? 10 : 0 }); g.restore();
    g.restore();
  });
  if (t >= P.tOff) { const k = pop(t, P.tOff + .1, .4); pill(540, 360, 'COMMITTED OFFSETS', C.green, { size: 20, a: k.a, s: k.s, h: 38 }); }
  txt('ordered log  ↓  oldest first', 540, 838, { size: 20, font: F.m, weight: 400, align: 'center', color: C.faint, a: E.out(pr(t, P.tLog, P.tLog + .4)) * (1 - pr(t, P.tA - .3, P.tA)) });
  // consumers
  const present = P.cons.filter(c => t >= c.tj), n = present.length, prevN = P.cons.filter(c => t >= c.tj - .5 && c.tj <= t - .0001 ? true : false).length;
  const lay = k => { const spc = k <= 3 ? 250 : 172; return i => 540 + (i - (k - 1) / 2) * spc; };
  const lastJ = Math.max(-99, ...present.map(c => c.tj)), u = E.io(pr(t, lastJ, lastJ + .5)), nPrev = P.cons.filter(c => c.tj < lastJ).length;
  const cxOf = i => { const xn = lay(n)(i), xp = i < nPrev ? lay(nPrev)(i) : xn; return lerp(xp, xn, u); }, cw = n <= 3 ? 200 : 142;
  if (n) { const ga = E.out(pr(t, P.cons[0].tj - .2, P.cons[0].tj + .2)); g.save(); g.globalAlpha *= ga; rr(100, 955, 880, 215, 26); g.setLineDash([10, 10]); g.lineWidth = 2.5; g.strokeStyle = rgba(C.cyan, .45); g.stroke(); g.setLineDash([]); txt('GROUP', 126, 946, { size: 20, font: F.m, weight: 700, ls: 3, color: C.dim }); txt('payments', 210, 946, { size: 24, weight: 800, font: F.d, color: C.cyan }); g.restore(); }
  // assignment lines + consume packets
  if (!rebal) colX.forEach((x, p) => { const c = asg[p]; if (c < 0 || c >= n) return; const dead = P.deadAt != null && c === P.deadIdx && t >= P.deadAt; if (dead) return;
    const lp = E.io(pr(t, ph.tr ?? ph.tj, (ph.tr ?? ph.tj) + .45)), p0 = [x, 808], p2 = [cxOf(c), 1002], p1 = [x, 905]; qarrow(p0, p1, p2, rgba(CC[c], .8), lp, 1, 3);
    if (lp >= 1) for (const ev of P.ev[p]) { const k = (t - ev) / .42; if (k > 0 && k < 1) { const q = qp(p0, p1, p2, k); circ(q[0], q[1], 8, CC[c], 1, 16); } } });
  P.cons.forEach((c, i) => {
    if (t < c.tj) return; const p = pop(t, c.tj, .5), dead = P.deadAt != null && i === P.deadIdx && t >= P.deadAt, owns = asg.map((o, pIdx) => o === i ? 'P' + pIdx : null).filter(Boolean);
    const idle = !rebal && !dead && owns.length === 0 && after, col = dead ? C.red : idle ? '#6E7CA3' : CC[i], fl = dead ? 1 - pr(t, P.deadAt, P.deadAt + .6) : 0;
    consumer(cxOf(i), 1060, cw, 110, dead ? '' : `C${i + 1}`, col, { sub: dead ? 'crashed' : rebal ? '…' : idle ? 'IDLE' : owns.join(' '), subCol: dead ? C.red : idle ? C.amber : undefined, a: p.a * (dead ? lerp(1, .55, pr(t, P.deadAt + .3, P.deadAt + .9)) : 1), s: p.s * (1 + fl * .1), size: 28, glow: idle ? .1 : .4, dashed: dead });
    if (dead) { cross(cxOf(i), 1046, 20, C.red, pr(t, P.deadAt, P.deadAt + .2), 7); txt('C' + (i + 1) + ' down', cxOf(i), 1096, { size: 20, font: F.m, weight: 700, align: 'center', color: C.red, a: pr(t, P.deadAt, P.deadAt + .3) }); }
    if (fl > 0) ring(cxOf(i), 1060, 80 + (1 - fl) * 120, C.red, fl * .7, 4);
  });
  if (rebal) { const k = pop(t, ph.tj, .35); pill(540, 905, 'REBALANCING…', C.amber, { size: 26, a: k.a, s: k.s, glow: 20, h: 54 }); }
  // readout
  const R = P.read(t), ra = E.out(pr(t, R.t, R.t + .3)); if (R.txt) { const o1 = { size: 26, weight: 800, font: F.m, ls: 1 }, o2 = { size: 32, weight: 600 }, w1 = tw(R.tag, o1) + 44, w2 = tw(R.txt, o2), xx = 540 - (w1 + 20 + w2) / 2;
    pill(xx + w1 / 2, 1262, R.tag, R.col, { size: 26, weight: 800, a: ra, solid: true, w: w1, h: 52, glow: 16 }); txt(R.txt, xx + w1 + 20, 1264, { ...o2, base: 'middle', a: ra }); }
  if (P.deadAt != null && t >= P.deadAt) tint(C.red, .12 * (1 - pr(t, P.deadAt, P.deadAt + .9)));
};
SCN.how.init = s => {
  const P = {}; P.tLog = cueT(s, [0, 'ordered', -.1]); P.tA = cueT(s, [1, null, .1]); const tJ3 = cueT(s, [2, 'third', -.05]), tR3 = cueT(s, [2, 'rebalances', .35]);
  const tJ45 = cueT(s, [3, null, .05]), tR45 = cueT(s, [3, 'sits idle', -.35]); P.tOff = cueT(s, [4, 'commits', -.05]); P.deadAt = cueT(s, [5, 'crashes', -.05]); P.deadIdx = 1; const tRd = P.deadAt + .9;
  P.cons = [{ tj: P.tA - .15 }, { tj: P.tA }, { tj: tJ3 }, { tj: tJ45 }, { tj: tJ45 + .15 }];
  P.ph = [{ tj: -1, asg: [-1, -1, -1, -1] }, { tj: P.tA + .3, asg: [0, 0, 1, 1] }, { tj: tJ3 + .1, tr: tR3, asg: [0, 0, 1, 2] }, { tj: tJ45 + .2, tr: tR45, asg: [0, 1, 2, 3] }, { tj: P.deadAt + .2, tr: tRd, asg: [0, 4, 2, 3] }];
  // consumption: integrate per partition on a 1/30 s grid; partitions advance when owned by a live consumer and not rebalancing
  const base = [1040, 977, 1012, 1101], rate = 2.0, dt = 1 / 30, N = Math.ceil((s.end - s.start) / dt) + 2, cum = [0, 1, 2, 3].map(() => new Float32Array(N));
  for (let k = 1; k < N; k++) { const t = s.start + k * dt; let pi = 0; P.ph.forEach((p, i) => { if (t >= p.tj) pi = i; }); const ph = P.ph[pi], rebal = ph.tr != null && t < ph.tr;
    for (let p = 0; p < 4; p++) { const c = ph.asg[p], dead = c === P.deadIdx && t >= P.deadAt && rebal; cum[p][k] = cum[p][k - 1] + (!rebal && c >= 0 && !dead ? rate * dt : 0); } }
  P.off = (p, t) => base[p] + cum[p][clamp(Math.round((t - s.start) / dt), 0, N - 1)];
  P.ev = [0, 1, 2, 3].map(p => { const ev = []; for (let k = 1; k < N; k++) if (Math.floor(cum[p][k]) > Math.floor(cum[p][k - 1])) ev.push(s.start + k * dt); return ev; });
  const RD = [[s.start, 'TOPIC', '4 partitions · ordered logs', C.cyan], [P.tA, '2 CONSUMERS', 'two partitions each', C.cyan], [tJ3, 'C3 JOINS', 'partitions reassigned', C.amber], [tJ45, 'C4 + C5 JOIN', 'partitions reassigned', C.amber], [tR45, '5 CONSUMERS', 'only 4 partitions · C5 idle', C.amber], [P.tOff, 'OFFSETS', 'resume point per partition', C.green], [P.deadAt, 'C2 CRASHED', 'rebalance in progress', C.red], [tRd, 'FAILOVER', 'P1 moves to C5', C.green]];
  P.read = t => { let r = RD[0]; RD.forEach(x => { if (t >= x[0]) r = x; }); return { t: r[0], tag: r[1], txt: r[2], col: r[3] }; };
  SCN.how.P = P;
  [0, 1, 2, 3].forEach(p => cue(s.start + .25 + p * .12, 'pop', .45)); cue(P.tA, 'confirm', .6); cue(tJ3, 'pop', .6); cue(tJ3 + .1, 'switch', .5); cue(tR3, 'confirm', .6); cue(tJ45, 'pop', .6); cue(tR45, 'blip', .6);
  [0, 1, 2, 3].forEach(p => cue(P.tOff + p * .15, 'tick', .6)); cue(P.deadAt, 'error', 1); cue(P.deadAt + .2, 'switch', .6); cue(tRd, 'positive', .8);
};

// =============== REAL-WORLD EXAMPLE ===============
SCN.example = (t, s) => {
  const P = SCN.example.P, px = [225, 425, 625, 825], G = [{ name: 'payments', x0: 80, cx: [190, 390], col: C.cyan, at: s.start + .1, rate: 3.1, base: 1284 }, { name: 'email', x0: 560, cx: [670, 870], col: C.violet, at: P.tE, rate: 2.4, base: 1190 }];
  txt('TOPIC orders', 540, 410, { size: 22, font: F.m, weight: 700, ls: 2, align: 'center', color: C.dim, a: pop(t, s.start + .1).a });
  px.forEach((x, i) => { const p = pop(t, s.start + .15 + i * .06); g.save(); g.translate(x, 470); g.scale(p.s, p.s); g.globalAlpha *= p.a; rr(-76, -36, 152, 72, 18); g.fillStyle = mix(C.panel, C.cyan, .12); g.fill(); g.lineWidth = 2.5; g.strokeStyle = rgba(C.cyan, .7); g.stroke(); txt('P' + i, 0, 2, { size: 28, weight: 800, font: F.d, align: 'center', base: 'middle' }); g.restore(); });
  // pub-sub banner
  const pa = pop(t, P.tPS, .45); if (pa.a > 0) { pill(540, 588, 'PUB-SUB · every group gets every message', C.cyan, { size: 21, a: pa.a, s: pa.s, h: 44 }); }
  G.forEach((gr, gi) => {
    const ga = pop(t, gr.at, .5); if (ga.a <= 0) return; const y0 = 660, h = 330;
    g.save(); g.globalAlpha *= ga.a; g.translate(0, (1 - ga.s) * 40); rr(gr.x0, y0, 440 - 20, h, 26); g.fillStyle = 'rgba(12,19,34,.7)'; g.fill(); g.setLineDash([10, 10]); g.lineWidth = 2.5; g.strokeStyle = rgba(gr.col, .6); g.stroke(); g.setLineDash([]);
    txt('GROUP', gr.x0 + 26, y0 + 44, { size: 19, font: F.m, weight: 700, ls: 3, color: C.dim }); txt(gr.name, gr.x0 + 106, y0 + 44, { size: 26, weight: 800, font: F.d, color: gr.col });
    // lines from partitions to this group's consumers (P0,P1 -> c0 ; P2,P3 -> c1)
    px.forEach((x, i) => { const c = i < 2 ? 0 : 1, p0 = [x, 506], p2 = [gr.cx[c], y0 + 118], p1 = [x, 600]; const lp = E.io(pr(t, gr.at + .2, gr.at + .7)); g.restore(); g.save(); g.globalAlpha *= ga.a * .9; qarrow(p0, p1, p2, rgba(gr.col, .28), lp, 1, 2); g.restore(); g.save(); g.globalAlpha *= ga.a;
      if (lp >= 1) for (let sp = gr.at + .8 + i * .21; sp < s.end; sp += 1.05) { const k = (t - sp) / .55; if (k > 0 && k < 1) { const q = qp(p0, p1, p2, k); circ(q[0], q[1], 7.5, gr.col, 1, 14); } } });
    gr.cx.forEach((x, c) => consumer(x, y0 + 172, 170, 104, (gi ? 'E' : 'C') + (c + 1), gr.col, { sub: c ? 'P2 P3' : 'P0 P1', size: 28, icon: gi ? 'doc' : 'cpu' }));
    const off = Math.floor(gr.base + Math.max(0, t - gr.at) * gr.rate), oa = E.out(pr(t, P.tOff, P.tOff + .35));
    txt('committed offset', gr.x0 + 210, y0 + 280, { size: 19, font: F.m, weight: 400, align: 'center', color: C.dim, a: lerp(.5, 1, oa) }); txt(off.toLocaleString('en-US'), gr.x0 + 210, y0 + 316, { size: 32, font: F.m, weight: 700, align: 'center', color: oa > 0 ? C.green : C.text, glow: 12 * oa });
    const qa = pop(t, P.tQ, .4); if (qa.a > 0) pill(gr.x0 + 330, y0 + 40, 'QUEUE', C.amber, { size: 19, a: qa.a, s: qa.s, h: 34 });
    g.restore();
  });
  // the same message delivered to both groups
  if (t >= P.tEvery) { const u = pr(t, P.tEvery, P.tEvery + .7); if (u < 1) { pkt(225, 506, 190, 778, u, C.amber, { r: 11 }); pkt(225, 506, 670, 778, u, C.amber, { r: 11 }); }
    const k = pop(t, P.tEvery + .7, .4); if (k.a > 0) { pill(190, 904, '#1042', C.amber, { size: 19, solid: true, a: k.a, s: k.s, h: 32 }); pill(670, 904, '#1042', C.amber, { size: 19, solid: true, a: k.a, s: k.s, h: 32 }); } }
  const la = slide(t, P.tQ, .4, 24); if (la.a > 0) { rich([['inside a group → ', C.dim], ['queue', C.amber], [' (one consumer per message)', C.dim]], 540, 1110 + la.y, { size: 28, weight: 600, align: 'center', a: la.a }); }
  const lb = slide(t, P.tPS, .4, 24); if (lb.a > 0) { rich([['across groups → ', C.dim], ['pub-sub', C.cyan], [' (each group gets everything)', C.dim]], 540, 1170 + lb.y, { size: 28, weight: 600, align: 'center', a: lb.a }); }
};
SCN.example.init = s => {
  const P = { tE: cueT(s, [0, 'second group', -.1]), tEvery: cueT(s, [1, 'every message', -.15]), tOff: cueT(s, [1, 'own offsets', -.1]), tQ: cueT(s, [2, 'queue', -.15]), tPS: cueT(s, [2, 'pub-sub', -.15]) }; SCN.example.P = P;
  cue(P.tE, 'pop', .7); cue(P.tEvery, 'swish', .5); cue(P.tEvery + .7, 'ping', .6); cue(P.tOff, 'tick', .6); cue(P.tQ, 'confirm', .5); cue(P.tPS, 'confirm', .6);
};

// =============== BEFORE vs AFTER ===============
SCN.compare = compareScene({
  left: { head: 'WITHOUT', sub: 'consumer groups', col: C.red, steps: [['One consumer reads all', [0, null, .05]], ['Lag keeps growing', [0, 'lag', -.1]], ['Or copies read everything', [0, 'or', -.1]], ['Duplicate processing', [0, 'duplicate', -.1]], ['SLOW OR WRONG', [0, '$end', -.05]]] },
  right: { head: 'WITH', sub: 'consumer groups', col: C.green, good: true, steps: [['Shared group ID', [1, null, .05]], ['Partitions split up', [1, 'parallel', -.05]], ['One owner each', [1, 'no duplicates', -.1]], ['Crash? Rebalance', [1, 'automatic', -.1]], ['PARALLEL + SAFE', [1, 'failover', .1]]] },
  swapAt: [1, null, 0]
});

// =============== TAKEAWAYS ===============
SCN.takeaways = takeawaysScene({
  title: [['Remember ', C.text], ['3', C.cyan], [' things', C.text]],
  cards: [
    { title: 'Parallelism ≤ partitions', sub: '5 consumers, 4 partitions → 1 sits idle', col: C.cyan, at: [1, null, -.1] },
    { title: 'Order only within a partition', sub: 'same key → same partition → in order', col: C.amber, at: [2, null, -.1] },
    { title: 'Joins & crashes rebalance', sub: 'cooperative rebalancing keeps the pause short', col: C.red, at: [3, null, -.1] }
  ],
  note: { segs: [['Offsets are stored per group in ', C.dim], ['__consumer_offsets', C.cyan]], at: [3, '$end', -.5] },
  mono: { text: 'group.id  ·  partitions  ·  committed offsets', at: [3, '$end', -.3] }
});

// =============== SUMMARY ===============
SCN.summary = summaryScene({
  label: 'CONSUMER GROUP  =',
  rows: [{ text: 'Split the partitions,', at: [0, 'split', -.05] }, { text: 'one owner each,', col: C.amber, at: [0, 'one owner', -.05] }, { text: 'processed in parallel.', col: C.green, at: [0, 'processed', -.05] }],
  icon: (t, s) => {
    const a = pop(t, s.start + .1, .5); if (a.a <= 0) return; g.save(); g.globalAlpha *= a.a; g.translate(540, 520); g.scale(a.s, a.s);
    const px = [-165, -55, 55, 165], cx = [-110, 110];
    px.forEach((x, i) => { const c = i < 2 ? 0 : 1; qarrow([x, -40], [x, 10], [cx[c], 50], rgba(CC[c], .8), 1, 1, 3); rr(x - 46, -82, 92, 44, 12); g.fillStyle = mix(C.panel, CC[c], .2); g.fill(); g.lineWidth = 2; g.strokeStyle = CC[c]; g.stroke(); txt('P' + i, x, -58, { size: 20, weight: 800, align: 'center', base: 'middle' }); });
    cx.forEach((x, c) => { circ(x, 80, 30, CC[c], .25); ring(x, 80, 30, CC[c], 1, 3); txt('C' + (c + 1), x, 81, { size: 20, weight: 800, align: 'center', base: 'middle' }); });
    g.restore();
  }
});

// =============== CTA ===============
SCN.cta = ctaScene({ big: 'System Design', bigPhrase: 'system', sub: 'explained visually', subPhrase: 'explained' });
