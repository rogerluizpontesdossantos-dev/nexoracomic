import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ArticleCard from '@/components/ArticleCard';
import CategoryCard from '@/components/CategoryCard';
import Newsletter from '@/components/Newsletter';
import { CATEGORIES } from '@/lib/types';
import { DEMONSTRATION_ARTICLES } from '@/lib/articles';

export const metadata = {
  title: 'NexoraComic - Ciência, Tecnologia e Cultura Geek',
  description: 'NexoraComic é uma publicação digital que conecta ciência, tecnologia, espaço, inteligência artificial e cultura geek.',
  alternates: {
    canonical: 'https://nexoracomic.com',
  },
};

// Group articles by category
const articlesByCategory = CATEGORIES.reduce((acc, category) => {
  acc[category.slug] = DEMONSTRATION_ARTICLES.filter(
    (article) => article.category.slug === category.slug
  );
  return acc;
}, {} as Record<string, typeof DEMONSTRATION_ARTICLES>);

const featuredArticle = DEMONSTRATION_ARTICLES[0];
const latestArticles = DEMONSTRATION_ARTICLES.slice(1, 4);

// Category sections with their articles
const categorySections = [
  { title: 'Ciência & Tecnologia', categories: ['ciencia', 'tecnologia'] },
  { title: 'Espaço & IA', categories: ['espaco', 'inteligencia-artificial'] },
  { title: 'Cultura Geek', categories: ['games', 'filmes-series', 'quadrinhos'] },
  { title: 'Futuro & Curiosidades', categories: ['futuro', 'curiosidades'] },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-border">
          <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Main Featured */}
              <div className="lg:col-span-2">
                <ArticleCard article={featuredArticle} variant="featured" />
              </div>
              
              {/* Secondary Featured */}
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <span className="w-1 h-6 bg-primary rounded-full"></span>
                  Últimas Publicações
                </h2>
                {latestArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} variant="compact" />
                ))}
                <Link 
                  href="/pesquisar" 
                  className="text-sm text-primary hover:text-primary/80 transition-colors mt-2"
                >
                  Ver todas as publicações →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Category Sections */}
        {categorySections.map((section, sectionIndex) => {
          const sectionArticles = section.categories.flatMap(
            (cat) => articlesByCategory[cat] || []
          );
          
          if (sectionArticles.length === 0) return null;
          
          return (
            <section key={section.title} className="border-b border-border">
              <div className="container mx-auto px-4 py-8 md:py-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-3">
                    <span 
                      className="w-1 h-8 rounded-full"
                      style={{ backgroundColor: CATEGORIES.find(c => c.slug === section.categories[0])?.color || '#8b5cf6' }}
                    ></span>
                    {section.title}
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sectionArticles.slice(0, 3).map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </div>
            </section>
          );
        })}

        {/* Categories Grid */}
        <section className="border-b border-border">
          <div className="container mx-auto px-4 py-8 md:py-12">
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
              <span className="w-1 h-8 bg-accent rounded-full"></span>
              Explore por Categoria
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CATEGORIES.map((category) => (
                <CategoryCard 
                  key={category.id} 
                  category={category} 
                  articleCount={articlesByCategory[category.slug]?.length || 0}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <Newsletter />
      </main>
      
      <Footer />
    </div>
  );
}
