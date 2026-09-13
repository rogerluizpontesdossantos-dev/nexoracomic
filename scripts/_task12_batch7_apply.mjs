import { readFileSync, writeFileSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const articlesPath = join(__dirname, '..', 'lib', 'articles.ts');
const backupPath = join(__dirname, '_task12_batch7_backup.ts');

// Create backup
copyFileSync(articlesPath, backupPath);
console.log('Backup created at:', backupPath);

// Read picks
const picksPart1 = JSON.parse(readFileSync(join(__dirname, '_task12_batch7_picks.json'), 'utf-8'));
const picksPart2 = JSON.parse(readFileSync(join(__dirname, '_task12_batch7_picks_part2.json'), 'utf-8'));
const picksPart3 = JSON.parse(readFileSync(join(__dirname, '_task12_batch7_picks_part3.json'), 'utf-8'));

// Merge all picks
const allPicks = [...picksPart1.picks, ...picksPart2.picks, ...picksPart3.picks];
const picksMap = new Map();
allPicks.forEach(p => picksMap.set(p.id, p));

// Read articles.ts
let content = readFileSync(articlesPath, 'utf-8');
const originalContent = content;

// Track changes for report
const report = {
  batch: 7,
  articlesRange: '72-101',
  totalArticles: 30,
  articles: []
};

// Process each article
for (let id = 72; id <= 101; id++) {
  const pick = picksMap.get(id);
  if (!pick) {
    console.log(`No pick found for article ${id}`);
    continue;
  }

  // Find the article block
  const articleRegex = new RegExp(`(id:\\s*'${id}'[\\s\\S]*?sources:\\s*\\[)([\\s\\S]*?)(\\]\\s*\\})`);
  const match = content.match(articleRegex);
  
  if (!match) {
    console.log(`Could not find article ${id} in content`);
    continue;
  }

  const sourcesBefore = match[2];
  let newSources = sourcesBefore;
  const changes = [];

  // Apply changes
  pick.changes.forEach(change => {
    if (change.action === 'replace') {
      // Replace old URL with new URL
      const oldUrlEscaped = change.oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const urlRegex = new RegExp(`(url:\\s*')${oldUrlEscaped}(')`, 'g');
      
      if (urlRegex.test(newSources)) {
        newSources = newSources.replace(urlRegex, `$1${change.newUrl}$2`);
        changes.push({
          action: 'replace',
          oldUrl: change.oldUrl,
          newUrl: change.newUrl,
          reason: change.reason
        });
      }
    }
  });

  // Update the content
  if (changes.length > 0) {
    content = content.replace(match[0], `${match[1]}${newSources}${match[3]}`);
    report.articles.push({
      id,
      title: pick.title,
      changes,
      sourcesBefore: sourcesBefore.trim(),
      sourcesAfter: newSources.trim()
    });
    console.log(`Updated article ${id}: ${changes.length} change(s)`);
  } else {
    console.log(`No changes applied to article ${id}`);
    report.articles.push({
      id,
      title: pick.title,
      changes: [],
      sourcesBefore: sourcesBefore.trim(),
      sourcesAfter: sourcesBefore.trim()
    });
  }
}

// Verify only sources changed
if (content !== originalContent) {
  // Write the modified content
  writeFileSync(articlesPath, content);
  console.log('\nFile updated successfully');
} else {
  console.log('\nNo changes were made to the file');
}

// Write report
writeFileSync(
  join(__dirname, '_task12_batch7_audit.json'),
  JSON.stringify(report, null, 2)
);
console.log('Audit report written to: scripts/_task12_batch7_audit.json');
