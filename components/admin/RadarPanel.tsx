'use client';

import { useMemo, useState } from 'react';
import { DEMONSTRATION_ARTICLES } from '@/lib/articles';
import { coverageStatus, findDuplicateHit, RadarCoverageStatus } from '@/lib/radar/dedupe';
import { RADAR_FEEDS } from '@/lib/radar/feeds';
import { fetchRadarItems, buildDraft } from '@/lib/radar/fetch';
import { RadarClassification, RadarFeedResult, RadarNewsItem } from '@/lib/radar/types';

// ─────────────────────────────────────────────────────────────────────────────
// Painel privado do Radar GTA 6 (MVP V1). Tudo roda no navegador:
//   🔎 Buscar novidades → feeds → classificação → checagem de duplicados;
//   📋 Copiar pauta → rascunho pronto para o editor de artigos.
// Nada é publicado automaticamente; os artigos de lib/articles.ts são só leitura.
// ─────────────────────────────────────────────────────────────────────────────

const CLASSIFICATION_META: Record<RadarClassification, { emoji: string; label: string; badge: string }> = {
  confirmed: { emoji: '🟢', label: 'Fato confirmado', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' },
  rumor: { emoji: '🟡', label: 'Rumor', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/40' },
  speculation: { emoji: '🔵', label: 'Especulação', badge: 'bg-sky-500/15 text-sky-300 border-sky-500/40' },
};

const STATUS_META: Record<RadarCoverageStatus, string> = {
  'DUPLICADO / JÁ COBERTO': 'bg-red-500/10 text-red-300 border-red-500/40',
  'ATUALIZAÇÃO / NOVA PAUTA': 'bg-amber-500/10 text-amber-200 border-amber-500/40',
  'NOVA PAUTA': 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40',
};

const STATUS_ORDER: RadarCoverageStatus[] = ['NOVA PAUTA', 'ATUALIZAÇÃO / NOVA PAUTA', 'DUPLICADO / JÁ COBERTO'];

function formatDate(iso: string): string {
  if (!iso) return 'sem data';
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? 'sem data'
    : date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function RadarPanel() {
  const [result, setResult] = useState<RadarFeedResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState('');
  const [query, setQuery] = useState('');
  const [classificationFilter, setClassificationFilter] = useState<'all' | RadarClassification>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | RadarCoverageStatus>('all');
  const [hideCovered, setHideCovered] = useState(true);

  // Aplica deduplicação contra os artigos publicados e monta a lista final.
  const items: RadarNewsItem[] = useMemo(() => {
    if (!result) return [];
    const enriched = result.items.map((item) => ({
      ...item,
      duplicate: findDuplicateHit(item.title, item.summary, DEMONSTRATION_ARTICLES) ?? undefined,
    }));
    const term = query.trim().toLowerCase();
    return enriched
      .filter((item) => !term || `${item.title} ${item.summary}`.toLowerCase().includes(term))
      .filter((item) => classificationFilter === 'all' || item.classification === classificationFilter)
      .filter((item) => statusFilter === 'all' || coverageStatus(item) === statusFilter)
      .filter((item) => !hideCovered || coverageStatus(item) !== 'DUPLICADO / JÁ COBERTO');
  }, [result, query, classificationFilter, statusFilter, hideCovered]);

  const counts = useMemo(() => {
    const base: Record<string, number> = { 'NOVA PAUTA': 0, 'ATUALIZAÇÃO / NOVA PAUTA': 0, 'DUPLICADO / JÁ COBERTO': 0 };
    for (const item of result ? result.items : []) {
      const duplicate = findDuplicateHit(item.title, item.summary, DEMONSTRATION_ARTICLES);
      base[coverageStatus({ ...item, duplicate: duplicate ?? undefined })] += 1;
    }
    return base;
  }, [result]);

  async function handleSearch() {
    setLoading(true);
    setError('');
    setCopiedId('');
    try {
      const feedResult = await fetchRadarItems(RADAR_FEEDS);
      setResult(feedResult);
      if (feedResult.items.length === 0 && feedResult.warnings.length > 0) {
        setError('Nenhum item retornado. Verifique os avisos abaixo.');
      }
    } catch (err) {
      setError(`Falha ao buscar feeds: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyPauta(item: RadarNewsItem) {
    const duplicate = findDuplicateHit(item.title, item.summary, DEMONSTRATION_ARTICLES);
    const draft = buildDraft(item, duplicate ?? undefined);
    const header = [
      `SLUG: ${draft.slug}`,
      `TÍTULO: ${draft.title}`,
      `RESUMO: ${draft.excerpt}`,
      `TAGS: ${draft.tags.join(', ')}`,
      `CLASSIFICAÇÃO: ${CLASSIFICATION_META[draft.meta.classification].emoji} ${CLASSIFICATION_META[draft.meta.classification].label}`,
      `CATEGORIA SUGERIDA: games`,
      `FONTE (${draft.sources[0].type}): ${draft.sources[0].title} — ${draft.sources[0].url}`,
      '',
    ].join('\n');
    try {
      await navigator.clipboard.writeText(`${header}${draft.content}`);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(''), 2500);
    } catch {
      setError('Não foi possível acessar a área de transferência neste navegador.');
    }
  }

  const totalUnfiltered = result ? result.items.length : 0;

  return (
    <main className="container mx-auto max-w-6xl px-4 py-10">
      {/* Cabeçalho */}
      <header className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              📡 Radar GTA 6
              <span className="px-2 py-0.5 text-xs font-medium rounded-full border border-border text-muted-foreground">PRIVADO</span>
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Coleta, classifica e cruza novidades de GTA 6 com o acervo do NexoraComic. Ferramenta de apoio
              editorial — <strong>nada é publicado automaticamente</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? '⏳ Buscando…' : '🔎 Buscar novidades'}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          {RADAR_FEEDS.length} feeds públicos consultados via rss2json · classificação automática (fato/rumor/especulação) · checagem contra os artigos já publicados
        </p>
      </header>

      {/* Avisos e erros */}
      {error && (
        <div className="mb-6 p-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 text-sm">{error}</div>
      )}
      {result && result.warnings.length > 0 && (
        <div className="mb-6 p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-200 text-sm">
          <p className="font-semibold mb-1">Avisos de feeds ({result.warnings.length})</p>
          <ul className="list-disc list-inside space-y-0.5">
            {result.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Estado vazio */}
      {!result && !loading && (
        <div className="p-12 rounded-xl border border-border bg-card text-center">
          <p className="text-4xl mb-3">📡</p>
          <p className="text-foreground font-medium mb-1">Nenhuma busca feita ainda</p>
          <p className="text-sm text-muted-foreground">
            Clique em <strong>🔎 Buscar novidades</strong> para trazer as pautas mais recentes sobre GTA 6.
          </p>
        </div>
      )}

      {loading && (
        <div className="p-12 rounded-xl border border-border bg-card text-center text-muted-foreground">
          Consultando os feeds… isso pode levar alguns segundos.
        </div>
      )}

      {/* Resultados */}
      {result && !loading && (
        <>
          {/* Contadores por status de cobertura */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {STATUS_ORDER.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
                className={`p-4 rounded-xl border text-left transition-colors ${
                  statusFilter === status ? STATUS_META[status] : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <p className="text-2xl font-bold text-foreground">{counts[status]}</p>
                <p className="text-xs text-muted-foreground mt-1">{status}</p>
              </button>
            ))}
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filtrar por termo (ex.: controller, Lucia, vazamento…)"
              className="flex-1 min-w-56 px-4 py-2.5 rounded-xl bg-input border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <select
              value={classificationFilter}
              onChange={(event) => setClassificationFilter(event.target.value as typeof classificationFilter)}
              className="px-4 py-2.5 rounded-xl bg-input border border-border text-foreground"
              aria-label="Filtrar por classificação"
            >
              <option value="all">Todas as classificações</option>
              <option value="confirmed">🟢 Fato confirmado</option>
              <option value="rumor">🟡 Rumor</option>
              <option value="speculation">🔵 Especulação</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={hideCovered}
                onChange={(event) => setHideCovered(event.target.checked)}
                className="accent-[#d4af37]"
              />
              Ocultar duplicados
            </label>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Exibindo <span className="font-medium text-foreground">{items.length}</span> de {totalUnfiltered} pautas coletadas.
          </p>

          {/* Lista de pautas */}
          <div className="space-y-4">
            {items.map((item) => {
              const status = coverageStatus(item);
              const cls = CLASSIFICATION_META[item.classification];
              return (
                <article key={item.id} className="p-5 rounded-xl bg-card border border-border">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${cls.badge}`}>
                      {cls.emoji} {cls.label}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${STATUS_META[status]}`}>
                      {status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.tierLabel} · {item.sourceDomain} · {formatDate(item.publishedAt)}
                    </span>
                  </div>

                  <h2 className="text-lg font-semibold text-foreground leading-snug">{item.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{item.summary}</p>

                  {item.classificationSignals.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Sinais: {item.classificationSignals.slice(0, 4).join(', ')}
                    </p>
                  )}

                  {item.duplicate && (
                    <p className="text-xs text-amber-200/90 mt-2 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
                      ⚠️ Parecido com o publicado{' '}
                      <a
                        href={item.duplicate.url}
                        target="_blank"
                        rel="noreferrer"
                        className="underline hover:text-amber-100"
                      >
                        “{item.duplicate.articleTitle}”
                      </a>{' '}
                      (score {item.duplicate.score}).
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Abrir fonte ↗
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopyPauta(item)}
                      className="text-sm px-3 py-1.5 rounded-lg border border-border hover:border-primary/50 text-foreground transition-colors"
                    >
                      {copiedId === item.id ? '✅ Copiado!' : '📋 Copiar pauta'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {items.length === 0 && (
            <div className="p-8 rounded-xl border border-border bg-card text-center text-muted-foreground">
              Nenhuma pauta após os filtros. Ajuste os filtros ou desmarque “Ocultar duplicados”.
            </div>
          )}
        </>
      )}

      <footer className="mt-10 text-xs text-muted-foreground border-t border-border pt-4">
        MVP V1 — sem publicação automática, sem redes sociais, sem banco de dados. Rascunhos vão para a área de
        transferência; a produção do artigo continua manual em <code>lib/articles.ts</code>.
      </footer>
    </main>
  );
}
