// auto-run.mjs — execução REAL do pipeline (dryRun:false).
// Principio: VALIDAR → PROTEGER → PUBLICAR → DEPLOY → VERIFICAR → REGISTRAR.
// 1. Gera artigo apenas se houver pauta nova e relevante (senão NO_NEW_ARTICLE).
// 2. A inserção em lib/articles.ts passa por transação segura no pipeline.
// 3. tsc -> build -> commit(whitelist) -> push -> vercel --prod -> HTTP check.
// 4. Log estruturado em .automation/logs/run-*.json + estado de última execução.
import { runPipeline } from '../lib/auto/pipeline.mjs';
import { publishPendingDeploy, gitPendingUnpushed, checkProduction } from '../lib/auto/publisher.mjs';
import { PROJECT_ROOT, loadState, saveState } from '../lib/auto/store.mjs';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const LOG_DIR = path.join(PROJECT_ROOT, '.automation', 'logs');

function ensureLogDir() { if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true }); }

function saveLog(result) {
  ensureLogDir();
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const logFile = path.join(LOG_DIR, 'run-' + ts + '.json');
  writeFileSync(logFile, JSON.stringify(result, null, 2) + '\n', 'utf8');
  console.log('\n[log] Salvo em: ' + logFile);
  return logFile;
}

function section(title) {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  ' + title);
  console.log('  ' + new Date().toLocaleString('pt-BR'));
  console.log('═══════════════════════════════════════════════════════════\n');
}

function nextExpectedRun() {
  const now = new Date();
  const slots = [0, 4, 8, 12, 16, 20];
  let next = slots.find((h) => h > now.getHours());
  const d = new Date(now);
  if (next === undefined) { next = slots[0]; d.setDate(d.getDate() + 1); }
  d.setHours(next, 0, 0, 0);
  return d.toISOString();
}

function recordStatus(status, extra = {}) {
  try {
    const st = loadState();
    const nowIso = new Date().toISOString();
    saveState({
      ...st,
      status,
      last_run: nowIso,
      last_success: status === 'SUCCESS' ? nowIso : st.last_success,
      last_failure: /ERROR|FAILED|BLOCKED/.test(status) ? nowIso : st.last_failure,
      last_published_article: extra.articleSlug || st.last_published_article,
      last_error: extra.error || null,
      next_expected_run: nextExpectedRun(),
    });
  } catch (e) { console.log('[run] aviso: estado não gravado: ' + (e.message || e)); }
}
async function main() {
  section('NEXORACOMIC — RADAR AUTOMÁTICO (GTA 6 PRIORITÁRIO)');
  console.log('Modo: PUBLICAÇÃO (dryRun:false)');

  // Retomada segura de publicação pendente (commit/push/deploy) — nunca usa
  // artigo fictício nem valida URL falsa de artigo.
  if (gitPendingUnpushed()) {
    console.log('[run] Conteúdo pendente detectado. Retomando deploy de forma segura...');
    const resume = await publishPendingDeploy();
    if (!resume.success && resume.error) console.log('[run] ⚠ Retomada falhou: ' + resume.error);
    else console.log('[run] Retomada concluída ok.');
  }

  const started = new Date().toISOString();
  let result;
  try {
    result = await runPipeline({ dryRun: false });
  } catch (err) {
    result = { success: false, published: false, status: 'FAILED', error: String(err.message || err) };
    console.error('\n❌ ERRO CRÍTICO NO PIPELINE:', err.message);
  }
  const durationMs = Date.now() - new Date(started).getTime();

  // Status estruturado (FASE 31).
  let status = 'FAILED';
  if (result.status) { status = result.status; }
  else if (result.reason === 'no_feed_items' || result.reason === 'no_suitable_topic' || result.reason === 'NO_NEW_ARTICLE') { status = 'NO_NEW_ARTICLE'; }
  else if (result.reason === 'featured_image_invalid') { status = 'IMAGE_ERROR'; }
  else if (result.reason && /SOURCE/.test(result.reason)) { status = 'SOURCE_ERROR'; }
  else if (!result.published) { status = 'NO_NEW_ARTICLE'; }
  else { status = 'PUBLISHED'; }

  if (result.published) {
    console.log('\n───────────────────────────────────────────────────────────');
    console.log('RESULTADO DO PIPELINE:');
    console.log(JSON.stringify({ id: result.articleId, title: result.title, slug: result.slug, topic: result.topic }, null, 2));

    console.log('\n[publish] Fase de publicação segura (tsc -> build -> commit -> push -> vercel -> HTTP)...');
    let combined;
    try {
      const pub = await publishPendingDeploy();
      combined = { ...result, publish: pub };
      status = pub.success ? 'SUCCESS' : (pub.deployed ? 'HEALTHCHECK_ERROR' : 'DEPLOY_ERROR');
    } catch (err) {
      combined = { ...result, publish: { ok: false, error: String(err.message || err) } };
      status = 'DEPLOY_ERROR';
    }

    // FASE 25/28 — health check de produção (homepage, categoria e artigo).
    if (status === 'SUCCESS' || status === 'PUBLISHED') {
      const routes = ['/', '/games', '/games/' + result.slug];
      const hc = await checkProduction(routes);
      combined.productionCheck = hc;
      status = hc.ok ? 'SUCCESS' : 'HEALTHCHECK_ERROR';
    }

    recordStatus(status, { articleSlug: result.slug, error: (combined.publish && combined.publish.error) || null });
    combined.status = status;
    combined.durationMs = durationMs;
    const logFile = saveLog(combined);
    console.log('\n' + status + ' — log: ' + logFile);
    console.log('═══════════════════════════════════════════════════════════');
    process.exit(status === 'SUCCESS' ? 0 : 1);
  } else {
    recordStatus(status, { articleSlug: result.slug, error: result.error || null });
    const payload = { ...result, status, durationMs };
    const logFile = saveLog(payload);
    console.log('\n───────────────────────────────────────────────────────────');
    console.log('RESULTADO: ' + status + ' — nenhum artigo publicado.');
    console.log('Motivo: ' + (result.reason || result.error || 'desconhecido'));
    console.log('Log: ' + logFile);
    console.log('═══════════════════════════════════════════════════════════');
    process.exit(status === 'FAILED' || status === 'IMAGE_ERROR' ? 1 : 0);
  }
}

main().catch((err) => {
  console.error('\n❌ ERRO CRÍTICO:', err.message);
  try { saveLog({ success: false, status: 'FAILED', error: err.message, stack: err.stack }); } catch { /* ignore */ }
  process.exit(1);
});