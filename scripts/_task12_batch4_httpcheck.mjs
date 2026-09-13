import { readFileSync, writeFileSync } from 'fs';
const dump = readFileSync(new URL('./_task12_batch4_current.txt', import.meta.url), 'utf-8');
const urls = [...new Set([...dump.matchAll(/url:\s*'([^']+)'/g)].map(m => m[1]))];
const results = {};
for (const u of urls) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 20000);
    const res = await fetch(u, { method: 'GET', redirect: 'follow', signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
    clearTimeout(t);
    const text = res.headers.get('content-type')?.includes('html') ? (await res.text()).slice(0, 3000) : '';
    const title = (text.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').trim();
    results[u] = { status: res.status, finalUrl: res.url, title };
  } catch (e) {
    results[u] = { status: 'ERR', error: String(e.message || e).slice(0, 120) };
  }
  console.log(results[u].status, u, '->', (results[u].finalUrl || '').slice(0, 100), '|', (results[u].title || results[u].error || '').slice(0, 80));
}
writeFileSync(new URL('./_task12_batch4_httpcheck.json', import.meta.url), JSON.stringify(results, null, 2));
