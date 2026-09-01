// Script de validação da Meta 30 — uso: node scripts/validate-meta30.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(__dirname, '..', 'lib', 'articles.ts'), 'utf8');

// Slugs de artigos (chave: slug na raiz do objeto Article)
const slugs = [...src.matchAll(/\n    slug: '([a-z0-9-]+)',/g)].map((m) => m[1]);
const ids = [...src.matchAll(/\n    id: '(\d+)',/g)].map((m) => m[1]);

const dupSlugs = slugs.filter((s, i) => slugs.indexOf(s) !== i);
const dupIds = ids.filter((s, i) => ids.indexOf(s) !== i);

// Rotas válidas: categoria + slug de cada artigo (categoria vem depois do content)
const artRoutes = [...src.matchAll(/slug: '([a-z0-9-]+)',[\s\S]*?category: \{[\s\S]*?slug: '([a-z0-9-]+)'/g)]
  .map((m) => `/${m[2]}/${m[1]}`);
const validRoutes = new Set(artRoutes);

// Links internos no conteúdo
const links = [...src.matchAll(/href="(\/[a-z-]+\/[a-z0-9-]+)"/g)].map((m) => m[1]);
const broken = links.filter((l) => !validRoutes.has(l));

console.log('Total de artigos:', slugs.length);
console.log('IDs:', ids.length, '| IDs duplicados:', dupIds.length ? dupIds.join(', ') : 'nenhum');
console.log('Slugs duplicados:', dupSlugs.length ? dupSlugs.join(', ') : 'nenhum');
console.log('Links internos:', links.length, '| Quebrados:', broken.length ? broken.join(', ') : 'nenhum');

// Distribuição por categoria
const catCount = {};
[...src.matchAll(/category: \{[\s\S]*?id: '([a-z-]+)',[\s\S]*?name: '([^']+)'[\s\S]*?\},\n    tags:/g)].forEach((m) => {
  catCount[m[2]] = (catCount[m[2]] || 0) + 1;
});
console.log('Distribuição:', JSON.stringify(catCount, null, 0));
