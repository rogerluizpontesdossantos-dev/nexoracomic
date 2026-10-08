'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ADSENSE_SCRIPT_SRC, isAdsEnabled } from '@/lib/ads';

const CONSENT_KEY = 'nexora_cookie_consent';
const CONSENT_EVENT = 'nexora:consent';
type Consent = 'accepted' | 'rejected';

/**
 * Consentimento como external store — mesmo padrão já usado em AdSlot.tsx.
 *
 * Evita setState dentro de effect: o valor é lido sob demanda por
 * getSnapshot e o componente re-renderiza quando o evento de
 * consentimento é disparado (ou quando outra aba altera o storage).
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

/** No servidor não há localStorage: o estado é desconhecido. */
function getServerConsentSnapshot(): string {
  return 'pending';
}

export default function CookieConsent() {
  // 'pending' no servidor e antes da hidratação; 'accepted' | 'rejected'
  // quando há consentimento salvo; 'pending' quando não há.
  const snapshot = useSyncExternalStore(
    subscribeToConsent,
    getConsentSnapshot,
    getServerConsentSnapshot
  );
  const consent: Consent | null =
    snapshot === 'accepted' || snapshot === 'rejected' ? snapshot : null;

  // Aberto manualmente pelo botão "Preferências de cookies".
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  // Evita inserir os scripts de terceiros mais de uma vez.
  const scriptsLoaded = useRef(false);

  /**
   * Carrega os scripts de terceiros SOMENTE após consentimento ACEITO.
   * Analytics (Google Analytics) mantém o comportamento existente.
   * O AdSense é carregado apenas se a publicidade estiver habilitada
   * (NEXT_PUBLIC_ENABLE_ADS=true) — caso contrário, nenhum script é
   * requisitado.
   *
   * O GA4 só é carregado quando NEXT_PUBLIC_GA_ID tem formato válido
   * (G-XXXXXXXXXX). Sem ID, nenhum script é injetado e nenhum erro é
   * gerado. O evento `nexora:consent` é disparado pelo `persist`, não
   * aqui — evita despacho duplicado (este componente também escuta o
   * evento via useSyncExternalStore).
   */
  const loadScripts = () => {
    // AdSense — somente se os anúncios estiverem habilitados.
    if (isAdsEnabled()) {
      if (!document.querySelector('script[data-adsense="true"]')) {
        const adSenseScript = document.createElement('script');
        adSenseScript.async = true;
        adSenseScript.src = ADSENSE_SCRIPT_SRC;
        adSenseScript.crossOrigin = 'anonymous';
        adSenseScript.dataset.adsense = 'true';
        document.head.appendChild(adSenseScript);
      }
    }

    // Analytics script (somente com GA ID válido e consentimento aceito).
    const gaId = process.env.NEXT_PUBLIC_GA_ID;
    if (gaId && /^G-[A-Z0-9]{6,}$/.test(gaId)) {
      if (!document.querySelector('script[data-ga="true"]')) {
        const analyticsScript = document.createElement('script');
        analyticsScript.async = true;
        analyticsScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
        analyticsScript.dataset.ga = 'true';
        document.head.appendChild(analyticsScript);

        const gtagScript = document.createElement('script');
        gtagScript.dataset.ga = 'true';
        gtagScript.text = [
          'window.dataLayer = window.dataLayer || [];',
          'function gtag(){dataLayer.push(arguments);}',
          "gtag('js', new Date());",
          `gtag('config', '${gaId}');`,
        ].join('\n');
        document.head.appendChild(gtagScript);
      }
    }

    // Carregamento concluído aqui; o evento `nexora:consent` já foi
    // disparado por `persist` — não despachar de novo (evita listeners
    // duplos e re-renders extras).
  };

  // Carrega os scripts de terceiros no máximo uma vez e SOMENTE após
  // consentimento ACEITO. Efeito colateral puro (nenhum setState aqui).
  useEffect(() => {
    if (consent !== 'accepted' || scriptsLoaded.current) return;
    scriptsLoaded.current = true;
    loadScripts();
  }, [consent]);

  // Sem consentimento salvo o banner aparece; com consentimento salvo ele
  // só aparece quando o visitante abre as preferências de volta.
  const showBanner = consent === null || preferencesOpen;

  const persist = (value: Consent) => {
    localStorage.setItem(CONSENT_KEY, value);
    setPreferencesOpen(false);
    // Notifica os AdSlots (e este próprio componente) da mudança.
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
  };

  const handleAccept = () => {
    persist('accepted');
  };

  const handleReject = () => {
    persist('rejected');
  };

  const handleOpenSettings = () => {
    setPreferencesOpen(true);
  };

  if (!showBanner) {
    if (consent) {
      return (
        <button
          onClick={handleOpenSettings}
          className="fixed bottom-4 right-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
          style={{ zIndex: 9999 }}
        >
          Preferências de cookies
        </button>
      );
    }
    return null;
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border p-4 z-50"
      style={{ zIndex: 9999 }}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1 text-sm text-muted-foreground">
          <p className="mb-2">
            Este site utiliza cookies para melhorar sua experiência. Ao continuar navegando, você concorda com nossa{' '}
            <Link href="/politica-de-privacidade" className="underline hover:text-foreground">
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReject}
            className="px-4 py-2 text-sm font-medium rounded-md border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Recusar
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
