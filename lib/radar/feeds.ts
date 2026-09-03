import { RadarSourceTier, RadarSourceRef } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Fontes e feeds do Radar GTA 6 (V1)
// Estratégia sem servidor (o site usa output: 'export'):
//   - Feeds públicos de notícias (Bing News RSS) com resultados sobre GTA 6;
//   - Leitura via rss2json (api.rss2json.com), serviço público com CORS
//     liberado para leitura de feeds no navegador — sem chave e sem custo
//     para o uso do MVP;
//   - Classificação de fontes por tiers e de pautas por marcadores editoriais.
// ─────────────────────────────────────────────────────────────────────────────

export interface RadarFeed {
  id: string;
  label: string;
  /** URL do feed RSS (pública, sem segredo). */
  url: string;
}

/** Feeds consultados pelo botão "🔎 Buscar novidades". */
export const RADAR_FEEDS: RadarFeed[] = [
  {
    id: 'bing-en',
    label: 'Bing News (inglês)',
    url: 'https://www.bing.com/news/search?q=GTA+6&format=RSS',
  },
  {
    id: 'bing-ptbr',
    label: 'Bing News (pt-BR)',
    url: 'https://www.bing.com/news/search?q=GTA+6&setmkt=pt-BR&setlang=pt&format=RSS',
  },
  {
    id: 'bing-jason-lucia',
    label: 'Bing News (Jason e Lucia)',
    url: 'https://www.bing.com/news/search?q=%22Jason%22+%22Lucia%22+GTA&format=RSS',
  },
  {
    id: 'bing-vice-city-leonida',
    label: 'Bing News (Vice City / Leonida)',
    url: 'https://www.bing.com/news/search?q=%22GTA+VI%22+OR+%22Vice+City%22+OR+%22Leonida%22&format=RSS',
  },
  {
    id: 'bing-lancamento',
    label: 'Bing News (lançamento GTA VI)',
    url: 'https://www.bing.com/news/search?q=%22GTA+VI%22+launch+OR+lan%C3%A7amento+OR+release&format=RSS',
  },
  {
    id: 'bing-rockstar',
    label: 'Bing News (Rockstar Games + GTA)',
    url: 'https://www.bing.com/news/search?q=%22Rockstar+Games%22+%22GTA%22&format=RSS',
  },
];

// ── Prioridade de fontes (tiers) ─────────────────────────────────────────────
// 1 = oficial Rockstar/players da franquia; 2 = fontes oficiais relacionadas;
// 3 = grandes portais especializados em games; 4 = veículos jornalísticos
// reconhecidos; 5 = outros/da plataforma do feed (tratados com cautela).

export interface RadarSourceInfo {
  tier: RadarSourceTier;
  label: string;
  /** `Source.type` do modelo de artigos (lib/types.ts). */
  sourceType: RadarSourceRef['type'];
}

const OFFICIAL: RadarSourceInfo = { tier: 1, label: 'Fonte oficial (Rockstar Games)', sourceType: 'company' };
const OFFICIAL_RELATED: RadarSourceInfo = { tier: 2, label: 'Fonte oficial relacionada', sourceType: 'company' };
const GAMES_MEDIA: RadarSourceInfo = { tier: 3, label: 'Portal especializado em games', sourceType: 'publication' };
const JOURNAL: RadarSourceInfo = { tier: 4, label: 'Veículo jornalístico', sourceType: 'journal' };
const OTHER: RadarSourceInfo = { tier: 5, label: 'Fonte a verificar', sourceType: 'other' };

/** Domínio → tier. Qualquer domínio fora desta lista cai no tier 5. */
export const RADAR_SOURCE_TIERS: Record<string, RadarSourceInfo> = {
  // 1 — oficial Rockstar / franquia
  'rockstargames.com': OFFICIAL,
  // 2 — oficiais relacionadas
  'blog.playstation.com': OFFICIAL_RELATED,
  'playstation.com': OFFICIAL_RELATED,
  'news.xbox.com': OFFICIAL_RELATED,
  'xbox.com': OFFICIAL_RELATED,
  'netflix.com': OFFICIAL_RELATED,
  'take-two.com': OFFICIAL_RELATED,
  'take2games.com': OFFICIAL_RELATED,
  // 3 — grandes portais especializados em games
  'ign.com': GAMES_MEDIA,
  'gamespot.com': GAMES_MEDIA,
  'polygon.com': GAMES_MEDIA,
  'eurogamer.net': GAMES_MEDIA,
  'vg247.com': GAMES_MEDIA,
  'pushsquare.com': GAMES_MEDIA,
  'nintendolife.com': GAMES_MEDIA,
  'rockpapershotgun.com': GAMES_MEDIA,
  'kotaku.com': GAMES_MEDIA,
  'pcgamer.com': GAMES_MEDIA,
  'pcgamesn.com': GAMES_MEDIA,
  'dexerto.com': GAMES_MEDIA,
  'gamesradar.com': GAMES_MEDIA,
  'gamesindustry.biz': GAMES_MEDIA,
  'opencritic.com': GAMES_MEDIA,
  'videogamer.com': GAMES_MEDIA,
  'beebom.com': GAMES_MEDIA,
  'techspot.com': GAMES_MEDIA,
  'digit.in': GAMES_MEDIA,
  'gameshub.com': GAMES_MEDIA,
  'gamerant.com': GAMES_MEDIA,
  'thegamer.com': GAMES_MEDIA,
  'screenrant.com': GAMES_MEDIA,
  'comicbook.com': GAMES_MEDIA,
  'comicbookmovie.com': GAMES_MEDIA,
  'dreager1.com': GAMES_MEDIA,
  'adrenaline.com.br': GAMES_MEDIA,
  'theenemy.com.br': GAMES_MEDIA,
  'meups.com.br': GAMES_MEDIA,
  'voxel.tecmundo.com.br': GAMES_MEDIA,
  // 4 — veículos jornalísticos reconhecidos
  'bbc.com': JOURNAL,
  'bbc.co.uk': JOURNAL,
  'reuters.com': JOURNAL,
  'apnews.com': JOURNAL,
  'bloomberg.com': JOURNAL,
  'theverge.com': JOURNAL,
  'nytimes.com': JOURNAL,
  'theguardian.com': JOURNAL,
  'forbes.com': JOURNAL,
  'exame.com': JOURNAL,
  'oglobo.globo.com': JOURNAL,
  'globo.com': JOURNAL,
  'folha.uol.com.br': JOURNAL,
  'estadao.com.br': JOURNAL,
  'uol.com.br': JOURNAL,
  'g1.globo.com': JOURNAL,
  // 4/3 — portais BR de tecnologia com cadernos de games
  'techtudo.com.br': GAMES_MEDIA,
  'canaltech.com.br': GAMES_MEDIA,
  'tecmundo.com.br': GAMES_MEDIA,
  'olhardigital.com.br': GAMES_MEDIA,
  'omelete.com.br': GAMES_MEDIA,
};

/** Resolve o tier a partir do domínio do veículo. */
export function resolveSourceInfo(domain: string): RadarSourceInfo {
  const clean = (domain || '').toLowerCase().replace(/^www\./, '');
  if (RADAR_SOURCE_TIERS[clean]) return RADAR_SOURCE_TIERS[clean];
  // MSN replica veículos; mantém aviso para confirmar veículo original
  if (clean.endsWith('msn.com')) return { tier: 5, label: 'Agregador (MSN) — confirmar veículo original', sourceType: 'other' };
  // Subdomínios conhecidos (ex.: voxel.tecmundo.com.br já está na lista;
  // cobre variações como br.ign.com)
  const base = clean.split('.').slice(-2).join('.');
  if (RADAR_SOURCE_TIERS[base]) return RADAR_SOURCE_TIERS[base];
  return OTHER;
}
