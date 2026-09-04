// auto-run.mjs — execução REAL do pipeline (dryRun:false).
// 1. Gera artigo (pauta real, imagem validada, crédito, articles.ts, state)
// 2. Valida (imagem HTTP 200 + content-type image/*)
// 3. Se publicado: tsc -> build -> commit seletivo -> push -> vercel --prod -> HTTP check
// 4. Log unificado em .automation/logs/run-*.json
// 5. Idempotente: se não houver pauta nova, encerra sem alterar nada
import { runPipeline } from '../lib/auto/pipeline.mjs';
import { publishArticle, gitPendingUnpushed, gitStatusShort } from '../lib/auto/publisher.mjs';
import { PROJECT_ROOT } from '../lib/auto/store.mjs';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const LOG_DIR = path.join(PROJECT_ROOT, '.automation', 'logs');

function ensureLogDir() {
  if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });
}
function saveLog(result) {
  ensureLogDir();
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const logFile = path.join(LOG_DIR, 'run-' + ts + '.json');
  writeFileSync(logFile, JSON.stringify(result, null, 2) + '\n', 'utf8');
  console.log('\n[log] Salvo em: ' + logFile);
}

function section(title) {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  ' + title);
  console.log('  ' + new Date().toLocaleString('pt-BR'));
  console.log('═══════════════════════════════════════════════════════════\n');
}

try {
  section('NEXORACOMIC — RADAR AUTOMÁTICO (GTA 6 / Minecraft / Terraria)');
  console.log('Modo: PUBLICAÇÃO (dryRun:false)');

  // Se já houver alterações não commitadas da automação de uma execução
  // anterior interrompida, tenta concluir o ciclo de publicação antes de
  // gerar um novo artigo — evita duplicatas.
  if (gitPendingUnpushed()) {
    console.log('[run] Detectado conteúdo pendente de publicação anterior.');
    console.log('[run] Tentando concluir deploy da publicação pendente...');
    const resume = await publishArticle({ id: 'resume', slug: 'resume', category: { slug: 'games' }, featuredImage: 'https://nexoracomic.vercel.app/_next/static/media/placeholder.png' }, { dryRun: false });
    // O resume apenas garante push+deploy do que já está staged/committed.
  }

  const result = await runPipeline({ dryRun: false });

  if (result.published && result.slug) {
    console.log('\n───────────────────────────────────────────────────────────');
    console.log('RESULTADO DO PIPELINE:');
    console.log(JSON.stringify({ ...result, log: undefined }, null, 2));

    // FASE DE PUBLICAÇÃO AUTOMÁTICA (commit -> push -> deploy -> HTTP)
    const article = {
      id: result.articleId,
      slug: result.slug,
      category: { slug: 'games' },
      featuredImage: result.featuredImage || '',
      title: result.title,
    };
    console.log('\n[publish] Iniciando fase de publicação (tsc -> build -> commit -> push -> vercel --prod -> HTTP)...');
    const pub = await publishArticle(article, { dryRun: false });

    const combined = {
      ...result,
      publish: {
        ok: pub.success,
        deployed: pub.deployed,
        url: pub.url,
        error: pub.error || null,
        log: pub.log,
      },
    };
    saveLog(combined);

    if (pub.success) {
      console.log('\n✅ PUBLICAÇÃO CONCLUÍDA COM SUCESSO:');
      console.log('  URL: ' + pub.url);
      console.log('  SHA local: ' + gitStatusShort().length + ' itens pendentes (verifique)');
    } else if (pub.error) {
      console.log('\n⚠ PUBLICAÇÃO PARCIAL/ERRO: ' + pub.error);
      console.log('  O artigo foi gerado e inserido em lib/articles.ts.');
      console.log('  A publicação automática falhou nesta etapa.');
      console.log('  Corrija e execute "npm run publish" para retomar.');
    }
    console.log('═══════════════════════════════════════════════════════════');
    process.exit(pub.success ? 0 : (result.success ? 0 : 1));
  } else {
    saveLog(result);
    console.log('\n───────────────────────────────────────────────────────────');
    console.log('RESULTADO: ' + (result.success ? 'processo OK' : 'ERRO'));
    if (!result.published) {
      console.log('ℹ Nenhum artigo publicado. Motivo: ' + (result.reason || 'desconhecido'));
    }
    console.log('═══════════════════════════════════════════════════════════');
    process.exit(result.success ? 0 : 1);
  }
} catch (err) {
  console.error('\n❌ ERRO CRÍTICO:', err.message);
  console.error(err.stack);
  try {
    saveLog({ success: false, error: err.message, stack: err.stack });
  } catch { /* falha ao salvar log */ }
  process.exit(1);
}
