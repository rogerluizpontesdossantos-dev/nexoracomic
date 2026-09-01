import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ArticleCard from '@/components/ArticleCard';
import { CategoryBreadcrumbs } from '@/components/Breadcrumbs';
import { CATEGORIES, Article } from '@/lib/types';
import { DEMONSTRATION_ARTICLES } from '@/lib/articles';

interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
}

export async function generateStaticParams() {
  return CATEGORIES.map((category) => ({
    category: category.slug,
  }));
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { category: categorySlug } = await params;
  const category = CATEGORIES.find((c) => c.slug === categorySlug);
  
  if (!category) {
    return {
      title: 'Categoria não encontrada',
    };
  }

  return {
    title: category.name,
    description: category.description,
    alternates: {
      canonical: `https://nexoracomic.com/${category.slug}`,
    },
    openGraph: {
      title: `${category.name} | NexoraComic`,
      description: category.description,
      type: 'website',
      url: `https://nexoracomic.com/${category.slug}`,
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `NexoraComic - ${category.name}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${category.name} | NexoraComic`,
      description: category.description,
      images: ['/og-image.png'],
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: categorySlug } = await params;
  const category = CATEGORIES.find((c) => c.slug === categorySlug);

  if (!category) {
    notFound();
  }

  // Filter demonstration articles by category, newest first
  const categoryArticles: Article[] = DEMONSTRATION_ARTICLES.filter(
    (article) => article.category.slug === categorySlug
  ).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://nexoracomic.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: category.name,
        item: `https://nexoracomic.com/${category.slug}`,
      },
    ],
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 py-4">
          <CategoryBreadcrumbs categorySlug={category.slug} categoryName={category.name} />
        </div>

        {/* Category Header */}
        <section className="border-b border-border bg-gradient-to-b from-background to-card/30">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${category.color}15` }}
                >
                  <svg
                    className="w-6 h-6"
                    style={{ color: category.color }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  {category.name}
                </h1>
              </div>
              <p className="text-lg text-muted-foreground">
                {category.description}
              </p>
              
              {categoryArticles.length > 0 && (
                <div className="mt-4">
                  <span 
                    className="px-3 py-1 text-sm font-medium rounded-full"
                    style={{ backgroundColor: `${category.color}15`, color: category.color }}
                  >
                    {categoryArticles.length} {categoryArticles.length === 1 ? 'artigo' : 'artigos'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Articles Grid */}
        <section className="border-b border-border">
          <div className="container mx-auto px-4 py-12">
            {categoryArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div
                    className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
                    style={{ backgroundColor: `${category.color}15` }}
                  >
                    <svg
                      className="w-10 h-10"
                      style={{ color: category.color }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-semibold mb-3">
                    Conteúdo em breve
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Estamos preparando artigos incríveis sobre {category.name.toLowerCase()}.
                    Fique ligado!
                  </p>
                  <div 
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                    style={{ backgroundColor: `${category.color}15`, color: category.color }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    Notificar quando disponível
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      
      <Footer />

      {/* BreadcrumbList JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </div>
  );
}
