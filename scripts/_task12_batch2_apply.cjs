// TASK 12 - Lote 2: substitui SOMENTE o campo sources dos artigos '12'-'21' (CRLF)
const fs = require('fs');
const path = require('path');
const root = 'C:/Users/dizzritimia/CascadeProjects/nexoracomic';
const picks = JSON.parse(fs.readFileSync(path.join(root, 'scripts/_task12_batch2_picks.json'), 'utf8'));
const file = path.join(root, 'lib/articles.ts');
let t = fs.readFileSync(file, 'utf8');
const orig = t;

for (const rec of picks.records) {
  const start = t.indexOf("\n    id: '" + rec.articleId + "',") + 1;
  if (start < 1) throw new Error('ID nao encontrado: ' + rec.articleId);
  const nextId = t.indexOf("\n    id: '", start + 10);
  const blockEnd = nextId === -1 ? t.length : nextId;
  const block = t.slice(start, blockEnd);
  if (!/sources:/.test(block)) throw new Error('sources NAO existe no ID ' + rec.articleId + ' - estado inesperado');
  const re = /(\r?\n)    sources: \[[\s\S]*?\r?\n    \],?/;
  const m = block.match(re);
  if (!m) throw new Error('bloco sources nao encontrado no ID ' + rec.articleId);
  const nl = m[1];
  const src = nl + '    sources: [' +
    rec.newSources.map(s =>
      nl + '      {' +
      nl + "        title: '" + s.title.replace(/'/g, "\\'") + "'," +
      nl + "        url: '" + s.url + "'," +
      nl + "        publisher: '" + s.publisher.replace(/'/g, "\\'") + "'," +
      nl + "        type: '" + s.type + "'," +
      nl + '      },'
    ).join('') +
    nl + '    ],';
  const newBlock = block.replace(re, src);
  t = t.slice(0, start) + newBlock + t.slice(blockEnd);
  console.log('ID ' + rec.articleId + ': sources substituidas (' + rec.newSources.length + ' fonte(s))');
}

if (t === orig) throw new Error('Nada alterado - abortando');
fs.writeFileSync(file, t, 'utf8');
console.log('Total de blocos sources no arquivo:', (t.match(/sources: \[/g) || []).length);

