# NexoraComic

Uma publicação digital moderna que conecta ciência, tecnologia, espaço, inteligência artificial e cultura geek.

## 🚀 Visão Geral

NexoraComic é uma plataforma de mídia digital focada em conteúdo editorial de alta qualidade sobre:

- **Ciência**: Biologia, física, química, neurociência e descobertas científicas
- **Tecnologia**: Gadgets, computação, cibersegurança, robótica e tecnologia futura
- **Espaço**: Astronomia, missões espaciais, planetas e exploração cósmica
- **Inteligência Artificial**: IA generativa, machine learning e o futuro da computação
- **Futuro**: Tecnologias emergentes, biotecnologia, energia e cidades inteligentes
- **Games**: Notícias de games, tecnologia por trás dos jogos e análise da indústria
- **Filmes e Séries**: Ficção científica, tecnologia no cinema e análise de produções
- **Quadrinhos**: Comics, super-heróis, ciência nos quadrinhos e adaptações
- **Curiosidades**: Ciência fascinante, tecnologia histórica e descobertas incomuns

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 16 com App Router
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **Deploy**: Vercel
- **Fontes**: Inter (sans-serif) e JetBrains Mono (monospace)

## 📁 Estrutura do Projeto

```
nexoracomic/
├── app/                      # App Router
│   ├── [category]/          # Páginas de categorias dinâmicas
│   │   ├── [slug]/         # Páginas de artigos dinâmicas
│   │   └── page.tsx
│   ├── sobre/              # Página sobre
│   ├── contato/            # Página de contato
│   ├── politica-de-privacidade/
│   ├── termos-de-uso/
│   ├── pesquisar/          # Página de busca
│   ├── layout.tsx          # Layout raiz
│   ├── page.tsx            # Homepage
│   ├── globals.css         # Estilos globais
│   ├── robots.txt          # Configuração de crawlers
│   └── sitemap.ts          # Sitemap dinâmico
├── components/              # Componentes React
│   ├── Header.tsx          # Cabeçalho com navegação
│   ├── Footer.tsx          # Rodapé
│   ├── Logo.tsx            # Logo da marca
│   ├── ArticleCard.tsx     # Card de artigo
│   ├── CategoryCard.tsx    # Card de categoria
│   ├── Newsletter.tsx      # Componente de newsletter
│   └── AdSlot.tsx          # Componente de anúncios (desativado)
├── lib/                    # Bibliotecas e utilitários
│   ├── types.ts            # Definições TypeScript
│   └── articles.ts         # Dados de demonstração
└── public/                 # Arquivos estáticos
```

## 🎨 Design System

### Cores

- **Background**: `#0a0a0f` (quase preto)
- **Foreground**: `#e4e4e7` (cinza claro)
- **Primary**: `#8b5cf6` (roxo)
- **Accent**: `#06b6d4` (ciano)
- **Card**: `#18181b` (cinza escuro)

### Tipografia

- **Sans-serif**: Inter (corpo do texto)
- **Monospace**: JetBrains Mono (código e dados técnicos)

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn

### Instalação

```bash
# Clone o repositório
git clone <repository-url>
cd nexoracomic

# Instale as dependências
npm install

# Copie o arquivo de variáveis de ambiente
cp .env.example .env.local

# Configure as variáveis de ambiente
# Edite .env.local conforme necessário
```

### Desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

### Build de Produção

```bash
npm run build
npm start
```

## 📝 Conteúdo

### Artigos de Demonstração

O projeto inclui 5 artigos de demonstração com conteúdo de alta qualidade:

1. **Como Buracos Negros Funcionam** - Espaço/Astronomia
2. **Inteligência Artificial Generativa** - IA/Tecnologia
3. **Por Que Marte é Vermelho** - Espaço/Geologia
4. **Computação Quântica vs Clássica** - Tecnologia/Física
5. **Por Que Humanos Sonham** - Ciência/Neurociência

Todos os artigos incluem:
- Conteúdo bem estruturado
- Fontes e referências verificadas
- Imagens com alt text
- Tempo de leitura estimado
- Tags relevantes

## 🔍 SEO

O projeto inclui otimização para SEO:

- **Sitemap dinâmico**: Gerado automaticamente para todas as rotas
- **Robots.txt**: Configurado para permitir crawlers
- **Metadados**: Open Graph, Twitter Cards, meta descriptions
- **Dados estruturados**: Schema.org para artigos
- **URLs limpas**: Rotas amigáveis e semânticas

## 📊 Monetização

### AdSense

O componente `AdSlot.tsx` está configurado mas **desativado por padrão**. Para ativar:

1. Obtenha aprovação do Google AdSense
2. Adicione seu publisher ID em `.env.local`
3. Defina `NEXT_PUBLIC_ENABLE_ADS=true`
4. Substitua o placeholder com o código do AdSense

**⚠️ Nunca ative anúncios antes da aprovação oficial.**

## 🔐 Segurança

- Nenhuma chave de API exposta no código cliente
- Variáveis de ambiente para dados sensíveis
- Validação de formulários
- Links externos com `rel="noopener noreferrer"`

## ♿ Acessibilidade

- HTML semântico
- Navegação por teclado
- Estados de foco visíveis
- Alt text em imagens
- Contraste de cores adequado
- ARIA labels onde necessário

## 🌱 Próximos Passos

### Curto Prazo

- [ ] Integrar CMS (Sanity, Contentful, ou similar)
- [ ] Implementar busca funcional
- [ ] Conectar newsletter a provedor de email
- [ ] Adicionar analytics (Google Analytics)

### Médio Prazo

- [ ] Implementar sistema de comentários
- [ ] Adicionar RSS feed
- [ ] Criar página de autores
- [ ] Implementar paginação

### Longo Prazo

- [ ] Sistema de autenticação
- [ ] Área de membros
- [ ] Podcast integration
- [ ] Vídeo content

## 📄 Licença

Este projeto é propriedade da NexoraComic. Todos os direitos reservados.

## 🤝 Contribuindo

Este é um projeto proprietário. Contribuições são por convite apenas.

## 📧 Contato

Para questões sobre o projeto, entre em contato: contato@nexoracomic.com
