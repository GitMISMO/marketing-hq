"use strict";
/* ================= constants ================= */
const SECTIONS = [
  {"key": "vieaux", "name": "President's Vieaux Point", "ab": "VP", "owner": "Kelly", "from": "Brian Vieaux", "hdr": "https://images.axiosplus.com/sSznh_M5mEDhmeDnzjipgQjn3ug=/0x0:780x164/780x164/2026/10/19/182317-1792434197490.png"},
  {"key": "summit", "name": "Summit Spotlight", "ab": "SS", "owner": "Kelly", "from": "Amy and Kelly", "hdr": "https://images.axiosplus.com/HrVnONytmG_QqothDgtxzYiYGg8=/0x0:778x158/778x158/2026/10/19/182952-1792434592895.png"},
  {"key": "highlight", "name": "MISMO Highlight", "ab": "MH", "owner": "Kelly", "from": "MISMO team"},
  {"key": "workgroup", "name": "Workgroup Highlight", "ab": "WG", "owner": "Kelly", "from": "Facilitator, through Kathryn Williams", "hdr": "https://images.axiosplus.com/N4rcqWxhdLP_TsswxLCRKsoVn_w=/0x0:780x168/780x168/2026/10/19/183441-1792434881540.png"},
  {"key": "sponsor", "name": "Sponsor Highlight", "ab": "SP", "owner": "Kelly", "from": "The sponsor (quote and logo)", "hdr": "https://images.axiosplus.com/cn6k1lqunEy5gjNQ_Cdu_ejJEBw=/0x0:748x160/748x160/2026/10/19/183558-1792434958703.png"},
  {"key": "impl", "name": "Implementation Success", "ab": "IS", "owner": "Kelly", "from": "Member organization", "hdr": "https://images.axiosplus.com/7_1nl73SQ9ZVaa21j_vX07PoX64=/0x0:773x181/773x181/2026/10/19/183751-1792435071123.png"},
  {"key": "micdup", "name": "MISMO Mic'd Up", "ab": "MU", "owner": "Vanessa", "from": "Fills itself from the Mic'd Up page", "auto": true},
  {"key": "member", "name": "Member Highlight", "ab": "ME", "owner": "Kelly", "from": "The member (quote and headshot)", "hdr": "https://images.axiosplus.com/fiIFTW8iF2lq4AIuGCnxu0_IxTE=/0x0:779x157/779x157/2026/10/19/184009-1792435209346.png"},
  {"key": "welcome", "name": "New Member Welcome", "ab": "NM", "owner": "Kelly", "from": "Member 360 new members", "hdr": "https://images.axiosplus.com/Pmi6FFhtav-af2cnxLaHuxIuZUw=/0x0:779x175/779x175/2026/10/19/184053-1792435253598.png"},
  {"key": "thanks", "name": "Thank You to Our Sponsors", "ab": "TY", "owner": "Kelly", "from": "Sponsor logos from the Image Library"},
  {"key": "education", "name": "Education", "ab": "ED", "owner": "Kelly", "from": "Webinars, Boot Camp, MBA/MISMO series", "hdr": "https://images.axiosplus.com/mSMEcFd40n9ayzLucxjpsbYUrCA=/0x0:780x177/780x177/2026/10/19/184530-1792435530313.png"},
  {"key": "cert", "name": "Certifications", "ab": "CH", "owner": "Kelly", "from": "Jonathan Kearns and Perry Williams", "hdr": "https://images.axiosplus.com/5TpRg7bAfi95_AD5WwjRncH69dk=/0x0:780x174/780x174/2026/10/19/184616-1792435576775.png"},
  {"key": "events", "name": "Engagement & Events", "ab": "EE", "owner": "Amy", "from": "MISMO on the Move", "hdr": "https://images.axiosplus.com/H8rNjLwxjJSqo0cCtFUPuDXoj5U=/0x0:748x151/748x151/2026/10/19/184702-1792435622906.png"},
  {"key": "news", "name": "In the News", "ab": "IN", "owner": "Vanessa", "from": "Fills itself from the In the News page", "auto": true, "hdr": "https://images.axiosplus.com/d2BdIOPpFFD7OaRL1bfw6cQFFb8=/0x0:1920x307/1200x191/2026/10/19/192126-1792437686739.png"}
];
const FOOT_LOGO = "https://higherlogicdownload.s3.amazonaws.com/MISMO/02543d2e-502a-4e6e-91e0-38c2c168f75a/UploadedImages/MISMO_Brand_2026/MISMO_FINAL_Full_Color.png";  // the navy logo, from the Higher Logic image library
const MAST_IMG = "https://images.axiosplus.com/tzKbRNmynBmTCrGlg0sQ7oUtFc4=/2026/10/19/1792434048141.png";
const SEC = Object.fromEntries(SECTIONS.map(s=>[s.key,s]));
const PEOPLE = ["Jonna","Vanessa","Kelly","Amy","Brian","Jonathan","Perry","Kathryn"];
const SSTAT = {waiting:["Waiting on Content","wait"], in:["Content In","in"], review:["With Amy for Review","review"], changes:["Changes Requested","changes"], approved:["Approved","ok"]};
const PSTAT = {idea:["Idea","wait"], draft:["Drafting","in"], review:["Ready for Review","review"], ready:["Approved","ok"], staged:["Staged to Post","in"], done:["Posted / Sent","ok"], canceled:["Canceled","changes"]};
const CH = {matters:"MISMO Matters", micdup:"Mic'd Up", linkedin:"LinkedIn", youtube:"YouTube", mailchimp:"Mailchimp", summit:"Summits", orders:"Orders", community:"Community Posts", news:"In the News", setup:"Setup", request:"Requests", other:"Other"};
const REUSE = [["linkedin","LinkedIn","LI"],["mailchimp","Mailchimp","MC"],["website","Website","WB"],["youtube","YouTube","YT"],["summit","Summit","SU"]];
const MILES = [
  ["content","Content Due","Contributors to Kelly"],
  ["draft","Sections In","Kelly, in the system"],
  ["review","Amy's Review","Amy"],
  ["build","Built in Higher Logic","Vanessa and Jonna"],
  ["test","Test Send","Kelly and Amy check it"],
  ["approve","Final Approval","Amy"],
  ["publish","Sent","Through Higher Logic"],
  ["stats","Stats Recorded","A week after sending"]
];
const MILE_OFFS = {content:-14, draft:-13, review:-6, build:-5, test:-2, approve:-1, publish:0, stats:7};
const SEND_SIDE = ["test","approve","publish","stats"];  // the steps that move when the send date moves
const HOLIDAYS = {"2026-11-11":"Veterans Day","2026-11-26":"Thanksgiving","2026-11-27":"the day after Thanksgiving",
  "2027-01-18":"MLK Jr. Birthday","2027-02-15":"Presidents' Day","2027-05-31":"Memorial Day","2027-06-18":"Juneteenth (observed)","2027-07-05":"Independence Day (observed)",
  "2027-09-06":"Labor Day","2027-11-11":"Veterans Day","2027-11-25":"Thanksgiving","2027-11-26":"the day after Thanksgiving",
  "2027-12-27":"Winter Break","2027-12-28":"Winter Break","2027-12-29":"Winter Break","2027-12-30":"Winter Break","2027-12-31":"Winter Break"};
function offDay(d){ const w=P(d).getDay(); return w===0||w===6||!!HOLIDAYS[d]; }
function workday(d,dir){ let x=d, n=0; while(offDay(x) && n++<14) x=add(x,dir); return x; }
function cadenceFrom(p){ const dates={}; MILES.forEach(([k])=>{ const o=MILE_OFFS[k]; dates[k]= o===0 ? p : workday(add(p,o), o<0?-1:1); }); return dates; }
function offNote(d){ return HOLIDAYS[d] || "a weekend"; }
const SEND_CHECKS = [
  ["lists","MISMO Matters group refreshed","Compound lists, website subscribers, downloaders and prospects loaded into the Higher Logic group"],
  ["unsub","Unsubscribes removed","One list across Mailchimp, Axios and Higher Logic: anyone who unsubscribed anywhere is left off"],
  ["micdup","Mic'd Up episodes listed","Every episode on YouTube since the last edition"],
  ["news","In the News gathered","Press releases and articles since the last edition, from the In the News page"],
  ["links","Links and section jumps tested","Every link, every \"jump to\" and \"back to top\" works"],
  ["text","Plain-text version checked","For readers whose email shows text only"],
  ["web","Web version published","The edition's own web page, so every Copy Link opens and copies the right section"],
  ["test","Test send reviewed","Kelly and Amy have each opened the test and signed off"],
  ["website","Website list updated","The new edition added to the MISMO Matters list on the website"],
  ["linkedin","LinkedIn post about the edition","Announces the edition on the MISMO page"],
  ["stats","Stats recorded","Recipients, opens, clicks and top links, a week after sending"]
];
const SUMMITS = [
  {id:"2027-winter", name:"2027 Winter Summit", start:"2027-01-11", end:"2027-01-14", where:"InterContinental New Orleans · in person and virtual"},
  {id:"2027-spring", name:"2027 Spring Summit", start:"2027-06-07", end:"2027-06-10", where:"Salt Lake City"},
  {id:"2027-fall",   name:"2027 Fall Summit",   start:"2027-09-13", end:"2027-09-16", where:"Bethesda"}
];
const SUMMIT_PLAN = [
  [-150,"before","MISMO Matters","Save the date in MISMO Matters"],
  [-150,"before","LinkedIn","Save-the-date post"],
  [-120,"before","Email","Registration open announcement"],
  [-120,"before","Website","Registration and agenda pages live on the website"],
  [-115,"before","LinkedIn","Registration open post"],
  [-110,"before","Email","Sponsorship prospectus push to past sponsors"],
  [-100,"before","LinkedIn","Early-bird pricing reminder"],
  [-92,"before","Email","Early-bird last call"],
  [-75,"before","MISMO Matters","New workgroup kickoffs announced"],
  [-60,"before","Email","Agenda live: highlights email"],
  [-56,"before","LinkedIn","Agenda highlight post"],
  [-45,"before","LinkedIn","Speaker spotlight series begins (weekly)"],
  [-30,"before","LinkedIn","Sponsor thank-you post"],
  [-21,"before","Email","Hotel block deadline reminder"],
  [-14,"before","LinkedIn","Two-week countdown post"],
  [-7,"before","Email","Know before you go: email to registrants"],
  [-3,"before","Event App","Event app live and announced"],
  [0,"at","LinkedIn","Day 1 welcome post with photos"],
  [0,"at","Onsite","Newcomer Orientation photo and post"],
  [1,"at","LinkedIn","Day 2 recap post"],
  [2,"at","LinkedIn","Award winners post"],
  [3,"at","LinkedIn","Closing day thank-you post"],
  [3,"at","Onsite","Collect photos and quotes for the recap"],
  [6,"after","Email","Thank-you email with the survey"],
  [9,"after","LinkedIn","Recap post with attendance and survey numbers"],
  [14,"after","Website","Slides and recordings posted"],
  [20,"after","MISMO Matters","Summit Spotlight recap in the next MISMO Matters"]
];
const SUMMIT_VIA = ["LinkedIn","MISMO Matters","Email","Website","Event App","Onsite","Mailchimp","YouTube"];
const MICDUP_START = "2026-10-23";
const FRESH_FROM = "2026-10-30";  // fresh start: episodes before this are history, never counted as owed
const FRESH_EP = 51;  // first episode of the fresh start (older ones often have no air date)
function owes(e){ return e.airDate ? e.airDate >= FRESH_FROM : (!e.num || +e.num >= FRESH_EP); }
const SUBSCRIBE_URL = "https://resources.mismo.org/forms/subscribe/";
const UNSUB_URL = "https://resources.mismo.org/forms/unsubscribe/";  // MISMO's own unsubscribe page; every MISMO Matters footer links here  // MISMO's own form (replaced the Smartsheet form)

/* ================= little helpers ================= */
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const esc = s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pad = n=>String(n).padStart(2,"0");
const iso = d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const P = s=>{ if(!s||typeof s!=="string") return null; const m=s.match(/^(\d{4})-(\d{2})-(\d{2})/); return m?new Date(+m[1],+m[2]-1,+m[3]):null; };
const today = ()=>{ const d=new Date(); d.setHours(0,0,0,0); return d; };
const T = ()=>iso(today());
/* the local calendar day of a saved time stamp ("2026-11-07T02:30:00Z" is Nov 6 in the evening in Eastern time) */
const localDay = ts=>{ const s=String(ts||""); if(!/T\d/.test(s)) return s.slice(0,10); const d=new Date(s); return isNaN(d)?s.slice(0,10):iso(d); };
/* a wall-clock time in Eastern time (Mic'd Up goes live Friday 8:30 AM ET wherever the viewer is) */
function etAt(day, hm){
  const guess=new Date(day+"T"+hm+":00Z");
  const f=new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",hourCycle:"h23",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});
  const p=Object.fromEntries(f.formatToParts(guess).map(x=>[x.type,x.value]));
  const asET=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute);
  return new Date(guess.getTime()-(asET-guess.getTime()));
}
const add = (s,n)=>{ const d=P(s)||today(); d.setDate(d.getDate()+n); return iso(d); };
const diff = (a,b)=>Math.round((P(a)-P(b))/864e5);
const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DOWL = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const fS = s=>{ const d=P(s); return d?MON[d.getMonth()]+" "+d.getDate():"—"; };
const fD = s=>{ const d=P(s); return d?DOW[d.getDay()]+", "+MON[d.getMonth()]+" "+d.getDate():"—"; };
const fL = s=>{ const d=P(s); return d?DOWL[d.getDay()]+", "+MONL[d.getMonth()]+" "+d.getDate()+", "+d.getFullYear():"—"; };
const fMD = s=>{ const d=P(s); return d?(d.getMonth()+1)+"/"+d.getDate()+"/"+String(d.getFullYear()).slice(2):""; };
const monthName = m=>{ const [y,mm]=m.split("-").map(Number); return MONL[mm-1]+" "+y; };
const thirdWed = (y,m)=>{ const d=new Date(y,m,1); const off=(3-d.getDay()+7)%7; return iso(new Date(y,m,1+off+14)); };
const nextDow = (s,dow)=>{ const d=P(s); const off=(dow-d.getDay()+7)%7; d.setDate(d.getDate()+off); return iso(d); };
const rel = s=>{ if(!s) return ""; const n=diff(s,T()); if(n===0) return "today"; if(n===1) return "tomorrow"; if(n===-1) return "yesterday"; return n>0?("in "+n+" days"):(-n+" days ago"); };
function parseDateIn(v){
  v=String(v||"").trim(); if(!v) return "";
  let m;
  if((m=v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) return iso(new Date(+m[1],+m[2]-1,+m[3]));
  if((m=v.match(/^(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?$/))){
    let y = m[3]? +m[3] : today().getFullYear(); if(y<100) y+=2000;
    const d=new Date(y,+m[1]-1,+m[2]); return isNaN(d)?null:iso(d);
  }
  if((m=v.match(/^([A-Za-z]{3,})\.?\s+(\d{1,2})(?:,?\s+(\d{4}))?$/))){
    const mi = MON.findIndex(x=>m[1].toLowerCase().startsWith(x.toLowerCase())); if(mi<0) return null;
    return iso(new Date(m[3]?+m[3]:today().getFullYear(), mi, +m[2]));
  }
  const d=new Date(v); return isNaN(d)?null:iso(d);
}
const uid = p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const chip = (map,k)=>{ const v=map[k]||map[Object.keys(map)[0]]; return '<span class="chip '+v[1]+'">'+esc(v[0])+'</span>'; };
function toast(msg, ms){ const t=$("#toast"); t.textContent=msg; t.hidden=false; clearTimeout(toast._t); toast._t=setTimeout(()=>{t.hidden=true;}, ms||2400); }
const words = s=>mdPlain(s).replace(/^• /gm,"").trim().split(/\s+/).filter(Boolean).length;

/* ================= the shared records ================= */
const S = {editions:{}, sections:{}, episodes:{}, pieces:{}, news:{}, lists:{}, audience:{}, feeds:{}, posted:{}, signups:{}, images:{}, branding:{}, orders:{}, requests:{}, inbox:{}, kits:{}, chat:{}, approvals:{}, guests:{}, newsin:{}, monthly:{}, unsubs:{}, unsubhl:{}, settings:{}};
let DB=null, ASSETS=null, SAMPLE=null, LIVE=false, LOADED=new Set(), CONNECTED=false, FIRST_LOAD=0; const HOST_AT_BOOT=!!(window.claude && window.claude.use);
function vals(c){ return Object.values(S[c]); }
async function getClaude(){
  for(let i=0;i<40 && !(window.claude && window.claude.use);i++) await new Promise(r=>setTimeout(r,100));
  return (window.claude && window.claude.use) ? window.claude : null;
}
async function connect(){
  const c = await getClaude();
  try{ DB = c ? await c.use("db") : null; }catch(e){ DB=null; }
  if(!DB){ CONNECTED=true; $("#offline").hidden=false; saveNote(false); schedule(); return; }
  LIVE=true; CONNECTED=true; saveNote(true);
  Object.keys(S).forEach(col=>{
    DB.collection(col).onSnapshot(snap=>{
      /* S = what the pages use; TRASH = records put aside with Delete (Help > System Health brings them back) */
      const o={}, tr={}; snap.docs.forEach(d=>{ const v=d.data()||{}; if(v._deletedAt){ tr[d.id]=Object.assign({id:d.id}, v); return; } o[d.id]=Object.assign({id:d.id}, v); });
      TRASH[col]=tr;
      /* a second copy, never changed by the page, to tell later what a save actually changed (November 5, 2026) */
      if(col!=="audience"){ const seen={}; snap.docs.forEach(d=>{ const v=d.data()||{}; if(!v._deletedAt) seen[d.id]=Object.assign({id:d.id}, v); }); SEEN[col]=seen; }
      S[col]=o; if(!FIRST_LOAD){ FIRST_LOAD=Date.now(); setTimeout(schedule, 8100); } LOADED.add(col); schedule(); if(col==="images" && typeof hlSoon==="function") hlSoon();
    }, err=>{ saveNote(false, err && err.message); });
  });
  try{ ASSETS = await c.use("assets"); }catch(e){ ASSETS=null; }
  try{ DL = await c.use("downloads"); }catch(e){ DL=null; }
  try{ SAMPLE = await c.use("sample"); }catch(e){ SAMPLE=null; }
  if(window.__hqRelay){
    let can=true; try{ const u=await c.use("user"); if(u && u.can) can = await u.can(); if(u && u.me){ const m=await u.me(); window.__hqWho = (m && (m.name||m.displayName)) || ""; } }catch(e){}
    const sb=$("#savebanner"); if(sb && can===false) sb.hidden=false;
    CANWRITE = can!==false;
    const n=$("#rail-save"); if(n) n.innerHTML = CANWRITE ? '<b>Saving</b><span class="ok">To MISMO\'s records · saves as you press Save</span>' : '<b>Saving</b><span class="no">'+(document.querySelector("#savebanner b")||{}).textContent+'</span>';
  }
  syncFeed();
}
let CANWRITE=true, FEED_DONE=false;
/* On resources.mismo.org the home page already keeps a list of every Mic'd Up episode on
   YouTube (/podcast/micdup.json, rebuilt from the channel's feed). MISMO Media reads it so an
   episode is marked "on YouTube", with its link, the moment it goes up. */
async function syncFeed(){
  if(FEED_DONE || location.hostname!=="resources.mismo.org" || !CANWRITE) return;
  if(!LOADED.has("episodes")){ setTimeout(syncFeed, 1500); return; }
  FEED_DONE=true;
  try{
    const r=await fetch("/podcast/micdup.json",{cache:"no-store"}); if(!r.ok) return;
    const feed=await r.json();
    for(const v of (feed.episodes||[])){
      const m=String(v.title||"").match(/ep(?:isode)?\.?\s*(\d{1,3})/i); if(!m) continue;
      const ep=epByNum(m[1], String(v.published||v.date||"").slice(0,10)||T()); const url="https://www.youtube.com/watch?v="+v.id;
      if(ep && (!ep.youtubeDone || !ep.youtubeUrl)) await patch("episodes",ep.id,{youtubeDone:true, youtubeUrl:ep.youtubeUrl||url});
    }
  }catch(e){}
}
function saveNote(ok, why){
  const n=$("#rail-save"); if(!n) return;
  n.innerHTML = ok ? '<b>Saving</b><span class="ok">Shared with the team · saves as you press Save</span>'
                   : '<b>Saving</b><span class="no">'+esc(why||"Not connected · changes won't be kept")+'</span>';
}
/* Saving without overwriting anyone (November 5, 2026). The right-hand panel can sit open
   for hours, and its Save used to write the whole record as the panel had it, so anything a
   teammate saved in the meantime was quietly put back. Now every save also carries the record
   as it was when the change began: as it was when the panel opened, or the newest copy for a
   quick change made anywhere else. Only what differs from that is written, onto the newest
   copy, here and in the data store (where it is done again after a 409). If both people
   changed the same field, the person saving is asked which to keep, and an open panel says so
   when someone else saves the same record. SEEN holds each record exactly as last read.
   Added Nov 7 (review): a tab running an old copy of MISMO Media, or a view-only person, saves
   nothing; every save says who made it; Delete puts things aside instead of erasing them. */
const SEEN = {}, TRASH = {};
const WHO=()=>window.__hqWho||"";
const SOFT_DEL=["sections","episodes","pieces","news","lists","kits","requests"];
function noId(r){ const o=Object.assign({}, r); delete o.id; return o; }
function baseOf(col,id){
  const k=col+"/"+id;
  if(PANE && PANE.at){ if(k in PANE.at.over) return PANE.at.over[k]; const c=PANE.at.cols[col]; if(c && c[id]) return c[id]; }
  return SEEN[col] ? SEEN[col][id] : undefined;
}
function askClash(cl, theirs, mine){
  const M=window.__hqMerge, title=(($("#pane-title")||{}).textContent||"").trim();
  const label=at=>{ const lb=document.querySelector('label[for="f-'+at[0]+'"]');
    return (lb ? lb.textContent.trim() : at[0].replace(/^d_/,"").replace(/([A-Z])/g," $1").replace(/^./,c=>c.toUpperCase())) + (at.length>1 ? " › "+at.slice(1).join(" › ") : ""); };
  const show=v=>{ const t=M.normVal(v).replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim(); return t==="" ? "(blank)" : t.slice(0,80); };
  return window.confirm("While you had "+(title||"this record")+" open, someone else saved a different value in the same "+(cl.length===1?"field":"fields")+":\n\n"+
    cl.map(at=>"• "+label(at)+" — theirs: "+show(M.getAt(theirs,at))+"   ·   yours: "+show(M.getAt(mine,at))).join("\n")+
    "\n\nOK keeps yours. Cancel keeps theirs for "+(cl.length===1?"this field":"these fields")+" — your other changes still save.");
}
function saveBlocked(){
  if(!DB) return false;
  if(STALE.on){ toast("MISMO Media has been updated. Refresh the page to keep saving; this change wasn't saved.", 6000); return true; }
  if(!CANWRITE){ toast("You can view MISMO Media but not save changes.", 4000); return true; }
  return false;
}
async function put(col,id,data){
  if(saveBlocked()) return;
  const clean = Object.assign({}, data); delete clean.id;
  clean.updatedAt = new Date().toISOString(); const by=WHO(); if(by) clean.updatedBy=by;
  const M=window.__hqMerge, k=col+"/"+id, was=baseOf(col,id), now=SEEN[col] && SEEN[col][id];
  const base = (DB && M && was) ? M.clone(noId(was)) : null; // a copy: Cancel below edits it
  if(base && !now && LOADED.has(col)){ toast(M.GONE, 6000); throw new Error(M.GONE); }
  let out = clean;
  if(base && now){
    const cur=noId(now), cl=M.clashes(cur, clean, base);
    if(cl.length && !askClash(cl, cur, clean)) cl.forEach(at=>M.setAt(base, at, M.getAt(clean, at))); // Cancel: theirs stands
    out = M.merge(cur, clean, base);
  }
  S[col][id] = Object.assign({id}, out); schedule();
  if(PANE && PANE.at) PANE.at.over[k] = Object.assign({id}, M ? M.clone(out) : out); // the panel's new starting point
  if(DB){ try{ const ref=DB.collection(col).doc(id); await (base && ref.merge ? ref.merge(clean, base) : ref.set(base ? out : clean)); }catch(e){ toast("Couldn't save: "+(e.message||e.code||"try again"), 4000); throw e; } }
}
async function patch(col,id,part){ const cur=S[col][id]||{}; return put(col,id,Object.assign({},cur,part)); }
/* Delete puts a record aside rather than erasing it; Help > System Health lists what was put aside and
   brings it back. hard=true erases (used only for housekeeping, e.g. old list parts). */
async function remove(col,id,hard){
  if(saveBlocked()) return;
  const rec=S[col][id]; delete S[col][id]; schedule();
  if(PANE && PANE.at) PANE.at.over[col+"/"+id] = undefined; // gone on purpose: a later save here starts fresh
  if(!DB) return;
  if(!hard && rec && SOFT_DEL.includes(col)){
    const at=new Date().toISOString();
    TRASH[col]=TRASH[col]||{}; TRASH[col][id]=Object.assign({}, rec, {_deletedAt:at, _deletedBy:WHO()});
    try{ await DB.collection(col).doc(id).update({_deletedAt:at, _deletedBy:WHO()}); }catch(e){ toast("Couldn't delete: "+(e.message||"try again"),4000); }
    return;
  }
  try{ await DB.collection(col).doc(id).delete(); }catch(e){ toast("Couldn't delete: "+(e.message||"try again"),4000); }
}
async function restoreRec(col,id){
  if(saveBlocked()) return;
  const rec=TRASH[col]&&TRASH[col][id]; if(!rec) return;
  delete TRASH[col][id]; const back=Object.assign({}, rec); delete back._deletedAt; delete back._deletedBy; S[col][id]=back; schedule();
  try{ await DB.collection(col).doc(id).update({_deletedAt:null, _deletedBy:null}); toast("Brought back"); }catch(e){ toast("Couldn't bring it back: "+(e.message||"try again"),4000); }
}
let _raf=0; function schedule(){ if(_raf) return; _raf=requestAnimationFrame(()=>{ _raf=0; renderAll(); }); }

/* ================= derived data ================= */
function editionsSorted(){ return vals("editions").sort((a,b)=>(a.month<b.month?-1:1)); }
function curEdition(){
  const live = editionsSorted().filter(e=>!e.archived && !(e.done&&e.done.publish));
  return live[0] || editionsSorted().slice(-1)[0] || null;
}
function prevPublish(ed){
  const list=editionsSorted(); const i=list.findIndex(e=>e.id===ed.id);
  const p = i>0 ? list[i-1] : null;
  return p && p.dates && p.dates.publish ? p.dates.publish : add(ed.dates.publish,-35);
}
function edSections(ed){
  const saved = (ed.order && ed.order.length) ? ed.order : null;
  const order = saved ? saved.slice() : SECTIONS.map(s=>s.key);
  /* a standard section added after this edition's order was saved: slot it in after its neighbor, switched off until ticked */
  if(saved) SECTIONS.forEach((s,i)=>{ if(order.includes(s.key)) return; const before=SECTIONS.slice(0,i).reverse().find(x=>order.includes(x.key)); order.splice(before?order.indexOf(before.key)+1:order.length,0,s.key); });
  return order.map(k=>{
    const id = ed.month+"__"+k; const doc = S.sections[id] || {id, month:ed.month, key:k, status:"waiting"};
    const meta = SEC[k] || {key:k, name: doc.name || "One-Off Section", ab:"+", owner:"Kelly", from:""};
    const on = !(ed.excluded && ed.excluded[k]) && (!saved || saved.includes(k) || !!S.sections[id]);
    return {id, k, doc, meta, on};
  });
}
function editionFor(dateIso){
  return editionsSorted().find(e=>e.dates && e.dates.publish && dateIso<=e.dates.publish && dateIso>prevPublish(e)) || null;
}
function epsSorted(){ return vals("episodes").sort((a,b)=>((+b.season||1)-(+a.season||1))||((+b.num||0)-(+a.num||0))); }
/* Mic'd Up seasons: Season 2 starts over at Episode 1 (Nov 6, 2026) */
function epTag(e){ return ((+e.season||1)>1?"S"+e.season+" ":"")+"Ep "+(e.num||"?"); }
function epWord(e){ return ((+e.season||1)>1?"Season "+e.season+", ":"")+"Episode "+(e.num||"?"); }
/* which episode a number means: the one whose Friday is nearest the date given (a later season reuses numbers) */
function epByNum(n, near){
  const d=near||T(), gap=e=>e.airDate?Math.abs(diff(e.airDate,d)):9999;
  const c=vals("episodes").filter(e=>+e.num===+n).sort((a,b)=>gap(a)-gap(b));
  if(!c.length) return null;
  const top=Math.max(1,...vals("episodes").map(e=>+e.season||1));
  // an old-season episode far from this date isn't the one meant: a new season reuses its number
  if((+c[0].season||1)<top && gap(c[0])>45) return null;
  return c[0];
}
function epNewId(n){ const top=Math.max(1,...vals("episodes").map(e=>+e.season||1)); return (top>1?"s"+top:"")+"ep"+String(n).padStart(3,"0"); }
function epNewSeason(){ return String(Math.max(1,...vals("episodes").map(e=>+e.season||1))); }
function epsInWindow(ed){ const a=prevPublish(ed), b=ed.dates.draft||ed.dates.publish; return vals("episodes").filter(e=>e.airDate && e.airDate>a && e.airDate<=ed.dates.publish).sort((x,y)=>x.airDate<y.airDate?-1:x.airDate>y.airDate?1:(+x.num||0)-(+y.num||0)); }
function newsEdition(n){ if(n.edition) return S.editions[n.edition]||null; return n.date ? editionFor(n.date) : null; }
/* In the News = what the team logged (data/news.json) plus coverage that arrives by email
   (data/newsin.json, written only by the "MISMO Media - In the News Emails" flow's GitHub workflow).
   Editing an emailed item saves the team's copy under the same id; removing one hides it. */
function newsGet(id){ return (S.news||{})[id] || (S.newsin||{})[id] || null; }
function newsAll(){
  const team=S.news||{}, out=[], urls=new Set(), heads=new Set();
  Object.values(team).forEach(n=>{ if(n.url) urls.add(normUrl(n.url)); if(n.headline) heads.add(String(n.headline).toLowerCase().trim()); if(!n.hidden) out.push(n); });
  Object.values(S.newsin||{}).forEach(n=>{ if(team[n.id]) return; if(n.url && urls.has(normUrl(n.url))) return; if(n.headline && heads.has(String(n.headline).toLowerCase().trim())) return;
    out.push(Object.assign({kind:"mention"}, n, {auto:true, viaEmail:true})); });
  return out;
}
function newsInWindow(ed){
  const logged=newsAll().filter(n=>{ const e=newsEdition(n); return e && e.id===ed.id; });
  // "In the News" posts on MISMO's LinkedIn page count too, unless the story is already logged on the In the News page
  const seen=new Set(newsAll().map(n=>normUrl(n.url)).filter(Boolean));
  const fromLi=vals("pieces").filter(p=>p.channel==="linkedin" && p.kind==="In the News" && p.status!=="idea" && !/^news:/.test(String(p.notes||"")) && p.date && (p.link||p.postedUrl))
    .filter(p=>{ const e=editionFor(p.date); return e && e.id===ed.id && !seen.has(normUrl(p.link||p.postedUrl)); })
    .map(p=>({id:"li-"+p.id, headline:String(p.title||""), outlet:"", date:p.date, url:p.link||p.postedUrl, kind:/press release/i.test((p.title||"")+" "+(p.copy||""))?"press":"mention", fromLinkedIn:true}));
  return logged.concat(fromLi).sort((x,y)=>(x.date||"")<(y.date||"")?1:-1);
}
function normUrl(u){ return String(u||"").trim().toLowerCase().replace(/^https?:\/\/(www\.)?/,"").replace(/[?#].*$/,"").replace(/\/+$/,""); }
function fridays(from, n){ const out=[]; let d=nextDow(from,5); for(let i=0;i<n;i++){ out.push(d); d=add(d,7); } return out; }
function epOn(fri){ return vals("episodes").find(e=>e.airDate===fri); }
function liDate(ep){ return ep.linkedinDate || (ep.airDate ? add(ep.airDate,3) : ""); }

/* every dated thing, for the calendar, the agenda and the counts */
function allEvents(){
  const ev=[];
  editionsSorted().forEach(ed=>{
    if(ed.archived || !ed.dates) return;
    const nm = MONL[+ed.month.slice(5)-1];
    MILES.forEach(([k,l])=>{ if(ed.dates[k]) ev.push({date:ed.dates[k], k:"matters", label:"Matters · "+(k==="publish"?nm+" Edition Goes Out":l), done:!!(ed.done&&ed.done[k]), big:k==="publish", who:k==="review"||k==="approve"?"Amy":k==="content"||k==="draft"?"Kelly":"Vanessa", go:()=>{ go("matters"); MS.ed=ed.id; renderMatters(); }}); });
  });
  vals("episodes").forEach(ep=>{
    if(!ep.airDate) return;
    const old=!owes(ep);
    if(!old || ep.youtubeDone) ev.push({date:ep.airDate, k:"micdup", label:"Mic'd Up "+epTag(ep)+" · YouTube", done:!!ep.youtubeDone, who:"Vanessa", go:()=>openEpisode(ep.id)});
    const l=liDate(ep); if(l && (!old || ep.linkedinDone)) ev.push({date:l, k:"linkedin", label:(ep.liCanceled?"Canceled · ":"")+"LinkedIn · Mic'd Up "+epTag(ep), done:liClosed(ep), x:!!ep.liCanceled, who:"Vanessa", go:()=>openEpisode(ep.id)});
  });
  fridays(MICDUP_START, Math.ceil((Date.parse(add(T(),130))-Date.parse(MICDUP_START))/(7*864e5))+1).forEach(f=>{ if(!epOn(f) && f>=T() && f<=add(T(),120)) ev.push({date:f, k:"micdup", label:"Mic'd Up · Episode Needed", done:false, slot:true, who:"Brian", go:()=>newEpisode(f)}); });
  vals("pieces").forEach(p=>{ if(p.date) ev.push({date:p.date, k:p.channel||"other", label:(p.status==="canceled"?"Canceled · ":"")+(p.channel==="setup"?"Setup · ":CH[p.channel]?CH[p.channel]+" · ":"")+(p.title||"Untitled"), x:p.status==="canceled", done:pClosed(p)||!!p.done, who:p.owner||"", go:()=>openPiece(p.id)}); });
  vals("orders").filter(o=>!o.archived && o.status!=="cancelled").forEach(o=>{
    const pre=["toorder","quote"].includes(o.status||"toorder");
    if(o.orderBy && (pre || o.orderedOn)) ev.push({date:o.orderBy, k:"orders", label:"Order By · "+(o.name||"Order"), done:!pre, who:o.owner||"", go:()=>{ go("orders"); openOrder(o.id); }});
    const need=o.neededBy||orEventDate(o); if(need) ev.push({date:need, k:"orders", label:"Needed · "+(o.name||"Order")+(orEventName(o)?" for "+orEventName(o):""), done:o.status==="received", who:o.owner||"", go:()=>{ go("orders"); openOrder(o.id); }});
  });
  if(typeof requests==="function") requests().forEach(r=>{ if(!r.neededBy || ["done","declined"].includes(r.status) || rqLinked(r.id).length) return; ev.push({date:r.target||r.neededBy, k:"request", label:"Request · "+(r.title||"Untitled"), done:false, who:r.owner||"", go:()=>{ go("requests"); openRequest(r.id); }}); });
  /* monthly numbers: due the 1st, for the month before */
  if(typeof mnPeriod==="function"){ const per=mnPeriod(), first=T().slice(0,8)+"01", next=add(first,40).slice(0,8)+"01";
    ev.push({date:first, k:"results", label:"Results · Bring In "+mnName(per)+" Numbers", done:(LOADED.has("monthly")||!LIVE) && !mnOpen(per).length, who:"", go:()=>go("results")});
    ev.push({date:next, k:"results", label:"Results · Bring In "+mnName(first.slice(0,7))+" Numbers", done:false, who:"", go:()=>go("results")}); }
  SUMMITS.forEach(s=>{ let d=s.start; while(d<=s.end){ ev.push({date:d, k:"summit", label:s.name, done:false, big:true, who:"", go:()=>{ go("summits"); SM.id=s.id; renderSummits(); }}); d=add(d,1);} });
  return ev;
}
const isOver = e=>!e.done && !e.slot && e.date<T() && !e.big;

/* ================= the right-hand panel ================= */
let PANE = null;
function openPane(cfg){
  if(!PANE) PANE_FROM = document.activeElement;
  PANE = Object.assign({dirty:false}, cfg);
  /* what every record looked like as this panel opened, and which record it is (November 5, 2026) */
  PANE.at = {cols:Object.assign({}, SEEN), over:{}};
  const did = cfg.data && cfg.data.id;
  if(did) for(const c of Object.keys(SEEN)){ if(SEEN[c] && SEEN[c][did]){ PANE.rec = {col:c, id:did}; break; } }
  $("#pane-eye").textContent = cfg.eye||"";
  $("#pane-title").textContent = cfg.title||"";
  const b=$("#pane-body"); b.innerHTML = buildFields(cfg.fields, cfg.data||{}) + (cfg.extra||"");
  const f=$("#pane-foot");
  f.innerHTML = (cfg.save?'<button class="btn pri" id="pf-save" type="button">Save</button>':"") +
    (cfg.buttons||[]).map((x,i)=>'<button class="btn" type="button" data-pb="'+i+'">'+esc(x.label)+'</button>').join("") +
    '<span class="msg" id="pf-msg"></span><span class="sp"></span>' +
    (cfg.del?'<button class="btn danger" id="pf-del" type="button">'+(cfg.delLabel||"Delete")+'</button>':"");
  wireFields(b);
  b.addEventListener("input",()=>{ if(PANE) PANE.dirty=true; },{once:false});
  if(cfg.save) $("#pf-save").onclick=async()=>{ const v=readFields(cfg.fields); if(v===null) return; try{ await cfg.save(v); PANE.dirty=false; toast("Saved"); closePane(true); }catch(e){} };
  (cfg.buttons||[]).forEach((x,i)=>{ f.querySelector('[data-pb="'+i+'"]').onclick=async()=>{ const v=readFields(cfg.fields); if(v===null) return; try{ await x.run(v); PANE.dirty=false; }catch(e){} }; });
  if(cfg.del){ const d=$("#pf-del"); d.onclick=async()=>{ if(d.dataset.sure){ await cfg.del(); toast(cfg.delLabel==="Archive"?"Archived":"Deleted"); closePane(true); } else { d.dataset.sure="1"; d.textContent="Press Again to "+(cfg.delLabel||"Delete"); setTimeout(()=>{ if(d){ delete d.dataset.sure; d.textContent=cfg.delLabel||"Delete"; } },3500); } }; }
  if(cfg.after) cfg.after(b);
  const p=$("#pane"); p.classList.add("open"); p.setAttribute("aria-hidden","false"); p.inert=false;
  b.scrollTop=0;
  setTimeout(()=>{ const first=b.querySelector("input:not([type=url]),textarea,select,.rt-ed"); if(first && !cfg.noFocus) try{ first.focus({preventScroll:true}); }catch(e){} },230);
}
/* an open panel says so when someone else saves, or deletes, the same record (November 5, 2026) */
setInterval(()=>{
  if(!PANE || !PANE.rec || !PANE.at || !window.__hqMerge) return;
  const {col,id}=PANE.rec, opened=baseOf(col,id), latest=SEEN[col] && SEEN[col][id], M=window.__hqMerge;
  if(!opened || !LOADED.has(col)) return;
  const said = latest ? M.sig(latest) : "gone";
  if((latest && said===M.sig(opened)) || PANE.staleSaid===said) return;
  PANE.staleSaid = said;
  const m=$("#pf-msg"); if(m) m.textContent = latest ? "Someone else just saved this record. Saving keeps their changes and adds yours."
    : "Someone else just deleted this record. Saving won't bring it back.";
}, 3000);
function closePane(force){
  if(PANE && PANE.dirty && !force){ const m=$("#pf-msg"); if(m && !m.dataset.warned){ m.dataset.warned="1"; m.textContent="You have changes that aren't saved. Press Close again to leave without saving."; return; } }
  PANE=null; const p=$("#pane"); p.classList.remove("open"); p.setAttribute("aria-hidden","true"); p.inert=true;
  /* back to the button or row that opened it, so keyboard users aren't dropped at the top of the page */
  const from=PANE_FROM; PANE_FROM=null; if(from && document.contains(from) && from.focus) try{ from.focus({preventScroll:true}); }catch(e){}
}
let PANE_FROM=null;
const CAL_SVG='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';
function buildFields(fields, d){
  let h='', open=false;
  const close=()=>{ if(open){ h+='</div>'; open=false; } };
  (fields||[]).forEach(f=>{
    if(f.sec){ close(); h+='<div class="fsec">'+esc(f.sec)+'</div>'; return; }
    if(!open){ h+='<div class="fgrid">'; open=true; }
    const id="f-"+f.k, v = f.get? f.get(d) : d[f.k];
    const cls = 'field'+(f.wide||f.type==="textarea"||f.type==="rich"||f.type==="checks"||f.type==="html"?" wide":"");
    h+='<div class="'+cls+'">';
    if(f.label && f.type!=="cb") h+='<label for="'+id+'"'+(f.type==="rich"?' onclick="document.getElementById(this.htmlFor).focus()"':'')+'>'+esc(f.label)+'</label>';
    if(f.type==="rich") h+=rtField(id, v, f.ph, f.rows, f.img);
    else if(f.type==="textarea") h+='<textarea id="'+id+'" rows="'+(f.rows||4)+'" placeholder="'+esc(f.ph||"")+'">'+esc(v||"")+'</textarea>';
    else if(f.type==="select") h+='<select id="'+id+'">'+(f.blank?'<option value=""></option>':'')+f.opts.map(o=>{ const [ov,ol]=Array.isArray(o)?o:[o,o]; return '<option value="'+esc(ov)+'"'+(String(v||"")===String(ov)?" selected":"")+'>'+esc(ol)+'</option>'; }).join("")+'</select>';
    else if(f.type==="date") h+='<div class="datef"><input type="text" id="'+id+'" value="'+esc(fMD(v))+'" placeholder="e.g. 11/18/26" autocomplete="off"><button class="btn calb" type="button" data-cal="'+id+'" aria-label="Pick from a calendar" title="Pick from a calendar">'+CAL_SVG+'</button><input type="date" tabindex="-1" aria-hidden="true" data-for="'+id+'" value="'+esc(v||"")+'"></div>';
    else if(f.type==="checks") h+='<div class="cbs" id="'+id+'">'+f.opts.map(([ov,ol])=>'<label><input type="checkbox" value="'+esc(ov)+'"'+(v&&v[ov]?" checked":"")+'> '+esc(ol)+'</label>').join("")+'</div>';
    else if(f.type==="cb") h+='<div class="cbs"><label><input type="checkbox" id="'+id+'"'+(v?" checked":"")+'> '+esc(f.label)+'</label></div>';
    else if(f.type==="ro") h+='<div class="ro" id="'+id+'">'+esc(v||"—")+'</div>';
    else if(f.type==="html") h+='<div id="'+id+'">'+(f.html? f.html(d):"")+'</div>';
    else h+='<input type="'+(f.type==="number"?"number":f.type==="url"?"url":"text")+'" id="'+id+'" value="'+esc(v==null?"":v)+'" placeholder="'+esc(f.ph||"")+'" autocomplete="off">';
    if(f.hint) h+='<span class="hint">'+esc(f.hint)+'</span>';
    h+='</div>';
  });
  close(); return h;
}
function wireFields(root){
  rtWire(root);
  $$("[data-cal]",root).forEach(b=>{
    const id=b.dataset.cal, txt=$("#"+id,root), di=root.querySelector('input[data-for="'+id+'"]');
    b.onclick=()=>{ const cur=parseDateIn(txt.value); if(cur) di.value=cur; try{ di.showPicker(); }catch(e){ di.style.pointerEvents="auto"; di.focus(); di.click(); } };
    di.onchange=()=>{ txt.value=fMD(di.value); if(PANE) PANE.dirty=true; };
    txt.onblur=()=>{ const p=parseDateIn(txt.value); if(p) txt.value=fMD(p); };
  });
}
function readFields(fields){
  const out={}; let bad=null;
  (fields||[]).forEach(f=>{
    if(!f.k || f.type==="ro" || f.type==="html" || f.sec) return;
    const el=$("#f-"+f.k); if(!el) return;
    if(f.type==="checks"){ const o={}; $$("input",el).forEach(i=>{ if(i.checked) o[i.value]=true; }); out[f.k]=o; }
    else if(f.type==="cb") out[f.k]=el.checked;
    else if(f.type==="date"){ const p=parseDateIn(el.value); if(p===null){ bad=bad||f.label; el.focus(); } else out[f.k]=p; }
    else if(f.type==="number") out[f.k]= el.value===""?"":Number(el.value);
    else out[f.k]=el.value.trim();
  });
  if(bad){ const m=$("#pf-msg"); if(m) m.textContent="\""+bad+"\" isn't a date I can read. Try 11/18/26."; return null; }
  if(PANE && PANE.set){ PANE.set(out); }
  return out;
}

/* ================= navigation ================= */
const TABS=["home","overview","requests","results","matters","micdup","linkedin","youtube","mailchimp","summits","branding","orders","people","lists","news","images","qr","help"];
let TAB="home";
function go(tab){ const b=document.querySelector('.hq nav button[data-hq="'+tab+'"]'); if(b) show(tab); }
function show(tab){
  if(!TABS.includes(tab)) tab="home";
  TAB=tab;
  $$(".hq nav button[data-hq]").forEach(b=>{ if(b.dataset.hq===tab) b.setAttribute("aria-current","page"); else b.removeAttribute("aria-current"); });
  TABS.forEach(t=>{ $("#page-"+t).hidden = t!==tab; });
  if(typeof navOpenFor==="function") navOpenFor(tab);
  /* the address stays clean, so a bookmark, a refresh or a reopened tab starts on Home */
  try{ if(location.hash) history.replaceState(null,"",location.pathname+location.search); }catch(e){}
  renderTab(tab); window.scrollTo(0,0);
}
/* What the posting flow has already put on LinkedIn (data/posted.json, written only by the flow). */
function applyPosted(){
  Object.values(S.posted||{}).forEach(x=>{
    const id=x.id||""; if(id.startsWith("ep-")){ const e=S.episodes[id.slice(3)]; if(e && !e.linkedinDone){ e.linkedinDone=true; if(x.url && !e.linkedinUrl) e.linkedinUrl=x.url; } }
    else { const pc=S.pieces[id]; if(pc && pc.status!=="done"){ pc.status="done"; if(x.url && !pc.postedUrl) pc.postedUrl=x.url; } }
  });
}
/* A tab left open across an update keeps running the old code, and its background work (folder checks, autopilot,
   Higher Logic uploads) can undo newer fixes. Every 10 minutes the page checks whether MISMO Media has been updated;
   once it has, this tab stops its background work and asks to be refreshed. */
/* Mic'd Up steps on hold. Set one to false to bring it back everywhere (kit, Weekly Run, journey, results reminders). */
const MU_PAUSED = {spotify:true, clips:true};
const STALE={base:null, on:false};
function pageSig(t){ let h=0; for(let i=0;i<t.length;i++){ h=(h*31+t.charCodeAt(i))|0; } return t.length+":"+h; }
async function staleCheck(){
  if(STALE.on) return;
  try{ const t=await fetch(location.pathname, {cache:"no-store"}).then(r=>r.ok?r.text():""); if(!t) return;
    const sig=pageSig(t); if(STALE.base===null){ STALE.base=sig; return; }
    if(sig!==STALE.base){ STALE.on=true; const b=document.createElement("div"); b.id="stale-bar";
      b.style.cssText="position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:9999;background:#0d314c;color:#fff;border:1px solid #74bfeb;border-radius:6px;padding:9px 12px 9px 14px;font:600 13px/1.3 inherit;display:flex;gap:12px;align-items:center;box-shadow:0 8px 24px -8px rgba(0,0,0,.45)";
      b.setAttribute("role","alert");
      b.innerHTML='MISMO Media has been updated. Saving is paused in this tab until you refresh. <button class="btn sm pri" type="button">Refresh</button>';
      b.querySelector("button").onclick=()=>location.reload(); document.body.appendChild(b); }
  }catch(e){}
}
staleCheck(); setInterval(staleCheck, 3*60*1000);
document.addEventListener("visibilitychange", ()=>{ if(document.visibilityState==="visible") staleCheck(); });
/* the background jobs (episode files, sponsor logos, certified lists) run from here, but through runJob:
   at most once a minute, only in one tab per browser, and with a growing pause after a failure */
function renderAll(){ applyPosted(); if(typeof applySettings==="function") applySettings(); renderTab(TAB); badges();
  if(typeof runJob==="function"){ runJob("Mic'd Up files", typeof kitSync==="function"?kitSync:null); runJob("Sponsor logos", typeof sponsorSync==="function"?sponsorSync:null); runJob("Certified lists", typeof certSync==="function"?certSync:null); }
  if(typeof a11yRows==="function") a11yRows(); if(typeof sizeWatch==="function" && FIRST_LOAD && Date.now()-FIRST_LOAD>20000) sizeWatch(); }
/* what each page needs before it can draw truthfully; until then it shows a quiet "loading" panel
   instead of a wrong picture (an open slot, zero counts) that then corrects itself */
const TAB_NEEDS = {home:["episodes","editions","sections","pieces","kits","guests"], overview:["episodes","editions","pieces"], matters:["editions","sections"], micdup:["episodes","kits","guests"],
  youtube:["episodes"], linkedin:["pieces","episodes"], mailchimp:["pieces"], summits:["pieces"], news:["news"], results:["episodes","pieces","editions"], requests:["inbox","requests"],
  orders:["orders"], branding:["branding"], images:["images"], people:["audience","signups"], lists:["lists"]};
/* the 8-second "draw anyway" allowance starts when records begin arriving (after sign-in), not when the page opens */
function tabReady(t){ if(!CONNECTED) return !HOST_AT_BOOT; if(!LIVE) return true; if(FIRST_LOAD && Date.now()-FIRST_LOAD>8000) return true; return (TAB_NEEDS[t]||[]).every(c=>LOADED.has(c)); }
function renderTab(t){
  if(!tabReady(t)){ const el=$("#page-"+t); if(el && !el.querySelector(".ld-wait")) el.innerHTML='<div class="ld-wait" role="status"><span class="ld-dot"></span><span class="ld-dot"></span><span class="ld-dot"></span><b>Loading MISMO\'s records…</b></div>'; return; }
  try{
    ({home:renderHome, overview:renderOverview, matters:renderMatters, micdup:renderMicdup, linkedin:renderLinkedin, youtube:renderYoutube, mailchimp:renderMailchimp, summits:renderSummits, news:renderNews, lists:renderLists, images:renderImages, qr:renderQr, branding:renderBranding, orders:renderOrders, requests:renderRequests, people:renderPeople, results:renderResults, help:renderHelp})[t]();
  }catch(e){ console.error(e); $("#page-"+t).innerHTML='<div class="empty">Something on this page didn\'t draw: '+esc(e.message)+'</div>'; }
}
function badge(id,n,hot){ const b=$("#nb-"+id); if(!b) return; b.hidden=!n; b.textContent=n||""; b.classList.toggle("hot",!!hot); if(typeof navBadges==="function") navBadges(); }
function badges(){
  if(!tabReady("home")) return;   /* counts wait until the records are in, so they don't flicker */
  const ev=allEvents(); const over=ev.filter(isOver).length;
  badge("overview", over, true);
  const ed=curEdition(); badge("matters", ed? edSections(ed).filter(s=>s.on && s.doc.status==="review").length : 0);
  const wk=add(T(),7);
  badge("micdup", vals("episodes").filter(e=>owes(e) && e.airDate && e.airDate<=T() && !e.youtubeDone).length + (epOn(nextDow(T(),5))?0:1) + kitsWithAmy().length, false);
  badge("linkedin", ev.filter(e=>e.k==="linkedin" && !e.done && e.date<=wk).length);
  badge("youtube", vals("episodes").filter(e=>owes(e) && e.airDate && e.airDate<=T() && !e.youtubeDone).length);
  badge("requests", requests().filter(r=>r.status==="new").length, true);
  badge("orders", vals("orders").filter(o=>!o.archived && orRisk(o)).length, true);
  badge("branding", vals("branding").filter(b=>!b.archived && b.status==="old").length);
  badge("mailchimp", vals("pieces").filter(p=>p.channel==="mailchimp" && pOpen(p) && p.date && p.date<=wk).length);
  badge("summits", vals("pieces").filter(p=>p.channel==="summit" && pOpen(p) && p.date && p.date<=add(T(),14)).length);
  if(typeof mnOpen==="function" && (LOADED.has("monthly") || !LIVE)) badge("results", mnOpen(mnPeriod()).length, true);
  badge("news", newsAll().filter(n=>!n.linkedinDone && n.date>=add(T(),-30)).length);
}

/* ================= Schedule (overview) ================= */
const OV = {month:null};
function evHtml(e){ return '<button type="button" class="ev k-'+e.k+(e.done?" done":"")+(e.x?" x":"")+(e.big?" big":"")+'" title="'+esc(e.label)+'"'+(e.slot?' style="border-style:dashed"':'')+'><i class="dot"></i><span>'+esc(e.label)+'</span></button>'; }
function renderOverview(){
  const el=$("#page-overview"); const ev=allEvents(); const t=T();
  const ed=curEdition();
  const over=ev.filter(isOver);
  const week=ev.filter(e=>!e.done && !e.big && e.date>=t && e.date<=add(t,6));
  const fri=nextDow(t,5), ep=epOn(fri);
  const secs = ed? edSections(ed).filter(s=>s.on) : [];
  const inN = secs.filter(s=>s.meta.auto || s.doc.status!=="waiting").length;
  const amyKits = kitsWithAmy().length; const amy = secs.filter(s=>s.doc.status==="review").length + vals("pieces").filter(p=>p.status==="review").length + amyKits;
  const setupOpen = vals("pieces").filter(p=>p.channel==="setup" && p.status!=="done");
  // next milestone sentence
  let say='';
  if(ed && ed.dates){
    const nx = MILES.find(([k])=>!(ed.done&&ed.done[k]) && ed.dates[k]);
    say = '<em>'+esc(monthName(ed.month))+'</em> MISMO Matters goes out <em>'+esc(fD(ed.dates.publish))+'</em>. ';
    if(nx) say += 'Next up: '+esc(nx[1].toLowerCase()==="sent"?"sending":nx[1])+' on '+esc(fS(ed.dates[nx[0]]))+' ('+esc(nx[2])+'). ';
  }
  if(over.length) say += '<span class="hot">'+over.length+' item'+(over.length>1?"s are":" is")+' past due.</span> ';
  { const nr=requests().filter(r=>r.status==="new").length; if(nr) say += '<span class="hot">'+nr+' new request'+(nr>1?"s":"")+' to review.</span> '; }
  if(setupOpen.length) say += setupOpen.length+' setup item'+(setupOpen.length>1?"s":"")+' still open.';
  // calendar month
  if(!OV.month) OV.month = t.slice(0,7);
  const [yy,mm]=OV.month.split("-").map(Number);
  const first=new Date(yy,mm-1,1); const startOff=(first.getDay()+6)%7; let d=new Date(yy,mm-1,1-startOff);
  const byDate={}; ev.forEach(e=>{ (byDate[e.date]=byDate[e.date]||[]).push(e); });
  let cal='<div class="cal">'+["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(x=>'<div class="dh">'+x+'</div>').join("");
  for(let i=0;i<42;i++){
    const ds=iso(d); const out=d.getMonth()!==mm-1; const we=d.getDay()===0||d.getDay()===6;
    if(i>=35 && out && i%7===0) break;
    const list=(byDate[ds]||[]).sort((a,b)=>(b.big?1:0)-(a.big?1:0));
    cal+='<div class="d'+(out?" out":"")+(we&&!out?" we":"")+(ds===t?" today":"")+'" data-date="'+ds+'"><span class="num">'+d.getDate()+'</span>'+list.slice(0,4).map(evHtml).join("")+(list.length>4?'<span class="note">+'+(list.length-4)+' more</span>':'')+'</div>';
    d.setDate(d.getDate()+1);
  }
  cal+='</div>';
  // agenda: next 14 days + overdue (setup tasks live in Getting Set Up, so they aren't repeated here)
  const ag = ev.filter(e=>!e.done && e.k!=="setup" && ((e.date>=t && e.date<=add(t,13)) || isOver(e)) && !(e.big && e.k==="summit")).sort((a,b)=>a.date<b.date?-1:1);
  const agList = [];
  const agItem = (e, late)=>{ const i=agList.push(e)-1; const tt=agTitle(e);
    return '<button type="button" class="agi k-'+e.k+(e.big?" big":"")+(e.slot?" slot":"")+'" data-agi="'+i+'"><span class="agk">'+esc(CHS[e.k]||CH[e.k]||"Other")+'</span><span class="tt">'+esc(tt)+(late?' <span class="agl">'+esc(fS(e.date))+'</span>':'')+'</span>'+whoHtml(e.who)+'</button>'; };
  let agh='';
  const pastDue = ag.filter(e=>e.date<t);
  if(pastDue.length) agh+='<div class="agwk late"><div class="agwh">Past Due<span>'+pastDue.length+'</span></div><div class="agday"><div class="agdate late"><b>!</b><small>Late</small></div><div class="agitems">'+pastDue.map(e=>agItem(e,true)).join("")+'</div></div></div>';
  const wkOf = ds=>{ const d=P(ds); return add(ds, -((d.getDay()+6)%7)); };
  const thisWk = wkOf(t), upcoming = ag.filter(e=>e.date>=t), weeks = {};
  upcoming.forEach(e=>{ const w=wkOf(e.date); ((weeks[w]=weeks[w]||{})[e.date]=weeks[w][e.date]||[]).push(e); });
  Object.keys(weeks).sort().forEach(w=>{
    const n=Object.values(weeks[w]).reduce((x,l)=>x+l.length,0);
    const wl = w===thisWk ? "This Week" : w===add(thisWk,7) ? "Next Week" : "Week of "+fS(w);
    agh+='<div class="agwk"><div class="agwh">'+esc(wl)+'<span>'+n+'</span></div>'+
      Object.keys(weeks[w]).sort().map(ds=>{ const d=P(ds);
        return '<div class="agday'+(ds===t?" today":"")+'"><div class="agdate'+(ds===t?" today":"")+'"><small>'+(ds===t?"Today":esc(["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()]))+'</small><b>'+d.getDate()+'</b><small>'+esc(MON[d.getMonth()])+'</small></div><div class="agitems">'+weeks[w][ds].map(e=>agItem(e,false)).join("")+'</div></div>'; }).join("")+'</div>';
  });
  // Getting Set Up: progress, open items grouped by when they're due, finished items tucked away
  const setup = vals("pieces").filter(p=>p.channel==="setup" && !p.archived).sort((a,b)=>((a.date||"9")<(b.date||"9")?-1:1));
  const sDone = setup.filter(p=>p.status==="done"), sOpen = setup.filter(p=>p.status!=="done");
  const sPct = setup.length ? Math.round(sDone.length/setup.length*100) : 0;
  const sGroups = [["Past Due", sOpen.filter(p=>p.date&&p.date<t), "late"], ["This Week", sOpen.filter(p=>p.date&&p.date>=t&&p.date<=add(thisWk,6)), "soon"], ["Coming Up", sOpen.filter(p=>p.date&&p.date>add(thisWk,6)), ""], ["No Date Yet", sOpen.filter(p=>!p.date), ""]].filter(g=>g[1].length);
  const sRow = p=>{ const dn=p.status==="done", late=!dn&&p.date&&p.date<t, soon=!dn&&!late&&p.date&&p.date<=add(thisWk,6);
    return '<div class="chk'+(dn?" done":"")+'"><input type="checkbox" data-done="'+esc(p.id)+'"'+(dn?" checked":"")+' aria-label="Mark done: '+esc(p.title||"")+'"><button type="button" class="lnk ct" data-open="'+esc(p.id)+'"><b>'+esc(p.title||"Untitled")+'</b>'+(p.notes?'<small>'+esc(mdPlain(p.notes))+'</small>':'')+'</button><div class="meta">'+(p.date?'<span class="due'+(late?" late":soon?" soon":"")+'">'+esc(dn&&p.doneOn?fS(p.doneOn):fS(p.date))+'</span>':'')+whoHtml(p.owner)+'</div></div>'; };
  const setupHtml = '<div class="sprog"><div class="sprog-t"><b>'+sDone.length+' of '+setup.length+' done</b><span>'+sPct+'%</span></div><div class="sbar"><i style="width:'+sPct+'%"></i></div></div>'+
    (sGroups.map(g=>{ const cap = g[0]==="Coming Up" && !OV.showLater && g[1].length>5 ? 4 : g[1].length;
      return '<div class="sgrp '+g[2]+'"><div class="agwh">'+esc(g[0])+'<span>'+g[1].length+'</span></div><div class="checks">'+g[1].slice(0,cap).map(sRow).join("")+'</div>'+
        (g[0]==="Coming Up" && g[1].length>5 ? '<button type="button" class="sdone-t smore" id="ov-slater">'+(OV.showLater?"Show fewer":"Show "+(g[1].length-cap)+" more coming up")+'</button>' : '')+'</div>'; }).join("") || (setup.length?'<div class="empty sdone-all">Everything is set up.</div>':'<div class="empty">Nothing to set up.</div>'))+
    (sDone.length?'<button type="button" class="sdone-t" id="ov-sdone" aria-expanded="'+(!!OV.showDone)+'">'+(OV.showDone?"Hide":"Show")+' '+sDone.length+' finished</button>'+(OV.showDone?'<div class="sgrp done"><div class="checks">'+sDone.slice().reverse().map(sRow).join("")+'</div></div>':''):'');
  el.innerHTML =
    '<div class="phead"><div><div class="eyebrow">MISMO Media</div><h1>Schedule</h1><div class="sub">Every MISMO Matters edition, Mic\'d Up episode, LinkedIn post, YouTube upload, Mailchimp send and summit push, on one calendar.</div></div>'+
    '<div class="tools"><button class="btn" type="button" id="ov-newpiece">+ New Item</button></div></div>'+
    '<div class="band"><div class="today">Today · '+esc(fL(t))+'</div><div class="say">'+say+'</div><div class="tiles">'+
      '<button class="tile" type="button" data-go="matters"><div class="v sky">'+(ed&&ed.dates?Math.max(0,diff(ed.dates.publish,t)):"—")+'</div><div class="k">Days to MISMO Matters</div><div class="s">'+(ed?esc(fD(ed.dates.publish)):"No edition started")+'</div></button>'+
      '<button class="tile" type="button" data-go="matters"><div class="v">'+inN+' of '+secs.length+'</div><div class="k">Sections In</div><div class="s">'+(ed?esc(monthName(ed.month))+' edition':'')+'</div></button>'+
      '<button class="tile" type="button" data-go="'+(amyKits && amy===amyKits?"micdup":"matters")+'"><div class="v">'+amy+'</div><div class="k">Waiting on Amy</div><div class="s">'+(amyKits?amyKits+" Mic\'d Up LinkedIn Live"+(amyKits>1?"s":"")+" to approve":"sections and posts to review")+'</div></button>'+
      '<button class="tile" type="button" data-go="micdup"><div class="v'+(ep?"":" hot")+'">'+(ep?esc(epTag(ep)):"Needed")+'</div><div class="k">Mic\'d Up This Friday</div><div class="s">'+esc(fD(fri))+'</div></button>'+
      '<div class="tile"><div class="v">'+week.length+'</div><div class="k">Due This Week</div><div class="s">across every channel</div></div>'+
      '<div class="tile"><div class="v'+(over.length?" hot":"")+'">'+over.length+'</div><div class="k">Past Due</div><div class="s">not marked done</div></div>'+
    '</div></div>'+
    '<div class="card"><div class="ch"><h2>The Next Four Weeks</h2><span class="note">every channel, one line each · hover a marker for what it is</span></div>'+lanesHtml(ev)+'</div>'+
    '<div class="card"><div class="ch"><h2>Calendar</h2><div class="r calnav"><button class="btn sm" type="button" id="cal-prev" aria-label="Previous month">←</button><span class="m">'+esc(MONL[mm-1]+" "+yy)+'</span><button class="btn sm" type="button" id="cal-next" aria-label="Next month">→</button><button class="btn sm" type="button" id="cal-today">Today</button></div></div>'+
      '<div class="cb flush">'+cal+'</div>'+
      '<div class="legend">'+["matters","micdup","linkedin","youtube","mailchimp","summit","community","setup"].map(k=>'<span><i class="dot k-'+k+'"></i>'+esc(CH[k])+'</span>').join("")+'<span><i class="dot" style="background:transparent;border:1px dashed var(--ink-3)"></i>Open Mic\'d Up slot</span></div></div>'+
    '<div class="grid2" style="margin-top:22px">'+
      '<div class="card agcard"><div class="ch"><h2>Next Two Weeks</h2><span class="cnt">'+ag.length+'</span><span class="note">setup tasks are under Getting Set Up</span></div><div class="agenda">'+(agh||'<div class="empty">Nothing due in the next two weeks.</div>')+'</div></div>'+
      '<div class="card setcard"><div class="ch"><h2>Getting Set Up</h2><span class="cnt">'+sOpen.length+' open</span><div class="r"><button class="btn sm" type="button" id="ov-newsetup">+ Add</button></div></div>'+setupHtml+'</div>'+
    '</div>';
  // wire
  $$(".tile[data-go]",el).forEach(b=>b.onclick=()=>go(b.dataset.go));
  $("#cal-prev",el).onclick=()=>{ OV.month=iso(new Date(yy,mm-2,1)).slice(0,7); renderOverview(); };
  $("#cal-next",el).onclick=()=>{ OV.month=iso(new Date(yy,mm,1)).slice(0,7); renderOverview(); };
  $("#cal-today",el).onclick=()=>{ OV.month=T().slice(0,7); renderOverview(); };
  $$(".cal .d",el).forEach(c=>{ const list=(byDate[c.dataset.date]||[]).sort((a,b)=>(b.big?1:0)-(a.big?1:0)); $$(".ev",c).forEach((b,i)=>b.onclick=()=>list[i].go()); });
  $$(".agi",el).forEach(b=>b.onclick=()=>agList[+b.dataset.agi].go());
  const sd=$("#ov-sdone",el); if(sd) sd.onclick=()=>{ OV.showDone=!OV.showDone; renderOverview(); };
  const sl=$("#ov-slater",el); if(sl) sl.onclick=()=>{ OV.showLater=!OV.showLater; renderOverview(); };
  $("#ov-newpiece",el).onclick=()=>newPiece("linkedin");
  $("#ov-newsetup",el).onclick=()=>newPiece("setup");
  wireChecks(el); wireLanes(el);
}
/* short channel names for the agenda tags, and the owner badge */
const CHS = {matters:"Matters", micdup:"Mic'd Up", linkedin:"LinkedIn", youtube:"YouTube", mailchimp:"Mailchimp", summit:"Summit", orders:"Order", community:"Community", news:"News", setup:"Setup", request:"Request", other:"Other"};
function agTitle(e){ let l=String(e.label||""); [CH[e.k], CHS[e.k]].forEach(p=>{ if(p && l.indexOf(p+" · ")===0) l=l.slice(p.length+3); else if(p && l.indexOf(p+" ")===0 && e.k==="micdup") l=l.slice(p.length+1); }); return l; }
const WHO_TONE = {Jonna:1,Vanessa:2,Kelly:3,Amy:4,Brian:5,Jonathan:6,Perry:7,Kathryn:8};
function whoHtml(w){ if(!w) return '<span class="who none"></span>'; return '<span class="who" title="'+esc(w)+'"><i class="av t'+(WHO_TONE[w]||0)+'">'+esc(w.charAt(0))+'</i><span class="wn">'+esc(w)+'</span></span>'; }
function wireChecks(el){
  $$("[data-done]",el).forEach(cb=>cb.onchange=async()=>{
    const id=cb.dataset.done, before=(S.pieces[id]||{}).status||"draft";
    await patch("pieces",id,{status: cb.checked?"done":(before==="done"?"draft":before)});
    toast(cb.checked?"Marked done":"Marked not done");
  });
  $$("[data-open]",el).forEach(b=>b.onclick=()=>openPiece(b.dataset.open));
}
