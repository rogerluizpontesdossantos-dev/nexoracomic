import { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SearchForm from '@/components/SearchForm';
import SearchResults from '@/components/SearchResults';

export const metadata = {
  title: 'Pesquisar | NexoraComic',
  description: 'Pesquise artigos sobre ciência, tecnologia, espaço e cultura geek no NexoraComic.',
  alternates: {
    canonical: 'https://nexoracomic.com/pesquisar',
  },
};

function SearchResultsFallback() {
  return (
    <div className="mt-8">
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-card border border-border mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-muted-foreground animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <p className="text-muted-foreground">Carregando resultados...</p>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <h1 className="text-4xl font-bold mb-8">Pesquisar</h1>
          
          <SearchForm />
          
          <Suspense fallback={<SearchResultsFallback />}>
            <SearchResults />
          </Suspense>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
