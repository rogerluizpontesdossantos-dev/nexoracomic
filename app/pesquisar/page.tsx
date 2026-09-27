import { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SearchForm from '@/components/SearchForm';
import SearchResults from '@/components/SearchResults';

export const metadata = {
  title: 'Pesquisar',
  description: 'Pesquise artigos sobre ciência, tecnologia, espaço e cultura geek no NexoraComic.',
  alternates: {
    canonical: '/pesquisar',
  },
  // Página de busca interna: os resultados são gerados por query string
  // (?q=...) e não constituem conteúdo editorial próprio. Marcamos
  // noindex, follow (não nofollow) para que os links de artigos continuem
  // sendo rastreados pelos crawlers, evitando que URLs de resultado sem
  // valor editorial entrem no índice.
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
  },
};

export default function SearchPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main id="main-content" className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <h1 className="text-4xl font-bold mb-8">Pesquisar</h1>
          
          <SearchForm />

          <Suspense
            fallback={
              <div className="mt-8 text-center py-12 text-muted-foreground" aria-live="polite">
                Carregando resultados…
              </div>
            }
          >
            <SearchResults />
          </Suspense>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
