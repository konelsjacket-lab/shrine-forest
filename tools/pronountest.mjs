// The protagonist is a girl. Flags any line that pairs a reference to her with 他.
// (Other characters are male and use 他 freely, so only these patterns are checked.)
import fs from 'fs';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const bad = [];
html.split('\n').forEach((l, i) => {
  const t = (l.match(/text: '([^']*)'/) || [])[1];
  if (!t) return;
  if (/(那孩子|小不点|外孙女|千代的孩子|守铃人)[^。」！？]{0,20}他(?!们)/.test(t)) bad.push(`${i + 1}: ${t}`);
  if (/外孙(?!女)/.test(t)) bad.push(`${i + 1}: ${t}`);
});
console.log(bad.length ? 'FAIL\n' + bad.join('\n') : 'PASS no 他 / 外孙 for the protagonist');
