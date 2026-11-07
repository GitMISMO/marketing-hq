/* ================= Home: the Media Map =================
   The first page. One look shows how everything connects: what comes in, what the team makes, where it goes out,
   who it reaches and how it did. Every box is live, says what it needs next and opens its page. Lines show how work
   flows from one to the next; hover a box (or tap it on a phone) to light up its connections. Below the map,
   "Follow the Story" tracks the next Mic'd Up episode and this month's MISMO Matters from start to finish. */
const HM = {focus:null, view:"studio", timer:null};
try{ const v=localStorage.getItem("mm.home.view"); if(v==="map") HM.view="map"; }catch(e){}
const dBetween = (a,b)=>{ const x=P(a), y=P(b); return x&&y ? Math.round((y-x)/864e5) : null; };
function hmFirst(){ return String(window.__hqWho||"").trim().split(/\s+/)[0]||""; }
function hmHello(){ const h=new Date().getHours(); return h<12?"Good morning":h<17?"Good afternoon":"Good evening"; }
function hmNextEp(){ return vals("episodes").filter(e=>e.airDate && e.airDate>=T()).sort((a,b)=>a.airDate<b.airDate?-1:1)[0]||null; }
function hmNextSummit(){ return SUMMITS.filter(s=>s.end>=T()).sort((a,b)=>a.start<b.start?-1:1)[0]||null; }
function hmPl(n,w){ return n+" "+(n===1?w:/y$/.test(w)?w.slice(0,-1)+"ies":w+"s"); }

/* each box: id, column, page, title, the live line, a small "next" line, and a state (ok / soon / late / quiet) */
function hmNodes(){
  const t=T(), wk=add(t,7), ev=allEvents(), N=[];
  const late=k=>ev.filter(e=>e.k===k && isOver(e)).length;
  /* comes in */
  const rq=typeof requests==="function"?requests():[], rqNew=rq.filter(r=>r.status==="new").length, rqOpen=rq.filter(r=>!["done","declined"].includes(r.status)).length;
  N.push({id:"requests", col:0, go:"requests", k:"request", t:"Requests", big:rqNew||rqOpen, unit:rqNew?"new":"open", next:rqNew?"Review the new "+(rqNew===1?"one":"ones"):"Staff and facilitators ask here", st:rqNew?"soon":"ok"});
  const news=newsAll(), share=news.filter(n=>!n.linkedinDone && n.date>=add(t,-30)).length;
  N.push({id:"news", col:0, go:"news", k:"news", t:"In the News", big:news.filter(n=>n.date>=add(t,-30)).length, unit:"this month", next:share?hmPl(share,"story")+" to share on LinkedIn":"Logged once, used everywhere", st:share?"soon":"ok"});
  const ne=hmNextEp(), g=ne&&typeof guestFor==="function"?guestFor(ne):null;
  const guests=vals("episodes").filter(e=>e.airDate && e.airDate>=t && e.airDate<=add(t,28));
  const gIn=guests.filter(e=>typeof guestFor==="function" && guestFor(e)).length;
  N.push({id:"guests", col:0, go:"micdup", k:"micdup", t:"Guests & Recordings", big:gIn+"/"+guests.length, unit:"guest forms in", next:ne?(ne.recordDate?"Next one recorded":"Next: record "+(ne.guests||ne.company||"the guest")):"No episode booked", st:ne && !ne.recordDate && dBetween(t,ne.airDate)<=7?"late":"ok"});
  const imgs=vals("images").filter(i=>!i.archived).length;
  N.push({id:"images", col:0, go:"images", k:"other", t:"Image Library", big:imgs, unit:"pictures", next:"Shared by every channel", st:"quiet"});
  /* we make */
  const ed=curEdition();
  if(ed && ed.dates){ const secs=edSections(ed).filter(s=>s.on), ok=secs.filter(s=>s.doc.status==="approved").length, d=dBetween(t,ed.dates.publish);
    const rv=secs.filter(s=>s.doc.status==="review").length;
    N.push({id:"matters", col:1, go:"matters", k:"matters", t:"MISMO Matters", big:d==null?"—":d, unit:d===1?"day to send":"days to send", next:monthName(ed.month)+": "+ok+"/"+secs.length+" sections approved"+(rv?", "+rv+" with Amy":""), st:late("matters")?"late":d!=null&&d<=7&&ok<secs.length?"soon":"ok", pct:secs.length?ok/secs.length:0}); }
  else N.push({id:"matters", col:1, go:"matters", k:"matters", t:"MISMO Matters", big:"—", unit:"", next:"Start the next edition", st:"soon"});
  if(ne){ const k=typeof kitOf==="function"?kitOf(ne.id)||{}:{}, d=dBetween(t,ne.airDate);
    const step=!ne.recordDate?"Waiting on the recording":!k.video?"Waiting on the files":!k.written?"Writing the copy":k.liStatus==="review"?"With Amy":k.liStatus==="approved"?"Ready to post":"Ready for the kit";
    N.push({id:"micdup", col:1, go:"micdup", k:"micdup", t:"MISMO Mic'd Up", big:d===0?"Today":d, unit:d===0?"":d===1?"day to "+epTag(ne):"days to "+epTag(ne), next:step, st:late("micdup")?"late":kitsWithAmy().length?"soon":"ok"}); }
  else N.push({id:"micdup", col:1, go:"micdup", k:"micdup", t:"MISMO Mic'd Up", big:"—", unit:"", next:"Book the next episode", st:"late"});
  const sm=hmNextSummit(); if(sm){ const tasks=vals("pieces").filter(p=>p.channel==="summit" && p.summit===sm.id), done=tasks.filter(p=>p.status==="done").length, d=dBetween(t,sm.start);
    N.push({id:"summits", col:1, go:"summits", k:"summit", t:"Summits", big:d, unit:"days to "+sm.name.replace(/^\d{4}\s+/,""), next:tasks.length?done+"/"+tasks.length+" marketing tasks done":"Load the standard summit plan", st:late("summit")?"late":tasks.length?"ok":"soon", pct:tasks.length?done/tasks.length:0}); }
  const br=vals("branding").filter(b=>!b.archived), old=br.filter(b=>b.status==="old").length, ords=vals("orders").filter(o=>!o.archived && typeof orRisk==="function" && orRisk(o)).length;
  N.push({id:"brand", col:1, go:"branding", k:"other", t:"Rebranding & Orders", big:old, unit:"still old branding", next:ords?hmPl(ords,"order")+" at risk":br.length?(br.length-old)+" of "+br.length+" updated":"Track what still needs the new look", st:ords?"late":old?"soon":"ok", pct:br.length?(br.length-old)/br.length:0});
  /* goes out */
  const li=ev.filter(e=>e.k==="linkedin" && !e.done && e.date>=t && e.date<=wk).length;
  N.push({id:"linkedin", col:2, go:"linkedin", k:"linkedin", t:"LinkedIn", big:li, unit:"this week", next:late("linkedin")?hmPl(late("linkedin"),"post")+" past due":"Posts and Monday LinkedIn Live", st:late("linkedin")?"late":"ok"});
  const yt=vals("episodes").filter(e=>owes(e) && e.airDate && e.airDate<=t && !e.youtubeDone).length;
  N.push({id:"youtube", col:2, go:"youtube", k:"youtube", t:"YouTube", big:yt, unit:"to upload", next:yt?"Open the YouTube Kit":"All caught up", st:yt?"late":"ok"});
  const mc=vals("pieces").filter(p=>p.channel==="mailchimp" && pOpen(p) && p.date && p.date>=t && p.date<=add(t,14)).length;
  N.push({id:"mailchimp", col:2, go:"mailchimp", k:"mailchimp", t:"Mailchimp", big:mc, unit:"sends, 2 weeks", next:"Event and summit emails", st:late("mailchimp")?"late":"quiet"});
  N.push({id:"qr", col:2, go:"qr", k:"other", t:"QR Codes", big:"", unit:"", next:"Print, signs and slides", st:"quiet"});
  /* reaches + measures */
  const ppl=new Set(); try{ vals("audience").forEach(d=>(d.rows||[]).forEach(r=>{ const e=String(r.email||r.Email||r.e||"").toLowerCase(); if(e) ppl.add(e); })); }catch(e){}
  N.push({id:"people", col:3, go:"people", k:"other", t:"Subscribers & Lists", big:ppl.size?ppl.size.toLocaleString():"", unit:ppl.size?"people":"", next:"Who gets MISMO Matters and what they download", st:"quiet"});
  N.push({id:"results", col:3, go:"results", k:"other", t:"Results", big:"", unit:"", next:"Opens, views and reach, side by side", st:"quiet"});
  return N;
}
/* how work flows between the boxes */
const HM_LINKS = [
  ["requests","matters"],["requests","linkedin"],["requests","mailchimp"],["requests","brand"],
  ["news","matters"],["news","linkedin"],
  ["guests","micdup"],["images","matters"],["images","linkedin"],
  ["micdup","youtube"],["micdup","linkedin"],["micdup","matters"],
  ["summits","linkedin"],["summits","mailchimp"],["brand","qr"],
  ["matters","people"],["mailchimp","people"],
  ["matters","results"],["linkedin","results"],["youtube","results"],["mailchimp","results"]
];
const HM_COLS = ["Comes In","We Make","Goes Out","Reaches & Results"];

/* what needs the person signed in (or the team), from the schedule */
function hmNeeds(){
  const me=hmFirst(), ev=allEvents(), t=T();
  const mine=e=>!me || String(e.who||"").split(/\s*(?:,|and)\s*/).some(w=>w.toLowerCase()===me.toLowerCase());
  const open=ev.filter(e=>!e.done && !e.slot && !e.big && e.date<=add(t,7)).sort((a,b)=>a.date<b.date?-1:1);
  const list=open.filter(mine);
  const amy=kitsWithAmy().map(k=>({date:t, k:"micdup", label:"Approve the Mic'd Up "+epTag(S.episodes[k.id])+" LinkedIn Live wording", who:"Amy", go:()=>{ go("micdup"); }}));
  /* newsletter sections and posts waiting on her OK show in the same list (Nov 7, 2026: no separate approvals card) */
  const ed=curEdition();
  if(ed) edSections(ed).filter(s=>s.on && s.doc.status==="review").forEach(s=>amy.push({date:t, k:"matters", label:"Approve "+(s.doc.name||s.meta.name)+" for the "+monthName(ed.month).replace(/ \d{4}$/,"")+" MISMO Matters", who:"Amy", go:()=>go("matters")}));
  vals("pieces").filter(p=>p.status==="review").forEach(p=>amy.push({date:t, k:p.channel||"linkedin", label:"Approve "+(p.title||"a post"), who:"Amy", go:()=>go(p.channel||"linkedin")}));
  return (me.toLowerCase()==="amy"?amy:[]).concat(list.length?list:(me?[]:open)).slice(0,6);
}

/* the story of one piece of work, from start to finish */
function hmEpJourney(e){
  const k=(typeof kitOf==="function"&&kitOf(e.id))||{}, g=typeof guestFor==="function"?guestFor(e):null;
  return [
    ["Guest Form", !!g], ["Recorded", !!e.recordDate], ["Files In", !!k.video], ["Copy Written", !!k.written],
    ["Amy Approved", k.liStatus==="approved"], ["Live Friday", e.airDate<=T()], ...(MU_PAUSED.spotify?[]:[["On Spotify", !!e.spotifyDone]]), ["On YouTube", !!e.youtubeDone],
    ["MISMO LinkedIn Live", liClosed(e)], ["In MISMO Matters", !!(e.youtubeDone && curEdition() && e.airDate<=(curEdition().dates||{}).publish)]
  ];
}
function hmEdJourney(ed){ return MILES.map(([k,l])=>[l, !!(ed.done&&ed.done[k])]); }
function hmTrack(title, sub, steps, goFn, k){
  const nx=steps.findIndex(s=>!s[1]), done=steps.filter(s=>s[1]).length;
  return '<button type="button" class="hm-story k-'+k+'" data-hgo="'+goFn+'"><div class="hs-h"><b>'+esc(title)+'</b><span>'+esc(sub)+'</span><em>'+done+'/'+steps.length+'</em></div>'+
    '<ol class="hs-steps">'+steps.map((s,i)=>'<li class="'+(s[1]?"on":i===nx?"nx":"")+'"><i></i><span>'+esc(s[0])+'</span></li>').join("")+'</ol>'+
    '<div class="hs-next">'+(nx<0?"Done, start to finish.":"Next: <b>"+esc(steps[nx][0])+"</b>")+'</div></button>';
}

function renderHome(){
  const el=$("#page-home"); if(!el) return;
  const N=hmNodes(), me=hmFirst(), needs=hmNeeds(), t=T();
  const ne=hmNextEp(), ed=curEdition(), late=allEvents().filter(isOver).length;
  const say=[];
  if(ne) say.push("Mic'd Up <em>"+esc(epTag(ne))+"</em>"+(ne.guests?" with "+esc(ne.guests):"")+" goes live "+esc(dBetween(t,ne.airDate)===0?"today":fD(ne.airDate)));
  if(ed && ed.dates) say.push("the <em>"+esc(MONL[+ed.month.slice(5)-1])+"</em> MISMO Matters goes out "+esc(fD(ed.dates.publish)));
  const sm=hmNextSummit(); if(sm) say.push("the "+esc(sm.name)+" is <em>"+dBetween(t,sm.start)+" days</em> away");
  const node=n=>'<button type="button" class="hm-node k-'+n.k+' st-'+n.st+'" data-node="'+n.id+'" data-hgo="'+n.go+'">'+
    '<span class="hn-dot" aria-hidden="true"></span><span class="hn-t">'+esc(n.t)+'</span>'+
    (n.big!==""&&n.big!=null?'<span class="hn-big">'+esc(String(n.big))+'<small>'+esc(n.unit||"")+'</small></span>':'')+
    (n.pct!=null?'<span class="hn-bar"><i style="width:'+Math.round(n.pct*100)+'%"></i></span>':'')+
    '<span class="hn-next">'+esc(n.next||"")+'</span></button>';
  const stories=[];
  if(ne) stories.push(hmTrack("MISMO Mic'd Up "+epTag(ne), (ne.guests||ne.company||"Guest to come")+" · "+fD(ne.airDate), hmEpJourney(ne), "ep:"+ne.id, "micdup"));
  if(ed && ed.dates) stories.push(hmTrack(monthName(ed.month)+" MISMO Matters", "Goes out "+fD(ed.dates.publish), hmEdJourney(ed), "matters", "matters"));
  el.innerHTML=
    '<div class="hm-hero"><div class="hm-hi"><div class="hm-eyebrow">'+esc(fD(t))+'</div><h1>'+esc(hmHello())+(me?", "+esc(me):"")+'</h1>'+
      '<p>'+(say.length?say.join("; ").replace(/^./,c=>c.toUpperCase())+".":"Here's everything MISMO is putting out, on one page.")+(late?' <em class="hm-late">'+hmPl(late,"item")+' past due.</em>':'')+'</p></div>'+
      '<div class="hm-needs"><div class="hm-nh">'+(me?"On Your Plate":"Coming Up")+' <span>next 7 days</span></div>'+
        (needs.length?needs.map((e,i)=>'<button type="button" class="hm-need k-'+esc(e.k)+(isOver(e)?' over':'')+'" data-need="'+i+'"><span>'+esc(isOver(e)?"Past due":dBetween(t,e.date)===0?"Today":fS(e.date))+'</span><b>'+esc(e.label)+'</b></button>').join("")
          :'<div class="hm-clear">Nothing due for you this week.</div>')+
        '<button type="button" class="hm-all" data-hgo="overview">See the Full Schedule →</button></div></div>'+
    '<div class="hm-viewbar"><h2 class="hm-h2">'+(HM.view==="map"?"How It All Connects":"The Studio")+'</h2><div class="hm-seg" role="tablist" aria-label="Home view">'+
      '<button type="button" role="tab" data-hview="studio" aria-selected="'+(HM.view!=="map")+'">Studio</button><button type="button" role="tab" data-hview="map" aria-selected="'+(HM.view==="map")+'">How It All Connects</button></div></div>'+
    (HM.view==="map" ? '<div class="card hm-mapcard"><div class="ch"><span class="note">Point at a box to see where its work goes. Click to open it.</span></div>'+
      '<div class="hm-map" id="hm-map"><svg class="hm-lines" id="hm-lines" aria-hidden="true"></svg>'+
        HM_COLS.map((c,i)=>'<div class="hm-col"><div class="hm-ch">'+esc(c)+'</div>'+N.filter(n=>n.col===i).map(node).join("")+'</div>').join("")+
      '</div>'+
      '<div class="hm-legend"><span class="st-ok"><i></i>On track</span><span class="st-soon"><i></i>Needs a look</span><span class="st-late"><i></i>Late or blocked</span></div></div>'+
      (stories.length?'<div class="hm-stories"><h2 class="hm-h2">Follow the Story</h2><div class="hm-sgrid">'+stories.join("")+'</div></div>':'')
    : hmStudio());
  $$("[data-hview]",el).forEach(b=>b.addEventListener("click",()=>{ HM.view=b.dataset.hview; try{ localStorage.setItem("mm.home.view",HM.view); }catch(e){} renderHome(); }));
  $$("[data-hgo]",el).forEach(b=>b.addEventListener("click",()=>{ const v=b.dataset.hgo; if(v.startsWith("ep:")){ go("micdup"); openEpisode(v.slice(3)); } else go(v); }));
  $$("[data-need]",el).forEach(b=>b.addEventListener("click",()=>{ const e=needs[+b.dataset.need]; if(e && e.go) e.go(); }));
  const map=$("#hm-map",el);
  $$(".hm-node",el).forEach(b=>{
    b.addEventListener("mouseenter",()=>hmFocus(b.dataset.node));
    b.addEventListener("focus",()=>hmFocus(b.dataset.node));
    b.addEventListener("mouseleave",()=>hmFocus(null));
    b.addEventListener("blur",()=>hmFocus(null));
  });
  if(HM.view==="map") hmDraw(); else { hmStudioLive(el); hmLoadQr(); }
}
function hmFocus(id){
  HM.focus=id; const map=$("#hm-map"); if(!map) return;
  const linked=new Set(id?[id]:[]); if(id) HM_LINKS.forEach(([a,b])=>{ if(a===id) linked.add(b); if(b===id) linked.add(a); });
  map.classList.toggle("focusing", !!id);
  $$(".hm-node",map).forEach(n=>n.classList.toggle("lit", linked.has(n.dataset.node)));
  $$("#hm-lines path",map).forEach(p=>p.classList.toggle("lit", !!id && (p.dataset.a===id || p.dataset.b===id)));
}
/* draw the connecting lines between box edges; redrawn when the page changes size */
function hmDraw(){
  const map=$("#hm-map"), svg=$("#hm-lines"); if(!map||!svg) return;
  const R=map.getBoundingClientRect(); svg.setAttribute("width",R.width); svg.setAttribute("height",R.height); svg.setAttribute("viewBox","0 0 "+R.width+" "+R.height);
  const box=id=>{ const n=map.querySelector('.hm-node[data-node="'+id+'"]'); if(!n) return null; const r=n.getBoundingClientRect(); return {l:r.left-R.left, r:r.right-R.left, y:r.top-R.top+r.height/2, t:r.top-R.top, b:r.bottom-R.top, cx:r.left-R.left+r.width/2}; };
  const live=new Set(hmNodes().filter(n=>n.st==="soon"||n.st==="late").map(n=>n.id));
  let h="";
  HM_LINKS.forEach(([a,b])=>{ const A=box(a), B=box(b); if(!A||!B) return; let d;
    if(Math.abs(A.cx-B.cx)<20){ const y1=A.b, y2=B.t; d="M"+A.cx+","+y1+" C"+A.cx+","+(y1+18)+" "+B.cx+","+(y2-18)+" "+B.cx+","+y2; }
    else { const x1=A.r, x2=B.l, mx=(x1+x2)/2; d="M"+x1+","+A.y+" C"+mx+","+A.y+" "+mx+","+B.y+" "+x2+","+B.y; }
    h+='<path d="'+d+'" data-a="'+a+'" data-b="'+b+'" class="'+(live.has(a)?"flow":"")+'"/>'; });
  svg.innerHTML=h; if(HM.focus) hmFocus(HM.focus);
}
window.addEventListener("resize",()=>{ if(TAB==="home" && HM.view==="map") hmDraw(); });

/* ================= The Studio =================
   The default Home view: a control room of live monitors, one per part of MISMO's media, each showing
   its real state in a picture you can read at a glance. Click any monitor to go there. */
function hmCount(n){ return '<b class="hs-num" data-count="'+(+n||0)+'">'+(+n||0).toLocaleString()+'</b>'; }
function hmStudio(){
  const t=T(), ev=allEvents();
  /* this week, as a strip of days */
  const week=[...Array(7)].map((_,i)=>{ const d=add(t,i), es=ev.filter(e=>e.date===d && !e.slot).sort((a,b)=>(a.done?1:0)-(b.done?1:0));
    return '<button type="button" class="sw-day'+(i===0?" now":"")+'" data-hgo="overview"><span>'+(i===0?"Today":esc(DOW[P(d).getDay()]))+'</span><b>'+P(d).getDate()+'</b>'+
      '<div class="sw-pills">'+es.slice(0,3).map(e=>'<i class="k-'+esc(e.k)+(e.done?" done":"")+'" title="'+esc(e.label)+'"></i>').join("")+(es.length>3?'<em>+'+(es.length-3)+'</em>':'')+'</div>'+
      '<small>'+(es.length?esc(es[0].label.replace(/^[^·]+·\s*/,"")):"Clear")+'</small></button>'; }).join("");

  /* Mic'd Up: on air */
  const ne=hmNextEp(); let mic;
  if(ne){ const k=kitOf(ne.id)||{}, g=guestFor(ne), d=dBetween(t,ne.airDate), live=d===0;
    const steps=[["Guest Form",!!g],["Recorded",!!ne.recordDate],["Files In",!!k.video],["Copy Written",!!k.written],["Amy Approved",k.liStatus==="approved"]];
    mic='<button type="button" class="st-tile st-mic k-micdup" data-hgo="ep:'+esc(ne.id)+'">'+
      '<div class="st-top"><span class="st-onair'+(live?" lit":"")+'">'+(live?"On Air":"Next on Air")+'</span><span class="st-lab">MISMO Mic\'d Up</span></div>'+
      '<div class="wave" aria-hidden="true">'+[...Array(64)].map((_,i)=>'<i style="--d:'+((i*37)%17)/10+'s;--h:'+(28+((i*53)%61))+'%"></i>').join("")+'</div>'+
      '<div class="mic-row"><div class="mic-ep"><b>'+esc(epTag(ne))+(ne.title?": "+esc(ne.title):"")+'</b><span>'+esc([ne.guests,ne.company].filter(Boolean).join(" · ")||"Guest to come")+'</span></div>'+
      '<div class="mic-cd" id="hm-cd" data-at="'+esc(ne.airDate)+'T08:30:00"></div></div>'+
      '<div class="mic-steps">'+steps.map(s=>'<span class="'+(s[1]?"on":"")+'">'+(s[1]?"✓ ":"")+esc(s[0])+'</span>').join("")+'</div>'+
    '</button>'; }
  else mic='<button type="button" class="st-tile st-mic k-micdup" data-hgo="micdup"><div class="st-top"><span class="st-onair">Off Air</span><span class="st-lab">MISMO Mic\'d Up</span></div><div class="wave quiet" aria-hidden="true">'+[...Array(44)].map(()=>'<i></i>').join("")+'</div><div class="mic-ep"><b>No episode booked</b><span>Add the next Friday</span></div></button>';

  /* MISMO Matters: the paper */
  const ed=curEdition(); let mat='';
  if(ed && ed.dates){ const secs=edSections(ed).filter(s=>s.on), ok=secs.filter(s=>s.doc.status==="approved").length, d=dBetween(t,ed.dates.publish), nm=MILES.find(([k])=>ed.dates[k] && !(ed.done&&ed.done[k]));
    mat='<button type="button" class="st-tile st-mat k-matters" data-hgo="matters"><div class="st-top"><span class="st-lab">MISMO Matters</span><span class="st-pill">'+esc(MONL[+ed.month.slice(5)-1])+'</span></div>'+
      '<div class="mini-paper"><div class="mp-mast">'+LOGO_SVG("mp-logo")+'<span>MISMO Matters</span></div>'+
        secs.map(s=>{ const st=s.meta.auto?"auto":(s.doc.status||"waiting"); return '<i class="mp-b t-'+(PB_TONE[st]||"w")+'" title="'+esc((s.doc.name||s.meta.name)+" · "+(s.meta.auto?"Fills itself":SSTAT[st]?SSTAT[st][0]:st))+'"></i>'; }).join("")+'</div>'+
      '<div class="st-big">'+(d<0?"Sent":d)+'<small>'+(d<0?"":d===1?"day to send":"days to send")+'</small></div>'+
      '<div class="st-meter"><i style="width:'+(secs.length?Math.round(ok/secs.length*100):0)+'%"></i></div><div class="st-sub">'+ok+' of '+secs.length+' sections approved · goes out '+esc(fS(ed.dates.publish))+'</div>'+
      /* every section and where it stands, in the order it runs */
      '<div class="mp-list">'+secs.map(s=>{ const st=s.meta.auto?"auto":(s.doc.status||"waiting"); const lab={auto:"Fills itself",waiting:"Waiting",in:"Content in",review:"With Amy",changes:"Changes",approved:"Approved"}[st]||st;
        return '<span class="mpl'+(st==="approved"?" ok":"")+'"><i class="t-'+(PB_TONE[st]||"w")+'"></i><b>'+esc(s.doc.name||s.meta.name)+'</b><em>'+esc(lab)+'</em></span>'; }).join("")+'</div>'+(nm?'<div class="st-next">Next: <b>'+esc(nm[1])+'</b> · '+esc(fS(ed.dates[nm[0]]))+'</div>':'')+'</button>'; }

  /* Summits: the ring */
  const sm=hmNextSummit(); let sum='';
  if(sm){ const tasks=vals("pieces").filter(p=>p.channel==="summit" && p.summit===sm.id), done=tasks.filter(p=>p.status==="done").length, d=dBetween(t,sm.start), pc=tasks.length?done/tasks.length:0, C=2*Math.PI*42;
    sum='<button type="button" class="st-tile st-sum k-summit" data-hgo="summits"><div class="st-top"><span class="st-lab">Summits</span></div>'+
      '<div class="ring"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="42"/><circle class="rv" cx="50" cy="50" r="42" stroke-dasharray="'+(C*pc).toFixed(1)+' '+C.toFixed(1)+'"/></svg><div><b>'+d+'</b><small>days</small></div></div>'+
      '<div class="st-sub"><b>'+esc(sm.name)+'</b><br>'+esc((sm.where||"").split(" · ")[0])+'<br>'+(tasks.length?done+' of '+tasks.length+' marketing tasks done':'Plan not loaded yet')+'</div></button>'; }

  /* YouTube: the player */
  const yq=vals("episodes").filter(e=>owes(e) && e.airDate && e.airDate<=t && !e.youtubeDone);
  const ylast=epsSorted().find(e=>e.youtubeDone);
  const yt='<button type="button" class="st-tile st-yt k-youtube" data-hgo="youtube"><div class="st-top"><span class="st-lab">YouTube</span>'+(yq.length?'<span class="st-pill hot">'+yq.length+' to upload</span>':'<span class="st-pill">Caught up</span>')+'</div>'+
    '<div class="mini-player"><span class="mpl-play"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></span><span class="mpl-bar"><i></i></span></div>'+
    '<div class="st-sub">'+(yq.length?"Next up: <b>"+esc(epTag(yq[0])+(yq[0].guests?" · "+yq[0].guests:""))+"</b>":ylast?"Latest: <b>"+esc(epTag(ylast)+(ylast.title?": "+ylast.title:""))+"</b>":"@MISMOStandards")+'</div></button>';

  /* LinkedIn: the feed */
  const lw=ev.filter(e=>e.k==="linkedin" && !e.done && e.date>=t && e.date<=add(t,7));
  const lnext=lw.sort((a,b)=>a.date<b.date?-1:1)[0];
  const li='<button type="button" class="st-tile st-li k-linkedin" data-hgo="linkedin"><div class="st-top"><span class="st-lab">LinkedIn</span><span class="st-pill">'+lw.length+' this week</span></div>'+
    '<div class="mini-feed"><div class="mf-h"><span class="mf-av">'+LOGO_SVG("avlogo")+'</span><span><b>MISMO</b><small>'+(lnext?esc(fD(lnext.date)):"Nothing lined up")+'</small></span>'+(lnext&&/Mic'd Up/.test(lnext.label)?'<span class="livebadge"><i></i>LIVE</span>':'')+'</div>'+
    '<div class="mf-b">'+(lnext?esc(lnext.label.replace(/^LinkedIn\s*·\s*/,"")):"Add a post or a Mic'd Up episode and it shows here.")+'</div><div class="mf-f"><span></span><span></span><span></span></div></div></button>';

  /* Mailchimp: the envelope */
  const mcs=vals("pieces").filter(p=>p.channel==="mailchimp" && pOpen(p) && p.date && p.date>=t).sort((a,b)=>a.date<b.date?-1:1);
  const mc='<button type="button" class="st-tile st-mc k-mailchimp" data-hgo="mailchimp"><div class="st-top"><span class="st-lab">Mailchimp</span></div>'+
    '<div class="env" aria-hidden="true"><svg viewBox="0 0 64 44"><rect x="2" y="2" width="60" height="40" rx="4"/><path d="M3 4l29 21L61 4"/></svg>'+(mcs.length?'<em>'+mcs.length+'</em>':'')+'</div>'+
    '<div class="st-sub">'+(mcs.length?"Next send <b>"+esc(fS(mcs[0].date))+"</b><br>"+esc(mcs[0].title||""):"No sends scheduled")+'</div></button>';

  /* Requests */
  const rq=typeof requests==="function"?requests():[], rqNew=rq.filter(r=>r.status==="new"), rqOpen=rq.filter(r=>!["done","declined"].includes(r.status));
  const req='<button type="button" class="st-tile st-rq k-request" data-hgo="requests"><div class="st-top"><span class="st-lab">Requests</span>'+(rqNew.length?'<span class="st-pill hot">'+rqNew.length+' new</span>':'')+'</div>'+
    '<div class="st-big">'+hmCount(rqOpen.length)+'<small>open</small></div><div class="st-sub">'+(rqOpen[0]?"Latest: "+esc(rqOpen[0].title||"Untitled"):"Nothing waiting. Share the request form.")+'</div></button>';

  /* In the News */
  const nws=newsAll().filter(n=>n.date).sort((a,b)=>a.date<b.date?1:-1).slice(0,3);
  const news='<button type="button" class="st-tile st-news k-news" data-hgo="news"><div class="st-top"><span class="st-lab">In the News</span></div>'+
    (nws.length?'<ul class="news-list">'+nws.map(n=>'<li><b>'+esc(n.headline||"")+'</b><small>'+esc([n.outlet,fS(n.date)].filter(Boolean).join(" · "))+'</small></li>').join("")+'</ul>':'<div class="st-sub">Log a story and it feeds MISMO Matters and LinkedIn.</div>')+'</button>';

  /* what MISMO Media holds */
  const ppl=new Set(); try{ vals("audience").forEach(d=>(d.rows||[]).forEach(r=>{ const e=String(r.email||r.Email||r.e||"").toLowerCase(); if(e) ppl.add(e); })); }catch(e){}
  const stat=(n,l,g)=>'<button type="button" class="vault-i" data-hgo="'+g+'">'+hmCount(n)+'<span>'+esc(l)+'</span></button>';
  const vault='<div class="st-tile st-vault"><div class="st-top"><span class="st-lab">In MISMO Media</span></div><div class="vault">'+
    stat(vals("episodes").filter(e=>e.youtubeDone).length,"Episodes on YouTube","micdup")+
    stat(editionsSorted().filter(e=>e.done&&e.done.publish).length,"Editions Sent","matters")+
    stat(vals("images").filter(i=>!i.archived).length,"Pictures","images")+
    stat(ppl.size,"Subscribers and Downloaders","people")+
    stat(newsAll().length,"News Stories","news")+
    stat(vals("pieces").filter(p=>p.channel==="linkedin" && p.status==="done").length+vals("episodes").filter(e=>e.linkedinDone).length,"LinkedIn Posts and Lives","linkedin")+
  '</div></div>';

  /* Orders: the pipeline */
  const ors=vals("orders").filter(o=>!o.archived && o.status!=="cancelled");
  const stage=[["To Order",o=>["toorder","quote"].includes(o.status||"toorder")],["Ordered",o=>o.status==="ordered"],["Shipped",o=>o.status==="shipped"],["Received",o=>o.status==="received"]];
  const risk=ors.filter(o=>orRisk(o)).length;
  const nextNeed=ors.filter(o=>o.status!=="received" && (o.neededBy||orEventDate(o))).sort((a,b)=>(a.neededBy||orEventDate(a))<(b.neededBy||orEventDate(b))?-1:1)[0];
  const ord='<button type="button" class="st-tile st-ord k-orders" data-hgo="orders"><div class="st-top"><span class="st-lab">Orders</span>'+(risk?'<span class="st-pill hot">'+risk+' at risk</span>':'')+'</div>'+
    '<div class="pipe">'+stage.map(([l,f],i)=>{ const n=ors.filter(f).length; return '<div class="pp'+(n?" has":"")+'"><span class="pp-box">'+(n?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5L12 12l8.5-4.5M12 12v9"/></svg>':'')+'<em>'+n+'</em></span><small>'+l+'</small></div>'; }).join("")+'</div>'+
    '<div class="st-sub">'+(nextNeed?"Next needed: <b>"+esc(nextNeed.name||"Order")+"</b> · "+esc(fS(nextNeed.neededBy||orEventDate(nextNeed))):ors.length?"Everything's in":"Pins, swag, banners and print")+'</div></button>';

  /* QR codes: a live code */
  const qrc=HM.qr; let qLive=0,qSoon=0,qAll=0;
  if(qrc){ Object.values(qrc).forEach(c=>{ qAll++; if((!c.s||c.s<=t) && (!c.e||c.e>=t)){ qLive++; if(c.e && c.e<=add(t,30)) qSoon++; } }); }
  const qr='<button type="button" class="st-tile st-qr" data-hgo="qr"><div class="st-top"><span class="st-lab">QR Codes</span>'+(qSoon?'<span class="st-pill">'+qSoon+' expiring soon</span>':'')+'</div>'+
    '<div class="qr-row"><div class="qr-art">'+hmQrArt()+'<i class="qr-scan"></i></div><div class="st-big">'+(qrc?hmCount(qLive):"—")+'<small>live</small></div></div>'+
    '<div class="st-sub">'+(qrc?(qAll===qLive?"Every code is working":hmPl(qAll-qLive,"code")+" scheduled or ended"):"Change where a code goes without reprinting")+'</div></button>';

  /* Rebranding: old to new */
  const brs=vals("branding").filter(b=>!b.archived && b.status!=="retire"), bDone=brs.filter(b=>b.status==="done").length, bOld=brs.filter(b=>b.status==="old").length, bPct=brs.length?Math.round(bDone/brs.length*100):0;
  const brand='<button type="button" class="st-tile st-brand" data-hgo="branding"><div class="st-top"><span class="st-lab">Rebranding</span></div>'+
    '<div class="st-big">'+bPct+'%<small>on the new brand</small></div>'+
    '<div class="brbar"><i style="width:'+bPct+'%"></i></div>'+
    '<div class="st-sub">'+(brs.length?bDone+" of "+brs.length+" updated"+(bOld?" · <b>"+bOld+" still old</b>":""):"Track what still needs the new look")+'</div></button>';

  return '<div class="studio">'+
    '<div class="sw-week">'+week+'</div>'+
    '<div class="st-grid">'+mic+mat+sum+yt+li+mc+ord+qr+brand+req+news+vault+'</div></div>';
}
/* the moving parts: the countdown ticks and the numbers count up */
function hmStudioLive(el){
  if(HM.timer){ clearInterval(HM.timer); HM.timer=null; }
  const cd=$("#hm-cd",el);
  const tick=()=>{ if(!cd || !document.body.contains(cd)){ clearInterval(HM.timer); HM.timer=null; return; }
    const at=new Date(cd.dataset.at), ms=at-new Date();
    if(ms<=0){ cd.innerHTML='<span class="cd-live">Live now · Friday 8:30 AM ET</span>'; return; }
    const d=Math.floor(ms/864e5), h=Math.floor(ms%864e5/36e5), m=Math.floor(ms%36e5/6e4), s=Math.floor(ms%6e4/1e3);
    cd.innerHTML=[[d,"days"],[h,"hrs"],[m,"min"],[s,"sec"]].map(([v,l])=>'<span><b>'+String(v).padStart(2,"0")+'</b><small>'+l+'</small></span>').join("");
  };
  if(cd){ tick(); HM.timer=setInterval(tick,1000); }
  const still=window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(!still) $$("[data-count]",el).forEach(b=>{ const n=+b.dataset.count; if(!n) return; const t0=performance.now(), dur=900;
    const step=now=>{ const p=Math.min(1,(now-t0)/dur), v=Math.round(n*(1-Math.pow(1-p,3))); b.textContent=v.toLocaleString(); if(p<1) requestAnimationFrame(step); };
    requestAnimationFrame(step); });
}

/* a real-looking QR code to decorate the QR screen (finder squares plus a fixed pattern) */
function hmQrArt(){
  const n=21, on=(x,y)=>{ const f=(a,b)=>x>=a&&x<a+7&&y>=b&&y<b+7; for(const [a,b] of [[0,0],[14,0],[0,14]]) if(f(a,b)){ const dx=x-a, dy=y-b; return dx===0||dx===6||dy===0||dy===6||(dx>=2&&dx<=4&&dy>=2&&dy<=4); }
    if((x<8&&y<8)||(x>12&&y<8)||(x<8&&y>12)) return false; return ((x*7+y*13+x*y*3)%5)<2; };
  let r=''; for(let y=0;y<n;y++) for(let x=0;x<n;x++) if(on(x,y)) r+='<rect x="'+x+'" y="'+y+'" width="1" height="1"/>';
  return '<svg viewBox="-1 -1 23 23" aria-hidden="true">'+r+'</svg>';
}
/* the QR codes live in their own place; read how many are live (resources.mismo.org only) */
function hmLoadQr(){
  if(HM.qr || HM.qrAsked || location.hostname!=="resources.mismo.org") return; HM.qrAsked=true;
  fetch("/qr/data/routes.json",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(j=>{ if(j && j.codes){ HM.qr=j.codes; if(TAB==="home" && HM.view!=="map") renderHome(); } }).catch(()=>{});
}
