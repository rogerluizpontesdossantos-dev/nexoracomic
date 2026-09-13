import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const original = readFileSync(join(__dirname, '_task13_backup.ts'), 'utf-8');
const modified = readFileSync(join(__dirname, '..', 'lib', 'articles.ts'), 'utf-8');

const report = {
  batch: 13,
  onlySourcesChanged: true,
  results: []
};

for (let id = 1; id <= 105; id++) {
  const regex = new RegExp(`(id:\\s*'${id}'[\\s\\S]*?\\n\\s*\\})`);
  const origMatch = original.match(regex);
  const modMatch = modified.match(regex);
  if (origMatch && modMatch) {
    const origBlock = origMatch[1].replace(/sources:\s*\[[\s\S]*?\]/, 'sources: []');
    const modBlock = modMatch[1].replace(/sources:\s*\[[\s\S]*?\]/, 'sources: []');
    const changed = origBlock !== modBlock;
    if (changed) {
      report.onlySourcesChanged = false;
    }
    report.results.push({ id, status: changed ? 'FAIL' : 'PASS' });
  }
}

writeFileSync(join(__dirname, '_task13_preservation.json'), JSON.stringify(report, null, 2));
console.log('Preservation check onlySourcesChanged:', report.onlySourcesChanged);
