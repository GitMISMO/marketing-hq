/* ================= New certifications from the CMS, for MISMO Matters (Nov 21, 2026) =================
   The CMS publishes resources.mismo.org/certified/new-certifications.json: company and product certifications
   completed in the last 180 days, newest first ({note, updated, certifications:[{org, slug, program, product (or null),
   first, type, certifiedOn}]}). Contract: Connections Map row "CMS (Certification Completions) → MISMO Media".
   The CMS only ever adds fields; questions go to certifications@mismo.org.
   Each certification not seen before becomes a draft line for the Certifications section of the next MISMO Matters,
   kept here in data/certnews.json, one record per certification (slug + program + product + certifiedOn). First
   certifications lead and are highlighted. Nothing goes in until Jonna approves it; she can edit the words, move it
   to another edition or skip it. One already named in an edition that went out is marked Covered instead. Nothing is
   sent or posted automatically: approved lines only appear in the edition, which goes out the usual way. */
const CN_FEED="/certified/new-certifications.json";
const CN={busy:false, at:0, err:"", feedAt:"", n:0, all:false};
const CN_APPROVERS={"jcritchley@mismo.org":"Jonna Critchley","jcritchley@mba.org":"Jonna Critchley"};
function cnMe(){ const s=window.ResourcesSession && window.ResourcesSession.current && window.ResourcesSession.current(); return CN_APPROVERS[String((s&&s.email)||"").toLowerCase()]||""; }
/* the tracking key the CMS asked for: slug + program + product + certifiedOn */
function cnKey(c){ return [c.slug, c.program, c.product||"", c.certifiedOn].map(x=>String(x==null?"":x).trim().toLowerCase()).join("|"); }
function cnId(c){ const s=cnKey(c); let h=2166136261>>>0, g=5381; for(let i=0;i<s.length;i++){ h=Math.imul(h^s.charCodeAt(i),16777619)>>>0; g=((g*33)^s.charCodeAt(i))>>>0; }
  return "cn-"+String(c.slug||"x").replace(/[^a-z0-9-]/gi,"").slice(0,24)+"-"+h.toString(36)+g.toString(36); }
/* how each program reads in a sentence; a program the CMS adds later reads by its own name */
const CN_PROG={
  RON:{label:"Remote Online Notarization (RON)", role:"a MISMO Certified RON Provider", k:"ron"},
  eVault:{label:"eVault", role:"a MISMO Certified eVault System", k:"evault"},
  eClosing:{label:"eClosing", role:"a MISMO Certified eClose Provider", k:"eclose"},
  FRAME:{label:"FRAME Advisory Partner", role:"a MISMO Certified FRAME Advisory Partner", k:"frame"},
  Consultant:{label:"Consultant", role:"a MISMO Certified Consultant", k:"consultant"},
  Product:{label:"Product", role:"a MISMO Certified Product Provider", k:"product"}
};
function cnProg(p){ return CN_PROG[p] || {label:String(p||""), role:"MISMO "+String(p||"")+" certified", k:""}; }
/* a product name worth saying: not empty, not the program's name, not just the company again */
function cnProduct(c){ const p=String(c.product||"").trim(); if(!p) return ""; const n=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,"");
  return (n(p)===n(c.program) || n(p)===n(c.org) || n(p)===n(cnProg(c.program).label)) ? "" : p; }
function cnDraft(c){
  const pr=cnProg(c.program), prod=cnProduct(c);
  if(c.first) return prod ? c.org+" earned its first MISMO "+pr.label+" certification, for "+prod+"."
                          : c.org+" is now "+pr.role+", its first MISMO "+pr.label+" certification.";
  return c.org+" renewed its MISMO "+pr.label+" certification"+(prod?" for "+prod:"")+(c.type && /\d/.test(c.type)?" ("+c.type.toLowerCase()+")":"")+".";
}
/* the edition a new line goes to: the next one still being built */
function cnEdition(){ const t=T(); const eds=editionsSorted().filter(e=>e.dates && !e.archived && !(e.done&&e.done.publish));
  return (eds.find(e=>(e.dates.publish||e.month+"-28")>=t) || curEdition() || {}).id || ""; }
/* the names a company goes by: "TReX (Tidgewell Results Experience)" is also TReX and Tidgewell Results Experience */
function cnNames(org){ const o=String(org||"").trim(), m=o.match(/^(.*?)\s*\((.+)\)\s*$/); return (m?[o,m[1],m[2]]:[o]).filter(n=>n.length>=3); }
const cnNorm=s=>String(s||"").toLowerCase().replace(/&/g," and ").replace(/\b(inc|llc|l\.l\.c|corp|corporation|company|co|the|ltd)\b\.?/g," ").replace(/[^a-z0-9]+/g,"");
function cnSameOrg(a, org){ return cnNames(org).some(n=>cnNorm(a)===cnNorm(n) || (typeof nmSame==="function" && nmSame(a, n))); }
/* already named in an edition that went out (its Certifications list for the same program, its own words, or its
   In the News stories about a certification)? */
function cnCoveredBy(c){
  if(!cnNames(c.org).length) return "";
  for(const e of editionsSorted()){
    if(!(e.dates && e.dates.publish && e.dates.publish<=T() && e.dates.publish>=c.certifiedOn)) continue;
    const d=S.sections[e.month+"__cert"]||{}, prog=cnProg(c.program).k;
    if(prog && d.certProgram===prog && (d.certItems||[]).some(i=>cnSameOrg(i.name, c.org))) return monthName(e.month)+" MISMO Matters (Certifications list)";
    const words=cnNorm([d.body||"", d.headline||""].join(" "));
    if(cnNames(c.org).some(n=>cnNorm(n).length>=5 && words.indexOf(cnNorm(n))>=0) && new RegExp(String(c.program).replace(/[^a-z]/gi,""),"i").test([d.body||"",d.headline||""].join(" "))) return monthName(e.month)+" MISMO Matters (Certifications section)";
    if(typeof newsInWindow==="function" && newsInWindow(e).some(n=>/certif/i.test(n.headline||"") && cnNames(c.org).some(x=>cnNorm(n.headline).indexOf(cnNorm(x))>=0))) return monthName(e.month)+" MISMO Matters (In the News)";
  }
  return "";
}
async function cnSync(force){
  if(CN.busy || STALE.on || !CANWRITE || !LOADED.has("certnews") || !LOADED.has("editions") || !LOADED.has("sections")) return;
  if(!force && Date.now()-CN.at < 30*60000) return;
  if(location.protocol==="file:" && /\[native code\]/.test(String(window.fetch))) return;   /* a saved copy opened from disk has no feed to read */
  CN.busy=true; CN.at=Date.now();
  try{
    const r=await fetch(CN_FEED, {cache:"no-store"}); if(!r.ok) throw new Error("the CMS feed answered "+r.status);
    const j=await r.json(); const list=Array.isArray(j && j.certifications) ? j.certifications : [];
    CN.feedAt=String(j && j.updated || ""); CN.n=list.length; CN.err="";
    const have=new Set(vals("certnews").map(x=>x.key));
    const ed=cnEdition();
    for(const c of list){
      if(!c || !c.slug || !c.program || !c.certifiedOn) continue;
      const key=cnKey(c), id=cnId(c); if(have.has(key) || S.certnews[id]) continue;
      const cov=cnCoveredBy(c);
      await put("certnews", id, {key, org:String(c.org||""), slug:c.slug, program:c.program, product:c.product||null, first:c.first===true, type:String(c.type||""), certifiedOn:c.certifiedOn,
        text:cnDraft(c), status:cov?"covered":"draft", coveredBy:cov, edition:cov?"":ed, draftedAt:new Date().toISOString(), feed:c});
      have.add(key);
    }
    /* lines no one has decided on yet: check again whether a sent edition already covered them */
    for(const x of vals("certnews")){
      if(x.decidedBy || !["draft","covered"].includes(x.status)) continue;
      const cov=cnCoveredBy(x.feed||x), want=cov?"covered":"draft";
      if(want!==x.status || (cov||"")!==(x.coveredBy||"")) await put("certnews", x.id, Object.assign({}, x, {status:want, coveredBy:cov, edition:cov?"":(x.edition||ed)}));
    }
  }catch(e){ CN.err=(e&&e.message)||"couldn't read the CMS feed"; }
  finally{ CN.busy=false; }
}
setInterval(()=>{ if(document.visibilityState!=="hidden") cnSync(); }, 10*60000);
/* the approved lines for an edition, first certifications first, then newest */
function cnFor(ed){ return vals("certnews").filter(x=>x.status==="approved" && x.edition===ed.id).sort((a,b)=>(b.first?1:0)-(a.first?1:0) || String(b.certifiedOn).localeCompare(String(a.certifiedOn)) || String(a.org).localeCompare(String(b.org))); }

/* ---------- in the email and the text version ---------- */
function certNewsEmail(ed){
  const xs=cnFor(ed); if(!xs.length) return "";
  const F=EM_F, navy="#0d314c", line="#dde9f2", M="font-family:'IBM Plex Mono',Consolas,monospace;";
  const firsts=xs.filter(x=>x.first), renew=xs.filter(x=>!x.first);
  const head='<div style="'+M+'font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#2477b8;font-weight:600;margin:0 0 6px">New MISMO Certifications</div>'+
    '<div style="'+F+'font-size:20px;line-height:1.25;color:'+navy+';font-weight:700;margin:0 0 12px">Congratulations to the companies certified'+(firsts.length&&!renew.length?' for the first time':'')+' this month</div>';
  const first=x=>'<tr><td style="padding:10px 0;border-bottom:1px solid '+line+'"><div style="'+M+'font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:#1a8a5c;font-weight:700;margin:0 0 3px">First Certification &middot; '+esc(cnProg(x.program).label)+'</div>'+
    '<div style="'+F+'font-size:16px;line-height:1.45;color:'+navy+';font-weight:700">'+esc(x.org)+'</div><div style="'+F+'font-size:15px;line-height:1.55;color:#1d2b36">'+esc(x.text)+'</div></td></tr>';
  const ren=x=>'<tr><td width="14" valign="top" style="padding:6px 0;'+F+'font-size:11px;line-height:20px;color:#74bfeb">&#11042;</td><td style="padding:6px 0 6px 6px;border-bottom:1px solid '+line+';'+F+'font-size:14.5px;line-height:20px;color:#1d2b36">'+esc(x.text)+'</td></tr>';
  return emGap('<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid '+line+';border-top:4px solid #1a8a5c;border-radius:8px"><tr><td style="padding:20px 22px">'+head+
    (firsts.length?'<table role="presentation" width="100%" cellpadding="0" cellspacing="0">'+firsts.map(first).join("")+'</table>':'')+
    (renew.length?'<div style="'+F+'font-size:14px;font-weight:700;color:'+navy+';margin:'+(firsts.length?'16px':'0')+' 0 4px">Renewed</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0">'+renew.map(ren).join("")+'</table>':'')+
    '</td></tr></table>', 6, 22);
}
function certNewsText(ed){
  const xs=cnFor(ed); if(!xs.length) return [];
  const out=["New MISMO Certifications"];
  xs.filter(x=>x.first).forEach(x=>out.push("First certification: "+x.text));
  const r=xs.filter(x=>!x.first); if(r.length){ out.push("Renewed:"); r.forEach(x=>out.push("• "+x.text)); }
  return out;
}

/* ---------- the card on MISMO Matters, for Jonna ---------- */
function cnCard(ed){
  const all=vals("certnews"), wait=all.filter(x=>x.status==="draft").sort((a,b)=>(b.first?1:0)-(a.first?1:0) || String(b.certifiedOn).localeCompare(String(a.certifiedOn)));
  const shown=CN.all ? all.slice().sort((a,b)=>String(b.certifiedOn).localeCompare(String(a.certifiedOn))) : wait;
  const me=!!cnMe(), inEd=cnFor(ed).length;
  if(!all.length && !CN.err) return '';
  const st=x=>x.status==="draft"?'<span class="chip review">Waiting for Jonna</span>':x.status==="approved"?'<span class="chip ok">In '+esc(monthName((S.editions[x.edition]||{}).month||""))+'</span>':x.status==="covered"?'<span class="chip wait" title="'+esc(x.coveredBy||"")+'">Covered</span>':'<span class="chip changes">Skipped</span>';
  const row=x=>'<tr class="click" data-cn="'+esc(x.id)+'"><td>'+(x.first?'<span class="cn-first">First</span>':'<span class="cn-ren">'+esc(x.type||"Renewal")+'</span>')+'</td>'+
    '<td><b>'+esc(x.org)+'</b><span class="t2">'+esc(x.text)+'</span></td><td class="nw">'+esc(cnProg(x.program).label)+'</td><td class="nw">'+esc(fS(x.certifiedOn))+'</td><td class="nw">'+st(x)+'</td>'+
    '<td class="nw cn-acts">'+(x.status==="draft"?'<button class="btn sm pri" type="button" data-cna="ok" data-id="'+esc(x.id)+'"'+(me?'':' disabled title="Jonna approves these"')+'>Approve</button><button class="btn sm" type="button" data-cna="skip" data-id="'+esc(x.id)+'"'+(me?'':' disabled title="Jonna approves these"')+'>Skip</button>':'')+'</td></tr>';
  return '<div class="card" id="cn-card" style="margin-bottom:22px"><div class="ch"><h2>New Certifications from the CMS</h2><span class="cnt">'+wait.length+'</span>'+
    '<span class="note">'+(wait.length?wait.filter(x=>x.first).length+' first certifications and '+wait.filter(x=>!x.first).length+' renewals drafted for the Certifications section, waiting for Jonna':'nothing waiting')+(inEd?' · '+inEd+' approved for '+esc(monthName(ed.month)):'')+'</span><span class="sp"></span>'+
    '<button class="btn sm" type="button" id="cn-all">'+(CN.all?'Show Only Waiting':'Show All '+all.length)+'</button>'+
    (me && wait.some(x=>x.first)?'<button class="btn sm" type="button" id="cn-firsts">Approve All First Certifications</button>':'')+'</div>'+
    (CN.err?'<div class="hint pad">Couldn\'t read the CMS feed: '+esc(CN.err)+'. Questions about it go to certifications@mismo.org.</div>':'')+
    (shown.length?'<div class="tw"><table class="t"><thead><tr><th></th><th>Draft for MISMO Matters</th><th>Program</th><th>Certified</th><th>Status</th><th></th></tr></thead><tbody>'+shown.map(row).join("")+'</tbody></table></div>'
      :'<div class="empty sm">Every certification from the CMS is approved, skipped or already covered. New ones arrive as drafts by themselves.</div>')+
    '<p class="rs-note pad">Approved lines appear in the edition\'s Certifications section, first certifications on top. Nothing is sent or posted from here. Click a line to edit the words or move it to another edition.</p></div>';
}
async function cnSet(id, part){
  if(!cnMe()){ toast("Jonna approves these.", 3000); return; }
  const x=S.certnews[id]; if(!x) return;
  await put("certnews", id, Object.assign({}, x, part, {decidedBy:cnMe(), decidedAt:new Date().toISOString()}));
}
function cnWire(el, ed){
  const c=$("#cn-card",el); if(!c) return;
  const a=$("#cn-all",c); if(a) a.onclick=()=>{ CN.all=!CN.all; renderMatters(); };
  const f=$("#cn-firsts",c); if(f) f.onclick=async()=>{ const xs=vals("certnews").filter(x=>x.status==="draft" && x.first); for(const x of xs) await cnSet(x.id, {status:"approved", edition:x.edition||cnEdition()}); toast(xs.length+" first certifications approved.", 3000); renderMatters(); };
  $$("[data-cna]",c).forEach(b=>b.onclick=async ev=>{ ev.stopPropagation(); const x=S.certnews[b.dataset.id]; if(!x) return;
    await cnSet(x.id, b.dataset.cna==="ok" ? {status:"approved", edition:x.edition||cnEdition()} : {status:"skipped"}); renderMatters(); });
  $$("tr[data-cn]",c).forEach(r=>r.onclick=()=>cnOpen(r.dataset.cn));
}
function cnOpen(id){
  const x=S.certnews[id]; if(!x) return; const me=!!cnMe();
  const eds=editionsSorted().filter(e=>!e.archived || e.id===x.edition).slice().reverse().map(e=>[e.id, monthName(e.month)+(e.done&&e.done.publish?" (sent)":"")]);
  const facts='<div class="ro cn-facts"><b>'+esc(x.org)+'</b> · '+esc(x.program)+(x.product?' · '+esc(x.product):'')+' · '+esc(x.type||"")+' · certified '+esc(fS(x.certifiedOn))+(x.first?' · <span class="cn-first">First</span>':'')+
    (x.coveredBy?'<div class="hint">Already covered: '+esc(x.coveredBy)+'.</div>':'')+'<div class="hint">From the CMS feed. If something here looks wrong, ask certifications@mismo.org.</div></div>';
  openPane({eye:"New Certification · from the CMS", title:x.org, data:Object.assign({}, x),
    fields:[{k:"_f",type:"html",html:()=>facts},{k:"text",label:"The Line in MISMO Matters",type:"textarea",rows:3,wide:true},{k:"edition",label:"Goes in",type:"select",opts:[["","Next edition being built"]].concat(eds)}],
    save: me ? async v=>{ await put("certnews", id, Object.assign({}, S.certnews[id], v, {edition:v.edition||x.edition||cnEdition()})); renderMatters(); } : null,
    buttons: me ? [x.status!=="approved"?{label:"Approve", run:async v=>{ await cnSet(id, Object.assign({}, v, {status:"approved", edition:v.edition||x.edition||cnEdition()})); closePane(true); renderMatters(); }}:null,
      x.status!=="skipped"?{label:"Skip It", run:async v=>{ await cnSet(id, {status:"skipped"}); closePane(true); renderMatters(); }}:null,
      x.status!=="draft"?{label:"Back to Waiting", run:async v=>{ await cnSet(id, {status:"draft"}); closePane(true); renderMatters(); }}:null].filter(Boolean) : [],
    noFocus:!me});
}
/* System Health */
function hhCertNews(){
  if(!LOADED.has("certnews")) return null;
  const wait=vals("certnews").filter(x=>x.status==="draft").length;
  if(CN.err) return hhRow("cnfeed","CMS New Certifications","bad","Couldn't read the CMS feed: "+CN.err+". Questions go to certifications@mismo.org.");
  if(!CN.at) return hhRow("cnfeed","CMS New Certifications","off","Reads the CMS's new certifications when MISMO Media opens.");
  return hhRow("cnfeed","CMS New Certifications","ok","Read "+hhWhen(CN.at)+(CN.feedAt?" (the CMS updated it "+fS(CN.feedAt)+")":"")+": "+CN.n+" certifications in the last 180 days, "+wait+" waiting for Jonna.");
}
