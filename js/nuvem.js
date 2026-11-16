/* Mercato — nuvem (Firebase): login, casa da família, tempo real e offline
   O Firestore guarda as alterações no aparelho quando está sem sinal e envia sozinho quando a internet volta. */
import { FIREBASE } from './config.js';

export const ativo = !!(FIREBASE && FIREBASE.apiKey && FIREBASE.projectId);
const V = '10.12.2', CDN = `https://www.gstatic.com/firebasejs/${V}`;
let A, F, auth, db, pronto = null;

export function carregar() {
  return pronto ||= (async () => {
    const [app, a, f] = await Promise.all([import(`${CDN}/firebase-app.js`), import(`${CDN}/firebase-auth.js`), import(`${CDN}/firebase-firestore.js`)]);
    A = a; F = f;
    const inst = app.initializeApp(FIREBASE);
    auth = a.initializeAuth(inst, { persistence: [a.indexedDBLocalPersistence, a.browserLocalPersistence] });
    auth.languageCode = 'pt';
    try { db = f.initializeFirestore(inst, { localCache: f.persistentLocalCache({ tabManager: f.persistentMultipleTabManager() }) }); }
    catch (e) { db = f.getFirestore(inst); }
  })().catch(e => { pronto = null; throw e; });
}

/* ---------- mensagens de erro em português ---------- */
const MSG = [
  [/invalid-credential|wrong-password|user-not-found|invalid-login/i, 'E-mail ou senha incorretos.'],
  [/email-already-in-use/i, 'Este e-mail já tem conta. Toque em “Já tenho conta”.'],
  [/weak-password/i, 'A senha precisa ter pelo menos 6 caracteres.'],
  [/invalid-email|missing-email/i, 'Confira o e-mail digitado.'],
  [/too-many-requests/i, 'Muitas tentativas seguidas. Aguarde um minuto.'],
  [/Convite inválido/i, 'Código de convite inválido. Confira com quem te convidou.'],
  [/permission-denied|insufficient permissions/i, 'Sem permissão para isso. Entre de novo na sua conta.'],
  [/network|offline|unavailable|fetch|Load failed|Failed to fetch|dynamically imported/i, 'Sem conexão. Verifique a internet e tente de novo.'],
];
export const traduzir = e => { const m = `${e?.code || ''} ${e?.message || e || ''}`; return (MSG.find(([re]) => re.test(m)) || [, 'Algo deu errado. Tente de novo.'])[1]; };

/* ---------- conta ---------- */
const sess = u => u ? { user: { id: u.uid, email: u.email, user_metadata: { nome: u.displayName } } } : null;
export async function sessao() {
  await carregar();
  if (auth.authStateReady) await auth.authStateReady();
  else await new Promise(r => { const off = A.onAuthStateChanged(auth, () => { off(); r(); }); });
  return sess(auth.currentUser);
}
export async function cadastrar(email, senha, nome) {
  await carregar();
  const { user } = await A.createUserWithEmailAndPassword(auth, email, senha);
  await A.updateProfile(user, { displayName: nome });
  return { session: sess(auth.currentUser) };
}
export async function entrar(email, senha) { await carregar(); const { user } = await A.signInWithEmailAndPassword(auth, email, senha); return sess(user); }
export async function recuperar(email) { await carregar(); await A.sendPasswordResetEmail(auth, email); }
export async function novaSenha(senha) { await carregar(); await A.updatePassword(auth.currentUser, senha); }
export async function sair() { desconectar(); try { localStorage.removeItem('mercato:casa'); } catch (e) {} await carregar(); await A.signOut(auth); }

/* ---------- casa (família) ---------- */
const casaDoc = fid => F.doc(db, 'casas', fid);
const sub = (fid, nome) => F.collection(db, 'casas', fid, nome);
const lembrar = fid => { try { localStorage.setItem('mercato:casa', fid); } catch (e) {} return fid; };
async function minhasCasas(uid) { const q = await F.getDocs(F.query(F.collection(db, 'casas'), F.where('membrosIds', 'array-contains', uid))); return q.docs.map(d => d.id); }
export async function minhaFamilia(uid) {
  await carregar();
  let pref = null; try { pref = localStorage.getItem('mercato:casa'); } catch (e) {}
  const ids = await minhasCasas(uid);
  return ids.includes(pref) ? pref : ids[0] || null;
}
const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const novoCodigo = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), b => LETRAS[b % LETRAS.length]).join('');
export async function criarFamilia(nomeCasa, nome, cor) {
  await carregar();
  const uid = auth.currentUser.uid, agora = Date.now();
  let codigo; do { codigo = novoCodigo(); } while ((await F.getDoc(F.doc(db, 'convites', codigo))).exists());
  const casa = F.doc(F.collection(db, 'casas')), lista = F.doc(sub(casa.id, 'listas'));
  const b = F.writeBatch(db);
  b.set(casa, { nome: nomeCasa || 'Nossa casa', codigo, criadaPor: uid, criadaEm: agora, membrosIds: [uid] });
  b.set(F.doc(db, 'convites', codigo), { casaId: casa.id, nome: nomeCasa || 'Nossa casa' });
  b.set(F.doc(db, 'casas', casa.id, 'membros', uid), { nome, cor, papel: 'dono', entrouEm: agora });
  b.set(lista, { nome: 'Compra do mês', icone: 'ti-shopping-cart', criada: agora });
  await b.commit();
  return lembrar(casa.id);
}
export async function entrarFamilia(codigo, nome, cor) {
  await carregar();
  const uid = auth.currentUser.uid;
  const c = await F.getDoc(F.doc(db, 'convites', (codigo || '').trim().toUpperCase()));
  if (!c.exists()) throw new Error('Convite inválido');
  const fid = c.data().casaId;
  if ((await minhasCasas(uid)).includes(fid)) return lembrar(fid);
  const b = F.writeBatch(db);
  b.update(casaDoc(fid), { membrosIds: F.arrayUnion(uid) });
  b.set(F.doc(db, 'casas', fid, 'membros', uid), { nome, cor, papel: 'membro', entrouEm: Date.now() });
  await b.commit();
  return lembrar(fid);
}
export async function infoConvite(codigo) {
  try { await carregar(); const c = await F.getDoc(F.doc(db, 'convites', (codigo || '').trim().toUpperCase())); return c.exists() ? c.data().nome : null; }
  catch (e) { return null; }
}

/* ---------- montar o estado do app a partir dos documentos ---------- */
function montar(fid, uid, casa, membros, listas, itens, compras, historico) {
  const ms = membros.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.papel === 'dono') - (a.papel === 'dono') || (a.entrouEm || 0) - (b.entrouEm || 0))
    .map(x => ({ id: x.id, nome: x.nome, cor: x.cor, papel: x.papel }));
  const its = itens.map(d => ({ id: d.id, ...d.data() }));
  return {
    versao: 1, modo: 'nuvem', demo: false,
    eu: ms.find(x => x.id === uid) || { id: uid, nome: auth.currentUser?.displayName || 'Você', cor: '#C9824A' },
    familia: { id: fid, nome: casa?.nome || 'Nossa casa', codigo: casa?.codigo || '', membros: ms },
    listas: listas.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.criada - b.criada).map(l => ({ id: l.id, nome: l.nome, icone: l.icone, criada: l.criada,
      itens: its.filter(i => i.listaId === l.id).sort((a, b) => a.quando - b.quando).map(i => ({ id: i.id, nome: i.nome, qtd: i.qtd, corredor: i.corredor, emoji: i.emoji,
        comprado: !!i.comprado, preco: i.preco ?? null, por: i.por ?? null, add: i.add ?? null, quando: i.quando })) })),
    historico: Object.fromEntries(historico.map(d => { const h = d.data(); return [h.chave || d.id, { nome: h.nome, emoji: h.emoji, corredor: h.corredor, qtd: h.qtd, n: h.n }]; })),
    compras: compras.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.data - a.data),
  };
}
export async function puxar(fid, uid) {
  await carregar();
  const [c, ...rs] = await Promise.all([F.getDoc(casaDoc(fid)), F.getDocs(sub(fid, 'membros')), F.getDocs(sub(fid, 'listas')), F.getDocs(sub(fid, 'itens')),
    F.getDocs(F.query(sub(fid, 'compras'), F.orderBy('data', 'desc'), F.limit(80))), F.getDocs(sub(fid, 'historico'))]);
  return montar(fid, uid, c.data(), ...rs.map(r => r.docs));
}

/* ---------- gravar alterações (o Firestore cuida da fila offline) ---------- */
let pend = 0;
const ouvintes = new Set();
export const aoMudarStatus = f => ouvintes.add(f);
export const status = () => !navigator.onLine ? 'offline' : pend ? 'enviando' : 'ok';
export const pendentes = () => pend;
const avisar = () => ouvintes.forEach(f => f(status()));
addEventListener('online', avisar); addEventListener('offline', avisar);
export async function enviar() {} // compatibilidade: o Firestore envia sozinho

const TEMPOS = ['quando', 'criada', 'data', 'atualizado'];
function converter(row) {
  const o = {};
  for (const [k, v] of Object.entries(row || {})) {
    if (k === 'familia_id' || k === 'id') continue;
    const chave = k === 'lista_id' ? 'listaId' : k;
    o[chave] = TEMPOS.includes(k) && typeof v === 'string' ? Date.parse(v) : v === undefined ? null : v;
  }
  return o;
}
const idHist = c => String(c).replace(/[\/.#$\[\]]/g, '_').slice(0, 300) || '_';
export function enfileirar(op) {
  if (!db) return;
  const fid = op.row?.familia_id || op.match?.familia_id || atual?.fid;
  if (!fid) return;
  let p;
  try {
    if (op.t === 'up') {
      const id = op.tab === 'historico' ? idHist(op.row.chave) : op.row.id;
      p = F.setDoc(F.doc(db, 'casas', fid, op.tab, id), converter(op.row), { merge: true });
    } else if (op.t === 'upd') {
      const id = op.tab === 'membros' ? op.match.user_id : op.match.id;
      p = F.updateDoc(F.doc(db, 'casas', fid, op.tab, id), converter(op.row));
    } else if (op.t === 'del') {
      p = F.deleteDoc(F.doc(db, 'casas', fid, op.tab, op.match.id));
    } else if (op.t === 'delIn') {
      const b = F.writeBatch(db); op.ids.forEach(id => b.delete(F.doc(db, 'casas', fid, op.tab, id))); p = b.commit();
    }
  } catch (e) { console.warn('Mercato: não consegui gravar', op, e); return; }
  pend++; avisar();
  p.catch(e => console.warn('Mercato: alteração recusada', op, e)).finally(() => { pend--; avisar(); });
}

/* ---------- tempo real ---------- */
let atual = null, offs = [], timer = null;
export function conectar(fid, uid, aoAtualizar) {
  desconectar();
  atual = { fid, uid };
  const vivo = {}, chaves = ['casa', 'membros', 'listas', 'itens', 'compras', 'historico'];
  let ev = null, primeiraItens = true;
  const emitir = () => {
    if (!chaves.every(k => k in vivo)) return;
    clearTimeout(timer);
    timer = setTimeout(() => { const e = ev; ev = null; aoAtualizar(montar(fid, uid, vivo.casa, vivo.membros, vivo.listas, vivo.itens, vivo.compras, vivo.historico), e); }, 120);
  };
  const ouvir = (k, ref) => offs.push(F.onSnapshot(ref, s => {
    if (k === 'casa') vivo.casa = s.data();
    else {
      vivo[k] = s.docs;
      if (k === 'itens') {
        if (!primeiraItens && !s.metadata.hasPendingWrites) {
          const ch = s.docChanges().filter(c => c.type !== 'removed' && !c.doc.metadata.hasPendingWrites).pop();
          if (ch) ev = { table: 'itens', eventType: ch.type === 'added' ? 'INSERT' : 'UPDATE', new: ch.doc.data() };
        }
        primeiraItens = false;
      }
    }
    emitir();
  }, e => console.warn('Mercato: tempo real', k, e)));
  ouvir('casa', casaDoc(fid));
  ouvir('membros', sub(fid, 'membros'));
  ouvir('listas', sub(fid, 'listas'));
  ouvir('itens', sub(fid, 'itens'));
  ouvir('compras', F.query(sub(fid, 'compras'), F.orderBy('data', 'desc'), F.limit(80)));
  ouvir('historico', sub(fid, 'historico'));
}
export function desconectar() { offs.forEach(f => f()); offs = []; atual = null; clearTimeout(timer); }
