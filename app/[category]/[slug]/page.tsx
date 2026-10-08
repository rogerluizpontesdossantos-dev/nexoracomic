import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import { ArticleBreadcrumbs } from '@/components/Breadcrumbs';
import ArticleCard from '@/components/ArticleCard';
import { Article, SITE_NAME, SITE_URL } from '@/lib/types';
import { DEMONSTRATION_ARTICLES } from '@/lib/articles';
import AdSlot from '@/components/AdSlot';
import AffiliateBlock from '@/components/AffiliateBlock';
import { AffiliateClickTracker } from '@/components/AffiliateClickTracker';

interface ArticlePageProps {
  params: Promise<{
    category: string;
    slug: string;
  }>;
}

const getArticle = (category: string, slug: string): Article | null => {
  return DEMONSTRATION_ARTICLES.find(
    (article) => article.category.slug === category && article.slug === slug
  ) || null;
};

// Related articles: same category first (excluding current), then newest
// from other categories to complete the row. Uses only real content.
const getRelatedArticles = (current: Article, limit = 3): Article[] => {
  const sameCategory = DEMONSTRATION_ARTICLES.filter(
    (a) => a.category.slug === current.category.slug && a.id !== current.id
  );
  const others = DEMONSTRATION_ARTICLES.filter(
    (a) => a.category.slug !== current.category.slug && a.id !== current.id
  );
  return [...sameCategory, ...others].slice(0, limit);
};

export async function generateStaticParams() {
  return DEMONSTRATION_ARTICLES.map((article) => ({
    category: article.category.slug,
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const article = getArticle(category, slug);
  
  if (!article) {
    return {
      title: 'Artigo não encontrado',
    };
  }

  const url = `${SITE_URL}/${article.category.slug}/${article.slug}`;
  // Imagem social: capa do artigo (TASK 61-A) ou fallback do site.
  const image = article.featuredImage ?? '/og-image.png';

  return {
    title: article.title,
    description: article.excerpt,
    authors: [{ name: article.author.name }],
    keywords: article.tags,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'article',
      siteName: SITE_NAME,
      locale: 'pt_BR',
      url,
      title: article.title,
      description: article.excerpt,
      images: [{ url: image, alt: article.imageAlt || article.title }],
      publishedTime: article.publishedAt,
      // Sem updatedAt real, não emitir modifiedTime (evita data inventada).
      ...(article.updatedAt ? { modifiedTime: article.updatedAt } : {}),
      authors: [article.author.name],
      section: article.category.name,
      tags: article.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: [image],
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { category, slug } = await params;
  const article = getArticle(category, slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = getRelatedArticles(article, 3);

  const articleUrl = `${SITE_URL}/${article.category.slug}/${article.slug}`;

  // Schema.org "Article" (não "NewsArticle"): o NexoraComic publica
  // análises e textos editoriais de ciência/tecnologia/cultura, não
  // notícias breaking. Usar NewsArticle aqui seria imjustificado.
  // dateModified = updatedAt quando existir; caso contrário permanece
  // igual à publicação (nenhuma data é inventada).
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': articleUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
      url: articleUrl,
    },
    url: articleUrl,
    headline: article.title,
    description: article.excerpt,
    image: article.featuredImage ? [article.featuredImage] : [`${SITE_URL}/og-image.png`],
    inLanguage: 'pt-BR',
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    // A autoria é de uma equipe editorial (organização), não uma pessoa real:
    // declarar "Person" seria inventar autoria individual.
    author: {
      '@type': 'Organization',
      name: article.author.name,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo-icon.svg`,
        width: 512,
        height: 512,
      },
    },
    articleSection: article.category.name,
    keywords: article.tags?.length ? article.tags.join(', ') : undefined,
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: article.category.name,
        item: `${SITE_URL}/${article.category.slug}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.title,
        item: `${SITE_URL}/${article.category.slug}/${article.slug}`,
      },
    ],
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main id="main-content" className="flex-1">
        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 py-4">
          <ArticleBreadcrumbs
            categorySlug={article.category.slug}
            categoryName={article.category.name}
            articleTitle={article.title}
            articleSlug={article.slug}
          />
        </div>

        <article className="max-w-4xl mx-auto px-4 py-12">
          {/* Category Badge */}
          <Link
            href={`/${article.category.slug}`}
            className="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-full mb-6 transition-colors"
            style={{ backgroundColor: `${article.category.color}15`, color: article.category.color }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            {article.category.name}
          </Link>

          {/* Article Header */}
          <header className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-4 leading-tight">
              {article.title}
            </h1>
            
            <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
              {article.excerpt}
            </p>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {article.author.name.charAt(0)}
                  </span>
                </div>
                <span className="font-medium text-foreground">{article.author.name}</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <time dateTime={article.publishedAt}>
                {new Date(article.publishedAt).toLocaleDateString('pt-BR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </time>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {article.readingTime} min de leitura
              </span>
            </div>
          </header>

          {/* Featured Image */}
          {article.featuredImage && (
            <figure className="mb-10">
              <div className="relative rounded-xl overflow-hidden">
                <img
                  src={article.featuredImage}
                  alt={article.imageAlt || article.title}
                  className="w-full"
                  loading="eager"
                />
              </div>
              {article.imageAlt && (
                <figcaption className="text-sm text-muted-foreground mt-3 text-center italic">
                  {article.imageAlt}
                </figcaption>
              )}
            </figure>
          )}

          {/* Article Content */}
          <div className="prose">
            {article.content && (
              <div dangerouslySetInnerHTML={{ __html: article.content }} />
            )}
          </div>

          {/* Bloco de afiliados (TASK 6AQ). Condicional: hoje `article.affiliate`
              é undefined nos 176 artigos, então este componente retorna null
              e nada é renderizado. */}
          <AffiliateBlock affiliate={article.affiliate} category={article.category.slug} />
          <AffiliateClickTracker slug={`${article.category.slug}/${article.slug}`} category={article.category.slug} />

          {/* Ad placeholder — disabled until AdSense approval (AdSlot renders null) */}
          <AdSlot slot="article-bottom" size="rectangle" className="mt-12" />

          {/* Sources */}
          {article.sources && article.sources.length > 0 && (
            <section className="mt-12 pt-8 border-t border-border" aria-labelledby="sources-heading">
              <h2 id="sources-heading" className="text-xl font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Fontes e referências
              </h2>
              <ul className="space-y-3">
                {article.sources.map((source, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-accent mt-1 flex-shrink-0">•</span>
                    <div className="flex-1">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-accent hover:text-accent/80 transition-colors underline decoration-dotted underline-offset-2"
                      >
                        {source.title}
                      </a>
                      {source.publisher && (
                        <span className="text-sm text-muted-foreground ml-2">
                          — {source.publisher}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <section className="mt-8 pt-8 border-t border-border">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-sm rounded-full bg-card border border-border hover:border-primary/50 transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}
        </article>

        {/* Related Articles */}
        <section
          className="container mx-auto px-4 py-12 border-t border-border"
          aria-labelledby="related-heading"
        >
          <h2 id="related-heading" className="section-title text-foreground mb-6 flex items-center gap-3">
            <span className="w-1.5 h-8 bg-gold rounded-full"></span>
            Você também pode gostar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map((rel) => (
              <ArticleCard key={rel.id} article={rel} />
            ))}
          </div>
        </section>

        {/* Newsletter CTA */}
        <Newsletter />
      </main>
      
      <Footer />

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* BreadcrumbList JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </div>
  );
}
