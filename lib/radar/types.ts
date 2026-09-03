// ─────────────────────────────────────────────────────────────────────────────
// Radar GTA 6 — V1/MVP (painel privado em /admin/radar)
// Tipos exclusivos da ferramenta de curadoria. NÃO altera o modelo Article
// de lib/types.ts — o rascunho gerado aqui produz um `Article` padrão.
// ─────────────────────────────────────────────────────────────────────────────

/** Classificação editorial da pauta, exibida como chip no painel. */
export type RadarClassification = 'confirmed' | 'rumor' | 'speculation';

/** Tier da fonte — segue a prioridade pedida para o MVP. */
export type RadarSourceTier = 1 | 2 | 3 | 4 | 5;

export interface RadarNewsItem {
  /** Identificador estável do item (hash do link real). */
  id: string;
  title: string;
  /** Data de publicação (ISO) ou string vazia se o feed não trouxer. */
  publishedAt: string;
  /** Nome do veículo (ex.: "Polygon", "TechTudo"). */
  source: string;
  /** Domínio do veículo (ex.: "polygon.com"). */
  sourceDomain: string;
  /** URL real do artigo (extraída do link de redirecionamento do feed). */
  url: string;
  /** Resumo curto vindo do feed. */
  summary: string;
  classification: RadarClassification;
  /** Indicadores editoriais que motivaram a classificação. */
  classificationSignals: string[];
  tier: RadarSourceTier;
  /** Rótulo legível do tier da fonte. */
  tierLabel: string;
  /** Tipo a ser gravado em `Source.type` do artigo (lib/types.ts). */
  sourceType: 'journal' | 'agency' | 'university' | 'company' | 'publication' | 'other';
  /** Pauta que já parece coberta por artigo publicado no NexoraComic. */
  duplicate?: RadarDuplicateHit;
}

export interface RadarDuplicateHit {
  articleId: string;
  articleTitle: string;
  articleSlug: string;
  url: string;
  /** Métrica que disparou o alerta (0–1). */
  score: number;
  reason: string;
}

export interface RadarSourceRef {
  title: string;
  url: string;
  type: 'journal' | 'agency' | 'university' | 'company' | 'publication' | 'other';
}

/** Rascunho de artigo — estrutura espelha `Article` de lib/types.ts. */
export interface RadarArticleDraft {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  featuredImage: string;
  imageAlt: string;
  readingTime: number;
  publishedAt: string;
  sources: RadarSourceRef[];
  /** Metadados da pauta de origem (não vão para lib/articles.ts). */
  meta: {
    generatedAt: string;
    generator: 'template' | 'ai';
    classification: RadarClassification;
    pautaTitle: string;
    pautaUrl: string;
    pautaSource: string;
  };
}

export interface RadarFeedResult {
  items: RadarNewsItem[];
  /** Avisos de feeds que falharam (o painel exibe como aviso amarelo). */
  warnings: string[];
}
