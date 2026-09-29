/* Resultado do programa: a conta que mostra ao dono da distribuidora quanto o DistribPontos rende */
TABS.resultado='Resultado do programa';
ROLE_TABS.dono.splice(ROLE_TABS.dono.indexOf('relatorios')+1,0,'resultado');
NAV_GRP[2][1].splice(NAV_GRP[2][1].indexOf('relatorios')+1,0,'resultado');
SUBT.resultado='Quanto o programa de pontos trouxe de venda nos últimos 30 dias';
PICO.resultado='<path d="M4 17l5-5 4 4 7-8"/><path d="M15 8h5v5"/>';
PLAN_TABS.push('resultado');
const VOLTARAM_BASE={d1:23,d2:9,d3:14};
const CUSTO_PONTO=0.045; /* custo médio de 1 ponto em prêmios, em reais (exemplo) */

function calcResultado(d){const r=d.rel,cur=agg(d,30);if(!r||!cur.rev)return null;
  const recMembros=cur.rev*.58,valorMembro=r.tM*r.fM,valorNao=r.tN*r.fN,extra=recMembros*(1-valorNao/valorMembro);
  const lucroExtra=extra*cur.margem,pts=Math.round(recMembros*d.cfg.ptsPorReal),resg=Math.round(pts*.34),custoPremios=resg*CUSTO_PONTO,mens=PLANOS[d.plano].preco;
  const voltaram=(VOLTARAM_BASE[d.id]||0)+d.campLog.reduce((a,x)=>a+x.n,0),investe=custoPremios+mens;
  return {cur,recMembros,extra,lucroExtra,custoPremios,mens,investe,retorno:(lucroExtra-investe)/investe,porReal:lucroExtra/investe,voltaram,r,resg,part:recMembros/cur.rev};}

function cmpBar(l,a,b,fa){const mx=Math.max(a,b)||1;
  return `<div class="cbar"><span class="cl">${l}</span><div class="ct"><span>Clientes do programa</span><i style="width:${a/mx*100}%;background:var(--c-bal)"></i><b class="num">${fa(a)}</b></div><div class="ct"><span>Quem não participa</span><i style="width:${b/mx*100}%;background:var(--line)"></i><b class="num">${fa(b)}</b></div></div>`;}

function pResultado(){const d=D(),x=calcResultado(d);
  if(!x)return `<div class="empty">Ainda não há vendas suficientes para calcular o resultado desta loja. Ele aparece depois do primeiro mês de uso.</div>`;
  const vx=v=>String(v.toFixed(1)).replace('.',',');
  const txt=`${d.nome}: resultado do DistribPontos nos últimos 30 dias.\n- Venda a mais com clientes do programa: ${fmt(x.extra)} (lucro bruto de ${fmt(x.lucroExtra)})\n- Custo do programa: ${fmt(x.investe)} (plano ${fmt(x.mens)} + prêmios ${fmt(x.custoPremios)})\n- Para cada R$ 1,00 investido, voltaram R$ ${vx(x.porReal)} de lucro bruto\n- ${x.voltaram} clientes voltaram a comprar depois de uma campanha`;
  return `<div class="roi"><div><span class="sub">Para cada R$ 1,00 investido no programa</span><b class="num">R$ ${vx(x.porReal)}</b><span>de lucro bruto a mais voltaram para a loja</span></div>
    <p>Clientes do programa gastam <b>${Math.round((x.r.tM/x.r.tN-1)*100)}% a mais por pedido</b> e compram <b>${vx(x.r.fM/x.r.fN)}× mais vezes</b> por mês do que quem não participa.</p></div>
  <div class="cmp num">
    <div><span>Venda a mais (30 dias)</span><b>${kfmt(x.extra)}</b><small>${pct(x.part)} do faturamento vem de clientes do programa</small></div>
    <div><span>Lucro bruto a mais</span><b>${kfmt(x.lucroExtra)}</b><span>margem de ${pct(x.cur.margem)}</span></div>
    <div><span>Custo do programa</span><b>${fmt(x.investe)}</b><span>plano ${d.plano} ${fmt(x.mens)} + prêmios ${fmt(x.custoPremios)}</span></div>
    <div><span>Clientes que voltaram</span><b>${x.voltaram}</b><span>depois de uma campanha automática</span></div>
  </div>
  <div class="split">
    <div class="box2"><h3 class="h2">Cliente do programa × quem não participa</h3>
      ${cmpBar('Gasto por pedido',x.r.tM,x.r.tN,fmt)}
      ${cmpBar('Compras por mês',x.r.fM,x.r.fN,v=>vx(v)+'×')}
      ${cmpBar('Gasto por mês',x.r.tM*x.r.fM,x.r.tN*x.r.fN,fmt)}</div>
    <div class="box2"><h3 class="h2">Como a conta é feita</h3>
      <div class="kv"><span>Faturamento de clientes do programa</span><b class="num">${fmt(x.recMembros)}</b></div>
      <div class="kv"><span>Se gastassem como quem não participa</span><b class="num">${fmt(x.recMembros-x.extra)}</b></div>
      <div class="kv"><span>Diferença (venda a mais)</span><b class="num">${fmt(x.extra)}</b></div>
      <div class="kv"><span>Pontos trocados por prêmios</span><b class="num">${n(x.resg)} pts</b></div>
      <div class="kv"><span>Custo médio do ponto em prêmios</span><b class="num">${fmt(CUSTO_PONTO)}</b></div></div>
  </div>
  <div class="box2"><div class="ordh"><h3 class="h2">Resumo para mandar ao dono</h3><button class="abtn ghost" data-a="copiarRes">Copiar texto</button></div><pre class="restxt" id="res-txt">${esc(txt)}</pre></div>
  <div class="note">Números de exemplo, calculados a partir do histórico de vendas simulado. Na versão real, a comparação usa os pedidos e as compras no balcão de quem tem e de quem não tem CPF cadastrado.</div>`;}

Object.assign(ACT,{copiarRes:()=>{const t=document.getElementById('res-txt').textContent;try{navigator.clipboard.writeText(t).then(()=>toast('Resumo copiado'),()=>toast('Selecione o texto e copie'));}catch(e){toast('Selecione o texto e copie')}}});
