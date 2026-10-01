// Renders itch/art.html into itch/page-*.png (2x) for the itch.io description.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const SRC = new URL('../itch/art.html', import.meta.url).href;
const OUT = new URL('../itch/', import.meta.url).pathname;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--allow-file-access-from-files'] });
const page = await (await browser.newContext({ viewport: { width: 1100, height: 2400 }, deviceScaleFactor: 2 })).newPage();
await page.goto(SRC); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(2500);
for (const name of await page.$$eval('[data-shot]', els => els.map(e => e.dataset.shot))) {
  await page.locator(`[data-shot="${name}"]`).screenshot({ path: `${OUT}page-${name}.png` });
  console.log('itch/page-' + name + '.png');
}
await browser.close();
