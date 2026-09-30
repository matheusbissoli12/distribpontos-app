# DistribPontos — app nativo (celular e desktop)

Um só código (Expo + React Native) gera:

| Onde | O que abre | Como roda |
|---|---|---|
| **Celular** (Android e iPhone) | App do cliente (lojas, carrinho, pedidos, pontos, perfil). O painel da distribuidora também funciona, pelo link "Acesse o painel". | Expo Go para testar; App Store e Google Play via EAS |
| **Desktop** (Windows e Mac) | Painel da distribuidora e Admin | Programa instalável feito com Electron (pasta `desktop/`) |

O backend continua sendo o mesmo: **Supabase** (banco, login, tempo real) e as **rotas de API do Next.js** da pasta `../distribpontos-app` publicadas na Vercel (Pix, balcão, convites de equipe, cadastro de distribuidora). O app nativo envia o login para essas rotas com `Authorization: Bearer`.

## 1. Configurar

```bash
npm install
```

Copie `.env.example` para `.env` e preencha:

- `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY`: os mesmos do site (Supabase › Project Settings › API).
- `EXPO_PUBLIC_API_URL`: endereço onde o Next.js está publicado (ex.: `https://app.suaempresa.com.br`). Sem ele, o app funciona, mas Pix, balcão, convites e cadastro de distribuidoras mostram "Servidor não configurado".
- `EXPO_PUBLIC_EMPRESA_*`: dados que aparecem em Termos e privacidade.

## 2. Testar no celular com Expo Go

1. Instale o **Expo Go** no celular (Play Store / App Store).
2. No computador, na pasta `nativo`:
   ```bash
   npx expo start
   ```
3. Leia o QR code com o Expo Go (Android) ou com a câmera (iPhone). Celular e computador precisam estar no mesmo Wi-Fi (se não der, use `npx expo start --tunnel`).

Login do cliente é por SMS. Para testar sem gastar SMS, cadastre um número de teste no Supabase (Authentication › Providers › Phone › Test OTPs), como explicado no README do site.

## 3. App de desktop (Windows / Mac)

```bash
cd desktop && npm install && cd ..
npm run desktop          # gera o build e abre o app
npm run desktop:build    # gera o instalador em desktop/release/
```

O instalador do Windows (`.exe`) sai no Windows; o do Mac (`.dmg`) precisa ser gerado num Mac. O `.env` é embutido no momento do build: gere de novo sempre que mudar as variáveis.

## 4. Publicar nas lojas (EAS)

Precisa de conta Expo (grátis), Apple Developer (US$ 99/ano) e Google Play Console (US$ 25 uma vez).

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile production
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform android
npx eas-cli@latest submit --platform ios
```

Antes, confira em `app.json` o nome, o `bundleIdentifier`/`package` (`br.com.distribpontos.app`) e os ícones em `assets/`. As variáveis do `.env` precisam estar cadastradas no EAS (`eas env:create`) para os builds na nuvem.

## Pendências conhecidas

- **Pix/Mercado Pago e mapas**: as chamadas já existem e usam o backend, mas o fluxo ainda não foi revisado para o app.
- **Convite e "Esqueci minha senha" da equipe**: o link do e-mail abre a página de criar senha do site (`/painel/senha`). Depois de criar, a pessoa entra no app com e-mail e senha.
- **Notificações push** de pedido novo: hoje o painel avisa com som ou vibração enquanto está aberto.

## Estrutura

```
src/app/            telas (Expo Router: cada arquivo é uma rota)
  index.tsx         lojas (no desktop, redireciona para /painel)
  d/[id].tsx        loja     carrinho.tsx   pedido/[id].tsx   pedidos.tsx
  pontos/           carteiras e prêmios     perfil.tsx  avisos.tsx
  entrar.tsx cadastro.tsx termos.tsx
  painel/           login, lista de lojas e painel da loja ([id]/…)
  admin.tsx         admin da plataforma
src/components/     visual (ui.tsx), casca do cliente, painel, sessão
src/lib/            Supabase, carrinho, formatação, regras de horário/frete, tema
desktop/            Electron (main.js) e configuração do instalador
```
