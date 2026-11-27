// usage: node shot.mjs <url> <out.png> <width> <height> [jsBefore]
import { chromium } from 'playwright';
const [,, url, out, w = '1440', h = '900', js = ''] = process.argv;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
const errors = [];
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(2500);
if (js) { const r = await page.evaluate(js); if (r !== undefined) console.log(JSON.stringify(r, null, 1)); await page.waitForTimeout(800); }
await page.screenshot({ path: out });
console.log(errors.slice(0, 15).join('\n'));
await browser.close();
