import { execSync } from 'child_process';
import fs from 'fs';
const head = execSync('git show HEAD:lib/articles.ts', { encoding: 'utf8', maxBuffer: 1 << 26 }).replace(/\r\n/g, '\n');
const cur = fs.readFileSync('lib/articles.ts', 'utf8').replace(/\r\n/g, '\n');

function blocks(t) {
  const map = {};
  const idRe = / {4}id: '(\d+)',/g;
  const pos = [];
  let m;
  while ((m = idRe.exec(t)) !== null) pos.push({ id: m[1], i: m.index });
  pos.push({ id: null, i: t.length });
  for (let k = 0; k < pos.length - 1; k++) map[pos[k].id] = t.slice(pos[k].i, pos[k + 1].i);
  return map;
}
function stripSources(b) {
  return b.replace(/ {4}sources: \[[\s\S]*?\n {4}\]\r?\n/, '    sources: [STRIPPED]\r\n');
}
function srcOf(b) {
  const m = b.match(/ {4}sources: \[[\s\S]*?\n {4}\]\r?\n/);
  return m ? m[0] : '(none)';
}
const H = blocks(head), C = blocks(cur);
let issues = 0;
for (const id of Object.keys(C)) {
  const h = H[id] || '';
  const c = C[id];
  if (stripSources(h) !== stripSources(c)) { console.log('DIFF-OUTSIDE-SOURCES in id', id); issues++; }
  if (srcOf(h) !== srcOf(c)) {
    const n = id >= 22 && id <= 31;
    console.log((n ? 'BATCH3' : 'PREV  '), 'sources changed in id', id);
  }
}
for (const id of Object.keys(H)) if (!(id in C)) { console.log('MISSING id', id); issues++; }
console.log(issues === 0 ? 'OK: content outside sources identical to HEAD for all articles' : 'ISSUES: ' + issues);
