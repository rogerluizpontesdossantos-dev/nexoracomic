import Link from 'next/link';
import Logo from './Logo';
import FooterNewsletter from './FooterNewsletter';
import { CATEGORIES } from '@/lib/types';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Logo size="md" showTagline={true} />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Uma publicação digital que conecta ciência, tecnologia, espaço, inteligência artificial e cultura geek.
            </p>
          </div>

          {/* Categorias */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Categorias</h3>
            <ul className="space-y-2">
              {CATEGORIES.slice(0, 6).map((category) => (
                <li key={category.id}>
                  <Link 
                    href={`/${category.slug}`} 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Institucional */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Institucional</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/sobre" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Sobre
                </Link>
              </li>
              <li>
                <Link href="/contato" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Contato
                </Link>
              </li>
              <li>
                <Link href="/politica-de-privacidade" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link href="/termos-de-uso" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Termos de Uso
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Newsletter</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Receba as melhores histórias de ciência e tecnologia diretamente no seu email.
            </p>
            <FooterNewsletter />
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} NexoraComic. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/pesquisar" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pesquisar
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/sobre" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Sobre
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
