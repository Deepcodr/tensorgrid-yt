// node still.mjs <videoDir> t1 t2 ...  -> <videoDir>/build/stills/tXXX.XX.jpg  (also writes build/cues.json)
import fs from 'fs'; import { openPage } from './page.mjs';
const [vdir, ...ts] = process.argv.slice(2); const { browser, page, errors } = await openPage(vdir);
fs.mkdirSync(vdir + '/build/stills', { recursive: true });
fs.writeFileSync(vdir + '/build/cues.json', JSON.stringify(await page.evaluate(() => window.CUES)));
for (const t of ts.map(Number)) {
  const r = await page.evaluate(t => { try { renderFrame(t); return document.getElementById('c').toDataURL('image/jpeg', .85); } catch (e) { return 'ERR ' + e.stack; } }, t);
  if (r.startsWith('ERR')) { console.log('t=' + t, r); continue; }
  fs.writeFileSync(`${vdir}/build/stills/t${t.toFixed(2).padStart(6, '0')}.jpg`, Buffer.from(r.split(',')[1], 'base64'));
}
if (errors.length) console.log('PAGE ERRORS:\n' + errors.join('\n'));
await browser.close();
