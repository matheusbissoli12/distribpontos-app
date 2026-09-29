/* Painel da distribuidora e admin da plataforma */
/* ================= DISTRIBUIDORA ================= */
const D=()=>S.dists[S.pd];
const distWs=d=>Object.values(S.w).filter(w=>w.dist===d.id);
function pdvLookup(){
  const c=dig(S.pdv.cpf),d=S.pd;
  if(c.length<11)return `<div class="lookup">Digite os 11 números do CPF que o cliente informar.</div>`;
  if(!cpfValid(c))return `<div class="lookup bad">CPF inválido. Confira os números com o cliente.</div>`;
  const cl=S.clientes[c],w=hasW(d,c)?W(d,c):null;
  if(cl&&cl.cadastrado){const ww=w||{saldo:0};const prem=S.dists[d].premios.filter(r=>r.ativo&&r.custo<=ww.saldo);
    return `<div class="lookup ok"><b>${esc(cl.nome)}</b>${cl.obs?' · '+esc(cl.obs):''} · cliente do app · ${celHide(cl.cel)}<br>${w?`Saldo aqui: <b class="num">${n(w.saldo)} pts</b> · nível ${tier(d,w).n}`:'Primeira compra nesta distribuidora'}</div>
    ${prem.length?`<div class="rgrid"><span class="sub">Pode trocar agora no balcão:</span>${prem.map(r=>`<div><span>${esc(r.nome)} · <b class="num">${n(r.custo)} pts</b></span><button class="abtn ghost" data-a="resgBalcao" data-v="${r.id}">Resgatar</button></div>`).join('')}</div>`:''}`;}
  return `<div class="lookup new">CPF sem cadastro no app${w?` · já tem <b class="num">${n(w.saldo)} pts</b> guardados`:''}. Informe o celular para enviar o código. Os pontos ficam guardados até o cliente criar a conta.</div>
  <label class="lbl">Celular do cliente<input id="pdv-cel" inputmode="tel" placeholder="(27) 99999-9999" value="${esc(S.pdv.cel)}"></label>`;
}
function pdvPreview(){const c=dig(S.pdv.cpf),v=num(S.pdv.valor);
  if(!cpfValid(c)||!(v>0))return 'Informe CPF válido e valor da compra.';
  return `Cliente ganha <b class="num">+${n(ptsValor(S.pd,v,W(S.pd,c)))} pts</b> nesta compra.`;}
function orow(o,mode){const w=W(o.dist,o.cpf),d=S.dists[o.dist];
  const payTxt=o.tipo==='resgate'?'':o.pagStatus==='pago'?' · <b style="color:var(--ok)">Pix pago</b>':` · cobrar na entrega (${PAG[o.pag]})`;
  let acts=stPill(o.status);
  if(NEXT[o.status]&&(mode!=='entregador'||o.status==='em_rota')){
    if(o.status==='separando')acts+=`<select class="sel" id="ent-${o.id}" aria-label="Entregador">${d.entregadores.map(e=>`<option>${esc(e)}</option>`).join('')}</select>`;
    acts+=`<button class="abtn" data-a="avancar" data-v="${o.id}">${NEXT[o.status]}</button>`;}
  if(o.status==='novo'&&S.role==='dono')acts+=`<button class="lbtn" data-a="cancelar" data-v="${o.id}">Cancelar</button>`;
  return `<div class="orow ${S.fresh===o.id?'fresh':''}">
    <div><b class="num">#${o.id}</b><div class="sub num">${o.hora}${o.dia==='ontem'?' · ontem':''}</div></div>
    <div><div class="who">${esc(cliNome(o.cpf))}</div><div style="display:flex;gap:5px;margin-top:3px;flex-wrap:wrap;align-items:center"><span class="mono sub">${cpfHide(o.cpf)}</span>${o.tipo==='resgate'?'<span class="tag rs">Resgate</span>':''}${o.recorr?'<span class="tag bl">Programado</span>':''}${tierPill(o.dist,w)}</div></div>
    <div class="items">${itensTxt(o)}<br>${o.entrega==='retirada'?'Retirada na loja':esc(o.end?`${o.end.rua}, ${o.end.bairro}`:'Entrega')}${payTxt}${o.entregador&&o.status!=='entregue'?` · ${esc(o.entregador)}, chega ~${o.eta}`:''}</div>
    <div class="val num">${o.tipo==='resgate'?`<b>${n(o.pts)} pts</b><small style="color:var(--accent)">troca de pontos</small>`:`<b>${fmt(o.total)}</b><small>+${n(o.pts)} pts</small>`}</div>
    <div class="acts">${acts}</div></div>`;}
function vBalcao(){
  const d=D(),l=S.pedidos.filter(o=>o.dist===d.id&&o.canal==='balcao'),p=S.pdvPend;
  const form=p?`<div class="box"><h3 class="h2">Confirmação do cliente</h3>
      <p class="sub" style="margin:0">Enviamos um código para ${celHide(p.cel)} ${isCad(p.cpf)?'(WhatsApp e app)':'(SMS)'}. Peça ao cliente para dizer o código.</p>
      <div class="lookup"><b>${esc(cliNome(p.cpf))}</b> · ${cpfFmt(p.cpf)}<br>Compra de <b class="num">${fmt(p.valor)}</b> → <b class="num">+${n(p.pts)} pts</b></div>
      <label class="lbl">Código de 4 dígitos<input id="pdv-cod" inputmode="numeric" maxlength="4" placeholder="0000"></label>
      <div class="hint">Protótipo: o código enviado foi <b class="mono">${p.code}</b></div>
      <div style="display:flex;gap:8px"><button class="btn ghost" data-a="pdvCancel">Cancelar</button><button class="btn acc" data-a="pdvConfirma">Confirmar e lançar</button></div></div>`
    :`<div class="box">
    <h3 class="h2">Lançar compra da loja física</h3>
    ${d.integ.pdv?`<div class="gain">Caixa integrado: as vendas com CPF na nota chegam aqui sozinhas.</div><button class="btn ghost" data-a="pdvSim">Simular venda vinda do caixa</button>`:''}
    <label class="lbl">CPF do cliente<input id="pdv-cpf" inputmode="numeric" autocomplete="off" placeholder="000.000.000-00" value="${maskCpf(S.pdv.cpf)}"></label>
    <div id="pdv-look">${pdvLookup()}</div>
    <label class="lbl">Valor da compra (R$)<input id="pdv-valor" inputmode="decimal" placeholder="0,00" value="${esc(S.pdv.valor)}"></label>
    <label class="lbl">Nº do cupom fiscal (opcional)<input id="pdv-cupom" autocomplete="off" value="${esc(S.pdv.cupom)}"></label>
    <div class="gain" id="pdv-prev">${pdvPreview()}</div>
    <button class="btn acc" data-a="lancar">Enviar código de confirmação</button></div>`;
  return `<div class="pdv">${form}
  <div class="box"><h3 class="h2">Lançamentos no balcão</h3>
    ${l.length?l.map(o=>`<div class="ext num"><span><b>${esc(cliNome(o.cpf))}</b><br><span class="sub">${o.hora} · ${o.tipo==='resgate'?'Resgate: '+esc(o.itensTxt):fmt(o.total)+(o.cupom?' · cupom '+esc(o.cupom):'')}${o.confirmado?' · confirmado pelo cliente':''}</span></span><span class="${o.tipo==='resgate'?'minus':'plus'}">${o.tipo==='resgate'?'−':'+'}${n(o.pts)}</span></div>`).join(''):'<p class="sub">Nenhum lançamento hoje.</p>'}
    <div class="note">Cada lançamento só vale depois que o cliente confirma o código recebido no celular. Isso impede que alguém lance pontos no próprio CPF.</div>
  </div></div>`;
}
const IMP_EX='nome;categoria;unidade;preço;estoque\nCerveja Pilsen 600ml;Cervejas;garrafa;8,90;48\nRefrigerante Limão 2L;Refrigerantes;garrafa;8,49;30\nÁgua com gás 500ml;Águas;garrafa;2,80;60\nSuco de uva 1L;Outros;garrafa;;12';
function vCatalogo(){
  const l=S.produtos.filter(p=>p.dist===S.pd),baixo=l.filter(p=>p.ativo&&p.estoque<=5);
  return `${baixo.length?`<div class="alert"><b>Estoque baixo:</b> ${baixo.map(p=>`${esc(p.nome)} (${p.estoque})`).join(', ')}. Itens com estoque 0 aparecem como esgotados no app.</div>`:''}
  <p class="sec">Adicionar produto</p>
  <div class="frm" style="grid-template-columns:2fr 1.2fr 1fr .8fr .7fr auto">
    <label class="lbl">Nome do produto<input id="np-nome" placeholder="Ex.: Cerveja Pilsen 600ml"></label>
    <label class="lbl">Categoria<select id="np-cat">${Object.keys(CAT).map(c=>`<option>${c}</option>`).join('')}</select></label>
    <label class="lbl">Unidade<input id="np-un" placeholder="garrafa, fardo 12"></label>
    <label class="lbl">Preço (R$)<input id="np-preco" inputmode="decimal" placeholder="0,00"></label>
    <label class="lbl">Estoque<input id="np-est" inputmode="numeric" placeholder="0"></label>
    <button class="abtn acc" style="padding:10px 14px" data-a="addProd">Adicionar</button>
  </div>
  ${impCard()}
  <p class="sec">Catálogo (${l.length} produtos)</p>
  <div class="tbl"><table><thead><tr><th>Produto</th><th>Categoria</th><th>Unidade</th><th class="r">Preço</th><th class="r">Estoque</th><th>No app</th></tr></thead><tbody>
  ${l.map(p=>`<tr><td><b>${esc(p.nome)}</b></td><td>${p.cat}</td><td>${esc(p.un)}</td><td class="r"><input class="costin num" id="pp-${p.id}" inputmode="decimal" value="${p.preco.toFixed(2).replace('.',',')}" data-preco="${p.id}" aria-label="Preço de ${esc(p.nome)}"></td>
  <td class="r"><input class="costin num" style="width:70px;${p.estoque<=5?'border-color:var(--warn);color:var(--warn)':''}" id="pe-${p.id}" inputmode="numeric" value="${p.estoque}" data-est="${p.id}" aria-label="Estoque de ${esc(p.nome)}"></td>
  <td><button class="pill ${p.ativo?'st-entregue':'st-cancelado'}" data-a="prodAtivo" data-v="${p.id}">${p.ativo?'Visível':'Oculto'}</button></td></tr>`).join('')||'<tr><td colspan="6" class="sub">Nenhum produto ainda.</td></tr>'}
  </tbody></table></div>`;
}
function vClientesD(){
  const d=D(),l=distWs(d).sort((a,b)=>b.acumulado-a.acumulado);
  return `<div class="tbl"><table style="min-width:760px"><thead><tr><th>Cliente</th><th>CPF</th><th>Nível</th><th class="r">Saldo</th><th class="r">Acum. 12m</th><th>Última compra</th><th>Aniversário</th><th>Status</th></tr></thead><tbody>
  ${l.map(w=>{const c=S.clientes[w.cpf];return `<tr><td><b>${esc(cliNome(w.cpf))}</b>${w.bonus2x?' <span class="tag rs">2× ativo</span>':''}</td><td class="mono">${cpfHide(w.cpf)}</td><td>${tierPill(w.dist,w)}</td><td class="r num">${n(w.saldo)}</td><td class="r num">${n(w.acumulado)}</td>
    <td class="num" style="${w.diasSem>=30?'color:var(--bad);font-weight:600':''}">${w.diasSem?`há ${w.diasSem} dias`:'hoje'}</td><td>${c?.nasc?MESES[+c.nasc-1]:'—'}</td><td>${c&&c.cadastrado?'<span class="tag bl">App</span>':'<span class="tag">Só balcão</span>'}</td></tr>`}).join('')||'<tr><td colspan="8" class="sub">Nenhum cliente com pontos ainda.</td></tr>'}
  </tbody></table></div>
  <div class="note">O CPF aparece mascarado para a distribuidora (LGPD). Clientes “só balcão” ainda não baixaram o app: vale lembrar no atendimento.</div>`;
}
function campAlvo(k,d){const ws=distWs(d).filter(w=>isCad(w.cpf));
  if(k==='sumido')return ws.filter(w=>w.diasSem>=30&&!w.bonus2x);
  if(k==='aniver')return ws.filter(w=>S.clientes[w.cpf].nasc==='09'&&!w.aniverPago);
  if(k==='quase')return ws.filter(w=>d.premios.some(r=>r.ativo&&r.custo>w.saldo&&r.custo-w.saldo<=100));
  return ws.filter(w=>w.vencendo);}
function vCampanhas(){const d=D();
  const C=[['sumido','Cliente sumido','Sem comprar há 30 dias ou mais → ganha pontos em dobro no próximo pedido.'],
    ['aniver','Aniversariante do mês',`Ganha ${n(d.cfg.aniverPts)} pts de presente no mês do aniversário.`],
    ['quase','Quase lá','Faltam até 100 pts para um prêmio → aviso para voltar a comprar.'],
    ['vence','Pontos vencendo','Aviso 15 dias antes de os pontos vencerem.']];
  return `<p class="sub" style="margin:0">As campanhas rodam sozinhas todo dia às 9h e mandam a mensagem pelo WhatsApp. Você também pode disparar agora.</p>
  <div class="auto">${C.map(([k,t,desc])=>{const al=campAlvo(k,d);return `<div class="acard"><div class="ordh"><h4>${t}</h4><button class="sw ${d.camp[k]?'on':''}" data-a="campTog" data-v="${k}"><i></i>${d.camp[k]?'Automática':'Pausada'}</button></div>
    <p class="sub" style="margin:0">${desc}</p>
    <div class="foot"><span class="sub">Alcance hoje: <b style="color:var(--ink)">${al.length} ${al.length===1?'cliente':'clientes'}</b>${al.length?' ('+al.map(w=>esc(S.clientes[w.cpf].nome.split(' ')[0])).join(', ')+')':''}</span><button class="abtn" data-a="campRun" data-v="${k}" ${al.length?'':'disabled'}>Disparar agora</button></div></div>`}).join('')}
  <div class="acard"><h4>Indique um amigo</h4><p class="sub" style="margin:0">Quem indica e quem entra ganham pontos quando o primeiro pedido do novo cliente é entregue.</p>
    <label class="field">Bônus para cada um (pts)<input id="c-ind" type="number" min="0" step="10" value="${d.cfg.indicacao}" data-cfg="indicacao"></label></div>
  <div class="acard"><h4>Histórico de disparos</h4>${d.campLog.length?d.campLog.map(x=>`<div class="ext"><span>${x.t} · ${x.nome}</span><span class="sub">${x.n} enviados</span></div>`).join(''):'<p class="sub" style="margin:0">Nenhum disparo hoje.</p>'}</div></div>`;
}
function vPrograma(){const d=D(),cf=d.cfg,l=S.produtos.filter(p=>p.dist===d.id),venc=distWs(d).filter(w=>w.vencendo);
  return `<p class="sec">Regra de pontuação</p>
  <div class="cfg">
    <label class="field">Pontos por R$ 1,00<input id="c-ppr" type="number" min="0.1" step="0.5" value="${cf.ptsPorReal}" data-cfg="ptsPorReal"></label>
    <label class="field">Nível Prata a partir de (pts/12m)<input id="c-prata" type="number" min="1" step="100" value="${cf.prata}" data-cfg="prata"></label>
    <label class="field">Nível Ouro a partir de (pts/12m)<input id="c-ouro" type="number" min="1" step="100" value="${cf.ouro}" data-cfg="ouro"></label>
    <label class="field">Validade dos pontos (meses)<input id="c-val" type="number" min="1" step="1" value="${cf.validade}" data-cfg="validade"></label>
    <label class="field">Presente de aniversário (pts)<input id="c-aniv" type="number" min="0" step="10" value="${cf.aniverPts}" data-cfg="aniverPts"></label>
  </div>
  <p class="sec">Vencimento</p>
  <div class="box2"><div class="ordh"><span><b class="num">${n(venc.reduce((a,w)=>a+w.vencendo.pts,0))} pts</b> vencem nos próximos 30 dias (${venc.length} clientes)</span><button class="abtn ghost" data-a="vencer" ${venc.length?'':'disabled'}>Simular vencimento</button></div>
    ${venc.map(w=>`<div class="ext"><span>${esc(cliNome(w.cpf))}</span><span class="sub num">${n(w.vencendo.pts)} pts em ${w.vencendo.data}</span></div>`).join('')}
    <p class="sub" style="margin:0">Na versão real, cada ponto vence ${cf.validade} meses depois de ganho, automaticamente, e o cliente recebe aviso 15 dias antes.</p></div>
  <p class="sec">Produtos com pontos em dobro</p>
  <div class="checks">${l.map(p=>{const on=cf.dobro.includes(p.id);return `<button class="check ${on?'on':''}" data-a="dobro" data-v="${p.id}"><i>${on?'✓':''}</i>${esc(p.nome)}</button>`}).join('')||'<p class="sub">Cadastre produtos no catálogo primeiro.</p>'}</div>
  <p class="sec">Prêmios</p>
  <div class="frm" style="grid-template-columns:2fr 1fr 1fr auto">
    <label class="lbl">Nome do prêmio<input id="nr-nome" placeholder="Ex.: Fardo de refrigerante"></label>
    <label class="lbl">Categoria<select id="nr-cat">${Object.keys(CAT).map(c=>`<option>${c}</option>`).join('')}</select></label>
    <label class="lbl">Custo (pts)<input id="nr-custo" inputmode="numeric" placeholder="500"></label>
    <button class="abtn acc" style="padding:10px 14px" data-a="addPremio">Adicionar</button>
  </div>
  <div class="tbl"><table><thead><tr><th>Prêmio</th><th class="r">Custo (pts)</th><th class="r">Gasto p/ ganhar</th><th>Status</th></tr></thead><tbody>
  ${d.premios.map(r=>`<tr><td>${esc(r.nome)}</td><td class="r"><input class="costin num" id="pc-${r.id}" type="number" min="10" step="10" value="${r.custo}" data-pcusto="${r.id}" aria-label="Custo de ${esc(r.nome)}"></td><td class="r num sub">${fmt(r.custo/cf.ptsPorReal)}</td><td><button class="pill ${r.ativo?'st-entregue':'st-cancelado'}" data-a="premioAtivo" data-v="${r.id}">${r.ativo?'Ativo':'Pausado'}</button></td></tr>`).join('')||'<tr><td colspan="4" class="sub">Nenhum prêmio cadastrado.</td></tr>'}
  </tbody></table></div>`;
}
function vAtend(){const d=D(),ch=S.chamados.filter(c=>c.dist===d.id),rated=S.pedidos.filter(o=>o.dist===d.id&&o.nota);
  return `<div class="split"><div class="box2"><h3 class="h2">Chamados dos clientes</h3>
    ${ch.length?ch.map(c=>`<div class="chamado"><div class="ordh"><b>${esc(cliNome(c.cpf))}</b>${stPill(c.status)}</div>
      <div class="sub">${c.pedido?`Pedido #${c.pedido} · `:''}${esc(c.tipo)} · ${c.hora}</div><div>${esc(c.msg)}</div>
      ${c.status==='aberto'?`<textarea class="txt" id="resp-${c.id}" placeholder="Resposta para o cliente">${c.pedido?'Desculpe pelo problema! Vamos enviar o item que faltou na próxima entrega.':'Conferimos a compra e creditamos os pontos que faltaram.'}</textarea>
        <div class="ordh"><label class="sub" style="display:flex;gap:6px;align-items:center">Compensação<input class="costin" id="comp-${c.id}" inputmode="numeric" value="${c.pts||50}"> pts</label><button class="abtn" data-a="resolver" data-v="${c.id}">Responder e resolver</button></div>`
      :`<div class="gain">Resposta: ${esc(c.resposta)}${c.comp?` · +${n(c.comp)} pts`:''}</div>`}</div>`).join(''):'<p class="sub">Nenhum chamado. Os clientes abrem pelo app, em Pedidos.</p>'}</div>
  <div class="box2"><div class="ordh"><h3 class="h2">Avaliações</h3><span class="rate" style="font-size:18px">★ ${nota(d)} <span class="sub">(${n(d.rating.n)})</span></span></div>
    ${rated.map(o=>`<div class="review"><span class="rate">${'★'.repeat(o.nota)}${'☆'.repeat(5-o.nota)}</span> · <b>${esc(cliNome(o.cpf).split(' ')[0])}</b> · pedido #${o.id}</div>`).join('')}
    ${d.reviews.map(([nm,k,t])=>`<div class="review"><span class="rate">${'★'.repeat(k)}${'☆'.repeat(5-k)}</span> · <b>${esc(nm)}</b><br>${esc(t)}</div>`).join('')||(rated.length?'':'<p class="sub">Sem avaliações ainda.</p>')}
  </div></div>`;}
function chartHTML(d){const r=d.rel||{app:Array(8).fill(0),bal:Array(8).fill(0)};const lab=[...Array(8)].map((_,i)=>ddmm(addD(-7*(7-i)-4)));
  const W_=640,H=230,pl=40,pr=12,pt=16,pb=28,tot=r.app.map((a,i)=>a+r.bal[i]),mx=Math.max(4,Math.ceil(Math.max(...tot)/4)*4);
  const y=v=>pt+(H-pt-pb)*(1-v/mx),cw=(W_-pl-pr)/8,bw=cw*.56;let g='';
  for(let k=0;k<=4;k++){const v=mx/4*k;g+=`<line x1="${pl}" x2="${W_-pr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width="1"/><text x="${pl-6}" y="${y(v)+4}" text-anchor="end">${String(v).replace('.',',')}</text>`;}
  let bars='';r.app.forEach((a,i)=>{const x=pl+cw*i+(cw-bw)/2,ya=y(a),yb=y(a+r.bal[i]);
    bars+=`<rect x="${x}" y="${ya}" width="${bw}" height="${Math.max(0,y(0)-ya)}" rx="3" fill="var(--c-app)"/>`;
    bars+=`<rect x="${x}" y="${yb}" width="${bw}" height="${Math.max(0,ya-yb-2)}" rx="3" fill="var(--c-bal)"/>`;
    bars+=`<text x="${x+bw/2}" y="${H-8}" text-anchor="middle">${lab[i]}</text>`;
    bars+=`<rect x="${pl+cw*i}" y="${pt}" width="${cw}" height="${H-pt-pb}" fill="transparent" data-ci="${i}" data-x="${(x+bw/2)/W_*100}" data-y="${yb/H*100}" data-tip="Semana de ${lab[i]}|App: R$ ${String(a).replace('.',',')} mil|Balcão: R$ ${String(r.bal[i]).replace('.',',')} mil|Total: R$ ${String(+(a+r.bal[i]).toFixed(1)).replace('.',',')} mil"/>`;});
  const last=tot.length-1,xl=pl+cw*last+cw/2;
  return `<div class="legend"><span><i style="background:var(--c-app)"></i>Pedidos pelo app</span><span><i style="background:var(--c-bal)"></i>Compras no balcão com CPF</span></div>
  <div class="chart" id="chart"><svg viewBox="0 0 ${W_} ${H}" role="img" aria-label="Vendas semanais por canal, em milhares de reais">${g}${bars}<text x="${xl}" y="${y(tot[last])-6}" text-anchor="middle" style="fill:var(--ink);font-weight:600">R$ ${String(+tot[last].toFixed(1)).replace('.',',')} mil</text></svg><div class="tip" id="tip" hidden></div></div>
  <details><summary>Ver como tabela</summary><div class="tbl"><table style="min-width:420px"><thead><tr><th>Semana</th><th class="r">App (R$ mil)</th><th class="r">Balcão (R$ mil)</th><th class="r">Total</th></tr></thead><tbody>${lab.map((l,i)=>`<tr><td>${l}</td><td class="r num">${String(r.app[i]).replace('.',',')}</td><td class="r num">${String(r.bal[i]).replace('.',',')}</td><td class="r num">${String(+tot[i].toFixed(1)).replace('.',',')}</td></tr>`).join('')}</tbody></table></div></details>`;}
function vRelat(){const d=D(),r=d.rel||{tM:0,tN:0,fM:0,fN:0},ws=distWs(d);
  const emit=ws.reduce((a,w)=>a+w.extrato.filter(e=>e.pts>0).reduce((s,e)=>s+e.pts,0),0),resg=ws.reduce((a,w)=>a+w.extrato.filter(e=>e.pts<0).reduce((s,e)=>s-e.pts,0),0);
  const pm=PM(),top={};S.pedidos.filter(o=>o.dist===d.id&&o.tipo==='compra'&&o.canal==='app'&&o.status!=='cancelado').forEach(o=>o.itens.forEach(x=>{top[x.id]=(top[x.id]||0)+x.qty*x.preco}));
  const tl=Object.entries(top).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const pct=(a,b)=>b?Math.round((a/b-1)*100):0;
  return `<div class="cmp num">
    <div><span>Ticket médio · cliente do programa</span><b>${fmt(r.tM)}</b><small>+${pct(r.tM,r.tN)}% vs. ${fmt(r.tN)} de quem não participa</small></div>
    <div><span>Compras por mês · cliente do programa</span><b>${String(r.fM).replace('.',',')}</b><small>vs. ${String(r.fN).replace('.',',')} de quem não participa</small></div>
    <div><span>Taxa de resgate</span><b>${emit?Math.round(resg/emit*100):0}%</b><span>${n(resg)} de ${n(emit)} pts emitidos</span></div>
    <div><span>Clientes ativos (30 dias)</span><b>${ws.filter(w=>w.diasSem<30).length} <span class="sub" style="font-family:var(--body);font-size:12px">de ${ws.length}</span></b><span>${ws.filter(w=>w.diasSem>=30).length} sumidos</span></div>
  </div>
  <div class="box2"><h3 class="h2">Vendas por semana (R$ mil)</h3>${chartHTML(d)}</div>
  <div class="box2"><h3 class="h2">Mais vendidos no app</h3>${tl.length?tl.map(([id,v],i)=>`<div class="ext num"><span>${i+1}. ${esc(pm[id]?.nome||'')}</span><b>${fmt(v)}</b></div>`).join(''):'<p class="sub">Sem vendas pelo app ainda.</p>'}</div>
  <div class="note">Histórico semanal e comparação membro/não membro são dados de exemplo. Na versão real vêm das vendas registradas e do ERP. Esse comparativo é o argumento para renovar o contrato.</div>`;}
function vConfig(){const d=D(),livres=BAIRROS.filter(([b])=>!area(d,b));
  const I={mp:['Mercado Pago (Pix)','Pix com QR code no app. O dinheiro cai direto na conta da loja.'],erp:['ERP da distribuidora','Catálogo, preços e estoque sincronizados a cada 15 minutos'],pdv:['Sistema de caixa (PDV)','Vendas com CPF na nota viram pontos sem digitar nada'],nfce:['Emissor de NFC-e','Nota fiscal dos pedidos do app emitida automaticamente'],whats:['WhatsApp Business','Avisos de pedido, pontos e campanhas']};
  return `<p class="sec">Funcionamento</p>
  <div class="cfg">
    <div class="field">Recebendo pedidos<button class="sw ${d.pausada?'':'on'}" data-a="pausar" style="margin-top:6px"><i></i>${d.pausada?'Pausado':'Sim'}</button></div>
    <label class="field">Abre às<input id="h-abre" type="time" value="${d.horario.abre}" data-hor="abre"></label>
    <label class="field">Fecha às<input id="h-fecha" type="time" value="${d.horario.fecha}" data-hor="fecha"></label>
    <label class="field">Pedido mínimo (R$)<input id="d-min" type="number" min="0" step="10" value="${d.min}" data-dnum="min"></label>
    <label class="field">Frete grátis acima de (R$, 0 = não)<input id="d-fg" type="number" min="0" step="10" value="${d.freteGratis}" data-dnum="freteGratis"></label>
    <div class="field">Status agora<b class="${aberta(d)?'st-open':'st-closed'}" style="font-size:15px;margin-top:8px">${lojaTxt(d)}</b></div>
  </div>
  <p class="sec">Área de entrega</p>
  <div class="tbl"><table style="min-width:420px"><thead><tr><th>Bairro</th><th>Cidade</th><th class="r">Taxa de entrega</th><th></th></tr></thead><tbody>
  ${d.areas.map((a,i)=>`<tr><td>${a.bairro}</td><td>${cidadeDe(a.bairro)}</td><td class="r"><input class="costin" id="ar-${i}" inputmode="decimal" value="${a.frete.toFixed(2).replace('.',',')}" data-area="${i}" aria-label="Taxa ${a.bairro}"></td><td class="r"><button class="lbtn" data-a="rmArea" data-v="${i}">Remover</button></td></tr>`).join('')}
  </tbody></table></div>
  ${livres.length?`<div class="frm" style="grid-template-columns:2fr 1fr auto"><label class="lbl">Adicionar bairro<select id="na-b">${livres.map(([b,c])=>`<option value="${b}">${b} · ${c}</option>`).join('')}</select></label><label class="lbl">Taxa (R$)<input id="na-f" inputmode="decimal" placeholder="0,00"></label><button class="abtn acc" style="padding:10px 14px" data-a="addArea">Adicionar</button></div>`:''}
  <p class="sec">Equipe e permissões</p>
  <div class="tbl"><table class="perm" style="min-width:640px"><thead><tr><th>Pessoa</th><th>Pedidos</th><th>Balcão</th><th>Atendimento</th><th>Catálogo e preços</th><th>Pontos e campanhas</th><th>Relatórios</th><th>Entregas</th></tr></thead><tbody>
    ${[[d.equipe.dono+' (Dono)',1,1,1,1,1,1,1],[d.equipe.caixa+' (Caixa)',1,1,1,0,0,0,0],[d.entregadores.join(', ')+' (Entregador)',0,0,0,0,0,0,1]].map(r=>`<tr><td><b>${esc(r[0])}</b></td>${r.slice(1).map(v=>`<td class="${v?'yes':'no'}">${v?'✓':'—'}</td>`).join('')}</tr>`).join('')}
  </tbody></table></div>
  <div class="frm" style="grid-template-columns:2fr auto"><label class="lbl">Adicionar entregador<input id="ne-nome" placeholder="Nome"></label><button class="abtn acc" style="padding:10px 14px" data-a="addEnt">Adicionar</button></div>
  <p class="sec">Integrações</p>
  <div class="auto">${Object.entries(I).map(([k,[t,desc]])=>`<div class="acard"><div class="ordh"><h4>${t}${k==='mp'?'':' '+PL}</h4><button class="sw ${d.integ[k]?'on':''}" data-a="integ" data-v="${k}"><i></i>${d.integ[k]?'Conectado':'Desligado'}</button></div><p class="sub" style="margin:0">${desc}</p>${d.integ[k]?`<span class="sub">Última sincronização às ${hhmm(S.clock-3)}</span>`:''}</div>`).join('')}</div>`;}
/* ================= ADMIN ================= */
function aDists(){const ds=Object.values(S.dists);
  return `<div class="tbl"><table style="min-width:900px"><thead><tr><th>Distribuidora</th><th>Plano</th><th class="r">Mensalidade</th><th class="r">Produtos</th><th class="r">Clientes</th><th>Nota</th><th>Contrato</th><th>Status</th><th></th></tr></thead><tbody>
    ${ds.map(d=>{const np=S.produtos.filter(p=>p.dist===d.id).length,nc=distWs(d).length,ok=np&&d.contrato==='assinado';
      return `<tr><td><div style="display:flex;gap:10px;align-items:center"><div class="dlogo" style="background:${d.cor};width:34px;height:34px;font-size:14px;border-radius:9px">${initials(d.nome)}</div><div><b style="white-space:nowrap">${esc(d.nome)}</b><div class="sub" style="white-space:nowrap">${esc(d.cidade)} · desde ${d.desde}</div><div class="sub mono" style="white-space:nowrap">${esc(d.cnpj)}</div></div></div></td>
      <td>${d.plano}</td><td class="r num">${fmt(PLANOS[d.plano].preco)}</td><td class="r num">${np}</td><td class="r num">${nc}</td><td class="rate">★ ${nota(d)}</td>
      <td>${d.contrato==='assinado'?'<span class="yes">Assinado</span>':`<button class="abtn ghost" data-a="assinar" data-v="${d.id}">Registrar assinatura</button>`}</td><td>${stPill(d.status)}</td>
      <td class="r"><div style="display:flex;gap:6px;justify-content:flex-end">${d.status==='ativa'?`<button class="abtn ghost" data-a="dStatus" data-v="${d.id}:suspensa">Suspender</button>`:`<button class="abtn" data-a="dStatus" data-v="${d.id}:ativa" ${ok?'':'disabled'} title="${ok?'':'Precisa de contrato assinado e ao menos 1 produto'}">Ativar no app</button>`}<button class="abtn ghost" data-a="abrirPainel" data-v="${d.id}">Painel</button></div></td></tr>`}).join('')}
  </tbody></table></div>
  <p class="sec">Novo contrato</p>
  <div class="frm">
    <label class="lbl">Nome fantasia<input id="nd-nome" placeholder="Ex.: Guarapari Bebidas"></label>
    <label class="lbl">CNPJ<input id="nd-cnpj" inputmode="numeric" placeholder="00.000.000/0000-00"></label>
    <label class="lbl">Bairro da loja<select id="nd-bairro">${bairroOpts('Centro')}</select></label>
    <label class="lbl">Plano<select id="nd-plano">${Object.keys(PLANOS).map(p=>`<option value="${p}">${p} · ${fmt(PLANOS[p].preco)}/mês</option>`).join('')}</select></label>
    <button class="abtn acc" style="padding:10px 14px" data-a="addDist">Cadastrar</button>
  </div>
  <div class="plans">${Object.entries(PLANOS).map(([k,p])=>`<div class="plan"><b>${k}</b><span class="pr num">${fmt(p.preco)}</span><span class="sub">/mês</span><br>${p.txt}</div>`).join('')}</div>
  <div class="note">Fluxo: contrato cadastrado (Em implantação) → assinatura registrada → distribuidora monta catálogo, áreas de entrega e prêmios → você ativa e ela aparece no app para os bairros que atende.</div>`;}
function aCobranca(){const f=S.faturas,ven=f.filter(x=>x.status==='vencida');
  return `<div class="fr"><button class="abtn" data-a="gerarFat">Gerar faturas de out/2026</button><button class="abtn ghost" data-a="bloquear" ${ven.length?'':'disabled'}>Suspender inadimplentes (${ven.length})</button></div>
  <div class="tbl"><table><thead><tr><th>Distribuidora</th><th>Competência</th><th class="r">Valor</th><th>Vencimento</th><th>Status</th><th></th></tr></thead><tbody>
  ${f.slice().reverse().map(x=>`<tr><td><b>${esc(S.dists[x.dist].nome)}</b></td><td>${x.mes}</td><td class="r num">${fmt(x.valor)}</td><td class="num">${x.venc}</td><td>${stPill(x.status)}${x.status==='vencida'?' <span class="sub">há 15 dias</span>':''}</td>
    <td class="r">${x.status!=='paga'?`<button class="abtn ghost" data-a="pagarFat" data-v="${x.id}">Registrar pagamento</button>`:''}</td></tr>`).join('')}
  </tbody></table></div>
  <div class="note">Na versão real, as faturas saem sozinhas todo dia 1º por boleto e Pix, com lembrete no WhatsApp, e a suspensão automática acontece com 10 dias de atraso.</div>`;}
function aSuporte(){const ch=S.chamados;
  return `<div class="split"><div class="box2"><h3 class="h2">Solicitações LGPD</h3>
    ${S.lgpd.length?S.lgpd.map(x=>`<div class="ext"><span><b>${esc(x.nome)}</b> · ${x.tipo}<br><span class="sub">${x.data} · prazo legal de 15 dias</span></span><span>${x.status==='pendente'?`<button class="abtn ghost" data-a="lgpdOk" data-v="${x.id}">Concluir</button>`:stPill('concluida')}</span></div>`).join(''):'<p class="sub">Nenhuma solicitação.</p>'}
    <div class="note">Você é o controlador dos dados do app; cada distribuidora assina um termo de tratamento de dados junto com o contrato.</div></div>
  <div class="box2"><h3 class="h2">Atendimento por distribuidora ${PL}</h3>
    ${Object.values(S.dists).map(d=>{const c=ch.filter(x=>x.dist===d.id);return `<div class="ext"><span><b>${esc(d.nome)}</b><br><span class="sub">${c.filter(x=>x.status==='aberto').length} chamados abertos · ${c.filter(x=>x.status==='resolvido').length} resolvidos</span></span><span class="rate">★ ${nota(d)}</span></div>`}).join('')}
  </div></div>`;}

/* ================= v2: painel ================= */
const PICO={
  inicio:'<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  pedidos:NAVI.pedidos,
  entregas:'<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  balcao:'<path d="M4 10h16v10H4zM3 10l2-5h14l2 5M9 20v-5h6v5"/>',
  estoque:G.box,
  catalogo:'<path d="M3.5 12.5V4.5h8l9 9-8 8z"/><circle cx="8" cy="9" r="1.5"/>',
  clientes:'<circle cx="9" cy="8.5" r="3.3"/><path d="M3 20c.6-3.5 3-5.3 6-5.3s5.4 1.8 6 5.3"/><path d="M15.5 5.5a3 3 0 0 1 0 6M17.5 14.8c1.9.6 3.1 2.3 3.5 5.2"/>',
  campanhas:'<path d="M4 10v4h3l7 4V6L7 10z"/><path d="M17.5 9a4 4 0 0 1 0 6"/>',
  programa:'<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
  atendimento:'<path d="M4 5h16v11H9l-5 4z"/>',
  relatorios:'<path d="M4 20V4M4 20h16"/><path d="M8 16v-4M12 16V8M16 16v-6"/>',
  config:'<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  dists:'<path d="M4 20V8l6-4v16M10 20V10h10v10M3 20h18"/>',
  cobranca:'<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h4"/>',
  suporte:'<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/>'
};
const pico=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${PICO[k]}</svg>`;
const NAV_GRP=[['Operação',['inicio','pedidos','entregas','balcao','estoque']],['Vendas e fidelidade',['catalogo','clientes','campanhas','programa']],['Gestão',['atendimento','relatorios','config']]];
const SUBT={inicio:'Resumo do dia e o que precisa de atenção',pedidos:'Pedidos do app, do recebimento à entrega',entregas:'Entregas em rota atribuídas a você',balcao:'Pontos para compras feitas na loja física',estoque:'Níveis, reposição e movimentações',catalogo:'Produtos, preços e importação da tabela',clientes:'Quem participa do programa de pontos',campanhas:'Mensagens automáticas pelo WhatsApp',programa:'Regras de pontuação, níveis e prêmios',atendimento:'Chamados e avaliações dos clientes',relatorios:'Vendas, margem, canais e entregas',config:'Horário, área de entrega, equipe e integrações'};
const snav=(k,label,on,badge,act)=>`<button class="snav ${on?'on':''}" data-a="${act}" data-v="${k}" ${on?'aria-current="page"':''}>${pico(k)}<span>${label}</span>${PLAN_TABS.includes(k)?'<i class="pdot" title="Planejado: ainda não existe no app real"></i>':''}${badge?`<em class="num">${badge}</em>`:''}</button>`;

function kcard(o,mode){const w=W(o.dist,o.cpf),d=S.dists[o.dist];let acts='';
  if(NEXT[o.status]&&(mode!=='entregador'||o.status==='em_rota')){
    const ret=o.entrega==='retirada';
    if(o.status==='separando'&&!ret)acts+=`<select class="sel" id="ent-${o.id}" aria-label="Entregador do pedido ${o.id}">${d.entregadores.map(e=>`<option>${esc(e)}</option>`).join('')}</select>`;
    acts+=`<button class="abtn ${o.status==='novo'?'acc':''}" data-a="avancar" data-v="${o.id}">${o.status==='separando'&&ret?'Cliente retirou':NEXT[o.status]}</button>`;}
  if(o.status==='novo'&&S.role==='dono')acts+=`<button class="lbtn" data-a="cancelar" data-v="${o.id}">Cancelar</button>`;
  const pay=o.tipo==='resgate'?'<span class="tag rs">Resgate</span>':o.pagStatus==='pago'?'<span class="tag ok">Pix pago</span>':`<span class="tag">Cobrar · ${PAG[o.pag]}</span>`;
  return `<article class="kcard ${S.fresh===o.id?'fresh':''}">
    <div class="kh"><b class="num">#${o.id}</b><span class="sub num">${o.dia==='ontem'?'ontem · ':''}${o.hora}</span></div>
    <div class="who">${esc(cliNome(o.cpf))}</div>
    <div class="kt">${tierPill(o.dist,w)}${pay}${o.recorr?'<span class="tag bl">Programado</span>':''}</div>
    <div class="items">${itensTxt(o)}</div>
    <div class="sub">${o.entrega==='retirada'?'Retirada na loja':esc(o.end?`${o.end.rua}, ${o.end.bairro}`:'Entrega')}${o.entregador&&o.status==='em_rota'?` · ${esc(o.entregador)}, chega ~${o.eta}`:''}</div>
    ${o.problema&&o.status==='em_rota'?`<div class="err" style="padding:6px 9px;font-size:12px"><b>${esc(o.problema.tipo)}</b> · ${o.problema.ref?'cliente mandou referência':'aguardando referência do cliente'}</div>`:''}
    ${o.status==='cancelado'&&o.canceladoPor==='cliente'?'<div class="sub" style="color:var(--bad)">Cancelado pelo cliente</div>':''}
    <div class="kf num">${o.tipo==='resgate'?`<b>${n(o.pts)} pts</b><span class="sub">troca de pontos</span>`:`<b>${fmt(o.total)}</b><span class="earn">+${n(o.pts)} pts</span>`}</div>
    ${acts?`<div class="kacts">${acts}</div>`:''}</article>`;}
function vPedidosD(){
  const d=D(),l=S.pedidos.filter(o=>o.dist===d.id&&o.canal==='app'),canc=l.filter(o=>o.status==='cancelado');
  const rc=S.recorr.filter(r=>r.dist===d.id&&r.ativo),pm=PM();
  const cols=[['novo','Recebidos'],['separando','Separando'],['em_rota','Em rota'],['entregue','Entregues']];
  return `${!aberta(d)?`<div class="closed"><b>${lojaTxt(d)}.</b> O app não aceita pedidos novos agora.</div>`:''}
  <div class="kanban">${cols.map(([s,t])=>{const xs=l.filter(o=>o.status===s);return `<section class="kcol k-${s}" aria-label="${t}"><header><span class="kdot"></span>${t}<em class="num">${xs.length}</em></header>${xs.length?xs.map(o=>kcard(o)).join(''):`<p class="kempty">${s==='novo'?'Nenhum pedido novo. Faça um pelo app ao lado.':'Nada aqui agora'}</p>`}</section>`}).join('')}</div>
  ${canc.length?`<details><summary>${canc.length} ${canc.length>1?'pedidos cancelados':'pedido cancelado'}</summary>${canc.map(o=>`<div class="ext"><span>#${o.id} · ${esc(cliNome(o.cpf))}</span><span class="sub num">${o.tipo==='resgate'?n(o.pts)+' pts':fmt(o.total)}</span></div>`).join('')}</details>`:''}
  ${rc.length?`<div class="box2"><div class="ordh"><h3 class="h2">Pedidos programados</h3><span class="sub">${rc.length} ${rc.length>1?'clientes com pedido recorrente':'cliente com pedido recorrente'}</span></div>
    ${rc.map(r=>`<div class="ext"><span><b>${esc(cliNome(r.cpf))}</b> · ${r.itens.map(x=>`${x.qty}× ${esc(pm[x.id]?.nome||'')}`).join(', ')}<br><span class="sub">a cada ${r.freq} dias · próximo ${r.prox} · ${PAG[r.pag]}</span></span><button class="abtn ghost" data-a="recGerar" data-v="${r.id}">Gerar agora</button></div>`).join('')}</div>`:''}`;
}
function vEntregas(){const d=D(),l=S.pedidos.filter(o=>o.dist===d.id&&o.status==='em_rota');
  return `<div class="note">Você está como <b>${esc(d.entregadores[0])}</b> (entregador). Só vê as entregas em rota e confirma a entrega. Preços, clientes e relatórios ficam ocultos.</div>
  ${l.length?`<div class="kanban">${l.map(o=>kcard(o,'entregador')).join('')}</div>`:'<div class="empty">Nenhuma entrega em rota. Quando a loja despachar um pedido, ele aparece aqui.</div>'}`;}
function renderDist(){
  const d=D(),tabs=ROLE_TABS[S.role];if(!tabs.includes(S.ptab))S.ptab=tabs[0];
  const ped=S.pedidos.filter(o=>o.dist===d.id),abertos=ped.filter(o=>o.canal==='app'&&!['entregue','cancelado'].includes(o.status));
  const vendas=ped.filter(o=>o.dia==='hoje'&&o.tipo==='compra'&&o.status!=='cancelado').reduce((a,b)=>a+b.total,0);
  const ws=distWs(d),chA=S.chamados.filter(c=>c.dist===d.id&&c.status==='aberto').length,nw=S.dnew[d.id]||0;
  const crit=S.produtos.filter(p=>p.dist===d.id&&p.ativo&&stockInfo(p).st!=='ok').length;
  const badge={pedidos:abertos.length,atendimento:chA,entregas:ped.filter(o=>o.status==='em_rota').length,estoque:crit};
  const body={inicio:pHome,estoque:pEstoque,pedidos:vPedidosD,entregas:vEntregas,balcao:vBalcao,catalogo:vCatalogo,clientes:vClientesD,campanhas:vCampanhas,programa:vPrograma,atendimento:vAtend,relatorios:pRelat,resultado:pResultado,config:vConfig}[S.ptab]();
  const who=S.role==='entregador'?d.entregadores[0]:d.equipe[S.role];
  const nav=NAV_GRP.map(([g,ks])=>{const k2=ks.filter(k=>tabs.includes(k));return k2.length?`<p class="sgrp">${g}</p>${k2.map(k=>snav(k,TABS[k],S.ptab===k,badge[k],'ptab')).join('')}`:''}).join('');
  return `<div class="pwrap"><aside class="side" aria-label="Menu do painel">
    <div class="sbrand"><div class="dlogo" style="background:${d.cor}">${initials(d.nome)}</div><div class="min0"><label class="sub" for="pd-sel">Distribuidora</label><select id="pd-sel" class="ssel">${Object.values(S.dists).map(x=>`<option value="${x.id}" ${x.id===d.id?'selected':''}>${esc(x.nome)}</option>`).join('')}</select></div></div>
    <div class="sstat">${stPill(d.status)}<span class="${aberta(d)?'st-open':'st-closed'}">${lojaTxt(d)}</span></div>
    <nav class="snavs">${nav}</nav>
    <p class="slegend"><i class="pdot"></i> Planejado: ainda não existe no app real</p>
    <div class="suser"><span class="av">${initials(who)||who[0]}</span><div class="min0"><label class="sub" for="role-sel">Entrar como</label><select id="role-sel" class="ssel">${Object.keys(ROLE_TABS).map(r=>`<option value="${r}" ${r===S.role?'selected':''}>${esc(r==='entregador'?d.entregadores[0]:d.equipe[r])} · ${ROLE_NOME[r]}</option>`).join('')}</select></div></div>
  </aside>
  <section class="pmain"><header class="pbar"><div><h2>${TABS[S.ptab]}${PLAN_TABS.includes(S.ptab)?' '+PL:''}</h2><p>${SUBT[S.ptab]}</p></div>${nw&&S.role!=='entregador'?`<button class="newpill" data-a="verNovos">${nw} ${nw>1?'pedidos novos':'pedido novo'}</button>`:''}</header>
  ${S.role==='entregador'||!['pedidos','balcao','catalogo','clientes','campanhas','programa','atendimento','config'].includes(S.ptab)?'':`<div class="kpis num">
    <div class="kpi"><span>Pedidos em aberto</span><b>${abertos.length}</b></div>
    <div class="kpi"><span>Vendas hoje (app + loja)</span><b>${fmt(vendas)}</b></div>
    <div class="kpi"><span>Clientes com pontos</span><b>${ws.length}</b></div>
    <div class="kpi"><span>Nota dos clientes</span><b>★ ${nota(d)}</b></div></div>`}
  <div class="pbody">${S.role==='caixa'?`<div class="note">Você está como <b>${esc(who)}</b> (caixa): pode atender pedidos, lançar pontos no balcão, ajustar estoque e responder chamados. Preços, prêmios e relatórios ficam com o dono.</div>`:''}${body}</div></section></div>`;
}
function renderAdmin(){
  const ds=Object.values(S.dists),ativas=ds.filter(d=>d.status==='ativa');
  const mrr=ativas.reduce((a,d)=>a+PLANOS[d.plano].preco,0),inad=S.faturas.filter(f=>f.status==='vencida').reduce((a,f)=>a+f.valor,0);
  const cad=Object.values(S.clientes).filter(c=>c.cadastrado).length,pre=Object.values(S.clientes).filter(c=>!c.cadastrado&&!c.excluido).length;
  const body={dists:aDists,bairros:aBairros,cobranca:aCobranca,suporte:aSuporte}[S.atabA]();
  const it=[['dists','Distribuidoras',ds.filter(d=>d.status!=='ativa').length,'Contratos, planos e ativação no app'],['bairros','Bairros',0,'Bairros atendidos pelo app, usados nas áreas de entrega'],['cobranca','Cobrança',S.faturas.filter(f=>f.status==='vencida').length,'Mensalidades das distribuidoras'],['suporte','LGPD e suporte',S.lgpd.filter(x=>x.status==='pendente').length,'Pedidos de dados e atendimento por loja']];
  const cur=it.find(x=>x[0]===S.atabA);
  return `<div class="pwrap"><aside class="side" aria-label="Menu do admin">
    <div class="sbrand"><div class="dlogo adm">DP</div><div class="min0"><b>DistribPontos</b><div class="sub">Admin da plataforma</div></div></div>
    <nav class="snavs"><p class="sgrp">Plataforma</p>${it.map(([k,l,b])=>snav(k,l,S.atabA===k,b,'atabA')).join('')}</nav>
    <p class="slegend"><i class="pdot"></i> Planejado: ainda não existe no app real</p>
    <div class="suser"><span class="av">VC</span><div class="min0"><b>Você</b><div class="sub">Dona da plataforma</div></div></div></aside>
  <section class="pmain"><header class="pbar"><div><h2>${cur[1]}${PLAN_TABS.includes(cur[0])?' '+PL:''}</h2><p>${cur[3]}</p></div></header>
  <div class="kpis num">
    <div class="kpi"><span>Distribuidoras ativas</span><b>${ativas.length} <span class="sub" style="font-family:var(--body);font-size:12px">de ${ds.length}</span></b></div>
    <div class="kpi"><span>Receita mensal (planos)</span><b>${fmt(mrr)}</b></div>
    <div class="kpi"><span>Inadimplência</span><b style="${inad?'color:var(--bad)':''}">${fmt(inad)}</b></div>
    <div class="kpi"><span>Clientes com CPF</span><b>${cad} <span class="sub" style="font-family:var(--body);font-size:12px">+${pre} só balcão</span></b></div>
  </div>
  <div class="pbody">${body}</div></section></div>`;}

function aBairros(){const cid=[...new Set(BAIRROS.map(b=>b[1]))];
  return `<div class="tbl"><table style="min-width:460px"><thead><tr><th>Bairro</th><th>Cidade</th><th class="r">Distribuidoras que entregam</th></tr></thead><tbody>
  ${BAIRROS.map(([b,c])=>{const ds=Object.values(S.dists).filter(d=>area(d,b));return `<tr><td><b>${esc(b)}</b></td><td>${esc(c)}</td><td class="r">${ds.length?ds.map(d=>`<span class="tag" style="margin-left:4px">${esc(d.nome.split(' ').slice(0,2).join(' '))}</span>`).join(''):'<span class="sub">nenhuma ainda</span>'}</td></tr>`}).join('')}
  </tbody></table></div>
  <p class="sec">Novo bairro</p>
  <div class="frm" style="grid-template-columns:2fr 1.2fr auto"><label class="lbl">Nome do bairro<input id="nb-nome" placeholder="Ex.: Centro"></label>
    <label class="lbl">Cidade<select id="nb-cid">${cid.map(c=>`<option>${esc(c)}</option>`).join('')}</select></label>
    <button class="abtn acc" style="padding:10px 14px" data-a="addBairro">Adicionar</button></div>
  <div class="note">Os bairros cadastrados aqui aparecem para os clientes no endereço de entrega e para as distribuidoras montarem a área de entrega.</div>`;}

