/* Utilitários, dados de exemplo e estado da demonstração */
/* ================= helpers ================= */
const G={
  can:'<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M7 7.5h10M7 16.5h10"/>',
  bottle:'<path d="M10 2.5h4v4l2 3V20a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 8 20V9.5l2-3z"/><path d="M8 13h8"/>',
  drop:'<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>',
  flame:'<path d="M12 3c1 4 5 6 5 11a5 5 0 0 1-10 0c0-3 2-4 2-7 1 1 2 2 3 2 0-2-1-4 0-6z"/>',
  bolt:'<path d="M13 2.5 5 14h6l-1 7.5 8-11.5h-6z"/>',
  box:'<path d="M3.5 7.5 12 3.5l8.5 4v9L12 20.5l-8.5-4z"/><path d="M3.5 7.5 12 11.5l8.5-4M12 11.5v9"/>',
  gift:'<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8.5h14V12M12 8v12.5M12 8S10.5 3.5 8 4.5 9 8 12 8zm0 0s1.5-4.5 4-3.5S15 8 12 8z"/>',
  fire:'<path d="M5 20.5h14M8 17l8-6M16 17l-8-6"/><path d="M12 3c.8 2.5 3 3.5 3 6a3 3 0 0 1-6 0c0-1.5 1-2 1-3.5.6.6 1.2 1 2 1 0-1.2-.6-2.3 0-3.5z"/>',
  tool:'<path d="M14.5 4a4 4 0 0 0-4.8 5.2L4 15l2.5 2.5 5.8-5.7A4 4 0 0 0 17.5 7l-2.3 2.3-2-2z"/>',
  bell:'<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>'
};
const svgI=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round">${G[k]}</svg>`;
const CAT={'Cervejas':{g:'can',h:'#C4870F'},'Refrigerantes':{g:'bottle',h:'#C23B2E'},'Águas':{g:'drop',h:'#2A7DB5'},'Energéticos':{g:'bolt',h:'#6E8F1E'},'Gás':{g:'flame',h:'#8A5A44'},'Conveniência':{g:'box',h:'#1F8F9C'},'Acessórios':{g:'tool',h:'#5B6B7A'},'Outros':{g:'box',h:'#7A6A5B'}};
const ico=(g,cat)=>`<div class="tile" style="--h:${(CAT[cat]||CAT.Outros).h}">${svgI(G[g]?g:'box')}</div>`;
const fmt=v=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const n=v=>Math.round(v).toLocaleString('pt-BR');
const dig=s=>(s||'').replace(/\D/g,'');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function maskCpf(v){const d=dig(v).slice(0,11);return d.replace(/^(\d{3})(\d)/,'$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/,'$1.$2.$3').replace(/\.(\d{3})(\d{1,2})$/,'.$1-$2');}
function maskCel(v){const d=dig(v).slice(0,11);if(d.length<3)return d;if(d.length<8)return `(${d.slice(0,2)}) ${d.slice(2)}`;return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;}
function maskCnpj(v){const d=dig(v).slice(0,14);return d.replace(/^(\d{2})(\d)/,'$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/,'$1.$2.$3').replace(/\.(\d{3})(\d)/,'.$1/$2').replace(/(\d{4})(\d)/,'$1-$2');}
function cpfValid(c){c=dig(c);if(c.length!==11||/^(\d)\1+$/.test(c))return false;
  for(let t=9;t<11;t++){let s=0;for(let i=0;i<t;i++)s+=+c[i]*(t+1-i);const r=(s*10)%11%10;if(r!==+c[t])return false;}return true;}
const cpfFmt=c=>maskCpf(c);
const cpfHide=c=>`•••.${c.slice(3,6)}.${c.slice(6,9)}-••`;
const celHide=c=>(c||'').replace(/\d{4}-/,'••••-');
const initials=s=>s.split(/\s+/).filter(w=>w.length>2||/^[A-Z]/.test(w)).slice(0,2).map(w=>w[0]).join('').toUpperCase();
const num=v=>{v=String(v??'').trim();if(!v)return NaN;return parseFloat(v.includes(',')?v.replace(/\./g,'').replace(',','.'):v)};
const val=id=>document.getElementById(id)?.value??'';
const HOJE=new Date(2026,8,25);
const ddmm=d=>d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});
const addD=k=>{const d=new Date(HOJE);d.setDate(d.getDate()+k);return d};
const hhmm=m=>`${String(Math.floor(m/60)%24).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
const toMin=s=>{const [h,m]=s.split(':').map(Number);return h*60+(m||0)};
const MESES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const noAcc=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'');

const BAIRROS=[['Jardim Camburi','Vitória'],['Jardim da Penha','Vitória'],['Mata da Praia','Vitória'],['Praia do Canto','Vitória'],['Bento Ferreira','Vitória'],['Laranjeiras','Serra'],['Serra Sede','Serra'],['Campo Grande','Cariacica'],['Praia da Costa','Vila Velha'],['Itapuã','Vila Velha']];
const cidadeDe=b=>(BAIRROS.find(x=>x[0]===b)||[])[1]||'';
const FLOW=['novo','separando','em_rota','entregue'];
const STL={novo:'Recebido',separando:'Separando',em_rota:'Saiu p/ entrega',entregue:'Entregue',cancelado:'Cancelado',ativa:'Ativa',implantacao:'Em implantação',suspensa:'Suspensa',paga:'Paga',aberta:'Em aberto',vencida:'Vencida',aberto:'Aberto',resolvido:'Resolvido',pendente:'Pendente',concluida:'Concluída'};
const STC={paga:'entregue',aberta:'separando',vencida:'cancelado',aberto:'novo',resolvido:'entregue',pendente:'separando',concluida:'entregue'};
const NEXT={novo:'Iniciar separação',separando:'Despachar',em_rota:'Confirmar entrega'};
const PAG={pix:'Pix',cartao:'Cartão na entrega',dinheiro:'Dinheiro'};
const PLANOS={Essencial:{preco:199,txt:'Catálogo, pedidos pelo app e programa de pontos'},Pro:{preco:399,txt:'+ pontos no balcão, campanhas automáticas, relatórios e integrações'},Rede:{preco:799,txt:'+ várias lojas, integração com ERP e gerente de conta'}};
const PALETA=['#1D4F7A','#B4461B','#2F6B3A','#6B3FA0','#0F6E78','#8A3553'];
const TABS={inicio:'Visão geral',estoque:'Estoque',pedidos:'Pedidos',entregas:'Minhas entregas',balcao:'Balcão',catalogo:'Catálogo',clientes:'Clientes',campanhas:'Campanhas',programa:'Pontos e prêmios',atendimento:'Atendimento',relatorios:'Relatórios',config:'Configurações'};
const ROLE_TABS={dono:['inicio','pedidos','balcao','estoque','catalogo','clientes','campanhas','programa','atendimento','relatorios','config'],caixa:['pedidos','balcao','estoque','atendimento'],entregador:['entregas']};
const ROLE_NOME={dono:'Dono',caixa:'Caixa',entregador:'Entregador'};

/* ================= state ================= */
function mkDist(o){return Object.assign({frete:0,freteGratis:0,min:0,pausada:false,areas:[],entregadores:['Marcos'],equipe:{dono:'Rafael',caixa:'Bruna'},
  rating:{soma:0,n:0},reviews:[],integ:{mp:true,erp:false,pdv:false,nfce:false,whats:true},contrato:'assinado',campLog:[],
  camp:{sumido:true,aniver:true,quase:true,vence:true},rel:null},o);}
const S={
  view:'app',right:'dist',seq:1042,fresh:null,clock:650,
  sess:'52998224725',auth:{step:'cpf',cpf:'',nome:'',cel:'',rua:'',bairro:'Jardim Camburi',ind:'',err:''},showTermos:false,
  atab:'inicio',adist:null,cart:{dist:null,items:{}},pwal:null,q:'',cat:'Todos',entrega:'entrega',pag:'pix',recFreq:0,confirm:null,
  pixPend:null,helpFor:null,delConfirm:false,endAtual:null,editEnd:false,endErr:'',
  pd:'d1',role:'dono',ptab:'inicio',pfilt:'abertos',pdv:{cpf:'',valor:'',cupom:'',cel:''},pdvPend:null,dnew:{},impMsg:'',
  atabA:'dists',
  dists:{
    d1:mkDist({id:'d1',nome:'Rio Doce Distribuidora',cnpj:'12.345.678/0001-90',cidade:'Vitória',bairro:'Jardim Camburi',seg:'Bebidas, água e gás',cor:'#1D4F7A',plano:'Pro',status:'ativa',desde:'mar/2026',
      freteGratis:100,horario:{abre:'07:00',fecha:'23:00'},prazo:'40–60 min',entregadores:['Marcos','Diego'],
      areas:[{bairro:'Jardim Camburi',frete:0},{bairro:'Jardim da Penha',frete:5},{bairro:'Mata da Praia',frete:5},{bairro:'Praia do Canto',frete:7},{bairro:'Bento Ferreira',frete:8}],
      cfg:{ptsPorReal:1,prata:1500,ouro:5000,dobro:['d1-en1'],validade:12,indicacao:100,aniverPts:100},rating:{soma:4.7*212,n:212},
      reviews:[['Ana S.',5,'Chegou gelado e rápido.'],['Paulo R.',4,'Entregador atencioso, só demorou um pouco.'],['Luiza M.',5,'Troquei meus pontos por um fardo, muito fácil.']],
      premios:[{id:'d1r1',nome:'Gelo em cubos 5kg',cat:'Conveniência',g:'box',custo:180,ativo:true},{id:'d1r2',nome:'Água mineral galão 20L',cat:'Águas',g:'drop',custo:250,ativo:true},{id:'d1r3',nome:'Fardo 12 cervejas lata',cat:'Cervejas',g:'can',custo:650,ativo:true},{id:'d1r4',nome:'Kit churrasco (carvão + gelo + 12 latas)',cat:'Conveniência',g:'gift',custo:1100,ativo:true},{id:'d1r5',nome:'Gás de cozinha P13',cat:'Gás',g:'flame',custo:1500,ativo:true}],
      rel:{app:[3.1,3.4,3.2,3.9,4.2,4.0,4.6,4.9],bal:[6.2,6.0,6.4,6.1,6.5,6.3,6.6,6.8],tM:142.3,tN:97.8,fM:2.6,fN:1.3}}),
    d2:mkDist({id:'d2',nome:'Serra Gás & Água',cnpj:'23.456.789/0001-01',cidade:'Serra',bairro:'Laranjeiras',seg:'Gás e água mineral',cor:'#B4461B',plano:'Essencial',status:'ativa',desde:'jun/2026',
      horario:{abre:'06:00',fecha:'21:00'},prazo:'30–45 min',entregadores:['Jonas'],equipe:{dono:'Cláudia',caixa:'Tiago'},
      areas:[{bairro:'Laranjeiras',frete:0},{bairro:'Serra Sede',frete:5},{bairro:'Jardim Camburi',frete:8}],
      cfg:{ptsPorReal:1,prata:800,ouro:2500,dobro:[],validade:12,indicacao:50,aniverPts:50},rating:{soma:4.5*88,n:88},reviews:[['Mariana L.',5,'Gás chegou em 20 minutos.']],
      premios:[{id:'d2r1',nome:'Água mineral galão 20L',cat:'Águas',g:'drop',custo:200,ativo:true},{id:'d2r2',nome:'Regulador de gás com mangueira',cat:'Acessórios',g:'tool',custo:450,ativo:true},{id:'d2r3',nome:'Gás de cozinha P13',cat:'Gás',g:'flame',custo:1200,ativo:true}],
      rel:{app:[1.2,1.3,1.1,1.5,1.6,1.4,1.7,1.8],bal:[2.4,2.5,2.3,2.6,2.4,2.7,2.5,2.6],tM:118.4,tN:109.9,fM:1.4,fN:0.9}}),
    d3:mkDist({id:'d3',nome:'Capixaba Bebidas Atacado',cnpj:'34.567.890/0001-12',cidade:'Cariacica',bairro:'Campo Grande',seg:'Bebidas em fardo e caixa',cor:'#2F6B3A',plano:'Pro',status:'ativa',desde:'ago/2026',
      min:150,horario:{abre:'08:00',fecha:'18:00'},prazo:'amanhã até 12h',entregadores:['Wesley'],equipe:{dono:'Sérgio',caixa:'Aline'},
      areas:[{bairro:'Campo Grande',frete:0},{bairro:'Bento Ferreira',frete:0},{bairro:'Praia do Canto',frete:0},{bairro:'Jardim Camburi',frete:0}],
      cfg:{ptsPorReal:1,prata:3000,ouro:10000,dobro:[],validade:12,indicacao:150,aniverPts:100},rating:{soma:4.8*41,n:41},reviews:[['José A.',5,'Preço de atacado bom e entrega no horário.']],
      premios:[{id:'d3r1',nome:'Fardo 12 cervejas lata',cat:'Cervejas',g:'can',custo:600,ativo:true},{id:'d3r2',nome:'Caixa 24 long neck puro malte',cat:'Cervejas',g:'bottle',custo:2000,ativo:true}],
      rel:{app:[5.8,6.2,6.0,7.1,6.8,7.4,7.9,8.3],bal:[4.1,3.9,4.2,4.0,3.8,4.1,3.9,4.2],tM:612.0,tN:455.5,fM:3.1,fN:1.8}}),
    d4:mkDist({id:'d4',nome:'Vila Velha Frios & Bebidas',cnpj:'45.678.901/0001-23',cidade:'Vila Velha',bairro:'Praia da Costa',seg:'Bebidas e congelados',cor:'#6B3FA0',plano:'Essencial',status:'implantacao',desde:'set/2026',contrato:'pendente',
      freteGratis:80,horario:{abre:'09:00',fecha:'22:00'},prazo:'45–70 min',entregadores:['Rodrigo'],equipe:{dono:'Helena',caixa:'Caio'},
      areas:[{bairro:'Praia da Costa',frete:0},{bairro:'Itapuã',frete:5}],cfg:{ptsPorReal:1,prata:1000,ouro:4000,dobro:[],validade:12,indicacao:100,aniverPts:100},premios:[]})
  },
  produtos:[],
  clientes:{
    '52998224725':{cpf:'52998224725',nome:'Ana Souza',cel:'(27) 99812-4410',cadastrado:true,desde:'jan/2026',mkt:true,end:{bairro:'Jardim Camburi',rua:'Rua Carlos Martins, 120'},nasc:'09',codigo:'ANA4410'},
    '31847562035':{cpf:'31847562035',nome:'Carlos Mendes',cel:'(27) 99734-2281',cadastrado:true,desde:'mar/2026',mkt:false,end:{bairro:'Mata da Praia',rua:'Av. Dante Michelini, 900'},nasc:'03',codigo:'CARLOS2281',indicadoPor:'70419385657',indicPago:true},
    '70419385657':{cpf:'70419385657',nome:'José Almeida',cel:'(27) 98820-1133',cadastrado:true,desde:'abr/2026',mkt:true,obs:'Bar do Zé',end:{bairro:'Praia do Canto',rua:'Rua Joaquim Lírio, 45'},nasc:'11',codigo:'JOSE1133'},
    '26153890415':{cpf:'26153890415',nome:'Mariana Lopes',cel:'(27) 99655-0902',cadastrado:true,desde:'jul/2026',mkt:true,end:{bairro:'Laranjeiras',rua:'Av. Central, 310'},nasc:'09',codigo:'MARIANA0902'},
    '84362017526':{cpf:'84362017526',cadastrado:false,origem:'d1'}
  },
  w:{},pedidos:[],recorr:[],notifs:{},chamados:[],
  faturas:[],lgpd:[{id:'l1',cpf:'31847562035',nome:'Carlos Mendes',tipo:'Cópia dos dados',data:'23/09',status:'pendente'}]
};
function addP(dist,key,nome,cat,un,preco,estoque,g){S.produtos.push({id:`${dist}-${key}`,dist,nome,cat,un,preco,estoque,g:g||CAT[cat].g,ativo:true,custo:+(preco*(1-({'Cervejas':.22,'Refrigerantes':.28,'Águas':.35,'Gás':.18,'Energéticos':.38,'Conveniência':.40,'Acessórios':.45}[cat]||.3))).toFixed(2),minimo:Math.max(3,Math.round(estoque*.2)),forn:'Fornecedor principal'});}
[['cv1','Cerveja Pilsen lata 350ml','Cervejas','lata',4.49,240],['cv2','Cerveja Puro Malte long neck 355ml','Cervejas','garrafa',6.49,96,'bottle'],['rf1','Refrigerante Cola 2L','Refrigerantes','garrafa',9.99,60],['rf2','Refrigerante Guaraná 2L','Refrigerantes','garrafa',8.99,48],['ag1','Água mineral sem gás 500ml','Águas','garrafa',2.00,300],['ag2','Água mineral galão 20L','Águas','galão (troca)',16.00,35],['en1','Energético lata 473ml','Energéticos','lata',9.90,4],['gs1','Gás de cozinha P13','Gás','botijão (troca)',115.00,12],['cn1','Gelo em cubos 5kg','Conveniência','saco',14.00,25],['cn2','Carvão vegetal 4kg','Conveniência','saco',22.90,0,'fire']].forEach(a=>addP('d1',...a));
[['gs1','Gás de cozinha P13','Gás','botijão (troca)',110.00,30],['gs2','Gás P45 industrial','Gás','cilindro (troca)',460.00,6],['ag1','Água mineral galão 20L','Águas','galão (troca)',14.00,50],['ag2','Água mineral 1,5L fardo 6','Águas','fardo',15.90,40],['ac1','Regulador de gás com mangueira','Acessórios','unidade',39.90,15]].forEach(a=>addP('d2',...a));
[['cv1','Cerveja Pilsen lata 350ml fardo 12','Cervejas','fardo',42.90,120],['cv2','Cerveja Puro Malte long neck cx 24','Cervejas','caixa',135.90,40,'bottle'],['rf1','Refrigerante Cola 2L fardo 6','Refrigerantes','fardo',49.90,80],['en1','Energético 473ml fardo 6','Energéticos','fardo',47.90,30],['ag1','Água mineral 500ml fardo 12','Águas','fardo',13.90,90]].forEach(a=>addP('d3',...a));
[['cv1','Cerveja Pilsen lata 350ml','Cervejas','lata',4.29,200]].forEach(a=>addP('d4',...a));
const PM=()=>Object.fromEntries(S.produtos.map(p=>[p.id,p]));

function W(dist,cpf){const k=dist+':'+cpf;return S.w[k]||(S.w[k]={dist,cpf,saldo:0,acumulado:0,pendente:0,extrato:[],vencendo:null,bonus2x:false,diasSem:0,aniverPago:false});}
const hasW=(dist,cpf)=>!!S.w[dist+':'+cpf];
const isCad=cpf=>!!S.clientes[cpf]?.cadastrado;
function tier(dist,w){const cf=S.dists[dist].cfg,a=w.acumulado;
  if(a>=cf.ouro)return{n:'Ouro',m:1.5,cls:'gold',next:null};
  if(a>=cf.prata)return{n:'Prata',m:1.25,cls:'silver',next:{n:'Ouro',base:cf.prata,alvo:cf.ouro}};
  return{n:'Bronze',m:1,cls:'bronze',next:{n:'Prata',base:0,alvo:cf.prata}};}
function calcPts(dist,itens,w){const cf=S.dists[dist].cfg,t=tier(dist,w);let p=0;for(const x of itens)p+=x.preco*x.qty*cf.ptsPorReal*(cf.dobro.includes(x.id)?2:1);return Math.floor(p*t.m*(w.bonus2x?2:1));}
const ptsValor=(dist,v,w)=>Math.floor(v*S.dists[dist].cfg.ptsPorReal*tier(dist,w).m);
const tierPill=(dist,w)=>{const t=tier(dist,w);return `<span class="tier ${t.cls}"><i></i>${t.n}</span>`};
const stPill=s=>`<span class="pill st-${STC[s]||s}">${STL[s]}</span>`;
const cliNome=cpf=>{const c=S.clientes[cpf];return c&&c.cadastrado?c.nome+(c.obs?` · ${c.obs}`:''):'Aguardando cadastro'};
const itensTxt=o=>{const pm=PM();return o.tipo==='resgate'?esc(o.itensTxt):o.canal==='balcao'?`Compra na loja física${o.cupom?' · cupom '+esc(o.cupom):''}`:o.itens.map(x=>`${x.qty}× ${esc(pm[x.id]?.nome||'Produto')}`).join(' · ')};
function aberta(d){return !d.pausada&&S.clock>=toMin(d.horario.abre)&&S.clock<toMin(d.horario.fecha)}
function lojaTxt(d){if(d.pausada)return 'Pausada no momento';return aberta(d)?`Aberta até ${d.horario.fecha}`:`Fechada · abre ${S.clock<toMin(d.horario.abre)?'hoje':'amanhã'} às ${d.horario.abre}`}
const area=(d,b)=>d.areas.find(a=>a.bairro===b);
function freteDe(d,b,s){const a=area(d,b);if(!a)return null;if(a.frete&&d.freteGratis&&s>=d.freteGratis)return 0;return a.frete;}
const nota=d=>d.rating.n?(d.rating.soma/d.rating.n).toFixed(1).replace('.',','):'–';
function now(){S.clock+=2;return hhmm(S.clock)}
function notify(cpf,msg,canal='app'){if(!isCad(cpf))return;(S.notifs[cpf]=S.notifs[cpf]||[]).unshift({msg,hora:hhmm(S.clock),canal,lida:false});}
function newOrderBell(dist){S.dnew[dist]=(S.dnew[dist]||0)+1;}

function seed(){
  const base={'d1:52998224725':[420,1280,[['22/09','Pedido #1029',86],['15/09','Resgate · Gelo 5kg',-180],['08/09','Compra na loja · cupom 003877',124]],{pts:124,data:'08/10'},3],
    'd2:52998224725':[60,180,[['02/09','Pedido #1004',60]],null,23],'d1:31847562035':[95,310,[['10/09','Bônus indique um amigo',100]],null,0],
    'd1:70419385657':[3150,6240,[['17/09','Pedido #1020',588],['10/09','Bônus indique um amigo',100]],{pts:588,data:'17/10'},1],
    'd3:70419385657':[900,2600,[['20/09','Pedido #1024',412]],null,5],'d2:26153890415':[240,520,[['12/09','Compra na loja · cupom 000931',110]],{pts:110,data:'12/10'},34],
    'd1:84362017526':[85,85,[['19/09','Compra na loja · cupom 004102',85]],null,6]};
  for(const k in base){const [d,c]=k.split(':'),w=W(d,c),b=base[k];[w.saldo,w.acumulado]=b;w.extrato=b[2].map(([d,desc,pts])=>({d,desc,pts}));w.vencendo=b[3];w.diasSem=b[4];}
  const pm=PM();
  const app=(id,dist,cpf,list,status,hora,dia,pag='pix',extra={})=>{const itens=list.map(([k,q])=>({id:`${dist}-${k}`,qty:q,preco:pm[`${dist}-${k}`].preco}));
    const s=itens.reduce((a,b)=>a+b.preco*b.qty,0),c=S.clientes[cpf],f=freteDe(S.dists[dist],c.end.bairro,s)||0;
    return Object.assign({id,dist,cpf,canal:'app',tipo:'compra',itens,total:s+f,pts:calcPts(dist,itens,W(dist,cpf)),status,hora,dia,pag,pagStatus:pag==='pix'?'pago':'na_entrega',entrega:'entrega',end:c.end},extra)};
  S.pedidos=[
    app(1040,'d1','70419385657',[['cv1',12],['rf1',6],['ag1',12]],'novo','10:48','hoje','dinheiro'),
    {id:1041,dist:'d1',cpf:'70419385657',canal:'app',tipo:'resgate',itensTxt:'Fardo 12 cervejas lata',total:0,pts:650,status:'novo',hora:'10:31',dia:'hoje',entrega:'entrega',end:S.clientes['70419385657'].end},
    app(1038,'d1','31847562035',[['cv2',6],['en1',2],['cn1',1]],'separando','09:55','hoje','cartao'),
    app(1037,'d1','52998224725',[['ag2',2],['cn1',1]],'em_rota','09:20','hoje','pix',{entregador:'Marcos',eta:'11:05'}),
    {id:1036,dist:'d1',cpf:'31847562035',canal:'balcao',tipo:'compra',total:86.5,pts:86,status:'entregue',hora:'08:12',dia:'hoje',cupom:'004512'},
    app(1039,'d1','52998224725',[['cv1',12],['rf2',2],['cn1',2]],'entregue','17:40','ontem'),
    app(1035,'d3','70419385657',[['cv1',4],['rf1',2]],'separando','08:40','hoje','pix'),
    app(1034,'d2','26153890415',[['gs1',1]],'novo','10:05','hoje','dinheiro')
  ];
  S.pedidos.forEach(o=>{if(o.tipo==='compra'&&o.canal==='app'&&o.status!=='entregue')W(o.dist,o.cpf).pendente+=o.pts;});
  W('d1','31847562035').extrato.unshift({d:'hoje',desc:'Compra na loja · cupom 004512',pts:86});
  W('d1','70419385657').extrato.unshift({d:'hoje',desc:'Resgate · Fardo 12 cervejas lata',pts:-650});
  const o39=S.pedidos.find(o=>o.id===1039);W('d1','52998224725').extrato.unshift({d:'ontem',desc:'Pedido #1039',pts:o39.pts});
  S.recorr=[{id:'rc1',dist:'d2',cpf:'26153890415',end:S.clientes['26153890415'].end,itens:[{id:'d2-gs1',qty:1}],freq:30,prox:ddmm(addD(2)),pag:'dinheiro',ativo:true},
    {id:'rc2',dist:'d1',cpf:'31847562035',end:S.clientes['31847562035'].end,itens:[{id:'d1-ag2',qty:2}],freq:7,prox:ddmm(addD(1)),pag:'pix',ativo:true}];
  S.chamados=[{id:'ch1',dist:'d1',cpf:'52998224725',pedido:1039,tipo:'Item faltando',msg:'Pedi 2 sacos de gelo e veio só 1.',status:'aberto',hora:'09:02'}];
  S.notifs['52998224725']=[{msg:'Pedido #1037 saiu para entrega com Marcos. Chega por volta de 11:05.',hora:'10:30',canal:'app',lida:false},
    {msg:'Rio Doce: 124 pts vencem em 08/10. Use antes de perder!',hora:'ontem',canal:'whatsapp',lida:true},
    {msg:'Você ganhou 86 pts na Rio Doce (pedido #1029).',hora:'22/09',canal:'app',lida:true}];
  S.faturas=[{id:'f1',dist:'d1',mes:'ago/2026',valor:399,venc:'10/08',status:'paga'},{id:'f2',dist:'d2',mes:'ago/2026',valor:199,venc:'10/08',status:'paga'},
    {id:'f3',dist:'d1',mes:'set/2026',valor:399,venc:'10/09',status:'paga'},{id:'f4',dist:'d2',mes:'set/2026',valor:199,venc:'10/09',status:'vencida'},{id:'f5',dist:'d3',mes:'set/2026',valor:399,venc:'30/09',status:'aberta'}];
}

