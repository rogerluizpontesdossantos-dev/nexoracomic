const https=require('https');
const urls=process.argv.slice(2);
function get(u){return new Promise((resolve)=>{
  const req=https.request(u,{method:'GET',timeout:15000,headers:{'User-Agent':'Mozilla/5.0 NexoraComic-audit','Range':'bytes=0-1023'}},(res)=>{resolve(u+' => HTTP '+res.statusCode+' ct='+res.headers['content-type']);res.resume();});
  req.on('timeout',()=>{req.destroy();resolve(u+' => TIMEOUT');});
  req.on('error',(e)=>resolve(u+' => ERR '+String(e.message).slice(0,80)));
  req.end();});}
(async()=>{for(const u of urls){console.log(await get(u));}})();
