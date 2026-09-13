// _task54_headcheck.mjs — inspecciona el estado commiteado (HEAD) de lib/articles.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const vm = require('node:vm');

const ROOT = 'C:/Users/dizzritimia/CascadeProjects/nexoracomic';
const TMP = ROOT + '/scripts/_task54_head_articles.ts';
execSync('git -C "' + ROOT + '" show HEAD:lib/articles.ts > "' + TMP + '"');

const text = readFileSync(TMP, 'utf8');
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
const arrText = text.slice(bracketStart, endIdx + 1);
const arr = new vm.Script('(' + arrText + ')').runInContext(vm.createContext({}));
const ids = arr.map(a => String(a.id));
const counts = {};
for (const i of ids) counts[i] = (counts[i] || 0) + 1;
const dups = Object.keys(counts).filter(id => counts[id] > 1);
console.log('HEAD total:', arr.length);
console.log('HEAD maxId:', Math.max(...ids.map(Number)));
console.log('HEAD dups:', dups);
console.log('HEAD tiene id 142:', ids.includes('142'));
console.log('HEAD slugs auto:', arr.filter(a => String(a.slug).includes('auto')).map(a => a.id + '|' + a.slug));