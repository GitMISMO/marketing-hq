/* ================= Image Library: the Brand Kit (Nov 23, 2026) =================
   Jonna: "organize the image library, it's going to get unruly, Amy was looking for the eps of the logo and had to
   scroll forever". Everything tagged Logos & Brand ("brand") moves out of the Library grid into its own tab:
   the MISMO logo as one card per color with a button for each format (PNG, JPG, SVG, AI, EPS), each badge as one
   card with its sizes and vector PDF, then guides and templates, print and trade show files, video and swag mockups.
   Nothing is moved or renamed in SharePoint; the groups are worked out from each file's name, type and folder, and a
   file can be put in another group by setting bkGroup on it. The Library keeps the campaign pictures, by month. */
const BK_GROUPS = [["logo","MISMO Logo"],["badge","Certification & Member Badges"],["guide","Guides & Templates"],["print","Print & Trade Show"],["video","Video"],["swag","Swag Mockups"],["other","Other Brand Files"]];
const BK_FMTS = [["png","PNG"],["jpg","JPG"],["svg","SVG"],["eps","EPS"],["ai","AI"],["pdf","PDF"],["mp4","Video"],["doc","Word"],["ppt","PowerPoint"],["zip","ZIP"],["gif","GIF"],["webp","WebP"]];
const BK_FMT = Object.fromEntries(BK_FMTS);
const BK_JUMP = {logo:"Logo", badge:"Badges", guide:"Guides", print:"Print", video:"Video", swag:"Swag", other:"Other"};
const BK_COLORS = ["Full Color","Black","Slate Gray","White","White with Blue S","All Colors (Print File)","Earlier Versions"];
/* order matters: the narrower name first (Pending before AI Governance, Champion and the full set before Member) */
const BK_BADGES = [["aipend",/AI Governance,? Pending/i,"AI Governance, Pending Certification"],["ai",/AI Governance/i,"Certified AI Governance"],
  ["ron",/\bRON\b/i,"Certified RON Provider"],["smart",/SMART Doc/i,"Certified SMART Doc System"],["frame",/FRAME/i,"Certified FRAME Advisory Partner"],
  ["evault",/eVault/i,"Certified eVault System"],["eclose",/eClose/i,"Certified eClose Provider"],["consult",/Consultant/i,"MISMO Certified Consultant"],
  ["champ",/Champion/i,"Champion Member"],["all",/Badges/i,"Every Badge"],["member",/Member/i,"MISMO Member"]];
const BKIT = {q:"", fmt:""};
function isBrandKit(im){ return !!im && im.campaign==="brand"; }
function bkExt(im){
  let x = isFile(im) ? fileExt(im) : (im.ext || (String(im.file||im.spPath||"").match(/\.(\w{2,4})$/)||[])[1] || String(im.type||"").split("/")[1] || "");
  x=String(x).toLowerCase().replace("+xml","");
  return {jpeg:"jpg", docx:"doc", pptx:"ppt", xlsx:"xls", mov:"mp4"}[x] || x;
}
function bkGroup(im){
  if(im.bkGroup && BK_GROUPS.some(g=>g[0]===im.bkGroup)) return im.bkGroup;
  const n=String(im.name||""), dir=String(im.spPath||"").replace(/[^/]*$/,""), x=bkExt(im);
  if(/swag mockup/i.test(n) || /swag mockups/i.test(dir)) return "swag";
  if(/badge/i.test(n) || /certification-member badges/i.test(dir)) return "badge";
  if(/^MISMO (Logo\b(?!\s*Reveal)|FINAL\b)/i.test(n)) return "logo";
  if(x==="mp4") return "video";
  if(x==="pdf" && /trade ?show|postcard|banner|signage|booth|print/i.test(n+" "+dir)) return "print";
  if(x==="doc" || x==="ppt" || /guide|brief|playbook|messaging|template|architecture/i.test(n)) return "guide";
  return "other";
}
function bkColor(n){ n=String(n||"");
  if(/white blue s/i.test(n)) return "White with Blue S"; if(/full color/i.test(n)) return "Full Color"; if(/slate/i.test(n)) return "Slate Gray";
  if(/black/i.test(n)) return "Black"; if(/white/i.test(n)) return "White"; if(/^\s*MISMO FINAL\s*$/i.test(n)) return "All Colors (Print File)"; return "Earlier Versions"; }
function bkBadge(n){ const b=BK_BADGES.find(([,re])=>re.test(String(n||""))); return b ? b : ["other",null,String(n||"Badge")]; }
/* what each format button says: the format, plus the size or version when a card holds more than one of it */
function bkLabel(im){
  const x=bkExt(im), n=String(im.name||""); let l=BK_FMT[x]||x.toUpperCase()||"File";
  if(/400\s*x\s*400/i.test(n)) l+=" 400 × 400"; else if(x==="pdf" && /vector/i.test(n)) l+=" (Vector)";
  const v=n.match(/\bv(\d+)\b/i); if(v) l+=" v"+v[1];
  return l;
}
/* the cards: logos by color, badges by badge, everything else one card each */
function bkCards(items){
  const cards=[], by={};
  items.forEach(im=>{
    const g=bkGroup(im); let key, title;
    if(g==="logo"){ title=bkColor(im.name); key="logo:"+title; }
    else if(g==="badge"){ const b=bkBadge(im.name); key="badge:"+b[0]; title=b[2]; }
    else { key=g+":"+im.id; title=im.name||im.file||"Untitled"; }
    if(!by[key]){ by[key]={key, g, title, items:[]}; cards.push(by[key]); }
    by[key].items.push(im);
  });
  const fo=x=>{ const i=BK_FMTS.findIndex(f=>f[0]===x); return i<0?99:i; };
  cards.forEach(c=>{
    c.items.sort((a,b)=>fo(bkExt(a))-fo(bkExt(b)) || String(a.name||"").localeCompare(String(b.name||"")));
    /* the picture on the card: a 400 × 400 badge or a PNG logo if there is one */
    const pics=c.items.filter(i=>!isFile(i));
    c.pic=pics.find(i=>/400\s*x\s*400/i.test(i.name||"")) || pics.find(i=>bkExt(i)==="png") || pics[0] || null;
    c.fmts=[...new Set(c.items.map(bkExt))];
  });
  const order=c=>c.g==="logo" ? BK_COLORS.indexOf(c.title) : c.g==="badge" ? BK_BADGES.findIndex(b=>"badge:"+b[0]===c.key) : 0;
  return cards.sort((a,b)=>BK_GROUPS.findIndex(g=>g[0]===a.g)-BK_GROUPS.findIndex(g=>g[0]===b.g) || order(a)-order(b) || String(a.title).localeCompare(String(b.title)));
}
function bkDownload(im){ if(!im) return; if(isFile(im)){ if(!im.spPath){ toast("This file has no SharePoint location."); return; } window.open(spFileUrl(im.spPath,true),"_blank","noopener"); return; } downloadImage(im); }
function bkCardHtml(c){
  const dark=/^White/.test(c.title) && c.g==="logo", p=c.pic;
  const thumb = p ? (imgThumb(p) ? '<img src="'+esc(imgThumb(p))+'" alt="'+esc(p.alt||c.title)+'" loading="lazy">' : '<span class="imload">'+(p.spPath&&SP_IMG()?"Loading…":"In SharePoint")+'</span>') : fileTile(c.items[0]);
  const many=c.items.length>1;
  return '<div class="bkcard'+(c.items.every(i=>i.archived)?" arch":"")+'" data-bkopen="'+esc((p||c.items[0]).id)+'" tabindex="0" role="button" aria-label="'+esc(c.title)+'">'+
    '<div class="imthumb'+(dark?" bk-dark":"")+'">'+thumb+'</div>'+
    '<div class="bkbody"><b>'+esc(c.title)+'</b>'+(many?'<small>'+c.items.length+' files · '+esc(c.fmts.map(x=>BK_FMT[x]||x.toUpperCase()).join(", "))+'</small>':'<small>'+esc([BK_FMT[bkExt(c.items[0])]||bkExt(c.items[0]).toUpperCase(), +c.items[0].size?imgKB(c.items[0].size):""].filter(Boolean).join(" · "))+'</small>')+
      '<div class="bkfmt" role="group" aria-label="Download '+esc(c.title)+'">'+c.items.map(im=>'<button type="button" class="btn sm'+(BKIT.fmt&&bkExt(im)===BKIT.fmt?" pri":"")+(im.archived?" arch":"")+'" data-bkdl="'+esc(im.id)+'" title="Download '+esc(im.file||im.name||"")+'">'+esc(many?bkLabel(im):"Download")+'</button>').join("")+'</div>'+
    '</div></div>';
}
function brandKitHtml(){
  const all=imgsLive().filter(isBrandKit), q=imNorm(BKIT.q);
  const cards=bkCards(all), have=new Set(all.map(bkExt));
  const shown=cards.filter(c=>(!BKIT.fmt || c.fmts.includes(BKIT.fmt)) && (!q || imNorm([c.title, BK_GROUPS.find(g=>g[0]===c.g)[1], ...c.items.map(i=>[i.name,i.file,i.notes,bkExt(i),BK_FMT[bkExt(i)]].join(" "))].join(" ")).indexOf(q)>=0));
  const fmts=BK_FMTS.filter(f=>have.has(f[0]));
  let body='';
  BK_GROUPS.forEach(([g,label])=>{ const cs=shown.filter(c=>c.g===g); if(!cs.length) return;
    body+='<section class="bkgrp" id="bk-'+g+'"><div class="bkh"><h3>'+esc(label)+'</h3><span class="cnt">'+cs.length+'</span>'+(g==="logo"?'<span class="note">every format of one color on one card</span>':g==="badge"?'<span class="note">PNG, 400 × 400 and the vector PDF on one card</span>':'')+'</div><div class="bkgrid">'+cs.map(bkCardHtml).join("")+'</div></section>'; });
  return '<div class="card"><div class="ch"><h2>Brand Kit</h2><span class="cnt">'+all.length+' files</span><div class="r im-filters">'+
      '<input type="search" class="plain" id="bk-q" placeholder="Search the Brand Kit" value="'+esc(BKIT.q)+'" aria-label="Search the Brand Kit">'+
      '<label class="im-arch"><input type="checkbox" id="im-arch"'+(IM.arch?" checked":"")+'> Show Archived</label></div></div>'+
    '<div class="bkbar" role="group" aria-label="File type"><span>File type</span><button type="button" class="btn sm'+(BKIT.fmt?"":" pri")+'" data-bkfmt="">All</button>'+fmts.map(([k,l])=>'<button type="button" class="btn sm'+(BKIT.fmt===k?" pri":"")+'" data-bkfmt="'+k+'">'+esc(l)+'</button>').join("")+
      '<span class="bkjump">'+BK_GROUPS.filter(([g])=>shown.some(c=>c.g===g)).map(([g,l])=>'<a href="#bk-'+g+'" data-bkjump="'+g+'">'+esc(BK_JUMP[g]||l)+'</a>').join("")+'</span></div>'+
    (body || '<div class="empty">'+(all.length?'Nothing in the Brand Kit matches. Clear the search or pick All.':'No brand files yet. Add them from SharePoint or press Add Images.')+'</div>')+
  '</div>';
}
function brandKitWire(el){
  const qi=$("#bk-q",el); if(qi) qi.oninput=()=>{ BKIT.q=qi.value; clearTimeout(qi._t); qi._t=setTimeout(()=>{ renderImages(); const n=$("#bk-q"); if(n){ n.focus(); n.setSelectionRange(n.value.length,n.value.length); } },250); };
  const ar=$("#im-arch",el); if(ar) ar.onchange=e=>{ IM.arch=e.target.checked; renderImages(); };
  $$("[data-bkfmt]",el).forEach(b=>b.onclick=()=>{ BKIT.fmt=b.dataset.bkfmt; renderImages(); });
  $$("[data-bkjump]",el).forEach(a=>a.onclick=e=>{ e.preventDefault(); const t=$("#bk-"+a.dataset.bkjump); if(t) t.scrollIntoView({behavior:"smooth", block:"start"}); });
  $$("[data-bkdl]",el).forEach(b=>b.onclick=e=>{ e.stopPropagation(); bkDownload(S.images[b.dataset.bkdl]); });
  $$(".bkcard",el).forEach(c=>{ c.onclick=()=>openImage(c.dataset.bkopen); c.onkeydown=e=>{ if(e.target===c && (e.key==="Enter"||e.key===" ")){ e.preventDefault(); openImage(c.dataset.bkopen); } }; });
  /* only the picture each card shows is loaded, one at a time (SharePoint turns away bursts) */
  bkCards(imgsLive().filter(isBrandKit)).forEach(c=>{ if(c.pic && !imgThumb(c.pic)) imgEnsureThumb(c.pic); });
}
