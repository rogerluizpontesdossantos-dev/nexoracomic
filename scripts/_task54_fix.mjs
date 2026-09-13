// _task54_fix.mjs — TASK 54: corrige IDs duplicados (134–140) en lib/articles.ts
// Reasigna a los 7 artículos NUEVOS (agregados en TASK 53, publishedAt 2026-09-13,
// ausentes del backup TASK52 de 141) los IDs únicos 142–148.
// NO toca títulos, slugs, categorías, fuentes, fechas ni imágenes.
// Usa el sistema de backup/transaccional existente (lib/auto/store.mjs).
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const vm = require('node:vm');
import { getArticles, backupFile, ARTICLES_FILE, writeArticlesTransactional, PROJECT_ROOT } from '../lib/auto/store.mjs';
import path from 'node:path';

const ROOT = PROJECT_ROOT;
const REPORT_DIR = path.join(ROOT, 'scripts');
const BACKUP_SNAP = path.join(ROOT, 'backups');

// ── Parser local de verificación (independiente, coherente con el audit) ──
function extractArray(text) {
  const startIdx = text.indexOf('DEMONSTRATION_ARTICLES');
  const assignIdx = text.indexOf('=', startIdx);
  const bracketStart = text.indexOf('[', assignIdx);
  let depth = 0, inStr = false, strCh = '', inTemplate = false, inExpr = 0, ilc = false, ibc = false, endIdx = -1;
  for (let i = bracketStart; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
    if (ilc) { if (ch === '\n') ilc = false; continue; }
    if (ibc) { if (ch === '*' && next === '/') { ibc = false; i++; } continue; }
    if (inTemplate) { if (inExpr > 0) { if (ch === '{') inExpr++; else if (ch === '}') inExpr--; } else { if (ch === '`') inTemplate = false; else if (ch === '$' && next === '{') inExpr = 1; } continue; }
    if (inStr) { if (ch === '\\') { i++; continue; } if (ch === strCh) inStr = false; continue; }
    if (ch === '/' && next === '/') { ilc = true; i++; continue; }
    if (ch === '/' && next === '*') { ibc = true; i++; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = true; strCh = ch; continue; }
    if (ch === '[') depth++;
    else if (ch === ']') { depth--; if (depth === 0) { endIdx = i; break; } }
  }
  return new vm.Script('(' + text.slice(bracketStart, endIdx + 1) + ')').runInContext(vm.createContext({}));
}

const sha256 = (s) => createHash('sha256').update(s).digest('hex');

function analyze(arr) {
  const ids = arr.map(a => String(a.id));
  const counts = {};
  for (const i of ids) counts[i] = (counts[i] || 0) + 1;
  const dups = Object.keys(counts).filter(id => counts[id] > 1).sort((a,b)=>parseInt(a,10)-parseInt(b,10));
  const nums = ids.map(Number);
  const maxId = nums.length ? Math.max(...nums) : 0;
  const present = new Set(ids);
  const missing = [];
  for (let n = 1; n <= maxId; n++) if (!present.has(String(n))) missing.push(n);
  const sCounts = {};
  for (const a of arr) sCounts[a.slug] = (sCounts[a.slug] || 0) + 1;
  const dupSlugs = Object.keys(sCounts).filter(s => sCounts[s] > 1);
  return { total: arr.length, unicos: new Set(ids).size, dups, dupSlugs, missing, maxId };
}

// Slugs de los 7 artículos nuevos → nuevo ID único
const REMAP = [
  { from: '134', to: '142', slug: 'google-willow-chip-quantum-error-correction-breakthrough' },
  { from: '135', to: '143', slug: 'roman-space-telescope-construction-complete' },
  { from: '136', to: '144', slug: 'biotwang-sound-mystery-solved-whale' },
  { from: '137', to: '145', slug: 'greenland-landslide-nine-day-earthquake' },
  { from: '138', to: '146', slug: 'squirting-cucumber-explosive-seed-dispersal' },
  { from: '139', to: '147', slug: 'polvo-caca-com-peixe-socos-cooperacao' },
  { from: '140', to: '148', slug: 'alfabeto-mais-antigo-descoberto-siria' },
];

const now = new Date().toISOString();
const originalText = readFileSync(ARTICLES_FILE, 'utf8');
const beforeHash = sha256(originalText);
const beforeArr = extractArray(originalText);
const before = analyze(beforeArr);

// ── PHASE 1: backup com o sistema existente + snapshot de hashes/estado ──
const backupRes = backupFile(ARTICLES_FILE);
const backupSnapPath = path.join(BACKUP_SNAP, 'hashes_task54.txt');
const preservation = {
  fecha: now,
  backup: backupRes,
  antes: {
    total: before.total, idsUnicos: before.unicos, dups: before.dups, idsAusentes: before.missing, maxId: before.maxId,
    hash: beforeHash,
    ids: beforeArr.map(a => a.id),
    slugs: beforeArr.map(a => a.slug),
  },
  remap: REMAP.map(r => ({ de: r.from, a: r.to, slug: r.slug })),
};
writeFileSync(path.join(REPORT_DIR, '_task54_preservation.json'), JSON.stringify(preservation, null, 2));

console.log('[FASE 1] Backup creado: ' + backupRes.backupPath);
console.log('[FASE 1] Estado antes -> total:', before.total, '| únicos:', before.unicos, '| dups:', before.dups, '| ausentes:', before.missing, '| max:', before.maxId);
console.log('[FASE 1] sha256 original:', beforeHash);

// ── Verificación previa: los 7 son realmente duplicados y los nuevos ids libres ──
for (const r of REMAP) {
  const countOld = (beforeArr.filter(a => String(a.id) === r.from)).length;
  if (countOld !== 2) throw new Error('Esperaba 2 artículos con id ' + r.from + ', encontré ' + countOld);
  if (beforeArr.some(a => String(a.id) === r.to)) throw new Error('El id objetivo ' + r.to + ' ya existe (colisión)');
}

// ── PHASE 3-6: aplicar remapeo (par id+slug es único en el archivo) ──
// El archivo usa CRLF; detectamos el terminador de línea real y lo respetamos.
const EOL = originalText.includes('\r\n') ? '\r\n' : '\n';
let newText = originalText;
const appliedLog = [];
for (const r of REMAP) {
  const oldPair = "    id: '" + r.from + "'," + EOL + "    slug: '" + r.slug + "',";
  const newPair = "    id: '" + r.to + "'," + EOL + "    slug: '" + r.slug + "',";
  const occ = newText.split(oldPair).length - 1;
  if (occ !== 1) throw new Error('Par id/slug no único (o ausente) para ' + r.slug + ': ocurrencias=' + occ);
  newText = newText.replace(oldPair, newPair);
  appliedLog.push({ slug: r.slug, de: r.from, a: r.to });
}

const fixedBeforeWrite = analyze(extractArray(newText));
console.log('[FASE 3-6] Corregido en memoria -> total:', fixedBeforeWrite.total, '| únicos:', fixedBeforeWrite.unicos, '| dups:', fixedBeforeWrite.dups, '| ausentes:', fixedBeforeWrite.missing, '| max:', fixedBeforeWrite.maxId);

// ── Escritura transaccional (backup + validate + rename + revalidate + rollback) ──
const res = writeArticlesTransactional(newText, { keep: 12 });
const afterArr = getArticles();
const after = analyze(afterArr);
const afterHash = sha256(readFileSync(ARTICLES_FILE, 'utf8'));

const ok = after.total === 148 && after.unicos === 148 && after.dups.length === 0 &&
  after.missing.length === 0 && after.dupSlugs.length === 0 && after.maxId === 148;

const finalReport = {
  fecha: now, ok, backup: backupRes, aplicados: appliedLog,
  despues: { total: after.total, idsUnicos: after.unicos, dups: after.dups, idsAusentes: after.missing, dupSlugs: after.dupSlugs, maxId: after.maxId, hash: afterHash },
  estadoAnterior: preservation.antes,
};
writeFileSync(path.join(REPORT_DIR, '_task54_final.json'), JSON.stringify(finalReport, null, 2));

writeFileSync(backupSnapPath,
  'TASK54 — correção de IDs (original → corrigido)\n' +
  'fecha: ' + now + '\n' +
  'sha256_original:  ' + beforeHash + '\n' +
  'sha256_corregido: ' + afterHash + '\n' +
  'total: ' + after.total + ' | únicos: ' + after.unicos + ' | max: ' + after.maxId + '\n',
  'utf8');

console.log('[FASE 7] Escritura transaccional OK (count=' + res.count + ')');
console.log('[FINAL] -> total:', after.total, '| únicos:', after.unicos, '| dups:', after.dups, '| ausentes:', after.missing, '| max:', after.maxId);
console.log('[FINAL] sha256 corregido:', afterHash);
console.log('[FINAL] ok:', ok);
console.log('Reportes: _task54_preservation.json, _task54_final.json, backups/hashes_task54.txt');