const fs=require('fs');
const c=fs.readFileSync('C:/Users/dizzritimia/CascadeProjects/nexoracomic/lib/articles.ts','utf8');
const m=[...c.matchAll(/featuredImage:\s*'([^']+)'/g)].map(x=>x[1]);
console.log('total featuredImages:',m.length);
const wm=m.filter(u=>u.includes('wikimedia'));
console.log('wikimedia count:',wm.length);
[...new Set(wm)].slice(0,40).forEach(u=>console.log(u));
const esa=m.filter(u=>u.includes('esa.int'));
console.log('esa count:',esa.length); esa.slice(0,10).forEach(u=>console.log(u));
