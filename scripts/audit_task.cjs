const fs=require('fs');
const t=fs.readFileSync('lib/articles.ts','utf8');
// article blocks start with "id: 'NN'," at beginning of line-ish inside DEMONSTRATION_ARTICLES
const re = /\n\s*id:\s*'(\d+)'\s*,\s*\n\s*slug:\s*'([^']+)'/g;
let m; const rows=[];
while((m=re.exec(t))){ rows.push({id:parseInt(m[1],10), slug:m[2]}); }
rows.sort((a,b)=>a.id-b.id);
console.log('ARTICLES='+rows.length+' MAXID='+Math.max(...rows.map(r=>r.id))+' MINID='+Math.min(...rows.map(r=>r.id)));
const ids=rows.map(r=>r.id);
const dup=ids.filter((x,i)=>ids.indexOf(x)!==i);
console.log('dupIds='+(dup.join(',')||'none'));
// categories per article
const re2 = /\n\s*id:\s*'(\d+)'\s*,\s*\n\s*slug:\s*'([^']+)'\s*,\s*\n\s*title:\s*'([\s\S]*?)'\s*,\s*\n\s*excerpt:/g;
let m2; const t2=[];
while((m2=re2.exec(t))){ t2.push({id:m2[1], slug:m2[2], title:m2[3].slice(0,80)}); }
console.log('TITLES='+t2.length);
// category counts
const catRe = /category:\s*\{\s*\n\s*id:\s*'([^']+)'/g;
let mc; const cats={};
while((mc=catRe.exec(t))){ cats[mc[1]]=(cats[mc[1]]||0)+1; }
console.log(JSON.stringify(cats,null,1));
// list slugs
const slugRe = /\n\s*slug:\s*'([^']+)'/g;
let ms; const slugs=[];
while((ms=slugRe.exec(t))){ slugs.push(ms[1]); }
// filter only article slugs (exclude category slugs which appear as id+slug pairs?) just print count
console.log('SLUGS_total='+slugs.length);
const dupS=slugs.filter((x,i)=>slugs.indexOf(x)!==i);
console.log('dupSlugs='+(dupS.join(',')||'none'));
fs.writeFileSync('scripts/_task_audit_rows.json', JSON.stringify({rows,titles:t2,cats},null,1));
console.log('wrote scripts/_task_audit_rows.json');
// show first 5 and last 5 titles
console.log('FIRST5='+JSON.stringify(t2.slice(0,5),null,1));
console.log('LAST5='+JSON.stringify(t2.slice(-5),null,1));
