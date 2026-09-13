# Fontes e Referências Editoriais

## Visão Geral

Todo artigo publicado no NexoraComic deve incluir fontes e referências que fundamentem o conteúdo apresentado. As fontes são essenciais para:

- Credibilidade e transparência editorial
- Permite que leitores verifiquem as informações
- Atribuição correta aos criadores originais
- Diferenciação entre fatos e opiniões

## Requisitos Obrigatórios

### 1. Todo Artigo Deve Ter Fontes

Todo artigo publicado deve ter pelo menos uma fonte relacionada diretamente ao conteúdo. Artigos sem o campo `sources` não são considerados prontos para publicação.

### 2. Prioridade de Fontes

Ao selecionar fontes, siga esta ordem de prioridade:

1. **Fontes oficiais** (`official`): Sites oficiais de empresas, organizações ou instituições
   - Exemplos: NASA, ESA, CERN, NVIDIA, Microsoft, Apple, Google, Anthropic, OpenAI
   - Para produtos: site oficial do fabricante
   - Para instituições: site oficial da organização

2. **Agências governamentais** (`government`): Sites de agências oficiais
   - Exemplos: NOAA, NIST, UNESCO, agências espaciais nacionais

3. **Instituições científicas** (`scientific`): Universidades, institutos de pesquisa
   - Exemplos: Harvard, MIT, Stanford, institutos de pesquisa reconhecidos

4. **Universidades** (`university`): Departamentos acadêmicos e centros de pesquisa

5. **Documentação oficial** (`documentation`): Documentação técnica oficial
   - Manuais, especificações técnicas, documentação de APIs

6. **Publicações científicas** (`scientific`/`journal`): Revistas científicas revisadas por pares
   - Nature, Science, Physical Review Letters, etc.

7. **Jornalismo especializado** (`news`/`publication`): Veículos de reconhecida credibilidade
   - Usar quando fontes primárias não existem ou quando o conteúdo depende de reportagem

### 3. Fontes a Evitar

- Blogs aleatórios e não especializados
- Agregadores de conteúdo sem fonte original
- Sites de baixa credibilidade ou verificabilidade duvidosa
- Fóruns e comentários de usuários (exceto em contextos muito específicos)
- Fontes que não podem ser verificadas

## Formato das Fontes

Cada fonte deve incluir:

```typescript
{
  title: "Nome da fonte ou título do artigo",
  url: "https://url-completa-e-especifica.com",
  publisher: "Nome da organização/veículo (opcional)",
  type: "tipo-da-fonte"
}
```

### Tipos de Fonte Suportados

- `official`: Fonte oficial de empresa ou organização
- `scientific`: Publicação científica ou instituição de pesquisa
- `government`: Agência governamental
- `university`: Universidade ou departamento acadêmico
- `news`: Jornalismo ou mídia especializada
- `documentation`: Documentação técnica oficial
- `journal`: Revista científica revisada por pares
- `publication`: Publicação geral ou especializada
- `other`: Outros tipos (quanto menos usado, melhor)

### Exemplos de Boas Fontes

```typescript
// Fonte oficial (prioridade máxima)
{
  title: "NASA - James Webb Space Telescope",
  url: "https://science.nasa.gov/mission/webb/",
  type: "official"
}

// Agência governamental
{
  title: "NOAA - Ocean exploration and research",
  url: "https://oceanexplorer.noaa.gov",
  type: "government"
}

// Instituição científica
{
  title: "CERN - Future circular collider study",
  url: "https://home.cern/science/future-circular-collider",
  type: "scientific"
}

// Universidade
{
  title: "Harvard T.H. Chan - The gut-brain connection",
  url: "https://www.hsph.harvard.edu/nutritionsource/gut-brain",
  type: "university"
}
```

## URLs Específicas

- **USE URLs específicas**: Link para o artigo ou página específica, não para a homepage do site
- **Não invente URLs**: Se não encontrar uma fonte específica, não crie uma URL genérica
- **URLs genéricas são inadequadas**: `https://www.nature.com/subjects/quantum-physics` não é uma fonte válida para um artigo específico

## Separação de Créditos de Imagem

As fontes editoriais são **distintas** de créditos de imagem:

- **Fontes editoriais**: Referenciam o conteúdo textual do artigo
- **Créditos de imagem**: Referenciam a autoria e licença das imagens

Não misture os dois. Créditos de imagem são gerenciados separadamente através dos campos:
- `imageAlt`: Descrição da imagem
- `imageLicense`: Licença (para artigos automatizados)
- `imageArtist`: Autor/artista (para artigos automatizados)

## Validação

Use o script de validação para verificar se todos os artigos têm fontes:

```bash
node scripts/validate-articles.mjs
```

O script reportará:
- Total de artigos auditados
- Artigos com campo `sources`
- Artigos sem campo `sources` (erro)
- Artigos com array `sources` vazio (erro)

## Procedimento para Novos Artigos

1. **Escreva o conteúdo** com base em informações verificáveis
2. **Identifique as fontes** usadas durante a pesquisa
3. **Priorize fontes primárias** sempre que possível
4. **Adicione ao menos uma fonte** relacionada diretamente ao conteúdo
5. **Verifique se a URL funciona** e é específica
6. **Use o tipo de fonte apropriado** da lista acima
7. **Execute a validação** antes de considerar o artigo pronto

## Conteúdo Plagiado

- **Nunca copie conteúdo** de outras fontes sem atribuição adequada
- Parafraseie e cite as fontes quando usar informações de terceiros
- Respeite direitos autorais e licenças

## Manutenção

- Revise periodicamente as fontes de artigos antigos
- Atualize URLs quebradas (link rot)
- Substitua fontes que se tornaram indisponíveis
- Considere adicionar mais fontes se o conteúdo foi expandido

## Erros Comuns

❌ **Não faça**: Usar apenas a homepage de um site como fonte
❌ **Não faça**: Inventar URLs para preencher o campo
❌ **Não faça**: Usar blogs não especializados quando existe fonte oficial
❌ **Não faça**: Deixar o array `sources` vazio
❌ **Não faça**: Misturar créditos de imagem com fontes editoriais

✅ **Faça**: Link para páginas específicas e relevantes
✅ **Faça**: Priorizar fontes oficiais e governamentais
✅ **Faça**: Usar tipos de fonte apropriados
✅ **Faça**: Verificar se a URL é acessível
✅ **Faça**: Separar claramente fontes de conteúdo de créditos de imagem
