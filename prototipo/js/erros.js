/* Casos de erro: o que acontece quando algo dá errado no caminho */

/* ---------- estoque acaba entre montar o carrinho e enviar ---------- */
function faltas(){const pm=PM();return cartItems().filter(x=>x.qty>(pm[x.id]?.estoque??0)).map(x=>({id:x.id,nome:pm[x.id].nome,restam:pm[x.id].estoque,qty:x.qty}));}
const vCarrinhoBase=vCarrinho;
vCarrinho=function(){const h=vCarrinhoBase();if(!S.cartErr)return h;
  const box=S.cartErr.tipo==='estoque'?`<div class="err" style="display:flex;flex-direction:column;gap:8px"><span><b>Alguns itens acabaram enquanto você montava o carrinho.</b></span>${S.cartErr.itens.map(i=>`<span>${esc(i.nome)}: você pediu ${i.qty}, ${i.restam?`restam ${i.restam}`:'esgotou'}.</span>`).join('')}<button class="sbtn" style="align-self:flex-start" data-a="ajustarCarrinho">Ajustar o carrinho ao estoque</button></div>`
    :`<div class="alert"><b>${esc(S.cartErr.msg)}</b></div>`;
  return h.replace('</h2>','</h2>'+box);};

/* ---------- Pix não pago em 30 minutos ---------- */
const vPixBase=vPix;
vPix=function(){return vPixBase()+`<button class="btn ghost danger" data-a="pixExpira">Simular: Pix não pago em 30 minutos</button>`;};

/* ---------- contestação de pontos ---------- */
const vPontosBase=vPontos;
vPontos=function(){const h=vPontosBase();if(!S.pwal)return h;const d=S.dists[S.pwal],w=W(d.id,S.sess);
  const meus=S.chamados.filter(c=>c.cpf===S.sess&&c.dist===d.id&&!c.pedido);
  const box=`<div class="card"><h2 class="h2">Faltou ponto em alguma compra? ${PL}</h2>
    ${S.contest?`<div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">
      <label class="lbl">O que aconteceu<select class="inp" id="ct-tipo"><option>Comprei na loja e o ponto não entrou</option><option>Pedido entregue sem pontos</option></select></label>
      <label class="lbl">Nº do cupom fiscal ou do pedido<input class="inp" id="ct-ref" placeholder="Ex.: 004388"></label>
      <label class="lbl">Valor da compra (R$)<input class="inp" id="ct-valor" inputmode="decimal" placeholder="0,00"></label>
      <label class="lbl">Quando foi<input class="inp" id="ct-data" placeholder="Ex.: ontem, por volta das 18h"></label>
      <div class="erow"><button class="btn ghost" data-a="contestar" data-v="0">Cancelar</button><button class="btn" data-a="contestEnviar">Enviar para a loja</button></div>
      <p class="sub" style="margin:0">A loja confere a compra e credita os pontos. A resposta aparece aqui e nos avisos.</p></div>`
    :`<p class="sub" style="margin:4px 0 8px">Mande os dados da compra e a ${esc(d.nome)} confere.</p><button class="btn ghost" data-a="contestar" data-v="1">Contestar pontos</button>`}
    ${meus.map(c=>`<div class="${c.status==='aberto'?'alert':'gain'}" style="margin-top:8px"><b>${c.status==='aberto'?'Em análise':'Resolvido'}:</b> ${esc(c.msg)}${c.resposta?`<br>Resposta da loja: ${esc(c.resposta)}${c.comp?` · +${n(c.comp)} pts`:''}`:''}</div>`).join('')}</div>`;
  return h+box;};

/* ---------- ações ---------- */
const enviarBase=ACT.enviar;
Object.assign(ACT,{
  enviar:()=>{const f=faltas();if(f.length){S.cartErr={tipo:'estoque',itens:f};return renderApp();}S.cartErr=null;return enviarBase();},
  ajustarCarrinho:()=>{const pm=PM();Object.keys(S.cart.items).forEach(id=>{const e=pm[id]?.estoque||0;if(e<=0)delete S.cart.items[id];else S.cart.items[id]=Math.min(S.cart.items[id],e);});
    if(!Object.keys(S.cart.items).length)S.cart.dist=null;S.cartErr=null;renderApp();toast('Carrinho ajustado ao estoque da loja');},
  pixExpira:()=>{const o=S.pixPend;if(!o)return;S.pixPend=null;S.atab='carrinho';
    S.cartErr={tipo:'pix',msg:`O Pix do pedido #${o.id} não foi pago em 30 minutos e o pedido foi cancelado. Os itens continuam no carrinho.`};
    notify(o.cpf,`Pedido #${o.id} cancelado: o Pix não foi pago em 30 minutos. O estoque foi liberado.`);renderApp(true);},
  contestar:v=>{S.contest=v==='1';renderApp()},
  contestEnviar:()=>{const d=S.dists[S.pwal],ref=val('ct-ref').trim(),v=num(val('ct-valor')),tipo=val('ct-tipo'),quando=val('ct-data').trim()||'data não informada';
    if(ref.length<3)return toast('Informe o número do cupom ou do pedido.');if(!(v>0))return toast('Informe o valor da compra.');
    const pts=ptsValor(d.id,v,W(d.id,S.sess));
    S.chamados.unshift({id:'ch'+Date.now().toString(36),dist:d.id,cpf:S.sess,pedido:null,tipo:'Pontos não creditados',msg:`${tipo} · cupom/pedido ${ref} · ${fmt(v)} · ${quando}`,status:'aberto',hora:now(),pts});
    S.contest=false;render();toast(`Enviado para a ${d.nome}. Você deve receber ${n(pts)} pts se a compra for confirmada.`);},
  erroGo:v=>{ERROS[+v].go();render(true);const tgt=document.getElementById(S.view==='app'?'phone':'panel');if(window.matchMedia('(max-width:1100px)').matches)tgt?.scrollIntoView({behavior:'smooth',block:'start'});}
});
['add','sub'].forEach(k=>{const f=ACT[k];ACT[k]=(v,b)=>{S.cartErr=null;return f(v,b);};});

/* ---------- atalhos no roteiro ---------- */
function prepCliente(){S.phoneMode='cliente';S.view='app';S.showTermos=false;S.editEnd=false;if(!S.sess){S.sess='52998224725';S.auth=resetAuth();}if(!aberta(S.dists.d1))S.clock=650;}
const ERROS=[
  {t:'Produto acaba no carrinho',d:'Outro cliente leva o último gelo antes de você enviar.',go:()=>{prepCliente();const p=PM()['d1-cn1'];p.estoque=Math.max(p.estoque,3);S.cart={dist:'d1',items:{'d1-cn1':3}};S.cartErr=null;p.estoque=1;S.atab='carrinho';S.pag='dinheiro';toast('Simulado: sobrou só 1 saco de gelo. Tente enviar o pedido.');}},
  {t:'Pix não pago',d:'O cliente gera o Pix e não paga em 30 minutos.',go:()=>{prepCliente();const p=PM()['d1-cv1'];p.estoque=Math.max(p.estoque,12);S.cart={dist:'d1',items:{'d1-cv1':12}};S.cartErr=null;S.pag='pix';S.entrega='retirada';if(!S.endAtual)S.endAtual={retirada:true};S.atab='carrinho';ACT.enviar();}},
  {t:'Entregador não acha o endereço',d:'O entregador avisa pelo app e o cliente manda uma referência.',go:()=>{S.view='app';S.phoneMode='entregador';const o=S.pedidos.find(x=>x.status==='em_rota'&&x.entrega==='entrega'&&x.entregador);
    if(!o)return toast('Não há entrega em rota. Despache um pedido no painel primeiro.');S.ent={dist:o.dist,nome:o.entregador,tab:'rota',conf:null,falha:o.id};}},
  {t:'Cliente contesta pontos',d:'Uma compra na loja não gerou pontos e o cliente pede revisão.',go:()=>{prepCliente();S.atab='pontos';S.pwal=S.w[`d1:${S.sess}`]?'d1':(myWallets()[0]?.dist||'d1');W(S.pwal,S.sess);S.contest=true;}}
];
function errosHTML(){return `<div class="gerr"><b>Casos de erro</b><div class="gerrs">${ERROS.map((e,i)=>`<button data-a="erroGo" data-v="${i}"><span>${e.t} ›</span><small>${e.d}</small></button>`).join('')}</div></div>`;}
