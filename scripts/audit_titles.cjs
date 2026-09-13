const fs = require('fs');
const t = fs.readFileSync('lib/articles.ts', 'utf8');
// split objects by top-level entries: match "{\n    id: 'NN'"
const re = /\{\s*\n\s*id:\s*'(\d+)'[\s\S]*?slug:\s*'([^']+)'[\s\S]*?title:\s*'((?:[^'\\]|\\.)*)'/g;
let m; const rows = [];
while ((m = re.exec(t))) { rows.push({id: m[1], slug: m[2], title: m[3]}); }
// get category per article: find category id near each
const re2 = /\{\s*\n\s*id:\s*'(\d+)'[\s\S]*?category:\s*\{\s*\n\s*id:\s*'([^']+)'/g;
const catmap = {};
while ((m = re2.exec(t))) { catmap[m[1]] = m[2]; }
rows.forEach(r => { console.log(r.id + ' | ' + (catmap[r.id]||'?') + ' | ' + r.slug + ' | ' + r.title); });
console.log('COUNT=' + rows.length);
