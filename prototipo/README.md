# Protótipo navegável do DistribPontos

Protótipo clicável com três visões lado a lado: o app do cliente (e do entregador) num celular, o painel da distribuidora e o admin da plataforma. Serve para testar ideias e mostrar o produto antes de programar no app real (pasta `distribpontos-app`).

Para abrir, basta abrir `index.html` no navegador. Não precisa de servidor nem de instalação.

## O que existe no app real e o que é só do protótipo

Onde o app real já tem a função, o protótipo segue as mesmas regras: login por celular e SMS, cadastro com CPF, Pix que expira em 30 minutos, retirada sem a etapa "em rota", cancelamento pelo cliente enquanto o pedido está como recebido e avisos dentro do app.

O que ainda não existe no app real aparece com a etiqueta **Planejado** (ou um ponto laranja no menu do painel).

## Arquivos

Os scripts são carregados em ordem pelo `index.html` e compartilham o mesmo escopo global.

| Arquivo | O que tem |
|---|---|
| `css/base.css` | Cores, fontes e componentes (os mesmos tokens do `globals.css` do app) |
| `css/acabamento.css` | Moldura do celular, menu lateral, quadro de pedidos, roteiro, mapa e demais acabamentos |
| `js/base.js` | Utilitários (máscaras, CPF, formatação), dados de exemplo e estado da demonstração (`S`) |
| `js/cliente.js` | Telas do app do cliente |
| `js/painel.js` | Painel da distribuidora e admin |
| `js/historico.js` | Histórico de vendas de exemplo, estoque, gráficos e relatórios |
| `js/importar.js` | Importação da tabela de preços por planilha |
| `js/acoes.js` | Ações dos botões (`ACT`) e eventos da página |
| `js/realismo.js` | Ilustrações dos produtos, mapa do entregador e avisos em forma de conversa |
| `js/entregador.js` | App do entregador no celular |
| `js/resultado.js` | Página "Resultado do programa" para convencer a distribuidora |
| `js/erros.js` | Casos de erro: estoque que acaba, Pix não pago, endereço não encontrado, contestação de pontos |
| `js/interface.js` | Roteiro de teste, tema claro/escuro e renderização geral |
| `js/inicio.js` | Salvamento do progresso no navegador, reinício e inicialização |

O progresso fica salvo no navegador de quem usa. O botão "Reiniciar demonstração" volta tudo ao começo.
