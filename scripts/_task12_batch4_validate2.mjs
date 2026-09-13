import { writeFileSync } from 'fs';
async function get(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36', 'Accept': 'text/html,application/xhtml+xml' } });
    const ct = res.headers.get('content-type') || '';
    const html = ct.includes('html') ? await res.text() : '';
    const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').replace(/\s+/g, ' ').trim();
    return { status: res.status, finalUrl: res.url, title, full: html };
  } catch (e) { return { status: 0, error: String(e).slice(0, 120) }; }
  finally { clearTimeout(t); }
}
const results = {};
function hrefs(r, re, base) {
  return [...(r.full || '').matchAll(/href=["']([^"']+)["']/g)].map(m => m[1])
    .map(h => { try { return new URL(h, base).toString(); } catch { return null; } })
    .filter(h => h && re.test(h));
}
// 1. bing site:bleepingcomputer
let r = await get('https://www.bing.com/search?q=site%3Ableepingcomputer.com+%22microsoft+365%22+outage');
results.bing_bleeping = { status: r.status, hrefs: [...new Set(hrefs(r, /bleepingcomputer\.com\/news\//, 'https://www.bing.com/'))].slice(0, 15) };
console.log('bing_bleeping', r.status, JSON.stringify(results.bing_bleeping.hrefs, null, 1));
// 2. theregister search
r = await get('https://www.theregister.com/search?q=microsoft+365+outage');
results.register = { status: r.status, hrefs: [...new Set(hrefs(r, /2026/, 'https://www.theregister.com/'))].slice(0, 15) };
console.log('register', r.status, JSON.stringify(results.register.hrefs, null, 1));
// 3. meta newsroom search AI profiles
r = await get('https://about.fb.com/?s=AI+profiles');
results.meta = { status: r.status, hrefs: [...new Set(hrefs(r, /\/\d{4}\//, 'https://about.fb.com/'))].slice(0, 15) };
console.log('meta', r.status, JSON.stringify(results.meta.hrefs, null, 1));
// 4. reconfirm help.instagram
r = await get('https://help.instagram.com/ai-generated-profile-labels');
results.help_instagram = { status: r.status, finalUrl: r.finalUrl, title: r.title };
console.log('help_instagram', r.status, r.finalUrl, r.title);
// 5. instagram creators blog
r = await get('https://about.instagram.com/blog/');
results.ig_blog = { status: r.status, hrefs: [...new Set(hrefs(r, /announc|ai/i, 'https://about.instagram.com/'))].slice(0, 15) };
console.log('ig_blog', r.status, JSON.stringify(results.ig_blog.hrefs, null, 1));
writeFileSync(new URL('./_task12_batch4_validate2.json', import.meta.url), JSON.stringify(results, null, 2));
console.log('DONE');
