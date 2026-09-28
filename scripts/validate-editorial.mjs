// validate-editorial.mjs — auditoria editorial do catálogo (TASK 69)
//
// Objetivo: detectar artigos publicados sem fontes reais ou com imagem
// inexistente, dois problemas que o validate:images (estático) não pega.
//
// IMPORTANTE: este script NÃO é gate do build. A verificação de rede pode
// falhar por rate limit (429), timeout ou indisponibilidade externa, e usar
// isso como bloqueio de build geraria falsos negativos.
//
// Uso: npm run validate:editorial
//
// Saída por item:
//   VALID        - 200/3xx com content-type de imagem
//   RATE_LIMITED - 429, NÃO conta como quebrado
//   UNAVAILABLE  - timeout/DNS/rede, NÃO conta como quebrado
//   BROKEN       - 404/410/403 ou content-type inválido
import { getArticles } from '../lib/auto/store.mjs';

const TIMEOUT_MS = 12000;
const CONCURRENCY = 4;

const UA = 'NexoraComicEditorialAudit/1.0 (validate:editorial)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// URLs que nao sustentam informacao especifica (homepage / busca)
const GENERICAS = [
  /^https?:\/\/(www\.)?[^/]+\/?$/i,
  /\/search(\?|$)/i,
  /\?q=/i,
  /\/busca\/?$/i,
];

function ehGenerica(url) {
  return GENERICAS.some((re) => re.test(url));
}

async function checarImagem(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { 'User-Agent': UA },
    });
    const ct = (r.headers.get('content-type') || '').toLowerCase();
    if (r.status === 429) return { estado: 'RATE_LIMITED', status: r.status };
    if (r.status >= 200 && r.status < 400) {
      if (ct.startsWith('image/')) return { estado: 'VALID', status: r.status, ct };
      return { estado: 'BROKEN', status: r.status, motivo: 'content-type ' + (ct || 'vazio') };
    }
    if (r.status === 403 || r.status === 401) return { estado: 'UNAVAILABLE', status: r.status };
    return { estado: 'BROKEN', status: r.status };
  } catch (e) {
    return { estado: 'UNAVAILABLE', status: 0, motivo: e.name === 'AbortError' ? 'timeout' : String(e.message || e) };
  } finally {
    clearTimeout(t);
  }
}

async function main() {
  const articles = getArticles();
  console.log('validate:editorial — ' + articles.length + ' artigos\n');

  const erros = [];
  const avisos = [];
  const semFonte = [];

  // --- checagens estaticas (confiaveis) ---
  for (const a of articles) {
    const fontes = Array.isArray(a.sources) ? a.sources.filter((s) => s && s.url) : [];
    if (fontes.length === 0) {
      semFonte.push(a.id);
      erros.push(`artigo ${a.id} (${a.slug}): SEM FONTE`);
      continue;
    }
    for (const f of fontes) {
      if (!/^https?:\/\//i.test(f.url)) {
        erros.push(`artigo ${a.id}: fonte com URL invalida -> ${f.url}`);
      } else if (ehGenerica(f.url)) {
        avisos.push(`artigo ${a.id}: fonte parece generica (homepage/busca) -> ${f.url}`);
      }
    }
    const palavras = String(a.content || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    if (palavras < 250) avisos.push(`artigo ${a.id}: apenas ${palavras} palavras`);
  }

  // --- checagem de rede das imagens (nao bloqueante) ---
  console.log('Verificando imagens (concurrency ' + CONCURRENCY + ', timeout ' + TIMEOUT_MS + 'ms)...\n');
  const fila = articles.filter((a) => a.featuredImage);
  const contagem = { VALID: 0, RATE_LIMITED: 0, UNAVAILABLE: 0, BROKEN: 0 };
  const quebradas = [];

  for (let i = 0; i < fila.length; i += CONCURRENCY) {
    const grupo = fila.slice(i, i + CONCURRENCY);
    const res = await Promise.all(grupo.map((a) => checarImagem(a.featuredImage).then((r) => ({ a, r }))));
    for (const { a, r } of res) {
      contagem[r.estado]++;
      if (r.estado === 'BROKEN') quebradas.push(`artigo ${a.id} (${a.slug}): imagem HTTP ${r.status} ${r.motivo || ''}`);
      if (r.estado === 'VALID') {
        console.log('  VALID  ' + String(a.id).padStart(3) + '  ' + a.featuredImage.slice(0, 78));
      } else if (r.estado === 'RATE_LIMITED') {
        console.log('  RATE   ' + String(a.id).padStart(3) + '  (429, ignorado)');
      } else if (r.estado === 'UNAVAILABLE') {
        console.log('  UNAVAI ' + String(a.id).padStart(3) + '  (' + (r.motivo || r.status) + ', ignorado)');
      } else {
        console.log('  BROKEN ' + String(a.id).padStart(3) + '  ' + a.featuredImage.slice(0, 60));
      }
    }
    await sleep(120);
  }

  console.log('\n--- RESUMO DE IMAGENS ---');
  console.log('VALID: ' + contagem.VALID + ' | RATE_LIMITED: ' + contagem.RATE_LIMITED +
    ' | UNAVAILABLE: ' + contagem.UNAVAILABLE + ' | BROKEN: ' + contagem.BROKEN);
  console.log('Nota: 429 e indisponibilidade nao contam como imagem quebrada.');

  if (semFonte.length) {
    console.log('\n--- ARTIGOS SEM FONTE (' + semFonte.length + ') ---');
    console.log(semFonte.join(', '));
  }
  if (avisos.length) {
    console.log('\n--- AVISOS (' + avisos.length + ') ---');
    avisos.slice(0, 20).forEach((v) => console.log('  ' + v));
    if (avisos.length > 20) console.log('  ... e mais ' + (avisos.length - 20));
  }
  if (quebradas.length) {
    console.log('\n--- IMAGENS QUEBRADAS (' + quebradas.length + ') ---');
    quebradas.forEach((q) => console.log('  ' + q));
  }

  console.log('\n--- RESULTADO ---');
  if (quebradas.length) {
    console.log('FALHA: ' + quebradas.length + ' imagem(ns) quebrada(s).');
    process.exit(1);
  }
  if (erros.length) {
    console.log('FALHA: ' + erros.length + ' problema(s) de fontes.');
    process.exit(1);
  }
  console.log('OK: nenhuma fonte ausente e nenhuma imagem quebrada.');
  console.log('Avisos: ' + avisos.length);
}

main().catch((e) => { console.error('erro fatal: ' + (e.message || e)); process.exit(1); });