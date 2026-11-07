
/* ================= the wow layer ================= */
const LANES=[["matters","MISMO Matters"],["micdup","Mic'd Up"],["linkedin","LinkedIn"],["youtube","YouTube"],["mailchimp","Mailchimp"],["summit","Summits"],["orders","Orders"],["community","Community"],["setup","Setup"]];
function lanesHtml(ev){
  const t=T(), start=add(nextDow(t,1),-7), N=28; // from Monday of this week
  const s0 = t>=add(start,7) ? add(start,7) : start;
  const pos = d=>((diff(d,s0)+0.5)/N*100);
  const inR = e=>e.date>=s0 && e.date<add(s0,N);
  let wk='', bg='';
  for(let i=0;i<N;i+=7){ wk+='<span style="left:'+(i/N*100)+'%"><em>Week of </em>'+esc(fS(add(s0,i)))+'</span>'; bg+='<i class="wkend" style="left:'+((i+5)/N*100)+'%;width:'+(2/N*100)+'%"></i>'; }
  const tl = '<i class="tline" style="left:calc('+pos(t)+'% - 1px)"></i>';
  const mkIdx=[];
  const rows = LANES.map(([k,l])=>{
    const items = ev.filter(e=>inR(e) && (e.k===k || (k==="youtube" && e.k==="micdup" && !e.slot && /YouTube/.test(e.label))) && !(k==="micdup" && /YouTube/.test(e.label) && !e.slot));
    const byD={}; items.forEach(e=>{ (byD[e.date]=byD[e.date]||[]).push(e); });
    const mks = Object.keys(byD).map(d=>{ const g=byD[d]; const allDone=g.every(e=>e.done), late=g.some(isOver), slot=g.every(e=>e.slot), big=g.some(e=>e.big);
      mkIdx.push(g); return '<button type="button" class="mk k-'+k+(allDone?" done":"")+(late?" late":"")+(slot?" slot":"")+(big&&k!=="summit"?" big":"")+'" data-mi="'+(mkIdx.length-1)+'" style="left:'+pos(d)+'%" aria-label="'+esc(fD(d)+": "+g.map(e=>e.label).join("; "))+'">'+(g.length>1?g.length:(allDone?"✓":""))+'</button>'; }).join("");
    return '<div class="lane"><div class="ln"><i class="dot k-'+k+'"></i><span>'+esc(l)+'</span></div><div class="tr">'+bg+tl+mks+'</div></div>';
  }).join("");
  LANES._idx=mkIdx;
  return '<div class="lanes"><div class="lanehead"><div></div><div class="wk">'+wk+'</div></div>'+rows+'</div>';
}
function wireLanes(el){
  let tip=null;
  $$(".mk",el).forEach(m=>{
    const g=LANES._idx[+m.dataset.mi];
    const showTip=()=>{ if(!tip){ tip=document.createElement("div"); tip.className="mktip"; document.body.appendChild(tip); } tip.innerHTML='<small>'+esc(fD(g[0].date))+'</small>'+g.map(e=>esc(e.label)+(e.done?" ✓":"")).join("<br>"); const r=m.getBoundingClientRect(); tip.style.left=Math.min(window.innerWidth-290,Math.max(8,r.left-20))+"px"; tip.style.top=(r.bottom+8)+"px"; };
    const hide=()=>{ if(tip){ tip.remove(); tip=null; } };
    m.addEventListener("mouseenter",showTip); m.addEventListener("focus",showTip); m.addEventListener("mouseleave",hide); m.addEventListener("blur",hide);
    m.onclick=()=>{ hide(); g[0].go(); };
  });
}
const RING_COL={auto:"#3987e5",waiting:"rgba(255,255,255,.16)",in:"#74bfeb",review:"#e0a83c",changes:"#f08579",approved:"#4fc79b"};
function ringLegend(){ return '<div class="rlegend">'+[["waiting","Waiting"],["in","Content In"],["review","With Amy"],["changes","Changes"],["approved","Approved"],["auto","Automatic"]].map(([k,l])=>'<span><i style="background:'+RING_COL[k]+'"></i>'+l+'</span>').join("")+'</div>'; }
function waveHtml(live){ let h=''; for(let i=0;i<48;i++){ const v=0.25+0.75*Math.abs(Math.sin(i*0.55)*Math.cos(i*0.17)); h+='<i style="--h:'+(v*100).toFixed(0)+'%;--d:'+(-(i*0.09)%1.2).toFixed(2)+'s"></i>'; } return '<div class="wave'+(live?"":" idle")+'" aria-hidden="true">'+h+'</div>'; }
