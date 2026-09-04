export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content?: string;
  category: Category;
  tags: string[];
  author: Author;
  publishedAt: string;
  updatedAt?: string;
  featuredImage?: string;
  imageAlt?: string;
  readingTime: number;
  sources?: Source[];
  relatedArticles?: string[];
  meta?: ArticleAutomationMeta;
}

// Metadados de proveniência dos artigos gerados pela automação
// (Radar GTA 6 / Minecraft / Terraria). Formato emitido por
// buildArticle() em lib/auto/pipeline.mjs — registrado em lib/articles.ts.
// Campos extra do pipeline são tolerados via index signature, sem "any".
export interface ArticleAutomationMeta {
  /** ISO timestamp da geração do artigo */
  generatedAt: string;
  /** Identificador do gerador (ex.: "auto-pipeline") */
  generator: string;
  /** Classificação editorial da pauta ("confirmed" | "rumor" | "speculation") */
  classification: string;
  /** Título original da pauta que originou o artigo */
  pautaTitle: string;
  /** URL da fonte original da pauta */
  pautaUrl: string;
  /** Domínio da fonte da pauta */
  pautaSource: string;
  /** Hash interno da pauta (controle anti-duplicação) */
  pautaId: string;
  /** Tópico editorial do radar (gta6 | minecraft | terraria) */
  topic?: string;
  /** Tema de imagem detectado (ex.: "gta6-vice-city"); pode faltar em artigos
   *  gerados quando a busca do Commons não categoriza a imagem */
  imageTheme?: string;
  /** Licença Creative Commons da imagem de capa */
  imageLicense: string;
  /** Autor/artista da imagem de capa */
  imageArtist: string;
  /** URL da página do arquivo no Wikimedia Commons (quando disponível) */
  imageCommonsUrl: string | null;
  /** Query usada na busca da imagem no Commons (quando disponível) */
  imageSearchQuery: string | null;
  /** Pauta completa (formato livre) — compatibilidade com variações do pipeline */
  pauta?: unknown;
  /** Quaisquer campos adicionais emitidos pelo gerador */
  [key: string]: unknown;
}

// Site-wide constants — single source of truth for the canonical domain.
// NOTE: o domínio próprio nexoracomic.com NÃO está registrado/online (sem DNS).
// O deploy ativo é https://nexoracomic.vercel.app — apontar canonical/OG/sitemap
// para um domínio morto quebra indexação e a verificação do AdSense. Quando o
// domínio próprio for conectado na Vercel, basta trocar este valor de volta.
export const SITE_NAME = 'NexoraComic';
export const SITE_URL = 'https://nexoracomic.vercel.app';

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  color: string;
}

export interface Author {
  id: string;
  name: string;
  bio?: string;
  avatar?: string;
}

export interface Source {
  title: string;
  url: string;
  type?: 'journal' | 'agency' | 'university' | 'company' | 'publication' | 'other';
}

export interface NewsletterData {
  email: string;
  consent: boolean;
}

export interface SearchQuery {
  query: string;
  category?: string;
  tags?: string[];
}

export const CATEGORIES: Category[] = [
  {
    id: 'ciencia',
    slug: 'ciencia',
    name: 'Ciência',
    description: 'Biologia, física, química, neurociência e descobertas científicas',
    color: '#8b5cf6'
  },
  {
    id: 'tecnologia',
    slug: 'tecnologia',
    name: 'Tecnologia',
    description: 'Gadgets, computação, cibersegurança, robótica e tecnologia futura',
    color: '#06b6d4'
  },
  {
    id: 'espaco',
    slug: 'espaco',
    name: 'Espaço',
    description: 'Astronomia, NASA, planetas, estrelas e missões espaciais',
    color: '#f59e0b'
  },
  {
    id: 'inteligencia-artificial',
    slug: 'inteligencia-artificial',
    name: 'Inteligência Artificial',
    description: 'IA generativa, ferramentas de IA, pesquisa e futuro da IA',
    color: '#ec4899'
  },
  {
    id: 'futuro',
    slug: 'futuro',
    name: 'Futuro',
    description: 'Tecnologias emergentes, biotecnologia, energia e cidades inteligentes',
    color: '#10b981'
  },
  {
    id: 'games',
    slug: 'games',
    name: 'Games',
    description: 'Notícias de games, tecnologia por trás dos jogos e análise da indústria',
    color: '#ef4444'
  },
  {
    id: 'filmes-series',
    slug: 'filmes-series',
    name: 'Filmes e Séries',
    description: 'Ficção científica, tecnologia no cinema e análise de produções',
    color: '#f97316'
  },
  {
    id: 'quadrinhos',
    slug: 'quadrinhos',
    name: 'Quadrinhos',
    description: 'Comics, super-heróis, ciência nos quadrinhos e adaptações',
    color: '#6366f1'
  },
  {
    id: 'curiosidades',
    slug: 'curiosidades',
    name: 'Curiosidades',
    description: 'Ciência fascinante, tecnologia histórica e descobertas incomuns',
    color: '#14b8a6'
  }
];
