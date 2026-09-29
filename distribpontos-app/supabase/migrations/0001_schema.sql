-- =====================================================================
-- DistribPontos — schema principal (Supabase / Postgres 15+)
-- Rode este arquivo inteiro no SQL Editor do Supabase (ou `supabase db push`).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------

create table if not exists public.bairros (
  id serial primary key,
  nome text not null,
  cidade text not null,
  unique (nome, cidade)
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text,
  cpf text unique check (cpf ~ '^[0-9]{11}$'),
  celular text,
  email text,
  mkt_optin boolean not null default false,
  consent_at timestamptz,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.distributors (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text not null unique check (cnpj ~ '^[0-9]{14}$'),
  cidade text not null default '',
  bairro text not null default '',
  segmento text not null default 'Distribuidora',
  cor text not null default '#1D4F7A' check (cor ~ '^#[0-9A-Fa-f]{6}$'),
  plano text not null default 'Essencial' check (plano in ('Essencial','Pro','Rede')),
  status text not null default 'implantacao' check (status in ('implantacao','ativa','suspensa')),
  contrato_assinado boolean not null default false,
  horario_abre time not null default '08:00',
  horario_fecha time not null default '22:00',
  pausada boolean not null default false,
  pedido_minimo numeric(10,2) not null default 0 check (pedido_minimo >= 0),
  frete_gratis_acima numeric(10,2) not null default 0 check (frete_gratis_acima >= 0),
  prazo_texto text not null default '40–60 min',
  pts_por_real numeric(6,2) not null default 1 check (pts_por_real > 0),
  nivel_prata int not null default 1500 check (nivel_prata > 0),
  nivel_ouro int not null default 5000 check (nivel_ouro > 0),
  validade_meses int not null default 12 check (validade_meses between 1 and 60),
  timezone text not null default 'America/Sao_Paulo',
  pix_ativo boolean not null default false,
  created_at timestamptz not null default now()
);

-- Segredos (token do Mercado Pago). Sem políticas RLS: só o service role lê.
create table if not exists public.distributor_secrets (
  distributor_id uuid primary key references public.distributors (id) on delete cascade,
  mp_access_token text,
  updated_at timestamptz not null default now()
);

create table if not exists public.members (
  distributor_id uuid not null references public.distributors (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('dono','caixa','entregador')),
  nome text not null default '',
  email text,
  created_at timestamptz not null default now(),
  primary key (distributor_id, user_id)
);

create table if not exists public.delivery_areas (
  distributor_id uuid not null references public.distributors (id) on delete cascade,
  bairro_id int not null references public.bairros (id) on delete cascade,
  taxa numeric(10,2) not null default 0 check (taxa >= 0),
  primary key (distributor_id, bairro_id)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  distributor_id uuid not null references public.distributors (id) on delete cascade,
  nome text not null check (length(trim(nome)) > 0),
  categoria text not null default 'Outros',
  unidade text not null default 'unidade',
  preco numeric(10,2) not null check (preco > 0),
  estoque int not null default 0 check (estoque >= 0),
  ativo boolean not null default true,
  pontos_dobro boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists products_dist_idx on public.products (distributor_id);

create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  distributor_id uuid not null references public.distributors (id) on delete cascade,
  nome text not null check (length(trim(nome)) > 0),
  categoria text not null default 'Outros',
  custo int not null check (custo > 0),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id bigserial primary key,
  distributor_id uuid not null references public.distributors (id),
  customer_id uuid references auth.users (id) on delete set null,
  cpf text not null,
  cliente_nome text not null default '',
  cliente_celular text,
  canal text not null check (canal in ('app','balcao')),
  tipo text not null check (tipo in ('compra','resgate')),
  status text not null check (status in ('aguardando_pagamento','novo','separando','em_rota','entregue','cancelado')),
  subtotal numeric(10,2) not null default 0,
  frete numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  pontos int not null default 0,
  pag_metodo text check (pag_metodo in ('pix','cartao','dinheiro')),
  pag_status text check (pag_status in ('pendente','pago','na_entrega','estornar','estornado')),
  mp_payment_id text,
  pix_qr text,
  pix_qr_base64 text,
  entrega text not null default 'entrega' check (entrega in ('entrega','retirada')),
  endereco jsonb,
  entregador_id uuid references auth.users (id) on delete set null,
  entregador_nome text,
  eta timestamptz,
  reward_id uuid references public.rewards (id) on delete set null,
  cupom text,
  motivo_cancelamento text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_dist_idx on public.orders (distributor_id, created_at desc);
create index if not exists orders_customer_idx on public.orders (customer_id, created_at desc);

create table if not exists public.order_items (
  id bigserial primary key,
  order_id bigint not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  nome text not null,
  preco numeric(10,2) not null,
  qty int not null check (qty > 0)
);

create table if not exists public.points_ledger (
  id bigserial primary key,
  distributor_id uuid not null references public.distributors (id) on delete cascade,
  cpf text not null check (cpf ~ '^[0-9]{11}$'),
  pts int not null check (pts <> 0),
  tipo text not null check (tipo in ('compra','balcao','resgate','estorno','vencimento','ajuste')),
  descricao text not null default '',
  order_id bigint references public.orders (id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ledger_wallet_idx on public.points_ledger (distributor_id, cpf);
create index if not exists ledger_cpf_idx on public.points_ledger (cpf);

create table if not exists public.counter_codes (
  id uuid primary key default gen_random_uuid(),
  distributor_id uuid not null references public.distributors (id) on delete cascade,
  cpf text not null,
  valor numeric(10,2) not null check (valor > 0),
  cupom text,
  pts int not null,
  code_hash text not null,
  celular text,
  tentativas int not null default 0,
  expires_at timestamptz not null default now() + interval '10 minutes',
  created_by uuid references auth.users (id) on delete set null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id bigserial primary key,
  cpf text not null,
  titulo text not null,
  mensagem text not null,
  lida boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_cpf_idx on public.notifications (cpf, created_at desc);

create table if not exists public.lgpd_requests (
  id bigserial primary key,
  user_id uuid references auth.users (id) on delete set null,
  cpf text,
  nome text,
  tipo text not null check (tipo in ('copia','exclusao')),
  status text not null default 'pendente' check (status in ('pendente','concluida')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Funções auxiliares
-- ---------------------------------------------------------------------

create or replace function public.cpf_valid(c text) returns boolean
language plpgsql immutable as $$
declare s int; r int; t int; i int;
begin
  if c is null or c !~ '^[0-9]{11}$' or c ~ '^(.)\1{10}$' then return false; end if;
  for t in 9..10 loop
    s := 0;
    for i in 1..t loop
      s := s + substr(c, i, 1)::int * (t + 2 - i);
    end loop;
    r := (s * 10) % 11 % 10;
    if r <> substr(c, t + 1, 1)::int then return false; end if;
  end loop;
  return true;
end $$;

create or replace function public.my_cpf() returns text
language sql stable security definer set search_path = public as $$
  select cpf from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.member_role(p_dist uuid) returns text
language sql stable security definer set search_path = public as $$
  select role from public.members where distributor_id = p_dist and user_id = auth.uid()
$$;

create or replace function public.store_open(p_dist uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select d.status = 'ativa' and not d.pausada
     and (now() at time zone d.timezone)::time >= d.horario_abre
     and (now() at time zone d.timezone)::time <  d.horario_fecha
  from public.distributors d where d.id = p_dist
$$;

-- Saldo, acumulado de 12 meses e pontos a creditar de uma carteira
create or replace function public.wallet_stats(p_dist uuid, p_cpf text)
returns table (saldo int, acumulado_12m int, pendente int)
language sql stable security definer set search_path = public as $$
  select
    coalesce((select sum(pts) from public.points_ledger where distributor_id = p_dist and cpf = p_cpf), 0)::int,
    coalesce((select sum(pts) from public.points_ledger where distributor_id = p_dist and cpf = p_cpf
              and pts > 0 and tipo in ('compra','balcao','ajuste') and created_at > now() - interval '12 months'), 0)::int,
    coalesce((select sum(pontos) from public.orders where distributor_id = p_dist and cpf = p_cpf
              and tipo = 'compra' and status in ('novo','separando','em_rota')), 0)::int
$$;

create or replace function public.tier_mult(p_dist uuid, p_acum int) returns numeric
language sql stable security definer set search_path = public as $$
  select case when p_acum >= d.nivel_ouro then 1.5 when p_acum >= d.nivel_prata then 1.25 else 1 end
  from public.distributors d where d.id = p_dist
$$;

create or replace function public.notify_cpf(p_cpf text, p_titulo text, p_msg text) returns void
language sql security definer set search_path = public as $$
  insert into public.notifications (cpf, titulo, mensagem) values (p_cpf, p_titulo, p_msg)
$$;

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- Cliente: completar cadastro (CPF)
-- ---------------------------------------------------------------------
create or replace function public.complete_profile(p_nome text, p_cpf text, p_email text, p_mkt boolean, p_consent boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_phone text; v_cpf text := regexp_replace(coalesce(p_cpf,''), '\D', '', 'g');
begin
  if v_uid is null then raise exception 'Faça login primeiro.'; end if;
  if not coalesce(p_consent, false) then raise exception 'É preciso aceitar os termos e o uso dos dados.'; end if;
  if length(trim(coalesce(p_nome,''))) < 5 or position(' ' in trim(p_nome)) = 0 then raise exception 'Informe nome e sobrenome.'; end if;
  if not public.cpf_valid(v_cpf) then raise exception 'CPF inválido.'; end if;
  if exists (select 1 from public.profiles where cpf = v_cpf and id <> v_uid) then
    raise exception 'Este CPF já tem cadastro. Entre com o celular cadastrado ou fale com o suporte.';
  end if;
  if exists (select 1 from public.profiles where id = v_uid and cpf is not null and cpf <> v_cpf) then
    raise exception 'O CPF da conta não pode ser alterado.';
  end if;
  select phone into v_phone from auth.users where id = v_uid;
  insert into public.profiles (id, nome, cpf, celular, email, mkt_optin, consent_at)
  values (v_uid, trim(p_nome), v_cpf, v_phone, nullif(trim(coalesce(p_email,'')), ''), coalesce(p_mkt,false), now())
  on conflict (id) do update set nome = excluded.nome, cpf = excluded.cpf, celular = excluded.celular,
    email = excluded.email, mkt_optin = excluded.mkt_optin, consent_at = coalesce(public.profiles.consent_at, excluded.consent_at);
end $$;

-- ---------------------------------------------------------------------
-- Cliente: criar pedido (preços, estoque, frete e pontos calculados no servidor)
-- p_items: [{"product_id": "...", "qty": 2}]
-- p_endereco: {"bairro_id": 1, "rua": "...", "comp": "..."}
-- ---------------------------------------------------------------------
create or replace function public.place_order(p_dist uuid, p_items jsonb, p_entrega text, p_endereco jsonb, p_pag text)
returns bigint language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid(); v_prof public.profiles; v_d public.distributors;
  v_item jsonb; v_p public.products; v_qty int; v_sub numeric := 0; v_frete numeric := 0; v_pts numeric := 0;
  v_taxa numeric; v_bairro public.bairros; v_order bigint; v_stats record; v_end jsonb := null;
begin
  if v_uid is null then raise exception 'Faça login primeiro.'; end if;
  select * into v_prof from public.profiles where id = v_uid;
  if v_prof.cpf is null then raise exception 'Complete seu cadastro com CPF antes de pedir.'; end if;
  select * into v_d from public.distributors where id = p_dist;
  if v_d.id is null or v_d.status <> 'ativa' then raise exception 'Distribuidora indisponível.'; end if;
  if not public.store_open(p_dist) then raise exception 'A loja está fechada agora.'; end if;
  if p_pag not in ('pix','cartao','dinheiro') then raise exception 'Forma de pagamento inválida.'; end if;
  if p_pag = 'pix' and not v_d.pix_ativo then raise exception 'Esta loja ainda não aceita Pix pelo app.'; end if;
  if p_entrega not in ('entrega','retirada') then raise exception 'Tipo de entrega inválido.'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Carrinho vazio.'; end if;

  insert into public.orders (distributor_id, customer_id, cpf, cliente_nome, cliente_celular, canal, tipo, status, pag_metodo, pag_status, entrega)
  values (p_dist, v_uid, v_prof.cpf, v_prof.nome, v_prof.celular, 'app', 'compra', 'aguardando_pagamento', p_pag, 'pendente', p_entrega)
  returning id into v_order;

  select * into v_stats from public.wallet_stats(p_dist, v_prof.cpf);

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'qty')::int;
    if v_qty is null or v_qty <= 0 then raise exception 'Quantidade inválida.'; end if;
    select * into v_p from public.products where id = (v_item->>'product_id')::uuid for update;
    if v_p.id is null or v_p.distributor_id <> p_dist or not v_p.ativo then raise exception 'Produto indisponível.'; end if;
    if v_p.estoque < v_qty then raise exception 'Estoque insuficiente de %: restam %.', v_p.nome, v_p.estoque; end if;
    update public.products set estoque = estoque - v_qty where id = v_p.id;
    insert into public.order_items (order_id, product_id, nome, preco, qty) values (v_order, v_p.id, v_p.nome, v_p.preco, v_qty);
    v_sub := v_sub + v_p.preco * v_qty;
    v_pts := v_pts + v_p.preco * v_qty * v_d.pts_por_real * (case when v_p.pontos_dobro then 2 else 1 end);
  end loop;

  if v_sub < v_d.pedido_minimo then raise exception 'Pedido mínimo desta loja: R$ %.', to_char(v_d.pedido_minimo, 'FM999G990D00'); end if;

  if p_entrega = 'entrega' then
    select * into v_bairro from public.bairros where id = (p_endereco->>'bairro_id')::int;
    if v_bairro.id is null or length(trim(coalesce(p_endereco->>'rua',''))) < 4 then raise exception 'Informe o endereço de entrega.'; end if;
    select taxa into v_taxa from public.delivery_areas where distributor_id = p_dist and bairro_id = v_bairro.id;
    if v_taxa is null then raise exception 'Esta loja não entrega em %.', v_bairro.nome; end if;
    v_frete := case when v_taxa > 0 and v_d.frete_gratis_acima > 0 and v_sub >= v_d.frete_gratis_acima then 0 else v_taxa end;
    v_end := jsonb_build_object('bairro_id', v_bairro.id, 'bairro', v_bairro.nome, 'cidade', v_bairro.cidade,
      'rua', left(trim(p_endereco->>'rua'), 160), 'comp', left(trim(coalesce(p_endereco->>'comp','')), 120));
  end if;

  update public.orders set
    subtotal = v_sub, frete = v_frete, total = v_sub + v_frete, endereco = v_end,
    pontos = floor(v_pts * public.tier_mult(p_dist, v_stats.acumulado_12m))::int,
    status = case when p_pag = 'pix' then 'aguardando_pagamento' else 'novo' end,
    pag_status = case when p_pag = 'pix' then 'pendente' else 'na_entrega' end
  where id = v_order;
  return v_order;
end $$;

-- Pix aprovado (chamado só pelo servidor, a partir do webhook do Mercado Pago)
create or replace function public.mark_order_paid(p_order bigint, p_payment_id text, p_amount numeric)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_o public.orders;
begin
  select * into v_o from public.orders where id = p_order for update;
  if v_o.id is null then return false; end if;
  if v_o.pag_status = 'pago' then return true; end if;
  if abs(v_o.total - p_amount) > 0.01 then raise exception 'Valor pago diferente do pedido.'; end if;
  if v_o.status = 'cancelado' then
    update public.orders set pag_status = 'estornar', mp_payment_id = p_payment_id where id = p_order;
    return false;
  end if;
  update public.orders set status = 'novo', pag_status = 'pago', mp_payment_id = p_payment_id where id = p_order;
  perform public.notify_cpf(v_o.cpf, 'Pix aprovado', format('Pagamento do pedido #%s aprovado. A loja já recebeu seu pedido.', p_order));
  return true;
end $$;

-- Grava QR do Pix (servidor)
create or replace function public.set_order_pix(p_order bigint, p_payment_id text, p_qr text, p_qr64 text)
returns void language sql security definer set search_path = public as $$
  update public.orders set mp_payment_id = p_payment_id, pix_qr = p_qr, pix_qr_base64 = p_qr64 where id = p_order
$$;

-- ---------------------------------------------------------------------
-- Loja: avançar status (credita pontos na entrega)
-- ---------------------------------------------------------------------
create or replace function public.advance_order(p_order bigint, p_entregador uuid default null)
returns text language plpgsql security definer set search_path = public as $$
declare v_o public.orders; v_role text; v_next text; v_d public.distributors; v_ent public.members;
begin
  select * into v_o from public.orders where id = p_order for update;
  if v_o.id is null then raise exception 'Pedido não encontrado.'; end if;
  v_role := public.member_role(v_o.distributor_id);
  if v_role is null then raise exception 'Sem permissão.'; end if;
  v_next := case v_o.status when 'novo' then 'separando' when 'separando' then 'em_rota' when 'em_rota' then 'entregue' else null end;
  if v_next is null then raise exception 'Este pedido não pode avançar.'; end if;
  if v_role = 'entregador' and not (v_o.status = 'em_rota' and v_o.entregador_id = auth.uid()) then
    raise exception 'Entregador só confirma as próprias entregas.';
  end if;
  select * into v_d from public.distributors where id = v_o.distributor_id;

  if v_next = 'em_rota' then
    if v_o.entrega = 'retirada' then
      v_next := 'entregue';  -- retirada: pronto → entregue direto no balcão
    else
      select * into v_ent from public.members where distributor_id = v_o.distributor_id and user_id = coalesce(p_entregador, auth.uid());
      update public.orders set entregador_id = v_ent.user_id, entregador_nome = coalesce(nullif(v_ent.nome,''), 'Entregador'),
        eta = now() + interval '30 minutes' where id = p_order;
    end if;
  end if;

  update public.orders set status = v_next where id = p_order;

  if v_next = 'entregue' and v_o.tipo = 'compra' and v_o.pontos > 0 then
    insert into public.points_ledger (distributor_id, cpf, pts, tipo, descricao, order_id, expires_at)
    values (v_o.distributor_id, v_o.cpf, v_o.pontos, 'compra', 'Pedido #' || p_order, p_order, now() + make_interval(months => v_d.validade_meses));
  end if;

  perform public.notify_cpf(v_o.cpf, v_d.nome, case v_next
    when 'separando' then format('Seu pedido #%s está sendo separado.', p_order)
    when 'em_rota' then format('Pedido #%s saiu para entrega. Chega em cerca de 30 minutos.', p_order)
    when 'entregue' then case when v_o.tipo = 'compra' then format('Pedido #%s entregue. +%s pontos!', p_order, v_o.pontos)
                              else format('Seu resgate #%s foi entregue.', p_order) end end);
  return v_next;
end $$;

-- Cancelar (loja: dono/caixa; cliente: só enquanto aguarda pagamento ou recebido)
create or replace function public.cancel_order(p_order bigint, p_motivo text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_o public.orders; v_role text; v_it record;
begin
  select * into v_o from public.orders where id = p_order for update;
  if v_o.id is null then raise exception 'Pedido não encontrado.'; end if;
  v_role := public.member_role(v_o.distributor_id);
  if v_role in ('dono','caixa') then
    if v_o.status in ('entregue','cancelado') then raise exception 'Pedido já finalizado.'; end if;
  elsif v_o.customer_id = auth.uid() then
    if v_o.status not in ('aguardando_pagamento','novo') then raise exception 'A loja já está preparando seu pedido. Fale com ela para cancelar.'; end if;
  elsif auth.uid() is not null then
    raise exception 'Sem permissão.';
  end if;  -- auth.uid() nulo = tarefa agendada / servidor

  for v_it in select product_id, qty from public.order_items where order_id = p_order and product_id is not null loop
    update public.products set estoque = estoque + v_it.qty where id = v_it.product_id;
  end loop;
  if v_o.tipo = 'resgate' then
    insert into public.points_ledger (distributor_id, cpf, pts, tipo, descricao, order_id)
    select v_o.distributor_id, v_o.cpf, -sum(pts), 'estorno', 'Estorno do resgate #' || p_order, p_order
    from public.points_ledger where order_id = p_order and tipo = 'resgate' having sum(pts) < 0;
  end if;
  update public.orders set status = 'cancelado', motivo_cancelamento = left(p_motivo, 200),
    pag_status = case when pag_status = 'pago' then 'estornar' else pag_status end
  where id = p_order;
  if v_o.status <> 'aguardando_pagamento' then
    perform public.notify_cpf(v_o.cpf, 'Pedido cancelado', format('O pedido #%s foi cancelado.%s', p_order,
      case when v_o.pag_status = 'pago' then ' O Pix será devolvido pela loja.' else '' end));
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Cliente: trocar pontos por prêmio
-- ---------------------------------------------------------------------
create or replace function public.redeem_reward(p_reward uuid, p_entrega text, p_endereco jsonb)
returns bigint language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_prof public.profiles; v_r public.rewards; v_saldo int; v_order bigint; v_bairro public.bairros; v_end jsonb;
begin
  select * into v_prof from public.profiles where id = v_uid;
  if v_prof.cpf is null then raise exception 'Complete seu cadastro primeiro.'; end if;
  select * into v_r from public.rewards where id = p_reward;
  if v_r.id is null or not v_r.ativo then raise exception 'Prêmio indisponível.'; end if;
  if (select status from public.distributors where id = v_r.distributor_id) <> 'ativa' then raise exception 'Distribuidora indisponível.'; end if;
  perform pg_advisory_xact_lock(hashtext(v_r.distributor_id::text || v_prof.cpf));
  select saldo into v_saldo from public.wallet_stats(v_r.distributor_id, v_prof.cpf);
  if v_saldo < v_r.custo then raise exception 'Pontos insuficientes.'; end if;
  if p_entrega = 'entrega' then
    select * into v_bairro from public.bairros where id = (p_endereco->>'bairro_id')::int;
    if v_bairro.id is null or not exists (select 1 from public.delivery_areas where distributor_id = v_r.distributor_id and bairro_id = v_bairro.id) then
      raise exception 'A loja não entrega neste endereço. Escolha retirar na loja.';
    end if;
    v_end := jsonb_build_object('bairro_id', v_bairro.id, 'bairro', v_bairro.nome, 'cidade', v_bairro.cidade,
      'rua', left(trim(coalesce(p_endereco->>'rua','')), 160), 'comp', left(trim(coalesce(p_endereco->>'comp','')), 120));
  end if;
  insert into public.orders (distributor_id, customer_id, cpf, cliente_nome, cliente_celular, canal, tipo, status, pontos, entrega, endereco, reward_id)
  values (v_r.distributor_id, v_uid, v_prof.cpf, v_prof.nome, v_prof.celular, 'app', 'resgate', 'novo', v_r.custo,
          case when p_entrega = 'entrega' then 'entrega' else 'retirada' end, v_end, v_r.id)
  returning id into v_order;
  insert into public.order_items (order_id, nome, preco, qty) values (v_order, v_r.nome, 0, 1);
  insert into public.points_ledger (distributor_id, cpf, pts, tipo, descricao, order_id)
  values (v_r.distributor_id, v_prof.cpf, -v_r.custo, 'resgate', 'Resgate · ' || v_r.nome, v_order);
  return v_order;
end $$;

-- ---------------------------------------------------------------------
-- Balcão: lançar pontos com código de confirmação do cliente
-- counter_start só roda pelo servidor (service role), que envia o código por SMS/app.
-- ---------------------------------------------------------------------
create or replace function public.counter_start(p_user uuid, p_dist uuid, p_cpf text, p_valor numeric, p_cupom text, p_celular text)
returns table (code_id uuid, code text, pts int, celular text, registrado boolean, nome text)
language plpgsql security definer set search_path = public as $$
declare v_role text; v_cpf text := regexp_replace(coalesce(p_cpf,''), '\D', '', 'g'); v_code text; v_stats record; v_d public.distributors;
  v_prof public.profiles; v_cel text; v_pts int; v_id uuid;
begin
  select role into v_role from public.members where distributor_id = p_dist and user_id = p_user;
  if coalesce(v_role,'') not in ('dono','caixa') then raise exception 'Sem permissão para lançar no balcão.'; end if;
  if not public.cpf_valid(v_cpf) then raise exception 'CPF inválido.'; end if;
  if p_valor is null or p_valor <= 0 or p_valor > 100000 then raise exception 'Valor inválido.'; end if;
  select * into v_d from public.distributors where id = p_dist;
  if v_d.status = 'suspensa' then raise exception 'Distribuidora suspensa.'; end if;
  if (select count(*) from public.counter_codes where distributor_id = p_dist and cpf = v_cpf and created_at > now() - interval '10 minutes') >= 5 then
    raise exception 'Muitas tentativas para este CPF. Aguarde alguns minutos.';
  end if;
  select * into v_prof from public.profiles where cpf = v_cpf;
  v_cel := coalesce(v_prof.celular, nullif(regexp_replace(coalesce(p_celular,''), '\D', '', 'g'), ''));
  if v_cel is null or length(regexp_replace(v_cel, '\D', '', 'g')) < 10 then raise exception 'Informe o celular do cliente para enviar o código.'; end if;
  select * into v_stats from public.wallet_stats(p_dist, v_cpf);
  v_pts := floor(p_valor * v_d.pts_por_real * public.tier_mult(p_dist, v_stats.acumulado_12m))::int;
  if v_pts <= 0 then raise exception 'Valor baixo demais para gerar pontos.'; end if;
  v_code := lpad((floor(random() * 10000))::int::text, 4, '0');
  insert into public.counter_codes (distributor_id, cpf, valor, cupom, pts, code_hash, celular, created_by)
  values (p_dist, v_cpf, p_valor, nullif(trim(coalesce(p_cupom,'')), ''), v_pts, crypt(v_code, gen_salt('bf')), v_cel, p_user)
  returning id into v_id;
  if v_prof.id is not null then
    perform public.notify_cpf(v_cpf, 'Código do balcão', format('Código para confirmar %s pontos na %s: %s. Informe ao caixa.', v_pts, v_d.nome, v_code));
  end if;
  return query select v_id, v_code, v_pts, v_cel, (v_prof.id is not null), v_prof.nome;
end $$;

create or replace function public.counter_confirm(p_code_id uuid, p_code text)
returns int language plpgsql security definer set search_path = public as $$
declare v_c public.counter_codes; v_role text; v_d public.distributors; v_order bigint; v_prof public.profiles;
begin
  select * into v_c from public.counter_codes where id = p_code_id for update;
  if v_c.id is null then raise exception 'Código não encontrado.'; end if;
  v_role := public.member_role(v_c.distributor_id);
  if coalesce(v_role,'') not in ('dono','caixa') then raise exception 'Sem permissão.'; end if;
  if v_c.confirmed_at is not null then raise exception 'Este lançamento já foi confirmado.'; end if;
  if v_c.expires_at < now() then raise exception 'Código expirado. Gere um novo.'; end if;
  if v_c.tentativas >= 5 then raise exception 'Tentativas esgotadas. Gere um novo código.'; end if;
  if crypt(coalesce(p_code,''), v_c.code_hash) <> v_c.code_hash then
    update public.counter_codes set tentativas = tentativas + 1 where id = p_code_id;
    return -1;  -- código errado (o update acima permanece)
  end if;
  select * into v_d from public.distributors where id = v_c.distributor_id;
  select * into v_prof from public.profiles where cpf = v_c.cpf;
  update public.counter_codes set confirmed_at = now() where id = p_code_id;
  insert into public.orders (distributor_id, customer_id, cpf, cliente_nome, cliente_celular, canal, tipo, status, subtotal, total, pontos, entrega, cupom)
  values (v_c.distributor_id, v_prof.id, v_c.cpf, coalesce(v_prof.nome, ''), v_c.celular, 'balcao', 'compra', 'entregue', v_c.valor, v_c.valor, v_c.pts, 'retirada', v_c.cupom)
  returning id into v_order;
  insert into public.points_ledger (distributor_id, cpf, pts, tipo, descricao, order_id, expires_at)
  values (v_c.distributor_id, v_c.cpf, v_c.pts, 'balcao', 'Compra na loja' || coalesce(' · cupom ' || v_c.cupom, ''), v_order,
          now() + make_interval(months => v_d.validade_meses));
  perform public.notify_cpf(v_c.cpf, v_d.nome, format('+%s pontos pela compra na loja.', v_c.pts));
  return v_c.pts;
end $$;

-- ---------------------------------------------------------------------
-- Tarefas agendadas
-- ---------------------------------------------------------------------
-- Vencimento FIFO: o que venceu = créditos vencidos − tudo que já saiu (resgates, estornos, vencimentos)
create or replace function public.expire_points() returns int
language plpgsql security definer set search_path = public as $$
declare w record; v_exp int; v_total int := 0;
begin
  for w in
    select distributor_id, cpf,
      coalesce(sum(pts) filter (where pts > 0 and expires_at is not null and expires_at <= now()), 0) as vencidos,
      coalesce(-sum(pts) filter (where pts < 0), 0) as saidas,
      coalesce(sum(pts), 0) as saldo
    from public.points_ledger group by distributor_id, cpf
  loop
    v_exp := least(greatest(w.vencidos - w.saidas, 0), greatest(w.saldo, 0));
    if v_exp > 0 then
      insert into public.points_ledger (distributor_id, cpf, pts, tipo, descricao)
      values (w.distributor_id, w.cpf, -v_exp, 'vencimento', 'Pontos vencidos');
      v_total := v_total + v_exp;
    end if;
  end loop;
  return v_total;
end $$;

-- Pedidos Pix não pagos em 30 minutos são cancelados e o estoque volta
create or replace function public.cancel_stale_pix() returns int
language plpgsql security definer set search_path = public as $$
declare o record; n int := 0;
begin
  for o in select id from public.orders where status = 'aguardando_pagamento' and created_at < now() - interval '30 minutes' loop
    perform public.cancel_order(o.id, 'Pix não pago no prazo');
    n := n + 1;
  end loop;
  return n;
end $$;

-- ---------------------------------------------------------------------
-- Painel: clientes com pontos na distribuidora (CPF mascarado)
-- ---------------------------------------------------------------------
create or replace function public.dist_customers(p_dist uuid)
returns table (cpf_mask text, nome text, cadastrado boolean, saldo int, acumulado_12m int, ultima_compra timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if coalesce(public.member_role(p_dist),'') not in ('dono','caixa') and not public.is_admin() then raise exception 'Sem permissão.'; end if;
  return query
  select '•••.' || substr(l.cpf,4,3) || '.' || substr(l.cpf,7,3) || '-••', p.nome, p.id is not null,
    sum(l.pts)::int,
    coalesce(sum(l.pts) filter (where l.pts > 0 and l.tipo in ('compra','balcao','ajuste') and l.created_at > now() - interval '12 months'), 0)::int,
    max(l.created_at) filter (where l.tipo in ('compra','balcao'))
  from public.points_ledger l left join public.profiles p on p.cpf = l.cpf
  where l.distributor_id = p_dist
  group by l.cpf, p.nome, p.id
  order by 5 desc;
end $$;

-- Carteiras do cliente logado
create or replace function public.my_wallets()
returns table (distributor_id uuid, nome text, cor text, saldo int, acumulado_12m int, pendente int, nivel text, vence_30d int)
language plpgsql stable security definer set search_path = public as $$
declare v_cpf text := public.my_cpf();
begin
  if v_cpf is null then return; end if;
  return query
  with ids as (
    select l.distributor_id from public.points_ledger l where l.cpf = v_cpf
    union select o.distributor_id from public.orders o where o.cpf = v_cpf and o.tipo = 'compra' and o.status in ('novo','separando','em_rota')
  )
  select d.id, d.nome, d.cor, s.saldo, s.acumulado_12m, s.pendente,
    case when s.acumulado_12m >= d.nivel_ouro then 'Ouro' when s.acumulado_12m >= d.nivel_prata then 'Prata' else 'Bronze' end,
    least(greatest(
      coalesce((select sum(pts) from public.points_ledger x where x.distributor_id = d.id and x.cpf = v_cpf and x.pts > 0 and x.expires_at <= now() + interval '30 days'), 0)
      - coalesce((select -sum(pts) from public.points_ledger x where x.distributor_id = d.id and x.cpf = v_cpf and x.pts < 0), 0), 0), greatest(s.saldo, 0))::int
  from ids join public.distributors d on d.id = ids.distributor_id
  cross join lateral public.wallet_stats(d.id, v_cpf) s;
end $$;

-- ---------------------------------------------------------------------
-- Admin da plataforma
-- ---------------------------------------------------------------------
create or replace function public.admin_set_status(p_dist uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
declare v_d public.distributors;
begin
  if not public.is_admin() then raise exception 'Sem permissão.'; end if;
  select * into v_d from public.distributors where id = p_dist;
  if p_status = 'ativa' then
    if not v_d.contrato_assinado then raise exception 'Registre a assinatura do contrato antes de ativar.'; end if;
    if not exists (select 1 from public.products where distributor_id = p_dist and ativo) then raise exception 'A distribuidora precisa de ao menos 1 produto ativo.'; end if;
    if not exists (select 1 from public.delivery_areas where distributor_id = p_dist) then raise exception 'Cadastre ao menos 1 bairro de entrega.'; end if;
  end if;
  update public.distributors set status = p_status where id = p_dist;
end $$;

create or replace function public.admin_update_distributor(p_dist uuid, p_plano text, p_contrato boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Sem permissão.'; end if;
  update public.distributors set plano = coalesce(p_plano, plano), contrato_assinado = coalesce(p_contrato, contrato_assinado) where id = p_dist;
end $$;

create or replace function public.request_lgpd(p_tipo text) returns void
language plpgsql security definer set search_path = public as $$
declare v_p public.profiles;
begin
  select * into v_p from public.profiles where id = auth.uid();
  if v_p.id is null then raise exception 'Faça login primeiro.'; end if;
  insert into public.lgpd_requests (user_id, cpf, nome, tipo) values (v_p.id, v_p.cpf, v_p.nome, p_tipo);
end $$;

-- Servidor: achar usuário pelo e-mail (convites da equipe)
create or replace function public.user_id_by_email(p_email text) returns uuid
language sql stable security definer set search_path = public, auth as $$
  select id from auth.users where lower(email) = lower(trim(p_email)) limit 1
$$;

-- ---------------------------------------------------------------------
-- Permissões de execução
-- ---------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon;
grant execute on function public.cpf_valid(text), public.store_open(uuid) to anon, authenticated;
grant execute on function public.my_cpf(), public.is_admin(), public.member_role(uuid),
  public.complete_profile(text, text, text, boolean, boolean), public.place_order(uuid, jsonb, text, jsonb, text),
  public.advance_order(bigint, uuid), public.cancel_order(bigint, text), public.redeem_reward(uuid, text, jsonb),
  public.counter_confirm(uuid, text), public.dist_customers(uuid), public.my_wallets(),
  public.admin_set_status(uuid, text), public.admin_update_distributor(uuid, text, boolean), public.request_lgpd(text)
  to authenticated;
-- Somente servidor (service_role): counter_start, mark_order_paid, set_order_pix, expire_points, cancel_stale_pix, notify_cpf, tier_mult
revoke execute on function public.counter_start(uuid, uuid, text, numeric, text, text), public.mark_order_paid(bigint, text, numeric),
  public.set_order_pix(bigint, text, text, text), public.expire_points(), public.cancel_stale_pix(),
  public.notify_cpf(text, text, text), public.tier_mult(uuid, int), public.wallet_stats(uuid, text),
  public.user_id_by_email(text) from authenticated;
grant execute on all functions in schema public to service_role;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.bairros enable row level security;
alter table public.profiles enable row level security;
alter table public.distributors enable row level security;
alter table public.distributor_secrets enable row level security;
alter table public.members enable row level security;
alter table public.delivery_areas enable row level security;
alter table public.products enable row level security;
alter table public.rewards enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.points_ledger enable row level security;
alter table public.counter_codes enable row level security;
alter table public.notifications enable row level security;
alter table public.lgpd_requests enable row level security;

-- bairros
drop policy if exists bairros_read on public.bairros;
create policy bairros_read on public.bairros for select using (true);
drop policy if exists bairros_admin on public.bairros;
create policy bairros_admin on public.bairros for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- profiles
drop policy if exists profiles_own on public.profiles;
create policy profiles_own on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_upd on public.profiles;
create policy profiles_upd on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated;
grant update (nome, email, mkt_optin) on public.profiles to authenticated;

-- distributors
drop policy if exists dist_read on public.distributors;
create policy dist_read on public.distributors for select using (status = 'ativa' or public.member_role(id) is not null or public.is_admin());
drop policy if exists dist_owner_upd on public.distributors;
create policy dist_owner_upd on public.distributors for update to authenticated using (public.member_role(id) = 'dono') with check (public.member_role(id) = 'dono');
revoke update on public.distributors from authenticated;
grant update (segmento, cor, horario_abre, horario_fecha, pausada, pedido_minimo, frete_gratis_acima, prazo_texto,
  pts_por_real, nivel_prata, nivel_ouro, validade_meses) on public.distributors to authenticated;
drop policy if exists dist_admin_ins on public.distributors;
create policy dist_admin_ins on public.distributors for insert to authenticated with check (public.is_admin());

-- members
drop policy if exists members_read on public.members;
create policy members_read on public.members for select to authenticated
  using (user_id = auth.uid() or public.member_role(distributor_id) is not null or public.is_admin());
drop policy if exists members_owner_del on public.members;
create policy members_owner_del on public.members for delete to authenticated
  using ((public.member_role(distributor_id) = 'dono' and user_id <> auth.uid()) or public.is_admin());

-- delivery_areas
drop policy if exists areas_read on public.delivery_areas;
create policy areas_read on public.delivery_areas for select using (true);
drop policy if exists areas_owner on public.delivery_areas;
create policy areas_owner on public.delivery_areas for all to authenticated
  using (public.member_role(distributor_id) = 'dono') with check (public.member_role(distributor_id) = 'dono');

-- products
drop policy if exists products_read on public.products;
create policy products_read on public.products for select using (
  (ativo and exists (select 1 from public.distributors d where d.id = distributor_id and d.status = 'ativa'))
  or public.member_role(distributor_id) is not null or public.is_admin());
drop policy if exists products_owner on public.products;
create policy products_owner on public.products for all to authenticated
  using (public.member_role(distributor_id) = 'dono') with check (public.member_role(distributor_id) = 'dono');

-- rewards
drop policy if exists rewards_read on public.rewards;
create policy rewards_read on public.rewards for select using (
  (ativo and exists (select 1 from public.distributors d where d.id = distributor_id and d.status = 'ativa'))
  or public.member_role(distributor_id) is not null or public.is_admin());
drop policy if exists rewards_owner on public.rewards;
create policy rewards_owner on public.rewards for all to authenticated
  using (public.member_role(distributor_id) = 'dono') with check (public.member_role(distributor_id) = 'dono');

-- orders (sem insert/update direto: só pelas funções)
drop policy if exists orders_read on public.orders;
create policy orders_read on public.orders for select to authenticated using (
  customer_id = auth.uid()
  or (cpf = public.my_cpf())
  or public.member_role(distributor_id) in ('dono','caixa')
  or (public.member_role(distributor_id) = 'entregador' and entregador_id = auth.uid())
  or public.is_admin());

drop policy if exists items_read on public.order_items;
create policy items_read on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));

-- points_ledger
drop policy if exists ledger_read on public.points_ledger;
create policy ledger_read on public.points_ledger for select to authenticated using (
  cpf = public.my_cpf() or public.member_role(distributor_id) in ('dono','caixa') or public.is_admin());

-- notifications
drop policy if exists notif_read on public.notifications;
create policy notif_read on public.notifications for select to authenticated using (cpf = public.my_cpf());
drop policy if exists notif_upd on public.notifications;
create policy notif_upd on public.notifications for update to authenticated using (cpf = public.my_cpf()) with check (cpf = public.my_cpf());
revoke update on public.notifications from authenticated;
grant update (lida) on public.notifications to authenticated;

-- lgpd
drop policy if exists lgpd_read on public.lgpd_requests;
create policy lgpd_read on public.lgpd_requests for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists lgpd_admin on public.lgpd_requests;
create policy lgpd_admin on public.lgpd_requests for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- counter_codes e distributor_secrets: sem políticas (acesso apenas via service role / funções)

-- Tempo real para o painel de pedidos
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.orders;
    exception when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.notifications;
    exception when duplicate_object then null;
    end;
  end if;
end $$;
