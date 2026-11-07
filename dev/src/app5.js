
/* ================= People: subscribers and downloaders ================= */
const PEOPLE_LISTS = {subscribers:"Website Subscribers", downloaders:"Website Downloaders", prospects:"Prospects", matters:"MISMO Matters Group", unsubscribed:"Unsubscribed"};
const PL = {q:"", list:"all", limit:150};
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
    ["n","o","t"].forEach(k=>{ if(!p[k] && r[k]) p[k]=r[k]; }); p.lists.subscribers=true; p.signup=r; const d=String(r.at||"").slice(0,10); if(d>p.last) p.last=d; });
  /* anyone who unsubscribed on MISMO's page comes off the subscriber lists automatically */
  const U=unsubMap();
  Object.values(U).forEach(u=>{ const e=u.e.toLowerCase(); const p=map[e]||(map[e]={e, n:"", o:"", t:"", lists:{}, last:"", x:[], c:0});
    if(isUnsubbed(e, p.signup && p.signup.at, U)){ delete p.lists.subscribers; delete p.lists.matters; p.lists.unsubscribed=true; p.unsub=u; const d=String(u.at||"").slice(0,10); if(d>p.last) p.last=d; } });
  return Object.values(map);
}
/* sign-ups from the website form, newest first */
function signupsSorted(){ const U=unsubMap(); return vals("signups").filter(s=>!isUnsubbed(s.e, s.at, U)).sort((a,b)=>String(b.at||"").localeCompare(String(a.at||""))); }
const HLST = {added:["In Higher Logic","ok"], pending:["Not in Higher Logic Yet","review"], failed:["Higher Logic Refused","changes"]};
function signupCSV(list){ const q=v=>'"'+String(v||"").replace(/"/g,'""')+'"'; return ["Email,First Name,Last Name,Company,Job Title,Topics,Signed Up"].concat(list.map(s=>[s.e,s.first,s.last,s.o,s.t,(s.topics||[]).join("; "),String(s.at||"").slice(0,10)].map(q).join(","))).join("\n"); }
function signupsCard(){
  const list=signupsSorted(), t=T(), wk=list.filter(s=>String(s.at||"").slice(0,10)>=add(t,-6)).length, notHL=list.filter(s=>s.hl!=="added");
  return '<div class="card" style="margin-bottom:22px"><div class="ch"><h2>Website Sign-Ups</h2><span class="cnt">'+list.length+'</span><span class="note">'+wk+' this week · from resources.mismo.org/forms/subscribe/</span><div class="r"><a class="btn sm" href="'+SUBSCRIBE_URL+'" target="_blank" rel="noopener">Open Subscribe Form&nbsp;↗</a><button class="btn sm" type="button" id="su-link">Copy Form Link</button>'+(notHL.length?'<button class="btn sm" type="button" id="su-csv">Copy '+notHL.length+' for Higher Logic</button>':'')+'</div></div>'+
    (list.length?'<div class="tw"><table class="t"><thead><tr><th>Signed Up</th><th>Name</th><th>Email</th><th>Company</th><th>Interests</th><th>Higher Logic</th></tr></thead><tbody>'+
      list.slice(0,25).map(s=>'<tr class="click" data-pe="'+esc(s.e)+'"><td><b>'+esc(fS(String(s.at||"").slice(0,10)))+'</b></td><td>'+esc(s.n||"")+(s.t?'<span class="t2">'+esc(s.t)+'</span>':'')+'</td><td>'+esc(s.e)+'</td><td>'+esc(s.o||"")+'</td><td class="note">'+esc((s.topics||[]).join(", "))+'</td><td>'+chip(HLST,s.hl||"pending")+'</td></tr>').join("")+'</tbody></table></div>'
    :'<div class="empty">Sign-ups from the new Subscribe form land here the moment someone presses Subscribe, marked Pending until they are added to the MISMO Matters list in Higher Logic.</div>')+'</div>';
}
const UNST = {pending:["Still in Higher Logic","review"], removed:["Removed in Higher Logic","ok"]};
function unsubsCard(){
  const list=unsubsSorted(), t=T(), wk=list.filter(u=>String(u.at||"").slice(0,10)>=add(t,-6)).length, todo=list.filter(u=>unsubHL(u)==="pending");
  return '<div class="card" style="margin-bottom:22px"><div class="ch"><h2>Unsubscribes</h2><span class="cnt">'+list.length+'</span><span class="note">'+wk+' this week · from resources.mismo.org/forms/unsubscribe/</span><div class="r"><a class="btn sm" href="'+UNSUB_URL+'" target="_blank" rel="noopener">Open Unsubscribe Page&nbsp;↗</a>'+
      (todo.length?'<button class="btn sm" type="button" id="un-csv">Copy '+todo.length+' for Higher Logic</button><button class="btn sm pri" type="button" id="un-done">Mark Removed in Higher Logic</button>':'')+'</div></div>'+
    (list.length?'<div class="tw"><table class="t"><thead><tr><th>Unsubscribed</th><th>Email</th><th>Name</th><th>Why</th><th>Higher Logic</th></tr></thead><tbody>'+
      list.slice(0,25).map(u=>{ const s=vals("signups").find(x=>(x.e||"").toLowerCase()===u.e); return '<tr class="click" data-pe="'+esc(u.e)+'"><td><b>'+esc(fS(String(u.at||"").slice(0,10)))+'</b></td><td>'+esc(u.e)+'</td><td>'+esc(s&&s.n||"")+'</td><td class="note">'+esc((u.reasons||[]).join(", ")||"—")+'</td><td>'+chip(UNST,unsubHL(u))+'</td></tr>'; }).join("")+'</tbody></table></div>'
    :'<div class="empty">Anyone who uses the Unsubscribe link at the bottom of MISMO Matters lands here and comes off the subscriber list right away.</div>')+
    (todo.length?'<div class="cb"><div class="hint">Until Higher Logic\'s marketing API is connected, opt these people out in Informz before the next send: Copy for Higher Logic, import them as unsubscribes, then press Mark Removed.</div></div>':'')+'</div>';
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
async function readSheet(file){
  await loadXLSX();
  return new Promise((res,rej)=>{
    const fr=new FileReader();
    fr.onload=()=>{ try{
      const wb=XLSX.read(new Uint8Array(fr.result),{type:"array",cellDates:true});
      let best=[]; wb.SheetNames.forEach(n=>{ const raw=XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:"",raw:false});
        let h=raw.findIndex(r=>r.filter(c=>String(c).trim()).length>=2 && r.some(c=>/mail|title|views|impressions|video|content|subject|post/i.test(String(c)))); if(h<0) h=0;
        const head=raw[h].map(c=>String(c).trim()); const rows=raw.slice(h+1).filter(r=>r.some(c=>String(c).trim())).map(r=>Object.fromEntries(head.map((k,i)=>[k,r[i]])));
        if(rows.length>best.length) best=rows; });
      res(best);
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

/* ================= Results: stats for everything ================= */
function hbars(items, fmt){
  if(!items.length) return '';
  const max=Math.max(...items.map(i=>i.v))||1;
  return '<div class="funnel">'+items.map(i=>'<div class="fr" style="grid-template-columns:minmax(0,2.2fr) minmax(0,3fr) 80px"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+esc(i.l)+'">'+esc(i.l)+'</span><span class="bar"><i style="width:'+Math.max(1,i.v/max*100)+'%;background:var('+(i.c||"--c1")+')"></i></span><span class="fv">'+(fmt?fmt(i.v):i.v.toLocaleString())+'</span></div>').join("")+'</div>';
}
function renderResults(){
  const el=$("#page-results");
  const eds=editionsSorted().filter(e=>+edStats(e).recipients);
  const avgOpen = eds.length? eds.reduce((n,e)=>n+statsCalc(edStats(e)).openRate,0)/eds.length : 0;
  const li=vals("pieces").filter(p=>p.channel==="linkedin" && +p.impressions);
  const liEp=vals("episodes").filter(e=>+e.liImpressions);
  const liAll=li.map(p=>({l:p.title||"Post",v:+p.impressions,c:"--c3"})).concat(liEp.map(e=>({l:"Mic'd Up Ep "+e.num+(e.title?": "+e.title:""),v:+e.liImpressions,c:"--c3"})));
  const yt=vals("episodes").filter(e=>epViews(e)).map(e=>Object.assign({},e,{views:epViews(e)}));
  const ytViews=yt.reduce((n,e)=>n+(+e.views),0);
  const sp=vals("episodes").filter(e=>+e.spotifyPlays); const spPlays=sp.reduce((n,e)=>n+(+e.spotifyPlays),0);
  const mcOwn=vals("pieces").filter(p=>p.channel==="mailchimp"&&+p.sent); const mc=mcOwn.concat(feedCampaigns().filter(c=>+c.sent && !mcOwn.some(p=>(p.title||"").toLowerCase()===(c.subject||"").toLowerCase())));
  const mcOpen=mc.length? mc.reduce((n,p)=>n+(+p.opens||0)/(+p.sent),0)/mc.length : 0;
  const ppl=peopleIndex(); const dls=ppl.filter(p=>p.lists.downloaders);
  const what={}; dls.forEach(p=>p.x.forEach(x=>what[x]=(what[x]||0)+1));
  const topWhat=Object.entries(what).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([l,v])=>({l,v,c:"--c6"}));
  el.innerHTML='<div class="phead"><div><div class="eyebrow">How Marketing Is Landing</div><h1>Results</h1><div class="sub">Opens, clicks, views and impressions for every channel in one place. Drop in each platform\'s export and the numbers fill themselves in.</div></div></div>'+mnCard()+
    '<div class="band"><div class="today">Results · everything logged so far</div><div class="say">'+(eds.length||li.length||yt.length||mc.length?'Here is how each channel is doing from the numbers brought in so far.':'No results brought in yet. Start with the YouTube and LinkedIn exports below; MISMO Matters stats start with the November send.')+'</div><div class="tiles">'+
      '<button class="tile" type="button" data-go="matters"><div class="v sky">'+(eds.length?pct(avgOpen):"—")+'</div><div class="k">MISMO Matters Open Rate</div><div class="s">'+(eds.length?"average of "+eds.length+" edition"+(eds.length>1?"s":""):"from November on")+'</div></button>'+
      '<div class="tile"><div class="v">'+liAll.reduce((n,i)=>n+i.v,0).toLocaleString()+'</div><div class="k">LinkedIn Impressions</div><div class="s">'+liAll.length+' posts logged</div></div>'+
      '<div class="tile"><div class="v">'+ytViews.toLocaleString()+'</div><div class="k">Mic\'d Up Views</div><div class="s">'+yt.length+' episodes logged</div></div>'+
      '<div class="tile"><div class="v">'+(sp.length?spPlays.toLocaleString():"—")+'</div><div class="k">Mic\'d Up on Spotify</div><div class="s">'+(sp.length?sp.length+' episodes · plays':'type plays into each episode')+'</div></div>'+
      '<div class="tile"><div class="v">'+(mc.length?pct(mcOpen):"—")+'</div><div class="k">Mailchimp Open Rate</div><div class="s">'+mc.length+' sends logged</div></div>'+
      '<button class="tile" type="button" data-go="people"><div class="v">'+ppl.filter(p=>p.lists.subscribers).length.toLocaleString()+'</div><div class="k">Subscribers</div><div class="s">'+dls.length.toLocaleString()+' downloaders</div></button>'+
    '</div></div>'+
    '<div class="card"><div class="ch"><h2>Daily Feed</h2><span class="note">filled in each morning by Power Automate once it\'s set up</span></div><div class="cb"><div class="feedrow">'+[["matters","MISMO Matters"],["youtube","YouTube"],["mailchimp","Mailchimp"],["linkedin","LinkedIn"]].map(([k,l])=>'<div class="feedst"><span class="fdot'+(feed(k)?" on":"")+'"></span><b>'+l+'</b><small>'+(feed(k)?"Updated "+esc(feedAge(k)):(k==="linkedin"?"Export by hand for now":"Not connected yet"))+'</small></div>').join("")+'</div></div></div>'+
    '<div class="card"><div class="ch"><h2>Bring In the Numbers</h2><span class="note">drop the file each platform exports; rows are matched to what\'s already here</span></div><div class="cb"><div class="fgrid">'+
      '<div class="field"><label class="flabel" for="rs-yt">YouTube Studio Export</label><input type="file" id="rs-yt" accept=".csv,.xlsx"><span class="hint">Analytics › Advanced mode › Content › Export. Matched to episodes by the number in the title.</span></div>'+
      '<div class="field"><label class="flabel" for="rs-li">LinkedIn Page Analytics Export</label><input type="file" id="rs-li" accept=".csv,.xlsx,.xls"><span class="hint">MISMO page › Analytics › Content › Export (the All Posts tab). Matched by post link or date.</span></div>'+
      '<div class="field"><label class="flabel" for="rs-mc">Mailchimp Campaigns Export</label><input type="file" id="rs-mc" accept=".csv,.xlsx"><span class="hint">Campaigns › Reports › Export. Matched by subject and send date.</span></div>'+
    '</div><p class="hint" id="rs-msg" style="margin-top:10px"></p></div></div>'+
    '<div class="grid2" style="margin-top:22px"><div class="card"><div class="ch"><h2>Most-Watched Mic\'d Up Episodes</h2></div>'+(yt.length?hbars(yt.sort((a,b)=>b.views-a.views).slice(0,10).map(e=>({l:"Ep "+e.num+": "+(e.title||""),v:+e.views,c:"--c2"}))):'<div class="empty">Drop the YouTube Studio export above.</div>')+'</div>'+
      '<div class="card"><div class="ch"><h2>LinkedIn Posts That Reached the Most People</h2></div>'+(liAll.length?hbars(liAll.sort((a,b)=>b.v-a.v).slice(0,10)):'<div class="empty">Drop the LinkedIn export above, or type impressions on a post.</div>')+'</div></div>'+
    '<div class="grid2" style="margin-top:22px"><div class="card"><div class="ch"><h2>What People Download</h2><span class="cnt">'+dls.length.toLocaleString()+' people</span></div>'+(topWhat.length?hbars(topWhat):'<div class="empty">Load the website downloader list on Subscribers &amp; Downloaders.</div>')+'</div>'+
      '<div class="card"><div class="ch"><h2>MISMO Matters by Edition</h2></div>'+(eds.length?'<div class="tw"><table class="t"><thead><tr><th>Edition</th><th class="n">Sent To</th><th class="n">Opens</th><th class="n">Clicks</th></tr></thead><tbody>'+eds.slice().reverse().map(e=>{ const x=statsCalc(edStats(e)); return '<tr><td>'+esc(monthName(e.month))+'</td><td class="n">'+x.r.toLocaleString()+'</td><td class="n">'+pct(x.openRate)+'</td><td class="n">'+pct(x.ctr)+'</td></tr>'; }).join("")+'</tbody></table></div>':'<div class="empty">Axios never shared numbers, so the first edition here will be November. Record its stats on the MISMO Matters page a week after it goes out.</div>')+'</div></div>';
  $$(".tile[data-go]",el).forEach(b=>b.onclick=()=>go(b.dataset.go));
  mnWire(el); if(LOADED.has("monthly") || !LIVE) setTimeout(()=>{ if(TAB==="results") mnPopup("results"); },400);
  const msg=$("#rs-msg",el);
  $("#rs-yt",el).onchange=async e=>{ const f=e.target.files[0]; if(!f) return; try{ const rows=await readSheet(f); let n=0, miss=[];
    for(const r of rows){ const title=col(r,/title|content|video/i); const m=title.match(/ep(?:isode)?\.?\s*(\d{1,3})/i); if(!m) continue; const ep=vals("episodes").find(x=>+x.num===+m[1]); if(!ep){ miss.push(m[1]); continue; }
      const views=num(col(r,/^views$/i)), hrs=num(col(r,/watch time/i)), likes=num(col(r,/likes/i));
      await patch("episodes",ep.id,{views, watchHours:hrs, likes, youtubeDone:true}); n++; }
    if(n) await mnMarkFile("yt");
    msg.textContent=n+" episode"+(n===1?"":"s")+" updated from YouTube."+(miss.length?" Not logged here yet: Ep "+miss.join(", "):""); }catch(err){ msg.textContent=err.message; } };
  $("#rs-li",el).onchange=async e=>{ const f=e.target.files[0]; if(!f) return; try{ const rows=await readSheet(f); let n=0, added=0;
    for(const r of rows){ const link=col(r,/post link|link|url/i), text=col(r,/post title|title|update|commentary|content/i), d=isoFrom(col(r,/created|date|posted/i));
      const st={impressions:num(col(r,/^impressions/i)), clicks:num(col(r,/^clicks/i)), reactions:num(col(r,/reactions|likes/i)), comments:num(col(r,/comments/i)), reposts:num(col(r,/reposts|shares/i))};
      if(!st.impressions && !text) continue;
      const ep=vals("episodes").find(x=>(x.linkedinUrl&&link&&x.linkedinUrl===link) || (/mic.?d up/i.test(text) && x.num && new RegExp("(ep(isode)?\\.?\\s*)"+x.num+"\\b","i").test(text)));
      if(ep){ await patch("episodes",ep.id,{liImpressions:st.impressions, liClicks:st.clicks, liReactions:st.reactions, linkedinDone:true, linkedinUrl:ep.linkedinUrl||link}); n++; continue; }
      const p=vals("pieces").find(x=>x.channel==="linkedin" && ((x.postedUrl&&x.postedUrl===link) || (d && x.date===d && text && x.title && text.toLowerCase().includes(x.title.toLowerCase().slice(0,25)))));
      if(p){ await patch("pieces",p.id,Object.assign({status:"done"},st)); n++; }
      else { await put("pieces",uid("p"),Object.assign({channel:"linkedin",title:text.slice(0,90)||"LinkedIn post",copy:text,date:d,status:"done",postedUrl:link,kind:/\bin the news\b|#inthenews\b/i.test(text)?"In the News":"Other",owner:""},st)); added++; } }
    if(n+added) await mnMarkFile("li");
    msg.textContent=n+" matched and "+added+" new LinkedIn posts brought in."; }catch(err){ msg.textContent=err.message; } };
  $("#rs-mc",el).onchange=async e=>{ const f=e.target.files[0]; if(!f) return; try{ const rows=await readSheet(f); let n=0, added=0;
    for(const r of rows){ const subj=col(r,/subject|title|campaign/i), d=isoFrom(col(r,/send date|sent|date/i)); if(!subj) continue;
      const st={sent:num(col(r,/total recipients|recipients|emails sent|sent to/i)), opens:num(col(r,/unique opens|opens/i)), clicks:num(col(r,/unique clicks|clicks/i)), unsubs:num(col(r,/unsub/i)), audience:col(r,/list|audience/i)};
      const p=vals("pieces").find(x=>x.channel==="mailchimp" && x.title && x.title.toLowerCase()===subj.toLowerCase());
      if(p){ await patch("pieces",p.id,Object.assign({status:"done"},st)); n++; } else { await put("pieces",uid("p"),Object.assign({channel:"mailchimp",title:subj,date:d,status:"done"},st)); added++; } }
    if(n+added) await mnMarkFile("mc");
    msg.textContent=n+" matched and "+added+" new Mailchimp sends brought in."; }catch(err){ msg.textContent=err.message; } };
}
