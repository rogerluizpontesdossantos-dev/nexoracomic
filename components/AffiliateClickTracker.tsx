'use client';

import { useEffect } from 'react';

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

function sendGaEvent(record: ClickRecord): void {
  if (window.localStorage.getItem(CONSENT_KEY) !== 'accepted') return;
  const gtag = (window as Window & { gtag?: GtagFn }).gtag;
  if (typeof gtag !== 'function') return;
  gtag('event', 'affiliate_click', {
    article_slug: record.slug,
    article_category: record.category,
    affiliate_product: record.product,
    affiliate_position: record.position,
    affiliate_program: record.program,
  });
}

/**
 * Mede cliques nos links do AffiliateBlock.
 *
 * - grava o clique em localStorage (`nexora_aff_clicks`);
 * - dispara `affiliate_click` no GA4 somente com consentimento aceito
 *   e com `gtag` já carregado pelo CookieConsent.
 */
export function AffiliateClickTracker({ slug, category }: AffiliateClickTrackerProps) {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLAnchorElement>('a[data-affiliate-product]');
      if (!link) return;

      const record: ClickRecord = {
        t: new Date().toISOString(),
        slug,
        category,
        product: link.dataset.affiliateProduct ?? '',
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
