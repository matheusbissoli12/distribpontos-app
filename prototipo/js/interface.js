/* Roteiro de teste, tema e renderização geral */
/* ================= v2: roteiro de teste ================= */
const GUIA=[
  {k:'balcao',t:'Lance uma compra no balcão',d:'Rio Doce › Balcão, CPF <span class="mono">150.947.362-99</span>. Confirme com o código enviado.',b:'Abrir o balcão',
    go:()=>{S.view='right';S.right='dist';S.pd='d1';S.role='dono';S.ptab='balcao';S.pdvPend=null;S.pdv={cpf:'15094736299',valor:'64,90',cupom:'004611',cel:'(27) 99571-0426'};}},
  {k:'cadastro',t:'Crie a conta desse cliente',d:'No app, entre com o celular <span class="mono">(27) 99571-0426</span>, código <span class="mono">123456</span>, e cadastre o mesmo CPF. Os pontos do balcão aparecem na hora.',b:'Ir para o login',
    go:()=>{S.view='app';if(S.sess&&S.sess!=='15094736299')ACT.sair();if(!S.sess){S.showTermos=false;S.auth=resetAuth();S.auth.cel='(27) 99571-0426';S.auth.cpf='15094736299';S.auth.ind='JOSE1133';}}},
  {k:'pix',t:'Peça com Pix e repetição',d:'Monte o carrinho na Rio Doce e pague com Pix. No app real, o Pix sem pagamento é cancelado em 30 minutos.',b:'Abrir a Rio Doce',
    go:()=>{S.view='app';if(S.sess){S.adist='d1';S.atab='loja';S.cat='Todos';S.q='';S.pag='pix';}}},
  {k:'entrega',t:'Despache e entregue',d:'No painel, avance o pedido até “Entregue”. Os pontos entram na hora no app. Pedidos de retirada pulam o “Em rota”.',b:'Ver pedidos',
    go:()=>{S.view='right';S.right='dist';S.pd=S.pedidos.find(o=>o.cpf===S.sess&&o.canal==='app'&&o.status!=='entregue')?.dist||'d1';S.role='dono';S.ptab='pedidos';S.dnew[S.pd]=0;}},
  {k:'equipe',t:'Troque de usuário e de horário',d:'Entre como Caixa ou Entregador e mude a hora simulada para 23:30.',b:'Entrar como caixa',
    go:()=>{S.view='right';S.right='dist';S.role='caixa';S.ptab='pedidos';}},
  {k:'admin',t:'Gerencie a plataforma',d:'No Admin, registre o contrato da Vila Velha e coloque-a no ar, ou cadastre um bairro novo.',b:'Abrir o Admin',
    go:()=>{S.view='right';S.right='admin';S.atabA='dists';}}
];
S.guia={};S.guiaOpen=true;
function renderGuide(){const el=document.getElementById('guide'),dn=GUIA.filter(g=>S.guia[g.k]).length;
  el.className='guide'+(S.guiaOpen?'':' closed');
  el.innerHTML=`<button class="gh" data-a="guiaTog" aria-expanded="${S.guiaOpen}"><h2>Roteiro de teste</h2><span class="sub">${dn===GUIA.length?'Tudo testado. Explore à vontade.':'Siga os passos. Cada um se marca sozinho quando você concluir.'}</span><span class="gprog" aria-hidden="true"><i style="width:${dn/GUIA.length*100}%"></i></span><span class="gcount num">${dn} de ${GUIA.length}</span><span class="chev" aria-hidden="true">⌄</span></button>
  <ol class="gsteps" style="list-style:none;margin:0;padding:0">${GUIA.map((g,i)=>`<li class="gstep ${S.guia[g.k]?'done':''}"><div class="gtop"><span class="gn">${S.guia[g.k]?'✓':i+1}</span><b>${g.t}</b></div><p>${g.d}</p><button data-a="guiaGo" data-v="${i}">${g.b} ›</button></li>`).join('')}</ol>${errosHTML()}`;}
function mark(k){if(S.guia[k])return;S.guia[k]=true;renderGuide();}

/* ================= v2: tema ================= */
const THEMES=['system','light','dark'],THEME_ICO={system:'<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>',light:'<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',dark:'<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>'};
const THEME_TXT={system:'Tema do sistema',light:'Tema claro',dark:'Tema escuro'};
function applyTheme(t){S.theme=t;const r=document.documentElement;if(t==='system')delete r.dataset.theme;else r.dataset.theme=t;
  const b=document.getElementById('themebtn');b.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">${THEME_ICO[t]}</svg>`;b.title=THEME_TXT[t]+' (clique para trocar)';b.setAttribute('aria-label',b.title);
  try{localStorage.setItem('dp-theme',t)}catch(e){}}

function renderRight(){const el=document.getElementById('panel');el.innerHTML=S.right==='admin'?renderAdmin():renderDist();
  document.getElementById('rlabel').textContent=S.right==='admin'?'Admin da plataforma (você)':'Painel da distribuidora';}
function render(reset){renderApp(reset);renderRight();renderGuide();document.getElementById('stage').dataset.view=S.view;
  document.querySelectorAll('#viewseg button').forEach(b=>b.classList.toggle('on',b.dataset.v==='app'?S.view==='app':S.view!=='app'&&b.dataset.v===S.right));
  const cs=document.getElementById('clock-sel');if(cs&&+cs.value!==S.clock&&[...cs.options].some(o=>+o.value===S.clock))cs.value=S.clock;}

Object.assign(ACT,{
  theme:()=>applyTheme(THEMES[(THEMES.indexOf(S.theme)+1)%3]),
  addBairro:()=>{const nm=val('nb-nome').trim(),c=val('nb-cid');if(nm.length<3)return toast('Informe o nome do bairro.');
    if(BAIRROS.some(b=>normTxt(b[0])===normTxt(nm)&&b[1]===c))return toast(`${nm} já está cadastrado.`);
    BAIRROS.push([nm,c]);(S.bairrosX=S.bairrosX||[]).push([nm,c]);renderRight();toast(`${nm} · ${c} adicionado`);},
  reset:()=>{const b=document.getElementById('resetbtn');
    if(!resetArm){resetArm=true;b.textContent='Clique de novo para apagar tudo';b.classList.add('arm');clearTimeout(resetT);resetT=setTimeout(()=>{resetArm=false;b.textContent='Reiniciar demonstração';b.classList.remove('arm')},4000);return;}
    resetArm=false;clearTimeout(resetT);b.textContent='Reiniciar demonstração';b.classList.remove('arm');
    restore(INIT);try{localStorage.removeItem(SAVE_KEY)}catch(e){}render(true);toast('Demonstração reiniciada do zero');},
  guiaTog:()=>{S.guiaOpen=!S.guiaOpen;renderGuide()},
  guiaGo:v=>{GUIA[+v].go();render(true);const tgt=document.getElementById(S.view==='app'?'phone':'panel');
    if(window.matchMedia('(max-width:1100px)').matches)tgt?.scrollIntoView({behavior:'smooth',block:'start'});
    if(GUIA[+v].k==='balcao')setTimeout(()=>document.getElementById('pdv-valor')?.focus(),50);}
});
/* o roteiro se marca sozinho a partir das ações reais */
const HOOK={pdvConfirma:()=>!S.pdvPend&&'balcao',authCriar:()=>S.sess&&'cadastro',pixOk:()=>'pix',
  avancar:v=>{const o=S.pedidos.find(x=>x.id==v);return o?.status==='entregue'&&o.canal==='app'&&o.tipo==='compra'&&'entrega'},
  bloquear:()=>'admin',assinar:()=>'admin',dStatus:v=>'admin',addBairro:()=>'admin'};
for(const k in HOOK){const f=ACT[k];ACT[k]=(v,b)=>{const r=f(v,b),m=HOOK[k](v);if(m)mark(m);return r;};}
document.addEventListener('change',e=>{const id=e.target.id;if((id==='role-sel'&&S.role!=='dono')||(id==='clock-sel'&&S.clock>=1380))mark('equipe');});

