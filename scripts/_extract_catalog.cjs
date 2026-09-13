const fs = require('fs');
const path = require('path');
const ROOT = 'C:\\Users\\dizzritimia\\CascadeProjects\\nexoracomic';
const c = fs.readFileSync(path.join(ROOT, 'lib/articles.ts'), 'utf8');

// Count articles by counting 'content: `' occurrences (each article has exactly one)
const contentCount = (c.match(/content: `/g) || []).length;
console.log('Articles (by content field):', contentCount);

// Extract all article-level IDs (lines like "    id: 'N'", not author IDs)
const lines = c.split('\n');
let ids = [];
let slugs = [];
let titles = [];
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  // Article id is at 4-space indent: "    id: 'N'"
  if (l.match(/^    id: '\d+'/)) {
    const m = l.match(/'(\d+)'/);
    if (m) ids.push(m[1]);
  }
  // Article slug at 4-space indent
  if (l.match(/^    slug: '/)) {
    const m = l.match(/'([^']+)'/);
    if (m) slugs.push(m[1]);
  }
  // Article title at 4-space indent
  if (l.match(/^    title: '/)) {
    const m = l.match(/'([^']*)'/);
    if (m) titles.push(m[1]);
  }
}

console.log('Article IDs found:', ids.length);
console.log('Slugs found:', slugs.length);
console.log('Titles found:', titles.length);
console.log('Max ID:', Math.max(...ids.map(x=>parseInt(x))));
console.log('IDs sorted:', [...new Set(ids)].sort((a,b)=>parseInt(a)-parseInt(b)).join(', '));

// Group slugs by category (find category id before each slug)
let currentCat = '';
let catSlugMap = {};
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  // Multi-line category: "      id: 'espaco'," 
  if (l.match(/      id: '([^']+)'/)) {
    const m = l.match(/      id: '([^']+)'/);
    if (m) currentCat = m[1];
  }
  // Single-line category: category: { id: 'espaco', ... }
  const m2 = l.match(/category: \{[^}]*id: '([^']+)'[^}]*name: '([^']+)'[^}]*\}/);
  if (m2) {
    currentCat = m2[1];
  }
  // Article slug
  if (l.match(/^    slug: '/)) {
    const sm = l.match(/'([^']+)'/);
    if (sm && currentCat) {
      const slug = sm[1];
      if (!catSlugMap[slug]) catSlugMap[slug] = [];
      catSlugMap[slug].push(currentCat);
    }
  }
}

// Build id->slug->category mapping
let result = [];
for (let i = 0; i < ids.length; i++) {
  const slug = slugs[i] || '';
  const title = titles[i] || '';
  const cats = catSlugMap[slug] || [];
  const cat = cats[cats.length - 1] || currentCat;
  result.push({id: ids[i], slug, title, cat});
}

// Group by category
let byCat = {};
for (const r of result) {
  if (!byCat[r.cat]) byCat[r.cat] = [];
  byCat[r.cat].push(r);
}

let out = [];
out.push('Total articles: ' + result.length);
out.push('');
for (const [cat, items] of Object.entries(byCat)) {
  out.push('=== ' + cat + ' (' + items.length + ') ===');
  items.forEach(r => out.push('ID:' + r.id + ' | ' + r.slug + ' | ' + r.title));
  out.push('');
}

fs.writeFileSync('C:\\temp\\full_catalog.txt', out.join('\n'), 'utf8');
console.log('\nCatalog written to C:\\temp\\full_catalog.txt');






