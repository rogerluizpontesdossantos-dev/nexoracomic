import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SITE_NAME, SITE_URL } from "@/lib/types";
import Analytics from "@/components/Analytics";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "NexoraComic - Ciência, Tecnologia e Cultura Geek",
    template: "%s | NexoraComic"
  },
  description: "NexoraComic é uma publicação digital que conecta ciência, tecnologia, espaço, inteligência artificial e cultura geek. Artigos sobre astronomia, física, games, filmes e curiosidades científicas.",
  keywords: ["ciência", "tecnologia", "espaço", "astronomia", "inteligência artificial", "games", "filmes", "quadrinhos", "curiosidades", "futuro", "nerd", "geek"],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "NexoraComic - Ciência, Tecnologia e Cultura Geek",
    description: "Uma publicação digital que conecta ciência, tecnologia, espaço, inteligência artificial e cultura geek.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NexoraComic - Ciência, Tecnologia e Cultura Geek",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NexoraComic - Ciência, Tecnologia e Cultura Geek",
    description: "Uma publicação digital que conecta ciência, tecnologia, espaço, inteligência artificial e cultura geek.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add verification codes when available
    // google: "your-google-verification-code",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'pt-BR',
    description: 'Publicação digital que conecta ciência, tecnologia, espaço, inteligência artificial e cultura geek.',
  };

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo-icon.svg`,
  };

  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} h-full antialiased`}
    >
      <head>
        {/* Google AdSense — connection/verification script only (official snippet).
            No ad units are rendered anywhere; AdSlot remains disabled. */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9710418432642580"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Analytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </body>
    </html>
  );
}
