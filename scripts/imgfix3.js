const UA={'User-Agent':'NexoraComic-audit/1.0'};
async function t(u){try{const r=await fetch(u,{headers:UA});console.log(r.status+' '+u);}catch(e){console.log('ERR '+u);}}
(async()=>{
  const urls=[
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Euclid_spacecraft_ESA24912474.jpg/800px-Euclid_spacecraft_ESA24912474.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/FullMoon2010.jpg/800px-FullMoon2010.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/ITER_Site_in_July_2022.jpg/800px-ITER_Site_in_July_2022.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Liposome_scheme-en.svg/800px-Liposome_scheme-en.svg.png',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Xbox_logo_%282019%29.svg/800px-Xbox_logo_%282019%29.svg.png',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Star_Wars_Yellow_Logo.svg/800px-Star_Wars_Yellow_Logo.svg.png',
  ];
  for(const u of urls) await t(u);
})();
