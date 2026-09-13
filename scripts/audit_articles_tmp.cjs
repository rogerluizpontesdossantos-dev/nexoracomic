const fs = require('fs');
const t = fs.readFileSync('lib/articles.ts', 'utf8');
// Article blocks start with newline + two spaces + { + newline + four spaces + id: 'NN',
const re = /\n  \{\n    id: '(\d+)',\n    slug: '([^']+)'/g;
let m; const ids = [];
while ((m = re.exec(t))) ids.push({ id: Number(m[1]), slug: m[2], index: m.index });
console.log('ARTICLE COUNT:', ids.length, 'MAX ID:', Math.max(...ids.map(r => r.id)));
// For each article, slice until next article start to extract title + category slug
for (let i = 0; i < ids.length; i++) {
  const start = ids[i].index;
  const end = (i + 1 < ids.length) ? ids[i + 1].index : t.length;
  const seg = t.slice(start, end);
  const tm = seg.match(/title: '([^']+)'/);
  const cm = seg.match(/category: \{\s*\n?\s*id: '([^']+)'/);
  ids[i].title = tm ? tm[1].slice(0, 90) : '?';
  ids[i].cat = cm ? cm[1] : '?';
}
const byCat = {};
ids.forEach(r => { (byCat[r.cat] = byCat[r.cat] || []).push(r); });
for (const c of Object.keys(byCat).sort()) {
  console.log('\n==' + c + ' (' + byCat[c].length + ') ==');
  byCat[c].forEach(r => console.log(' ' + r.id + ' | ' + r.slug + ' | ' + r.title));
}
fs.writeFileSync('scripts/_task_new_articles_audit.json', JSON.stringify({ total: ids.length, byCat }, null, 1));
console.log('\nOK saved audit json');
