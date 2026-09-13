// image-finder.mjs — busca imagem de capa relacionada ao tema da pauta
// no Wikimedia Commons, com licença verificável e URL validada.
// Uso: import { findRelevantImage } from './image-finder.mjs'

const API = 'https://commons.wikimedia.org/w/api.php';
const HEADERS = { 'User-Agent': 'NexoraComic-auto/1.0 (uso editorial; contato via site)' };
const TIMEOUT_MS = 15000;

const TOPIC_MAP = [
  {
    theme: 'gta6-vice-city',
    keywords: [/gta\s*6/i, /gta\s*vi/i, /vice\s*city/i, /leonida/i, /rockstar/i],
    queries: [
      'Miami skyline night',
      'Miami skyline',
      'Florida city aerial',
      'Miami downtown night',
      'city skyline night aerial',
    ],
  },
  {
    theme: 'games-hardware',
    keywords: [/playstation|xbox|nintendo|console|ps5|series\s*x|controller|gamepad/i],
    queries: [
      'video game console',
      'game controller handheld',
      'PlayStation 5 console',
      'Xbox Series X console',
      'gaming hardware RGB',
    ],
  },
  {
    theme: 'games-general',
    keywords: [/game|jogo|launch|lançamento|release|trailer/i],
    queries: [
      'video game arcade cabinet',
      'gaming computer setup',
      'esports tournament stage',
      'video game controller',
      'gaming setup RGB',
    ],
  },
  {
    theme: 'technology-computer',
    keywords: [/computador|laptop|hardware|chip|processor|servidor|data\s*center/i],
    queries: [
      'desktop computer',
      'laptop computer modern',
      'server room data center',
      'computer motherboard',
      'computer chip circuit board',
    ],
  },
  {
    theme: 'technology-ai',
    keywords: [/inteligência\s*artificial|artificial\s*intelligence|machine\s*learning|neural/i],
    queries: [
      'artificial intelligence',
      'neural network visualization',
      'machine learning',
      'robot laboratory',
      'computer artificial intelligence',
    ],
  },
  {
    theme: 'space',
    keywords: [/espaço|space|nasa|rocket|foguete|planeta|galaxy|nebula|telescope/i],
    queries: [
      'NASA rocket launch',
      'Hubble Space Telescope',
      'Milky Way galaxy night',
      'Orion Nebula space',
      'planet Earth from space',
      'spacecraft launch',
    ],
  },
  {
    theme: 'science',
    keywords: [/ciência|science|laboratório|laboratory|microscópio|microscope/i],
    queries: [
      'laboratory microscope',
      'science laboratory research',
      'chemistry laboratory',
      'physics experiment laboratory',
      'biological laboratory',
    ],
  },
  {
    theme: 'comics',
    keywords: [/quadrinhos|comic|hq|manga|cosplay|superhero|marvel|dc/i],
    queries: [
      'comic book store',
      'comic books shelf',
      'comic convention cosplay',
      'superhero cosplay',
      'manga bookstore interior',
    ],
  },
  {
    theme: 'movies-tv',
    keywords: [/filme|movie|cinema|tv|television|série|series|streaming|disney|netflix/i],
    queries: [
      'movie theater auditorium',
      'cinema projector film',
      'television studio broadcast',
      'film cinema camera',
      'streaming media device',
    ],
  },
  {
    theme: 'general',
    keywords: [],
    queries: [
      'city skyline night',
      'night cityscape',
      'urban landscape modern',
      'business district skyline',
      'modern architecture building',
    ],
  },
];


function detectTheme(title, summary) {
  const text = title + ' ' + (summary || '');
  for (const topic of TOPIC_MAP) {
    if (topic.keywords.length === 0) continue;
    for (const kw of topic.keywords) {
      if (kw.test(text)) return topic;
    }
  }
  return TOPIC_MAP.find((t) => t.theme === 'general');
}

function licenseOk(license) {
  const l = (license || '').toLowerCase();
  if (!l) return false;
  if (/(nc|nd|non-free|fair use|all rights reserved)/i.test(l)) return false;
  if (l.includes('public domain') || l.includes('cc0') || l.startsWith('pd')) return true;
  if (l.includes('no restrictions')) return true;
  if (/cc (by|by-sa)/.test(l)) return true;
  if (l.includes('attribution')) return true;
  if (l.includes('gfdl')) return true;
  return false;
}

async function fetchJson(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    let res = null;
    let attempt = 0;
    while (true) {
      try {
        res = await fetch(url, { headers: HEADERS, signal: ctrl.signal });
      } catch (e) {
        if (attempt >= 3) throw e;
      }
      if (res && res.status === 429) {
        attempt++;
        if (attempt > 4) throw new Error('HTTP 429 (rate limit persistente)');
        const wait = 3000 * attempt;
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      if (res && res.ok) return await res.json();
      throw new Error('HTTP ' + (res ? res.status : 'network'));
    }
  } finally {
    clearTimeout(t);
  }
}

async function verifyImageUrl(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    let res = null;
    try {
      res = await fetch(url, { method: 'HEAD', redirect: 'follow', headers: HEADERS, signal: ctrl.signal });
    } catch {
      res = null;
    }
    if (!res || res.status === 405 || res.status === 403 || res.status === 501) {
      res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        headers: { ...HEADERS, Range: 'bytes=0-2047' },
        signal: ctrl.signal,
      });
    }
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    const ok = (res.status === 200 || res.status === 206) && ct.startsWith('image/');
    return { ok, status: res.status, contentType: ct };
  } catch (err) {
    return { ok: false, status: null, contentType: null, error: String((err && err.message) || err) };
  } finally {
    clearTimeout(t);
  }
}

async function searchCommons(query) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    generator: 'search',
    gsrsearch: query + ' filetype:bitmap',
    gsrnamespace: '6',
    gsrlimit: '8',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size',
    iiurlwidth: '1280',
  });
  const data = await fetchJson(API + '?' + params.toString());
  const pages = (data.query && data.query.pages) || [];
  return pages
    .filter((p) => p.imageinfo && p.imageinfo[0])
    .map((p) => {
      const info = p.imageinfo[0];
      const meta = info.extmetadata || {};
      const strip = (s) => (s ? String(s).replace(/<[^>]*>/g, '').trim() : '');
      return {
        file: p.title,
        thumbUrl: info.thumburl || null,
        originalUrl: info.url,
        width: info.width,
        height: info.height,
        license: strip(meta.LicenseShortName && meta.LicenseShortName.value),
        artist: strip(meta.Artist && meta.Artist.value).slice(0, 120),
      };
    });
}


// ── Função principal ─────────────────────────────────────────────────────────

// Avalia a qualidade de um candidato (maior = melhor)
function scoreCandidate(c, query, theme) {
  let score = 0;
  // Resolução adequada
  const w = c.width || 0;
  if (w >= 1920) score += 30;
  else if (w >= 1280) score += 20;
  else if (w >= 800) score += 10;
  
  // Licença clara preferencial
  const l = (c.license || '').toLowerCase();
  if (l.includes('public domain') || l.includes('cc0')) score += 25;
  else if (/cc (by|by-sa)/.test(l)) score += 20;
  
  // Artista identificado
  if (c.artist && c.artist.length > 0) score += 10;
  
  // Query mais específica (primeiras queries são mais relevantes)
  const queryIndex = theme.queries.indexOf(query);
  if (queryIndex === 0) score += 15;
  else if (queryIndex === 1) score += 10;
  else if (queryIndex === 2) score += 5;
  
  // Imagens com nomes mais descritivos (menos genéricas)
  const fileLower = (c.file || '').toLowerCase();
  if (!fileLower.includes('thumb') && !fileLower.includes('small')) score += 5;
  
  // Penalizar imagens muito pequenas
  if (w < 1000) score -= 10;
  
  return score;
}

export async function findRelevantImage(pauta) {
  const title = pauta.item ? pauta.item.title : (pauta.title || '');
  const summary = pauta.item ? pauta.item.summary : (pauta.summary || '');
  const theme = detectTheme(title, summary);

  const result = {
    ok: false,
    theme: theme.theme,
    queries: [],
    tried: [],
    error: null,
  };

  const allCandidates = [];

  for (const query of theme.queries) {
    result.queries.push(query);
    let candidates = [];
    try {
      candidates = await searchCommons(query);
    } catch (err) {
      result.tried.push({ query, status: 'error', reason: err.message });
      await new Promise((r) => setTimeout(r, 2000));
      continue;
    }

    for (const c of candidates) {
      if ((c.width || 0) < 800) {
        result.tried.push({ query, status: 'skipped', reason: 'imagem pequena' });
        continue;
      }
      if (!licenseOk(c.license)) {
        result.tried.push({ query, status: 'skipped', reason: 'licença inválida: ' + (c.license || 'desconhecida') });
        continue;
      }
      const urlToUse = c.thumbUrl || c.originalUrl;
      const v = await verifyImageUrl(urlToUse);
      if (!v.ok) {
        result.tried.push({ query, status: 'skipped', reason: 'URL não validou: ' + (v.error || v.status) });
        continue;
      }
      const score = scoreCandidate(c, query, theme);
      allCandidates.push({
        candidate: c,
        urlToUse,
        verification: v,
        query,
        score,
      });
    }
    await new Promise((r) => setTimeout(r, 1200));
  }

  if (allCandidates.length > 0) {
    // Ordenar por score decrescente e escolher o melhor
    allCandidates.sort((a, b) => b.score - a.score);
    const best = allCandidates[0];
    const c = best.candidate;
    
    result.ok = true;
    result.image = {
      file: c.file,
      thumbUrl: c.thumbUrl,
      originalUrl: c.originalUrl,
      usedUrl: best.urlToUse,
      width: c.width,
      height: c.height,
      license: c.license,
      artist: c.artist,
      searchQuery: best.query,
      httpStatus: best.verification.status,
      contentType: best.verification.contentType,
      commonsUrl: 'https://commons.wikimedia.org/wiki/' + encodeURIComponent(c.file),
      score: best.score,
      totalCandidates: allCandidates.length,
    };
    return result;
  }

  result.error = 'Nenhuma imagem válida encontrada para o tema: ' + theme.theme;
  return result;
}

export default { findRelevantImage };
