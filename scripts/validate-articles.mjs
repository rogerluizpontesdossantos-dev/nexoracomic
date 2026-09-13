#!/usr/bin/env node

/**
 * Editorial validation script for NexoraComic articles
 * Validates that all articles have required fields including sources
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read articles.ts
const articlesPath = join(__dirname, '../lib/articles.ts');
const articlesContent = readFileSync(articlesPath, 'utf-8');

const errors = [];
const warnings = [];

const lines = articlesContent.split('\n');

const isIdLine = (l) => l.match(/^\s*["']?id["']?\s*:\s*["'](\d+)["'],?\s*$/);
const isSlugLine = (l) => /^\s*["']?slug["']?\s*:/.test(l || '');
const isSourcesStart = (l) => /^\s*["']?sources["']?\s*:\s*\[/.test(l || '');

// Count articles by counting article-level numeric id lines that are
// immediately followed by a slug line (excludes nested author/category ids).
// Article boundaries are precomputed so nested ids (e.g. author "id": "1")
// are never mistaken for the start of the next article.
let totalArticles = 0;
let articlesWithSources = 0;
let articlesWithEmptySources = 0;
const starts = [];
for (let i = 0; i < lines.length - 1; i++) {
  if (isIdLine(lines[i]) && isSlugLine(lines[i + 1])) starts.push(i);
}
for (let s = 0; s < starts.length; s++) {
  const from = starts[s] + 1;
  const to = s + 1 < starts.length ? starts[s + 1] : lines.length;
  totalArticles++;
  // Find this article's sources field within its own block
  for (let j = from; j < to; j++) {
    if (isSourcesStart(lines[j])) {
      articlesWithSources++;
      // Empty array: closes on the same line or immediately on the next non-empty line
      const sameLine = /\[\s*\]\s*,?\s*$/.test(lines[j]);
      if (sameLine) {
        articlesWithEmptySources++;
      } else {
        let k = j + 1;
        while (k < to && lines[k].trim() === '') k++;
        if (/^\s*\],?\s*$/.test(lines[k] || '')) articlesWithEmptySources++;
      }
      break;
    }
  }
}

const articlesWithoutSources = totalArticles - articlesWithSources;

// Detect homepage-only URLs inside sources blocks (specificity check).
// Kept as warnings so pre-existing data does not break the gate, while
// flagging sources that are not specific enough for editorial review.
const homepageSources = new Set();
const srcBlocks = articlesContent.match(/sources:\s*\[[\s\S]*?\n\s*\],?/g) || [];
for (const block of srcBlocks) {
  for (const m of block.matchAll(/url:\s*['"]([^'"]+)['"]/g)) {
    try {
      const u = new URL(m[1]);
      if ((u.pathname === '/' || u.pathname === '') && !u.search) homepageSources.add(m[1]);
    } catch {
      warnings.push(`URL malformada detectada em sources: ${m[1]}`);
    }
  }
}
homepageSources.forEach((u) => warnings.push(`Fonte muito genérica (homepage): ${u} — preferir página específica`));

// Print results
console.log('\n=== Editorial Validation Report ===\n');
console.log(`Total articles audited: ${totalArticles}`);
console.log(`Articles with sources field: ${articlesWithSources}`);
console.log(`Articles WITHOUT sources field: ${articlesWithoutSources}`);
console.log(`Articles with EMPTY sources array: ${articlesWithEmptySources}`);
console.log(`\nErrors: ${errors.length}`);
console.log(`Warnings: ${warnings.length}\n`);

if (errors.length > 0) {
  console.log('=== ERRORS ===\n');
  errors.forEach((error) => console.error(`❌ ${error}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('=== WARNINGS ===\n');
  warnings.forEach((warning) => console.warn(`⚠️  ${warning}`));
  console.log('');
}

// Populate errors so the printed report matches the exit code
if (articlesWithoutSources > 0) {
  errors.push(`${articlesWithoutSources} artigo(s) sem o campo sources`);
}
if (articlesWithEmptySources > 0) {
  errors.push(`${articlesWithEmptySources} artigo(s) com o array sources vazio`);
}

// Exit with error code if there are errors
if (errors.length > 0) {
  console.error('\nERROR: Articles cannot be considered publication-ready without sources.');
  process.exit(1);
} else {
  console.log('✅ All articles have sources field.');
  process.exit(0);
}
