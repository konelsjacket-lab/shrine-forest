import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const GAME = new URL('../index.html', import.meta.url).href;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
const page = await (await browser.newContext({ viewport: { width: 390, height: 780 } })).newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message));
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
const st = () => page.evaluate(() => ({ node: state.currentNode, line: state.line, skip: skip.active(), choice: $('#choice-layer').classList.contains('active'), toast: [...document.querySelectorAll('.save-toast')].map(t => t.textContent).pop() || '' }));
const tap = async () => { await page.evaluate(() => { if (state.dlg && !state.textComplete) $('#dialogue-box').click(); if (state.dlg) $('#dialogue-box').click(); }); await page.waitForTimeout(30); };
async function newGame() {
  await page.evaluate(() => { resetGame(); playNode('start'); });
  await page.waitForTimeout(3400); // chapter card
}

await page.goto(GAME); await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(2000);
await page.click('#start-btn'); await page.waitForTimeout(1600 + 3400);

// 1. nothing read yet: skip refuses
await page.click('#skip-btn'); await page.waitForTimeout(200);
let s = await st();
ok(!s.skip && s.line === 0, 'unread first line: skip does not start');

// read six lines of the prologue
for (let i = 0; i < 6; i++) await tap();
await page.waitForTimeout(300);
const readTo = (await st()).line;
ok(readTo === 6, 'read lines 0..6 of start (at line ' + readTo + ')');

// 2. new game, skip runs through read lines and stops at the first unread one
await newGame();
await page.click('#skip-btn'); await page.waitForTimeout(1500);
s = await st();
ok(s.node === 'start' && s.line === 7 && !s.skip, 'skip stops at first unread line (line ' + s.line + ', skip ' + s.skip + ')');

// 3. read the whole prologue up to the first choice, then skip from a new game stops at that choice
for (let i = 0; i < 200 && !(await st()).choice; i++) await tap();
ok((await st()).choice && (await st()).node === 'pro_house', 'read up to the pro_house choice');
await newGame();
await page.click('#skip-btn'); await page.waitForTimeout(400);
ok((await st()).skip, 'skip is on while lines are read');
await page.waitForTimeout(12000);
s = await st();
ok(s.choice && s.node === 'pro_house' && !s.skip, 'skip runs to the choice and turns itself off');

// 4. read state survives a reload
await page.reload(); await page.waitForTimeout(2000);
ok(await page.evaluate(() => isRead('pro_shop', 5) && isRead('start', 10)), 'read lines persist across reload');

// 5. opening the menu pauses skipping
await page.click('#start-btn'); await page.waitForTimeout(400);
if (await page.$eval('#confirm-layer', e => e.classList.contains('active'))) await page.click('#confirm-yes');
await page.waitForTimeout(1600 + 3400);
await page.click('#skip-btn'); await page.waitForTimeout(250);
await page.click('#menu-btn'); await page.waitForTimeout(100);
const a = (await st()); await page.waitForTimeout(800); const b = (await st());
ok(a.node === b.node && a.line === b.line && b.skip, 'menu open: skipping pauses (' + a.node + ':' + a.line + ')');
await page.evaluate(() => closeSys()); await page.waitForTimeout(800);
const c = await st();
ok(c.node !== b.node || c.line > b.line, 'menu closed: skipping resumes');
await page.click('#skip-btn'); await page.waitForTimeout(100);
ok(!(await st()).skip, 'tapping the button again stops skipping');

// 6. holding Ctrl skips, releasing stops
const before = await st();
await page.keyboard.down('Control'); await page.waitForTimeout(600);
const during = await st();
await page.keyboard.up('Control'); await page.waitForTimeout(200);
const after1 = await st(); await page.waitForTimeout(500); const after2 = await st();
ok(during.node !== before.node || during.line > before.line, 'holding Ctrl skips');
ok(!after2.skip && after1.node === after2.node && after1.line === after2.line, 'releasing Ctrl stops');

console.log('errors:', JSON.stringify(errs));
await browser.close();
