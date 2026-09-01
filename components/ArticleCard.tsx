import Link from 'next/link';
import { Article } from '@/lib/types';

interface ArticleCardProps {
  article: Article;
  variant?: 'default' | 'featured' | 'compact';
}

export default function ArticleCard({ article, variant = 'default' }: ArticleCardProps) {
  if (variant === 'compact') {
    return (
      <article className="flex gap-3 group">
        <Link href={`/${article.category.slug}/${article.slug}`} className="flex-shrink-0">
          {article.featuredImage && (
            <div className="relative w-20 h-20 overflow-hidden rounded-lg bg-card">
              <img
                src={article.featuredImage}
                alt={article.imageAlt || article.title}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
          )}
        </Link>
                  <div className="flex flex-col gap-1 min-w-0">
          <Link
            href={`/${article.category.slug}`}
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {article.category.name}
          </Link>
          <Link href={`/${article.category.slug}/${article.slug}`} className="group">
            <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
              {article.title}
            </h3>
          </Link>
          <span className="text-xs text-muted-foreground">
            {article.readingTime} min
          </span>
        </div>
      </article>
    );
  }

  if (variant === 'featured') {
    return (
      <article className="group h-full">
        <Link href={`/${article.category.slug}/${article.slug}`} className="block h-full">
          <div className="relative h-full overflow-hidden rounded-xl bg-card border border-border">
            {/* Image */}
            {article.featuredImage && (
              <div className="relative h-64 md:h-80 overflow-hidden">
                <img
                  src={article.featuredImage}
                  alt={article.imageAlt || article.title}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              </div>
            )}
            
            {/* Content overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-center gap-2 mb-3">
                <span 
                  className="px-2 py-1 text-xs font-medium rounded-full"
                  style={{ backgroundColor: `${article.category.color}20`, color: article.category.color }}
                >
                  {article.category.name}
                </span>
                <span className="text-xs text-gray-300">{article.readingTime} min de leitura</span>
              </div>
              
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {article.title}
              </h2>
              
              <p className="text-sm text-gray-300 line-clamp-2 mb-3">
                {article.excerpt}
              </p>
              
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>{article.author.name}</span>
                <span>•</span>
                <time dateTime={article.publishedAt}>
                  {new Date(article.publishedAt).toLocaleDateString('pt-BR')}
                </time>
              </div>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  // Default variant
  return (
    <article className="group h-full">
      <Link href={`/${article.category.slug}/${article.slug}`} className="block h-full">
        <div className="h-full overflow-hidden rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 card-hover">
          {/* Image */}
          {article.featuredImage && (
            <div className="relative h-48 overflow-hidden">
              <img
                src={article.featuredImage}
                alt={article.imageAlt || article.title}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute top-3 left-3">
                <span 
                  className="px-2 py-1 text-xs font-medium rounded-full bg-black/60 backdrop-blur-sm"
                  style={{ color: article.category.color }}
                >
                  {article.category.name}
                </span>
              </div>
            </div>
          )}
          
          {/* Content */}
          <div className="p-5 flex flex-col flex-1">
            <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
              {article.title}
            </h3>
            
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
              {article.excerpt}
            </p>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-3 border-t border-border">
              <span>{article.author.name}</span>
              <span>•</span>
              <time dateTime={article.publishedAt}>
                {new Date(article.publishedAt).toLocaleDateString('pt-BR')}
              </time>
              <span>•</span>
              <span>{article.readingTime} min</span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
