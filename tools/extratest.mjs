// Hidden ending, ending marks on the title screen, gallery completion reward.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const GAME = new URL('../index.html', import.meta.url).href;
const SHOTS = process.argv[2];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
const page = await (await browser.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: SHOTS ? 2 : 1 })).newPage();
page.on('load', () => page.evaluate(() => document.getElementById('tap-gate')?.click()).catch(() => {})); // tap-to-start gate
const errs = []; page.on('pageerror', e => errs.push(e.message));
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
const shot = async n => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/x_${n}.png` }); };
const st = () => page.evaluate(() => ({ node: state.currentNode, cg: state.cg, choice: $('#choice-layer').classList.contains('active'), end: $('#ending-screen').classList.contains('active') }));
const tap = async () => { await page.evaluate(() => { if (state.dlg && !state.textComplete) $('#dialogue-box').click(); if (state.dlg) $('#dialogue-box').click(); }); await page.waitForTimeout(30); };

await page.goto(GAME); await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(3000);
ok(await page.evaluate(() => !$('#title-screen').classList.contains('cleared') && $('#title-endings').innerHTML === ''), 'fresh: no figure, no ending marks on the title');

await page.click('#start-btn'); await page.waitForTimeout(5000);
// 1. balanced bonds -> hidden ending
await page.evaluate(() => { Object.keys(state.affection).forEach(k => state.affection[k] = 34); routeToEnding(); });
await page.waitForTimeout(800);
ok((await st()).node === 'ending_all', 'every bond >= 33 routes to ending_all');
for (let i = 0; i < 300 && !(await st()).choice; i++) await tap();
ok((await st()).node === 'ending_all2' && (await st()).choice, 'ending_all -> ending_all2 choice');
await shot('all2');
await page.locator('.choice-btn').first().click(); await page.waitForTimeout(800);
for (let i = 0; i < 300 && !(await st()).end; i++) await tap();
await page.waitForTimeout(500);
ok((await st()).end && await page.evaluate(() => $('#ending-title').textContent === '杜鹃之约'), 'hidden ending card: 杜鹃之约');
ok(await page.evaluate(() => endingsSeen().all === 1), 'hidden ending recorded');

// 2. one bond short -> normal route
await page.evaluate(() => { backToTitle(); });
await page.waitForTimeout(300);
await page.evaluate(() => { resetGame(); $('#title-screen').style.display = 'none'; Object.keys(state.affection).forEach(k => state.affection[k] = 34); state.affection.snake = 32; state.affection.fox = 60; routeToEnding(); });
await page.waitForTimeout(500);
ok((await st()).node === 'ending_fox', 'one bond below 33 -> highest route (fox)');
for (let i = 0; i < 300 && !(await st()).choice; i++) await tap();
await page.locator('.choice-btn').first().click(); await page.waitForTimeout(800);
for (let i = 0; i < 300 && !(await st()).end; i++) await tap();
ok(await page.evaluate(() => endingsSeen().fox === 1), 'fox ending recorded');

// 3. title after clearing
await page.evaluate(() => backToTitle()); await page.reload(); await page.waitForTimeout(5500);
const t = await page.evaluate(() => ({ cleared: $('#title-screen').classList.contains('cleared'), on: $$('#title-endings i.on').length, all: $$('#title-endings i').length, txt: $('#title-endings span').textContent, fig: getComputedStyle($('#title-figure')).display }));
ok(t.cleared && t.fig === 'block' && t.on === 2 && t.all === 7 && t.txt === '2 / 7', 'title after clears: figure + 2/7 marks (' + JSON.stringify(t) + ')');
await shot('title');

// 4. gallery completion
await page.evaluate(() => { const s = {}; Object.keys(CG_INFO).forEach(k => s[k] = 1); localStorage.setItem(CG_SEEN_KEY, JSON.stringify(s)); });
await page.click('#start-btn'); await page.waitForTimeout(400);
if (await page.$eval('#confirm-layer', e => e.classList.contains('active'))) await page.click('#confirm-yes');
await page.waitForTimeout(5000);
await page.evaluate(() => openGallery()); await page.waitForTimeout(600);
const g = await page.evaluate(() => ({ done: !!document.querySelector('.gal-done'), extras: $$('.gal-extra').length }));
ok(g.done && g.extras === 2, 'all CGs seen: completion banner + 2 extras');

await shot('gallery');
await page.locator('.gal-extra').first().click(); await page.waitForTimeout(500);
ok(await page.evaluate(() => $('#cg-viewer').classList.contains('show') && $('#cg-viewer img').src.includes('protagonist-child')), 'extra opens in the viewer');
await shot('viewer');
await page.evaluate(() => { const s = JSON.parse(localStorage.getItem(CG_SEEN_KEY)); delete s.cg_genya_go; localStorage.setItem(CG_SEEN_KEY, JSON.stringify(s)); });
await page.evaluate(() => { $('#cg-viewer').classList.remove('show'); openGallery(); });
ok(await page.evaluate(() => !document.querySelector('.gal-done') && !document.querySelector('.gal-extra')), 'one CG missing: no reward yet');

console.log('errors:', JSON.stringify(errs));
await browser.close();
