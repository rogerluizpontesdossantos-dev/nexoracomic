const fs = require('fs');
const j = JSON.parse(fs.readFileSync('C:/Users/dizzritimia/CascadeProjects/nexoracomic/scripts/_task10_extracted.json', 'utf8'));
const ids = process.argv.slice(2).map(Number);
for (const id of ids) {
  const a = j.find(x => x.id === id);
  if (!a) { console.log('MISSING #' + id); continue; }
  console.log('\n=== #' + a.id + ' [' + a.category + '] ' + a.title);
  (a.sources || []).forEach(s => console.log('  - (' + s.type + ') ' + s.title + ' :: ' + s.url));
}
