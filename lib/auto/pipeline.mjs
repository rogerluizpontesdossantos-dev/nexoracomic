// pipeline.mjs — núcleo do pipeline automático de publicação GTA 6
// Reusa a lógica de lib/radar/* mas sem imports entre módulos TS.
// Tudo em ESM puro. Executado por scripts/auto-dry-run.mjs e scripts/auto-run.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { getArticles, loadState, saveState, findAutoRegion, ARTICLES_FILE } from "./store.mjs";
import { findRelevantImage } from "./image-finder.mjs";

const COMMONS_PICKS_FILE = path.join(process.cwd(), "_commons_picks.json");

function loadCommonsPicks() {
  try {
    if (!existsSync(COMMONS_PICKS_FILE)) return { picks: [] };
    const raw = readFileSync(COMMONS_PICKS_FILE, "utf8");
    const data = JSON.parse(raw);
    return { picks: Array.isArray(data.picks) ? data.picks : [] };
  } catch {
    return { picks: [] };
  }
}

function saveCommonsPicks(data) {
  writeFileSync(COMMONS_PICKS_FILE, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function addCommonsPick(articleId, imageResult) {
  if (!imageResult || !imageResult.ok) return;
  const img = imageResult.image;
  const { picks } = loadCommonsPicks();
  
  // Verificar se já existe para este artigo
  const exists = picks.some(p => String(p.articleId) === String(articleId));
  if (exists) return;
  
  picks.push({
    id: String(articleId),
    articleId: String(articleId),
    file: img.file,
    thumbUrl: img.thumbUrl,
    originalUrl: img.originalUrl,
    width: img.width,
    height: img.height,
    license: img.license,
    artist: img.artist,
    usedUrl: img.usedUrl,
    searchQuery: img.searchQuery,
    theme: img.theme || imageResult.theme,
    commonsUrl: img.commonsUrl,
    addedAt: new Date().toISOString(),
  });
  
  saveCommonsPicks({ picks });
}

const RSS2JSON = "https://api.rss2json.com/v1/api.json";
const TIMEOUT_MS = 12000;
const SIMILAR_THRESHOLD = 0.16;
const DUPLICATE_THRESHOLD = 0.34;


const TIERS = {
  'rockstargames.com': { tier: 1, label: 'Fonte oficial (Rockstar Games)', sourceType: 'company' },
  'blog.playstation.com': { tier: 2, label: 'Fonte oficial relacionada', sourceType: 'company' },
  'playstation.com': { tier: 2, label: 'Fonte oficial relacionada', sourceType: 'company' },
  'news.xbox.com': { tier: 2, label: 'Fonte oficial relacionada', sourceType: 'company' },
  'xbox.com': { tier: 2, label: 'Fonte oficial relacionada', sourceType: 'company' },
  'take-two.com': { tier: 2, label: 'Fonte oficial relacionada', sourceType: 'company' },
  'take2games.com': { tier: 2, label: 'Fonte oficial relacionada', sourceType: 'company' },
  'ign.com': { tier: 3, label: 'Portal especializado em games', sourceType: 'publication' },
  'gamespot.com': { tier: 3, label: 'Portal especializado em games', sourceType: 'publication' },
  'polygon.com': { tier: 3, label: 'Portal especializado em games', sourceType: 'publication' },
  'eurogamer.net': { tier: 3, label: 'Portal especializado em games', sourceType: 'publication' },
  'vg247.com': { tier: 3, label: 'Portal especializado em games', sourceType: 'publication' },
  'kotaku.com': { tier: 3, label: 'Portal especializado em games', sourceType: 'publication' },
  'pcgamer.com': { tier: 3, label: 'Portal especializado em games', sourceType: 'publication' },
  'gamesradar.com': { tier: 3, label: 'Portal especializado em games', sourceType: 'publication' },
  'gamesindustry.biz': { tier: 3, label: 'Portal especializado em games', sourceType: 'publication' },
  'screenrant.com': { tier: 3, label: 'Portal especializado em games', sourceType: 'publication' },
  'comicbook.com': { tier: 3, label: 'Portal especializado em games', sourceType: 'publication' },
  'beebom.com': { tier: 3, label: 'Portal especializado em games', sourceType: 'publication' },
  'gamerant.com': { tier: 3, label: 'Portal especializado em games', sourceType: 'publication' },
  'thegamer.com': { tier: 3, label: 'Portal especializado em games', sourceType: 'publication' },
  'adrenaline.com.br': { tier: 3, label: 'Portal especializado em games', sourceType: 'publication' },
  'theenemy.com.br': { tier: 3, label: 'Portal especializado em games', sourceType: 'publication' },
  'meups.com.br': { tier: 3, label: 'Portal especializado em games', sourceType: 'publication' },
  'voxel.tecmundo.com.br': { tier: 3, label: 'Portal especializado em games', sourceType: 'publication' },
  'bbc.com': { tier: 4, label: 'Veículo jornalístico', sourceType: 'journal' },
  'bbc.co.uk': { tier: 4, label: 'Veículo jornalístico', sourceType: 'journal' },
  'reuters.com': { tier: 4, label: 'Veículo jornalístico', sourceType: 'journal' },
  'apnews.com': { tier: 4, label: 'Veículo jornalístico', sourceType: 'journal' },
  'bloomberg.com': { tier: 4, label: 'Veículo jornalístico', sourceType: 'journal' },
  'theverge.com': { tier: 4, label: 'Veículo jornalístico', sourceType: 'journal' },
  'nytimes.com': { tier: 4, label: 'Veículo jornalístico', sourceType: 'journal' },
  'theguardian.com': { tier: 4, label: 'Veículo jornalístico', sourceType: 'journal' },
  'forbes.com': { tier: 4, label: 'Veículo jornalístico', sourceType: 'journal' },
  'exame.com': { tier: 4, label: 'Veículo jornalístico', sourceType: 'journal' },
  'oglobo.globo.com': { tier: 4, label: 'Veículo jornalístico', sourceType: 'journal' },
  'globo.com': { tier: 4, label: 'Veículo jornalístico', sourceType: 'journal' },
  'folha.uol.com.br': { tier: 4, label: 'Veículo jornalístico', sourceType: 'journal' },
  'estadao.com.br': { tier: 4, label: 'Veículo jornalístico', sourceType: 'journal' },
  'uol.com.br': { tier: 4, label: 'Veículo jornalístico', sourceType: 'journal' },
  'g1.globo.com': { tier: 4, label: 'Veículo jornalístico', sourceType: 'journal' },
  'techtudo.com.br': { tier: 3, label: 'Portal especializado em games', sourceType: 'publication' },
  'canaltech.com.br': { tier: 3, label: 'Portal especializado em games', sourceType: 'publication' },
  'tecmundo.com.br': { tier: 3, label: 'Portal especializado em games', sourceType: 'publication' },
  'olhardigital.com.br': { tier: 3, label: 'Portal especializado em games', sourceType: 'publication' },
  'omelete.com.br': { tier: 3, label: 'Portal especializado em games', sourceType: 'publication' },
};

const DEFAULT_TIER = { tier: 5, label: 'Fonte a verificar', sourceType: 'other' };

function resolveSourceInfo(domain) {
  const clean = (domain || '').toLowerCase().replace(/^www./, '');
  if (TIERS[clean]) return TIERS[clean];
  if (clean.endsWith('msn.com')) return { tier: 5, label: 'Agregador (MSN)', sourceType: 'other' };
  const base = clean.split('.').slice(-2).join('.');
  if (TIERS[base]) return TIERS[base];
  return DEFAULT_TIER;
}

const RUMOR_MARKERS = [
  /\brumores?\b/i, /\brumored\b/i, /\brumour(s|ed)?\b/i, /\balega\b/i, /\balegado\b/i,
  /\bsuposto\b/i, /\bsuposta\b/i, /\baparentemente\b/i, /\bposs[ií]vel(mente)?\b/i,
  /\bins?inua\b/i, /\bnão oficial\b/i, /\bsem confirmação\b/i, /\bunconfirmed\b/i,
  /\bunverified\b/i, /\balleged(ly)?\b/i, /\breported(?:ly)?\b/i, /\bclaims?\b/i,
  /\bsuggests?\b/i, /\bsuspected\b/i, /\bvazamento\b/i, /\bvazou\b/i, /\bleak(ed|s)?\b/i,
];

const SPEC_MARKERS = [
  /\bespecul(a|ações|ção)\b/i, /\bespera(-se)?\b/i, /\bdeva\b/i, /\bdeverá\b/i,
  /\bprovável\b/i, /\btendência\b/i, /\bpode ser que\b/i, /\bimagina(?:se|-se)?\b/i,
  /\bspecul(?:ation|ative|ates?|ating)\b/i, /\bprediction|predicts?\b/i, /\bwhat if\b/i,
  /\bexpected to\b/i, /\blikely\b/i, /\bcould\b/i, /\bmay\b/i, /\bmight\b/i,
  /\bwould\b/i, /\bhopes?\s+to\b/i, /\bplans?\s+to\b/i,
];

function classifyItem(title, summary, tier) {
  const text = title + ' ' + summary;
  const rumorHits = RUMOR_MARKERS.filter((r) => r.test(text)).map((r) => r.source);
  const specHits = SPEC_MARKERS.filter((r) => r.test(text)).map((r) => r.source);
  if (tier === 1 || tier === 2) return { classification: 'confirmed', signals: ['anúncio de fonte oficial (tier 1–2)'] };
  if (rumorHits.length > 0) return { classification: 'rumor', signals: rumorHits };
  if (specHits.length > 0) return { classification: 'speculation', signals: specHits };
  if (tier === 3 || tier === 4) return { classification: 'confirmed', signals: ['linguagem factual em fonte especializada/jornalística (tier 3–4)'] };
  return { classification: 'speculation', signals: ['fonte não reconhecida — verificar antes de usar'] };
}

function extractRealUrl(link) {
  if (!link) return '';
  try {
    const url = new URL(link);
    const inner = url.searchParams.get('url');
    if (inner && /^https?:\/\//i.test(inner)) return inner;
  } catch { /* link malformado */ }
  return link;
}

function domainOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; }
}

function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function toIso(pubDate) {
  if (!pubDate) return '';
  const normalized = pubDate.trim().replace(' ', 'T');
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(normalized);
  return new Date(hasZone ? normalized : normalized + 'Z').toISOString();
}

function hashId(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) { hash = (hash << 5) - hash + text.charCodeAt(i); hash |= 0; }
  return 'r' + Math.abs(hash).toString(36);
}

const STOPWORDS = new Set([
  'que', 'com', 'para', 'uma', 'como', 'mais', 'sobre', 'isso', 'esse', 'essa',
  'aqui', 'dos', 'das', 'não', 'nao', 'seu', 'sua', 'pelo', 'pela', 'até', 'ate',
  'dele', 'dela', 'mas', 'por', 'ser', 'tem', 'foi', 'vai', 'são', 'sao', 'sem',
  'the', 'and', 'for', 'from', 'with', 'this', 'that', 'how', 'what', 'why', 'when',
  'will', 'can', 'are', 'was', 'were', 'has', 'have', 'had', 'you', 'your', 'out',
  'all', 'get', 'got', 'its', 'his', 'her', 'who', 'new', 'now', 'one', 'two',
  'into', 'over', 'after', 'about', 'been', 'being', 'than', 'then', 'them', 'they',
  'there', 'here', 'just', 'only', 'most', 'more', 'some', 'such', 'also', 'very',
  'much', 'many',
]);

function tokenize(text) {
  return (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function jaccard(a, b) {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a), setB = new Set(b);
  let intersection = 0;
  setA.forEach((t) => { if (setB.has(t)) intersection += 1; });
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

function findDuplicateHit(title, summary, articles) {
  const tokens = tokenize(title + ' ' + summary);
  if (tokens.length === 0) return null;
  let best = null;
  for (const article of articles) {
    const articleTokens = tokenize(article.title + ' ' + (article.tags || []).join(' '));
    const score = jaccard(tokens, articleTokens);
    if (score > 0 && (!best || score > best.score)) best = { article, score };
  }
  if (!best || best.score < SIMILAR_THRESHOLD) return null;
  return {
    articleId: best.article.id,
    articleTitle: best.article.title,
    articleSlug: best.article.slug,
    url: '/' + best.article.category.slug + '/' + best.article.slug,
    score: Number(best.score.toFixed(2)),
    reason: 'Semelhança de termos com "' + best.article.title + '" (score ' + best.score.toFixed(2) + ')',
  };
}

async function fetchFeed(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const endpoint = RSS2JSON + '?rss_url=' + encodeURIComponent(url);
    const res = await fetch(endpoint, { signal: controller.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error(data.message || 'feed indisponível');
    return data.items || [];
  } finally {
    clearTimeout(timer);
  }
}

const FEEDS = [
  { id: 'bing-en', label: 'Bing News (inglês)', url: 'https://www.bing.com/news/search?q=GTA+6&format=RSS' },
  { id: 'bing-ptbr', label: 'Bing News (pt-BR)', url: 'https://www.bing.com/news/search?q=GTA+6&setmkt=pt-BR&setlang=pt&format=RSS' },
  { id: 'bing-jason-lucia', label: 'Bing News (Jason e Lucia)', url: 'https://www.bing.com/news/search?q=%22Jason%22+%22Lucia%22+GTA&format=RSS' },
  { id: 'bing-vice-city-leonida', label: 'Bing News (Vice City / Leonida)', url: 'https://www.bing.com/news/search?q=%22GTA+VI%22+OR+%22Vice+City%22+OR+%22Leonida%22&format=RSS' },
  { id: 'bing-lancamento', label: 'Bing News (lançamento GTA VI)', url: 'https://www.bing.com/news/search?q=%22GTA+VI%22+launch+OR+lan%C3%A7amento+OR+release&format=RSS' },
  { id: 'bing-rockstar', label: 'Bing News (Rockstar Games + GTA)', url: 'https://www.bing.com/news/search?q=%22Rockstar+Games%22+%22GTA%22&format=RSS' },
];

async function fetchAllFeeds() {
  const byId = new Map();
  const warnings = [];
  for (const feed of FEEDS) {
    try {
      const items = await fetchFeed(feed.url);
      for (const raw of items) {
        const title = stripHtml(raw.title || '');
        const summary = stripHtml(raw.description || raw.content || '');
        const url = extractRealUrl(raw.link || '');
        if (!title || !url) continue;
        const domain = domainOf(url);
        const info = resolveSourceInfo(domain);
        const { classification, signals } = classifyItem(title, summary, info.tier);
        const item = {
          id: hashId(url),
          title,
          publishedAt: toIso(raw.pubDate || ''),
          source: feed.label.replace(/^Bing News \((.*)\)$/, '$1'),
          sourceDomain: domain,
          url,
          summary,
          classification,
          classificationSignals: signals,
          tier: info.tier,
          tierLabel: info.label,
          sourceType: info.sourceType,
        };
        const existing = byId.get(item.id);
        if (!existing || item.tier < existing.tier) byId.set(item.id, item);
      }
    } catch (err) {
      warnings.push(feed.label + ': ' + err.message);
    }
  }
  const items = [...byId.values()].sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
  return { items, warnings };
}

function selectBestPauta(items, articles, state) {
  const publishedHashes = new Set(state.publishedPautaHashes || []);
  const candidates = [];
  for (const item of items) {
    if (publishedHashes.has(item.id)) continue;
    const duplicate = findDuplicateHit(item.title, item.summary, articles);
    if (duplicate && duplicate.score >= DUPLICATE_THRESHOLD) continue;
    let score = 0;
    if (item.tier <= 2) score += 40;
    else if (item.tier <= 3) score += 30;
    else if (item.tier <= 4) score += 20;
    else score += 5;
    if (item.classification === 'confirmed') score += 25;
    else if (item.classification === 'rumor') score += 10;
    else score += 5;
    const ageHours = (Date.now() - new Date(item.publishedAt || 0).getTime()) / 3600000;
    if (ageHours < 24) score += 20;
    else if (ageHours < 72) score += 10;
    else if (ageHours < 168) score += 5;
    if (duplicate) score -= 15;
    const titleLower = item.title.toLowerCase();
    if (/\b(gta\s*6|gta\s*vi|grand\s*theft\s*auto)\b/i.test(titleLower)) score += 10;
    if (/\b(rockstar|take-two|take\s*two)\b/i.test(titleLower)) score += 5;
    if (/\b(release|lançamento|launch|data)\b/i.test(titleLower)) score += 5;
    candidates.push({ item, score, duplicate });
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0] || null;
}

function getNextId(articles) {
  let max = 104;
  for (const a of articles) {
    const n = parseInt(a.id, 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return max + 1;
}

function generateArticle(pauta, nextId, imageResult) {
  const today = new Date().toISOString().slice(0, 10);
  const nowIso = new Date().toISOString();
  const item = pauta.item;
  const classificationLabel = item.classification === 'confirmed' ? 'Fato confirmado'
    : item.classification === 'rumor' ? 'Rumor' : 'Especulação';
  const classificationNote = item.classification === 'confirmed'
    ? 'Esta informação foi confirmada por fontes confiáveis e pode ser tratada como fato.'
    : item.classification === 'rumor'
    ? 'Atenção: trata-se de um rumor. A informação ainda não foi confirmada oficialmente e deve ser tratada com cautela até que haja anúncio oficial.'
    : 'Esta informação é baseada em especulação ou análise de fontes do setor. Ainda não há confirmação oficial.';
  const slugSeed = item.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60) || 'gta-6-' + today;
  const slug = slugSeed + '-auto-' + nextId;
  const sourceRef = { title: item.sourceDomain + ' — ' + item.title, url: item.url, type: item.sourceType };
  const tags = ['GTA 6', 'Rockstar Games', 'games'];
  const titleLower = item.title.toLowerCase();
  if (/rockstar/i.test(titleLower)) tags.push('Rockstar Games');
  if (/vice\s*city|leonida/i.test(titleLower)) tags.push('Vice City');
  if (/jason|lucia/i.test(titleLower)) tags.push('Jason e Lucia');
  if (/lan[çc]amento|release|data/i.test(titleLower)) tags.push('lançamento');
  if (/trailer/i.test(titleLower)) tags.push('trailer');
  if (/take[-\s]?two/i.test(titleLower)) tags.push('Take-Two');
  if (/xbox|playstation|ps5|series\s*x/i.test(titleLower)) tags.push('consoles');
  const uniqueTags = [...new Set(tags)].slice(0, 8);
  const excerpt = item.summary.length > 200 ? item.summary.slice(0, 197) + '...' : item.summary;
  const content = [
    '<h2>' + item.title + '</h2>',
    '<p>' + item.summary + '</p>',
    '<p><strong>Classificação:</strong> ' + classificationLabel + ' · <strong>Fonte:</strong> ' + item.tierLabel + ' (' + item.sourceDomain + ') · <strong>Publicação original:</strong> ' + (item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('pt-BR') : 'data desconhecida') + '</p>',
    '<p>' + classificationNote + '</p>',
    '<h2>O Que Sabemos Até Agora</h2>',
    '<p>Segundo a fonte consultada, ' + item.summary.toLowerCase().replace(/\.$/, '') + '. A informação foi veiculada por <strong>' + item.sourceDomain + '</strong>, classificada neste artigo como <em>' + item.tierLabel + '</em>.</p>',
    '<h3>Detalhes da Fonte</h3>',
    '<ul>',
    '<li><strong>Veículo:</strong> ' + item.source + '</li>',
    '<li><strong>Domínio:</strong> ' + item.sourceDomain + '</li>',
    '<li><strong>Classificação editorial:</strong> ' + classificationLabel + '</li>',
    '<li><strong>Indicadores:</strong> ' + item.classificationSignals.join(', ') + '</li>',
    '</ul>',
    '<h2>Contexto: O Caminho Até Aqui</h2>',
    '<p>Grand Theft Auto VI é um dos jogos mais aguardados da próxima geração. Desenvolvido pela Rockstar Games, o título promete retornar a Vice City e a fictícia Flórida de Leonida, com os protagonistas Jason e Lucia. A Take-Two Interactive, holding controladora da Rockstar, tem mantido o lançamento para o segundo semestre de 2025, embora rumores sobre possíveis atrasos circulem periodicamente na imprensa especializada.</p>',
    '<p>Esta nova informação se encaixa nesse cenário de expectativa. ' + (item.classification === 'confirmed' ? 'Por vir de fonte confiável, o dado pode ser considerado parte do quadro oficial do desenvolvimento do jogo.' : 'Por se tratar de informação ainda não confirmada, o dado deve ser recebido com cautela até que haja pronunciamento oficial da Rockstar Games ou da Take-Two.') + '</p>',
    '<h2>Impacto para a Comunidade Gamer</h2>',
    '<p>Notícias sobre GTA 6 costumam gerar grande repercussão entre jogadores e na indústria como um todo. ' + (item.classification === 'confirmed' ? 'Com esta confirmação, a comunidade pode começar a se preparar para os próximos passos do lançamento.' : 'Enquanto a informação não é confirmada, o debate nas redes sociais e fóruns especializados tende a crescer, como costuma acontecer com qualquer novidade envolvendo a franquia.') + '</p>',
    '<h2>Conclusão</h2>',
    '<p>' + item.summary + ' ' + classificationNote + ' Acompanhe o NexoraComic para mais atualizações sobre GTA 6 e outros títulos relevantes da indústria gamer.</p>',
  ].join('\n      ');
  
  // Imagem de capa: usa resultado do findRelevantImage (busca dinâmica por tema)
  const img = imageResult && imageResult.ok ? imageResult.image : null;
  const featuredImage = img ? img.usedUrl : 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f2/Downtown_Miami_skyline_20100305.jpg/1280px-Downtown_Miami_skyline_20100305.jpg';
  const imageAlt = img ? (img.file.replace(/^File:/, '').replace(/\.[^.]+$/, '') + ' — imagem de capa relacionada ao tema') : 'Skyline noturna do centro de Miami, cidade que inspirou Vice City em GTA VI';
  
  return {
    id: String(nextId),
    slug,
    title: item.title,
    excerpt,
    content: '\n      ' + content + '\n    ',
    category: { id: 'games', slug: 'games', name: 'Games', description: 'Notícias de games, tecnologia por trás dos jogos e análise da indústria', color: '#ef4444' },
    tags: uniqueTags,
    author: { id: '1', name: 'Equipe NexoraComic' },
    publishedAt: today,
    readingTime: Math.max(3, Math.min(8, Math.ceil(item.summary.split(/\s+/).length / 200))),
    featuredImage,
    imageAlt,
    sources: [sourceRef],
    meta: {
      generatedAt: nowIso,
      generator: 'auto-pipeline',
      classification: item.classification,
      pautaTitle: item.title,
      pautaUrl: item.url,
      pautaSource: item.sourceDomain,
      pautaId: item.id,
      imageTheme: img ? img.theme : 'fallback',
      imageLicense: img ? img.license : 'CC BY-SA 3.0',
      imageArtist: img ? img.artist : 'Desconhecido',
      imageCommonsUrl: img ? img.commonsUrl : null,
      imageSearchQuery: img ? img.searchQuery : null,
    },
  };
}

function insertArticle(article) {
  const text = readFileSync(ARTICLES_FILE, 'utf8');
  const region = findAutoRegion(text);
  if (!region) {
    const idx = text.lastIndexOf('];');
    if (idx < 0) throw new Error('Fechamento do array não encontrado');
    const newText = text.slice(0, idx) +
      '\n\n  // [AUTO:BEGIN] Artigos gerados pela automação do Radar GTA 6 (não editar manualmente dentro desta região).\n' +
      '  ' + JSON.stringify(article, null, 2).split('\n').join('\n  ') + '\n' +
      '  // [AUTO:END]\n' +
      text.slice(idx);
    writeFileSync(ARTICLES_FILE, newText, 'utf8');
    return;
  }
  const before = text.slice(0, region.end);
  const after = text.slice(region.end);
  const articleStr = '  ' + JSON.stringify(article, null, 2).split('\n').join('\n  ') + ',\n  ';
  const newText = before + articleStr + after;
  writeFileSync(ARTICLES_FILE, newText, 'utf8');
}

// ── Validação obrigatória da imagem de capa ─────────────────────────────────
// Todo artigo automático só pode ser publicado com featuredImage validada
// (HTTP 200 + content-type image/*). Se falhar, NÃO publica, registra o motivo
// e preserva a pauta para nova tentativa na próxima execução.

const IMAGE_TIMEOUT_MS = 12000;

async function validateFeaturedImage(url) {
  const result = { ok: false, status: null, contentType: null, error: null };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS);
  try {
    let res = null;
    try {
      res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
    } catch {
      res = null;
    }
    // Alguns hosts rejeitam HEAD → tenta GET parcial
    if (!res || res.status === 405 || res.status === 403 || res.status === 501 || !res.headers) {
      res = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal, headers: { Range: 'bytes=0-2047' } });
    }
    result.status = res.status;
    result.contentType = res.headers.get('content-type');
    if (res.status !== 200 && res.status !== 206) {
      result.error = 'HTTP ' + res.status;
      return result;
    }
    if (!String(result.contentType || '').toLowerCase().startsWith('image/')) {
      result.error = 'content-type não é imagem: ' + (result.contentType || 'vazio');
      return result;
    }
    result.ok = true;
    return result;
  } catch (err) {
    result.error = (err && err.name === 'AbortError') ? 'timeout/abort' : String((err && err.message) || err);
    return result;
  } finally {
    clearTimeout(timer);
  }
}

export async function runPipeline(options = {}) {
  const dryRun = !!options.dryRun;
  const log = [];
  const addLog = (msg) => { log.push(msg); console.log(msg); };
  addLog('[pipeline] Início — ' + new Date().toISOString());
  addLog('[pipeline] Modo: ' + (dryRun ? 'DRY-RUN' : 'PUBLICAÇÃO'));
  const state = loadState();
  const articles = getArticles();
  addLog('[pipeline] Artigos no acervo: ' + articles.length);
  addLog('[pipeline] Pautas já publicadas (state): ' + (state.publishedPautaHashes || []).length);
  addLog('[pipeline] Buscando feeds...');
  const { items, warnings } = await fetchAllFeeds();
  addLog('[pipeline] Itens encontrados: ' + items.length);
  if (warnings.length > 0) {
    addLog('[pipeline] Avisos de fetch: ' + warnings.length);
    warnings.forEach((w) => addLog('  ⚠ ' + w));
  }
  if (items.length === 0) {
    return { success: true, published: false, reason: 'no_feed_items', log };
  }
  addLog('[pipeline] Selecionando melhor pauta...');
  const best = selectBestPauta(items, articles, state);
  if (!best) {
    return { success: true, published: false, reason: 'no_suitable_topic', log };
  }
  addLog('[pipeline] Pauta selecionada: "' + best.item.title + '" (score ' + best.score + ', tier ' + best.item.tier + ', ' + best.item.classification + ')');
  addLog('[pipeline] Fonte: ' + best.item.sourceDomain + ' — ' + best.item.url);
  if (best.duplicate) {
    addLog('[pipeline] Duplicata detectada (score ' + best.duplicate.score + '): ' + best.duplicate.articleTitle);
  }
  const nextId = getNextId(articles);
  addLog('[pipeline] Próximo ID: ' + nextId);
  addLog('[pipeline] Buscando imagem de capa relacionada ao tema...');
  const imageResult = await findRelevantImage(best);
  if (imageResult.ok) {
    addLog('[pipeline] Imagem encontrada: "' + imageResult.image.file + '" [' + imageResult.image.license + '] (tema: ' + imageResult.theme + ')');
  } else {
    addLog('[pipeline] ⚠ Imagem não encontrada: ' + (imageResult.error || 'motivo desconhecido'));
  }
  const article = generateArticle(best, nextId, imageResult);
  addLog('[pipeline] Artigo gerado: "' + article.title + '" (slug: ' + article.slug + ')');
  addLog('[pipeline] Tags: ' + article.tags.join(', '));
  addLog('[pipeline] Fontes: ' + article.sources.map((s) => s.url).join(', '));

  // GARANTIA: a capa precisa validar antes de qualquer publicação.
  const imageCheck = await validateFeaturedImage(article.featuredImage);
  if (!imageCheck.ok && !dryRun) {
    const reason = 'featured_image_invalid: ' + (imageCheck.error || 'desconhecido') + ' | url: ' + article.featuredImage;
    addLog('[pipeline] ⚠ Publicação bloqueada — ' + reason);
    addLog('[pipeline] A pauta NÃO foi marcada como publicada; nova tentativa ocorrerá na próxima execução.');
    saveState({ ...state, lastRun: new Date().toISOString(), lastImageFailure: { at: new Date().toISOString(), pautaId: best.item.id, reason } });
    return { success: false, published: false, reason: 'featured_image_invalid', imageCheck, log };
  }
  if (imageCheck.ok) {
    addLog('[pipeline] Imagem de capa validada (HTTP ' + imageCheck.status + ', ' + imageCheck.contentType + ')');
  } else {
    addLog('[pipeline] ⚠ (dry-run) Imagem de capa inválida — em execução real a publicação seria bloqueada.');
  }

  if (dryRun) {
    return {
      success: true,
      published: false,
      reason: 'dry_run',
      dryRun: true,
      wouldPublish: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        category: article.category.slug,
        tags: article.tags,
        sources: article.sources,
        classification: best.item.classification,
        pauta: { title: best.item.title, url: best.item.url, source: best.item.sourceDomain },
        duplicate: best.duplicate,
        image: {
          featuredImage: article.featuredImage,
          imageAlt: article.imageAlt,
          theme: imageResult.theme,
          license: imageResult.ok ? imageResult.image.license : 'fallback',
          artist: imageResult.ok ? imageResult.image.artist : 'Desconhecido',
          commonsUrl: imageResult.ok ? imageResult.image.commonsUrl : null,
          file: imageResult.ok ? imageResult.image.file : null,
        },
      },
      log,
    };
  }
  insertArticle(article);
  addLog('[pipeline] Artigo inserido em lib/articles.ts');
  
  // Persistir créditos da imagem em _commons_picks.json
  addCommonsPick(article.id, imageResult);
  if (imageResult && imageResult.ok) {
    addLog('[pipeline] Créditos da imagem registrados em _commons_picks.json');
  }
  const newPautaHashes = [...(state.publishedPautaHashes || []), best.item.id];
  saveState({ ...state, publishedPautaHashes: newPautaHashes, lastRun: new Date().toISOString() });
  addLog('[pipeline] State atualizado');
  return {
    success: true,
    published: true,
    articleId: article.id,
    title: article.title,
    slug: article.slug,
    source: best.item.sourceDomain,
    timestamp: new Date().toISOString(),
    log,
  };
}

export { fetchAllFeeds, selectBestPauta, generateArticle, getNextId, findDuplicateHit, findRelevantImage, addCommonsPick };
