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
  const r=await get('https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url%7Csize%7Cmime%7Cextmetadata&titles='+encodeURIComponent('File:ITER Tokamak and Plant Systems (2016) (41783636452).jpg')+'%7C'+encodeURIComponent('File:ITER construction in 2018 (41809718461).jpg'));
  const j=JSON.parse(r.body);
  for(const k in j.query.pages){
    const p=j.query.pages[k];const ii=(p.imageinfo||[])[0]||{};
    const lic=(ii.extmetadata&&(ii.extmetadata.LicenseShortName||{}).value)||'?';
    const art=(ii.extmetadata&&(ii.extmetadata.Artist||{}).value||'').replace(/<[^>]+>/g,'').slice(0,120);
    console.log(p.title+' | '+ii.mime+' '+ii.width+'x'+ii.height+' | lic='+lic+' | artist='+art+' | url='+ii.url);
  }
})();
