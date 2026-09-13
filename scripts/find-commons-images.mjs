// scripts/find-commons-images.mjs — Busca imagens de capa no Wikimedia Commons
// (apenas licenças claramente permissivas: domínio público, CC0, CC BY, CC BY-SA),
// valida cada URL (HTTP 200 + content-type image/*) e gera _commons_picks.json.
// Uso: node scripts/find-commons-images.mjs [--only 31,42,74]
import { TARGETS } from './commons-targets.mjs';

const API = 'https://commons.wikimedia.org/w/api.php';
const HEADERS = { 'User-Agent': 'NexoraComic-audit/1.0 (uso editorial; contato via site)' };
const TIMEOUT_MS = 20000;

function licenseOk(license) {
  const l = (license || '').toLowerCase();
  if (!l) return false;
  if (/(nc|nd|non-free|fair use)/i.test(l)) return false;
  if (l.includes('public domain') || l.includes('cc0') || l.startsWith('pd')) return true;
  // "No restrictions" = etiqueta do Commons para arquivos sem nenhuma restrição de uso (domínio público efetivo)
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
        const wait = 5000 * attempt;
        console.log('   ...429, aguardando ' + (wait / 1000) + 's');
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

async function verifyImage(url) {
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
      res = await fetch(url, { method: 'GET', redirect: 'follow', headers: { ...HEADERS, Range: 'bytes=0-1023' }, signal: ctrl.signal });
    }
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    return { ok: res.status === 200 && ct.startsWith('image/'), status: res.status, contentType: ct };
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

async function main() {
  const onlyArg = process.argv.includes('--only')
    ? process.argv[process.argv.indexOf('--only') + 1].split(',').map((s) => s.trim())
    : null;
  const targets = onlyArg ? TARGETS.filter((t) => onlyArg.includes(t.id)) : TARGETS;

  // --resume: mantém escolhas anteriores (_commons_picks.json) e busca só o que falta
  // --only X,Y: força nova busca para os ids listados (substitui picks anteriores deles)
  const fs = await import('node:fs');
  let previousPicks = [];
  if (process.argv.includes('--resume') && fs.existsSync('_commons_picks.json')) {
    try {
      previousPicks = JSON.parse(fs.readFileSync('_commons_picks.json', 'utf8')).picks || [];
    } catch { previousPicks = []; }
  }
  const onlyIds = onlyArg ? new Set(onlyArg) : null;
  const forceRedo = new Set(onlyArg || []);
  const alreadyPicked = new Set(previousPicks.filter((p) => !forceRedo.has(String(p.id))).map((p) => String(p.id)));
  const todo = targets.filter((t) => !alreadyPicked.has(String(t.id)));

  const picks = [...previousPicks.filter((p) => !forceRedo.has(String(p.id)))];
  const unresolved = [];

  for (const target of todo) {
    let chosen = null;
    let lastReason = '';
    for (const query of target.queries) {
      let candidates = [];
      try {
        candidates = await searchCommons(query);
      } catch (err) {
        lastReason = 'erro de busca: ' + err.message;
        await new Promise((r) => setTimeout(r, 4000));
        continue;
      }
      for (const c of candidates) {
        if ((c.width || 0) < 800) { lastReason = 'imagem pequena'; continue; }
        if (!licenseOk(c.license)) { lastReason = 'licença não aprovada: ' + (c.license || 'desconhecida'); continue; }
        const urlToUse = c.thumbUrl || c.originalUrl;
        const v = await verifyImage(urlToUse);
        if (!v.ok) { lastReason = 'URL não validou (' + (v.error || v.status) + ')'; continue; }
        chosen = { ...c, usedUrl: urlToUse, searchQuery: query };
        break;
      }
      if (chosen) break;
      // pacing: respeitar limites da API do Wikimedia
      await new Promise((r) => setTimeout(r, 1500));
    }
    if (chosen) {
      picks.push({ id: target.id, ...chosen });
      console.log('[pick ] id=' + target.id + ' -> ' + chosen.file + ' [' + chosen.license + ']');
    } else {
      unresolved.push({ id: target.id, reason: lastReason });
      console.log('[FAIL ] id=' + target.id + ' -> ' + lastReason);
    }
    // salva progresso a cada alvo (tolera interrupções)
    fs.writeFileSync('_commons_picks.json', JSON.stringify({ picks, unresolved }, null, 2), 'utf8');
  }

  fs.writeFileSync('_commons_picks.json', JSON.stringify({ picks, unresolved }, null, 2), 'utf8');
  console.log('\n[done] escolhidas: ' + picks.length + ', sem candidata: ' + unresolved.length);
  if (unresolved.length > 0) console.log('[done] sem imagem: ' + unresolved.map((u) => u.id).join(', '));
}

main();
