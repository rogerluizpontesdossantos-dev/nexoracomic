import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NexoraComic - Ciência, Tecnologia e Cultura Geek",
    template: "%s | NexoraComic"
  },
  description: "NexoraComic é uma publicação digital que conecta ciência, tecnologia, espaço, inteligência artificial e cultura geek. Artigos sobre astronomia, física, games, filmes e curiosidades científicas.",
  keywords: ["ciência", "tecnologia", "espaço", "astronomia", "inteligência artificial", "games", "filmes", "quadrinhos", "curiosidades", "futuro", "nerd", "geek"],
  authors: [{ name: "NexoraComic" }],
  creator: "NexoraComic",
  publisher: "NexoraComic",
  metadataBase: new URL("https://nexoracomic.com"),
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://nexoracomic.com",
    siteName: "NexoraComic",
    title: "NexoraComic - Ciência, Tecnologia e Cultura Geek",
    description: "Uma publicação digital que conecta ciência, tecnologia, espaço, inteligência artificial e cultura geek.",
    images: [
      {
        url: "https://nexoracomic.com/og-image.svg",
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
    images: ["https://nexoracomic.com/og-image.svg"],
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
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
