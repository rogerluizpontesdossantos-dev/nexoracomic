import type { Metadata } from 'next';
import RadarPanel from '@/components/admin/RadarPanel';

// ─────────────────────────────────────────────────────────────────────────────
// Radar GTA 6 — ferramenta PRIVADA de apoio editorial (MVP V1).
// Não há autenticação nesta versão: a rota é desindexada (noindex) e nada
// aqui publica ou altera artigos. Qualquer ação termina no clipboard/local.
// ─────────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Radar GTA 6 — Ferramenta editorial (privada)',
  description: 'Painel privado de curadoria de pautas sobre GTA 6.',
  robots: { index: false, follow: false },
};

export default function RadarAdminPage() {
  return (
    <div className="min-h-screen bg-[#08080c]">
      <RadarPanel />
    </div>
  );
}
