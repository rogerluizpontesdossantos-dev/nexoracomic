const fs=require('fs');
const a=fs.readFileSync('C:/Users/dizzritimia/CascadeProjects/nexoracomic/lib/articles.ts','utf8');
const imgFixes={
 'https://science.nasa.gov/wp-content/uploads/2023/09/webb-kuiper-belt.jpg':'https://upload.wikimedia.org/wikipedia/commons/8/15/Trans-Neptunians_and_Centaurs.svg',
 'https://science.nasa.gov/wp-content/uploads/2023/05/moon-lro.jpg':'https://upload.wikimedia.org/wikipedia/commons/e/e1/FullMoon2010.jpg',
 'https://eoimages.gsfc.nasa.gov/images/imagerecords/150000/153000/153000_lrg.jpg':'https://upload.wikimedia.org/wikipedia/commons/9/9e/Sahara_dust_storm_from_Aqua_MODIS_2004-02-19.jpg',
 'https://upload.wikimedia.org/wikipedia/commons/8/8e/DNA_chemical_structure.svg':'https://upload.wikimedia.org/wikipedia/commons/6/6e/Double_stranded_DNA_chemical_structure.svg',
 'https://upload.wikimedia.org/wikipedia/commons/5/57/Nanoparticle.jpg':'https://upload.wikimedia.org/wikipedia/commons/9/9c/Liposome_scheme-en.svg',
 'https://upload.wikimedia.org/wikipedia/commons/5/5c/ITER_Tokamak_and_Plant_Systems.jpg':'https://upload.wikimedia.org/wikipedia/commons/f/f4/ITER_Site_in_July_2022.jpg',
 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Nintendo_Switch_2_logo.svg':'https://upload.wikimedia.org/wikipedia/commons/8/87/Nintendo_Switch_2_logo_transparent.svg',
 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Xbox_one_logo.svg':'https://upload.wikimedia.org/wikipedia/commons/0/02/Xbox_logo_%282019%29.svg',
 'https://upload.wikimedia.org/wikipedia/commons/6/6c/Star_Wars_Logo.svg':'https://upload.wikimedia.org/wikipedia/commons/9/9b/Star_Wars_Yellow_Logo.svg',
 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg':'https://upload.wikimedia.org/wikipedia/commons/7/75/Netflix_icon.svg',
 'https://upload.wikimedia.org/wikipedia/commons/9/9d/DC_Comics_logo.svg':'https://upload.wikimedia.org/wikipedia/commons/9/99/DC_Comics_Logo_2016.svg',
};
let n=a,cnt=0;
for(const k in imgFixes){const occ=n.split(k).length-1;cnt+=occ;n=n.split(k).join(imgFixes[k]);}
fs.writeFileSync('C:/Users/dizzritimia/CascadeProjects/nexoracomic/lib/articles.ts',n,'utf8');
console.log('img replaced:'+cnt);
