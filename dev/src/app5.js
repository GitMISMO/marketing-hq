
/* ================= People: subscribers and downloaders ================= */
const PEOPLE_LISTS = {subscribers:"Website Subscribers", downloaders:"Website Downloaders", prospects:"Prospects", matters:"MISMO Matters Group", unsubscribed:"Unsubscribed"};
const PL = {q:"", list:"all", limit:150};
/* a LinkedIn row that is the page's total for one day, not a post (Nov 21, 2026) */
const liIsDay = p=>p && (p.kind==="Daily totals");
/* Unsubscribes from MISMO's own page (data/unsubs.json, written only by the sign-up workflow). Someone counts as
   unsubscribed when their unsubscribe is newer than their last sign-up; signing up again puts them back on. */
function unsubMap(){ const m={}; vals("unsubs").forEach(u=>{ const e=(u.e||"").toLowerCase(); if(e && (!m[e] || String(u.at||"")>String(m[e].at||""))) m[e]=u; }); return m; }
function isUnsubbed(e, since, U){ const u=(U||unsubMap())[(e||"").toLowerCase()]; return !!u && String(u.at||"")>String(since||""); }
function unsubHL(u){ const m=S.unsubhl[u.id]; return (m && m.hlAt && String(m.hlAt)>=String(u.at||"")) ? "removed" : "pending"; }
function unsubsSorted(){ const back={}; vals("signups").forEach(x=>{ const e=(x.e||"").toLowerCase(); if(String(x.at||"")>String(back[e]||"")) back[e]=x.at; }); return vals("unsubs").filter(u=>String(u.at||"")>String(back[(u.e||"").toLowerCase()]||"")).sort((a,b)=>String(b.at||"").localeCompare(String(a.at||""))); }
function audienceRows(list){ const out=[]; vals("audience").filter(d=>d.list===list).sort((a,b)=>(a.part||0)-(b.part||0)).forEach(d=>(d.rows||[]).forEach(r=>out.push(r))); return out; }
function peopleIndex(){
  const map={};
  Object.keys(PEOPLE_LISTS).forEach(l=>audienceRows(l).forEach(r=>{ const e=(r.e||"").toLowerCase(); if(!e) return; const p=map[e]||(map[e]={e, n:"", o:"", t:"", lists:{}, last:"", x:[], c:0});
    ["n","o","t"].forEach(k=>{ if(!p[k] && r[k]) p[k]=r[k]; }); p.lists[l]=true; if(r.l && r.l>p.last) p.last=r.l; if(r.d && r.d>p.last) p.last=r.d; if(r.x) r.x.forEach(x=>{ if(!p.x.includes(x)) p.x.push(x); }); p.c+=(+r.c||0); }));
  vals("signups").forEach(r=>{ const e=(r.e||"").toLowerCase(); if(!e) return; const p=map[e]||(map[e]={e, n:"", o:"", t:"", lists:{}, last:"", x:[], c:0});
    ["n","o","t"].forEach(k=>{ if(!p[k] && r[k]) p[k]=r[k]; }); p.lists.subscribers=true; p.signup=r; const d=localDay(r.at); if(d>p.last) p.last=d; });
  /* downloads from the website pop-up count as downloaders, with what they downloaded */
  vals("wpdl").forEach(r=>{ const e=(r.e||"").toLowerCase(); if(!e) return; const p=map[e]||(map[e]={e, n:"", o:"", t:"", lists:{}, last:"", x:[], c:0});
    ["n","o","t"].forEach(k=>{ if(!p[k] && r[k]) p[k]=r[k]; }); p.lists.downloaders=true; const w=r.product||r.pid||r.file; if(w && !p.x.includes(w)) p.x.push(w); p.c+=(+r.times||1); const d=localDay(r.at); if(d>p.last) p.last=d; });
  /* anyone who unsubscribed on MISMO's page comes off the subscriber lists automatically */
  const U=unsubMap();
  Object.values(U).forEach(u=>{ const e=u.e.toLowerCase(); const p=map[e]||(map[e]={e, n:"", o:"", t:"", lists:{}, last:"", x:[], c:0});
    if(isUnsubbed(e, p.signup && p.signup.at, U)){ delete p.lists.subscribers; delete p.lists.matters; p.lists.unsubscribed=true; p.unsub=u; const d=localDay(u.at); if(d>p.last) p.last=d; } });
  return Object.values(map);
}
/* Work-product downloads from the website's "Before You Download" pop-up (data/wpdl.json, written only by the
   sign-up workflow; form = work-product-download). One record per person per work product; "times" counts repeats.
   Downloading never signs anyone up for MISMO Matters. */
function dlSorted(){ return vals("wpdl").filter(d=>d.e).sort((a,b)=>String(b.at||"").localeCompare(String(a.at||""))); }
function dlCSV(list){ const q=v=>'"'+String(v||"").replace(/"/g,'""')+'"'; return ["Downloaded,First Name,Last Name,Email,Company,Title,Work Product,File,Times,First Download"].concat(list.map(d=>[localDay(d.at),d.first,d.last,d.e,d.o,d.t,d.product||d.pid,d.file,d.times||1,localDay(d.firstAt||d.at)].map(q).join(","))).join("\n"); }
let DLQ={q:"", limit:25, range:"", from:"", to:""};
/* the date filter on downloads (Jonna, Nov 24, 2026): by when each was downloaded (Eastern days) */
const DL_RANGES=[["","Any Time"],["week","Last 7 Days"],["month","This Month"],["last","Last Month"],["90","Last 90 Days"],["year","This Year"],["custom","Pick Dates"]];
function dlRange(){ const t=T(), r=DLQ.range;
  if(r==="week") return [add(t,-6),t]; if(r==="month") return [t.slice(0,7)+"-01",t];
  if(r==="last"){ const end=add(t.slice(0,7)+"-01",-1); return [end.slice(0,7)+"-01",end]; }
  if(r==="90") return [add(t,-89),t]; if(r==="year") return [t.slice(0,4)+"-01-01",t];
  if(r==="custom") return [DLQ.from||"", DLQ.to||""]; return ["",""]; }
function dlMatch(d){ const q=DLQ.q.trim().toLowerCase(), [f,to]=dlRange(), day=localDay(d.at);
  return (!f||day>=f) && (!to||day<=to) && (!q||[d.e,d.n,d.o,d.t,d.product,d.file].join(" ").toLowerCase().includes(q)); }
function downloadsCard(){
  const all=dlSorted(), t=T(), wk=all.filter(d=>localDay(d.at)>=add(t,-6)), mo=all.filter(d=>String(d.at||"").slice(0,7)===t.slice(0,7));
  const list=all.filter(dlMatch), filtered=!!(DLQ.q.trim()||DLQ.range), [rf,rt]=dlRange();
  const people=new Set(all.map(d=>d.e)).size, tops={}; all.forEach(d=>{ const k=d.product||d.pid||d.file||"—"; tops[k]=(tops[k]||0)+(+d.times||1); });
  const top=Object.entries(tops).sort((a,b)=>b[1]-a[1])[0];
  return '<div class="card" style="margin-bottom:22px"><div class="ch"><h2>Work Product Downloads</h2><span class="cnt">'+all.length.toLocaleString()+'</span><span class="note">'+wk.length+' this week · '+mo.length+' this month · '+people.toLocaleString()+' people'+(top?' · most downloaded: '+esc(top[0]):'')+'</span><div class="r" style="align-items:center">'+
      (all.length?'<select id="dl-range" aria-label="When downloaded">'+DL_RANGES.map(([v,l])=>'<option value="'+v+'"'+(DLQ.range===v?" selected":"")+'>'+esc(l)+'</option>').join("")+'</select>'+
        (DLQ.range==="custom"?'<input type="date" id="dl-from" aria-label="From" value="'+esc(DLQ.from)+'"><span class="t2">to</span><input type="date" id="dl-to" aria-label="To" value="'+esc(DLQ.to)+'">':'')+
        '<input type="search" class="plain" id="dl-q" placeholder="Name, email, company or work product" value="'+esc(DLQ.q)+'" style="width:240px"><button class="btn sm" type="button" id="dl-csv">Copy '+(filtered?list.length.toLocaleString()+' as CSV':'as CSV')+'</button>':'')+'</div></div>'+
    (filtered&&all.length?'<div class="dlsum"><b>'+list.length.toLocaleString()+'</b> download'+(list.length===1?'':'s')+' by <b>'+new Set(list.map(d=>d.e)).size.toLocaleString()+'</b> '+(new Set(list.map(d=>d.e)).size===1?'person':'people')+(rf||rt?', '+esc(rf?fS(rf):"start")+' to '+esc(rt?fS(rt):"today"):'')+(DLQ.q.trim()?', matching "'+esc(DLQ.q.trim())+'"':'')+'</div>':'')+
    (list.length?'<div class="tw"><table class="t"><thead><tr><th>Downloaded</th><th>Name</th><th>Email</th><th>Company</th><th>Work Product</th><th class="n">Times</th></tr></thead><tbody>'+
      list.slice(0,DLQ.limit).map(d=>'<tr class="click" data-dl="'+esc(d.id)+'"><td><b>'+esc(fS(localDay(d.at)))+'</b></td><td>'+esc(d.n||"—")+(d.t?'<span class="t2">'+esc(d.t)+'</span>':'')+'</td><td>'+esc(d.e)+'</td><td>'+esc(d.o||"")+'</td><td>'+esc(d.product||d.pid||d.file||"")+'</td><td class="n">'+(+d.times||1)+'</td></tr>').join("")+
      '</tbody></table></div>'+(list.length>DLQ.limit?'<div class="cb"><button class="btn sm" type="button" id="dl-more">Show More ('+(list.length-DLQ.limit).toLocaleString()+' left)</button></div>':'')
    :'<div class="empty">'+(all.length?(DLQ.range?"No downloads in those dates"+(DLQ.q.trim()?" that match":"")+".":"Nobody matches that."):"Everyone who fills in the website's Before You Download form (and accepts the licence) lands here the moment they press Accept and Download, with what they downloaded.")+'</div>')+'</div>';
}
function wireDownloads(el, redraw){
  const qi=$("#dl-q",el); if(qi) qi.oninput=()=>{ DLQ.q=qi.value; DLQ.limit=25; clearTimeout(DLQ._t); DLQ._t=setTimeout(()=>{ redraw(); const n=$("#dl-q"); if(n){ n.focus(); n.setSelectionRange(n.value.length,n.value.length); } },180); };
  const cv=$("#dl-csv",el); if(cv) cv.onclick=()=>{ copyText(dlCSV(dlSorted().filter(dlMatch)),"Work product downloads (CSV)"); };
  const rg=$("#dl-range",el); if(rg) rg.onchange=()=>{ DLQ.range=rg.value; DLQ.limit=25; if(DLQ.range==="custom" && !DLQ.from){ DLQ.from=T().slice(0,7)+"-01"; DLQ.to=T(); } redraw(); };
  const df=$("#dl-from",el), dt=$("#dl-to",el); if(df) df.onchange=()=>{ DLQ.from=df.value; DLQ.limit=25; redraw(); }; if(dt) dt.onchange=()=>{ DLQ.to=dt.value; DLQ.limit=25; redraw(); };
  const mo=$("#dl-more",el); if(mo) mo.onclick=()=>{ DLQ.limit+=100; redraw(); };
  $$("[data-dl]",el).forEach(r=>r.onclick=()=>{ const d=S.wpdl[r.dataset.dl]; if(!d) return;
    openPane({eye:"Work Product Downloads", title:d.n||d.e, data:{}, fields:[{k:"_d",type:"html",html:()=>'<dl class="kv"><dt>Email</dt><dd>'+esc(d.e)+'</dd><dt>Company</dt><dd>'+esc(d.o||"—")+'</dd><dt>Title</dt><dd>'+esc(d.t||"—")+'</dd><dt>Work Product</dt><dd>'+esc(d.product||d.pid||"—")+'</dd>'+(d.file?'<dt>File</dt><dd>'+esc(d.file)+'</dd>':'')+'<dt>Licence</dt><dd>'+(d.accepted?"Accepted":"—")+(d.licence?' · '+esc(d.licence):'')+'</dd><dt>Downloaded</dt><dd>'+esc(fS(localDay(d.at)))+((+d.times||1)>1?' · '+(+d.times)+' times since '+esc(fS(localDay(d.firstAt||d.at))):'')+'</dd>'+(d.page?'<dt>From</dt><dd>'+esc(d.page)+'</dd>':'')+'</dl>'}]}); });
}
/* sign-ups from the website form, newest first */
function signupsSorted(){ const U=unsubMap(); return vals("signups").filter(s=>!isUnsubbed(s.e, s.at, U)).sort((a,b)=>String(b.at||"").localeCompare(String(a.at||""))); }
const HLST = {added:["In Higher Logic","ok"], pending:["Not in Higher Logic Yet","review"], failed:["Higher Logic Refused","changes"]};
function signupCSV(list){ const q=v=>'"'+String(v||"").replace(/"/g,'""')+'"'; return ["Email,First Name,Last Name,Company,Job Title,Topics,Signed Up"].concat(list.map(s=>[s.e,s.first,s.last,s.o,s.t,(s.topics||[]).join("; "),localDay(s.at)].map(q).join(","))).join("\n"); }
function signupsCard(){
  const list=signupsSorted(), t=T(), wk=list.filter(s=>localDay(s.at)>=add(t,-6)).length, notHL=list.filter(s=>s.hl!=="added");
  return '<div class="card" style="margin-bottom:22px"><div class="ch"><h2>Website Sign-Ups</h2><span class="cnt">'+list.length+'</span><span class="note">'+wk+' this week · from resources.mismo.org/forms/subscribe/</span><div class="r"><a class="btn sm" href="'+SUBSCRIBE_URL+'" target="_blank" rel="noopener">Open Subscribe Form&nbsp;↗</a><button class="btn sm" type="button" id="su-link">Copy Form Link</button>'+(notHL.length?'<button class="btn sm" type="button" id="su-csv">Copy '+notHL.length+' for Higher Logic</button>':'')+'</div></div>'+
    (list.length?'<div class="tw"><table class="t"><thead><tr><th>Signed Up</th><th>Name</th><th>Email</th><th>Company</th><th>Interests</th><th>Higher Logic</th></tr></thead><tbody>'+
      list.slice(0,25).map(s=>'<tr class="click" data-pe="'+esc(s.e)+'"><td><b>'+esc(fS(localDay(s.at)))+'</b></td><td>'+esc(s.n||"")+(s.t?'<span class="t2">'+esc(s.t)+'</span>':'')+'</td><td>'+esc(s.e)+'</td><td>'+esc(s.o||"")+'</td><td class="note">'+esc((s.topics||[]).join(", "))+'</td><td>'+chip(HLST,s.hl||"pending")+'</td></tr>').join("")+'</tbody></table></div>'
    :'<div class="empty">Sign-ups from the new Subscribe form land here the moment someone presses Subscribe, marked Pending until they are added to the MISMO Matters list in Higher Logic.</div>')+'</div>';
}
const UNST = {pending:["Still in Higher Logic","review"], removed:["Removed in Higher Logic","ok"]};
function unsubsCard(){
  const list=unsubsSorted(), t=T(), wk=list.filter(u=>localDay(u.at)>=add(t,-6)).length, todo=list.filter(u=>unsubHL(u)==="pending");
  return '<div class="card" style="margin-bottom:22px"><div class="ch"><h2>Unsubscribes</h2><span class="cnt">'+list.length+'</span><span class="note">'+wk+' this week · from resources.mismo.org/forms/unsubscribe/</span><div class="r"><a class="btn sm" href="'+UNSUB_URL+'" target="_blank" rel="noopener">Open Unsubscribe Page&nbsp;↗</a><button class="btn sm" type="button" id="un-iz" title="For people who used the unsubscribe button in Gmail or Outlook">Bring In Informz Unsubscribes</button><input type="file" id="un-iz-f" accept=".csv,.xlsx,.xls" hidden>'+
      (todo.length?'<button class="btn sm" type="button" id="un-csv">Copy '+todo.length+' for Higher Logic</button><button class="btn sm pri" type="button" id="un-done">Mark Removed in Higher Logic</button>':'')+'</div></div>'+
    (list.length?'<div class="tw"><table class="t"><thead><tr><th>Unsubscribed</th><th>Email</th><th>Name</th><th>Why</th><th>Higher Logic</th></tr></thead><tbody>'+
      list.slice(0,25).map(u=>{ const s=vals("signups").find(x=>(x.e||"").toLowerCase()===u.e); return '<tr class="click" data-pe="'+esc(u.e)+'"><td><b>'+esc(fS(localDay(u.at)))+'</b></td><td>'+esc(u.e)+'</td><td>'+esc(s&&s.n||"")+'</td><td class="note">'+esc((u.reasons||[]).join(", ")||(u.source==="Informz"?"Gmail or Outlook button (Informz)":"—"))+'</td><td>'+chip(UNST,unsubHL(u))+'</td></tr>'; }).join("")+'</tbody></table></div>'
    :'<div class="empty">Anyone who uses the Unsubscribe link at the bottom of MISMO Matters lands here and comes off the subscriber list right away.</div>')+
    (todo.length?'<div class="cb"><div class="hint">Until Higher Logic\'s marketing API is connected, opt these people out in Informz before the next send: Copy for Higher Logic, import them as unsubscribes, then press Mark Removed.</div></div>':'')+'</div>';
}
/* Informz's own unsubscribes: the unsubscribe button Gmail and Outlook show uses Informz's List-Unsubscribe header,
   which Higher Logic can't point at MISMO's page, so those people are opted out in Informz only. After each send,
   Contacts › Reports › Unsubscribes in Informz is exported and loaded here. Each one is filed like an unsubscribe-page
   entry (same id, u-<sha1 of the email>), marked as already out of Higher Logic. Nothing touches Aptify. */
async function importInformzUnsubs(file){
  let rows; try{ rows=await readSheet(file); }catch(e){ toast("Couldn't read that file: "+(e.message||e), 5000); return; }
  const U=unsubMap(), now=new Date().toISOString(), seen=new Set(), add=[]; let had=0, bad=0;
  rows.forEach(r=>{ const e=col(r,/e-?mail/i).toLowerCase();
    if(!/^[^\s@]{1,64}@[^\s@]+\.[a-z]{2,}$/.test(e)){ bad++; return; } if(seen.has(e)) return; seen.add(e);
    const d=new Date(col(r,/unsub.*(date|on|time)|date|when/i)); const at=isNaN(d)||d>new Date()?now:d.toISOString();
    if(U[e] && String(U[e].at||"")>=at){ had++; return; } add.push({e,at}); });
  if(!add.length){ toast(rows.length?"Nothing new: "+(had?had+" already on the list":"no email column found")+".":"That file is empty.", 5000); return; }
  if(!window.confirm("Add "+add.length+" Informz unsubscribe"+(add.length===1?"":"s")+" to MISMO's list?"+(had?"\n\n"+had+" are already on it.":"")+(bad?"\n"+bad+" rows had no usable email and are skipped.":"")+"\n\nThey come off the subscriber list here. Nothing changes in Aptify.")) return;
  let n=0; toast("Adding "+add.length+"…", 3000);
  for(const x of add){
    const h=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-1",new TextEncoder().encode(x.e)))).map(b=>b.toString(16).padStart(2,"0")).join("").slice(0,12), id="u-"+h, old=S.unsubs[id]||{};
    try{ await put("unsubs",id,{e:x.e, at:x.at, firstAt:old.firstAt||x.at, times:(old.times||0)+1, reasons:old.reasons||[], note:old.note||"", source:"Informz", hl:"removed"});
      await put("unsubhl",id,{e:x.e, hlAt:now>x.at?now:x.at}); n++; }catch(e){ break; }
  }
  toast(n+" Informz unsubscribe"+(n===1?"":"s")+" added"+(n<add.length?"; "+(add.length-n)+" didn't save, try the file again":""), 6000); renderPeople();
}
function renderPeople(){
  const el=$("#page-people"); const all=peopleIndex();
  const subs=all.filter(p=>p.lists.subscribers), dls=all.filter(p=>p.lists.downloaders), both=all.filter(p=>p.lists.subscribers&&p.lists.downloaders);
  const lastDl = dls.reduce((m,p)=>p.last>m?p.last:m,"");
  const q=PL.q.trim().toLowerCase();
  let rows = all.filter(p=>(PL.list==="all"||p.lists[PL.list]) && (!q || [p.e,p.n,p.o,p.t].join(" ").toLowerCase().includes(q)));
  rows.sort((a,b)=>(b.last||"").localeCompare(a.last||"")||(a.n||a.e).localeCompare(b.n||b.e));
  const orgs={}; all.forEach(p=>{ if(p.o) orgs[p.o]=(orgs[p.o]||0)+1; }); const topOrg=Object.entries(orgs).sort((a,b)=>b[1]-a[1])[0];
  el.innerHTML='<div class="phead"><div><div class="eyebrow">Who Signs Up and Downloads</div><h1>Subscribers &amp; Downloaders</h1><div class="sub">Look anyone up by name, email, organization or title. Load each new export here and the counts and results update.</div></div><div class="tools"><button class="btn pri" type="button" id="pp-import">Load a List</button></div></div>'+
    '<div class="band"><div class="today">People · as of the latest list loaded</div><div class="say">'+(all.length?'<em>'+subs.length.toLocaleString()+'</em> people have subscribed to MISMO Matters from the website, and <em>'+dls.length.toLocaleString()+'</em> have downloaded a standard. '+(both.length?both.length+' did both.':''):'No lists loaded yet.')+'</div><div class="tiles">'+
      '<button class="tile" type="button" data-pl="subscribers"><div class="v sky">'+subs.length.toLocaleString()+'</div><div class="k">Subscribers</div><div class="s">website sign-ups</div></button>'+
      '<button class="tile" type="button" data-pl="downloaders"><div class="v">'+dls.length.toLocaleString()+'</div><div class="k">Downloaders</div><div class="s">'+dls.reduce((n,p)=>n+p.c,0).toLocaleString()+' downloads</div></button>'+
      '<div class="tile"><div class="v">'+both.length+'</div><div class="k">On Both</div><div class="s">subscribed and downloaded</div></div>'+
      '<div class="tile"><div class="v" style="font-size:19px;line-height:1.25">'+esc(topOrg?topOrg[0]:"—")+'</div><div class="k">Most People From</div><div class="s">'+(topOrg?topOrg[1]+" people":"")+'</div></div>'+
      '<div class="tile"><div class="v">'+esc(lastDl?fS(lastDl):"—")+'</div><div class="k">Latest Download</div><div class="s">in the lists loaded</div></div>'+
      (()=>{ const un=all.filter(p=>p.lists.unsubscribed), mo=un.filter(p=>p.unsub && String(p.unsub.at||"").slice(0,7)===T().slice(0,7)).length; return '<button class="tile" type="button" data-pl="unsubscribed"><div class="v">'+un.length.toLocaleString()+'</div><div class="k">Unsubscribed</div><div class="s">'+mo+' this month from the unsubscribe page</div></button>'; })()+
    '</div></div>'+
    signupsCard()+unsubsCard()+
    '<div class="card"><div class="ch"><h2>Look Someone Up</h2><span class="cnt">'+rows.length.toLocaleString()+'</span><div class="r" style="align-items:center"><input type="search" class="plain" id="pp-q" placeholder="Name, email, organization or title" value="'+esc(PL.q)+'" style="width:300px" autocomplete="off"><select id="pp-list" style="width:auto"><option value="all">Everyone</option>'+Object.entries(PEOPLE_LISTS).map(([k,l])=>'<option value="'+k+'"'+(PL.list===k?" selected":"")+'>'+esc(l)+'</option>').join("")+'</select></div></div>'+
      (rows.length?'<div class="tw"><table class="t"><thead><tr><th>Name</th><th>Email</th><th>Organization</th><th>Title</th><th>Lists</th><th>Last Activity</th></tr></thead><tbody>'+
        rows.slice(0,PL.limit).map(p=>'<tr class="click" data-pe="'+esc(p.e)+'"><td><b>'+esc(p.n||"—")+'</b></td><td>'+esc(p.e)+'</td><td>'+esc(p.o)+'</td><td>'+esc(p.t)+'</td><td>'+Object.keys(p.lists).map(l=>'<span class="chip '+(l==="unsubscribed"?"changes":l==="subscribers"?"ok":"in")+'">'+esc((PEOPLE_LISTS[l]||l).replace("Website ",""))+'</span>').join(" ")+'</td><td>'+esc(p.last?fS(p.last):"—")+'</td></tr>').join("")+
        '</tbody></table></div>'+(rows.length>PL.limit?'<div class="cb"><button class="btn" type="button" id="pp-more">Show More ('+(rows.length-PL.limit).toLocaleString()+' left)</button></div>':''):'<div class="empty">'+(all.length?"Nobody matches that.":(LIVE&&!LOADED.has("audience")?"Loading…":"<b>No lists loaded.</b> Load the website subscriber or downloader export to start."))+'</div>')+
    '</div>'+
    '<p class="foot">Lists loaded: '+(vals("audience").filter(d=>d.part===1||!d.part).map(d=>esc(d.label||PEOPLE_LISTS[d.list]||d.list)+(d.covers?' ('+esc(d.covers)+')':'')).join(" · ")||"none")+'. This page is for the MISMO team only; share it with care.</p>';
  $("#pp-import",el).onclick=openImportPeople;
  const sl=$("#su-link",el); if(sl) sl.onclick=()=>copyText(SUBSCRIBE_URL,"Subscribe form link");
  const uc=$("#un-csv",el); if(uc) uc.onclick=()=>copyText("Email\n"+unsubsSorted().filter(u=>unsubHL(u)==="pending").map(u=>u.e).join("\n"),"Unsubscribes for Higher Logic (CSV)");
  const iz=$("#un-iz",el), izf=$("#un-iz-f",el); if(iz&&izf){ iz.onclick=()=>izf.click(); izf.onchange=async e=>{ const f=e.target.files[0]; e.target.value=""; if(f) await importInformzUnsubs(f); }; }
  const ud=$("#un-done",el); if(ud) ud.onclick=async()=>{ const todo=unsubsSorted().filter(u=>unsubHL(u)==="pending"); for(const u of todo){ await put("unsubhl",u.id,{e:u.e,hlAt:new Date().toISOString(),}); } toast(todo.length+" marked removed in Higher Logic"); renderPeople(); };
  const sc=$("#su-csv",el); if(sc) sc.onclick=()=>copyText(signupCSV(signupsSorted().filter(s=>s.hl!=="added")),"Sign-ups for Higher Logic (CSV)");
  const qi=$("#pp-q",el); qi.oninput=()=>{ PL.q=qi.value; PL.limit=150; clearTimeout(PL._t); PL._t=setTimeout(()=>{ renderPeople(); const n=$("#pp-q"); if(n){ n.focus(); n.setSelectionRange(n.value.length,n.value.length); } },180); };
  $("#pp-list",el).onchange=e=>{ PL.list=e.target.value; renderPeople(); };
  const more=$("#pp-more",el); if(more) more.onclick=()=>{ PL.limit+=300; renderPeople(); };
  $$("[data-pl]",el).forEach(b=>b.onclick=()=>{ PL.list=b.dataset.pl; renderPeople(); });
  $$("[data-pe]",el).forEach(r=>r.onclick=()=>{ const p=all.find(x=>x.e===r.dataset.pe); if(!p) return;
    openPane({eye:"Subscribers & Downloaders", title:p.n||p.e, data:{}, fields:[{k:"_p",type:"html",html:()=>'<dl class="kv"><dt>Email</dt><dd>'+esc(p.e)+'</dd><dt>Organization</dt><dd>'+esc(p.o||"—")+'</dd><dt>Title</dt><dd>'+esc(p.t||"—")+'</dd><dt>On</dt><dd>'+Object.keys(p.lists).map(l=>esc(PEOPLE_LISTS[l]||l)).join(", ")+'</dd><dt>Last Activity</dt><dd>'+esc(p.last?fL(p.last):"—")+'</dd><dt>Downloads</dt><dd>'+(p.c||0)+'</dd></dl>'+(p.x.length?'<div class="fsec">What They Downloaded</div><div class="checks">'+p.x.map(x=>'<div class="chk"><span class="ct"><b>'+esc(x)+'</b></span></div>').join("")+'</div>':'')}]});
  });
}

/* reading a spreadsheet or CSV someone drops in (SheetJS 0.20.3, fetched only when needed, integrity-checked) */
/* LinkedIn's export has two sheets: the page's daily totals (one row a day, the longer one) and All posts.
   readSheets hands back every sheet; readSheet keeps the longest, as before (Nov 21, 2026). */
async function readSheet(file){ const all=await readSheets(file); return all.reduce((b,x)=>x.rows.length>b.length?x.rows:b,[]); }
async function readSheets(file){
  await loadXLSX();
  return new Promise((res,rej)=>{
    const fr=new FileReader();
    fr.onload=()=>{ try{
      const wb=XLSX.read(new Uint8Array(fr.result),{type:"array",cellDates:true});
      const out=[]; wb.SheetNames.forEach(n=>{ const raw=XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:"",raw:false});
        let h=raw.findIndex(r=>r.filter(c=>String(c).trim()).length>=2 && r.some(c=>/mail|title|views|impressions|video|content|subject|post/i.test(String(c)))); if(h<0) h=0;
        const head=raw[h].map(c=>String(c).trim()); const rows=raw.slice(h+1).filter(r=>r.some(c=>String(c).trim())).map(r=>Object.fromEntries(head.map((k,i)=>[k,r[i]])));
        out.push({name:n, head, rows}); });
      res(out);
    }catch(e){ rej(e); } };
    fr.onerror=()=>rej(new Error("Couldn't read that file.")); fr.readAsArrayBuffer(file);
  });
}
const col = (row, ...pats)=>{ const ks=Object.keys(row); for(const p of pats){ const k=ks.find(k=>p.test(k)); if(k!==undefined && String(row[k]).trim()!=="") return String(row[k]).trim(); } return ""; };
const num = v=>{ const n=parseFloat(String(v||"").replace(/[,%\s]/g,"")); return isNaN(n)?0:n; };
function isoFrom(v){ if(!v) return ""; const p=parseDateIn(String(v).split(/[ T]/)[0]); return p||""; }
function openImportPeople(){
  openPane({eye:"Subscribers & Downloaders", title:"Load a List", data:{list:"subscribers"}, fields:[
    {k:"list",label:"Which List",type:"select",opts:Object.entries(PEOPLE_LISTS)},
    {k:"covers",label:"What It Covers",ph:"e.g. Sept 9 to Nov 1, 2026"},
    {k:"_f",type:"html",html:()=>'<label class="flabel" for="pp-file">The Export (Excel or CSV)</label><input type="file" id="pp-file" accept=".csv,.xlsx,.xls"><span class="hint" id="pp-msg">Columns are matched by name: email, first/last or full name, company or organization, title, date, and the download link for downloaders. Everyone already on the list is kept; new people are added and existing ones updated.</span>'}],
    buttons:[{label:"Load It", run:async v=>{
      const f=$("#pp-file").files[0], msg=$("#pp-msg"); if(!f){ msg.textContent="Choose the export first."; return; }
      try{ msg.textContent="Reading…"; const raw=await readSheet(f);
        const cur={}; audienceRows(v.list).forEach(r=>cur[r.e]=r);
        let added=0, upd=0;
        raw.forEach(r=>{ const e=col(r,/e-?mail/i).toLowerCase(); if(!e.includes("@")) return;
          const n=col(r,/^name$|full ?name|^contact$/i) || [col(r,/first/i),col(r,/last/i)].filter(Boolean).join(" ");
          const o=col(r,/compan|organi[sz]ation|^org/i), t=col(r,/job|^title$|position/i), d=isoFrom(col(r,/time|date|created|submitted/i));
          const u=col(r,/^url$|link|page/i); const item=u? (u.replace(/\/$/,"").split("/").pop()||"").replace(/[-_]+/g," ").replace(/\b\w/g,c=>c.toUpperCase()) : "";
          const p=cur[e]; if(p){ upd++; if(n) p.n=n; if(o) p.o=o; if(t) p.t=t; if(d){ if(!p.f||d<p.f) p.f=d; if(!p.l||d>p.l) p.l=d; } if(item){ p.x=p.x||[]; if(!p.x.includes(item)) p.x.push(item); p.c=(+p.c||0)+1; } }
          else { added++; cur[e]={e,n,o,t,f:d,l:d,c:item?1:0,x:item?[item]:[]}; } });
        const rows=Object.values(cur); const CH=1200; const parts=Math.max(1,Math.ceil(rows.length/CH));
        for(let i=0;i<parts;i++) await put("audience", v.list+"__"+(i+1), {list:v.list, part:i+1, label:PEOPLE_LISTS[v.list], covers:v.covers||"", rows:rows.slice(i*CH,(i+1)*CH)});
        vals("audience").filter(d=>d.list===v.list && d.part>parts).forEach(d=>remove("audience",d.id));
        toast(added.toLocaleString()+" added, "+upd.toLocaleString()+" updated",4000); closePane(true);
      }catch(e){ msg.textContent=e.message||String(e); }
    }}]});
}

/* ================= Results: stats for everything =================
   Rebuilt Nov 20, 2026 (Jonna): the results lead; the month's checklist folds to one line once it's done, and
   bringing in the numbers sits at the very bottom. MISMO Matters shows everything Higher Logic gives us (waves,
   delivery, where people read, top links); Mailchimp shows every send with its own chart, topics and links. */
function hbars(items, fmt){
  if(!items.length) return '';
  const max=Math.max(...items.map(i=>i.v))||1;
  return '<div class="funnel">'+items.map(i=>'<div class="fr" style="grid-template-columns:minmax(0,2.2fr) minmax(0,3fr) 80px"'+(i.tip?' data-tip="'+esc(i.tip)+'"':'')+'><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+esc(i.l)+'">'+esc(i.l)+'</span><span class="bar"><i style="width:'+Math.max(1,i.v/max*100)+'%;background:var('+(i.c||"--c1")+')"></i></span><span class="fv">'+(fmt?fmt(i.v):i.v.toLocaleString())+'</span></div>').join("")+'</div>';
}
const RS = {mcAll:false, ed:"", msg:""};
const rsN = v=>(+v||0).toLocaleString();
/* "Label (address) — 35 people" or "Label — 35" → {l, v} */
function rsLinkLines(text){
  return String(text||"").split("\n").map(s=>s.trim()).filter(Boolean).map(s=>{ const m=s.match(/^(.*?)\s*[—–-]+\s*([\d,]+)\b[^—–-]*$/); return m ? {l:m[1].replace(/\s*\((?:[^()]*)\)\s*$/,"").trim()||m[1], v:+m[2].replace(/,/g,"")} : {l:s, v:0}; });
}
/* the extra Higher Logic numbers an edition can carry (all optional) */
function mmDetail(st){
  st=st||{}; const num=k=>+st[k]||0;
  const waves=[1,2].map(i=>({l:st["w"+i+"Label"]||("Wave "+i), sent:num("w"+i+"Sent"), dl:num("w"+i+"Delivered"), o:num("w"+i+"Opens"), c:num("w"+i+"Clicks")})).filter(w=>w.sent);
  const nd={hard:num("hard"), blocked:num("blocked"), soft:num("soft")};
  const clients=[["Desktop","cDesktop"],["Webmail","cWebmail"],["Web Browser","cBrowser"],["Mobile","cMobile"],["Not Known","cUnknown"]].map(([l,k])=>({l, v:num(k)})).filter(x=>x.v);
  return {waves, nd, clients, links:rsLinkLines(st.topLinks).filter(x=>x.v), totalOpens:num("totalOpens"), forwards:num("forwards"), unsubsHL:num("unsubsHL"), unsubsPage:num("unsubsPage")};
}
/* Mailchimp: every send logged (from the Mailchimp reports, the export drop, or the daily feed), newest first */
function mcTopic(s){ const t=String(s||"").toLowerCase();
  return /summit|lineup|general session/.test(t)?"Summits":/ai governance|frame/.test(t)?"AI Governance & FRAME":/mcd|compliance dataset/.test(t)?"Mortgage Compliance Dataset":/iif|investment/.test(t)?"IIF":/mismo link/.test(t)?"MISMO Link":/education|webinar|workshop|boot ?camp|cmba/.test(t)?"Education & Webinars":/vieaux|president|lender letter/.test(t)?"From Brian Vieaux":"Other"; }
function mcSends(){
  const own=vals("pieces").filter(p=>p.channel==="mailchimp" && +p.sent && !p.archived);
  const fc=feedCampaigns().filter(c=>+c.sent && !own.some(p=>(p.title||"").toLowerCase()===(c.subject||"").toLowerCase()));
  return own.map(p=>({id:p.id, name:p.mcName||p.title||"", subject:p.title||"", date:p.date||"", sent:+p.sent, dl:+p.delivered||+p.sent, o:+p.opens||0, c:+p.clicks||0, u:+p.unsubs||0, b:+p.bounces||0, resend:!!p.resend || /^resend:/i.test(p.mcName||""), seg:p.segment||"", links:p.links||[]}))
    .concat(fc.map(c=>({id:"feed-"+(c.id||c.subject), name:c.subject, subject:c.subject, date:String(c.date||c.sent_at||"").slice(0,10), sent:+c.sent, dl:+c.delivered||+c.sent, o:+c.opens||0, c:+c.clicks||0, u:+c.unsubs||0, b:+c.bounces||0, resend:false, seg:"", links:[]})))
    .map(x=>Object.assign(x,{topic:mcTopic(x.name+" "+x.subject), or:x.dl?x.o/x.dl:0, cr:x.dl?x.c/x.dl:0}))
    .sort((a,b)=>String(b.date).localeCompare(String(a.date)));
}
/* open rate for every send over time: originals filled, resends to non-openers hollow */
function mcChart(list){
  /* sends to fewer than 1,000 people (tests, small registrant lists) swing to 0% or 100%, so they stay out of the picture */
  const pts=list.filter(x=>x.date && x.dl>=1000);
  if(pts.length<2) return '';
  const W=760, H=220, L=44, R=12, Tp=12, B=28;
  const t=d=>P(d).getTime(), t0=Math.min(...pts.map(x=>t(x.date))), t1=Math.max(...pts.map(x=>t(x.date)))||t0+1;
  const top=Math.max(0.3, Math.ceil(Math.max(...pts.map(x=>x.or))*10)/10);
  const X=d=>L+(t(d)-t0)/((t1-t0)||1)*(W-L-R), Y=v=>Tp+(1-v/top)*(H-Tp-B);
  let g=''; for(let v=0; v<=top+1e-9; v+=0.1){ g+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(v)+'" y2="'+Y(v)+'" class="rs-grid"/><text x="'+(L-8)+'" y="'+(Y(v)+4)+'" class="rs-ax" text-anchor="end">'+Math.round(v*100)+'%</text>'; }
  const months=[]; const d0=new Date(t0); for(let m=new Date(d0.getFullYear(), d0.getMonth()+1, 1); m.getTime()<=t1; m=new Date(m.getFullYear(), m.getMonth()+1, 1)) months.push(m);
  months.forEach(m=>{ const x=L+(m.getTime()-t0)/((t1-t0)||1)*(W-L-R); g+='<text x="'+x+'" y="'+(H-8)+'" class="rs-ax" text-anchor="middle">'+MON[m.getMonth()]+'</text>'; });
  const orig=pts.filter(x=>!x.resend).sort((a,b)=>a.date.localeCompare(b.date));
  const line=orig.length>1?'<polyline class="rs-line" points="'+orig.map(x=>X(x.date)+","+Y(x.or)).join(" ")+'"/>':'';
  const dot=x=>'<circle cx="'+X(x.date)+'" cy="'+Y(x.or)+'" r="'+(x.resend?4.5:5)+'" class="'+(x.resend?"rs-dot rs-re":"rs-dot")+'" data-tip="'+esc(fS(x.date)+" · "+x.name+"\n"+rsN(x.dl)+" delivered · "+pct(x.or)+" opened · "+pct(x.cr)+" clicked"+(x.resend?" · resend to non-openers":""))+'"/>';
  return '<div class="rs-chart"><div class="rs-legend"><span><i class="rs-k"></i>Original send</span><span><i class="rs-k rs-kre"></i>Resend to people who didn\'t open</span></div>'+
    '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Open rate of every Mailchimp send over time">'+g+line+pts.filter(x=>x.resend).map(dot).join("")+orig.map(dot).join("")+'</svg>'+
    (list.length>pts.length?'<p class="rs-note">'+(list.length-pts.length)+' small sends (under 1,000 people) are left out of the chart; they\'re in the table below.</p>':'')+'</div>';
}
function rsKpis(items){ return '<div class="rs-kpis">'+items.map(k=>'<div class="rs-kpi"'+(k.tip?' data-tip="'+esc(k.tip)+'"':'')+'><div class="v">'+k.v+'</div><div class="k">'+esc(k.k)+'</div>'+(k.s?'<div class="s">'+esc(k.s)+'</div>':'')+'</div>').join("")+'</div>'; }
/* the month's checklist, folded to one line once everything is in */
function rsMonthStrip(){
  const per=mnPeriod(), all=mnTasks(per);
  /* the monthly hand-entered numbers are for the month before, so in November this is October's set (Jonna asked, Nov 20, 2026) */
  const t=today(), cur=MONL[t.getMonth()], due=MONL[(t.getMonth()+1)%12].slice(0,3);
  return '<div class="rs-mstrip" title="Monthly numbers come due the 1st of each month, for the month before"><span class="rs-ml">'+esc(mnName(per))+' monthly numbers are all in</span>'+all.map(x=>'<span class="rs-mc ok">✓ '+esc(x.t)+'</span>').join("")+'<span class="rs-mn">'+esc(cur)+'\'s are due '+esc(due)+' 1</span></div>';
}
/* hover notes on the charts: one floating label, follows the mark under the pointer (keyboard: focus) */
function rsTips(el){
  let tip=document.getElementById("rs-tip"); if(!tip){ tip=document.createElement("div"); tip.id="rs-tip"; tip.className="rs-tip"; tip.setAttribute("role","tooltip"); document.body.appendChild(tip); }
  const show=(t,e)=>{ const s=t.getAttribute("data-tip"); if(!s) return; tip.textContent=s; tip.style.display="block"; const r=t.getBoundingClientRect(); const x=e&&e.clientX?e.clientX:r.left+r.width/2, y=e&&e.clientY?e.clientY:r.top;
    const w=tip.offsetWidth, h=tip.offsetHeight; tip.style.left=Math.max(8,Math.min(innerWidth-w-8,x-w/2))+"px"; tip.style.top=Math.max(8,y-h-12)+"px"; };
  if(!el.__rsTip){ el.__rsTip=true;
  el.addEventListener("mousemove",e=>{ const t=e.target.closest&&e.target.closest("[data-tip]"); if(t&&el.contains(t)) show(t,e); else tip.style.display="none"; });
  el.addEventListener("mouseleave",()=>{ tip.style.display="none"; }); }
  $$("[data-tip]",el).forEach(t=>{ if(!t.hasAttribute("tabindex") && !/^(BUTTON|A)$/.test(t.tagName)) t.setAttribute("tabindex","0"); t.addEventListener("focus",()=>show(t)); t.addEventListener("blur",()=>{ tip.style.display="none"; }); });
}
/* ================= Results as cards (Nov 21, 2026) =================
   Jonna: "can the results not be an endless scroll? like cards with summary and click on them for right rail full
   details". Each channel is one summary card; pressing it opens everything about that channel in the right-hand
   panel, and Previous / Next move through the channels without closing it. The detail is the same as before. */
/* One period for all of Results (Jonna, Nov 24, 2026): every card and panel counts only what happened in these dates.
   List sizes are as of today; Who Is on Our Lists adds who joined or left in the period. Remembered in this browser. */
const RS_RANGES=[["week","Last 7 Days"],["30","Last 30 Days"],["month","This Month"],["last","Last Month"],["90","Last 90 Days"],["year","This Year"],["all","All Time"],["custom","Pick Dates"]];
/* Results opens on the last 30 days (Jonna, Nov 28, 2026); a different pick holds until MISMO Media is closed */
let RSP={range:"30", from:"", to:""};
try{ const v=JSON.parse(sessionStorage.getItem("mm.rs.period")||"null"); if(v && RS_RANGES.some(r=>r[0]===v.range)) RSP=Object.assign(RSP,v); }catch(e){}
function rsRange(){ const t=T(), r=RSP.range;
  if(r==="week") return [add(t,-6),t]; if(r==="30") return [add(t,-29),t]; if(r==="month") return [t.slice(0,7)+"-01",t];
  if(r==="last"){ const end=add(t.slice(0,7)+"-01",-1); return [end.slice(0,7)+"-01",end]; }
  if(r==="90") return [add(t,-89),t]; if(r==="year") return [t.slice(0,4)+"-01-01",t];
  if(r==="custom") return [RSP.from||"", RSP.to||""]; return ["",""]; }
/* a date (or timestamp) in the period; anything without a date counts only for All Time */
function rsIn(d){ const day=d?localDay(d):"", [f,to]=rsRange(); if(!day) return !f && !to; return (!f||day>=f) && (!to||day<=to); }
/* a span of days that overlaps the period */
function rsSpanIn(a,b){ const [f,to]=rsRange(); return (!to||a<=to) && (!f||b>=f); }
const rsDY=d=>fS(d)+(d.slice(0,4)!==T().slice(0,4)?", "+d.slice(0,4):"");
function rsPerText(){ const [f,to]=rsRange(); if(!f && !to) return "All time"; if(f && to) return f===to?rsDY(f):rsDY(f)+" to "+rsDY(to); return f?"Since "+rsDY(f):"Through "+rsDY(to); }
function rsPerName(){ const r=RSP.range, t=T(), mo=d=>MONL[+d.slice(5,7)-1]+" "+d.slice(0,4);
  if(r==="year") return t.slice(0,4); if(r==="month") return mo(t); if(r==="last") return mo(rsRange()[0]); if(r==="all") return "All Time"; if(r==="custom") return rsPerText();
  return (RS_RANGES.find(x=>x[0]===r)||["","All Time"])[1]; }
function rsPerIn(){ const r=RSP.range; if(r==="all") return "so far"; if(r==="custom") return "from "+rsPerText(); if(["week","30","90"].includes(r)) return "in the "+rsPerName().toLowerCase(); return "in "+rsPerName(); }
/* MISMO Matters' numbers start with its first send through Higher Logic (Informz), Nov 19, 2026: Axios never shared
   numbers and they can't be got, so for MISMO Matters the period never reaches back before that send (Jonna, Nov 24, 2026). */
function rsMMStart(){ const d=editionsSorted().filter(e=>!e.archived && e.dates && e.dates.publish && +edStats(e).recipients).map(e=>e.dates.publish).sort()[0]; return d || "2026-11-19"; }
function rsMMText(){ const st=rsMMStart(), [f,to]=rsRange(); if(to && to<st) return "Before "+rsDY(st)+", when MISMO Matters' numbers start"; const a=(!f||f<st)?st:f; return rsDY(a)+" to "+rsDY(to||T()); }
function rsPicker(pre, mm){
  return '<span class="rs-per"><label class="rs-perl" for="'+pre+'-range">Showing</label><select id="'+pre+'-range" data-rsp="range" aria-label="Period shown on Results">'+RS_RANGES.map(([v,l])=>'<option value="'+v+'"'+(RSP.range===v?" selected":"")+'>'+esc(l)+'</option>').join("")+'</select>'+
    (RSP.range==="custom"?'<input type="date" data-rsp="from" aria-label="From"'+(mm?' min="'+esc(rsMMStart())+'"':'')+' value="'+esc(RSP.from)+'"><span class="rs-pert">to</span><input type="date" data-rsp="to" aria-label="To" value="'+esc(RSP.to)+'">':'<span class="rs-pert">'+esc(mm?rsMMText():rsPerText())+'</span>')+(mm?'<span class="rs-pert rs-mmnote">MISMO Matters\' numbers start with its first Higher Logic send, '+esc(fS(rsMMStart())+", "+rsMMStart().slice(0,4))+'</span>':'')+'</span>';
}
function rsPerWire(root){
  $$("[data-rsp]",root).forEach(el=>el.onchange=()=>{ const k=el.dataset.rsp, inRail=!!el.closest("#pane-body");
    RSP[k]=el.value; if(k==="range" && RSP.range==="custom" && !RSP.from){ RSP.from=T().slice(0,7)+"-01"; RSP.to=T(); }
    try{ sessionStorage.setItem("mm.rs.period", JSON.stringify(RSP)); }catch(e){}
    renderResults();
    const again=$((inRail?"#pane-body ":"#page-results ")+'[data-rsp="'+k+'"]'); if(again) try{ again.focus({preventScroll:true}); }catch(e){} });
}
/* Where each Results card's numbers come from (Jonna, Nov 28, 2026: "make it easier for me to see what is automatic
   and what is still manual"). a: auto, hand or mix; t: how they arrive; w: when they last arrived. */
function rsSrc(k){
  const ago=iso=>{ const s=typeof wtStamp==="function"?wtStamp(iso):""; return s?"last "+s:""; };
  const eds=editionsSorted().filter(e=>!e.archived && +edStats(e).recipients), ed=eds[eds.length-1], mcL=mcSends().map(m=>m.date).filter(Boolean).sort().pop();
  const li=typeof liLive==="function" && liLive(), lr=typeof liRun==="function"?liRun():null, yt=feed("youtube");
  const S_={
    mm:{a:"hand", t:"Typed in from Higher Logic's mailing report (Record Stats). Higher Logic has no way for MISMO Media to read it by itself.", w:ed&&edStats(ed).asOf?"numbers as of "+String(edStats(ed).asOf).split(",")[0]:""},
    mc:(typeof mcLive==="function" && mcLive())?{a:"auto", t:"Read from Mailchimp every 6 hours.", w:ago(mcRun().lastOk)}:{a:"hand", t:"From the Mailchimp campaigns export, dropped into Bring In the Numbers"+((typeof mcRun==="function" && mcRun() && mcRun().waiting)?" (the automatic read starts once the Mailchimp API key is saved).":"."), w:mcL?"latest send logged "+fS(mcL):""},
    web:{a:"auto", t:"Counted by Cloudflare every night, plus today so far.", w:typeof wtUpdated==="function"&&wtUpdated()?"last "+wtUpdated():""},
    li:li?{a:"auto", t:"Read from MISMO's LinkedIn page every 3 hours.", w:lr?ago(lr.lastOk):""}:{a:"hand", t:"From the LinkedIn page analytics export (the automatic read isn't running).", w:lr&&lr.lastOk?"last read "+wtStamp(lr.lastOk):""},
    mu:MU_PAUSED.spotify?{a:"auto", t:"YouTube views every morning; MISMO's LinkedIn Live numbers every 3 hours.", w:yt&&yt.updated?ago(yt.updated):""}:{a:"mix", t:"YouTube views every morning and LinkedIn every 3 hours by themselves; Spotify plays are typed in.", w:yt&&yt.updated?ago(yt.updated):""},
    voices:{a:"auto", t:"Arrives from the website's AI answer feedback and problem form as people send them.", w:""},
    lists:{a:"mix", t:"Sign-ups, unsubscribes and downloaders come in by themselves; the MISMO Matters list size comes from its Higher Logic stats, typed in.", w:""},
    dl:{a:"auto", t:"From the website's Before You Download form, as people download.", w:""},
    mymismo:{a:"auto", t:"Read from MyMISMO.", w:""},
    tools:{a:"hand", t:"The monthly checklist and the export drops for what can't come in by itself.", w:""}
  };
  return S_[k]||null;
}
const RS_SRC_L={auto:"Automatic", hand:"By Hand", mix:"Partly by Hand"};
function rsSrcChip(k){ const s=rsSrc(k); return s?'<span class="rs-src a-'+s.a+'" title="'+esc(s.t)+'">'+RS_SRC_L[s.a]+'</span>':''; }
function rsSrcBox(k){ const s=rsSrc(k); if(!s) return ''; return '<div class="rs-srcbox a-'+s.a+'"><span class="rs-src a-'+s.a+'">'+RS_SRC_L[s.a]+'</span><span>'+esc(s.t)+(s.w?' <em>'+esc(s.w.charAt(0).toUpperCase()+s.w.slice(1))+'.</em>':'')+'</span></div>'; }
/* the band's key: which cards fill themselves and which need someone */
function rsSrcKey(){
  const g={auto:[],hand:[],mix:[]}, nm={mm:"MISMO Matters",mc:"Mailchimp",web:"Website",li:"LinkedIn",mu:"Mic'd Up",voices:"Visitor Comments",lists:"Our Lists",dl:"Downloads"};
  Object.keys(nm).forEach(k=>{ const s=rsSrc(k); if(s) g[s.a].push(nm[k]); });
  return '<div class="rs-key">'+["auto","mix","hand"].filter(a=>g[a].length).map(a=>'<span class="rs-keyg"><span class="rs-src a-'+a+'">'+RS_SRC_L[a]+'</span>'+esc(g[a].join(", "))+'</span>').join("")+'</div>';
}
const RS_ORDER=["mm","mc","web","li","mu","voices","lists","dl","tools"];
function rsCtx(){
  const x={};
  x.per=mnPeriod(); x.due=mnOpen(x.per).length>0;
  x.pn=rsPerName(); x.pt=rsPerText();
  x.edsAll=editionsSorted().filter(e=>+edStats(e).recipients); x.edLast=x.edsAll[x.edsAll.length-1]||null;
  /* an edition is in the period when it was sent then (or, with no send date, when its month overlaps) */
  x.eds=x.edsAll.filter(e=>{ if(e.archived) return false; const p=e.dates&&e.dates.publish; if(p) return p>=rsMMStart() && rsIn(p); const m=String(e.month||""); return /^\d{4}-\d\d/.test(m) && m.slice(0,7)>=rsMMStart().slice(0,7) && rsSpanIn(m.slice(0,7)+"-01", add(add(m.slice(0,7)+"-01",40).slice(0,7)+"-01",-1)); });
  x.ed=(RS.ed && x.eds.find(e=>e.id===RS.ed)) || x.eds[x.eds.length-1] || null;
  x.st=x.ed?edStats(x.ed):{}; x.c=statsCalc(x.st); x.md=mmDetail(x.st);
  x.mc=mcSends(); x.yr=x.pn; x.mcY=x.mc.filter(m=>rsIn(m.date)); x.mcO=x.mcY.filter(m=>!m.resend);
  const sum=x.sum=(a,k)=>a.reduce((n,m)=>n+(+m[k]||0),0);
  x.mcOpen=sum(x.mcO,"dl")?sum(x.mcO,"o")/sum(x.mcO,"dl"):0; x.mcClick=sum(x.mcO,"dl")?sum(x.mcO,"c")/sum(x.mcO,"dl"):0;
  x.li=vals("pieces").filter(p=>p.channel==="linkedin" && +p.impressions && !liIsDay(p) && rsIn(p.date));
  /* the page's daily totals from the export's daily sheet (every post together, one row a day) */
  x.liDays=vals("pieces").filter(p=>p.channel==="linkedin" && liIsDay(p) && p.date).sort((a,b)=>a.date.localeCompare(b.date));
  x.liMo=x.liDays.filter(p=>rsIn(p.date));
  x.liMoImp=x.liMo.reduce((n,p)=>n+(+p.impressions||0),0); x.liBest=x.liMo.reduce((b,p)=>!b||(+p.impressions||0)>(+b.impressions||0)?p:b,null);
  x.liEp=vals("episodes").filter(e=>+e.liImpressions && rsIn(liDate(e)));
  /* posts brought in from the export without their words are named by their date */
  x.liName=p=>{ const t=(p.title&&p.title!=="LinkedIn post"?p.title:"")||String(p.copy||"").split("\n")[0].slice(0,90); return t || ("Post on "+fS(p.date)); };
  x.liAll=x.li.map(p=>({l:x.liName(p),v:+p.impressions,c:"--c3",tip:x.liName(p)+" · "+fS(p.date)+" · "+rsN(p.impressions)+" impressions"+(+p.clicks?" · "+rsN(p.clicks)+" clicks":"")+(+p.reactions?" · "+rsN(p.reactions)+" reactions":"")}))
    .concat(x.liEp.map(e=>({l:"Mic'd Up Ep "+e.num+(e.title?": "+e.title:""),v:+e.liImpressions,c:"--c3",tip:"Mic'd Up Ep "+e.num+(e.title?": "+e.title:"")+" · "+rsN(e.liImpressions)+" impressions"})))
    .sort((a,b)=>b.v-a.v);
  x.liImp=x.liAll.reduce((n,i)=>n+i.v,0);
  x.yt=vals("episodes").filter(e=>epViews(e) && rsIn(e.airDate)).map(e=>Object.assign({},e,{views:epViews(e)})).sort((a,b)=>b.views-a.views);
  x.ytViews=x.yt.reduce((n,e)=>n+(+e.views),0);
  x.sp=vals("episodes").filter(e=>+e.spotifyPlays && rsIn(e.airDate)); x.spPlays=x.sp.reduce((n,e)=>n+(+e.spotifyPlays),0);
  const ppl=peopleIndex(); x.pros=ppl.filter(p=>p.lists.prospects); x.dls=ppl.filter(p=>p.lists.downloaders); x.web=ppl.filter(p=>p.lists.subscribers); x.grp=ppl.filter(p=>p.lists.matters); x.uns=ppl.filter(p=>p.lists.unsubscribed);
  const what={}; x.dls.forEach(p=>p.x.forEach(w=>what[w]=(what[w]||0)+1));
  x.what=Object.entries(what).sort((a,b)=>b[1]-a[1]).map(([l,v])=>({l,v,c:"--c6",tip:l+" · "+v+" people"})); x.dl=rsDlData(x);
  /* who joined or left in the period (list sizes stay as of today) */
  x.newSub=vals("signups").filter(g=>rsIn(g.at)).length+audienceRows("subscribers").filter(r=>rsIn(r.d||r.f)).length;
  const firstDl={}; audienceRows("downloaders").forEach(r=>{ const e=(r.e||"").toLowerCase(), d=r.f||r.l; if(e && d && (!firstDl[e]||d<firstDl[e])) firstDl[e]=d; });
  vals("wpdl").forEach(r=>{ const e=(r.e||"").toLowerCase(), d=localDay(r.firstAt||r.at); if(e && d && (!firstDl[e]||d<firstDl[e])) firstDl[e]=d; });
  x.newDl=Object.values(firstDl).filter(d=>rsIn(d)).length; x.newUns=Object.values(unsubMap()).filter(u=>rsIn(u.at)).length;
  x.emailsYr=sum(x.mcY,"dl")+x.eds.reduce((n,e)=>n+statsCalc(edStats(e)).dl,0);
  x.listSize=x.edLast?statsCalc(edStats(x.edLast)).dl:x.grp.length;
  /* website sign-ups: the old site's list (May 1 to Sept 8, 2026) plus everyone on the new form since Nov 19, 2026 */
  const sgE=new Set(vals("signups").map(g=>String(g.e||"").toLowerCase())); x.webNew=x.web.filter(p=>sgE.has(String(p.e).toLowerCase())).length; x.webOld=x.web.length-x.webNew; x.mcBig=Math.max(0,...x.mcY.map(m=>m.dl));
  x.wt=wtDays().filter(d=>rsIn(d.date)); x.wtVisits=x.wt.reduce((n,d)=>n+(+d.visits||0),0); x.wtViews=x.wt.reduce((n,d)=>n+(+d.views||0),0);
  x.fb=vals("aifeedback").filter(f=>f.at && f.comment && rsIn(f.at)).sort((a,b)=>String(b.at).localeCompare(String(a.at)));
  x.pr=vals("websiteproblems").filter(f=>f.at && f.message && rsIn(f.at)).sort((a,b)=>String(b.at).localeCompare(String(a.at)));
  return x;
}
/* ---- the detail for each channel (the right-hand panel) ---- */
function rsDMM(x){
  const {ed,eds,st,c,md}=x;
  if(!ed && x.edsAll.length) return '<div class="card rs-sec" id="rs-mm"><div class="ch"><h2>MISMO Matters</h2></div><div class="empty">'+((rsRange()[1]&&rsRange()[1]<rsMMStart())?'MISMO Matters\' numbers start with its first Higher Logic send, '+esc(rsDY(rsMMStart()))+'. Axios never shared numbers for the editions before it.':'No edition went out '+esc(rsPerIn())+'. The latest was '+esc(monthName(x.edLast.month))+'.')+'</div></div>';
  if(!ed) return '<div class="card rs-sec" id="rs-mm"><div class="ch"><h2>MISMO Matters</h2></div><div class="empty">Axios never shared numbers, so the first edition here is November 2026. Record its stats on the MISMO Matters page.</div></div>';
  const funnel='<div class="rs-funnel">'+[["Sent",c.r,""],["Delivered",c.dl,pct(c.r?c.dl/c.r:0)+" of sent"],["Opened",c.o,pct(c.openRate)+" of delivered"],["Clicked",c.c,pct(c.cto)+" of openers"]].map(([l,v,s],i)=>
    '<div class="rs-fstep"><div class="rs-fl"><b>'+l+'</b><span>'+rsN(v)+'</span></div><div class="rs-fb"><i style="width:'+Math.max(0.6,c.r?v/c.r*100:0)+'%;background:var(--c'+(i<2?1:i===2?3:2)+')"></i></div>'+(s?'<small>'+s+'</small>':'')+'</div>').join("")+'</div>';
  const wmax=Math.max(0.01,...md.waves.map(w=>w.dl?w.o/w.dl:0));
  const waves=md.waves.length?'<div class="rs-waves">'+md.waves.map(w=>{ const or=w.dl?w.o/w.dl:0, co=w.o?w.c/w.o:0; return '<div class="rs-wave" data-tip="'+esc(w.l+": "+rsN(w.sent)+" sent · "+rsN(w.dl)+" delivered · "+rsN(w.o)+" opened · "+rsN(w.c)+" clicked")+'"><div class="rs-wl"><b>'+esc(w.l)+'</b><span>'+rsN(w.sent)+' sent</span></div>'+
    '<div class="rs-wr"><span class="rs-wk">Opened</span><span class="rs-wb"><i style="width:'+Math.max(1,or/wmax*100)+'%;background:var(--c1)"></i></span><b>'+pct(or)+'</b></div>'+
    '<div class="rs-wr" title="of the people who opened"><span class="rs-wk">Clicked</span><span class="rs-wb"><i style="width:'+Math.max(1,co/Math.max(0.01,...md.waves.map(w2=>w2.o?w2.c/w2.o:0))*100)+'%;background:var(--c2)"></i></span><b>'+pct(co)+'</b></div></div>'; }).join("")+'<p class="rs-note">Opened is out of delivered; clicked is out of the people who opened.</p></div>'
    :'<div class="empty sm">Add each wave\'s numbers in Update Stats to compare them.</div>';
  const ndT=md.nd.hard+md.nd.blocked+md.nd.soft, bad=c.r-c.dl;
  const segs=[["Delivered",c.dl,"--c1"],["Didn't exist (hard bounce)",md.nd.hard,"--c2"],["Blocked by the company's filter",md.nd.blocked,"--c4"],["Temporary (soft bounce)",md.nd.soft,"--c5"]].filter(s=>s[1]);
  if(!ndT && bad>0) segs.push(["Didn't deliver",bad,"--c2"]);
  const deliv='<div class="rs-stack">'+segs.map(s=>'<i style="flex:'+s[1]+' 1 0;background:var('+s[2]+')" data-tip="'+esc(s[0]+": "+rsN(s[1])+" ("+pct(c.r?s[1]/c.r:0)+")")+'"></i>').join("")+'</div><div class="rs-legend col">'+segs.map(s=>'<span><i class="rs-k" style="background:var('+s[2]+')"></i>'+esc(s[0])+'<b>'+rsN(s[1])+'</b></span>').join("")+'</div>'+
    (md.nd.hard?'<p class="rs-note">The '+rsN(md.nd.hard)+' addresses that didn\'t exist were taken off the list after this send.</p>':'');
  const links=md.links.length?hbars(md.links.slice(0,8).map(l=>({l:l.l,v:l.v,c:"--c1"})),v=>v+" people"):'<div class="empty sm">Add the most-clicked links in Update Stats.</div>';
  const clients=md.clients.length?hbars(md.clients.map(l=>({l:l.l,v:l.v,c:"--c3"})),v=>v.toFixed(1)+"%"):'<div class="empty sm">Add where people opened it (desktop, mobile, webmail) in Update Stats.</div>';
  const unsubLine = (md.unsubsHL||md.unsubsPage) ? rsN(md.unsubsHL)+' in Higher Logic · '+rsN(md.unsubsPage)+' on MISMO\'s page' : '';
  const hist=eds.slice().reverse().map(e=>{ const s=statsCalc(edStats(e)); return '<tr'+(e.id===ed.id?' class="on"':'')+'><td>'+esc(monthName(e.month))+'</td><td class="n">'+rsN(s.r)+'</td><td class="n">'+rsN(s.dl)+'</td><td class="n">'+pct(s.openRate)+'</td><td class="n">'+pct(s.cto)+'</td><td class="n">'+rsN(s.u)+'</td></tr>'; }).join("");
  return '<div class="card rs-sec" id="rs-mm"><div class="ch"><h2>MISMO Matters · '+esc(monthName(ed.month))+'</h2><span class="note">'+(ed.dates&&ed.dates.publish?'sent '+esc(fS(ed.dates.publish))+' through Higher Logic':'')+(st.asOf?' · numbers as of '+esc(String(st.asOf).split(",")[0]):'')+'</span><span class="sp"></span>'+
      (eds.length>1?'<select class="plain" id="rs-ed" aria-label="Edition">'+eds.slice().reverse().map(e=>'<option value="'+esc(e.id)+'"'+(e.id===ed.id?' selected':'')+'>'+esc(monthName(e.month))+'</option>').join("")+'</select>':'')+
      '<button class="btn sm" type="button" id="rs-mmstats">Update Stats</button></div>'+
    rsKpis([{v:pct(c.openRate),k:"Open Rate",s:rsN(c.o)+" opened"},{v:pct(c.ctr),k:"Click Rate",s:rsN(c.c)+" clicked"},{v:pct(c.cto),k:"Click to Open",s:"of the people who opened"},{v:pct(c.r?c.dl/c.r:0),k:"Delivered",s:rsN(c.dl)+" of "+rsN(c.r)},
      {v:rsN(c.u),k:"Unsubscribes",s:unsubLine||pct(c.dl?c.u/c.dl:0)+" of delivered"}].concat(md.totalOpens?[{v:rsN(md.totalOpens),k:"Total Opens",s:(c.o?(md.totalOpens/c.o).toFixed(2):"0")+" per person who opened"}]:[]).concat(md.forwards?[{v:rsN(md.forwards),k:"Forwards",s:"passed along to someone else"}]:[]))+
    '<div class="rs-g3"><div class="rs-box"><h3>From Send to Click</h3>'+funnel+'</div><div class="rs-box"><h3>The Waves</h3>'+waves+'</div><div class="rs-box"><h3>Who It Reached</h3>'+deliv+'</div></div>'+
    '<div class="rs-g2"><div class="rs-box"><h3>Most-Clicked Links</h3>'+links+'</div><div class="rs-box"><h3>Where People Opened It</h3>'+clients+'</div></div>'+
    (hist?'<div class="rs-box rs-hist"><h3>Every Edition</h3><div class="tw"><table class="t"><thead><tr><th>Edition</th><th class="n">Sent</th><th class="n">Delivered</th><th class="n">Open Rate</th><th class="n">Click to Open</th><th class="n">Unsubscribes</th></tr></thead><tbody>'+hist+'</tbody></table></div><p class="rs-note">Axios never shared its numbers, so the record starts with November 2026.</p></div>':'')+
  '</div>';
}
function rsDMC(x){
  const {mc,mcY,mcO,yr,sum,mcOpen,mcClick}=x;
  if(!mc.length) return '<div class="card rs-sec" id="rs-mc"><div class="ch"><h2>Mailchimp</h2></div><div class="empty">No Mailchimp sends logged yet. Drop the Mailchimp campaigns export in Bring In the Numbers.</div></div>';
  const topics={}; mcY.forEach(m=>{ const t=topics[m.topic]||(topics[m.topic]={n:0,re:0,dl:0,o:0,c:0,u:0}); if(m.resend) t.re++; else { t.n++; t.o+=m.o; t.c+=m.c; t.dlO=(t.dlO||0)+m.dl; } t.dl+=m.dl; t.u+=m.u; });
  const tRows=Object.entries(topics).sort((a,b)=>b[1].dl-a[1].dl).map(([k,t])=>'<tr><td>'+esc(k)+'</td><td class="n nw">'+t.n+(t.re?' <small class="t2">+'+t.re+'</small>':'')+'</td><td class="n">'+rsN(t.dl)+'</td><td class="n">'+(t.dlO?pct(t.o/t.dlO):"—")+'</td><td class="n">'+(t.dlO?pct(t.c/t.dlO):"—")+'</td></tr>').join("");
  const lk={}; mcY.forEach(m=>(m.links||[]).forEach(([u,n])=>{ const k=String(u).replace(/^https?:\/\/(www\.)?/,"").replace(/[?#].*$/,"").replace(/\/$/,""); if(!/unsubscribe|list-manage|preferences/i.test(k)) lk[k]=(lk[k]||0)+(+n||0); }));
  const topL=Object.entries(lk).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([l,v])=>({l,v,c:"--c4"}));
  if(!mcY.length) return '<div class="card rs-sec" id="rs-mc"><div class="ch"><h2>Mailchimp · '+esc(yr)+'</h2></div><div class="empty">No Mailchimp sends '+esc(rsPerIn())+'. The latest went out '+esc(rsDY(mc[0].date||T()))+'.</div></div>';
  const shown=RS.mcAll?mcY:mcY.slice(0,12);
  const rows=shown.map(m=>'<tr><td class="nw">'+esc(fS(m.date))+'</td><td><b>'+esc(m.name.replace(/^Resend:\s*/i,""))+'</b>'+(m.resend?' <span class="rs-tag">Resend</span>':'')+'<small class="t2 rs-subj">'+esc(m.subject)+'</small></td><td class="n">'+rsN(m.dl)+'</td><td class="n">'+pct(m.or)+'</td><td class="n">'+pct(m.cr)+'</td><td class="n">'+rsN(m.u)+'</td></tr>').join("");
  return '<div class="card rs-sec" id="rs-mc"><div class="ch"><h2>Mailchimp · '+esc(yr)+'</h2><span class="note">'+mcO.length+' sends and '+(mcY.length-mcO.length)+' resends to people who didn\'t open the first time</span></div>'+
    rsKpis([{v:rsN(mcY.length),k:"Sends",s:mcO.length+" originals · "+(mcY.length-mcO.length)+" resends"},{v:rsN(sum(mcY,"dl")),k:"Delivered",s:pct(sum(mcY,"sent")?sum(mcY,"dl")/sum(mcY,"sent"):0)+" of sent"},
      {v:pct(mcOpen),k:"Open Rate",s:"first sends, all together",tip:"Opens divided by deliveries across every original send "+rsPerIn()},{v:pct(mcClick),k:"Click Rate",s:"first sends, all together"},
      {v:rsN(sum(mcY,"u")),k:"Unsubscribes",s:pct(sum(mcY,"dl")?sum(mcY,"u")/sum(mcY,"dl"):0)+" of delivered"},{v:pct(sum(mcY,"sent")?sum(mcY,"b")/sum(mcY,"sent"):0),k:"Bounce Rate",s:rsN(sum(mcY,"b"))+" bounced"}])+
    '<div class="rs-box"><h3>Open Rate for Every Send</h3>'+mcChart(mcY)+'</div>'+
    '<div class="rs-g2"><div class="rs-box"><h3>By Topic</h3><div class="tw"><table class="t"><thead><tr><th>Topic</th><th class="n" title="original sends, plus resends to people who didn&rsquo;t open">Sends</th><th class="n">Delivered</th><th class="n">Open</th><th class="n">Click</th></tr></thead><tbody>'+tRows+'</tbody></table></div></div>'+
      '<div class="rs-box"><h3>Most-Clicked Links</h3>'+(topL.length?hbars(topL,v=>v+" clicks"):'<div class="empty sm">No link clicks logged.</div>')+'</div></div>'+
    '<div class="rs-box rs-hist"><h3>Every Send</h3><div class="tw"><table class="t"><thead><tr><th>Sent</th><th>Campaign</th><th class="n">Delivered</th><th class="n">Open</th><th class="n">Click</th><th class="n">Unsubs</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
      (mcY.length>12?'<div class="rs-more"><button class="btn sm" type="button" id="rs-mcall">'+(RS.mcAll?"Show the Latest 12":"Show All "+mcY.length)+'</button></div>':'')+'</div>'+
  '</div>';
}
function rsDLI(x){
  const posts=x.li.map(p=>({d:p.date||"", l:x.liName(p), i:+p.impressions||0, c:+p.clicks||0, r:+p.reactions||0, u:p.postedUrl||""}))
    .concat(x.liEp.map(e=>({d:e.linkedinDate||"", l:"Mic'd Up Ep "+e.num+(e.title?": "+e.title:""), i:+e.liImpressions||0, c:+e.liClicks||0, r:+e.liReactions||0, u:e.linkedinUrl||""})))
    .sort((a,b)=>String(b.d).localeCompare(String(a.d)) || b.i-a.i);
  const tot=k=>posts.reduce((n,p)=>n+p[k],0), mo=x.pn;
  const dsum=k=>x.liMo.reduce((n,p)=>n+(+p[k]||0),0);
  const daily=x.liMo.length?'<div class="rs-box"><h3>The Whole Page Each Day · '+esc(mo)+'</h3><div class="rs-chart">'+(()=>{ const d=x.liMo, W=760, H=170, L=44, R=8, Tp=10, B=24, max=Math.max(1,...d.map(p=>+p.impressions||0)), top=Math.ceil(max/500)*500||500, bw=(W-L-R)/d.length;
        let g=''; for(let v=0; v<=top; v+=top/4){ const y=Tp+(1-v/top)*(H-Tp-B); g+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+y+'" y2="'+y+'" class="rs-grid"/><text x="'+(L-6)+'" y="'+(y+4)+'" class="rs-ax" text-anchor="end">'+rsN(v)+'</text>'; }
        return '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="LinkedIn page impressions each day">'+g+d.map((p,i)=>{ const v=+p.impressions||0, h=Math.max(1,v/top*(H-Tp-B)); return '<rect class="wt-bar" x="'+(L+i*bw+bw*0.15)+'" width="'+(bw*0.7)+'" y="'+(H-B-h)+'" height="'+h+'" rx="1.5" data-tip="'+esc(fS(p.date)+"\n"+rsN(v)+" impressions · "+rsN(p.clicks)+" clicks · "+rsN(p.reactions)+" reactions")+'"/>'+((i%Math.max(5,Math.ceil(d.length/12))===0||i===d.length-1)?'<text x="'+(L+i*bw+bw/2)+'" y="'+(H-7)+'" class="rs-ax" text-anchor="middle">'+(d.length>40?fS(p.date):+p.date.slice(8))+'</text>':''); }).join("")+'</svg>'; })()+
      '</div><p class="rs-note">Every post on MISMO\'s page added together, one bar a day. These come from the daily sheet of the LinkedIn export, so they can\'t say which post a day\'s views went to.</p></div>':'';
  return '<div class="card rs-sec" id="rs-li"><div class="ch"><h2>LinkedIn</h2><span class="note">MISMO\'s LinkedIn page · '+(typeof liLive==="function" && liLive() ? 'read from LinkedIn every 3 hours' : 'from the monthly export and impressions typed on a post')+'</span></div>'+
    ((posts.length||x.liMo.length)?rsKpis((x.liMo.length?[{v:rsN(x.liMoImp),k:"Page Impressions",s:x.pt+", every post together"},{v:rsN(dsum("clicks")),k:"Page Clicks",s:x.pt},{v:rsN(dsum("reactions")),k:"Page Reactions",s:x.pt},{v:x.liBest?rsN(x.liBest.impressions):"—",k:"Busiest Day",s:x.liBest?fS(x.liBest.date):""}]:[])
        .concat(posts.length?[{v:rsN(posts.length),k:"Posts Logged",s:rsN(tot("i"))+" impressions"}]:[])
        .concat(typeof liRun==="function" && liRun() && liRun().followers ? [{v:rsN(liRun().followers),k:"Followers",s:"read "+hhWhen(liRun().at)}] : []))+daily+
      (posts.length?'<div class="rs-box"><h3>Posts That Reached the Most People</h3>'+hbars(x.liAll.slice(0,10))+'</div>'+
        '<div class="rs-box rs-hist"><h3>Every Post</h3><div class="tw"><table class="t"><thead><tr><th>Posted</th><th>Post</th><th class="n">Impressions</th><th class="n">Clicks</th><th class="n">Reactions</th></tr></thead><tbody>'+
          posts.map(p=>'<tr><td class="nw">'+(p.d?esc(fS(p.d)):"—")+'</td><td>'+(/^https:\/\//.test(p.u)?'<a href="'+esc(p.u)+'" target="_blank" rel="noopener">'+esc(p.l)+'</a>':esc(p.l))+'</td><td class="n">'+rsN(p.i)+'</td><td class="n">'+rsN(p.c)+'</td><td class="n">'+rsN(p.r)+'</td></tr>').join("")+'</tbody></table></div></div>'
       :'<div class="rs-box"><h3>Which Posts Did Best</h3><div class="empty sm">No single posts are here yet: the export brought in so far only had the daily sheet. Drop the LinkedIn export again in Bring In the Numbers (with its All Posts tab) and each post comes in with its words, link and numbers.</div></div>')
    :'<div class="empty">'+(vals("pieces").some(p=>p.channel==="linkedin" && +p.impressions)?'No LinkedIn numbers '+esc(rsPerIn())+'. Pick another period above, or drop a newer export in Bring In the Numbers.':'Drop the LinkedIn export in Bring In the Numbers, or type impressions on a post.')+'</div>')+'</div>';
}
function rsDMU(x){
  const eps=vals("episodes").filter(e=>(epViews(e)||+e.spotifyPlays||+e.liImpressions) && rsIn(e.airDate)).sort((a,b)=>String(b.airDate||"").localeCompare(String(a.airDate||"")) || (+b.num||0)-(+a.num||0));
  const liT=x.liEp.reduce((n,e)=>n+(+e.liImpressions||0),0);
  return '<div class="card rs-sec" id="rs-mu"><div class="ch"><h2>Mic\'d Up</h2><span class="note">episodes aired '+esc(x.pt.charAt(0).toLowerCase()+x.pt.slice(1))+' · each episode\'s views and plays so far · YouTube fills in every morning</span></div>'+
    (eps.length?rsKpis([{v:rsN(x.ytViews),k:"YouTube Views",s:x.yt.length+" episodes"},{v:rsN(Math.round(x.ytViews/Math.max(1,x.yt.length))),k:"Views per Episode",s:"on average"}]
        .concat(x.sp.length?[{v:rsN(x.spPlays),k:"Spotify Plays",s:x.sp.length+" episodes"}]:[]).concat(liT?[{v:rsN(liT),k:"LinkedIn Impressions",s:x.liEp.length+" episode posts"}]:[]))+
      (x.yt.length?'<div class="rs-box"><h3>Most-Watched Episodes</h3>'+hbars(x.yt.slice(0,10).map(e=>({l:"Ep "+e.num+": "+(e.title||""),v:+e.views,c:"--c2",tip:"Ep "+e.num+": "+(e.title||"")+" · "+rsN(e.views)+" views"})))+'</div>':'')+
      '<div class="rs-box rs-hist"><h3>Every Episode</h3><div class="tw"><table class="t"><thead><tr><th>Aired</th><th>Episode</th><th class="n">YouTube</th><th class="n">Spotify</th><th class="n">LinkedIn</th></tr></thead><tbody>'+
        eps.map(e=>'<tr><td class="nw">'+(e.airDate?esc(fS(e.airDate)):"—")+'</td><td><b>Ep '+esc(e.num||"")+'</b> '+esc(e.title||"")+'</td><td class="n">'+(epViews(e)?rsN(epViews(e)):"—")+'</td><td class="n">'+(+e.spotifyPlays?rsN(e.spotifyPlays):"—")+'</td><td class="n">'+(+e.liImpressions?rsN(e.liImpressions):"—")+'</td></tr>').join("")+'</tbody></table></div></div>'
    :'<div class="empty">'+(vals("episodes").some(e=>epViews(e))?'No episodes aired '+esc(rsPerIn())+'.':'No episode numbers yet. YouTube views fill in every morning once the Results feed is running.')+'</div>')+'</div>';
}
function rsDLists(x){
  const see=(k,l)=>'<button class="btn sm" type="button" data-rs-people="'+k+'">'+l+'</button>';
  return '<div class="card rs-sec" id="rs-lists"><div class="ch"><h2>Who Is on Our Lists</h2><span class="sp"></span><button class="btn sm" type="button" data-go="people">Open Subscribers</button></div>'+
    rsKpis([{v:rsN(x.listSize),k:"MISMO Matters",s:x.ed?"the last edition went to":"on the list"},{v:rsN(x.web.length),k:"Website Sign-Ups",s:"May 1 to Sept 8, and since Nov 19"},{v:rsN(x.dls.length),k:"Downloaders",s:"work products"},{v:rsN(x.pros.length),k:"Prospects",s:"from Member 360"},{v:rsN(x.uns.length),k:"Unsubscribed",s:"on MISMO's page"}])+
    (RSP.range!=="all"?'<div class="rs-box"><h3>New '+esc(rsPerIn().replace(/^in /,"In ").replace(/^from /,"From ").replace(/^so far$/,""))+'</h3>'+rsKpis([{v:rsN(x.newSub),k:"Website Sign-Ups",s:"signed up in these dates"},{v:rsN(x.newDl),k:"New Downloaders",s:"first download in these dates"},{v:rsN(x.newUns),k:"Unsubscribed",s:"on MISMO's page in these dates"}])+'<p class="rs-note">The numbers above are the lists as of today; these are the people who joined or left '+esc(rsPerIn())+'. The old site\'s sign-up list (May 1 to Sept 8) has no dates, so only sign-ups on the new form count here.</p></div>':'')+
    '<div class="rs-box rs-src"><h3>Where the '+rsN(x.web.length)+' Website Sign-Ups Come From</h3>'+
      '<div class="rs-srow"><b>'+rsN(x.webOld)+'</b><span>signed up on the old mismo.org between May 1 and Sept 8, 2026 (the list exported from the old site)</span></div>'+
      '<div class="rs-srow"><b>'+rsN(x.webNew)+'</b><span>signed up on the new mismo.org form since it went live on Nov 19, 2026; new ones land here by themselves</span></div>'+
      '<p class="rs-note">Sign-ups on the old site between Sept 8 and Nov 19 were never exported, so they aren\'t here.</p>'+
      '<div class="rs-sbtn">'+see("subscribers","See the "+rsN(x.web.length)+" and Look Someone Up")+see("downloaders","See the Downloaders")+'</div></div>'+
    '<div class="rs-box"><h3>Sizes Side by Side</h3>'+hbars([{l:"MISMO Matters list (last send delivered to)",v:x.listSize,c:"--c1"},{l:"Mailchimp's largest send "+rsPerIn(),v:x.mcBig,c:"--c4"},{l:"Website sign-ups (mismo.org form)",v:x.web.length,c:"--c3"},{l:"Work product downloaders",v:x.dls.length,c:"--c6"},{l:"Prospects from Member 360",v:x.pros.length,c:"--c5"},{l:"Unsubscribed on MISMO's page",v:x.uns.length,c:"--c2"}].filter(i=>i.v))+
    '<p class="rs-note">The full MISMO Matters list is the people the last edition went to.</p></div></div>';
}
/* What People Download follows the Results period. Website pop-up downloads count on the day of each person's first
   and latest download of that work product; the old site's list kept only each person's first and last download dates,
   so a person from it counts when either date falls in the period. */
function rsDlData(x){
  if(RSP.range==="all") return {dls:x.dls.length, what:x.what, approx:false};
  const who={}, what={}; let approx=false;
  const hit=(e,w)=>{ e=(e||"").toLowerCase(); if(!e||!w) return; who[e]=1; (what[w]=what[w]||{})[e]=1; };
  audienceRows("downloaders").forEach(r=>{ if(!(rsIn(r.f)||rsIn(r.l))) return; if(r.f && r.l && r.f!==r.l) approx=true; (r.x||[]).forEach(w=>hit(r.e,w)); });
  vals("wpdl").forEach(r=>{ if(rsIn(r.at)||rsIn(r.firstAt)) hit(r.e, r.product||r.pid||r.file); });
  const list=Object.entries(what).map(([l,m])=>[l,Object.keys(m).length]).sort((a,b)=>b[1]-a[1]).map(([l,v])=>({l,v,c:"--c6",tip:l+" · "+v+" people"}));
  return {dls:Object.keys(who).length, what:list, approx};
}
function rsDDl(x){
  const d=x.dl, any=x.what.length, when=RSP.range==="all"?"":rsPerText();
  return '<div class="card rs-sec" id="rs-dl"><div class="ch"><h2>What People Download</h2><span class="note">non-member downloads of MISMO work products from mismo.org</span><span class="sp"></span><button class="btn sm" type="button" data-go="people">Open Downloaders</button></div>'+
    (!any?'<div class="empty">Load the website downloader list on Subscribers &amp; Downloaders.</div>'
    :!d.what.length?'<div class="empty">No downloads '+esc(rsPerIn())+'.</div>'
    :rsKpis([{v:rsN(d.dls),k:"People",s:"downloaded at least one"},{v:rsN(d.what.length),k:"Work Products",s:"downloaded at least once"},{v:(d.what.reduce((n,w)=>n+w.v,0)/Math.max(1,d.dls)).toFixed(1),k:"Per Person",s:"work products on average"}])+
      '<div class="rs-box"><h3>Every Work Product, Most Downloaded First'+(when?' · '+esc(when):'')+'</h3>'+hbars(d.what.slice(0,40),v=>v+" people")+(d.what.length>40?'<p class="rs-note">The top 40 of '+d.what.length+'.</p>':'')+
      (d.approx?'<p class="rs-note">The old website\'s list kept only each person\'s first and last download dates, so its people count here when either date is in the period, with everything they downloaded.</p>':'')+'</div>')+'</div>';
}
function rsDTools(x){
  return '<div class="card rs-sec rs-tools" id="rs-tools"><div class="ch"><h2>Bring In the Numbers</h2><span class="note">drop the file each platform exports; rows are matched to what\'s already here</span></div><div class="cb">'+
      '<div class="feedrow">'+RS_FEEDS.map(([k,l])=>{ const on=rsFeedOn(k); return '<div class="feedst"><span class="fdot'+(on?" on":"")+'"></span><b>'+l+'</b><small>'+esc(rsFeedSay(k))+'</small></div>'; }).join("")+'</div>'+
      '<div class="fgrid" style="margin-top:14px">'+
      '<div class="field"><label class="flabel" for="rs-yt">YouTube Studio Export</label><input type="file" id="rs-yt" accept=".csv,.xlsx"><span class="hint">Analytics › Advanced mode › Content › Export. Matched to episodes by the number in the title.</span></div>'+
      '<div class="field"><label class="flabel" for="rs-lifile">LinkedIn Page Analytics Export</label><input type="file" id="rs-lifile" accept=".csv,.xlsx,.xls"><span class="hint">MISMO page › Analytics › Content › Export (the All Posts tab). Matched by post link or date.</span></div>'+
      '<div class="field"><label class="flabel" for="rs-mcfile">Mailchimp Campaigns Export</label><input type="file" id="rs-mcfile" accept=".csv,.xlsx"><span class="hint">Campaigns › Reports › Export. Matched by subject and send date.</span></div>'+
    '</div><p class="hint" id="rs-msg" style="margin-top:10px">'+esc(RS.msg||"")+'</p></div></div>'+(x.due?'':mnCard());
}
/* the channels that can fill themselves: YouTube (every morning) and LinkedIn (every 3 hours) do; MISMO Matters
   (Higher Logic) and Mailchimp come in by hand */
const RS_FEEDS=[["youtube","YouTube"],["linkedin","LinkedIn"],["matters","MISMO Matters"],["mailchimp","Mailchimp"]];
function rsFeedOn(k){ return k==="linkedin" ? (typeof liLive==="function" && liLive()) : k==="mailchimp" ? ((typeof mcLive==="function" && mcLive()) || !!feed(k)) : !!feed(k); }
function rsFeedSay(k){
  if(k==="linkedin"){ const r=typeof liRun==="function"?liRun():null; return rsFeedOn(k)?"Automatic, every 3 hours"+(r&&r.lastOk?" · last "+wtStamp(r.lastOk):""):"Not reading right now: drop the export by hand"; }
  if(k==="mailchimp" && typeof mcLive==="function" && mcLive()) return "Automatic, every 6 hours · last "+wtStamp(mcRun().lastOk);
  if(feed(k)) return "Automatic, every morning · last "+feedAge(k);
  return k==="matters"?"By hand: Record Stats from Higher Logic's report":k==="mailchimp"?"By hand: drop the campaigns export":"By hand";
}
const RS_SEC={
  mm:{t:x=>x.ed?"MISMO Matters · "+monthName(x.ed.month):"MISMO Matters", d:rsDMM},
  mc:{t:x=>"Mailchimp · "+x.yr, d:rsDMC},
  web:{t:()=>"Website · www.mismo.org", d:()=>rsWebsite()},
  li:{t:()=>"LinkedIn", d:rsDLI},
  mu:{t:()=>"Mic'd Up", d:rsDMU},
  voices:{t:()=>"What Visitors Told Us", d:()=>rsVoices(true)},
  lists:{t:()=>"Who Is on Our Lists", d:rsDLists},
  dl:{t:()=>"What People Download", d:rsDDl},
  tools:{t:()=>"Bring In the Numbers", d:rsDTools}
};
/* ---- the cards ---- */
function rsMini(items, fmt){
  if(!items.length) return '';
  const max=Math.max(...items.map(i=>i.v))||1;
  return '<span class="rs-mini">'+items.map(i=>'<span class="rs-mr"><span class="rs-mlb">'+esc(i.l)+'</span><span class="rs-mb"><i style="width:'+Math.max(2,i.v/max*100)+'%;background:var('+(i.c||"--c1")+')"></i></span><b>'+(fmt?fmt(i.v):rsN(i.v))+'</b></span>').join("")+'</span>';
}
/* a small picture of a run of numbers: a line, or bars */
function rsSpark(v, color, bars){
  if(v.length<2) return '';
  const W=240, H=48, max=Math.max(...v)||1, min=bars?0:Math.min(...v), rng=(max-min)||1, n=v.length;
  if(bars){ const bw=W/n; return '<svg class="rs-spark" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" aria-hidden="true">'+v.map((y,i)=>'<rect x="'+(i*bw+bw*0.15)+'" width="'+(bw*0.7)+'" y="'+(H-Math.max(1.5,y/max*(H-2)))+'" height="'+Math.max(1.5,y/max*(H-2))+'" rx="1" style="fill:var('+color+')"/>').join("")+'</svg>'; }
  const X=i=>i/(n-1)*W, Y=y=>4+(1-(y-min)/rng)*(H-8);
  return '<svg class="rs-spark" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" aria-hidden="true"><polyline points="'+v.map((y,i)=>X(i)+","+Y(y)).join(" ")+'" style="fill:none;stroke:var('+color+');stroke-width:2;vector-effect:non-scaling-stroke"/></svg>';
}
function rsCard(k, o){
  return '<button class="res-card'+(PANE&&PANE.rsKey===k?' on':'')+'" type="button" data-rs-open="'+k+'" style="--rc:var('+o.color+')" aria-label="'+esc(o.eye+": "+o.v+" "+o.vk+". Open the details")+'">'+
    '<span class="rs-ctop"><span class="rs-ce">'+esc(o.eye)+'</span>'+rsSrcChip(k)+'</span>'+
    '<span class="rs-cv"><b>'+o.v+'</b><span>'+esc(o.vk)+'</span></span>'+
    '<span class="rs-cz">'+(o.viz||'<span class="rs-cq">'+esc(o.none||"Nothing to show yet")+'</span>')+'</span>'+
    '<span class="rs-cl">'+o.rows.filter(Boolean).map(([a,b])=>'<span class="rs-crow"><span>'+esc(a)+'</span><b>'+b+'</b></span>').join("")+'</span>'+
    (()=>{ const sr=rsSrc(k); return sr&&sr.w?'<span class="rs-csrc">'+esc(sr.w.charAt(0).toUpperCase()+sr.w.slice(1))+'</span>':''; })()+
    '<span class="rs-cf">'+esc(o.more)+'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3l5 5-5 5"/></svg></span></button>';
}
function rsCards(x){
  const {c,ed,mcY,mcO,sum}=x;
  const drop=((S.websiteproblems||{})._dropped||{}).total||0;
  const wl=x.wt.filter(d=>d.pages), top=wl.length?wtSum(wl,"pages")[0]:null;
  const mcSpark=mcO.filter(m=>m.date && m.dl>=1000).sort((a,b)=>a.date.localeCompare(b.date)).map(m=>m.or*100);
  const newest=x.fb[0]||x.pr[0]||null;
  const cards=[
    rsCard("mm",{eye:ed?"MISMO Matters · "+monthName(ed.month):"MISMO Matters", color:"--c1", v:ed?pct(c.openRate):"—", vk:ed?"opened it":x.edsAll.length?((rsRange()[1]&&rsRange()[1]<rsMMStart())?"numbers start "+rsDY(rsMMStart()):"no edition "+rsPerIn()):"from November on",
      viz:ed?rsMini([{l:"Delivered",v:c.dl,c:"--c1"},{l:"Opened",v:c.o,c:"--c3"},{l:"Clicked",v:c.c,c:"--c2"}]):"", none:x.edsAll.length?"Pick another period to see an edition":"Record the November stats on the MISMO Matters page",
      rows:ed?[["Sent to",rsN(c.r)],["Click to open",pct(c.cto)],["Unsubscribes",rsN(c.u)]]:[], more:"Waves, delivery, links and every edition"}),
    rsCard("mc",{eye:"Mailchimp · "+x.yr, color:"--c4", v:mcO.length?pct(x.mcOpen):"—", vk:"open rate, first sends",
      viz:rsSpark(mcSpark,"--c4"), none:mcY.length?"Open rate over time shows after two larger sends":x.mc.length?"No sends "+rsPerIn():"No sends logged yet",
      rows:[["Sends",mcO.length+(mcY.length-mcO.length?' + '+(mcY.length-mcO.length)+' resends':'')],["Delivered",rsN(sum(mcY,"dl"))],["Unsubscribes",rsN(sum(mcY,"u"))]], more:"Every send, topics and top links"}),
    rsCard("web",{eye:"Website · www.mismo.org", color:"--c1", v:x.wt.length?rsN(x.wtVisits):"—", vk:x.wt.length?"visits, "+x.pt.charAt(0).toLowerCase()+x.pt.slice(1):"counting from Nov 20, 2026",
      viz:rsSpark(x.wt.map(d=>+d.visits||0),"--c1",true), none:x.wt.length?"A picture of each day shows from the second day":wtDays().length?"No counts "+rsPerIn()+" (Cloudflare starts Nov 20, 2026)":"The first nightly count arrives Nov 21",
      rows:[(()=>{ const l=x.wt[x.wt.length-1]; return l&&l.partial?["Today so far",rsN(l.visits)+' <small class="t2">as of '+esc(wtTime(l.pulledAt))+'</small>']:["Page views",rsN(x.wtViews)]; })(),["Pages per visit",x.wtVisits?(x.wtViews/x.wtVisits).toFixed(1):"—"],["Top page",top?esc(top.k||"/"):"—"],["Updated",(typeof wtUpdated==="function"&&wtUpdated())?esc(wtUpdated()):"—"]], more:"Each day, top pages, sources and devices"}),
    rsCard("li",{eye:"LinkedIn", color:"--c3", v:rsN(x.liMo.length?x.liMoImp:x.liImp), vk:x.liMo.length?"page impressions, "+x.pn:"impressions, "+x.pn,
      viz:x.liAll.length?rsMini(x.liAll.slice(0,3).map(i=>({l:i.l,v:i.v,c:"--c3"}))):rsSpark(x.liMo.map(p=>+p.impressions||0),"--c3",true), none:"Drop the LinkedIn export in Bring In the Numbers",
      rows:[["Busiest day",x.liBest?esc(fS(x.liBest.date))+" · "+rsN(x.liBest.impressions):"—"],["Posts logged",x.liAll.length?rsN(x.liAll.length):'<span class="rs-due">none yet</span>'],(typeof liRun==="function" && liRun() && liRun().followers ? ["Followers",rsN(liRun().followers)] : ["Clicks",rsN(x.liMo.reduce((n,p)=>n+(+p.clicks||0),0)||x.li.reduce((n,p)=>n+(+p.clicks||0),0))])], more:x.liAll.length?"Every post and what reached the most people":"Each day, and how to bring in single posts"}),
    rsCard("mu",{eye:"Mic'd Up", color:"--c2", v:rsN(x.ytViews), vk:"YouTube views, episodes aired "+rsPerIn(), viz:rsMini(x.yt.slice(0,3).map(e=>({l:"Ep "+e.num+": "+(e.title||""),v:+e.views,c:"--c2"}))), none:"YouTube views fill in every morning",
      rows:[["Episodes on YouTube",rsN(x.yt.length)],(MU_PAUSED.spotify&&!x.sp.length)?null:["Spotify plays",x.sp.length?rsN(x.spPlays):"—"],["LinkedIn impressions",rsN(x.liEp.reduce((n,e)=>n+(+e.liImpressions||0),0))]], more:"Every episode on YouTube, Spotify and LinkedIn"}),
    rsCard("voices",{eye:"What Visitors Told Us", color:"--c5", v:rsN(x.fb.length+x.pr.length), vk:rsPerIn(),
      viz:newest?'<span class="rs-cq">“'+esc(String(newest.comment||newest.message).slice(0,140))+'”</span>':"", none:"Nothing yet. Comments and problem reports land here",
      rows:[["AI answers marked not helpful",rsN(x.fb.length)],["Website problems",rsN(x.pr.length)],drop?["Spam dropped",rsN(drop)]:null], more:"Every comment and problem report"}),
    rsCard("lists",{eye:"Our Lists", color:"--c6", v:rsN(x.listSize), vk:"on the MISMO Matters list today", viz:rsMini([{l:"Mailchimp's largest send",v:x.mcBig,c:"--c4"},{l:"Website sign-ups",v:x.web.length,c:"--c3"},{l:"Downloaders",v:x.dls.length,c:"--c6"}].filter(i=>i.v)),
      rows:(RSP.range!=="all"?[["New sign-ups "+rsPerIn(),rsN(x.newSub)],["New downloaders",rsN(x.newDl)],["Unsubscribed",rsN(x.newUns)]]:[["Website sign-ups, old site (May–Sept 8)",rsN(x.webOld)],["Website sign-ups, new form (since Nov 19)",rsN(x.webNew)],["Prospects from Member 360",rsN(x.pros.length)]]), more:"Every list, and who is on each"}),
    rsCard("dl",{eye:"What People Download", color:"--c6", v:rsN(x.dl.dls), vk:"people downloaded "+rsPerIn(), viz:rsMini(x.dl.what.slice(0,3),v=>rsN(v)), none:x.what.length?"No downloads "+rsPerIn():"Load the downloader list on Subscribers & Downloaders",
      rows:[["Work products downloaded",rsN(x.dl.what.length)]], more:"Every work product, most downloaded first"}),
    (typeof mymCard==="function"?mymCard():""),
    rsCard("tools",{eye:"Bring In the Numbers", color:"--c4", v:RS_FEEDS.filter(([k])=>rsFeedOn(k)).length+" of "+RS_FEEDS.length, vk:"come in by themselves",
      viz:'<span class="rs-feeds">'+RS_FEEDS.map(([k,l])=>'<span><i class="fdot'+(rsFeedOn(k)?" on":"")+'"></i>'+l+'<small>'+(rsFeedOn(k)?(k==="linkedin"?"every 3 hours":k==="mailchimp"&&typeof mcLive==="function"&&mcLive()?"every 6 hours":"every morning"):"by hand")+'</small></span>').join("")+'</span>',
      rows:[[mnName(x.per)+" numbers",x.due?'<span class="rs-due">'+mnOpen(x.per).length+' still due</span>':'all in']], more:"Drop an export from YouTube, LinkedIn or Mailchimp"})
  ];
  return '<div class="res-cards" id="res-cards">'+cards.join("")+'</div>';
}
/* ---- the right-hand panel ---- */
function rsRailHtml(k,x){ return '<div class="rs-rail">'+rsSrcBox(k)+(k!=="tools"&&k!=="mymismo"?'<div class="rs-perbar">'+rsPicker("rspr",k==="mm")+'</div>':'')+RS_SEC[k].d(x)+'</div>'; }
function rsOpen(k){
  if(!RS_SEC[k]) return;
  const x=rsCtx(), i=RS_ORDER.indexOf(k), prev=RS_ORDER[(i+RS_ORDER.length-1)%RS_ORDER.length], next=RS_ORDER[(i+1)%RS_ORDER.length];
  openPane({eye:"Results", title:RS_SEC[k].t(x), data:{}, fields:[], noFocus:true, extra:rsRailHtml(k,x),
    buttons:[{label:"‹ "+RS_SEC[prev].t(x), run:()=>rsOpen(prev)},{label:RS_SEC[next].t(x)+" ›", run:()=>rsOpen(next)}],
    after:b=>rsWireRail(b)});
  PANE.rsKey=k;
  $$("#res-cards .res-card").forEach(c=>c.classList.toggle("on", c.dataset.rsOpen===k));
  const t=$("#pane-title"); if(t){ t.setAttribute("tabindex","-1"); setTimeout(()=>{ try{ t.focus({preventScroll:true}); }catch(e){} },60); }
}
/* the data changed while the panel is open: refresh what it shows, where it was scrolled to */
function rsRefreshRail(){
  if(!PANE || !PANE.rsKey || !RS_SEC[PANE.rsKey]) return;
  const b=$("#pane-body"), y=b.scrollTop, x=rsCtx();
  $("#pane-title").textContent=RS_SEC[PANE.rsKey].t(x);
  b.innerHTML=rsRailHtml(PANE.rsKey,x); rsWireRail(b); b.scrollTop=y;
}
function rsWireRail(b){
  $$("[data-go]",b).forEach(g=>g.onclick=()=>{ closePane(true); go(g.dataset.go); });
  /* straight to that list on Subscribers & Downloaders, with the search box ready */
  $$("[data-rs-people]",b).forEach(g=>g.onclick=()=>{ PL.list=g.dataset.rsPeople; PL.q=""; PL.limit=150; closePane(true); go("people"); setTimeout(()=>{ const q=$("#pp-q"); if(q) try{ q.focus(); }catch(e){} },120); });
  const x=rsCtx();
  const mms=$("#rs-mmstats",b); if(mms && x.ed) mms.onclick=()=>openStats(x.ed);
  const pick=$("#rs-ed",b); if(pick) pick.onchange=()=>{ RS.ed=pick.value; renderResults(); };
  const all=$("#rs-mcall",b); if(all) all.onclick=()=>{ RS.mcAll=!RS.mcAll; rsRefreshRail(); };
  rsPerWire(b); rsTips(b); mnWire(b); rsWireTools(b);
}
function renderResults(){
  const el=$("#page-results"), x=rsCtx();
  const say = x.ed||x.mcY.length ? (x.ed?'MISMO Matters reached <em>'+rsN(x.c.dl)+'</em> inboxes in '+esc(monthName(x.ed.month))+' and '+rsN(x.c.o)+' people opened it. ':'')+'Mailchimp sent '+x.mcY.length+' email'+(x.mcY.length===1?'':'s')+' '+esc(rsPerIn())+(x.mcO.length?', opened by '+pct(x.mcOpen)+' of people on average':'')+'. All told, <em>'+rsN(x.emailsYr)+'</em> emails delivered '+esc(rsPerIn())+'.'
    : (x.mc.length||x.li.length||x.yt.length ? 'Here is how each channel is doing from the numbers brought in so far.' : 'No results brought in yet. Bring In the Numbers has the tools.');
  el.innerHTML='<div class="phead rs-head"><div><div class="eyebrow">How Marketing Is Landing</div><h1>Results</h1></div>'+(x.due?'':rsMonthStrip())+'</div>'+
    (x.due?mnCard():'')+'<div class="band rs-band"><div class="rs-bandtop"><div class="today">Results · '+esc(fS(T()))+'</div>'+rsPicker("rsp")+'</div><div class="say">'+say+'</div>'+rsSrcKey()+'<div class="rs-hint">Press any card for the full detail and where its numbers come from.</div></div>'+rsCards(x);
  $$("[data-rs-open]",el).forEach(b=>b.onclick=()=>rsOpen(b.dataset.rsOpen));
  rsPerWire(el); mnWire(el); if(LOADED.has("monthly") || !LIVE) setTimeout(()=>{ if(TAB==="results") mnPopup("results"); },400);
  rsRefreshRail();
}
/* bringing the numbers in: the export drops (now in the Bring In the Numbers panel) */
function rsWireTools(root){
  const msg=$("#rs-msg",root), say=t=>{ RS.msg=t; if(msg) msg.textContent=t; };
  const yt=$("#rs-yt",root), li=$("#rs-lifile",root), mc=$("#rs-mcfile",root);
  if(yt) yt.onchange=async e=>{ const f=e.target.files[0]; if(!f) return; try{ const rows=await readSheet(f); let n=0, miss=[];
    for(const r of rows){ const title=col(r,/title|content|video/i); const m=title.match(/ep(?:isode)?\.?\s*(\d{1,3})/i); if(!m) continue; const ep=vals("episodes").find(q=>+q.num===+m[1]); if(!ep){ miss.push(m[1]); continue; }
      const views=num(col(r,/^views$/i)), hrs=num(col(r,/watch time/i)), likes=num(col(r,/likes/i));
      await patch("episodes",ep.id,{views, watchHours:hrs, likes, youtubeDone:true}); n++; }
    if(n) await mnMarkFile("yt");
    say(n+" episode"+(n===1?"":"s")+" updated from YouTube."+(miss.length?" Not logged here yet: Ep "+miss.join(", "):"")); }catch(err){ say(err.message); } };
  if(li) li.onchange=async e=>{ const f=e.target.files[0]; if(!f) return; try{ const sheets=await readSheets(f); let n=0, added=0, days=0;
    /* All posts: one row a post, with its title and link. The daily sheet: one row a day for the whole page. */
    const postsSheet=sheets.find(x=>x.head.some(h=>/^post (title|link)$/i.test(h))) || (sheets.length===1 && !sheets[0].head.some(h=>/^date$/i.test(h)) ? sheets[0] : null);
    const daySheet=sheets.find(x=>x!==postsSheet && x.head.some(h=>/^date$/i.test(h)) && x.head.some(h=>/impressions/i.test(h)));
    for(const r of (postsSheet?postsSheet.rows:[])){ const link=col(r,/^post link$/i,/link|url/i), text=col(r,/^post title$/i,/title|update|commentary|content/i), d=isoFrom(col(r,/^created date$/i,/created/i,/^date$/i));
      const st={impressions:num(col(r,/^impressions$/i,/^impressions/i)), clicks:num(col(r,/^clicks$/i,/^clicks/i)), reactions:num(col(r,/^likes$/i,/reactions|likes/i)), comments:num(col(r,/^comments$/i,/comments/i)), reposts:num(col(r,/^reposts$/i,/reposts|shares/i))};
      if(!st.impressions && !text) continue;
      const ep=vals("episodes").find(q=>(q.linkedinUrl&&link&&q.linkedinUrl===link) || (/mic.?d up/i.test(text) && q.num && new RegExp("(ep(isode)?\\.?\\s*)"+q.num+"\\b","i").test(text)));
      if(ep){ await patch("episodes",ep.id,{liImpressions:st.impressions, liClicks:st.clicks, liReactions:st.reactions, linkedinDone:true, linkedinUrl:ep.linkedinUrl||link}); n++; continue; }
      const p=vals("pieces").find(q=>q.channel==="linkedin" && !liIsDay(q) && ((q.postedUrl&&q.postedUrl===link) || (d && q.date===d && text && q.title && text.toLowerCase().includes(q.title.toLowerCase().slice(0,25)))));
      if(p){ await patch("pieces",p.id,Object.assign({status:"done"},p.postedUrl?{}:{postedUrl:link},p.copy?{}:{copy:text},st)); n++; }
      else { await put("pieces",uid("p"),Object.assign({channel:"linkedin",title:text.split("\n")[0].slice(0,90)||"LinkedIn post",copy:text,date:d,status:"done",postedUrl:link,kind:/\bin the news\b|#inthenews\b/i.test(text)?"In the News":"Other",owner:""},st)); added++; } }
    for(const r of (daySheet?daySheet.rows:[])){ const d=isoFrom(col(r,/^date$/i)); if(!d) continue;
      const st={impressions:num(col(r,/^impressions \(total\)/i,/^impressions/i)), clicks:num(col(r,/^clicks \(total\)/i,/^clicks/i)), reactions:num(col(r,/^reactions \(total\)/i,/reactions|likes/i)), comments:num(col(r,/^comments \(total\)/i,/comments/i)), reposts:num(col(r,/^reposts \(total\)/i,/reposts|shares/i))};
      const had=vals("pieces").find(q=>q.channel==="linkedin" && liIsDay(q) && q.date===d);
      if(had) await patch("pieces",had.id,st); else await put("pieces",uid("p"),Object.assign({channel:"linkedin",title:"LinkedIn page, "+fS(d),date:d,status:"done",kind:"Daily totals",owner:""},st)); days++; }
    if(n+added+days) await mnMarkFile("li");
    say(n+" posts matched and "+added+" new posts brought in"+(days?", plus the page's totals for "+days+" day"+(days===1?"":"s"):"")+"."+(postsSheet?"":" This file had no All Posts sheet, so no posts came in; export with the All Posts tab.")); }catch(err){ say(err.message); } };
  if(mc) mc.onchange=async e=>{ const f=e.target.files[0]; if(!f) return; try{ const rows=await readSheet(f); let n=0, added=0;
    for(const r of rows){ const subj=col(r,/subject|title|campaign/i), d=isoFrom(col(r,/send date|sent|date/i)); if(!subj) continue;
      const st={sent:num(col(r,/total recipients|recipients|emails sent|sent to/i)), opens:num(col(r,/unique opens|opens/i)), clicks:num(col(r,/unique clicks|clicks/i)), unsubs:num(col(r,/unsub/i)), audience:col(r,/list|audience/i)};
      const p=vals("pieces").find(q=>q.channel==="mailchimp" && q.title && q.title.toLowerCase()===subj.toLowerCase());
      if(p){ await patch("pieces",p.id,Object.assign({status:"done"},st)); n++; } else { await put("pieces",uid("p"),Object.assign({channel:"mailchimp",title:subj,date:d,status:"done"},st)); added++; } }
    if(n+added) await mnMarkFile("mc");
    say(n+" matched and "+added+" new Mailchimp sends brought in."); }catch(err){ say(err.message); } };
}
