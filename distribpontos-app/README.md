# DistribPontos — app funcional (v1)

App de pedidos com programa de pontos por CPF para várias distribuidoras, no modelo em que **o app é seu** e cada distribuidora contratada aparece como uma loja dentro dele.

- **Cliente** (celular, instalável como app): entra com o celular + código SMS, completa o cadastro com CPF, informa o endereço a cada pedido, escolhe a distribuidora, faz o pedido (Pix, cartão ou dinheiro na entrega), acompanha o status e troca pontos por prêmios.
- **Distribuidora** (`/painel`): pedidos em tempo real, balcão com código de confirmação, catálogo com estoque e importação por planilha, regras de pontos e prêmios, clientes, horário, área de entrega, equipe (dono, caixa, entregador) e conexão com o Mercado Pago.
- **Você** (`/admin`): cadastra distribuidoras e convida o dono, registra contrato e plano, coloca no ar ou suspende, gerencia bairros e pedidos de LGPD.

Tecnologia: Next.js 14 (App Router) + Supabase (Postgres, login e tempo real) + Mercado Pago (Pix) + Twilio (SMS). Hospedagem: Vercel.

---

## 1. O que você vai precisar (contas)

| Serviço | Para quê | Custo inicial |
|---|---|---|
| [GitHub](https://github.com) | Guardar o código | Grátis |
| [Supabase](https://supabase.com) | Banco de dados, login e tempo real | Plano grátis serve para começar |
| [Vercel](https://vercel.com) | Colocar o site no ar | Hobby é grátis, mas só para uso não comercial. Quando cobrar das distribuidoras, use o plano Pro |
| [Twilio](https://www.twilio.com) | SMS do login e do código do balcão | Paga por SMS enviado (confira o preço atual para o Brasil) |
| Mercado Pago (de cada distribuidora) | Pix com QR code | Taxa do Mercado Pago por Pix recebido, paga pela loja |

---

## 2. Banco de dados (Supabase)

1. Crie um projeto no Supabase. Região: **South America (São Paulo)**.
2. Abra **SQL Editor** e rode, nesta ordem, o conteúdo de:
   - `supabase/migrations/0001_schema.sql` (tabelas, segurança e regras)
   - `supabase/migrations/0002_bairros.sql` (bairros da Grande Vitória; edite à vontade)
3. Tarefas automáticas (recomendado): em **Database › Extensions**, ative **pg_cron** e rode `supabase/migrations/0003_agendamentos_opcional.sql`. Isso cancela Pix não pagos em 30 minutos (devolvendo o estoque) e baixa pontos vencidos todo dia.
4. Em **Project Settings › API**, copie: `Project URL`, `anon public` e `service_role` (esta é secreta).

### Login por SMS (clientes)

5. **Authentication › Providers › Phone**: ative e escolha **Twilio**. Preencha Account SID, Auth Token e Message Service SID (do seu Twilio).
6. Para testar sem gastar SMS: em **Authentication › Providers › Phone › Test OTPs**, cadastre, por exemplo, `5527999990001=123456`. Esse número entra com o código `123456`.

### Login por e-mail (equipe das distribuidoras e você)

7. **Authentication › Providers › Email**: deixe ativo.
8. **Authentication › URL Configuration**:
   - Site URL: `https://SEU-APP.vercel.app`
   - Redirect URLs: `https://SEU-APP.vercel.app/**`
9. O Supabase grátis manda poucos e-mails por hora. Para os convites da equipe chegarem sempre, configure um SMTP próprio em **Authentication › SMTP Settings** (por exemplo Resend ou Brevo).

### Seu usuário de administrador

10. **Authentication › Users › Add user**: crie com seu e-mail e uma senha.
11. Copie o ID do usuário e rode no SQL Editor:

```sql
insert into public.profiles (id, nome, is_admin)
values ('COLE-O-ID-AQUI', 'Seu Nome', true)
on conflict (id) do update set is_admin = true;
```

---

## 3. Publicar na Vercel

1. Suba esta pasta para um repositório **privado** no GitHub.
2. Na Vercel: **Add New › Project › Import** o repositório.
3. Em **Environment Variables**, cadastre (veja `.env.example`):

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL do Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role (secreta) |
| `NEXT_PUBLIC_SITE_URL` | `https://SEU-APP.vercel.app` (sem barra no final) |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` | do Twilio (número que envia o SMS do balcão) |
| `CRON_SECRET` | um texto aleatório longo |
| `SMS_DEV_MODE` | `false` em produção (`true` só para testar o balcão sem SMS) |

4. **Deploy**. Depois, volte ao Supabase e confira se a Site URL bate com o endereço final.
5. Domínio próprio (opcional): em **Vercel › Settings › Domains**, adicione, por exemplo, `app.suaempresa.com.br`, e atualize `NEXT_PUBLIC_SITE_URL` e as URLs do Supabase.

### Rodar no seu computador

```bash
npm install
cp .env.example .env.local   # preencha os valores
npm run dev                  # abre em http://localhost:3000
```

---

## 4. Colocar a primeira distribuidora no ar

1. Entre em `/painel/login` com seu e-mail de admin e abra **Admin da plataforma**.
2. Em **Novo contrato**, preencha os dados e o e-mail do dono. Ele recebe um convite para criar a senha.
3. O dono entra em `/painel` e, em **Configurações**, define horário, área de entrega (bairros e taxa), equipe e **Pix** (cola o Access Token do Mercado Pago da loja). Em **Catálogo** cadastra ou importa os produtos. Em **Pontos e prêmios**, define a regra e os prêmios.
4. No Admin, marque **Contrato: Assinado** e clique em **Colocar no ar**. O sistema só deixa ativar com contrato, ao menos 1 produto e 1 bairro.

### Pix (Mercado Pago)

- Cada distribuidora usa a **própria conta** Mercado Pago, então o dinheiro cai direto para ela.
- O dono pega o token em Mercado Pago › Seu negócio › Configurações › **Credenciais de produção › Access Token**.
- O aviso de pagamento (webhook) é configurado automaticamente em cada cobrança. Mesmo que o aviso atrase, o app confere o pagamento a cada 4 segundos enquanto o cliente está na tela do Pix.
- Pedidos Pix cancelados depois de pagos ficam marcados como “estornar”. A devolução é feita pela loja no Mercado Pago.

---

## 5. Instalar no celular

- **Android (Chrome):** abra o site › menu ⋮ › **Instalar app**.
- **iPhone (Safari):** abra o site › Compartilhar › **Adicionar à Tela de Início**.

Mande o link para os clientes com um cartaz no balcão: “Informe seu CPF no caixa e ganhe pontos. Baixe o app: app.suaempresa.com.br”.

---

## 6. Roteiro de teste antes de lançar

1. Cliente: entrar com o número de teste, cadastrar CPF, definir endereço, pedir em **dinheiro**.
2. Painel (caixa): Iniciar separação › Despachar (escolhendo o entregador) › entregador confirma a entrega. Confira os pontos no app do cliente.
3. Pix: com um token de produção, faça um pedido de valor baixo, pague e veja o pedido aparecer no painel sozinho.
4. Balcão: lance uma compra para um CPF **sem cadastro**, confirme com o código do SMS e depois cadastre esse CPF no app. Os pontos devem aparecer.
5. Resgate: troque pontos por um prêmio, retirando na loja.
6. Loja fechada: mude o horário no painel e confira que o app não aceita pedido.
7. Permissões: entre como caixa e como entregador e confira que cada um só vê o que deve.

---

## 7. Segurança e LGPD (já implementado)

- Todas as regras de dinheiro e pontos rodam **no banco**: preço, frete, estoque, pontos e nível são recalculados no servidor, e o cliente não consegue alterar valores.
- Segurança por linha (RLS): cada cliente só vê os próprios dados; cada loja só vê os próprios pedidos; o entregador só vê as entregas dele.
- O token do Mercado Pago e os códigos do balcão ficam em tabelas que só o servidor acessa.
- O código do balcão expira em 10 minutos, aceita no máximo 5 tentativas e é guardado criptografado.
- A loja vê o CPF mascarado. O cliente aceita os termos no cadastro e pode pedir cópia ou exclusão dos dados no Perfil (você atende pelo Admin, em até 15 dias).
- Antes de lançar: preencha `src/app/termos/page.tsx` com os dados da sua empresa e **revise o texto com um advogado**.

---

## 8. Estrutura do projeto

```
supabase/migrations/   banco (rodar no Supabase)
supabase/tests/        testes automáticos das regras do banco (Postgres local)
src/app/               telas (cliente, /painel, /admin) e rotas de API
src/app/api/           Pix, webhook, balcão, equipe, Mercado Pago, cron
src/lib/               conexão com Supabase, Mercado Pago, SMS, formatação
public/                ícones, manifest e service worker (app instalável)
```

Testes do banco (opcional, precisa de Postgres local na porta 5499): `npm run test:db`. São mais de 60 verificações, cobrindo cadastro, pedido, estoque, frete, pontos em dobro, status, Pix, balcão com código, resgate, cancelamento, vencimento e permissões.

---

## 9. Ficou para a versão 2

Estão no protótipo e ainda não estão neste app: campanhas automáticas (cliente sumido, aniversário, “quase lá”), indique um amigo, pedido recorrente, relatórios com gráficos, avaliações e chamados, cobrança automática das mensalidades, integração com ERP e sistema de caixa, avisos por WhatsApp e app nas lojas (Play Store e App Store).
