const UA={'User-Agent':'NexoraComic-audit/1.0'};
async function t(u){try{const r=await fetch(u,{headers:UA});console.log(r.status+' '+u);}catch(e){console.log('ERR '+u);}}
(async()=>{
  const urls=[
    'https://commons.wikimedia.org/wiki/Special:FilePath/TNOsAni.jpg',
    'https://commons.wikimedia.org/wiki/Special:FilePath/DNA%20double%20helix%20horizontal.png',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Cluster%20satellite%20reentering%20Earth%27s%20atmosphere%20ESA500772.jpg',
    'https://commons.wikimedia.org/wiki/Special:FilePath/ITER%20construction%20site%20from%20the%20distance.jpg',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Nintendo%20Switch%202%20logo%20transparent.svg',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Star%20Wars%20Yellow%20Logo.svg',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Netflix%20icon.svg',
    'https://commons.wikimedia.org/wiki/Special:FilePath/DC%20Comics%20Logo%202016.svg',
    'https://eoimages.gsfc.nasa.gov/images/imagerecords/150000/153000/153000.jpg',
    'https://eoimages.gsfc.nasa.gov/images/imagerecords/150000/153001/153001_lrg.jpg',
  ];
  for(const u of urls) await t(u);
})();
