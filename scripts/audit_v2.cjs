const fs=require('fs');
const t=fs.readFileSync('lib/articles.ts','utf8');
const starts=[...t.matchAll(/^[ ]+\{[ \t]*\r?\n[ ]+id:\s*'/gm)].map(m=>m.index);
console.log('BLOCKS='+starts.length);
const rows=[];
for(let i=0;i<starts.length;i++){
  const chunk=t.slice(starts[i], i+1<starts.length?starts[i+1]:t.length);
  const id=(chunk.match(/id:\s*'(\d+)'/)||[])[1];
  const slug=(chunk.match(/slug:\s*'([^']+)'/)||[])[1];
  const title=(chunk.match(/title:\s*'((?:[^'\\]|\\.)*)'/)||[])[1];
  const catM=chunk.match(/category:\s*\{([\s\S]*?)\}/);
  let cat='?';
  if(catM){const s=catM[1].match(/slug:\s*'([^']+)'/); if(s) cat=s[1];}
  const srcs=[...chunk.matchAll(/url:\s*'([^']+)'/g)].map(m=>m[1]);
  const img=(chunk.match(/featuredImage:\s*'([^']+)'/)||[])[1]||'';
  rows.push({id:+(id||0),slug,title,cat,nsrc:srcs.length,img:img.slice(0,60)});
}
rows.sort((a,b)=>a.id-b.id);
let out='TOTAL '+rows.length+' MAXID '+Math.max(...rows.map(r=>r.id))+' MINID '+Math.min(...rows.map(r=>r.id))+'\n';
const byCat={};
for(const r of rows){(byCat[r.cat]=byCat[r.cat]||[]).push(r);}
for(const c of Object.keys(byCat).sort()){out+=`\n== ${c} (${byCat[c].length}) ==\n`;for(const r of byCat[c]) out+=`${r.id}|${r.slug}|${(r.title||'').slice(0,120)}\n`;}
fs.writeFileSync('scripts/_task_new_articles_audit.txt',out,'utf8');
console.log(out);
