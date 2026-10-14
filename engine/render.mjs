// node render.mjs <videoDir> <firstFrame> <endFrame> <out.mp4>   (30 fps PNG frames piped into x264)
import { spawn } from 'child_process'; import fs from 'fs'; import { openPage } from './page.mjs';
const FPS = 30, [vdir, a0, b0, out] = process.argv.slice(2), a = +a0, b = +b0; const { browser, page } = await openPage(vdir);
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-r', String(FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] });
const t0 = Date.now();
for (let i = a; i < b; i++) {
  const r = await page.evaluate(t => { renderFrame(t); return document.getElementById('c').toDataURL('image/png'); }, i / FPS);
  if (!ff.stdin.write(Buffer.from(r.slice(22), 'base64'))) await new Promise(res => ff.stdin.once('drain', res));
  if ((i - a) % 150 === 0) fs.writeFileSync(out + '.progress', `${i - a}/${b - a} frames, ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);
}
ff.stdin.end(); await new Promise(res => ff.on('close', res)); await browser.close();
fs.writeFileSync(out + '.progress', `done ${b - a} frames, ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);
