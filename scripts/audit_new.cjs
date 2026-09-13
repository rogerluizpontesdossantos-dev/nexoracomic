const fs = require('fs');
const t = fs.readFileSync('lib/articles.ts', 'utf8');
const blocks = t.split(/{id:/).slice(1);
const byCat = {};
const all = [];
for (const b of blocks) {
  const idm = b.match(/^\s*'(\d+)'/);
  const slm = b.match(/slug:\s*'([^']+)'/);
  const tim = b.match(/title:\s*'([^']+)'/);
  const cam = b.match(/category:\s*\{[^}]*slug:\s*'([^']+)'/);
  if (idm && slm && tim && cam) {
    const c = cam[1];
    (byCat[c] = byCat[c] || []).push(idm[1] + ' | ' + slm[1] + ' | ' + tim[1]);
    all.push({ id: idm[1], slug: slm[1], title: tim[1], cat: c });
  }
}
let out = 'TOTAL: ' + all.length + '\n';
for (const k of Object.keys(byCat).sort()) {
  out += '\n=== ' + k + ' (' + byCat[k].length + ') ===\n' + byCat[k].join('\n') + '\n';
}
fs.writeFileSync('scripts/_task_new_articles_audit.txt', out, 'utf8');
console.log(out);
