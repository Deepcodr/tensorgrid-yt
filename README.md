# tensorgrid-yt

Automated short-form explainer videos (system design + ML) for the TensorGrid YouTube channel.

- `engine/` — renderer (canvas + Playwright), narration (Kokoro TTS), music/SFX synthesis, mastering, QA. Entry point: `python3 engine/make.py`.
- `videos/<id>/` — one folder per video: `script.json` (narration + metadata) and `scenes.js` (animation).
- `topics.json` — publishing queue and schedule (10 videos/month, every 3 days from the 1st, 19:00 IST, via Metricool).
- `CLAUDE.md` — the step-by-step playbook each scheduled run follows.
- `media` branch — temporary public hosting for rendered MP4s until Metricool copies them.
