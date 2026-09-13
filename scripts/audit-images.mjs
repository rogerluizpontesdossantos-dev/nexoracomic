// scripts/audit-images.mjs — Auditoria reutilizável das featuredImage de TODOS os artigos.
// Uso:  node scripts/audit-images.mjs            (verifica todas as imagens)
//       node scripts/audit-images.mjs --json     (saída JSON completa)
// Reaproveita o parser de lib/auto/store.mjs (mesma lógica da automação).
import { getArticles } from '../lib/auto/store.mjs';

const TIMEOUT_MS = 15000;

function isHttpUrl(url) {
  return /^https?:\/\//i.test(url);
}

async function checkImage(url) {
  const result = { url, ok: false, status: null, contentType: null, contentLength: null, error: null };
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await checkImageOnce(url);
    if (r.status !== 429) return r;
    // Rate limit (ex.: Wikimedia) — aguarda e tenta de novo
    result.status = r.status;
    result.error = r.error;
    await new Promise((res) => setTimeout(res, 6000 * (attempt + 1)));
  }
  return result;
}

async function checkImageOnce(url) {
  const result = { url, ok: false, status: null, contentType: null, contentLength: null, error: null };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // 1) HEAD primeiro (barato); alguns hosts rejeitam HEAD → cai para GET parcial.
    let res = null;
    try {
      res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
    } catch {
      res = null;
    }
    if (!res || res.status === 405 || res.status === 403 || res.status === 501 || !res.headers) {
      const getCtrl = new AbortController();
      const getTimer = setTimeout(() => getCtrl.abort(), TIMEOUT_MS);
      try {
        res = await fetch(url, { method: 'GET', redirect: 'follow', signal: getCtrl.signal, headers: { Range: 'bytes=0-2047' } });
      } finally {
        clearTimeout(getTimer);
      }
    }
    result.status = res.status;
    result.contentType = res.headers.get('content-type');
    const cl = res.headers.get('content-length');
    result.contentLength = cl ? Number(cl) : null;
    if (res.status !== 200 && res.status !== 206) {
      result.error = 'HTTP ' + res.status;
      return result;
    }
    const ct = (result.contentType || '').toLowerCase();
    if (!ct.startsWith('image/')) {
      result.error = 'content-type não é imagem: ' + (ct || 'vazio');
      return result;
    }
    if (ct.includes('svg')) {
      result.warning = 'SVG — conferir se é adequado como capa';
    }
    result.ok = true;
    return result;
  } catch (err) {
    result.error = (err && err.name === 'AbortError') ? 'timeout/abort' : String((err && err.message) || err);
    return result;
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const articles = getArticles();
  const withImage = articles.filter((a) => a.featuredImage);
  const withoutImage = articles.filter((a) => !a.featuredImage);
  console.log('[audit] Total de artigos: ' + articles.length);
  console.log('[audit] Com featuredImage: ' + withImage.length);
  console.log('[audit] Sem featuredImage: ' + withoutImage.length);
  for (const a of withoutImage) {
    console.log('[audit] SEM IMAGEM -> id=' + a.id + ' slug=' + a.slug);
  }

  const results = [];
  const concurrency = 8;
  const queue = [...withImage];
  async function worker() {
    while (queue.length > 0) {
      const a = queue.shift();
      if (!isHttpUrl(a.featuredImage)) {
        results.push({ id: a.id, slug: a.slug, url: a.featuredImage, ok: false, error: 'URL não é http(s) absoluta' });
        console.log('  FAIL  id=' + a.id + ' ' + a.slug + ' -> URL não é http(s) absoluta');
        continue;
      }
      const r = await checkImage(a.featuredImage);
      results.push({ id: a.id, slug: a.slug, ...r });
      console.log((r.ok ? '  OK    ' : '  FAIL  ') + ' id=' + a.id + ' ' + a.slug + ' -> ' + (r.error || r.url));
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));

  const broken = results.filter((r) => !r.ok);
  console.log('\n[audit] RESUMO: ' + results.length + ' verificadas, ' + broken.length + ' quebradas');
  if (broken.length > 0) {
    console.log('[audit] IDs quebrados: ' + broken.map((r) => r.id).join(', '));
  }
  if (process.argv.includes('--list')) {
    for (const a of articles) {
      console.log(JSON.stringify({ id: a.id, slug: a.slug, title: a.title, category: a.category && a.category.slug, featuredImage: a.featuredImage, imageAlt: a.imageAlt }));
    }
  }
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ total: articles.length, withImage: withImage.length, withoutImage: withoutImage.length, results, broken }, null, 2));
  }
  process.exitCode = 0; // auditoria apenas reporta; não quebra builds
}

main();
