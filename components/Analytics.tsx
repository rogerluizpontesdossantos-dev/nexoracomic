'use client';

import Script from 'next/script';


export default function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  // Sem GA_ID configurado, nada é carregado (zero scripts externos).
  // Suporta Google Analytics 4 via gtag.js. Em static export, o env
  // NEXT_PUBLIC_* é resolvido no momento do build.
  if (!gaId) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}