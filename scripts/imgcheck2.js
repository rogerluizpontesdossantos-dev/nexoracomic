const c=require('fs').readFileSync('C:/Users/dizzritimia/CascadeProjects/nexoracomic/lib/articles.ts','utf8');
const ids=['124','125','126','127','128','129','130','131','132','133','134','135','136','137','138','139','140','141'];
(async()=>{
for(const id of ids){
  const i=c.indexOf("id: '"+id+"'");
  const e=c.indexOf("id: '"+(parseInt(id)+1)+"'",i);
  const b=c.slice(i,e===-1?undefined:e);
  const img=(b.match(/featuredImage:\s*'([^']+)'/)||[])[1];
  let st='ERR';
  try{const r=await fetch(img,{method:'GET'});st=r.status;}catch(err){st='FETCH-ERR:'+err.cause?.code||err.message;}
  console.log(id+' '+st+' '+img);
}})();
