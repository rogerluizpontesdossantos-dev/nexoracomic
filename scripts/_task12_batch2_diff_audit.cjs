// Audita o diff do Lote 2: gera diff atual, remove o baseline (pre-lote) e analisa o delta
const { execSync } = require('child_process');
const fs = require('fs');
const root = 'C:/Users/dizzritimia/CascadeProjects/nexoracomic';
const cur = execSync('git diff -- lib/articles.ts', { cwd: root }).toString();
const base = fs.readFileSync(root + '/scripts/_task12_batch2_baseline_diff.txt', 'utf8');
// delta = hunk lines presentes no diff atual mas nao no baseline
const curLines = cur.split('\n');
const baseSet = new Set(base.split('\n'));
const delta = curLines.filter(l => !baseSet.has(l));
// separa apenas linhas +/- de conteudo do delta
const changed = delta.filter(l => /^[+-]/.test(l) && !/^[+-]{3}/.test(l));
// identifica IDs tocados pelas linhas alteradas: rastreia ultimo "id: 'N'," visto
let touched = {}, lastId = null, lastField = null;
const contentChanges = [];
for (const l of delta) {
  const m = l.match(/^[+-]\s*id: '(\d+)',/);
  if (m) lastId = m[1];
  const mf = l.match(/^[+-]\s*(\w+):/);
  if (mf) lastField = mf[1];
  if (/^[+-]/.test(l) && !/^[+-]{3}/.test(l) && !/^\+\s*id:/.test(l) && !/^-\s*id:/.test(l)) {
    contentChanges.push({ line: l.slice(0, 110), lastId, lastField });
  }
}
// para cada artigo, campo vigente das mudancas
const perArticle = {};
for (const c of contentChanges) {
  const key = c.lastId || '?';
  perArticle[key] = perArticle[key] || new Set();
  perArticle[key].add(c.lastField || '?');
}
console.log('Artigos tocados pelo delta do diff e campos alterados:');
for (const k of Object.keys(perArticle).sort((a,b)=>a-b)) console.log('  ID', k, '->', [...perArticle[k]].join(', '));
const nonSources = contentChanges.filter(c => c.lastField !== 'sources');
console.log('Mudancas fora de sources:', nonSources.length);
for (const c of nonSources) console.log('  ', c.lastId, c.line);
// todas as linhas + devem conter url/title/publisher/type/iter/... apenas dentro de sources
const badPlus = contentChanges.filter(c => /^[+]/.test(c.line) && !/title:|url:|publisher:|type:|sources: \[|\},|\],|\{/.test(c.line));
console.log('Linhas + suspeitas:', badPlus.length); for (const b of badPlus) console.log('  ', b.line);
