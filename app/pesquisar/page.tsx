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
};

export default function SearchPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
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
