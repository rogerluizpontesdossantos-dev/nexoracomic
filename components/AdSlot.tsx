'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { ADSENSE_CLIENT_ID, isAdsEnabled } from '@/lib/ads';

const CONSENT_KEY = 'nexora_cookie_consent';
const CONSENT_EVENT = 'nexora:consent';

interface AdSlotProps {
  slot: string;
  size?: 'banner' | 'rectangle' | 'skyscraper';
  className?: string;
}

/**
 * Estado de consentimento como external store.
 *
 * Evita setState dentro de effect: o valor é lido sob demanda via
 * getSnapshot e o componente re-renderiza quando o evento de
 * consentimento é disparado (ou quando outro aba altera o storage).
 */
function subscribeToConsent(onChange: () => void): () => void {
  window.addEventListener(CONSENT_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(CONSENT_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

function getConsentSnapshot(): string {
  return window.localStorage.getItem(CONSENT_KEY) ?? 'pending';
}

/** No servidor não há localStorage: nada é renderizado. */
function getServerConsentSnapshot(): string {
  return 'pending';
}

/**
 * AdSense Ad Slot.
 *
 * Regras (idênticas às do carregamento do script em CookieConsent):
 *  - Publicidade desabilitada (NEXT_PUBLIC_ENABLE_ADS != 'true')
 *    -> não renderiza nada e não carrega script algum.
 *  - Sem consentimento aceito -> não renderiza o <ins>, portanto nenhum
 *    pedido ao AdSense é feito.
 *  - Com consentimento + anúncios habilitados -> renderiza o <ins> e
 *    envia o push para o adsbygoogle.
 *
 * NEVER enable ads before official approval.
 * NEVER place ads over navigation or buttons.
 * NEVER make ads look like content.
 */
export default function AdSlot({ slot, size = 'banner', className = '' }: AdSlotProps) {
  const adsEnabled = isAdsEnabled();
  const consent = useSyncExternalStore(
    subscribeToConsent,
    getConsentSnapshot,
    getServerConsentSnapshot
  );

  const shouldRender = adsEnabled && consent === 'accepted';

  // Garante que o adsbygoogle esteja disponível antes do push, apenas
  // quando o script foi de fato carregado (consentimento + anúncios).
  useEffect(() => {
    if (!shouldRender) return;
    const w = window as Window & { adsbygoogle?: unknown[] };
    w.adsbygoogle = w.adsbygoogle || [];
    w.adsbygoogle.push({});
  }, [shouldRender]);

  if (!shouldRender) {
    return null;
  }

  const sizeClasses = {
    banner: 'w-full h-24 md:h-28',
    rectangle: 'w-full h-64 md:h-96',
    skyscraper: 'w-32 h-full md:w-48',
  };

  return (
    <div
      className={`flex items-center justify-center ${sizeClasses[size]} ${className}`}
      data-ad-slot={slot}
      aria-label="Publicidade"
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
