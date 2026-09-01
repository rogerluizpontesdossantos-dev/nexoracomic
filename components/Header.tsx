'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import { CATEGORIES } from '@/lib/types';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActiveLink = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4 py-3" aria-label="Navegação principal">
        <div className="flex items-center justify-between">
          <Logo size="md" showTagline={false} />

          {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-1">
            {CATEGORIES.slice(0, 6).map((category) => (
              <Link
                key={category.id}
                href={`/${category.slug}`}
                className={`relative px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActiveLink(`/${category.slug}`)
                    ? 'text-primary bg-primary/10 shadow-inner'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card'
                }`}
              >
                {isActiveLink(`/${category.slug}`) && (
                  <span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                )}
                {category.name}
              </Link>
            ))}
            <Link
              href="/categorias"
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-card rounded-lg transition-colors"
            >
              Mais
            </Link>
          </div>

          {/* Search and Mobile Menu */}
          <div className="flex items-center gap-2">
            <Link
              href="/pesquisar"
              className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-card/80 transition-colors"
              aria-label="Pesquisar"
            >
              <svg
                className="w-4 h-4 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span className="text-sm text-muted-foreground">Pesquisar</span>
            </Link>

            {/* Mobile Search Button */}
            <Link
              href="/pesquisar"
              className="lg:hidden p-2 rounded-lg hover:bg-card transition-colors"
              aria-label="Pesquisar"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-card transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-border pt-4">
            <div className="flex flex-col gap-1">
              {CATEGORIES.map((category) => (
                <Link
                  key={category.id}
                  href={`/${category.slug}`}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActiveLink(`/${category.slug}`)
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
              <Link
                href="/pesquisar"
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-card rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pesquisar
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
