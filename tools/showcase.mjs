import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const GAME = new URL('../index.html', import.meta.url).href;
const OUT = new URL('../screenshots', import.meta.url).pathname;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--ignore-certificate-errors', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, ignoreHTTPSErrors: true });
const p = await ctx.newPage();
p.on('load', () => p.evaluate(() => document.getElementById('tap-gate')?.click()).catch(() => {})); // tap-to-start gate
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(GAME);
await p.evaluate(() => localStorage.clear());
await p.reload(); await p.waitForTimeout(4500);
const shot = n => p.screenshot({ path: `${OUT}/${n}.png` });
await shot('01-title');
await p.click('#start-btn'); await p.waitForTimeout(1700);

const reset = () => p.evaluate(() => { ['#choice-layer', '#ending-screen', '#sys-layer'].forEach(s => $(s).classList.remove('active')); $('#dialogue-layer').style.display = ''; });
async function go(id, n, { chapter = false, flags = {}, wait = 1800 } = {}) {
  await reset();
  await p.evaluate(([id, f]) => { Object.assign(state.flags, f); playNode(id); }, [id, flags]);
  await p.waitForTimeout(chapter ? 3300 : 900);
  for (let i = 0; i < n; i++) { await p.evaluate(() => { $('#dialogue-box').click(); if (state.dlg && !state.textComplete) {} }); await p.waitForTimeout(30); await p.evaluate(() => { if (state.dlg && !state.textComplete) $('#dialogue-box').click(); }); await p.waitForTimeout(30); }
  await p.waitForTimeout(wait);
}
// advance line-by-line: each loop completes current text then moves on
async function lines(id, n, opt) {
  await reset();
  await p.evaluate(([id, f]) => { Object.assign(state.flags, f || {}); playNode(id); }, [id, (opt || {}).flags]);
  await p.waitForTimeout((opt || {}).chapter ? 3300 : 900);
  for (let i = 0; i < n; i++) {
    await p.evaluate(() => { if (state.dlg && !state.textComplete) $('#dialogue-box').click(); });
    await p.waitForTimeout(20);
    await p.evaluate(() => { if (state.dlg) $('#dialogue-box').click(); });
    await p.waitForTimeout(40);
  }
  await p.waitForTimeout((opt || {}).wait || 2200);
}
async function toChoice(id, opt) {
  await reset();
  await p.evaluate(([id, f]) => { Object.assign(state.flags, f || {}); playNode(id); }, [id, (opt || {}).flags]);
  await p.waitForTimeout(900);
  for (let i = 0; i < 80; i++) {
    if (await p.evaluate(() => $('#choice-layer').classList.contains('active'))) break;
    await p.evaluate(() => { if (state.dlg && !state.textComplete) $('#dialogue-box').click(); if (state.dlg) $('#dialogue-box').click(); });
    await p.waitForTimeout(40);
  }
  await p.waitForTimeout(900);
}

// chapter card
await p.evaluate(() => playNode('meet_kohaku')); await p.waitForTimeout(1500); await shot('02-chapter-card');
await p.waitForTimeout(2000);
await lines('meet_kohaku', 8, { chapter: true }); await shot('03-meet-kohaku');
await lines('meet_ginro', 9); await shot('04-two-shot-ginro');
await lines('pro_house', 14, { wait: 2500 }); await shot('05-cg-letter');
await lines('pro_memory', 8); await shot('06-flashback-dream');
await toChoice('kohaku_lanterns'); await shot('07-choice-tail');
await lines('day1_room', 19); await shot('08-sketchbook');
await lines('day1_eyes', 12); await shot('09-purple-eyes');
// transform flash + CG
await reset(); await p.evaluate(() => { state.affection.fox = 60; playNode('rescue_fox'); }); await p.waitForTimeout(700); await shot('10-transform');
await lines('rescue_fox', 1, { wait: 2600 }); await shot('11-cg-ninetails');
await lines('day6_kohaku', 0, { wait: 2500 }); await shot('12-cg-torii');
await lines('day7_ceremony', 22, { chapter: true, wait: 2500 }); await shot('13-cg-ceremony');
// systems
await reset();
await p.evaluate(() => {
  ['q_letter','q_keeper','q_memory','q_door','q_voice','a_voice','q_eyes','a_eyes','q_photo','q_page','q_rot'].forEach(f => state.flags[f] = true);
  ['kohaku','ginro','shiro','yukimaru','sou','genya'].forEach(c => state.flags['met_' + c] = true);
  Object.assign(state.affection, { fox: 72, wolf: 55, deer: 38, whitewolf: 44, hawk: 26, snake: 61 });
  openNotes();
});
await p.waitForTimeout(700); await shot('14-notebook');
await p.evaluate(() => openBonds()); await p.waitForTimeout(1200); await shot('15-bonds');
await p.evaluate(() => { ['cg_main_letter','cg_main_ceremony','cg_kohaku_torii','cg_kohaku_ninetails','cg_ginro_umbrella','cg_ginro_back','cg_shiro_garland','cg_genya_coil'].forEach(markCgSeen); openGallery(); });
await p.waitForTimeout(1500); await shot('16-gallery');
await reset();
await toChoice('day1_radio'); // not needed but ensures state
await reset();
await lines('ending_fox', 8, { wait: 3000 }); await shot('17-ending');
console.log('errors', JSON.stringify(errs));
await b.close();
