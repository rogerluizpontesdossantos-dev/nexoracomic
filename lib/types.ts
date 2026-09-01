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
}

// Site-wide constants — single source of truth for the canonical domain.
// NOTE: nexoracomic.com is the intended production domain. If it is not
// connected in Vercel yet, update SITE_URL to the active domain
// (e.g. https://nexoracomic.vercel.app) so canonical/OG URLs stay valid.
export const SITE_NAME = 'NexoraComic';
export const SITE_URL = 'https://nexoracomic.com';

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
