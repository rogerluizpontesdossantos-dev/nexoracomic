// Script para auditoria: extrair todos os artigos do lib/articles.ts
import fs from 'fs';

const content = fs.readFileSync('lib/articles.ts', 'utf8');

// Remove the import line and everything before DEMONSTRATION_ARTICLES
const arrStart = content.indexOf('export const DEMONSTRATION_ARTICLES');
const arrContent = content.slice(arrStart);

// Each article object starts with { and contains id, slug, title, category
// Let's use a regex to find all article blocks
// Pattern: id: 'N', followed by slug, title, then category with id

const articleRegex = /\{\s*\n\s*id:\s*'(\d+)',\s*\n\s*slug:\s*'([^']+)',\s*\n\s*title:\s*'([^']+)',\s*\n\s*excerpt:\s*'[^']*',\s*\n\s*content:\s*`([\s\S]*?)`,\s*\n\s*category:\s*\{\s*\n\s*id:\s*'(\w+)',\s*\n\s*slug:\s*'(\w+)',\s*\n\s*name:\s*'([^']+)',\s*\n\s*description:\s*'([^']*)',\s*\n\s*color:\s*'([^']+)'\s*\},/g;

const articles = [];
let m;
while ((m = articleRegex.exec(arrContent)) !== null) {
  articles.push({
    id: m[1],
    slug: m[2],
    title: m[3],
    categoryId: m[5],
    categoryName: m[7]
  });
}

console.log('Total articles found:', articles.length);
console.log('Max ID:', Math.max(...articles.map(a => parseInt(a.id))));

// Group by category
const knownCategories = ['ciencia', 'tecnologia', 'espaco', 'inteligencia-artificial', 'futuro', 'games', 'filmes-series', 'quadrinhos', 'curiosidades'];
const byCat = {};
knownCategories.forEach(c => byCat[c] = []);
articles.forEach(a => {
  if (byCat[a.categoryId]) byCat[a.categoryId].push(a);
  else byCat[a.categoryId] = [a];
});

let output = `Total articles: ${articles.length}\nMax ID: ${Math.max(...articles.map(a => parseInt(a.id)))}\n\n`;

for (const cat of knownCategories) {
  const arts = byCat[cat] || [];
  output += `=== ${cat} (${arts.length} articles) ===\n`;
  arts.forEach(a => {
    output += `ID ${a.id} | ${a.slug} | ${a.title}\n`;
  });
  output += '\n';
}

fs.writeFileSync('scripts/_task_catalog.txt', output);
console.log(output);


for (const cat of knownCategories) {
  const arts = byCat[cat] || [];
  output += `=== ${cat} (${arts.length} articles) ===\n`;
  arts.forEach(a => {
    output += `ID ${a.id} | ${a.slug} | ${a.title}\n`;
  });
  output += '\n';
}

fs.writeFileSync('scripts/_task_report_catalog.txt', output);
console.log(output);

