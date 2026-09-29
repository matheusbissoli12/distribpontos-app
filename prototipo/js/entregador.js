/* App do entregador: o mesmo celular alterna entre o app do cliente e o do entregador */
S.phoneMode='cliente';
S.ent={dist:'d1',nome:'Marcos',tab:'rota',conf:null,falha:null};

const ENT_NAV={rota:'<path d="M5 17h2l3-8h4l2 5h3"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/><path d="M13 6h3"/>',feitas:'<path d="M5 12.5l4.5 4.5L19 7.5"/>'};
const entLista=()=>S.pedidos.filter(o=>o.dist===S.ent.dist&&o.entregador===S.ent.nome&&o.canal==='app');
const telCli=cpf=>S.clientes[cpf]?.cel||'—';
const mapsUrl=o=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(`${o.end.rua}, ${o.end.bairro}, ${cidadeDe(o.end.bairro)}, ES`);

function entCard(o){const cobrar=o.pagStatus!=='pago'&&o.tipo==='compra',pr=o.problema,conf=S.ent.conf===o.id,falha=S.ent.falha===o.id;
  return `<article class="card ecard"><div class="ordh"><b class="num">#${o.id}</b><span class="sub num">chega ~${o.eta||'--:--'}</span></div>
    <div><div class="nm">${esc(cliNome(o.cpf))}</div><div class="sub">${esc(o.end.rua)}${o.end.comp?' · '+esc(o.end.comp):''}, ${esc(o.end.bairro)}</div></div>
    ${mapa(o)}
    ${pr&&!pr.ref?`<div class="alert"><b>Você avisou que não encontrou o endereço.</b> O cliente foi avisado para mandar uma referência.</div>`:''}
    ${pr?.ref?`<div class="gain"><b>Referência do cliente:</b> ${esc(pr.ref)}</div>`:''}
    <div class="sub" style="color:var(--ink)">${itensTxt(o)}</div>
    <div class="${cobrar?'alert':'gain'}">${cobrar?`<b>Cobrar ${fmt(o.total)}</b> · ${PAG[o.pag]}${o.pag==='dinheiro'?'. Leve troco.':''}`:o.tipo==='resgate'?'<b>Troca de pontos:</b> nada a cobrar':'<b>Pix pago:</b> nada a cobrar'}</div>
    <div class="erow"><a class="btn ghost" href="${mapsUrl(o)}" target="_blank" rel="noopener">Abrir no mapa</a><button class="btn ghost" data-a="entTel" data-v="${o.id}">Ligar</button></div>
    ${conf?`<div class="card" style="background:var(--surface2);display:flex;flex-direction:column;gap:8px">
        ${cobrar&&o.pag==='dinheiro'?`<label class="lbl">Valor recebido em dinheiro (R$)<input class="inp big" id="ent-rec" inputmode="decimal" placeholder="${fmt(o.total).replace('R$','').trim()}"></label><div class="sub" id="ent-troco">Informe o valor para calcular o troco.</div>`:cobrar?`<p class="sub" style="margin:0">Passe ${fmt(o.total)} na maquininha antes de confirmar.</p>`:''}
        <div class="erow"><button class="btn ghost" data-a="entConf" data-v="">Voltar</button><button class="btn acc" data-a="entOk" data-v="${o.id}">${cobrar?'Recebi e entreguei':'Confirmar entrega'}</button></div></div>`
      :falha?`<div class="card" style="background:var(--surface2);display:flex;flex-direction:column;gap:8px">
        <label class="lbl">O que aconteceu?<select class="inp" id="ent-mot"><option>Não encontrei o endereço</option><option>Cliente não atende</option><option>Portaria não liberou</option></select></label>
        <div class="erow"><button class="btn ghost" data-a="entFalha" data-v="">Voltar</button><button class="btn" data-a="entAvisa" data-v="${o.id}">Avisar cliente e loja</button></div></div>`
      :`<div class="erow"><button class="btn ghost danger" data-a="entFalha" data-v="${o.id}">Problema</button><button class="btn acc" data-a="entConf" data-v="${o.id}">Entregar</button></div>`}
  </article>`;}

function vEntRota(){const l=entLista().filter(o=>o.status==='em_rota'),prox=S.pedidos.filter(o=>o.dist===S.ent.dist&&o.status==='separando'&&o.entrega==='entrega').length;
  return `<div class="sech"><h2 class="h2">Entregas em rota</h2><span class="sub">${l.length}</span></div>
  ${l.length?l.map(entCard).join(''):`<div class="empty">Nenhuma entrega com você agora.<br>Quando a loja despachar um pedido no seu nome, ele aparece aqui.${prox?`<br><br><b>${prox} ${prox>1?'pedidos estão':'pedido está'} sendo separado${prox>1?'s':''}.</b>`:''}</div>`}`;}
function vEntFeitas(){const l=entLista().filter(o=>o.status==='entregue'&&o.dia==='hoje');
  const rec=o=>o.pagStatus==='pago'&&!o.recebido?null:(o.recebido||o.pag),din=l.filter(o=>rec(o)==='dinheiro').reduce((a,o)=>a+o.total,0);
  const car=l.filter(o=>rec(o)==='cartao').reduce((a,o)=>a+o.total,0);
  return `<div class="card"><h2 class="h2">Acerto do dia</h2><div class="kv"><span>Entregas feitas</span><b class="num">${l.length}</b></div><div class="kv"><span>Dinheiro para devolver à loja</span><b class="num">${fmt(din)}</b></div><div class="kv"><span>Cartão na maquininha</span><b class="num">${fmt(car)}</b></div></div>
  <div class="sech"><h2 class="h2">Entregues hoje</h2></div>
  ${l.length?l.map(o=>`<div class="card ord"><div class="ordh"><b class="num">#${o.id}</b>${stPill('entregue')}</div><div class="sub" style="color:var(--ink)">${esc(cliNome(o.cpf))} · ${esc(o.end?.bairro||'')}</div><div class="sub num">${fmt(o.total)} · ${rec(o)===null?'Pix pago':rec(o)==='cartao'?'recebido no cartão':'recebido em dinheiro'}</div></div>`).join(''):'<div class="empty">Nenhuma entrega concluída hoje.</div>'}`;}

function renderEnt(reset){const el=document.getElementById('phone'),d=S.dists[S.ent.dist],key='ent|'+S.ent.tab,anim=reset&&key!==renderApp.k;renderApp.k=key;
  const opts=Object.values(S.dists).filter(x=>x.status!=='implantacao').flatMap(x=>x.entregadores.map(e=>`<option value="${x.id}|${esc(e)}" ${x.id===S.ent.dist&&e===S.ent.nome?'selected':''}>${esc(e)} · ${esc(x.nome.split(' ').slice(0,2).join(' '))}</option>`)).join('');
  const nRota=entLista().filter(o=>o.status==='em_rota').length;
  el.innerHTML=`<header class="ahead" style="background:var(--frame);color:#fff">${OS()}<div class="row"><div class="min0"><div class="hello">App do entregador ${PL}</div><div class="logo">${esc(S.ent.nome)}</div></div><span class="ptspill" style="background:${d.cor}">${esc(d.nome.split(' ').slice(0,2).join(' '))}</span></div>
    <label class="addrbtn" for="ent-sel"><span>Entrar como</span><select id="ent-sel" class="entsel">${opts}</select></label></header>
  <div class="scr${anim?' enter':''}">${S.ent.tab==='rota'?vEntRota():vEntFeitas()}</div>
  <nav class="nav" style="grid-template-columns:1fr 1fr">${[['rota','Em rota'],['feitas','Feitas hoje']].map(([k,l])=>`<button data-a="entTab" data-v="${k}" class="${S.ent.tab===k?'on':''}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round">${ENT_NAV[k]}</svg>${l}${k==='rota'&&nRota?`<span class="nb num">${nRota}</span>`:''}</button>`).join('')}</nav><i class="homebar"></i>`;}

function renderPhoneMode(){const el=document.getElementById('phonemode');if(!el)return;
  el.innerHTML=`<div class="seg">${[['cliente','App do cliente'],['entregador','App do entregador']].map(([k,l])=>`<button data-a="phoneMode" data-v="${k}" class="${S.phoneMode===k?'on':''}">${l}</button>`).join('')}</div>`;}

/* o celular mostra o app escolhido */
const renderCliente=renderApp;
renderApp=function(reset){renderPhoneMode();return S.phoneMode==='entregador'?renderEnt(reset):renderCliente(reset);};

Object.assign(ACT,{
  phoneMode:v=>{S.phoneMode=v;S.view='app';render(true)},
  entTab:v=>{S.ent.tab=v;S.ent.conf=S.ent.falha=null;renderApp(true)},
  entTel:v=>{const o=S.pedidos.find(x=>x.id==v);toast(`Cliente: ${telCli(o.cpf)} (no app real, o botão abre a ligação)`)},
  entConf:v=>{S.ent.conf=v?+v:null;S.ent.falha=null;renderApp()},
  entFalha:v=>{S.ent.falha=v?+v:null;S.ent.conf=null;renderApp()},
  entOk:v=>{const o=S.pedidos.find(x=>x.id==v);
    if(o.pagStatus!=='pago'&&o.tipo==='compra'){
      if(o.pag==='dinheiro'){const r=num(val('ent-rec'));if(!(r>=o.total-0.001))return toast(`Informe o valor recebido (mínimo ${fmt(o.total)}).`);o.troco=r-o.total;}
      o.recebido=o.pag;}
    S.ent.conf=null;ACT.avancar(o.id);toast(`#${o.id} entregue${o.troco?` · troco de ${fmt(o.troco)}`:''}`);},
  entAvisa:v=>{const o=S.pedidos.find(x=>x.id==v),mot=val('ent-mot'),d=S.dists[o.dist];
    o.problema={tipo:mot,hora:hhmm(S.clock),ref:''};S.ent.falha=null;
    notify(o.cpf,`${d.nome}: o entregador ${o.entregador} avisou "${mot}" no pedido #${o.id}. Mande uma referência pelo app para ele chegar até você.`);
    render();toast('Cliente e loja avisados. A referência do cliente aparece aqui.');},
  enviarRef:v=>{const o=S.pedidos.find(x=>x.id==v),r=val('ref-'+v).trim();if(r.length<4)return toast('Escreva uma referência, por exemplo: portão azul ao lado da padaria.');
    o.problema.ref=r;render();toast('Referência enviada ao entregador');}
});
document.addEventListener('change',e=>{if(e.target.id!=='ent-sel')return;const [d,nm]=e.target.value.split('|');S.ent={...S.ent,dist:d,nome:nm,conf:null,falha:null};renderApp(true);});
document.addEventListener('input',e=>{if(e.target.id!=='ent-rec')return;const o=S.pedidos.find(x=>x.id===S.ent.conf),r=num(e.target.value),el=document.getElementById('ent-troco');
  if(el&&o)el.textContent=r>=o.total?`Troco: ${fmt(r-o.total)}`:r>0?`Faltam ${fmt(o.total-r)}`:'Informe o valor para calcular o troco.';});
