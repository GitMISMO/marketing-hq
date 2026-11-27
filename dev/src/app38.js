
/* ================= MyMISMO: Summit Alerts and Slides (CN-063, approved by Jonna Nov 27, 2026) =================
   Moved from Summit HQ (its CN-037 page; Summit HQ takes its copy out in CN-065) to the MyMISMO page here, next to
   Attendee Reports and MISMO Trivia (app37.js). No relay change: the same routes and feed shape as CN-037.
   - Summits and sessions: the public website agenda, /summit-agenda/agenda.json (summits.<id>.grid.sessions, each
     {id, day, date, start, end, type, title, room}). The summit ids and session ids are MyMISMO's own.
   - Summit Alerts: a title (80), a message (300) and, optionally, the session it's about (its agenda id), with a
     phone preview. Send to Phones asks once, then POSTs /mymismo/push/send {summit, title, body, session} with the
     person's own sign-in; the relay answers {ok, sent, failed, removed, id}. Send shows only to the people in the
     mymismo entry's alertSenders (MYA_SENDERS mirrors it; anyone MyMISMO's staff routes answer 200 for is in it too;
     the relay checks again) and only once GET /mymismo/push/ready answers 200. Nothing is ever sent on its own.
     What was sent is kept in mymismoalerts/<summit> {list:[{id, title, body, session, sessionTitle, at, by, sent, failed}]}.
   - Slides: Add Slides on each agenda session (PDF or PowerPoint, up to 25 MB). A file is stored in the PRIVATE data
     repo marketing-hq-data in Summit HQ's chunked format, through window.__hqFile (dev/shim.html): parts
     data/slide-<id>--<ver>-<i>.json {s} holding the file's data: URL in 800,000-character pieces, then the head
     data/slide-<id>.json {chunked:{ver, n}}. The list is mymismoslides/<summit> {sessions:{<agenda id>:[{id, name,
     type, size, file, parts, at, by, gone?}]}}; taking a file off sets gone:true and keeps the file (archive, never
     delete). After every change the feed data/feed-mymismo-slides.json is rewritten as is:
       {updated, summits:{<summit id>:{sessions:{<agenda session id>:[{name, type, size, file, parts}]}}}}
     (retired files left out). Only the save relay reads it (the mymismo entry's slidesFeed, CN-064), and only
     attendees signed in to MyMISMO can download the files. Add fields later, never rename.
   Never in tour mode. Contract: Connections Map row "MISMO Media (MyMISMO: Summit Alerts and Slides) → MyMISMO".
   dev/tests/myslides.js checks it. */
const MYA_RELAY = "https://rgvdi67cg27o5kcmiytcqbqnrm0hmztx.lambda-url.us-east-1.on.aws/mymismo/push/";
const MYA_SENDERS = ["jcritchley@mismo.org"];   /* the mymismo entry's alertSenders (the relay checks again); change both together */
const MYA_MAXT=80, MYA_MAXB=300, MYA_MAXSIZE=25*1024*1024, MYA_CHUNK=800000, MYA_FEED="feed-mymismo-slides";
const MYA_TYPES={pdf:"application/pdf", ppt:"application/vnd.ms-powerpoint", pptx:"application/vnd.openxmlformats-officedocument.presentationml.presentation"};
const MYA={agenda:null, agendaAt:0, ready:null, readyAt:0, sid:"", draft:{title:"", body:"", session:""}, busy:"", msg:null, smsg:{}, prog:{}, synced:false};
function myaEmail(){ try{ const s=window.ResourcesSession && window.ResourcesSession.current && window.ResourcesSession.current(); return String((s&&s.email)||"").toLowerCase(); }catch(e){ return ""; } }
function myaSender(){ return MYA_SENDERS.includes(myaEmail()) || mymOn("rep") || mymOn("tri") || mymOn("stats"); }
/* the page shows Summit Alerts and Slides to anyone who can save in MISMO Media and is signed in */
function myaOn(){ return !TOUR && CANWRITE && !!mymTok(); }
async function myaLoad(force){
  if(TOUR || !mymTok()) return;
  const jobs=[];
  if(force || !MYA.agendaAt || Date.now()-MYA.agendaAt>5*60000){
    MYA.agendaAt=Date.now();
    jobs.push(fetch("/summit-agenda/agenda.json",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(j=>{ if(j && j.summits) MYA.agenda=j; }).catch(()=>{}));
  }
  if(force || !MYA.readyAt || Date.now()-MYA.readyAt>5*60000){
    MYA.readyAt=Date.now();
    jobs.push(fetch(MYA_RELAY+"ready",{cache:"no-store"}).then(r=>{ MYA.ready=r.status===200; }).catch(()=>{ MYA.ready=false; }));
  }
  await Promise.all(jobs);
  if(!MYA.synced && CANWRITE && LIVE && LOADED.has("mymismoslides") && window.__hqFile){ MYA.synced=true; myaPublish(); }
  if(TAB==="mymismo" && (MYM.sub==="alerts" || MYM.sub==="slides")) renderTab(TAB);
}
if(!TOUR){
  setTimeout(()=>myaLoad(true), 1600);
  setInterval(()=>myaLoad(false), 60000);
}
/* the summits: the website agenda's, plus any we already hold alerts or slides for */
function myaSummits(){
  const a=(MYA.agenda&&MYA.agenda.summits)||{}, ids=Object.keys(a);
  Object.keys(S.mymismoslides||{}).concat(Object.keys(S.mymismoalerts||{})).forEach(k=>{ if(!ids.includes(k)) ids.push(k); });
  return ids.map(id=>({id, name:(a[id]&&a[id].name)||mymSummit(id), dates:(a[id]&&a[id].dates)||"", inAgenda:!!a[id]}));
}
function myaSid(){
  const ss=myaSummits(); if(!ss.length) return "";
  if(!ss.some(s=>s.id===MYA.sid)) MYA.sid=(ss.find(s=>s.inAgenda)||ss[0]).id;
  return MYA.sid;
}
function myaSessions(sid){
  const s=MYA.agenda && MYA.agenda.summits && MYA.agenda.summits[sid]; if(!s || !s.grid) return null;
  const list=Array.isArray(s.grid) ? s.grid : (s.grid.sessions||[]);
  return list.filter(x=>x && x.id).slice().sort((a,b)=>String(a.date||"").localeCompare(String(b.date||"")) || String(a.start||"").localeCompare(String(b.start||"")));
}
const myaT12=hm=>{ const m=String(hm||"").match(/^(\d{1,2}):(\d{2})/); if(!m) return ""; let h=+m[1]; const ap=h>=12?"PM":"AM"; h=h%12||12; return h+":"+m[2]+" "+ap; };
const myaSize=n=>{ n=Number(n)||0; return n>=1048576?(n/1048576).toFixed(1)+" MB":Math.max(1,Math.round(n/1024))+" KB"; };
const myaLive=f=>!!f && !f.gone && !!f.file;
function myaSesTitle(sid, id){ const s=(myaSessions(sid)||[]).find(x=>x.id===id); return s ? s.title : ""; }
function myaPicker(){
  const ss=myaSummits(), sid=myaSid();
  if(ss.length<2) return ss.length ? '<p class="mya-sum"><b>'+esc(ss[0].name)+'</b>'+(ss[0].dates?' · '+esc(ss[0].dates):'')+'</p>' : '';
  return '<label class="mya-sum"><span class="flabel">Summit</span><select id="mya-sid">'+ss.map(s=>'<option value="'+esc(s.id)+'"'+(s.id===sid?' selected':'')+'>'+esc(s.name+(s.dates?" · "+s.dates:""))+'</option>').join("")+'</select></label>';
}
function myaWirePicker(el){ const p=$("#mya-sid",el); if(p) p.onchange=()=>{ MYA.sid=p.value; MYA.draft.session=""; MYA.msg=null; MYA.smsg={}; renderMyMISMO(); }; }

/* ---- Summit Alerts ---- */
function myaAlertsHtml(){
  const sid=myaSid();
  if(!sid) return '<div class="card"><div class="empty">'+(MYA.agendaAt&&!MYA.agenda?'The website agenda didn\'t load, so there\'s no summit to write for. Try again in a minute.':'Loading the summits from the website agenda…')+'</div></div>';
  const d=MYA.draft, tl=d.title.length, bl=d.body.length, list=myaSessions(sid)||[], sTitle=myaSesTitle(sid,d.session), name=(myaSummits().find(s=>s.id===sid)||{}).name;
  const opts=['<option value="">Not about one session</option>'].concat(list.map(s=>'<option value="'+esc(s.id)+'"'+(s.id===d.session?' selected':'')+'>'+esc(String(s.day||"").slice(0,3)+' '+myaT12(s.start)+' · '+s.title)+'</option>'));
  let act;
  if(MYA.ready===null) act='<span class="mya-note">Checking whether MyMISMO alerts are switched on…</span>';
  else if(!MYA.ready) act='<span class="mya-note">MyMISMO alerts aren\'t switched on yet (the save relay has to be set up for them). You can write an alert; Send to Phones shows once they\'re on.</span>';
  else if(!myaSender()) act='<span class="mya-note">Only the people Jonna named in MyMISMO can send summit alerts.</span>';
  else act='<button class="btn pri" type="button" id="mya-send"'+(MYA.busy||!d.title.trim()||!d.body.trim()||tl>MYA_MAXT||bl>MYA_MAXB?' disabled':'')+'>Send to Phones</button>';
  const m=MYA.msg;
  const sent=(((S.mymismoalerts||{})[sid]||{}).list||[]).slice().sort((a,b)=>String(b.at).localeCompare(String(a.at)));
  return myaPicker()+'<div class="mya-grid"><div class="card"><div class="ch"><h2>Send a Summit Alert</h2></div><div class="cb">'+
    '<p class="mya-lede">Goes to every phone that turned on MyMISMO alerts for '+esc(name||"this summit")+', and shows in the app\'s inbox. Use it for room changes and summit news. Nothing is sent until you press Send to Phones and say yes.</p>'+
    '<div class="mya-row"><div class="mya-form">'+
    '<label class="flabel" for="mya-t">Title <small id="mya-tc" class="'+(tl>MYA_MAXT?'over':'')+'">'+tl+' of '+MYA_MAXT+'</small></label><input type="text" id="mya-t" maxlength="'+MYA_MAXT+'" value="'+esc(d.title)+'" placeholder="Room Change: Data Standards COP">'+
    '<label class="flabel" for="mya-b">Message <small id="mya-bc" class="'+(bl>MYA_MAXB?'over':'')+'">'+bl+' of '+MYA_MAXB+'</small></label><textarea id="mya-b" rows="4" maxlength="'+MYA_MAXB+'" placeholder="The Data Standards COP has moved to Napoleon Ballroom C.">'+esc(d.body)+'</textarea>'+
    '<label class="flabel" for="mya-s">Session It\'s About <small>optional; tapping the alert opens it</small></label><select id="mya-s">'+opts.join("")+'</select>'+
    '<div class="mya-acts">'+act+'</div><div class="mya-msg'+(m&&m.bad?' bad':'')+'" id="mya-msg" role="status" aria-live="polite">'+esc(m?m.t:"")+'</div></div>'+
    '<div class="mya-phone" aria-label="How it looks on a phone"><div class="mya-clock">9:41</div><div class="mya-pn"><div class="mya-app"><span>MyMISMO</span><span>now</span></div><b id="mya-pt">'+esc(d.title||"Your title")+'</b><p id="mya-pb">'+esc(d.body||"Your message shows here.")+'</p></div>'+
    '<div class="mya-tap" id="mya-tap">'+(sTitle?'Tapping it opens '+esc(sTitle):'')+'</div></div></div></div></div>'+
    '<div class="card"><div class="ch"><h2>Alerts Sent</h2><span class="cnt">'+sent.length+'</span></div><div class="cb">'+
    (sent.length?'<table class="t"><thead><tr><th>Sent</th><th>Alert</th><th class="num">Phones</th></tr></thead><tbody>'+sent.map(a=>'<tr><td>'+esc(mymWhen(a.at))+'<br><small class="t2">'+esc(a.by||"")+'</small></td><td><b>'+esc(a.title)+'</b><br><small>'+esc(a.body)+'</small>'+(a.session?'<br><small class="t2">About: '+esc(a.sessionTitle||a.session)+'</small>':'')+'</td><td class="num">'+rsN(+a.sent||0)+(a.failed?'<br><small class="t2">'+rsN(a.failed)+' not reached</small>':'')+'</td></tr>').join("")+'</tbody></table>'
      :'<div class="empty">No alerts sent for this summit yet.</div>')+'</div></div></div>';
}
function myaSoft(){
  const d=MYA.draft, set=(id,t)=>{ const n=$("#"+id); if(n) n.textContent=t; };
  set("mya-pt", d.title||"Your title"); set("mya-pb", d.body||"Your message shows here.");
  const tc=$("#mya-tc"), bc=$("#mya-bc");
  if(tc){ tc.textContent=d.title.length+" of "+MYA_MAXT; tc.className=d.title.length>MYA_MAXT?"over":""; }
  if(bc){ bc.textContent=d.body.length+" of "+MYA_MAXB; bc.className=d.body.length>MYA_MAXB?"over":""; }
  const b=$("#mya-send"); if(b) b.disabled=!!MYA.busy||!d.title.trim()||!d.body.trim()||d.title.length>MYA_MAXT||d.body.length>MYA_MAXB;
  if(MYA.msg && !MYA.busy){ MYA.msg=null; set("mya-msg",""); }
}
function myaWireAlerts(el){
  myaWirePicker(el);
  const t=$("#mya-t",el), b=$("#mya-b",el), s=$("#mya-s",el);
  if(t) t.oninput=()=>{ MYA.draft.title=t.value; myaSoft(); };
  if(b) b.oninput=()=>{ MYA.draft.body=b.value; myaSoft(); };
  if(s) s.onchange=()=>{ MYA.draft.session=s.value; const sid=myaSid(), st=myaSesTitle(sid,s.value), tap=$("#mya-tap"); if(tap) tap.textContent=st?"Tapping it opens "+st:""; };
  const go=$("#mya-send",el); if(go) go.onclick=()=>myaSend();
}
async function myaSend(){
  const sid=myaSid(), d=MYA.draft, title=d.title.trim(), body=d.body.trim(), session=d.session||"";
  const say=(t,bad)=>{ MYA.msg={t, bad:!!bad}; renderMyMISMO(); };
  if(!sid || !title || !body) return say("An alert needs a title and a message.", true);
  if(title.length>MYA_MAXT || body.length>MYA_MAXB) return say("The title can be up to "+MYA_MAXT+" characters and the message up to "+MYA_MAXB+".", true);
  if(MYA.busy || !myaSender() || !MYA.ready) return;
  const tok=mymTok(); if(!tok) return say("Sign in to resources.mismo.org first. Nothing was sent.", true);
  const name=(myaSummits().find(s=>s.id===sid)||{}).name||sid, sTitle=myaSesTitle(sid,session);
  if(!window.confirm("Send this alert now to every phone with MyMISMO alerts on for "+name+"?\n\n"+title+"\n"+body+(sTitle?"\n\nAbout: "+sTitle:"")+"\n\nIt can't be taken back once sent.")) return;
  MYA.busy="send"; say("Sending…");
  let res=null, j={};
  try{ res=await fetch(MYA_RELAY+"send",{method:"POST", cache:"no-store", headers:{"Authorization":"Bearer "+tok, "Content-Type":"application/json"}, body:JSON.stringify({summit:sid, title, body, session})}); j=await res.json().catch(()=>({})); }catch(e){ res=null; }
  MYA.busy="";
  if(res && res.ok && j && j.ok!==false){
    const n=+j.sent||0, failed=+j.failed||0;
    const entry={id:String(j.id||("A"+Date.now().toString(36))), title, body, session, sessionTitle:sTitle, at:new Date().toISOString(), by:myaEmail()||WHO(), sent:n, failed};
    MYA.draft={title:"", body:"", session:""};
    let note="Sent to "+n+" phone"+(n===1?"":"s")+(failed?" ("+failed+" couldn't be reached)":"")+".";
    try{ const cur=(S.mymismoalerts||{})[sid]; if(await put("mymismoalerts", sid, Object.assign({}, cur||{}, {summit:sid, list:((cur&&cur.list)||[]).concat([entry])}))===false) note+=" (It wasn't added to the list here.)"; }
    catch(e){ note+=" (It wasn't added to the list here: "+((e&&e.message)||"try again")+".)"; }
    return say(note);
  }
  const st=res?res.status:0;
  if(st===404) MYA.ready=false;
  say(!res ? "Couldn't reach the save relay. Nothing was sent; try again."
    : st===403 ? ((j&&j.message)||"Only the people Jonna named can send summit alerts.")+" Nothing was sent."
    : st===401 ? "Your sign-in has run out. Sign in again and send it again. Nothing was sent."
    : st===404 ? "MyMISMO alerts aren't switched on yet. Nothing was sent."
    : st===429 ? ((j&&j.message)||"That's a lot of alerts in an hour. Please wait.")
    : st===400 ? ((j&&j.problems&&j.problems.join(" "))||"The relay didn't accept that alert.")+" Nothing was sent."
    : "The relay answered "+st+". It may or may not have gone out; check MyMISMO before sending again.", true);
}

/* ---- Slides ---- */
function myaFeed(){
  const out={}, all=S.mymismoslides||{};
  Object.keys(all).sort().forEach(sid=>{
    const ses=(all[sid]&&all[sid].sessions)||{}, one={};
    Object.keys(ses).sort().forEach(k=>{ const l=(ses[k]||[]).filter(myaLive).map(f=>({name:f.name, type:f.type, size:Number(f.size)||0, file:f.file, parts:Number(f.parts)||1})); if(l.length) one[k]=l; });
    if(Object.keys(one).length) out[sid]={sessions:one};
  });
  return out;
}
let myaPubChain=Promise.resolve();
function myaPublish(){
  const go=async()=>{
    const F=window.__hqFile; if(!F || !LOADED.has("mymismoslides")) return false;
    for(let tries=0; tries<6; tries++){
      const want=myaFeed(); let cur=null, sha=null;
      try{ const b=await F.get(MYA_FEED); cur=b&&b.data; sha=(b&&b.sha)||null; }catch(e){ return false; }
      if(cur && JSON.stringify(cur.summits||{})===JSON.stringify(want)) return true;
      try{ await F.put(MYA_FEED, {updated:new Date().toISOString(), summits:want}, sha); return true; }
      catch(e){ if(!(e && e.status===409)) return false; await new Promise(r=>setTimeout(r, 400+Math.random()*600)); }
    }
    return false;
  };
  const p=myaPubChain.then(go,go); myaPubChain=p.catch(()=>{}); return p;
}
function myaRead(file){ return new Promise((res,rej)=>{ const fr=new FileReader(); fr.onload=()=>res(String(fr.result||"")); fr.onerror=()=>rej(fr.error||new Error("Couldn't read the file")); fr.readAsDataURL(file); }); }
async function myaUpload(sesId, files){
  const sid=myaSid(), F=window.__hqFile; if(!sid || !myaOn()) return;
  const say=(t,bad)=>{ MYA.smsg[sesId]={t, bad:!!bad}; renderMyMISMO(); };
  if(!F || !LOADED.has("mymismoslides")) return say("Saving isn't ready yet. Try again in a moment.", true);
  for(const file of files){
    const ext=String(file.name||"").toLowerCase().split(".").pop(), type=MYA_TYPES[ext];
    if(!type){ say(file.name+" isn't a PDF or PowerPoint file.", true); continue; }
    if(file.size>MYA_MAXSIZE){ say(file.name+" is "+myaSize(file.size)+"; slides can be up to 25 MB. Save a smaller copy (File › Compress Pictures, or a PDF).", true); continue; }
    try{
      MYA.prog[sesId]="Reading "+file.name+"…"; renderMyMISMO();
      const url=await myaRead(file), data="data:"+type+";base64,"+url.slice(url.indexOf(",")+1);
      const id=(Date.now().toString(36)+Math.random().toString(36).slice(2,6)).replace(/[^a-z0-9]/g,""), name="slide-"+id, ver=Date.now().toString(36), n=Math.max(1,Math.ceil(data.length/MYA_CHUNK));
      for(let i=0;i<n;i++){ MYA.prog[sesId]="Uploading "+file.name+(n>1?" (part "+(i+1)+" of "+n+")":"")+"…"; renderMyMISMO(); await F.put(name+"--"+ver+"-"+i, {s:data.slice(i*MYA_CHUNK,(i+1)*MYA_CHUNK)}, null); }
      await F.put(name, {chunked:{ver, n}}, null);
      const cur=S.mymismoslides[sid]||{}, next=JSON.parse(JSON.stringify(cur.sessions||{}));
      (next[sesId]=Array.isArray(next[sesId])?next[sesId]:[]).push({id, name:String(file.name).slice(0,160), type, size:file.size, file:"data/"+name+".json", parts:n, at:new Date().toISOString(), by:myaEmail()||WHO()});
      if(await put("mymismoslides", sid, Object.assign({}, cur, {summit:sid, sessions:next}))===false) throw new Error("not saved");
      delete MYA.prog[sesId];
      const ok=await myaPublish();
      say(ok ? file.name+" is on MyMISMO." : file.name+" is saved here, but MyMISMO's slides list didn't update. It updates with the next change, or try again.", !ok);
    }catch(e){ delete MYA.prog[sesId]; say(file.name+" didn't upload ("+((e&&e.message)||"try again")+"). Nothing reached MyMISMO; try again.", true); }
  }
}
async function myaRemove(sesId, fid){
  const sid=myaSid(), cur=S.mymismoslides[sid]; if(!cur || !myaOn()) return;
  const f=((cur.sessions||{})[sesId]||[]).find(x=>x.id===fid); if(!f) return;
  if(!window.confirm("Take “"+f.name+"” off MyMISMO? Attendees will no longer see it. The file is kept.")) return;
  const next=JSON.parse(JSON.stringify(cur.sessions||{}));
  next[sesId]=next[sesId].map(x=>x.id===fid?Object.assign(x,{gone:true, goneAt:new Date().toISOString(), goneBy:myaEmail()||WHO()}):x);
  try{ if(await put("mymismoslides", sid, Object.assign({}, cur, {sessions:next}))===false) return; const ok=await myaPublish(); MYA.smsg[sesId]={t:ok?f.name+" was taken off MyMISMO.":"Taken off here, but MyMISMO's slides list didn't update yet. Try again in a moment.", bad:!ok}; }
  catch(e){ MYA.smsg[sesId]={t:"That didn't save: "+((e&&e.message)||"try again"), bad:true}; }
  renderMyMISMO();
}
/* opens a stored file (a PDF in a new tab; a PowerPoint downloads) */
async function myaOpen(f){
  const F=window.__hqFile; if(!F) return;
  const win=f.type==="application/pdf"?window.open("","_blank"):null;
  try{
    const name=String(f.file).replace(/^data\//,"").replace(/\.json$/,""), head=await F.get(name), c=head&&head.data&&head.data.chunked;
    let s="";
    if(c){ for(let i=0;i<c.n;i++){ const p=await F.get(name+"--"+c.ver+"-"+i); s+=(p&&p.data&&p.data.s)||""; } } else s=(head&&head.data&&head.data.s)||"";
    if(!s) throw new Error("the file wasn't found");
    const bin=atob(s.slice(s.indexOf(",")+1)), u8=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i);
    const url=URL.createObjectURL(new Blob([u8],{type:f.type}));
    if(win) win.location=url; else { const a=document.createElement("a"); a.href=url; a.download=f.name; document.body.appendChild(a); a.click(); a.remove(); }
    setTimeout(()=>URL.revokeObjectURL(url), 60000);
  }catch(e){ if(win) win.close(); window.alert("That file couldn't be opened: "+((e&&e.message)||"try again")); }
}
function myaSlidesHtml(){
  const sid=myaSid();
  if(!sid) return '<div class="card"><div class="empty">'+(MYA.agendaAt&&!MYA.agenda?'The website agenda didn\'t load, so there are no sessions to add slides to. Try again in a minute.':'Loading the sessions from the website agenda…')+'</div></div>';
  const list=myaSessions(sid), ses=((S.mymismoslides||{})[sid]||{}).sessions||{}, can=myaOn();
  const row=(s, off)=>{
    const fl=(ses[s.id]||[]).filter(myaLive), m=MYA.smsg[s.id], pg=MYA.prog[s.id];
    if(off && !fl.length) return "";
    return '<div class="mya-ses" data-mya-ses="'+esc(s.id)+'"><div class="mya-when">'+(off?'Not on the agenda':esc(myaT12(s.start)+(s.end?' – '+myaT12(s.end):'')))+'</div>'+
      '<div class="mya-what"><b>'+esc(s.title||s.id)+'</b><small>'+esc([s.type, s.room].filter(Boolean).join(" · "))+'</small>'+
      (fl.length?'<div class="mya-files">'+fl.map(f=>'<span class="mya-file"><button type="button" class="mya-link" data-mya-open="'+esc(f.id)+'" title="Open '+esc(f.name)+'">'+esc(f.name)+'</button><small>'+myaSize(f.size)+'</small>'+(can?'<button type="button" class="mya-x" data-mya-rm="'+esc(f.id)+'" aria-label="Take '+esc(f.name)+' off MyMISMO" title="Take off MyMISMO">×</button>':'')+'</span>').join("")+'</div>':'')+
      (pg?'<div class="mya-msg">'+esc(pg)+'</div>':m?'<div class="mya-msg'+(m.bad?' bad':'')+'">'+esc(m.t)+'</div>':'')+'</div>'+
      '<div>'+(can&&!off?'<label class="btn sm mya-add">Add Slides<input type="file" hidden multiple accept=".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" data-mya-up="'+esc(s.id)+'"></label>':'')+'</div></div>';
  };
  let body="";
  if(!list) body='<div class="empty">This summit\'s sessions aren\'t on the website agenda yet. They show once Summit HQ puts the week on the website agenda.</div>';
  else {
    let day="";
    list.forEach(s=>{ if(s.day!==day){ day=s.day; body+='<div class="mya-day">'+esc(day+(s.date?" · "+fS(s.date):""))+'</div>'; } body+=row(s,false); });
    const extra=Object.keys(ses).filter(k=>!list.some(s=>s.id===k)).map(k=>row({id:k, title:k},true)).join("");
    if(extra) body+='<div class="mya-day">Slides on Sessions No Longer on the Agenda</div>'+extra;
  }
  return myaPicker()+'<div class="card"><div class="ch"><h2>Presentation Slides</h2></div><div class="cb">'+
    '<p class="mya-lede">Add a session\'s slides (PDF or PowerPoint, up to 25 MB each). Attendees signed in to MyMISMO can download them from the session; nobody else can. Taking a file off removes it from MyMISMO and keeps the file here.</p>'+body+'</div></div>';
}
function myaWireSlides(el){
  myaWirePicker(el);
  $$("[data-mya-up]",el).forEach(inp=>inp.onchange=()=>{ const fs=[...(inp.files||[])]; inp.value=""; if(fs.length) myaUpload(inp.dataset.myaUp, fs); });
  $$("[data-mya-ses]",el).forEach(row=>{
    const sesId=row.dataset.myaSes;
    $$("[data-mya-rm]",row).forEach(b=>b.onclick=()=>myaRemove(sesId, b.dataset.myaRm));
    $$("[data-mya-open]",row).forEach(b=>b.onclick=()=>{ const f=((((S.mymismoslides||{})[myaSid()]||{}).sessions||{})[sesId]||[]).find(x=>x.id===b.dataset.myaOpen); if(f) myaOpen(f); });
  });
}
(function(){
  const st=document.createElement("style");
  st.textContent='.mya-sum{display:flex;gap:10px;align-items:center;margin:0 0 14px}.mya-sum select{min-width:260px}'+
    '.mya-grid{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:22px;align-items:start}@media(max-width:1100px){.mya-grid{grid-template-columns:1fr}}'+
    '.mya-lede{font-size:13px;color:var(--ink-2);margin:0 0 10px}.mya-row{display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start}.mya-form{flex:1 1 280px;min-width:0}'+
    '.mya-form input,.mya-form textarea,.mya-form select{width:100%;box-sizing:border-box;margin-bottom:8px}.mya-form small{font-weight:500;color:var(--ink-3);margin-left:6px}.mya-form small.over{color:var(--bad)}'+
    '.mya-acts{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:6px}.mya-note{font-size:12.5px;color:var(--ink-3)}'+
    '.mya-msg{font-size:13px;min-height:1.2em;margin:6px 0 0}.mya-msg.bad{color:var(--bad)}'+
    '.mya-phone{flex:0 0 240px;background:#0d314c;border-radius:22px;padding:18px 12px 22px;color:#fff}.mya-clock{text-align:center;font-size:30px;font-weight:300;margin:4px 0 12px}'+
    '.mya-pn{background:rgba(255,255,255,.92);color:#0d314c;border-radius:12px;padding:10px 12px}.mya-pn b{display:block;font-size:13px;margin:2px 0}.mya-pn p{margin:0;font-size:12.5px;line-height:1.35;overflow-wrap:anywhere}'+
    '.mya-app{display:flex;justify-content:space-between;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:#4a6378}.mya-tap{font-size:11px;color:#a9cbe2;margin-top:8px;text-align:center}'+
    '.mya-day{font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;font-weight:700;color:var(--ink-3);margin:16px 0 6px}'+
    '.mya-ses{display:grid;grid-template-columns:130px minmax(0,1fr) auto;gap:12px;align-items:start;padding:8px 0;border-top:1px solid var(--border)}@media(max-width:600px){.mya-ses{grid-template-columns:1fr}}'+
    '.mya-when{font-size:12.5px;color:var(--ink-3)}.mya-what small{display:block;font-size:12px;color:var(--ink-3)}'+
    '.mya-files{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.mya-file{display:inline-flex;gap:6px;align-items:center;border:1px solid var(--border);border-radius:4px;padding:3px 6px;font-size:12.5px;background:var(--surface-2)}'+
    '.mya-link{background:none;border:0;padding:0;font:inherit;color:var(--link,#1a6fb0);text-decoration:underline;cursor:pointer}.mya-x{background:none;border:0;cursor:pointer;font-size:15px;line-height:1;color:var(--ink-3)}'+
    '.mya-add{cursor:pointer}';
  document.head.appendChild(st);
})();
