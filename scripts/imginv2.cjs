const fs=require('fs');
const c=fs.readFileSync('C:/Users/dizzritimia/CascadeProjects/nexoracomic/lib/articles.ts','utf8');
const imgs=[...c.matchAll(/featuredImage: '([^']+)'/g)].map(m=>m[1]);
const uniq=[...new Set(imgs)];
console.log('total='+imgs.length+' uniq='+uniq.length);
const old=uniq.filter(u=>!u.includes('wikimedia')||true).slice(0,60);
console.log(old.join('\n'));
