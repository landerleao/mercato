-- =====================================================================
-- Mercato · banco de dados (Supabase)
-- Cole tudo no SQL Editor do Supabase e clique em "Run".
-- Pode rodar de novo sem problema: o script é idempotente.
-- =====================================================================

-- ---------- tabelas ----------
create table if not exists public.familias (
  id          text primary key default gen_random_uuid()::text,
  nome        text not null default 'Nossa casa',
  codigo      text not null unique default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6)),
  criada_por  uuid not null references auth.users(id) on delete cascade,
  criada_em   timestamptz not null default now()
);

create table if not exists public.membros (
  familia_id  text not null references public.familias(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  nome        text not null,
  cor         text not null default '#C9824A',
  papel       text not null default 'membro',
  entrou_em   timestamptz not null default now(),
  primary key (familia_id, user_id)
);

create table if not exists public.listas (
  id          text primary key default gen_random_uuid()::text,
  familia_id  text not null references public.familias(id) on delete cascade,
  nome        text not null,
  icone       text not null default 'ti-shopping-cart',
  criada      timestamptz not null default now()
);

create table if not exists public.itens (
  id          text primary key default gen_random_uuid()::text,
  lista_id    text not null references public.listas(id) on delete cascade,
  familia_id  text not null references public.familias(id) on delete cascade,
  nome        text not null,
  qtd         text not null default '1 un',
  corredor    text not null default 'outros',
  emoji       text not null default '🛒',
  comprado    boolean not null default false,
  preco       numeric(10,2),
  por         text,
  add         text,
  quando      timestamptz not null default now(),
  atualizado  timestamptz not null default now()
);

create table if not exists public.compras (
  id          text primary key default gen_random_uuid()::text,
  familia_id  text not null references public.familias(id) on delete cascade,
  data        timestamptz not null default now(),
  lista       text not null,
  total       numeric(10,2) not null default 0,
  qtd         integer not null default 0
);

create table if not exists public.historico (
  familia_id  text not null references public.familias(id) on delete cascade,
  chave       text not null,
  nome        text not null,
  emoji       text,
  corredor    text,
  qtd         text,
  n           integer not null default 1,
  primary key (familia_id, chave)
);

create index if not exists membros_user_idx   on public.membros(user_id);
create index if not exists listas_familia_idx on public.listas(familia_id);
create index if not exists itens_familia_idx  on public.itens(familia_id);
create index if not exists itens_lista_idx    on public.itens(lista_id);
create index if not exists compras_familia_idx on public.compras(familia_id);

-- ---------- quem pode ver o quê (RLS) ----------
-- Cada pessoa só enxerga os dados das famílias (casas) de que faz parte.
create or replace function public.minhas_familias()
returns setof text language sql stable security definer set search_path = public as $$
  select familia_id from public.membros where user_id = auth.uid()
$$;

alter table public.familias  enable row level security;
alter table public.membros   enable row level security;
alter table public.listas    enable row level security;
alter table public.itens     enable row level security;
alter table public.compras   enable row level security;
alter table public.historico enable row level security;

drop policy if exists "familia: ver"     on public.familias;
drop policy if exists "familia: editar"  on public.familias;
create policy "familia: ver"    on public.familias for select to authenticated using (id in (select public.minhas_familias()));
create policy "familia: editar" on public.familias for update to authenticated using (id in (select public.minhas_familias())) with check (id in (select public.minhas_familias()));

drop policy if exists "membros: ver"          on public.membros;
drop policy if exists "membros: editar o seu" on public.membros;
drop policy if exists "membros: sair"         on public.membros;
create policy "membros: ver"          on public.membros for select to authenticated using (familia_id in (select public.minhas_familias()));
create policy "membros: editar o seu" on public.membros for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "membros: sair"         on public.membros for delete to authenticated using (user_id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array['listas','itens','compras','historico'] loop
    execute format('drop policy if exists "familia acessa" on public.%I', t);
    execute format('create policy "familia acessa" on public.%I for all to authenticated using (familia_id in (select public.minhas_familias())) with check (familia_id in (select public.minhas_familias()))', t);
  end loop;
end $$;

-- ---------- funções chamadas pelo app ----------
-- Cria a casa da pessoa, já com ela como dona e uma primeira lista.
create or replace function public.criar_familia(p_nome_familia text, p_nome text, p_cor text default '#C9824A')
returns text language plpgsql security definer set search_path = public as $$
declare fid text;
begin
  if auth.uid() is null then raise exception 'Faça login primeiro'; end if;
  insert into familias (nome, criada_por) values (coalesce(nullif(trim(p_nome_familia), ''), 'Nossa casa'), auth.uid()) returning id into fid;
  insert into membros (familia_id, user_id, nome, cor, papel) values (fid, auth.uid(), p_nome, p_cor, 'dono');
  insert into listas (familia_id, nome, icone) values (fid, 'Compra do mês', 'ti-shopping-cart');
  return fid;
end $$;

-- Entra numa casa usando o código do convite.
create or replace function public.entrar_familia(p_codigo text, p_nome text, p_cor text default '#3E5C8A')
returns text language plpgsql security definer set search_path = public as $$
declare fid text;
begin
  if auth.uid() is null then raise exception 'Faça login primeiro'; end if;
  select id into fid from familias where codigo = upper(trim(p_codigo));
  if fid is null then raise exception 'Convite inválido'; end if;
  insert into membros (familia_id, user_id, nome, cor) values (fid, auth.uid(), p_nome, p_cor)
    on conflict (familia_id, user_id) do nothing;
  return fid;
end $$;

-- Mostra só o nome da casa de um convite (para a tela "Você foi convidado").
create or replace function public.info_convite(p_codigo text)
returns text language sql stable security definer set search_path = public as $$
  select nome from familias where codigo = upper(trim(p_codigo))
$$;

revoke all on function public.criar_familia(text, text, text)  from public, anon;
revoke all on function public.entrar_familia(text, text, text) from public, anon;
grant execute on function public.criar_familia(text, text, text)  to authenticated;
grant execute on function public.entrar_familia(text, text, text) to authenticated;
grant execute on function public.info_convite(text) to anon, authenticated;
revoke all on function public.minhas_familias() from public, anon;
grant execute on function public.minhas_familias() to authenticated;

-- ---------- tempo real ----------
do $$
declare t text;
begin
  foreach t in array array['listas','itens','compras','membros','familias','historico'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
