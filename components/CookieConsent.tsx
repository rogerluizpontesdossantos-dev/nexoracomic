'use client';

import { useState, useEffect } from 'react';
import { ADSENSE_SCRIPT_SRC, isAdsEnabled } from '@/lib/ads';

const CONSENT_KEY = 'nexora_cookie_consent';
type Consent = 'accepted' | 'rejected';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [consent, setConsent] = useState<Consent | null>(null);

  /**
   * Carrega os scripts de terceiros SOMENTE após consentimento.
   * Analytics (Google Analytics) mantém o comportamento existente.
   * O AdSense é carregado apenas se a publicidade estiver habilitada
   * (NEXT_PUBLIC_ENABLE_ADS=true) — caso contrário, nenhum script é
   * requisitado.
   */
  const loadScripts = (value: Consent) => {
    // AdSense — somente se os anúncios estiverem habilitados.
    if (isAdsEnabled()) {
      const adSenseScript = document.createElement('script');
      adSenseScript.async = true;
      adSenseScript.src = ADSENSE_SCRIPT_SRC;
      adSenseScript.crossOrigin = 'anonymous';
      adSenseScript.dataset.adsense = 'true';
      document.head.appendChild(adSenseScript);
    }

    // Analytics script (if NEXT_PUBLIC_GA_ID is set)
    const gaId = process.env.NEXT_PUBLIC_GA_ID;
    if (gaId) {
      const analyticsScript = document.createElement('script');
      analyticsScript.async = true;
      analyticsScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(analyticsScript);

      const gtagScript = document.createElement('script');
      gtagScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaId}');
      `;
      document.head.appendChild(gtagScript);
    }

    // Notifica os AdSlots (montados no servidor) de que há consentimento,
    // para que só então renderizem o <ins> do AdSense.
    window.dispatchEvent(new CustomEvent('nexora:consent', { detail: value }));
  };

  useEffect(() => {
    const savedConsent = localStorage.getItem(CONSENT_KEY);
    if (savedConsent === 'accepted' || savedConsent === 'rejected') {
      setConsent(savedConsent);
      if (savedConsent === 'accepted') {
        loadScripts(savedConsent);
      }
    } else {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setConsent('accepted');
    setShowBanner(false);
    loadScripts('accepted');
  };

  const handleReject = () => {
    localStorage.setItem(CONSENT_KEY, 'rejected');
    setConsent('rejected');
    setShowBanner(false);
  };

  const handleOpenSettings = () => {
    setShowBanner(true);
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
            <a href="/politica-de-privacidade" className="underline hover:text-foreground">
              Política de Privacidade
            </a>
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
