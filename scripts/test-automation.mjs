// test-automation.mjs — testes de blindagem da automação (FASE 20–24).
// Roda validações em memória e em zonas temporárias; NUNCA altera lib/articles.ts.
// Uso: node scripts/test-automation.mjs
import { mkdirSync, copyFileSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import {
  validateArticle, validateArticleAgainstCatalog,
  validateRumorVsFact, checkDedupe, VALID_CATEGORIES,
} from '../lib/auto/validate.mjs';
import {
  getArticles, writeArticlesTransactional, restoreFile, extractArticlesArray,
} from '../lib/auto/store.mjs';

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (extra ? ' | ' + extra : '')); }
};

const tmpRoot = path.join(process.cwd(), '.automation', 'test-tmp');
mkdirSync(tmpRoot, { recursive: true });
const tmpArticles = path.join(tmpRoot, 'articles.ts');
copyFileSync(path.join(process.cwd(), 'lib', 'articles.ts'), tmpArticles);
const originalText = readFileSync(tmpArticles, 'utf8');

const baseArticle = {
  id: '142',
  slug: 'teste-noticia-nova-auto-142',
  title: 'Rockstar detalha novo mecanismo de direção em GTA 6',
  excerpt: 'A Rockstar Games revelou novos detalhes sobre o sistema de direção em GTA 6 durante uma apresentação para a imprensa especializada nesta semana.',
  content: '<p>Mecanismo de direção em GTA 6 promete ser mais realista, com física aprimorada e resposta dos controles mais refinada. A novidade foi apresentada em evento recente e gera expectativa entre os fãs.</p>'.repeat(2),
  category: { id: 'games', slug: 'games', name: 'Games' },
  tags: ['GTA 6', 'Rockstar Games', 'games'],
  publishedAt: '2026-09-13',
  featuredImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Downtown_Miami_skyline_20100305.jpg/1280px-Downtown_Miami_skyline_20100305.jpg',
  imageAlt: 'Skyline de Miami',
  sources: [{ title: 'IGN — GTA 6', url: 'https://www.ign.com/games/grand-theft-auto-vi', type: 'publication' }],
  meta: { generator: 'auto-pipeline', classification: 'confirmed', pautaUrl: 'https://www.ign.com/games/grand-theft-auto-vi', pautaId: 'abc123', imageLicense: 'CC BY-SA', imageArtist: 'A' },
};

// dados reais do catálogo (somente leitura) usados como "existentes"
const realCatalog = getArticles();
console.log('\n=== [FASE 20] Deduplicação ===');
(function () {
  const mk = (o) => ({ id: o.id, title: o.title, slug: o.slug, content: o.content, url: o.url, sources: o.url ? [] : o.sources });

  // Teste 1: mesma URL → BLOQUEADO
  const r1 = checkDedupe(mk({ id: '901', title: 'Titulo A', slug: 'a-901', content: 'texto totalmente diferente para evitar colisao por conteudo repetido varias vezes aqui. '.repeat(2), url: 'https://news.example/story-X' }),
    [mk({ id: '50', title: 'Noticia diversa', slug: 'n50', content: 'outra noticia completamente diferente sobre outro assunto distinto. '.repeat(2), url: 'https://news.example/story-X' })]);
  ok('T1 mesma URL → bloqueado', r1.blocked === true && /URL/.test(r1.reason), JSON.stringify(r1));

  // Teste 2: mesmo conteúdo com URL diferente → possível duplicação
  const sharedContent = 'empresa anunciou novo produto para a temporada de lancamentos com preco competitivo e recursos inovadores.'.repeat(2);
  const r2 = checkDedupe(mk({ id: '902', title: 'Titulo B', slug: 'b-902', content: sharedContent, url: 'https://news.example/story-B' }),
    [mk({ id: '51', title: 'Variacao do titulo', slug: 'v51', content: sharedContent, url: 'https://news.example/outra-url-C' })]);
  ok('T2 mesmo conteúdo, URL diferente → bloqueado (possível dup)', r2.blocked === true && /conteudo/.test(r2.reason), JSON.stringify(r2));

  // Teste 3: mesmo evento com título diferente (similaridade acima do limite)
  const eventTitle = 'Rockstar revela novidade sobre direção no novo GTA 6';
  const r3 = checkDedupe(mk({ id: '903', title: eventTitle, slug: 'c-903', content: 'conteudo do novo evento descrito com palavras diferentes do artigo antigo publicado. '.repeat(2), url: 'https://news.example/story-D' }),
    [mk({ id: '52', title: eventTitle, slug: 'old', content: 'outro texto completamente distinto sobre tema diverso para nao casar no conteudo. '.repeat(2), url: 'https://news.example/antiga-E' })]);
  ok('T3 mesmo evento/título similar → bloqueado (limiar)', r3.blocked === true && /titulo/.test(r3.reason), JSON.stringify(r3));

  // Teste 4: notícia genuinamente nova → permitir
  const r4 = checkDedupe(mk({ id: '904', title: 'Marte terá nova missão de coleta de amostras em 2027', slug: 'marte-2027-904', content: 'agencia anunciou missao para coletar amostras na superficie de marte e incluir retorno de material a terra.'.repeat(2), url: 'https://news.example/story-Marte' }),
    realCatalog.slice(0, 25).map((x) => ({ id: x.id, title: x.title, slug: x.slug, content: x.content, url: (x.sources && x.sources[0] && x.sources[0].url) || '', sources: [] })));
  ok('T4 notícia nova → permitida', r4.blocked === false, JSON.stringify(r4));
})();

console.log('\n=== [FASE 21] Artigo inválido ===');
(function () {
  const bads = [
    { ...baseArticle, title: '' },              // sem título
    { ...baseArticle, sources: [] },            // sem fonte
    { ...baseArticle, slug: '' },               // sem slug
    { ...baseArticle, category: { slug: 'nao-existe', id: 'nao-existe' } }, // categoria inválida
    { ...baseArticle, content: '' },            // sem conteúdo
  ];
  ok('F21 artigo sem título → bloqueado', !validateArticle(bads[0]).ok);
  ok('F21 artigo sem fonte → bloqueado', !validateArticle(bads[1]).ok);
  ok('F21 artigo sem slug → bloqueado', !validateArticle(bads[2]).ok);
  ok('F21 categoria inexistente → bloqueado', !validateArticle(bads[3]).ok);
  ok('F21 artigo sem conteúdo → bloqueado', !validateArticle(bads[4]).ok);
  // articles.ts permanece intacto
  const still = extractArticlesArray(readFileSync(path.join(process.cwd(), 'lib', 'articles.ts'), 'utf8'));
  ok('F21 articles.ts permanece íntegro (148)', still.length === 148, 'len=' + still.length);
})();

console.log('\n=== [FASE 22/23] ID e slug duplicado ===');
(function () {
  const dupId = { ...baseArticle, id: realCatalog[0].id, slug: 'novo-slug-unico-auto-900' };
  const r1 = validateArticleAgainstCatalog(dupId, realCatalog, VALID_CATEGORIES);
  ok('F22 ID duplicado → bloqueado', r1.ok === false && /ID duplicado/.test(r1.errors.join('|')), JSON.stringify(r1));

  const dupSlug = { ...baseArticle, id: '960', slug: realCatalog[0].slug };
  const r2 = validateArticleAgainstCatalog(dupSlug, realCatalog, VALID_CATEGORIES);
  ok('F23 slug duplicado → bloqueado', r2.ok === false && /slug duplicado/.test(r2.errors.join('|')), JSON.stringify(r2));

  const badCat = { ...baseArticle, id: '961', slug: 'x-auto-961', category: { slug: 'games2', id: 'games2' } };
  const r3 = validateArticleAgainstCatalog(badCat, realCatalog, VALID_CATEGORIES);
  ok('F6 categoria inexistente via catálogo → bloqueado', r3.ok === false && /categoria/.test(r3.errors.join('|')), JSON.stringify(r3));
})();

console.log('\n=== [FASE 11] Rumor x fato ===');
(function () {
  const rumorAsFact = { ...baseArticle, title: 'Rockstar confirmou novo modo online do GTA 6', meta: { classification: 'rumor' } };
  const r = validateRumorVsFact(rumorAsFact);
  ok('F11 rumor tratado como fato → bloqueado', r.ok === false, JSON.stringify(r.errors));
  const rumorOk = { ...baseArticle, title: 'Possível divulgação do novo modo online', meta: { classification: 'rumor' } };
  ok('F11 rumor declarado como rumor → permitido', validateRumorVsFact(rumorOk).ok === true);
})();
console.log('\n=== [FASE 24] Transação de escrita e rollback (zona temporária) ===');
(function () {
  // Fase 24 - teste 3: corromper e restaurar a partir do backup
  // primeiro, escrita transacional válida p/ gerar backup do alvo
  const idxClose = originalText.lastIndexOf('];');
  const validCandidate = originalText.slice(0, idxClose) + ',{id:"999",slug:"tst-transacional",title:"t",category:{slug:"games"},content:"y"}\n];' + originalText.slice(idxClose + 2);
  const res = writeArticlesTransactional(validCandidate, { target: tmpArticles });
  const countAfter = extractArticlesArray(readFileSync(tmpArticles, 'utf8')).length;
  ok('F13 escrita válida → count=149', res.ok === true && countAfter === 149, 'count=' + countAfter);

  // Fase 24 - teste 3: falha de escrita/interrupção → backup restaurado
  writeFileSync(tmpArticles, '<<garbage corrompido>>', 'utf8'); // simula falha
  try {
    restoreFile(res.backupPath, tmpArticles);
    const restored = extractArticlesArray(readFileSync(tmpArticles, 'utf8')).length;
    ok('F14 rollback c/ backup → restaura estado válido anterior (148)', restored === 148, 'restored=' + restored);
  } catch (e) {
    ok('F14 rollback c/ backup → arquivo válido de novo', false, e.message);
  }

  // Fase 24 - testes 1/2: candidato quebrado NUNCA chega ao disco
  const beforeClean = readFileSync(tmpArticles, 'utf8');
  const broken = originalText.slice(0, originalText.lastIndexOf('];')); // remove o fechamento real -> array fica sem fechar
  let threw = false;
  try { writeArticlesTransactional(broken, { target: tmpArticles }); } catch { threw = true; }
  ok('F24 candidato quebrado → lança e NÃO escreve', threw === true);
  const afterBroken = readFileSync(tmpArticles, 'utf8');
  ok('F24 arquivo intacto após candidato quebrado', afterBroken === beforeClean || extractArticlesArray(afterBroken).length === 149);
})();

console.log('\n=== [FASE 3] Artigo válido de referência passa na validação ===');
ok('F3 artigo de referência válido', validateArticle(baseArticle).ok === true, JSON.stringify(validateArticle(baseArticle).errors));

// limpeza da zona temporária
try { rmSync(tmpRoot, { recursive: true, force: true }); } catch { /* ignore */ }

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`RESULTADO: ${pass} passaram | ${fail} falharam`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
process.exit(fail > 0 ? 1 : 0);