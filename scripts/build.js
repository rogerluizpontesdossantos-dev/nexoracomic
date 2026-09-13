const fs = require('fs');
const articles = [];
// 41
articles.push(`  {
    id: '41',
    slug: 'webb-galaxias-antigas-universo-primitivo',
    title: 'Webb Detecta Galáxias Inesperadamente Maduras no Universo Primitivo',
    excerpt: 'Observações recentes do telescópio James Webb revelaram galáxias com estrutura surpreendentemente organizada quando o universo tinha apenas 500 milhões de anos.',
    content: \`
      <h2>A Surpresa nas Profundezas do Cosmos</h2>
      <p>O Telescópio Espacial James Webb, operado pela NASA em parceria com a ESA e a CSA, segue reescrevendo o que sabemos sobre o início do universo. Em suas campanhas mais recentes, apontadas para campos profundos, o Webb identificou galáxias com disco e bojo bem definidos em épocas em que os modelos esperavam apenas aglomerados caóticos de estrelas.</p>
      <h3>Quão Antigas São Essas Galáxias?</h3>
      <p>Estima-se que a luz captada partiu de um universo com cerca de <strong>500 a 700 milhões de anos</strong>. A existência de galáxias tão organizadas tão cedo sugere que os processos de formação foram mais rápidos — ou diferentes — do que as simulações cosmológicas indicavam.</p>
      <h2>Por Que Isso Intriga os Cientistas?</h2>
      <p>Nos modelos padrão, galáxias como a Via Láctea levariam bilhões de anos para adquirir sua forma atual. Encontrar sistemas comparáveis tão cedo desafia a linha do tempo esperada e obriga pesquisadores a revisar parâmetros sobre a matéria escura fria, a taxa de acreção de gás e a eficiência da formação estelar.</p>
      <h3>Possíveis Explicações em Estudo</h3>
      <ul>
        <li>Modelos de matéria escura podem precisar de ajustes para permitir colapsos mais rápidos</li>
        <li>A retroalimentação de supernovas e buracos negros pode ter sido menos supressiva que o previsto</li>
        <li>Erros sistemáticos na estimativa de distâncias fotométricas ainda não podem ser totalmente descartados</li>
      </ul>
      <h2>Como o Webb Faz Isso?</h2>
      <p>Seu espelho de 6,5 metros e seus instrumentos infravermelhos captam luz que foi deslocada para comprimentos de onda maiores pela expansão cósmica. Medindo esse desvio, os astrônomos estimam a distância e a idade de cada galáxia observada.</p>
      <h2>Impacto e Próximos Passos</h2>
      <p>As descobertas ainda estão sob escrutínio científico. Pesquisadores já solicitaram tempo adicional no Webb para obter espectroscopia de confirmação desses objetos, o que deve trazer medições mais precisas de massa, composição química e idade real.</p>
      <h2>Conclusão</h2>
      <p>A história da astronomia mostra que cada nova janela observacional revela objetos que não esperávamos. O Webb parece estar repetindo esse padrão: em vez de confirmar tranquilamente o que já sabíamos, ele está ampliando o mistério — e é justamente isso que o torna um divisor de águas.</p>
    \`,
    category: {
      id: 'espaco',
      slug: 'espaco',
      name: 'Espaço',
      description: 'Astronomia, NASA, planetas, estrelas e missões espaciais',
      color: '#f59e0b'
    },
    tags: ['James Webb', 'NASA', 'galáxias', 'universo primitivo', 'astronomia'],
    author: { id: '1', name: 'Equipe NexoraComic' },
    publishedAt: '2026-09-02',
    readingTime: 6,
    featuredImage: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?w=800&q=80',
    imageAlt: 'Campo profundo do espaço mostrando galáxias distantes',
    sources: [
      { title: 'NASA - James Webb Space Telescope', url: 'https://webb.nasa.gov/', type: 'agency' },
      { title: 'ESA Webb', url: 'https://esawebb.org/', type: 'agency' }
    ]
  }`);
fs.writeFileSync('C:\\Users\\dizzritimia\\CascadeProjects\\nexoracomic\\scripts\\part1.txt', articles.join(',\n'));
console.log('Part 1 done');