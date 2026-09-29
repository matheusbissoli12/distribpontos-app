/* Ações dos botões e eventos da página */
/* ================= render / actions ================= */
let tt;
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.hidden=false;clearTimeout(tt);tt=setTimeout(()=>t.hidden=true,3600);}
function creditW(dist,cpf,pts,desc){const w=W(dist,cpf),before=tier(dist,w).n;w.saldo+=pts;w.acumulado+=pts;w.diasSem=0;w.extrato.unshift({d:'hoje',desc,pts});return tier(dist,w).n!==before?tier(dist,w).n:null;}
function indicacao(dist,cpf){const c=S.clientes[cpf];if(!c?.indicadoPor||c.indicPago)return;c.indicPago=true;const b=S.dists[dist].cfg.indicacao,dn=S.dists[dist].nome;
  creditW(dist,cpf,b,'Bônus indique um amigo');creditW(dist,c.indicadoPor,b,'Bônus indique um amigo · '+c.nome.split(' ')[0]);
  notify(cpf,`Bônus de indicação: +${b} pts na ${dn}.`);notify(c.indicadoPor,`${c.nome.split(' ')[0]} fez o primeiro pedido com seu código: +${b} pts na ${dn}!`);}
function credit(o){const w=W(o.dist,o.cpf);w.pendente-=o.pts;const up=creditW(o.dist,o.cpf,o.pts,'Pedido #'+o.id);indicacao(o.dist,o.cpf);return up;}
function criarPedido(o){S.pedidos.unshift(o);const w=W(o.dist,o.cpf);if(o.tipo==='compra'){w.pendente+=o.pts;if(w.bonus2x){w.bonus2x=false;o.bonus=true;}
    const pm=PM();o.itens.forEach(x=>{if(pm[x.id]){pm[x.id].estoque=Math.max(0,pm[x.id].estoque-x.qty);S.movs.unshift({dist:o.dist,pid:x.id,tipo:'venda',qty:-x.qty,obs:'Pedido #'+o.id,quando:'hoje '+hhmm(S.clock),quem:'App'});}});}
  newOrderBell(o.dist);S.fresh=o.id;}
function mkRec(o){if(!S.recFreq)return;S.recorr.push({id:'rc'+Date.now().toString(36),dist:o.dist,cpf:o.cpf,itens:o.itens.map(x=>({id:x.id,qty:x.qty})),end:o.end,freq:S.recFreq,prox:ddmm(addD(S.recFreq)),pag:o.pag,ativo:true});
  o.recorr=true;notify(o.cpf,`Pedido programado a cada ${S.recFreq} dias. Próximo em ${ddmm(addD(S.recFreq))}.`,'app');S.recFreq=0;}
const resetAuth=()=>({step:'cel',cpf:'',nome:'',cel:'',email:'',rua:'',bairro:'Jardim Camburi',ind:'',err:''});
const ACT={
  view:v=>{if(v==='app')S.view='app';else{S.view='right';S.right=v;}render()},
  termos:v=>{S.showTermos=v==='1';renderApp(true)},
  /* auth */
  authCel:()=>{const c=dig(val('au-cel'));S.auth.err='';S.auth.cel=maskCel(c);
    if(c.length<10){S.auth.err='Informe o celular com DDD.';return renderApp();}
    S.auth.step='codigo';renderApp(true);},
  authBack:()=>{S.auth.step=S.auth.step==='form'?'codigo':'cel';S.auth.err='';renderApp(true)},
  authCod:()=>{const a=S.auth;a.err='';if(val('au-cod').trim()!=='123456'){a.err='Código incorreto ou expirado. No protótipo, use 123456.';return renderApp();}
    const c=Object.values(S.clientes).find(x=>x.cadastrado&&dig(x.cel)===dig(a.cel));
    if(!c){a.step='form';return renderApp(true);}
    S.sess=c.cpf;S.endAtual=null;S.auth=resetAuth();S.atab='inicio';render(true);toast(`Bem-vindo de volta, ${c.nome.split(' ')[0]}!`);},
  authCriar:()=>{const a=S.auth;a.nome=val('au-nome').trim();a.cpf=dig(val('au-cpf'));a.email=val('au-email').trim();a.ind=val('au-ind').trim().toUpperCase();a.err='';
    const ref=a.ind?Object.values(S.clientes).find(c=>c.codigo===a.ind):null;
    if(a.nome.split(/\s+/).length<2)a.err='Informe nome e sobrenome.';else if(!cpfValid(a.cpf))a.err='CPF inválido. Confira os 11 números.';
    else if(isCad(a.cpf))a.err='Este CPF já tem conta com outro celular. Entre com o celular cadastrado.';
    else if(a.ind&&!ref)a.err='Código de indicação não encontrado. Confira ou deixe em branco.';else if(!document.getElementById('au-ok').checked)a.err='Para participar é preciso aceitar os termos e o uso dos dados.';
    if(a.err)return renderApp();
    const mkt=document.getElementById('au-mkt').checked,pts=Object.values(S.w).filter(w=>w.cpf===a.cpf).reduce((s,w)=>s+w.saldo,0);
    const cod=noAcc(a.nome.split(' ')[0]).toUpperCase()+dig(a.cel).slice(-4);
    S.clientes[a.cpf]={cpf:a.cpf,nome:a.nome,cel:a.cel,email:a.email,cadastrado:true,desde:'set/2026',mkt,nasc:'',codigo:cod,indicadoPor:ref?ref.cpf:null};
    if(ref)notify(ref.cpf,`${a.nome.split(' ')[0]} criou a conta com seu código. Vocês ganham pontos quando o 1º pedido dele for entregue.`);
    notify(a.cpf,`Bem-vindo ao DistribPontos! Seu CPF já é seu cartão fidelidade.`);
    S.sess=a.cpf;S.endAtual=null;S.auth=resetAuth();S.atab=pts?'pontos':'inicio';S.pwal=null;S.cart={dist:null,items:{}};render(true);
    toast(pts?`Conta criada! Você já tem ${n(pts)} pts de compras na loja.`:'Conta criada! Escolha uma distribuidora para pedir.');},
  sair:()=>{S.sess=null;S.endAtual=null;S.editEnd=false;S.cart={dist:null,items:{}};S.atab='inicio';S.delConfirm=false;S.pixPend=null;render(true)},
  /* app */
  tab:v=>{S.atab=v;S.confirm=null;S.showTermos=false;if(v==='pontos')S.pwal=null;if(v==='inicio')S.q='';
    if(v==='notifs')setTimeout(()=>{(S.notifs[S.sess]||[]).forEach(x=>x.lida=true)},0);renderApp(true)},
  abrirDist:v=>{S.adist=v;S.atab='loja';S.cat='Todos';S.q='';renderApp(true)},
  pwal:v=>{S.pwal=v||null;S.atab='pontos';S.confirm=null;renderApp(true)},
  cat:v=>{S.cat=v;renderApp()},
  add:v=>{const p=PM()[v];if(S.cart.dist&&S.cart.dist!==p.dist&&Object.keys(S.cart.items).length){S.cart={dist:p.dist,items:{}};toast('O carrinho aceita uma distribuidora por vez. Começamos um novo.');}
    const q=(S.cart.items[v]||0);if(q>=p.estoque)return toast(`Só ${p.estoque} em estoque.`);
    S.cart.dist=p.dist;S.cart.items[v]=q+1;renderApp()},
  sub:v=>{if(--S.cart.items[v]<=0)delete S.cart.items[v];renderApp()},
  entrega:v=>{S.entrega=v;renderApp()},
  pag:v=>{S.pag=v;renderApp()},
  recFreq:v=>{S.recFreq=+v;renderApp()},
  enviar:()=>{const items=cartItems();if(!items.length)return;const dist=S.cart.dist,d=S.dists[dist];if(!aberta(d))return toast(lojaTxt(d));
    const w=W(dist,S.sess),s=sub(items),f=freteCart(dist,s),p=calcPts(dist,items,w),id=++S.seq;
    const o={id,dist,cpf:S.sess,canal:'app',tipo:'compra',itens:items,total:s+f,pts:p,status:'novo',hora:now(),dia:'hoje',pag:S.pag,pagStatus:S.pag==='pix'?'pago':'na_entrega',entrega:S.entrega,end:S.entrega==='entrega'?{...S.endAtual}:null};
    if(S.pag==='pix'){S.pixPend=o;S.atab='pix';return renderApp(true);}
    criarPedido(o);mkRec(o);S.cart={dist:null,items:{}};S.atab='pedidos';S.pd=dist;S.ptab='pedidos';S.pfilt='abertos';render(true);
    toast(`Pedido #${id} enviado para ${d.nome} · +${n(p)} pts na entrega`);},
  copiar:()=>{const t=document.getElementById('pixcode').textContent;try{navigator.clipboard.writeText(t).then(()=>toast('Código Pix copiado'),()=>toast('Selecione o código e copie'));}catch(e){toast('Selecione o código e copie')}},
  copiarCod:()=>{try{navigator.clipboard.writeText(me().codigo).then(()=>toast('Código copiado'),()=>toast('Código: '+me().codigo));}catch(e){toast('Código: '+me().codigo)}},
  pixOk:()=>{const o=S.pixPend;S.pixPend=null;o.hora=now();criarPedido(o);mkRec(o);S.cart={dist:null,items:{}};S.atab='pedidos';S.pd=o.dist;S.ptab='pedidos';S.pfilt='abertos';
    notify(o.cpf,`Pix de ${fmt(o.total)} aprovado. Pedido #${o.id} enviado para ${S.dists[o.dist].nome}.`);render(true);toast(`Pix aprovado · pedido #${o.id} enviado`);},
  pixCancel:()=>{S.pixPend=null;S.atab='carrinho';renderApp(true)},
  salvarEnd:()=>{const b=val('en-bairro'),r=val('en-rua').trim(),c=val('en-comp').trim();S.endErr='';
    if(!b)S.endErr='Selecione o bairro.';else if(r.length<4)S.endErr='Informe rua e número.';if(S.endErr)return renderApp();
    S.endAtual={bairro:b,rua:r,comp:c};S.editEnd=false;S.entrega='entrega';if(S.cart.dist&&!area(S.dists[S.cart.dist],b))S.entrega='retirada';renderApp();toast(`Entregar em ${r}, ${b}`);},
  retirar:()=>{S.endAtual={retirada:true};S.editEnd=false;S.endErr='';S.entrega='retirada';renderApp();},
  editEnd:v=>{S.editEnd=v!=='0';S.endErr='';renderApp()},
  repetir:v=>{const o=S.pedidos.find(x=>x.id==v),pm=PM();S.cart={dist:o.dist,items:{}};o.itens.forEach(x=>{const p=pm[x.id];if(p?.ativo&&p.estoque>0)S.cart.items[x.id]=Math.min(x.qty,p.estoque)});S.atab='carrinho';renderApp(true);toast('Itens adicionados ao carrinho')},
  recCancel:v=>{S.recorr.find(r=>r.id===v).ativo=false;render();toast('Pedido programado cancelado')},
  nota:v=>{const [id,k]=v.split(':');const o=S.pedidos.find(x=>x.id==id),d=S.dists[o.dist];o.nota=+k;d.rating.soma+=+k;d.rating.n++;render();toast('Obrigado pela avaliação!')},
  help:v=>{S.helpFor=v?+v:null;renderApp()},
  abrirChamado:v=>{const o=S.pedidos.find(x=>x.id==v),msg=val('hp-msg').trim();if(!msg)return toast('Conte o que aconteceu.');
    S.chamados.unshift({id:'ch'+Date.now().toString(36),dist:o.dist,cpf:o.cpf,pedido:o.id,tipo:val('hp-tipo'),msg,status:'aberto',hora:now()});S.helpFor=null;render();toast('Chamado enviado para a loja');},
  mkt:()=>{me().mkt=!me().mkt;renderApp()},
  lgpdCopia:()=>{S.lgpd.unshift({id:'l'+Date.now(),cpf:S.sess,nome:me().nome,tipo:'Cópia dos dados',data:ddmm(HOJE),status:'pendente'});render();toast('Pedido registrado. Você recebe a cópia por e-mail em até 15 dias.')},
  delConta:v=>{if(v==='1'||v==='0'){S.delConfirm=v==='1';return renderApp();}
    const cpf=S.sess,nome=me().nome;Object.keys(S.w).filter(k=>k.endsWith(':'+cpf)).forEach(k=>delete S.w[k]);S.recorr=S.recorr.filter(r=>r.cpf!==cpf);
    S.clientes[cpf]={cpf,cadastrado:false,excluido:true};delete S.notifs[cpf];S.lgpd.unshift({id:'l'+Date.now(),cpf,nome,tipo:'Exclusão da conta',data:ddmm(HOJE),status:'concluida'});
    S.delConfirm=false;S.sess=null;S.atab='inicio';S.cart={dist:null,items:{}};render(true);toast('Conta excluída e dados apagados.');},
  /* importar tabela de preços */
  xlExemplo:()=>{let aoa=xlExemploAoa(),sheets;
    if(typeof XLSX!=='undefined'){const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(aoa),'Preços');XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['Observações'],['Tabela enviada pelo comercial']]),'Obs');
      const buf=XLSX.write(wb,{type:'array',bookType:'xlsx'}),rd=XLSX.read(new Uint8Array(buf),{type:'array'});sheets={};rd.SheetNames.forEach(s=>sheets[s]=XLSX.utils.sheet_to_json(rd.Sheets[s],{header:1,raw:true,defval:''}));}
    else sheets={'Preços':aoa};
    xlLoad('tabela_precos_outubro.xlsx',sheets);S.impLog=null;renderRight();},
  xlCancelar:()=>{S.xl=null;renderRight()},
  xlAplicar:()=>{const x=S.xl,its=xlItems(),d=D();let nv=0,al=0,oc=0;
    its.forEach(i=>{if(i.status==='novo'){const id='x'+Date.now().toString(36)+i.linha;addP(d.id,id,i.nome,i.cat,i.un,+i.preco.toFixed(2),i.est>=0?i.est:0);const p=S.produtos[S.produtos.length-1];if(i.cod)p.codigo=i.cod;if(i.custo>0)p.custo=+i.custo.toFixed(2);p.forn=FORN[i.cat]||p.forn;nv++;}
      else if(i.status==='altera'||i.status==='igual'){const p=i.atual;if(i.status==='altera'){p.preco=+i.preco.toFixed(2);al++;}if(i.cod)p.codigo=i.cod;if(i.custo>0)p.custo=+i.custo.toFixed(2);if(i.est>=0)p.estoque=i.est;p.ativo=true;}});
    if(x.ocultar)S.produtos.filter(p=>p.dist===d.id&&p.ativo&&!its.some(i=>i.atual===p)).forEach(p=>{p.ativo=false;oc++;});
    (S.impLog=S.impLog||[]).unshift(`<b>${esc(x.fileName)}</b> · hoje ${hhmm(S.clock)} · ${nv} produtos novos, ${al} preços atualizados${oc?`, ${oc} ocultados`:''}`);
    S.xl=null;render();toast(`Catálogo atualizado: ${nv} novos e ${al} preços`);},
  /* estoque e relatórios */
  estF:v=>{S.estF=v;renderRight()},
  relP:v=>{S.relP=+v;renderRight()},
  estMov:v=>{if(!v){S.estMov=null;return renderRight();}const [tipo,pid]=v.split(':');S.estMov={tipo,pid};renderRight();document.getElementById('mv-q')?.focus();},
  estSalvar:v=>{const p=PM()[v],q=parseInt(val('mv-q'));if(!(q>=0))return toast('Informe a quantidade.');const who=S.role==='entregador'?D().entregadores[0]:D().equipe[S.role];
    if(S.estMov.tipo==='entrada'){if(!(q>0))return toast('Informe a quantidade recebida.');const c=num(val('mv-c'));if(c>0)p.custo=+((p.custo*p.estoque+c*q)/(p.estoque+q)).toFixed(2);p.estoque+=q;
      S.movs.unshift({dist:p.dist,pid:p.id,tipo:'entrada',qty:q,obs:[val('mv-nf')?'NF '+val('mv-nf'):'',val('mv-f')].filter(Boolean).join(' · ')||'Entrada',quando:'hoje '+hhmm(S.clock),quem:who});toast(`+${q} ${p.un} de ${p.nome} no estoque`);}
    else{const t=val('mv-t');let dq;if(t==='ajuste'){dq=q-p.estoque;p.estoque=q;}else{dq=-Math.min(q,p.estoque);p.estoque+=dq;}
      S.movs.unshift({dist:p.dist,pid:p.id,tipo:t,qty:dq,obs:val('mv-o')||(t==='ajuste'?'Contagem de estoque':'Perda'),quando:'hoje '+hhmm(S.clock),quem:who});toast(t==='ajuste'?`Estoque de ${p.nome} ajustado para ${p.estoque}`:`${-dq} ${p.un} baixados como perda`);}
    S.estMov=null;render();},
  gerarCompra:v=>{const d=D(),xs=S.produtos.filter(p=>p.dist===d.id&&p.ativo&&p.forn===v).map(p=>({p,...stockInfo(p)})).filter(x=>x.sug>0);if(!xs.length)return;
    const id='pc'+Date.now().toString(36),tot=xs.reduce((a,x)=>a+x.sug*x.p.custo,0);
    const msg=`Pedido de compra · ${d.nome} · ${ddmm(HOJE)}\n`+xs.map(x=>`${x.sug}× ${x.p.nome}`).join('\n')+`\nTotal estimado: ${fmt(tot)}. Entregar em ${d.bairro}, ${d.cidade}.`;
    S.compras.unshift({id,dist:d.id,forn:v,quando:'hoje '+hhmm(S.clock),itens:xs.map(x=>({pid:x.p.id,qty:x.sug,custo:x.p.custo})),status:'enviado',msg});renderRight();toast(`Pedido para ${v} gerado. Copie e envie pelo WhatsApp.`);},
  copiarCompra:v=>{const c=S.compras.find(x=>x.id===v);try{navigator.clipboard.writeText(c.msg).then(()=>toast('Pedido copiado'),()=>toast('Selecione o texto e copie'));}catch(e){toast('Selecione o texto e copie')}},
  receberCompra:v=>{const c=S.compras.find(x=>x.id===v),pm=PM();c.status='recebido';c.itens.forEach(i=>{const p=pm[i.pid];if(!p)return;p.estoque+=i.qty;S.movs.unshift({dist:c.dist,pid:p.id,tipo:'entrada',qty:i.qty,obs:'Pedido de compra · '+c.forn,quando:'hoje '+hhmm(S.clock),quem:D().equipe.dono});});render();toast(`Entrada de ${c.itens.length} itens registrada`);},
  /* distribuidora */
  ptab:v=>{S.ptab=v;if(v==='pedidos')S.dnew[S.pd]=0;renderRight()},
  verNovos:()=>{S.ptab='pedidos';S.pfilt='abertos';S.dnew[S.pd]=0;renderRight()},
  pfilt:v=>{S.pfilt=v;renderRight()},
  avancar:v=>{const o=S.pedidos.find(x=>x.id==v),d=S.dists[o.dist];
    const ret=o.entrega==='retirada';
    if(o.status==='separando'&&!ret){o.entregador=val('ent-'+o.id)||d.entregadores[0];o.eta=hhmm(S.clock+30);}
    o.status=o.status==='separando'&&ret?'entregue':FLOW[FLOW.indexOf(o.status)+1];S.fresh=null;let up=null;
    if(o.status==='entregue'&&o.tipo==='compra')up=credit(o);
    const msg={separando:`${d.nome} está separando seu pedido #${o.id}.`,em_rota:`Pedido #${o.id} saiu para entrega com ${o.entregador}. Chega por volta de ${o.eta}.`,
      entregue:o.tipo==='compra'?`Pedido #${o.id} entregue. +${n(o.pts)} pts na ${d.nome}!${up?` Você subiu para ${up}!`:''} Avalie no app.`:`Seu resgate (${o.itensTxt}) foi entregue.`}[o.status];
    notify(o.cpf,msg);render();
    toast(o.status==='entregue'&&o.tipo==='compra'?`#${o.id} entregue · ${n(o.pts)} pts creditados para ${cliNome(o.cpf)}${up?` · subiu para ${up}!`:''}`:`#${o.id}: ${STL[o.status]} · cliente avisado no app`);},
  cliCancel:v=>{const o=S.pedidos.find(x=>x.id==v);if(o.status!=='novo')return toast('A loja já está preparando seu pedido. Fale com ela para cancelar.');ACT.cancelar(v,null,true);},
  cancelar:(v,b,cli)=>{const o=S.pedidos.find(x=>x.id==v),w=W(o.dist,o.cpf);o.status='cancelado';o.canceladoPor=cli?'cliente':'loja';
    if(o.tipo==='compra'){w.pendente-=o.pts;if(o.bonus)w.bonus2x=true;const pm=PM();o.itens.forEach(x=>{if(pm[x.id]){pm[x.id].estoque+=x.qty;S.movs.unshift({dist:o.dist,pid:x.id,tipo:'ajuste',qty:x.qty,obs:'Pedido #'+o.id+' cancelado',quando:'hoje '+hhmm(S.clock),quem:'Sistema'});}});}
    else{w.saldo+=o.pts;w.extrato.unshift({d:'hoje',desc:'Estorno · '+o.itensTxt,pts:o.pts});}
    notify(o.cpf,`Pedido #${o.id} foi cancelado${cli?'':' pela loja'}.${o.pagStatus==='pago'?' O valor do Pix será devolvido pela loja.':''}`);if(cli)newOrderBell(o.dist);render();toast(cli?`Pedido #${o.id} cancelado. A loja foi avisada.`:`Pedido #${o.id} cancelado`)},
  recGerar:v=>{const r=S.recorr.find(x=>x.id===v),pm=PM(),d=S.dists[r.dist],c=S.clientes[r.cpf];
    const itens=r.itens.filter(x=>pm[x.id]).map(x=>({...x,preco:pm[x.id].preco})),s=sub(itens),f=r.end?(freteDe(d,r.end.bairro,s)??0):0,w=W(r.dist,r.cpf);
    const o={id:++S.seq,dist:r.dist,cpf:r.cpf,canal:'app',tipo:'compra',itens,total:s+f,pts:calcPts(r.dist,itens,w),status:'novo',hora:now(),dia:'hoje',pag:r.pag,pagStatus:r.pag==='pix'?'pago':'na_entrega',entrega:r.end?'entrega':'retirada',end:r.end?{...r.end}:null,recorr:true};
    criarPedido(o);r.prox=ddmm(addD(r.freq));notify(r.cpf,`Seu pedido programado #${o.id} foi gerado na ${d.nome}.`);render();toast(`Pedido programado #${o.id} gerado para ${cliNome(r.cpf)}`)},
  lancar:()=>{const c=dig(S.pdv.cpf),v=num(S.pdv.valor);
    if(!cpfValid(c))return toast('Informe um CPF válido.');if(!(v>0))return toast('Informe o valor da compra.');
    const cl=S.clientes[c];let cel=cl?.cadastrado?cl.cel:maskCel(S.pdv.cel);if(!cl?.cadastrado&&dig(cel).length<10)return toast('Informe o celular do cliente para enviar o código.');
    const code=String(1000+Math.floor(Math.random()*9000));S.pdvPend={cpf:c,valor:v,cupom:S.pdv.cupom,cel,code,pts:ptsValor(S.pd,v,W(S.pd,c))};
    notify(c,`Código para confirmar ${n(S.pdvPend.pts)} pts na ${D().nome}: ${code}. Informe ao caixa.`);renderRight();},
  pdvCancel:()=>{S.pdvPend=null;renderRight()},
  pdvSim:()=>{S.pdv={cpf:'31847562035',valor:'57,80',cupom:'004530',cel:''};ACT.lancar();},
  pdvConfirma:()=>{const p=S.pdvPend;if(val('pdv-cod')!==p.code)return toast('Código não confere. Peça ao cliente para conferir a mensagem.');
    if(!S.clientes[p.cpf])S.clientes[p.cpf]={cpf:p.cpf,cadastrado:false,origem:S.pd,cel:p.cel};
    const up=creditW(S.pd,p.cpf,p.pts,'Compra na loja'+(p.cupom?' · cupom '+p.cupom:''));indicacao(S.pd,p.cpf);
    S.pedidos.unshift({id:++S.seq,dist:S.pd,cpf:p.cpf,canal:'balcao',tipo:'compra',total:p.valor,pts:p.pts,status:'entregue',hora:now(),dia:'hoje',cupom:p.cupom,confirmado:true});
    notify(p.cpf,`+${n(p.pts)} pts na ${D().nome} pela compra na loja.`);
    const nome=isCad(p.cpf)?cliNome(p.cpf):'CPF '+cpfFmt(p.cpf)+' (guardados até o cadastro)';S.pdvPend=null;S.pdv={cpf:'',valor:'',cupom:'',cel:''};render();
    toast(`+${n(p.pts)} pts para ${nome}${up?' · subiu de nível!':''}`);},
  resgBalcao:v=>{const c=dig(S.pdv.cpf),d=D(),r=d.premios.find(x=>x.id===v),w=W(d.id,c);if(w.saldo<r.custo)return;
    w.saldo-=r.custo;w.extrato.unshift({d:'hoje',desc:'Resgate na loja · '+r.nome,pts:-r.custo});
    S.pedidos.unshift({id:++S.seq,dist:d.id,cpf:c,canal:'balcao',tipo:'resgate',itensTxt:r.nome,total:0,pts:r.custo,status:'entregue',hora:now(),dia:'hoje'});
    notify(c,`Você trocou ${n(r.custo)} pts por ${r.nome} na loja.`);render();toast(`Resgate feito: ${r.nome} entregue no balcão`);},
  addProd:()=>{const nome=val('np-nome').trim(),cat=val('np-cat'),un=val('np-un').trim()||'unidade',preco=num(val('np-preco')),est=parseInt(val('np-est'))||0;
    if(!nome)return toast('Dê um nome ao produto.');if(!(preco>0))return toast('Informe o preço.');
    addP(S.pd,'p'+Date.now().toString(36),nome,cat,un,preco,est);render();toast(`${nome} adicionado ao catálogo`);},
  importar:()=>{const lines=val('imp-txt').split(/\r?\n/).map(l=>l.trim()).filter(Boolean);let ok=0;const errs=[];
    lines.forEach((l,i)=>{const c=l.split(/[;\t]/).map(x=>x.trim());if(i===0&&/^nome$/i.test(c[0]))return;
      const [nome,cat,un,pr,est]=c,preco=num(pr);if(!nome){errs.push(`linha ${i+1}: sem nome`);return;}if(!(preco>0)){errs.push(`linha ${i+1} (${esc(nome)}): preço inválido`);return;}
      addP(S.pd,'i'+Date.now().toString(36)+i,nome,CAT[cat]?cat:'Outros',un||'unidade',preco,parseInt(est)||0);ok++;});
    S.impMsg=`<b>${ok} produtos importados.</b>${errs.length?` ${errs.length} com erro: ${errs.join('; ')}. Corrija e importe só essas linhas.`:''}`;render();toast(`${ok} produtos importados`);},
  prodAtivo:v=>{const p=PM()[v];p.ativo=!p.ativo;render()},
  dobro:v=>{const cf=D().cfg;cf.dobro=cf.dobro.includes(v)?cf.dobro.filter(x=>x!==v):[...cf.dobro,v];render()},
  addPremio:()=>{const nome=val('nr-nome').trim(),cat=val('nr-cat'),custo=Math.round(num(val('nr-custo')));
    if(!nome)return toast('Dê um nome ao prêmio.');if(!(custo>0))return toast('Informe o custo em pontos.');
    D().premios.push({id:'r'+Date.now().toString(36),nome,cat,g:CAT[cat].g,custo,ativo:true});render();toast('Prêmio adicionado');},
  premioAtivo:v=>{const r=D().premios.find(x=>x.id===v);r.ativo=!r.ativo;render()},
  campTog:v=>{D().camp[v]=!D().camp[v];renderRight()},
  campRun:k=>{const d=D(),al=campAlvo(k,d),nm={sumido:'Cliente sumido',aniver:'Aniversariante do mês',quase:'Quase lá',vence:'Pontos vencendo'}[k];
    al.forEach(w=>{const first=S.clientes[w.cpf].nome.split(' ')[0];
      if(k==='sumido'){w.bonus2x=true;notify(w.cpf,`${first}, sentimos sua falta! Seu próximo pedido na ${d.nome} vale pontos em dobro.`,'whatsapp');}
      if(k==='aniver'){w.aniverPago=true;creditW(d.id,w.cpf,d.cfg.aniverPts,'Presente de aniversário');notify(w.cpf,`Feliz aniversário, ${first}! A ${d.nome} te deu ${d.cfg.aniverPts} pts.`,'whatsapp');}
      if(k==='quase'){const r=d.premios.filter(r=>r.ativo&&r.custo>w.saldo).sort((a,b)=>a.custo-b.custo)[0];notify(w.cpf,`Faltam só ${n(r.custo-w.saldo)} pts para você ganhar ${r.nome} na ${d.nome}!`,'whatsapp');}
      if(k==='vence')notify(w.cpf,`${n(w.vencendo.pts)} pts vencem em ${w.vencendo.data} na ${d.nome}. Troque antes de perder!`,'whatsapp');});
    d.campLog.unshift({t:hhmm(S.clock),nome:nm,n:al.length});render();toast(`${nm}: enviado para ${al.length} ${al.length===1?'cliente':'clientes'} no WhatsApp`);},
  vencer:()=>{const d=D();let tot=0;distWs(d).filter(w=>w.vencendo).forEach(w=>{const p=Math.min(w.vencendo.pts,w.saldo);w.saldo-=p;tot+=p;if(p)w.extrato.unshift({d:'hoje',desc:'Pontos vencidos',pts:-p});notify(w.cpf,`${n(p)} pts venceram na ${d.nome}.`,'app');w.vencendo=null;});render();toast(`${n(tot)} pts vencidos e baixados`);},
  resolver:v=>{const c=S.chamados.find(x=>x.id===v),resp=val('resp-'+v).trim(),comp=parseInt(val('comp-'+v))||0;if(!resp)return toast('Escreva uma resposta.');
    c.status='resolvido';c.resposta=resp;c.comp=comp;if(comp)creditW(c.dist,c.cpf,comp,'Compensação · pedido #'+c.pedido);
    notify(c.cpf,`${S.dists[c.dist].nome} respondeu seu chamado: ${resp}${comp?` (+${comp} pts)`:''}`);render();toast('Chamado resolvido e cliente avisado');},
  pausar:()=>{D().pausada=!D().pausada;render();toast(D().pausada?'Pedidos pausados: a loja aparece fechada no app':'Loja recebendo pedidos de novo')},
  rmArea:v=>{D().areas.splice(+v,1);render()},
  addArea:()=>{const b=val('na-b'),f=num(val('na-f'))||0;D().areas.push({bairro:b,frete:f});render();toast(`${b} adicionado à área de entrega`)},
  addEnt:()=>{const nm=val('ne-nome').trim();if(!nm)return toast('Informe o nome.');D().entregadores.push(nm);render();toast(`${nm} adicionado à equipe`)},
  integ:v=>{D().integ[v]=!D().integ[v];render();toast(D().integ[v]?'Integração conectada':'Integração desligada')},
  /* admin */
  atabA:v=>{S.atabA=v;renderRight()},
  dStatus:v=>{const [id,st]=v.split(':'),d=S.dists[id];d.status=st;
    if(st!=='ativa'&&(S.adist===id||S.cart.dist===id)){if(['loja','carrinho','pix'].includes(S.atab))S.atab='inicio';if(S.cart.dist===id)S.cart={dist:null,items:{}};}
    render();toast(st==='ativa'?`${d.nome} agora aparece no app`:`${d.nome} suspensa e oculta no app`);},
  assinar:v=>{S.dists[v].contrato='assinado';render();toast('Contrato e termo de dados registrados')},
  abrirPainel:v=>{S.pd=v;S.right='dist';S.role='dono';S.ptab='catalogo';if(S.view!=='app')S.view='right';render()},
  addDist:()=>{const nome=val('nd-nome').trim(),cnpj=dig(val('nd-cnpj')),bairro=val('nd-bairro'),plano=val('nd-plano');
    if(!nome)return toast('Informe o nome da distribuidora.');if(cnpj.length!==14)return toast('CNPJ precisa ter 14 números.');
    const id='d'+Date.now().toString(36),k=Object.keys(S.dists).length;
    S.dists[id]=mkDist({id,nome,cnpj:maskCnpj(cnpj),cidade:cidadeDe(bairro),bairro,seg:'Distribuidora',cor:PALETA[k%PALETA.length],plano,status:'implantacao',desde:'set/2026',contrato:'pendente',
      freteGratis:100,horario:{abre:'08:00',fecha:'22:00'},prazo:'40–60 min',entregadores:['Entregador 1'],equipe:{dono:'Responsável',caixa:'Caixa 1'},areas:[{bairro,frete:0}],
      cfg:{ptsPorReal:1,prata:1500,ouro:5000,dobro:[],validade:12,indicacao:100,aniverPts:100},premios:[]});
    render();toast(`${nome} cadastrada. Registre a assinatura e monte o catálogo no painel.`);},
  gerarFat:()=>{let k=0;Object.values(S.dists).filter(d=>d.status==='ativa').forEach(d=>{if(!S.faturas.some(f=>f.dist===d.id&&f.mes==='out/2026')){S.faturas.push({id:'f'+Date.now()+k,dist:d.id,mes:'out/2026',valor:PLANOS[d.plano].preco,venc:'10/10',status:'aberta'});k++;}});render();toast(k?`${k} faturas geradas e enviadas por e-mail e WhatsApp`:'Faturas de outubro já geradas');},
  pagarFat:v=>{const f=S.faturas.find(x=>x.id===v);f.status='paga';const d=S.dists[f.dist];if(d.status==='suspensa'&&!S.faturas.some(x=>x.dist===d.id&&x.status==='vencida')){d.status='ativa';toast(`Pagamento registrado · ${d.nome} reativada`);}else toast('Pagamento registrado');render();},
  bloquear:()=>{const ids=[...new Set(S.faturas.filter(f=>f.status==='vencida').map(f=>f.dist))];ids.forEach(id=>S.dists[id].status='suspensa');
    if(ids.includes(S.cart.dist))S.cart={dist:null,items:{}};if(['loja','carrinho','pix'].includes(S.atab))S.atab='inicio';render();toast(`${ids.length} distribuidora(s) suspensa(s) por falta de pagamento`);},
  lgpdOk:v=>{S.lgpd.find(x=>x.id===v).status='concluida';render();toast('Solicitação concluída')}
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b||b.disabled)return;ACT[b.dataset.a]?.(b.dataset.v,b)});
document.addEventListener('input',e=>{const t=e.target;
  if(t.id==='q'){S.q=t.value;document.getElementById('lista').innerHTML=listaHTML();}
  if(t.id==='qd'){S.q=t.value;document.getElementById('dlist').innerHTML=dlistHTML();}
  if(t.id==='au-cpf'||t.id==='pdv-cpf')t.value=maskCpf(t.value);
  if(t.id==='au-cpf'){S.auth.cpf=dig(t.value);const f=document.getElementById('au-found');if(f)f.innerHTML=foundHTML(S.auth.cpf);}
  if(t.id==='au-cel'||t.id==='pdv-cel')t.value=maskCel(t.value);
  if(t.id==='nd-cnpj')t.value=maskCnpj(t.value);
  if(t.id==='pdv-cpf'){S.pdv.cpf=t.value;document.getElementById('pdv-look').innerHTML=pdvLookup();document.getElementById('pdv-prev').innerHTML=pdvPreview();}
  if(t.id==='pdv-valor'){S.pdv.valor=t.value;document.getElementById('pdv-prev').innerHTML=pdvPreview();}
  if(t.id==='pdv-cupom')S.pdv.cupom=t.value;
  if(t.id==='est-q'){S.estQ=t.value;const pos=t.selectionStart;renderRight();const n2=document.getElementById('est-q');if(n2){n2.focus();n2.setSelectionRange(pos,pos);}}
  if(t.id==='pdv-cel')S.pdv.cel=t.value;
});
document.addEventListener('keydown',e=>{if(e.key!=='Enter')return;const m={'au-cel':'authCel','au-cod':'authCod','pdv-valor':'lancar','pdv-cupom':'lancar','pdv-cod':'pdvConfirma'}[e.target.id];if(m){e.preventDefault();ACT[m]();}});
document.addEventListener('change',e=>{const t=e.target;
  if(t.id==='clock-sel'){S.clock=+t.value;render();toast(`Hora simulada: ${hhmm(S.clock)}`);return;}
  if(t.id==='xl-file'&&t.files[0]){xlFromFile(t.files[0]);return;}
  if(t.id==='xl-sheet'){S.xl.sheet=t.value;xlPrepare();renderRight();return;}
  if(t.id==='xl-hdr'){S.xl.hdr=+t.value;S.xl.map=xlDetectMap(S.xl.sheets[S.xl.sheet][S.xl.hdr]||[]);renderRight();return;}
  if(t.dataset.map){S.xl.map[t.dataset.map]=+t.value;renderRight();return;}
  if(t.id==='xl-ocultar'){S.xl.ocultar=t.checked;renderRight();return;}
  if(t.id==='pd-sel'){S.pd=t.value;S.xl=null;S.fresh=null;S.pdv={cpf:'',valor:'',cupom:'',cel:''};S.pdvPend=null;S.impMsg='';renderRight();return;}
  if(t.id==='role-sel'){S.role=t.value;renderRight();return;}
  if(t.id==='imp-file'&&t.files[0]){const r=new FileReader();r.onload=()=>{document.getElementById('imp-txt').value=r.result;};r.readAsText(t.files[0]);return;}
  const d=D(),cf=d.cfg;
  if(t.dataset.cfg){const v=Number(t.value);if(v>=0){cf[t.dataset.cfg]=v;if(cf.ouro<=cf.prata)cf.ouro=cf.prata+100;if(cf.ptsPorReal<=0)cf.ptsPorReal=1;}render();}
  if(t.dataset.pcusto){const v=Math.round(Number(t.value));if(v>0)d.premios.find(x=>x.id===t.dataset.pcusto).custo=v;render();}
  if(t.dataset.preco){const v=num(t.value);if(v>0)PM()[t.dataset.preco].preco=v;render();}
  if(t.dataset.min){const v=parseInt(t.value);if(v>=0)PM()[t.dataset.min].minimo=v;render();}
  if(t.dataset.est){const v=parseInt(t.value);if(v>=0)PM()[t.dataset.est].estoque=v;render();}
  if(t.dataset.hor){if(t.value)d.horario[t.dataset.hor]=t.value;render();}
  if(t.dataset.dnum){const v=num(t.value);if(v>=0)d[t.dataset.dnum]=v;render();}
  if(t.dataset.area){const v=num(t.value);if(v>=0)d.areas[+t.dataset.area].frete=v;render();}
});
document.addEventListener('mousemove',e=>{const h=e.target.closest('[data-tip]'),c=h&&h.closest('.chart');
  document.querySelectorAll('.chart .tip').forEach(t=>{if(!c||t.parentElement!==c)t.hidden=true;});if(!c)return;
  const tip=c.querySelector('.tip'),r=c.getBoundingClientRect(),p=h.dataset.tip.split('|');tip.innerHTML=`<b>${p[0]}</b>${p.length>1?'<br>'+p.slice(1).join('<br>'):''}`;
  tip.hidden=false;const w=tip.offsetWidth;tip.style.left=Math.min(Math.max(e.clientX-r.left,w/2+4),r.width-w/2-4)+'px';tip.style.top=(e.clientY-r.top-12)+'px';});
document.addEventListener('mouseleave',()=>document.querySelectorAll('.chart .tip').forEach(t=>t.hidden=true));
document.addEventListener('dragover',e=>{const z=e.target.closest&&e.target.closest('#xl-drop');if(z){e.preventDefault();z.classList.add('over');}});
document.addEventListener('dragleave',e=>{const z=e.target.closest&&e.target.closest('#xl-drop');if(z)z.classList.remove('over');});
document.addEventListener('drop',e=>{const z=e.target.closest&&e.target.closest('#xl-drop');if(!z)return;e.preventDefault();const f=e.dataTransfer.files[0];if(f)xlFromFile(f);});
