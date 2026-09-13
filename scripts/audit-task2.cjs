const fs = require('fs');
const t = fs.readFileSync('C:/Users/dizzritimia/CascadeProjects/nexoracomic/lib/articles.ts', 'utf8');
const starts = [...t.matchAll(/\bid:\s*'(\d+)'\s*,\s*\n\s*slug:/g)].map(m => ({ id: m[1], idx: m.index }));
const out = [];
for (let i = 0; i < starts.length; i++) {
  const chunk = t.slice(starts[i].idx, i + 1 < starts.length ? starts[i + 1].idx : t.length);
  const slug = (chunk.match(/slug:\s*'([^']+)'/) || [])[1] || '?';
  const title = (chunk.match(/title:\s*'((?:[^'\\]|\\.)*)'/) || [])[1] || '?';
  const cat = (chunk.match(/category:\s*\{[^}]*?slug:\s*'([^']+)'/) || [])[1] || '?';
  out.push(starts[i].id + '|' + cat + '|' + slug + '|' + title.replace(/\n/g, ' ').slice(0, 110));
}
fs.writeFileSync('C:/Users/dizzritimia/CascadeProjects/nexoracomic/scripts/_task_new_articles_before.txt', out.join('\n'));
console.log('wrote ' + out.length);
