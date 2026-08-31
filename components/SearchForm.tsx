'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES } from '@/lib/types';

export default function SearchForm() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const params = new URLSearchParams();
      params.set('q', query);
      if (category) params.set('category', category);
      router.push(`/pesquisar?${params.toString()}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="space-y-4 mb-8">
      <div>
        <label htmlFor="search" className="block text-sm font-medium mb-2">
          Termo de busca
        </label>
        <input
          type="text"
          id="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Digite o que você procura..."
          className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Termo de busca"
        />
      </div>
      
      <div>
        <label htmlFor="category" className="block text-sm font-medium mb-2">
          Categoria (opcional)
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Todas as categorias</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
      
      <button
        type="submit"
        disabled={!query.trim()}
        className="w-full px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Pesquisar
      </button>
    </form>
  );
}