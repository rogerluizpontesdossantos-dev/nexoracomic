import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const articlesPath = join(__dirname, '..', 'lib', 'articles.ts');

const content = readFileSync(articlesPath, 'utf-8');

// Extract articles 72-101
const articleRegex = /id:\s*'(\d+)'[\s\S]*?sources:\s*\[([\s\S]*?)\]\s*\}/g;
const articles = [];
let match;

while ((match = articleRegex.exec(content)) !== null) {
  const id = parseInt(match[1], 10);
  if (id >= 72 && id <= 101) {
    const sourcesBlock = match[2];
    const sources = [];
    
    // Parse sources
    const sourceRegex = /\{\s*title:\s*'([^']+)',\s*url:\s*'([^']+)',\s*type:\s*'([^']+)'\s*\}/g;
    let sourceMatch;
    while ((sourceMatch = sourceRegex.exec(sourcesBlock)) !== null) {
      sources.push({
        title: sourceMatch[1],
        url: sourceMatch[2],
        type: sourceMatch[3]
      });
    }
    
    // Extract title
    const titleMatch = content.substring(match.index).match(/title:\s*'([^']+)'/);
    const title = titleMatch ? titleMatch[1] : 'Unknown';
    
    articles.push({
      id,
      title,
      sources,
      sourcesCount: sources.length
    });
  }
}

// Sort by id
articles.sort((a, b) => a.id - b.id);

// Write extraction
writeFileSync(
  join(__dirname, '_task12_batch7_extracted.json'),
  JSON.stringify({ total: articles.length, articles }, null, 2)
);

console.log(`Extracted ${articles.length} articles (IDs 72-101)`);
console.log('\nSummary:');
articles.forEach(a => {
  console.log(`  ID ${a.id}: ${a.title.substring(0, 60)}... (${a.sourcesCount} sources)`);
  a.sources.forEach(s => {
    console.log(`    - ${s.url}`);
  });
});
