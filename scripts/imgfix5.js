const UA={'User-Agent':'NexoraComic-audit/1.0'};
async function t(u){try{const r=await fetch(u,{headers:UA});console.log(r.status+' final='+r.url.slice(0,130));}catch(e){console.log('ERR '+u);}}
(async()=>{
  await t('https://commons.wikimedia.org/wiki/Special:FilePath/Euclid%20spacecraft%20ESA24912474.jpg?width=800');
  await t('https://commons.wikimedia.org/wiki/Special:FilePath/FullMoon2010.jpg?width=800');
  await t('https://commons.wikimedia.org/wiki/Special:FilePath/ITER_Site_in_July_2022.jpg?width=800');
  await t('https://commons.wikimedia.org/wiki/Special:FilePath/Liposome_scheme-en.svg?width=800');
  await t('https://commons.wikimedia.org/wiki/Special:FilePath/Xbox_logo_%282019%29.svg?width=800');
})();
