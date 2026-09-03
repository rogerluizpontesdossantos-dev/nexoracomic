import { Article } from '@/lib/types';
import { RadarDuplicateHit, RadarNewsItem } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Regra contra duplicação (MVP):
//   - Compara título+resumo da pauta com título+tags de cada artigo publicado
//     em lib/articles.ts usando similaridade de Jaccard sobre tokens limpos.
//   - score >= DUPLICATE_THRESHOLD  → "DUPLICADO / JÁ COBERTO"
//   - score >= SIMILAR_THRESHOLD    → "ATUALIZAÇÃO / NOVA PAUTA" (assunto
//     relacionado, mas sem cobertura idêntica — pode render artigo novo)
//   - abaixo disso (ou sem match)   → "NOVA PAUTA"
// Os limiares são heurísticos e podem ser calibrados com o uso do painel.
// ─────────────────────────────────────────────────────────────────────────────

export const SIMILAR_THRESHOLD = 0.16;
export const DUPLICATE_THRESHOLD = 0.34;

export type RadarCoverageStatus =
  | 'DUPLICADO / JÁ COBERTO'
  | 'ATUALIZAÇÃO / NOVA PAUTA'
  | 'NOVA PAUTA';

// Palavras vazias PT/EN que não ajudam a comparar assuntos.
const STOPWORDS = new Set([
  'que', 'com', 'para', 'uma', 'como', 'mais', 'sobre', 'isso', 'esse', 'essa',
  'aqui', 'dos', 'das', 'não', 'nao', 'seu', 'sua', 'pelo', 'pela', 'até',
  'ate', 'dele', 'dela', 'mas', 'por', 'ser', 'tem', 'foi', 'vai', 'são',
  'sao', 'sem', 'the', 'and', 'for', 'from', 'with', 'this', 'that', 'how',
  'what', 'why', 'when', 'will', 'can', 'are', 'was', 'were', 'has', 'have',
  'had', 'you', 'your', 'out', 'all', 'get', 'got', 'its', 'his', 'her',
  'who', 'new', 'now', 'one', 'two', 'into', 'over', 'after', 'about',
  'been', 'being', 'than', 'then', 'them', 'they', 'there', 'here', 'just',
  'only', 'most', 'more', 'some', 'such', 'also', 'very', 'much', 'many',
]);

/** Tokeniza texto para comparação: minúsculas, sem acentos e sem stopwords. */
export function tokenize(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function articleTokens(article: Article): string[] {
  return tokenize(`${article.title} ${article.tags.join(' ')}`);
}

function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  setA.forEach((token) => {
    if (setB.has(token)) intersection += 1;
  });
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Encontra a melhor correspondência entre a pauta e os artigos publicados.
 * Retorna `null` quando não há cobertura relevante (→ "NOVA PAUTA").
 */
export function findDuplicateHit(
  title: string,
  summary: string,
  articles: Article[]
): RadarDuplicateHit | null {
  const tokens = tokenize(`${title} ${summary}`);
  if (tokens.length === 0) return null;

  let best: { article: Article; score: number } | null = null;
  for (const article of articles) {
    const score = jaccard(tokens, articleTokens(article));
    if (score > 0 && (!best || score > best.score)) {
      best = { article, score };
    }
  }

  if (!best || best.score < SIMILAR_THRESHOLD) return null;
  return {
    articleId: best.article.id,
    articleTitle: best.article.title,
    articleSlug: best.article.slug,
    url: `/${best.article.category.slug}/${best.article.slug}`,
    score: Number(best.score.toFixed(2)),
    reason: `Semelhança de termos com "${best.article.title}" (score ${best.score.toFixed(2)})`,
  };
}

/** Rótulo de cobertura a partir do hit de duplicação (ou ausência dele). */
export function coverageStatus(item: RadarNewsItem): RadarCoverageStatus {
  if (!item.duplicate) return 'NOVA PAUTA';
  return item.duplicate.score >= DUPLICATE_THRESHOLD
    ? 'DUPLICADO / JÁ COBERTO'
    : 'ATUALIZAÇÃO / NOVA PAUTA';
}
