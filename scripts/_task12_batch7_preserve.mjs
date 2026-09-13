import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const articlesPath = join(__dirname, '..', 'lib', 'articles.ts');
const backupPath = join(__dirname, '_task12_batch7_backup.ts');

// Read both files
const original = readFileSync(backupPath, 'utf-8');
const modified = readFileSync(articlesPath, 'utf-8');

// Extract articles 72-101 from both
function extractArticle(content, id) {
  const regex = new RegExp(`(id:\\s*'${id}'[\\s\\S]*?\\n\\s*\\})`);
  return content.match(regex);
}

const preservationReport = {
  batch: 7,
  articlesRange: '72-101',
  totalArticles: 30,
  results: [],
  onlySourcesChanged: true
};

for (let id = 72; id <= 101; id++) {
  const origMatch = extractArticle(original, id);
  const modMatch = extractArticle(modified, id);
  
  if (!origMatch || !modMatch) {
    preservationReport.results.push({
      id,
      status: 'ERROR',
      message: 'Could not extract article'
    });
    continue;
  }
  
  const origBlock = origMatch[1];
  const modBlock = modMatch[1];
  
  // Extract all fields except sources
  const extractField = (block, field) => {
    const regex = new RegExp(`${field}:\\s*'([^']*)'`);
    const match = block.match(regex);
    return match ? match[1] : null;
  };
  
  const fields = ['title', 'slug', 'excerpt', 'category', 'tags', 'author', 'image', 'imageAlt', 'publishedAt'];
  let fieldsMatch = true;
  const fieldResults = {};
  
  for (const field of fields) {
    // For complex fields, just check they exist in both
    const origHas = origBlock.includes(`${field}:`);
    const modHas = modBlock.includes(`${field}:`);
    if (origHas !== modHas) {
      fieldsMatch = false;
      fieldResults[field] = { match: false, reason: 'Field presence differs' };
    }
  }
  
  // Check if only sources changed
  const origSources = origBlock.match(/sources:\s*\[([\s\S]*?)\]/);
  const modSources = modBlock.match(/sources:\s*\[([\s\S]*?)\]/);
  
  const sourcesChanged = origSources && modSources && origSources[1] !== modSources[1];
  
  // Remove sources from both and compare
  const origWithoutSources = origBlock.replace(/sources:\s*\[[\s\S]*?\]/, 'sources: []');
  const modWithoutSources = modBlock.replace(/sources:\s*\[[\s\S]*?\]/, 'sources: []');
  
  const otherFieldsChanged = origWithoutSources !== modWithoutSources;
  
  if (otherFieldsChanged) {
    preservationReport.onlySourcesChanged = false;
  }
  
  preservationReport.results.push({
    id,
    status: otherFieldsChanged ? 'FAIL' : 'PASS',
    sourcesChanged,
    otherFieldsChanged,
    fieldsMatch
  });
}

// Write preservation report
writeFileSync(
  join(__dirname, '_task12_batch7_preservation.json'),
  JSON.stringify(preservationReport, null, 2)
);

console.log('=== Preservation Check ===');
console.log(`Total articles checked: ${preservationReport.totalArticles}`);
console.log(`Only sources changed: ${preservationReport.onlySourcesChanged}`);
console.log(`\nResults:`);
preservationReport.results.forEach(r => {
  console.log(`  ID ${r.id}: ${r.status} (sourcesChanged: ${r.sourcesChanged}, otherFieldsChanged: ${r.otherFieldsChanged})`);
});
