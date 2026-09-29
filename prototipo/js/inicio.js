/* ================= v2: salvar o estado neste navegador ================= */
const SAVE_KEY='dp-prototipo-v2',BAIRROS_N=BAIRROS.length;
const TRANS={xl:null,fresh:null,editEnd:false,delConfirm:false,helpFor:null,confirm:null,pdvPend:null,pixPend:null,impLog:null,showTermos:false};
let INIT,resetArm=false,resetT,saveT;
const snap=()=>JSON.stringify(S,(k,v)=>k in TRANS||k==='theme'?undefined:v);
function restore(json){const o=JSON.parse(json);for(const k of Object.keys(S))if(!(k in o)&&!(k in TRANS)&&k!=='theme')delete S[k];Object.assign(S,o,TRANS);
  BAIRROS.length=BAIRROS_N;(S.bairrosX||[]).forEach(b=>BAIRROS.push(b));
  Object.values(S.dists).forEach(genHist);}
function save(){clearTimeout(saveT);saveT=setTimeout(()=>{try{localStorage.setItem(SAVE_KEY,snap());setSaved(true)}catch(e){setSaved(false)}},300);}
function setSaved(ok){const el=document.getElementById('savedtxt');if(el)el.textContent=ok?'Progresso salvo neste navegador':'Este navegador não permite salvar o progresso';}
['click','change','input'].forEach(ev=>document.addEventListener(ev,save));

seed();
initStock();
S.dists.d2.integ.mp=false;
INIT=snap();
try{const j=localStorage.getItem(SAVE_KEY);if(j){try{restore(j);setTimeout(()=>toast('Demonstração retomada de onde você parou'),300);}catch(e){restore(INIT);}}}catch(e){}
let _t='system';try{_t=localStorage.getItem('dp-theme')||'system'}catch(e){}
applyTheme(THEMES.includes(_t)?_t:'system');
render(true);

