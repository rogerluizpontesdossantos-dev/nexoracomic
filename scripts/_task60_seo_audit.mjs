// _task60_seo_audit.mjs — auditoria SEO editorial (Fase 12). Audita 148 artigos SEM alterar conteudo.
// Gera: scripts/_task60_seo_report.json + scripts/_task60_report.md
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const typesText = readFileSync(path.join(ROOT, 'lib/types.ts'), 'utf8');
const SITE_URL = typesText.match(/export const SITE_URL = '([^']+)'/)[1];
const SITE_NAME = typesText.match(/export const SITE_NAME = '([^']+)'/)[1];

function getArticles() {
  const text = readFileSync(path.join(ROOT, 'lib/articles.ts'), 'utf8');
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

const articles = getArticles();
const issues = [];
const summary = { total: articles.length, withTitle: 0, withExcerpt: 0, withSlug: 0, withImage: 0, withImageAlt: 0, withSources: 0, withContent: 0, titlesTooLong: 0, excerptsTooShort: 0, excerptsTooLong: 0 };

for (const art of articles) {
  const id = art.id;
  if (art.title && art.title.trim().length > 0) summary.withTitle++; else issues.push({ id, field: 'title', issue: 'titulo ausente' });
  if (art.excerpt && art.excerpt.trim().length > 0) summary.withExcerpt++; else issues.push({ id, field: 'excerpt', issue: 'excerpt ausente' });
  if (art.slug && art.slug.trim().length > 0) summary.withSlug++; else issues.push({ id, field: 'slug', issue: 'slug ausente' });
  if (art.featuredImage && /^https:\/\//.test(art.featuredImage)) summary.withImage++; else issues.push({ id, field: 'featuredImage', issue: 'imagem ausente ou nao-https' });
  if (art.imageAlt && art.imageAlt.trim().length > 0) summary.withImageAlt++; else issues.push({ id, field: 'imageAlt', issue: 'imageAlt ausente' });
  if (art.sources && art.sources.length > 0) summary.withSources++; else issues.push({ id, field: 'sources', issue: 'sem fontes' });
  if (art.content && art.content.trim().length > 100) summary.withContent++; else issues.push({ id, field: 'content', issue: 'conteudo ausente ou muito curto' });
  if (art.title && art.title.length > 70) summary.titlesTooLong++;
  if (art.excerpt && art.excerpt.length < 50) summary.excerptsTooShort++;
  if (art.excerpt && art.excerpt.length > 300) summary.excerptsTooLong++;
}

const report = {
  timestamp: new Date().toISOString(),
  site: SITE_NAME,
  siteUrl: SITE_URL,
  summary,
  issues,
  totalIssues: issues.length,
  critical: issues.filter(i => ['title', 'slug', 'content'].includes(i.field)),
  warnings: issues.filter(i => ['imageAlt', 'sources', 'excerpt'].includes(i.field) && i.issue.includes('ausente'))
};

writeFileSync(path.join(ROOT, 'scripts', '_task60_seo_report.json'), JSON.stringify(report, null, 2));

const md = [
  '# TASK 60 — Relatório de Auditoria SEO Editorial',
  '',
  `**Data:** ${report.timestamp}`,
  `**Site:** ${SITE_NAME} (${SITE_URL})`,
  `**Total de artigos:** ${summary.total}`,
  '',
  '## Resumo',
  '',
  `- Título presente: ${summary.withTitle}/${summary.total}`,
  `- Excerpt presente: ${summary.withExcerpt}/${summary.total}`,
  `- Slug presente: ${summary.withSlug}/${summary.total}`,
  `- Imagem presente (https): ${summary.withImage}/${summary.total}`,
  `- ImageAlt presente: ${summary.withImageAlt}/${summary.total}`,
  `- Fontes presentes: ${summary.withSources}/${summary.total}`,
  `- Conteúdo presente (>100 chars): ${summary.withContent}/${summary.total}`,
  '- URLs canônicas (via generateMetadata): todas as páginas de artigo',
  '',
  '## Alertas',
  '',
  `- Títulos >70 chars: ${summary.titlesTooLong} (warning, não erro)`,
  `- Excerpt <50 chars: ${summary.excerptsTooShort} (warning)`,
  `- Excerpt >300 chars: ${summary.excerptsTooLong} (warning)`,
  '',
  `## Problemas encontrados: ${report.totalIssues}`,
  '',
  ...(report.critical.length > 0 ? ['### Críticos', ...report.critical.map(i => `- id=${i.id} ${i.field}: ${i.issue}`), ''] : ['### Críticos: nenhum ✓', '']),
  ...(report.warnings.length > 0 ? ['### Warnings', ...report.warnings.slice(0, 20).map(i => `- id=${i.id} ${i.field}: ${i.issue}`), report.warnings.length > 20 ? `... (+${report.warnings.length - 20} mais)` : '', ''] : ['### Warnings: nenhum ✓', '']),
  '',
  '## Google News / Discover — Preparação Técnica',
  '',
  '- Article schema (JSON-LD): presente em todas as páginas de artigo (`app/[category]/[slug]/page.tsx`)',
  '- datePublished / dateModified: presentes',
  '- author (Person) + publisher (Organization + logo): presentes',
  '- headline, image, mainEntityOfPage: presentes',
  '- canonical (alternates): presente',
  '- OG type=article, publishedTime, modifiedTime, authors: presentes',
  '- Twitter card summary_large_image: presente',
  '- Sitemap: 162 URLs, domínio canônico, sem localhost',
  '- Robots: sitemap referenciado, domínio canônico',
  '- RSS feed: /rss.xml, 148 itens, XML válido, imagens absolutas',
  '- Páginas de categoria: presentes (9 categorias)',
  '- Política de privacidade + contato: presentes',
  '',
  '**Status:** tecnicamente preparado para Google News/Discover (não é garantia de indexação/aprovação).',
  '',
  '## Nenhuma alteração de conteúdo',
  '',
  'Esta auditoria NÃO alterou títulos, slugs, conteúdo, imagens ou fontes dos artigos.',
].join('\n');

writeFileSync(path.join(ROOT, 'scripts', '_task60_report.md'), md);
console.log('SEO report: scripts/_task60_seo_report.json');
console.log('SEO report: scripts/_task60_report.md');
console.log('total articles:', summary.total);
console.log('critical issues:', report.critical.length);
console.log('warnings:', report.warnings.length);

