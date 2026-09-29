import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { DEMONSTRATION_ARTICLES } from '@/lib/articles';
import { AFFILIATE_LINK_PROPS, validateAffiliateUrl } from '@/lib/affiliate';
import AffiliateDisclosure from '@/components/AffiliateDisclosure';

export const metadata = {
  title: 'Produtos dos Artigos',
  description:
    'Produtos relacionados aos temas e artigos publicados no NexoraComic.',
  alternates: {
    canonical: '/produtos',
  },
};

interface ProdutoRelacionado {
  label: string;
  reason: string;
  href: string;
  imagem?: string;
  imagemAlt?: string;
  artigo: {
    titulo: string;
    href: string;
    categoria: string;
  };
}

/**
 * Percorre o catálogo e coleta os produtos que já possuem bloco de afiliados.
 * A fonte é sempre `lib/articles.ts`: a página não mantém uma lista própria,
 * então qualquer afiliado adicionado futuramente aparece aqui automaticamente.
 *
 * A URL passa por `validateAffiliateUrl`; se for inválida, o produto é
 * simplesmente omitido — nunca é renderizado um link quebrado ou vazio.
 */
function coletarProdutos(): ProdutoRelacionado[] {
  const saida: ProdutoRelacionado[] = [];

  for (const artigo of DEMONSTRATION_ARTICLES) {
    const produtos = artigo.affiliate?.products;
    if (!produtos || produtos.length === 0) continue;

    for (const produto of produtos) {
      const validacao = validateAffiliateUrl(produto.amazonUrl);
      if (!validacao.ok) continue;

      saida.push({
        label: produto.label,
        reason: produto.reason,
        href: validacao.href,
        // A imagem do produto é a própria capa do artigo de origem. Não há
        // fotografia licenciada do produto, e inventar uma URL quebraria a
        // política de imagens do site.
        imagem: artigo.featuredImage,
        imagemAlt: artigo.imageAlt,
        artigo: {
          titulo: artigo.title,
          href: `/${artigo.category.slug}/${artigo.slug}`,
          categoria: artigo.category.name,
        },
      });
    }
  }

  return saida;
}

export default function ProdutosPage() {
  const produtos = coletarProdutos();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main id="main-content" className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <header className="mb-10">
            <h1 className="text-4xl font-bold mb-4 text-foreground">
              Produtos dos Artigos
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Produtos relacionados aos temas publicados no NexoraComic. Não
              é uma loja: cada item abaixo aparece porque foi citado ou
              explicado em um dos nossos artigos.
            </p>
          </header>

          <div className="mb-8 rounded-lg border border-border bg-card/30 p-4">
            <AffiliateDisclosure className="" />
          </div>

          {produtos.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>Nenhum produto relacionado no momento.</p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {produtos.map((produto, index) => (
                <li
                  key={`${produto.href}-${index}`}
                  className="flex flex-col rounded-lg border border-border bg-card overflow-hidden card-hover"
                >
                  {produto.imagem && (
                    <div className="relative aspect-video bg-secondary">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={produto.imagem}
                        alt={produto.imagemAlt || produto.label}
                        className="object-cover w-full h-full"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <div className="p-5 flex flex-col flex-1">
                    <h2 className="font-semibold text-foreground leading-snug">
                      {produto.label}
                    </h2>

                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">
                      {produto.reason}
                    </p>

                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-1">
                        Relacionado ao artigo:
                      </p>
                      <Link
                        href={produto.artigo.href}
                        className="text-sm text-primary hover:text-accent transition-colors hover:underline underline-offset-2"
                      >
                        {produto.artigo.titulo} →
                      </Link>
                    </div>

                    <a
                      href={produto.href}
                      {...AFFILIATE_LINK_PROPS}
                      className="mt-4 inline-block text-sm font-medium text-accent hover:text-accent/80 transition-colors py-2 underline decoration-dotted underline-offset-2"
                    >
                      Ver na Amazon
                      <span className="sr-only">: {produto.label}</span>
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-12 text-sm text-muted-foreground leading-relaxed">
            Novas recomendações são adicionadas conforme novos artigos são
            publicados.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
