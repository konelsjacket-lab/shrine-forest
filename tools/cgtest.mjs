import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const GAME = new URL('../index.html', import.meta.url).href;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
const page = await (await browser.newContext({ viewport: { width: 390, height: 780 } })).newPage();
page.on('load', () => page.evaluate(() => document.getElementById('tap-gate')?.click()).catch(() => {})); // tap-to-start gate
const errs = []; page.on('pageerror', e => errs.push(e.message));
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
const st = () => page.evaluate(() => ({ node: state.currentNode, line: state.line, cg: state.cg, text: $('#dialogue-text').textContent, choice: $('#choice-layer').classList.contains('active') }));
const tap = async () => { await page.evaluate(() => { if (state.dlg && !state.textComplete) $('#dialogue-box').click(); if (state.dlg) $('#dialogue-box').click(); }); await page.waitForTimeout(40); };
// The dialogue box must be drawn over the CG and receive taps.
const dialogueOnTop = () => page.evaluate(() => {
  const r = $('#dialogue-box').getBoundingClientRect();
  const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return !!hit && !!hit.closest('#dialogue-box') && getComputedStyle($('#dialogue-layer')).display !== 'none';
});

await page.goto(GAME); await page.waitForTimeout(1500);
await page.click('#start-btn'); await page.waitForTimeout(5200);

// 1. The rain-at-the-torii umbrella CG survives the choice and carries into day2_umbrella.
await page.evaluate(() => playNode('ginro_yukimaru_clash')); await page.waitForTimeout(900);
for (let i = 0; i < 60 && (await st()).cg !== 'cg_ginro_umbrella'; i++) await tap();
await page.waitForTimeout(900);
ok((await st()).cg === 'cg_ginro_umbrella', 'umbrella CG appears');
ok(await dialogueOnTop(), 'dialogue box is shown over the CG');
for (let i = 0; i < 20 && !(await st()).choice; i++) await tap();
ok((await st()).choice && (await st()).cg === 'cg_ginro_umbrella', 'CG still up while the choice is on screen');
await page.locator('.choice-btn').first().click(); await page.waitForTimeout(900);
let s = await st();
ok(s.node === 'day2_umbrella' && s.cg === 'cg_ginro_umbrella', 'CG carries into the next node (keepCG)');
let shown = 1;
for (let i = 0; i < 30 && (await st()).cg; i++) { await tap(); if ((await st()).cg) shown++; }
s = await st();
ok(!s.cg && s.text.includes('把伞塞进你手里'), 'CG clears at the explicit cg:null line (' + shown + ' lines in day2_umbrella)');

// 2. A cast change under a CG no longer clears it (the ceremony naming).
await page.evaluate(() => playNode('day7_ceremony')); await page.waitForTimeout(900);
for (let i = 0; i < 80 && (await st()).cg !== 'cg_main_ceremony'; i++) await tap();
ok((await st()).cg === 'cg_main_ceremony', 'ceremony CG appears');
for (let i = 0; i < 30 && !(await st()).text.startsWith('玄夜'); i++) await tap();
await page.waitForTimeout(300);
s = await st();
ok(s.text.startsWith('玄夜') && s.cg === 'cg_main_ceremony', 'ceremony CG stays through the six names (cast changes)');
ok(await dialogueOnTop(), 'dialogue box still shown over the CG');

// 3. A new node without keepCG still clears it.
await page.evaluate(() => playNode('day2_towel')); await page.waitForTimeout(1200);
ok(!(await st()).cg, 'a normal node clears the CG');

console.log('errors:', JSON.stringify(errs));
await browser.close();
