import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Image from 'next/image';
import { readFileSync } from 'node:fs';
import path from 'node:path';

export const metadata = {
  title: 'Créditos de Imagens',
  description: 'Conheça os créditos das imagens utilizadas no NexoraComic. Todas as imagens são de domínio público ou licenciadas Creative Commons, obtidas do Wikimedia Commons.',
  alternates: {
    canonical: '/creditos-imagens',
  },
};

interface CommonsPick {
  id: string;
  file: string;
  thumbUrl?: string;
  originalUrl: string;
  width: number;
  height: number;
  license: string;
  artist: string;
  usedUrl: string;
  searchQuery?: string;
}

interface ArticleImage {
  id: string;
  slug: string;
  title: string;
  imageFile?: string;
  imageLicense?: string;
  imageArtist?: string;
  imageCommonsUrl?: string;
  featuredImage: string;
}

function getCommonsPicks(): CommonsPick[] {
  try {
    const filePath = path.join(process.cwd(), '_commons_picks.json');
    const raw = readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    return data.picks || [];
  } catch {
    return [];
  }
}

function getArticleImages(): ArticleImage[] {
  try {
    const filePath = path.join(process.cwd(), 'lib', 'articles.ts');
    const raw = readFileSync(filePath, 'utf8');
    
    const articles: ArticleImage[] = [];
    const articleRegex = /id:\s*'([^']+)'[\s\S]*?slug:\s*'([^']+)'[\s\S]*?title:\s*'([^']+)'[\s\S]*?featuredImage:\s*'([^']+)'[\s\S]*?imageAlt:\s*'([^']+)'/g;
    
    let match;
    while ((match = articleRegex.exec(raw)) !== null) {
      const id = match[1];
      const slug = match[2];
      const title = match[3];
      const featuredImage = match[4];
      
      const metaRegex = new RegExp(
        `id:\\s*'${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'[\\s\\S]*?imageLicense:\\s*'([^']*)'[\\s\\S]*?imageArtist:\\s*'([^']*)'[\\s\\S]*?imageCommonsUrl:\\s*'([^']*)'`
      );
      const metaMatch = metaRegex.exec(raw);
      
      articles.push({
        id,
        slug,
        title,
        featuredImage,
        imageLicense: metaMatch?.[1] || undefined,
        imageArtist: metaMatch?.[2] || undefined,
        imageCommonsUrl: metaMatch?.[3] || undefined,
      });
    }
    
    return articles;
  } catch {
    return [];
  }
}

export default function CreditosImagensPage() {
  const commonsPicks = getCommonsPicks();
  const articleImages = getArticleImages();
  
  const allCredits: Array<{
    source: string;
    id: string;
    title: string;
    slug?: string;
    imageFile: string;
    license: string;
    artist: string;
    commonsUrl: string;
    thumbnail: string;
  }> = [];
  
  for (const pick of commonsPicks) {
    allCredits.push({
      source: 'commons',
      id: pick.id,
      title: pick.file.replace(/^File:/, '').replace(/\.[^.]+$/, ''),
      imageFile: pick.file,
      license: pick.license,
      artist: pick.artist,
      commonsUrl: 'https://commons.wikimedia.org/wiki/' + encodeURIComponent(pick.file),
      thumbnail: pick.thumbUrl || pick.originalUrl,
    });
  }
  
  for (const article of articleImages) {
    const existsInCommons = commonsPicks.some(p => 
      p.usedUrl === article.featuredImage || p.originalUrl === article.featuredImage
    );
    if (!existsInCommons) {
      allCredits.push({
        source: 'article',
        id: article.id,
        title: article.title,
        slug: article.slug,
        imageFile: article.featuredImage,
        license: article.imageLicense || 'Desconhecida',
        artist: article.imageArtist || 'Desconhecido',
        commonsUrl: article.imageCommonsUrl || '',
        thumbnail: article.featuredImage,
      });
    }
  }
  
  allCredits.sort((a, b) => parseInt(a.id) - parseInt(b.id));

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <h1 className="text-4xl font-bold mb-4">Créditos de Imagens</h1>
          <p className="text-lg text-zinc-400 mb-8">
            Todas as imagens utilizadas no NexoraComic são de domínio público ou licenciadas sob Creative Commons, 
            obtidas do <a href="https://commons.wikimedia.org" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 underline">Wikimedia Commons</a>.
          </p>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-amber-400">Licenças Utilizadas</h2>
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span>Domínio Público</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span>CC0</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span>CC BY</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                <span>CC BY-SA</span>
              </li>
            </ul>
          </div>

          <h2 className="text-2xl font-semibold mb-6">Imagens ({allCredits.length})</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allCredits.map((credit) => (
              <div key={`${credit.source}-${credit.id}`} className="bg-zinc-900/80 border border-zinc-800 rounded-lg overflow-hidden hover:border-amber-500/50 transition-colors">
                <div className="relative aspect-video bg-zinc-800">
                  <Image
                    src={credit.thumbnail}
                    alt={credit.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-sm line-clamp-2">{credit.title}</h3>
                  {credit.slug && (
                    <a 
                      href={`/games/${credit.slug}`}
                      className="text-xs text-amber-400 hover:text-amber-300 hover:underline"
                    >
                      Ver artigo →
                    </a>
                  )}
                  <div className="pt-2 border-t border-zinc-800 space-y-1 text-xs text-zinc-400">
                    <p><strong className="text-zinc-300">Autor:</strong> {credit.artist}</p>
                    <p><strong className="text-zinc-300">Licença:</strong> {credit.license}</p>
                    {credit.commonsUrl && (
                      <p>
                        <a 
                          href={credit.commonsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-400 hover:text-amber-300 underline"
                        >
                          Wikimedia Commons ↗
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {allCredits.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              <p>Nenhuma imagem encontrada.</p>
            </div>
          )}

          <div className="mt-12 p-6 bg-zinc-900/30 border border-zinc-800 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Sobre as Imagens</h2>
            <p className="text-zinc-400 text-sm">
              O NexoraComic utiliza imagens de capa relacionadas ao tema de cada artigo. 
              As imagens são selecionadas automaticamente do Wikimedia Commons, priorizando:
            </p>
            <ul className="mt-3 space-y-1 text-sm text-zinc-400 list-disc list-inside">
              <li>Imagens visualmente e semanticamente relacionadas ao assunto</li>
              <li>Licenças claras e compatíveis com uso editorial</li>
              <li>Resolução adequada para exibição web</li>
              <li>Atribuição correta ao autor original</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
