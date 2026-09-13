const fs = require('fs');
const t = fs.readFileSync('lib/articles.ts', 'utf8');
const re = /id: '(\d+)',\s*\n\s*slug: '([^']+)'/g;
let m; const ids=[];
while ((m = re.exec(t))) { ids.push({id:+m[1], slug:m[2], idx:m.index}); }
console.log('TOTAL', ids.length);
// titles and cats per article
const rows = ids.map(a => {
  const seg = t.slice(a.idx, a.idx+6000);
  const titleM = seg.match(/title: '([\s\S]*?)',/);
  const catM = seg.match(/category:\s*\{[^}]*slug:\s*'([^']+)'/);
  return { id:a.id, slug:a.slug, title:titleM?titleM[1].slice(0,120):'?', cat:catM?catM[1]:'?' };
});
const cc={}; rows.forEach(r=>{cc[r.cat]=(cc[r.cat]||0)+1;});
console.log(JSON.stringify(cc,null,2));
console.log('min',rows[0].id,'max',rows[rows.length-1].id);
const out = rows.map(r=>r.id+' | '+r.cat+' | '+r.slug+' | '+r.title).join('\n');
fs.writeFileSync('scripts/_task_new_articles_before.txt', out);
console.log(out);
