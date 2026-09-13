// Audit script: find articles with undefined/unknown category
import fs from 'fs';

const content = fs.readFileSync('lib/articles.ts', 'utf8');
const lines = content.split('\n');

let current = null;
const arts = [];

const known = ['ciencia', 'tecnologia', 'espaco', 'inteligencia-artificial', 'futuro', 'games', 'filmes-series', 'quadrinhos', 'curiosidades'];

for (let i = 0; i < lines.length; i++) {
  const t = lines[i].trim();
  const m = t.match(/^id: '(\d+)',?$/);
  if (m) {
    // Check next line has slug
    let hasNext = false;
    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
      if (lines[j].trim().match(/^slug:/)) { hasNext = true; break; }
    }
    if (hasNext) {
      if (current) arts.push(current);
      current = { id: m[1] };
    }
  }
  if (current) {
    const sm = t.match(/^slug: '([^']+)'/);
    if (sm && !current.slug) current.slug = sm[1];
    
    const tm = t.match(/^title: '([^']*)'/);
    if (tm && !current.title) current.title = tm[1];
    
    if (lines[i].match(/category: \{/)) {
      for (let k = i + 1; k < Math.min(i + 8, lines.length); k++) {
        const cm = lines[k].trim().match(/^id: '([^']+)'/);
        if (cm) { current.catId = cm[1]; break; }
      }
    }
  }
}
if (current) arts.push(current);

const unknown = arts.filter(a => !a.catId);
console.log('Total parsed:', arts.length);
console.log('Unknown cat articles:', unknown.length);
unknown.forEach(a => console.log('ID ' + a.id + ' | ' + (a.slug || 'NO SLUG') + ' | ' + (a.title || 'NO TITLE')));

// Count by category
const byCat = {};
known.forEach(c => byCat[c] = []);
arts.forEach(a => {
  if (!byCat[a.catId]) byCat[a.catId] = [];
  byCat[a.catId].push(a);
});

console.log('\n=== Category Summary ===');
for (const cat of known) {
  console.log(cat + ': ' + (byCat[cat] || []).length);
}
// Show any unknown categories
const unknownCats = Object.keys(byCat).filter(k => !known.includes(k));
unknownCats.forEach(k => {
  console.log(k + ': ' + byCat[k].length + ' (UNKNOWN CATEGORY)');
});

// Verify total
let total = 0;
for (const cat of known) {
  total += (byCat[cat] || []).length;
}
console.log('\nKnown category total:', total);
console.log('Unknown category total:', arts.length - total);
