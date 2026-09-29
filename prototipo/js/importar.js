/* ================= IMPORTAR TABELA DE PREÇOS (Excel) ================= */
const XL_CAMPOS=[['nome','Nome do produto',true],['preco','Preço de venda',true],['codigo','Código',false],['categoria','Categoria',false],['unidade','Unidade',false],['custo','Custo',false],['estoque','Estoque',false]];
const XL_SIN={
  nome:['descricao','descrição','produto','produtos','item','nome','mercadoria','descr'],
  preco:['preco venda','preço venda','pr venda','preco','preço','valor venda','valor','venda','pv','unitario','unitário','tabela'],
  codigo:['codigo','código','cod','cód','sku','ref','referencia','referência','ean','barras'],
  categoria:['categoria','grupo','secao','seção','departamento','familia','família','linha'],
  unidade:['unidade','und','un','emb','embalagem','medida'],
  custo:['custo','preco custo','preço custo','compra','preco compra'],
  estoque:['estoque','saldo','qtd','quantidade','qtde','disponivel','disponível']};
const normTxt=s=>noAcc(String(s??'')).toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
function xlMoney(v){if(typeof v==='number')return v;let s=String(v??'').replace(/r\$|\s/gi,'');if(!s)return NaN;
  if(s.includes(',')&&s.includes('.'))s=s.lastIndexOf(',')>s.lastIndexOf('.')?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,'');else if(s.includes(','))s=s.replace(',','.');return parseFloat(s);}
function xlCat(nome,cat){const c=normTxt(cat);const known=Object.keys(CAT).find(k=>normTxt(k)===c||(c&&normTxt(k).startsWith(c.slice(0,5))));if(known)return known;
  const t=normTxt(nome);if(/cerve|chopp|long neck|pilsen|puro malte/.test(t))return 'Cervejas';if(/refri|refrigerante|guarana|cola|soda|tonica/.test(t))return 'Refrigerantes';
  if(/agua|galao/.test(t))return 'Águas';if(/energet/.test(t))return 'Energéticos';if(/gas|botijao|p13|p45/.test(t))return 'Gás';if(/gelo|carvao|copo|guardanapo/.test(t))return 'Conveniência';if(/regulador|mangueira/.test(t))return 'Acessórios';return 'Outros';}
function xlDetectHeader(rows){let best=0,score=-1;rows.slice(0,15).forEach((r,i)=>{let sc=0;r.forEach(c=>{const t=normTxt(c);if(t&&Object.values(XL_SIN).some(l=>l.some(x=>t===x||t.startsWith(x+' ')||t.endsWith(' '+x))))sc++;});if(sc>score){score=sc;best=i;}});return score>=2?best:0;}
function xlDetectMap(hdr){const map={},used=new Set();const H=hdr.map(normTxt);
  for(const [campo] of XL_CAMPOS){let pick=-1;for(const syn of XL_SIN[campo]){pick=H.findIndex((h,i)=>!used.has(i)&&h&&(h===syn||h.startsWith(syn+' ')||h.endsWith(' '+syn)||h.includes(syn))&&!(campo==='preco'&&/custo|compra/.test(h)));if(pick>=0)break;}
    map[campo]=pick;if(pick>=0)used.add(pick);}
  return map;}
function xlLoad(fileName,sheets){const first=Object.keys(sheets)[0];S.xl={fileName,sheets,sheet:first,ocultar:false};xlPrepare();}
function xlPrepare(){const x=S.xl,rows=x.sheets[x.sheet]||[];x.hdr=xlDetectHeader(rows);x.map=xlDetectMap(rows[x.hdr]||[]);}
function xlItems(){const x=S.xl,rows=(x.sheets[x.sheet]||[]).slice(x.hdr+1),m=x.map,d=D(),prods=S.produtos.filter(p=>p.dist===d.id);
  const byCod={},byNome={};prods.forEach(p=>{if(p.codigo)byCod[normTxt(p.codigo)]=p;byNome[normTxt(p.nome)]=p;});
  const out=[];rows.forEach((r,i)=>{const g=k=>m[k]>=0?r[m[k]]:'';const nome=String(g('nome')??'').trim();const precoTxt=String(g('preco')??'').trim(),codTxt=String(g('codigo')??'').trim();if((!nome&&!precoTxt)||(!precoTxt&&!codTxt))return;
    const preco=xlMoney(g('preco')),custo=m.custo>=0?xlMoney(g('custo')):NaN,est=m.estoque>=0?parseInt(String(g('estoque')).replace(/\D/g,'')):NaN,cod=String(g('codigo')??'').trim();
    const nm=nome===nome.toUpperCase()&&/[A-Z]/.test(nome)?nome.toLowerCase().replace(/(^|\s)(\S)/g,(m,a,b)=>a+b.toUpperCase()).replace(/\b(\d+)(Ml|L|Kg|G)\b/g,(m,a,b)=>a+b.toLowerCase()):nome;
    const it={linha:x.hdr+i+2,nome:nm,cod,preco,custo,est,cat:xlCat(nome,g('categoria')),un:String(g('unidade')||'').trim().toLowerCase()||'unidade'};
    if(!nome)it.erro='sem nome';else if(!(preco>0))it.erro='preço inválido';
    const atual=(cod&&byCod[normTxt(cod)])||byNome[normTxt(nm)];it.atual=atual;
    it.status=it.erro?'erro':!atual?'novo':Math.abs(atual.preco-preco)>0.004?'altera':'igual';
    if(it.status==='altera'){it.var=(preco-atual.preco)/atual.preco;if(Math.abs(it.var)>.3)it.aviso='variação alta, confira';}
    out.push(it);});
  return out;}
function impCard(){const x=S.xl,okLib=typeof XLSX!=='undefined';
  if(!x)return `<div class="box2 imp">
    <div class="ordh"><h3 class="h2">Importar tabela de preços</h3><span class="sub">Excel (.xlsx, .xls) ou .csv</span></div>
    <label class="drop" id="xl-drop" for="xl-file"><b>Arraste a planilha de preços aqui</b><span>ou clique para escolher o arquivo</span>
      <input type="file" id="xl-file" accept=".xlsx,.xls,.csv" hidden></label>
    <div class="fr" style="align-items:center"><button class="abtn ghost" data-a="xlExemplo">Testar com uma planilha de exemplo</button>
      <span class="sub">O sistema acha sozinho as colunas de produto, preço, código, grupo, embalagem, custo e estoque.</span></div>
    ${!okLib?'<div class="alert">Leitor de Excel não carregou. Salve a planilha como .csv e envie de novo.</div>':''}
    ${S.impLog?.length?`<div class="note">${S.impLog.map(l=>`<div>${l}</div>`).join('')}</div>`:''}
  </div>`;
  const rows=x.sheets[x.sheet]||[],hdr=rows[x.hdr]||[],its=xlItems(),c=k=>its.filter(i=>i.status===k).length,miss=Object.fromEntries(XL_CAMPOS.map(([k])=>[k,x.map[k]<0]));
  const d=D(),ausentes=S.produtos.filter(p=>p.dist===d.id&&p.ativo&&!its.some(i=>i.atual===p)).length;
  const colOpts=sel=>`<option value="-1">— não tem —</option>`+hdr.map((h,i)=>`<option value="${i}" ${i===sel?'selected':''}>${esc(String(h||'Coluna '+(i+1)))}</option>`).join('');
  return `<div class="box2 imp" style="border-color:var(--primary)">
    <div class="ordh"><h3 class="h2">Importar: ${esc(x.fileName)}</h3><button class="lbtn" style="color:var(--muted)" data-a="xlCancelar">Cancelar</button></div>
    <div class="frm" style="grid-template-columns:1fr 1fr">
      ${Object.keys(x.sheets).length>1?`<label class="lbl">Aba da planilha<select id="xl-sheet">${Object.keys(x.sheets).map(s=>`<option ${s===x.sheet?'selected':''}>${esc(s)}</option>`).join('')}</select></label>`:''}
      <label class="lbl">Linha do cabeçalho<select id="xl-hdr">${rows.slice(0,15).map((r,i)=>`<option value="${i}" ${i===x.hdr?'selected':''}>Linha ${i+1}: ${esc(r.filter(v=>v!=='').slice(0,4).join(' · ').slice(0,60)||'(vazia)')}</option>`).join('')}</select></label>
    </div>
    <p class="sec" style="margin:4px 0 0">Colunas encontradas</p>
    <div class="maps">${XL_CAMPOS.map(([k,l,req])=>`<label class="lbl ${req&&miss[k]?'bad':''}">${l}${req?' *':''}<select data-map="${k}" id="map-${k}">${colOpts(x.map[k])}</select></label>`).join('')}</div>
    ${miss.nome||miss.preco?'<div class="err">Escolha as colunas de nome do produto e preço de venda para continuar.</div>':`
    <div class="fr"><span class="pill st-entregue">${c('novo')} novos</span><span class="pill st-separando">${c('altera')} preços alterados</span><span class="pill" style="border:1px solid var(--line)">${c('igual')} sem mudança</span>${c('erro')?`<span class="pill st-cancelado">${c('erro')} com erro</span>`:''}</div>
    <div class="tbl" style="max-height:340px;overflow:auto"><table style="min-width:720px"><thead><tr><th>Linha</th><th>Produto</th><th>Categoria</th><th>Unidade</th><th class="r">Preço</th><th>O que acontece</th></tr></thead><tbody>
    ${its.map(i=>`<tr><td class="num sub">${i.linha}</td><td><b>${esc(i.nome||'—')}</b>${i.cod?`<div class="sub mono">${esc(i.cod)}</div>`:''}</td><td>${i.cat}</td><td>${esc(i.un)}</td>
      <td class="r num">${i.preco>0?fmt(i.preco):'—'}${i.status==='altera'?`<div class="sub">antes ${fmt(i.atual.preco)}</div>`:''}</td>
      <td>${i.status==='erro'?`<span class="pill st-cancelado">Ignorado: ${i.erro}</span>`:i.status==='novo'?'<span class="pill st-entregue">Novo produto</span>':i.status==='altera'?`<span class="pill st-separando">Preço ${i.var>0?'sobe':'cai'} ${Math.abs(i.var*100).toFixed(0)}%</span>${i.aviso?`<div class="sub" style="color:var(--warn)">${i.aviso}</div>`:''}`:'<span class="sub">Sem mudança</span>'}</td></tr>`).join('')}
    </tbody></table></div>
    ${ausentes?`<label class="chk"><input type="checkbox" id="xl-ocultar" ${x.ocultar?'checked':''}>Ocultar do app os ${ausentes} produtos que não estão nesta planilha</label>`:''}
    <div class="fr" style="justify-content:flex-end"><button class="abtn ghost" data-a="xlCancelar">Cancelar</button><button class="abtn acc" data-a="xlAplicar" ${c('novo')+c('altera')+(x.ocultar?ausentes:0)?'':'disabled'}>Aplicar: ${c('novo')} novos e ${c('altera')} preços</button></div>`}
  </div>`;}
function xlFromFile(file){const nm=file.name,ext=nm.split('.').pop().toLowerCase(),r=new FileReader();
  r.onload=()=>{try{let sheets={};
    if(ext==='csv'||typeof XLSX==='undefined'){const txt=typeof r.result==='string'?r.result:new TextDecoder().decode(r.result);const sep=(txt.split('\n')[0].match(/;/g)||[]).length>=(txt.split('\n')[0].match(/,/g)||[]).length?';':',';
      sheets.Planilha=txt.split(/\r?\n/).filter(l=>l.trim()).map(l=>l.split(sep).map(v=>v.replace(/^"|"$/g,'').trim()));}
    else{const wb=XLSX.read(new Uint8Array(r.result),{type:'array'});wb.SheetNames.forEach(s=>sheets[s]=XLSX.utils.sheet_to_json(wb.Sheets[s],{header:1,raw:true,defval:''}));}
    xlLoad(nm,sheets);S.impLog=null;renderRight();}catch(e){toast('Não consegui ler este arquivo. Salve como .xlsx ou .csv e tente de novo.');}};
  if(ext==='csv'||typeof XLSX==='undefined')r.readAsText(file);else r.readAsArrayBuffer(file);}
function xlExemploAoa(){const d=D(),ps=S.produtos.filter(p=>p.dist===d.id);
  const aoa=[[`TABELA DE PREÇOS · ${d.nome.toUpperCase()} · OUTUBRO/2026`],['Válida a partir de 01/10'],[],['Cód.','Descrição','Grupo','Emb.','Preço Venda','Custo','Estoque']];
  ps.forEach((p,i)=>aoa.push([String(7890+i*7),p.nome,p.cat.toUpperCase(),p.un.toUpperCase(),i%3===0?+(p.preco*1.06).toFixed(2):i===4?+(p.preco*1.45).toFixed(2):p.preco,p.custo,p.estoque+(i%2?24:0)]));
  aoa.push(['8120','Cerveja Pilsen garrafa 600ml','CERVEJA','GARRAFA',8.9,6.9,96],['8127','Refrigerante Limão 2L','REFRIGERANTE','GARRAFA','R$ 8,49',6.1,30],['8134','Água com gás 500ml','AGUA','GARRAFA','2,80',1.8,60],['8141','Suco de uva integral 1L','BEBIDAS','GARRAFA','',9.5,12],[],['','Preços sujeitos a alteração sem aviso']);
  return aoa;}

