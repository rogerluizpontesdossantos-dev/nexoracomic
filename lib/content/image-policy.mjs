/**
 * lib/content/image-policy.mjs — política de URLs de capa (TASK 61-A, FASE 11)
 *
 * Módulo puro e isolado: nenhuma dependência de rede, framework ou automação.
 * Serve para bloquear novas capas inválidas (source.unsplash.com, URL vazia,
 * extensão/tipo obviamente inválido, HTTP em vez de HTTPS e larguras de
 * thumbnail do Wikimedia que o MediaWiki rejeita).
 *
 * Uso: import { validateImageUrl, validateArticles } from '../lib/content/image-policy.mjs'
 */

// Hosts descontinuados/placeholder que nunca devem virar capa.
export const BLOCKED_HOSTS = [
  'source.unsplash.com',
  'lorempixel.com',
  'placehold.co',
  'placeholder.com',
  'via.placeholder.com',
  'placekitten.com',
  'dummyimage.com',
  'lorempicsum.com',
  'picsum.photos',
  'example.com',
];

// Extensões aceitas quando a URL expõe um sufixo de arquivo.
export const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'svg'];

// Larguras de thumbnail aceitas pelo MediaWiki (T414805 / $wgThumbnailSteps).
// Outras larguras retornam HTTP 400 ao serem acessadas diretamente.
export const WIKIMEDIA_THUMB_WIDTHS = [20, 40, 60, 120, 250, 330, 500, 960, 1280, 1920, 3840];

function hostOf(url) {
  try { return new URL(url).hostname.toLowerCase(); } catch { return ''; }
}

function extensionOf(url) {
  try {
    const last = decodeURIComponent(new URL(url).pathname.split('/').pop() || '');
    const m = /\.([a-z0-9]{2,5})$/i.exec(last);
    return m ? m[1].toLowerCase() : null;
  } catch { return null; }
}

/**
 * Valida uma URL de capa de forma estática (sem rede).
 * @param {string} url
 * @param {{ id?: string }} [ctx]
 * @returns {{ ok: boolean, errors: string[], warnings: string[] }}
 */
export function validateImageUrl(url, ctx = {}) {
  const errors = [];
  const warnings = [];
  const label = ctx.id ? `artigo ${ctx.id}` : 'artigo';

  if (url == null || String(url).trim() === '') {
    errors.push(`${label}: featuredImage ausente ou vazia`);
    return { ok: false, errors, warnings };
  }
  const value = String(url).trim();

  if (!/^https?:\/\//i.test(value)) {
    errors.push(`${label}: URL de capa não é absoluta (http/https): ${value.slice(0, 80)}`);
    return { ok: false, errors, warnings };
  }
  if (/^http:\/\//i.test(value)) {
    errors.push(`${label}: capa deve usar HTTPS, não HTTP: ${value.slice(0, 80)}`);
  }

  const host = hostOf(value);
  if (!host) errors.push(`${label}: host inválido em ${value.slice(0, 80)}`);
  if (BLOCKED_HOSTS.includes(host)) {
    errors.push(`${label}: host bloqueado para capas (descontinuado/placeholder): ${host}`);
  }
  if (host === 'upload.wikimedia.org' || host === 'thumb.wikimedia.org') {
    const last = decodeURIComponent(value.split('/').pop() || '');
    const width = /^(\d+)px-/.exec(last);
    if (width && !WIKIMEDIA_THUMB_WIDTHS.includes(Number(width[1]))) {
      errors.push(
        `${label}: largura de thumbnail do Wikimedia não suportada (${width[1]}px). ` +
          `Use uma de: ${WIKIMEDIA_THUMB_WIDTHS.join(', ')}`
      );
    }
  }

  const ext = extensionOf(value);
  if (ext && !ALLOWED_EXTENSIONS.includes(ext)) {
    errors.push(`${label}: extensão de arquivo não suportada como capa: .${ext}`);
  }
  if (!ext) {
    warnings.push(`${label}: URL sem extensão de arquivo — confirmar Content-Type de imagem antes de publicar`);
  }
  if (/\s/.test(value)) {
    warnings.push(`${label}: URL contém espaços não codificados`);
  }

  return { ok: errors.length === 0, errors, warnings };
}

/**
 * Valida a lista completa de artigos.
 * @param {Array<{id?: string, slug?: string, featuredImage?: string}>} articles
 */
export function validateArticles(articles) {
  const errors = [];
  const warnings = [];
  for (const a of articles || []) {
    const r = validateImageUrl(a && a.featuredImage, { id: (a && a.id) || '?' });
    errors.push(...r.errors);
    warnings.push(...r.warnings);
  }
  return { ok: errors.length === 0, articles: (articles || []).length, errors, warnings };
}

const imagePolicy = { validateImageUrl, validateArticles };
export default imagePolicy;
