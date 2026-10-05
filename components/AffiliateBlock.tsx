import type { AffiliateBlockData, AffiliateProduct } from '@/lib/types';
import { AFFILIATE_LINK_PROPS, validateAffiliateUrl } from '@/lib/affiliate';
import AffiliateDisclosure from './AffiliateDisclosure';

/** Teto de produtos renderizados, para o bloco nunca virar um catálogo. */
const MAX_PRODUCTS = 3;

interface AffiliateBlockProps {
  /** Dados do artigo. Ausente ou sem produtos -> nada é renderizado. */
  affiliate?: AffiliateBlockData;
  className?: string;
}

/**
 * Resolve o href de um produto.
 *
 * Ordem de preferência: `amazonUrl` -> `searchUrl` -> `url`.
 *
 * A ordem é deliberada: a Amazon vem PRIMEIRO de propósito. Assim, um
 * produto que já tem URL Amazon continue apontando para a Amazon mesmo
 * depois de a Hotmart entrar no projeto. `url` só é alcançado quando o
 * produto não tem nenhum link Amazon — que é o caso dos produtos
 * digitais (cursos/ebooks), onde a Amazon não se aplica.
 *
 * Cada candidata passa por `validateAffiliateUrl`. Se nenhuma for válida,
 * retorna null e o produto é exibido SEM link — nunca com href vazio,
 * nunca com URL deduzida a partir de `label` ou `category`.
 */
function resolveHref(produto: AffiliateProduct): string | null {
  const viaProduto = validateAffiliateUrl(produto.amazonUrl);
  if (viaProduto.ok) return viaProduto.href;

  const viaBusca = validateAffiliateUrl(produto.searchUrl);
  if (viaBusca.ok) return viaBusca.href;

  const viaLoja = validateAffiliateUrl(produto.url);
  if (viaLoja.ok) return viaLoja.href;

  return null;
}

/**
 * Texto do botão.
 *
 * Só existe porque o bloco passou a exibir produtos de mais de uma loja.
 * Sem `store`, o texto é exatamente o de antes ("Ver na Amazon"), para
 * que nenhum produto Amazon existente mude de aparência.
 */
export function affiliateCtaLabel(produto: AffiliateProduct): string {
  const loja = produto.store?.trim();
  return loja ? `Ver na ${loja}` : 'Ver na Amazon';
}

/**
 * Bloco de produtos relacionados (TASK 6AQ — infraestrutura).
 *
 * Hoje NÃO é usado por nenhum artigo: os 176 têm `affiliate` ausente,
 * portanto este componente retorna null e nada muda no site. Ele existe
 * para que, em uma task posterior, produtos revisados individualmente
 * possam ser publicados sem refatorar a página de artigo.
 *
 * Garantias: sem pop-up, sem urgência, sem link inventado, sem mais de
 * 3 itens, `reason` sempre visível.
 */
export default function AffiliateBlock({ affiliate, className = '' }: AffiliateBlockProps) {
  const produtos = affiliate?.products;

  // Sem produtos: não renderiza absolutamente nada (nem wrapper, nem título).
  if (!produtos || produtos.length === 0) {
    return null;
  }

  const visiveis = produtos.slice(0, MAX_PRODUCTS);

  return (
    <section
      className={`mt-10 pt-8 border-t border-border ${className}`}
      aria-labelledby="affiliate-block-heading"
      data-affiliate-block="true"
    >
      <h2
        id="affiliate-block-heading"
        className="text-xl font-semibold mb-4 flex items-center gap-2"
      >
        <svg
          className="w-5 h-5 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 11V7a1 1 0 1 0 -2 0m2 0a2 2 0 1 1 4 0v1a4 4 0 0 1 4 4v1a1 1 0 0 1 -1 1H5a1 1 0 0 1 -1 -1v-1a4 4 0 0 1 4-4m2 0V7a2 2 0 1 1 4 0m-2 0a1 1 0 0 0 1 1v1a1 1 0 0 0 -1 -1m0-4h4"
          />
        </svg>
        Produtos relacionados
      </h2>

      <AffiliateDisclosure text={affiliate?.disclosure} className="mb-6" />

      <ul className="space-y-4">
        {visiveis.map((produto, index) => {
          const href = resolveHref(produto);
          const chave = `${produto.category}-${index}`;

          return (
            <li
              key={chave}
              className="p-4 rounded-lg bg-card border border-border"
            >
              <p className="font-medium text-foreground">{produto.label}</p>

              {produto.reason && (
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {produto.reason}
                </p>
              )}

              {href ? (
                <a
                  href={href}
                  {...AFFILIATE_LINK_PROPS}
                  className="inline-block mt-2 py-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors underline decoration-dotted underline-offset-2"
                >
                  {affiliateCtaLabel(produto)}
                  <span className="sr-only">: {produto.label}</span>
                </a>
              ) : (
                // Sem URL válida: nenhum botão falso, nenhuma promessa de link.
                <p className="mt-3 text-sm text-muted-foreground italic">
                  Link indisponível no momento.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
