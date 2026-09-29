-- Testes de ponta a ponta das regras do banco (rodar em banco local com 00_supabase_stub.sql)
\set ON_ERROR_STOP 1
\set QUIET 1

-- helpers de teste
create or replace function pg_temp.as_user(u uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', coalesce(u::text,''), false); end $$;
create or replace function pg_temp.expect_error(sql text, fragment text) returns void language plpgsql as $$
begin
  begin execute sql; exception when others then
    if position(lower(fragment) in lower(sqlerrm)) > 0 then return; end if;
    raise exception 'Erro inesperado em [%]: %', sql, sqlerrm;
  end;
  raise exception 'Esperava erro contendo "%" em [%]', fragment, sql;
end $$;
create or replace function pg_temp.ok(cond boolean, msg text) returns void language plpgsql as $$
begin if not coalesce(cond,false) then raise exception 'FALHOU: %', msg; end if; raise notice 'ok - %', msg; end $$;
grant execute on all functions in schema pg_temp to authenticated, service_role;

-- ---------------- dados base (superusuário) ----------------
insert into auth.users (id, phone, email) values
 ('00000000-0000-0000-0000-00000000000a', null, 'admin@x.com'),
 ('00000000-0000-0000-0000-00000000000d', null, 'dono@x.com'),
 ('00000000-0000-0000-0000-00000000000c', null, 'caixa@x.com'),
 ('00000000-0000-0000-0000-00000000000e', null, 'moto@x.com'),
 ('00000000-0000-0000-0000-000000000001', '5527998124410', null),
 ('00000000-0000-0000-0000-000000000002', '5527997342281', null),
 ('00000000-0000-0000-0000-000000000003', '5527999887766', null);
insert into public.profiles (id, nome, is_admin) values ('00000000-0000-0000-0000-00000000000a', 'Admin', true);
insert into public.distributors (id, nome, cnpj, cidade, bairro, status, contrato_assinado, horario_abre, horario_fecha, frete_gratis_acima, pedido_minimo)
values ('11111111-1111-1111-1111-111111111111', 'Rio Doce', '12345678000190', 'Vitória', 'Jardim Camburi', 'ativa', true, '00:00', '23:59:59', 100, 15);
update public.distributors set pix_ativo = true;
insert into public.members values
 ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-00000000000d','dono','Rafael','dono@x.com'),
 ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-00000000000c','caixa','Bruna','caixa@x.com'),
 ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-00000000000e','entregador','Marcos','moto@x.com');
insert into public.delivery_areas select '11111111-1111-1111-1111-111111111111', id, case when nome='Jardim Camburi' then 0 else 7 end
  from public.bairros where cidade='Vitória' and nome in ('Jardim Camburi','Praia do Canto');
insert into public.products (id, distributor_id, nome, categoria, unidade, preco, estoque, pontos_dobro) values
 ('22222222-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Gás P13','Gás','botijão',115,5,false),
 ('22222222-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Energético','Energéticos','lata',10,50,true);
insert into public.rewards (id, distributor_id, nome, custo) values ('33333333-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Gelo 5kg',100);

set role authenticated;

-- ---------------- 1. cadastro por CPF ----------------
select pg_temp.as_user('00000000-0000-0000-0000-000000000001');
select pg_temp.expect_error($$select public.complete_profile('Ana Souza','111.111.111-11',null,true,true)$$, 'CPF inválido');
select pg_temp.expect_error($$select public.complete_profile('Ana Souza','529.982.247-25',null,true,false)$$, 'aceitar os termos');
select public.complete_profile('Ana Souza','529.982.247-25',null,true,true);
select pg_temp.ok((select cpf from public.profiles where id = auth.uid()) = '52998224725', 'cadastro com CPF salvo e celular do login');
select pg_temp.as_user('00000000-0000-0000-0000-000000000002');
select pg_temp.expect_error($$select public.complete_profile('Outro Nome','52998224725',null,false,true)$$, 'já tem cadastro');
select public.complete_profile('Carlos Mendes','31847562035',null,false,true);
select pg_temp.ok((select count(*) from public.profiles) = 1, 'cliente só enxerga o próprio perfil');
select pg_temp.expect_error($$update public.profiles set is_admin = true where id = auth.uid()$$, 'permission denied');

-- ---------------- 2. pedido em dinheiro com entrega ----------------
select pg_temp.as_user('00000000-0000-0000-0000-000000000001');
select pg_temp.expect_error($$select public.place_order('11111111-1111-1111-1111-111111111111','[{"product_id":"22222222-0000-0000-0000-000000000001","qty":9}]','entrega',
  (select jsonb_build_object('bairro_id',id,'rua','Rua A, 10') from public.bairros where nome='Praia do Canto'),'dinheiro')$$, 'Estoque insuficiente');
select pg_temp.expect_error($$select public.place_order('11111111-1111-1111-1111-111111111111','[{"product_id":"22222222-0000-0000-0000-000000000002","qty":1}]','retirada',null,'dinheiro')$$, 'Pedido mínimo');
select pg_temp.expect_error($$select public.place_order('11111111-1111-1111-1111-111111111111','[{"product_id":"22222222-0000-0000-0000-000000000001","qty":1}]','entrega',
  (select jsonb_build_object('bairro_id',id,'rua','Rua A, 10') from public.bairros where nome='Laranjeiras'),'dinheiro')$$, 'não entrega');
select public.place_order('11111111-1111-1111-1111-111111111111',
  '[{"product_id":"22222222-0000-0000-0000-000000000002","qty":3}]','entrega',
  (select jsonb_build_object('bairro_id',id,'rua','Rua A, 10') from public.bairros where nome='Praia do Canto'),'dinheiro') as o1 \gset
select pg_temp.ok((select status='novo' and subtotal=30 and frete=7 and total=37 and pontos=60 from public.orders where id=:o1), 'pedido novo: frete do bairro e pontos em dobro (3×10×2=60)');
select pg_temp.ok((select estoque from public.products where id='22222222-0000-0000-0000-000000000002') = 47, 'estoque baixado na hora do pedido');
select pg_temp.expect_error($$insert into public.orders (distributor_id,cpf,canal,tipo,status) values ('11111111-1111-1111-1111-111111111111','52998224725','app','compra','entregue')$$, 'row-level security');
update public.products set preco = 0.01;
select pg_temp.ok((select count(*) from public.products where preco = 0.01) = 0, 'cliente não altera preços');
select pg_temp.ok((select pendente from public.my_wallets()) = 60, 'pontos a creditar aparecem na carteira');

-- frete grátis acima de R$ 100
select public.place_order('11111111-1111-1111-1111-111111111111','[{"product_id":"22222222-0000-0000-0000-000000000001","qty":1}]','entrega',
  (select jsonb_build_object('bairro_id',id,'rua','Rua A, 10') from public.bairros where nome='Praia do Canto'),'cartao') as o2 \gset
select pg_temp.ok((select frete=0 and total=115 from public.orders where id=:o2), 'frete grátis acima do valor configurado');

-- ---------------- 3. loja avança status e credita pontos ----------------
select pg_temp.as_user('00000000-0000-0000-0000-000000000002');
select pg_temp.expect_error(format('select public.advance_order(%s)', :o1), 'Sem permissão');
select pg_temp.ok((select count(*) from public.orders where id=:o1) = 0, 'outro cliente não vê o pedido');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select pg_temp.ok(public.advance_order(:o1) = 'separando', 'caixa: separando');
select pg_temp.ok(public.advance_order(:o1, '00000000-0000-0000-0000-00000000000e') = 'em_rota', 'caixa: despacha com entregador');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000e');
select pg_temp.ok((select count(*) from public.orders) = 1, 'entregador vê só a entrega dele');
select pg_temp.expect_error(format('select public.advance_order(%s)', :o2), 'Entregador só confirma');
select pg_temp.ok(public.advance_order(:o1) = 'entregue', 'entregador confirma entrega');
select pg_temp.as_user('00000000-0000-0000-0000-000000000001');
select pg_temp.ok((select saldo=60 and pendente=115 and nivel='Bronze' from public.my_wallets()), 'pontos creditados na entrega');
select pg_temp.ok((select count(*) from public.notifications) >= 3, 'cliente recebe avisos de status');

-- ---------------- 4. Pix ----------------
select pg_temp.expect_error($$select public.user_id_by_email('dono@x.com')$$, 'permission denied');
select public.place_order('11111111-1111-1111-1111-111111111111','[{"product_id":"22222222-0000-0000-0000-000000000001","qty":1}]','retirada',null,'pix') as o3 \gset
select pg_temp.ok((select status='aguardando_pagamento' and pag_status='pendente' from public.orders where id=:o3), 'pix aguarda pagamento');
select pg_temp.expect_error(format('select public.mark_order_paid(%s,''x'',115)', :o3), 'permission denied');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select pg_temp.expect_error(format('select public.advance_order(%s)', :o3), 'não pode avançar');
reset role; set role service_role;
select pg_temp.expect_error(format('select public.mark_order_paid(%s,''mp1'',1)', :o3), 'Valor pago diferente');
select pg_temp.ok(public.mark_order_paid(:o3, 'mp1', 115), 'webhook marca pago');
select pg_temp.ok((select status='novo' and pag_status='pago' from public.orders where id=:o3), 'pedido pago vai para a loja');
select pg_temp.ok(public.mark_order_paid(:o3, 'mp1', 115), 'webhook repetido é idempotente');
reset role; set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select pg_temp.ok(public.advance_order(:o3) = 'separando', 'retirada: separando');
select pg_temp.ok(public.advance_order(:o3) = 'entregue', 'retirada: pronto e entregue no balcão');

-- ---------------- 5. balcão com código ----------------
select pg_temp.expect_error($$select * from public.counter_start('00000000-0000-0000-0000-00000000000c','11111111-1111-1111-1111-111111111111','15094736299',120.5,'X','27999887766')$$, 'permission denied');
reset role; set role service_role;
select pg_temp.expect_error($$select * from public.counter_start('00000000-0000-0000-0000-00000000000e','11111111-1111-1111-1111-111111111111','15094736299',120.5,'X','27999887766')$$, 'Sem permissão');
select pg_temp.expect_error($$select * from public.counter_start('00000000-0000-0000-0000-00000000000c','11111111-1111-1111-1111-111111111111','15094736299',120.5,'X',null)$$, 'celular');
select pg_temp.expect_error($$select * from public.counter_start('00000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','15094736299',120.5,'X','27999887766')$$, 'Sem permissão');
select code_id, code, pts from public.counter_start('00000000-0000-0000-0000-00000000000c','11111111-1111-1111-1111-111111111111','150.947.362-99',120.5,'004530','(27) 99988-7766') \gset
reset role; set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select pg_temp.as_user('00000000-0000-0000-0000-000000000001');
select pg_temp.expect_error(format('select public.counter_confirm(%L,%L)', :'code_id', :'code'), 'Sem permissão');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select pg_temp.ok(public.counter_confirm(:'code_id', case when :'code'='0000' then '1111' else '0000' end) = -1, 'código errado recusado');
select pg_temp.ok(public.counter_confirm(:'code_id', :'code') = 120, 'código certo credita 120 pts');
select pg_temp.expect_error(format('select public.counter_confirm(%L,%L)', :'code_id', :'code'), 'já foi confirmado');
select pg_temp.ok((select count(*) from public.dist_customers('11111111-1111-1111-1111-111111111111') where not cadastrado) = 1, 'CPF sem cadastro aparece como só balcão');
-- cliente novo cria conta com esse CPF e encontra os pontos
select pg_temp.as_user('00000000-0000-0000-0000-000000000003');
select public.complete_profile('Paulo Reis','15094736299',null,false,true);
select pg_temp.ok((select saldo from public.my_wallets()) = 120, 'pontos do balcão aparecem após o cadastro');
select pg_temp.expect_error($$select * from public.dist_customers('11111111-1111-1111-1111-111111111111')$$, 'Sem permissão');

-- ---------------- 6. resgate ----------------
select pg_temp.as_user('00000000-0000-0000-0000-000000000002');
select pg_temp.expect_error($$select public.redeem_reward('33333333-0000-0000-0000-000000000001','retirada',null)$$, 'insuficientes');
select pg_temp.as_user('00000000-0000-0000-0000-000000000003');
select public.redeem_reward('33333333-0000-0000-0000-000000000001','retirada',null) as r1 \gset
select pg_temp.ok((select saldo from public.my_wallets()) = 20, 'resgate debita pontos');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
select public.cancel_order(:r1, 'teste');
select pg_temp.as_user('00000000-0000-0000-0000-000000000003');
select pg_temp.ok((select saldo from public.my_wallets()) = 120, 'cancelar resgate devolve os pontos');

-- ---------------- 7. cancelamentos e loja fechada ----------------
select pg_temp.as_user('00000000-0000-0000-0000-000000000001');
select pg_temp.expect_error(format('select public.cancel_order(%s)', :o1), 'preparando');
select public.place_order('11111111-1111-1111-1111-111111111111','[{"product_id":"22222222-0000-0000-0000-000000000002","qty":2}]','retirada',null,'dinheiro') as o4 \gset
select public.cancel_order(:o4, 'desisti');
select pg_temp.ok((select estoque from public.products where id='22222222-0000-0000-0000-000000000002') = 47, 'cancelar devolve estoque');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
update public.distributors set pausada = true where id = '11111111-1111-1111-1111-111111111111';
select pg_temp.expect_error($$update public.distributors set status='ativa', contrato_assinado=true$$, 'permission denied');
select pg_temp.as_user('00000000-0000-0000-0000-000000000001');
select pg_temp.expect_error($$select public.place_order('11111111-1111-1111-1111-111111111111','[{"product_id":"22222222-0000-0000-0000-000000000002","qty":2}]','retirada',null,'dinheiro')$$, 'fechada');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
update public.distributors set pausada = false where id = '11111111-1111-1111-1111-111111111111';

-- ---------------- 8. tarefas agendadas ----------------
reset role;
insert into public.points_ledger (distributor_id, cpf, pts, tipo, descricao, expires_at, created_at)
values ('11111111-1111-1111-1111-111111111111','31847562035',50,'compra','antigo', now() - interval '1 day', now() - interval '13 months');
set role service_role;
select pg_temp.ok(public.expire_points() = 50, 'vencimento baixa 50 pts vencidos');
select pg_temp.ok(public.expire_points() = 0, 'vencimento não baixa duas vezes');
reset role;
select public.place_order('11111111-1111-1111-1111-111111111111','[{"product_id":"22222222-0000-0000-0000-000000000001","qty":1}]','retirada',null,'pix') as o5
  from (select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false)) s \gset
update public.orders set created_at = now() - interval '31 minutes' where id = :o5;
set role service_role;
select pg_temp.ok(public.cancel_stale_pix() = 1, 'pix não pago em 30 min é cancelado');
reset role;
select pg_temp.ok((select status from public.orders where id=:o5) = 'cancelado', 'pedido pix expirado cancelado');

-- ---------------- 9. admin ----------------
set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
select pg_temp.expect_error($$select public.admin_set_status('11111111-1111-1111-1111-111111111111','suspensa')$$, 'Sem permissão');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
reset role;
insert into public.distributors (id, nome, cnpj) values ('44444444-4444-4444-4444-444444444444','Nova','45678901000123');
set role authenticated;
select pg_temp.expect_error($$select public.admin_set_status('44444444-4444-4444-4444-444444444444','ativa')$$, 'contrato');
select public.admin_update_distributor('44444444-4444-4444-4444-444444444444', 'Pro', true);
select pg_temp.expect_error($$select public.admin_set_status('44444444-4444-4444-4444-444444444444','ativa')$$, 'produto');
select pg_temp.as_user('00000000-0000-0000-0000-000000000001');
select pg_temp.ok((select count(*) from public.distributors) = 1, 'cliente não vê distribuidora em implantação');

reset role; set role service_role;
select pg_temp.ok(public.user_id_by_email('DONO@x.com') = '00000000-0000-0000-0000-00000000000d', 'servidor acha usuário pelo e-mail');
reset role;
update public.distributors set pix_ativo = false where id='11111111-1111-1111-1111-111111111111';
set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000001');
select pg_temp.expect_error($$select public.place_order('11111111-1111-1111-1111-111111111111','[{"product_id":"22222222-0000-0000-0000-000000000002","qty":2}]','retirada',null,'pix')$$, 'não aceita Pix');
\echo 'TODOS OS TESTES PASSARAM'
