import fs from 'fs';
const t = fs.readFileSync('lib/articles.ts','utf8');
const parts = t.split("id: '");
const rows=[];
for(let i=1;i<parts.length;i++){
  const p = parts[i];
  const id = p.slice(0,p.indexOf("'"));
  if(!/^\d+$/.test(id)) continue;
  const sm = p.match(/slug:\s*'([^']+)'/);
  const tm = p.match(/title:\s*'((?:[^'\\]|\\.|'')+)/);
  const cm = p.match(/category:\s*\{\s*id:\s*'([^']+)'/);
  if(sm&&tm&&cm) rows.push({id:+id,slug:sm[1],title:tm[1].slice(0,120),cat:cm[1]});
}
rows.sort((a,b)=>a.id-b.id);
console.log('TOTAL '+rows.length+' MAX '+Math.max(...rows.map(r=>r.id)));
const by={};
for(const r of rows){(by[r.cat]=by[r.cat]||[]).push(r);}
for(const k of Object.keys(by).sort()){console.log('--- '+k+' '+by[k].length);for(const r of by[k])console.log(r.id+' | '+r.slug+' | '+r.title);}
fs.writeFileSync('scripts/_task_new_articles_before.json',JSON.stringify({total:rows.length,byCat:Object.fromEntries(Object.entries(by).map(([k,v])=>[k,v.length])),articles:rows},null,2));
