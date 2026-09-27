import { MetadataRoute } from 'next';
import { CATEGORIES, SITE_URL } from '@/lib/types';
import { DEMONSTRATION_ARTICLES } from '@/lib/articles';

export const dynamic = 'force-static';

/** Converte uma data ISO do conteúdo em Date, ou undefined se ausente/inválida. */
function toDate(iso: string | undefined | null): Date | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Data real de publicação/atualização de um artigo (nunca a data do build). */
function articleDate(article: (typeof DEMONSTRATION_ARTICLES)[number]): Date | undefined {
  return toDate(article.updatedAt) ?? toDate(article.publishedAt);
}

/** Data real mais recente de uma categoria (a data do artigo mais novo dela). */
function categoryDate(slug: string): Date | undefined {
  const dates = DEMONSTRATION_ARTICLES
    .filter((a) => a.category.slug === slug)
    .map(articleDate)
    .filter((d): d is Date => Boolean(d))
    .sort((a, b) => b.getTime() - a.getTime());
  return dates[0];
}

/** Entrada de sitemap; lastModified só é emitido quando há data real conhecida. */
function entry(
  path: string,
  options: {
    lastModified?: Date;
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
    priority: number;
  }
): MetadataRoute.Sitemap[number] {
  const item: MetadataRoute.Sitemap[number] = {
    url: `${SITE_URL}${path}`,
    changeFrequency: options.changeFrequency,
    priority: options.priority,
  };
  // Só inclui lastModified quando existe data real do conteúdo.
  // Omitir é preferível a emitir new Date(), que faria toda página parecer
  // alterada na data do build.
  if (options.lastModified) item.lastModified = options.lastModified;
  return item;
}

export default function sitemap(): MetadataRoute.Sitemap {
  // Data real do conteúdo mais recente do site.
  const latestArticleDate = DEMONSTRATION_ARTICLES.map(articleDate)
    .filter((d): d is Date => Boolean(d))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  // Páginas estáticas sem data real de alteração: lastModified é omitido
  // deliberadamente (nada de inventar datas).
  const staticRoutes: MetadataRoute.Sitemap = [
    entry('/', { lastModified: latestArticleDate, changeFrequency: 'daily', priority: 1 }),
    entry('/categorias', { changeFrequency: 'weekly', priority: 0.7 }),
    entry('/creditos-imagens', { changeFrequency: 'monthly', priority: 0.2 }),
    entry('/sobre', { changeFrequency: 'monthly', priority: 0.5 }),
    entry('/contato', { changeFrequency: 'monthly', priority: 0.3 }),
    entry('/politica-de-privacidade', { changeFrequency: 'yearly', priority: 0.1 }),
    entry('/termos-de-uso', { changeFrequency: 'yearly', priority: 0.1 }),
  ];

  // Categorias — data = artigo mais recente da categoria.
  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((category) =>
    entry(`/${category.slug}`, {
      lastModified: categoryDate(category.slug),
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  );

  // Artigos — data real de publicação (ou atualização, quando existir).
  const articleRoutes: MetadataRoute.Sitemap = DEMONSTRATION_ARTICLES.map((article) =>
    entry(`/${article.category.slug}/${article.slug}`, {
      lastModified: articleDate(article),
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  );

  // Remove duplicatas por URL, preservando a primeira ocorrência.
  const seen = new Set<string>();
  const all = [...staticRoutes, ...categoryRoutes, ...articleRoutes];
  return all.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}
