# Synthesises background music + sound effects and mixes them under the narration.
import json, sys, os, numpy as np, soundfile as sf
SR = 48000
B = os.path.join(sys.argv[1], "build")  # usage: python3 audio.py <videoDir>
TL = json.load(open(f"{B}/timeline.json")); CUES = json.load(open(f"{B}/cues.json")); DUR = TL["duration"]
N = int(DUR * SR); rng = np.random.default_rng(3)
SC = {s["id"]: s for s in TL["scenes"]}; SCL = TL["scenes"]; MUS = TL.get("music", {})
# music sections (scene ids from script.json "music"); defaults: tension = 2nd scene, solution from 3rd, lift = 2nd-last
TENSION = [SC[i] for i in MUS.get("tension", [SCL[1]["id"]])]; SOL = SC[MUS.get("solutionFrom", SCL[2]["id"])]; LIFT = SC[MUS.get("lift", SCL[-2]["id"])]

def env_ad(n, a=0.005, curve=5.0):
    t = np.arange(n) / SR; e = np.exp(-curve * t / max(n / SR, 1e-6)); k = max(1, int(a * SR)); e[:k] *= np.linspace(0, 1, k); return e
def fade(x, fi=0.004, fo=0.01):
    x = x.copy(); a, b = int(fi * SR), int(fo * SR)
    if a: x[:a] *= np.linspace(0, 1, a)
    if b: x[-b:] *= np.linspace(1, 0, b)
    return x
def bandnoise(n, lo, hi):
    X = np.fft.rfft(rng.standard_normal(n)); f = np.fft.rfftfreq(n, 1 / SR)
    w = 1 / (1 + (lo / np.maximum(f, 1)) ** 6) / (1 + (f / hi) ** 6); x = np.fft.irfft(X * w, n); return x / (np.abs(x).max() + 1e-9)
def lowpass(x, fc):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); return np.fft.irfft(X / (1 + (f / fc) ** 4), len(x))
def sweep(f0, f1, d, exp=True):
    n = int(d * SR); t = np.arange(n) / SR
    f = f0 * (f1 / f0) ** (t / d) if exp else f0 + (f1 - f0) * t / d; return np.sin(2 * np.pi * np.cumsum(f) / SR)
def tone(f, d): return np.sin(2 * np.pi * f * np.arange(int(d * SR)) / SR)
def bell(fs, d, amps=None, curve=6.0):
    n = int(d * SR); out = np.zeros(n)
    for i, f in enumerate(fs): out += (amps[i] if amps else 1 / (i + 1)) * np.sin(2 * np.pi * f * np.arange(n) / SR) * env_ad(n, 0.003, curve * (1 + i * .4))
    return out / np.abs(out).max()

def sfx(kind, v):
    if kind == "whoosh":
        n = int(.55 * SR); t = np.linspace(0, 1, n); out = np.zeros(n)
        for lo, hi, c in [(250, 700, .3), (600, 1800, .5), (1500, 5000, .7)]: out += bandnoise(n, lo, hi) * np.exp(-((t - c) / .2) ** 2)
        return .20 * v * fade(out / np.abs(out).max(), .02, .05)
    if kind == "swish":
        n = int(.28 * SR); t = np.linspace(0, 1, n); out = bandnoise(n, 900, 5000) * np.exp(-((t - .5) / .22) ** 2); return .14 * v * fade(out, .01, .03)
    if kind == "impact":
        n = int(1.1 * SR); out = sweep(95, 34, 1.1) * env_ad(n, .002, 4.5) + .45 * lowpass(rng.standard_normal(n), 900) * env_ad(n, .001, 14) / 3
        out[:int(.004 * SR)] += .5 * rng.standard_normal(int(.004 * SR)); return .70 * v * np.tanh(out * 1.6) / 1.0
    if kind == "thud":
        n = int(.5 * SR); out = sweep(120, 46, .5) * env_ad(n, .002, 7) + .2 * lowpass(rng.standard_normal(n), 700) * env_ad(n, .001, 22) / 3; return .42 * v * np.tanh(out * 1.4)
    if kind == "error":
        n = int(.13 * SR); a = np.sign(tone(196, .13)) * .5 + tone(196, .13) * .5; b = np.sign(tone(147, .13)) * .5 + tone(147, .13) * .5
        out = np.concatenate([fade(a, .004, .02), np.zeros(int(.03 * SR)), fade(b, .004, .05), np.zeros(int(.02 * SR))]); return .24 * v * lowpass(out, 1500)
    if kind == "blip":
        n = int(.09 * SR); out = sweep(360, 250, .09) * env_ad(n, .003, 5); return .16 * v * fade(out)
    if kind == "tick":
        n = int(.035 * SR); out = tone(1900, .035) * env_ad(n, .0008, 9) + .3 * bandnoise(n, 2500, 8000) * env_ad(n, .0005, 14); return .10 * v * out
    if kind == "ping": return .13 * v * bell([1318.5, 1975.5, 2637], .45, [1, .35, .15], 7)
    if kind == "pop":
        n = int(.075 * SR); return .15 * v * fade(sweep(330, 640, .075) * env_ad(n, .002, 4), .002, .02)
    if kind == "switch":
        n = int(.32 * SR); out = np.zeros(n); k = int(.006 * SR)
        out[:k] += rng.standard_normal(k) * np.linspace(1, 0, k); o2 = int(.045 * SR); out[o2:o2 + k] += .7 * rng.standard_normal(k) * np.linspace(1, 0, k)
        th = sweep(150, 62, .16) * env_ad(int(.16 * SR), .001, 6); out[:len(th)] += .9 * th
        z = bandnoise(int(.14 * SR), 2200, 6500) * env_ad(int(.14 * SR), .002, 7); out[o2:o2 + len(z)] += .28 * z
        return .46 * v * np.tanh(out * 1.3)
    if kind == "confirm": return .15 * v * np.concatenate([fade(tone(659.3, .07) * env_ad(int(.07 * SR), .003, 3)), bell([880], .25, None, 7)])
    if kind == "positive":
        n = int(.95 * SR); out = np.zeros(n)
        for i, f in enumerate([523.25, 659.25, 783.99, 1046.5]): b = bell([f, f * 2, f * 3], .6, [1, .3, .1], 6); o = int(i * .075 * SR); out[o:o + len(b)] += b[: n - o] * (.9 if i < 3 else .6)
        return .16 * v * out / np.abs(out).max()
    if kind == "chime": return .15 * v * bell([880, 1320, 1760, 2640], 1.4, [1, .5, .4, .2], 4)
    if kind == "click":
        n = int(.04 * SR); out = tone(1100, .04) * env_ad(n, .0005, 10); out[:int(.002 * SR)] += .6 * rng.standard_normal(int(.002 * SR)); return .22 * v * out
    if kind == "bell":
        a = bell([1568, 3136, 4704], .7, [1, .4, .15], 6); b = bell([2093, 4186], .8, [1, .3], 5); out = np.zeros(int(.95 * SR)); out[:len(a)] += a; o = int(.13 * SR); out[o:o + len(b)] += b[: len(out) - o]; return .17 * v * out / np.abs(out).max()
    raise ValueError(kind)
def riser(d):
    n = int(d * SR); t = np.linspace(0, 1, n); out = .5 * bandnoise(n, 400, 6000) * t ** 2.2 + .5 * sweep(110, 620, d) * t ** 2.6
    trem = 1 + .35 * np.sin(2 * np.pi * np.cumsum(4 + 14 * t ** 2) / SR); return .15 * fade(out * trem, .05, .012)

def place(buf, x, t, pan=0.0):
    a = int(round(t * SR))
    if a < 0: x = x[-a:]; a = 0
    x = x[: max(0, N - a)]; l, r = np.sqrt((1 - pan) / 2) * 1.414, np.sqrt((1 + pan) / 2) * 1.414
    buf[a:a + len(x), 0] += x * l; buf[a:a + len(x), 1] += x * r

# ---------------- sound effects ----------------
fx = np.zeros((N, 2)); pans = {"ping": .25, "pop": -.15, "tick": .2, "blip": -.2}
for c in CUES:
    if c["k"] == "riser": place(fx, riser(c["v"]), c["t"]); continue
    place(fx, sfx(c["k"], c["v"]), c["t"], pans.get(c["k"], 0) * (1 if int(c["t"] * 7) % 2 else -1))

# ---------------- music ----------------
BPM = 100; BEAT = 60 / BPM; BAR = 4 * BEAT
CH = [[110.00, 164.81, 196.00, 246.94, 261.63], [87.31, 130.81, 174.61, 220.00, 329.63], [130.81, 164.81, 196.00, 246.94, 329.63], [98.00, 146.83, 196.00, 246.94, 293.66]]  # Am9 Fmaj7 Cmaj7 G6
def saw(f, n, det=0.0, harm=10, roll=1.7):
    t = np.arange(n) / SR; out = np.zeros(n)
    for h in range(1, harm + 1):
        if f * h > 5000: break
        out += np.sin(2 * np.pi * f * h * (1 + det) * t + h * 1.3) / h ** roll
    return out
mus = np.zeros((N, 2)); clen = 2 * BAR; nch = int(np.ceil(DUR / clen)) + 1; xf = 0.9
for i in range(nch):
    ch = CH[i % 4]; n = int((clen + xf) * SR); e = np.ones(n); k = int(xf * SR); e[:k] = np.sin(np.linspace(0, np.pi / 2, k)) ** 2; e[-k:] = np.cos(np.linspace(0, np.pi / 2, k)) ** 2
    L = sum(saw(f * 2, n, -0.0015) + saw(f * 2, n, 0.0022) for f in ch[1:]); R = sum(saw(f * 2, n, 0.0014) + saw(f * 2, n, -0.0025) for f in ch[1:])
    t = np.arange(n) / SR; sub = np.sin(2 * np.pi * ch[0] / 2 * t) * .9 + .25 * np.sin(2 * np.pi * ch[0] * t)
    a = int(i * clen * SR); m = min(n, N - a)
    if m <= 0: break
    mus[a:a + m, 0] += (L[:m] * .055 + sub[:m] * .07) * e[:m]; mus[a:a + m, 1] += (R[:m] * .055 + sub[:m] * .07) * e[:m]
# slow filter-like swell on the pad
tt = np.arange(N) / SR; mus *= (0.82 + 0.18 * np.sin(2 * np.pi * tt / 9.6))[:, None]
# arpeggio + kick + hat, entering with "the fix"
t_fix = SOL["start"]; t_out = DUR - 0.3
arp = np.zeros((N, 2)); perc = np.zeros((N, 2)); step = BEAT / 2; pat = [1, 2, 3, 4, 3, 2, 4, 2]
nst = int(DUR / step)
for s in range(nst):
    t0 = s * step; ch = CH[int(t0 // clen) % 4]
    lvl = 0.0 if t0 < t_fix - 2 * BAR else min(1.0, (t0 - (t_fix - 2 * BAR)) / (2 * BAR))
    if t0 < TENSION[0]["start"]: lvl = 0.0
    if lvl > 0:
        f = ch[pat[s % 8]] * 4; n = int(.5 * SR); x = (np.sin(2 * np.pi * f * np.arange(n) / SR) + .3 * np.sin(2 * np.pi * 2 * f * np.arange(n) / SR)) * env_ad(n, .003, 9)
        for d, g_, pan in [(0, 1, -.3 if s % 2 else .3), (step * 1.5, .42, .5 if s % 2 else -.5), (step * 3, .18, 0)]: place(arp, x * .05 * lvl * g_, t0 + d, pan)
    if t0 >= t_fix and t0 < t_out:
        if s % 4 == 0: n = int(.22 * SR); place(perc, sweep(105, 44, .22) * env_ad(n, .002, 6) * .26, t0)
        if s % 2 == 1: n = int(.03 * SR); place(perc, bandnoise(n, 6000, 14000) * env_ad(n, .0005, 8) * .028, t0, .2)
# tension pulse during the problem scene (tight 16ths that get louder)
for sc_ in TENSION:
  p0, p1 = sc_["start"], sc_["end"]
  for s in range(int((p1 - p0) / (BEAT / 4))):
    t0 = p0 + s * BEAT / 4; u = (t0 - p0) / (p1 - p0); n = int(.05 * SR); place(perc, tone(220 if s % 4 else 330, .05) * env_ad(n, .001, 7) * (.012 + .05 * u ** 1.5), t0, .3 * np.sin(s))
# hook drone
h1 = SCL[0]["end"]; n = int((h1 + 1.5) * SR); dr = (saw(55, n, 0, 6, 1.2) + saw(55.4, n, 0, 6, 1.2)) * .05 * np.linspace(.3, 1, n); dr[-int(1.5 * SR):] *= np.linspace(1, 0, int(1.5 * SR)); place(mus, dr, 0)
music = mus + arp + perc
# section dynamics: quieter under dense narration, lift for summary + CTA
gain = np.ones(N); s0 = LIFT["start"]; gain += 0.35 * np.clip((tt - s0) / 1.0, 0, 1)
gain *= np.clip(tt / 0.6, 0, 1) * np.clip((DUR - tt) / 1.4, 0, 1); music *= gain[:, None]

music *= 10 ** (-33.5 / 20) / np.sqrt((music ** 2).mean())   # bed sits well under the voice
fx *= 0.85
# ---------------- narration + ducking ----------------
nar, sr = sf.read(f"{B}/audio/narration.wav", dtype="float64"); assert sr == SR; nar = nar[:N]; nar = np.pad(nar, (0, N - len(nar)))
nar = nar / np.abs(nar).max() * 0.80
# gentle voice polish: high-pass rumble, light presence lift
X = np.fft.rfft(nar); f = np.fft.rfftfreq(N, 1 / SR); X *= (1 / (1 + (70 / np.maximum(f, 1)) ** 4)) * (1 + 0.25 * np.exp(-((np.log2(np.maximum(f, 1) / 3500)) / 0.8) ** 2)); nar = np.fft.irfft(X, N)
win = int(.05 * SR); envv = np.sqrt(np.convolve(nar ** 2, np.ones(win) / win, mode="same")); envv = np.minimum(1, envv / 0.05)
k = int(.25 * SR); envs = np.convolve(envv, np.hanning(k) / np.hanning(k).sum(), mode="same")
duck = 1 - 0.42 * envs
mix = np.stack([nar, nar], 1) * 1.0 + music * duck[:, None] * 0.95 + fx * (1 - 0.15 * envs)[:, None] * 0.95
peak = np.abs(mix).max(); print("pre-limit peak", round(float(peak), 3))
mix = np.tanh(mix * 1.05) if peak > 0.98 else mix
sf.write(f"{B}/audio/mix.wav", mix.astype(np.float32), SR)
sf.write(f"{B}/audio/music_fx.wav", (music * 0.95 + fx).astype(np.float32), SR)
r = lambda x: 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-9)
print("rms dB  voice", round(r(nar), 1), " music", round(r(music), 1), " fx", round(r(fx), 1), " mix", round(r(mix), 1), " dur", round(len(mix) / SR, 2))
