
/* ================= MyMISMO: the MISMO team's area (CN-061, approved by Jonna Nov 27, 2026) =================
   Everything the MISMO team does with MyMISMO lives here (it was on Team HQ, CN-041 and CN-043; Team HQ removes its copy
   in CN-062). Summit Photos (app35.js) and Push to MyMISMO (app34.js) were already here; Summit Alerts and Slides
   moved here from Summit HQ in CN-063 (app38.js).
   - MyMISMO page (left menu, under Events & Brand): Attendee Reports, MISMO Trivia, Summit Alerts and Slides.
       GET  /mymismo/staff/reports  -> { reports: [{ summit, id, about, aboutName, byName, reason, note, at, status, action }], open }
       POST /mymismo/staff/reports  { summit, id, status: 'closed' | 'open', action }   (relay request 15)
       GET  /mymismo/staff/trivia   -> { month, quarter, boards: [{ month, players, top: [{ rank, name, score, right }] }],
                                         quarters: [{ quarter, finalists: [{ name, month }], standings }], champ }
       POST /mymismo/staff/trivia   { champ: { quarter, opens, closes, minutes } }  (champ: null clears it)  (relay request 15)
   - Results: a MyMISMO card from GET /mymismo/staff/stats (relay request 17; counts only, no names, emails or message
     text) plus Trivia players by month from /staff/trivia.
   Every route uses the person's own resources.mismo.org sign-in and answers 403 to anyone not in the mymismo entry's
   alertSenders. Each part stays hidden until its route answers 200, so nothing shows for anyone else, or before the
   relay part is live. Summit Alerts and Slides (app38.js) show to anyone signed in who can save here (myaOn), so the
   menu item shows for them too; only alertSenders get Send to Phones. An open report is something needing action (Apple requires timely responses): it shows as a red
   number on MyMISMO in the left menu and as a line on the Schedule. Read when the page opens and every 5 minutes while
   it's open; nothing is kept in MISMO Media's records, and nothing is ever emailed or posted. Never in tour mode.
   Contract: Connections Map row "MyMISMO (team area) → MISMO Media". dev/tests/mymismo.js checks it. */
const MYM_URL = "https://rgvdi67cg27o5kcmiytcqbqnrm0hmztx.lambda-url.us-east-1.on.aws/mymismo/staff/";
const MYM = {rep:{code:0, data:null}, tri:{code:0, data:null}, stats:{code:0, data:null}, at:0, busy:false, sub:"reports", filter:"open", closing:"", saving:"", msg:"", champMsg:""};
function mymTok(){ try{ return (window.ResourcesSession && window.ResourcesSession.token()) || ""; }catch(e){ return ""; } }
async function mymGet(path){
  try{ const r=await fetch(MYM_URL+path,{cache:"no-store", headers:{"Authorization":"Bearer "+mymTok()}});
    const j=r.ok ? await r.json().catch(()=>null) : null;
    return {code: r.ok && j ? 200 : r.status, data:j};
  }catch(e){ return {code:-1, data:null}; }
}
async function mymPost(path, body){
  try{ const r=await fetch(MYM_URL+path,{method:"POST", cache:"no-store", headers:{"Authorization":"Bearer "+mymTok(), "Content-Type":"application/json"}, body:JSON.stringify(body)});
    const j=await r.json().catch(()=>({})); return {code:r.status, data:j};
  }catch(e){ return {code:-1, data:{}}; }
}
/* a part keeps what it last showed through a dropped connection or a busy relay; a 401, 403 or 404 hides it */
function mymKeep(old, got){ return (got.code===-1 || got.code>=500) && old.code===200 ? old : got; }
async function mymLoad(force){
  if(TOUR || MYM.busy || !mymTok()) return;
  if(!force && MYM.at && Date.now()-MYM.at<5*60000) return;
  MYM.busy=true;
  try{
    const [rep, tri, stats]=await Promise.all([mymGet("reports"), mymGet("trivia"), mymGet("stats")]);
    MYM.rep=mymKeep(MYM.rep, rep); MYM.tri=mymKeep(MYM.tri, tri); MYM.stats=mymKeep(MYM.stats, stats); MYM.at=Date.now();
  } finally { MYM.busy=false; }
  mymApply();
}
const mymOn = part=>MYM[part].code===200 && !!MYM[part].data;
function mymShown(){ return mymOn("rep") || mymOn("tri") || myaOn(); }
function mymReports(){ const d=MYM.rep.data; return mymOn("rep") && Array.isArray(d.reports) ? d.reports.filter(r=>r && r.id) : []; }
function mymOpenCount(){ return mymReports().filter(r=>r.status!=="closed").length; }
/* show or hide the menu item, the open-reports number and the Results card, then redraw what's on screen */
function mymApply(){
  const b=document.querySelector('.hq nav button[data-hq="mymismo"]'); if(b) b.hidden=!mymShown();
  badge("mymismo", mymOpenCount(), true);
  const i=RS_ORDER.indexOf("mymismo");
  if(mymOn("stats") && i<0) RS_ORDER.splice(RS_ORDER.indexOf("tools")<0?RS_ORDER.length:RS_ORDER.indexOf("tools"), 0, "mymismo");
  if(!mymOn("stats") && i>=0) RS_ORDER.splice(i,1);
  if(PANE && PANE.rsKey==="mymismo" && !mymOn("stats")) closePane(true);
  if(TAB==="mymismo" || TAB==="results" || TAB==="overview") renderTab(TAB);
}
if(!TOUR){
  setTimeout(()=>mymLoad(true), 1500);
  setInterval(()=>mymLoad(!MYM.at), 30000);
  document.addEventListener("visibilitychange", ()=>{ if(document.visibilityState==="visible") mymLoad(false); });
}
/* MyMISMO's summit ids, in our words */
function mymSummit(id){
  const sid=String(id||"").toLowerCase(), s=SUMMITS.find(x=>x.id===sid);
  if(s) return s.name;
  const yr=(sid.match(/20\d\d/)||[""])[0], sea=(sid.match(/winter|spring|summer|fall|autumn/)||[""])[0].replace("autumn","fall");
  const hit=SUMMITS.find(x=>yr && sea && x.id.indexOf(yr)>=0 && x.id.indexOf(sea)>=0);
  return hit ? hit.name : (sid ? sid.replace(/-/g," ").replace(/\b\w/g,c=>c.toUpperCase()) : "Summit");
}
function mymWhen(at){ const d=new Date(typeof at==="number"||/^\d+$/.test(String(at))?+at:at); if(isNaN(d)) return ""; return fS(iso(d))+", "+d.getFullYear()+" · "+d.toLocaleTimeString([], {hour:"numeric", minute:"2-digit"}); }
function mymMonth(m){ return /^\d{4}-\d{2}$/.test(String(m||"")) ? monthName(m) : String(m||""); }

/* ---- the Schedule's line and the open-report number (something needing action) ---- */
function mymSay(){ const n=mymOpenCount(); return n ? '<button type="button" class="mym-say hot" data-mym-go="reports">'+n+' open attendee report'+(n>1?'s':'')+' in MyMISMO.</button> ' : ''; }
document.addEventListener("click", e=>{ const b=e.target && e.target.closest && e.target.closest("[data-mym-go]"); if(!b) return; e.preventDefault(); MYM.sub=b.dataset.mymGo; if(MYM.sub==="reports") MYM.filter="open"; go("mymismo"); });

/* ---- the MyMISMO page ---- */
function renderMyMISMO(){
  const el=$("#page-mymismo");
  const head='<div class="phead"><div><div class="eyebrow">MISMO\'s App</div><h1>MyMISMO</h1><div class="sub">Summit alerts, presentation slides, attendee reports and MISMO Trivia for MyMISMO. MyMISMO\'s numbers are on the Results page; Summit Photos are on Summits.</div></div></div>';
  if(!mymShown()){ el.innerHTML=head+'<div class="card"><div class="empty">'+(MYM.busy||(!MYM.at&&mymTok()&&!TOUR)?'Checking MyMISMO…':'Nothing to show here. This page is for the people MyMISMO lets in, once its team routes are live.')+'</div></div>'; return; }
  /* a part that isn't available falls back to the first one that is */
  const avail=[mymOn("rep")&&"reports", mymOn("tri")&&"trivia", myaOn()&&"alerts", myaOn()&&"slides"].filter(Boolean);
  if(!avail.includes(MYM.sub)) MYM.sub=avail[0];
  const open=mymOpenCount();
  /* a redraw (records arriving) keeps the box being typed in, and where in it */
  const a=document.activeElement, keep=a && el.contains(a) && a.id ? {id:a.id, s:a.selectionStart, e:a.selectionEnd} : null;
  const tabs='<div class="subtabs" role="group" aria-label="MyMISMO">'+
    (mymOn("rep")?'<button type="button" data-mym-sub="reports" aria-pressed="'+(MYM.sub==="reports")+'">Attendee Reports'+(open?' <span class="cnt">'+open+' open</span>':'')+'</button>':'')+
    (mymOn("tri")?'<button type="button" data-mym-sub="trivia" aria-pressed="'+(MYM.sub==="trivia")+'">MISMO Trivia</button>':'')+
    (myaOn()?'<button type="button" data-mym-sub="alerts" aria-pressed="'+(MYM.sub==="alerts")+'">Summit Alerts</button><button type="button" data-mym-sub="slides" aria-pressed="'+(MYM.sub==="slides")+'">Slides</button>':'')+'</div>';
  el.innerHTML=head+tabs+({reports:mymReportsHtml, trivia:mymTriviaHtml, alerts:myaAlertsHtml, slides:myaSlidesHtml})[MYM.sub]();
  $$("[data-mym-sub]",el).forEach(b=>b.onclick=()=>{ MYM.sub=b.dataset.mymSub; MYM.msg=""; renderMyMISMO(); if(MYM.sub==="alerts"||MYM.sub==="slides") myaLoad(false); });
  ({reports:mymWireReports, trivia:mymWireTrivia, alerts:myaWireAlerts, slides:myaWireSlides})[MYM.sub](el);
  if(keep){ const n=document.getElementById(keep.id); if(n && n!==document.activeElement){ try{ n.focus(); if(keep.s!=null && n.setSelectionRange) n.setSelectionRange(keep.s, keep.e); }catch(e){} } }
}

/* Attendee Reports: newest first; Close needs a short note of what was done; Reopen keeps that note */
function mymReportsHtml(){
  const all=mymReports().slice().sort((a,b)=>String(b.at).localeCompare(String(a.at),undefined,{numeric:true}));
  const open=all.filter(r=>r.status!=="closed"), closed=all.filter(r=>r.status==="closed");
  const list=MYM.filter==="closed"?closed:MYM.filter==="all"?all:open;
  const row=r=>{ const key=r.summit+"|"+r.id, isOpen=r.status!=="closed", busy=MYM.saving===key;
    return '<div class="mym-rep'+(isOpen?' open':'')+'" data-mym-rep="'+esc(key)+'">'+
      '<div class="mym-rh"><span class="mym-st '+(isOpen?'open':'closed')+'">'+(isOpen?'Open':'Closed')+'</span><b>'+esc(r.reason||"Report")+'</b><span class="mym-sm">'+esc(mymSummit(r.summit))+' · '+esc(mymWhen(r.at))+'</span></div>'+
      '<div class="mym-rg"><span>About</span><b>'+esc(r.aboutName||r.about||"—")+'</b><span>Sent by</span><b>'+esc(r.byName||"—")+'</b></div>'+
      (r.note?'<div class="mym-note">“'+esc(r.note)+'”</div>':'')+
      (r.action?'<div class="mym-act"><span>What was done</span> '+esc(r.action)+'</div>':'')+
      (isOpen ? (MYM.closing===key
        ? '<div class="mym-close"><label class="flabel" for="mym-a">What was done</label><textarea id="mym-a" rows="2" maxlength="300" placeholder="For example: Looked into it and removed the profile photo."></textarea>'+
          '<div class="mym-btns"><button class="btn pri sm" type="button" data-mym-do="close"'+(busy?' disabled':'')+'>'+(busy?'Closing…':'Close Report')+'</button><button class="btn sm" type="button" data-mym-do="cancel">Cancel</button></div></div>'
        : '<div class="mym-btns"><button class="btn sm" type="button" data-mym-do="closing">Close…</button></div>')
      : '<div class="mym-btns"><button class="btn sm" type="button" data-mym-do="reopen"'+(busy?' disabled':'')+'>'+(busy?'Reopening…':'Reopen')+'</button></div>')+
      '</div>'; };
  return '<div class="card"><div class="ch"><h2>Attendee Reports</h2><span class="cnt">'+open.length+' open</span><span class="note">Apple requires a timely response to each report</span></div>'+
    '<div class="cb"><div class="subtabs" role="group" aria-label="Which reports">'+[["open","Open",open.length],["closed","Closed",closed.length],["all","All",all.length]].map(([k,l,n])=>'<button type="button" data-mym-f="'+k+'" aria-pressed="'+(MYM.filter===k)+'">'+l+' · '+n+'</button>').join("")+'</div>'+
    '<div class="mym-msg" id="mym-msg" role="status" aria-live="polite">'+esc(MYM.msg)+'</div>'+
    (list.length?list.map(row).join(""):'<div class="empty">'+(MYM.filter==="open"?'No open reports. Every report has been handled.':'No reports here.')+'</div>')+
    '<p class="mym-foot">Attendees report a profile or a conversation in MyMISMO. Look into it, then press <b>Close…</b> and note what was done. The reports stay in MyMISMO; MISMO Media keeps no copy and emails nothing.</p></div></div>';
}
function mymWireReports(el){
  $$("[data-mym-f]",el).forEach(b=>b.onclick=()=>{ MYM.filter=b.dataset.mymF; MYM.closing=""; renderMyMISMO(); });
  $$("[data-mym-rep]",el).forEach(card=>{
    const key=card.dataset.mymRep, r=mymReports().find(x=>x.summit+"|"+x.id===key); if(!r) return;
    $$("[data-mym-do]",card).forEach(b=>b.onclick=()=>{
      const what=b.dataset.mymDo;
      if(what==="closing"){ MYM.closing=key; MYM.msg=""; renderMyMISMO(); const t=$("#mym-a"); if(t) try{ t.focus(); }catch(e){} return; }
      if(what==="cancel"){ MYM.closing=""; renderMyMISMO(); return; }
      if(what==="close"){ const t=$("#mym-a",card), note=t?t.value.trim():""; if(!note){ const m=$("#mym-msg"); if(m){ m.textContent="Write a short note of what was done first."; m.className="mym-msg bad"; } if(t) t.focus(); return; } mymSetStatus(r, "closed", note); }
      if(what==="reopen") mymSetStatus(r, "open", r.action||"");
    });
  });
}
async function mymSetStatus(r, status, action){
  const key=r.summit+"|"+r.id; if(MYM.saving) return;
  MYM.saving=key; renderMyMISMO();
  const got=await mymPost("reports", {summit:r.summit, id:r.id, status, action:String(action).slice(0,300)});
  MYM.saving="";
  if(got.code===200){
    r.status=status; r.action=String(action).slice(0,300); MYM.closing=""; MYM.msg=status==="closed"?"Closed. It stays on the Closed list with your note.":"Reopened. It's back on the open list.";
    mymApply(); mymLoad(true); return;
  }
  MYM.msg = got.code===403 ? "Only the people Jonna named can handle attendee reports." : got.code===401 ? "Sign in to resources.mismo.org again, then try." : got.code===-1 ? "Couldn't reach MyMISMO. Nothing changed. Check your connection and try again." : "MyMISMO didn't take it ("+((got.data&&got.data.error)||got.code)+"). Nothing changed.";
  renderMyMISMO(); const m=$("#mym-msg"); if(m) m.className="mym-msg bad";
}

/* MISMO Trivia: each month's winner and top 10, the finalists and standings, and the championship window */
function mymTriviaHtml(){
  const d=MYM.tri.data||{}, boards=(Array.isArray(d.boards)?d.boards:[]).slice().sort((a,b)=>String(b.month).localeCompare(String(a.month)));
  const quarters=Array.isArray(d.quarters)?d.quarters:[], c=d.champ||null;
  const winners=boards.filter(b=>b.month!==d.month && b.top && b.top.length);
  const board=b=>'<div class="mym-board"><div class="mym-bh"><b>'+esc(mymMonth(b.month))+'</b><span>'+rsN(b.players)+' player'+(+b.players===1?'':'s')+(b.month===d.month?' · this month, still being played':'')+'</span></div>'+
    ((b.top||[]).length?'<table class="t"><thead><tr><th>#</th><th>Name</th><th>Score</th><th>Right</th></tr></thead><tbody>'+(b.top||[]).slice(0,10).map(t=>'<tr><td>'+esc(t.rank)+'</td><td>'+esc(t.name)+'</td><td>'+rsN(t.score)+'</td><td>'+rsN(t.right)+'</td></tr>').join("")+'</tbody></table>':'<div class="empty">Nobody has played yet.</div>')+'</div>';
  const qtr=q=>'<div class="mym-board"><div class="mym-bh"><b>'+esc(q.quarter)+'</b><span>'+(q.quarter===d.quarter?'this quarter':'last quarter')+'</span></div>'+
    '<div class="mym-sub">Finalists</div>'+((q.finalists||[]).length?'<ul class="mym-fin">'+q.finalists.map(f=>'<li>'+esc(f.name)+(f.month?' <span>'+esc(mymMonth(f.month))+'</span>':'')+'</li>').join("")+'</ul>':'<div class="empty">Not decided yet.</div>')+
    (Array.isArray(q.standings)&&q.standings.length?'<div class="mym-sub">Championship Standings</div><table class="t"><thead><tr><th>Name</th><th>Total</th><th>Played</th></tr></thead><tbody>'+q.standings.map(s=>'<tr><td>'+esc(s.name)+'</td><td>'+rsN(s.total)+'</td><td>'+(s.played?'Yes':'Not yet')+'</td></tr>').join("")+'</tbody></table>':'')+'</div>';
  const loc=v=>{ const t=new Date(v); if(isNaN(t)) return ""; const p=n=>String(n).padStart(2,"0"); return t.getFullYear()+"-"+p(t.getMonth()+1)+"-"+p(t.getDate())+"T"+p(t.getHours())+":"+p(t.getMinutes()); };
  return '<div class="card"><div class="ch"><h2>Monthly Winners</h2><span class="note">the #1 of each finished month, for recognition</span></div><div class="cb">'+
      (winners.length?'<ul class="mym-win">'+winners.map(b=>'<li><span>'+esc(mymMonth(b.month))+'</span><b>'+esc(b.top[0].name)+'</b><small>'+rsN(b.top[0].score)+' points</small></li>').join("")+'</ul>':'<div class="empty">No finished month with players yet.</div>')+'</div></div>'+
    '<div class="card" style="margin-top:22px"><div class="ch"><h2>Top 10 by Month</h2></div><div class="cb mym-grid">'+(boards.length?boards.map(board).join(""):'<div class="empty">No boards yet.</div>')+'</div></div>'+
    '<div class="card" style="margin-top:22px"><div class="ch"><h2>Quarterly Championship</h2>'+(c?'<span class="note">'+(c.open?'open now':'set')+': '+esc(c.quarter)+', '+esc(mymWhen(c.opens))+' to '+esc(mymWhen(c.closes))+', '+esc(c.minutes)+' minutes</span>':'<span class="note">no window set</span>')+'</div><div class="cb">'+
      (quarters.length?'<div class="mym-grid">'+quarters.map(qtr).join("")+'</div>':'')+
      '<form class="mym-champ" id="mym-champ"><div class="mym-sub">Championship Window</div>'+
      '<div class="mym-cf"><label><span class="flabel">Quarter</span><input type="text" id="mym-cq" placeholder="2027-Q1" value="'+esc(c?c.quarter:(d.quarter||""))+'"></label>'+
      '<label><span class="flabel">Opens</span><input type="datetime-local" id="mym-co" value="'+esc(c?loc(c.opens):"")+'"></label>'+
      '<label><span class="flabel">Closes</span><input type="datetime-local" id="mym-cc" value="'+esc(c?loc(c.closes):"")+'"></label>'+
      '<label><span class="flabel">Minutes to Play</span><input type="number" id="mym-cm" min="1" max="120" value="'+esc(c?c.minutes:15)+'"></label></div>'+
      '<div class="mym-msg" id="mym-cmsg" role="status" aria-live="polite">'+esc(MYM.champMsg)+'</div>'+
      '<div class="mym-btns"><button class="btn pri sm" type="submit" id="mym-cset">Set the Window</button>'+(c?'<button class="btn sm" type="button" id="mym-cclear">Clear It</button>':'')+'</div>'+
      '<p class="mym-foot">Times are your own time zone. Finalists can play once in that window, for the minutes set. MyMISMO keeps it; nothing is emailed.</p></form></div></div>';
}
function mymWireTrivia(el){
  const f=$("#mym-champ",el); if(!f) return;
  const say=(t,bad)=>{ MYM.champMsg=t; const m=$("#mym-cmsg"); if(m){ m.textContent=t; m.className="mym-msg"+(bad?" bad":""); } };
  const send=async(champ)=>{
    $$("button",f).forEach(b=>b.disabled=true); say(champ?"Setting…":"Clearing…");
    const got=await mymPost("trivia", {champ});
    $$("button",f).forEach(b=>b.disabled=false);
    if(got.code===200){ MYM.champMsg=champ?"Set. Finalists see it in MyMISMO.":"Cleared."; await mymLoad(true); renderMyMISMO(); return; }
    say(got.code===400 ? "MyMISMO needs a quarter like 2027-Q1, a closing time after the opening time, and 1 to 120 minutes."
      : got.code===403 ? "Only the people Jonna named can set the championship." : got.code===401 ? "Sign in to resources.mismo.org again, then try."
      : got.code===-1 ? "Couldn't reach MyMISMO. Nothing changed." : "MyMISMO didn't take it ("+((got.data&&got.data.error)||got.code)+"). Nothing changed.", true);
  };
  f.onsubmit=e=>{ e.preventDefault();
    const q=$("#mym-cq",f).value.trim().toUpperCase(), o=new Date($("#mym-co",f).value), c=new Date($("#mym-cc",f).value), m=Number($("#mym-cm",f).value);
    if(!/^\d{4}-Q[1-4]$/.test(q)) return say("Write the quarter like 2027-Q1.", true);
    if(isNaN(o) || isNaN(c)) return say("Pick when it opens and when it closes.", true);
    if(c<=o) return say("It has to close after it opens.", true);
    if(!(m>=1 && m<=120 && Math.round(m)===m)) return say("Minutes to play is a whole number from 1 to 120.", true);
    send({quarter:q, opens:o.toISOString(), closes:c.toISOString(), minutes:m});
  };
  const cl=$("#mym-cclear",f); if(cl) cl.onclick=()=>{ if(confirm("Clear the championship window? Finalists won't be able to play until a new one is set.")) send(null); };
}

/* ---- Results: the MyMISMO card and its panel (counts only) ---- */
const MYM_ROWS=[["signedIn","People signed in"],["alertsSent","Summit alerts sent"],["alertsDelivered","Alerts delivered to phones"],["conversations","Conversations"],["messages","Messages"],["checkins","Session check-ins"],["sessions","Sessions scanned"],["scanners","People scanning"],["met","Who I Met"],["touchpoints","Touchpoints"],["photos.submitted","Photos submitted"],["photos.picked","Photos picked"],["photos.sent","Photos sent to MISMO Media"],["reports.total","Attendee reports"],["reports.open","Reports still open"]];
function mymStatSummits(){ const d=MYM.stats.data; return mymOn("stats") && Array.isArray(d.summits) ? d.summits.filter(Boolean) : []; }
const mymV=(s,k)=>k.split(".").reduce((o,p)=>o&&o[p],s);
function mymSum(k){ return mymStatSummits().reduce((n,s)=>n+(+mymV(s,k)||0),0); }
function mymCard(){
  if(!mymOn("stats")) return "";
  const ph=(MYM.stats.data||{}).phones||{}, ss=mymStatSummits();
  return rsCard("mymismo",{eye:"MyMISMO", color:"--c5", v:rsN(mymSum("signedIn")), vk:"people signed in, every summit",
    viz:rsMini(ss.filter(s=>+s.signedIn).slice(0,3).map(s=>({l:mymSummit(s.summit), v:+s.signedIn, c:"--c5"}))), none:"Nobody has signed in yet",
    rows:[["Phones with summit alerts on",rsN(ph.summitAlerts)],["MISMO Matters and Mic'd Up alerts on",rsN(ph.newsAlerts)],["Check-ins",rsN(mymSum("checkins"))],["Open reports",mymSum("reports.open")?'<span class="rs-due">'+rsN(mymSum("reports.open"))+'</span>':'0']],
    more:"Each summit, and Trivia players by month"});
}
function mymRail(){
  const d=MYM.stats.data||{}, ph=d.phones||{}, ss=mymStatSummits();
  const boards=mymOn("tri") ? (MYM.tri.data.boards||[]).slice().sort((a,b)=>String(a.month).localeCompare(String(b.month))) : [];
  return '<div class="rs-sec"><p class="mym-foot">Counts from MyMISMO'+(d.at?' as of '+esc(mymWhen(d.at)):'')+'. No names, emails or messages come to MISMO Media.</p>'+
    '<table class="t"><tbody><tr><td>Phones with summit alerts on</td><td class="num">'+rsN(ph.summitAlerts)+'</td></tr><tr><td>Phones with MISMO Matters and Mic\'d Up alerts on</td><td class="num">'+rsN(ph.newsAlerts)+'</td></tr></tbody></table>'+
    (ss.length?'<h3>Each Summit</h3><div class="mym-scroll"><table class="t"><thead><tr><th></th>'+ss.map(s=>'<th class="num">'+esc(mymSummit(s.summit))+'</th>').join("")+'</tr></thead><tbody>'+
      MYM_ROWS.map(([k,l])=>'<tr><td>'+esc(l)+'</td>'+ss.map(s=>'<td class="num">'+rsN(mymV(s,k))+'</td>').join("")+'</tr>').join("")+'</tbody></table></div>':'<div class="empty">No summits in MyMISMO yet.</div>')+
    '<h3>MISMO Trivia Players by Month</h3>'+(boards.length?'<table class="t"><thead><tr><th>Month</th><th class="num">Players</th><th>Winner</th></tr></thead><tbody>'+boards.map(b=>'<tr><td>'+esc(mymMonth(b.month))+'</td><td class="num">'+rsN(b.players)+'</td><td>'+(b.month===MYM.tri.data.month?'<small class="t2">still being played</small>':esc(((b.top||[])[0]||{}).name||"—"))+'</td></tr>').join("")+'</tbody></table>':'<div class="empty">'+(mymOn("tri")?'No Trivia months yet.':'Trivia numbers show once MyMISMO\'s Trivia route is live.')+'</div>')+
    (mymShown()?'<p><button class="btn sm" type="button" data-go="mymismo">Open MyMISMO</button></p>':'')+
    '<p class="mym-foot">Summit alerts and presentation slides are sent and added on the MyMISMO page; their counts are here.</p></div>';
}
RS_SEC.mymismo={t:()=>"MyMISMO", d:()=>mymRail()};
(function(){
  const st=document.createElement("style");
  st.textContent='.hq nav button[data-hq="mymismo"][hidden]{display:none!important}'+
    '.mym-say{background:none;border:0;padding:0;font:inherit;color:var(--bad);font-weight:700;cursor:pointer;text-decoration:underline;text-underline-offset:2px}'+
    '.mym-rep{border:1px solid var(--border);border-radius:8px;padding:12px 14px;margin:0 0 10px;background:var(--surface)}.mym-rep.open{border-left:4px solid var(--bad)}'+
    '.mym-rh{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}.mym-sm{font-size:12.5px;color:var(--ink-3)}'+
    '.mym-st{font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;font-weight:700;border-radius:4px;padding:2px 6px}.mym-st.open{background:var(--bad);color:#fff}.mym-st.closed{background:var(--surface-2);color:var(--ink-2);border:1px solid var(--border)}'+
    '.mym-rg{display:grid;grid-template-columns:auto 1fr auto 1fr;gap:4px 10px;font-size:13px;margin:8px 0 4px}.mym-rg span{color:var(--ink-3)}@media(max-width:600px){.mym-rg{grid-template-columns:auto 1fr}}'+
    '.mym-note{font-size:13.5px;color:var(--ink-2);margin:6px 0}.mym-act{font-size:13px;margin:6px 0}.mym-act span{font-weight:700;color:var(--ink-3)}'+
    '.mym-close textarea{width:100%;box-sizing:border-box;margin:4px 0 6px}.mym-btns{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}'+
    '.mym-msg{font-size:13px;min-height:1.2em;margin:0 0 8px}.mym-msg.bad{color:var(--bad)}.mym-foot{font-size:12px;color:var(--ink-3);margin:12px 0 0}'+
    '.mym-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}.mym-bh{display:flex;gap:8px;align-items:baseline;justify-content:space-between;margin-bottom:4px}.mym-bh span{font-size:12px;color:var(--ink-3)}'+
    '.mym-sub{font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;font-weight:700;color:var(--ink-3);margin:10px 0 4px}'+
    '.mym-win,.mym-fin{list-style:none;margin:0;padding:0;display:grid;gap:6px}.mym-win li{display:flex;gap:10px;align-items:baseline}.mym-win span{min-width:130px;color:var(--ink-3);font-size:13px}.mym-win small,.mym-fin span{color:var(--ink-3);font-size:12px}'+
    '.mym-cf{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px}.mym-cf label{display:grid;gap:4px}.mym-cf input{width:100%;box-sizing:border-box}'+
    '.mym-scroll{overflow-x:auto}td.num,th.num{text-align:right}';
  document.head.appendChild(st);
})();
