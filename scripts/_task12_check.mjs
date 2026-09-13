import { readFileSync } from 'fs';
const src = readFileSync('C:/Users/dizzritimia/CascadeProjects/nexoracomic/lib/articles.ts', 'utf8');
const ids = ['2','3','4','5','6','7','8','9','10','11'];
function block(id) {
  const re = new RegExp(`id: '${id}',`);
  const m = re.exec(src);
  if (!m) return 'NOT_FOUND';
  const n = src.slice(m.index + 2);
  const nm = n.match(/\n    id: '\d'/);
  const seg = nm ? n.slice(0, nm.index) : n;
  const s = seg.match(/\bsources:\s*\[/);
  if (!s) return 'NO_SOURCES_FIELD';
  const open = s.index + s[0].length;
  let d = 1, i = open;
  while (i < seg.length && d > 0) {
    if (seg[i] === '[') d++;
    else if (seg[i] === ']') d--;
    i++;
  }
  // include trailing whitespace up to the newline before ']' marker
  return 'SOURCES_START>>>' + seg.slice(open, i) + '<<<END';
}
for (const id of ids) {
  const b = block(id);
  console.log(`\n===== article ${id} =====`);
  console.log(b);
}