'use strict';
// CAP Theorem — scene code. Uses engine/core.js + engine/lib.js.

// ---------- shared pieces ----------
const EX = 280, WX = 800, NW = 320, NH = 150;           // east / west replica positions
// replica node with a database icon and its current value
function replica(x, y, name, val, col, o = {}) {
  svc(x, y, o.w ?? NW, o.h ?? NH, { label: name, sub: val != null ? 'value = ' + val : o.sub, subSize: 24, size: o.size ?? 34, icon: 'db', col, a: o.a, s: o.s, glow: o.glow ?? .45, subCol: o.subCol, dashed: o.dashed });
}
// network link between two x positions; br = 0 intact .. 1 partitioned
function netLink(t, x1, x2, y, br, o = {}) {
  const a = o.a ?? 1; if (a <= 0) return; const mx = (x1 + x2) / 2, gap = 34 * E.out(br), col = br > 0 ? mix(C.cyan, C.red, clamp(br * 2)) : (o.col ?? C.cyan);
  seg(x1, y, mx - gap, y, rgba(col, .75), a, 4); seg(mx + gap, y, x2, y, rgba(col, .75), a, 4);
  if (br > 0) {
    const h = 74 * E.back(clamp(br)), jit = Math.sin(t * 40) * 3; g.save(); g.globalAlpha *= a * clamp(br * 1.5); g.strokeStyle = C.red; g.lineWidth = 6; g.lineJoin = 'round'; g.lineCap = 'round'; g.shadowColor = C.red; g.shadowBlur = 22;
    g.beginPath(); g.moveTo(mx + 10 + jit, y - h); g.lineTo(mx - 12, y - h * .3); g.lineTo(mx + 12, y + h * .2); g.lineTo(mx - 10 - jit, y + h); g.stroke(); g.restore();
    if (o.label !== false) txt('PARTITION', mx, y + h + 36, { size: 20, font: F.m, weight: 700, ls: 3, align: 'center', color: C.red, a: a * clamp(br * 2) });
  }
}
function client(x, y, lab, col, o = {}) {
  const a = o.a ?? 1, s = o.s ?? 1; if (a <= 0) return; g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha *= a;
  g.beginPath(); g.arc(0, 0, 46, 0, 7); g.fillStyle = mix(C.panel, col, .14); g.shadowColor = rgba(col, .5); g.shadowBlur = 24; g.fill(); g.shadowBlur = 0; g.lineWidth = 2.5; g.strokeStyle = rgba(col, .85); g.stroke();
  glyph('user', 0, 4, 36, col); if (lab) txt(lab, 0, 80, { size: 22, font: F.m, weight: 700, align: 'center', color: C.dim }); g.restore();
}
function flash(x, y, r, col, t, t0) { if (t < t0) return; const u = pr(t, t0, t0 + .6); if (u < 1) ring(x, y, r + E.out(u) * 90, col, (1 - u) * .8, 4); }

// =============== HOOK ===============
SCN.hook = (t, s) => {
  const P = SCN.hook.P, br = pr(t, P.tBrk, P.tBrk + .35), shk = t >= P.tBrk ? Math.pow(1 - pr(t, P.tBrk, P.tBrk + .5), 2) * 14 : 0, y = 780;
  tint(C.red, t >= P.tBrk ? .26 * (1 - .5 * pr(t, P.tBrk + .2, P.tBrk + 1)) : 0);
  const z = lerp(1, 1.06, pr(t, s.start, s.end)); g.save(); g.translate(540, 860); g.scale(z, z); g.translate(-540, -860); g.translate(Math.sin(t * 90) * shk, Math.cos(t * 77) * shk * .6);
  const pe = pop(t, s.start + .1), pw = pop(t, s.start + .25), la = E.out(pr(t, s.start + .4, s.start + .8));
  netLink(t, EX + NW / 2, WX - NW / 2, y, br, { a: la });
  if (t < P.tBrk) for (let sp = s.start + .6; sp < P.tBrk - .2; sp += .5) { pkt(EX + NW / 2, y - 14, WX - NW / 2, y - 14, (t - sp) / .45, C.cyan, { r: 8 }); pkt(WX - NW / 2, y + 14, EX + NW / 2, y + 14, (t - sp - .25) / .45, C.cyan, { r: 8 }); }
  else { const u = pr(t, P.tBrk - .05, P.tBrk + .3); if (u < 1) pkt(EX + NW / 2, y - 14, 520, y - 14, .4 + u * .6, C.red, { r: 9 }); cross(540, y, 20, C.red, pr(t, P.tBrk, P.tBrk + .15) * (1 - pr(t, P.tBrk + .8, P.tBrk + 1.2)), 6); }
  const col = t >= P.tBrk ? mix(C.cyan, C.amber, br) : C.cyan;
  replica(EX, y, 'East', null, col, { a: pe.a, s: pe.s, sub: 'node 1' }); replica(WX, y, 'West', null, col, { a: pw.a, s: pw.s, sub: 'node 2' });
  flash(EX, y, 90, C.red, t, P.tBrk); flash(WX, y, 90, C.red, t, P.tBrk);
  g.restore();
  let a = slide(t, s.lines[0].start - .2, .45, 50); txt('TWO DATABASE NODES.', 540, 400 + a.y, { size: 70, weight: 800, font: F.d, ls: 1, align: 'center', a: a.a });
  let u = pr(t, P.tBrk - .1, P.tBrk + .22); if (u > 0) { g.save(); g.translate(540, 500); const sc = lerp(1.6, 1, E.expo(u)); g.scale(sc, sc); txt('THE LINK BREAKS.', 0, 0, { size: 84, weight: 900, font: F.d, align: 'center', color: C.red, a: E.out(u), glow: 30 }); g.restore(); }
  a = slide(t, s.lines[1].start - .08, .4, 40); txt('DO YOU RETURN', 540, 1080 + a.y, { size: 46, weight: 700, ls: 8, align: 'center', color: C.dim, a: a.a });
  const ou = pr(t, P.tOld - .1, P.tOld + .22), eu = pr(t, P.tErr - .1, P.tErr + .22);
  if (ou > 0) { g.save(); g.translate(540, 1170); const sc = lerp(1.4, 1, E.expo(ou)); g.scale(sc, sc); txt('OLD DATA', 0, 0, { size: 96, weight: 900, font: F.d, align: 'center', color: C.amber, a: E.out(ou), glow: 26 }); g.restore(); }
  if (eu > 0) { txt('or', 540, 1238, { size: 40, weight: 600, align: 'center', color: C.dim, a: E.out(eu) }); g.save(); g.translate(540, 1336); const sc = lerp(1.4, 1, E.expo(eu)); g.scale(sc, sc); txt('AN ERROR?', 0, 0, { size: 96, weight: 900, font: F.d, align: 'center', color: C.red, a: E.out(eu), glow: 26 }); g.restore(); }
};
SCN.hook.init = s => {
  const P = { tBrk: cueT(s, [0, 'broke', -.05]), tOld: cueT(s, [1, 'old', -.05]), tErr: cueT(s, [1, 'error', -.1]) }; SCN.hook.P = P;
  cue(s.lines[0].start - .25, 'whoosh', .7); cue(s.start + .15, 'pop', .5); cue(s.start + .3, 'pop', .5); cue(P.tBrk, 'impact', 1); cue(P.tBrk + .05, 'error', .7); cue(P.tOld, 'thud', .7); cue(P.tErr, 'thud', .8);
};

// =============== PROBLEM ===============
SCN.problem = (t, s) => {
  const P = SCN.problem.P, y = 720, br = pr(t, P.tBrk, P.tBrk + .35);
  tint(C.red, .12 * br * (1 - .4 * pr(t, P.tBrk + .3, P.tBrk + 1)));
  const pe = pop(t, s.start + .1), pw = pop(t, s.start + .22), la = E.out(pr(t, s.start + .3, s.start + .7));
  netLink(t, EX + NW / 2, WX - NW / 2, y, br, { a: la });
  // writer above east
  const pu = pop(t, s.lines[0].start - .1); client(EX, 450, 'writer', C.green, { a: pu.a, s: pu.s });
  const wu = pr(t, P.tW, P.tW + .45); if (wu > 0 && wu < 1) pkt(EX, 500, EX, y - NH / 2, wu, C.green, { r: 10 });
  if (pu.a > 0 && t < P.tW + .45) pill(EX + 150, 450, 'write v2', C.green, { size: 22, a: pu.a, h: 40 });
  const eVal = t >= P.tW + .45 ? 'v2' : 'v1'; flash(EX, y, 100, C.green, t, P.tW + .45);
  // replication attempt dies in the gap
  if (t >= P.tRep) { const u = t < P.tBrk ? .55 * pr(t, P.tRep, P.tBrk) : .55; if (t < P.tBrk + .1) pkt(EX + NW / 2, y, WX - NW / 2, y, u, C.cyan, { r: 9 });
    if (t >= P.tBrk) { const k = pop(t, P.tBrk + .1, .4); cross(540, y - 2, 18, C.red, k.a * (1 - pr(t, P.tBrk + 1.2, P.tBrk + 1.6)), 6); pill(540, y - 120, 'REPLICATION FAILED', C.red, { size: 21, solid: true, a: k.a, s: k.s, h: 40, glow: 16 }); } }
  replica(EX, y, 'East', eVal, t >= P.tW + .45 ? C.green : C.cyan, { a: pe.a, s: pe.s, subCol: t >= P.tW + .45 ? C.green : undefined });
  const qd = t >= P.tQ, wcol = qd ? C.amber : C.cyan; replica(WX, y, 'West', 'v1', wcol, { a: pw.a, s: pw.s, subCol: qd ? C.amber : undefined });
  // reader below west
  const pr2 = pop(t, s.lines[2].start - .15); client(WX, 1010, 'reader', C.violet, { a: pr2.a, s: pr2.s });
  const ru = pr(t, P.tR, P.tR + .45); if (ru > 0 && ru < 1) pkt(WX, 962, WX, y + NH / 2, ru, C.violet, { r: 10 });
  if (pr2.a > 0) pill(WX - 160, 1010, 'read', C.violet, { size: 22, a: pr2.a, h: 40 });
  if (qd) { const k = pop(t, P.tQ, .45); g.save(); g.translate(WX + 110, y - 110); g.scale(k.s, k.s); txt('?', 0, 0, { size: 120, weight: 900, font: F.d, align: 'center', color: C.amber, a: k.a, glow: 30 }); g.restore();
    const o1 = pop(t, P.tQ + .25, .4), o2 = pop(t, P.tQ + .5, .4);
    pill(330, 1220, 'v1  ·  STALE', C.amber, { size: 30, a: o1.a, s: o1.s, h: 68, padX: 30 }); txt('or', 540, 1230, { size: 34, weight: 600, align: 'center', color: C.dim, a: o2.a }); pill(750, 1220, 'ERROR', C.red, { size: 30, a: o2.a, s: o2.s, h: 68, padX: 30 }); }
  // east/west labels for the latest value
  if (t >= P.tW + .45) { const k = slide(t, P.tW + .5, .4, 20); txt('latest = v2', EX, y + NH / 2 + 44 + k.y, { size: 22, font: F.m, weight: 700, align: 'center', color: C.green, a: k.a }); }
};
SCN.problem.init = s => {
  const P = { tW: cueT(s, [0, 'saves', -.05]), tRep: cueT(s, [1, null, .1]), tBrk: cueT(s, [1, 'network', -.05]), tR: cueT(s, [2, 'read', -.1]), tQ: cueT(s, [2, 'what', -.1]) }; SCN.problem.P = P;
  cue(P.tW, 'swish', .5); cue(P.tW + .45, 'ping', .6); cue(P.tRep, 'whoosh', .4); cue(P.tBrk, 'error', .9); cue(P.tR, 'swish', .5); cue(P.tQ, 'blip', .7); cue(P.tQ + .25, 'pop', .5); cue(P.tQ + .5, 'pop', .5);
};

// =============== DEFINITION ===============
SCN.definition = (t, s) => {
  const P = SCN.definition.P, d = s.lines, V = { C: [540, 660], A: [290, 1010], P: [790, 1010] };
  let a = slide(t, d[0].start - .15, .4, 30); txt('THE RULE', 540, 372 + a.y, { size: 32, weight: 700, ls: 10, align: 'center', color: C.dim, a: a.a });
  let u = pr(t, P.tTitle, P.tTitle + .3); if (u > 0) { g.save(); g.translate(540, 470); const sc = lerp(1.45, 1, E.expo(u)); g.scale(sc, sc); txt('CAP Theorem', 0, 0, { size: 104, weight: 900, font: F.d, align: 'center', a: E.out(u), glow: 30, glowCol: rgba(C.cyan, .7) }); g.restore(); }
  const split = t >= P.tSplit, cp = t >= P.tCons, ap = t >= P.tAvail;
  const VC = { C: C.cyan, A: C.violet, P: C.amber }, vt = { C: P.tC, A: P.tA, P: P.tP };
  // edges
  const E2 = [['C', 'P', 'CP', C.cyan, cp], ['A', 'P', 'AP', C.violet, ap], ['C', 'A', 'CA', C.faint, false]];
  E2.forEach(([p, q, lab, col, on]) => { const e = E.io(pr(t, Math.max(vt[p], vt[q]) + .1, Math.max(vt[p], vt[q]) + .6)); if (e <= 0) return; const [x1, y1] = V[p], [x2, y2] = V[q];
    const dead = lab === 'CA' && split, c2 = on ? col : dead ? C.red : 'rgba(150,170,220,.5)';
    g.save(); if (on) { g.shadowColor = col; g.shadowBlur = 20; } seg(x1, y1, lerp(x1, x2, e), lerp(y1, y2, e), on ? col : dead ? rgba(C.red, .55) : 'rgba(150,170,220,.45)', 1, on ? 7 : 3, dead ? [12, 12] : null); g.restore(); });
  ['C', 'A', 'P'].forEach(k => { const p = pop(t, vt[k], .5); if (p.a <= 0) return; const [x, y] = V[k], col = VC[k], hot = k === 'P' && split ? 1 : (k === 'C' && cp) || (k === 'A' && ap) ? 1 : .35;
    g.save(); g.translate(x, y); g.scale(p.s, p.s); g.globalAlpha *= p.a; g.beginPath(); g.arc(0, 0, 66, 0, 7); g.shadowColor = rgba(col, .8 * hot); g.shadowBlur = 50 * hot; g.fillStyle = mix(C.panel, col, .1 + .25 * hot); g.fill(); g.shadowBlur = 0; g.lineWidth = 4; g.strokeStyle = col; g.stroke();
    txt(k, 0, 4, { size: 72, weight: 900, font: F.d, align: 'center', base: 'middle', color: '#FFFFFF' }); g.restore();
    const name = { C: 'Consistency', A: 'Availability', P: 'Partition tolerance' }[k], o = { size: 36, weight: 700 }; o.size = fit(name, 300, o);
    txt(name, x, k === 'C' ? y - 92 : y + 112, { ...o, align: 'center', color: col, a: p.a }); });
  if (split) { const k = pop(t, P.tSplit, .4); pill(V.P[0], V.P[1] + 160, 'ALWAYS NEEDED', C.amber, { size: 19, a: k.a, s: k.s, h: 34 }); }
  if (cp) { const k = pop(t, P.tCons, .4); pill(745, 800, 'CP', C.cyan, { size: 34, solid: true, a: k.a, s: k.s, h: 60, glow: 22 }); }
  if (ap) { const k = pop(t, P.tAvail, .4); pill(540, 1010, 'AP', C.violet, { size: 34, solid: true, a: k.a, s: k.s, h: 60, glow: 22 }); }
  if (split) { const k = pop(t, P.tSplit + .3, .4); pill(335, 800, 'CA ✕', C.red, { size: 24, a: k.a, s: k.s, h: 44 }); }
  a = slide(t, P.tSplit, .45, 30); rich([['Network splits → pick ', C.text], ['C', C.cyan], [' or ', C.text], ['A', C.violet]], 540, 1290 + a.y, { size: 54, weight: 800, font: F.d, align: 'center', a: a.a });
};
SCN.definition.init = s => {
  const P = { tTitle: cueT(s, [0, 'cap', -.1]), tC: cueT(s, [1, null, -.05]), tA: cueT(s, [1, 'availability', -.05]), tP: cueT(s, [1, 'partition', -.05]), tSplit: cueT(s, [2, 'splits', -.1]), tCons: cueT(s, [2, 'consistency', -.05]), tAvail: cueT(s, [2, 'availability', -.05]) }; SCN.definition.P = P;
  cue(P.tTitle, 'thud', .8); cue(P.tTitle + .05, 'chime', .6); cue(P.tC, 'pop', .6); cue(P.tA, 'pop', .6); cue(P.tP, 'pop', .6); cue(P.tSplit, 'switch', .7); cue(P.tCons, 'confirm', .6); cue(P.tAvail, 'confirm', .6);
};

// =============== HOW IT WORKS ===============
const HOWCARD = [
  ['C', C.cyan, 'Consistency', 'every read sees the latest write'],
  ['A', C.violet, 'Availability', 'every request gets a non-error reply'],
  ['P', C.amber, 'Partition tolerance', 'keeps running when messages drop'],
  ['CP', C.cyan, 'Choose C  →  CP', 'refuse rather than return stale data'],
  ['AP', C.violet, 'Choose A  →  AP', 'answer now, even if it is stale'],
  ['✓', C.green, 'Partition heals', 'replicas sync and converge']
];
SCN.how = (t, s) => {
  const P = SCN.how.P, T = P.T, y = 720, cy = 1010; let ph = 0; T.forEach((x, i) => { if (t >= x) ph = i; });
  // definition card
  const [bl, bc, ti, sub] = HOWCARD[ph], ca = slide(t, T[ph], .4, 24), cs = pop(t, T[ph], .45);
  panel(110, 340, 860, 140, { stroke: rgba(bc, .55), a: E.out(pr(t, s.start, s.start + .4)) });
  g.save(); g.globalAlpha *= ca.a; g.translate(186, 410); g.scale(cs.s, cs.s); g.beginPath(); g.arc(0, 0, 46, 0, 7); g.fillStyle = bc; g.shadowColor = bc; g.shadowBlur = 24; g.fill(); g.shadowBlur = 0; txt(bl, 0, 3, { size: bl.length > 1 ? 34 : 50, weight: 900, font: F.d, align: 'center', base: 'middle', color: '#06101C' }); g.restore();
  txt(ti, 262, 402 + ca.y, { size: 44, weight: 800, font: F.d, a: ca.a }); txt(sub, 262, 448 + ca.y, { size: 25, font: F.m, weight: 400, color: C.dim, a: ca.a });
  // link state
  const brk = pr(t, P.tBrk, P.tBrk + .35) * (1 - pr(t, P.tHeal, P.tHeal + .35));
  netLink(t, EX + NW / 2, WX - NW / 2, y, brk, { col: t >= P.tHeal ? C.green : C.cyan });
  // values
  const eVal = t >= P.tW3 + .45 ? 'v3' : t >= T[0] + .65 ? 'v2' : 'v1', wVal = t >= P.tSync + .5 ? 'v3' : t >= T[0] + 1.2 ? 'v2' : 'v1';
  // phase 0: write -> replicate -> read latest
  const t0 = T[0]; if (ph === 0) {
    pkt(EX, cy - 48, EX, y + NH / 2, pr(t, t0 + .2, t0 + .65), C.green, { r: 10 }); pkt(EX + NW / 2, y, WX - NW / 2, y, pr(t, t0 + .7, t0 + 1.2), C.cyan, { r: 10 });
    pkt(WX, cy - 48, WX, y + NH / 2, pr(t, t0 + 1.4, t0 + 1.8), C.violet, { r: 10 }); pkt(WX, y + NH / 2, WX, cy - 48, pr(t, t0 + 1.85, t0 + 2.25), C.green, { r: 10 });
    const k = pop(t, t0 + 2.25, .4); pill(WX, 1150, 'v2  ✓ latest', C.green, { size: 26, a: k.a, s: k.s, h: 52 });
    const kw = pop(t, t0 + .1, .4); pill(EX, 1150, 'write v2', C.green, { size: 26, a: kw.a, s: kw.s, h: 52 });
  }
  // phase 1: every request answered
  if (ph === 1) { const t1 = T[1]; for (const [x, d] of [[EX, 0], [WX, .25]]) for (let sp = t1 + .15 + d; sp < T[2] - .4; sp += 1.3) { pkt(x - 14, cy - 48, x - 14, y + NH / 2, (t - sp) / .4, C.violet, { r: 9 }); pkt(x + 14, y + NH / 2, x + 14, cy - 48, (t - sp - .45) / .4, C.green, { r: 9 }); }
    [EX, WX].forEach((x, i) => { const k = pop(t, t1 + .6 + i * .25, .4); pill(x, 1150, 'reply ✓', C.green, { size: 26, a: k.a, s: k.s, h: 52 }); }); }
  // phase 2: partition, new write v3 can't replicate, nodes keep running
  if (ph === 2) { const kw = pop(t, P.tW3 - .1, .4); pill(EX, 1150, 'write v3', C.green, { size: 26, a: kw.a, s: kw.s, h: 52 });
    pkt(EX, cy - 48, EX, y + NH / 2, pr(t, P.tW3, P.tW3 + .45), C.green, { r: 10 });
    const ru = pr(t, P.tW3 + .55, P.tW3 + 1.0); if (ru < 1) pkt(EX + NW / 2, y, WX - NW / 2, y, ru * .55, C.cyan, { r: 10 }); else cross(540, y, 18, C.red, 1 - pr(t, P.tW3 + 1.6, P.tW3 + 2), 6);
    [EX, WX].forEach((x, i) => { const k = pop(t, P.tW3 + 1.2 + i * .15, .4); pill(x, y - NH / 2 - 34, 'STILL RUNNING', C.green, { size: 18, a: k.a, s: k.s, h: 34 }); }); }
  // phase 3: CP refuses
  if (ph === 3) { const t3 = P.tRef; pkt(WX, cy - 48, WX, y + NH / 2, pr(t, T[3] + .2, T[3] + .6), C.violet, { r: 10 }); pkt(WX, y + NH / 2, WX, cy - 48, pr(t, t3, t3 + .4), C.red, { r: 10 });
    const k = pop(t, t3 + .4, .4); pill(WX, 1150, 'ERROR · 503', C.red, { size: 26, solid: true, a: k.a, s: k.s, h: 52, glow: 16 }); }
  // phase 4: AP answers stale
  if (ph === 4) { const t4 = P.tRet; pkt(WX, cy - 48, WX, y + NH / 2, pr(t, T[4] + .2, T[4] + .6), C.violet, { r: 10 }); pkt(WX, y + NH / 2, WX, cy - 48, pr(t, t4, t4 + .4), C.amber, { r: 10 });
    const k = pop(t, t4 + .4, .4); pill(WX, 1150, 'v2 · STALE', C.amber, { size: 26, solid: true, a: k.a, s: k.s, h: 52, glow: 16 }); }
  // phase 5: heal + sync
  if (ph === 5) { pkt(EX + NW / 2, y, WX - NW / 2, y, pr(t, P.tSync, P.tSync + .5), C.green, { r: 11 }); const k = pop(t, P.tConv, .45); pill(540, 1150, 'CONVERGED · both v3', C.green, { size: 28, solid: true, a: k.a, s: k.s, h: 58, glow: 22 }); }
  // nodes
  const wcol = ph === 3 ? C.red : ph === 4 ? C.amber : ph === 5 && t >= P.tSync + .5 ? C.green : C.cyan, ecol = ph === 5 && t >= P.tSync + .5 ? C.green : C.cyan;
  const pe = pop(t, s.start + .1), pw = pop(t, s.start + .2);
  replica(EX, y, 'East', eVal, ecol, { a: pe.a, s: pe.s, subCol: eVal === 'v3' ? C.green : undefined });
  replica(WX, y, 'West', wVal, wcol, { a: pw.a, s: pw.s, sub: ph === 3 ? 'refusing' : undefined, ...(ph === 3 ? { } : {}) });
  if (ph === 3) { const k = pop(t, P.tRef - .1, .4); g.save(); g.translate(WX, y - NH / 2 - 34); g.scale(k.s, k.s); pill(0, 0, 'NOT SURE IT\'S LATEST', C.red, { size: 19, a: k.a, h: 36, padX: 14 }); g.restore(); }
  if (ph === 4) { const k = pop(t, P.tRet - .1, .4); g.save(); g.translate(WX, y - NH / 2 - 34); g.scale(k.s, k.s); pill(0, 0, 'latest is v3', C.amber, { size: 19, a: k.a, h: 36, padX: 14 }); g.restore(); }
  flash(EX, y, 100, C.green, t, T[0] + .65); flash(WX, y, 100, C.green, t, T[0] + 1.2); flash(EX, y, 100, C.green, t, P.tW3 + .45); flash(WX, y, 100, C.red, t, P.tRef); flash(WX, y, 100, C.green, t, P.tSync + .5);
  // clients
  const pc = pop(t, s.start + .3); client(EX, cy, 'client', C.green, { a: pc.a, s: pc.s }); client(WX, cy, 'client', C.violet, { a: pc.a, s: pc.s });
  // big mode pill
  if (ph === 3 || ph === 4) { const lab = ph === 3 ? 'CP' : 'AP', col = ph === 3 ? C.cyan : C.violet, tt = ph === 3 ? P.tCP : P.tAP, k = pop(t, tt, .45); pill(540, 1268, lab, col, { size: 44, solid: true, a: k.a, s: k.s, h: 76, padX: 40, glow: 30, font: F.d, weight: 900 }); }
  if (ph === 3) tint(C.red, .1 * pr(t, P.tRef, P.tRef + .3));
};
SCN.how.init = s => {
  const T = s.lines.map(l => l.start - .1), P = { T };
  P.tBrk = cueT(s, [2, null, .15]); P.tW3 = cueT(s, [2, 'survives', -.1]); P.tRef = cueT(s, [3, 'refuses', -.05]); P.tCP = cueT(s, [3, "that's cp", .1]); P.tRet = cueT(s, [4, 'returns', -.05]); P.tAP = cueT(s, [4, "that's ap", .1]);
  P.tHeal = cueT(s, [5, 'heals', -.1]); P.tSync = P.tHeal + .35; P.tConv = cueT(s, [5, 'converge', -.05]); SCN.how.P = P;
  T.forEach((x, i) => cue(x, 'swish', .4)); cue(T[0] + .65, 'ping', .5); cue(T[0] + 1.2, 'ping', .5); cue(T[0] + 2.25, 'confirm', .5); cue(T[1] + .6, 'blip', .4); cue(T[1] + .85, 'blip', .4);
  cue(P.tBrk, 'error', .8); cue(P.tW3 + .45, 'ping', .4); cue(P.tW3 + 1.0, 'thud', .5); cue(P.tRef, 'error', .9); cue(P.tCP, 'impact', .6); cue(P.tRet, 'blip', .6); cue(P.tAP, 'impact', .6); cue(P.tHeal, 'switch', .7); cue(P.tConv, 'positive', .8);
};

// =============== REAL-WORLD EXAMPLE ===============
SCN.example = (t, s) => {
  const P = SCN.example.P;
  // --- top: Dynamo shopping cart (AP)
  const ta = slide(t, s.start + .05, .45, 30);
  panel(80, 340, 920, 470, { a: ta.a, stroke: rgba(C.violet, .45) });
  txt('AMAZON DYNAMO', 120, 398 + ta.y, { size: 34, weight: 900, font: F.d, ls: 2, a: ta.a }); txt('shopping cart', 120, 434 + ta.y, { size: 22, font: F.m, weight: 400, color: C.dim, a: ta.a });
  const apk = pop(t, P.tAP, .4); pill(900, 396, 'AP', C.violet, { size: 30, solid: true, a: apk.a, s: apk.s, h: 54, glow: 20 });
  const heal = pr(t, P.tMerge, P.tMerge + .4), br = pr(t, s.start + .4, s.start + .8) * (1 - heal);
  netLink(t, 420, 660, 540, br, { a: ta.a, label: false, col: heal > 0 ? C.green : C.cyan });
  const r1 = pop(t, s.start + .2), r2 = pop(t, s.start + .3);
  svc(280, 540, 280, 120, { label: 'Replica 1', icon: 'cart', col: C.violet, size: 30, a: r1.a, s: r1.s, glow: .35 }); svc(800, 540, 280, 120, { label: 'Replica 2', icon: 'cart', col: C.violet, size: 30, a: r2.a, s: r2.s, glow: .35 });
  [[280, '+ book', P.tAdd], [800, '+ lamp', P.tAdd + .35]].forEach(([x, lab, tt]) => { const k = pop(t, tt, .4); if (k.a <= 0) return; const fade = 1 - .55 * pr(t, P.tMerge + .2, P.tMerge + .6); pill(x, 654, lab, C.green, { size: 26, a: k.a * fade, s: k.s, h: 50 }); check(x + 110, 652, 12, C.green, k.a * fade, 5, pr(t, tt + .2, tt + .5)); });
  const ka = pop(t, P.tAdd + .7, .4); txt('both writes accepted', 540, 720, { size: 22, font: F.m, weight: 700, align: 'center', color: C.green, a: ka.a * (1 - pr(t, P.tMerge, P.tMerge + .3)) });
  if (t >= P.tMerge) { const u = E.io(pr(t, P.tMerge, P.tMerge + .5)); qarrow([280, 680], [300, 760], [400, 760], rgba(C.green, .7), u, 1, 3); qarrow([800, 680], [780, 760], [680, 760], rgba(C.green, .7), u, 1, 3);
    const k = pop(t, P.tMerge + .45, .45); pill(540, 760, 'merged cart: book + lamp', C.green, { size: 24, solid: true, a: k.a, s: k.s, h: 52, glow: 18 }); }
  // --- bottom: ZooKeeper (CP)
  const ba = slide(t, P.tZK - .1, .45, 30); if (ba.a <= 0) return;
  panel(80, 850, 920, 480, { a: ba.a, stroke: rgba(C.cyan, .45) });
  txt('ZOOKEEPER', 120, 908 + ba.y, { size: 34, weight: 900, font: F.d, ls: 2, a: ba.a }); txt('5-node ensemble', 120, 944 + ba.y, { size: 22, font: F.m, weight: 400, color: C.dim, a: ba.a });
  const cpk = pop(t, P.tZK + .2, .4); pill(900, 906, 'CP', C.cyan, { size: 30, solid: true, a: cpk.a, s: cpk.s, h: 54, glow: 20 });
  const xs = [190, 330, 470, 690, 830], ny = 1090, sp = pr(t, P.tMin - .2, P.tMin + .2);
  const pa = E.out(pr(t, P.tZK, P.tZK + .4)); g.save(); g.globalAlpha *= pa * sp; seg(580, 990, 580, 1300, C.red, 1, 4, [14, 12]); txt('PARTITION', 580, 1316, { size: 18, font: F.m, weight: 700, ls: 3, align: 'center', color: C.red }); g.restore();
  for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) { const cross2 = (i < 3) !== (j < 3); if (cross2 && sp >= 1) continue; if (Math.abs(i - j) > 1 && !(i === 2 && j === 3)) continue; seg(xs[i], ny, xs[j], ny, rgba(cross2 ? mix(C.cyan, C.red, sp) : C.cyan, .4), pa * (cross2 ? 1 - sp : 1), 3); }
  xs.forEach((x, i) => { const k = pop(t, P.tZK + .1 + i * .07, .4), minor = i >= 3, col = minor && sp > .5 ? C.red : i < 3 && sp > .5 ? C.green : C.cyan;
    g.save(); g.translate(x, ny); g.scale(k.s, k.s); g.globalAlpha *= k.a; g.beginPath(); g.arc(0, 0, 50, 0, 7); g.fillStyle = mix(C.panel, col, .18); g.shadowColor = rgba(col, .6); g.shadowBlur = 26; g.fill(); g.shadowBlur = 0; g.lineWidth = 3; g.strokeStyle = col; g.stroke(); glyph('server', 0, 0, 30, col); g.restore();
    if (i === 1 && sp > .5) txt('LEADER', x, ny - 70, { size: 18, font: F.m, weight: 700, ls: 2, align: 'center', color: C.green, a: k.a }); });
  if (sp > .5) { const k = pop(t, P.tMin, .4); pill(330, 1210, 'QUORUM 3/5 · writes OK', C.green, { size: 21, a: k.a, s: k.s, h: 44 });
    const k2 = pop(t, P.tRej, .4); pill(760, 1210, 'NO QUORUM', C.red, { size: 21, a: k2.a, s: k2.s, h: 44 });
    const wu = pr(t, P.tRej - .45, P.tRej - .05); if (wu > 0 && wu < 1) pkt(900, 980, 840, 1040, wu, C.violet, { r: 9 }); if (t >= P.tRej) { cross(830, ny, 16, C.red, 1, 6); pill(760, 1262, 'write rejected', C.red, { size: 20, solid: true, a: k2.a, s: k2.s, h: 38 }); } }
};
SCN.example.init = s => {
  const P = { tAP: cueT(s, [0, 'ap', -.05]), tAdd: cueT(s, [1, 'add', -.05]), tMerge: cueT(s, [1, 'merged', -.1]), tZK: cueT(s, [2, null, -.1]), tMin: cueT(s, [2, 'minority', -.05]), tRej: cueT(s, [2, 'rejects', .05]) }; SCN.example.P = P;
  cue(s.start + .2, 'pop', .5); cue(P.tAP, 'confirm', .6); cue(P.tAdd, 'pop', .6); cue(P.tAdd + .35, 'pop', .6); cue(P.tMerge, 'swish', .5); cue(P.tMerge + .45, 'positive', .7); cue(P.tZK, 'whoosh', .5); cue(P.tZK + .2, 'confirm', .6); cue(P.tMin - .1, 'switch', .6); cue(P.tRej, 'error', .8);
};

// =============== CP vs AP ===============
SCN.compare = compareScene({
  left: { head: 'CP', sub: 'consistency first', col: C.cyan, good: true, steps: [['Partition happens', [0, null, .05]], ['Minority refuses', [0, 'some', -.1]], ['Some requests fail', [0, 'fail', -.1]], ['No stale reads', [0, 'never', -.1]], ['ALWAYS CORRECT', [0, '$end', -.05]]] },
  right: { head: 'AP', sub: 'availability first', col: C.violet, good: true, steps: [['Partition happens', [1, null, .05]], ['Every node answers', [1, 'every', -.05]], ['Reads may be stale', [1, 'answers', .1]], ['Data catches up', [1, 'catches', -.1]], ['ALWAYS ONLINE', [1, 'later', .05]]] },
  swapAt: [1, null, 0]
});

// =============== TAKEAWAYS ===============
SCN.takeaways = takeawaysScene({
  title: [['Remember ', C.text], ['3', C.cyan], [' things', C.text]],
  cards: [
    { title: 'Partitions will happen', sub: 'P is not optional → the choice is C or A', col: C.amber, at: [1, null, -.1] },
    { title: 'No partition? Latency vs C', sub: 'PACELC: else, latency vs consistency', col: C.cyan, at: [2, null, -.1] },
    { title: 'CAP C ≠ ACID C', sub: 'CAP consistency = linearizability', col: C.violet, at: [3, null, -.1] }
  ],
  note: { segs: [['Carts, feeds → ', C.dim], ['AP', C.violet], ['    locks, leaders → ', C.dim], ['CP', C.cyan]], at: [3, '$end', -.6] },
  mono: { text: 'Brewer 2000  ·  Gilbert & Lynch 2002  ·  Abadi (PACELC)', at: [3, '$end', -.3] }
});

// =============== SUMMARY ===============
SCN.summary = summaryScene({
  label: 'CAP THEOREM  =',
  rows: [{ text: 'Network splits?', at: [0, 'when', -.05] }, { text: 'Correct data', col: C.cyan, at: [0, 'correct', -.05] }, { text: 'or constant uptime', col: C.violet, at: [0, 'constant', -.05] }],
  icon: (t, s) => {
    const a = pop(t, s.start + .1, .5); if (a.a <= 0) return; g.save(); g.globalAlpha *= a.a; g.translate(540, 520); g.scale(a.s, a.s); g.translate(-540, -520);
    netLink(t, 450, 630, 520, 1, { label: false });
    [[390, C.cyan], [690, C.violet]].forEach(([x, col]) => { g.beginPath(); g.arc(x, 520, 56, 0, 7); g.fillStyle = mix(C.panel, col, .18); g.shadowColor = rgba(col, .6); g.shadowBlur = 30; g.fill(); g.shadowBlur = 0; g.lineWidth = 3; g.strokeStyle = col; g.stroke(); glyph('db', x, 520, 36, col); });
    g.restore();
  }
});

// =============== CTA ===============
SCN.cta = ctaScene({ big: 'System Design', bigPhrase: 'system', sub: 'explained visually', subPhrase: 'explained' });
