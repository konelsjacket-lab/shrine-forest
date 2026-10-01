import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const GAME = new URL('../index.html', import.meta.url).href;
const targets = ['fox','wolf','deer','whitewolf','hawk','snake'];
const shotAt = { fox: [], wolf: [], deer: [], whitewolf: [], hawk: [], snake: [] };
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
async function run(t) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 780 } });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(GAME);
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.click('#start-btn');
  const path = []; const shots = new Set(); let steps = 0;
  const t0 = Date.now();
  while (Date.now() - t0 < 420000) {
    const st = await page.evaluate((t) => {
      const node = state.currentNode;
      if ($('#ending-screen').classList.contains('active')) return { done: true, node, title: $('#ending-title').textContent };
      if ($('#choice-layer').classList.contains('active')) {
        const vis = S[node].choices.filter(ch => !(ch.if && !state.flags[ch.if]) && !(ch.ifnot && state.flags[ch.ifnot]));
        let best = 0, bv = -1;
        vis.forEach((c, i) => { const v = (c.affection || {})[t] || 0; if (v > bv) { bv = v; best = i; } });
        return { choice: best, node };
      }
      return { dlg: !!state.dlg, node, line: state.line, text: $('#dialogue-text').textContent, name: $('#speaker-name').textContent };
    }, t);
    if (st.node && path[path.length - 1] !== st.node) path.push(st.node);
    if (shotAt[t].includes(st.node) && !shots.has(st.node) && st.dlg && st.line >= 3) { shots.add(st.node); await page.waitForTimeout(900); await page.screenshot({ path: `/tmp/pt-${t}-${st.node}.png` }); }
    if (st.done) { await page.screenshot({ path: `/tmp/pt-${t}-END.png` }); return { t, ok: true, title: st.title, path, errs, aff: await page.evaluate(() => state.affection), steps }; }
    if (st.choice !== undefined) { await page.locator('.choice-btn').nth(st.choice).click(); steps++; await page.waitForTimeout(60); continue; }
    if (st.dlg) { await page.evaluate(() => { $('#dialogue-box').click(); if (state.dlg) $('#dialogue-box').click(); }); steps++; await page.waitForTimeout(15); }
    else await page.waitForTimeout(120);
  }
  return { t, ok: false, path, errs };
}
const res = await Promise.all(targets.map(run));
for (const r of res) console.log(r.t, r.ok ? 'END=' + r.title : 'TIMEOUT', 'nodes=' + r.path.length, 'rescue=' + r.path.find(p => p && p.startsWith('rescue_')), 'last=' + r.path.slice(-1), JSON.stringify(r.aff), 'errs=' + JSON.stringify(r.errs));
await browser.close();
