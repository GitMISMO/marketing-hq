
/* ================= Push to MyMISMO (CN-049, approved by Jonna Nov 26, 2026) =================
   MyMISMO has a second, separate opt-in notification, "MISMO Matters and Mic'd Up". It is sent only when someone presses
   Push to MyMISMO here, on a MISMO Matters edition that has gone out or a Mic'd Up episode that is public on YouTube:
   never on publish, on a schedule or on a timer. The words are filled in and can be edited first. Sending goes through
   the save relay (relay request 16: POST /mymismo/push/news) with the person's own resources.mismo.org sign-in; only the
   people Jonna named (MyMISMO's alertSenders) can send. Each push is noted on the edition or episode (mymismo:{at, by,
   n, title, body}) and the newest one shows on System Health. Tapping the notification opens MyMISMO on that edition or
   episode; a pushed episode joins the app's Mic'd Up list right away. */
const MYP_URL = "https://rgvdi67cg27o5kcmiytcqbqnrm0hmztx.lambda-url.us-east-1.on.aws/mymismo/push/news";
const MYP_MAXT = 80, MYP_MAXB = 300;
const MYP = {open:null, busy:false, last:null};
function mypTok(){ try{ return (window.ResourcesSession && window.ResourcesSession.token()) || ""; }catch(e){ return ""; } }
function mypEdReady(ed){ return !!(ed && !ed.archived && ed.done && ed.done.publish); }
function mypEpReady(e){ return !!(e && e.youtubeDone && ytId(e.youtubeUrl)); }
function mypVieaux(ed){ const s=edSections(ed).find(x=>x.k==="vieaux" && x.on); return s ? String(s.doc.headline||"").trim() : ""; }
function mypRec(kind, x){ return (x && x.mymismo) || null; }
function mypFill(kind, x){
  if(kind==="matters"){ const v=mypVieaux(x); return {title:("MISMO Matters: "+monthName(x.month)).slice(0,MYP_MAXT), body:(v?"The Vieaux Point: "+v:"The "+monthName(x.month)+" edition of MISMO Matters is here.").slice(0,MYP_MAXB)}; }
  const t=String(x.title||"").trim(), g=String(x.guests||"").trim();
  return {title:"New MISMO Mic'd Up Episode", body:((t||epWord(x))+(g && t.toLowerCase().indexOf(g.toLowerCase())<0?" with "+g:"")).slice(0,MYP_MAXB)};
}
/* the button, on an edition that has gone out or an episode that is public on YouTube */
function myPushHtml(kind, x){
  if(!CANWRITE || !(kind==="matters"?mypEdReady(x):mypEpReady(x))) return "";
  const r=mypRec(kind,x);
  return '<span class="myp-wrap"><button class="btn sm" type="button" data-mypush="'+kind+'" data-myref="'+esc(x.id)+'">Push to MyMISMO</button>'+
    (r&&r.at?'<span class="myp-done">Pushed to MyMISMO '+esc(fS(localDay(r.at)))+(r.n!=null?' · '+rsN(r.n)+' phone'+(+r.n===1?'':'s'):'')+'</span>':'')+'</span>';
}
function mypItem(kind, ref){ return kind==="matters" ? vals("editions").find(e=>e.id===ref) : vals("episodes").find(e=>e.id===ref); }
function mypClose(){ const d=$("#myp-pop"); if(d){ d.remove(); } const back=MYP.open&&MYP.open.from; MYP.open=null; if(back && back.focus) try{ back.focus(); }catch(e){} }
function mypOpen(kind, ref, from){
  const x=mypItem(kind, ref); if(!x) return;
  mypClose();
  const f=mypFill(kind, x); MYP.open={kind, ref, from};
  const d=document.createElement("div"); d.id="myp-pop"; d.setAttribute("role","dialog"); d.setAttribute("aria-modal","true"); d.setAttribute("aria-labelledby","myp-h");
  const r=mypRec(kind,x);
  d.innerHTML='<div class="myp-card"><div class="myp-eye">'+(kind==="matters"?"MISMO Matters · "+esc(monthName(x.month)):"Mic'd Up · "+esc(epWord(x)))+'</div><h2 id="myp-h">Push to MyMISMO</h2>'+
    (r&&r.at?'<p class="myp-was">Already pushed '+esc(fS(localDay(r.at)))+(r.by?' by '+esc(r.by):'')+'. Sending again is only for a correction.</p>':'')+
    '<label class="flabel" for="myp-t">Title</label><input type="text" id="myp-t" maxlength="'+MYP_MAXT+'" value="'+esc(f.title)+'"><div class="myp-cnt" id="myp-tc"></div>'+
    '<label class="flabel" for="myp-b">Message</label><textarea id="myp-b" rows="3" maxlength="'+MYP_MAXB+'">'+esc(f.body)+'</textarea><div class="myp-cnt" id="myp-bc"></div>'+
    '<div class="myp-prev" aria-label="Preview"><div class="myp-app">MyMISMO</div><b id="myp-pt"></b><span id="myp-pb"></span></div>'+
    '<p class="myp-who">This goes to everyone who turned on MISMO Matters and Mic\'d Up notifications in MyMISMO.</p>'+
    '<div class="myp-msg" id="myp-msg" role="status" aria-live="polite"></div>'+
    '<div class="myp-btns"><button class="btn pri" type="button" id="myp-send">Send to MyMISMO</button><button class="btn" type="button" id="myp-cancel">Cancel</button></div>'+
    '<ul class="myp-rules"><li>Only news about this '+(kind==="matters"?"edition":"episode")+'.</li><li>No sponsor ads, offers or promotions.</li><li>No personal or sensitive information.</li><li>Nothing styled as a warning or a system message.</li></ul>'+
    '<p class="myp-note">Apple and Google Play rules for notifications. Phones show about the first 100 characters of the message.</p></div>';
  document.body.appendChild(d);
  const ti=$("#myp-t",d), bi=$("#myp-b",d);
  const upd=()=>{ $("#myp-tc",d).textContent=ti.value.length+" of "+MYP_MAXT; $("#myp-bc",d).textContent=bi.value.length+" of "+MYP_MAXB+(bi.value.length>100?" · phones show about the first 100":"");
    $("#myp-pt",d).textContent=ti.value.trim()||"Title"; $("#myp-pb",d).textContent=bi.value.trim()||"Message"; };
  ti.oninput=upd; bi.oninput=upd; upd();
  $("#myp-cancel",d).onclick=mypClose;
  d.addEventListener("keydown",e=>{ if(e.key==="Escape"){ e.preventDefault(); mypClose(); } });
  d.addEventListener("click",e=>{ if(e.target===d) mypClose(); });
  $("#myp-send",d).onclick=()=>mypSend(false);
  setTimeout(()=>{ try{ ti.focus(); }catch(e){} },30);
}
async function mypVideo(x){
  const id=ytId(x.youtubeUrl); let v=null;
  try{ const r=await fetch("/podcast/micdup.json",{cache:"no-store"}); if(r.ok){ const j=await r.json(); v=(j.episodes||[]).find(q=>q && q.id===id) || null; } }catch(e){}
  return {id, title:String((v&&v.title)||x.title||epWord(x)), published:String((v&&(v.published||v.date))||x.airDate||""), duration:(v&&v.duration)||""};
}
async function mypSend(again){
  const d=$("#myp-pop"); if(!d || !MYP.open || MYP.busy) return;
  const {kind, ref}=MYP.open, x=mypItem(kind, ref); if(!x) return;
  const msg=$("#myp-msg",d), say=(t,bad)=>{ msg.textContent=t; msg.className="myp-msg"+(bad?" bad":""); };
  const title=$("#myp-t",d).value.trim(), body=$("#myp-b",d).value.trim();
  if(!title || !body){ say("Fill in the title and the message.", true); return; }
  const tok=mypTok(); if(!tok){ say("Sign in to resources.mismo.org first.", true); return; }
  const payload={kind, ref: kind==="matters" ? x.month : ytId(x.youtubeUrl), title:title.slice(0,MYP_MAXT), body:body.slice(0,MYP_MAXB)};
  if(kind==="matters"){ const u=mmWebUrl(x); if(/^https:\/\/(www\.mismo\.org|resources\.mismo\.org)\//.test(u)) payload.url=u; }
  else payload.video=await mypVideo(x);
  if(again) payload.again=true;
  MYP.busy=true; say("Sending…"); $$("button",d).forEach(b=>b.disabled=true);
  try{
    const r=await fetch(MYP_URL,{method:"POST", cache:"no-store", headers:{"Authorization":"Bearer "+tok, "Content-Type":"application/json"}, body:JSON.stringify(payload)});
    const j=await r.json().catch(()=>({}));
    if(r.ok){
      const n=+j.sent||0, rec={at:new Date().toISOString(), by:window.__hqWho||"", n, title:payload.title, body:payload.body, again:!!again};
      await patch(kind==="matters"?"editions":"episodes", x.id, {mymismo:rec});
      MYP.last=Object.assign({kind, ref:payload.ref}, rec);
      say("Sent to "+rsN(n)+" phone"+(n===1?"":"s")+", "+fS(T())+". Saved on this "+(kind==="matters"?"edition":"episode")+".");
      const s=$("#myp-send",d); s.textContent="Done"; s.disabled=false; s.onclick=mypClose; $("#myp-cancel",d).hidden=true;
      if(typeof renderTab==="function") renderTab(TAB);
      return;
    }
    if(r.status===409 || j.error==="ALREADY_SENT"){
      const when=j.at?fS(localDay(j.at)):"before";
      say("Already pushed on "+when+". Send it again only to correct it.", true);
      const s=$("#myp-send",d); s.textContent="Send Again"; s.disabled=false; s.onclick=()=>mypSend(true); $("#myp-cancel",d).disabled=false;
      return;
    }
    say(r.status===403 ? "Only the people Jonna named can push to MyMISMO."
      : r.status===404 ? "MyMISMO notifications aren't switched on yet."
      : r.status===401 ? "Sign in to resources.mismo.org again, then try."
      : "MyMISMO didn't take it ("+(j.error||r.status)+"). Nothing was sent.", true);
  }catch(e){ say("Couldn't reach MyMISMO. Nothing was sent. Check your connection and try again.", true); }
  finally{ MYP.busy=false; if($("#myp-pop")) $$("#myp-pop button").forEach(b=>{ if(b.textContent!=="Done") b.disabled=false; }); }
}
document.addEventListener("click", e=>{ const b=e.target && e.target.closest && e.target.closest("[data-mypush]"); if(!b) return; e.preventDefault(); mypOpen(b.dataset.mypush, b.dataset.myref, b); });
if(window.MismoBack) MismoBack.layer({ isOpen:()=>!!$("#myp-pop"), close:()=>mypClose() });
/* Help > System Health: the newest push */
function hhMyMISMO(){
  const recs=vals("editions").map(e=>e.mymismo&&Object.assign({what:"MISMO Matters "+monthName(e.month)},e.mymismo)).concat(vals("episodes").map(e=>e.mymismo&&Object.assign({what:"Mic'd Up "+epTag(e)},e.mymismo))).filter(r=>r&&r.at)
    .sort((a,b)=>String(b.at).localeCompare(String(a.at)));
  const r=recs[0];
  if(!r) return hhRow("mymismo","Push to MyMISMO","off","Nothing pushed yet. Push to MyMISMO is on each MISMO Matters edition that has gone out and each Mic'd Up episode on YouTube; it only sends when someone presses it.");
  return hhRow("mymismo","Push to MyMISMO","ok","Last push "+hhWhen(r.at)+(r.by?" by "+r.by:"")+": "+r.what+", to "+rsN(r.n||0)+" phone"+(+r.n===1?"":"s")+".");
}
(function(){
  const st=document.createElement("style");
  st.textContent='.myp-wrap{display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap}.myp-done{font-size:12px;color:var(--good)}'+
    '#myp-pop{position:fixed;inset:0;z-index:9000;background:rgba(6,32,47,.55);display:flex;align-items:center;justify-content:center;padding:16px}'+
    '.myp-card{background:var(--surface);color:var(--ink);border:1px solid var(--border);border-top:4px solid var(--sky);border-radius:8px;width:min(520px,100%);max-height:calc(100vh - 32px);overflow:auto;padding:18px 20px 16px;box-shadow:0 18px 50px rgba(6,32,47,.35)}'+
    '.myp-eye{font-size:10.5px;letter-spacing:.11em;text-transform:uppercase;font-weight:700;color:var(--ink-3)}.myp-card h2{margin:4px 0 12px;font-size:20px}'+
    '.myp-card input,.myp-card textarea{width:100%;box-sizing:border-box}.myp-cnt{font-size:11.5px;color:var(--ink-3);text-align:right;margin:3px 0 10px}'+
    '.myp-prev{display:grid;gap:2px;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-size:13px}.myp-prev .myp-app{font-size:11px;font-weight:700;color:var(--ink-3)}.myp-prev span{color:var(--ink-2);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}'+
    '.myp-who{font-size:13px;margin:10px 0 6px}.myp-was{font-size:13px;color:var(--warn);margin:0 0 10px}.myp-msg{font-size:13px;min-height:1.2em;margin:4px 0 8px}.myp-msg.bad{color:var(--bad)}'+
    '.myp-btns{display:flex;gap:8px;flex-wrap:wrap}.myp-rules{margin:12px 0 4px;padding-left:18px;font-size:12px;color:var(--ink-2)}.myp-note{font-size:11.5px;color:var(--ink-3);margin:0}';
  document.head.appendChild(st);
})();
