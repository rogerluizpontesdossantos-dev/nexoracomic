import fs from 'fs';
const t = fs.readFileSync('lib/articles.ts', 'utf8');
fs.writeFileSync('scripts/_task12_batch3_baseline.txt', t);
const lines = t.split('\n');
// find article start lines: lines matching /^    id: '\d+',$/ at indent 4
const starts = [];
lines.forEach((l, i) => {
  if (/^    id: '\d+',\s*$/.test(l)) starts.push(i);
});
starts.push(lines.length);
let out = '';
let selected = [];
for (let k = 0; k < starts.length - 1; k++) {
  const block = lines.slice(starts[k], starts[k + 1]).join('\n');
  const id = lines[starts[k]].match(/\d+/)[0];
  const n = parseInt(id);
  if (n < 22 || n > 31) continue;
  selected.push(id);
  out += '=== ID ' + id + ' ===\n';
  const tm = block.match(/\n    title:\s*'([^']*)'/);
  out += 'TITLE: ' + (tm ? tm[1] : '?') + '\n';
  const cat = block.match(/\n    category:\s*'([^']*)'/);
  out += 'CATEGORY: ' + (cat ? cat[1] : '?') + '\n';
  const sm = block.match(/\n    sources:\s*\[([\s\S]*?)\]/);
  out += 'SOURCES: ' + (sm ? sm[1].replace(/\s+/g, ' ') : '(none)') + '\n';
  const ex = block.match(/\n    excerpt:\s*'([^']{0,400})'/);
  out += 'EXCERPT: ' + (ex ? ex[1] : '?') + '\n\n';
}
fs.writeFileSync('scripts/_task12_batch3_current.txt', out);
console.log('articles found:', starts.length - 1, 'selected:', selected.join(','));
console.log(out);
