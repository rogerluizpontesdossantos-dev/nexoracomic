#!/usr/bin/env node
/**
 * Task 10 — Retomada: compara as fontes do lib/articles.ts atual vs HEAD (git).
 * Saída: resumo por artigo de fontes adicionadas/removidas/retipadas.
 * Não altera nenhum arquivo do projeto (somente lê).
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const strip = (c) => c.split('\n').filter((l) => !/^import \{ Article \}/.test(l)).join('\n');

function srcKey(s) {
  return (s.url || '').trim().toLowerCase();
}

async function loadSourcesFromFile(file, tmpDirName, tmpName) {
  const content = strip(fs.readFileSync(file, 'utf-8'));
  const tmp = path.join(__dirname, tmpDirName, tmpName);
  fs.writeFileSync(tmp, content);
  const mod = await import('file:///' + tmp.replace(/\\/g, '/'));
  const articles = mod.DEMONSTRATION_ARTICLES || mod.articles || [];
  const map = new Map();
  for (const a of articles) {
    map.set(String(a.id), {
      id: String(a.id),
      slug: a.slug,
      sources: (a.sources || []).map((s) => ({ title: s.title, url: s.url, type: s.type, publisher: s.publisher })),
    });
  }
  return map;
}

(async () => {
  const headContent = execSync('git show HEAD:lib/articles.ts', { cwd: root, maxBuffer: 64 * 1024 * 1024 }).toString();
  const tmpDir = path.join(__dirname, '_task10_tmp');
  fs.mkdirSync(tmpDir, { recursive: true });
  const headTmp = path.join(tmpDir, 'head_articles_snapshot.ts');
  fs.writeFileSync(headTmp, strip(headContent));

  const cur = await loadSourcesFromFile(path.join(root, 'lib', 'articles.ts'), '_task10_tmp', 'cur.ts');
  const old = await loadSourcesFromFile(headTmp, '_task10_tmp', 'head.ts');
  // limpeza: remove snapshots temporários ao final
  for (const f of ['cur.ts', 'head.ts', 'head_articles_snapshot.ts']) {
    try { fs.unlinkSync(path.join(tmpDir, f)); } catch {}
  }

  let added = 0, removed = 0, changedType = 0, touched = 0;
  const detail = [];
  const ids = new Set([...cur.keys(), ...old.keys()]);
  for (const id of ids) {
    const c = cur.get(id) || { sources: [], slug: '?' };
    const o = old.get(id) || { sources: [], slug: '?' };
    const curUrls = new Set(c.sources.map(srcKey));
    const oldUrls = new Set(o.sources.map(srcKey));
    const add = c.sources.filter((s) => !oldUrls.has(srcKey(s)));
    const rem = o.sources.filter((s) => !curUrls.has(srcKey(s)));
    const retype = c.sources.filter((s) => {
      const match = o.sources.find((x) => srcKey(x) === srcKey(s));
      return match && (match.type !== s.type || (match.publisher || '') !== (s.publisher || '') || match.title !== s.title);
    });
    if (add.length || rem.length || retype.length) {
      touched++;
      added += add.length; removed += rem.length; changedType += retype.length;
      detail.push({ id, slug: c.slug || o.slug, added: add.map((s) => s.url), removed: rem.map((s) => s.url), retyped: retype.map((s) => ({ url: s.url, type: s.type, was: (o.sources.find((x) => srcKey(x) === srcKey(s)) || {}).type })) });
    }
  }
  console.log('Artigos tocados vs HEAD:', touched);
  console.log('Fontes adicionadas:', added, '| removidas:', removed, '| retipadas:', changedType);
  for (const d of detail) {
    console.log(`\nART ${d.id} (${d.slug})`);
    if (d.added.length) console.log('  + ' + d.added.join('\n    '));
    if (d.removed.length) console.log('  - ' + d.removed.join('\n    '));
    if (d.retyped.length) console.log('  ~ ' + d.retyped.map((r) => `${r.url} [${r.was} -> ${r.type}]`).join('\n    '));
  }
})();
