import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const extracted = JSON.parse(readFileSync(join(__dirname, '_task12_batch8_extracted.json'), 'utf-8'));

const urls = new Set();
extracted.articles.forEach(a => {
  a.sources.forEach(s => urls.add(s.url));
});

const urlList = [...urls];
console.log(`Validating ${urlList.length} unique URLs...\n`);

async function checkUrl(url) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 15000
    }, (res) => {
      const status = res.statusCode;
      const location = res.headers.location || '';
      
      resolve({
        url,
        status,
        location: location || null,
        isRedirect: status >= 300 && status < 400,
        isOk: status >= 200 && status < 400
      });
    });
    
    req.on('error', (err) => {
      resolve({
        url,
        status: 0,
        error: err.message,
        isOk: false,
        isRedirect: false
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        url,
        status: 0,
        error: 'timeout',
        isOk: false,
        isRedirect: false
      });
    });
  });
}

async function main() {
  const results = [];
  const batchSize = 5;
  
  for (let i = 0; i < urlList.length; i += batchSize) {
    const batch = urlList.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(checkUrl));
    results.push(...batchResults);
    console.log(`Checked ${Math.min(i + batchSize, urlList.length)}/${urlList.length}`);
  }
  
  writeFileSync(
    join(__dirname, '_task12_batch8_httpcheck.json'),
    JSON.stringify({ total: results.length, results }, null, 2)
  );
  
  console.log('\n=== HTTP Validation Results ===\n');
  results.forEach(r => {
    let status = 'OK';
    if (r.error) status = `ERROR: ${r.error}`;
    else if (!r.isOk) status = `FAILED (${r.status})`;
    else if (r.isRedirect) status = `REDIRECT -> ${r.location}`;
    
    console.log(`  ${r.url}`);
    console.log(`    Status: ${status}`);
  });
}

main().catch(console.error);
