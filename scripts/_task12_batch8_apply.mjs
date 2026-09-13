import { readFileSync, writeFileSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const articlesPath = join(__dirname, '..', 'lib', 'articles.ts');
const backupPath = join(__dirname, '_task12_batch8_backup.ts');

copyFileSync(articlesPath, backupPath);

const picks = JSON.parse(readFileSync(join(__dirname, '_task12_batch8_picks.json'), 'utf-8'));
const picksMap = new Map();
picks.picks.forEach(p => picksMap.set(p.id, p));

let content = readFileSync(articlesPath, 'utf-8');
const originalContent = content;

const report = {
  batch: 8,
  articlesRange: '102-105',
  totalArticles: 4,
  articles: []
};

for (let id = 102; id <= 105; id++) {
  const pick = picksMap.get(id);
  if (!pick) continue;

  const articleRegex = new RegExp(`(id:\\s*'${id}'[\\s\\S]*?sources:\\s*\\[)([\\s\\S]*?)(\\]\\s*\\})`);
  const match = content.match(articleRegex);
  
  if (!match) continue;

  const sourcesBefore = match[2];
  let newSources = sourcesBefore;
  const changes = [];

  pick.changes.forEach(change => {
    if (change.action === 'replace') {
      const oldUrlEscaped = change.oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const urlRegex = new RegExp(`(url:\\s*')${oldUrlEscaped}(')`, 'g');
      if (urlRegex.test(newSources)) {
        newSources = newSources.replace(urlRegex, `$1${change.newUrl}$2`);
        changes.push({ oldUrl: change.oldUrl, newUrl: change.newUrl, reason: change.reason });
      }
    }
  });

  if (changes.length > 0) {
    content = content.replace(match[0], `${match[1]}${newSources}${match[3]}`);
  }
  
  report.articles.push({ id, title: pick.title, changes });
}

writeFileSync(articlesPath, content);
writeFileSync(join(__dirname, '_task12_batch8_audit.json'), JSON.stringify(report, null, 2));
console.log('Applied changes and updated audit report.');
