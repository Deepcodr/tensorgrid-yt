#!/usr/bin/env python3
"""TensorGrid video pipeline.  Usage:  python3 engine/make.py <step> videos/<id> [args]

Steps (run in this order):
  setup               install python deps + download speech / ASR models (cached in ~/.cache/tensorgrid)
  voice     <vdir>    synthesize each narration line (Kokoro), write build/audio/lines.json
  timeline  <vdir>    lay lines out in time, write build/timeline.json|js + narration.wav
  stills    <vdir> t1 t2 ...   render preview frames + a contact sheet build/stills/sheet.jpg
  sweep     <vdir>    render every 2nd frame in-page to catch exceptions; writes build/cues.json
  audio     <vdir>    music + sound effects + mix + master to -14 LUFS (needs build/cues.json)
  render    <vdir>    full 1080x1920 render (2 workers) + mux -> build/final.mp4 and build/share.mp4 (<25MB)
  check     <vdir>    transcribe the final video against the script, report loudness/duration
  host      <vdir>    push build/share.mp4 to the 'media' branch, print its public raw URL
"""
import json, os, re, subprocess, sys, shutil, glob

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.expanduser(os.environ.get("TG_MODELS", "~/.cache/tensorgrid"))
KOKORO = f"{CACHE}/kokoro-v1.0.onnx"; VOICES = f"{CACHE}/voices-v1.0.bin"; WHISPER = f"{CACHE}/sherpa-onnx-whisper-base.en"
REPO = "Deepcodr/tensorgrid-yt"
LEAD, LINE_GAP, SCENE_GAP, TAIL, SR = 0.35, 0.24, 0.62, 1.6, 48000

def sh(cmd, **kw):
    print("+", cmd if isinstance(cmd, str) else " ".join(cmd), flush=True)
    return subprocess.run(cmd, shell=isinstance(cmd, str), check=True, **kw)

def load_script(vdir): return json.load(open(f"{vdir}/script.json"))
def lines_of(sc): return [l if isinstance(l, dict) else {"text": l} for l in sc["lines"]]

def setup():
    sh("pip install --break-system-packages -q kokoro-onnx soundfile sherpa-onnx scipy pillow numpy 2>&1 | grep -v -i warning || true")
    os.makedirs(CACHE, exist_ok=True)
    gh = "https://github.com"
    if not os.path.exists(KOKORO): sh(f"curl -sSL -m 600 -o {KOKORO} {gh}/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx")
    if not os.path.exists(VOICES): sh(f"curl -sSL -m 600 -o {VOICES} {gh}/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin")
    if not os.path.exists(WHISPER):
        sh(f"curl -sSL -m 600 -o {CACHE}/wb.tar.bz2 {gh}/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-whisper-base.en.tar.bz2 && tar xjf {CACHE}/wb.tar.bz2 -C {CACHE} && rm {CACHE}/wb.tar.bz2")
    for f in (KOKORO, VOICES, WHISPER): assert os.path.exists(f), f"missing {f}"
    print("setup ok")

def _asr():
    import sherpa_onnx
    d = WHISPER + "/"
    return sherpa_onnx.OfflineRecognizer.from_whisper(encoder=d + "base.en-encoder.onnx", decoder=d + "base.en-decoder.onnx", tokens=d + "base.en-tokens.txt", num_threads=2)

def _transcribe(rec, x, sr):
    st = rec.create_stream(); st.accept_waveform(sr, x); rec.decode_stream(st); return st.result.text.strip()

NORM = lambda s: re.sub(r"[^a-z0-9 ]", "", s.lower().replace("-", " ").replace("%", " percent")).split()

def voice(vdir):
    import numpy as np, soundfile as sf
    from kokoro_onnx import Kokoro
    S = load_script(vdir); k = Kokoro(KOKORO, VOICES); out = []; os.makedirs(f"{vdir}/build/audio", exist_ok=True)
    rec = _asr()
    for sc in S["scenes"]:
        for i, l in enumerate(lines_of(sc)):
            say = l.get("say", l["text"])  # optional phonetic override for the TTS
            s, sr = k.create(say, voice=S.get("voice", "af_heart"), speed=S.get("speed", 1.06), lang="en-us")
            s = np.asarray(s, dtype=np.float32); idx = np.where(np.abs(s) > 0.012)[0]
            s = s[max(0, idx[0] - int(.03 * sr)): idx[-1] + int(.03 * sr)]
            fn = f"{vdir}/build/audio/{sc['id']}_{i}.wav"; sf.write(fn, s, sr)
            heard = _transcribe(rec, s, sr); hw = set(NORM(heard)); rw = NORM(l["text"]); miss = [w for w in rw if w not in hw]
            out.append({"scene": sc["id"], "i": i, "text": l["text"], "file": fn, "dur": round(len(s) / sr, 3), "heard": heard, "missing": miss})
            print(f"{'OK  ' if len(miss) <= 1 else 'CHECK'} {sc['id']}_{i} {len(s)/sr:5.2f}s | {l['text']}" + (f"\n        heard: {heard}" if len(miss) > 1 else ""))
    json.dump(out, open(f"{vdir}/build/audio/lines.json", "w"), indent=1)
    print("speech total", round(sum(o["dur"] for o in out), 1), "s  (CHECK lines: listen-proof by rewording; ASR mishears homophones too)")

def timeline(vdir):
    import numpy as np, soundfile as sf
    S = load_script(vdir); L = json.load(open(f"{vdir}/build/audio/lines.json")); by = {(o["scene"], o["i"]): o for o in L}
    t = LEAD; segs = []; scenes = []
    for si, sc in enumerate(S["scenes"]):
        if si: t += SCENE_GAP - LINE_GAP
        meta = {k: v for k, v in sc.items() if k not in ("lines",)}
        scenes.append({**meta, "label": sc.get("label"), "captions": bool(sc.get("captions")), "start": round(max(0, t - (SCENE_GAP / 2 if si else LEAD)), 3), "lines": []})
        for i, l in enumerate(lines_of(sc)):
            o = by[(sc["id"], i)]; x, sr = sf.read(o["file"], dtype="float32"); n = int(round(len(x) * SR / sr)); x = np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x).astype(np.float32)
            d = len(x) / SR; segs.append((t, x)); scenes[-1]["lines"].append({"text": l["text"], "start": round(t, 3), "end": round(t + d, 3)})
            t += d + LINE_GAP + float(l.get("pause", 0))
    total = t - LINE_GAP + TAIL
    for i, s in enumerate(scenes): s["end"] = scenes[i + 1]["start"] if i + 1 < len(scenes) else round(total, 3)
    buf = np.zeros(int(total * SR) + SR, dtype=np.float32)
    for st, x in segs:
        a = int(st * SR); f = int(.008 * SR); x = x.copy(); x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f); buf[a:a + len(x)] += x
    sf.write(f"{vdir}/build/audio/narration.wav", buf[:int(total * SR)], SR)
    TL = {"id": S["id"], "duration": round(total, 3), "keywords": S.get("keywords", {}), "music": S.get("music", {}), "scenes": scenes}
    json.dump(TL, open(f"{vdir}/build/timeline.json", "w"), indent=1); open(f"{vdir}/build/timeline.js", "w").write("window.TL=" + json.dumps(TL) + ";")
    for s in scenes:
        print(f"{s['id']:12s} {s['start']:6.2f} -> {s['end']:6.2f} ({s['end']-s['start']:.1f}s)")
        for l in s["lines"]: print(f"     {l['start']:6.2f}-{l['end']:6.2f} {l['text']}")
    print("TOTAL", round(total, 1), "s")

def stills(vdir, *ts):
    sh(["node", f"{HERE}/still.mjs", vdir, *ts])
    from PIL import Image
    files = [f"{vdir}/build/stills/t{float(t):06.2f}.jpg" for t in ts]; files = [f for f in files if os.path.exists(f)]
    if not files: return
    sc = 0.5 if len(files) <= 3 else 0.4; w, h = int(1080 * sc), int(1920 * sc); sheet = Image.new("RGB", (w * len(files), h))
    for i, f in enumerate(files): sheet.paste(Image.open(f).resize((w, h)), (i * w, 0))
    sheet.save(f"{vdir}/build/stills/sheet.jpg", quality=88); print("contact sheet:", f"{vdir}/build/stills/sheet.jpg")

def sweep(vdir): sh(["node", f"{HERE}/sweep.mjs", vdir])

def _lufs(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    tail = r[r.rfind("Summary:"):]; I = float(re.search(r"I:\s+(-?[\d.]+) LUFS", tail).group(1)); P = float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", tail).group(1)); return I, P

def audio(vdir):
    if not os.path.exists(f"{vdir}/build/cues.json"): sweep(vdir)
    sh([sys.executable, f"{HERE}/audio.py", vdir])
    g = 8.7
    for _ in range(3):
        sh([sys.executable, f"{HERE}/master.py", vdir, str(g)]); I, P = _lufs(f"{vdir}/build/audio/master.wav"); print(f"master: {I} LUFS, true peak {P} dBTP (gain {g})")
        if abs(I + 14) <= 0.4: break
        g += (-14 - I)

def render(vdir):
    TL = json.load(open(f"{vdir}/build/timeline.json")); F = int(round(TL["duration"] * 30)); H = F // 2; B = f"{vdir}/build"
    ps = [subprocess.Popen(["node", f"{HERE}/render.mjs", vdir, str(a), str(b), f"{B}/part{i}.mp4"]) for i, (a, b) in enumerate([(0, H), (H, F)])]
    if any(p.wait() for p in ps): sys.exit("render worker failed")
    open(f"{B}/parts.txt", "w").write(f"file 'part0.mp4'\nfile 'part1.mp4'\n")
    sh(f"ffmpeg -y -loglevel error -f concat -safe 0 -i {B}/parts.txt -i {B}/audio/master.wav -c:v copy -c:a aac -b:a 192k -ar 48000 -movflags +faststart -shortest {B}/final.mp4")
    sh(f"ffmpeg -y -loglevel error -i {B}/final.mp4 -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -c:a copy -movflags +faststart {B}/share.mp4")
    for f in glob.glob(f"{B}/part*.mp4*"): os.remove(f)
    for f in ("final.mp4", "share.mp4"): print(f, round(os.path.getsize(f"{B}/{f}") / 2**20, 1), "MiB")

def check(vdir):
    import numpy as np, soundfile as sf
    B = f"{vdir}/build"; TL = json.load(open(f"{B}/timeline.json")); sh(f"ffmpeg -y -loglevel error -i {B}/share.mp4 -vn -ac 1 -ar 16000 {B}/check.wav")
    x, sr = sf.read(f"{B}/check.wav", dtype="float32"); rec = _asr(); ok = tot = 0; bad = []
    for sc in TL["scenes"]:
        for l in sc["lines"]:
            h = _transcribe(rec, x[int((l["start"] - .12) * sr): int((l["end"] + .15) * sr)], sr); hw = set(NORM(h)); rw = NORM(l["text"]); hit = sum(w in hw for w in rw); ok += hit; tot += len(rw)
            if hit < len(rw) - 1: bad.append(f"{l['start']:6.2f}s  said: {l['text']}\n         heard: {h}")
    probe = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=width,height,r_frame_rate", "-of", "json", f"{B}/share.mp4"], capture_output=True, text=True).stdout
    I, P = _lufs(f"{B}/audio/master.wav"); pct = ok / max(1, tot)
    print(json.dumps({"words_recognised": f"{ok}/{tot} ({pct:.0%})", "loudness_LUFS": I, "true_peak_dBTP": P, "probe": json.loads(probe), "share_MiB": round(os.path.getsize(f'{B}/share.mp4') / 2**20, 1)}, indent=1))
    for b in bad: print("CHECK", b)
    if pct < 0.93: sys.exit("narration check failed")
    print("check ok")

def host(vdir):
    vid = load_script(vdir)["id"]; tmp = os.path.join(os.environ.get("TMPDIR", "/tmp"), "tg-media"); shutil.rmtree(tmp, ignore_errors=True)
    sh(f"git clone --depth 1 --branch media https://github.com/{REPO} {tmp}")
    os.makedirs(f"{tmp}/videos", exist_ok=True); shutil.copy(f"{vdir}/build/share.mp4", f"{tmp}/videos/{vid}.mp4")
    sh(f"cd {tmp} && git add videos/{vid}.mp4 && git -c user.name=Deepcodr -c user.email=thedarkphoenix401@gmail.com commit -qm 'Add {vid} video' && git push origin media")
    url = f"https://raw.githubusercontent.com/{REPO}/media/videos/{vid}.mp4"
    for _ in range(12):
        r = subprocess.run(["curl", "-sSIL", "-o", "/dev/null", "-w", "%{http_code}", url], capture_output=True, text=True).stdout
        if r.strip() == "200": break
        subprocess.run(["sleep", "5"])
    print("PUBLIC_URL", url, "status", r)

def unhost(vid):
    """remove a video from the media branch once Metricool has copied it"""
    tmp = os.path.join(os.environ.get("TMPDIR", "/tmp"), "tg-media"); shutil.rmtree(tmp, ignore_errors=True)
    sh(f"git clone --depth 1 --branch media https://github.com/{REPO} {tmp}")
    if os.path.exists(f"{tmp}/videos/{vid}.mp4"):
        sh(f"cd {tmp} && git rm -q videos/{vid}.mp4 && git -c user.name=Deepcodr -c user.email=thedarkphoenix401@gmail.com commit -qm 'Remove {vid} (copied by Metricool)' && git push origin media")

if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] not in globals(): print(__doc__); sys.exit(1)
    globals()[sys.argv[1]](*sys.argv[2:])
