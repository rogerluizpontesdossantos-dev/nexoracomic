import { writeFileSync } from 'fs';

async function get(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36' } });
    const html = await res.text();
    return { status: res.status, html };
  } catch (e) { return { status: 0, html: '', error: String(e).slice(0, 100) }; }
  finally { clearTimeout(t); }
}

const targets = [
  ['bleeping_microsoft', 'https://www.bleepingcomputer.com/news/microsoft/', /outage/i],
  ['toms_dlss5', 'https://www.tomshardware.com/search?searchTerm=DLSS%205', /dlss[-_]?5/i],
  ['toms_5090', 'https://www.tomshardware.com/search?searchTerm=RTX%205090%20costs', /(5090|costs)/i],
  ['nvidia_ifa', 'https://blogs.nvidia.com/?s=RTX+Spark', /ifa|spark/i],
  ['club386_5090', 'https://www.club386.com/?s=RTX+5090', /(5090-cards-sail|sail-beyond)/i],
  ['toms_oled', 'https://www.tomshardware.com/search?searchTerm=OLED%20500Hz', /(oled|500hz|odyssey)/i],
  ['toms_hbm', 'https://www.tomshardware.com/search?searchTerm=Samsung%20HBM', /(hbm|samsung)/i],
];
const out = {};
for (const [name, url, re] of targets) {
  const { status, html, error } = await get(url);
  const hrefs = [...html.matchAll(/href=["']([^"']+)["']/g)].map(m => m[1])
    .filter(h => { try { const u = new URL(h, url); return re.test(h) && u.hostname.includes('.'); } catch { return false; } });
  out[name] = { status, error, found: [...new Set(hrefs)].slice(0, 30) };
  console.log(name, status, JSON.stringify(out[name].found.slice(0, 10), null, 1));
}
writeFileSync(new URL('./_task12_batch4_findurls.json', import.meta.url), JSON.stringify(out, null, 2));
