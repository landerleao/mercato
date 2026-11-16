/* Mercato — nuvem (Supabase): login, casa da família, fila offline e tempo real */
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

const lib = window.supabase;
export const ativo = !!(SUPABASE_URL && SUPABASE_KEY && lib);
export const sb = ativo ? lib.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;
const base = () => location.origin + location.pathname;

/* ---------- mensagens de erro em português ---------- */
const MSG = [
  [/Invalid login credentials/i, 'E-mail ou senha incorretos.'],
  [/already registered|already been registered/i, 'Este e-mail já tem conta. Toque em “Já tenho conta”.'],
  [/Email not confirmed/i, 'Confirme seu e-mail pelo link que enviamos e tente de novo.'],
  [/Password should be at least|at least 6/i, 'A senha precisa ter pelo menos 6 caracteres.'],
  [/Unable to validate email|invalid format|invalid email/i, 'Confira o e-mail digitado.'],
  [/rate limit|too many/i, 'Muitas tentativas seguidas. Aguarde um minuto.'],
  [/Convite inválido/i, 'Código de convite inválido. Confira com quem te convidou.'],
  [/fetch|network|Load failed/i, 'Sem conexão. Verifique a internet e tente de novo.'],
];
export const traduzir = e => { const m = e?.message || String(e || ''); return (MSG.find(([re]) => re.test(m)) || [, 'Algo deu errado. Tente de novo.'])[1]; };

/* ---------- conta ---------- */
export async function sessao() { const { data } = await sb.auth.getSession(); return data.session; }
export async function cadastrar(email, senha, nome) {
  const { data, error } = await sb.auth.signUp({ email, password: senha, options: { data: { nome }, emailRedirectTo: base() } });
  if (error) throw error;
  if (data.user && !data.user.identities?.length) throw new Error('already registered');
  return data;
}
export async function entrar(email, senha) { const { data, error } = await sb.auth.signInWithPassword({ email, password: senha }); if (error) throw error; return data.session; }
export async function recuperar(email) { const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: base() }); if (error) throw error; }
export async function novaSenha(senha) { const { error } = await sb.auth.updateUser({ password: senha }); if (error) throw error; }
export async function sair() { desconectar(); fila = []; gravar(); try { localStorage.removeItem('mercato:casa'); } catch (e) {} await sb.auth.signOut(); }

/* ---------- casa (família) ---------- */
export async function minhaFamilia(uid) {
  let pref = null; try { pref = localStorage.getItem('mercato:casa'); } catch (e) {}
  const { data, error } = await sb.from('membros').select('familia_id').eq('user_id', uid).order('entrou_em');
  if (error) throw error;
  const ids = data.map(x => x.familia_id);
  return ids.includes(pref) ? pref : ids[0] || null;
}
const lembrar = fid => { try { localStorage.setItem('mercato:casa', fid); } catch (e) {} return fid; };
export async function criarFamilia(nomeCasa, nome, cor) { const { data, error } = await sb.rpc('criar_familia', { p_nome_familia: nomeCasa, p_nome: nome, p_cor: cor }); if (error) throw error; return lembrar(data); }
export async function entrarFamilia(codigo, nome, cor) { const { data, error } = await sb.rpc('entrar_familia', { p_codigo: codigo, p_nome: nome, p_cor: cor }); if (error) throw error; return lembrar(data); }
export async function infoConvite(codigo) { try { const { data } = await sb.rpc('info_convite', { p_codigo: codigo }); return data; } catch (e) { return null; } }

/* ---------- baixar tudo da casa ---------- */
const ms = d => +new Date(d);
export async function puxar(fid, uid) {
  const q = t => sb.from(t).select('*').eq('familia_id', fid);
  const rs = await Promise.all([sb.from('familias').select('*').eq('id', fid).single(), q('membros'), q('listas').order('criada'), q('itens').order('quando'),
    q('compras').order('data', { ascending: false }).limit(80), q('historico')]);
  const erro = rs.find(r => r.error); if (erro) throw erro.error;
  const [f, m, l, i, c, h] = rs.map(r => r.data);
  const membros = m.sort((a, b) => (b.papel === 'dono') - (a.papel === 'dono') || ms(a.entrou_em) - ms(b.entrou_em)).map(x => ({ id: x.user_id, nome: x.nome, cor: x.cor, papel: x.papel }));
  return {
    versao: 1, modo: 'nuvem', demo: false,
    eu: membros.find(x => x.id === uid) || { id: uid, nome: 'Você', cor: '#C9824A' },
    familia: { id: fid, nome: f.nome, codigo: f.codigo, membros },
    listas: l.map(x => ({ id: x.id, nome: x.nome, icone: x.icone, criada: ms(x.criada),
      itens: i.filter(y => y.lista_id === x.id).map(y => ({ id: y.id, nome: y.nome, qtd: y.qtd, corredor: y.corredor, emoji: y.emoji, comprado: y.comprado,
        preco: y.preco == null ? null : +y.preco, por: y.por, add: y.add, quando: ms(y.quando) })) })),
    historico: Object.fromEntries(h.map(x => [x.chave, { nome: x.nome, emoji: x.emoji, corredor: x.corredor, qtd: x.qtd, n: x.n }])),
    compras: c.map(x => ({ id: x.id, data: ms(x.data), lista: x.lista, total: +x.total, qtd: x.qtd })),
  };
}

/* ---------- fila de alterações (funciona offline) ---------- */
const CHAVE_FILA = 'mercato:fila';
let fila = (() => { try { return JSON.parse(localStorage.getItem(CHAVE_FILA)) || []; } catch (e) { return []; } })();
let enviando = false, falhou = false;
const ouvintes = new Set();
export const aoMudarStatus = f => ouvintes.add(f);
export function status() { return !navigator.onLine || falhou ? 'offline' : fila.length ? 'enviando' : 'ok'; }
export const pendentes = () => fila.length;
function gravar() { try { localStorage.setItem(CHAVE_FILA, JSON.stringify(fila)); } catch (e) {} ouvintes.forEach(f => f(status())); }

export function enfileirar(op) { fila.push(op); gravar(); enviar(); }
const deRede = e => /fetch|network|Load failed|timeout|Failed/i.test(e?.message || '');
export async function enviar() {
  if (!ativo || enviando || !fila.length) return;
  enviando = true;
  try {
    while (fila.length) {
      const op = fila[0], t = sb.from(op.tab);
      const r = op.t === 'up' ? await t.upsert(op.row, op.on ? { onConflict: op.on } : undefined)
        : op.t === 'upd' ? await t.update(op.row).match(op.match)
        : op.t === 'delIn' ? await t.delete().in('id', op.ids)
        : await t.delete().match(op.match);
      if (r.error) { if (deRede(r.error)) throw r.error; console.warn('Mercato: alteração recusada pelo servidor', op, r.error); }
      fila.shift(); falhou = false; gravar();
    }
  } catch (e) { falhou = true; gravar(); setTimeout(enviar, 8000); }
  finally { enviando = false; }
}

/* ---------- tempo real ---------- */
let canal = null, timer = null, atual = null;
export function conectar(fid, uid, aoAtualizar) {
  desconectar(); atual = { fid, uid, aoAtualizar };
  canal = sb.channel('casa-' + fid);
  for (const t of ['itens', 'listas', 'compras', 'membros', 'historico']) canal.on('postgres_changes', { event: '*', schema: 'public', table: t, filter: `familia_id=eq.${fid}` }, agendar);
  canal.on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'itens' }, agendar);
  canal.on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'listas' }, agendar);
  canal.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'familias', filter: `id=eq.${fid}` }, agendar);
  canal.subscribe();
}
export function desconectar() { if (canal) sb.removeChannel(canal); canal = null; atual = null; }
function agendar(ev) { clearTimeout(timer); timer = setTimeout(() => atualizarAgora(ev), 450); }
export async function atualizarAgora(ev) {
  if (!atual) return;
  await enviar();
  if (fila.length) return; // ainda há alterações locais para subir: não sobrescreve
  try { const novo = await puxar(atual.fid, atual.uid); atual.aoAtualizar(novo, ev); } catch (e) {}
}
addEventListener('online', () => { falhou = false; gravar(); atualizarAgora(); });
addEventListener('offline', () => gravar());
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') atualizarAgora(); });
