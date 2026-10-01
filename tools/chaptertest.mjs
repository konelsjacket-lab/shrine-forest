// Chapter select: a jump must reproduce exactly the state a real playthrough had at that chapter.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const GAME = new URL('../index.html', import.meta.url).href;
const SHOTS = process.argv[2];
const RUNS = +(process.argv[3] || 2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
const page = await (await browser.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: SHOTS ? 2 : 1 })).newPage();
page.on('load', () => page.evaluate(() => document.getElementById('tap-gate')?.click()).catch(() => {})); // tap-to-start gate
const errs = []; page.on('pageerror', e => errs.push(e.message));
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
const snap = () => page.evaluate(() => ({ node: state.currentNode, flags: Object.keys(state.flags).filter(k => state.flags[k]).sort().join(','), aff: JSON.stringify(state.affection) }));

for (let run = 0; run < RUNS; run++) {
  await page.goto(GAME); await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(2000);
  ok(await page.$eval('#title-chap-btn', b => b.hidden), `run ${run}: fresh title hides the chapter button`);
  await page.click('#start-btn'); await page.waitForTimeout(800);
  // real playthrough with random choices, fast-forwarding text; snapshot at each chapter start
  const real = {};
  const chapters = await page.evaluate(() => CHAPTERS);
  for (let i = 0; i < 20000; i++) {
    const s = await page.evaluate(() => ({ node: state.currentNode, line: state.line, choice: $('#choice-layer').classList.contains('active') }));
    if (chapters.includes(s.node) && !real[s.node]) real[s.node] = await snap();
    if (s.node === 'day7_morning') break;
    if (s.choice) { const n = await page.$$eval('.choice-btn', b => b.length); await page.locator('.choice-btn').nth(Math.floor(Math.random() * n)).click(); await page.waitForTimeout(60); continue; }
    await page.evaluate(() => { const o = $('#chapter-overlay'); if (o.classList.contains('active')) { o.classList.remove('active'); } if (state.dlg && !state.textComplete) $('#dialogue-box').click(); if (state.dlg) $('#dialogue-box').click(); });
    await page.waitForTimeout(5);
  }
  ok(Object.keys(real).length === chapters.length, `run ${run}: real playthrough reached all ${chapters.length} chapters`);
  // jump to each chapter from the title and compare
  for (let c = 1; c < chapters.length; c++) {
    await page.evaluate(() => backToTitle()); await page.waitForTimeout(300);
    await page.click('#title-chap-btn'); await page.waitForTimeout(200);
    await page.locator(`.chap-item[data-chap="${c}"]`).click(); await page.waitForTimeout(200);
    if (SHOTS && run === 0 && c === 5) {
      await page.screenshot({ path: `${SHOTS}/ch_flow.png` });
      await page.locator('.flow-tabs button[data-act="all"]').click(); await page.waitForTimeout(150);
      await page.evaluate(() => $('.flow').scrollTop = 99999); await page.waitForTimeout(150);
      await page.screenshot({ path: `${SHOTS}/ch_flow_all.png` });
    }
    // the lit option of every visible node is the one actually chosen
    const litOk = await page.evaluate(() => [...document.querySelectorAll('.flow-node')].filter(n => !n.classList.contains('auto')).every(n => { const on = n.querySelector('.flow-opt.on'); const p = picksSeen()[on.dataset.node]; return p && p.last === on.dataset.text && on.classList.contains('seen'); }));
    await page.locator('.flow-go').click();
    for (let i = 0; i < 100 && (await page.evaluate(() => state.currentNode)) !== chapters[c]; i++) await page.waitForTimeout(30);
    const j = await snap(), r = real[chapters[c]];
    ok(litOk && j.node === r.node && j.flags === r.flags && j.aff === r.aff, `run ${run}: jump to ${chapters[c]} reproduces flags + affection` + (j.flags === r.flags ? '' : `\n  real ${r.flags}\n  jump ${j.flags}`) + (j.aff === r.aff ? '' : `\n  real ${r.aff}\n  jump ${j.aff}`) + (litOk ? '' : ' (lit options wrong)'));
  }
}
// changing an option in the flowchart changes the replay
await page.evaluate(() => backToTitle()); await page.waitForTimeout(300);
await page.click('#title-chap-btn'); await page.waitForTimeout(200);
await page.locator('.chap-item[data-chap="7"]').click(); await page.waitForTimeout(200);
const before = await page.evaluate(() => $('.flow-bars').innerHTML);
const idx = await page.evaluate(() => { const all = [...document.querySelectorAll('.flow-node.key .flow-opt')]; return all.findIndex(o => !o.classList.contains('on') && o.innerHTML.split('<span')[0] !== o.parentElement.querySelector('.flow-opt.on').innerHTML.split('<span')[0]); });
const other = page.locator('.flow-node.key .flow-opt').nth(idx); // an alternative that favours someone else
const txt = await other.getAttribute('data-text');
await other.click(); await page.waitForTimeout(150);
ok(await page.evaluate(t => [...document.querySelectorAll('.flow-opt.on')].some(o => o.dataset.text === t), txt) && (await page.evaluate(() => $('.flow-bars').innerHTML)) !== before, 'changing a choice re-lights it and updates the bond preview');
if (SHOTS) await page.screenshot({ path: `${SHOTS}/ch_changed.png` });
console.log('errors:', JSON.stringify(errs));
await browser.close();
