// auto-run.mjs — execução REAL do pipeline GTA 6
// Busca notícias, seleciona pauta, gera artigo, insere no acervo
import { runPipeline } from '../lib/auto/pipeline.mjs';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = process.cwd();
const LOG_DIR = path.join(PROJECT_ROOT, '.automation', 'logs');

function ensureLogDir() {
  if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });
}

function saveLog(result) {
  ensureLogDir();
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const logFile = path.join(LOG_DIR, `run-${ts}.json`);
  writeFileSync(logFile, JSON.stringify(result, null, 2) + '\n', 'utf8');
  console.log('\n[log] Salvo em: ' + logFile);
}

console.log('═══════════════════════════════════════════════════════════');
console.log('  NEXORACOMIC — RADAR GTA 6 (EXECUÇÃO REAL)');
console.log('  ' + new Date().toLocaleString('pt-BR'));
console.log('═══════════════════════════════════════════════════════════\n');

try {
  const result = await runPipeline({ dryRun: false });
  saveLog(result);
  console.log('\n───────────────────────────────────────────────────────────');
  console.log('RESULTADO:');
  console.log(JSON.stringify(result, null, 2));
  if (result.published) {
    console.log('\n✅ ARTIGO PUBLICADO:');
    console.log('  ID: ' + result.articleId);
    console.log('  Título: ' + result.title);
    console.log('  Slug: ' + result.slug);
    console.log('  Fonte: ' + result.source);
    console.log('  URL: /games/' + result.slug);
  } else {
    console.log('\nℹ Nenhum artigo publicado. Motivo: ' + result.reason);
  }
  console.log('═══════════════════════════════════════════════════════════');
  process.exit(result.success ? 0 : 1);
} catch (err) {
  console.error('\n❌ ERRO:', err.message);
  console.error(err.stack);
  try {
    saveLog({ success: false, error: err.message, stack: err.stack });
  } catch { /* falha ao salvar log */ }
  process.exit(1);
}