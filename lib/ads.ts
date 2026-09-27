/**
 * Configuração de publicidade (Google AdSense) — fonte única de verdade.
 *
 * O script do AdSense NUNCA é carregado sem que as DUAS condições abaixo
 * sejam verdadeiras:
 *   1. o visitante aceitou cookies (consentimento em components/CookieConsent.tsx); e
 *   2. a publicidade está habilitada (NEXT_PUBLIC_ENABLE_ADS=true).
 *
 * Se a publicidade estiver desabilitada, nenhum script do AdSense é
 * carregado — evitando requisições desnecessárias a terceiros.
 *
 * O publisher ID abaixo é o mesmo declarado em public/ads.txt.
 */

/** Publisher ID autorizado (não alterar — ver public/ads.txt). */
export const ADSENSE_CLIENT_ID = 'ca-pub-9710418432642580';

/** URL do script do AdSense para o publisher acima. */
export const ADSENSE_SCRIPT_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;

/**
 * A publicidade está habilitada? Desabilitada por padrão.
 * Ativar somente com NEXT_PUBLIC_ENABLE_ADS=true.
 */
export function isAdsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_ADS === 'true';
}

/**
 * O AdSense pode ser carregado agora?
 * Exige consentimento ACEITO e publicidade habilitada.
 */
export function shouldLoadAdSense(consent: 'accepted' | 'rejected' | null): boolean {
  return consent === 'accepted' && isAdsEnabled();
}
