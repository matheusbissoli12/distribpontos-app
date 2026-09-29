/* Realismo: ilustração de cada produto, mapa do entregador e avisos em forma de conversa */

/* ---------- ilustrações de produto (SVG desenhado por tipo de embalagem) ---------- */
const W_='#fff';
function artLata(x,y,w,h,c,rot){return `<g ${rot?`transform="rotate(${rot} ${x+w/2} ${y+h})"`:''}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w*.18}" fill="${c}"/><rect x="${x}" y="${y+h*.34}" width="${w}" height="${h*.3}" fill="${W_}" opacity=".88"/><rect x="${x+w*.18}" y="${y+h*.42}" width="${w*.64}" height="${h*.05}" rx="1" fill="${c}" opacity=".7"/><rect x="${x+w*.18}" y="${y+h*.51}" width="${w*.4}" height="${h*.04}" rx="1" fill="${c}" opacity=".45"/><ellipse cx="${x+w/2}" cy="${y+1.5}" rx="${w/2-1}" ry="2.2" fill="#C9D1D8"/><rect x="${x+w*.14}" y="${y+4}" width="${w*.1}" height="${h-8}" rx="1" fill="${W_}" opacity=".28"/></g>`;}
function artGarrafa(x,y,w,h,c,vidro){const nw=w*.34,nx=x+(w-nw)/2;return `<g><rect x="${nx}" y="${y}" width="${nw}" height="${h*.1}" rx="1.5" fill="${vidro?'#C9A227':c}"/><path d="M${nx} ${y+h*.1}h${nw}v${h*.1}c0 ${h*.06} ${(w-nw)/2} ${h*.08} ${(w-nw)/2} ${h*.16}V${y+h-3}a3 3 0 0 1-3 3H${x+3}a3 3 0 0 1-3-3V${y+h*.36}c0-${h*.08} ${(w-nw)/2}-${h*.1} ${(w-nw)/2}-${h*.16}z" fill="${vidro?'#5B3A1A':c}" opacity="${vidro?1:.92}"/><rect x="${x}" y="${y+h*.5}" width="${w}" height="${h*.24}" fill="${W_}" opacity=".9"/><rect x="${x+w*.18}" y="${y+h*.57}" width="${w*.64}" height="${h*.05}" rx="1" fill="${c}" opacity=".75"/><rect x="${x+w*.16}" y="${y+h*.26}" width="${w*.1}" height="${h*.62}" rx="1" fill="${W_}" opacity=".25"/></g>`;}
function artGalao(x,y,c){return `<g><rect x="${x+15}" y="${y}" width="10" height="6" rx="2" fill="#2A6FB5"/><path d="M${x+11} ${y+6}h18l5 7v31a6 6 0 0 1-6 6H${x+12}a6 6 0 0 1-6-6V${y+13}z" fill="${c}" opacity=".35"/><path d="M${x+6} ${y+24}h28M${x+6} ${y+36}h28" stroke="${c}" stroke-width="1.6" opacity=".6"/><rect x="${x+10}" y="${y+14}" width="3" height="30" rx="1.5" fill="${W_}" opacity=".6"/></g>`;}
function artBotijao(x,y,c,grande){const s=grande?1.12:1;return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="11" y="0" width="18" height="10" rx="3" fill="none" stroke="#6B7780" stroke-width="3"/><rect x="18" y="4" width="4" height="7" fill="#6B7780"/><path d="M6 20a14 10 0 0 1 28 0v22a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6z" fill="${c}"/><rect x="6" y="30" width="28" height="3" fill="#000" opacity=".15"/><rect x="10" y="18" width="3" height="26" rx="1.5" fill="${W_}" opacity=".3"/><rect x="4" y="47" width="32" height="4" rx="1.5" fill="#000" opacity=".25"/></g>`;}
function artSaco(x,y,c,gelo){return `<g><path d="M${x+4} ${y+6}l4-6h24l4 6v40a4 4 0 0 1-4 4H${x+8}a4 4 0 0 1-4-4z" fill="${gelo?'#DDEFF7':c}" stroke="${c}" stroke-width="1.5"/>${gelo?[[12,20],[22,16],[16,30],[26,28],[12,40],[24,40]].map(([a,b])=>`<rect x="${x+a}" y="${y+b}" width="7" height="7" rx="1.5" fill="#fff" stroke="#8CC5DD"/>`).join(''):`<rect x="${x+9}" y="${y+18}" width="22" height="14" rx="2" fill="#fff" opacity=".85"/><rect x="${x+12}" y="${y+22}" width="16" height="2.5" fill="${c}"/><rect x="${x+12}" y="${y+26.5}" width="10" height="2" fill="${c}" opacity=".6"/>`}<path d="M${x+8} ${y+6}h24" stroke="#000" stroke-opacity=".15"/></g>`;}
function artRegulador(x,y,c){return `<g><circle cx="${x+14}" cy="${y+18}" r="10" fill="${c}"/><circle cx="${x+14}" cy="${y+18}" r="6" fill="#fff" opacity=".85"/><path d="M${x+14} ${y+18}l3-3" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/><path d="M${x+24} ${y+22}c10 4 14 10 8 16s-18 4-18 10 10 6 14 4" fill="none" stroke="#E07B2A" stroke-width="3.2" stroke-linecap="round"/></g>`;}
function prodArt(p){const c=(CAT[p.cat]||CAT.Outros).h,nm=noAcc(p.nome).toLowerCase(),multi=/fardo|cx |caixa|\bcx\b/.test(nm);let g='';
  if(p.g==='can'||p.g==='bolt'){const cc=p.g==='bolt'?'#2E3A12':c;g=multi?[0,1,2].map(i=>artLata(14+i*18,26-(i===1?4:0),15,34,cc)).join('')+`<rect x="10" y="50" width="60" height="16" rx="3" fill="${c}" opacity=".3"/>`:artLata(29,16,22,46,cc);}
  else if(p.g==='bottle'){const vidro=/long neck|puro malte|600/.test(nm);g=multi?[0,1,2].map(i=>artGarrafa(15+i*17,14,14,50,c,vidro)).join('')+`<rect x="10" y="54" width="60" height="12" rx="3" fill="${c}" opacity=".3"/>`:artGarrafa(30,10,20,58,c,vidro);}
  else if(p.g==='drop')g=/galao|20l/.test(nm)?artGalao(20,14,c):multi?[0,1,2].map(i=>artGarrafa(17+i*16,20,13,42,c)).join(''):artGarrafa(31,14,18,52,c);
  else if(p.g==='flame')g=artBotijao(20,14,c,/p45|industrial/.test(nm));
  else if(p.g==='fire')g=artSaco(20,16,'#4A3A30',false);
  else if(p.g==='tool')g=artRegulador(20,16,c);
  else g=artSaco(20,16,c,/gelo/.test(nm));
  return `<svg viewBox="0 0 80 80" role="img" aria-label="${esc(p.nome)}"><ellipse cx="40" cy="70" rx="24" ry="3.5" fill="#000" opacity=".1"/>${g}</svg>`;}

/* ---------- mapa do entregador (ruas ilustrativas, rota e moto animada) ---------- */
function mapa(o){const d=S.dists[o.dist],id='rt'+o.id;
  const t0=o.eta?toMin(o.eta)-30:S.clock-5,p=Math.max(.12,Math.min(.9,(S.clock-t0)/30)),p0=Math.max(0,p-.1);
  const route='M34 118 H96 V70 H176 V40 H262';
  const blocks=[[8,8,70,50],[92,8,70,22],[176,8,70,22],[8,82,70,30],[110,82,56,30],[190,54,100,30],[190,96,100,40],[92,40,70,18]];
  return `<div class="map"><svg viewBox="0 0 300 150" role="img" aria-label="Mapa ilustrativo: entregador a caminho">
    <rect width="300" height="150" style="fill:var(--map-bg)"/>
    ${blocks.map(([x,y,w,h])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" style="fill:var(--map-block)"/>`).join('')}
    <rect x="200" y="100" width="36" height="30" rx="4" style="fill:var(--map-park)"/>
    <path d="${route}" fill="none" style="stroke:var(--map-road)" stroke-width="9" stroke-linejoin="round"/>
    <path id="${id}" d="${route}" fill="none" style="stroke:var(--primary)" stroke-width="4" stroke-linejoin="round" stroke-dasharray="5 4"/>
    <g transform="translate(34 118)"><circle r="9" style="fill:${d.cor}"/><text y="3.5" text-anchor="middle" font-size="8" font-weight="700" fill="#fff">${initials(d.nome)}</text></g>
    <g transform="translate(262 40)"><circle r="10" style="fill:var(--accent)"/><path d="M-4.5 1.5 0-3l4.5 4.5v4h-9z" fill="#fff"/></g>
    <g><circle r="8" style="fill:var(--surface);stroke:var(--primary)" stroke-width="2.5"/><path d="M-4 1.5h8M-2.5-1.5h4" style="stroke:var(--primary)" stroke-width="1.8" stroke-linecap="round"/>
      <animateMotion dur="2.4s" fill="freeze" calcMode="linear" keyPoints="${p0.toFixed(3)};${p.toFixed(3)}" keyTimes="0;1"><mpath href="#${id}"/></animateMotion></g>
  </svg></div>`;}

/* ---------- avisos: no app e (planejado) no WhatsApp ---------- */
function vNotifs(){const l=S.notifs[S.sess]||[],t=S.notTab||'app',app=l.filter(x=>x.canal!=='whatsapp'),wa=l.filter(x=>x.canal==='whatsapp').slice().reverse();
  const seg=`<div class="opts" style="margin:0"><button class="opt ${t==='app'?'on':''}" data-a="notTab" data-v="app">No app<small>${app.length} avisos</small></button><button class="opt ${t==='wa'?'on':''}" data-a="notTab" data-v="wa">WhatsApp ${PL}<small>${wa.length} mensagens</small></button></div>`;
  if(t==='app')return `<h2 class="h2">Avisos</h2>${seg}${app.length?app.map(x=>`<div class="notif ${x.lida?'':'new'}"><div class="ch ap">${svgI('bell')}</div><div>${esc(x.msg)}<div class="sub">${x.hora}</div></div></div>`).join(''):'<div class="empty">Nenhum aviso no app.</div>'}`;
  return `<h2 class="h2">Avisos</h2>${seg}<div class="wa"><div class="wah"><span class="waav">DP</span><div><b>DistribPontos</b><small>Conta comercial</small></div></div>
    <div class="wab">${wa.length?wa.map(x=>`<div class="wamsg">${esc(x.msg)}<span>${x.hora} <i>✓✓</i></span></div>`).join(''):'<p class="wae">As campanhas da loja chegam aqui, como uma conversa no WhatsApp.</p>'}</div></div>`;}

Object.assign(ACT,{notTab:v=>{S.notTab=v;renderApp()}});
