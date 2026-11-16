/* Mercato — catálogo de corredores e itens comuns do mercado brasileiro */

export const CORREDORES = [
  { id: 'hortifruti', nome: 'Hortifrúti', icone: 'ti-salad', cor: '#7FB069', dica: 'Frutas, verduras e legumes' },
  { id: 'padaria',    nome: 'Padaria',    icone: 'ti-bread', cor: '#E0A458', dica: 'Pães, bolos e salgados' },
  { id: 'acougue',    nome: 'Açougue e peixaria', curto: 'Açougue', icone: 'ti-meat', cor: '#D9695F', dica: 'Carnes, aves e peixes' },
  { id: 'frios',      nome: 'Frios e laticínios', curto: 'Frios e leite', icone: 'ti-cheese', cor: '#F2C14E', dica: 'Leite, queijos, ovos e congelados' },
  { id: 'mercearia',  nome: 'Mercearia',  icone: 'ti-basket', cor: '#C98D5B', dica: 'Grãos, massas, enlatados e temperos' },
  { id: 'bebidas',    nome: 'Bebidas',    icone: 'ti-bottle', cor: '#5FA8D3', dica: 'Água, sucos, refrigerantes e vinhos' },
  { id: 'limpeza',    nome: 'Limpeza',    icone: 'ti-spray', cor: '#62B6A8', dica: 'Cozinha, roupa e casa' },
  { id: 'higiene',    nome: 'Higiene e beleza', curto: 'Higiene', icone: 'ti-bath', cor: '#B48EDB', dica: 'Banho, cabelo e cuidados' },
  { id: 'casa',       nome: 'Casa e pet', icone: 'ti-paw', cor: '#9AA5B8', dica: 'Utilidades, pilhas e pets' },
];
export const OUTROS = { id: 'outros', nome: 'Outros', icone: 'ti-dots', cor: '#94A3B8', dica: 'Itens diversos' };
export const corredor = id => CORREDORES.find(c => c.id === id) || OUTROS;

/* [emoji, nome, quantidade padrão] */
export const ITENS = {
  hortifruti: [
    ['🍅','Tomate','1 kg'],['🧅','Cebola','1 kg'],['🧄','Alho','1 cabeça'],['🥔','Batata','1 kg'],['🥕','Cenoura','500 g'],
    ['🥬','Alface','1 un'],['🥦','Brócolis','1 un'],['🥒','Pepino','2 un'],['🫑','Pimentão','2 un'],['🍆','Berinjela','1 un'],
    ['🎃','Abóbora','1 kg'],['🍠','Batata-doce','1 kg'],['🌿','Cheiro-verde','1 maço'],['🍌','Banana','1 dúzia'],['🍎','Maçã','6 un'],
    ['🍊','Laranja','2 kg'],['🍋','Limão','6 un'],['🥑','Abacate','1 un'],['🍓','Morango','1 bandeja'],['🍇','Uva','500 g'],
    ['🥭','Manga','3 un'],['🍍','Abacaxi','1 un'],['🍉','Melancia','1 un'],['🍐','Pera','4 un'],
  ],
  padaria: [
    ['🥖','Pão francês','10 un'],['🍞','Pão de forma','1 pacote'],['🧀','Pão de queijo','500 g'],['🥐','Croissant','4 un'],
    ['🍰','Bolo','1 un'],['🥯','Rosca','1 un'],['🍞','Torrada','1 pacote'],['🥖','Pão de alho','1 pacote'],['🧁','Sonho','4 un'],
  ],
  acougue: [
    ['🥩','Carne moída','500 g'],['🥩','Alcatra','1 kg'],['🥩','Picanha','1 kg'],['🥩','Costela','1 kg'],['🍗','Peito de frango','1 kg'],
    ['🍗','Coxa e sobrecoxa','1 kg'],['🌭','Linguiça','1 kg'],['🥓','Bacon','250 g'],['🐖','Lombo suíno','1 kg'],['🐟','Filé de peixe','500 g'],
    ['🦐','Camarão','500 g'],
  ],
  frios: [
    ['🥛','Leite','6 L'],['🥚','Ovos','1 dúzia'],['🧀','Muçarela','300 g'],['🧀','Queijo prato','200 g'],['🥓','Presunto','200 g'],
    ['🧈','Manteiga','200 g'],['🧈','Margarina','500 g'],['🥛','Iogurte','4 un'],['🫙','Requeijão','1 pote'],['🥛','Creme de leite','2 un'],
    ['🥛','Leite condensado','1 lata'],['🍕','Pizza congelada','1 un'],['🍨','Sorvete','1 pote'],['🧀','Parmesão','100 g'],
  ],
  mercearia: [
    ['🍚','Arroz','5 kg'],['🫘','Feijão','1 kg'],['☕','Café','500 g'],['🍝','Macarrão','500 g'],['🍬','Açúcar','1 kg'],
    ['🧂','Sal','1 kg'],['🌾','Farinha de trigo','1 kg'],['🫒','Azeite','500 ml'],['🌻','Óleo','900 ml'],['🥫','Molho de tomate','2 un'],
    ['🥫','Milho verde','1 lata'],['🐟','Atum','2 latas'],['🍫','Achocolatado','400 g'],['🍪','Biscoito','2 pacotes'],['🥣','Aveia','1 pacote'],
    ['🫙','Maionese','1 pote'],['🍿','Pipoca','1 pacote'],['🥜','Farofa','1 pacote'],['☕','Filtro de café','1 caixa'],['🍯','Mel','1 pote'],
  ],
  bebidas: [
    ['💧','Água mineral','6 un'],['🥤','Refrigerante','2 L'],['🧃','Suco','1 L'],['🥥','Água de coco','1 L'],['🍺','Cerveja','12 latas'],
    ['🍷','Vinho','1 garrafa'],['🍵','Chá','1 caixa'],['⚡','Isotônico','2 un'],
  ],
  limpeza: [
    ['🧴','Detergente','3 un'],['🧺','Sabão em pó','1 caixa'],['🌸','Amaciante','1 un'],['🧽','Esponja','1 pacote'],['🧻','Papel toalha','1 pacote'],
    ['🧪','Água sanitária','1 L'],['🫧','Desinfetante','1 un'],['🗑️','Saco de lixo','1 rolo'],['✨','Multiuso','1 un'],['🧤','Luva de limpeza','1 par'],
  ],
  higiene: [
    ['🧻','Papel higiênico','1 pacote'],['🧼','Sabonete','4 un'],['🧴','Shampoo','1 un'],['🧴','Condicionador','1 un'],['🪥','Creme dental','2 un'],
    ['🪥','Escova de dente','2 un'],['🧴','Desodorante','1 un'],['☀️','Protetor solar','1 un'],['🩹','Curativo','1 caixa'],['🧵','Fio dental','1 un'],
    ['🪒','Lâmina de barbear','1 pacote'],['🧻','Absorvente','1 pacote'],['💊','Remédio','1 un'],
  ],
  casa: [
    ['🐶','Ração de cachorro','1 pacote'],['🐱','Ração de gato','1 pacote'],['🪣','Areia de gato','1 pacote'],['🔋','Pilhas','4 un'],
    ['💡','Lâmpada','1 un'],['🔥','Carvão','1 saco'],['🧻','Guardanapo','1 pacote'],['🥡','Papel alumínio','1 rolo'],['🎞️','Filme plástico','1 rolo'],
    ['🕯️','Fósforo','1 caixa'],
  ],
};

/* palavras extras que ajudam a acertar o corredor */
const PALAVRAS = {
  hortifruti: 'fruta verdura legume salada couve rucula espinafre mandioca aipim chuchu quiabo jilo mamao kiwi melao coentro salsinha cebolinha hortela manjericao ameixa repolho beterraba abobrinha gengibre tangerina mexerica maracuja goiaba',
  padaria: 'pao bisnaguinha baguete broa sonho salgado biscoito de polvilho',
  acougue: 'carne frango boi patinho maminha fraldinha contrafile file mignon picanha cupim acem musculo peixe tilapia salmao sardinha bisteca pernil calabresa salsicha hamburguer',
  frios: 'queijo leite iogurte requeijao ricota coalhada nata congelado congelada lasanha nuggets empanado peito de peru mortadela salame',
  mercearia: 'arroz feijao massa macarrao cafe acucar sal oleo azeite vinagre tempero molho ketchup mostarda enlatado lata grao lentilha grao-de-bico ervilha cereal granola tapioca fuba polvilho fermento gelatina chocolate bombom bolacha salgadinho amendoim castanha extrato caldo',
  bebidas: 'agua refri refrigerante suco cerveja vinho cha energetico whisky vodka cachaca espumante kombucha',
  limpeza: 'sabao detergente amaciante esponja alvejante cloro desinfetante lustra limpa multiuso vassoura rodo pano flanela lixo inseticida',
  higiene: 'shampoo xampu condicionador sabonete creme dental pasta de dente escova desodorante absorvente fralda lenco hidratante protetor algodao cotonete remedio vitamina',
  casa: 'racao petisco pet areia pilha lampada vela carvao guardanapo copo descartavel prato descartavel aluminio filme',
};

export const norm = s => (s || '').toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const INDICE = [];
for (const [cid, lista] of Object.entries(ITENS)) for (const [emoji, nome, qtd] of lista) INDICE.push({ cid, emoji, nome, qtd, n: norm(nome) });

/* Descobre corredor e emoji de um item digitado */
export function classificar(nome) {
  const n = norm(nome);
  if (!n) return { corredor: 'outros', emoji: '🛒' };
  // 1. nome igual ou contido no catálogo
  let best = INDICE.find(i => i.n === n) || INDICE.find(i => n.startsWith(i.n + ' ') || n === i.n + 's')
          || INDICE.find(i => n.includes(i.n) && i.n.length > 3) || INDICE.find(i => i.n.includes(n) && n.length > 3);
  if (best) return { corredor: best.cid, emoji: best.emoji, qtd: best.qtd, nomeCatalogo: best.nome };
  // 2. palavras-chave
  const palavras = n.split(/\s+/).filter(p => p.length > 2 && !['com','sem','para','pra'].includes(p));
  for (const [cid, txt] of Object.entries(PALAVRAS)) {
    const chaves = txt.split(' ').filter(c => c.length > 2);
    if (palavras.some(p => chaves.includes(p) || chaves.includes(p.replace(/s$/, '')))) return { corredor: cid, emoji: CORREDOR_EMOJI[cid] };
  }
  return { corredor: 'outros', emoji: '🛒' };
}
const CORREDOR_EMOJI = { hortifruti: '🥬', padaria: '🥖', acougue: '🥩', frios: '🧀', mercearia: '🥫', bebidas: '🥤', limpeza: '🧴', higiene: '🧼', casa: '🏠' };

/* Lê textos como "2 kg de arroz, feijão e três latas de milho" */
const NUM = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, doze: 12, meio: 0.5, meia: 0.5 };
const UNID = [
  [/^(kg|kgs|quilo|quilos|kilo|kilos)$/, 'kg'], [/^(g|gr|grama|gramas)$/, 'g'], [/^(l|lt|litro|litros)$/, 'L'], [/^(ml)$/, 'ml'],
  [/^(un|und|unid|unidade|unidades)$/, 'un'], [/^(pacote|pacotes|pct|pcts)$/, 'pacote'], [/^(caixa|caixas|cx)$/, 'caixa'],
  [/^(lata|latas)$/, 'lata'], [/^(garrafa|garrafas)$/, 'garrafa'], [/^(duzia|duzias)$/, 'dúzia'], [/^(bandeja|bandejas)$/, 'bandeja'],
  [/^(maco|macos)$/, 'maço'], [/^(pote|potes)$/, 'pote'], [/^(saco|sacos)$/, 'saco'], [/^(rolo|rolos)$/, 'rolo'],
];
const PLURAL = { pacote: 'pacotes', caixa: 'caixas', lata: 'latas', garrafa: 'garrafas', 'dúzia': 'dúzias', bandeja: 'bandejas', 'maço': 'maços', pote: 'potes', saco: 'sacos', rolo: 'rolos' };

export function fmtQtd(num, un) {
  if (num == null) return '';
  const n = Number.isInteger(num) ? num : String(num).replace('.', ',');
  if (!un) return `${n} un`;
  return `${n} ${num > 1 && PLURAL[un] ? PLURAL[un] : un}`;
}

export function lerEntrada(texto) {
  return (texto || '')
    .replace(/\s+e\s+/gi, ',').split(/[,;\n]+/).map(s => s.trim()).filter(Boolean)
    .map(parte => {
      const pal = parte.split(/\s+/);
      let num = null, un = null, i = 0;
      const p0 = norm(pal[0]);
      if (/^\d+([.,]\d+)?$/.test(p0)) { num = parseFloat(p0.replace(',', '.')); i = 1; }
      else if (/^\d+([.,]\d+)?(kg|g|l|ml)$/.test(p0)) { const m = p0.match(/^(\d+(?:[.,]\d+)?)(kg|g|l|ml)$/); num = parseFloat(m[1].replace(',', '.')); un = m[2] === 'l' ? 'L' : m[2]; i = 1; }
      else if (NUM[p0] != null && pal.length > 1) { num = NUM[p0]; i = 1; }
      if (i && !un && pal[i]) { const u = UNID.find(([re]) => re.test(norm(pal[i]))); if (u) { un = u[1]; i++; } }
      if (i && norm(pal[i]) === 'de') i++;
      let nome = pal.slice(i).join(' ').trim() || parte;
      nome = nome.charAt(0).toUpperCase() + nome.slice(1);
      const c = classificar(nome);
      const nc = c.nomeCatalogo && norm(c.nomeCatalogo), nn = norm(nome);
      const nomeFinal = nc && (nc === nn || nc + 's' === nn || nc === nn + 's') ? c.nomeCatalogo : nome;
      return { nome: nomeFinal, qtd: num != null ? fmtQtd(num, un) : (c.qtd || '1 un'), corredor: c.corredor, emoji: c.emoji };
    });
}

/* +/- na quantidade, respeitando a unidade */
export function passoQtd(qtd, delta) {
  const m = (qtd || '1 un').match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/);
  if (!m) return qtd;
  let n = parseFloat(m[1].replace(',', '.'));
  let un = m[2] || 'un';
  const singular = Object.entries(PLURAL).find(([, p]) => p === un)?.[0] || un;
  const passo = (singular === 'g' || singular === 'ml') ? (n >= 500 ? 250 : 100) : (singular === 'kg' || singular === 'L') && n < 1 ? 0.5 : 1;
  n = Math.max(passo, Math.round((n + passo * delta) * 10) / 10);
  return fmtQtd(n, singular);
}
