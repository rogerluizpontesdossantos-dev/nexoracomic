const fs=require('fs');
const t=fs.readFileSync('lib/articles.ts','utf8');
const re=/id:\s*'(\d+)'[\s\S]*?slug:\s*'([^']+)'[\s\S]*?title:\s*'((?:[^'\\]|\\.)*)'[\s\S]*?category:\s*\{[^}]*slug:\s*'([^']+)'/g;
let m; const rows=[];
while(m=re.exec(t)){rows.push({id:+m[1],slug:m[2],title:m[3],cat:m[4]});}
rows.sort((a,b)=>a.id-b.id);
let out='TOTAL '+rows.length+' MAXID '+Math.max(...rows.map(r=>r.id))+'\n';
const byCat={};
for(const r of rows){(byCat[r.cat]=byCat[r.cat]||[]).push(r);}
for(const c of Object.keys(byCat).sort()){out+=`\n== ${c} (${byCat[c].length}) ==\n`;for(const r of byCat[c]) out+=`${r.id}|${r.slug}|${r.title}\n`;}
fs.writeFileSync('scripts/_task_new_articles_audit.txt',out,'utf8');
console.log(out.slice(0,6000));
