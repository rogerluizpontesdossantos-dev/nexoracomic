const fs = require('fs');
const t = fs.readFileSync('lib/articles.ts','utf8');
// top-level articles: match "  {\n    id: 'NN'"
const re = /\{\s*\n\s*id:\s*'(\d+)'\s*,\s*\n\s*slug:\s*'([^']+)'\s*,\s*\n\s*title:\s*'((?:[^'\\]|\\.)*)'/g;
let m; const rows=[];
while((m=re.exec(t))){ rows.push({id:+m[1], slug:m[2], title:m[3]}); }
rows.sort((a,b)=>a.id-b.id);
console.log('COUNT='+rows.length);
console.log('MIN='+rows[0].id+' MAX='+rows[rows.length-1].id);
// check gaps/dup
const ids=rows.map(r=>r.id);
const dup=ids.filter((x,i)=>ids.indexOf(x)!==i);
console.log('DUP_IDS='+JSON.stringify(dup));
// categories per article: find nearest category slug after each id
const rows2=[];
const re2 = /\{\s*\n\s*id:\s*'(\d+)'[\s\S]*?category:\s*\{\s*\n\s*id:\s*'([^']+)'/g;
let m2; while((m2=re2.exec(t))){ rows2.push({id:+m2[1], cat:m2[2]}); }
const c={}; rows2.forEach(r=>c[r.cat]=(c[r.cat]||0)+1);
console.log('CATS='+JSON.stringify(c));
rows.forEach(r=>{
  const cat = (rows2.find(x=>x.id===r.id)||{}).cat || '?';
  console.log(r.id+' | '+cat+' | '+r.slug+' | '+r.title);
});
