/**
 * Skip link de acessibilidade.
 *
 * Fica oculto visualmente e aparece somente quando recebe foco via teclado,
 * permitindo pular o header e ir direto ao conteúdo principal (#main-content).
 * Não interfere no Blackhole Hero, no header nem no mobile, e não altera o
 * layout enquanto não está focado.
 */
export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[10000] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg"
    >
      Pular para o conteúdo
    </a>
  );
}
