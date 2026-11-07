/* ================= System Health (Nov 7, 2026 review) =================
   One place that shows how MISMO Media itself is doing: which version is running, whether saving works,
   how the background jobs are going, date lists that are about to run out, and what was put aside with
   Delete (with a way to bring it back). Also: the background-job runner, one autopilot tab per browser,
   the spreadsheet reader loaded on demand, keyboard access to clickable rows, and
   a download of all the data. (Approvals show in Home's On Your Plate list, not a card of their own.) */
const BUILD = "__BUILD__";

/* ---------- one autopilot tab per browser ----------
   Two tabs open in the same browser used to both run the Mic'd Up autopilot (two kits written, two emails
   to Amy). The browser hands this lock to one tab at a time; the others wait until that tab closes. */
let LEADER = !(navigator.locks && navigator.locks.request);
try{ if(navigator.locks && navigator.locks.request) navigator.locks.request("mismo-media-autopilot", ()=>{ LEADER=true; if(typeof schedule==="function") schedule(); return new Promise(()=>{}); }); }catch(e){ LEADER=true; }

/* ---------- background jobs ----------
   At most once a minute each, only in the autopilot tab, and after a failure a pause that doubles each
   time (1, 2, 4 ... up to 60 minutes). The last error is shown on System Health. */
const JOBS = {};
function job(name){ return JOBS[name] || (JOBS[name]={name, runs:0, fails:0, lastRun:0, lastOk:0, lastErr:"", lastErrAt:0, next:0, busy:false}); }
function jobNote(name, err){ const j=job(name); j.fails++; j.lastErr=String((err&&(err.message||err.code))||err||"failed").slice(0,200); j.lastErrAt=Date.now(); j.next=Date.now()+Math.min(60, Math.pow(2, Math.min(6, j.fails-1)))*60000; }
function runJob(name, fn, minMs){
  if(!fn || !LEADER || (typeof STALE!=="undefined" && STALE.on)) return;
  const j=job(name), now=Date.now();
  if(j.busy || now<j.next || now-j.lastRun<(minMs||60000)) return;
  j.busy=true; j.lastRun=now; j.runs++;
  Promise.resolve().then(fn).then(()=>{ j.busy=false; j.lastOk=Date.now(); if(j.fails && Date.now()>=j.next) j.fails=0; }, e=>{ j.busy=false; jobNote(name, e); });
}

/* ---------- the spreadsheet reader, only when someone imports a file ---------- */
let XLSX_P=null;
function loadXLSX(){
  if(window.XLSX) return Promise.resolve();
  if(XLSX_P) return XLSX_P;
  XLSX_P=new Promise((res,rej)=>{ const s=document.createElement("script");
    s.src="https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
    s.integrity="sha384-EnyY0/GSHQGSxSgMwaIPzSESbqoOLSexfnSMN2AP+39Ckmn92stwABZynq1JyzdT"; s.crossOrigin="anonymous";
    s.onload=()=>res(); s.onerror=()=>{ XLSX_P=null; rej(new Error("The spreadsheet reader didn't load. Check your connection and try again.")); };
    document.head.appendChild(s); });
  return XLSX_P;
}

/* ---------- keyboard: clickable rows open with Enter, like a link ---------- */
function a11yRows(){ $$("tr.click:not([tabindex])").forEach(r=>{ r.tabIndex=0; }); }
document.addEventListener("keydown", e=>{
  const t=e.target; if(!(t && t.matches && t.matches("tr.click")) || (e.key!=="Enter" && e.key!==" ")) return;
  e.preventDefault(); t.click();
});

/* ---------- date lists that run out ---------- */
function dateWarnings(){
  const t=T(), soon=add(t,120), out=[];
  const lastHol=Object.keys(HOLIDAYS||{}).sort().slice(-1)[0];
  if(lastHol && lastHol<soon) out.push("The holiday list ends "+fL(lastHol)+". Add next year's MISMO holidays on Settings > Dates so schedules skip them.");
  const lastSum=(SUMMITS||[]).map(x=>x.end||x.start).sort().slice(-1)[0];
  if(lastSum && lastSum<soon) out.push("The last summit on file ends "+fL(lastSum)+". Add the next summits on Settings > Dates.");
  return out;
}
/* ---------- how full each data file is ----------
   The save relay takes files up to about 940 KB. Each collection (all episode kits, all sections...) is one
   file, so this watches them and warns at 70%, long before a save could fail. */
const FILE_MAX = 940000;
function fileSizes(){
  const F=(window.__hqRelay && window.__hqRelay.files) || {};
  return Object.keys(F).filter(k=>F[k].loaded && F[k].server && !/^audience-|^own-index$/.test(k))
    .map(k=>{ const n=JSON.stringify(F[k].server,null,2).length; return {name:k, kb:Math.round(n/1024), pct:Math.round(n/FILE_MAX*100)}; })
    .sort((a,b)=>b.pct-a.pct);
}
let SIZE_WARNED=false;
function sizeWatch(){
  if(SIZE_WARNED || !LIVE) return; const big=fileSizes().filter(f=>f.pct>=70);
  if(big.length){ SIZE_WARNED=true; toast("MISMO Media's "+big.map(f=>f.name).join(", ")+" records are "+big[0].pct+"% of the most one save can hold. See Settings > System Health.", 8000); }
}

/* ---------- Dates and Settings (a Help topic, Nov 7, 2026) ----------
   The holidays the schedule skips, the summits, and the day the new website goes live used to be written into
   the code. They now live in one settings record (settings/dates) that staff edit on Settings > Dates;
   until someone saves it, the lists written into the code stand. */
const DEF_DATES = {holidays:Object.assign({}, HOLIDAYS), summits:SUMMITS.map(s=>Object.assign({}, s)), siteLive:CERT_SITE_LIVE};
let SET_SIG = "";
function datesNow(){ const d=(S.settings||{}).dates; return d && d.holidays ? d : DEF_DATES; }
function siteLive(){ return datesNow().siteLive || CERT_SITE_LIVE; }
function applySettings(){
  const d=datesNow(), sig=JSON.stringify(d); if(sig===SET_SIG) return; SET_SIG=sig;
  Object.keys(HOLIDAYS).forEach(k=>delete HOLIDAYS[k]); Object.assign(HOLIDAYS, d.holidays||{});
  SUMMITS.length=0; (d.summits||[]).forEach(s=>SUMMITS.push(Object.assign({}, s)));
  if(!SUMMITS.length) DEF_DATES.summits.forEach(s=>SUMMITS.push(Object.assign({}, s)));
}
const DS = {draft:null};
function datesHtml(){
  const d = DS.draft || (DS.draft = JSON.parse(JSON.stringify(datesNow())));
  const hol = Object.keys(d.holidays).sort();
  const t=T(), warn=dateWarnings();
  return '<p class="lead">The dates MISMO Media plans around. Change them here and every schedule, countdown and link follows.</p>'+
    (warn.length?'<div class="ds-warn">'+warn.map(w=>esc(w)).join("<br>")+'</div>':'')+
    '<h3>New Website</h3><div class="ds-row"><label for="ds-live">Goes live on</label><input type="date" id="ds-live" value="'+esc(d.siteLive||"")+'"><span class="hint">Newsletter links point to www.mismo.org for editions sent on or after this day, and to collaborate.mismo.org before it.</span></div>'+
    '<h3>Holidays</h3><p class="hint">MISMO Media moves deadlines off these days and weekends.</p>'+
    '<div class="ds-hols">'+
      hol.map((k,i)=>'<div class="ds-h'+(k<t?' past':'')+'"><input type="date" data-hd="'+i+'" value="'+esc(k)+'" aria-label="Holiday date"><input type="text" data-hn="'+i+'" value="'+esc(d.holidays[k])+'" aria-label="Holiday name"><button class="ds-x" type="button" data-hx="'+i+'" aria-label="Remove '+esc(d.holidays[k])+'" title="Remove">×</button></div>').join("")+
    '</div><p><button class="btn sm" type="button" id="ds-addh">Add a Holiday</button></p>'+
    '<h3>Summits</h3><table class="tbl ds-tbl"><colgroup><col style="width:26%"><col style="width:150px"><col style="width:150px"><col><col style="width:36px"></colgroup><thead><tr><th>Summit</th><th>Starts</th><th>Ends</th><th>Where</th><th></th></tr></thead><tbody>'+
      d.summits.map((s,i)=>'<tr'+((s.end||s.start)<t?' class="past"':'')+'><td><input type="text" data-sn="'+i+'" value="'+esc(s.name)+'" aria-label="Summit name"></td><td><input type="date" data-ss="'+i+'" value="'+esc(s.start)+'" aria-label="Start"></td><td><input type="date" data-se="'+i+'" value="'+esc(s.end)+'" aria-label="End"></td><td><input type="text" data-sw="'+i+'" value="'+esc(s.where||"")+'" aria-label="Where"></td><td><button class="ds-x" type="button" data-sx="'+i+'" aria-label="Remove '+esc(s.name)+'" title="Remove">×</button></td></tr>').join("")+
    '</tbody></table><p><button class="btn sm" type="button" id="ds-adds">Add a Summit</button></p>'+
    '<p class="ds-save"><button class="btn pri" type="button" id="ds-save">Save Dates</button> <button class="btn" type="button" id="ds-reset">Undo My Changes</button> <span class="note" id="ds-msg">'+(((S.settings||{}).dates||{}).updatedBy?"Last saved by "+esc(S.settings.dates.updatedBy)+", "+esc(fD(localDay(S.settings.dates.updatedAt))):"Showing the dates built into MISMO Media; nobody has changed them yet.")+'</span></p>';
}
function wireDates(el){
  const d=DS.draft, hol=Object.keys(d.holidays).sort(), redraw=()=>setRedraw();
  const syncH=()=>{ const out={}; hol.forEach((k,i)=>{ const dt=$('[data-hd="'+i+'"]',el), nm=$('[data-hn="'+i+'"]',el); if(dt && dt.value) out[dt.value]=(nm&&nm.value.trim())||"Holiday"; }); d.holidays=out; };
  const syncS=()=>{ d.summits.forEach((s,i)=>{ const g=a=>$('[data-'+a+'="'+i+'"]',el); s.name=(g("sn")||{}).value||s.name; s.start=(g("ss")||{}).value||""; s.end=(g("se")||{}).value||s.start; s.where=(g("sw")||{}).value||""; }); };
  const sync=()=>{ syncH(); syncS(); const l=$("#ds-live",el); if(l) d.siteLive=l.value; };
  $$("input",el).forEach(i=>{ if(i.closest(".helpbody")) i.addEventListener("change", sync); });
  $$("[data-hx]",el).forEach(b=>b.onclick=()=>{ sync(); delete d.holidays[hol[+b.dataset.hx]]; redraw(); });
  $$("[data-sx]",el).forEach(b=>b.onclick=()=>{ sync(); d.summits.splice(+b.dataset.sx,1); redraw(); });
  const ah=$("#ds-addh",el); if(ah) ah.onclick=()=>{ sync(); let k=add(T(),1); while(d.holidays[k]) k=add(k,1); d.holidays[k]="New holiday"; redraw(); };
  const as=$("#ds-adds",el); if(as) as.onclick=()=>{ sync(); const y=new Date().getFullYear()+1; d.summits.push({id:"summit-"+Date.now().toString(36), name:y+" Summit", start:"", end:"", where:""}); redraw(); };
  const rs=$("#ds-reset",el); if(rs) rs.onclick=()=>{ DS.draft=null; redraw(); };
  const sv=$("#ds-save",el); if(sv) sv.onclick=async()=>{
    sync();
    const bad=d.summits.find(s=>!s.name || !s.start || (s.end && s.end<s.start));
    if(bad){ $("#ds-msg",el).textContent="Each summit needs a name and a start date, and can't end before it starts."; return; }
    d.summits.forEach(s=>{ if(!s.id) s.id="summit-"+Date.now().toString(36); if(!s.end) s.end=s.start; });
    d.summits.sort((a,b)=>a.start<b.start?-1:1);
    try{ await put("settings","dates",{holidays:d.holidays, summits:d.summits, siteLive:d.siteLive||CERT_SITE_LIVE}); DS.draft=null; SET_SIG=""; applySettings(); toast("Dates saved"); setRedraw(); }catch(e){}
  };
}

/* ---------- System Health (a Help topic) ---------- */
const TRASH_NAMES = {sections:"Newsletter section", episodes:"Mic'd Up episode", pieces:"Post", news:"In the News item", lists:"List", kits:"Episode kit", requests:"Request"};
function trashLabel(col, r){ return r.name||r.title||r.headline||(r.num?"Episode "+r.num:"")||r.key||r.id; }
function systemHtml(){
  const ago=ms=>{ if(!ms) return "never"; const m=Math.round((Date.now()-ms)/60000); return m<1?"just now":m<60?m+" min ago":Math.round(m/60)+" h ago"; };
  const jobs=Object.values(JOBS);
  const trash=[]; Object.keys(TRASH).forEach(c=>Object.values(TRASH[c]||{}).forEach(r=>trash.push({c, r})));
  trash.sort((a,b)=>String(b.r._deletedAt).localeCompare(String(a.r._deletedAt)));
  const warn=dateWarnings();
  const relay=window.__hqRelay && window.__hqRelay.status ? window.__hqRelay.status : null;
  return '<p class="lead">How MISMO Media itself is doing. Nothing here needs attention unless it is marked.</p>'+
    '<h3>This Copy</h3><table class="tbl"><tbody>'+
      '<tr><td>Version</td><td><b>'+esc(BUILD.indexOf("__")===0?"development copy":BUILD)+'</b></td></tr>'+
      '<tr><td>Saving</td><td>'+(typeof STALE!=="undefined" && STALE.on?'<b class="bad">Paused: a newer MISMO Media is out. Refresh the page.</b>':!CANWRITE?"View only":LIVE?"On, to MISMO's records":"Not connected")+'</td></tr>'+
      (relay?'<tr><td>Connection</td><td>'+(relay.offline?'<b class="bad">Can\'t reach the save relay right now</b>':"OK")+(relay.lastError?' · last problem: '+esc(relay.lastError):"")+'</td></tr>':'')+
      '<tr><td>Background jobs</td><td>'+(LEADER?"Run from this tab":"Run from another MISMO Media tab in this browser")+'</td></tr>'+
    '</tbody></table>'+
    (jobs.length?'<h3>Background Jobs</h3><table class="tbl"><thead><tr><th>Job</th><th>Last ran</th><th>Status</th></tr></thead><tbody>'+
      jobs.map(j=>'<tr><td>'+esc(j.name)+'</td><td>'+esc(ago(j.lastRun))+'</td><td>'+(j.lastErr && j.lastErrAt>j.lastOk?'<b class="bad">'+esc(j.lastErr)+'</b> · next try at '+esc(new Date(j.next).toLocaleTimeString([], {hour:"numeric", minute:"2-digit"})):"OK")+'</td></tr>').join("")+'</tbody></table>':'')+
    (warn.length?'<h3>Dates to Add</h3><ul>'+warn.map(w=>'<li>'+esc(w)+'</li>').join("")+'</ul>':'')+
    (()=>{ const fs=fileSizes(); return fs.length?'<h3>Room Left in Each Data File</h3><p>Each kind of record is saved as one file, and one save can hold about 940 KB. Anything over 70% needs splitting before it fills.</p><table class="tbl"><thead><tr><th>Records</th><th class="n">Size</th><th class="n">Full</th></tr></thead><tbody>'+
      fs.slice(0,12).map(f=>'<tr><td>'+esc(f.name)+'</td><td class="n">'+f.kb+' KB</td><td class="n">'+(f.pct>=70?'<b class="bad">'+f.pct+'%</b>':f.pct+'%')+'</td></tr>').join("")+'</tbody></table>':''; })()+
    '<h3>Recently Deleted</h3>'+(trash.length?'<p>Delete puts things aside instead of erasing them. Bring any of these back with one click.</p><table class="tbl"><thead><tr><th>What</th><th>Deleted</th><th></th></tr></thead><tbody>'+
      trash.slice(0,60).map((x,i)=>'<tr><td><b>'+esc(trashLabel(x.c,x.r))+'</b><span class="t2">'+esc(TRASH_NAMES[x.c]||x.c)+'</span></td><td>'+esc(fD(String(x.r._deletedAt).slice(0,10)))+(x.r._deletedBy?' · '+esc(x.r._deletedBy):'')+'</td><td><button class="btn sm" type="button" data-restore="'+i+'">Bring Back</button></td></tr>').join("")+'</tbody></table>':'<p class="note">Nothing has been deleted since this was switched on.</p>')+
    '<h3>Download All Data</h3><p>One file with every MISMO Media record (editions, sections, episodes, kits, posts, lists, requests and the subscriber lists), for safekeeping. It holds personal emails, so keep it somewhere private.</p>'+
    '<p><button class="btn" type="button" id="sh-export">Download All Data</button></p>';
}
function wireSystem(el){
  const trash=[]; Object.keys(TRASH).forEach(c=>Object.values(TRASH[c]||{}).forEach(r=>trash.push({c, r})));
  trash.sort((a,b)=>String(b.r._deletedAt).localeCompare(String(a.r._deletedAt)));
  $$("[data-restore]",el).forEach(b=>b.onclick=async()=>{ const x=trash[+b.dataset.restore]; if(x){ b.disabled=true; await restoreRec(x.c, x.r.id); setRedraw(); } });
  const ex=$("#sh-export",el); if(ex) ex.onclick=()=>{
    const data={exported:new Date().toISOString(), version:BUILD, records:S, deleted:TRASH};
    const blob=new Blob([JSON.stringify(data,null,1)],{type:"application/json"}), a=document.createElement("a");
    a.href=URL.createObjectURL(blob); a.download="MISMO Media data "+T()+".json"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
  };
}
/* ---------- the Settings page (left nav): Dates and System Health ---------- */
const SET = {sub:"dates"};
function setRedraw(){ if(TAB==="settings") renderSettings(); else renderHelp(); }
function renderSettings(){
  const el=$("#page-settings"); if(!el) return;
  const subs=[["dates","Dates"],["system","System Health"]];
  el.innerHTML='<div class="phead"><div><div class="eyebrow">MISMO Media</div><h1>Settings</h1><div class="sub">The dates MISMO Media plans around, and how the system itself is doing.</div></div></div>'+
    '<div class="subtabs" role="group" aria-label="Settings">'+subs.map(([k,l])=>'<button type="button" data-ssub="'+k+'" aria-pressed="'+(SET.sub===k)+'">'+esc(l)+'</button>').join("")+'</div>'+
    '<article class="card helpbody"><div class="cb">'+(SET.sub==="system"?systemHtml():datesHtml())+'</div></article>';
  $$("[data-ssub]",el).forEach(b=>b.onclick=()=>{ SET.sub=b.dataset.ssub; renderSettings(); });
  if(SET.sub==="system") wireSystem(el); else wireDates(el);
}
