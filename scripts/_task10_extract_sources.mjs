#!/usr/bin/env node
/**
 * Extrai todas as fontes do lib/articles.ts em um arquivo JSON estruturado.
 * Função auxiliar da Task 10 — auditoria de fontes.
 * Usa import nativo do Node com strip-types (Node >= 24).
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const articlesPath = join(projectRoot, 'lib/articles.ts');

// Clone articles.ts to a temp file in scripts/; fix the relative import path
// so it resolves from scripts/ back to lib/types.ts, and drop type-only imports
// (interfaces are erased at runtime).
let content = readFileSync(articlesPath, 'utf-8');
// Drop the type-only import line (Article is an interface, erased at runtime)
content = content
  .split('\n')
  .filter((l) => !/^import \{ Article \}/.test(l))
  .join('\n');
const tempArticlesPath = join(__dirname, '_task10_tmp', '_task10_temp_articles.ts');
writeFileSync(tempArticlesPath, content);

const mod = await import(pathToFileURL(tempArticlesPath).href);
const articles = mod.DEMONSTRATION_ARTICLES;

const result = articles.map((a) => ({
  articleId: a.id,
  articleTitle: a.title,
  slug: a.slug,
  category: a.category?.slug,
  sources: (a.sources || []).map((s) => ({
    title: s.title,
    url: s.url,
    type: s.type,
    publisher: s.publisher,
  })),
}));

writeFileSync(join(__dirname, '_task10_extracted.json'), JSON.stringify(result, null, 2));
console.log(`Extraídos ${result.length} artigos, ${result.reduce((s, a) => s + a.sources.length, 0)} fontes.`);