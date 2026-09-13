// _task60_rss_helpers.mjs — helper COMPARTILHADO (generate-rss.mjs + _task60_rss_test.mjs).
// Extrai consts do lib/types.ts via regex. Este arquivo vive em scripts/, entao '..' = raiz.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function extractConst(name) {
  const text = readFileSync(path.join(ROOT, 'lib', 'types.ts'), 'utf8');
  const m = new RegExp('export const ' + name + ' = [\'"]([^\'"]+)[\'"]').exec(text);
  if (!m) throw new Error('const "' + name + '" nao encontrado em lib/types.ts');
  return m[1];
}
