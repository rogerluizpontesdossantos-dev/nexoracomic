import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CategoryCard from '@/components/CategoryCard';
import { CATEGORIES } from '@/lib/types';
import { DEMONSTRATION_ARTICLES } from '@/lib/articles';

export const metadata = {
  title: 'Categorias',
  description: 'Explore todas as categorias de conteúdo da NexoraComic: ciência, tecnologia, espaço, inteligência artificial, games, filmes, quadrinhos e muito mais.',
  alternates: {
    canonical: '/categorias',
  },
};

// Group articles by category
const articlesByCategory = CATEGORIES.reduce((acc, category) => {
  acc[category.slug] = DEMONSTRATION_ARTICLES.filter(
    (article) => article.category.slug === category.slug
  );
  return acc;
}, {} as Record<string, typeof DEMONSTRATION_ARTICLES>);

export default function CategoriesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        {/* Header Section */}
        <section className="border-b border-border bg-gradient-to-b from-background to-card/30">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Categorias
              </h1>
              <p className="text-xl text-muted-foreground">
                Explore todo o nosso conteúdo organizado por tema. De ciência e tecnologia até cultura geek e curiosidades.
              </p>
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="border-b border-border">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

        {/* Stats Section */}
        <section className="border-b border-border bg-card/30">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {CATEGORIES.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Categorias
                </div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-accent mb-2">
                  {DEMONSTRATION_ARTICLES.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Artigos
                </div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-[#d4af37] mb-2">
                  {DEMONSTRATION_ARTICLES.reduce((acc, article) => acc + article.readingTime, 0)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Minutos de leitura
                </div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-green-500 mb-2">
                  {new Set(DEMONSTRATION_ARTICLES.flatMap(a => a.tags)).size}
                </div>
                <div className="text-sm text-muted-foreground">
                  Tags únicas
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
