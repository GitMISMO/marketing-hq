/* ================= System Health (Nov 7, 2026 review) =================
   One place that shows how MISMO Media itself is doing: which version is running, whether saving works,
   how the background jobs are going, date lists that are about to run out, and what was put aside with
   Delete (with a way to bring it back). Also: the background-job runner, one autopilot tab per browser,
   the spreadsheet reader loaded on demand, keyboard access to clickable rows, Approvals on Home, and
   a download of all the data. */
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
  if(lastHol && lastHol<soon) out.push("The holiday list ends "+fL(lastHol)+". Add next year's MISMO holidays so schedules skip them.");
  const lastSum=(SUMMITS||[]).map(x=>x.end||x.start).sort().slice(-1)[0];
  if(lastSum && lastSum<soon) out.push("The last summit on file ends "+fL(lastSum)+". Add the next summits.");
  return out;
}

/* ---------- Approvals on Home: everything waiting on someone's OK, and for how long ---------- */
function approvalsWaiting(){
  const t=T(), out=[];
  if(typeof kitsWithAmy==="function") kitsWithAmy().forEach(k=>{ const e=S.episodes[k.id]; out.push({what:"Mic'd Up "+(typeof epTag==="function"?epTag(e):"")+" LinkedIn Live wording", who:"Amy", since:String(k.liSentAt||"").slice(0,10), go:()=>{ go("micdup"); if(typeof openEpisode==="function") openEpisode(e.id); }}); });
  const ed=curEdition(); if(ed) edSections(ed).filter(s=>s.on && s.doc.status==="review").forEach(s=>out.push({what:monthName(ed.month)+" MISMO Matters: "+(s.doc.name||s.meta.name), who:"Review", since:String(s.doc.updatedAt||"").slice(0,10), go:()=>go("matters")}));
  vals("pieces").filter(p=>p.status==="review").forEach(p=>out.push({what:p.title||p.name||"Post", who:"Review", since:String(p.updatedAt||"").slice(0,10), go:()=>go(p.channel||"linkedin")}));
  out.forEach(x=>{ x.days = x.since ? Math.max(0, dBetween(x.since, t)) : null; });
  return out.sort((a,b)=>(b.days||0)-(a.days||0));
}
const _renderHomeBase = renderHome;
renderHome = function(){
  _renderHomeBase();
  const el=$("#page-home"); if(!el || !tabReady("home")) return;
  const list=approvalsWaiting(); if(!list.length) return;
  const box=document.createElement("div"); box.className="card sh-appr";
  box.innerHTML='<div class="ch"><h2>Waiting on Approval</h2><span class="note">'+list.length+' item'+(list.length===1?"":"s")+'</span></div><div class="cb"><table class="tbl"><tbody>'+
    list.map((x,i)=>'<tr class="click" data-ap="'+i+'"><td><b>'+esc(x.what)+'</b></td><td>'+esc(x.who)+'</td><td class="n">'+(x.days==null?"":x.days===0?"Since today":esc(x.days+" day"+(x.days===1?"":"s")+" waiting"))+'</td></tr>').join("")+'</tbody></table></div>';
  const hero=$(".hm-hero",el); if(hero && hero.nextSibling) el.insertBefore(box, hero.nextSibling); else el.appendChild(box);
  $$("[data-ap]",box).forEach(r=>r.onclick=()=>list[+r.dataset.ap].go());
  a11yRows();
};

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
    '<h3>Recently Deleted</h3>'+(trash.length?'<p>Delete puts things aside instead of erasing them. Bring any of these back with one click.</p><table class="tbl"><thead><tr><th>What</th><th>Deleted</th><th></th></tr></thead><tbody>'+
      trash.slice(0,60).map((x,i)=>'<tr><td><b>'+esc(trashLabel(x.c,x.r))+'</b><span class="t2">'+esc(TRASH_NAMES[x.c]||x.c)+'</span></td><td>'+esc(fD(String(x.r._deletedAt).slice(0,10)))+(x.r._deletedBy?' · '+esc(x.r._deletedBy):'')+'</td><td><button class="btn sm" type="button" data-restore="'+i+'">Bring Back</button></td></tr>').join("")+'</tbody></table>':'<p class="note">Nothing has been deleted since this was switched on.</p>')+
    '<h3>Download All Data</h3><p>One file with every MISMO Media record (editions, sections, episodes, kits, posts, lists, requests and the subscriber lists), for safekeeping. It holds personal emails, so keep it somewhere private.</p>'+
    '<p><button class="btn" type="button" id="sh-export">Download All Data</button></p>';
}
function wireSystem(el){
  const trash=[]; Object.keys(TRASH).forEach(c=>Object.values(TRASH[c]||{}).forEach(r=>trash.push({c, r})));
  trash.sort((a,b)=>String(b.r._deletedAt).localeCompare(String(a.r._deletedAt)));
  $$("[data-restore]",el).forEach(b=>b.onclick=async()=>{ const x=trash[+b.dataset.restore]; if(x){ b.disabled=true; await restoreRec(x.c, x.r.id); renderHelp(); } });
  const ex=$("#sh-export",el); if(ex) ex.onclick=()=>{
    const data={exported:new Date().toISOString(), version:BUILD, records:S, deleted:TRASH};
    const blob=new Blob([JSON.stringify(data,null,1)],{type:"application/json"}), a=document.createElement("a");
    a.href=URL.createObjectURL(blob); a.download="MISMO Media data "+T()+".json"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
  };
}
HELP.push({id:"system", t:"System Health", g:"System", b:""});
