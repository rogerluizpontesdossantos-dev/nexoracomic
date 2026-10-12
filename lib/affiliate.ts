/**
 * lib/affiliate.ts — validação de links de afiliado.
 *
 * REGRA CENTRAL: este módulo NUNCA cria, deduz, gera ou completa URLs.
 * Ele apenas VALIDA URLs que foram fornecidas manualmente e revisadas
 * por uma pessoa. Nenhuma função daqui transforma `category`, `label`
 * ou qualquer outro texto em um link de loja.
 *
 * Consequências intencionais:
 *  - nenhum ASIN é gerado;
 *  - nenhum tag=/tracking= é acrescentado;
 *  - nenhum id de afiliado (tagId) é embutido na URL.
 *
 * Se uma URL não for válida, o chamador deve simplesmente NÃO renderizar
 * o link — nunca caIR num href vazio ou inventado.
 */

/** Protocolos aceitos. URLs relativas e esquemas especiais são rejeitadas. */
const PROTOCOLOS_PERMITIDOS = ['http:', 'https:'];

/** Esquemas perigosos, rejeitados explicitamente mesmo se parecerem válidos. */
const ESQUEMAS_BLOQUEADOS = ['javascript:', 'data:', 'blob:', 'file:', 'vbscript:'];

/**
 * Resultado da validação de um link.
 * - `ok: true`  -> `href` é seguro e pode ser usado no atributo `href`.
 * - `ok: false` -> `href` é null; o consumidor deve omitir o link.
 */
export type LinkValidation =
  | { ok: true; href: string }
  | { ok: false; href: null; reason: string };

/**
 * Valida uma URL externa destinada a link de afiliado.
 *
 * Rejeita: string vazia/espaçada, URL relativa, URL sem protocolo,
 * `javascript:`, `data:`, `blob:` e qualquer URL que o parser do browser
 * não consiga interpretar.
 */
export function validateAffiliateUrl(input: unknown): LinkValidation {
  if (typeof input !== 'string') {
    return { ok: false, href: null, reason: 'URL ausente ou de tipo invalido' };
  }

  const raw = input.trim();
  if (raw.length === 0) {
    return { ok: false, href: null, reason: 'URL vazia' };
  }

  const esquema = raw.slice(0, raw.indexOf(':') + 1).toLowerCase();
  if (ESQUEMAS_BLOQUEADOS.includes(esquema)) {
    return { ok: false, href: null, reason: 'Esquema nao permitido: ' + esquema };
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    // Cobre URL relativa ("/produto"), sem protocolo ("exemplo.com/x")
    // e qualquer string malformada.
    return { ok: false, href: null, reason: 'URL invalida ou relativa' };
  }

  if (!PROTOCOLOS_PERMITIDOS.includes(parsed.protocol)) {
    return { ok: false, href: null, reason: 'Protocolo nao permitido: ' + parsed.protocol };
  }

  if (parsed.hostname.length === 0) {
    return { ok: false, href: null, reason: 'URL sem hostname' };
  }

  return { ok: true, href: parsed.toString() };
}

/**
 * Atributos de link para QUALQUER link de afiliado.
 *
 * `sponsored` sinaliza a relação comercial do link aos mecanismos de busca
 * (Google), `nofollow` não é removido, e `noopener noreferrer` isolam
 * a aba nova. Nunca remover `nofollow` neste contexto.
 */
export const AFFILIATE_LINK_REL = 'sponsored nofollow noopener noreferrer';

/** Atributos completos para um link de afiliado externo. */
export const AFFILIATE_LINK_PROPS = {
  target: '_blank',
  rel: AFFILIATE_LINK_REL,
} as const;

/**
 * Identificador estável do produto, derivado de uma URL JÁ EXISTENTE.
 *
 * Não cria nem deduz link nenhum: apenas lê um código que já está dentro da
 * URL fornecida por uma pessoa. Serve para a medição (`affiliate_product_id`)
 * porque `label` é texto editorial — se o rótulo for reescrito, o histórico
 * de cliques no GA4 deixaria de fechar com o passado.
 *
 * Ordem de leitura:
 *  1. ASIN da Amazon em `/dp/<ASIN>` ou `/gp/product/<ASIN>`;
 *  2. código do encurtador da Amazon (`link.amazon/<ASIN>`, `amzn.to/<code>`);
 *  3. fallback: `host:<caminho>` — identifica o produto sem inventar código.
 *
 * Retorna `null` quando a URL não é analisável: o chamador simplesmente não
 * emite o atributo, e a medição continua funcionando pelos outros campos.
 */
export function affiliateProductId(input: unknown): string | null {
  if (typeof input !== 'string') return null;

  const raw = input.trim();
  if (raw.length === 0) return null;

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }

  const segments = parsed.pathname.split('/').filter(Boolean);

  // 1) Página de produto da Amazon: /dp/ASIN ou /gp/product/ASIN.
  const dpIndex = segments.indexOf('dp');
  if (dpIndex >= 0 && segments[dpIndex + 1]) {
    return `amazon:${segments[dpIndex + 1]}`;
  }
  const gpIndex = segments.indexOf('product');
  if (gpIndex >= 0 && segments[gpIndex + 1]) {
    return `amazon:${segments[gpIndex + 1]}`;
  }

  // 2) Encurtadores: o código curto costuma SER o ASIN, mas isso não é
  //    afirmado aqui — o código é usado como está, prefixado pelo host.
  const host = parsed.hostname.toLowerCase();
  if (host === 'link.amazon' || host === 'amzn.to' || host === 'www.amzn.to') {
    const code = segments[segments.length - 1];
    if (code) return `${host}:${code}`;
  }

  // 3) Fallback estável, sem inventar código de produto.
  if (segments.length > 0) return `${host}:${segments[segments.length - 1]}`;

  return null;
}
