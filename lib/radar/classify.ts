import { RadarClassification } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Classificação editorial da pauta (🟢 fato / 🟡 rumor / 🔵 especulação)
// baseada em marcadores visíveis no título/resumo do item do feed.
// O painel sempre mostra os marcadores que motivaram a classificação.
// Nada aqui transforma rumor em fato: sem marcadores, o item cai em
// "confirmed" apenas quando a fonte é oficial (tier 1–2); fontes de notícias
// com linguagem factual também entram como 🟢, e itens ambíguos como 🔵.
// ─────────────────────────────────────────────────────────────────────────────

const RUMOR_MARKERS: RegExp[] = [
  /\brumores?\b/i,
  /\brumored\b/i,
  /\brumour(s|ed)?\b/i,
  /\balega\b/i,
  /\balegado\b/i,
  /\bsuposto\b/i,
  /\bsuposta\b/i,
  /\baparentemente\b/i,
  /\bposs[ií]vel(mente)?\b/i,
  /\bins?inua\b/i,
  /\bnão oficial\b/i,
  /\bsem confirmação\b/i,
  /\bunconfirmed\b/i,
  /\bunverified\b/i,
  /\balleged(ly)?\b/i,
  /\breported(?:ly)?\b/i,
  /\bclaims?\b/i,
  /\bsuggests?\b/i,
  /\bsuspected\b/i,
  /\bvazamento\b/i,
  /\bvazou\b/i,
  /\bleak(ed|s)?\b/i,
];

const SPECULATION_MARKERS: RegExp[] = [
  /\bespecul(a|ações|ação)\b/i,
  /\bespera(-se)?\b/i,
  /\bdeva\b/i,
  /\bdeverá\b/i,
  /\bprovável\b/i,
  /\btendência\b/i,
  /\bpode ser que\b/i,
  /\bimagina(?:se|-se)?\b/i,
  /\bspecul(?:ation|ative|ates?|ating)\b/i,
  /\bprediction|predicts?\b/i,
  /\bwhat if\b/i,
  /\bexpected to\b/i,
  /\blikely\b/i,
  /\bcould\b/i,
  /\bmay\b/i,
  /\bmight\b/i,
  /\bwould\b/i,
  /\bhopes? to\b/i,
  /\bplans? to\b/i,
];

/**
 * Classifica o item do feed.
 * Regra do MVP: marcadores de rumor vencem especulação; sem marcadores,
 * fontes oficiais/tier alto saem como fato confirmado.
 */
export function classifyItem(
  title: string,
  summary: string,
  tier: number
): { classification: RadarClassification; signals: string[] } {
  const text = `${title} ${summary}`;
  const rumorHits = RUMOR_MARKERS.filter((r) => r.test(text)).map((r) => r.source);
  const specHits = SPECULATION_MARKERS.filter((r) => r.test(text)).map((r) => r.source);

  // Fonte oficial (Rockstar/oficiais) anunciando algo: fato confirmado
  if (tier === 1 || tier === 2) {
    return {
      classification: 'confirmed',
      signals: ['anúncio de fonte oficial (tier 1–2)'],
    };
  }

  if (rumorHits.length > 0) {
    return { classification: 'rumor', signals: rumorHits };
  }

  if (specHits.length > 0) {
    return { classification: 'speculation', signals: specHits };
  }

  // Fontes especializadas/jornalísticas com linguagem factual: fato confirmado
  if (tier === 3 || tier === 4) {
    return {
      classification: 'confirmed',
      signals: ['linguagem factual em fonte especializada/jornalística (tier 3–4)'],
    };
  }

  // Fonte desconhecida/agregador: trate como especulação até verificar
  return {
    classification: 'speculation',
    signals: ['fonte não reconhecida — verificar antes de usar'],
  };
}
