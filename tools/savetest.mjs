import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const GAME = new URL('../index.html', import.meta.url).href;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
const ctx = await browser.newContext({ viewport: { width: 390, height: 780 } });
const page = await ctx.newPage();
page.on('load', () => page.evaluate(() => document.getElementById('tap-gate')?.click()).catch(() => {})); // tap-to-start gate
const errs = []; page.on('pageerror', e => errs.push(e.message));

const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
const text = () => page.$eval('#dialogue-text', e => e.textContent);
const vis = s => page.$eval(s, e => getComputedStyle(e).display !== 'none' && !e.hidden);
const choiceOn = () => page.$eval("#choice-layer", e => e.classList.contains("active"));
async function adv() { const t = await text(); for (let i = 0; i < 4 && (await text()) === t && !(await choiceOn()); i++) { await page.click('#dialogue-box'); await page.waitForTimeout(120); } }

await page.goto(GAME); await page.evaluate(() => localStorage.clear()); await page.reload();
await page.waitForTimeout(2500);
ok(!(await vis('#continue-btn')), 'no saves: continue hidden');
ok(await page.evaluate(() => !document.getElementById('tap-gate') || document.getElementById('tap-gate').classList.contains('gone')), 'tap gate dismissed by a tap');
ok(await page.evaluate(() => !document.querySelector('#title-screen.waiting')), 'title animations start after the tap');
ok(await page.evaluate(() => !music.on || (music.el && !music.el.paused)), 'title music is playing after the tap');
await page.screenshot({ path: '/tmp/s0-title-empty.png' });

await page.click('#start-btn'); await page.waitForTimeout(1600 + 3400);
ok((await text()).includes('外婆的葬礼'), 'new game starts at prologue');
ok(await page.evaluate(() => !!JSON.parse(localStorage.getItem('dujuansen-saves-v1')).auto), 'autosave written');

// jump to a transform node with a choice-bearing path later
await page.evaluate(() => { state.affection.fox = 40; playNode('rescue_fox'); });
await page.waitForTimeout(1500);
await adv(); await adv();
const savedText = await text(); const savedLine = await page.evaluate(() => state.line);
await page.click('#menu-btn'); await page.waitForTimeout(200);
await page.screenshot({ path: '/tmp/s1-menu.png' });
await page.click('[data-act=save]'); await page.waitForTimeout(200);
await page.click('[data-slot="1"]'); await page.waitForTimeout(300);
await page.screenshot({ path: '/tmp/s2-saved.png' });
await page.click('[data-act=close]');
ok(await page.evaluate(() => readSaves()['1'].chars[0].form === 'beast'), 'saved beast form');

await adv(); await adv(); await adv();
await page.evaluate(() => { state.affection.fox = 0; });
ok((await text()) !== savedText, 'progressed past save point');

await page.click('#menu-btn'); await page.click('[data-act=load]'); await page.waitForTimeout(200);
await page.screenshot({ path: '/tmp/s3-load.png' });
await page.click('[data-slot="1"]'); await page.waitForTimeout(200);
await page.click('#confirm-yes'); await page.waitForTimeout(1500);
ok((await text()) === savedText, 'load returns to the same line');
ok(await page.evaluate(l => state.line === l, savedLine), 'line index restored');
ok(await page.evaluate(() => state.affection.fox === 40), 'affection restored');
ok(await page.$eval('#char-kohaku img', i => i.src.includes('kohaku-beast')), 'beast portrait restored');
await page.screenshot({ path: '/tmp/s4-after-load.png' });
const beforeLine = await page.evaluate(() => state.line);
await page.click('#dialogue-box'); await page.waitForTimeout(80); await page.click('#dialogue-box'); await page.waitForTimeout(150);
ok(await page.evaluate(l => state.line === l + 1, beforeLine), 'one tap advances exactly one line (no double listeners)');

// save at a choice
await page.evaluate(() => playNode('day4_breakfast')); await page.waitForTimeout(3500);
for (let i = 0; i < 80 && !(await page.$eval('#choice-layer', e => e.classList.contains('active'))); i++) await adv();
await page.click('#menu-btn'); await page.click('[data-act=save]'); await page.click('[data-slot="2"]'); await page.waitForTimeout(200); await page.click('[data-act=close]');
await page.evaluate(() => playNode('start')); await page.waitForTimeout(500);

// reload page, continue from title
await page.reload(); await page.waitForTimeout(2500);
ok(await vis('#continue-btn'), 'after reload: continue visible');
await page.screenshot({ path: '/tmp/s5-title-saves.png' });
await page.click('#title-load-btn'); await page.waitForTimeout(200);
await page.screenshot({ path: '/tmp/s6-title-load.png' });
await page.click('[data-slot="2"]'); await page.waitForTimeout(800);
ok(await page.$eval('#choice-layer', e => e.classList.contains('active')), 'loading a choice save shows the choices');
await page.screenshot({ path: '/tmp/s7-choice-restored.png' });

// delete slot 1
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
await page.click('[data-act=load]'); await page.click('[data-del="1"]'); await page.click('#confirm-yes'); await page.waitForTimeout(200);
ok(await page.evaluate(() => !readSaves()['1']), 'slot 1 deleted');

// back to title then continue
await page.click('[data-act=back]'); await page.click('[data-act=title]'); await page.click('#confirm-yes'); await page.waitForTimeout(2200);
ok(await vis('#title-screen'), 'back to title');
await page.click('#continue-btn'); await page.waitForTimeout(800);
ok(await page.evaluate(() => !!state.currentNode), 'continue loads latest save');
console.log('errors:', errs);
await browser.close();
