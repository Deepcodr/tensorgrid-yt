import sys, numpy as np, soundfile as sf
from scipy.ndimage import minimum_filter1d, uniform_filter1d
B = sys.argv[1] + "/build"; x, sr = sf.read(f"{B}/audio/mix.wav", dtype="float64"); gain_db = float(sys.argv[2]); ceil = 10 ** (-1.0 / 20)
# gentle soft-knee compression on the whole mix, then look-ahead peak limiting
env = np.sqrt(uniform_filter1d((x ** 2).mean(1), int(.03 * sr))); db = 20 * np.log10(env + 1e-9); thr, ratio = -24.0, 2.2
gr_db = np.where(db > thr, (thr + (db - thr) / ratio) - db, 0.0); gr_db = uniform_filter1d(gr_db, int(.06 * sr))
y = x * (10 ** ((gr_db + gain_db) / 20))[:, None]
from scipy.signal import resample_poly
pk = np.abs(resample_poly(y, 4, 1, axis=0)).max(1).reshape(-1, 4).max(1); pk = np.maximum(pk, np.abs(y).max(1)); need = np.minimum(1.0, ceil / np.maximum(pk, 1e-9)); la = int(.005 * sr)
g = minimum_filter1d(need, 2 * la + 1); g = uniform_filter1d(g, la);
y = y * g[:, None]; sf.write(f"{B}/audio/master.wav", y.astype(np.float32), sr); tp = np.abs(resample_poly(y, 4, 1, axis=0)).max(); print("true peak dBTP", round(20 * np.log10(tp), 2), " sample peak dBFS", round(20 * np.log10(np.abs(y).max()), 2), " max limiter GR dB", round(-20 * np.log10(g.min()), 1))
