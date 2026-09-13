// _task54_audit.mjs — Auditoría completa del catálogo NexoraComic (TASK 54)
// - Lee lib/articles.ts actual
// - Lee el backup de TASK 52 (141 artículos)
// - Calcula total, ids únicos, ids duplicados, ids ausentes, slugs, categorías
// - Mapea los duplicados 134-140 con todos sus datos
// - Cruza con el backup para identificar los 7 artículos nuevos (origen de la duplicación)
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const vm = require('node:vm');

const ROOT = 'C:/Users/dizzritimia/CascadeProjects/nexoracomic';
const CUR = ROOT + '/lib/articles.ts';
const BACKUP = ROOT + '/backups/catalogo-141-artigos/articles.ts';

// ── Parser robusto (tokenizador string-aware, igual que store.mjs) ─────────
function extractArticlesArray(text) {
  const startIdx = text.indexOf('DEMONSTRATION_ARTICLES');
  if (startIdx < 0) throw new Error('DEMONSTRATION_ARTICLES no encontrado');
  const assignIdx = text.indexOf('=', startIdx);
  const bracketStart = text.indexOf('[', assignIdx);
  let depth = 0, inStr = false, strCh = '', inTemplate = false, inExpr = 0, inLineComment = false, inBlockComment = false, endIdx = -1;
  for (let i = bracketStart; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inLineComment) { if (ch === '\n') inLineComment = false; continue; }
    if (inBlockComment) { if (ch === '*' && next === '/') { inBlockComment = false; i++; } continue; }
    if (inTemplate) {
      if (inExpr > 0) { if (ch === '{') inExpr++; else if (ch === '}') inExpr--; }
      else { if (ch === '`') inTemplate = false; else if (ch === '$' && next === '{') inExpr = 1; }
      continue;
    }
    if (inStr) { if (ch === '\\') { i++; continue; } if (ch === strCh) inStr = false; continue; }
    if (ch === '/' && next === '/') { inLineComment = true; i++; continue; }
    if (ch === '/' && next === '*') { inBlockComment = true; i++; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = true; strCh = ch; continue; }
    if (ch === '[') depth++;
    else if (ch === ']') { depth--; if (depth === 0) { endIdx = i; break; } }
  }
  if (endIdx < 0) throw new Error('Cierre del array no encontrado');
  const arrText = text.slice(bracketStart, endIdx + 1);
  const ctx = vm.createContext({});
  return new vm.Script('(' + arrText + ')').runInContext(ctx);
}

function load(file) {
  const arr = extractArticlesArray(readFileSync(file, 'utf8'));
  return arr.map((a, i) => ({
    idx: i,
    id: String(a.id),
    slug: a.slug,
    title: a.title,
    category: a.category && a.category.slug,
    hasMeta: !!a.metadata || !!a.seo || !!a.meta,
    hasSources: Array.isArray(a.sources) && a.sources.length > 0,
    sourcesCount: Array.isArray(a.sources) ? a.sources.length : 0,
    publishedAt: a.publishedAt,
    image: a.featuredImage,
  }));
}

const cur = load(CUR);
const backup = load(BACKUP);
const curIds = cur.map(a => a.id);
const counts = {};
for (const id of curIds) counts[id] = (counts[id] || 0) + 1;
const dupIds = Object.keys(counts).filter(id => counts[id] > 1).sort((a, b) => parseInt(a,10) - parseInt(b,10));

const numeric = curIds.map(Number).sort((a,b)=>a-b);
const maxId = numeric.length ? numeric[numeric.length-1] : 0;
const present = new Set(curIds.map(String));
const missing = [];
for (let n = 1; n <= maxId; n++) if (!present.has(String(n))) missing.push(n);

const slugCounts = {};
for (const a of cur) slugCounts[a.slug] = (slugCounts[a.slug] || 0) + 1;
const dupSlugs = Object.keys(slugCounts).filter(s => slugCounts[s] > 1);

const catCounts = {};
for (const a of cur) catCounts[a.category] = (catCounts[a.category] || 0) + 1;

// Artículos nuevos = presentes en 'cur' pero ausentes en 'backup' (mismo id+slug+title)
const curSet = cur.map(a => a.id + '|' + a.slug + '|' + a.title);
const backupSet = new Set(backup.map(a => a.id + '|' + a.slug + '|' + a.title));
const newArticles = cur.filter(a => !backupSet.has(a.id + '|' + a.slug + '|' + a.title));

const report = {
  fecha: new Date().toISOString(),
  total: cur.length,
  backupTotal: backup.length,
  idsUnicos: new Set(curIds).size,
  idsDuplicados: dupIds.length,
  idsDuplicadosLista: dupIds,
  idsAusentes: missing,
  maxId,
  slugsDuplicados: dupSlugs,
  categorias: catCounts,
  leyendaNuevos: 'Artículos presentes hoy pero ausentes del backup TASK52 (141) => candidatos a ser los 7 insertados en TASK53',
  nuevosEnCurrent: newArticles.map(a => ({
    idx: a.idx, id: a.id, slug: a.slug, title: a.title, category: a.category,
  })),
  duplicadosDetalle: dupIds.map(id => ({
    id,
    articulos: cur.map((a, i) => ({ idx: a.idx, id: a.id, slug: a.slug, title: a.title, category: a.category, hasMeta: a.hasMeta, sources: a.hasSources ? a.sourcesCount : 0, publishedAt: a.publishedAt, image: a.image ? 'SÍ' : 'no' })).filter(a => a.id === id),
  })),
};

import { writeFileSync } from 'node:fs';
writeFileSync(ROOT + '/scripts/_task54_audit.json', JSON.stringify(report, null, 2));
console.log('TOTAL actual:', cur.length, '| backup:', backup.length);
console.log('IDs únicos:', report.idsUnicos, '| duplicados:', dupIds.length, dupIds);
console.log('IDs ausentes:', missing, '| maxId:', maxId);
console.log('Slugs duplicados:', dupSlugs);
console.log('Nuevos en current (ausentes en backup TASK52):', newArticles.length);
for (const a of newArticles) console.log('   nuevo -> idx', a.idx, 'id', a.id, '|', a.slug, '|', a.category);
console.log('Reporte: scripts/_task54_audit.json');