// scripts/apply-commons-picks.mjs — aplica as imagens validadas (_commons_picks.json)
// em lib/articles.ts. Altera APENAS featuredImage e imageAlt dos artigos listados.
// Segurança: só substitui featuredImage que ainda seja source.unsplash.com (quebrado).
import { readFileSync, writeFileSync } from 'node:fs';

const ALT_OVERRIDES = {
  '31': 'Placa de vídeo NVIDIA GeForce sobre fundo neutro',
  '32': 'Computador gamer com gabinete e componentes iluminados',
  '33': 'Corredor de servidores de data center com luzes de status',
  '34': 'Wafer de silício de 12 polegadas usado na fabricação de chips',
  '35': 'Placa de vídeo NVIDIA GeForce com saída HDMI',
  '36': 'Placa de vídeo instalada em placa-mãe de computador',
  '37': 'Mesa de trabalho com monitor de computador e teclado',
  '38': 'Módulos de memória RAM vista de perto',
  '39': 'Dois smartphones exibindo aplicativos na tela',
  '40': 'Sede da Microsoft em Redmond, One Microsoft Way',
  '41': 'Cúpula do telescópio Clark do Observatório Lowell',
  '42': 'Lançamento da missão Artemis 1 da NASA',
  '43': 'Aparelho de ressonância magnética em hospital',
  '44': 'Esculturas da justiça com balança na Loggia della Mercanzia',
  '45': 'Computador quântico em laboratório de pesquisa',
  '46': 'Torre de celular 5G contra o céu',
  '47': 'Micrografia eletrônica da bactéria Escherichia coli',
  '48': 'Interior do túnel do LHC no CERN',
  '49': 'Console Nintendo Switch com Joy-Cons na base',
  '50': 'Racks de servidores do data center da Wikimedia Foundation',
  '51': 'Controle remoto de TV segurado em direção à televisão',
  '52': 'Câmera de cinema em set de filmagem',
  '53': 'Pessoa lendo em leitor digital em ambiente escuro',
  '54': 'Lâmpada de plasma com descargas elétricas roxas',
  '55': 'Peixe de profundidade Chlorophthalmus agassizi',
  '56': 'Corte de concha de náutilo mostrando espiral logarítmica',
  '57': 'Criança usando relógio inteligente no pulso',
  '58': 'Esquema de tokamak para fusão nuclear',
  '59': 'Loja de quadrinhos com estantes cheias de revistas',
  '60': 'Interior de loja de quadrinhos com estantes de revistas',
  '61': 'Interior de auditório de teatro histórico nos Estados Unidos',
  '62': 'Loja de quadrinhos com prateleiras de revistas',
  '63': 'Cosplay do Superman em convenção',
  '64': 'Cosplay do Batman em convenção de quadrinhos',
  '65': 'Tela de televisão de tubo em close',
  '66': 'Corredor vazio pintado por Vincent van Gogh',
  '67': 'Imagem da Via Láctea em infravermelho pelo telescópio Spitzer',
  '68': 'Controle remoto universal sobre fundo branco',
  '69': 'Hospital abandonado com corredores vazios',
  '70': 'Vista aérea de Manhattan à noite',
  '71': 'Castelo da Bela Adormecida na Disneylândia à noite',
  '72': 'Deserto de Wadi Rum com dunas vermelhas',
  '73': 'Fogos de artifício sobre o castelo da Disneylândia',
  '74': 'Skyline do centro de Miami',
  '75': 'Cosplay de super-herói em convenção',
  '76': 'Castelo de Alnwick, locação de filmes de fantasia',
  '77': 'Estátua de cavaleiro medieval com armadura brilhante',
  '78': 'Rua iluminada à noite envolta em névoa',
  '79': 'Nebulosa de Órion fotografada com filtro',
  '80': 'Columbia no lançamento da missão STS-1',
  '81': 'Aurora boreal em tons verdes sobre o céu noturno',
  '82': 'Skyline de Manhattan visto de Weehawken',
  '83': 'Sala de estar com televisão ligada',
  '84': 'Formações rochosas do Monument Valley',
  '85': 'Livraria de mangás e livros no Japão',
  '86': 'Livraria de mangás e anime no Japão',
  '87': 'Grupo de cosplayers em convenção de quadrinhos',
  '88': 'Castelo de Bran, na Romênia, envolto em vegetação',
  '89': 'Miniaturas de wargame em escala para jogo de táticas',
  '90': 'Raios de sol atravessando floresta enevoada',
  '91': 'Console Xbox original em fundo neutro',
  '92': 'Console PlayStation 5 com controle',
  '93': 'Parque com árvores e caminho gramado',
  '94': 'Sonda MESSENGER da NASA a caminho de Mercúrio',
  '95': 'Circuitos integrados em placa de som vista de perto',
  '96': 'Ilustração da inserção orbital da Cassini em Saturno',
  '97': 'Sistema de Fomalhaut com exoplaneta em disco de poeira',
  '98': 'Controle Pro da Nintendo Switch em fundo branco',
  '99': 'Letreiros de neon do distrito de Dotonbori, em Osaka',
  '100': 'Câmera de cinema 16mm',
  '101': 'Interior de cinema IMAX com tela panorâmica',
  '102': 'Nebulosa Roseta em tons de vermelho',
  '103': 'Earthrise: nascer da Terra visto da órbita lunar pela Apollo 8',
  '104': 'Lareira com chamas acesas',
  '105': 'Posto de gasolina antigo iluminado à noite',
};

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function main() {
  const data = JSON.parse(readFileSync('_commons_picks.json', 'utf8'));
  const picks = data.picks || [];
  if (picks.length === 0) throw new Error('Nenhum pick encontrado em _commons_picks.json');

  // Limpa parâmetros de rastreamento utm_* que a API do Commons acrescenta às URLs
  function cleanUrl(url) {
    return url.replace(/\?utm_source=[^']*$/, '');
  }

  let text = readFileSync('lib/articles.ts', 'utf8');
  let changed = 0;
  const report = [];

  for (const pick of picks) {
    const id = String(pick.id);
    const newUrl = cleanUrl(pick.usedUrl || pick.thumbUrl || pick.originalUrl);
    const newAlt = ALT_OVERRIDES[id] || null;
    if (!newAlt) {
      report.push({ id, status: 'SKIP', reason: 'sem imageAlt definido' });
      continue;
    }
    // Localiza o bloco do artigo pelo id (âncora estável), limitado até o próximo id ou fim do array
    const anchor = new RegExp("(id: '" + escapeRegex(id) + "',)");
    const m = text.match(anchor);
    if (!m) {
      report.push({ id, status: 'NOT_FOUND' });
      continue;
    }
    const blockStart = m.index;
    let blockEnd = text.length;
    const nextId = text.slice(blockStart + 10).match(/\nid: '/);
    if (nextId) blockEnd = blockStart + 10 + nextId.index;
    const block = text.slice(blockStart, blockEnd);

    // Substitui featuredImage apenas se ainda for URL quebrada de source.unsplash.com
    const imgRe = /featuredImage: 'https:\/\/source\.unsplash\.com\/[^']*'/;
    if (!imgRe.test(block)) {
      report.push({ id, status: 'SKIP', reason: 'featuredImage não é source.unsplash.com (não alterar artigos corretos)' });
      continue;
    }
    let newBlock = block.replace(imgRe, "featuredImage: '" + newUrl + "'");
    // Atualiza imageAlt existente (mantém o campo quando presente)
    if (/imageAlt: '[^']*'/.test(newBlock)) {
      newBlock = newBlock.replace(/imageAlt: '[^']*'/, "imageAlt: '" + newAlt + "'");
    } else {
      newBlock = newBlock.replace(/(featuredImage: '[^']*'(?:,)?)/, "$1\n    imageAlt: '" + newAlt + "',");
    }
    text = text.slice(0, blockStart) + newBlock + text.slice(blockEnd);
    changed++;
    report.push({ id, status: 'OK', file: pick.file, license: pick.license, url: newUrl });
  }

  writeFileSync('lib/articles.ts', text, 'utf8');
  console.log('[apply] Artigos alterados: ' + changed + ' de ' + picks.length);
  for (const r of report) {
    console.log('  [' + r.status + '] id=' + r.id + (r.file ? ' -> ' + r.file + ' [' + r.license + ']' : r.reason ? ' (' + r.reason + ')' : ''));
  }
}

main();
