const https=require('https');
function get(url){
  return new Promise((res)=>{
    const u=new URL(url);
    const r=https.request({method:'GET',hostname:u.hostname,path:u.pathname+u.search,headers:{'User-Agent':'NexoraComic-audit/1.0'}},(rr)=>{
      let d='';rr.on('data',(c)=>{d+=c;});rr.on('end',()=>res({st:rr.statusCode,body:d}));
    });
    r.on('error',(e)=>res({st:'ERR',body:String(e.message)}));r.setTimeout(20000,()=>{r.destroy();res({st:'TIMEOUT',body:''})});r.end();
  });
}
(async()=>{
  for(const q of ['ITER%20Tokamak%20July%202022','ITER%20Site','ITER%20Tokamak%20construction']){
    const r=await get('https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srsearch='+q+'%20filetype%3Abitmap&srnamespace=6&srlimit=5');
    console.log('--- '+q+' STATUS '+r.st);
    try{const j=JSON.parse(r.body);for(const s of (j.query.search||[]))console.log('  '+s.title);}catch(e){console.log(r.body.slice(0,200));}
  }
})();
