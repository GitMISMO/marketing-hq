/* ================= Sponsor benefits feed for the Sponsorship Portal (Nov 21, 2026) =================
   The portal ticks a sponsor's benefits off by itself from what MISMO Media has done for them. Contract: Connections Map
   row "MISMO Media → Sponsorship Portal". MISMO Media writes data/feed-sponsor-benefits.json in its own project
   (marketing-hq); the portal only reads it. Field names are fixed: tell Jonna before changing one.
     {updatedAt, entries:{<post or episode id>:{appNo, company, summit, benefit, status, on, url, by, at}}}
   benefit "linkedin": a LinkedIn post of kind Sponsor Highlight, or a Summits "Sponsor thank-you post" that goes on LinkedIn.
     status "posted" once it is marked Posted (on = the post date, url = the live post); "planned" before; "cancelled".
   benefit "micdup": a Mic'd Up episode with a sponsor guest. status "invited", then "recorded" once recorded, then
     "posted" once it is on YouTube (url = the YouTube link).
   summit is the summit name ("Winter 2027"); empty counts for every summit of that sponsorship.
   The file is worked out from the records each time and written only when it changes, by whoever has MISMO Media open
   with saving rights. A deleted post or episode drops out of it. */
const SB_FILE="feed-sponsor-benefits";
const SB={apps:null, at:0, loading:null, timer:0, busy:false, last:"", err:"", savedAt:"", n:0};
const SB_SEASONS=["Winter","Spring","Fall"];
async function sbApps(){
  if(SPN.apps && SPN.apps.length) return SPN.apps;
  if(SB.apps && Date.now()-SB.at<10*60000) return SB.apps;
  if(!window.__hqSponsors) return SB.apps||[];
  if(!SB.loading) SB.loading=window.__hqSponsors().then(a=>{ SB.apps=a||[]; SB.at=Date.now(); return SB.apps; })
    .catch(e=>{ SB.err=(e&&e.message)||"The Sponsorship Portal didn't answer"; return SB.apps||[]; }).then(a=>{ SB.loading=null; return a; });
  return SB.loading;
}
/* approved summit sponsors only (a 2027 Series sponsorship, or one summit such as "Winter 2027") */
function sbApproved(apps){
  return (apps||[]).filter(a=>SPON_OK.includes(a.status) && String(a.company||"").trim() && /^(Winter|Spring|Fall) \d{4}$|^\d{4} Series$/.test(String(a.event||"").trim()))
    .sort((a,b)=>sponNorm(a.company).localeCompare(sponNorm(b.company)) || String(a.event).localeCompare(String(b.event)));
}
/* the summits a sponsorship covers, by the portal's names */
function sbSummitsOf(a){
  const ev=String(a.event||"").trim(), m=ev.match(/^(\d{4}) Series$/);
  if(!m) return [ev];
  const c=sponCustom(a); return (c?c.map(x=>x.s):SB_SEASONS).filter(s=>SB_SEASONS.includes(s)).map(s=>s+" "+m[1]);
}
/* a Summits record's summit ("2027-winter") by the portal's name ("Winter 2027") */
function sbSummitName(id){ const m=String(id||"").match(/^(\d{4})-(winter|spring|fall)$/); return m ? m[2].charAt(0).toUpperCase()+m[2].slice(1)+" "+m[1] : ""; }
/* which records carry a sponsor */
function sbPieceOn(p){ return p.channel==="linkedin" ? p.kind==="Sponsor Highlight" : p.channel==="summit" && /sponsor/i.test(p.title||"") && (p.via||"LinkedIn")==="LinkedIn"; }

/* ---- the picker, in the post or episode panel ---- */
function sbPickerHtml(rec, what){
  return '<div class="sb-pick" id="sb-pick" data-what="'+esc(what)+'"><div class="fgrid">'+
    '<div class="field"><label for="sb-app">Sponsor</label><select id="sb-app"><option value="">No sponsor</option>'+
      (rec.sponsorApp?'<option value="'+esc(rec.sponsorApp)+'" selected>'+esc(rec.sponsorCompany||"Sponsor")+(rec.sponsorAppNo?' · '+esc(rec.sponsorAppNo):'')+'</option>':'')+'</select>'+
      '<span class="hint" id="sb-msg">Loading the approved summit sponsors from the Sponsorship Portal…</span></div>'+
    '<div class="field"><label for="sb-sum">Counts For</label><select id="sb-sum"><option value="">Every summit of the sponsorship</option>'+
      (rec.sponsorSummit?'<option value="'+esc(rec.sponsorSummit)+'" selected>'+esc(rec.sponsorSummit)+'</option>':'')+'</select></div>'+
    '</div><p class="hint sb-say">'+esc(what==="micdup"
      ? "Ticks the sponsor's Mic'd Up invitation in the Sponsorship Portal: invited now, recorded once there's a Recorded On date, posted once it's on YouTube."
      : "Ticks the sponsor's dedicated LinkedIn recognition post in the Sponsorship Portal once this is marked Posted / Sent, with the post date and the link to the live post.")+'</p></div>';
}
async function sbWirePicker(b, rec, defSummit){
  const app=$("#sb-app",b), sum=$("#sb-sum",b), msg=$("#sb-msg",b); if(!app) return;
  const fillSum=keep=>{ const a=(SB.byId||{})[app.value]; const list=a?sbSummitsOf(a):[]; const cur=keep!==undefined?keep:sum.value;
    sum.innerHTML='<option value="">Every summit of the sponsorship</option>'+list.map(s=>'<option value="'+esc(s)+'"'+(s===cur?' selected':'')+'>'+esc(s)+'</option>').join("");
    if(cur && !list.includes(cur) && a) sum.value=""; sum.disabled=!app.value || list.length<2; };
  const apps=sbApproved(await sbApps()); SB.byId={}; apps.forEach(a=>{ SB.byId[a.id]=a; });
  if(!document.contains(app)) return;
  const had=rec.sponsorApp||"";
  app.innerHTML='<option value="">No sponsor</option>'+apps.map(a=>'<option value="'+esc(a.id)+'"'+(a.id===had?' selected':'')+'>'+esc(String(a.company).trim())+' · '+esc(a.event)+(a.appNo?' · '+esc(a.appNo):'')+'</option>').join("")+
    (had && !SB.byId[had] ? '<option value="'+esc(had)+'" selected>'+esc(rec.sponsorCompany||"Sponsor")+' (no longer approved in the portal)</option>' : '');
  msg.textContent=apps.length ? apps.length+" approved summit sponsors in the Sponsorship Portal." : (SB.err ? "Couldn't read the Sponsorship Portal: "+SB.err : "No approved summit sponsors to pick from, or you don't have access to the Sponsorship Portal.");
  fillSum(rec.sponsorSummit||(had?"":defSummit||""));
  app.onchange=()=>{ const a=SB.byId[app.value]; fillSum(a && defSummit && sbSummitsOf(a).includes(defSummit) ? defSummit : (a && sbSummitsOf(a).length===1 ? sbSummitsOf(a)[0] : "")); if(PANE) PANE.dirty=true; };
  sum.onchange=()=>{ if(PANE) PANE.dirty=true; };
}
/* what the picker says, for the save; null when it isn't showing (the record keeps what it had) */
function sbRead(b, rec){
  const box=$("#sb-pick",b); if(!box || box.hidden) return null;
  const id=$("#sb-app",b).value, a=(SB.byId||{})[id];
  if(!id) return {sponsorApp:"", sponsorAppNo:"", sponsorCompany:"", sponsorSummit:""};
  const out={sponsorApp:id, sponsorAppNo:a?String(a.appNo||""):(rec.sponsorAppNo||""), sponsorCompany:a?String(a.company||"").trim():(rec.sponsorCompany||""), sponsorSummit:$("#sb-sum",b).value||""};
  if(id!==rec.sponsorApp){ out.sponsorBy=WHO(); out.sponsorAt=T(); }
  return out;
}

/* ---- the feed ---- */
function sbEntries(){
  const out={};
  vals("pieces").forEach(p=>{
    if(!p.sponsorApp || p.archived || !sbPieceOn(p)) return;
    out[p.id]={appNo:p.sponsorAppNo||"", company:p.sponsorCompany||"", summit:p.sponsorSummit||"", benefit:"linkedin",
      status:p.status==="done"?"posted":p.status==="canceled"?"cancelled":"planned", on:String(p.date||"").slice(0,10), url:p.status==="done"?(p.postedUrl||""):"",
      by:(p.status==="done"?p.postedBy:"")||p.owner||p.sponsorBy||""};
  });
  vals("episodes").forEach(e=>{
    if(!e.sponsorApp || e.archived) return;
    const posted=!!(e.youtubeDone||e.youtubeUrl), rec=isRecorded(e);
    out[e.id]={appNo:e.sponsorAppNo||"", company:e.sponsorCompany||"", summit:e.sponsorSummit||"", benefit:"micdup",
      status:(e.canceled||e.status==="canceled")?"cancelled":posted?"posted":rec?"recorded":"invited",
      on:String(posted?(e.airDate||""):rec?e.recordDate:(e.sponsorAt||e.airDate||"")).slice(0,10), url:posted?(e.youtubeUrl||""):"", by:e.sponsorBy||"Brian Vieaux"};
  });
  return out;
}
function sbSig(v){ if(Array.isArray(v)) return "["+v.map(sbSig).join(",")+"]"; if(v && typeof v==="object") return "{"+Object.keys(v).sort().map(k=>JSON.stringify(k)+":"+sbSig(v[k])).join(",")+"}"; return JSON.stringify(v===undefined?null:v); }
const sbBare=e=>{ const o=Object.assign({}, e); delete o.at; return o; };
function sbSoon(){ clearTimeout(SB.timer); SB.timer=setTimeout(sbSync, 2500); }
async function sbSync(){
  if(SB.busy || STALE.on || !CANWRITE || !window.__hqFile || !LOADED.has("pieces") || !LOADED.has("episodes")) return;
  const want=sbEntries(), key=sbSig(want); if(key===SB.last) return;
  SB.busy=true;
  try{
    for(let i=0;i<5;i++){
      const got=await window.__hqFile.get(SB_FILE), cur=((got&&got.data)||{}).entries||{};
      const curBare={}; Object.keys(cur).forEach(k=>{ curBare[k]=sbBare(cur[k]); });
      if(sbSig(curBare)===key){ SB.last=key; SB.n=Object.keys(want).length; SB.err=""; break; }
      const now=new Date().toISOString(), entries={};
      Object.keys(want).forEach(id=>{ const c=cur[id]; entries[id]=Object.assign({}, want[id], {at:(c && c.at && sbSig(sbBare(c))===sbSig(want[id])) ? c.at : now}); });
      try{ await window.__hqFile.put(SB_FILE, {updatedAt:now, entries}, got&&got.sha); SB.last=key; SB.n=Object.keys(entries).length; SB.savedAt=now; SB.err=""; break; }
      catch(e){ if(!(e && e.status===409) || i===4) throw e; await new Promise(r=>setTimeout(r, 400*(i+1)+Math.random()*400)); }
    }
  }catch(e){ SB.err=(e&&e.message)||"couldn't save"; }
  finally{ SB.busy=false; }
}
setInterval(()=>{ if(document.visibilityState!=="hidden") sbSync(); }, 120000);
/* System Health */
function hhSponsorFeed(){
  if(!LOADED.has("pieces") || !LOADED.has("episodes")) return null;
  const n=Object.keys(sbEntries()).length;
  if(SB.err) return hhRow("sbfeed","Sponsor Benefits Feed","bad","Couldn't update the feed the Sponsorship Portal reads: "+SB.err+". It tries again every two minutes while MISMO Media is open.");
  if(!n) return hhRow("sbfeed","Sponsor Benefits Feed","off","No sponsor picked on a Sponsor Highlight post, a sponsor thank-you post or a Mic'd Up episode yet.");
  return hhRow("sbfeed","Sponsor Benefits Feed","ok",n+" sponsor benefit"+(n===1?"":"s")+" shared with the Sponsorship Portal"+(SB.savedAt?" · last changed "+hhWhen(SB.savedAt):"")+".");
}
