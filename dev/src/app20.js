/* ================= Member & sponsor logos: their own shelf, and straight into Higher Logic =================
   Member 360 sends each new member's logo here (campaign "logos"). They get their own view in the Image
   Library so the rest of the library stays easy to browse, and they leave the MISMO Matters picture
   pickers alone (the logo wall has its own picker).

   Higher Logic: emails can only show pictures with a public link. MISMO Media hands each logo that has no
   link yet to a small uploader page on collaborate.mismo.org (HL_BRIDGE), loaded out of sight, which puts
   it in Higher Logic's file library (MISMO_Matters_Logos folder) using the session of whoever is signed in
   to Higher Logic, and sends back the public link. SVG logos are turned into PNGs first, because Gmail and
   Outlook don't show SVGs. It runs on its own whenever someone signed in to Higher Logic opens MISMO Media;
   "Send to Higher Logic" does the same in a small window for anyone whose browser keeps the hidden one out. */
const HL_BRIDGE = "https://collaborate.mismo.org/mismowebsite/mismo-media-uploader";   // the hidden website page that loads hl-bridge/bridge.js
const HL_ORIGIN = "https://collaborate.mismo.org";
const HLB = {state:"idle", last:"", busy:false, frame:null, win:null, ready:null, waits:{}, n:0, tried:false};

function isLogo(im){ return !!im && im.campaign==="logos"; }
/* what still needs a Higher Logic link: member and sponsor logos, and any picture used in the edition being built */
function hlNeeded(){
  const out=new Map(), add=im=>{ if(im && !im.archived && !isFile(im) && !im.hlUrl && (im.spPath||imgSrc(im))) out.set(im.id,im); };
  vals("images").filter(isLogo).forEach(add);
  const ed=curEdition(); if(ed) edSections(ed).filter(s=>s.on).forEach(s=>{ const d=s.doc;
    if(d.imageLib && !d.imageUrl) add(S.images[d.imageLib]);
    mdBlocks(d.body).forEach(b=>{ if(b.t==="img"){ const r=rtImgInfo(b.ref); if(r.im) add(r.im); } });
    if(isLogoSec(s.k)) logoPicks(ed,s.k).forEach(l=>add(S.images[l.id])); });
  return [...out.values()];
}
function hlSlug(im){ const base=String(im.company||im.name||im.file||"logo").replace(/\.[a-z0-9]+$/i,"").replace(/\blogo\b/ig,"").replace(/[^A-Za-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,60)||"picture";
  return base+(isLogo(im)?"-logo":"")+"-"+String(im.id).slice(-5)+".png"; }

/* the picture as a PNG blob (SVGs drawn onto a canvas at a crisp size) */
async function hlPng(im){
  let blob=null;
  if(im.spPath && SP_IMG()) blob=await SP_IMG().get(im.spPath);
  else { const u=imgSrc(im); if(u) blob=await fetch(u).then(r=>r.blob()); }
  if(!blob) throw new Error("no file");
  const svg=/svg/i.test(blob.type)||/\.svg$/i.test(im.file||"");
  const url=URL.createObjectURL(svg? new Blob([await blob.text()],{type:"image/svg+xml"}) : blob);
  try{
    const img=await new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=()=>rej(new Error("can't read picture")); i.src=url; });
    let w=img.naturalWidth||+im.w||600, h=img.naturalHeight||+im.h||200;
    if(!svg && /png/i.test(blob.type)) return blob;                       // PNGs go as they are
    const k=svg ? Math.max(1, Math.min(4, 1200/Math.max(w,1))) : 1;         // SVGs: up to 1200px wide
    w=Math.round(w*k); h=Math.round(h*k);
    const c=document.createElement("canvas"); c.width=w; c.height=h; const g=c.getContext("2d");
    if(!svg){ g.fillStyle="#ffffff"; g.fillRect(0,0,w,h); }
    g.drawImage(img,0,0,w,h);
    if(!svg && /jpe?g/i.test(blob.type)) return blob;
    return await new Promise(r=>c.toBlob(r,"image/png"));
  } finally { URL.revokeObjectURL(url); }
}

/* talking to the uploader page */
window.addEventListener("message", e=>{
  if(e.origin!==HL_ORIGIN || !e.data || typeof e.data!=="object") return;
  const d=e.data;
  if(d.mm==="hl-ready"){ HLB.loggedin=!!d.loggedin; if(HLB.ready){ HLB.ready(d); HLB.ready=null; } return; }
  if(d.mm==="hl-result" && HLB.waits[d.id]){ HLB.waits[d.id](d); delete HLB.waits[d.id]; }
});
function hlTarget(){ return HLB.win && !HLB.win.closed ? HLB.win : (HLB.frame && HLB.frame.contentWindow); }
function hlOpen(popup){
  return new Promise(res=>{
    const t=setTimeout(()=>{ HLB.ready=null; res(null); }, popup?30000:15000);
    HLB.ready=d=>{ clearTimeout(t); res(d); };
    if(popup){ HLB.win=window.open(HL_BRIDGE,"mm-hl-uploader","width=460,height=360"); if(!HLB.win){ clearTimeout(t); res(null); } }
    else { if(HLB.frame) HLB.frame.remove(); const f=document.createElement("iframe"); f.src=HL_BRIDGE; f.title="Higher Logic uploader"; f.setAttribute("aria-hidden","true"); f.tabIndex=-1;
      f.style.cssText="position:fixed;left:-3000px;top:0;width:10px;height:10px;border:0;opacity:0"; document.body.appendChild(f); HLB.frame=f; }
  });
}
function hlSend(msg){ return new Promise(res=>{ const id="u"+(++HLB.n); const t=setTimeout(()=>{ delete HLB.waits[id]; res({error:"timeout"}); },60000); HLB.waits[id]=d=>{ clearTimeout(t); res(d); };
  const w=hlTarget(); if(!w){ clearTimeout(t); res({error:"closed"}); return; } w.postMessage(Object.assign({id},msg), HL_ORIGIN); }); }

async function hlRun(popup){
  if(!HL_BRIDGE || HLB.busy || !LIVE) return;
  const todo=hlNeeded(); if(!todo.length){ HLB.state="done"; return; }
  HLB.busy=true; HLB.state="working"; hlPaint();
  try{
    const r=await hlOpen(popup);
    if(!r){ HLB.state="blocked"; return; }
    if(!r.loggedin){ HLB.state="signin"; return; }
    let ok=0, bad=0;
    for(const im of todo){
      if(S.images[im.id] && S.images[im.id].hlUrl) continue;
      try{ const png=await hlPng(im); const res=await hlSend({mm:"hl-upload", name:hlSlug(im), blob:png});
        if(res && res.url){ await patch("images", im.id, {hlUrl:res.url, hlAt:new Date().toISOString()}); ok++; }
        else { bad++; HLB.last=(res&&res.error)||"no link back"; if(res&&res.error==="signin"){ HLB.state="signin"; break; } }
      }catch(err){ bad++; HLB.last=err.message||String(err); }
    }
    if(HLB.state!=="signin") HLB.state=bad?"partial":"done";
    if(ok) toast(ok+" picture"+(ok===1?"":"s")+" put in Higher Logic", 3500);
  } finally {
    HLB.busy=false; if(HLB.frame){ HLB.frame.remove(); HLB.frame=null; } if(HLB.win && !HLB.win.closed) try{ HLB.win.close(); }catch(e){}
    hlPaint(); if(TAB==="images") renderImages();
  }
}
/* once the pictures have loaded, and again when new logos arrive */
let HL_T=null;
function hlSoon(){ if(!HL_BRIDGE || STALE.on) return; clearTimeout(HL_T); HL_T=setTimeout(()=>{ if(LOADED.has("images") && hlNeeded().length && HLB.state!=="signin") hlRun(false); }, 4000); }

/* the status line on the logo shelf */
function hlNote(){
  const n=hlNeeded().length;
  if(!HL_BRIDGE) return n ? '<div class="lgs-note warn"><b>'+n+' waiting for Higher Logic.</b> They show in the email preview with a dashed outline until they have a Higher Logic link.</div>' : '';
  if(HLB.state==="working") return '<div class="lgs-note"><b>Putting '+n+' in Higher Logic…</b></div>';
  if(!n) return '<div class="lgs-note ok"><b>All in Higher Logic.</b> Every logo has its public link, so the email shows them.</div>';
  const why = HLB.state==="signin" ? 'Sign in to the MISMO website (collaborate.mismo.org) in this browser, then press Send to Higher Logic.'
    : HLB.state==="blocked" ? 'This browser kept the uploader from loading. Press Send to Higher Logic to do it in a small window.'
    : HLB.state==="partial" ? 'Some didn\'t go ('+esc(HLB.last)+'). Press Send to Higher Logic to try again.'
    : 'They go in on their own the next time someone signed in to Higher Logic opens MISMO Media.';
  return '<div class="lgs-note warn"><b>'+n+' waiting for Higher Logic.</b> '+why+' <button class="btn sm pri" type="button" id="hl-send">Send to Higher Logic</button>'+(HLB.state==="signin"?' <a class="btn sm" href="https://collaborate.mismo.org/mismowebsite/home" target="_blank" rel="noopener">Sign In&nbsp;↗</a>':'')+'</div>';
}
function hlPaint(){ const n=$("#lgs-note"); if(n){ n.innerHTML=hlNote(); const b=$("#hl-send",n); if(b) b.onclick=()=>hlRun(true); } }

/* the logo shelf in the Image Library */
function logoShelf(){
  const q=imNorm(IM.q);
  const all=imgsLive().filter(isLogo), list=all.filter(im=>!q || imNorm([im.company,im.name,im.group,im.site,im.file].join(" ")).indexOf(q)>=0);
  const byMonth={}; list.forEach(im=>{ const m=String(im.at||"").slice(0,7)||"—"; (byMonth[m]=byMonth[m]||[]).push(im); });
  list.forEach(im=>{ if(!imgSrc(im)) imgEnsure(im); });
  return '<div id="lgs-note">'+hlNote()+'</div>'+
    (list.length ? Object.keys(byMonth).sort().reverse().map(m=>'<div class="lgs-month">'+esc(m.length===7?monthName(m):m)+'<span>'+byMonth[m].length+'</span></div><div class="lgs-grid">'+byMonth[m].map(im=>{
        const src=imgSrc(im);
        return '<div class="lgs-card'+(im.archived?" arch":"")+'" data-im="'+esc(im.id)+'" tabindex="0" role="button" aria-label="'+esc(im.company||im.name||"Logo")+'">'+
          '<div class="lgs-pic">'+(src?'<img src="'+esc(src)+'" alt="" loading="lazy">':'<span>'+esc(im.company||im.name||"")+'</span>')+'</div>'+
          '<b>'+esc(im.company||im.name||"Untitled")+'</b><small>'+esc(im.group||"")+(im.site?' · '+esc(String(im.site).replace(/^https?:\/\//,"")):'')+'</small>'+
          '<span class="chip '+(im.hlUrl?'ok':'review')+'">'+(im.hlUrl?'In Higher Logic':'Not in Higher Logic Yet')+'</span></div>'; }).join("")+'</div>').join("")
      : '<div class="empty">'+(all.length?"No logos match that search.":"Member and sponsor logos land here when Member 360 sends them.")+'</div>');
}

/* ================= Thank You to Our Sponsors, filled from the Sponsorship Portal =================
   The sponsors of the next MISMO Summit after the edition goes out (the summit's own sponsors and the year's
   Series sponsors) whose application is Approved, Pending Payment, Paid or In Kind, grouped by their tier.
   Each one's logo comes from the Image Library (Member & Sponsor Logos); a sponsor who sent a logo with their
   online application has it brought in from the Sponsor Logos library on the MISMO Summits SharePoint site,
   and from there it goes to Higher Logic like every other logo. Changing the list by hand in the section and
   unticking "Keep in step with the Sponsorship Portal" stops it for that edition. */
const SPON_OK = ["Approved","Pending Payment","Paid","In Kind"];
const SPON_TIERS = ["PLATINUM","GOLD","SILVER","BRONZE"];
const SPN = {apps:null, at:0, busy:false, lib:null, missing:[], summit:"", err:""};
function summitAfter(day){
  const y=+String(day).slice(0,4), c=[];
  [y,y+1].forEach(yy=>c.push({name:"Winter "+yy, year:yy, end:yy+"-01-16"},{name:"Spring "+yy, year:yy, end:yy+"-06-12"},{name:"Fall "+yy, year:yy, end:yy+"-09-18"}));
  return c.find(x=>x.end>=day);
}
function sponNorm(t){ return String(t||"").toLowerCase().replace(/&/g," and ").replace(/\b(inc|llc|ltd|corp|corporation|co|company|the)\b/g," ").replace(/[^a-z0-9]+/g," ").trim(); }
function sponTier(a, sm){ return String(a["level"+sm.year]||a.level2027||a.level2026||a.level||"").trim().toUpperCase(); }
function sponGroup(t){ return t ? t.charAt(0)+t.slice(1).toLowerCase()+" Sponsors" : "Summit Sponsors"; }
function sponList(sm){
  return (SPN.apps||[]).filter(a=>SPON_OK.includes(a.status) && (a.event===sm.name || a.event===sm.year+" Series") && String(a.company||"").trim())
    .sort((a,b)=>{ const ta=SPON_TIERS.indexOf(sponTier(a,sm)), tb=SPON_TIERS.indexOf(sponTier(b,sm));
      return ((ta<0?9:ta)-(tb<0?9:tb)) || sponNorm(a.company).localeCompare(sponNorm(b.company)); });
}
function sponLogo(a){
  const logos=vals("images").filter(i=>isLogo(i) && !i.archived), y=sponNorm(a.company);
  return logos.find(i=>i.sponsorApp===a.id) || logos.find(i=>sponNorm(i.company)===y) ||
    logos.find(i=>{ const x=sponNorm(i.company); return x && y && (x.startsWith(y+" ") || y.startsWith(x+" ")); }) || null;
}
/* the logo the sponsor sent with their online application (file name starts with their Prospectus Reference) */
async function sponFetchLogo(a, group){
  const ref=String(a.prospectusRef||"").trim().toUpperCase(), sp=SP_IMG(); if(!ref || !sp || !ASSETS) return null;
  if(!SPN.lib) SPN.lib=await sp.list("/Sponsor Logos","summits");
  const f=SPN.lib.find(x=>!x.folder && String(x.name).toUpperCase().startsWith(ref) && /\.(png|jpe?g|gif|svg|webp)$/i.test(x.name));
  if(!f) return null;
  const blob=await sp.get(f.path,"summits"), ext=(f.name.match(/\.([a-z0-9]+)$/i)||["","png"])[1].toLowerCase();
  const type=ext==="svg"?"image/svg+xml":(ext==="jpg"||ext==="jpeg")?"image/jpeg":"image/"+ext;
  const nm=String(a.company).trim().replace(/[^A-Za-z0-9]+/g,"-").replace(/^-+|-+$/g,"")+"-logo."+ext;
  const made=await addImages([new File([blob], nm, {type})], {campaign:"logos", edition:"", name:String(a.company).trim()+" Logo", company:String(a.company).trim(), group, sponsorApp:a.id,
    notes:"From the Sponsorship Portal ("+(a.appNo||a.id)+"), Sponsor Logos library: "+f.name}, true);
  return made[0]||null;
}
async function sponsorSync(force){
  if(STALE.on || SPN.busy || !CANWRITE || !window.__hqSponsors || !LOADED.has("images") || !LOADED.has("editions") || !LOADED.has("sections")) return;
  const ed=curEdition(); if(!ed || (ed.done && ed.done.publish)) return;
  const key=ed.month+"__thanks", doc=S.sections[key]||{};
  if(doc.sponsorsAuto===false) return;
  if(!force && Date.now()-SPN.at<10*60*1000) return;
  SPN.busy=true; SPN.at=Date.now(); SPN.err="";
  try{
    SPN.apps=await window.__hqSponsors();
    const sm=summitAfter((ed.dates||{}).publish || ed.month+"-28"); SPN.summit=sm.name;
    const prev={}; (doc.logos||[]).forEach(l=>{ prev[l.id]=l; });
    const out=[], missing=[];
    for(const a of sponList(sm)){
      const group=sponGroup(sponTier(a,sm));
      let im=sponLogo(a); if(!im){ try{ im=await sponFetchLogo(a, group); }catch(e){ im=null; } }
      if(!im){ missing.push(String(a.company).trim()); continue; }
      if(im.sponsorApp!==a.id){ try{ await patch("images", im.id, {sponsorApp:a.id}); }catch(e){} }
      out.push({id:im.id, name:String(a.company).trim(), group, url:(prev[im.id]&&prev[im.id].url)||im.site||""});
    }
    SPN.missing=missing;
    const sig=x=>JSON.stringify((x||[]).map(l=>[l.id,l.group,l.name]));
    if(sig(doc.logos)!==sig(out) || doc.sponsorsFrom!==sm.name || JSON.stringify(doc.sponsorsMissing||[])!==JSON.stringify(missing))
      await put("sections", key, Object.assign({id:key, month:ed.month, key:"thanks", status:"waiting"}, doc, {logos:out, sponsorsAuto:true, sponsorsFrom:sm.name, sponsorsMissing:missing, sponsorsAt:new Date().toISOString()}));
  }catch(e){ SPN.err=e.message||String(e); }
  finally{ SPN.busy=false; }
}
