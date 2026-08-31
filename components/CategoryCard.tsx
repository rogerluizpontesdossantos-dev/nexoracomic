import Link from 'next/link';
import { Category } from '@/lib/types';

interface CategoryCardProps {
  category: Category;
  articleCount?: number;
}

export default function CategoryCard({ category, articleCount = 0 }: CategoryCardProps) {
  return (
    <Link
      href={`/${category.slug}`}
      className="group relative overflow-hidden rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 card-hover"
    >
      <div className="p-6">
        <div
          className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
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
        
        <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
          {category.name}
        </h3>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {category.description}
        </p>
        
        <div className="flex items-center justify-between">
          {articleCount > 0 ? (
            <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: `${category.color}15`, color: category.color }}>
              {articleCount} {articleCount === 1 ? 'artigo' : 'artigos'}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Em breve</span>
          )}
          
          <svg 
            className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
      
      <div
        className="absolute bottom-0 left-0 w-full h-1 group-hover:h-1.5 transition-all duration-300"
        style={{ backgroundColor: category.color }}
      />
    </Link>
  );
}
