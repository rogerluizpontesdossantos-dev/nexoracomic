#!/usr/bin/env node
/**
 * scripts/validate-images.mjs — TASK 61-A (FASE 11)
 *
 * Verificação estática das capas de lib/articles.ts contra a política de imagens
 * (lib/content/image-policy.mjs). Bloqueia source.unsplash.com, URL vazia,
 * extensão/tipo inválido, HTTP em vez de HTTPS e larguras de thumbnail do
 * Wikimedia rejeitadas pelo MediaWiki.
 *
 * Uso: node scripts/validate-images.mjs          (estático, rápido)
 *      node scripts/validate-images.mjs --http   (também confere HTTP real)
 *
 * Isolado: não é chamado pelo Radar nem pelo pipeline de publicação.
 */
import { getArticles } from '../lib/auto/store.mjs';
import { validateArticles } from '../lib/content/image-policy.mjs';

const WITH_HTTP = process.argv.includes('--http');

async function checkHttp(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'NexoraComic/1.0 (validacao de capas)', Range: 'bytes=0-1023' },
      redirect: 'follow',
    });
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (res.status !== 200 && res.status !== 206) return 'HTTP ' + res.status;
    if (!ct.startsWith('image/')) return 'Content-Type não é imagem: ' + (ct || 'vazio');
    return null;
  } catch (err) {
    return String((err && err.message) || err);
  }
}

async function main() {
  const articles = getArticles();
  const report = validateArticles(articles);

  console.log('\n=== Validação de capas (política de imagens) ===\n');
  console.log('Artigos: ' + report.articles);
  console.log('Erros de política: ' + report.errors.length);
  console.log('Avisos: ' + report.warnings.length + '\n');

  for (const e of report.errors) console.error('❌ ' + e);
  for (const w of report.warnings) console.warn('⚠️  ' + w);

  let httpErrors = 0;
  if (WITH_HTTP) {
    console.log('\n--- Verificação HTTP real ---');
    for (const a of articles) {
      if (!a.featuredImage) continue;
      const problem = await checkHttp(a.featuredImage);
      if (problem) {
        httpErrors++;
        console.error('❌ artigo ' + a.id + ': ' + problem + ' → ' + a.featuredImage);
      }
    }
    console.log('Erros HTTP: ' + httpErrors);
  }

  if (!report.ok || httpErrors > 0) {
    console.error('\nERROR: existem capas inválidas segundo a política de imagens.');
    process.exit(1);
  }
  console.log('\n✅ Todas as capas passam na política de imagens' + (WITH_HTTP ? ' e na verificação HTTP.' : '.'));
}

main();
