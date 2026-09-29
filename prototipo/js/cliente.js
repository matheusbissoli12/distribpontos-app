/* App do cliente (tela do celular) */
/* ================= APP ================= */
const NAVI={
  inicio:'<path d="M3.5 10.5 12 4l8.5 6.5V20h-5.5v-5.5h-6V20H3.5z"/>',
  pedidos:'<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',
  pontos:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v9M9.5 9.5h3.5a1.75 1.75 0 0 1 0 3.5h-2a1.75 1.75 0 0 0 0 3.5H14.5"/>',
  perfil:'<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20.5c.8-3.8 3.8-5.8 7.5-5.8s6.7 2 7.5 5.8"/>'
};
const me=()=>S.clientes[S.sess];
const myWallets=()=>Object.values(S.w).filter(w=>w.cpf===S.sess&&S.dists[w.dist]);
const cartItems=()=>{const pm=PM();return Object.entries(S.cart.items).filter(([id])=>pm[id]).map(([id,qty])=>({id,qty,preco:pm[id].preco}))};
const sub=items=>items.reduce((a,b)=>a+b.preco*b.qty,0);
const endB=()=>S.endAtual?.bairro||null;
function freteCart(dist,s){if(S.entrega==='retirada')return 0;return freteDe(S.dists[dist],endB(),s)??0;}
const bairroOpts=sel=>BAIRROS.map(([b,c])=>`<option value="${b}" ${b===sel?'selected':''}>${b} · ${c}</option>`).join('');

function qr(seed){let s=(seed*7919)%2147483647||7;const r=()=>(s=s*16807%2147483647)/2147483647;const N=25,c=6;let out='';
  const fd=(x,y)=>`<rect x="${x*c}" y="${y*c}" width="${7*c}" height="${7*c}" fill="#000"/><rect x="${(x+1)*c}" y="${(y+1)*c}" width="${5*c}" height="${5*c}" fill="#fff"/><rect x="${(x+2)*c}" y="${(y+2)*c}" width="${3*c}" height="${3*c}" fill="#000"/>`;
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const f=(x<8&&y<8)||(x>16&&y<8)||(x<8&&y>16);if(!f&&r()<.48)out+=`<rect x="${x*c}" y="${y*c}" width="${c}" height="${c}" fill="#000"/>`;}
  return `<svg viewBox="-8 -8 166 166" class="qr" role="img" aria-label="QR code Pix ilustrativo"><rect x="-8" y="-8" width="166" height="166" fill="#fff"/>${out}${fd(0,0)}${fd(18,0)}${fd(0,18)}</svg>`;}

function vTermos(){return `<button class="back" style="align-self:flex-start;font-size:14px;color:var(--primary);font-weight:600" data-a="termos" data-v="0">‹ Voltar</button>
  <div class="card legal"><h2 class="h2">Termos de uso e privacidade</h2>
  <p class="sub">Modelo para o protótipo. Revisar com advogado antes de publicar.</p>
  <h3>Termos de uso</h3><ul><li>O DistribPontos conecta você a distribuidoras parceiras. Cada distribuidora é responsável pelos produtos, preços, entregas e prêmios que oferece.</li><li>Pontos são pessoais, ligados ao CPF, não podem ser vendidos nem trocados por dinheiro e vencem em 12 meses.</li><li>Lançamentos indevidos podem ser estornados.</li></ul>
  <h3>Dados que coletamos</h3><ul><li>CPF, nome, celular e endereço de entrega.</li><li>Histórico de compras no app e nas lojas físicas em que você informar o CPF.</li></ul>
  <h3>Para que usamos</h3><ul><li>Identificar você, entregar pedidos e calcular pontos.</li><li>Enviar ofertas, só se você autorizar.</li></ul>
  <h3>Com quem compartilhamos</h3><p>Somente com a distribuidora em que você compra. Ela vê seu nome e o CPF parcialmente mascarado.</p>
  <h3>Seus direitos (LGPD)</h3><p>Pedir cópia, correção ou exclusão dos seus dados a qualquer momento em Perfil. Encarregado de dados: privacidade@distribpontos.com.br</p></div>`;}

function foundHTML(cpf){const pend=Object.values(S.w).filter(w=>w.cpf===cpf&&w.saldo>0);
  return pend.length&&!isCad(cpf)?`<div class="found">Encontramos <b>${n(pend.reduce((s,w)=>s+w.saldo,0))} pontos</b> de compras na loja física esperando por você em ${pend.map(w=>esc(S.dists[w.dist].nome)).join(', ')}.</div>`:'';}
function vAuth(){
  const a=S.auth,err=a.err?`<div class="err">${a.err}</div>`:'';
  if(a.step==='cel')return `<div class="auth">
    <div class="auth-hero"><div class="logo">Distrib<b>Pontos</b></div><span class="sub">Peça e ganhe pontos nas distribuidoras da sua região</span></div>
    <div class="cpfcard"><small>Cartão fidelidade</small><span class="n">000.000.000-00</span><small>Seu CPF vale no app e no caixa das lojas parceiras</small></div>
    <h2>Entre com seu celular</h2>
    <p class="sub" style="margin:0">Enviamos um código por SMS. Na primeira vez, você completa o cadastro com seu CPF, que vira seu cartão fidelidade.</p>
    <label class="lbl">Celular com DDD<input class="inp big" id="au-cel" inputmode="tel" autocomplete="tel" placeholder="(27) 99999-9999" value="${esc(a.cel)}"></label>
    ${err}
    <button class="btn" data-a="authCel">Receber código por SMS</button>
    <div class="note">Exemplos: <b class="mono">(27) 99812-4410</b> entra como Ana, que já tem conta. Qualquer outro número cria uma conta nova.</div>
    <button class="sub" style="text-decoration:underline" data-a="termos" data-v="1">Termos de uso e política de privacidade</button></div>`;
  if(a.step==='codigo')return `<div class="auth">
    <button class="back" data-a="authBack" aria-label="Voltar">‹</button>
    <h2>Digite o código</h2>
    <p class="sub" style="margin:0">Enviamos um SMS para ${esc(a.cel)}.</p>
    <label class="lbl">Código<input class="inp big" id="au-cod" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000"></label>
    ${err}
    <button class="btn" data-a="authCod">Entrar</button>
    <button class="btn ghost" data-a="authBack">Trocar número</button>
    <p class="sub" style="margin:0">No protótipo, o código é <b class="mono">123456</b> (o mesmo número de teste sugerido no README do app).</p></div>`;
  return `<div class="auth">
    <button class="back" data-a="authBack" aria-label="Voltar">‹</button>
    <h2>Complete seu cadastro</h2>
    <div class="kv" style="border:0;padding:0"><span>Celular confirmado</span><b>${esc(a.cel)}</b></div>
    <label class="lbl">Nome completo<input class="inp" id="au-nome" autocomplete="name" value="${esc(a.nome)}"></label>
    <label class="lbl">CPF (vira seu cartão fidelidade)<input class="inp big" id="au-cpf" inputmode="numeric" autocomplete="off" placeholder="000.000.000-00" value="${maskCpf(a.cpf)}"></label>
    <div id="au-found">${foundHTML(dig(a.cpf))}</div>
    <label class="lbl">E-mail (opcional)<input class="inp" id="au-email" type="email" autocomplete="email" value="${esc(a.email||'')}"></label>
    <label class="lbl"><span>Código de indicação (opcional) ${PL}</span><input class="inp" id="au-ind" autocomplete="off" placeholder="Ex.: JOSE1133" value="${esc(a.ind)}"></label>
    <label class="chk"><input type="checkbox" id="au-ok">Li e aceito os termos de uso e autorizo o uso do meu CPF e do histórico de compras para o programa de pontos (LGPD).</label>
    <button class="sub" style="text-decoration:underline;text-align:left" data-a="termos" data-v="1">Ler termos e política de privacidade</button>
    <label class="chk"><input type="checkbox" id="au-mkt" checked>Quero receber ofertas e avisos de pontos.</label>
    ${err}
    <button class="btn acc" data-a="authCriar">Criar conta</button></div>`;
}
function dlistHTML(){const q=S.q.trim().toLowerCase(),b=endB();
  const ds=Object.values(S.dists).filter(d=>d.status==='ativa'&&(!q||(d.nome+d.seg+d.cidade).toLowerCase().includes(q)));
  if(!S.endAtual)return ds.length?ds.slice().sort((x,y)=>aberta(y)-aberta(x)).map(d=>dcardHTML(d)).join(''):'<div class="empty">Nenhuma distribuidora encontrada.</div>';
  const ent=(b?ds.filter(d=>area(d,b)):[]).sort((x,y)=>aberta(y)-aberta(x)),ret=ds.filter(d=>!area(d,b)).sort((x,y)=>aberta(y)-aberta(x));
  return `${!b?'':ent.length?ent.map(d=>dcardHTML(d)).join(''):`<div class="empty">Nenhuma distribuidora parceira entrega em ${esc(b)} ainda.</div>`}
  ${ret.length?`<p class="groupt">${b?'Não entregam no seu bairro · ':''}Retirada na loja</p>${ret.map(d=>dcardHTML(d,true)).join('')}`:''}`;}
function vEndereco(){const e=S.endAtual&&!S.endAtual.retirada?S.endAtual:{bairro:'',rua:'',comp:''};
  return `<div style="display:flex;flex-direction:column;gap:10px">
    <h2 class="h2">Onde vamos entregar?</h2>
    <p class="sub" style="margin:0">Informe o endereço deste pedido para ver as distribuidoras que atendem você.</p>
    <label class="lbl">Bairro<select class="inp" id="en-bairro"><option value="" ${e.bairro?'':'selected'} disabled>Selecione o bairro</option>${BAIRROS.map(([b,c])=>`<option value="${b}" ${b===e.bairro?'selected':''}>${b} · ${c}</option>`).join('')}</select></label>
    <label class="lbl">Rua e número<input class="inp" id="en-rua" autocomplete="street-address" placeholder="Ex.: Rua das Palmeiras, 45" value="${esc(e.rua)}"></label>
    <label class="lbl">Complemento (opcional)<input class="inp" id="en-comp" placeholder="Apto, bloco, referência" value="${esc(e.comp)}"></label>
    ${S.endErr?`<div class="err">${S.endErr}</div>`:''}
    <button class="btn" data-a="salvarEnd">Confirmar endereço</button>
    <button class="btn ghost" data-a="retirar">Prefiro retirar na loja</button>
    <button class="sub" style="text-decoration:underline" data-a="editEnd" data-v="0">Cancelar</button>
  </div>`;}
function listaHTML(){const q=S.q.trim().toLowerCase();
  const l=S.produtos.filter(p=>p.dist===S.adist&&p.ativo&&(S.cat==='Todos'||p.cat===S.cat)&&(!q||p.nome.toLowerCase().includes(q))).sort((a,b)=>(a.estoque<=0)-(b.estoque<=0));
  return l.length?l.map(p=>prodRow(p)).join(''):'<div class="empty">Nenhum produto encontrado.</div>';}
function vCarrinho(){
  const items=cartItems(),dist=S.cart.dist;
  if(!items.length)return `<h2 class="h2">Carrinho</h2><div class="empty">Seu carrinho está vazio.<br><br><button class="btn ghost" data-a="tab" data-v="inicio">Ver distribuidoras</button></div>`;
  const d=S.dists[dist],w=W(dist,S.sess),a=area(d,endB());if(!a)S.entrega='retirada';if(S.pag==='pix'&&!d.integ.mp)S.pag='dinheiro';
  const s=sub(items),f=freteCart(dist,s),p=calcPts(dist,items,w),t=tier(dist,w),abaixo=s<d.min,ab=aberta(d),pm=PM();
  const fr=freteDe(d,endB(),s);
  return `<h2 class="h2">Carrinho · ${esc(d.nome)}</h2>
  <div class="list">${items.map(x=>prodRow(pm[x.id],true)).join('')}</div>
  <div class="card"><div class="sub" style="font-weight:600;color:var(--ink)">Receber como</div>
    <div class="opts">
      <button class="opt ${S.entrega==='entrega'?'on':''}" data-a="entrega" data-v="entrega" ${a?'':'disabled'}>Entrega<small>${a?`${fr?fmt(fr):'Grátis'} · ${d.prazo}`:S.endAtual?'Fora da área':'Informe o endereço'}</small></button>
      <button class="opt ${S.entrega==='retirada'?'on':''}" data-a="entrega" data-v="retirada">Retirar na loja<small>${esc(d.bairro)}</small></button>
    </div>
    ${!S.endAtual?`<button class="btn ghost" style="margin-top:8px" data-a="editEnd">Informar endereço de entrega</button>`:''}
    ${S.entrega==='entrega'&&S.endAtual?`<p class="sub" style="margin:8px 0 0">Entregar em: ${esc(S.endAtual.rua)}${S.endAtual.comp?' · '+esc(S.endAtual.comp):''}, ${esc(S.endAtual.bairro)}</p>`:''}
    <div class="sub" style="font-weight:600;color:var(--ink);margin-top:12px">Pagamento</div>
    <div class="opts">${Object.entries(PAG).map(([k,l])=>`<button class="opt ${S.pag===k?'on':''}" data-a="pag" data-v="${k}" ${k==='pix'&&!d.integ.mp?'disabled':''}>${l}<small>${k==='pix'&&!d.integ.mp?'Loja ainda sem Pix pelo app':{pix:'Pague agora pelo app',cartao:'Maquininha na entrega',dinheiro:'Informe o troco'}[k]}</small></button>`).join('')}</div>
    <div class="sub" style="font-weight:600;color:var(--ink);margin-top:12px">Repetir este pedido ${PL}</div>
    <div class="fr" style="margin-top:6px">${[[0,'Não repetir'],[7,'A cada 7 dias'],[15,'A cada 15 dias'],[30,'A cada 30 dias']].map(([k,l])=>`<button class="chip ${S.recFreq===k?'on':''}" data-a="recFreq" data-v="${k}">${l}</button>`).join('')}</div>
  </div>
  <div class="card num">
    <div class="line"><span>Subtotal</span><span>${fmt(s)}</span></div>
    <div class="line"><span>Entrega</span><span>${f?fmt(f):'Grátis'}</span></div>
    <div class="line total"><span>Total</span><span>${fmt(s+f)}</span></div>
  </div>
  <div class="gain">Você ganha <b class="num">+${n(p)} pontos</b>${w.bonus2x?' (em dobro: volta de cliente)':t.m>1?` (bônus ${t.n} ${String(t.m).replace('.',',')}×)`:''}. Os pontos entram quando o pedido for entregue.</div>
  ${abaixo?`<div class="alert">Faltam ${fmt(d.min-s)} para o pedido mínimo desta distribuidora.</div>`:''}
  ${!ab?`<div class="closed">${lojaTxt(d)}. Volte no horário de funcionamento.</div>`:''}
  <button class="btn acc" data-a="enviar" ${abaixo||!ab?'disabled':''}>${S.pag==='pix'?'Pagar com Pix':'Enviar pedido'} · ${fmt(s+f)}</button>`;
}
function vPix(){const o=S.pixPend;const code=`00020126580014br.gov.bcb.pix0136${o.dist}-${o.id}-distribpontos5204000053039865406${o.total.toFixed(2)}5802BR6007VITORIA62070503***6304A1B2`;
  return `<h2 class="h2">Pague com Pix</h2>
  <div class="card" style="display:flex;flex-direction:column;gap:12px;align-items:stretch">
    <div style="text-align:center"><div class="sub">${esc(S.dists[o.dist].nome)} · pedido #${o.id}</div><div style="font-family:var(--disp);font-size:34px;font-weight:700" class="num">${fmt(o.total)}</div></div>
    <div class="qrwrap">${qr(o.id)}</div>
    <p class="sub" style="text-align:center;margin:0">Abra o app do seu banco, escolha Pix › Ler QR code, ou copie o código abaixo. Se não for pago em 30 minutos, o pedido é cancelado e o estoque volta.</p>
    <div class="copy"><code id="pixcode">${code}</code><button class="sbtn soft" data-a="copiar">Copiar</button></div>
  </div>
  <div class="note">O pagamento cai direto na conta da distribuidora (repasse pela plataforma de pagamento). QR ilustrativo no protótipo.</div>
  <button class="btn acc" data-a="pixOk">Simular pagamento aprovado</button>
  <button class="btn ghost" data-a="pixCancel">Voltar ao carrinho</button>`;}
function ordCard(o){const i=FLOW.indexOf(o.status),d=S.dists[o.dist],ch=S.chamados.find(c=>c.pedido===o.id);
  return `<div class="card ord"><div class="ordh"><div><b class="num">#${o.id}</b> <span class="sub">${o.dia} ${o.hora}</span></div>${o.canal==='balcao'?'<span class="tag bl">Loja física</span>':o.tipo==='resgate'?'<span class="tag rs">Resgate</span>':stPill(o.status)}</div>
    <div style="font-weight:600;font-size:13px">${esc(d.nome)}</div>
    <div class="sub" style="color:var(--ink)">${itensTxt(o)}</div>
    ${o.canal==='app'&&o.tipo==='compra'?`<div class="sub">${o.pagStatus==='pago'?'<span class="st-open">Pix pago</span>':'Pagar na entrega · '+(PAG[o.pag]||'')}${o.recorr?' · pedido programado':''}</div>`:''}
    ${o.canal==='app'&&o.status!=='cancelado'?(()=>{const fl=o.entrega==='retirada'?['novo','separando','entregue']:FLOW,j=fl.indexOf(o.status);return `<div class="track" style="grid-template-columns:repeat(${fl.length},1fr)">${fl.map((s,k)=>`<div class="${k<=j?'done':''}">${s==='entregue'&&o.entrega==='retirada'?'Retirado':STL[s]}</div>`).join('')}</div>`})():''}
    ${o.canal==='app'&&o.status==='novo'?`<button class="sub" style="text-decoration:underline;align-self:flex-start;color:var(--bad)" data-a="cliCancel" data-v="${o.id}">Cancelar pedido</button>`:''}
    ${o.problema&&!o.problema.ref&&o.status==='em_rota'?`<div class="alert" style="display:flex;flex-direction:column;gap:8px"><span><b>O entregador precisa de ajuda:</b> ${esc(o.problema.tipo).toLowerCase()}.</span><input class="inp" id="ref-${o.id}" placeholder="Ex.: portão azul ao lado da padaria"><button class="sbtn" style="align-self:flex-start" data-a="enviarRef" data-v="${o.id}">Enviar referência ao entregador</button></div>`:''}
    ${o.status==='em_rota'?`<div class="card" style="background:var(--surface2);padding:10px">${mapa(o)}<div class="eta"><span><b>${esc(o.entregador||'Entregador')}</b> · moto</span><span>Chega por volta de <b>${o.eta||'--:--'}</b></span></div></div>`:''}
    <div class="ordh num"><span>${o.tipo==='resgate'?`<span class="minus">−${n(o.pts)} pts</span>`:`<b>${fmt(o.total)}</b> · <span class="earn">${o.status==='entregue'?'+'+n(o.pts)+' pts creditados':o.status==='cancelado'?'sem pontos':'+'+n(o.pts)+' pts na entrega'}</span>`}</span>
    ${o.canal==='app'&&o.tipo==='compra'&&d.status==='ativa'?`<button class="sbtn soft" data-a="repetir" data-v="${o.id}">Pedir de novo</button>`:''}</div>
    ${o.canal==='app'&&o.status==='entregue'?(o.nota?`<div class="sub">Sua avaliação: <span class="rate">${'★'.repeat(o.nota)}${'☆'.repeat(5-o.nota)}</span></div>`:`<div class="eta"><span class="sub">Como foi este pedido? ${PL}</span><div class="stars">${[1,2,3,4,5].map(k=>`<button data-a="nota" data-v="${o.id}:${k}" aria-label="${k} estrelas">★</button>`).join('')}</div></div>`):''}
    ${ch?`<div class="${ch.status==='aberto'?'alert':'gain'}"><b>Chamado ${STL[ch.status].toLowerCase()}:</b> ${esc(ch.tipo)}${ch.resposta?`<br>Resposta da loja: ${esc(ch.resposta)}${ch.comp?` · +${n(ch.comp)} pts de compensação`:''}`:' · a loja responde em até 1 hora'}</div>`
      :o.canal==='app'&&o.tipo==='compra'&&o.status!=='cancelado'?(S.helpFor===o.id?`<div class="card" style="background:var(--surface2);display:flex;flex-direction:column;gap:8px">
        <label class="lbl">Qual o problema?<select class="inp" id="hp-tipo"><option>Item faltando</option><option>Produto avariado</option><option>Atraso na entrega</option><option>Cobrança errada</option><option>Outro</option></select></label>
        <textarea class="txt" id="hp-msg" placeholder="Conte o que aconteceu"></textarea>
        <div style="display:flex;gap:6px"><button class="sbtn" style="background:var(--surface);color:var(--ink)" data-a="help" data-v="">Cancelar</button><button class="sbtn" data-a="abrirChamado" data-v="${o.id}">Enviar para a loja</button></div></div>`
      :`<button class="sub" style="text-decoration:underline;align-self:flex-start" data-a="help" data-v="${o.id}">Preciso de ajuda com este pedido</button> ${PL}`):''}
  </div>`;}
function vPedidos(){
  const l=S.pedidos.filter(o=>o.cpf===S.sess),rc=S.recorr.filter(r=>r.cpf===S.sess&&r.ativo),pm=PM();
  return `${rc.length?`<h2 class="h2">Pedidos programados ${PL}</h2>${rc.map(r=>`<div class="card ord"><div class="ordh"><b>${esc(S.dists[r.dist].nome)}</b><span class="pill st-em_rota">a cada ${r.freq} dias</span></div>
    <div class="sub" style="color:var(--ink)">${r.itens.map(x=>`${x.qty}× ${esc(pm[x.id]?.nome||'')}`).join(' · ')}</div>
    <div class="ordh"><span class="sub">Próximo: <b style="color:var(--ink)">${r.prox}</b> · ${PAG[r.pag]}</span><button class="sbtn soft" data-a="recCancel" data-v="${r.id}">Cancelar</button></div></div>`).join('')}`:''}
  <h2 class="h2">Meus pedidos e compras</h2>`+(l.length?l.map(ordCard).join(''):'<div class="empty">Nenhum pedido ainda.</div>');
}
function vPontos(){
  const ws=myWallets();
  if(!S.pwal){const tot=ws.reduce((a,w)=>a+w.saldo,0),venc=ws.filter(w=>w.vencendo);
    return `<div class="wallet"><span style="font-size:13px;opacity:.9">Total em pontos</span><div class="big num">${n(tot)}<small>pts</small></div>
      <div class="meta"><span>em ${ws.length} ${ws.length===1?'distribuidora':'distribuidoras'}</span><span>CPF ${cpfFmt(S.sess)}</span></div></div>
    ${venc.map(w=>`<div class="alert"><b>${n(w.vencendo.pts)} pts vencem em ${w.vencendo.data}</b> na ${esc(S.dists[w.dist].nome)}. Troque antes de perder.</div>`).join('')}
    <p class="sub" style="margin:0">Cada distribuidora tem seus próprios pontos e prêmios. Toque para ver e trocar.</p>
    <div class="list">${ws.length?ws.map(w=>{const d=S.dists[w.dist];return `<button class="dcard" data-a="pwal" data-v="${d.id}"><div class="dlogo" style="background:${d.cor}">${initials(d.nome)}</div>
      <div><div class="nm">${esc(d.nome)}</div><div class="ds" style="margin-top:3px">${tierPill(d.id,w)}${w.pendente?` <span class="earn" style="font-size:12px">+${n(w.pendente)} a creditar</span>`:''}</div></div>
      <div class="mypts"><b class="num">${n(w.saldo)}</b>pts</div></button>`}).join(''):'<div class="empty">Você ainda não tem pontos. Faça um pedido ou informe seu CPF no caixa.</div>'}</div>`;}
  const d=S.dists[S.pwal],w=W(d.id,S.sess),t=tier(d.id,w),nx=t.next,pct=nx?Math.min(100,(w.acumulado-nx.base)/(nx.alvo-nx.base)*100):100;
  return `<button class="back" style="align-self:flex-start;font-size:14px;color:var(--primary);font-weight:600" data-a="pwal" data-v="">‹ Todas as carteiras</button>
  <div class="wallet" style="background:${d.cor};color:#fff">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span style="font-size:13px;opacity:.9">${esc(d.nome)}</span>${tierPill(d.id,w)}</div>
    <div class="big num">${n(w.saldo)}<small>pts</small></div>
    ${w.pendente?`<div style="font-size:12.5px;opacity:.92">+${n(w.pendente)} pts a creditar (pedidos em andamento)</div>`:''}
    ${w.vencendo?`<div style="font-size:12.5px;font-weight:600">${n(w.vencendo.pts)} pts vencem em ${w.vencendo.data}</div>`:''}
    <div class="bar"><i style="width:${pct}%"></i></div>
    <div class="meta"><span>${n(w.acumulado)} pts em 12 meses</span><span>${nx?`faltam ${n(nx.alvo-w.acumulado)} p/ ${nx.n}`:'Nível máximo'}</span></div>
  </div>
  <div class="card"><h2 class="h2">Como funciona</h2><p class="sub" style="margin:4px 0 10px">Cada ${fmt(1/d.cfg.ptsPorReal)} vale 1 ponto, no app ou no caixa (informe o CPF). Pontos valem ${d.cfg.validade} meses. Indique amigos e ganhe ${n(d.cfg.indicacao)} pts.</p>
    <div class="rules"><div><b>1×</b>Bronze</div><div><b>1,25×</b>Prata · ${n(d.cfg.prata)}+</div><div><b>1,5×</b>Ouro · ${n(d.cfg.ouro)}+</div></div></div>
  <div class="card"><h2 class="h2">Trocar pontos</h2>
    ${d.premios.filter(r=>r.ativo).map(r=>{const ok=w.saldo>=r.custo;return `<div class="prem"><div class="tile art" style="--h:${(CAT[r.cat]||CAT.Outros).h}">${prodArt(r)}</div>
      <div><div class="pname">${esc(r.nome)}</div><div class="cost num">${n(r.custo)} <span class="sub" style="font-family:var(--body);font-weight:400">pts</span></div></div>
      <button class="sbtn" data-a="resgatar" data-v="${r.id}" ${ok?'':'disabled'}>${ok?'Trocar':'Faltam '+n(r.custo-w.saldo)}</button>
      ${S.confirm===r.id?`<div class="confirm"><span>Trocar ${n(r.custo)} pts por <b>${esc(r.nome)}</b>? Vai na próxima entrega ou retire na loja.</span><div><button class="sbtn" style="background:var(--surface);color:var(--ink)" data-a="cancelaResg">Voltar</button><button class="sbtn ok" data-a="confirmaResg" data-v="${r.id}">Confirmar</button></div></div>`:''}</div>`}).join('')||'<p class="sub">Esta distribuidora ainda não cadastrou prêmios.</p>'}</div>
  <div class="card"><h2 class="h2">Extrato</h2>
    ${w.extrato.map(e=>`<div class="ext num"><span><span class="sub">${e.d}</span> · ${esc(e.desc)}</span><span class="${e.pts>=0?'plus':'minus'}">${e.pts>=0?'+':''}${n(e.pts)}</span></div>`).join('')||'<p class="sub">Sem movimentações.</p>'}</div>`;
}
function vPerfil(){const c=me(),ind=Object.values(S.clientes).filter(x=>x.indicadoPor===c.cpf);
  return `<div class="cpfcard"><small>Cartão fidelidade · informe no caixa</small><span class="n">${cpfFmt(S.sess)}</span><small>${esc(c.nome)}</small></div>
  <div class="card"><h2 class="h2">Indique e ganhe ${PL}</h2><p class="sub" style="margin:4px 0 8px">Seu amigo cria a conta com seu código. Quando o primeiro pedido dele for entregue, vocês dois ganham pontos na distribuidora onde ele comprou.</p>
    <div class="copy"><code style="font-size:16px;text-align:center">${c.codigo}</code><button class="sbtn soft" data-a="copiarCod">Copiar</button></div>
    ${ind.length?ind.map(x=>`<div class="kv"><span>${esc(x.nome)}</span><b style="color:${x.indicPago?'var(--ok)':'var(--warn)'}">${x.indicPago?'Bônus recebido':'Aguardando 1º pedido'}</b></div>`).join(''):'<p class="sub" style="margin:8px 0 0">Nenhuma indicação ainda.</p>'}</div>
  <div class="card"><h2 class="h2">Meus dados</h2>
    <div class="kv"><span>Nome</span><b>${esc(c.nome)}</b></div>
    <div class="kv"><span>CPF</span><b class="mono">${cpfFmt(c.cpf)}</b></div>
    <div class="kv"><span>Celular</span><b>${esc(c.cel)}</b></div>
    <div class="kv"><span>Cliente desde</span><b>${c.desde}</b></div>
    <div class="kv"><span>Ofertas no WhatsApp</span><button class="sw ${c.mkt?'on':''}" data-a="mkt"><i></i>${c.mkt?'Sim':'Não'}</button></div></div>
  <div class="card"><h2 class="h2">Privacidade (LGPD)</h2>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">
    <button class="btn ghost" data-a="termos" data-v="1">Termos de uso e política de privacidade</button>
    <button class="btn ghost" data-a="lgpdCopia">Pedir cópia dos meus dados</button>
    ${S.delConfirm?`<div class="err">Excluir sua conta apaga seus dados e os ${n(myWallets().reduce((a,w)=>a+w.saldo,0))} pts de todas as carteiras. Não dá para desfazer.<div style="display:flex;gap:6px;margin-top:8px"><button class="sbtn" style="background:var(--surface);color:var(--ink)" data-a="delConta" data-v="0">Manter conta</button><button class="sbtn" style="background:var(--bad)" data-a="delConta" data-v="2">Excluir definitivamente</button></div></div>`
      :`<button class="btn ghost danger" data-a="delConta" data-v="1">Excluir minha conta</button>`}</div></div>
  <button class="btn ghost" data-a="sair">Sair da conta</button>`;
}


/* ================= v2: app do cliente ================= */
/* Marca o que aparece no protótipo mas ainda não existe no app real (v1, pasta distribpontos-app). */
const PL='<span class="plan-tag" title="Ainda não existe no app real (v1)">Planejado</span>';
const PLAN_TABS=['inicio','estoque','campanhas','atendimento','relatorios','cobranca'];
const PIN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/></svg>';
const OS=()=>`<div class="os"><b class="num">${hhmm(S.clock)}</b><i class="island"></i><span class="osi" aria-hidden="true"><svg viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2" width="3" height="10" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1" opacity=".35"/></svg><svg viewBox="0 0 27 12"><rect x=".6" y=".6" width="22.8" height="10.8" rx="3" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".5"/><rect x="2.5" y="2.5" width="15" height="7" rx="1.6"/><rect x="24.6" y="4" width="2" height="4" rx="1" opacity=".5"/></svg></span></div>`;
const meusAtivos=()=>S.pedidos.filter(o=>o.cpf===S.sess&&o.canal==='app'&&['novo','separando','em_rota'].includes(o.status));

function dcardHTML(d,noArea){const w=hasW(d.id,S.sess)?W(d.id,S.sess):null,ab=aberta(d),a=area(d,endB());
  const ent=!S.endAtual?`${esc(d.bairro)}, ${esc(d.cidade)}`:noArea?'Só retirada':a.frete?'Entrega '+fmt(a.frete):'Entrega grátis';
  return `<button class="scard ${ab?'':'shut'}" style="--dc:${d.cor}" data-a="abrirDist" data-v="${d.id}">
    <div class="cover"><div class="dlogo">${initials(d.nome)}</div><span class="obadge ${ab?'':'off'}"><i></i>${ab?'Aberta':'Fechada'}</span></div>
    <div class="sbody"><div class="nmrow"><span class="nm">${esc(d.nome)}</span>${w?`<span class="ptsb num">${n(w.saldo)} pts</span>`:''}</div>
      <span class="sub">${esc(d.seg)}</span>
      <div class="dmeta"><span class="rate">★ ${nota(d)}</span><span>${ab?esc(d.prazo):lojaTxt(d)}</span><span>${ent}</span>${d.min?`<span>mín. ${fmt(d.min)}</span>`:''}</div></div></button>`;}
function vInicio(){
  const ws=myWallets().filter(w=>S.dists[w.dist].status==='ativa'),tot=ws.reduce((a,w)=>a+w.saldo,0),at=meusAtivos()[0];
  const nAb=Object.values(S.dists).filter(d=>d.status==='ativa'&&aberta(d)).length;
  return `${at?`<button class="live" data-a="tab" data-v="pedidos"><span class="pulse"></span><div><b>Pedido #${at.id} · ${STL[at.status]}</b><small>${esc(S.dists[at.dist].nome)}${at.status==='em_rota'&&at.eta?' · chega por volta de '+at.eta:''}</small></div><span class="chev">›</span></button>`:''}
  ${ws.length?`<div class="sech"><h2 class="h2">Seus pontos</h2><button class="sub" style="color:var(--primary);font-weight:600" data-a="tab" data-v="pontos">Ver prêmios</button></div>
  <div class="hscroll"><button class="mini all" data-a="tab" data-v="pontos"><span>Total</span><b class="num">${n(tot)}<small>pts</small></b><span>${ws.length} ${ws.length>1?'carteiras':'carteira'}</span></button>${ws.map(w=>{const d=S.dists[w.dist];return `<button class="mini" style="--dc:${d.cor}" data-a="pwal" data-v="${d.id}"><span>${esc(d.nome.split(' ').slice(0,2).join(' '))}</span><b class="num">${n(w.saldo)}<small>pts</small></b><span>${tier(d.id,w).n}${w.vencendo?' · vence '+w.vencendo.data:''}</span></button>`}).join('')}</div>`:''}
  <input class="search" id="qd" type="search" placeholder="Buscar distribuidora…" value="${esc(S.q)}" aria-label="Buscar distribuidora">
  <div class="sech"><h2 class="h2">${!S.endAtual||S.endAtual.retirada?'Distribuidoras parceiras':'Entregam em '+esc(S.endAtual.bairro)}</h2><span class="sub">${nAb} abertas agora</span></div>
  <div class="list" id="dlist">${dlistHTML()}</div>`;}
function prodRow(p,row){
  const d=S.dists[p.dist],q=S.cart.dist===p.dist?(S.cart.items[p.id]||0):0,dbl=d.cfg.dobro.includes(p.id),w=W(p.dist,S.sess);
  const earn=Math.floor(p.preco*d.cfg.ptsPorReal*(dbl?2:1)*tier(p.dist,w).m*(w.bonus2x?2:1)),esg=p.estoque<=0,low=!esg&&p.estoque<=5;
  const ctl=esg?'<span class="esg">Esgotado</span>':q?`<div class="step"><button data-a="sub" data-v="${p.id}" aria-label="Remover um">−</button><span class="num">${q}</span><button data-a="add" data-v="${p.id}" aria-label="Adicionar um">+</button></div>`:`<button class="addbtn" data-a="add" data-v="${p.id}" aria-label="Adicionar ${esc(p.nome)}">+</button>`;
  if(row)return `<div class="prod ${esg?'off':''}"><div class="tile art" style="--h:${(CAT[p.cat]||CAT.Outros).h}">${prodArt(p)}</div>
    <div><div class="pname">${esc(p.nome)}</div><div class="pmeta"><span>${esc(p.un)}</span></div>
    <div class="price num">${fmt(p.preco)} <span class="earn ${dbl||w.bonus2x?'dbl':''}" style="font-size:12px">+${n(earn)} pts${dbl?' · 2×':''}</span></div></div>${ctl}</div>`;
  return `<div class="pcard ${esg?'off':''}"><div class="pimg" style="--h:${(CAT[p.cat]||CAT.Outros).h}">${prodArt(p)}${dbl?'<span class="x2b">2× pts</span>':low?`<span class="lowb">Últimas ${p.estoque}</span>`:''}</div>
    <div class="pname">${esc(p.nome)}</div><div class="pmeta">${esc(p.un)}</div>
    <div class="pfoot"><div><div class="price num">${fmt(p.preco)}</div><div class="earn num ${dbl||w.bonus2x?'dbl':''}">+${n(earn)} pts</div></div>${ctl}</div></div>`;
}
function vLoja(){
  const d=S.dists[S.adist],cats=['Todos',...new Set(S.produtos.filter(p=>p.dist===d.id&&p.ativo).map(p=>p.cat))],w=W(d.id,S.sess);
  const pm=PM(),dbl=d.cfg.dobro.filter(id=>pm[id]?.ativo).map(id=>pm[id].nome.split(' ')[0]),a=area(d,endB());
  const frete=!endB()?'Retirada':a?(a.frete?fmt(a.frete):'Grátis'):'Só retirada';
  return `${!aberta(d)?`<div class="closed"><b>${lojaTxt(d)}.</b> Você pode montar o carrinho, mas o pedido só é aceito com a loja aberta.</div>`:''}
  <div class="sinfo num"><div><b class="rate" style="font-size:14px">★ ${nota(d)}</b><small>${n(d.rating.n)} avaliações</small></div><div><b>${esc(d.prazo)}</b><small>prazo</small></div><div><b>${frete}</b><small>${a&&a.frete&&d.freteGratis?'grátis acima de '+fmt(d.freteGratis):d.min?'mínimo '+fmt(d.min):'entrega'}</small></div></div>
  ${w.bonus2x?`<div class="promo"><span class="x2">2×</span><div><b>Sentimos sua falta!</b> Seu próximo pedido aqui vale pontos em dobro. ${PL}</div></div>`:''}
  ${dbl.length?`<div class="promo"><span class="x2">2×</span><div><b>Pontos em dobro</b> esta semana em: ${esc(dbl.join(', '))}.</div></div>`:''}
  ${endB()&&!a?`<div class="alert">${esc(d.nome)} não entrega em ${esc(endB())}. Você pode retirar na loja em ${esc(d.bairro)}.</div>`:''}
  <div class="stick"><input class="search" id="q" type="search" placeholder="Buscar em ${esc(d.nome)}…" value="${esc(S.q)}" aria-label="Buscar produto">
  <div class="chips">${cats.map(c=>`<button data-a="cat" data-v="${c}" class="${S.cat===c?'on':''}">${c}</button>`).join('')}</div></div>
  <div class="pgrid" id="lista">${listaHTML()}</div>`;
}
function renderApp(reset){
  const el=document.getElementById('phone'),old=el.querySelector('.scr'),top=old?old.scrollTop:0;
  const key=!S.sess?'auth-'+S.auth.step+S.showTermos:[S.atab,S.adist,S.pwal,S.showTermos].join('|'),anim=reset&&key!==renderApp.k;renderApp.k=key;
  const E=anim?' enter':'';
  if(!S.sess){el.innerHTML=`${OS()}<div class="scr auth-scr${E}">${S.showTermos?vTermos():vAuth()}</div><i class="homebar"></i>`;return;}
  if(S.atab==='pix'&&!S.pixPend)S.atab='carrinho';
  const inLoja=['loja','carrinho','pix'].includes(S.atab),d=inLoja?S.dists[S.atab==='loja'?S.adist:(S.atab==='pix'?S.pixPend.dist:S.cart.dist)]:null;
  const items=cartItems(),qn=items.reduce((a,b)=>a+b.qty,0),tot=myWallets().reduce((a,w)=>a+w.saldo,0),unread=(S.notifs[S.sess]||[]).filter(x=>!x.lida).length,ativos=meusAtivos().length;
  const views={inicio:vInicio,loja:vLoja,carrinho:vCarrinho,pix:vPix,pontos:vPontos,pedidos:vPedidos,perfil:vPerfil,notifs:vNotifs};
  const bell=`<button class="circ" data-a="tab" data-v="notifs" aria-label="Avisos${unread?` (${unread} novos)`:''}" style="position:relative">${svgI('bell')}${unread?`<span class="dot" style="position:absolute;top:-4px;right:-4px;background:var(--accent);color:#fff;border-radius:99px;font-size:10px;font-weight:700;min-width:17px;height:17px;display:grid;place-items:center;padding:0 4px">${unread}</span>`:''}</button>`;
  const head=d?`<header class="ahead store" style="--dc:${d.cor}">${OS()}<div class="row"><div class="stitle"><button class="circ" data-a="${S.atab==='loja'?'tab':'abrirDist'}" data-v="${S.atab==='loja'?'inicio':d.id}" aria-label="Voltar">‹</button><div class="logo">${esc(d.nome)}<small>${lojaTxt(d)}</small></div></div>
      <button class="ptspill num" data-a="pwal" data-v="${d.id}"><i></i>${n(hasW(d.id,S.sess)?W(d.id,S.sess).saldo:0)} pts</button></div></header>`
    :`<header class="ahead">${OS()}<div class="row"><div><div class="hello">Olá, ${esc(me().nome.split(' ')[0])}</div><div class="logo">Distrib<b>Pontos</b></div></div><div class="hbtns"><button class="ptspill num" data-a="tab" data-v="pontos"><i></i>${n(tot)} pts</button>${bell}</div></div>
      ${S.atab==='inicio'?`<button class="addrbtn" data-a="editEnd">${PIN}<span>${!S.endAtual?'Informe o endereço de entrega':S.endAtual.retirada?'Vou retirar na loja':'Entregar em <b>'+esc(S.endAtual.rua)+(S.endAtual.comp?', '+esc(S.endAtual.comp):'')+', '+esc(S.endAtual.bairro)+'</b>'}</span><em>${S.endAtual?'Alterar':'Definir'}</em></button>`:''}</header>`;
  const navOn=inLoja?'inicio':S.atab,badge={pedidos:ativos};
  el.innerHTML=`${head}<div class="scr${E}">${S.showTermos?vTermos():views[S.atab]()}</div>
  ${qn&&(S.atab==='loja'||S.atab==='inicio')?`<button class="cartbar" data-a="tab" data-v="carrinho"><span><span class="cq num">${qn}</span><span>Ver carrinho<small>${esc(S.dists[S.cart.dist].nome.split(' ').slice(0,2).join(' '))} · +${n(calcPts(S.cart.dist,items,W(S.cart.dist,S.sess)))} pts</small></span></span><span class="num">${fmt(sub(items))}</span></button>`:''}
  <nav class="nav">${[['inicio','Início'],['pedidos','Pedidos'],['pontos','Pontos'],['perfil','Perfil']].map(([k,l])=>`<button data-a="tab" data-v="${k}" class="${navOn===k?'on':''}" ${navOn===k?'aria-current="page"':''}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round">${NAVI[k]}</svg>${l}${badge[k]?`<span class="nb num">${badge[k]}</span>`:''}</button>`).join('')}</nav><i class="homebar"></i>`;
  if(S.editEnd)el.insertAdjacentHTML('beforeend',`<div class="sheet-bg" data-a="editEnd" data-v="0"></div><div class="sheet" role="dialog" aria-label="Endereço de entrega">${vEndereco()}</div>`);
  if(!anim)el.querySelector('.scr').scrollTop=reset?0:top;
}

