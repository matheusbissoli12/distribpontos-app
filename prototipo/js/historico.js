/* Histórico de vendas de exemplo, estoque, gráficos e relatórios */
/* ================= HISTÓRICO, ESTOQUE E RELATÓRIOS (dados de exemplo) ================= */
const MARGEM={'Cervejas':.22,'Refrigerantes':.28,'Águas':.35,'Gás':.18,'Energéticos':.38,'Conveniência':.40,'Acessórios':.45,'Outros':.30};
const PESO={'Cervejas':.34,'Refrigerantes':.15,'Águas':.14,'Gás':.21,'Energéticos':.05,'Conveniência':.08,'Acessórios':.03,'Outros':.03};
const FORN={'Cervejas':'Litoral Bebidas','Refrigerantes':'Litoral Bebidas','Energéticos':'Litoral Bebidas','Águas':'Águas Montanha Capixaba','Gás':'Envasadora Gás Vitória','Conveniência':'Frio & Gelo ES','Acessórios':'Envasadora Gás Vitória','Outros':'Litoral Bebidas'};
const ALVO={d1:1550,d2:620,d3:1650};
const DOWF=[1.25,.78,.8,.86,.96,1.32,1.48];
const HOURS=[...Array(17)].map((_,i)=>i+7); // 7h–23h
const HOURW=[.3,.45,.6,.8,1.15,1.25,.95,.7,.62,.7,.9,1.2,1.4,1.35,1.05,.7,.35];
const DOWN=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const H={};
function rngFor(seed){let s=seed%2147483647||11;return()=>(s=s*16807%2147483647)/2147483647;}
function genHist(d){
  const r=rngFor([...d.id].reduce((a,c)=>a+c.charCodeAt(0)*97,13)),prods=S.produtos.filter(p=>p.dist===d.id),alvo=ALVO[d.id]||0,days=[];
  const byCat={};prods.forEach(p=>(byCat[p.cat]=(byCat[p.cat]||0)+1));
  for(let i=89;i>=0;i--){const dt=addD(-i-1),dow=dt.getDay(),t=(89-i)/89,f=DOWF[dow]*(1+.16*t)*(.8+r()*.4);
    const units={};let rev=0,cost=0;
    prods.forEach(p=>{const q=Math.max(0,Math.round(alvo*(PESO[p.cat]||.03)/byCat[p.cat]/p.preco*f*(.7+r()*.6)));if(q){units[p.id]=q;rev+=q*p.preco;cost+=q*p.preco*(1-(MARGEM[p.cat]||.3));}});
    const appShare=.27+.16*t+(r()-.5)*.06,app=rev*appShare,bal=rev-app;
    days.push({dt,dow,units,rev,cost,app,bal,pedApp:Math.max(1,Math.round(app/(92+r()*18))),pedBal:Math.max(1,Math.round(bal/(44+r()*10))),novos:Math.round(r()*2.6*(1+t)),tempo:30+r()*14});}
  H[d.id]={days};
}
function agg(d,n,off=0){const ds=(H[d.id]?.days||[]).slice(Math.max(0,90-off-n),90-off),a={rev:0,cost:0,app:0,bal:0,ped:0,pedApp:0,novos:0,units:{},dias:ds.length,tempo:0};
  ds.forEach(x=>{a.rev+=x.rev;a.cost+=x.cost;a.app+=x.app;a.bal+=x.bal;a.pedApp+=x.pedApp;a.ped+=x.pedApp+x.pedBal;a.novos+=x.novos;a.tempo+=x.tempo;for(const k in x.units)a.units[k]=(a.units[k]||0)+x.units[k];});
  a.tempo=ds.length?a.tempo/ds.length:0;a.ticket=a.ped?a.rev/a.ped:0;a.margem=a.rev?(a.rev-a.cost)/a.rev:0;return a;}
const avgDia=(d,pid)=>(agg(d,30).units[pid]||0)/30;
function initStock(){Object.values(S.dists).forEach(genHist);
  S.produtos.forEach(p=>{const d=S.dists[p.dist],m=avgDia(d,p.id);p.custo=+(p.preco*(1-(MARGEM[p.cat]||.3))).toFixed(2);p.minimo=Math.max(3,Math.ceil(m*3));p.forn=FORN[p.cat]||'Fornecedor';});
  const pm=PM();S.movs=[
    {dist:'d1',pid:'d1-cv1',tipo:'entrada',qty:240,obs:'NF 18.422 · Litoral Bebidas',quando:'ontem 16:10',quem:'Rafael'},
    {dist:'d1',pid:'d1-ag2',tipo:'perda',qty:-1,obs:'Galão com vazamento',quando:'ontem 11:02',quem:'Bruna'},
    {dist:'d1',pid:'d1-gs1',tipo:'entrada',qty:20,obs:'NF 5.310 · Envasadora Gás Vitória',quando:'24/09 09:30',quem:'Rafael'},
    {dist:'d1',pid:'d1-cn1',tipo:'ajuste',qty:-2,obs:'Contagem de estoque',quando:'23/09 20:45',quem:'Bruna'}].filter(m=>pm[m.pid]);
  S.compras=[];S.estF='todos';S.estQ='';S.estMov=null;S.relP=30;
}
function stockInfo(p){const d=S.dists[p.dist],m=avgDia(d,p.id),cob=m>0?p.estoque/m:Infinity;
  const st=p.estoque<=0?'esgotado':(p.estoque<=p.minimo/2||cob<2)?'critico':p.estoque<=p.minimo?'baixo':'ok';
  const sug=st==='ok'?0:Math.max(0,Math.ceil((m*10+p.minimo-p.estoque)/6)*6);
  return {m,cob,st,sug,valor:p.estoque*p.custo};}
const STK={esgotado:['Esgotado','cancelado'],critico:['Crítico','cancelado'],baixo:['Baixo','separando'],ok:['OK','entregue']};
const kfmt=v=>v>=10000?'R$ '+(v/1000).toFixed(1).replace('.',',')+' mil':fmt(v);
const pct=v=>(v*100).toFixed(1).replace('.',',')+'%';
function delta(a,b,inv){if(!b)return '';const x=(a-b)/b,up=x>=0,good=inv?!up:up;return `<small class="${good?'up':'down'}">${up?'▲':'▼'} ${Math.abs(x*100).toFixed(0)}%</small>`;}

/* ---------- gráficos ---------- */
function niceStep(x){const p=Math.pow(10,Math.floor(Math.log10(x))),m=x/p;return (m<=1?1:m<=2?2:m<=2.5?2.5:m<=5?5:10)*p;}
function stackedChart(labels,A,B,opt={}){
  const W_=680,Hh=240,pl=52,pr=12,pt=18,pb=30,tot=A.map((a,i)=>a+B[i]),stp=niceStep(Math.max(1,...tot)/4),nt=Math.ceil(Math.max(1,...tot)/stp),mx=stp*nt,y=v=>pt+(Hh-pt-pb)*(1-v/mx),cw=(W_-pl-pr)/A.length,bw=Math.max(3,Math.min(26,cw*.62));
  let g='';for(let k=0;k<=nt;k++){const v=stp*k;g+=`<line x1="${pl}" x2="${W_-pr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${pl-6}" y="${y(v)+4}" text-anchor="end">${v>=1000?(v/1000).toFixed(v%1000?1:0).replace('.',',')+' mil':n(v)}</text>`;}
  const step=Math.ceil(A.length/10);let bars='';
  A.forEach((a,i)=>{const x=pl+cw*i+(cw-bw)/2,ya=y(a),yb=y(a+B[i]);
    bars+=`<rect x="${x}" y="${ya}" width="${bw}" height="${Math.max(0,y(0)-ya)}" rx="2" fill="var(--c-app)"/><rect x="${x}" y="${yb}" width="${bw}" height="${Math.max(0,ya-yb-2)}" rx="2" fill="var(--c-bal)"/>`;
    if(i%step===0||i===A.length-1)bars+=`<text x="${x+bw/2}" y="${Hh-9}" text-anchor="middle">${labels[i]}</text>`;
    bars+=`<rect x="${pl+cw*i}" y="${pt}" width="${cw}" height="${Hh-pt-pb}" fill="transparent" data-tip="${opt.pre||''}${labels[i]}|${opt.la||'App'}: ${fmt(a)}|${opt.lb||'Balcão'}: ${fmt(B[i])}|Total: ${fmt(a+B[i])}"/>`;});
  return `<div class="legend"><span><i style="background:var(--c-app)"></i>${opt.la||'Pedidos pelo app'}</span><span><i style="background:var(--c-bal)"></i>${opt.lb||'Balcão com CPF'}</span></div>
  <div class="chart"><svg viewBox="0 0 ${W_} ${Hh}" role="img" aria-label="${opt.aria||'Vendas por período e canal'}">${g}${bars}</svg><div class="tip" hidden></div></div>`;}
function hbars(items,fmtv){const mx=Math.max(...items.map(i=>i.v),1);
  return `<div class="hbars">${items.map(i=>`<div class="hb" data-tip="${esc(i.l)}|${fmtv(i.v)}${i.s?'|'+i.s:''}"><span class="hl">${esc(i.l)}</span><span class="ht"><i style="width:${Math.max(1.5,i.v/mx*100)}%"></i></span><b class="num">${fmtv(i.v)}</b></div>`).join('')}</div>`;}
function heatmap(d,nd){const ds=(H[d.id]?.days||[]).slice(90-nd),M=DOWN.map(()=>HOURS.map(()=>0));
  ds.forEach(x=>HOURS.forEach((h,j)=>{M[x.dow][j]+=(x.pedApp+x.pedBal)*HOURW[j]/HOURW.reduce((a,b)=>a+b,0)*(x.dow===0||x.dow===6?(h>=18?1.25:h<11?.7:1):1);}));
  const mx=Math.max(...M.flat(),1),order=[1,2,3,4,5,6,0];
  return `<div class="chart" style="overflow-x:auto"><div class="heat" style="grid-template-columns:40px repeat(${HOURS.length},minmax(18px,1fr))">
    <span></span>${HOURS.map(h=>`<span class="hh">${h%2?'':h+'h'}</span>`).join('')}
    ${order.map(w=>`<span class="hd">${DOWN[w]}</span>${HOURS.map((h,j)=>{const v=M[w][j]/mx;return `<span class="hc" style="background:color-mix(in srgb,var(--c-app) ${Math.round(8+v*92)}%,var(--surface))" data-tip="${DOWN[w]} ${h}h–${h+1}h|~${n(M[w][j]/Math.max(1,nd/7))} pedidos por semana"></span>`}).join('')}`).join('')}
  </div><div class="tip" hidden></div></div>
  <div class="legend" style="justify-content:flex-end"><span>menos</span><span class="hscale"></span><span>mais pedidos</span></div>`;}
function spark(vals){const W_=300,Hh=60,mx=Math.max(...vals)*1.1,mn=0,x=i=>i/(vals.length-1)*W_,y=v=>Hh-(v-mn)/(mx-mn)*Hh;
  const p=vals.map((v,i)=>`${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return `<svg viewBox="-4 -4 ${W_+8} ${Hh+8}" class="spark" aria-hidden="true"><polygon points="0,${Hh} ${p} ${W_},${Hh}" fill="color-mix(in srgb,var(--c-app) 16%,transparent)"/><polyline points="${p}" fill="none" stroke="var(--c-app)" stroke-width="2" stroke-linejoin="round"/><circle cx="${x(vals.length-1)}" cy="${y(vals[vals.length-1])}" r="4" fill="var(--c-app)" stroke="var(--surface)" stroke-width="2"/></svg>`;}

/* ---------- Visão geral (painel) ---------- */
function pHome(){
  const d=D(),days=H[d.id]?.days||[],pm=PM();
  const passed=HOURW.slice(0,Math.max(0,Math.min(17,Math.floor(S.clock/60)-6))).reduce((a,b)=>a+b,0)/HOURW.reduce((a,b)=>a+b,0);
  const ref=days[days.length-7]||{rev:0,pedApp:0,pedBal:0},hojeBase=(days[days.length-1]?.rev||0)*1.02*passed;
  const live=S.pedidos.filter(o=>o.dist===d.id&&o.dia==='hoje'&&o.tipo==='compra'&&o.status!=='cancelado');
  const vendas=hojeBase+live.reduce((a,o)=>a+o.total,0),ped=Math.round((ref.pedApp+ref.pedBal)*passed)+live.length,refV=ref.rev*passed,refP=Math.round((ref.pedApp+ref.pedBal)*passed);
  const sem=agg(d,7),semAnt=agg(d,7,7),mes=agg(d,30);
  const abertos=S.pedidos.filter(o=>o.dist===d.id&&o.canal==='app'&&['novo','separando','em_rota'].includes(o.status));
  const crit=S.produtos.filter(p=>p.dist===d.id&&p.ativo).map(p=>({p,...stockInfo(p)})).filter(x=>x.st!=='ok');
  const ch=S.chamados.filter(c=>c.dist===d.id&&c.status==='aberto'),venc=distWs(d).filter(w=>w.vencendo);
  const top=Object.entries(sem.units).map(([id,q])=>({id,q,v:q*(pm[id]?.preco||0)})).sort((a,b)=>b.v-a.v).slice(0,5);
  const fechaEm=toMin(d.horario.fecha)-S.clock;
  const attn=[
    abertos.length&&[`${abertos.length} ${abertos.length>1?'pedidos':'pedido'} em andamento`,`${abertos.filter(o=>o.status==='novo').length} aguardando separação`,'pedidos','Ver pedidos'],
    crit.length&&[`${crit.length} ${crit.length>1?'produtos precisam':'produto precisa'} de reposição`,crit.slice(0,3).map(x=>`${x.p.nome} (${x.p.estoque})`).join(', '),'estoque','Abrir estoque'],
    ch.length&&[`${ch.length} ${ch.length>1?'chamados abertos':'chamado aberto'}`,'Clientes esperando resposta','atendimento','Responder'],
    venc.length&&[`${venc.length} ${venc.length>1?'clientes com pontos':'cliente com pontos'} vencendo`,'Bom momento para uma campanha','campanhas','Ver campanhas'],
    aberta(d)&&fechaEm>0&&fechaEm<=90&&[`Loja fecha em ${fechaEm} min`,`Horário: até ${d.horario.fecha}`,'config','Ajustar horário'],
  ].filter(Boolean);
  return `<div class="kpis num" style="border:1px solid var(--line);border-radius:14px;overflow:hidden">
    <div class="kpi"><span>Vendas hoje (até ${hhmm(S.clock)})</span><b>${kfmt(vendas)}</b>${delta(vendas,refV)}<em>vs. mesma hora na semana passada</em></div>
    <div class="kpi"><span>Pedidos hoje (app + balcão)</span><b>${n(ped)}</b>${delta(ped,refP)}<em>vs. semana passada</em></div>
    <div class="kpi"><span>Faturamento da semana</span><b>${kfmt(sem.rev)}</b>${delta(sem.rev,semAnt.rev)}<em>vs. 7 dias anteriores</em></div>
    <div class="kpi"><span>Margem bruta (30 dias)</span><b>${pct(mes.margem)}</b><em>${kfmt(mes.rev-mes.cost)} de lucro bruto</em></div>
  </div>
  <div class="split">
    <div class="box2"><div class="ordh"><h3 class="h2">Precisa de atenção</h3><span class="sub">${attn.length?attn.length+' itens':'tudo em dia'}</span></div>
      ${attn.length?attn.map(([t,s,tab,b])=>`<div class="attn"><div><b>${t}</b><span class="sub">${esc(s)}</span></div><button class="abtn ghost" data-a="ptab" data-v="${tab}">${b}</button></div>`).join(''):'<p class="sub" style="margin:0">Nada pendente agora.</p>'}</div>
    <div class="box2"><div class="ordh"><h3 class="h2">Últimos 14 dias</h3><span class="sub num">${kfmt(agg(d,14).rev)}</span></div>
      ${spark(days.slice(-14).map(x=>x.rev))}
      <div class="ordh sub"><span>${ddmm(days[days.length-14]?.dt||HOJE)}</span><span>Canal app: <b style="color:var(--ink)">${pct(sem.app/(sem.rev||1))}</b> das vendas da semana</span><span>${ddmm(days[days.length-1]?.dt||HOJE)}</span></div></div>
  </div>
  <div class="split">
    <div class="box2"><div class="ordh"><h3 class="h2">Mais vendidos da semana</h3><button class="lbtn" style="color:var(--primary)" data-a="ptab" data-v="relatorios">Ver relatórios</button></div>
      ${top.length?hbars(top.map(t=>({l:pm[t.id].nome,v:t.v,s:n(t.q)+' '+pm[t.id].un+'s'})),kfmt):'<p class="sub">Sem vendas no período.</p>'}</div>
    <div class="box2"><h3 class="h2">Hoje na loja</h3>
      <div class="kv"><span>Horário</span><b class="${aberta(d)?'st-open':'st-closed'}">${lojaTxt(d)}</b></div>
      <div class="kv"><span>Entregadores</span><b>${esc(d.entregadores.join(', '))}</b></div>
      <div class="kv"><span>Tempo médio de entrega (7 dias)</span><b>${Math.round(sem.tempo)} min</b></div>
      <div class="kv"><span>Clientes novos no programa (30 dias)</span><b>${n(mes.novos)}</b></div>
      <div class="kv"><span>Valor em estoque (custo)</span><b>${kfmt(S.produtos.filter(p=>p.dist===d.id).reduce((a,p)=>a+p.estoque*p.custo,0))}</b></div></div>
  </div>`;
}

/* ---------- Estoque ---------- */
function pEstoque(){
  const d=D(),all=S.produtos.filter(p=>p.dist===d.id).map(p=>({p,...stockInfo(p)})),q=S.estQ.trim().toLowerCase();
  const f=S.estF,lista=all.filter(x=>(f==='todos'||(f==='comprar'?x.st!=='ok':x.st===f))&&(!q||x.p.nome.toLowerCase().includes(q))).sort((a,b)=>['esgotado','critico','baixo','ok'].indexOf(a.st)-['esgotado','critico','baixo','ok'].indexOf(b.st)||a.cob-b.cob);
  const valor=all.reduce((a,x)=>a+x.valor,0),abaixo=all.filter(x=>x.st!=='ok').length,esg=all.filter(x=>x.st==='esgotado').length;
  const cobs=all.filter(x=>isFinite(x.cob)&&x.p.ativo).map(x=>x.cob),cobM=cobs.length?cobs.reduce((a,b)=>a+b,0)/cobs.length:0;
  const sugs=all.filter(x=>x.sug>0&&x.p.ativo),porF={};sugs.forEach(x=>(porF[x.p.forn]=porF[x.p.forn]||[]).push(x));
  const mv=S.estMov&&all.find(x=>x.p.id===S.estMov.pid),movs=S.movs.filter(m=>m.dist===d.id).slice(0,12),pm=PM(),comp=S.compras.filter(c=>c.dist===d.id);
  return `<div class="kpis num" style="border:1px solid var(--line);border-radius:14px;overflow:hidden">
    <div class="kpi"><span>Valor em estoque (custo)</span><b>${kfmt(valor)}</b><em>${all.length} produtos</em></div>
    <div class="kpi"><span>Precisam de reposição</span><b style="${abaixo?'color:var(--warn)':''}">${abaixo}</b><em>abaixo do mínimo</em></div>
    <div class="kpi"><span>Esgotados</span><b style="${esg?'color:var(--bad)':''}">${esg}</b><em>aparecem esgotados no app</em></div>
    <div class="kpi"><span>Cobertura média</span><b>${cobM.toFixed(0)} dias</b><em>no ritmo de venda atual</em></div>
  </div>
  ${mv?`<div class="box2" style="border-color:var(--primary)"><div class="ordh"><h3 class="h2">${S.estMov.tipo==='entrada'?'Entrada de mercadoria':'Ajuste de estoque'} · ${esc(mv.p.nome)}</h3><button class="lbtn" style="color:var(--muted)" data-a="estMov" data-v="">Fechar</button></div>
    <div class="frm" style="grid-template-columns:${S.estMov.tipo==='entrada'?'1fr 1fr 1fr 2fr auto':'1.2fr 1fr 2fr auto'}">
      ${S.estMov.tipo==='entrada'?`<label class="lbl">Quantidade recebida<input id="mv-q" inputmode="numeric" value="${mv.sug||''}" placeholder="0"></label><label class="lbl">Custo unitário (R$)<input id="mv-c" inputmode="decimal" value="${mv.p.custo.toFixed(2).replace('.',',')}"></label><label class="lbl">Nota fiscal<input id="mv-nf" placeholder="Nº da NF"></label><label class="lbl">Fornecedor<input id="mv-f" value="${esc(mv.p.forn)}"></label>`
      :`<label class="lbl">Motivo<select id="mv-t"><option value="ajuste">Contagem (novo total)</option><option value="perda">Perda ou avaria (sai do estoque)</option></select></label><label class="lbl">Quantidade<input id="mv-q" inputmode="numeric" placeholder="${mv.p.estoque}"></label><label class="lbl">Observação<input id="mv-o" placeholder="Ex.: garrafa quebrada"></label>`}
      <button class="abtn acc" style="padding:10px 14px" data-a="estSalvar" data-v="${mv.p.id}">Registrar</button></div>
    <p class="sub" style="margin:0">Hoje: ${n(mv.p.estoque)} ${esc(mv.p.un)} · mínimo ${n(mv.p.minimo)} · vende ~${mv.m.toFixed(1).replace('.',',')} por dia</p></div>`:''}
  <div class="ordh"><div class="filt">${[['todos','Todos'],['comprar','Precisa comprar'],['esgotado','Esgotados'],['critico','Críticos'],['ok','OK']].map(([k,t])=>`<button data-a="estF" data-v="${k}" class="pill ${f===k?'st-em_rota':''}" style="border:1px solid var(--line);padding:5px 11px">${t}</button>`).join('')}</div>
    <input class="search" id="est-q" style="max-width:240px" placeholder="Buscar produto…" value="${esc(S.estQ)}"></div>
  <div class="tbl"><table style="min-width:800px"><thead><tr><th>Produto</th><th>Estoque</th><th class="r">Mínimo</th><th class="r">Venda/dia</th><th class="r">Cobertura</th><th class="r">Valor (custo)</th><th>Situação</th><th></th></tr></thead><tbody>
  ${lista.map(x=>{const pctb=Math.min(100,x.p.estoque/Math.max(1,x.p.minimo*2)*100);return `<tr>
    <td><b>${esc(x.p.nome)}</b><div class="sub">${x.p.cat} · ${esc(x.p.forn)}</div></td>
    <td style="min-width:150px"><div class="sbar"><i class="s-${x.st}" style="width:${pctb}%"></i><em style="left:50%"></em></div><span class="num sub"><b style="color:var(--ink)">${n(x.p.estoque)}</b> ${esc(x.p.un)}</span></td>
    <td class="r"><input class="costin num" style="width:64px" id="mn-${x.p.id}" inputmode="numeric" value="${x.p.minimo}" data-min="${x.p.id}" aria-label="Estoque mínimo de ${esc(x.p.nome)}"></td>
    <td class="r num">${x.m.toFixed(1).replace('.',',')}</td>
    <td class="r num" style="${x.cob<3?'color:var(--bad);font-weight:600':''}">${isFinite(x.cob)?x.cob.toFixed(0)+' dias':'—'}</td>
    <td class="r num">${fmt(x.valor)}<div class="sub">${fmt(x.p.custo)} un.</div></td>
    <td>${`<span class="pill st-${STK[x.st][1]}">${STK[x.st][0]}</span>`}${x.sug?`<div class="sub">comprar ~${n(x.sug)}</div>`:''}</td>
    <td class="r"><div class="row-a"><button class="abtn" data-a="estMov" data-v="entrada:${x.p.id}">Entrada</button><button class="abtn ghost" data-a="estMov" data-v="ajuste:${x.p.id}">Ajuste</button></div></td></tr>`}).join('')||'<tr><td colspan="8" class="sub">Nenhum produto neste filtro.</td></tr>'}
  </tbody></table></div>
  <div class="split">
    <div class="box2"><div class="ordh"><h3 class="h2">Pedido de compra sugerido</h3><span class="sub">cobre ~10 dias de venda</span></div>
      ${Object.keys(porF).length?Object.entries(porF).map(([fo,xs])=>`<div class="forn"><div class="ordh"><b>${esc(fo)}</b><span class="num sub">${fmt(xs.reduce((a,x)=>a+x.sug*x.p.custo,0))}</span></div>
        ${xs.map(x=>`<div class="ext"><span>${n(x.sug)}× ${esc(x.p.nome)}</span><span class="sub num">${fmt(x.sug*x.p.custo)}</span></div>`).join('')}
        <button class="abtn" data-a="gerarCompra" data-v="${esc(fo)}">Gerar pedido para ${esc(fo)}</button></div>`).join(''):'<p class="sub" style="margin:0">Estoque em dia. Nada para comprar agora.</p>'}</div>
    <div class="box2"><h3 class="h2">Pedidos de compra</h3>
      ${comp.length?comp.map(c=>`<div class="forn"><div class="ordh"><b>${esc(c.forn)}</b><span class="pill ${c.status==='recebido'?'st-entregue':'st-separando'}">${c.status==='recebido'?'Recebido':'Enviado'}</span></div>
        <div class="sub">${c.quando} · ${c.itens.length} itens · ${fmt(c.itens.reduce((a,i)=>a+i.qty*i.custo,0))}</div>
        ${c.status!=='recebido'?`<div class="copy"><code id="cp-${c.id}">${esc(c.msg)}</code><button class="sbtn soft" data-a="copiarCompra" data-v="${c.id}">Copiar</button></div>
        <button class="abtn acc" data-a="receberCompra" data-v="${c.id}">Mercadoria chegou: dar entrada</button>`:''}</div>`).join(''):'<p class="sub" style="margin:0">Nenhum pedido de compra ainda. Gere a partir da sugestão ao lado.</p>'}
      <h3 class="h2" style="margin-top:6px">Movimentações recentes</h3>
      ${movs.length?movs.map(m=>`<div class="ext"><span><b>${esc(pm[m.pid]?.nome||'')}</b><br><span class="sub">${{entrada:'Entrada',perda:'Perda',ajuste:'Ajuste',venda:'Venda app'}[m.tipo]} · ${esc(m.obs)} · ${m.quando} · ${esc(m.quem)}</span></span><span class="${m.qty>=0?'plus':'minus'} num">${m.qty>=0?'+':''}${n(m.qty)}</span></div>`).join(''):'<p class="sub">Sem movimentações.</p>'}
    </div>
  </div>
  <div class="note">Vendas pelo app dão baixa no estoque automaticamente. Vendas do balcão dão baixa quando o sistema de caixa estiver integrado (Configurações › Integrações). Histórico de vendas e custos são dados de exemplo.</div>`;
}

/* ---------- Relatórios ---------- */
function pRelat(){
  const d=D(),P=S.relP,cur=agg(d,P),prev=agg(d,P,P),pm=PM(),days=(H[d.id]?.days||[]).slice(90-P),ws=distWs(d);
  let labels,A,B;
  if(P<=30){labels=days.map(x=>ddmm(x.dt));A=days.map(x=>x.app);B=days.map(x=>x.bal);}
  else{labels=[];A=[];B=[];for(let i=0;i<days.length;i+=7){const ch=days.slice(i,i+7);labels.push(ddmm(ch[0].dt));A.push(ch.reduce((a,x)=>a+x.app,0));B.push(ch.reduce((a,x)=>a+x.bal,0));}}
  const cats={};Object.entries(cur.units).forEach(([id,q])=>{const p=pm[id];if(p)cats[p.cat]=(cats[p.cat]||0)+q*p.preco;});
  const prods=Object.entries(cur.units).map(([id,q])=>{const p=pm[id],r=q*p.preco,c=q*p.custo,qp=prev.units[id]||0;return{p,q,r,m:r-c,mp:r?(r-c)/r:0,part:r/(cur.rev||1),tr:qp?(q-qp)/qp:0};}).sort((a,b)=>b.r-a.r);
  const membros=cur.rev*.58,emit=Math.round(membros*d.cfg.ptsPorReal),resg=Math.round(emit*.34),custoResg=resg*.045;
  const tM=d.rel?.tM||0,tN=d.rel?.tN||0;
  const ents=d.entregadores.map((e,i)=>({e,ped:Math.round(cur.pedApp*(i===0?.62:(.38/(d.entregadores.length-1||1)))),t:cur.tempo+(i*4),pz:.93-i*.05}));
  const bairros=d.areas.map((a,i)=>({b:a.bairro,w:[.34,.22,.18,.14,.12,.08][i]||.06,t:a.frete})),bs=bairros.reduce((s,x)=>s+x.w,0);
  return `<div class="ordh"><div class="filt">${[[7,'7 dias'],[30,'30 dias'],[90,'90 dias']].map(([k,t])=>`<button data-a="relP" data-v="${k}" class="pill ${P===k?'st-em_rota':''}" style="border:1px solid var(--line);padding:5px 11px">${t}</button>`).join('')}</div>
    <span class="sub">${ddmm(days[0]?.dt||HOJE)} a ${ddmm(days[days.length-1]?.dt||HOJE)} · comparado aos ${P} dias anteriores</span></div>
  <div class="kpis k5 num" style="border:1px solid var(--line);border-radius:14px;overflow:hidden">
    <div class="kpi"><span>Faturamento</span><b>${kfmt(cur.rev)}</b>${delta(cur.rev,prev.rev)}</div>
    <div class="kpi"><span>Pedidos</span><b>${n(cur.ped)}</b>${delta(cur.ped,prev.ped)}</div>
    <div class="kpi"><span>Ticket médio</span><b>${fmt(cur.ticket)}</b>${delta(cur.ticket,prev.ticket)}</div>
    <div class="kpi"><span>Margem bruta</span><b>${pct(cur.margem)}</b><em>${kfmt(cur.rev-cur.cost)}</em></div>
    <div class="kpi"><span>Vendas pelo app</span><b>${pct(cur.app/(cur.rev||1))}</b>${delta(cur.app/(cur.rev||1),prev.app/(prev.rev||1))}</div>
  </div>
  <div class="box2"><div class="ordh"><h3 class="h2">Vendas por ${P<=30?'dia':'semana'}</h3><span class="sub">passe o mouse nas barras</span></div>${stackedChart(labels,A,B,{pre:P<=30?'':'Semana de ',aria:'Vendas por '+(P<=30?'dia':'semana')+' e canal'})}
    <details><summary>Ver como tabela</summary><div class="tbl"><table style="min-width:420px"><thead><tr><th>${P<=30?'Dia':'Semana'}</th><th class="r">App</th><th class="r">Balcão</th><th class="r">Total</th></tr></thead><tbody>${labels.map((l,i)=>`<tr><td>${l}</td><td class="r num">${fmt(A[i])}</td><td class="r num">${fmt(B[i])}</td><td class="r num">${fmt(A[i]+B[i])}</td></tr>`).join('')}</tbody></table></div></details></div>
  <div class="split">
    <div class="box2"><h3 class="h2">Vendas por categoria</h3>${hbars(Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([l,v])=>({l,v,s:pct(v/(cur.rev||1))+' do faturamento'})),kfmt)}</div>
    <div class="box2"><h3 class="h2">Horários de pico</h3><p class="sub" style="margin:0">Pedidos por dia da semana e hora. Use para escalar entregadores e reforçar o estoque.</p>${heatmap(d,P)}</div>
  </div>
  <div class="box2"><div class="ordh"><h3 class="h2">Produtos</h3><span class="sub">${prods.length} vendidos no período</span></div>
    <div class="tbl"><table style="min-width:760px"><thead><tr><th>Produto</th><th class="r">Qtd.</th><th class="r">Faturamento</th><th class="r">Participação</th><th class="r">Lucro bruto</th><th class="r">Margem</th><th class="r">vs. período anterior</th></tr></thead><tbody>
    ${prods.map(x=>`<tr><td><b>${esc(x.p.nome)}</b><div class="sub">${x.p.cat}</div></td><td class="r num">${n(x.q)}</td><td class="r num">${fmt(x.r)}</td><td class="r num">${pct(x.part)}</td><td class="r num">${fmt(x.m)}</td><td class="r num">${pct(x.mp)}</td><td class="r num"><span class="${x.tr>=0?'up':'down'}">${x.tr>=0?'▲':'▼'} ${Math.abs(x.tr*100).toFixed(0)}%</span></td></tr>`).join('')}
    </tbody></table></div></div>
  <div class="cmp num">
    <div><span>Clientes novos no programa</span><b>${n(cur.novos)}</b>${delta(cur.novos,prev.novos)}</div>
    <div><span>Ticket · cliente do programa</span><b>${fmt(tM)}</b><small>+${tN?Math.round((tM/tN-1)*100):0}% vs. ${fmt(tN)} de quem não participa</small></div>
    <div><span>Pontos emitidos · resgatados</span><b>${n(emit)} · ${n(resg)}</b><span>taxa de resgate ${pct(resg/(emit||1))}</span></div>
    <div><span>Custo dos prêmios (estimado)</span><b>${fmt(custoResg)}</b><span>${pct(custoResg/(cur.rev||1))} do faturamento</span></div>
  </div>
  <div class="split">
    <div class="box2"><h3 class="h2">Entregas por entregador</h3>
      <div class="tbl"><table style="min-width:300px"><thead><tr><th>Entregador</th><th class="r">Entregas</th><th class="r">Tempo médio</th><th class="r">No prazo</th></tr></thead><tbody>
      ${ents.map(x=>`<tr><td><b>${esc(x.e)}</b></td><td class="r num">${n(x.ped)}</td><td class="r num">${Math.round(x.t)} min</td><td class="r num" style="${x.pz<.88?'color:var(--warn)':''}">${pct(x.pz)}</td></tr>`).join('')}</tbody></table></div></div>
    <div class="box2"><h3 class="h2">Pedidos por bairro</h3>${bairros.length?hbars(bairros.map(x=>({l:x.b,v:Math.round(cur.pedApp*x.w/bs),s:(x.t?'taxa '+fmt(x.t):'entrega grátis')})),v=>n(v)+' pedidos'):'<p class="sub">Sem área de entrega.</p>'}</div>
  </div>
  <div class="note">Histórico de vendas, custos, horários e entregas são dados de exemplo para o protótipo. Na versão real, tudo sai dos pedidos, do balcão e do estoque registrados no sistema.</div>`;
}

