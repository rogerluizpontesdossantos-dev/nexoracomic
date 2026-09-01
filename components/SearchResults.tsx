'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { DEMONSTRATION_ARTICLES } from '@/lib/articles';

export default function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const categoryFilter = searchParams.get('category') || '';

  const results = useMemo(() => {
    if (!query.trim()) return [];
    
    const searchTerm = query.toLowerCase();
    
    return DEMONSTRATION_ARTICLES.filter((article) => {
      const matchesQuery = 
        article.title.toLowerCase().includes(searchTerm) ||
        article.excerpt.toLowerCase().includes(searchTerm) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        article.category.name.toLowerCase().includes(searchTerm);
      
      const matchesCategory = !categoryFilter || article.category.slug === categoryFilter;
      
      return matchesQuery && matchesCategory;
    });
  }, [query, categoryFilter]);

  if (!query.trim()) {
    return (
      <div className="mt-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-card border border-border mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Pesquise por artigos</h2>
          <p className="text-muted-foreground">
            Digite um termo de busca acima para encontrar artigos sobre ciência, tecnologia e cultura geek.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted-foreground">
          {results.length > 0 ? (
            <>
              <span className="font-medium text-foreground">{results.length}</span>
              {results.length === 1 ? ' resultado encontrado' : ' resultados encontrados'}
              {' '}para &quot;<span className="font-medium text-foreground">{query}</span>&quot;
            </>
          ) : (
            <>Nenhum resultado para &quot;<span className="font-medium text-foreground">{query}</span>&quot;</>
          )}
        </p>
      </div>

      {results.length > 0 ? (
        <div className="space-y-4">
          {results.map((article) => (
            <article 
              key={article.id}
              className="p-5 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
            >
              <Link href={`/${article.category.slug}/${article.slug}`} className="block">
                <div className="flex items-center gap-2 mb-2">
                  <span 
                    className="px-2 py-0.5 text-xs font-medium rounded-full"
                    style={{ backgroundColor: `${article.category.color}15`, color: article.category.color }}
                  >
                    {article.category.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{article.readingTime} min de leitura</span>
                </div>
                
                <h3 className="text-lg font-semibold mb-2 hover:text-primary transition-colors">
                  {article.title}
                </h3>
                
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {article.excerpt}
                </p>
                
                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                  <span>{article.author.name}</span>
                  <span>•</span>
                  <time dateTime={article.publishedAt}>
                    {new Date(article.publishedAt).toLocaleDateString('pt-BR')}
                  </time>
                </div>
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-card border border-border mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Nenhum resultado encontrado</h2>
          <p className="text-muted-foreground mb-4">
            Tente usar termos diferentes ou verifique a ortografia.
          </p>
          <Link 
            href="/pesquisar" 
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Limpar busca
          </Link>
        </div>
      )}
    </div>
  );
}