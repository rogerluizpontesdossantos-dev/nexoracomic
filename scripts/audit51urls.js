const fs=require('fs');
const c=fs.readFileSync('C:/Users/dizzritimia/CascadeProjects/nexoracomic/lib/articles.ts','utf8');
const ids=['124','125','126','127','128','129','130','131','132','133','134','135','136','137','138','139','140','141'];
for(const id of ids){
  const i=c.indexOf('id: "'+id+'"')>=0?c.indexOf('id: "'+id+'"'):c.indexOf("id: '"+id+"'");
  const ni=c.indexOf("id: '"+(parseInt(id)+1)+"'",i);
  const ni2=c.indexOf('id: "'+(parseInt(id)+1)+'"',i);
  let end=-1;
  if(ni>=0&&ni2>=0)end=Math.min(ni,ni2);else end=Math.max(ni,ni2);
  const block=c.slice(i,end===-1?i+15000:end);
  const urls=[...block.matchAll(/url:\s*['"]([^'"]+)['"]/g)].map(m=>m[1]);
  console.log('== '+id+' ==');
  for(const u of urls)console.log('  '+u);
}
