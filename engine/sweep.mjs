// node sweep.mjs <videoDir>  -> renders every 2nd frame in-page and reports exceptions; writes build/cues.json
import fs from 'fs'; import { openPage } from './page.mjs';
const [vdir] = process.argv.slice(2); const { browser, page } = await openPage(vdir);
fs.writeFileSync(vdir + '/build/cues.json', JSON.stringify(await page.evaluate(() => window.CUES)));
const r = await page.evaluate(() => { const errs = []; for (let i = 0; i < TL.duration * 30; i += 2) { try { renderFrame(i / 30); } catch (e) { errs.push((i / 30).toFixed(2) + 's ' + e.message); if (errs.length > 5) break; } } return errs; });
console.log(r.length ? 'ERRORS:\n' + r.join('\n') : 'sweep ok: no errors'); await browser.close(); process.exit(r.length ? 1 : 0);
