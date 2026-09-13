// generate-rss.mjs — Gera o feed RSS 2.0 principal do NexoraComic.
// Static export (output: 'export'): route handlers não são suportados, por isso
// o feed é um arquivo estático public/rss.xml gerado no build
// ("node scripts/generate-rss.mjs && next build" em package.json).
// Fonte única de dados: lib/articles.ts (via getArticles, do store.mjs).
// Fonte única de domínio: lib/types.ts (SITE_URL/SITE_NAME) — extraído por parse,
// nunca hardcodei domínio algum.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getArticles } from '../lib/auto/store.mjs';
import { extractConst } from './_task60_rss_helpers.mjs';

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');




export const SITE_URL = extractConst('SITE_URL');
export const SITE_NAME = extractConst('SITE_NAME');
export const SITE_DESCRIPTION =
  SITE_NAME + ' é uma publicação digital que conecta ciência, tecnologia, espaço, '
  + 'inteligência artificial e cultura geek. Artigos sobre astronomia, física, IA, '
  + 'games, filmes e curiosidades científicas.';
export const FEED_URL = SITE_URL + '/rss.xml';

// Escapamento XML obrigatório (Fase 6). & SEMPRE primeiro para não re-escapar.
export function escapeXml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Valida imagem: URL absoluta http(s), sem localhost/placeholder.
function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (!/^https?:\/\//.test(url)) return false;
  if (/localhost|127\.0\.0\.1|placeholder/i.test(url)) return false;
  return true;
}

function rfc2822(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toUTCString(); // "Mon, 15 Jan 2024 00:00:00 GMT" (RFC 2822 / RSS)
}

export function articleUrl(article) {
  return SITE_URL + '/' + article.category.slug + '/' + article.slug;
}

export function buildRssXml(articles) {
  // Ordena DESCENDENTE por publishedAt (Fase 7) — NÃO altera lib/articles.ts.
  const sorted = articles
    .slice()
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const years = sorted.map((a) => Number(a.publishedAt.slice(0, 4)));
  const yearRange = Math.min(...years) + '-' + Math.max(...years);
  const lastBuild = rfc2822(sorted[0].publishedAt);

  const items = sorted.map((a) => {
    const url = articleUrl(a);
    const pub = rfc2822(a.publishedAt);
    if (!pub) return null; // skip item com data inválida
    let line = '    <item>\n';
    line += '      <title>' + escapeXml(a.title) + '</title>\n';
    line += '      <link>' + escapeXml(url) + '</link>\n';
    line += '      <guid isPermaLink="false">' + escapeXml(url) + '</guid>\n';
    line += '      <pubDate>' + pub + '</pubDate>\n';
        line += '      <category domain="' + escapeXml(SITE_URL + '/' + a.category.slug) + '">' + escapeXml(a.category.name) + '</category>\n';
    line += '      <description>' + escapeXml(a.excerpt) + '</description>\n';
    line += '      <content:encoded>' + escapeXml(a.excerpt) + '</content:encoded>\n';
    line += '      <dc:creator>' + escapeXml(a.author.name) + '</dc:creator>\n';
    if (isValidImageUrl(a.featuredImage)) {
      line += '      <media:thumbnail url="' + escapeXml(a.featuredImage) + '" />\n';
      line += '      <media:content url="' + escapeXml(a.featuredImage) + '" medium="image">\n';
      line += '        <media:title type="html">' + escapeXml(a.imageAlt || a.title) + '</media:title>\n';
      line += '      </media:content>\n';
    }
    line += '    </item>';
    return line;
  }).filter(Boolean);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0"',
    '  xmlns:content="http://purl.org/rss/1.0/modules/content/"',
    '  xmlns:media="http://search.yahoo.com/mrss/"',
    '  xmlns:dc="http://purl.org/dc/elements/1.1/"',
    '  xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    '    <title>' + escapeXml(SITE_NAME + ' - Ciência, Tecnologia e Cultura Geek') + '</title>',
    '    <link>' + escapeXml(SITE_URL) + '</link>',
    '    <description>' + escapeXml(SITE_DESCRIPTION) + '</description>',
    '    <language>pt-BR</language>',
    '    <copyright>Copyright ' + yearRange + ' ' + escapeXml(SITE_NAME) + '. Todos os direitos reservados.</copyright>',
    '    <lastBuildDate>' + lastBuild + '</lastBuildDate>',
    '    <atom:link rel="self" href="' + escapeXml(FEED_URL) + '" type="application/rss+xml" />',
    '',
    items.join('\n'),
    '',
    '  </channel>',
    '</rss>',
    ''
  ].join('\n');
}

// Idempotent: mesma entrada -> mesma saída (sem new Date() volútil).
export function generate() {
  const articles = getArticles();
  const xml = buildRssXml(articles);
  const dest = path.join(PROJECT_ROOT, 'public', 'rss.xml');
  writeFileSync(dest, xml, 'utf8');
  return { path: dest, count: articles.length };
}

// Executa apenas quando invocado diretamente (não quando importado pelos testes).
if (process.argv[1] && path.basename(process.argv[1]) === 'generate-rss.mjs') {
  const r = generate();
  console.log('[rss] ' + r.path + ' gerado com ' + r.count + ' itens');
}

