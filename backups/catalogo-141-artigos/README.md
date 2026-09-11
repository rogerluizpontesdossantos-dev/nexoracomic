# Backup — Catálogo Editorial NexoraComic (141 artigos)

- **Data do backup:** 2026-09-11
- **Quantidade de artigos:** 141
- **Último ID:** 141
- **IDs presentes:** 1–141 (sem duplicatas)
- **Categorias:** 9 (espaco, inteligencia-artificial, tecnologia, ciencia, games, filmes-series, quadrinhos, curiosidades, futuro)
- **Branch atual:** master
- **Commit atual:** 55b4427912e9cd569e966ca0543f9c2971efd4b5 (estado com alterações não commitadas pós-TASK 51; este backup captura o working tree recuperado)
- **SHA-256 lib/articles.ts (original):** 95f52dfd704a7c45dedcfe77f58c4bac2144746d80e80b2560e0c4b593ff0b83
- **SHA-256 articles.ts (backup):** 95f52dfd704a7c45dedcfe77f58c4bac2144746d80e80b2560e0c4b593ff0b83
- **SHA-256 lib/types.ts (original):** 022cfe7823367dbc8229f69b54bca83ee98ac280d747e884c13e4d9dee66bfc7
- **SHA-256 types.ts (backup):** 022cfe7823367dbc8229f69b54bca83ee98ac280d747e884c13e4d9dee66bfc7
- **Integridade (original == backup):** PASS
- **Motivo do backup:** Proteger o catálogo editorial de 141 artigos após o incidente da TASK 51, em que lib/articles.ts foi revertido acidentalmente e só pôde ser recuperado via source map do build. Este backup existe para garantir recuperação permanente do catálogo estável antes do commit/tag de segurança (TASK 52).

Conteúdo:
- `articles.ts` — cópia exata de `lib/articles.ts`
- `types.ts` — cópia exata de `lib/types.ts` (estrutura editorial)
- `hashes_task52.txt` — hashes SHA-256 registrados
