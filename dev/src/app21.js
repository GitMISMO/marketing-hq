/* ================= Certification Spotlight (the Certifications section) =================
   Like the sponsor and new member walls: an edition can run it or not. Pick the certification to highlight
   and the section shows that program's badge and everyone currently certified, read from the program's
   "who is certified" page on the website. It stays current by itself (checked twice a day while the edition
   is being built), so a newly certified organization shows up without anyone retyping the list. The website
   is read through the hidden uploader page on collaborate.mismo.org (the same site), so nothing is copied by hand.
   Links point at collaborate.mismo.org until the new website goes live on November 16, 2026, then at www.mismo.org. */
const CERT_PROGRAMS = [
  {k:"frame",      slug:"frame-advisory-partners",      name:"FRAME Advisory Partners",       title:"MISMO Certified FRAME Advisory Partners", what:"organization"},
  {k:"consultant", slug:"certified-consultants",        name:"Certified Consultants",         title:"MISMO Certified Consultants",            what:"organization"},
  {k:"product",    slug:"certified-product-providers",  name:"Certified Product Providers",   title:"MISMO Certified Product Providers",      what:"organization"},
  {k:"eclose",     slug:"eclosing-certified-providers", name:"eClose Certified Providers",    title:"MISMO Certified eClose Providers",       what:"provider"},
  {k:"evault",     slug:"evault-certified-providers",   name:"eVault Certified Systems",      title:"MISMO Certified eVault Systems",         what:"system"},
  {k:"ron",        slug:"ron-certified-providers",      name:"RON Certified Providers",       title:"MISMO Certified RON Providers",          what:"provider"}
];
const CERT_SITE_LIVE = "2026-11-16";   /* the default; Settings > Dates can change it (siteLive) */
const CERT = {busy:false, at:0, err:""};
function certProg(k){ return CERT_PROGRAMS.find(p=>p.k===k) || null; }
function isCertSpot(s){ return s.k==="cert" && !!certProg(s.doc.certProgram) && (s.doc.certItems||[]).length>0; }
/* the website address for a page, as it will be when the edition goes out */
function certSite(ed, path){ const day=(ed && ed.dates && ed.dates.publish) || T();
  return (day>=(typeof siteLive==="function"?siteLive():CERT_SITE_LIVE) ? "https://www.mismo.org/" : "https://collaborate.mismo.org/mismowebsite/") + String(path||"").replace(/^\/+/,""); }

/* ask the uploader page on the website for a program's list */
async function certAsk(slug){
  if(!HL_BRIDGE) throw new Error("The website reader isn't set up");
  let waited=0; while(HLB.busy && waited<60){ await new Promise(r=>setTimeout(r,1000)); waited++; }
  HLB.busy=true;
  try{
    const r=await hlOpen(false); if(!r) throw new Error("This browser kept the website reader from loading");
    const out=await hlSend({mm:"hl-certs", slug});
    if(!out || out.error) throw new Error(out&&out.error||"no answer from the website");
    return out;
  } finally { HLB.busy=false; if(HLB.frame){ HLB.frame.remove(); HLB.frame=null; } }
}
async function certRefresh(ed, quiet){
  const key=ed.month+"__cert", doc=S.sections[key]||{}, p=certProg(doc.certProgram); if(!p) return null;
  const out=await certAsk(p.slug);
  const items=(out.items||[]).map(i=>({name:i.name, path:i.path||""})).filter(i=>i.name);
  if(!items.length) throw new Error("the website page lists no one right now");
  const sig=x=>JSON.stringify((x||[]).map(i=>[i.name,i.path]));
  const changed = sig(doc.certItems)!==sig(items) || (doc.certBadge||"")!==(out.badge||"") || (doc.certPage||"")!==(out.page||"");
  const v=Object.assign({id:key, month:ed.month, key:"cert", status:"waiting"}, doc, {certItems:items, certBadge:out.badge||"", certPage:out.page||"", certFrom:out.title||p.name, certAt:new Date().toISOString()});
  await put("sections", key, v);
  if(!quiet) toast(changed ? "Updated from the website: "+items.length+" certified." : "Checked the website: no changes ("+items.length+" certified).", 4000);
  return v;
}
/* keeps the current edition's list in step with the website, twice a day */
async function certSync(){
  if(STALE.on || CERT.busy || !CANWRITE || !LOADED.has("sections") || !LOADED.has("editions")) return;
  const ed=curEdition(); if(!ed || (ed.done && ed.done.publish)) return;
  const doc=S.sections[ed.month+"__cert"]||{};
  if(!certProg(doc.certProgram) || doc.certAuto===false) return;
  const last=Math.max(CERT.at, doc.certAt?Date.parse(doc.certAt):0);
  if(Date.now()-last < 12*3600*1000) return;
  CERT.busy=true; CERT.at=Date.now();
  try{ await certRefresh(ed, true); CERT.err=""; }catch(e){ CERT.err=e.message||String(e); }
  finally{ CERT.busy=false; }
}

/* ---------- the email ---------- */
/* where the list goes: on the line "[Certified List]" in the body if there is one, otherwise after the body */
const CERT_MARK = /^\s*\[Certified List\]\s*$/im;
function certSplit(md){ md=String(md||""); const m=md.match(CERT_MARK); return m ? [md.slice(0,m.index), md.slice(m.index+m[0].length)] : [md, ""]; }
/* lead: a small headshot that sits beside the highlighted company's text; extra: what follows that text */
function certSpotlight(ed, s, bodyFn, extra, lead){
  const d=s.doc, p=certProg(d.certProgram), items=d.certItems||[];
  const F=EM_F, M="font-family:'IBM Plex Mono',Consolas,monospace;";
  const navy="#0d314c", line="#dde9f2";
  const listUrl=certSite(ed, d.certPage||("standards-resources/"+p.slug));
  const title=d.headline||p.title;
  const name=i=>{ const u=i.path?certSite(ed,i.path):""; return u ? '<a href="'+esc(u)+'" style="color:'+navy+';text-decoration:none">'+esc(i.name)+'</a>' : esc(i.name); };
  const row=i=>'<tr><td width="14" valign="top" style="padding:7px 0 7px;'+F+'font-size:11px;line-height:20px;color:#74bfeb">&#11042;</td><td style="padding:7px 0 7px 6px;border-bottom:1px solid '+line+';'+F+'font-size:15px;line-height:20px;font-weight:600;color:'+navy+'">'+name(i)+'</td></tr>';
  const list=xs=>'<table role="presentation" width="100%" cellpadding="0" cellspacing="0">'+xs.map(row).join("")+'</table>';
  const md=t=>!String(t||"").trim() ? "" : (bodyFn ? bodyFn(t) : mdEmail(t, F+'font-size:16px;line-height:1.65;margin:0 0 16px;color:#1d2b36', 'color:#14486e;font-weight:600;text-decoration:underline', {}));
  const [before, after]=certSplit(d.body);
  const count=items.length+' '+(p.what==="system"?"system":p.what==="provider"?"provider":"organization")+(items.length===1?"":"s");
  const eye='<div style="'+M+'font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#2477b8;font-weight:600;margin:0 0 6px">MISMO Certified &middot; '+count+'</div>';
  const head='<div style="'+F+'font-size:22px;line-height:1.25;letter-spacing:-.012em;color:'+navy+';font-weight:700;margin:0 0 10px">'+esc(title)+'</div>';
  const more='<p style="margin:14px 0 0;'+F+'font-size:14px"><a href="'+esc(listUrl)+'" style="color:#14486e;font-weight:700;text-decoration:none">See every '+esc(p.name.replace(/^Certified /,"certified ").replace(/s$/,""))+' on mismo.org&nbsp;&rarr;</a></p>';
  const badge=d.certBadge ? '<a href="'+esc(listUrl)+'"><img src="'+esc(d.certBadge)+'" alt="'+esc(p.title)+' badge" width="170" style="display:block;width:170px;max-width:100%;height:auto;margin:0 auto;border:0" border="0"></a>' : '';
  let card;
  if(items.length<=10 && badge){
    card='<tr><td width="38%" align="center" valign="middle" style="padding:22px 8px 22px 16px">'+badge+'</td><td width="62%" valign="middle" style="padding:22px 22px 22px 10px">'+eye+head+list(items)+more+'</td></tr>';
  } else {
    const half=Math.ceil(items.length/2);
    card='<tr><td colspan="2" style="padding:22px 22px 6px">'+(badge?'<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="130" valign="middle" style="padding-right:16px">'+badge.replace(/width="170"/,'width="120"').replace(/width:170px/,'width:120px')+'</td><td valign="middle">'+eye+head+'</td></tr></table>':eye+head)+'</td></tr>'+
      '<tr><td width="50%" valign="top" style="padding:0 10px 0 22px">'+list(items.slice(0,half))+'</td><td width="50%" valign="top" style="padding:0 22px 0 10px">'+list(items.slice(half))+'</td></tr>'+
      '<tr><td colspan="2" style="padding:0 22px 22px">'+more+'</td></tr>';
  }
  const cta = d.ctaUrl ? '<p style="margin:4px 0 16px;'+F+'font-size:15px"><a href="'+esc(safeHref(d.ctaUrl))+'" style="color:#14486e;font-weight:700;text-decoration:underline">'+esc(d.ctaText||"Learn More")+'</a></p>' : '';
  return md(before)+emGap('<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f9fd;border:1px solid '+line+';border-top:4px solid #74bfeb;border-radius:8px" bgcolor="#f4f9fd">'+card+'</table>', 6, 22)+(lead||"")+md(after)+(extra||"")+cta;
}
function certSpotlightText(ed, s){
  const d=s.doc, p=certProg(d.certProgram), out=[];
  const [before, after]=certSplit(d.body);
  if(before.trim()) out.push(mdPlain(before));
  out.push(d.headline||p.title);
  (d.certItems||[]).forEach(i=>out.push("• "+i.name+(i.path?" – "+certSite(ed,i.path):"")));
  out.push("See the full list: "+certSite(ed, d.certPage||("standards-resources/"+p.slug)));
  if(after.trim()) out.push(mdPlain(after));
  if(d.ctaUrl) out.push((d.ctaText||"Learn more")+": "+d.ctaUrl);
  return out;
}

/* ---------- the section pane ---------- */
function certPaneHtml(){ return '<div id="cert-box"></div>'; }
function wireCert(b, doc, ed){
  const box=$("#cert-box",b); if(!box) return;
  const sel=$("#f-certProgram",b);
  let auto = doc.certAuto!==false;
  PANE.certAuto=()=>auto;
  const draw=()=>{ const cur=S.sections[ed.month+"__cert"]||doc, p=certProg(sel?sel.value:cur.certProgram);
    if(!p){ box.innerHTML='<div class="hint">No certification picked: the section runs the headline, body copy and picture below, like any other section.</div>'; return; }
    const tip='<div class="hint">The list goes where the Body Copy has a line that says <b>[Certified List]</b>, or after the copy if there isn\'t one. The Headline sits on the list; leave it blank to use the certification\'s name.</div>';
    const same=cur.certProgram===p.k, items=same?(cur.certItems||[]):[];
    box.innerHTML='<div class="lg-sp"><label><input type="checkbox" id="cert-auto"'+(auto?' checked':'')+'> Keep in step with the website</label>'+
      '<div class="hint">'+(same&&cur.certAt?'Current from the website as of '+esc(new Date(cur.certAt).toLocaleString([],{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}))+'. ':'')+(auto?'New certifications on the website come in by themselves.':'Not updating: tick the box to follow the website again.')+'</div>'+
      (items.length?'<div class="cert-list">'+(cur.certBadge?'<img src="'+esc(cur.certBadge)+'" alt="">':'')+'<div><b>'+esc(p.title)+'</b><span>'+items.length+' certified</span><ul>'+items.map(i=>'<li>'+esc(i.name)+'</li>').join("")+'</ul></div></div>':'<div class="hint">Not read from the website yet.</div>')+
      tip+'<div class="kbtns"><button type="button" class="btn sm" id="cert-get">'+(items.length?'Check the Website Now':'Get the List from the Website')+'</button><a class="btn sm" href="'+esc(certSite(ed,"standards-resources/"+p.slug))+'" target="_blank" rel="noopener">Open the Website Page ↗</a></div></div>';
    const au=$("#cert-auto",box); if(au) au.onchange=()=>{ auto=au.checked; if(PANE) PANE.dirty=true; draw(); };
    const g=$("#cert-get",box); if(g) g.onclick=async()=>{ g.disabled=true; g.textContent="Reading the website…";
      try{ const pv=sel?sel.value:""; if(pv && pv!==(S.sections[ed.month+"__cert"]||{}).certProgram) await put("sections", ed.month+"__cert", Object.assign({id:ed.month+"__cert",month:ed.month,key:"cert",status:"waiting"}, S.sections[ed.month+"__cert"]||doc, {certProgram:pv}));
        await certRefresh(ed); }catch(e){ toast("Couldn't read the website: "+(e.message||"try again"), 6000); }
      draw(); };
  };
  if(sel) sel.addEventListener("change", ()=>{ if(PANE) PANE.dirty=true; draw(); });
  draw();
}
