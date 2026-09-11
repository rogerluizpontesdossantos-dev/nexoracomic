# Diretrizes de Contribuição — NexoraComic

## Regra de proteção do catálogo editorial

**`lib/articles.ts` é o catálogo editorial principal do NexoraComic. Agentes de código NÃO devem executar `git restore`, `git checkout`, `git reset`, `git clean` ou qualquer operação destrutiva que possa substituir/remover este arquivo sem autorização explícita do responsável pelo projeto.**

O incidente da TASK 51 (reversão acidental de `lib/articles.ts`, recuperado apenas via source map do build) NÃO pode se repetir.

## Antes de alterações em massa no catálogo editorial

1. Verificar `git status` e o estado de `lib/articles.ts`.
2. Criar backup em `backups/catalogo-<n>-artigos/` e registrar o SHA-256 do arquivo.
3. Criar um commit dedicado (por exemplo, `chore: backup e proteção do catálogo editorial`) com o catálogo atual, o backup e a documentação de proteção.
4. Após validação (`node scripts/validate-articles.mjs`, `npx tsc --noEmit`, `npx eslint lib/articles.ts`, `npm run build`), criar uma tag de segurança anotada (por exemplo, `nexoracomic-<n>-artigos-stable`).
5. Confirmar que o commit/tag recuperam o catálogo com `git show <tag>:lib/articles.ts` antes de qualquer alteração nova.

## Boas práticas gerais

- Nunca executar comandos Git destrutivos (`reset --hard`, `clean -fd`, `checkout -- .`, `restore .`) sem autorização explícita; se houver conflito ou estado inesperado, PARAR e reportar.
- Não commitar `node_modules`, `.next`, `out`, logs temporários, credenciais ou chaves de API.
- Scripts temporários com prefixo `_` em `scripts/` são artefatos de tarefas e não devem ser commitados por padrão.
