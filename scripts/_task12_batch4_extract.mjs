import { readFileSync, writeFileSync } from 'fs';
const lines = readFileSync(new URL('../lib/articles.ts', import.meta.url), 'utf-8').split('\n');
const isId = l => /^\s*["']?id["']?\s*:\s*["'](\d+)["'],?\s*$/.test(l);
const isSlug = l => /^\s*["']?slug["']?\s*:/.test(l);
const starts = [];
for (let i = 0; i < lines.length - 1; i++) if (isId(lines[i]) && isSlug(lines[i + 1])) starts.push([parseInt(lines[i].match(/\d+/)[0]), i]);
const out = [];
for (let s = 0; s < starts.length; s++) {
  const [id, i] = starts[s];
  if (id < 32 || id > 41) continue;
  const end = s + 1 < starts.length ? starts[s + 1][1] : lines.length;
  out.push(`=== ID ${id} (lines ${i + 1}-${end}) ===\n` + lines.slice(i, end).join('\n'));
}
writeFileSync(new URL('./_task12_batch4_current.txt', import.meta.url), out.join('\n\n'));
console.log('dumped', out.length, 'articles');
