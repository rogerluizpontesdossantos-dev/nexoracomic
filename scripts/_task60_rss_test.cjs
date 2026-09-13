// _task60_rss_test.cjs — teste automatizado do feed RSS (Fase 16). Convenção repo: .cjs.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = __dirname.replace(/\\/g, '/').replace(/\/scripts$/, '');
const FEED_PATH = path.join(ROOT, 'public/rss.xml');
const SITE_URL = require('fs').readFileSync(path.join(ROOT, 'lib/types.ts'), 'utf8').match(/export const SITE_URL = '([^']+)'/)[1];
const XML = fs.existsSync(FEED_PATH) ? fs.readFileSync(FEED_PATH, 'utf8') : '';

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail: String(detail || '') });
  console.log((ok ? '  PASS ' : '  FAIL ') + name + (detail ? ' -> ' + detail : ''));
  return ok;
}

// Extrai itens
function getItemXml(xml) {
  const re = /<item>([\s\S]*?)<\/item>/g;
  const out = [];
  let m;
  while ((m = re.exec(xml)) !== null) out.push(m[1]);
  return out;
}
function getField(ix, tag) {
  const m = new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)<\\/' + tag + '>', 's').exec(ix);
  return m ? m[1].trim() : null;
}

// Parse do catalogo (replica store.mjs extractArticlesArray sem dependencia)
function getArticles() {
  const text = fs.readFileSync(path.join(ROOT, 'lib/articles.ts'), 'utf8');
  const s = text.indexOf('export const DEMONSTRATION_ARTICLES');
  const a = text.indexOf('=', s);
  const b = text.indexOf('[', a);
  let depth = 0, endIdx = -1;
  for (let i = b; i < text.length; i++) {
    const ch = text[i];
    if (ch === '[') depth++;
    else if (ch === ']') { depth--; if (depth === 0) { endIdx = i; break; } }
  }
  return vm.runInNewContext('(' + text.slice(b, endIdx + 1) + ')');
}

async function main() {
  // Importa buildRssXml e escapeXml do generator
  const gen = await import('./generate-rss.mjs');
  const { buildRssXml, escapeXml } = gen;

  console.log('\n=== RSS FEED TEST (Fase 16) ===');
  console.log('feed path: ' + FEED_PATH);
  console.log('site url : ' + SITE_URL);
  console.log('');

  // 1-7. estrutura XML
  check('1. feed existe em public/rss.xml', fs.existsSync(FEED_PATH));
  check('2. XML declara versao/encoding UTF-8', /<\?xml[^?]*encoding="UTF-8"\?>/.test(XML));
  check('2. root <rss> version 2.0', /<rss[^>]*version="2\.0"/.test(XML));
  check('3. namespaces content/media/dc/atom',
    /xmlns:content="http:\/\/purl\.org\/rss\/1\.0\/modules\/content\/"/.test(XML) &&
    /xmlns:media="http:\/\/search\.yahoo\.com\/mrss\/"/.test(XML) &&
    /xmlns:dc="http:\/\/purl\.org\/dc\/elements\/1\.1\/"/.test(XML) &&
    /xmlns:atom="http:\/\/www\.w3\.org\/2005\/Atom"/.test(XML));
  check('4. channel presente', /<channel>/.test(XML) && /<\/channel>/.test(XML));
  check('5. title do channel', /<title>[^<]+<\/title>/.test(XML));
  check('6. link do channel = SITE_URL', new RegExp('<link>' + SITE_URL + '\\s*<\\/link>').test(XML));
  check('7. description do channel', /<description>[\s\S]+<\/description>/.test(XML));

  const items = getItemXml(XML);
  const links = items.map(ix => getField(ix, 'link')).filter(Boolean);
  const titles = items.map(ix => getField(ix, 'title')).filter(Boolean);
  const dates = items.map(ix => getField(ix, 'pubDate')).filter(Boolean);

  // 8-11. links
  check('8. 148 itens no feed', items.length === 148, 'encontrados: ' + items.length);
  check('9. todos os links absolutos (https)', links.every(l => /^https:\/\//.test(l)), 'ex: ' + (links.find(l => !/^https:\/\//.test(l)) || 'nenhum'));
  const forbidden = links.filter(l => /localhost|127\.0\.0\.1|dizzritimia|nexoracomic\.com/.test(l));
  check('10. sem localhost/dizzritimia/nexoracomic.com', forbidden.length === 0, JSON.stringify(forbidden.slice(0, 3)));
  check('11. nenhum link vazio', links.every(l => l.length > 0));

  // 12-13. titulos e datas
  check('12. titulos nao quebram XML', titles.every(t => !/<[^&]/.test(t) || t.includes('&lt;') || t.includes('&amp;')), 'ex: ' + (titles.find(t => /<[^\w]/.test(t)) || 'nenhum'));
  const dateRe = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}:\d{2} GMT$/;
  check('13. datas validas RFC 2822', dates.every(d => dateRe.test(d)), 'ex: ' + (dates.find(d => !dateRe.test(d)) || 'nenhum'));

  // 14. ordem decrescente
  const ts = dates.map(d => new Date(d).getTime());
  let desc = true;
  for (let i = 1; i < ts.length; i++) { if (ts[i] > ts[i-1]) { desc = false; break; } }
  check('14. artigos em ordem decrescente', desc);

  // 15-16. correspondencia com catalogo
  const articles = getArticles();
  check('15. feed reflete catalogo (148 artigos)', items.length === articles.length, 'feed=' + items.length + ' catalogo=' + articles.length);
  const slugsOk = items.every(ix => {
    const l = getField(ix, 'link') || '';
    return articles.some(a => l === SITE_URL + '/' + a.category.slug + '/' + a.slug);
  });
  check('16. URLs correspondem aos slugs reais', slugsOk);

  // POISON: teste de escape de caracteres especiais
  console.log('\n--- POISON TEST (escape XML) ---');
  const fake = [{
    id: '9999', slug: 'poison-test',
    title: 'A & B < C > D " E \' F',
    excerpt: 'X & Y < Z',
    category: { slug: 'test', name: 'Test & <Cat>' },
    author: { name: 'Autor & <X>' },
    publishedAt: '2026-01-01T00:00:00Z',
    featuredImage: 'https://example.com/img.jpg',
    imageAlt: 'alt & <>'
  }];
  const poison = buildRssXml(fake);
  check('POISON. & escapado como &amp;', poison.includes('&amp;'));
  check('POISON. < escapado como &lt;', poison.includes('&lt;'));
  check('POISON. > escapado como &gt;', poison.includes('&gt;'));
  check('POISON. " escapado como &quot;', poison.includes('&quot;'));
  check('POISON. \' escapado como &apos;', poison.includes('&apos;'));
  // Garante que nao restou caractere perigoso
  const dangerousPoison = poison.replace(/&amp;|&lt;|&gt;|&quot;|&apos;/g, '');
  check('POISON. nenhum < > & " \' perigoso solto', !/[<>&"']/.test(dangerousPoison.replace(/xmlns:[^=]+="[^"]*"/g, '').replace(/<[^>]+>/g, '')));

  // Relatorio final
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok);
  console.log('\n=== RESULTADO: ' + passed + '/' + results.length + ' passed ===');
  if (failed.length > 0) {
    failed.forEach(f => console.log('  FAIL: ' + f.name + (f.detail ? ' -> ' + f.detail : '')));
  }
  const outPath = path.join(ROOT, 'scripts', '_task60_rss_test.json');
  fs.writeFileSync(outPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    passed,
    total: results.length,
    failed: failed.map(f => f.name),
    results
  }, null, 2));
  console.log('report: ' + outPath);
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch(e => { console.error('TEST ERROR:', e.message); process.exit(1); });

