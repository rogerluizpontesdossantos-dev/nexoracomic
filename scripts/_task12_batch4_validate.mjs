import { writeFileSync } from 'fs';
async function get(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36' } });
    const ct = res.headers.get('content-type') || '';
    const html = ct.includes('html') ? await res.text() : '';
    const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').replace(/\s+/g, ' ').trim();
    const body = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    return { status: res.status, finalUrl: res.url, title, body: body.slice(0, 5000), full: html };
  } catch (e) { return { status: 0, error: String(e).slice(0, 120) }; }
  finally { clearTimeout(t); }
}
const candidates = [
  'https://www.tomshardware.com/pc-components/gpus/modders-get-leaked-dlss-5-running-in-control-early-blackwell-test-drops-rtx-5070-ti-from-71-to-35-fps-at-4k',
  'https://www.tomshardware.com/pc-components/gpus/jensen-huang-says-gamers-are-completely-wrong-about-dlss-5-nvidia-ceo-responds-to-dlss-5-backlash',
  'https://docs.claude.com/en/docs/about-claude/models/overview',
  'https://nvidianews.nvidia.com/news/nvidia-and-mediatek-deepen-long-standing-partnership-to-build-ai-edge-to-cloud-computing-platforms',
  'https://www.club386.com/regular-nvidia-geforce-rtx-5090-inflation/',
  'https://www.tomshardware.com/pc-components/gpus/rtx-5090-scalpers-sell-blackwell-flagship-gpu-for-up-to-usd7-000-2x-3x-scalper-markup-over-msrp',
  'https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/',
  'https://blogs.nvidia.com/blog/local-ai-ifa-next-gen-agents-nv-pair-rtx-spark/',
  'https://www.tomshardware.com/pc-components/gpus/ai-enthusiast-adds-nvidia-tesla-v100-as-loud-as-a-lawnmower-to-gaming-pc-for-usd266-32gb-of-vram-rig-can-run-27-billion-parameter-model-at-32-tokens-per-second',
  'https://www.samsung.com/us/computing/monitors/odyssey/',
  'https://www.tomshardware.com/monitors/gaming-monitors/samsung-launches-the-worlds-first-500hz-oled-gaming-monitor-for-usd1-300-with-its-burn-in-fighting-heat-pipes-in-tow',
  'https://www.tomshardware.com/tech-industry/semiconductors/hot-chips-2026-samsung-reveals-a-three-phase-hbm-roadmap-that-puts-logic-and-compute-inside-memory-zhbm-ultimately-stacks-dram-directly-on-top-of-the-processor',
  'https://www.tomshardware.com/pc-components/dram/samsung-debuts-three-next-generation-memory-technologies-for-ai-data-centers-zhbm-znand-o-and-bv-nand-all-rely-on-advanced-wafer-bonding-technologies',
  'https://blogs.nvidia.com/blog/nvlink-fusion-nvhbm-custom-high-bandwidth-memory/',
  'https://help.instagram.com/ai-generated-profile-labels',
  'https://science.nasa.gov/mission/roman-space-telescope/',
  'https://roman.gsfc.nasa.gov',
  'https://www.bleepingcomputer.com/search/?q=microsoft+365+outage',
  'https://www.tomshardware.com/search?searchTerm=DLSS%205',
];
const results = {};
for (const u of candidates) {
  const r = await get(u);
  results[u] = { status: r.status, finalUrl: r.finalUrl, title: r.title };
  console.log(r.status, u.slice(0, 110), '|', (r.title || r.error || '').slice(0, 100));
}
// extrair hrefs específicos
async function hrefs(url, re, label) {
  const r = await get(url);
  const list = [...(r.full || '').matchAll(/href=["']([^"']+)["']/g)].map(m => m[1]).filter(h => re.test(h));
  console.log('---', label, r.status, JSON.stringify([...new Set(list)].slice(0, 20), null, 1));
  results[label] = { status: r.status, hrefs: [...new Set(list)].slice(0, 20) };
}
await hrefs('https://www.bleepingcomputer.com/search/?q=microsoft+365+outage', /outage/i, 'bleeping_search_hrefs');
await hrefs('https://www.theverge.com/search?q=instagram%20AI%20profiles', /instagram/i, 'verge_instagram_hrefs');
await hrefs('https://science.nasa.gov/mission/roman-space-telescope/', /roman/i, 'roman_hrefs');
writeFileSync(new URL('./_task12_batch4_validate_candidates.json', import.meta.url), JSON.stringify(results, null, 2));
console.log('DONE');
