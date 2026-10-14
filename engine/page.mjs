// shared: open the renderer for a video dir and wait until ready
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
export async function openPage(vdir) {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  const errors = []; page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + path.join(here, 'render.html') + '?v=' + encodeURIComponent(path.resolve(vdir)));
  await page.waitForFunction(() => window.LOAD_ERROR || (window.READY && window.CUES && typeof SCN !== 'undefined'), null, { timeout: 30000 });
  const le = await page.evaluate(() => window.LOAD_ERROR || null); await page.evaluate(() => window.READY).catch(() => {});
  if (le || errors.length) { console.error('PAGE ERRORS:\n' + [le, ...errors].filter(Boolean).join('\n')); await browser.close(); process.exit(2); }
  return { browser, page, errors };
}
