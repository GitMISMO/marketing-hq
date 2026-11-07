
/* ================= Heroes: the big picture at the top of MISMO Matters, LinkedIn, YouTube and Summits ================= */
const LOGO_SVG = (cls)=>'<svg class="'+(cls||"")+'" viewBox="0 0 708 108" aria-hidden="true"><use href="#mismo-logo"/></svg>';
function heroImg(imgId){ const im=imgId&&S.images?S.images[imgId]:null; if(!im) return ""; return '<img data-himg="'+esc(im.id)+'" src="'+esc(imgSrc(im))+'" alt="">'; }
function wireHeroImgs(el){ $$("[data-himg]",el).forEach(img=>{ const im=S.images[img.dataset.himg]; if(!im) return; if(!img.getAttribute("src")) img.style.visibility="hidden"; imgEnsure(im).then(()=>{ const s=imgSrc(im); if(s){ img.src=s; img.style.visibility=""; } }); }); }

/* ---------- MISMO Matters: the edition on the press ---------- */
const PB_TONE={waiting:"w",in:"i",review:"r",changes:"c",approved:"a",auto:"u"};
function mattersHero(ed,on){
  const t=T(), sent=ed.done&&ed.done.publish, days=diff(ed.dates.publish,t);
  const nx=MILES.find(([k])=>!(ed.done&&ed.done[k]));
  const blocks=on.map((s,i)=>{ const st=s.meta.auto?"auto":(s.doc.status||"waiting"); const lines=2+((i*7)%3);
    return '<button type="button" class="pb t-'+PB_TONE[st]+(i===0?" lead":"")+'" data-rk="'+esc(s.k)+'" title="'+esc((s.doc.name||s.meta.name)+" · "+(s.meta.auto?"Fills itself":SSTAT[st][0]))+'"><span class="pbh">'+esc(s.doc.name||s.meta.name)+'</span>'+(s.doc.headline&&i===0?'<span class="pbt">'+esc(s.doc.headline)+'</span>':'')+'<span class="pbl">'+'<i></i>'.repeat(lines)+'</span>'+(st==="approved"?'<span class="pbk">✓</span>':'')+'</button>'; }).join("");
  return '<div class="hero">'+
    '<div class="hero-l"><span class="hlbl '+(sent?"t-ok":"t-press")+'"><i></i>'+(sent?"Sent":"On the Press")+' · '+esc(monthName(ed.month))+'</span>'+
      '<div class="hbig">'+(sent?"Delivered":(days>0?days+'<small>day'+(days===1?"":"s")+' to send</small>':(days===0?'Today<small>it goes out</small>':'Overdue<small>'+(-days)+' days past</small>')))+'</div>'+
      '<div class="hline">'+esc(fD(ed.dates.publish))+' · Higher Logic → the MISMO Matters group</div>'+
      (nx&&!sent?'<div class="hnext"><span>Next up</span><b>'+esc(nx[1])+'</b><em>'+esc(fS(ed.dates[nx[0]]))+' · '+esc(rel(ed.dates[nx[0]]))+'</em><small>'+esc(nx[2])+'</small></div>':'')+
    '</div>'+
    '<div class="paperwrap"><div class="paper" aria-label="The '+esc(monthName(ed.month))+' edition, section by section">'+
      '<div class="pmast">'+LOGO_SVG("pmlogo")+'<div><b><span>Matters</span></b><small>'+esc(monthName(ed.month))+' · '+esc(fS(ed.dates.publish))+'</small></div></div>'+
      '<div class="pgrid">'+blocks+'</div><div class="pscan" aria-hidden="true"></div></div></div>'+
  '</div>';
}

/* ---------- LinkedIn: the next post, as it will look in the feed ---------- */
function liPostText(p){
  if(p._ep){ const e=S.episodes[p._ep]||{}, k=kitOf(p._ep)||{}; return e.linkedinCopy || ((k.written||{}).li) || e.bvDescription || ""; }
  return p.copy || "";
}
function linkedinHero(all){
  const t=T();
  const ahead=all.filter(p=>pOpen(p)&&p.date).sort((a,b)=>a.date<b.date?-1:1);
  const p=ahead.find(x=>x.date>=t) || ahead[0] || null;
  const days=[0,1,2,3,4,5,6].map(i=>{ const d=add(t,i); const here=all.filter(x=>x.date===d);
    return '<div class="wkd'+(d===t?" now":"")+'"><span>'+esc(DOW[P(d).getDay()])+'</span><b>'+P(d).getDate()+'</b><div class="wkdots">'+here.map(x=>'<i class="'+(x.status==="done"?"ok":(x._ep?"live":(x.status==="staged"?"st":"")))+'" title="'+esc(x.title||"")+'"></i>').join("")+'</div></div>'; }).join("");
  let card;
  if(!p) card='<div class="lipost empty-post"><div class="lip-b">Nothing is lined up yet. Press <b>+ New Post</b>, or add a Mic\'d Up episode and its Monday LinkedIn Live appears here by itself.</div></div>';
  else{
    const e=p._ep?S.episodes[p._ep]:null, k=p._ep?kitOf(p._ep)||{}:null;
    const text=liPostText(p); const st=k?(k.liStatus||"draft"):null;
    const media = e ? '<div class="lip-m live">'+(k&&k.thumbPick?heroImg(k.thumbPick):'<div class="lip-ph">'+LOGO_SVG("phlogo")+'</div>')+'<span class="livebadge"><i></i>LIVE</span></div><div class="lip-ev"><small>'+esc(fD(p.date))+' · '+esc(e.linkedinTime||"1:00 PM ET")+' · LinkedIn Live</small><b>'+esc(e.liEventName||liEventName((k&&k.written||{}).title||e.title||"",e))+'</b></div>' : (p.link?'<div class="lip-link"><b>'+esc(p.title||"")+'</b><small>'+esc(String(p.link).replace(/^https?:\/\//,"").split("/")[0])+'</small></div>':'');
    card='<button type="button" class="lipost" data-hero-li="'+esc(p._ep||p.id||"")+'" data-hero-ep="'+(p._ep?1:0)+'">'+
      '<div class="lip-h"><span class="lip-av">'+LOGO_SVG("avlogo")+'</span><span><b>MISMO</b><small>'+esc(fD(p.date))+(p.postTime?' · '+esc(p.postTime):'')+' · '+esc(p.kind||"Post")+'</small></span>'+(st?chip(LI_STAT,st):chip(PSTAT,p.status||"idea"))+'</div>'+
      '<div class="lip-b">'+(text?esc(text):'<i>The copy isn\'t written yet. '+(p._ep?'It\'s written from Brian\'s LinkedIn post once the kit pulls it in.':'Open it to write the post.')+'</i>')+'</div>'+media+
      '<div class="lip-f"><span>👍 Like</span><span>💬 Comment</span><span>🔁 Repost</span><span>➤ Send</span></div></button>';
  }
  return '<div class="hero">'+
    '<div class="hero-l"><span class="hlbl t-li"><i></i>Up Next on LinkedIn</span>'+
      '<div class="hbig">'+(p?esc(fS(p.date))+'<small>'+esc(rel(p.date))+'</small>':'Open<small>nothing set</small>')+'</div>'+
      '<div class="hline">'+(p?esc(p.title||"Untitled"):"The MISMO company page")+'</div>'+
      '<div class="wk" aria-label="The next seven days">'+days+'</div>'+
      '<div class="wklegend"><span><i class="live"></i>Mic\'d Up Live</span><span><i></i>Post</span><span><i class="st"></i>Staged</span><span><i class="ok"></i>Posted</span></div>'+
    '</div>'+
    '<div class="lipwrap">'+card+'</div>'+
  '</div>';
}
function wireLinkedinHero(el){
  const b=$("[data-hero-li]",el); if(b) b.onclick=()=>{ const id=b.dataset.heroLi; if(!id) return; if(b.dataset.heroEp==="1") show("micdup"); else openPiece(id); };
  wireHeroImgs(el);
}

/* ---------- YouTube: the next upload, in the player ---------- */
function ytSteps(e){
  const k=kitOf(e.id)||{};
  return [["Video",!!k.video,"the final cut, from Brian's folder"],["Thumbnail",!!k.thumbPick,"the one on Brian's LinkedIn post"],["Transcript",!!k.txOk||!!e.captions,"names and spelling checked"],["Title & Description",!!(k.written&&k.written.title)||!!e.bvDescription,"in MISMO's voice"],["Uploaded",!!e.youtubeDone,"Friday afternoon"],["Website",!!e.websiteDone,"the Mic'd Up list"]];
}
function youtubeHero(queue){
  const t=T();
  const e = queue[0] || epsSorted().find(x=>x.youtubeDone) || null;
  if(!e) return '<div class="hero"><div class="hero-l"><span class="hlbl t-yt"><i></i>Up Next on YouTube</span><div class="hbig">Clear<small>nothing waiting</small></div></div></div>';
  const k=kitOf(e.id)||{}, steps=ytSteps(e), n=steps.filter(s=>s[1]).length, live=!!e.youtubeDone;
  const title=(k.written&&k.written.title)||("MISMO Mic'd Up "+epWord(e)+(e.title?": "+e.title:""));
  return '<div class="hero">'+
    '<div class="player'+(live?" live":"")+'"><div class="pl-v">'+(k.thumbPick?heroImg(k.thumbPick):'<div class="pl-ph">'+LOGO_SVG("phlogo")+'<span>Mic\'d Up</span></div>')+
      '<button type="button" class="pl-play" data-hero-yt="'+esc(e.id)+'" aria-label="Open the YouTube Kit"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></button>'+
      '<span class="pl-tag">'+(live?"On the Channel":(e.airDate&&e.airDate<=t?"Ready to Upload":"Coming "+esc(fS(e.airDate))))+'</span></div>'+
      '<div class="pl-bar" aria-label="'+n+' of '+steps.length+' steps done">'+steps.map(s=>'<i class="'+(s[1]?"on":"")+'" title="'+esc(s[0]+(s[1]?" ✓":""))+'"></i>').join("")+'</div>'+
      '<div class="pl-t"><b>'+esc(title)+'</b><small>@MISMOStandards · '+esc(epTag(e))+(e.guests?' · '+esc(e.guests):'')+'</small></div></div>'+
    '<div class="hero-l"><span class="hlbl t-yt"><i></i>'+(live?"Latest Upload":"Up Next on YouTube")+'</span>'+
      '<div class="hbig">'+n+'<small>of '+steps.length+' steps done</small></div>'+
      '<div class="ytsteps">'+steps.map(s=>'<div class="yts'+(s[1]?" on":"")+'"><span>'+(s[1]?"✓":"")+'</span><b>'+esc(s[0])+'</b><small>'+esc(s[2])+'</small></div>').join("")+'</div>'+
      '<button class="btn hbtn" type="button" data-hero-yt="'+esc(e.id)+'">Open the YouTube Kit →</button>'+
    '</div>'+
  '</div>';
}
function wireYoutubeHero(el){ $$("[data-hero-yt]",el).forEach(b=>b.onclick=()=>show("micdup")); wireHeroImgs(el); }

/* ---------- Summits: the countdown and the whole marketing run on one line ---------- */
let SUMMIT_TICK=null;
function summitClock(s){
  const start=P(s.start); start.setHours(8,0,0,0); const end=P(s.end); end.setHours(18,0,0,0);
  const now=new Date(); if(now>=start && now<=end) return {live:true};
  if(now>end) return {over:true};
  const ms=start-now; return {d:Math.floor(ms/864e5), h:Math.floor(ms/36e5)%24, m:Math.floor(ms/6e4)%60, s:Math.floor(ms/1e3)%60};
}
function clockHtml(c){
  if(c.live) return '<div class="clock live"><b>Live Now</b></div>';
  if(c.over) return '<div class="clock"><b>Wrapped</b></div>';
  const cell=(v,l)=>'<div class="cl"><b>'+String(v).padStart(2,"0")+'</b><span>'+l+'</span></div>';
  return '<div class="clock">'+cell(c.d,"Days")+cell(c.h,"Hours")+cell(c.m,"Minutes")+cell(c.s,"Seconds")+'</div>';
}
function summitHero(s,tasks){
  const t=T();
  const first=tasks.reduce((m,p)=>p.date&&p.date<m?p.date:m, add(s.start,-150)), last=tasks.reduce((m,p)=>p.date&&p.date>m?p.date:m, add(s.end,21));
  const span=Math.max(1,diff(last,first)), pos=d=>Math.min(100,Math.max(0,diff(d,first)/span*100));
  const marks=tasks.filter(p=>p.date).map(p=>{ const late=pOpen(p)&&p.date<t; return '<button type="button" class="tm ph-'+esc(p.phase||"before")+(p.status==="done"?" ok":"")+(late?" late":"")+'" style="left:'+pos(p.date).toFixed(2)+'%" data-tl="'+esc(p.id)+'" title="'+esc(fS(p.date)+" · "+p.title+(p.via?" · "+p.via:""))+'"></button>'; }).join("");
  const months=[]; { const m=P(first); m.setDate(1); m.setMonth(m.getMonth()+1); while(iso(m)<=last){ months.push('<span class="tlm" style="left:'+pos(iso(m)).toFixed(2)+'%">'+esc(MON[m.getMonth()])+'</span>'); m.setMonth(m.getMonth()+1); } }
  const done=tasks.filter(p=>p.status==="done").length;
  return '<div class="hero summit">'+
    '<div class="hero-l"><span class="hlbl t-sum"><i></i>'+esc(s.name)+'</span>'+
      '<div id="sm-clock">'+clockHtml(summitClock(s))+'</div>'+
      '<div class="hline">'+esc(fD(s.start))+' – '+esc(fD(s.end))+' · '+esc(s.where)+'</div>'+
    '</div>'+
    '<div class="sumstat"><div class="sring" style="--p:'+(tasks.length?Math.round(done/tasks.length*100):0)+'"><b>'+(tasks.length?Math.round(done/tasks.length*100):0)+'%</b><span>of the marketing done</span></div></div>'+
    '<div class="tl" aria-label="The marketing run, before, at and after the summit">'+
      '<div class="tl-track"><div class="tl-ev" style="left:'+pos(s.start).toFixed(2)+'%;width:'+Math.max(1.2,pos(s.end)-pos(s.start)).toFixed(2)+'%"><span>Summit</span></div>'+
        (t>=first&&t<=last?'<div class="tl-now" style="left:'+pos(t).toFixed(2)+'%"><span>Today</span></div>':'')+marks+'</div>'+
      '<div class="tl-mo">'+months.join("")+'</div>'+
      '<div class="tl-key"><span><i class="ph-before"></i>Before</span><span><i class="ph-at"></i>At the summit</span><span><i class="ph-after"></i>After</span><span><i class="ok"></i>Done</span><span><i class="late"></i>Past due</span></div>'+
    '</div>'+
  '</div>';
}
function wireSummitHero(el,s){
  $$("[data-tl]",el).forEach(b=>b.onclick=()=>openPiece(b.dataset.tl));
  if(SUMMIT_TICK) clearInterval(SUMMIT_TICK);
  if(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  SUMMIT_TICK=setInterval(()=>{ const c=$("#sm-clock"); if(!c || TAB!=="summits"){ clearInterval(SUMMIT_TICK); SUMMIT_TICK=null; return; } c.innerHTML=clockHtml(summitClock(s)); },1000);
}

/* ---------- Mailchimp: the next send, in the inbox ---------- */
function mailchimpHero(list){
  const t=T();
  const ahead=list.filter(p=>pOpen(p)&&p.date).sort((a,b)=>a.date<b.date?-1:1);
  const p=ahead.find(x=>x.date>=t)||ahead[0]||null;
  const sent=list.filter(x=>x.status==="done").sort((a,b)=>(a.date||"")<(b.date||"")?1:-1);
  const last=sent.find(x=>+x.sent)||sent[0]||null;
  const days=[...Array(14)].map((_,i)=>{ const d=add(t,i), here=list.filter(x=>x.date===d);
    return '<div class="wkd'+(d===t?" now":"")+'"><span>'+esc(DOW[P(d).getDay()].slice(0,2))+'</span><b>'+P(d).getDate()+'</b><div class="wkdots">'+here.map(x=>'<i class="'+(x.status==="done"?"ok":(x.status==="staged"||x.status==="ready"?"st":""))+'" title="'+esc(x.title||"")+'"></i>').join("")+'</div></div>'; }).join("");
  const rows=[].concat(ahead.slice(0,3), sent.slice(0,Math.max(0,3-Math.min(3,ahead.length)))).slice(0,3);
  const row=(x,i)=>'<div role="button" tabindex="0" class="mrow'+(x===p?" next":"")+'" data-hero-mc="'+esc(x.id)+'"><span class="mfrom"><b>MISMO</b>'+(x.audience?'<em>'+esc(x.audience)+'</em>':'')+'</span>'+
    '<span class="msub"><b>'+esc(x.title||"Untitled campaign")+'</b><small>'+esc(mdPlain(x.copy||(x.status==="done"?(+x.sent?"Sent to "+(+x.sent).toLocaleString()+" people":"Sent"):"Open it to write the email.")).replace(/\s+/g," ").slice(0,90))+'</small></span>'+
    '<span class="mwhen">'+(safeHref(x.reviewLink)&&x.status!=="done"?'<a class="mrev" href="'+esc(safeHref(x.reviewLink))+'" target="_blank" rel="noopener">Review ↗</a>':'')+(x.status==="done"?"Sent "+esc(fS(x.date)):x.status==="canceled"?'<i class="msched cxd">Canceled</i>'+esc(fS(x.date)):x===p?'<i class="msched">Scheduled</i>'+esc(fS(x.date))+(x.sendTime?' · '+esc(x.sendTime):''):esc(fS(x.date)))+'</span></div>';
  const pc=(n,d)=>d?Math.round(n/d*100)+"%":"—";
  const stats=last&&+last.sent?'<div class="mstats"><div><b>'+(+last.sent).toLocaleString()+'</b><small>sent to</small></div><div><b>'+pc(+last.opens||0,+last.sent)+'</b><small>opened</small></div><div><b>'+pc(+last.clicks||0,+last.sent)+'</b><small>clicked</small></div><div><b>'+(+last.unsubs||0)+'</b><small>unsubscribed</small></div></div>':'';
  return '<div class="hero">'+
    '<div class="hero-l"><span class="hlbl t-mc"><i></i>'+(p?"Up Next in Mailchimp":"Mailchimp")+'</span>'+
      '<div class="hbig">'+(p?esc(fS(p.date))+'<small>'+esc(rel(p.date))+(p.sendTime?' · '+esc(p.sendTime):'')+'</small>':(last?"Sent<small>"+esc(fS(last.date))+"</small>":"Open<small>nothing set</small>"))+'</div>'+
      '<div class="hline">'+(p?esc(p.title||"Untitled campaign")+(p.audience?' · '+esc(p.audience):''):last?"Last send: "+esc(last.title||""):"Event and summit email, until Higher Logic marketing takes over")+'</div>'+
      '<div class="wk wk14" aria-label="The next two weeks">'+days+'</div>'+
      '<div class="wklegend"><span><i></i>Campaign</span><span><i class="st"></i>Ready</span><span><i class="ok"></i>Sent</span></div>'+
    '</div>'+
    '<div class="mbox"><div class="mbox-h"><span class="mdots"><i></i><i></i><i></i></span><b>Inbox</b><small>'+(ahead.length?ahead.length+" coming up":"all caught up")+'</small></div>'+
      (rows.length?rows.map(row).join(""):'<div class="mempty">No campaigns yet. Press <b>+ New Campaign</b> to plan one.</div>')+
      (stats?'<div class="mlast"><span>'+esc("Last send · "+(last.title||""))+'</span>'+stats+'</div>':'')+
    '</div>'+
  '</div>';
}
function wireMailchimpHero(el){ $$(".mrev",el).forEach(a=>a.addEventListener("click",e=>e.stopPropagation())); $$("[data-hero-mc]",el).forEach(b=>{ b.onclick=()=>openPiece(b.dataset.heroMc); b.onkeydown=e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); openPiece(b.dataset.heroMc); } }; }); }
