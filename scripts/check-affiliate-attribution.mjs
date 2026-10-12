#!/usr/bin/env node

/**
 * Verificador de ATRIBUICAO dos links Amazon (TAREFA 14).
 *
 * SOMENTE LEITURA. Nao cria, deduz, completa, regenera nem substitui URL.
 * Nao faz login, nao compra, nao altera conta e nao segue redirect dentro de
 * um browser: usa `redirect: 'manual'` e timeout curto apenas para REGISTRAR
 * a cadeia de redirecionamento.
 *
 * Por que existe: uma URL encurtada sem `tag=` visivel NAO prova falha de
 * atribuicao. A Amazon pode entregar a tag num salto posterior. Este script
 * observa a cadeia e informa em qual salto a tag aparece — ou marca
 * "atribuicao nao confirmada" quando nao eh possivel saber.
 *
 * Uso: node scripts/check-affiliate-attribution.mjs
 * Requer rede. Sem rede, tudo sai como INCONCLUSIVO (nunca como falha).
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raiz = join(__dirname, '..');

const MAX_SALTOS = 6;
const TIMEOUT_MS = 12000;
const TAG_ESPERADA = process.env.NEXORA_AFFILIATE_TAG || '';

/** Le as amazonUrl declaradas em lib/articles.ts (nao inventa nenhuma). */
function urlsDeclaradas() {
  const src = readFileSync(join(raiz, 'lib/articles.ts'), 'utf8');
  return [...new Set([...src.matchAll(/amazonUrl:\s*'([^']+)'/g)].map((m) => m[1]))];
}

async function cadeia(inicial) {
  const saltos = [];
  let atual = inicial;

  for (let i = 0; i < MAX_SALTOS; i++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let res;
    try {
      res = await fetch(atual, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; nexora-link-check)' },
      });
    } catch (e) {
      saltos.push({ url: atual, status: 'ERRO', nota: e.name === 'AbortError' ? 'timeout' : String(e.message || e) });
      break;
    } finally {
      clearTimeout(timer);
    }

    let host = '?', tag = null;
    try { const u = new URL(atual); host = u.hostname.toLowerCase(); tag = u.searchParams.get('tag'); } catch { /* ignora */ }
    saltos.push({ url: atual, status: res.status, host, tag });

    const loc = res.headers.get('location');
    if (!loc) break;
    try { atual = new URL(loc, atual).toString(); } catch {
      saltos.push({ url: loc, status: 'LOCATION_INVALIDO' });
      break;
    }
  }
  return saltos;
}

const urls = urlsDeclaradas();
console.log(`=== Verificacao de Atribuicao (somente leitura) — ${urls.length} URL unica ===\n`);
if (!TAG_ESPERADA) {
  console.log('Nota: defina NEXORA_AFFILIATE_TAG para comparar a tag encontrada com a esperada.\n');
}

let confirmadas = 0;
let naoConfirmadas = 0;
const terceiros = [];

for (const u of urls) {
  const saltos = await cadeia(u);
  const hosts = [...new Set(saltos.map((s) => s.host).filter((h) => h && h !== '?'))];
  const comTag = saltos.find((s) => s.tag);
  const inconclusivo = saltos.some((s) => s.status === 'ERRO' || s.status === 'LOCATION_INVALIDO');

  // Tag na propria URL ja conta como confirmada (nenhum salto necessario).
  let tagNaOrigem = null;
  try { tagNaOrigem = new URL(u).searchParams.get('tag'); } catch { /* ignora */ }
  const tagObservada = tagNaOrigem || comTag?.tag || null;

  const passaPorTerceiro = hosts.some((h) => h !== 'www.amazon.com.br' && h !== 'amazon.com.br' && h !== 'amazon.com' && !h.endsWith('.amazon.') && h !== 'amzn.to' && h !== 'link.amazon');
  if (passaPorTerceiro) terceiros.push({ url: u, hosts });

  let veredito;
  if (tagObservada) { veredito = 'ATRIBUICAO OBSERVAVEL (tag=' + tagObservada + ')'; confirmadas++; }
  else if (inconclusivo) { veredito = 'ATRIBUICAO NAO CONFIRMADA (resposta inconclusiva)'; naoConfirmadas++; }
  else { veredito = 'ATRIBUICAO NAO OBSERVAVEL na cadeia'; naoConfirmadas++; }

  console.log(u);
  saltos.forEach((s) => {
    const extra = s.nota ? '  (' + s.nota + ')' : '';
    const t = s.tag ? '  tag=' + s.tag : '';
    console.log(`   ${s.status}  [${s.host || '?'}]${t}${extra}`);
  });
  console.log(`   cadeia: ${hosts.join(' -> ') || '(indisponivel)'}`);
  console.log(`   => ${veredito}\n`);
}

console.log('--- RESUMO ---');
console.log(`URLs unicas examinadas : ${urls.length}`);
console.log(`atribuicao observavel  : ${confirmadas}`);
console.log(`nao confirmada         : ${naoConfirmadas}`);
if (terceiros.length) {
  console.log(`\npassam por dominio de terceiros: ${terceiros.length}`);
  terceiros.forEach((t) => console.log(`  ${t.url}\n     ${t.hosts.join(' -> ')}`));
}
console.log('\nATENCAO: atribuicao observavel no redirect NAO prova que a comissao sera');
console.log('creditada. Somente o painel Amazon Associates confirma. E nenhuma URL');
console.log('foi alterada por este script.');
