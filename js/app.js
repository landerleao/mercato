/* Mercato — app */
import { CORREDORES, OUTROS, ITENS, corredor, norm, lerEntrada, passoQtd, classificar } from './catalogo.js';
import * as S from './store.js';
import * as N from './nuvem.js';

const app = document.getElementById('app');
const sheetRoot = document.getElementById('sheet-root');
const toasts = document.getElementById('toasts');

/* ---------- utilidades ---------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const money = v => BRL.format(v || 0);
const plural = (n, s, p) => `${n} ${n === 1 ? s : p}`;
const saudacao = () => { const h = new Date().getHours(); return h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };
const hoje = () => { const t = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()); return t[0].toUpperCase() + t.slice(1); };
function tempo(ts) {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return 'agora'; if (s < 3600) return `há ${Math.floor(s / 60)} min`; if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
  const d = Math.floor(s / 86400); return d === 1 ? 'ontem' : d < 30 ? `há ${d} dias` : new Date(ts).toLocaleDateString('pt-BR');
}
let gid = 0;
export function LOGO(w = 40) {
  const id = 'lg' + (gid++);
  return `<svg class="logo-svg" width="${w}" height="${Math.round(w * .84)}" viewBox="0 0 120 100" fill="none" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ECCB93"/><stop offset=".55" stop-color="#D4A762"/><stop offset="1" stop-color="#B98A47"/></linearGradient></defs><g stroke="url(#${id})" stroke-width="9.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 11h13l14.5 52H64L104 25H27"/><path d="M47 44l17 19"/></g><circle cx="43" cy="84" r="7.5" fill="url(#${id})"/><circle cx="72" cy="84" r="7.5" fill="url(#${id})"/></svg>`;
}
const pessoa = nome => S.estado.familia.membros.find(m => m.nome === nome) || { nome: nome || '?', cor: '#94A3B8' };
const av = (p, cls = '') => `<span class="av ${cls}" style="background:${p.cor}" title="${esc(p.nome)}">${esc((p.nome || '?')[0].toUpperCase())}</span>`;
const avs = (cls = '') => `<span class="avs">${S.estado.familia.membros.slice(0, 4).map(m => av(m, cls)).join('')}</span>`;
const CHECK = `<svg width="13" height="13" viewBox="0 0 12 12"><path d="M2.4 6.3l2.4 2.4 4.8-5.2" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ico = (icone, cor, extra = '') => `<span class="ico" style="--c:${cor}" ${extra}><i class="ti ${icone}"></i></span>`;

/* ---------- rotas ---------- */
let rotaAnterior = '', ultimoToque = null, dirPasseio = 'slide-l', ringAnterior = {}, simulado = new Set();
function rota() { const p = (location.hash || '#/inicio').slice(2).split('/'); return { nome: p[0] || 'inicio', a: p[1], b: p[2] }; }
const go = h => { if (location.hash === h) render(); else location.hash = h; };

function render() {
  aplicarTema();
  const r0 = rota();
  if (r0.nome === 'convite' && r0.a) { guardarConvite(r0.a); history.replaceState(null, '', location.pathname + location.search + '#/inicio'); aoReceberConvite(r0.a); }
  if (sessao && semCasa) { app.className = ''; app.innerHTML = telaCasa(); rotaAnterior = 'casa'; clearTimeout(fimAnim); fimAnim = setTimeout(() => app.classList.add('anim-done'), 2200); return; }
  if (!S.estado) { app.className = ''; app.innerHTML = boasVindas(); rotaAnterior = 'welcome'; clearTimeout(fimAnim); fimAnim = setTimeout(() => app.classList.add('anim-done'), 2200); return; }
  const r = rota();
  const chave = location.hash;
  const mesma = chave === rotaAnterior;
  const y = scrollY;
  let corpo, cheia = false;
  try {
    switch (r.nome) {
      case 'lista': corpo = telaLista(r.a); break;
      case 'passeio': if (r.a) { corpo = telaPasseio(r.a, +(r.b || 0)); cheia = true; } else corpo = telaEscolher(); break;
      case 'compra': corpo = telaCompra(r.a); cheia = true; break;
      case 'familia': corpo = telaFamilia(); break;
      case 'perfil': corpo = telaPerfil(); break;
      default: corpo = telaInicio();
    }
  } catch (e) { console.error(e); location.hash = '#/inicio'; return; }
  if (corpo == null) return;
  app.className = mesma ? 'no-anim' : '';
  app.innerHTML = `<div class="shell">${lateral(r.nome)}<main class="main"><div class="${mesma ? '' : 'page'}">${corpo}</div></main></div>${cheia ? '' : barra(r.nome)}`;
  rotaAnterior = chave;
  if (mesma) scrollTo(0, y); else scrollTo(0, 0);
  depois(mesma);
  ultimoToque = null;
}
addEventListener('hashchange', render);
S.assinar(() => {});

let fimAnim;
function depois(mesma) {
  clearTimeout(fimAnim);
  if (!mesma) fimAnim = setTimeout(() => app.classList.add('anim-done'), 2200); // garante o conteúdo visível mesmo se a animação for pausada
  if (!mesma) document.querySelectorAll('[data-count]').forEach(el => contar(el));
  document.querySelectorAll('.ring .fg').forEach(c => {
    const alvo = +c.dataset.off; requestAnimationFrame(() => requestAnimationFrame(() => { c.style.strokeDashoffset = alvo; }));
  });
}
function contar(el) {
  const fim = +el.dataset.count, fmt = el.dataset.fmt, t0 = performance.now(), dur = 1100;
  const f = v => fmt === 'money' ? money(v) : Math.round(v).toLocaleString('pt-BR');
  const passo = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4); el.textContent = f(fim * e); if (p < 1) requestAnimationFrame(passo); };
  el.textContent = f(0); requestAnimationFrame(passo);
}

/* ---------- navegação ---------- */
const NAV = [['inicio', 'ti-layout-dashboard', 'Início', '#/inicio'], ['passeio', 'ti-route', 'Passeio', '#/passeio'], ['familia', 'ti-users', 'Família', '#/familia'], ['perfil', 'ti-user-circle', 'Perfil', '#/perfil']];
function lateral(at) {
  const on = at === 'lista' ? 'inicio' : at;
  return `<aside class="side"><div class="logo">${LOGO(38)}<span class="wm" style="font-size:28px">mercato</span></div>
    <nav>${NAV.map(([k, i, n, h]) => `<a href="${h}" class="${on === k ? 'on' : ''}"><i class="ti ${i}"></i>${n}</a>`).join('')}</nav>
    <div class="side-cta card" style="padding:18px">
      <div class="h" style="font-size:15px">Faltou alguma coisa?</div>
      <p class="muted" style="font-size:13px;margin:4px 0 14px">Anote agora e não esqueça no mercado.</p>
      <button class="btn btn-gold btn-block" data-a="rapido" style="height:44px;font-size:14px"><i class="ti ti-plus"></i>Adicionar itens</button>
    </div></aside>`;
}
function barra(at) {
  const on = at === 'lista' ? 'inicio' : at;
  const t = ([k, i, n, h]) => `<a href="${h}" class="tab ${on === k ? 'on' : ''}"><i class="ti ${i}"></i>${n}</a>`;
  return `<nav class="tabbar">${t(NAV[0])}${t(NAV[1])}<button class="tab-fab" data-a="rapido" aria-label="Adicionar itens"><i class="ti ti-plus"></i></button>${t(NAV[2])}${t(NAV[3])}</nav>`;
}

/* ---------- boas-vindas ---------- */
function boasVindas() {
  return `<div class="welcome"><div class="blob b1"></div><div class="blob b3"></div><div class="blob b2"></div>
    <div class="center">${LOGO(132)}<div class="wm">mercato</div><div class="tag">Compras organizadas.<br>Vida mais leve.</div></div>
    <div class="acts">${pegarConvite() ? `<div class="convite-banner"><i class="ti ti-mail-heart"></i><span>Você foi convidado(a) para <b>${esc(conviteNome || 'uma casa')}</b>. Crie sua conta ou entre para participar.</span></div>` : ''}
    ${N.ativo ? `<button class="btn btn-gold btn-block" data-a="cadastro" style="height:56px;font-size:16px">Criar conta</button>
      <button class="btn btn-block btn-dark-line" data-a="login" style="height:52px">Já tenho conta</button>`
    : `<button class="btn btn-gold btn-block" data-a="comecar" style="height:56px;font-size:16px">Começar</button>`}
    <button class="link" data-a="demo"><i class="ti ti-sparkles" style="color:#ECCB93"></i> Ver demonstração</button></div></div>`;
}

/* ---------- criar ou entrar numa casa (depois do primeiro login) ---------- */
function telaCasa() {
  const nome = nomeUsuario();
  return `<div class="welcome"><div class="blob b1"></div><div class="blob b3"></div><div class="blob b2"></div>
    <div class="center onb">${LOGO(70)}
      <h1 class="h a" style="font-size:30px;margin-top:18px">Olá, ${esc(nome)}!</h1>
      <p class="a" style="--d:1;color:#C9D1DE;margin:8px 0 26px;max-width:360px">Crie a casa da sua família ou entre na de alguém com o código do convite.</p>
      <form id="fCasa" class="glass a" style="--d:2"><label class="field"><span>Nome da casa</span><input name="nome" maxlength="30" value="Nossa casa" required></label>
        <button class="btn btn-gold btn-block"><i class="ti ti-home-plus"></i>Criar minha casa</button></form>
      <div class="ou a" style="--d:3">ou</div>
      <form id="fCodigo" class="glass a" style="--d:4"><label class="field"><span>Código do convite</span><input name="c" maxlength="6" placeholder="AB12CD" autocapitalize="characters" required style="text-transform:uppercase;letter-spacing:.2em"></label>
        <button class="btn btn-block btn-dark-line"><i class="ti ti-door-enter"></i>Entrar na casa</button></form>
      <button class="link a" style="--d:5;margin-top:10px" data-a="logout">Sair da conta</button>
    </div></div>`;
}

/* ---------- início (painel) ---------- */
function telaInicio() {
  const r = S.resumo(), eu = S.estado.eu, l0 = S.estado.listas[0];
  const delta = r.gastoMesPassado ? Math.round((r.gastoMes - r.gastoMesPassado) / r.gastoMesPassado * 100) : null;
  const stats = cls => `<div class="stats ${cls}">
    <div class="card stat a" style="--d:2">${ico('ti-wallet', '#D4A762')}<div><div class="v num" data-count="${r.gastoMes}" data-fmt="money">${money(r.gastoMes)}</div><div class="l">Gasto no mês</div>
      ${delta != null ? `<div class="delta ${delta > 0 ? 'up-bad' : 'up-good'}"><i class="ti ti-trending-${delta > 0 ? 'up' : 'down'}"></i>${Math.abs(delta)}%<span class="hide-m">&nbsp;vs. mês passado</span></div>` : ''}</div></div>
    <div class="card stat a" style="--d:3">${ico('ti-list-check', '#5FA8D3')}<div><div class="v num" data-count="${r.pendentes}">${r.pendentes}</div><div class="l">Itens faltando</div></div></div>
    <div class="card stat a" style="--d:4">${ico('ti-receipt-2', '#7FB069')}<div><div class="v num" data-count="${r.comprasMes}">${r.comprasMes}</div><div class="l">Compras no mês</div></div></div>
  </div>`;
  const maxS = Math.max(1, ...r.semanas);
  const lbl = ['5 sem', '4 sem', '3 sem', '2 sem', '1 sem', 'Esta'];
  return `
  <header class="top a">
    <div><div class="hello">${saudacao()}, ${esc(eu.nome)}<span class="hide-m"> · ${hoje()}</span></div>
    <h1>O que está <em>faltando</em> em casa?</h1></div>
    <div style="display:flex;align-items:center;gap:10px">${S.estado.demo ? '<span class="chip-tag badge-demo"><i class="ti ti-sparkles"></i>Demo</span>' : ''}${chipSync()}<a href="#/familia">${avs()}</a></div>
  </header>
  <div class="dash">
   <div class="col-l">
    <section class="hero a" style="--d:1"><div class="glow"></div><div class="ring-deco"></div>
      <div class="eyebrow">Passeio pelo mercado</div>
      <h2>Passe pelos 9 setores e monte a lista sem esquecer nada.</h2>
      <p>${r.pendentes ? `${plural(r.pendentes, 'item anotado', 'itens anotados')} em ${plural(S.estado.listas.length, 'lista', 'listas')}. Continue de onde parou.` : 'Sua lista está vazia. Que tal começar agora?'}</p>
      <div class="row"><button class="btn btn-gold" data-a="go" data-h="#/passeio${S.estado.listas.length > 1 ? '' : '/' + l0?.id + '/0'}"><i class="ti ti-route"></i>Começar passeio</button>
      <div class="mini-icons">${CORREDORES.slice(0, 5).map((c, k) => `<span style="--d:${k}"><i class="ti ${c.icone}"></i></span>`).join('')}</div></div>
    </section>
    <div class="m-only">${stats('')}</div>
    <div class="sec-h a" style="--d:5"><h2>Setores do mercado</h2><span class="dim" style="font-size:12.5px">${l0 ? 'em ' + esc(l0.nome) : ''}</span></div>
    <div class="setores">${CORREDORES.map((c, k) => { const n = l0 ? l0.itens.filter(i => i.corredor === c.id && !i.comprado).length : 0;
      return `<button class="card setor press lift a ${n ? '' : 'ok'}" style="--d:${k + 6};--c:${c.cor}" data-a="go" data-h="#/passeio/${l0?.id}/${k}">
        ${ico(c.icone, c.cor)}<div style="min-width:0"><b><span class="hide-m">${c.nome}</span><span class="only-m">${c.curto || c.nome}</span></b><small>${n ? plural(n, 'item', 'itens') : 'Nada faltando'}</small></div><span class="count">${n}</span></button>`; }).join('')}</div>
    <div class="sec-h a" style="--d:14"><h2>Suas listas</h2><button data-a="novaLista">Nova lista</button></div>
    <div class="listas">${S.estado.listas.map((l, k) => cardLista(l, k + 15)).join('')}
      <button class="lnew a" style="--d:${S.estado.listas.length + 15}" data-a="novaLista"><i class="ti ti-plus" style="font-size:20px"></i>Criar nova lista</button></div>
   </div>
   <div class="col-r">
    <div class="d-only">${stats('')}</div>
    <div class="sec-h a" style="--d:8"><h2>Gastos por semana</h2><span class="dim num" style="font-size:12.5px">${money(r.semanas.reduce((a, b) => a + b, 0))}</span></div>
    <div class="card chart a" style="--d:9">
      <div class="muted" style="font-size:12.5px">Últimas 6 semanas</div>
      <div class="bars">${r.semanas.map((v, k) => `<div><i class="${k === 5 ? 'cur' : ''}" style="height:${Math.max(6, v / maxS * 100)}%;--d:${k}" title="${money(v)}"></i><span>${lbl[k]}</span></div>`).join('')}</div>
    </div>
    <div class="sec-h a" style="--d:10"><h2>Últimas compras</h2></div>
    <div class="card compras-rec a" style="--d:11;padding:4px 16px">${S.estado.compras.length ? S.estado.compras.slice(0, 4).map(c => `
      <div class="row">${ico('ti-receipt', '#D4A762')}<div style="flex:1;min-width:0"><b>${esc(c.lista)}</b><small class="muted">${tempo(c.data)} · ${plural(c.qtd, 'item', 'itens')}</small></div><b class="num">${money(c.total)}</b></div>`).join('')
      : `<div class="empty" style="padding:24px 10px"><p>Ao finalizar uma compra, ela aparece aqui com o total gasto.</p></div>`}</div>
   </div>
  </div>`;
}
function cardLista(l, d) {
  const tot = l.itens.length, ok = l.itens.filter(i => i.comprado).length, pct = tot ? Math.round(ok / tot * 100) : 0;
  return `<a href="#/lista/${l.id}" class="card lcard press lift a" style="--d:${d}">
    <div class="t">${ico(l.icone, '#D4A762')}<div style="flex:1;min-width:0"><b>${esc(l.nome)}</b><small>${tot ? `${plural(tot - ok, 'para comprar', 'para comprar')} · ${ok} no carrinho` : 'Lista vazia'}</small></div>${avs('sm')}</div>
    <div class="f"><div class="bar"><i style="width:${pct}%"></i></div><span class="pct num">${pct}%</span></div></a>`;
}

/* ---------- escolher lista para o passeio ---------- */
function telaEscolher() {
  if (S.estado.listas.length === 1) { location.replace(`#/passeio/${S.estado.listas[0].id}/0`); return null; }
  return `<div class="ph a"><div class="tt"><h1>Passeio pelo mercado</h1><small>Escolha a lista que você quer montar</small></div></div>
    <div class="listas">${S.estado.listas.map((l, k) => cardLista(l, k + 1).replace(`href="#/lista/${l.id}"`, `href="#/passeio/${l.id}/0"`)).join('')}
    <button class="lnew a" data-a="novaLista"><i class="ti ti-plus"></i>Criar nova lista</button></div>`;
}

/* ---------- lista ---------- */
function grupos(itens) {
  const ordem = [...CORREDORES, OUTROS];
  return ordem.map(c => ({ c, itens: itens.filter(i => i.corredor === c.id).sort((a, b) => a.comprado - b.comprado || a.quando - b.quando) })).filter(g => g.itens.length);
}
function linhaItem(l, i, modo) {
  const quem = i.comprado && i.por ? ` · ${esc(i.por)} pegou` : '';
  const preco = modo === 'compra' && i.comprado ? `<button class="price ${i.preco ? '' : 'add'}" data-a="preco" data-id="${i.id}">${i.preco ? money(i.preco) : '+ R$'}</button>` : '';
  return `<div class="item ${i.comprado ? 'ok' : ''} ${ultimoToque === i.id ? 'just' : ''}">
    <button class="cb" data-a="toggle" data-l="${l.id}" data-id="${i.id}" aria-label="${i.comprado ? 'Desmarcar' : 'Marcar'} ${esc(i.nome)}">${CHECK}</button>
    <span class="em">${i.emoji}</span>
    <button class="nm" style="text-align:left" data-a="editItem" data-l="${l.id}" data-id="${i.id}"><b>${esc(i.nome)}</b><small>${esc(i.qtd)}${quem}</small></button>${preco}</div>`;
}
function telaLista(id) {
  const l = S.lista(id); if (!l) { location.replace('#/inicio'); return null; }
  const pend = l.itens.filter(i => !i.comprado).length;
  const gs = grupos(l.itens);
  return `<div class="ph a"><a class="icon-btn" href="#/inicio" aria-label="Voltar"><i class="ti ti-chevron-left"></i></a>
    <div class="tt"><h1>${esc(l.nome)}</h1><small>${plural(pend, 'item para comprar', 'itens para comprar')} · ${esc(S.estado.familia.nome)}</small></div>
    ${avs('sm')}<button class="icon-btn" data-a="editLista" data-l="${l.id}" aria-label="Opções da lista"><i class="ti ti-dots"></i></button></div>
  <div class="acts2 a" style="--d:1"><button class="btn btn-gold" data-a="go" data-h="#/passeio/${l.id}/0"><i class="ti ti-route"></i>Passeio</button>
    <button class="btn btn-line" data-a="go" data-h="#/compra/${l.id}"><i class="ti ti-shopping-cart"></i>Ir às compras</button></div>
  ${caixaAdicionar('addForm', 'Ex.: 2 kg de arroz, feijão e café', l.id)}
  <p class="hint a" style="--d:2">Escreva vários itens separados por vírgula ou toque no microfone e fale.</p>
  ${gs.length ? gs.map((g, k) => `<section class="grp a" style="--d:${k + 3}"><div class="grp-h">${ico(g.c.icone, g.c.cor)}<b>${g.c.nome}</b><span>${g.itens.filter(i => !i.comprado).length}/${g.itens.length}</span></div>
     <div class="items">${g.itens.map(i => linhaItem(l, i, 'lista')).join('')}</div></section>`).join('')
  : `<div class="empty a" style="--d:3">${ico('ti-basket', '#D4A762')}<h3>Lista vazia</h3><p>Faça o passeio pelo mercado ou escreva os itens acima.</p>
     <button class="btn btn-gold" style="margin-top:18px" data-a="go" data-h="#/passeio/${l.id}/0"><i class="ti ti-route"></i>Começar passeio</button></div>`}`;
}
const caixaAdicionar = (fid, ph, lid, cid = '') => `<form class="addbox a" style="--d:2" id="${fid}" data-l="${lid}" data-c="${cid}" autocomplete="off">
  <i class="ti ti-plus lead"></i><input name="t" placeholder="${esc(ph)}" enterkeyhint="done" aria-label="Adicionar itens">
  <button type="button" class="mic" data-a="mic" aria-label="Falar os itens"><i class="ti ti-microphone"></i></button>
  <button class="go" aria-label="Adicionar"><i class="ti ti-arrow-up"></i></button></form>`;

/* ---------- passeio pelo mercado ---------- */
function telaPasseio(id, n) {
  const l = S.lista(id); if (!l) { location.replace('#/inicio'); return null; }
  if (n >= CORREDORES.length) return resumoPasseio(l);
  const c = CORREDORES[n];
  const naLista = l.itens.filter(i => i.corredor === c.id && !i.comprado);
  const sel = new Map(naLista.map(i => [norm(i.nome), i]));
  const hist = Object.values(S.estado.historico).filter(h => h.corredor === c.id).sort((a, b) => b.n - a.n).slice(0, 8);
  const vistos = new Set(hist.map(h => norm(h.nome)));
  const extras = naLista.filter(i => !vistos.has(norm(i.nome)) && !(ITENS[c.id] || []).some(x => norm(x[1]) === norm(i.nome)));
  extras.forEach(i => vistos.add(norm(i.nome)));
  const sempre = [...extras.map(i => [i.emoji, i.nome, i.qtd]), ...hist.map(h => [h.emoji, h.nome, h.qtd])];
  const todos = (ITENS[c.id] || []).filter(x => !vistos.has(norm(x[1])));
  let d = 0;
  const chip = ([e, nome, qtd]) => { const it = sel.get(norm(nome)); d++;
    return `<div role="button" tabindex="0" aria-pressed="${!!it}" class="wchip ${it ? 'sel' : ''}" style="--d:${d}" data-a="wtoggle" data-l="${l.id}" data-c="${c.id}" data-n="${esc(nome)}" data-e="${e}" data-q="${esc(qtd)}">
      <span class="ck"><i class="ti ti-check"></i></span><span class="e">${e}</span><b>${esc(nome)}</b>
      ${it ? `<span class="step" data-a="noop"><button data-a="wqtd" data-l="${l.id}" data-id="${it.id}" data-d="-1" aria-label="Menos"><i class="ti ti-minus"></i></button><span>${esc(it.qtd)}</span><button data-a="wqtd" data-l="${l.id}" data-id="${it.id}" data-d="1" aria-label="Mais"><i class="ti ti-plus"></i></button></span>` : `<small>${esc(qtd)}</small>`}</div>`; };
  const prox = CORREDORES[n + 1];
  return `<div class="${rotaAnterior.startsWith('#/passeio/' + id) ? dirPasseio : ''}">
   <div class="walk-top"><a class="icon-btn" href="#/lista/${l.id}" aria-label="Fechar"><i class="ti ti-x"></i></a><div class="tt">Setor ${n + 1} de ${CORREDORES.length} <span class="dim" style="font-weight:500">· ${esc(l.nome)}</span></div>
   <button class="icon-btn" data-a="go" data-h="#/passeio/${l.id}/${n + 1}" aria-label="Pular setor"><i class="ti ti-player-skip-forward"></i></button></div>
   <div class="prog">${CORREDORES.map((x, k) => `<button class="${k < n ? 'd' : k === n ? 'cur' : ''}" data-a="go" data-h="#/passeio/${l.id}/${k}" aria-label="${x.nome}"></button>`).join('')}</div>
   <div class="wcat">${ico(c.icone, c.cor)}<div><h1>${c.nome}</h1><p>${c.dica} · toque no que está faltando</p></div></div>
   ${sempre.length ? `<div class="wsub"><i class="ti ti-star"></i>Seus de sempre</div><div class="wgrid">${sempre.map(chip).join('')}</div>` : ''}
   <div class="wsub"><i class="ti ti-layout-grid"></i>${sempre.length ? 'Mais deste setor' : 'Itens deste setor'}</div><div class="wgrid">${todos.map(chip).join('')}</div>
   <div class="wsub"><i class="ti ti-pencil"></i>Não achou?</div>
   ${caixaAdicionar('wAddForm', `Outro item de ${c.nome.toLowerCase()}`, l.id, c.id)}
   <div style="height:120px"></div></div>
   <div class="wfoot"><div class="in">${n > 0 ? `<button class="wprev" data-a="go" data-h="#/passeio/${l.id}/${n - 1}" aria-label="Setor anterior"><i class="ti ti-arrow-left"></i></button>` : ''}
    <button class="wnext" data-a="go" data-h="#/passeio/${l.id}/${n + 1}"><div><small>${plural(naLista.length, 'item neste setor', 'itens neste setor')}</small><b>${prox ? 'Próximo: ' + prox.nome : 'Ver lista pronta'}</b></div><span class="arr"><i class="ti ti-arrow-right"></i></span></button></div></div>`;
}
function resumoPasseio(l) {
  const pend = l.itens.filter(i => !i.comprado);
  const setores = new Set(pend.map(i => i.corredor)).size;
  return `<div class="done-hero"><div class="big"><i class="ti ti-check"></i></div><h1 class="a">Lista pronta!</h1>
    <p class="muted a" style="--d:1;margin-top:6px">Você passou por todos os setores. Agora é só ir ao mercado.</p></div>
    <div class="resumo-grid">
      <div class="card a" style="--d:2">${ico('ti-shopping-bag', '#D4A762')}<b class="num">${pend.length}</b><small>itens</small></div>
      <div class="card a" style="--d:3">${ico('ti-layout-grid', '#5FA8D3')}<b class="num">${setores}</b><small>setores</small></div>
      <div class="card a" style="--d:4">${ico('ti-users', '#7FB069')}<b class="num">${S.estado.familia.membros.length}</b><small>na família</small></div></div>
    <div style="display:flex;flex-direction:column;gap:10px;max-width:460px;margin:0 auto;--d:5" class="a">
      <button class="btn btn-gold btn-block" data-a="go" data-h="#/compra/${l.id}"><i class="ti ti-shopping-cart"></i>Ir às compras</button>
      <button class="btn btn-line btn-block" data-a="go" data-h="#/lista/${l.id}"><i class="ti ti-list"></i>Ver a lista</button>
      <button class="btn btn-block" data-a="go" data-h="#/passeio/${l.id}/0"><i class="ti ti-refresh"></i>Refazer o passeio</button></div>`;
}

/* ---------- modo compra ---------- */
function telaCompra(id) {
  const l = S.lista(id); if (!l) { location.replace('#/inicio'); return null; }
  const tot = l.itens.length, ok = l.itens.filter(i => i.comprado), pct = tot ? ok.length / tot : 0;
  const total = ok.reduce((s, i) => s + (i.preco || 0), 0);
  const C = 2 * Math.PI * 38, alvo = C * (1 - pct), antes = ringAnterior[id] ?? C;
  ringAnterior[id] = alvo;
  simularFamilia(l);
  return `<div class="ph a"><a class="icon-btn" href="#/lista/${l.id}" aria-label="Voltar"><i class="ti ti-chevron-left"></i></a>
    <div class="tt"><h1>Modo compra</h1><small>${esc(l.nome)}</small></div>${avs('sm')}</div>
  <div class="cart-hero a" style="--d:1"><div style="position:relative;z-index:1"><small>No carrinho</small><div class="tot num" ${rotaAnterior === location.hash ? '' : `data-count="${total}" data-fmt="money"`}>${money(total)}</div>
    <small style="margin-top:4px">${ok.length} de ${plural(tot, 'item', 'itens')}${ok.some(i => !i.preco) ? ' · toque em + R$ para anotar o preço' : ''}</small></div>
    <div class="ring"><svg viewBox="0 0 84 84"><circle class="bgc" cx="42" cy="42" r="38"/><circle class="fg" cx="42" cy="42" r="38" stroke-dasharray="${C}" style="stroke-dashoffset:${antes}" data-off="${alvo}"/></svg><b class="num">${Math.round(pct * 100)}%</b></div></div>
  ${tot ? grupos(l.itens).map((g, k) => `<section class="grp a" style="--d:${k + 2}"><div class="grp-h">${ico(g.c.icone, g.c.cor)}<b>${g.c.nome}</b><span>${g.itens.filter(i => i.comprado).length}/${g.itens.length}</span></div>
    <div class="items">${g.itens.map(i => linhaItem(l, i, 'compra')).join('')}</div></section>`).join('')
  : `<div class="empty">${ico('ti-shopping-cart', '#D4A762')}<h3>Nada para comprar</h3><p>Adicione itens à lista primeiro.</p></div>`}
  <div style="height:120px"></div>
  <div class="wfoot"><div class="in"><button class="wnext" data-a="${ok.length ? 'finalizar' : 'go'}" data-l="${l.id}" data-h="#/lista/${l.id}">
    <div><small>${ok.length ? `${plural(ok.length, 'item', 'itens')} · ${money(total)}` : 'Marque os itens ao colocar no carrinho'}</small><b>${ok.length ? 'Finalizar compra' : 'Voltar para a lista'}</b></div>
    <span class="arr"><i class="ti ti-${ok.length ? 'check' : 'arrow-left'}"></i></span></button></div></div>`;
}
function simularFamilia(l) {
  if (!S.estado.demo || simulado.has(l.id)) return;
  simulado.add(l.id);
  setTimeout(() => {
    const at = S.lista(l.id); if (!at || !location.hash.startsWith('#/compra/' + l.id)) { simulado.delete(l.id); return; }
    const pend = at.itens.filter(i => !i.comprado); if (!pend.length) return;
    const it = pend[Math.floor(Math.random() * pend.length)];
    S.alternarComprado(l.id, it.id, 'Lucas'); ultimoToque = it.id;
    toast(`${av(pessoa('Lucas'), 'sm')}<span><b>Lucas</b> pegou <b>${esc(it.nome)}</b> · ${corredor(it.corredor).nome}</span>`, null);
    render();
  }, 6500);
}

/* ---------- família ---------- */
function telaFamilia() {
  const f = S.estado.familia;
  const ativ = S.estado.listas.flatMap(l => l.itens.map(i => ({ ...i, lista: l.nome }))).sort((a, b) => b.quando - a.quando).slice(0, 6);
  return `<div class="ph a"><div class="tt"><h1>Família</h1><small>${esc(f.nome)} · ${plural(f.membros.length, 'pessoa', 'pessoas')}</small></div></div>
  <div class="dash"><div class="col-l">
  <section class="invite a" style="--d:1"><div class="glow" style="position:absolute;width:220px;height:220px;border-radius:50%;background:var(--grad-gold);opacity:.18;right:-70px;bottom:-120px"></div>
    <div class="h" style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--gold3)">Todo mundo na mesma lista</div>
    <h2 style="font-size:22px;margin-top:6px">Convide quem faz compras com você</h2>
    <p style="color:#C9D1DE;font-size:14px;margin-top:6px">Quem entrar vê as listas e acompanha cada item marcado na hora.</p>
    <div class="code"><span>Código <b style="letter-spacing:.14em">${esc(codigoCasa())}</b></span><button class="btn btn-gold" style="height:40px;padding:0 16px;font-size:13px" data-a="convidar"><i class="ti ti-share"></i>Convidar</button></div></section>
  <div class="sec-h a" style="--d:2"><h2>Membros</h2></div>
  <div class="card a" style="--d:3">${f.membros.map((m, k) => `<div class="mem">${av(m)}<div style="flex:1"><b>${esc(m.nome)}${m.id === S.estado.eu.id ? ' <span class="dim" style="font-weight:500">(você)</span>' : ''}</b><small class="muted">${k === 0 ? 'Organizador(a) da casa' : 'Pode editar as listas'}</small></div><span class="chip-tag"><i class="ti ti-point-filled" style="color:#2E9E6A"></i>${k === 0 ? 'Online' : 'Ativo'}</span></div>`).join('')}</div>
  </div><div class="col-r">
  <div class="sec-h a" style="--d:4"><h2>Atividade recente</h2></div>
  <div class="card compras-rec a" style="--d:5;padding:4px 16px">${ativ.length ? ativ.map(i => { const p = pessoa(i.comprado ? i.por : i.add);
    return `<div class="row">${av(p)}<div style="flex:1;min-width:0"><b style="font-weight:500;font-size:13.5px"><strong>${esc(p.nome)}</strong> ${i.comprado ? 'pegou' : 'adicionou'} ${esc(i.nome)}</b><small class="muted">${esc(i.lista)} · ${tempo(i.quando)}</small></div><span style="font-size:20px">${i.emoji}</span></div>`; }).join('')
    : '<div class="empty" style="padding:24px 10px"><p>As novidades da família aparecem aqui.</p></div>'}</div>
  </div></div>`;
}

/* ---------- perfil ---------- */
function telaPerfil() {
  const e = S.estado, t = e.tema || 'auto';
  return `<div class="ph a"><div class="tt"><h1>Perfil</h1><small>Preferências do app</small></div></div>
  <div style="max-width:720px">
  <div class="card a" style="--d:1;padding:20px;display:flex;align-items:center;gap:16px"><span class="av" style="width:60px;height:60px;font-size:22px;border:0;background:${e.eu.cor}">${esc(e.eu.nome[0].toUpperCase())}</span>
    <div style="flex:1;min-width:0"><div class="h" style="font-size:20px">${esc(e.eu.nome)}</div><small class="muted">${esc(e.familia.nome)} · ${plural(e.familia.membros.length, 'pessoa', 'pessoas')}</small></div>
    <button class="icon-btn" data-a="nome" aria-label="Editar nome"><i class="ti ti-pencil"></i></button></div>
  <div class="sec-h a" style="--d:2"><h2>Aparência</h2></div>
  <div class="seg a" style="--d:3">${[['auto', 'ti-device-mobile', 'Automático'], ['claro', 'ti-sun', 'Claro'], ['escuro', 'ti-moon', 'Escuro']].map(([k, i, n]) => `<button class="${t === k ? 'on' : ''}" data-a="tema" data-t="${k}"><i class="ti ${i}"></i>${n}</button>`).join('')}</div>
  <div class="sec-h a" style="--d:4"><h2>App</h2></div>
  <div class="card a" style="--d:5">
    <button class="opt" data-a="instalar">${ico('ti-device-mobile-down', '#D4A762')}<div><b>Instalar no celular</b><small>Abra o Mercato como um app, direto da tela de início</small></div><i class="ti ti-chevron-right"></i></button>
    ${e.modo === 'nuvem' ? `
    <div class="opt">${ico('ti-cloud-check', '#7FB069')}<div><b>Sua conta</b><small>${esc(sessao?.user?.email || '')} · listas salvas na nuvem</small></div></div>
    <button class="opt" data-a="logout">${ico('ti-logout', '#E5484D')}<div><b>Sair da conta</b><small>Você pode entrar de novo quando quiser</small></div><i class="ti ti-chevron-right"></i></button>`
    : e.demo ? `
    <button class="opt" data-a="demo">${ico('ti-sparkles', '#5FA8D3')}<div><b>Recarregar demonstração</b><small>Volta a família de exemplo ao início</small></div><i class="ti ti-chevron-right"></i></button>
    <button class="opt" data-a="zerarOk">${ico('ti-logout', '#E5484D')}<div><b>Sair da demonstração</b><small>${N.ativo ? 'Crie sua conta e use com a sua família' : 'Volta para a tela inicial'}</small></div><i class="ti ti-chevron-right"></i></button>`
    : `
    <button class="opt" data-a="demo">${ico('ti-sparkles', '#5FA8D3')}<div><b>Ver demonstração</b><small>Listas e família de exemplo para explorar o app</small></div><i class="ti ti-chevron-right"></i></button>
    <button class="opt" data-a="zerar">${ico('ti-trash', '#E5484D')}<div><b>Começar do zero</b><small>Apaga as listas salvas neste aparelho</small></div><i class="ti ti-chevron-right"></i></button>`}
  </div>
  <div class="a" style="--d:6;display:flex;flex-direction:column;align-items:center;gap:8px;margin:36px 0 10px;opacity:.75">${LOGO(34)}<span class="wm" style="font-size:20px">mercato</span><small class="dim">Versão 1.0 · Leão Design</small></div>
  </div>`;
}

/* ---------- folhas (sheets) ---------- */
function abrir(html, foco) {
  sheetRoot.innerHTML = `<div class="sheet-bg" data-a="fechar"></div><div class="sheet" role="dialog" aria-modal="true"><div class="grabber"></div>${html}</div>`;
  if (foco) setTimeout(() => sheetRoot.querySelector(foco)?.focus(), 350);
}
function fechar() {
  const s = sheetRoot.querySelector('.sheet'), b = sheetRoot.querySelector('.sheet-bg'); if (!s) return;
  s.classList.add('out'); b.classList.add('out'); setTimeout(() => (sheetRoot.innerHTML = ''), 280);
}
const ICONES_LISTA = ['ti-shopping-cart', 'ti-flame', 'ti-pill', 'ti-bread', 'ti-home', 'ti-gift', 'ti-glass-full', 'ti-baby-carriage', 'ti-paw', 'ti-tools-kitchen-2', 'ti-confetti', 'ti-plant-2'];
function sheetLista(l) {
  abrir(`<h2>${l ? 'Editar lista' : 'Nova lista'}</h2><p class="sub">${l ? 'Mude o nome ou o ícone.' : 'Uma lista para cada ocasião: mês, churrasco, farmácia…'}</p>
    <form id="fLista" data-l="${l?.id || ''}"><label class="field"><span>Nome</span><input name="nome" required maxlength="40" value="${esc(l?.nome || '')}" placeholder="Churrasco de sábado"></label>
    <div class="field"><span>Ícone</span><div class="icons-pick">${ICONES_LISTA.map((i, k) => `<button type="button" class="${(l?.icone || ICONES_LISTA[0]) === i ? 'on' : ''}" data-a="pickIcon" data-i="${i}" aria-label="Ícone ${k + 1}"><i class="ti ${i}"></i></button>`).join('')}</div><input type="hidden" name="icone" value="${l?.icone || ICONES_LISTA[0]}"></div>
    <div class="btns"><button class="btn btn-gold btn-block">${l ? 'Salvar' : 'Criar lista'}</button>${l ? `<button type="button" class="btn btn-danger btn-block" data-a="delLista" data-l="${l.id}"><i class="ti ti-trash"></i>Excluir lista</button>` : ''}</div></form>`, l ? null : 'input[name=nome]');
}
function sheetItem(l, i) {
  abrir(`<h2>${i.emoji} ${esc(i.nome)}</h2><p class="sub">Adicionado por ${esc(i.add)} · ${tempo(i.quando)}</p>
    <form id="fItem" data-l="${l.id}" data-id="${i.id}"><label class="field"><span>Nome</span><input name="nome" required value="${esc(i.nome)}"></label>
    <label class="field"><span>Quantidade</span><input name="qtd" value="${esc(i.qtd)}" placeholder="1 kg"></label>
    <label class="field"><span>Setor do mercado</span><select name="corredor">${[...CORREDORES, OUTROS].map(c => `<option value="${c.id}" ${c.id === i.corredor ? 'selected' : ''}>${c.nome}</option>`).join('')}</select></label>
    <div class="btns"><button class="btn btn-gold btn-block">Salvar</button><button type="button" class="btn btn-danger btn-block" data-a="delItem" data-l="${l.id}" data-id="${i.id}"><i class="ti ti-trash"></i>Remover da lista</button></div></form>`);
}
function sheetRapido() {
  const ls = S.estado.listas;
  abrir(`<h2>Adicionar itens</h2><p class="sub">Escreva ou fale. O Mercato separa cada item no setor certo.</p>
    <form id="fRapido" autocomplete="off"><label class="field"><span>Itens</span><input name="t" required placeholder="Leite, 2 kg de arroz e café"></label>
    <label class="field"><span>Na lista</span><select name="l">${ls.map(l => `<option value="${l.id}">${esc(l.nome)}</option>`).join('')}</select></label>
    <div class="btns"><button class="btn btn-gold btn-block"><i class="ti ti-plus"></i>Adicionar</button></div></form>`, 'input[name=t]');
}

/* ---------- toast ---------- */
function toast(html, icone = 'ti-circle-check') {
  const el = document.createElement('div'); el.className = 'toast';
  el.innerHTML = `${icone ? `<i class="ti ${icone}"></i>` : ''}<span>${html}</span>`;
  toasts.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 350); }, 3200);
}

/* ---------- tema ---------- */
function aplicarTema() {
  const t = S.estado?.tema || 'auto', r = document.documentElement;
  if (t === 'auto') delete r.dataset.tema; else r.dataset.tema = t;
  const escuro = t === 'escuro' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelector('meta[name=theme-color]').content = !S.estado ? '#0F172A' : escuro ? '#0F172A' : '#F6F4EF';
}
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', aplicarTema);

/* ---------- voz ---------- */
let rec = null;
function ditar(form) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const btn = form.querySelector('.mic'), input = form.querySelector('input[name=t]');
  if (!SR) { toast('Ditado indisponível aqui. Use o microfone do teclado do celular.', 'ti-microphone-off'); input.focus(); return; }
  if (rec) { rec.stop(); return; }
  rec = new SR(); rec.lang = 'pt-BR'; rec.interimResults = true; rec.continuous = false;
  btn.classList.add('rec'); input.placeholder = 'Ouvindo… fale os itens';
  rec.onresult = e => { input.value = [...e.results].map(r => r[0].transcript).join(' '); };
  rec.onerror = () => toast('Não consegui ouvir. Tente de novo.', 'ti-microphone-off');
  rec.onend = () => { btn.classList.remove('rec'); rec = null; if (input.value.trim()) form.requestSubmit(); };
  rec.start();
}

/* ---------- ações ---------- */
function adicionarTexto(lid, texto, cid) {
  let itens = lerEntrada(texto);
  if (cid) itens = itens.map(i => ({ ...i, corredor: i.corredor === 'outros' || i.corredor !== cid ? cid : i.corredor }));
  if (!itens.length) return;
  const novos = S.adicionarItens(lid, itens);
  const nomes = itens.map(i => i.nome);
  toast(itens.length === 1 ? `<b>${esc(nomes[0])}</b> em ${corredor(itens[0].corredor).nome}` : `<b>${itens.length} itens</b> separados por setor`, 'ti-sparkles');
  if (novos[0]) ultimoToque = novos[0].id;
}

document.addEventListener('submit', e => {
  const f = e.target; e.preventDefault();
  if (FORMS_CONTA[f.id]) { enviarConta(f, FORMS_CONTA[f.id]); return; }
  const fd = Object.fromEntries(new FormData(f));
  if (f.id === 'addForm' || f.id === 'wAddForm') {
    if (!fd.t.trim()) return;
    adicionarTexto(f.dataset.l, fd.t, f.dataset.c); render();
    const inp = document.querySelector(`#${f.id} input[name=t]`); inp?.focus();
  } else if (f.id === 'fRapido') {
    adicionarTexto(fd.l, fd.t); fechar(); render();
  } else if (f.id === 'fLista') {
    if (f.dataset.l) { S.editarLista(f.dataset.l, { nome: fd.nome.trim(), icone: fd.icone }); fechar(); render(); }
    else { const l = S.criarLista(fd.nome.trim(), fd.icone); fechar(); toast(`Lista <b>${esc(l.nome)}</b> criada`); go(`#/passeio/${l.id}/0`); }
  } else if (f.id === 'fItem') {
    const c = fd.corredor; S.editarItem(f.dataset.l, f.dataset.id, { nome: fd.nome.trim(), qtd: fd.qtd.trim(), corredor: c, emoji: classificar(fd.nome).corredor === c ? classificar(fd.nome).emoji : S.lista(f.dataset.l).itens.find(i => i.id === f.dataset.id).emoji });
    fechar(); render();
  } else if (f.id === 'fPreco') {
    const v = parseFloat(String(fd.v).replace(/\./g, '').replace(',', '.'));
    S.editarItem(f.dataset.l, f.dataset.id, { preco: isNaN(v) ? null : v }); fechar(); render();
  } else if (f.id === 'fNome') {
    const nome = fd.nome.trim(); if (!nome) return;
    if (!S.estado) { S.novoEstado(nome); fechar(); location.hash = '#/inicio'; render(); toast(`Bem-vindo(a), <b>${esc(nome)}</b>!`, 'ti-confetti'); return; }
    S.renomear(nome); fechar(); render();
  }
});

document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  const a = el.dataset.a, d = el.dataset;
  const l = d.l ? S.lista(d.l) : null;
  switch (a) {
    case 'go': {
      const m = d.h.match(/^#\/passeio\/[^/]+\/(\d+)/), m0 = location.hash.match(/^#\/passeio\/[^/]+\/(\d+)/);
      if (m && m0) dirPasseio = +m[1] >= +m0[1] ? 'slide-l' : 'slide-r';
      go(d.h); break;
    }
    case 'noop': break;
    case 'cadastro': sheetCadastro(); break;
    case 'login': sheetLogin(); break;
    case 'esqueci': sheetEsqueci(d.email); break;
    case 'logout': fechar(); sairConta(); break;
    case 'fechar': fechar(); break;
    case 'comecar': abrir(`<h2>Como podemos te chamar?</h2><p class="sub">Seu nome aparece para a família quando você adiciona ou pega um item.</p>
      <form id="fNome"><label class="field"><span>Seu nome</span><input name="nome" required maxlength="24" placeholder="Ana" autocomplete="given-name"></label><div class="btns"><button class="btn btn-gold btn-block">Continuar</button></div></form>`, 'input[name=nome]'); break;
    case 'nome': abrir(`<h2>Seu nome</h2><form id="fNome"><label class="field"><span>Nome</span><input name="nome" required maxlength="24" value="${esc(S.estado.eu.nome)}"></label><div class="btns"><button class="btn btn-gold btn-block">Salvar</button></div></form>`, 'input[name=nome]'); break;
    case 'demo': S.carregarDemo(); simulado.clear(); fechar(); location.hash = '#/inicio'; rotaAnterior = ''; render(); toast('Demonstração carregada', 'ti-sparkles'); break;
    case 'zerar': abrir(`<h2>Começar do zero?</h2><p class="sub">Todas as listas e compras salvas neste aparelho serão apagadas. Não dá para desfazer.</p>
      <div class="btns"><button class="btn btn-danger btn-block" data-a="zerarOk"><i class="ti ti-trash"></i>Apagar e recomeçar</button><button class="btn btn-soft btn-block" data-a="fechar">Cancelar</button></div>`); break;
    case 'zerarOk': fechar(); S.sair(); location.hash = ''; render(); break;
    case 'tema': S.estado.tema = d.t; S.salvar(); render(); break;
    case 'rapido': sheetRapido(); break;
    case 'novaLista': sheetLista(); break;
    case 'editLista': sheetLista(l); break;
    case 'pickIcon': el.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === el)); el.closest('form').icone.value = d.i; break;
    case 'delLista': abrir(`<h2>Excluir “${esc(l.nome)}”?</h2><p class="sub">${plural(l.itens.length, 'item será apagado', 'itens serão apagados')} junto com a lista.</p>
      <div class="btns"><button class="btn btn-danger btn-block" data-a="delListaOk" data-l="${l.id}">Excluir lista</button><button class="btn btn-soft btn-block" data-a="fechar">Cancelar</button></div>`); break;
    case 'delListaOk': { const nome = l.nome; S.excluirLista(l.id); fechar(); toast(`Lista <b>${esc(nome)}</b> excluída`, 'ti-trash'); go('#/inicio'); break; }
    case 'toggle': { const i = S.alternarComprado(d.l, d.id); ultimoToque = i.id; if (i.comprado && navigator.vibrate) navigator.vibrate(12); render(); break; }
    case 'editItem': sheetItem(l, l.itens.find(i => i.id === d.id)); break;
    case 'delItem': { const it = l.itens.find(i => i.id === d.id); S.removerItem(d.l, d.id); fechar(); render(); toast(`<b>${esc(it.nome)}</b> removido`, 'ti-trash'); break; }
    case 'preco': { const lid = rota().a, it = S.lista(lid).itens.find(i => i.id === d.id);
      abrir(`<h2>${it.emoji} ${esc(it.nome)}</h2><p class="sub">Quanto custou? O total do carrinho atualiza na hora.</p>
      <form id="fPreco" data-l="${lid}" data-id="${it.id}"><label class="field"><span>Preço (R$)</span><input name="v" inputmode="decimal" placeholder="0,00" value="${it.preco ? String(it.preco.toFixed(2)).replace('.', ',') : ''}"></label>
      <div class="btns"><button class="btn btn-gold btn-block">Salvar preço</button></div></form>`, 'input[name=v]'); break; }
    case 'finalizar': { const ok = l.itens.filter(i => i.comprado), tot = ok.reduce((s, i) => s + (i.preco || 0), 0);
      abrir(`<h2>Finalizar compra?</h2><p class="sub">${plural(ok.length, 'item comprado sai', 'itens comprados saem')} da lista e a compra de <b>${money(tot)}</b> entra no seu histórico.</p>
      <div class="btns"><button class="btn btn-gold btn-block" data-a="finalizarOk" data-l="${l.id}"><i class="ti ti-check"></i>Finalizar</button><button class="btn btn-soft btn-block" data-a="fechar">Continuar comprando</button></div>`); break; }
    case 'finalizarOk': { const r = S.finalizarCompra(d.l); fechar(); toast(`Compra salva: <b>${money(r.total)}</b>`, 'ti-confetti'); go('#/inicio'); break; }
    case 'wtoggle': {
      const lista = S.lista(d.l), atual = S.acharItem(lista, d.n);
      if (atual) S.removerItem(d.l, atual.id);
      else { const [novo] = S.adicionarItens(d.l, [{ nome: d.n, qtd: d.q, corredor: d.c, emoji: d.e }]); if (navigator.vibrate) navigator.vibrate(10); }
      render(); break;
    }
    case 'wqtd': { e.stopPropagation(); const it = S.lista(d.l).itens.find(i => i.id === d.id); S.editarItem(d.l, d.id, { qtd: passoQtd(it.qtd, +d.d) }); render(); break; }
    case 'mic': ditar(el.closest('form')); break;
    case 'convidar': {
      const url = linkConvite();
      if (navigator.share) navigator.share({ title: 'Mercato', text: `Entre na lista de compras “${S.estado.familia.nome}” no Mercato. Código: ${codigoCasa()}`, url }).catch(() => {});
      else navigator.clipboard?.writeText(url).then(() => toast('Link do convite copiado', 'ti-copy'), () => toast('Copie o link acima para convidar', 'ti-link'));
      break;
    }
    case 'instalar': abrir(`<h2>Instale o Mercato</h2><p class="sub">Fica na tela de início como um app e abre em tela cheia.</p>
      <div class="card" style="padding:4px 0;margin-bottom:12px">
        <div class="opt">${ico('ti-brand-apple', '#D4A762')}<div><b>iPhone (Safari)</b><small>Toque em <i class="ti ti-share"></i> Compartilhar e depois em “Adicionar à Tela de Início”.</small></div></div>
        <div class="opt">${ico('ti-device-desktop', '#5FA8D3')}<div><b>Mac (Safari)</b><small>Menu Arquivo → “Adicionar ao Dock”.</small></div></div>
        <div class="opt">${ico('ti-brand-android', '#7FB069')}<div><b>Android (Chrome)</b><small>Menu ⋮ → “Instalar app”.</small></div></div></div>
      <div class="btns"><button class="btn btn-gold btn-block" data-a="fechar">Entendi</button></div>`); break;
  }
});
addEventListener('keydown', e => {
  if (e.key === 'Escape') fechar();
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role=button]')) { e.preventDefault(); e.target.click(); }
});

/* =====================================================================
   CONTA E NUVEM
   ===================================================================== */
let sessao = null, semCasa = false, conviteNome = null, renderPendente = false;
const nomeUsuario = () => sessao?.user?.user_metadata?.nome || S.estado?.eu?.nome || (sessao?.user?.email || 'você').split('@')[0];
const corNova = () => S.CORES_PESSOA[Math.floor(Math.random() * S.CORES_PESSOA.length)];
const codigoCasa = () => S.estado?.familia?.codigo || 'DEMO26';
const linkConvite = () => `${location.origin}${location.pathname}#/convite/${codigoCasa()}`;
function guardarConvite(c) { try { localStorage.setItem('mercato:convite', c.toUpperCase()); } catch (e) {} }
function pegarConvite() { try { return localStorage.getItem('mercato:convite'); } catch (e) { return null; } }
function limparConvite() { try { localStorage.removeItem('mercato:convite'); } catch (e) {} }
async function aoReceberConvite(c) {
  if (!N.ativo) return;
  conviteNome = await N.infoConvite(c);
  if (sessao && !semCasa && S.estado?.modo === 'nuvem') { await carregarCasa(); } else render();
}

function chipSync() {
  if (S.estado?.modo !== 'nuvem') return '';
  const st = N.status(), n = N.pendentes();
  const [i, t] = st === 'ok' ? ['ti-cloud-check', 'Sincronizado'] : st === 'enviando' ? ['ti-refresh', 'Salvando…'] : ['ti-cloud-off', n ? `Offline · ${n} para enviar` : 'Offline'];
  return `<span class="chip-tag sync ${st}" id="sync" title="${t}"><i class="ti ${i}"></i><span class="hide-m">${t}</span></span>`;
}
function atualizarChip() { const el = document.getElementById('sync'); if (el) el.outerHTML = chipSync(); }

function renderSeguro() {
  const a = document.activeElement;
  if (a && app.contains(a) && a.matches('input,textarea') && a.value) { renderPendente = true; return; }
  render();
}
document.addEventListener('focusout', () => { if (renderPendente) { renderPendente = false; setTimeout(render, 60); } });

async function carregarCasa() {
  const uid = sessao.user.id;
  if (S.estado && (S.estado.modo !== 'nuvem' || S.estado.eu?.id !== uid)) S.sair(); // limpa demonstração ou outra conta
  try {
    const conv = pegarConvite();
    if (conv) {
      try { await N.entrarFamilia(conv, nomeUsuario(), corNova()); toast(`Você entrou em <b>${esc(conviteNome || 'uma nova casa')}</b>`, 'ti-confetti'); }
      catch (e) { toast(N.traduzir(e), 'ti-alert-circle'); }
      limparConvite();
    }
    const fid = await N.minhaFamilia(uid);
    if (!fid) { semCasa = true; render(); return; }
    semCasa = false;
    await N.enviar();
    S.substituir(await N.puxar(fid, uid));
    if (!/^#\/(inicio|lista|passeio|compra|familia|perfil)/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search + '#/inicio');
    rotaAnterior = ''; render();
    N.conectar(fid, uid, (novo, ev) => {
      S.substituir(novo);
      const n = ev?.new, eu = S.estado.eu.nome;
      if (ev?.table === 'itens' && n) {
        if (ev.eventType === 'UPDATE' && n.comprado && n.por && n.por !== eu) toast(`${av(pessoa(n.por), 'sm')}<span><b>${esc(n.por)}</b> pegou <b>${esc(n.nome)}</b></span>`, null);
        else if (ev.eventType === 'INSERT' && n.add && n.add !== eu) toast(`${av(pessoa(n.add), 'sm')}<span><b>${esc(n.add)}</b> adicionou <b>${esc(n.nome)}</b></span>`, null);
      }
      renderSeguro();
    });
  } catch (e) {
    console.warn(e);
    if (S.estado?.modo === 'nuvem') render(); // sem internet: segue com o que está salvo no aparelho
    else toast(N.traduzir(e), 'ti-cloud-off');
  }
}

async function sairConta() {
  try { await N.sair(); } catch (e) {}
  sessao = null; semCasa = false; S.sair(); history.replaceState(null, '', location.pathname); render();
  toast('Você saiu da conta', 'ti-logout');
}

/* ---------- folhas de conta ---------- */
const erroBox = '<p class="erro" role="alert" hidden></p>';
function sheetCadastro() {
  abrir(`<h2>Criar conta</h2><p class="sub">Grátis. Suas listas ficam salvas na nuvem e sincronizadas com a família.</p>
    <form id="fCadastro"><label class="field"><span>Seu nome</span><input name="nome" required maxlength="24" autocomplete="given-name" placeholder="Ana"></label>
    <label class="field"><span>E-mail</span><input name="email" type="email" required autocomplete="email" inputmode="email" placeholder="voce@email.com"></label>
    <label class="field"><span>Senha</span><input name="senha" type="password" required minlength="6" autocomplete="new-password" placeholder="Mínimo de 6 caracteres"></label>
    ${erroBox}<div class="btns"><button class="btn btn-gold btn-block">Criar conta</button><button type="button" class="btn btn-soft btn-block" data-a="login">Já tenho conta</button></div></form>`, 'input[name=nome]');
}
function sheetLogin() {
  abrir(`<h2>Entrar</h2><p class="sub">Use o e-mail e a senha da sua conta Mercato.</p>
    <form id="fLogin"><label class="field"><span>E-mail</span><input name="email" type="email" required autocomplete="email" inputmode="email" placeholder="voce@email.com"></label>
    <label class="field"><span>Senha</span><input name="senha" type="password" required autocomplete="current-password"></label>
    ${erroBox}<div class="btns"><button class="btn btn-gold btn-block">Entrar</button><button type="button" class="btn btn-block" data-a="esqueci">Esqueci minha senha</button></div></form>`, 'input[name=email]');
}
function sheetEsqueci(email = '') {
  abrir(`<h2>Recuperar senha</h2><p class="sub">Enviamos um link para você criar uma senha nova.</p>
    <form id="fEsqueci"><label class="field"><span>E-mail</span><input name="email" type="email" required autocomplete="email" value="${esc(email)}"></label>
    ${erroBox}<div class="btns"><button class="btn btn-gold btn-block">Enviar link</button></div></form>`, 'input[name=email]');
}
function sheetNovaSenha() {
  abrir(`<h2>Nova senha</h2><p class="sub">Escolha uma senha nova para a sua conta.</p>
    <form id="fNovaSenha"><label class="field"><span>Nova senha</span><input name="senha" type="password" required minlength="6" autocomplete="new-password"></label>
    ${erroBox}<div class="btns"><button class="btn btn-gold btn-block">Salvar senha</button></div></form>`, 'input[name=senha]');
}
function aviso(titulo, texto, icone = 'ti-mail') {
  abrir(`<div style="text-align:center;padding:10px 0 4px">${ico(icone, '#D4A762').replace('class="ico"', 'class="ico" style="margin:0 auto 14px;width:64px;height:64px;font-size:30px;border-radius:22px;--c:#D4A762"')}
    <h2>${titulo}</h2><p class="sub" style="margin-top:6px">${texto}</p></div><div class="btns"><button class="btn btn-gold btn-block" data-a="fechar">Entendi</button></div>`);
}

const FORMS_CONTA = {
  fCadastro: async fd => {
    const r = await N.cadastrar(fd.email.trim(), fd.senha, fd.nome.trim());
    if (r.session) { sessao = r.session; fechar(); await carregarCasa(); }
    else aviso('Confirme seu e-mail', `Enviamos um link para <b>${esc(fd.email.trim())}</b>. Abra o e-mail, toque no link e depois entre com sua senha.`);
  },
  fLogin: async fd => { sessao = await N.entrar(fd.email.trim(), fd.senha); fechar(); await carregarCasa(); },
  fEsqueci: async fd => { await N.recuperar(fd.email.trim()); aviso('Confira seu e-mail', `Se existir uma conta para <b>${esc(fd.email.trim())}</b>, o link para criar uma senha nova já está a caminho.`); },
  fNovaSenha: async fd => { await N.novaSenha(fd.senha); fechar(); toast('Senha alterada', 'ti-lock-check'); },
  fCasa: async fd => { await N.criarFamilia(fd.nome.trim(), nomeUsuario(), S.CORES_PESSOA[0]); await carregarCasa(); toast(`Casa <b>${esc(fd.nome.trim())}</b> criada`, 'ti-confetti'); },
  fCodigo: async fd => { const c = fd.c.trim().toUpperCase(); conviteNome = await N.infoConvite(c); await N.entrarFamilia(c, nomeUsuario(), corNova()); await carregarCasa(); toast(`Você entrou em <b>${esc(conviteNome || 'uma casa')}</b>`, 'ti-confetti'); },
};
async function enviarConta(f, fn) {
  const btn = f.querySelector('button:not([type=button])'), erro = f.querySelector('.erro'), txt = btn.innerHTML;
  btn.disabled = true; btn.innerHTML = '<span class="spin"></span>Aguarde…'; if (erro) erro.hidden = true;
  try { await fn(Object.fromEntries(new FormData(f))); }
  catch (e) {
    const msg = N.traduzir(e);
    if (erro) { erro.textContent = msg; erro.hidden = false; } else toast(msg, 'ti-alert-circle');
    if (f.id === 'fLogin' && /incorretos/.test(msg)) { const em = f.email.value; erro.insertAdjacentHTML('beforeend', ` <button type="button" class="lnk" data-a="esqueci" data-email="${esc(em)}">Esqueci minha senha</button>`); }
  } finally { if (document.body.contains(btn)) { btn.disabled = false; btn.innerHTML = txt; } }
}

/* ---------- início ---------- */
async function iniciar() {
  const qs = new URLSearchParams(location.search);
  const demo = qs.has('demo');                       // link de demonstração para o portfólio
  if (demo && !S.estado?.demo) S.carregarDemo();
  if (qs.get('tema') && S.estado) { S.estado.tema = qs.get('tema'); S.salvar(); }
  render();                                          // abre na hora com o que está salvo no aparelho
  if (!N.ativo || demo) return;
  S.usarSink(op => N.enfileirar(op));
  N.aoMudarStatus(atualizarChip);
  N.sb.auth.onAuthStateChange((ev, s) => { if (ev === 'PASSWORD_RECOVERY') { sessao = s; setTimeout(sheetNovaSenha, 300); } });
  const conv = pegarConvite();
  if (conv) N.infoConvite(conv).then(n => { conviteNome = n; if (!sessao) render(); });
  try { sessao = await N.sessao(); } catch (e) {}
  if (sessao) await carregarCasa();
  else if (S.estado?.modo === 'nuvem') { S.sair(); render(); }
}
iniciar();
