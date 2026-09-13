const UA={'User-Agent':'NexoraComic-audit/1.0 (contact: audit)'};
async function head(u){try{const r=await fetch(u,{headers:UA});return r.status;}catch(e){return 'ERR';}}
(async()=>{
  const tests=[
    'https://commons.wikimedia.org/wiki/Special:FilePath/Trans-Neptunians_and_Centaurs.svg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/15/Trans-Neptunians_and_Centaurs.svg/800px-Trans-Neptunians_and_Centaurs.svg.png',
    'https://upload.wikimedia.org/wikipedia/commons/6/6e/Double_stranded_DNA_chemical_structure.svg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Double_stranded_DNA_chemical_structure.svg/800px-Double_stranded_DNA_chemical_structure.svg.png',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/DNA_chemical_structure.svg/800px-DNA_chemical_structure.svg.png',
  ];
  for(const u of tests){console.log(await head(u)+' '+u);}
  // Commons API search for valid files
  const q=['Trans-Neptunian objects diagram','DNA double helix structure','Euclid space telescope','Cluster satellite ESA reentry','ITER site construction','Full Moon LRO'];
  for(const s of q){
    const url='https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srsearch='+encodeURIComponent(s+' filetype:bitmap')+'&srnamespace=6&srlimit=3&origin=*';
    try{
      const r=await fetch(url,{headers:UA}); const j=await r.json();
      console.log('SEARCH:'+s+' -> '+((j.query?.search)||[]).map(x=>x.title).join(' | '));
    }catch(e){console.log('SEARCH-ERR:'+s);}
  }
})();
