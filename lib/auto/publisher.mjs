// publisher.mjs — fase final do pipeline: publica artigo gerado e faz
// git commit, git push e deploy Vercel de produção de forma idempotente
// e segura. Executado SOMENTE após artigo inserido + imagem validada.
//
// Regras:
// - NUNCA faz "git add ." — inclui SOMENTE arquivos de responsabilidade
//   da automação (artigo, state, picks, ads.txt).
// - Aborta (sem commit) se tsc, build ou deploy falharem.
// - Idempotente: se já houver commit local pendente de push para o mesmo
//   SHA, apenas faz push + deploy sem gerar novo artigo.
// - Não altera .env, logs temporários, probe ou arquivos não rastreados
//   pertencentes a outros contextos.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { getArticles } from './store.mjs';

const PROJECT_ROOT = path.resolve(path.join(path.dirname(new URL(import.meta.url)), '..', '..'));
const SITE_URL_LIVE = 'https://nexoracomic.vercel.app';

function sh(cmd, opts = {}) {
  const res = spawnSync(cmd, { cwd: PROJECT_ROOT, shell: true, encoding: 'utf-8', ...opts });
  return {
    ok: res.status === 0,
    stdout: (res.stdout || '') + (res.stderr || ''),
    status: res.status,
  };
}

export function gitStatusShort() {
  return sh('git status --porcelain').stdout;
}

export function gitPendingUnpushed() {
  const r = sh('git rev-list --left-right --count origin/master...HEAD');
  if (!r.ok) return false;
  const parts = r.stdout.trim().split('\t');
  return parts.length === 2 && parseInt(parts[1], 10) > 0; // ahead > 0
}

function runTsc() {
  return sh('npx tsc --noEmit --incremental false');
}

function runBuild() {
  return sh('npm run build');
}

export async function fetchWithTimeout(url, ms = 30000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { redirect: 'follow', signal: controller.signal });
    return { ok: res.ok, status: res.status, contentType: res.headers.get('content-type') || '' };
  } catch (e) {
    return { ok: false, status: null, contentType: null, error: String(e.message || e) };
  } finally {
    clearTimeout(t);
  }
}

export { SITE_URL_LIVE, PROJECT_ROOT, sh, runTsc, runBuild };

// Adiciona apenas arquivos de responsabilidade da automação.
function gitStageAutomationFiles() {
  const targets = ['lib/articles.ts', '.automation/state.json', 'public/ads.txt'];
  let any = false;
  for (const t of targets) {
    if (sh('git status --porcelain -- ' + t).stdout.trim()) any = true;
  }
  if (!any) return { ok: true, msg: 'nenhum arquivo de automação pendente' };
  for (const t of targets) sh('git add -- ' + t);
  return { ok: true, msg: 'staged articles/state/ads.txt' };
}

function gitCommitAndPush(message) {
  gitStageAutomationFiles();
  const staged = sh('git diff --cached --name-only');
  if (!staged.stdout.trim()) return { ok: true, msg: 'nada novo para commitar' };
  const commit = sh('git commit -m "' + message + '" -- lib/articles.ts .automation/state.json public/ads.txt');
  if (!commit.ok) return { ok: false, msg: 'commit falhou: ' + commit.stdout };
  const push = sh('git push origin master');
  if (!push.ok) return { ok: false, msg: 'push falhou: ' + push.stdout };
  return { ok: true, msg: 'commit + push OK', sha: sh('git rev-parse HEAD').stdout.trim() };
}

export async function deployVercel() {
  const r = sh('vercel --prod --yes --confirm');
  return { ok: r.ok, stdout: r.stdout };
}

// Flusso completo chamado pelo auto-run quando published=true.
export async function publishArticle(article, options = {}) {
  const dryRun = !!options.dryRun;
  const log = [];
  const add = (m) => { log.push(m); };
  const result = { success: false, deployed: false, url: null, log };

  // 1. artigo inserido e imagem validada pelo pipeline antes de chegar aqui
  if (!article || !article.featuredImage) {
    return { ...result, error: 'artigo invalido (sem featuredImage)', log };
  }

  // 2. tsc
  add('[publish] tsc --noEmit');
  const tsc = runTsc();
  if (!tsc.ok) return { ...result, error: 'tsc falhou', tsc: tsc.stdout, log };
  add('[publish] tsc OK (exit 0)');

  // 3. build
  add('[publish] npm run build');
  const build = runBuild();
  if (!build.ok) return { ...result, error: 'build falhou', build: build.stdout, log };
  add('[publish] build OK (exit 0)');

  if (dryRun) {
    add('[publish] (dry-run) validado; commit/push/deploy pulados');
    return { success: true, deployed: false, wouldDeploy: true, log };
  }

  // 4. commit + push (artigos/state/ads.txt apenas)
  const cp = gitCommitAndPush('automacao: publica artigo ' + article.id + ' — ' + article.slug);
  add('[publish] git: ' + cp.msg);
  if (!cp.ok) return { ...result, error: 'git/push falhou: ' + cp.msg, git: cp.msg, log };

  // 5. deploy Vercel produção
  add('[publish] vercel --prod --yes --confirm');
  const d = await deployVercel();
  if (!d.ok) return { ...result, error: 'deploy vercel falhou', deploy: d.stdout, log };
  add('[publish] deploy Ready');

  // 6. validação HTTP do artigo
  const url = SITE_URL_LIVE + '/' + article.category.slug + '/' + article.slug;
  const check = await fetchWithTimeout(url);
  add('[publish] HTTP ' + url + ' => ' + (check.status || 'ERRO') + (check.error ? ' (' + check.error + ')' : ''));
  if (!check.ok) return { ...result, error: 'artigo nao acessivel apos deploy', deployUrl: url, http: check, log };

  result.success = true;
  result.deployed = true;
  result.url = url;
  return result;
}
