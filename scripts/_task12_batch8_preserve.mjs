import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const articlesPath = join(__dirname, '..', 'lib', 'articles.ts');
const backupPath = join(__dirname, '_task12_batch8_backup.ts');

const original = readFileSync(backupPath, 'utf-8');
const modified = readFileSync(articlesPath, 'utf-8');

const report = { batch: 8, articlesRange: '102-105', onlySourcesChanged: true, results: [] };

for (let id = 102; id <= 105; id++) {
  const regex = new RegExp(`(id:\\s*'${id}'[\\s\\S]*?\\n\\s*\\})`);
  const origBlock = original.match(regex)[1];
  const modBlock = modified.match(regex)[1];
  
  const origWithoutSources = origBlock.replace(/sources:\s*\[[\s\S]*?\]/, 'sources: []');
  const modWithoutSources = modBlock.replace(/sources:\s*\[[\s\S]*?\]/, 'sources: []');
  
  const otherFieldsChanged = origWithoutSources !== modWithoutSources;
  if (otherFieldsChanged) report.onlySourcesChanged = false;
  
  report.results.push({ id, status: otherFieldsChanged ? 'FAIL' : 'PASS' });
}

writeFileSync(join(__dirname, '_task12_batch8_preservation.json'), JSON.stringify(report, null, 2));
console.log('Preservation check:', report.onlySourcesChanged);
