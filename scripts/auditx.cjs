const fs = require('fs');
const path = require('path');
const t = fs.readFileSync(path.join(__dirname, '..', 'lib', 'articles.ts'), 'utf8');
const blocks = t.split('id:');
const rows = [];
for (let i = 1; i < blocks.length; i++) {
  const b = blocks[i];
  const idM = b.match(/^\s*'(\d+)'/);
  const slugM = b.match(/slug:\s*'([^']+)'/);
  const titleM = b.match(/title:\s*'((?:[^'\\]|\\.)*)'/);
  const catM = b.match(/category:\s*\{[^}]*?slug:\s*'([^']+)'/s);
  if (idM && slugM && titleM && catM) {
    rows.push({ id: idM[1], slug: slugM[1], title: titleM[1].slice(0, 110), category: catM[1] });
  }
}
rows.sort((a, b) => parseInt(a.id) - parseInt(b.id));
const cats = {};
rows.forEach(r => { cats[r.category] = (cats[r.category] || 0) + 1; });
const ids = rows.map(r => parseInt(r.id, 10));
const out = {
  total: rows.length,
  maxId: Math.max.apply(null, ids),
  byCategory: cats,
  rows: rows
};
fs.writeFileSync(path.join(__dirname, '_task_new_articles_audit.json'), JSON.stringify(out, null, 2));
console.log('TOTAL=' + rows.length + ' MAXID=' + Math.max.apply(null, ids));
console.log(JSON.stringify(cats));
rows.forEach(r => console.log(r.id + ' | ' + r.category + ' | ' + r.slug));
