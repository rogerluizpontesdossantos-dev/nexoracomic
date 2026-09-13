const UA={'User-Agent':'NexoraComic-audit/1.0'};
async function t(u){try{const r=await fetch(u,{headers:UA,redirect:'manual'});console.log(r.status+' loc='+(r.headers.get('location')||'').slice(0,120)+' :: '+u);}catch(e){console.log('ERR '+u+' '+e.message);}}
(async()=>{
  await t('https://commons.wikimedia.org/wiki/Special:FilePath/Euclid%20spacecraft%20ESA24912474.jpg?width=800');
  await t('https://commons.wikimedia.org/wiki/Special:FilePath/FullMoon2010.jpg?width=800');
  await t('https://commons.wikimedia.org/wiki/Special:FilePath/ITER_Site_in_July_2022.jpg?width=800');
  await t('https://commons.wikimedia.org/wiki/Special:FilePath/ChatGPT_logo.svg');
  await t('https://commons.wikimedia.org/wiki/Special:FilePath/Apple_logo_black.svg');
})();
