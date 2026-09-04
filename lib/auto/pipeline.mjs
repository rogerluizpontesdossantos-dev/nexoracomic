// pipeline.mjs — núcleo automático de publicação (GTA 6 / Minecraft / Terraria)
// Busca pautas reais em fontes reais, seleciona a melhor, gera artigo com
// imagem validada (Wikimedia Commons), registra créditos e insere em
// lib/articles.ts dentro da região [AUTO:BEGIN]...[AUTO:END].
// Tudo em ESM puro. Executado por scripts/auto-dry-run.mjs e auto-run.mjs.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { getArticles, loadState, saveState, findAutoRegion, ARTICLES_FILE, PROJECT_ROOT, AUTO_END } from "./store.mjs";
import { findRelevantImage } from "./image-finder.mjs";

const COMMONS_PICKS_FILE = path.join(PROJECT_ROOT, "_commons_picks.json");

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
  const exists = picks.some((p) => String(p.articleId) === String(articleId));
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

// ── Tópicos editoriais (GTA 6 / Minecraft / Terraria) ──────────────────────
const TOPICS = {
  gta6: {
    label: "GTA 6",
    baseTags: ["GTA 6", "Rockstar Games", "games"],
    category: { id: "games", slug: "games", name: "Games", description: "Notícias de games, tecnologia por trás dos jogos e análise da indústria", color: "#ef4444" },
    feeds: [
      { label: "Rockstar Games", url: "https://www.rockstargames.com/newswire/rss" },
      { label: "IGN", url: "https://www.ign.com/games/grand-theft-auto-vi/rss" },
      { label: "GameSpot", url: "https://www.gamespot.com/gta-6/rss" },
      { label: "Bing News (pt-BR)", url: "https://www.bing.com/news/search?q=GTA+6&setmkt=pt-BR&setlang=pt&format=RSS" },
    ],
  },
  minecraft: {
    label: "Minecraft",
    baseTags: ["Minecraft", "Mojang", "games"],
    category: { id: "games", slug: "games", name: "Games", description: "Notícias de games, tecnologia por trás dos jogos e análise da indústria", color: "#ef4444" },
    feeds: [
      { label: "Minecraft.net", url: "https://www.minecraft.net/en-us/article/rss" },
      { label: "IGN", url: "https://www.ign.com/games/minecraft/rss" },
      { label: "Bing News (pt-BR)", url: "https://www.bing.com/news/search?q=Minecraft&setmkt=pt-BR&setlang=pt&format=RSS" },
    ],
  },
  terraria: {
    label: "Terraria",
    baseTags: ["Terraria", "Re-Logic", "games"],
    category: { id: "games", slug: "games", name: "Games", description: "Notícias de games, tecnologia por trás dos jogos e análise da indústria", color: "#ef4444" },
    feeds: [
      { label: "Terraria Forums", url: "https://forums.terraria.org/index.php?forums/news.72/index.rss" },
      { label: "IGN", url: "https://www.ign.com/games/terraria/rss" },
      { label: "Bing News (pt-BR)", url: "https://www.bing.com/news/search?q=Terraria&setmkt=pt-BR&setlang=pt&format=RSS" },
    ],
  },
};

const REAL_SOURCE_HINTS = {
  "rockstargames.com": "Rockstar Games",
  "ign.com": "IGN",
  "gamespot.com": "GameSpot",
  "pcgamer.com": "PC Gamer",
  "minecraft.net": "Minecraft.net",
  "mojang.com": "Mojang",
  "terraria.org": "Terraria",
  "forums.terraria.org": "Terraria Forums",
};

// ── TIERS (classificação de fonte) ──────────────────────────────────────────
const TIERS = {
  "rockstargames.com": { tier: 1, label: "Fonte oficial (Rockstar Games)", sourceType: "company" },
  "blog.playstation.com": { tier: 2, label: "Fonte oficial relacionada", sourceType: "company" },
  "playstation.com": { tier: 2, label: "Fonte oficial relacionada", sourceType: "company" },
  "news.xbox.com": { tier: 2, label: "Fonte oficial relacionada", sourceType: "company" },
  "xbox.com": { tier: 2, label: "Fonte oficial relacionada", sourceType: "company" },
  "mojang.com": { tier: 1, label: "Fonte oficial (Mojang)", sourceType: "company" },
  "minecraft.net": { tier: 1, label: "Fonte oficial (Minecraft.net)", sourceType: "company" },
  "terraria.org": { tier: 2, label: "Fonte oficial relacionada (Re-Logic)", sourceType: "company" },
  "ign.com": { tier: 3, label: "Portal especializado em games", sourceType: "publication" },
  "gamespot.com": { tier: 3, label: "Portal especializado em games", sourceType: "publication" },
  "polygon.com": { tier: 3, label: "Portal especializado em games", sourceType: "publication" },
  "pcgamer.com": { tier: 3, label: "Portal especializado em games", sourceType: "publication" },
  "techtudo.com.br": { tier: 3, label: "Portal especializado em games", sourceType: "publication" },
  "canaltech.com.br": { tier: 3, label: "Portal especializado em games", sourceType: "publication" },
  "tecmundo.com.br": { tier: 3, label: "Portal especializado em games", sourceType: "publication" },
  "bbc.com": { tier: 4, label: "Veículo jornalístico", sourceType: "journal" },
  "theverge.com": { tier: 4, label: "Veículo jornalístico", sourceType: "journal" },
  "nytimes.com": { tier: 4, label: "Veículo jornalístico", sourceType: "journal" },
};

const DEFAULT_TIER = { tier: 5, label: "Fonte a verificar", sourceType: "other" };

function resolveSourceInfo(domain) {
  const clean = (domain || "").toLowerCase().replace(/^www\./, "");
  if (TIERS[clean]) return TIERS[clean];
  if (clean.endsWith(".msn.com")) return { tier: 5, label: "Agregador (MSN)", sourceType: "other" };
  const base = clean.split(".").slice(-2).join(".");
  if (TIERS[base]) return TIERS[base];
  return DEFAULT_TIER;
}

function resolveSourceLabel(domain) {
  if (REAL_SOURCE_HINTS[domain]) return REAL_SOURCE_HINTS[domain];
  const info = resolveSourceInfo(domain);
  return info.tier <= 4 ? info.label : (domain || "fonte não mapeada");
}



// ── Classificação de rumor/especulação ──────────────────────────────────────
const RUMOR_MARKERS = [
  /\brumores?\b/i, /\brumored\b/i, /\brumour(s|ed)?\b/i, /\balega\b/i, /\balegado\b/i,
  /\bsuposto\b/i, /\bsuposta\b/i, /\baparentemente\b/i, /\bposs[ií]vel(mente)?\b/i,
  /\bins?inua\b/i, /\bnão oficial\b/i, /\bsem confirmação\b/i, /\bunconfirmed\b/i,
  /\bunverified\b/i, /\balleged(ly)?\b/i, /\breported(?:ly)?\b/i, /\bclaims?\b/i,
  /\bsuggests?\b/i, /\bsuspected\b/i, /\bvazamento\b/i, /\bvazou\b/i, /\bleak(ed|s)?\b/i,
];
const SPEC_MARKERS = [
  /\bespecul(a|aões|ção)\b/i, /\bespera(-se)?\b/i, /\bdeverá\b/i,
  /\bprovável\b/i, /\btendência\b/i, /\bpode ser que\b/i, /\bimagina(?:se|-se)?\b/i,
  /\bspecu/, /\bprediction|predicts?\b/i, /\bwhat if\b/i, /\bexpected to\b/i,
  /\blikely\b/i, /\bcould\b/i, /\bmay\b/i, /\bmight\b/i, /\bwould\b/i,
];

function classifyItem(title, summary, tier) {
  const text = title + " " + summary;
  const rumorHits = RUMOR_MARKERS.filter((r) => r.test(text));
  const specHits = SPEC_MARKERS.filter((r) => r.test(text));
  if (tier === 1 || tier === 2) return { classification: "confirmed", signals: ["anúncio de fonte oficial (tier 1–2)"] };
  if (rumorHits.length > 0) return { classification: "rumor", signals: rumorHits.map((r) => r.toString()) };
  if (specHits.length > 0) return { classification: "speculation", signals: specHits.map((r) => r.toString()) };
  if (tier === 3 || tier === 4) return { classification: "confirmed", signals: ["linguagem factual em fonte especializada/jornalística (tier 3–4)"] };
  return { classification: "speculation", signals: ["fonte não reconhecida — verificar antes de usar"] };
}

function extractRealUrl(link) {
  if (!link) return "";
  try {
    const url = new URL(link);
    const inner = url.searchParams.get("url");
    if (inner && /^https?:\/\//i.test(inner)) return inner;
  } catch { /* link malformado */ }
  return link;
}

function domainOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; }
}

function stripHtml(html) {
  return (html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function toIso(pubDate) {
  if (!pubDate) return "";
  const normalized = pubDate.trim().replace(" ", "T");
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(normalized);
  return new Date(hasZone ? normalized : normalized + "Z").toISOString();
}

function hashId(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) { hash = (hash << 5) - hash + text.charCodeAt(i); hash |= 0; }
  return "r" + Math.abs(hash).toString(36);
}

const STOPWORDS = new Set([
  "que", "com", "para", "uma", "como", "mais", "sobre", "isso", "esse", "essa",
  "aqui", "dos", "das", "não", "nao", "seu", "sua", "pelo", "pela", "até", "ate",
  "dele", "dela", "mas", "por", "ser", "tem", "foi", "vai", "são", "sao", "sem",
  "the", "and", "for", "from", "with", "this", "that", "how", "what", "why", "when",
  "will", "can", "are", "was", "were", "has", "have", "had", "you", "your", "out",
]);

function tokenize(text) {
  return (text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOPWORDS.has(w));
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
  const tokens = tokenize(title + " " + summary);
  if (tokens.length === 0) return null;
  let best = null;
  for (const article of articles) {
    const articleTokens = tokenize(article.title + " " + (article.tags || []).join(" "));
    const score = jaccard(tokens, articleTokens);
    if (score > 0 && (!best || score > best.score)) best = { article, score };
  }
  if (!best || best.score < SIMILAR_THRESHOLD) return null;
  return {
    articleId: best.article.id,
    articleTitle: best.article.title,
    articleSlug: best.article.slug,
    url: "/" + best.article.category.slug + "/" + best.article.slug,
    score: Number(best.score.toFixed(2)),
    reason: 'Semelhança de termos com "' + best.article.title + '" (score ' + best.score.toFixed(2) + ")",
  };
}

  };
}

async function fetchFeed(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const endpoint = RSS2JSON + "?rss_url=" + encodeURIComponent(url);
    const res = await fetch(endpoint, { signal: controller.signal });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    if (data.status !== "ok") throw new Error(data.message || "feed indisponível");
    return data.items || [];
  } finally {
    clearTimeout(timer);
  }
}

// Rodação de tópicos: garante que GTA 6 / Minecraft / Terraria recebam atenção
// equilibrada. Usa state.lastTopicIndex como ponteiro.
function selectTopicByRound(state) {
  const order = ["gta6", "minecraft", "terraria"];
  let idx = 0;
  try {
    const last = Number(state.lastTopicIndex || 0) % order.length;
    idx = (last + 1) % order.length;
  } catch { idx = 0; }
  return order[idx];
}

function getFeedsForTopic(topicKey) {
  const t = TOPICS[topicKey];
  return t ? t.feeds : TOPICS.gta6.feeds;
}

async function fetchAllFeeds(topicKey) {
  const feeds = getFeedsForTopic(topicKey);
  const byId = new Map();
  const warnings = [];
  for (const feed of feeds) {
    try {
      const items = await fetchFeed(feed.url);
      for (const raw of items) {
        const title = stripHtml(raw.title || "");
        const summary = stripHtml(raw.description || raw.content || "");
        const url = extractRealUrl(raw.link || "");
        if (!title || !url) continue;
        const domain = domainOf(url);
        const info = resolveSourceInfo(domain);
        const { classification, signals } = classifyItem(title, summary, info.tier);
        const item = {
          id: hashId(url),
          title,
          publishedAt: toIso(raw.pubDate || ""),
          source: resolveSourceLabel(domain),
          sourceDomain: domain,
          url,
          summary,
          classification,
          classificationSignals: signals,
          tier: info.tier,
          tierLabel: info.label,
          sourceType: info.sourceType,
          topic: topicKey,
        };
        const existing = byId.get(item.id);
        if (!existing || item.tier < existing.tier) byId.set(item.id, item);
      }
    } catch (err) {
      warnings.push(feed.label + ": " + err.message);
    }
  }
  const items = [...byId.values()].sort(
    (a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0)
  );
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
    if (item.classification === "confirmed") score += 25;
    else if (item.classification === "rumor") score += 10;
    else score += 5;
    const ageHours = (Date.now() - new Date(item.publishedAt || 0).getTime()) / 3600000;
    if (ageHours < 24) score += 20;
    else if (ageHours < 72) score += 10;
    else if (ageHours < 168) score += 5;
    if (duplicate) score -= 15;
    const t = TOPICS[item.topic];
    if (t) {
      score += 8; // prioriza o tópico da rodízio
      if (t.baseTags.some((tag) => item.title.toLowerCase().includes(tag.toLowerCase()))) score += 5;
    }
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
  return max + 1;
}

function buildIntroContext(item, topic, classificationLabel) {
  // Contexto editorial dinâmico por tópico — evita template repetitivo fixo.
  const sum = item.summary || "";
  const low = sum.toLowerCase();
  if (classificationLabel === "Rumor") {
    return {
      headline: item.title,
      summary: low,
      contexto:
        "Esse tipo de informação costuma aparecer em fontes não oficiais antes de " +
        "qualquer comunicação formal da desenvolvedora. Até que haja um anúncio " +
        "oficial, recomendamos tratar o conteúdo com cautela e voltar aqui após a " +
        "confirmação.",
    };
  }
  if (topic === "minecraft") {
    const ctx = /minecraft 1\.[6-9]|versão 1\.|snapshot|25w/i.test(low)
      ? "O desenvolvimento de Minecraft avança com atualizações e snapshots que chegam à comunidade para testes antes de cada release maior."
      : "Minecraft continua com as novidades da comunidade e das atualizações oficiais da Mojang e Microsoft.";
    return { headline: item.title, summary: low, contexto: ctx };
  }
  if (topic === "terraria") {
    const ctx = /terraria 1\.4|journey|1\.4\.4|update 1\.4/i.test(low)
      ? "A Re-Logic mantém Terraria viva com atualizações que equilibram o jogo e agradam tanto novos quanto veteranos."
      : "Terraria da Re-Logic costuma surpreender a comunidade com novidades que redefinem a experiência de sobrevivência 2D.";
    return { headline: item.title, summary: low, contexto: ctx };
  }
  // GTA 6
  return {
    headline: item.title,
    summary: low,
    contexto:
      "Grand Theft Auto VI é um dos jogos mais aguardados da próxima geração. " +
      (sum.includes("rockstar") || sum.includes("take-two")
        ? "Como parte da linha de comunicação da Rockstar Games e da Take-Two Interactive, " +
          "este dado se encaixa no ciclo de divulgação do título."
        : "Este desenvolvimento se soma ao cenário de expectativa ao redor do lançamento.") +
      " Rumores sobre possíveis atrasos ou adiantamentos circulem periodicamente na imprensa especializada.",
  };
}

function buildTags(topic, titleLower, baseTags) {
  const tags = [...baseTags];
  if (topic === "gta6") {
    if (/rockstar/i.test(titleLower)) tags.push("Rockstar Games");
    if (/vice\\s*city|leonida/i.test(titleLower)) tags.push("Vice City");
    if (/jason|lucia/i.test(titleLower)) tags.push("Jason e Lucia");
    if (/lan[çc]amento|release|data/i.test(titleLower)) tags.push("lançamento");
    if (/trailer/i.test(titleLower)) tags.push("trailer");
    if (/take[-\\s]?two/i.test(titleLower)) tags.push("Take-Two");
    if (/xbox|playstation|ps5|series\\s*x/i.test(titleLower)) tags.push("consoles");
  } else if (topic === "minecraft") {
    if (/java|bedrock/i.test(titleLower)) tags.push(titleLower.includes("java") ? "Minecraft Java" : "Minecraft Bedrock");
    if (/snapshot|update|versão|versao 1\.[6-9]/i.test(titleLower)) tags.push("Minecraft Update");
    if (/mojang/i.test(titleLower)) tags.push("Mojang");
  } else if (topic === "terraria") {
    if (/update|1\.4|journey/i.test(titleLower)) tags.push("Terraria Update");
    if (/re-logic/i.test(titleLower)) tags.push("Re-Logic");
    if (/terraria 2/i.test(titleLower)) tags.push("Terraria 2");
  }
  if (/tecnologia|tech/i.test(titleLower)) tags.push("tecnologia");
  return [...new Set(tags)].slice(0, 9);
}
  return [...new Set(tags)].slice(0, 9);
}

function generateArticle(pauta, nextId, imageResult) {
  const today = new Date().toISOString().slice(0, 10);
  const nowIso = new Date().toISOString();
  const item = pauta.item;
  const topic = pauta.topic || "gta6";
  const topicInfo = TOPICS[topic] || TOPICS.gta6;
  const { contexto } = buildIntroContext(item, topic, pauta.classification || "confirmed");
  const classificationLabel = item.classification === "confirmed" ? "Fato confirmado"
    : item.classification === "rumor" ? "Rumor" : "Especulação";
  const classificationNote = item.classification === "confirmed"
    ? "Esta informação foi confirmada por fontes confiáveis e pode ser tratada como fato."
    : item.classification === "rumor"
    ? "Atenção: trata-se de um rumor. A informação ainda não foi confirmada oficialmente e deve ser tratada com cautela até que haja anúncio oficial."
    : "Esta informação é baseada em especulação ou análise de fontes do setor. Ainda não há confirmação oficial.";

  const slugSeed = item.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60)
    || topic + "-" + today;
  const slug = slugSeed + "-auto-" + nextId;
  const sourceRef = { title: item.sourceDomain + " — " + item.title, url: item.url, type: item.sourceType };
  const titleLower = item.title.toLowerCase();
  const tags = buildTags(topic, titleLower, topicInfo.baseTags);
  const excerpt = (item.summary || "").length > 200 ? (item.summary || "").slice(0, 197) + "..." : (item.summary || "");

  const content = [
    "<h2>" + item.title + "</h2>",
    "<p>" + item.summary + "</p>",
    "<p><strong>Classificação:</strong> " + classificationLabel + " · <strong>Fonte:</strong> " + item.tierLabel + " (" + item.sourceDomain + ") · <strong>Veículo:</strong> " + item.source + " · <strong>Publicação original:</strong> " + (item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("pt-BR") : "data desconhecida") + "</p>",
    "<p>" + classificationNote + "</p>",
    "<h2>O Que Sabemos Até Agora</h2>",
    "<p>Segundo a fonte consultada, " + (item.summary || "").toLowerCase().replace(/\.$/, "") + ". A informação foi veiculada por <strong>" + item.sourceDomain + "</strong>, classificada neste artigo como <em>" + item.tierLabel + "</em>.</p>",
    "<h3>Detalhes da Fonte</h3>",
    "<ul><li><strong>Veículo:</strong> " + item.source + "</li><li><strong>Domínio:</strong> " + item.sourceDomain + "</li><li><strong>Classificação editorial:</strong> " + classificationLabel + "</li><li><strong>Indicadores:</strong> " + (item.classificationSignals || []).join(", ") + "</li></ul>",
    "<h2>Contexto: O Caminho Até Aqui</h2>",
    "<p>" + contexto + "</p>",
    "<h2>Impacto para a Comunidade</h2>",
    "<p>" + contexto + " " + (item.classification === "confirmed" ? "Por vir de fonte confiável, o dado pode ser considerado parte do quadro oficial." : "Por se tratar de informação ainda não confirmada, o dado deve ser recebido com cautela.") + "</p>",
    "<h2>Conclusão</h2>",
    "<p>" + item.summary + " " + classificationNote + " Acompanhe o NexoraComic para mais atualizações sobre " + topicInfo.label + " e outros títulos relevantes da indústria.</p>",
  ].join("\n      ");

  const img = imageResult && imageResult.ok ? imageResult.image : null;
  const featuredImage = img ? img.usedUrl : "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f2/Downtown_Miami_skyline_20100305.jpg/1280px-Downtown_Miami_skyline_20100305.jpg";
  const imageAlt = img ? (img.file.replace(/^File:/, "").replace(/\.[^.]+$/, "") + " — imagem de capa relacionada ao tema") : "Imagem ilustrativa relacionada ao tema";

  return {
    id: String(nextId),
    slug,
    title: item.title,
    excerpt,
    content: "\n      " + content + "\n    ",
    category: topicInfo.category,
    tags,
    author: { id: "1", name: "Equipe NexoraComic" },
    publishedAt: today,
    readingTime: Math.max(3, Math.min(8, Math.ceil((item.summary || "").split(/\s+/).length / 200))),
    featuredImage,
    imageAlt,
    sources: [sourceRef],
    meta: {
      generatedAt: nowIso,
      generator: "auto-pipeline",
      classification: item.classification,
      pautaTitle: item.title,
      pautaUrl: item.url,
      pautaSource: item.sourceDomain,
      pautaId: item.id,
      topic,
      imageTheme: img ? img.theme : "fallback",
      imageLicense: img ? img.license : "CC BY-SA 3.0",
      imageArtist: img ? img.artist : "Desconhecido",
      imageCommonsUrl: img ? img.commonsUrl : null,
      imageSearchQuery: img ? img.searchQuery : null,
    },
  };
}



}

};
};
}

function insertArticle(article) {
  const text = readFileSync(ARTICLES_FILE, "utf8");
  const region = findAutoRegion(text);
  if (!region) {
    const idx = text.lastIndexOf("];");
    if (idx < 0) throw new Error("Fechamento do array não encontrado");
    const newText = text.slice(0, idx) +
      "\n\n  // [AUTO:BEGIN] Artigos gerados pela automação do Radar GTA 6 (não editar manualmente dentro desta região).\n" +
      "  " + JSON.stringify(article, null, 2).split("\n").join("\n  ") + "\n" +
      "  // [AUTO:END]\n" +
      text.slice(idx);
    writeFileSync(ARTICLES_FILE, newText, "utf8");
    return;
  }
  const markerStart = region.end - AUTO_END.length;
  const lineStart = text.lastIndexOf("\n", markerStart) + 1;
  const before = text.slice(0, lineStart);
  const after = text.slice(lineStart);
  const articleStr = "  " + JSON.stringify(article, null, 2).split("\n").join("\n  ") + ",\n";
  const newText = before + articleStr + after;
  writeFileSync(ARTICLES_FILE, newText, "utf8");
  writeFileSync(ARTICLES_FILE, newText, "utf8");
}

// ── Validação obrigatória da imagem de capa ─────────────────────────────────
const IMAGE_TIMEOUT_MS = 12000;

async function validateFeaturedImage(url) {
  const result = { ok: false, status: null, contentType: null, error: null };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS);
  try {
    let res = null;
    try { res = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal }); } catch { res = null; }
    if (!res || res.status === 405 || res.status === 403 || res.status === 501 || !res.headers) {
      res = await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal, headers: { Range: "bytes=0-2047" } });
    }
    result.status = res.status;
    result.contentType = res.headers.get("content-type");
    if (res.status !== 200 && res.status !== 206) { result.error = "HTTP " + res.status; return result; }
    if (!String(result.contentType || "").toLowerCase().startsWith("image/")) { result.error = "content-type não é imagem: " + (result.contentType || "vazio"); return result; }
    result.ok = true;
    return result;
  } catch (err) {
    result.error = (err && err.name === "AbortError") ? "timeout/abort" : String((err && err.message) || err);
    return result;
  } finally { clearTimeout(timer); }
  } finally { clearTimeout(timer); }
}

export async function runPipeline(options = {}) {
  const dryRun = !!options.dryRun;
  const log = [];
  const addLog = (msg) => { log.push(msg); console.log(msg); };
  addLog("[pipeline] Início — " + new Date().toISOString());
  addLog("[pipeline] Modo: " + (dryRun ? "DRY-RUN" : "PUBLICAÇÃO"));
  const state = loadState();
  const articles = getArticles();
  addLog("[pipeline] Artigos no acervo: " + articles.length);
  addLog("[pipeline] Pautas já publicadas (state): " + (state.publishedPautaHashes || []).length);

  // Rodação de tópico: GTA 6 / Minecraft / Terraria
  const topic = selectTopicByRound(state);
  addLog("[pipeline] Tópico destino: " + (TOPICS[topic] ? TOPICS[topic].label : topic));
  addLog("[pipeline] Buscando feeds...");

  const { items, warnings } = await fetchAllFeeds(topic);
  addLog("[pipeline] Itens encontrados: " + items.length);
  if (warnings.length > 0) {
    addLog("[pipeline] Avisos de fetch: " + warnings.length);
    warnings.forEach((w) => addLog("  ⚠ " + w));
  }
  if (items.length === 0) {
    saveState({ ...state, lastRun: new Date().toISOString(), lastTopicIndex: Object.keys(TOPICS).indexOf(topic) });
    return { success: true, published: false, reason: "no_feed_items", topic, log };
  }

  addLog("[pipeline] Selecionando melhor pauta...");
  const best = selectBestPauta(items, articles, state);
  if (!best) {
    saveState({ ...state, lastRun: new Date().toISOString(), lastTopicIndex: Object.keys(TOPICS).indexOf(topic) });
    return { success: true, published: false, reason: "no_suitable_topic", topic, log };
  }
  addLog('[pipeline] Pauta selecionada: "' + best.item.title + '" (score ' + best.score + ', tier ' + best.item.tier + ', ' + best.item.classification + ')');
  addLog("[pipeline] Fonte: " + best.item.source + " — " + best.item.url);
  if (best.duplicate) {
    addLog("[pipeline] Duplicata detectada (score " + best.duplicate.score + "): " + best.duplicate.articleTitle);
  }

  const nextId = getNextId(articles);
  addLog("[pipeline] Próximo ID: " + nextId);
  addLog("[pipeline] Buscando imagem de capa relacionada ao tema...");
  const imageResult = await findRelevantImage(best);
  if (imageResult.ok) {
    addLog('[pipeline] Imagem encontrada: "' + imageResult.image.file + '" [' + imageResult.image.license + '] (tema: ' + imageResult.theme + ')');
  } else {
    addLog("[pipeline] ⚠ Imagem não encontrada: " + (imageResult.error || "motivo desconhecido"));
  }

  const article = generateArticle({ item: best.item, classification: best.item.classification, topic: best.item.topic }, nextId, imageResult);
  addLog('[pipeline] Artigo gerado: "' + article.title + '" (slug: ' + article.slug + ')');
  addLog("[pipeline] Tags: " + article.tags.join(", "));
  addLog("[pipeline] Fontes: " + article.sources.map((s) => s.url).join(", "));

  // GARANTIA: a capa precisa validar antes de qualquer publicação.
  const imageCheck = await validateFeaturedImage(article.featuredImage);
  if (!imageCheck.ok && !dryRun) {
    const reason = "featured_image_invalid: " + (imageCheck.error || "desconhecido") + " | url: " + article.featuredImage;
    addLog("[pipeline] ⚠ Publicação bloqueada — " + reason);
    addLog("[pipeline] A pauta NÃO foi marcada como publicada; nova tentativa na próxima execução.");
    saveState({ ...state, lastRun: new Date().toISOString(), lastTopicIndex: Object.keys(TOPICS).indexOf(topic), lastImageFailure: { at: new Date().toISOString(), pautaId: best.item.id, reason } });
    return { success: false, published: false, reason: "featured_image_invalid", imageCheck, topic, log };
  }
  if (imageCheck.ok) {
    addLog('[pipeline] Imagem de capa validada (HTTP ' + imageCheck.status + ', ' + imageCheck.contentType + ')');
  } else {
    addLog("[pipeline] ⚠ (dry-run) Imagem de capa inválida — em execução real a publicação seria bloqueada.");
  }

  if (dryRun) {
    return {
      success: true, published: false, reason: "dry_run", dryRun: true, topic,
      wouldPublish: {
        id: article.id, title: article.title, slug: article.slug,
        category: article.category.slug, tags: article.tags, sources: article.sources,
        classification: best.item.classification, topic,
        pauta: { title: best.item.title, url: best.item.url, source: best.item.source },
        duplicate: best.duplicate,
        image: { featuredImage: article.featuredImage, imageAlt: article.imageAlt, theme: imageResult.theme, license: imageResult.ok ? imageResult.image.license : "fallback", artist: imageResult.ok ? imageResult.image.artist : "Desconhecido", commonsUrl: imageResult.ok ? imageResult.image.commonsUrl : null, file: imageResult.ok ? imageResult.image.file : null },
      },
      log,
    };
  }

  insertArticle(article);
  addLog("[pipeline] Artigo inserido em lib/articles.ts");
  addCommonsPick(article.id, imageResult);
  if (imageResult && imageResult.ok) addLog("[pipeline] Créditos da imagem registrados em _commons_picks.json");

  const newPautaHashes = [...(state.publishedPautaHashes || []), best.item.id];
  saveState({ ...state, publishedPautaHashes: newPautaHashes, lastRun: new Date().toISOString(), lastTopicIndex: Object.keys(TOPICS).indexOf(topic) });
  addLog("[pipeline] State atualizado");

  return {
    success: true, published: true, articleId: article.id, title: article.title,
    slug: article.slug, featuredImage: article.featuredImage, category: article.category.slug,
    topic, source: best.item.source, sourceDomain: best.item.sourceDomain,
    timestamp: new Date().toISOString(), log,
  };
}

export { fetchAllFeeds, selectBestPauta, generateArticle, getNextId, findDuplicateHit, findRelevantImage, addCommonsPick, TOPICS, selectTopicByRound };

}

}

}


