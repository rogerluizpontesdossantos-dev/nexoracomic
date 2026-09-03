// auto-dry-run.mjs — execução DRY-RUN do pipeline GTA 6
// Busca notícias, seleciona pauta, mostra artigo — sem publicar
import { runPipeline } from '../lib/auto/pipeline.mjs';

console.log('═══════════════════════════════════════════════════════════');
console.log('  NEXORACOMIC — RADAR GTA 6 (DRY-RUN)');
console.log('  ' + new Date().toLocaleString('pt-BR'));
console.log('═══════════════════════════════════════════════════════════\n');

try {
  const result = await runPipeline({ dryRun: true });
  console.log('\n───────────────────────────────────────────────────────────');
  console.log('RESULTADO:');
  console.log(JSON.stringify(result, null, 2));
  if (result.dryRun && result.wouldPublish) {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  ARTIGO QUE SERIA PUBLICADO:');
    console.log('  ID: ' + result.wouldPublish.id);
    console.log('  Título: ' + result.wouldPublish.title);
    console.log('  Slug: ' + result.wouldPublish.slug);
    console.log('  Categoria: ' + result.wouldPublish.category);
    console.log('  Tags: ' + result.wouldPublish.tags.join(', '));
    console.log('  Classificação: ' + result.wouldPublish.classification);
    console.log('  Fonte: ' + result.wouldPublish.pauta.source);
    console.log('  URL fonte: ' + result.wouldPublish.pauta.url);
    if (result.wouldPublish.duplicate) {
      console.log('  ⚠ Duplicata: ' + result.wouldPublish.duplicate.reason);
    }
    console.log('═══════════════════════════════════════════════════════════');
  }
  process.exit(result.success ? 0 : 1);
} catch (err) {
  console.error('\n❌ ERRO:', err.message);
  console.error(err.stack);
  process.exit(1);
}