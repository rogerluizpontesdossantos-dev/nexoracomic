// Script de auditoria: extrair todos os artigos do lib/articles.ts
import fs from 'fs';

const content = fs.readFileSync('lib/articles.ts', 'utf8');
const lines = content.split('\n');

const articles = [];
let current = null;

const knownCategories = [
  'ciencia', 'tecnologia', 'espaco', 'inteligencia-artificial',
  'futuro', 'games', 'filmes-series', 'quadrinhos', 'curiosidades'
];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();

  const idMatchNum = trimmed.match(/^id: '(\d+)',?\s*$/);

  if (idMatchNum) {
    let hasNextSlug = false;
    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
      if (lines[j].trim().match(/^slug:/)) { hasNextSlug = true; break; }
    }
    if (hasNextSlug) {
      if (current) articles.push(current);
      current = { id: idMatchNum[1] };
    }
  }

  if (current) {
    const slugMatch = trimmed.match(/^slug: '([^']+)'/);
    if (slugMatch && !current.slug) current.slug = slugMatch[1];

    const titleMatch = trimmed.match(/^title: '([^']*)'/);
    if (titleMatch && !current.title) current.title = titleMatch[1];

    if (trimmed.match(/^category: \{/)) {
      for (let k = i + 1; k < Math.min(i + 8, lines.length); k++) {
        const catId = lines[k].trim().match(/^id: '([^']+)'/);
        if (catId) { current.categoryId = catId[1]; break; }
      }
    }

    const dateMatch = trimmed.match(/^publishedAt: '([^']+)'/);
    if (dateMatch) current.publishedAt = dateMatch[1];
  }
}
if (current) articles.push(current);

const byCat = {};
knownCategories.forEach(c => byCat[c] = []);
articles.forEach(a => {
  if (byCat[a.categoryId]) byCat[a.categoryId].push(a);
  else byCat[a.categoryId] = [a];
});

let output = 'Total articles: ' + articles.length + '\nMax ID: ' + Math.max(...articles.map(a => parseInt(a.id))) + '\n\n';

for (const cat of knownCategories) {
  const arts = byCat[cat] || [];
  output += '=== ' + cat + ' (' + arts.length + ' articles) ===\n';
  arts.forEach(a => {
    output += 'ID ' + a.id + ' | ' + a.slug + ' | ' + a.title + '\n';
  });
  output += '\n';
}

fs.writeFileSync('scripts/_task_catalog.txt', output);
console.log(output);
