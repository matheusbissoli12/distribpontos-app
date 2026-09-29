/* Troca de pontos pelo carrinho: o prêmio entra no carrinho e o cliente escolhe entrega ou retirada antes de confirmar */

const premMap=()=>S.cart.premios||(S.cart.premios={});
const premiosDe=dist=>dist?S.dists[dist].premios:[];
function premList(){const ps=premiosDe(S.cart.dist);return Object.entries(S.cart.premios||{}).map(([id,qty])=>({r:ps.find(x=>x.id===id),qty})).filter(x=>x.r&&x.qty>0);}
const premCount=()=>premList().reduce((a,x)=>a+x.qty,0);
const premPts=()=>premList().reduce((a,x)=>a+x.qty*x.r.custo,0);
const premQty=id=>(S.cart.premios||{})[id]||0;

function premListHTML(){return `<div class="list">${premList().map(({r,qty})=>`<div class="prod"><div class="tile art" style="--h:${(CAT[r.cat]||CAT.Outros).h}">${prodArt(r)}</div>
  <div><div class="pname">${esc(r.nome)}</div><div class="pmeta"><span class="tag rs">Prêmio</span></div><div class="price num"><span class="minus">${n(r.custo*qty)} pts</span></div></div>
  <div class="step"><button data-a="premSub" data-v="${r.id}" aria-label="Remover um">−</button><span class="num">${qty}</span><button data-a="premAdd" data-v="${r.id}" aria-label="Adicionar um">+</button></div></div>`).join('')}</div>`;}

function receberHTML(d,a,gratis){return `<div class="sub" style="font-weight:600;color:var(--ink)">Receber como</div>
  <div class="opts">
    <button class="opt ${S.entrega==='entrega'?'on':''}" data-a="entrega" data-v="entrega" ${a?'':'disabled'}>Entrega<small>${a?`${gratis?'Sem custo':a.frete?fmt(a.frete):'Grátis'} · ${esc(d.prazo)}`:S.endAtual&&!S.endAtual.retirada?'Fora da área':'Informe o endereço'}</small></button>
    <button class="opt ${S.entrega==='retirada'?'on':''}" data-a="entrega" data-v="retirada">Retirar na loja<small>${esc(d.bairro)}</small></button>
  </div>
  ${!S.endAtual||S.endAtual.retirada?`<button class="btn ghost" style="margin-top:8px" data-a="editEnd">Informar endereço de entrega</button>`:''}
  ${S.entrega==='entrega'&&S.endAtual&&!S.endAtual.retirada?`<p class="sub" style="margin:8px 0 0">Entregar em: ${esc(S.endAtual.rua)}${S.endAtual.comp?' · '+esc(S.endAtual.comp):''}, ${esc(S.endAtual.bairro)}</p>`:''}`;}

/* carrinho só com prêmios */
function vCarrinhoPremios(){const d=S.dists[S.cart.dist],w=W(d.id,S.sess),tot=premPts(),a=area(d,endB());if(!a)S.entrega='retirada';
  return `<h2 class="h2">Carrinho · ${esc(d.nome)}</h2>
  ${premListHTML()}
  <div class="card">${receberHTML(d,a,true)}</div>
  <div class="card num">
    <div class="line"><span>Seu saldo na ${esc(d.nome.split(' ').slice(0,2).join(' '))}</span><span>${n(w.saldo)} pts</span></div>
    <div class="line"><span>Prêmios</span><span class="minus">−${n(tot)} pts</span></div>
    <div class="line total"><span>Saldo depois da troca</span><span>${n(w.saldo-tot)} pts</span></div>
  </div>
  ${w.saldo<tot?`<div class="err">Faltam ${n(tot-w.saldo)} pts para esta troca. Tire um prêmio do carrinho.</div>`:''}
  <button class="btn ghost" data-a="abrirDist" data-v="${d.id}">Levar produtos junto</button>
  <button class="btn acc" data-a="enviar" ${w.saldo<tot?'disabled':''}>Confirmar troca · ${n(tot)} pts</button>`;}

/* carrinho com produtos e prêmios: acrescenta os prêmios ao carrinho normal */
const vCarrinhoAntes=vCarrinho;
vCarrinho=function(){
  if(!premCount()){return vCarrinhoAntes();}
  if(!cartItems().length)return vCarrinhoPremios();
  const tot=premPts(),w=W(S.cart.dist,S.sess);
  return vCarrinhoAntes()
    .replace('<div class="card"><div class="sub" style="font-weight:600;color:var(--ink)">Receber como</div>',`<p class="groupt">Prêmios com pontos</p>${premListHTML()}<div class="card"><div class="sub" style="font-weight:600;color:var(--ink)">Receber como</div>`)
    .replace('<div class="line total">',`<div class="line"><span>Prêmios (${premCount()})</span><span class="minus">−${n(tot)} pts</span></div><div class="line total">`)
    .replace('<button class="btn acc" data-a="enviar"',`${w.saldo<tot?`<div class="err">Faltam ${n(tot-w.saldo)} pts para os prêmios do carrinho.</div>`:''}<button class="btn acc" data-a="enviar"`);};

/* cria os pedidos de resgate e desconta os pontos */
function criarResgates(pr,dist,compra){const d=S.dists[dist],w=W(dist,S.sess),ids=[];
  const entrega=compra?compra.entrega:S.entrega==='entrega'&&S.endAtual&&!S.endAtual.retirada&&area(d,S.endAtual.bairro)?'entrega':'retirada';
  const end=compra?compra.end:entrega==='entrega'?{...S.endAtual}:null;
  pr.forEach(({r,qty})=>{for(let i=0;i<qty;i++){w.saldo-=r.custo;const id=++S.seq;ids.push(id);
    w.extrato.unshift({d:'hoje',desc:'Resgate · '+r.nome,pts:-r.custo});
    if(w.vencendo){w.vencendo.pts-=Math.min(w.vencendo.pts,r.custo);if(w.vencendo.pts<=0)w.vencendo=null;}
    criarPedido({id,dist,cpf:S.sess,canal:'app',tipo:'resgate',itensTxt:r.nome+(compra?` · vai junto com o pedido #${compra.id}`:''),total:0,pts:r.custo,status:'novo',hora:now(),dia:'hoje',entrega,end,junto:compra?.id||null});}});
  notify(S.sess,`Troca confirmada na ${d.nome}: ${pr.map(x=>`${x.qty}× ${x.r.nome}`).join(', ')} (−${n(pr.reduce((a,x)=>a+x.qty*x.r.custo,0))} pts). ${entrega==='entrega'?'Vai na entrega.':'Retire na loja.'}`);
  return ids;}

const enviarAntes=ACT.enviar,pixOkAntes=ACT.pixOk,addAntes=ACT.add;
Object.assign(ACT,{
  resgatar:v=>{const d=S.dists[S.pwal],r=d.premios.find(x=>x.id===v),w=W(d.id,S.sess);
    if(S.cart.dist&&S.cart.dist!==d.id&&(cartItems().length||premCount())){S.cart={dist:null,items:{}};toast('O carrinho aceita uma distribuidora por vez. Começamos um novo.');}
    S.cart.dist=d.id;const res=premPts();if(w.saldo-res<r.custo)return toast(`Faltam ${n(r.custo-(w.saldo-res))} pts para este prêmio.`);
    premMap()[v]=premQty(v)+1;S.cartErr=null;if(!(S.endAtual&&!S.endAtual.retirada&&area(d,S.endAtual.bairro)))S.entrega='retirada';
    S.atab='carrinho';renderApp(true);toast(`${r.nome} no carrinho. Escolha entrega ou retirada e confirme.`);},
  premAdd:v=>{const d=S.dists[S.cart.dist],r=d.premios.find(x=>x.id===v),w=W(d.id,S.sess);if(w.saldo-premPts()<r.custo)return toast('Seus pontos não dão para mais um.');premMap()[v]=premQty(v)+1;renderApp();},
  premSub:v=>{const m=premMap();if(--m[v]<=0)delete m[v];if(!cartItems().length&&!premCount())S.cart={dist:null,items:{}};renderApp();},
  add:(v,b)=>{const p=PM()[v];if(S.cart.dist&&S.cart.dist!==p.dist&&premCount()){S.cart={dist:null,items:{}};toast('O carrinho aceita uma distribuidora por vez. Começamos um novo.');}return addAntes(v,b);},
  enviar:()=>{const pr=premList(),tot=premPts();
    if(!cartItems().length){if(!pr.length)return;const d=S.dists[S.cart.dist],w=W(d.id,S.sess);
      if(w.saldo<tot)return toast('Pontos insuficientes para esta troca.');
      if(S.entrega==='entrega'&&!(S.endAtual&&!S.endAtual.retirada&&area(d,S.endAtual.bairro)))return toast('Informe um endereço atendido pela loja ou escolha retirar.');
      const ids=criarResgates(pr,d.id,null);S.cart={dist:null,items:{}};S.atab='pedidos';S.pd=d.id;S.ptab='pedidos';render(true);
      return toast(`Troca confirmada · pedido${ids.length>1?'s':''} #${ids.join(', #')} · −${n(tot)} pts`);}
    if(pr.length&&W(S.cart.dist,S.sess).saldo<tot)return toast('Pontos insuficientes para os prêmios do carrinho.');
    const seq=S.seq;enviarAntes();
    if(S.pixPend||!pr.length||S.seq===seq)return;
    const o=S.pedidos.find(x=>x.id===seq+1);if(o&&o.tipo==='compra'){criarResgates(pr,o.dist,o);render(true);toast(`Pedido #${o.id} enviado com ${pr.length>1?'os prêmios':'o prêmio'} (−${n(tot)} pts)`);}},
  pixOk:()=>{const pr=premList(),o=S.pixPend;pixOkAntes();if(o&&pr.length){criarResgates(pr,o.dist,o);render(true);}}
});
