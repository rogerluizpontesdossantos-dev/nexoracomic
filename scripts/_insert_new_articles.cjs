/** Build script: generates TSCat and inserts 18 articles into lib/articles.ts */
const fs = require('fs');
const path = require('path');
const ROOT = 'C:\\Users\\dizzritimia\\CascadeProjects\\nexoracomic';
const articlesPath = path.join(ROOT, 'lib/articles.ts');
const dataPath = path.join(ROOT, 'scripts/_articles_data.js');

const A = require(dataPath);

function cat(slug) {
  const map = {
    espaco: { id: 'espaco', slug: 'espaco', name: 'Espaço', description: 'Astronomia, NASA, planetas, estrelas e missões espaciais', color: '#f59e0b' },
    ia: { id: 'inteligencia-artificial', slug: 'inteligencia-artificial', name: 'Inteligência Artificial', description: 'IA generativa, ferramentas de IA, pesquisa e futuro da IA', color: '#ec4899' },
    tecnologia: { id: 'tecnologia', slug: 'tecnologia', name: 'Tecnologia', description: 'Gadgets, computação, cibersegurança, robótica e tecnologia futura', color: '#06b6d4' },
    ciencia: { id: 'ciencia', slug: 'ciencia', name: 'Ciência', description: 'Biologia, física, química, neurociência e descobertas científicas', color: '#8b5cf6' },
    games: { id: 'games', slug: 'games', name: 'Games', description: 'Notícias de games, tecnologia por trás dos jogos e análise da indústria', color: '#ef4444' },
    fs: { id: 'filmes-series', slug: 'filmes-series', name: 'Filmes e Séries', description: 'Ficção científica, tecnologia no cinema e análise de produções', color: '#f97316' },
    quadrinhos: { id: 'quadrinhos', slug: 'quadrinhos', name: 'Quadrinhos', description: 'Comics, super-heróis, ciência nos quadrinhos e adaptações', color: '#6366f1' },
    curiosidades: { id: 'curiosidades', slug: 'curiosidades', name: 'Curiosidades', description: 'Ciência fascinante, tecnologia histórica e descobertas incomuns', color: '#14b8a6' },
    futuro: { id: 'futuro', slug: 'futuro', name: 'Futuro', description: 'Tecnologias emergentes, biotecnologia, energia e cidades inteligentes', color: '#10b981' },
  };
  return map[slug];
}

function serialize(a) {
  const c = cat(a.category);
  let s = '  {\n';
  s += "    id: '" + a.id + "',\n";
  s += "    slug: '" + a.slug + "',\n";
  s += "    title: '" + a.title.replace(/'/g, "\\'") + "',\n";
  s += "    excerpt: '" + a.excerpt.replace(/'/g, "\\'") + "',\n";
  s += "    content: `\\\n" + a.content.replace(/`/g, '\\`') + "\\`,\n";
  s += "    category: { id: '" + c.id + "', slug: '" + c.slug + "', name: '" + c.name + "', description: '" + c.description + "', color: '" + c.color + "' },\n";
  s += "    tags: [" + a.tags.map(t => "'" + t.replace(/'/g, "\\'") + "'").join(', ') + "],\n";
  s += "    author: { id: '1', name: 'Equipe NexoraComic' },\n";
  s += "    publishedAt: '" + a.publishedAt + "',\n";
  s += "    readingTime: " + a.readingTime + ",\n";
  s += "    featuredImage: '" + a.featuredImage + "',\n";
  s += "    imageAlt: '" + a.imageAlt.replace(/'/g, "\\'") + "',\n";
  s += "    sources: [\n";
  for (const src of a.sources) {
    s += "      { title: '" + src.title.replace(/'/g, "\\'") + "', url: '" + src.url + "', " + (src.type ? "type: '" + src.type + "' " : '') + "},\n";
  }
  s += "    ]\n";
  s += '  }';
  return s;
}

// Generate TS code
let tsCode = '\n';
for (let i = 0; i < A.length; i++) {
  tsCode += serialize(A[i]);
  if (i < A.length - 1) tsCode += ',\n';
  else tsCode += '\n';
}
tsCode += '\n';

// Read the current articles.ts
const content = fs.readFileSync(articlesPath, 'utf8');

// Find the last `];` (end of array)
const lastBracket = content.lastIndexOf('];');

// Insert new articles before `];`
const before = content.substring(0, lastBracket);
const after = content.substring(lastBracket);

const newContent = before + tsCode + after;

// Write backup
fs.writeFileSync(path.join(ROOT, 'lib/articles.ts.bak'), content, 'utf8');

// Write updated file
fs.writeFileSync(articlesPath, newContent, 'utf8');

console.log('Inserted ' + A.length + ' articles into lib/articles.ts');
console.log('New total IDs: 124-' + (123 + A.length));


