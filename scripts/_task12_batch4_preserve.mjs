import { readFileSync, writeFileSync } from 'fs';
const parse = (txt) => {
  const arts = {};
  const parts = txt.split(/=== ID (\d+)[^\n]*\n/);
  for (let i = 1; i < parts.length; i += 2) arts[parts[i]] = parts[i + 1];
  return arts;
};
const stripSources = (s) => s.replace(/sources:\s*\[[\s\S]*?\n\s*\]/, 'SOURCES_BLOCK');
const norm = (s) => (s || '').replace(/\s+/g, ' ');
const before = parse(readFileSync(new URL('./_task12_batch4_current.txt', import.meta.url), 'utf-8'));
const after = parse(readFileSync(new URL('./_task12_batch4_after.txt', import.meta.url), 'utf-8'));
const report = [];
for (const id of Object.keys(before)) {
  const b = before[id], a = after[id] || '';
  const urlsB = [...b.matchAll(/url:\s*'([^']+)'/g)].map(m => m[1]);
  const urlsA = [...a.matchAll(/url:\s*'([^']+)'/g)].map(m => m[1]);
  const same = norm(stripSources(b)) === norm(stripSources(a));
  report.push({ id, onlySourcesChanged: same, urlsBefore: urlsB, urlsAfter: urlsA });
}
writeFileSync(new URL('./_task12_batch4_preservation.json', import.meta.url), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.map(r => ({ id: r.id, onlySourcesChanged: r.onlySourcesChanged })), null, 1));
