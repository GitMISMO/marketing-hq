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
  if(lastHol && lastHol<soon) out.push("The holiday list ends "+fL(lastHol)+". Add next year's MISMO holidays on Help > Holidays and Key Dates so schedules skip them.");
  const lastSum=(SUMMITS||[]).map(x=>x.end||x.start).sort().slice(-1)[0];
  if(lastSum && lastSum<soon) out.push("The last summit on file ends "+fL(lastSum)+". Add the next summits on Help > Holidays and Key Dates.");
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

/* ---------- Dates and Settings (a Help topic, Nov 7, 2026) ----------
   The holidays the schedule skips, the summits, and the day the new website goes live used to be written into
   the code. They now live in one settings record (settings/dates) that staff edit on Help > Holidays and Key Dates;
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
function setRedraw(){ renderHelp(); }
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

const TRASH_NAMES = {sections:"Newsletter section", episodes:"Mic'd Up episode", pieces:"Post", news:"In the News item", lists:"List", kits:"Episode kit", requests:"Request"};
function trashLabel(col, r){ return r.name||r.title||r.headline||(r.num?"Episode "+r.num:"")||r.key||r.id; }
HELP.push({id:"dates", t:"Holidays and Key Dates", g:"Setup", b:""});

/* ==================== System Health (Nov 7, 2026) ====================
   Built the way Summit HQ's is (Jonna liked it): a System Health button in the top bar with a dot
   (green, amber, red), a panel of checks, a red bar across the top when something needs attention,
   and a team error log so a problem on anyone's screen reaches one place. Checks every 5 minutes
   while MISMO Media is open. Nothing here changes data except the log (feeds/health-log). */
const HH = {last:null, running:null, modal:null, btn:null, dot:null, bar:null, started:false, shippedUpTo:0, shipT:null};
const HH_LOG="health-log", HH_KEEP=30, HH_MAX=150;
const hhWhen=ts=>{ const d=new Date(ts); if(isNaN(d)) return ""; const t=d.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"}); return new Date().toDateString()===d.toDateString()? t : d.toLocaleDateString("en-US",{month:"short",day:"numeric"})+" at "+t; };
const hhRow=(key,title,level,line,list,extra)=>({key,title,level,line,list:list||[],extra:extra||""});
const hhWorst=rows=>rows.some(r=>r.level==="bad")?"bad":rows.some(r=>r.level==="warn")?"warn":"ok";
const HH_NICE={sections:"Newsletter Sections",editions:"Editions",episodes:"Mic'd Up Episodes",kits:"Episode Kits",pieces:"Posts",images:"Image Library",news:"In the News",newsin:"In the News (Emails)",newsweb:"In the News (Web Search)",requests:"Requests",inbox:"Request Inbox",feeds:"Feeds",signups:"Sign-Ups",unsubs:"Unsubscribes",lists:"Lists",orders:"Orders",branding:"Rebranding",guests:"Guests",chat:"Chat Links",approvals:"Approvals",monthly:"Monthly Results",settings:"Settings"};
const hhNice=n=>HH_NICE[n]||String(n).replace(/-/g," ").replace(/\b\w/g,c=>c.toUpperCase());

function hhSaving(){
  const r=window.__hqRelay; if(!r) return hhRow("save","Saving",LIVE?"ok":"off",LIVE?"Saving to MISMO's records.":"Not connected on this copy.");
  const st=r.status||{}, files=r.files||{}; let n=0, oldest=0;
  Object.keys(files).forEach(k=>(files[k].pending||[]).forEach(op=>{ n++; if(op.at && (!oldest||op.at<oldest)) oldest=op.at; }));
  const lost=(st.problems||[]).filter(p=>p.lost && Date.now()-Date.parse(p.at)<864e5), retry=(st.problems||[]).filter(p=>!p.lost && Date.now()-Date.parse(p.at)<36e5);
  const age=oldest?Math.round((Date.now()-oldest)/6e4):0;
  if(STALE.on) return hhRow("save","Saving","warn","A newer MISMO Media is out, so saving is paused in this tab. Refresh the page.");
  if(lost.length) return hhRow("save","Saving","bad",lost.length+" change"+(lost.length>1?"s were":" was")+" refused today and taken back. Make "+(lost.length>1?"them":"it")+" again; if it keeps happening, tell Perry.", lost.slice(-3).map(p=>hhWhen(p.at)+": "+(p.code||"error")+(p.msg?" ("+p.msg+")":"")));
  if(n && age>=5) return hhRow("save","Saving","bad",n+" change"+(n>1?"s have":" has")+" been waiting "+age+" minutes to save. Keep this tab open; if it doesn't clear, the save relay may be down (tell Perry).");
  if(st.offline) return hhRow("save","Saving","warn","Can't reach the save relay right now. Changes wait here and save when it's back.");
  if(retry.length) return hhRow("save","Saving","warn","A save had to be tried again in the last hour"+(n?"; "+n+" still waiting.":", and went through."));
  if(!CANWRITE) return hhRow("save","Saving","ok","View only: you can look at everything but not change it.");
  return hhRow("save","Saving","ok", n? n+" change"+(n>1?"s":"")+" saving now." : "Every change is saved"+(st.savedAt?". Last save "+hhWhen(st.savedAt)+".":"."));
}
function hhStorage(){
  const fs=fileSizes(); if(!fs.length) return hhRow("store","Storage","off","Not loaded yet.");
  const top=fs.slice(0,4), w=top[0], lvl=w.pct>=90?"bad":w.pct>=70?"warn":"ok";
  const bars='<div class="hh-bars">'+top.map(f=>'<div><span>'+esc(hhNice(f.name))+'</span><span>'+f.pct+'%</span><i><s class="'+(f.pct>=90?"bad":f.pct>=70?"warn":"")+'" style="width:'+Math.min(100,f.pct)+'%"></s></i></div>').join("")+'</div>';
  const line= lvl==="bad"? hhNice(w.name)+" is "+w.pct+"% full. Tell Perry before it reaches 100%: saves to it would stop."
    : lvl==="warn"? hhNice(w.name)+" is "+w.pct+"% full. Plenty for now; worth splitting before it fills."
    : "Every shared file has room. The fullest is "+w.pct+"% full.";
  return hhRow("store","Storage",lvl,line,[],bars);
}
function hhJobs(){
  const js=Object.values(JOBS);
  if(!LEADER) return hhRow("jobs","Background Jobs","ok","Running from another MISMO Media tab in this browser.");
  if(!js.length) return hhRow("jobs","Background Jobs","ok","Episode files, sponsor logos and certified lists: nothing has needed doing yet.");
  const bad=js.filter(j=>j.lastErr && j.lastErrAt>j.lastOk);
  if(bad.length) return hhRow("jobs","Background Jobs","warn",bad.length+" job"+(bad.length>1?"s":"")+" hit a problem and will try again by "+new Date(Math.max(...bad.map(j=>j.next))).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})+".", bad.map(j=>j.name+": "+j.lastErr));
  return hhRow("jobs","Background Jobs","ok",js.map(j=>j.name).join(", ")+": all working. Last run "+hhWhen(Math.max(...js.map(j=>j.lastRun)))+".");
}
function hhSignups(){
  const L=vals("signups").map(s=>s.at).filter(Boolean).sort(); if(!L.length) return null;
  return hhRow("sign","Website Sign-Ups","ok","Last sign-up arrived "+hhWhen(L[L.length-1])+".");
}
function hhNews(){
  const L=vals("newsin").map(n=>n.at||n.date).filter(Boolean).sort(); if(!L.length) return null;
  return hhRow("news","In the News Emails Flow","ok","Last item filed "+hhWhen(L[L.length-1])+".");
}
function hhWebNews(){
  const r=newsWebRun(); if(!r || !r.at) return LOADED.has("newsweb")? hhRow("webnews","In the News Web Search","off","Hasn't run yet. It runs every morning; the first run starts it.") : null;
  const hrs=(Date.now()-Date.parse(r.at))/36e5, mo=T().slice(0,7), n=vals("newsweb").filter(x=>x.id!=="_run" && x.month===mo).length;
  if(hrs>36) return hhRow("webnews","In the News Web Search","warn","Last searched "+hhWhen(r.at)+", more than a day ago. The \"In the News web search\" workflow in marketing-hq-data may be paused; GitHub pauses scheduled runs after 60 days without changes.");
  return hhRow("webnews","In the News Web Search","ok","Last searched "+hhWhen(r.at)+". "+n+" stor"+(n===1?"y":"ies")+" found this month.");
}
function hhDates(){
  const w=dateWarnings(); if(!w.length) return null;
  return hhRow("dates","Holidays and Key Dates","warn",w.join(" "));
}
function hhVersion(){ return hhRow("ver","This Copy","ok","Version "+(BUILD.indexOf("__")===0?"development copy":BUILD)+"."); }
function hhErrors(){
  const L=window.__mmErrs||[];
  if(!L.length) return hhRow("err","Errors on This Page","ok","None since this page was opened.");
  const n=L.reduce((a,e)=>a+e.n,0);
  return hhRow("err","Errors on This Page","warn",n+" error"+(n>1?"s":"")+" since this page was opened. Usually harmless; they go to the team log below.", L.slice(-4).reverse().map(e=>hhWhen(e.at)+": "+String(e.msg).slice(0,110)));
}
function hhRun(){
  const rows=[hhSaving(), hhStorage(), hhJobs(), hhSignups(), hhNews(), hhWebNews(), hhDates(), hhErrors(), hhVersion()].filter(Boolean);
  HH.last={at:new Date().toISOString(), rows}; hhPaint(); return HH.last;
}
function hhPlace(){
  const r=document.querySelector(".hqtop-r"); if(!r) return;
  if(!HH.btn){
    const b=document.createElement("button"); b.type="button"; b.id="hh-btn"; b.className="hh-btn"; b.title="System Health";
    b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h4l2.5-6 4 12 2.5-6H21"/></svg><i class="hh-dot" aria-hidden="true"></i><span>System Health</span>';
    b.addEventListener("click", hhOpen); HH.btn=b; HH.dot=b.querySelector(".hh-dot");
  }
  if(HH.btn.parentNode!==r) r.insertBefore(HH.btn, r.querySelector("#rs-account")||null);
}
function hhPaint(){
  hhPlace(); if(!HH.last) return;
  const w=hhWorst(HH.last.rows);
  if(HH.dot) HH.dot.className="hh-dot "+w;
  if(HH.btn) HH.btn.setAttribute("aria-label","System Health: "+(w==="bad"?"needs attention":w==="warn"?"a warning":"all working"));
  const bad=HH.last.rows.filter(r=>r.level==="bad"), sig=bad.map(r=>r.key+":"+r.line).join("|");
  let gone=""; try{ gone=sessionStorage.getItem("mm:health-dismissed")||""; }catch(e){}
  if(!HH.bar){ HH.bar=document.createElement("div"); HH.bar.id="hh-bar"; HH.bar.setAttribute("role","alert"); HH.bar.hidden=true; document.body.appendChild(HH.bar); }
  if(!bad.length || sig===gone) HH.bar.hidden=true;
  else {
    HH.bar.innerHTML='<span><b>'+esc(bad[0].title)+':</b> '+esc(bad[0].line)+(bad.length>1?" (and "+(bad.length-1)+" more)":"")+'</span><button type="button" class="hh-go">Details</button><button type="button" class="hh-x" aria-label="Hide until something else changes">&times;</button>';
    HH.bar.querySelector(".hh-go").onclick=hhOpen;
    HH.bar.querySelector(".hh-x").onclick=()=>{ try{ sessionStorage.setItem("mm:health-dismissed",sig); }catch(e){} HH.bar.hidden=true; };
    HH.bar.hidden=false;
  }
  if(HH.modal) hhDraw();
}
function hhReport(){
  if(!HH.last) return "";
  return ["MISMO Media System Health, "+new Date(HH.last.at).toLocaleString("en-US"),""]
    .concat(HH.last.rows.map(r=>(r.level==="ok"?"OK":r.level==="warn"?"WARNING":r.level==="bad"?"PROBLEM":"NOT CHECKED")+" | "+r.title+": "+r.line+(r.list.length?"\n - "+r.list.join("\n - "):"")))
    .concat(["","Errors on this page:"].concat((window.__mmErrs||[]).slice(-15).map(e=>" "+e.at+" "+e.kind+" x"+e.n+" "+e.msg+(e.src?" ["+e.src+"]":"")))).join("\n");
}
async function hhTeamLog(){ if(!DB) return null; try{ const s=await DB.collection("feeds").doc(HH_LOG).get(); const d=s&&s.exists?s.data():null; return (d&&Array.isArray(d.entries))?d.entries:[]; }catch(e){ return null; } }
function hhTrash(){ const t=[]; Object.keys(TRASH).forEach(c=>Object.values(TRASH[c]||{}).forEach(r=>t.push({c,r}))); return t.sort((a,b)=>String(b.r._deletedAt).localeCompare(String(a.r._deletedAt))); }
async function hhDraw(){
  if(!HH.modal || !HH.last) return;
  const body=HH.modal.querySelector(".hh-body"), w=hhWorst(HH.last.rows), trash=hhTrash();
  body.innerHTML='<div class="hh-sum"><i class="hh-big '+w+'"></i><span><b>'+(w==="bad"?"Something Needs Attention":w==="warn"?"Working, With a Warning":"Everything Is Working")+'</b>. Checked '+hhWhen(HH.last.at)+'; it checks again every 5 minutes while MISMO Media is open.</span></div>'+
    '<div class="hh-grid">'+HH.last.rows.map(r=>'<div class="hh-row '+r.level+'"><div class="hh-t">'+esc(r.title)+'</div><div class="hh-l">'+esc(r.line)+'</div>'+(r.list.length?'<ul>'+r.list.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul>':'')+r.extra+'</div>').join("")+'</div>'+
    '<p class="hh-quiet">Not watched from here (their work never shows in MISMO Media until it lands, so a stop can\'t be seen): the Images flow, Amy\'s Replies, the Teams chat links and posting. Power Automate emails a flow\'s owner when it keeps failing.</p>'+
    '<h4>Team Error Log (Last 7 Days)</h4><div class="hh-log"><p class="hh-quiet">Loading&hellip;</p></div>'+
    '<h4>Recently Deleted</h4>'+(trash.length?'<table class="tbl hh-tbl"><tbody>'+trash.slice(0,20).map((x,i)=>'<tr><td><b>'+esc(trashLabel(x.c,x.r))+'</b> <span class="t2">'+esc(TRASH_NAMES[x.c]||x.c)+'</span></td><td>'+esc(hhWhen(x.r._deletedAt))+(x.r._deletedBy?' · '+esc(x.r._deletedBy):'')+'</td><td><button class="btn sm" type="button" data-restore="'+i+'">Bring Back</button></td></tr>').join("")+'</tbody></table>':'<p class="hh-quiet">Nothing deleted. Delete puts things aside here instead of erasing them.</p>')+
    '<div class="hh-acts"><button type="button" class="btn pri" data-hh="again">Check Again</button><button type="button" class="btn" data-hh="copy">Copy Report</button><button type="button" class="btn" data-hh="export" title="Every record in one file, for safekeeping. It holds personal emails, so keep it private.">Download All Data</button></div>';
  body.querySelector('[data-hh="again"]').onclick=e=>{ e.target.textContent="Checked"; hhRun(); };
  body.querySelector('[data-hh="copy"]').onclick=async e=>{ try{ await navigator.clipboard.writeText(hhReport()); e.target.textContent="Copied"; }catch(x){ e.target.textContent="Couldn't Copy"; } };
  body.querySelector('[data-hh="export"]').onclick=()=>{ const data={exported:new Date().toISOString(), version:BUILD, records:S, deleted:TRASH};
    const blob=new Blob([JSON.stringify(data,null,1)],{type:"application/json"}), a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="MISMO Media data "+T()+".json"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),4000); };
  $$("[data-restore]",body).forEach(b=>b.onclick=async()=>{ const x=trash[+b.dataset.restore]; if(x){ b.disabled=true; await restoreRec(x.c, x.r.id); hhDraw(); } });
  const entries=await hhTeamLog(), box=body.querySelector(".hh-log"); if(!box) return;
  const recent=(entries||[]).filter(x=>Date.now()-Date.parse(x.at)<7*864e5).slice(-25).reverse();
  box.innerHTML= entries===null? '<p class="hh-quiet">The team log couldn\'t be read just now.</p>'
    : !recent.length? '<p class="hh-quiet">No errors logged by anyone in the last 7 days.</p>'
    : '<table class="tbl hh-tbl"><thead><tr><th>When</th><th>Who</th><th>Where</th><th>What</th></tr></thead><tbody>'+recent.map(x=>'<tr><td>'+esc(hhWhen(x.at))+'</td><td>'+esc(x.who||"")+'</td><td>'+esc(x.tab||"")+'</td><td>'+esc(x.msg)+(x.n>1?' ('+x.n+' times)':'')+'</td></tr>').join("")+'</tbody></table>';
}
function hhOpen(){
  if(!HH.modal){
    const m=document.createElement("div"); m.className="hh-modal"; m.id="hh-modal";
    m.innerHTML='<div class="hh-box" role="dialog" aria-modal="true" aria-label="System Health"><div class="hh-hd"><b>System Health</b><button type="button" class="btn">Close</button></div><div class="hh-body"></div></div>';
    const from=document.activeElement;
    const close=()=>{ m.remove(); HH.modal=null; document.removeEventListener("keydown",key); if(from&&from.focus) try{ from.focus(); }catch(e){} };
    const key=e=>{ if(e.key==="Escape") close(); };
    m.querySelector(".hh-hd .btn").onclick=close; m.addEventListener("click",e=>{ if(e.target===m) close(); });
    document.addEventListener("keydown",key); document.body.appendChild(m); HH.modal=m;
    setTimeout(()=>{ try{ m.querySelector(".hh-hd .btn").focus(); }catch(e){} },30);
  }
  hhRun();
}
/* the team's log: errors from everyone's screen in one place (written about a minute after they happen) */
async function hhShip(){
  const L=window.__mmErrs||[], fresh=L.filter(e=>Date.parse(e.at)>HH.shippedUpTo); if(!fresh.length || !DB || !CANWRITE || STALE.on) return;
  try{
    const who=window.__hqWho||"", cur=await hhTeamLog(); const keep=Date.now()-HH_KEEP*864e5;
    let entries=(cur||[]).filter(x=>Date.parse(x.at)>keep);
    fresh.forEach(e=>entries.push({at:e.at, who, kind:e.kind, msg:e.msg, src:e.src||"", n:e.n, tab:e.tab||""}));
    await DB.collection("feeds").doc(HH_LOG).set({updatedAt:new Date().toISOString(), entries:entries.slice(-HH_MAX)});
    HH.shippedUpTo=Math.max.apply(null, fresh.map(e=>Date.parse(e.at)));
  }catch(e){}
}
window.addEventListener("mm:err", ()=>{ clearTimeout(HH.shipT); HH.shipT=setTimeout(hhShip, 60000); if(HH.last){ HH.last.rows=HH.last.rows.map(r=>r.key==="err"?hhErrors():r); hhPaint(); } });
function hhStart(){
  if(HH.started) return; HH.started=true; hhPlace();
  setTimeout(hhRun, 20000); setInterval(()=>{ if(!document.hidden) hhRun(); }, 5*60000); setInterval(hhPlace, 4000);
  if((window.__mmErrs||[]).length){ HH.shipT=setTimeout(hhShip, 60000); }
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", hhStart); else hhStart();
