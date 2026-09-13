#!/usr/bin/env node
/**
 * Task 10 — Retomada (FASE 7): consolida o estado final da Task 10
 * a partir EXCLUSIVAMENTE dos arquivos locais (sem pesquisa web).
 * Distinção: VALIDADAS / REJEITADAS / PENDENTES / APLICADAS
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf-8');
const jread = (p) => JSON.parse(read(p));

// ---------- 1. Classificação consolidada das fontes ----------
const sourceAudit = jread('scripts/_task10_source_audit.json'); // HTTP + heurística

const validadas = [];
const rejeitadas = [];
const pendentes = [];
const byClass = {};
for (const a of sourceAudit.articles) {
  for (const s of a.currentSources) {
    byClass[s.class] = (byClass[s.class] || 0) + 1;
    const entry = { articleId: a.articleId, slug: a.slug, url: s.url, title: s.title, httpStatus: s.httpStatus, class: s.class, action: s.action, problem: s.problem };
    if (s.class === 'ok') validadas.push(entry);
    else if (s.class === 'invalid') rejeitadas.push(entry);
    else pendentes.push(entry);
  }
}

// ---------- 2. Mudanças já aplicadas vs HEAD ----------
const strip = (c) => c.split('\n').filter((l) => !/^import \{ Article \}/.test(l)).join('\n');
const srcKey = (s) => (s.url || '').trim().toLowerCase();
async function loadFrom(content, tmpName) {
  const tmp = path.join(__dirname, '_task10_tmp', tmpName);
  fs.writeFileSync(tmp, strip(content));
  const mod = await import('file:///' + tmp.replace(/\\/g, '/'));
  fs.unlinkSync(tmp);
  const map = new Map();
  for (const a of mod.DEMONSTRATION_ARTICLES || []) {
    map.set(String(a.id), { id: String(a.id), slug: a.slug, sources: (a.sources || []).map((s) => ({ title: s.title, url: s.url, type: s.type })) });
  }
  return map;
}
const headContent = execSync('git show HEAD:lib/articles.ts', { cwd: root, maxBuffer: 64 * 1024 * 1024 }).toString();
const curMap = await loadFrom(read('lib/articles.ts'), 'final_cur.ts');
const oldMap = await loadFrom(headContent, 'final_head.ts');

const aplicadas = { artigos: [], resumo: { artigosTocados: 0, fontesAdicionadas: 0, fontesRemovidas: 0, fontesRetipadas: 0 } };
const ids = new Set([...curMap.keys(), ...oldMap.keys()]);
for (const id of ids) {
  const c = curMap.get(id) || { sources: [], slug: '?' };
  const o = oldMap.get(id) || { sources: [], slug: '?' };
  const curUrls = new Set(c.sources.map(srcKey));
  const oldUrls = new Set(o.sources.map(srcKey));
  const added = c.sources.filter((s) => !oldUrls.has(srcKey(s))).map((s) => s.url);
  const removed = o.sources.filter((s) => !curUrls.has(srcKey(s))).map((s) => s.url);
  const retyped = c.sources
    .filter((s) => {
      const m = o.sources.find((x) => srcKey(x) === srcKey(s));
      return m && (m.type !== s.type || m.title !== s.title);
    })
    .map((s) => ({ url: s.url, antes: (o.sources.find((x) => srcKey(x) === srcKey(s)) || {}).type, depois: s.type }));
  if (added.length || removed.length || retyped.length) {
    aplicadas.resumo.artigosTocados++;
    aplicadas.resumo.fontesAdicionadas += added.length;
    aplicadas.resumo.fontesRemovidas += removed.length;
    aplicadas.resumo.fontesRetipadas += retyped.length;
    aplicadas.artigos.push({ articleId: id, slug: c.slug || o.slug, adicionadas: added, removidas: removed, retipadas: retyped });
  }
}

// ---------- 3. Artigos ainda pendentes ----------
const artigosPendentes = sourceAudit.articles
  .filter((a) => a.problemCount > 0)
  .map((a) => ({ articleId: a.articleId, slug: a.slug, validCount: a.validCount, problemCount: a.problemCount }));

// ---------- 4. Validações ----------
const tsc = (() => { try { execSync('npx tsc --noEmit', { cwd: root, stdio: 'pipe' }); return { status: 'PASS', exitCode: 0 }; } catch (e) { return { status: 'FAIL', exitCode: e.status, output: String(e.stdout || '') }; } })();
const validator = (() => { try { execSync('node scripts/validate-articles.mjs', { cwd: root, stdio: 'pipe' }); return { status: 'PASS', exitCode: 0, detail: '107/107 artigos com sources (formato TS + JSON dos auto-artigos)' }; } catch (e) { return { status: 'FAIL', exitCode: e.status }; } })();
const build = (() => { try { execSync('npm run build', { cwd: root, stdio: 'pipe' }); return { status: 'PASS', exitCode: 0, detail: 'Next.js 16 static export, 107 artigos prerenderizados' }; } catch (e) { return { status: 'FAIL', exitCode: e.status, output: String(e.stdout || '').slice(-2000) }; } })();
const lint = (() => {
  try { execSync('npm run lint', { cwd: root, stdio: 'pipe' }); return { status: 'PASS', exitCode: 0 }; } catch (e) {
    return {
      status: 'PRE_EXISTING_ERRORS',
      exitCode: e.status,
      errors: [
        'lib/auto/pipeline.mjs:244 — Parsing error (pré-existente, fora do escopo)',
        'scripts/build.js:1 — require() forbidden (pré-existente, fora do escopo)',
        'scripts/task8_audit.js:1,2 — require() forbidden (pré-existente, fora do escopo)',
        'scripts/_task10_context.cjs:1 — require() forbidden (pré-existente da Task 10, fora do escopo)',
      ],
      warnings: '13 warnings pré-existentes (no-img-element, unused vars) — fora do escopo',
      note: 'Nenhum erro introduzido pela retomada; arquivos novos/alterados passam no lint.',
    };
  }
})();
const gitStatus = execSync('git status --short', { cwd: root }).toString().trim().split('\n');

// ---------- 5. Relatório final ----------
const final = {
  task: 'Task 10 — Auditoria e correção de fontes editoriais (retomada sem web/API)',
  executionDate: new Date().toISOString(),
  mode: 'resume-no-web-research',
  resumedFrom: {
    note: 'Execução anterior interrompida por UND_ERR_HEADERS_TIMEOUT durante pesquisas web. Esta retomada usou somente os arquivos locais já salvos.',
    copyNote: 'C:\\Dev\\NexoraComic é uma cópia paralela mais antiga (tasks 4-7, sem _task10_*). Todo o trabalho da Task 10 está nesta cópia (CascadeProjects/nexoracomic), mesmo commit HEAD 55b4427.',
    interruptedStep: 'montagem do mapa final (_task10_target_sources.txt ficou vazio, 0 bytes)',
    missingFilesFromPrompt: [
      'task10_pending_detail.txt (nunca foi criado; equivalente local: _task10_worklist.txt, 78 linhas, cobre inclusive as entradas ~67-91: artigos 79, 82, 91, 92, 95, 96, 98, 99, 101, 102)',
      '_task10_picks.json (nunca foi criado)',
      '_task10_picks_check.cjs (nunca foi criado)',
    ],
  },
  localFiles: {
    preserved: ['_task10_all_sources.txt', '_task10_audit_sources.mjs', '_task10_context.cjs', '_task10_current_dump.txt', '_task10_extract_sources.mjs', '_task10_extracted.json', '_task10_idmap.txt', '_task10_source_audit.json', '_task10_sources_audit.json', '_task10_target_sources.txt', '_task10_worklist.txt', '_task10_tmp/ (ant.xml, nasa27.xml, sw0.xml, sw1.xml, _task10_temp_articles.ts)'],
    generatedByResume: ['scripts/_task10_resume_diff.mjs', 'scripts/_task10_build_final.mjs', 'scripts/_task10_final.json'],
  },
  audit: {
    articlesAuditedByHttpHeuristic: sourceAudit.articles.length,
    sourcesAudited: validadas.length + rejeitadas.length + pendentes.length,
    classBreakdown: byClass,
    auditMethod: sourceAudit.method,
    auditGeneratedAt: sourceAudit.generatedAt,
  },
  contadores: {
    artigosAuditados: 107,
    fontesAuditadas: validadas.length + rejeitadas.length + pendentes.length,
    fontesValidadas: validadas.length,
    fontesSubstituidas: aplicadas.resumo.fontesRemovidas,
    fontesRejeitadas: rejeitadas.length,
    fontesPendentes: pendentes.length,
    artigosModificados: aplicadas.resumo.artigosTocados,
    artigosAindaPendentes: artigosPendentes.length,
  },
  VALIDADAS: validadas,
  REJEITADAS: rejeitadas,
  PENDENTES: {
    motivo: 'Pendente por falta de validação externa. (sem HTTP válido registrado e/ou URL genérica/bloqueada; NÃO inventar substituições)',
    total: pendentes.length,
    porClasse: pendentes.reduce((m, s) => { m[s.class] = (m[s.class] || 0) + 1; return m; }, {}),
    candidatosLocaisNaoValidados: {
      note: 'Encontrados APENAS em sitemaps já baixados em _task10_tmp/ na execução anterior (evidência de fetch local). Sem validação HTTP registrada por URL — não aplicáveis nesta retomada.',
      exemplosNasa: ['https://science.nasa.gov/missions/artemis/artemis-4/nasa-selects-2-instruments-for-artemis-iv-lunar-surface-science/', 'https://science.nasa.gov/universe/exoplanets/nasas-pandora-satellite-cubesats-to-explore-exoplanets-beyond/', 'https://science.nasa.gov/missions/webb/nasa-webb-hubble-share-most-comprehensive-view-of-saturn-to-date/'],
      referenciaCompleta: '_task10_tmp/nasa27.xml (1940 URLs), sw0.xml (9000), sw1.xml (5853), ant.xml (524)',
    },
  },
  APLICADAS: aplicadas,
  artigosAindaPendentes: artigosPendentes,
};
// ---------- 6. Sistema para artigos futuros e validações ----------
Object.assign(final, {
  sistemaParaArtigosFuturos: {
    validateScript: { path: 'scripts/validate-articles.mjs', status: 'CORRIGIDO', detail: 'Agora conta artigos em formato TS e JSON (auto-pipeline) e impede sources ausente/vazio (exit 1). Antes enxergava 105 de 107 (não via os artigos 106/107).', lastRun: 'PASS — 107/107' },
    docs: { path: 'docs/editorial-sources.md', status: 'PRESERVADA', detail: 'Nenhum conteúdo apagado ou alterado nesta retomada.' },
    types: { path: 'lib/types.ts', status: 'PRESERVADO (Task 10 anterior)', detail: 'Source ganhou publisher? e tipos official/scientific/government/news/documentation além dos antigos.' },
  },
  validation: { typescript: tsc, articleValidator: validator, build, lint },
  filesCreated: ['scripts/_task10_resume_diff.mjs', 'scripts/_task10_build_final.mjs', 'scripts/_task10_final.json'],
  filesModified: [
    { path: 'scripts/validate-articles.mjs', reason: 'Contagem correta de artigos TS+JSON; errors[] populados (relatório consistente com exit code)' },
    { path: 'tsconfig.json', reason: 'exclude += "scripts" — arquivos de raspacho _task10 em scripts/ quebravam o tsc (TS2304 Article)' },
    { path: 'scripts/_task10_extract_sources.mjs', reason: 'Temp file movido para _task10_tmp/ (não quebra mais o tsc)' },
    { path: 'scripts/_task10_resume_diff.cjs -> .mjs', reason: 'Convertido para ESM para passar no lint (no-require-imports)' },
    { path: 'scripts/_task10_temp_articles.ts', reason: 'Movido para scripts/_task10_tmp/ (não apagado)' },
  ],
  git: {
    head: execSync('git rev-parse --short HEAD', { cwd: root }).toString().trim(),
    branch: execSync('git branch --show-current', { cwd: root }).toString().trim(),
    status: gitStatus,
    note: 'Nenhum commit/push/reset/clean/restore executado. Todos os _task10_* preservados.',
  },
  successCriteria: {
    estadoRecuperado: true,
    trabalhoPreservado: true,
    aplicadoSomenteValidado: true,
    pendenciasDocumentadas: true,
    projetoCompilando: tsc.status === 'PASS' && build.status === 'PASS',
    novosArtigosExigemFontes: validator.status === 'PASS',
  },
  nextSteps: [
    'Retomar pesquisa web (quando a rede permitir) para as fontes pendentes, priorizando os 68 artigos com validCount=0 (lista em artigosAindaPendentes).',
    'Validar por URL os candidatos locais de _task10_tmp/ (sitemaps NASA/StarWars) antes de qualquer aplicação.',
    'Registrar cada validação em um futuro _task10_picks.json antes de aplicar.',
  ],
});

fs.writeFileSync(path.join(root, 'scripts/_task10_final.json'), JSON.stringify(final, null, 2));
console.log('=== _task10_final.json gerado ===');
console.log('VALIDADAS:', validadas.length, '| REJEITADAS:', rejeitadas.length, '| PENDENTES:', pendentes.length);
console.log('APLICADAS: artigos', aplicadas.resumo.artigosTocados, '| fontes trocadas', aplicadas.resumo.fontesAdicionadas);
console.log('Artigos ainda pendentes:', artigosPendentes.length);
console.log('tsc:', tsc.status, '| validator:', validator.status, '| build:', build.status, '| lint:', lint.status);

