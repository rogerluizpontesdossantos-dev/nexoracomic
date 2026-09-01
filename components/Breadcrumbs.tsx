import Link from 'next/link';

interface BreadcrumbItem {
  name: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center">
            {index > 0 && <span className="mx-2">/</span>}
            {index === items.length - 1 ? (
              <span className="text-foreground font-medium" aria-current="page">
                {item.name}
              </span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors"
              >
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function CategoryBreadcrumbs({ categorySlug, categoryName }: { categorySlug: string; categoryName: string }) {
  return (
    <Breadcrumbs
      items={[
        { name: 'Home', href: '/' },
        { name: categoryName, href: `/${categorySlug}` },
      ]}
    />
  );
}

export function ArticleBreadcrumbs({ categorySlug, categoryName, articleTitle, articleSlug }: { categorySlug: string; categoryName: string; articleTitle: string; articleSlug: string }) {
  return (
    <Breadcrumbs
      items={[
        { name: 'Home', href: '/' },
        { name: categoryName, href: `/${categorySlug}` },
        { name: articleTitle, href: `/${categorySlug}/${articleSlug}` },
      ]}
    />
  );
}
