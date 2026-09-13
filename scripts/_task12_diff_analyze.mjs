import { execSync } from 'child_process';
const d = execSync('git --no-pager diff -- lib/articles.ts', { encoding: 'buffer' });
const s = d.toString('utf8');
// Split into diff hunks so we can inspect line-by-line added/removed lines
const lines = s.split(/\r?\n/);
const changes = lines.filter(l => (l.startsWith('+') && !l.startsWith('+++')) || (l.startsWith('-') && !l.startsWith('---')));
console.log('Total changed lines (add+del, excl headers):', changes.length);
// Show all source-related changes
const srcChanges = changes.filter(l =>
  l.includes('sources:') || l.includes("title:") || l.includes("url:") || l.includes("url::") ||
  l.includes("publisher:") || l.includes("type:") || l.includes("DOMAIN") || l.includes("featuredImage:") || l.includes("imageAlt:")
);
console.log('\n=== Changed lines mentioning sources/title/url/publisher/type/featuredImage/imageAlt ===');
for (const l of srcChanges) console.log(l);
console.log('\n=== Any other changed lines (would indicate non-source edits) ===');
const other = changes.filter(l => !srcChanges.includes(l) && !/featuredImage:|imageAlt:/.test(l));
console.log('Non-source non-image changed lines count:', other.length);
for (const l of other.slice(0, 60)) console.log(l);