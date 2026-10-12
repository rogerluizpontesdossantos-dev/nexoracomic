'use client';

import { useEffect } from 'react';
import { affiliateProductId } from '@/lib/affiliate';

const STORAGE_KEY = 'nexora_aff_clicks';
const CONSENT_KEY = 'nexora_cookie_consent';
const MAX_STORED_CLICKS = 200;

type ClickRecord = {
  t: string;
  slug: string;
  category: string;
  product: string;
  position: string;
  program: string;
  /** Identificador estável do produto (ASIN/código), quando legível. */
  productId?: string;
};

type GtagFn = (...args: unknown[]) => void;

interface AffiliateClickTrackerProps {
  slug: string;
  category: string;
}

function readStoredClicks(): ClickRecord[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ClickRecord[]) : [];
  } catch {
    return [];
  }
}

function persistClick(record: ClickRecord): void {
  try {
    const next = [...readStoredClicks(), record].slice(-MAX_STORED_CLICKS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage indisponível (modo privado / quota) — o clique segue.
  }
}

/**
 * Consentimento de analytics. Lê o MESMO localStorage e a MESMA chave usados
 * por CookieConsent ('nexora_cookie_consent'), dentro de try/catch: se o
 * armazenamento estiver bloqueado, a leitura não pode derrubar o handler de
 * clique — sem consentimento legível, simplesmente não há evento GA4.
 */
function hasAnalyticsConsent(): boolean {
  try {
    return window.localStorage.getItem(CONSENT_KEY) === 'accepted';
  } catch {
    return false;
  }
}

function sendGaEvent(record: ClickRecord): void {
  if (!hasAnalyticsConsent()) return;
  const gtag = (window as Window & { gtag?: GtagFn }).gtag;
  if (typeof gtag !== 'function') return;
  gtag('event', 'affiliate_click', {
    article_slug: record.slug,
    article_category: record.category,
    affiliate_product: record.product,
    affiliate_product_id: record.productId ?? '',
    affiliate_position: record.position,
    affiliate_program: record.program,
  });
}

/**
 * Normaliza a atribuicao do clique.
 *
 * O MESMO artigo e medido em duas superficies: na propria pagina do artigo e
 * na listagem /produtos. Se cada uma emitisse um `article_slug` diferente, o
 * GA4 dividiria o mesmo artigo em dois valores de dimensao e nenhum produto
 * fecharia por artigo. Esta funcao faz as duas saidas convergirem para
 * `slug` puro + `category`.
 *
 * Aceita "categoria/slug" (forma de `data-affiliate-article`, usada em
 * /produtos) e tambem "slug" isolado — nesse caso a categoria vem do fallback.
 * Nada e inventado: a categoria so e separada quando existe uma barra.
 */
function normalizeArticle(
  value: string | undefined,
  fallbackSlug: string,
  fallbackCategory: string
): { slug: string; category: string } {
  const raw = typeof value === 'string' ? value.trim() : '';
  const barra = raw.indexOf('/');

  if (barra > 0) {
    return {
      slug: raw.slice(barra + 1).trim() || fallbackSlug,
      category: raw.slice(0, barra).trim() || fallbackCategory,
    };
  }

  return { slug: raw || fallbackSlug, category: fallbackCategory };
}

/**
 * Mede cliques nos links do AffiliateBlock.
 *
 * - grava o clique em localStorage (`nexora_aff_clicks`);
 * - dispara `affiliate_click` no GA4 somente com consentimento aceito
 *   e com `gtag` já carregado pelo CookieConsent.
 *
 * Atribuicao do clique: por padrao usa `slug`/`category` da pagina (artigo).
 * Um link pode carregar `data-affiliate-article="categoria/slug"` para
 * atribuir o clique ao artigo de origem da recomendacao — usado em
 * /produtos, onde varios artigos aparecem na mesma pagina.
 */
export function AffiliateClickTracker({ slug, category }: AffiliateClickTrackerProps) {
  useEffect(() => {
    // Escopo da MONTAGEM, nao do modulo: o conjunto nasce e morre com o
    // listener. Um conjunto de modulo sobreviveria a navegacao e poderia
    // silenciar cliques legitimos de quem voltasse a mesma pagina.
    const countedLinks = new WeakSet<HTMLAnchorElement>();

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLAnchorElement>('a[data-affiliate-product]');
      if (!link) return;

      // Um clique conta uma vez, mesmo que mais de um listener esteja ativo
      // ao mesmo tempo; um clique repetido no mesmo link e a mesma intencao.
      if (countedLinks.has(link)) return;
      countedLinks.add(link);

      const atribuicao = normalizeArticle(link.dataset.affiliateArticle, slug, category);
      const productId = affiliateProductId(link.getAttribute('href'));

      const record: ClickRecord = {
        t: new Date().toISOString(),
        slug: atribuicao.slug,
        category: atribuicao.category,
        product: link.dataset.affiliateProduct ?? '',
        productId: productId ?? undefined,
        position: link.dataset.affiliatePosition ?? '',
        program: link.dataset.affiliateProgram?.trim() || 'Amazon',
      };

      persistClick(record);
      sendGaEvent(record);
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [slug, category]);

  return null;
}
