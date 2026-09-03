import { classifyItem } from './classify';
import { resolveSourceInfo } from './feeds';
import { RadarArticleDraft, RadarFeedResult, RadarNewsItem, RadarSourceRef } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Coleta do Radar GTA 6 (V1) — 100% client-side, sem servidor e sem chave:
//   1. Para cada feed de feeds.ts, consulta a API pública rss2json (CORS
//      liberado), com timeout e tolerância a falha individual;
//   2. Extrai a URL real do artigo de dentro do link de redirecionamento do
//      Bing (apiclick.aspx → parâmetro "url=");
//   3. Classifica a pauta (classify.ts) e resolve o tier da fonte (feeds.ts).
// Nada aqui publica nada: a saída é apenas a lista exibida no painel privado.
// ─────────────────────────────────────────────────────────────────────────────

const RSS2JSON_ENDPOINT = 'https://api.rss2json.com/v1/api.json';
const FETCH_TIMEOUT_MS = 12_000;

interface Rss2JsonItem {
  title?: string;
  pubDate?: string;
  link?: string;
  description?: string;
  content?: string;
  thumbnail?: string;
  guid?: string;
}

interface Rss2JsonResponse {
  status?: string;
  message?: string;
  feed?: { title?: string };
  items?: Rss2JsonItem[];
}

/** Extrai a URL real do artigo de dentro do redirect do Bing News. */
export function extractRealUrl(link: string): string {
  if (!link) return '';
  try {
    const url = new URL(link);
    const inner = url.searchParams.get('url');
    if (inner && /^https?:\/\//i.test(inner)) return inner;
  } catch {
    // link malformado — devolve o original
  }
  return link;
}

/** Domínio limpo da URL real (sem "www."). */
export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

function hashId(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0; // converte para int32
  }
  return `r${Math.abs(hash).toString(36)}`;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "2026-09-03 08:32:00" (UTC do rss2json) → ISO 8601 com "Z". */
function toIso(pubDate: string): string {
  if (!pubDate) return '';
  const normalized = pubDate.trim().replace(' ', 'T');
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(normalized);
  return new Date(hasZone ? normalized : `${normalized}Z`).toISOString();
}

async function fetchFeed(url: string): Promise<Rss2JsonItem[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    // rss2json: o parâmetro "count" exige chave de API (sem ela responde HTTP
    // 422). Sem "count", o serviço público retorna os itens padrão do feed.
    const endpoint = `${RSS2JSON_ENDPOINT}?rss_url=${encodeURIComponent(url)}`;
    const res = await fetch(endpoint, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as Rss2JsonResponse;
    if (data.status !== 'ok') throw new Error(data.message || 'feed indisponível');
    return Array.isArray(data.items) ? data.items : [];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Busca todos os feeds e monta a lista de pautas já classificadas.
 * Falhas individuais de feed viram avisos (exibidos no painel), não erros fatais.
 */
export async function fetchRadarItems(
  feeds: { id: string; label: string; url: string }[]
): Promise<RadarFeedResult> {
  const byId = new Map<string, RadarNewsItem>();
  const warnings: string[] = [];

  const results = await Promise.allSettled(
    feeds.map(async (feed) => ({ feed, items: await fetchFeed(feed.url) }))
  );

  for (const result of results) {
    if (result.status === 'rejected') {
      warnings.push(`Feed falhou: ${String(result.reason?.message || result.reason)}`);
      continue;
    }
    const { feed, items } = result.value;
    for (const raw of items) {
      const title = stripHtml(raw.title || '');
      const summary = stripHtml(raw.description || raw.content || '');
      const url = extractRealUrl(raw.link || '');
      if (!title || !url) continue;

      const domain = domainOf(url);
      const info = resolveSourceInfo(domain);
      const { classification, signals } = classifyItem(title, summary, info.tier);

      const item: RadarNewsItem = {
        id: hashId(url),
        title,
        publishedAt: toIso(raw.pubDate || ''),
        source: feed.label.replace(/^Bing News \((.*)\)$/, '$1'),
        sourceDomain: domain,
        url,
        summary,
        classification,
        classificationSignals: signals,
        tier: info.tier,
        tierLabel: info.label,
        sourceType: info.sourceType,
      };
      // Dedup entre feeds: mesma URL real aparece uma vez só.
      const existing = byId.get(item.id);
      if (!existing || item.tier < existing.tier) byId.set(item.id, item);
    }
  }

  const items = [...byId.values()].sort((a, b) => {
    const da = new Date(a.publishedAt || 0).getTime();
    const db = new Date(b.publishedAt || 0).getTime();
    return db - da;
  });

  return { items, warnings };
}

/** Rascunho de esqueleto da pauta, para colar no editor e escrever por cima. */
export function buildDraft(
  item: RadarNewsItem,
  duplicate: RadarNewsItem['duplicate']
): RadarArticleDraft {
  const today = new Date().toISOString().slice(0, 10);
  const source: RadarSourceRef = {
    title: `${item.sourceDomain} — ${item.title}`,
    url: item.url,
    type: item.sourceType,
  };
  const status = !duplicate
    ? 'NOVA PAUTA'
    : duplicate.score >= 0.34
      ? 'DUPLICADO / JÁ COBERTO'
      : 'ATUALIZAÇÃO / NOVA PAUTA';
  const slugSeed = item.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);

  return {
    slug: slugSeed || `gta-6-${today}`,
    title: item.title,
    excerpt: item.summary,
    content: [
      `<h2>${item.title}</h2>`,
      `<p>${item.summary}</p>`,
      `<p><strong>Status da pauta:</strong> ${status} · <strong>Fonte:</strong> ${item.tierLabel} (${item.sourceDomain}) · <strong>Link:</strong> ${item.url}</p>`,
      duplicate
        ? `<p><strong>Cobertura existente:</strong> <a href="${duplicate.url}">${duplicate.articleTitle}</a> (score ${duplicate.score}) — não repetir; buscar ângulo novo ou descartar.</p>`
        : '<p><strong>Cobertura existente:</strong> nenhuma correspondência relevante no NexoraComic.</p>',
      '<h2>Roteiro sugerido</h2>',
      '<ul><li>O que aconteceu (fatos confirmados)</li><li>Contexto no caminho até o lançamento de GTA 6</li><li>O que ainda não foi confirmado</li><li>Conclusão</li></ul>',
      '<h2>Conclusão</h2>',
      '<p>[Escrever a conclusão.]</p>',
    ].join('\n'),
    tags: ['GTA 6', 'Rockstar Games', 'games'],
    featuredImage: '',
    imageAlt: item.title,
    readingTime: 5,
    publishedAt: today,
    sources: [source],
    meta: {
      generatedAt: new Date().toISOString(),
      generator: 'template',
      classification: item.classification,
      pautaTitle: item.title,
      pautaUrl: item.url,
      pautaSource: item.sourceDomain,
    },
  };
}

