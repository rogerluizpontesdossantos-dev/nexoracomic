import { writeFileSync } from 'fs';
async function get(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36' } });
    return { status: res.status, html: await res.text() };
  } catch (e) { return { status: 0, html: '', error: String(e).slice(0, 100) }; }
  finally { clearTimeout(t); }
}
const targets = [
  ['club386', 'https://www.club386.com/?s=RTX+5090', /rtx-5090/i],
  ['bleeping365', 'https://www.bleepingcomputer.com/news/microsoft/', /365|outlook/i],
  ['toms_hbm_tag', 'https://www.tomshardware.com/tag/hbm', /hbm/i],
  ['nvidia_nvhbm', 'https://blogs.nvidia.com/?s=NVHBM', /nvhbm|nvlink/i],
  ['toms_24gb', 'https://www.tomshardware.com/search?searchTerm=24GB%20VRAM%20AI%20inference', /(vram|inference|llm)/i],
  ['toms_price2', 'https://www.tomshardware.com/search?searchTerm=RTX%205090%20price', /5090/i],
];
const out = {};
for (const [name, url, re] of targets) {
  const { status, html, error } = await get(url);
  const hrefs = [...html.matchAll(/href=["']([^"']+)["']/g)].map(m => m[1])
    .filter(h => { try { const u = new URL(h, url); return re.test(h) && u.hostname.includes('.') && !h.includes('searchTerm') && !h.includes('#'); } catch { return false; } });
  out[name] = { status, error, found: [...new Set(hrefs)].slice(0, 30) };
  console.log(name, status, JSON.stringify(out[name].found.slice(0, 12), null, 1));
}
writeFileSync(new URL('./_task12_batch4_findurls2.json', import.meta.url), JSON.stringify(out, null, 2));
