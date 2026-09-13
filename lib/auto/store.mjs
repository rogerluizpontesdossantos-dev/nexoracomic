// store.mjs — acesso ao acervo e estado (ESM puro, sem imports TS de tipos)
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, renameSync, readdirSync, unlinkSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const vm = require('node:vm');

// Raiz do projeto resolvida a partir do diretório real deste módulo (lib/auto),
// com fallback para process.cwd(). Isso garante que o pipeline encontre os
// arquivos críticos mesmo quando executado pelo Task Scheduler sem CWD definido.
const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = path.resolve(path.join(MODULE_DIR, '..', '..')) || path.resolve(process.cwd());
export const ARTICLES_FILE = path.join(PROJECT_ROOT, 'lib', 'articles.ts');
export const AUTO_BEGIN = '// [AUTO:BEGIN] Artigos gerados pela automação do Radar GTA 6 (não editar manualmente dentro desta região).';
export const AUTO_END = '// [AUTO:END]';
export const AUTO_REGION = '\n  // ' + AUTO_BEGIN + '\n  //   (nenhum artigo automático publicado ainda)\n  // ' + AUTO_END + '\n\n';

export function getArticles() {
  return readAndParseArticles();
}

function readAndParseArticles() {
  const text = readFileSync(ARTICLES_FILE, 'utf8');
  const startIdx = text.indexOf('export const DEMONSTRATION_ARTICLES');
  if (startIdx < 0) throw new Error('DEMONSTRATION_ARTICLES não encontrado em lib/articles.ts');
  const assignIdx = text.indexOf('=', startIdx);
  if (assignIdx < 0) throw new Error('Atribuição de DEMONSTRATION_ARTICLES não encontrada');
  const bracketStart = text.indexOf('[', assignIdx);
  if (bracketStart < 0) throw new Error('Array de artigos não encontrado');
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
    if (inStr) {
      if (ch === '\\') { i++; continue; }
      if (ch === strCh) inStr = false;
      continue;
    }
    if (ch === '/' && next === '/') { inLineComment = true; i++; continue; }
    if (ch === '/' && next === '*') { inBlockComment = true; i++; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = true; strCh = ch; continue; }
    if (ch === '[') depth++;
    else if (ch === ']') { depth--; if (depth === 0) { endIdx = i; break; } }
  }
  if (endIdx < 0) throw new Error('Fechamento do array de artigos não encontrado');
  const arrText = text.slice(bracketStart, endIdx + 1);
  const ctx = vm.createContext({});
  const fn = new vm.Script('(' + arrText + ')');
  const result = fn.runInContext(ctx);
  if (!Array.isArray(result)) throw new Error('Acervo avaliado não é um array');
  return result;
}

export function ensureAutoRegion() {
  let text;
  try { text = readFileSync(ARTICLES_FILE, 'utf8'); } catch { return { ok: false, error: 'lib/articles.ts não encontrado' }; }
  if (text.includes(AUTO_BEGIN)) return { ok: true };
  const idx = text.lastIndexOf('];');
  if (idx < 0) return { ok: false, error: 'Fechamento do array não encontrado em lib/articles.ts' };
  writeFileSync(ARTICLES_FILE, text.slice(0, idx) + AUTO_REGION + text.slice(idx), 'utf8');
  return { ok: true };
}

// ── Estado persistente (.automation/state.json) ─────────────────────────────

export function loadState() {
  try {
    const raw = readFileSync(path.join(PROJECT_ROOT, '.automation', 'state.json'), 'utf8');
    const parsed = JSON.parse(raw);
    return { ...parsed, publishedPautaHashes: Array.isArray(parsed.publishedPautaHashes) ? parsed.publishedPautaHashes : [] };
  } catch { return { publishedPautaHashes: [] }; }
}

export function saveState(state) {
  const dir = path.join(PROJECT_ROOT, '.automation');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'state.json'), JSON.stringify(state, null, 2) + '\n', 'utf8');
}

export function findAutoRegion(text) {
  const begin = text.indexOf(AUTO_BEGIN);
  if (begin < 0) return null;
  const end = text.indexOf(AUTO_END, begin);
  if (end < 0) return null;
  return { begin, end: end + AUTO_END.length };
}
// ── PROTEÇÃO do lib/articles.ts (FASE 2/13/14/35) ───────────────────────────

export const BACKUP_ROOT = path.join(PROJECT_ROOT, '.automation', 'backups');

function stamp() {
  const d = new Date(), p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + '-' + p(d.getHours()) + '-' + p(d.getMinutes()) + '-' + p(d.getSeconds());
}

function ensureDir(dir) { if (!existsSync(dir)) mkdirSync(dir, { recursive: true }); }

/**
 * Extrai e avalia o array de artigos a partir de um TEXTO arbitrário.
 * Permite validar uma VERSÃO CANDIDATA antes de escrever em disco.
 */
export function extractArticlesArray(text) {
  if (!text) throw new Error('texto vazio');
  const startIdx = text.indexOf('export const DEMONSTRATION_ARTICLES');
  if (startIdx < 0) throw new Error('DEMONSTRATION_ARTICLES não encontrado');
  const assignIdx = text.indexOf('=', startIdx);
  if (assignIdx < 0) throw new Error('Atribuição não encontrada');
  const bracketStart = text.indexOf('[', assignIdx);
  if (bracketStart < 0) throw new Error('Array não encontrado');
  let depth = 0, inStr = false, strCh = '', inTemplate = false, inExpr = 0, inLineComment = false, inBlockComment = false, endIdx = -1;
  for (let i = bracketStart; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
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
  if (endIdx < 0) throw new Error('Fechamento do array não encontrado');
  const arrText = text.slice(bracketStart, endIdx + 1);
  const ctx = vm.createContext({});
  const result = new vm.Script('(' + arrText + ')').runInContext(ctx);
  if (!Array.isArray(result)) throw new Error('Acervo avaliado não é array');
  return result;
}

// Backup timestampado; mantém os últimos `keep` backups do mesmo arquivo.
export function backupFile(target = ARTICLES_FILE, keep = 12) {
  ensureDir(BACKUP_ROOT);
  const base = path.basename(target);
  const name = base.replace(/\.[^.]+$/, '') + '-' + stamp() + path.extname(base);
  const dest = path.join(BACKUP_ROOT, name);
  copyFileSync(target, dest);
  const prefix = base.replace(/\.[^.]+$/, '') + '-';
  const files = readdirSync(BACKUP_ROOT)
    .filter((f) => f.startsWith(prefix) && f !== name)
    .map((f) => ({ f, t: statSync(path.join(BACKUP_ROOT, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  for (const too of files.slice(keep - 1)) { try { unlinkSync(path.join(BACKUP_ROOT, too.f)); } catch { /* ignore */ } }
  return { ok: true, backupPath: dest };
}

export function listBackups(prefix = 'articles-') {
  ensureDir(BACKUP_ROOT);
  return readdirSync(BACKUP_ROOT).filter((f) => f.startsWith(prefix)).sort();
}

export function restoreFile(backupPath, target = ARTICLES_FILE) {
  if (!backupPath || !existsSync(backupPath)) throw new Error('backup inexistente: ' + backupPath);
  copyFileSync(backupPath, target);
  return extractArticlesArray(readFileSync(target, 'utf8'));
}

/**
 * Escrita TRANSACIONAL do arquivo alvo (padrão lib/articles.ts).
 * VALIDA o candidato em memória → grava em temp → rename atômico →
 * revalida PÓS-escrita → em qualquer falha restaura o backup.
 */
export function writeArticlesTransactional(newText, opts = {}) {
  const target = opts.target || ARTICLES_FILE;
  let backupPath = null;
  if (existsSync(target)) {
    backupPath = backupFile(target, opts.keep).backupPath;
  }
  let parsed;
  try {
    parsed = extractArticlesArray(newText);
  } catch (e) {
    throw new Error('writeArticlesTransactional: candidato inválido (parse) — NÃO escrito. ' + e.message);
  }
  if (!Array.isArray(parsed)) throw new Error('writeArticlesTransactional: candidato não é array — NÃO escrito');
  ensureDir(path.dirname(target));
  const tmp = path.join(path.dirname(target), '.' + path.basename(target) + '.candidate-' + Date.now() + '.tmp');
  writeFileSync(tmp, newText, 'utf8');
  renameSync(tmp, target);
  try {
    const after = extractArticlesArray(readFileSync(target, 'utf8'));
    if (!Array.isArray(after)) throw new Error('pós-escrita não retornou array');
    return { ok: true, backupPath, count: parsed.length };
  } catch (e) {
    if (backupPath && existsSync(backupPath)) restoreFile(backupPath, target);
    throw new Error('writeArticlesTransactional: revalidação pós-escrita falhou — backup restaurado. ' + e.message);
  }
}
// __END__