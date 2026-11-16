/* Mercato — estado do app (salvo no aparelho; Supabase entra na próxima etapa) */
import { classificar, norm, ITENS } from './catalogo.js';

const CHAVE = 'mercato:v1';
const subs = new Set();
export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));

/* sincronização: quando a conta está na nuvem, cada mudança vira uma operação na fila */
let sink = null;
export const usarSink = f => (sink = f);
const nuvem = () => estado?.modo === 'nuvem' && sink;
const fid = () => estado.familia.id;
const iso = t => new Date(t).toISOString();
const linhaItem = (lid, i) => ({ id: i.id, lista_id: lid, familia_id: fid(), nome: i.nome, qtd: i.qtd, corredor: i.corredor, emoji: i.emoji, comprado: i.comprado, preco: i.preco, por: i.por, add: i.add, quando: iso(i.quando), atualizado: iso(Date.now()) });
const op = o => { if (nuvem()) sink(o); };
export function substituir(novo) { novo.tema = estado?.tema || novo.tema || 'auto'; estado = novo; salvar(); }

export const CORES_PESSOA = ['#C9824A', '#3E5C8A', '#6F8F67', '#9B5DA8', '#B5532E', '#2F8F83'];

export let estado = carregar();

function carregar() {
  try { const s = localStorage.getItem(CHAVE); if (s) return JSON.parse(s); } catch (e) {}
  return null;
}
export function salvar() {
  try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) {}
  subs.forEach(f => f());
}
export const assinar = f => (subs.add(f), () => subs.delete(f));

export function novoEstado(nome) {
  estado = {
    versao: 1, demo: false, tema: 'auto',
    eu: { id: 'eu', nome: nome || 'Você', cor: CORES_PESSOA[0] },
    familia: { nome: 'Nossa casa', membros: [{ id: 'eu', nome: nome || 'Você', cor: CORES_PESSOA[0] }] },
    listas: [{ id: uid(), nome: 'Compra do mês', icone: 'ti-shopping-cart', criada: Date.now(), itens: [] }],
    historico: {}, compras: [],
  };
  salvar();
}

export function sair() {
  try { localStorage.removeItem(CHAVE); } catch (e) {}
  estado = null; subs.forEach(f => f());
}

/* ---------- listas ---------- */
export const lista = id => id === 'principal' ? estado.listas[0] : estado.listas.find(l => l.id === id);
export function criarLista(nome, icone) {
  const l = { id: uid(), nome: nome || 'Nova lista', icone: icone || 'ti-shopping-cart', criada: Date.now(), itens: [] };
  estado.listas.push(l); salvar();
  op({ t: 'up', tab: 'listas', row: { id: l.id, familia_id: fid(), nome: l.nome, icone: l.icone, criada: iso(l.criada) } });
  return l;
}
export function editarLista(id, dados) { Object.assign(lista(id), dados); salvar(); op({ t: 'upd', tab: 'listas', row: dados, match: { id } }); }
export function excluirLista(id) { estado.listas = estado.listas.filter(l => l.id !== id); salvar(); op({ t: 'del', tab: 'listas', match: { id } }); }
export function renomear(nome) {
  estado.eu.nome = nome; const m = estado.familia.membros.find(x => x.id === estado.eu.id); if (m) m.nome = nome; salvar();
  op({ t: 'upd', tab: 'membros', row: { nome }, match: { familia_id: fid(), user_id: estado.eu.id } });
}

/* ---------- itens ---------- */
export function acharItem(l, nome) { const n = norm(nome); return l.itens.find(i => norm(i.nome) === n && !i.comprado); }

export function adicionarItens(listaId, novos, quem) {
  const l = lista(listaId); const add = [];
  for (const it of novos) {
    const existe = acharItem(l, it.nome);
    if (existe) { existe.qtd = it.qtd || existe.qtd; op({ t: 'upd', tab: 'itens', row: { qtd: existe.qtd }, match: { id: existe.id } }); continue; }
    const c = it.corredor ? it : { ...it, ...classificar(it.nome) };
    const item = { id: uid(), nome: it.nome, qtd: it.qtd || '1 un', corredor: c.corredor, emoji: c.emoji || '🛒', comprado: false, preco: null, por: null, add: quem || estado.eu.nome, quando: Date.now() };
    l.itens.push(item); add.push(item); op({ t: 'up', tab: 'itens', row: linhaItem(l.id, item) });
    const h = estado.historico[norm(it.nome)] || { nome: it.nome, emoji: item.emoji, corredor: item.corredor, qtd: item.qtd, n: 0 };
    h.n++; h.qtd = item.qtd; estado.historico[norm(it.nome)] = h;
    op({ t: 'up', tab: 'historico', on: 'familia_id,chave', row: { familia_id: fid(), chave: norm(it.nome), nome: h.nome, emoji: h.emoji, corredor: h.corredor, qtd: h.qtd, n: h.n } });
  }
  salvar(); return add;
}
export function editarItem(listaId, itemId, dados) {
  const i = lista(listaId).itens.find(x => x.id === itemId); Object.assign(i, dados); salvar();
  op({ t: 'upd', tab: 'itens', row: { ...dados, atualizado: iso(Date.now()) }, match: { id: itemId } }); return i;
}
export function removerItem(listaId, itemId) { const l = lista(listaId); l.itens = l.itens.filter(i => i.id !== itemId); salvar(); op({ t: 'del', tab: 'itens', match: { id: itemId } }); }
export function alternarComprado(listaId, itemId, quem) {
  const i = lista(listaId).itens.find(x => x.id === itemId);
  i.comprado = !i.comprado; i.por = i.comprado ? (quem || estado.eu.nome) : null;
  salvar(); op({ t: 'upd', tab: 'itens', row: { comprado: i.comprado, por: i.por, atualizado: iso(Date.now()) }, match: { id: itemId } }); return i;
}
export function finalizarCompra(listaId) {
  const l = lista(listaId);
  const comprados = l.itens.filter(i => i.comprado);
  const total = comprados.reduce((s, i) => s + (i.preco || 0), 0);
  const c = { id: uid(), data: Date.now(), lista: l.nome, total, qtd: comprados.length };
  estado.compras.unshift(c);
  l.itens = l.itens.filter(i => !i.comprado);
  salvar();
  op({ t: 'up', tab: 'compras', row: { id: c.id, familia_id: fid(), data: iso(c.data), lista: c.lista, total: c.total, qtd: c.qtd } });
  if (comprados.length) op({ t: 'delIn', tab: 'itens', ids: comprados.map(i => i.id) });
  return { total, qtd: comprados.length };
}

/* ---------- métricas para o painel ---------- */
export function resumo() {
  const pend = estado.listas.flatMap(l => l.itens.filter(i => !i.comprado));
  const agora = new Date();
  const doMes = estado.compras.filter(c => { const d = new Date(c.data); return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear(); });
  const mesPassado = estado.compras.filter(c => { const d = new Date(c.data); const m = new Date(agora.getFullYear(), agora.getMonth() - 1, 1); return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear(); });
  const porCorredor = {};
  for (const i of pend) porCorredor[i.corredor] = (porCorredor[i.corredor] || 0) + 1;
  return {
    pendentes: pend.length, porCorredor,
    gastoMes: doMes.reduce((s, c) => s + c.total, 0), comprasMes: doMes.length,
    gastoMesPassado: mesPassado.reduce((s, c) => s + c.total, 0),
    semanas: gastosPorSemana(),
  };
}
function gastosPorSemana() {
  const sem = [0, 0, 0, 0, 0, 0];
  const agora = Date.now(), S = 7 * 864e5;
  for (const c of estado.compras) { const k = Math.floor((agora - c.data) / S); if (k < 6) sem[5 - k] += c.total; }
  return sem;
}

/* ---------- demonstração ---------- */
export function carregarDemo() {
  const ana = { id: 'eu', nome: 'Ana', cor: CORES_PESSOA[0] }, lucas = { id: 'lucas', nome: 'Lucas', cor: CORES_PESSOA[1] }, bia = { id: 'bia', nome: 'Bia', cor: CORES_PESSOA[3] };
  estado = { versao: 1, demo: true, tema: estado?.tema || 'auto', eu: ana, familia: { nome: 'Nossa casa', membros: [ana, lucas, bia] }, listas: [], historico: {}, compras: [] };
  const mk = (nome, icone, itens) => {
    const l = { id: uid(), nome, icone, criada: Date.now(), itens: [] };
    estado.listas.push(l);
    for (const [txt, qtd, comprado, preco, quem] of itens) {
      const c = classificar(txt);
      l.itens.push({ id: uid(), nome: txt, qtd: qtd || c.qtd || '1 un', corredor: c.corredor, emoji: c.emoji, comprado: !!comprado, preco: preco || null, por: comprado ? (quem || 'Ana') : null, add: quem || 'Ana', quando: Date.now() - Math.random() * 864e5 * 3 });
    }
  };
  mk('Compra do mês', 'ti-shopping-cart', [
    ['Tomate', '1 kg', 1, 7.9], ['Banana', '1 dúzia', 1, 6.5, 'Lucas'], ['Alface', '1 un'], ['Cebola', '1 kg'], ['Cheiro-verde', '1 maço'],
    ['Pão francês', '10 un'], ['Peito de frango', '1 kg', 1, 21.9], ['Carne moída', '500 g'],
    ['Leite', '6 L', 1, 29.4, 'Lucas'], ['Ovos', '1 dúzia'], ['Muçarela', '300 g'], ['Iogurte', '4 un'],
    ['Arroz', '5 kg', 1, 27.9], ['Feijão', '1 kg', 1, 8.9], ['Café', '500 g'], ['Azeite', '500 ml'], ['Molho de tomate', '2 un'],
    ['Água mineral', '6 un'], ['Detergente', '3 un', 1, 7.5, 'Bia'], ['Sabão em pó', '1 caixa'], ['Papel higiênico', '1 pacote'], ['Creme dental', '2 un'],
    ['Ração de gato', '1 pacote'],
  ]);
  mk('Churrasco de sábado', 'ti-flame', [
    ['Picanha', '1,5 kg'], ['Linguiça', '1 kg'], ['Coxa e sobrecoxa', '1 kg'], ['Pão de alho', '2 pacotes'], ['Carvão', '1 saco'],
    ['Cerveja', '24 latas'], ['Refrigerante', '2 L'], ['Farofa', '1 pacote'], ['Tomate', '500 g'], ['Cebola', '500 g'], ['Limão', '6 un'], ['Guardanapo', '1 pacote'],
  ]);
  mk('Farmácia', 'ti-pill', [['Protetor solar', '1 un'], ['Curativo', '1 caixa'], ['Fio dental', '1 un']]);
  // histórico ("seus de sempre") e compras anteriores
  const freq = ['Leite', 'Pão francês', 'Ovos', 'Banana', 'Tomate', 'Café', 'Arroz', 'Feijão', 'Muçarela', 'Detergente', 'Papel higiênico', 'Peito de frango', 'Iogurte', 'Cebola', 'Água mineral'];
  freq.forEach((n, k) => { const c = classificar(n); const cat = Object.values(ITENS).flat().find(x => x[1] === n); estado.historico[norm(n)] = { nome: n, emoji: c.emoji, corredor: c.corredor, qtd: cat ? cat[2] : '1 un', n: 20 - k }; });
  const d = Date.now(), D = 864e5;
  estado.compras = [
    { id: uid(), data: d - 3 * D, lista: 'Compra da semana', total: 186.4, qtd: 21 },
    { id: uid(), data: d - 10 * D, lista: 'Feira', total: 64.9, qtd: 12 },
    { id: uid(), data: d - 14 * D, lista: 'Compra do mês', total: 512.35, qtd: 48 },
    { id: uid(), data: d - 20 * D, lista: 'Farmácia', total: 89.7, qtd: 4 },
    { id: uid(), data: d - 26 * D, lista: 'Compra da semana', total: 172.1, qtd: 19 },
    { id: uid(), data: d - 33 * D, lista: 'Churrasco', total: 248.0, qtd: 14 },
  ];
  salvar();
}
