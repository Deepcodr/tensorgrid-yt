# TensorGrid video pipeline — run playbook

This repo makes one animated explainer Short (system design or ML) per run and schedules it to the
owner's YouTube channel through Metricool. A scheduled task fires every 3 days; each firing is a fresh
session that follows this file top to bottom. Nobody is watching: never stop to ask a question. If a
step fails and can't be fixed, leave the slot empty, record why in `topics.json`, and say so in the
final message.

Owner: Pranav Patil (Deepcodr). Channel audience: developers preparing for interviews, engineers learning
system design and ML. Tone: clear, confident, technically exact.

## 0. Setup (every run)

```bash
git clone https://github.com/Deepcodr/tensorgrid-yt /home/claude/tensorgrid-yt   # if not present; attach with add_repo (push) first
cd /home/claude/tensorgrid-yt && git config user.name Deepcodr && git config user.email thedarkphoenix401@gmail.com
python3 engine/make.py setup      # pip deps + Kokoro voice + Whisper check model (~550 MB, from GitHub releases)
```
Chromium/Playwright are preinstalled (`/opt/npm-tools/node_modules/playwright`). ffmpeg is installed.

## 1. Pick the slot and the topic

- Read `topics.json`. Slots are `schedule.days` of every month at `schedule.time` IST.
- **Slot** = the earliest slot date that is (a) later than every `publishAt` already in `topics.json`
  and (b) at least 2 days after now. One video per run.
- Before building, call Metricool `getScheduledPosts` (blogId `7238339`, timezone `Asia/Calcutta`) for
  that slot's date. If a post already exists at that slot (a previous run got that far), record it in
  `topics.json` and move on to the next slot instead.
- **Topic** = the first entry with `"status": "queued"`.
- If none is queued, generate 6 new topics first: alternate `system-design` and `ml`; classic interview
  and fundamentals topics (e.g. rate limiting, consistent hashing, load balancers, caching strategies,
  database indexing, sharding, idempotency, message queues vs streams, backpropagation, embeddings,
  softmax, regularization, decision trees, batch norm, RAG, tokenization); never repeat an `id` already
  in the file. Each needs `id` (kebab-case), `title`, `category`, `hook` (a question), optional `notes`.
  Append them, commit, push.

## 2. Make the video

Invoke the **youtube-video-generation** skill and use its brief with **TOPIC** replaced by the topic's
title (and the topic's `hook`/`notes` as direction). Follow its structure: hook → problem → simple
definition → how it works → real-world example → before vs after → interview takeaways → one-line
summary → CTA. Realise it with this repo's engine, not with any external video service.

**Length:** aim for 60–85 s of narration total (short sentences; 2–7 lines per scene).

**Accuracy first.** Before writing, list in `videos/<id>/notes.md`: definition, the problem it solves,
how it works internally, states/flows, a realistic production example, common misconceptions, interview
points. Use web search to verify anything you are not certain of. Never invent behaviour.

### 2a. Script — `videos/<id>/script.json`
Copy the shape of `videos/kafka-consumer-groups/script.json`:
- `id`, `title`, `voice` (`af_heart`), `speed` (1.06)
- `keywords`: caption colouring, `{red:[bad words], green:[good], amber:[transitional], cyan:[nouns]}`
- `music`: `{tension:[scene ids], solutionFrom: scene id, lift: scene id}`
- `scenes`: `[{id, label?, captions?, lines:[string | {text, pause?, say?}]}]`.
  Use scene ids `hook, problem, definition, how, example, compare, takeaways, summary, cta`.
  `label` shows the chapter tag (omit for hook/summary/cta). `captions: true` on diagram scenes
  (problem, how, example, compare) — scenes whose on-screen text already says the words have none.
  The `cta` lines must be exactly: `Follow for more system design, explained visually.` (ML topics:
  `Follow for more AI concepts, explained visually.`) and `And save this for your next interview.`
- `youtube`: `{title (<=100 chars, ends with 1-2 hashtags), description (ends with "Narration is AI-generated." + hashtags), tags[]}`

Then:
```bash
python3 engine/make.py voice videos/<id>       # TTS per line + speech-recognition check
python3 engine/make.py timeline videos/<id>    # prints every line's start/end time
```
`voice` flags lines the recogniser heard differently (`CHECK`). Reword those lines (or add a `say`
spelling) and rerun — the ear test matters because nobody listens before publishing. Letters like
"Service A" can be read as the article "a": avoid single-letter names in narration.

### 2b. Visuals — `videos/<id>/scenes.js`
Read `engine/core.js` (primitives) and `engine/lib.js` (components + factories) first, then the two
reference videos `videos/circuit-breaker/scenes.js` and `videos/kafka-consumer-groups/scenes.js`.
Define `SCN.<sceneId> = (t, s) => {...}` for every scene and `SCN.<sceneId>.init = s => {...}` to
compute cue times (`cueT(s, [lineIdx, 'phrase', offset])`) and register sound effects with
`cue(time, kind, volume)` (kinds: whoosh swish impact thud error blip tick ping pop switch confirm
positive chime click bell; `riser` takes a duration as volume).
- Reuse factories: `compareScene`, `takeawaysScene`, `summaryScene`, `ctaScene` (ML topics:
  `ctaScene({big: 'AI Concepts', bigPhrase: 'ai concepts'})`).
- Teach visually: animate the mechanism (packets, state changes, curves via `axes` + `plot`, token
  attention via `tokenRow` + `attnArc`), reveal pieces as they are narrated, sync to phrases.
- Layout rules: canvas 1080×1920. Keep content in x 70–960 (key text ≤ 940 below y 1050) and y 330–1340.
  Captions occupy y 1390–1490. Top 300 px holds the progress bar + chapter tag.

QA loop (repeat until clean):
```bash
python3 engine/make.py sweep  videos/<id>                 # must print "sweep ok"
python3 engine/make.py stills videos/<id> 3.1 9.8 ...     # 3+ times per scene -> build/stills/sheet.jpg
```
Look at every contact sheet with the Read tool. Fix: overlapping text, text running outside boxes,
content in the safe-area margins, empty or static stretches, anything technically misleading.

### 2c. Sound, render, verify
```bash
python3 engine/make.py audio  videos/<id>    # music + SFX + mix, mastered to -14 LUFS
python3 engine/make.py render videos/<id>    # ~10 min; build/final.mp4 + build/share.mp4 (<25 MB)
python3 engine/make.py check  videos/<id>    # must end with "check ok"
python3 engine/make.py stills videos/<id> <a few times>   # final look at the finished frames
```
If `check` fails, fix the script/voice and rebuild. Do not schedule a video that failed `check`.

## 3. Host and schedule

```bash
python3 engine/make.py host videos/<id>      # pushes build/share.mp4 to the 'media' branch, prints PUBLIC_URL
```
(GitHub releases are blocked for these sessions; the public `media` branch is the host.)

Schedule with Metricool `createScheduledPost`:
- `blogId` `7238339`, `date` = slot `YYYY-MM-DDT19:00:00+05:30`
- `info`: `providers [{"network":"youtube"}]`, `media [PUBLIC_URL]`, `autoPublish true`, `draft false`,
  `publicationDate {"dateTime": "YYYY-MM-DDT19:00:00", "timezone": "Asia/Calcutta"}`, `text` = youtube.description,
  `youtubeData {"title", "type": "short", "privacy": "public", "tags", "category": "EDUCATION", "madeForKids": false, "isAiGeneratedContent": false}`,
  plus the empty defaults (`descendants []`, `firstCommentText ""`, `hasNotReadNotes false`, `mediaAltText []`, `shortener false`, `smartLinkData {"ids": []}`).
- The response's `media` should now point at `static.metricool.com` (Metricool copied the file). Only then run
  `python3 engine/make.py unhost <id>` to remove the file from the media branch.
- Instagram is out of scope until the owner connects it in Metricool.

## 4. Record and report

- Update the topic in `topics.json`: `status: "scheduled"`, `publishAt`, `metricoolPostId`, `plannerUrl`, `durationSec`.
- Commit `topics.json` and `videos/<id>/{script.json,scenes.js,notes.md}` (never `build/`) and push `main`
  (`git fetch origin main && git rebase origin/main` first).
- Send `build/share.mp4` to the user with SendUserFile, then finish with a short message: topic, publish
  date/time (IST), video length, the Metricool planner link, and the line "To cancel, delete the post in
  Metricool before it goes live." Mention anything that went wrong or was skipped.

If a run cannot finish: set the topic's `status` back to `queued` with a `lastError`, push, and report.
