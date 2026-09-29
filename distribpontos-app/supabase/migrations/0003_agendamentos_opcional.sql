-- OPCIONAL: tarefas automáticas dentro do Supabase (grátis), usando pg_cron.
-- 1) No Supabase: Database > Extensions > ative "pg_cron".
-- 2) Rode este arquivo no SQL Editor.
create extension if not exists pg_cron;

-- Cancela pedidos Pix não pagos em 30 min (a cada 10 minutos)
select cron.schedule('dp-cancelar-pix', '*/10 * * * *', $$select public.cancel_stale_pix()$$);

-- Baixa pontos vencidos (todo dia às 03:10 UTC)
select cron.schedule('dp-vencer-pontos', '10 3 * * *', $$select public.expire_points()$$);
