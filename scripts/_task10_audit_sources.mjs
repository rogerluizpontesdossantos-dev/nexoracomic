#!/usr/bin/env node
/**
 * Task 10 — FASE 1: Auditoria de fontes.
 * Classifica cada fonte com base em heurísticas determinísticas:
 *   valid_specific | valid_generic | invalid | future | unreachable | needs_replacement
 * Gera scripts/_task10_sources_audit.json
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const extracted = JSON.parse(readFileSync(join(__dirname, '_task10_extracted.json'), 'utf-8'));

function classify(url, { hasQuery = false } = {}) {
  let u;
  try { u = new URL(url); } catch { return { status: 'invalid', reason: 'URL não é uma URL válida' }; }

  const path = u.pathname;
  const host = u.hostname.toLowerCase();

  // Future-dated
  if (/202[6-9]|203\d/.test(url)) {
    // allow specific news dates if they look like real article slugs (y/m/d)
    const dateish = url.match(/\/(20\d\d)\/(\d\d)\/(\d\d)\//);
    if (!dateish) {
      // heuristic: "2026"/"2027" in a path without a date structure = suspicious future-dated
      if (/202[6-9]/.test(url) && !/\/(20\d\d)\/(\d\d)\/(\d\d)\//.test(url)) {
        return { status: 'future', reason: 'URL contém data futura/indefinida' };
      }
    }
  }

  // Homepage / root
  if (path === '' || path === '/') {
    return { status: 'needs_replacement', reason: 'Homepage genérica (URL raiz), sem página específica' };
  }

  // Generic subject/category/tag pages
  if (/\/subjects\//.test(path)) {
    return { status: 'valid_generic', reason: 'Página de tópico genérico (subjects) em vez de página específica' };
  }
  if (/\/category\//.test(path) || /\/tag\//.test(path)) {
    return { status: 'valid_generic', reason: 'Página de categoria/tag genérica' };
  }
  if (/\/news$/.test(path) || /\/news\/?$/.test(path) || /\/news\//.test(path)) {
    return { status: 'valid_generic', reason: 'Página de notícias genérica' };
  }
  if (/\/comics$/.test(path) || /\/blog$/.test(path) || /\/tudum$/.test(path)) {
    return { status: 'valid_generic', reason: 'Página institucional/curadoria genérica' };
  }

  // List/collection pages with only 1-2 segments are often generic
  const segs = path.split('/').filter(Boolean);
  if (segs.length <= 1) {
    return { status: 'valid_generic', reason: 'URL curta possivelmente genérica' };
  }

  // Tools/product docs from major vendors are usually specific enough
  return { status: 'valid_specific', reason: 'URL parece específica (aprova heurística estrutural — requer verificação real)' };
}

const audit = [];
const counts = {};

for (const art of extracted) {
  for (const s of art.sources) {
    const c = classify(s.url);
    const entry = {
      articleId: art.articleId,
      articleTitle: art.articleTitle,
      articleSlug: art.slug,
      category: art.category,
      sourceTitle: s.title,
      url: s.url,
      type: s.type || 'other',
      status: c.status,
      reason: c.reason,
    };
    counts[c.status] = (counts[c.status] || 0) + 1;
    audit.push(entry);
  }
}

writeFileSync(join(__dirname, '_task10_sources_audit.json'), JSON.stringify(audit, null, 2));

console.log('=== Auditoria Task 10 (FASE 1) ===');
console.log(`Total de fontes auditadas: ${audit.length}`);
console.log('Classificação:');
console.log(counts);
console.log('\nObs.: heurística estrutural; URLs marcadas valid_specific ainda exigem verificação real na web.');