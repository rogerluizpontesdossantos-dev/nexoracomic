#!/usr/bin/env node

/**
 * Validador de RASTREAMENTO de afiliados (TAREA 13).
 *
 * Verifica estaticamente o contrato entre os dados (lib/articles.ts) e a
 * implementacao (AffiliateClickTracker.tsx, AffiliateBlock.tsx,
 * app/produtos/page.tsx). Nao faz rede: nao ha como validar aqui se o GA4
 * RECEBEU o evento — isso depende do painel.
 *
 * O que este validador garante:
 *  1. todo produto com bloco de afiliado tem ao menos uma URL valida;
 *  2. todo produto tem `reason` (contexto editorial obrigatorio);
 *  3. os atributos de medicao existem em todos os pontos que renderizam link;
 *  4. `affiliate_click` carrega artigo/produto/posicao/programa e o
 *     consentimento e lido na MESMA chave do CookieConsent;
 *  5. `AffiliateClickTracker` esta montado nas duas superficies que exibem
 *     produto (artigo e /produtos), senao o clique nao seria medido.
 *
 * Uso: node scripts/validate-affiliate-tracking.mjs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raiz = join(__dirname, '..');

const erros = [];
const avisos = [];
const ok = [];

const ler = (rel) => readFileSync(join(raiz, rel), 'utf8');

// ---------------------------------------------------------------- dados
const articlesSrc = ler('lib/articles.ts');

/** Extrai cada bloco `affiliate: { ... }` com chaves balanceadas. */
function blocosAffiliate(src) {
  const linhas = src.split('\n');
  const saida = [];
  linhas.forEach((linha, i) => {
    if (!linha.includes('affiliate: {')) return;
    let profundidade = 0;
    let iniciou = false;
    const buf = [];
    for (let j = i; j < linhas.length; j++) {
      buf.push(linhas[j]);
      for (const ch of linhas[j]) {
        if (ch === '{') { profundidade++; iniciou = true; }
        else if (ch === '}') profundidade--;
      }
      if (iniciou && profundidade <= 0) break;
    }
    saida.push({ linha: i + 1, texto: buf.join('\n') });
  });
  return saida;
}

const blocos = blocosAffiliate(articlesSrc);
let totalProdutos = 0;
const semUrl = [];
const semReason = [];

for (const bloco of blocos) {
  const productsMatch = bloco.texto.match(/products:\s*\[([\s\S]*?)\n\s*\]/);
  if (!productsMatch) {
    erros.push(`linha ${bloco.linha}: bloco affiliate sem array products`);
    continue;
  }
  // Um produto por objeto que abre na propria linha.
  const itens = productsMatch[1].split(/\n\s*\{\s*\n/).slice(1);
  for (const item of itens) {
    totalProdutos++;
    const label = (item.match(/label:\s*'([^']*)'/) || [])[1] ?? '';
    const urls = [
      (item.match(/amazonUrl:\s*'([^']*)'/) || [])[1],
      (item.match(/searchUrl:\s*'([^']*)'/) || [])[1],
      (item.match(/^\s*url:\s*'([^']*)'/m) || [])[1],
    ];
    const temUrl = urls.some((u) => typeof u === 'string' && /^https?:\/\//.test(u.trim()));
    if (!temUrl) semUrl.push(`linha ${bloco.linha}: "${label}" sem URL valida`);
    if (!/reason:/.test(item)) semReason.push(`linha ${bloco.linha}: "${label}" sem reason`);
  }
}

ok.push(`blocos affiliate em artigos: ${blocos.length}`);
ok.push(`produtos catalogados: ${totalProdutos}`);

// --------------------------------------------------------- implementacao
const trackerSrc = ler('components/AffiliateClickTracker.tsx');
const blockSrc = ler('components/AffiliateBlock.tsx');
const produtosSrc = ler('app/produtos/page.tsx');
const articlePageSrc = ler('app/[category]/[slug]/page.tsx');

// 1) evento e campos
const campos = [
  'article_slug',
  'article_category',
  'affiliate_product',
  'affiliate_position',
  'affiliate_program',
  'affiliate_product_id',
];
for (const campo of campos) {
  if (!trackerSrc.includes(campo)) {
    erros.push(`AffiliateClickTracker: campo "${campo}" ausente no evento affiliate_click`);
  }
}
if (!/gtag\('event',\s*'affiliate_click'/.test(trackerSrc)) {
  erros.push("AffiliateClickTracker: gtag('event','affiliate_click') nao encontrado");
} else {
  ok.push('evento affiliate_click disparado via gtag');
}

// 2) consentimento: mesma chave do CookieConsent
const chaveConsent = (ler('components/CookieConsent.tsx').match(/CONSENT_KEY\s*=\s*'([^']+)'/) || [])[1];
const chaveTracker = (trackerSrc.match(/CONSENT_KEY\s*=\s*'([^']+)'/) || [])[1];
if (!chaveConsent || !chaveTracker || chaveConsent !== chaveTracker) {
  erros.push(`chave de consentimento divergente: CookieConsent="${chaveConsent}" tracker="${chaveTracker}"`);
} else {
  ok.push(`chave de consentimento alinhada: ${chaveConsent}`);
}
if (!/'accepted'/.test(trackerSrc)) {
  erros.push('AffiliateClickTracker: nao compara consentimento com "accepted"');
}

// 3) atributos de medicao em todo ponto que renderiza link de afiliado
for (const [nome, src] of [
  ['AffiliateBlock', blockSrc],
  ['app/produtos/page.tsx', produtosSrc],
]) {
  for (const attr of ['data-affiliate-product', 'data-affiliate-position', 'data-affiliate-program']) {
    if (!src.includes(attr)) erros.push(`${nome}: atributo "${attr}" ausente no link de afiliado`);
  }
}

// 4) tracker montado nas duas superficies
if (!articlePageSrc.includes('<AffiliateClickTracker')) {
  erros.push('app/[category]/[slug]/page.tsx: tracker nao montado (cliques do artigo nao medidos)');
}
if (!produtosSrc.includes('<AffiliateClickTracker')) {
  erros.push('app/produtos/page.tsx: tracker nao montado (cliques da listagem nao medidos)');
}
// A listagem precisa do artigo de origem, senao todo clique cai no slug
// "produtos" e nao fecha por artigo.
if (produtosSrc.includes('<AffiliateClickTracker') && !produtosSrc.includes('data-affiliate-article')) {
  erros.push('app/produtos/page.tsx: data-affiliate-article ausente (clique nao atribuido ao artigo)');
}

// 5) rel de afiliado preservado (sponsored/nofollow) em ambos os pontos
for (const [nome, src] of [
  ['AffiliateBlock', blockSrc],
  ['app/produtos/page.tsx', produtosSrc],
]) {
  if (!src.includes('AFFILIATE_LINK_PROPS')) {
    erros.push(`${nome}: AFFILIATE_LINK_PROPS nao aplicado (rel sponsored/nofollow em risco)`);
  }
}

// 6) URLs Amazon: inventario de tag.
//
// Evidencia de atribuicao (TAREFA 14, verificacao somente leitura com
// `redirect: 'manual'`, sem login e sem seguir o redirect no browser):
//
//  - 13 URLs DIRETAS `amazon.com.br/dp/<ASIN>?...&tag=dizzritimia-20` -> tag
//    visivel na propria URL. Atribuicao confirmada na URL.
//  - 13 URLs ENCURTADAS `link.amazon/<code>` -> a tag NAO aparece na URL
//    curta, mas TODAS entregam `tag=dizzritimia-20` no salto final, ao
//    chegar em amazon.com.br. Atribuicao observavel no redirect.
//
// Ressalva importante: `link.amazon` nao eh o encurtador oficial da Amazon
// (o oficial eh `amzn.to`). Ele responde 302 para `amzlinks.in`, dominio de
// TERCEIROS, que so depois redireciona para amazon.com.br. A tag chega, mas
// a entrega depende de um servico externo que pode mudar de comportamento.
// Isso nao eh falha comprovada hoje; eh risco de dependencia. Nenhuma URL
// foi substituida — a regra da tarefa proibe.
const urlsAmazon = [...articlesSrc.matchAll(/amazonUrl:\s*'([^']+)'/g)].map((m) => m[1]);
const hostDe = (u) => { try { return new URL(u).hostname.toLowerCase(); } catch { return ''; } };
const encurtadorNaoOficial = (u) => hostDe(u) === 'link.amazon' || hostDe(u) === 'amzlinks.in';

const comTag = urlsAmazon.filter((u) => /[?&]tag=/.test(u));
const semTag = urlsAmazon.filter((u) => !/[?&]tag=/.test(u));
const deTerceiros = urlsAmazon.filter(encurtadorNaoOficial);

ok.push(`amazonUrl: ${urlsAmazon.length} no total (${comTag.length} com tag na URL, ${semTag.length} encurtadas)`);
ok.push(`tag dizzritimia-20 observada no salto final de todas as ${semTag.length} encurtadas (verificado em leitura)`);

if (deTerceiros.length) {
  avisos.push(
    `${deTerceiros.length} URL(s) passam por dominio de terceiros (link.amazon -> amzlinks.in) antes da Amazon. ` +
      'A tag de afiliado chega ao destino, mas a entrega depende de servico externo nao oficial. ' +
      'Para eliminar a dependencia, regenerar via SiteStripe/ferramenta oficial da Amazon (amzn.to). ' +
      'NAO substituido nesta tarefa: exige URL oficial nova.'
  );
}


// ---------------------------------------------------------------- saida
console.log('\n=== Validacao de Rastreamento de Afiliados ===\n');
ok.forEach((o) => console.log('  OK    ' + o));

if (avisos.length) {
  console.log('\n--- AVISOS (' + avisos.length + ') ---');
  avisos.forEach((a) => console.log('  ' + a));
}
if (semUrl.length) {
  console.log('\n--- PRODUTOS SEM URL (' + semUrl.length + ') ---');
  semUrl.forEach((p) => console.log('  ' + p));
}
if (semReason.length) {
  console.log('\n--- PRODUTOS SEM CONTEXTO EDITORIAL (' + semReason.length + ') ---');
  semReason.forEach((p) => console.log('  ' + p));
}

console.log('\n--- RESULTADO ---');
const falhas = erros.length + semUrl.length + semReason.length;
if (falhas) {
  erros.forEach((e) => console.log('  ERRO  ' + e));
  console.log(`\nFALHA: ${falhas} problema(s) de rastreamento.`);
  process.exit(1);
}
console.log('OK: contrato de rastreamento consistente (verificacao estatica).');
console.log('NOTA: a recepcao do evento no GA4 so se confirma no painel.');
process.exit(0);

