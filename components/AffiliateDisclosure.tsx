import type { AffiliateBlockData } from '@/lib/types';

/**
 * Texto de fallback.
 *
 * IMPORTANTE: fala em "alguns links", nunca em "todos os links" ou
 * "esta página é patrocinada". A divulgação descreve um bloco específico
 * de recomendações, não a página inteira.
 */
export const DEFAULT_DISCLOSURE =
  'Alguns links desta página são links de afiliado. Se você fizer uma compra por eles, ' +
  'o NexoraComic pode receber uma comissão, sem custo adicional para você.';

interface AffiliateDisclosureProps {
  /** Texto customizado. Ausente ou vazio -> fallback seguro. */
  text?: string;
  className?: string;
}

/**
 * Aviso de divulgação de links de afiliado.
 *
 * Renderiza apenas um parágrafo discreto. Sem pop-up, sem modal, sem
 * animação, sem urgência, sem linguagem promocional.
 */
export default function AffiliateDisclosure({ text, className = '' }: AffiliateDisclosureProps) {
  const conteudo = text && text.trim().length > 0 ? text.trim() : DEFAULT_DISCLOSURE;

  return (
    <p
      className={`text-sm text-muted-foreground leading-relaxed ${className}`}
      data-affiliate-disclosure="true"
    >
      {conteudo}
    </p>
  );
}

/** Reexporta o tipo para conveniência de quem importa o componente. */
export type { AffiliateBlockData };
