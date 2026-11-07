/* ================= Image Library ================= */
/* One place for the pictures every campaign uses. Upload, tag to a campaign (and a
   MISMO Matters edition), preview, download, copy the link, and pick one for a section.
   Claude version: files go to this page's own image store.
   resources.mismo.org: files will go to MISMO's SharePoint through a Power Automate flow.
   Emails can't show private pictures, so each one also goes into the Higher Logic image
   library before a send (its link is pasted into the section). */
const IMG_CAMPS = [["matters","MISMO Matters"],["micdup","Mic'd Up"],["linkedin","LinkedIn"],["youtube","YouTube"],["mailchimp","Mailchimp"],["summit","Summits"],["community","Community Posts"],["brand","Logos & Brand"],["logos","Member & Sponsor Logos"],["other","Other"]];
const IMG_CAMP = Object.fromEntries(IMG_CAMPS);
const IM = {camp:"", ed:"", q:"", arch:false, sel:new Set(), type:"", view:"lib"};
const imNorm = x=>String(x||"").replace(/\s+/g," ").trim().toLowerCase();
let DL = null;
const IMG_LOCAL = {};   // just-uploaded files shown from memory while the web copy publishes
function imgSrc(im){ return IMG_LOCAL[im.id] || im.url || (im.assetId ? "/_blob/"+im.assetId : "") || im.hlUrl || ""; }
/* pictures kept in SharePoint come through the Marketing HQ Images flow (resources.mismo.org only) */
const SP_IMG = ()=>window.__hqImages || null;
const IMG_Q = {busy:0, wait:[], tried:{}};
function imgEnsure(im){
  if(!im || isFile(im) || IMG_LOCAL[im.id] || !im.spPath || !SP_IMG()) return Promise.resolve();
  if(IMG_Q.tried[im.id]) return IMG_Q.tried[im.id];
  IMG_Q.tried[im.id] = new Promise(res=>{
    const run=()=>{ IMG_Q.busy++; SP_IMG().get(im.spPath).then(b=>{ IMG_LOCAL[im.id]=URL.createObjectURL(b); schedule(); }).catch(()=>{ delete IMG_Q.tried[im.id]; }).then(()=>{ IMG_Q.busy--; res(); const n=IMG_Q.wait.shift(); if(n) n(); }); };
    if(IMG_Q.busy<4) run(); else IMG_Q.wait.push(run);
  });
  return IMG_Q.tried[im.id];
}
const IMG_EXT = /\.(png|jpe?g|gif|svg|webp)$/i;
/* brand files kept alongside the pictures: design files, guides, templates, video */
const BRAND_EXT = /\.(png|jpe?g|gif|svg|webp|pdf|ai|eps|pptx?|docx?|xlsx?|mp4|mov|zip)$/i;
const FILE_KIND = {pdf:"PDF", ai:"Illustrator", eps:"EPS", ppt:"PowerPoint", pptx:"PowerPoint", doc:"Word", docx:"Word", xls:"Excel", xlsx:"Excel", mp4:"Video", mov:"Video", zip:"ZIP"};
function isFile(im){ return im && im.kind==="file"; }
function fileExt(im){ return (im.ext || String(im.file||"").split(".").pop() || "").toLowerCase(); }
function fileTile(im){ const x=fileExt(im); return '<div class="imfile f-'+esc(x)+'"><b>'+esc(x.toUpperCase())+'</b><small>'+esc(FILE_KIND[x]||"File")+'</small></div>'; }
async function addFromSharePoint(path, campaign){
  const sp=SP_IMG(); if(!sp){ toast("SharePoint pictures open on resources.mismo.org."); return; }
  toast("Reading the SharePoint folder…", 60000);
  let files; try{ files=await spListOnce(path, true); }catch(e){ toast("Couldn't read that folder: "+(e.message||"try again"), 5000); return; }
  const have=new Set(vals("images").map(i=>i.spPath).filter(Boolean));
  /* the same file saved in two folders (same name and size) is listed once */
  const twin=f=>String(f.file||f.name||"").toLowerCase()+"|"+(+f.size||0);
  const seen=new Set(vals("images").map(twin));
  const keep=files.filter(f=>!f.folder && BRAND_EXT.test(f.name));
  let n=0, nf=0, dup=0;
  for(const f of keep){ if(have.has(f.path)) continue; if(seen.has(twin(f))){ dup++; continue; } seen.add(twin(f));
    const pic=IMG_EXT.test(f.name);
    await put("images", uid("img"), {name:f.name.replace(/\.[a-z0-9]+$/i,"").replace(/[-_]+/g," ").trim(), file:f.name, kind:pic?"":"file", ext:(f.name.split(".").pop()||"").toLowerCase(), campaign:campaign||"brand", edition:"", alt:"", credit:"", notes:"From SharePoint: "+f.folderPath, w:0, h:0, size:f.size||0, type:"", url:"", assetId:"", spPath:f.path, at:f.modified||new Date().toISOString(), archived:false, source:"sharepoint"});
    if(pic) n++; else nf++; }
  toast((n||nf ? [n?n+" picture"+(n===1?"":"s"):"", nf?nf+" brand file"+(nf===1?"":"s"):""].filter(Boolean).join(" and ")+" added from SharePoint" : "Nothing new in that folder")+(dup?" ("+dup+" duplicate"+(dup===1?"":"s")+" skipped)":"")+".", 7000);
}
function openAddFromSharePoint(){
  openPane({eye:"Image Library", title:"Add Pictures from SharePoint", data:{path:"/MISMO/Active Documents/Marketing/Branding - 2026", campaign:"brand"},
    fields:[{k:"path",label:"SharePoint Folder (in Q Drive)",wide:true,ph:"/MISMO/Active Documents/Marketing/…"},{k:"campaign",label:"Tag Them As",type:"select",opts:IMG_CAMPS},
      {k:"_h",type:"html",wide:true,html:()=>'<div class="hint">Every picture and brand file (PDFs, Illustrator and EPS files, PowerPoint and Word files, video, ZIPs) in the folder and its subfolders is listed in the library. The files stay where they are in SharePoint. Anything already listed is skipped, and so is a second copy of the same file saved in another folder.</div>'}],
    buttons:[{label:"Add These Files", run:async v=>{ closePane(true); await addFromSharePoint(v.path, v.campaign); }}]});
}
function imgKB(n){ n=+n||0; return n>=1048576 ? (n/1048576).toFixed(1)+" MB" : Math.max(1,Math.round(n/1024))+" KB"; }
function imgsLive(){ return vals("images").filter(im=>IM.arch ? true : !im.archived).sort((a,b)=>(a.at||"")<(b.at||"")?1:-1); }
function imgDims(file){ return new Promise(res=>{ const u=URL.createObjectURL(file), i=new Image(); i.onload=()=>{ res({w:i.naturalWidth,h:i.naturalHeight}); URL.revokeObjectURL(u); }; i.onerror=()=>{ res({w:0,h:0}); URL.revokeObjectURL(u); }; i.src=u; }); }

async function addImages(files, preset, quiet){
  files=[...(files||[])].filter(f=>/^image\//.test(f.type));
  if(!files.length){ toast("Pick image files (JPG, PNG, GIF, SVG or WebP)."); return []; }
  if(!ASSETS){ toast("Adding pictures here opens when MISMO Media is switched on. Use the Claude version for now.", 4500); return []; }
  const made=[]; let n=0;
  for(const f of files){
    n++; if(!quiet) toast("Adding "+n+" of "+files.length+"…", 60000);
    try{
      const dims=await imgDims(f);
      const r=await ASSETS.upload(f);
      const id=uid("img");
      IMG_LOCAL[id]=URL.createObjectURL(f);
      const ed=curEdition();
      const doc=Object.assign({
        name:f.name.replace(/\.[a-z0-9]+$/i,"").replace(/[-_]+/g," ").trim(), file:f.name,
        campaign:IM.camp||"matters", edition:(IM.camp||"matters")==="matters" ? (IM.ed||(ed&&ed.id)||"") : "",
        alt:"", credit:"", notes:"", w:dims.w, h:dims.h, size:r.sizeBytes||f.size, type:r.contentType||f.type,
        url:r.url||"", assetId:/^[0-9a-f]{32}$/.test(r.id||"") ? r.id : "", path:"", spPath:r.sp ? r.id : "",
        at:new Date().toISOString(), archived:false
      }, preset||{});
      await put("images", id, doc); made.push(Object.assign({id},doc));
    }catch(e){ toast("Couldn't add "+f.name+": "+(e.message||e.code||"try again"), 5000); return made; }
  }
  if(!quiet) toast(made.length===1 ? "Image added. Press it to name and tag it." : made.length+" images added. Press each to name and tag it.", 4000);
  return made;
}
/* a plain ZIP (stored, no compression: pictures are already compressed) */
const CRC_T=(()=>{ const t=new Uint32Array(256); for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c=c&1?0xEDB88320^(c>>>1):c>>>1; t[n]=c>>>0; } return t; })();
function crc32(u8){ let c=0xFFFFFFFF; for(let i=0;i<u8.length;i++) c=CRC_T[(c^u8[i])&255]^(c>>>8); return (c^0xFFFFFFFF)>>>0; }
function makeZip(files){
  const enc=new TextEncoder(), parts=[], cen=[]; let off=0;
  const d=new Date(), dt=((d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1)), dd=(((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate());
  files.forEach(f=>{
    const name=enc.encode(f.name), data=f.data, crc=crc32(data);
    const h=new DataView(new ArrayBuffer(30)); h.setUint32(0,0x04034b50,true); h.setUint16(4,20,true); h.setUint16(6,0x0800,true); h.setUint16(8,0,true); h.setUint16(10,dt,true); h.setUint16(12,dd,true); h.setUint32(14,crc,true); h.setUint32(18,data.length,true); h.setUint32(22,data.length,true); h.setUint16(26,name.length,true); h.setUint16(28,0,true);
    parts.push(new Uint8Array(h.buffer), name, data);
    const c=new DataView(new ArrayBuffer(46)); c.setUint32(0,0x02014b50,true); c.setUint16(4,20,true); c.setUint16(6,20,true); c.setUint16(8,0x0800,true); c.setUint16(10,0,true); c.setUint16(12,dt,true); c.setUint16(14,dd,true); c.setUint32(16,crc,true); c.setUint32(20,data.length,true); c.setUint32(24,data.length,true); c.setUint16(28,name.length,true); c.setUint32(42,off,true);
    cen.push(new Uint8Array(c.buffer), name);
    off+=30+name.length+data.length;
  });
  const csize=cen.reduce((n,p)=>n+p.length,0);
  const e=new DataView(new ArrayBuffer(22)); e.setUint32(0,0x06054b50,true); e.setUint16(8,files.length,true); e.setUint16(10,files.length,true); e.setUint32(12,csize,true); e.setUint32(16,off,true);
  return new Blob(parts.concat(cen,[new Uint8Array(e.buffer)]),{type:"application/zip"});
}
function imgFileName(im){ return im.file || ((im.name||"image").replace(/[^\w\- ]+/g,"").trim()+"."+((im.type||"image/png").split("/")[1]||"png").replace("jpeg","jpg").replace("svg+xml","svg")); }
async function saveBlob(blob,name){
  if(DL){ try{ await DL.save({filename:name, data:blob}); return; }catch(e){ if(e && e.code==="declined") return; } }
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1500);
}
async function downloadZip(ims, label){
  ims=ims.filter(im=>im && !isFile(im)); if(!ims.length){ toast("Pick some pictures first. Brand files open and download from SharePoint."); return; }
  const used=new Set(), files=[]; let n=0;
  for(const im of ims){
    n++; toast("Gathering "+n+" of "+ims.length+"…", 60000);
    try{ await imgEnsure(im); const r=await fetch(imgSrc(im)); if(!r.ok) throw 0; const buf=new Uint8Array(await r.arrayBuffer());
      let nm=imgFileName(im), base=nm.replace(/(\.[^.]+)$/,""), ext=(nm.match(/\.[^.]+$/)||[""])[0], i=2; while(used.has(nm.toLowerCase())) nm=base+" ("+(i++)+")"+ext; used.add(nm.toLowerCase());
      files.push({name:nm, data:buf}); }catch(e){}
  }
  if(!files.length){ toast("Couldn't fetch those pictures. Try again.", 4000); return; }
  await saveBlob(makeZip(files), (label||"MISMO Images").replace(/[^\w\- ]+/g,"").trim()+".zip");
  toast(files.length+" picture"+(files.length===1?"":"s")+" zipped"+(files.length<ims.length?" ("+(ims.length-files.length)+" couldn't be fetched)":"")+".", 4000);
}
async function downloadImage(im){
  try{
    await imgEnsure(im); if(!imgSrc(im)) throw new Error("not loaded");
    const r=await fetch(imgSrc(im)); if(!r.ok) throw new Error("HTTP "+r.status);
    await saveBlob(await r.blob(), imgFileName(im));
  }catch(e){ window.open(imgSrc(im),"_blank","noopener"); toast("Opened the image in a new tab. Right-click it and choose Save Image As.", 5000); }
}
/* the Higher Logic copy is public, so it's the link to share and to use in emails */
function imgLink(im){ return im.hlUrl || im.url || (im.assetId ? location.origin+"/_blob/"+im.assetId : ""); }
function copyImageLink(im){ if(im && isFile(im)){ if(!im.spPath){ toast("This file has no SharePoint location to link to."); return; } copyText(spFileUrl(im.spPath), "File link (opens for anyone at MISMO/MBA with access to the Marketing folder)"); return; } const u=imgLink(im); if(!u){ toast("This one isn't in Higher Logic yet, so there's no link to share. Upload it there and paste its link on the picture.", 5000); return; } copyText(u, im.hlUrl ? "Image link (public, works in emails)" : "Image link (works for the MISMO team while signed in, not in emails)"); }

function renderImages(){
  const el=$("#page-images"), t=T(), all=vals("images"), live=all.filter(i=>!i.archived);
  const eds=editionsSorted().filter(e=>!e.archived), ced=curEdition();
  const q=imNorm(IM.q);
  const list=imgsLive().filter(im=>!isLogo(im) && (!IM.type||(IM.type==="file")===isFile(im)) && (!IM.camp||im.campaign===IM.camp) && (!IM.ed||im.edition===IM.ed) && (!q || imNorm([im.name,im.file,im.alt,im.credit,im.notes,IMG_CAMP[im.campaign]].join(" ")).indexOf(q)>=0));
  const logos=live.filter(isLogo), logosOut=logos.filter(i=>!i.hlUrl).length, shelf=IM.view==="logos";
  const forEd = ced ? live.filter(i=>i.campaign==="matters" && i.edition===ced.id).length : 0;
  const month = live.filter(i=>String(i.at||"").slice(0,7)===t.slice(0,7)).length;
  el.innerHTML='<div class="phead"><div><div class="eyebrow">Pictures for Every Campaign</div><h1>Image Library</h1><div class="sub">Upload once, tag it to a campaign, and download it or copy its link wherever it\'s going: MISMO Matters, LinkedIn, Mailchimp or a summit.</div></div><div class="tools">'+
      (SP_IMG()?'<button class="btn" type="button" id="im-sp">Add from SharePoint</button>':'')+(ASSETS?'<button class="btn pri" type="button" id="im-add">+ Add Images</button><input type="file" id="im-file" accept="image/*" multiple hidden>':'')+'</div></div>'+
    '<div class="band"><div class="today">Image Library</div><div class="say">'+(live.length?'<em>'+live.filter(i=>!isFile(i)&&!isLogo(i)).length+'</em> picture'+(live.filter(i=>!isFile(i)&&!isLogo(i)).length===1?"":"s")+(live.some(isFile)?' and <em>'+live.filter(isFile).length+'</em> brand file'+(live.filter(isFile).length===1?"":"s"):'')+' in the library'+(ced?', <em>'+forEd+'</em> tagged to the '+esc(monthName(ced.month))+' MISMO Matters':'')+'. ':'No images yet. ')+
      (ASSETS ? 'Drop pictures anywhere on this page or press Add Images. Tick pictures to download them together as a ZIP.'+(!SP_IMG()&&live.some(i=>i.spPath)?' Pictures kept in SharePoint show their previews on resources.mismo.org.':'') : (SP_IMG()?'Pictures load straight from SharePoint. Adding new ones here opens when MISMO Media is switched on.':'Adding pictures here opens when MISMO Media is switched on. Use the Claude version until then.'))+'</div>'+
      '<div class="tiles"><div class="tile"><div class="v sky">'+live.filter(i=>!isFile(i)&&!isLogo(i)).length+'</div><div class="k">Pictures</div><div class="s">'+(live.some(isFile)?live.filter(isFile).length+' brand files too':'ready to use')+'</div></div>'+
        '<div class="tile"><div class="v">'+forEd+'</div><div class="k">This Edition</div><div class="s">'+(ced?esc(monthName(ced.month))+" MISMO Matters":"no edition open")+'</div></div>'+
        '<div class="tile"><div class="v">'+month+'</div><div class="k">Added This Month</div><div class="s">'+esc(MONL[+t.slice(5,7)-1])+'</div></div>'+
        '<button class="tile" type="button" data-imview="logos"><div class="v">'+logos.length+'</div><div class="k">Member Logos</div><div class="s">'+(logosOut?logosOut+' not in Higher Logic yet':'all in Higher Logic')+'</div></button></div></div>'+
    '<div class="subtabs" role="group" aria-label="Which pictures"><button type="button" data-imview="lib" aria-pressed="'+!shelf+'">Library<span class="cnt">'+live.filter(i=>!isLogo(i)).length+'</span></button><button type="button" data-imview="logos" aria-pressed="'+shelf+'">Member &amp; Sponsor Logos<span class="cnt">'+logos.length+'</span></button></div>'+
    (shelf ? '<div class="card"><div class="ch"><h2>Member &amp; Sponsor Logos</h2><span class="cnt">'+logos.length+'</span><span class="note">from Member 360 and the logo walls</span><div class="r im-filters"><input type="search" class="plain" id="im-q" placeholder="Search companies" value="'+esc(IM.q)+'" aria-label="Search logos"><label class="im-arch"><input type="checkbox" id="im-arch"'+(IM.arch?" checked":"")+'> Show Archived</label></div></div><div class="cb">'+logoShelf()+'</div></div>' :

    '<div class="card"><div class="ch"><h2>All Images</h2><span class="cnt">'+list.length+'</span><div class="r im-filters">'+
      '<select id="im-type" aria-label="Kind"><option value="">Pictures and Files</option><option value="pic"'+(IM.type==="pic"?" selected":"")+'>Pictures</option><option value="file"'+(IM.type==="file"?" selected":"")+'>Brand Files</option></select>'+
      '<select id="im-camp" aria-label="Campaign"><option value="">Every Campaign</option>'+IMG_CAMPS.map(([k,l])=>'<option value="'+k+'"'+(IM.camp===k?" selected":"")+'>'+esc(l)+'</option>').join("")+'</select>'+
      (IM.camp==="matters"||!IM.camp?'<select id="im-ed" aria-label="Edition"><option value="">Every Edition</option>'+eds.map(e=>'<option value="'+esc(e.id)+'"'+(IM.ed===e.id?" selected":"")+'>'+esc(monthName(e.month))+'</option>').join("")+'</select>':'')+
      '<input type="search" class="plain" id="im-q" placeholder="Search names and notes" value="'+esc(IM.q)+'" aria-label="Search images">'+
      '<label class="im-arch"><input type="checkbox" id="im-arch"'+(IM.arch?" checked":"")+'> Show Archived</label>'+
      (list.some(i=>!isFile(i))?'<button class="btn sm" type="button" id="im-zip">'+(IM.sel.size?'Download '+IM.sel.size+' Selected (ZIP)':'Download All '+list.filter(i=>!isFile(i)).length+' Pictures (ZIP)')+'</button>'+(IM.sel.size?'<button class="btn sm" type="button" id="im-clr">Clear Selection</button>':''):'')+'</div></div>'+
      (list.length?'<div class="imgrid">'+list.map(im=>'<div class="imcard'+(im.archived?" arch":"")+'" data-im="'+esc(im.id)+'" tabindex="0" role="button" aria-label="'+esc(im.name||im.file||"Image")+'">'+
          '<label class="imsel" title="Select for a ZIP download" onclick="event.stopPropagation()"><input type="checkbox" data-imsel="'+esc(im.id)+'"'+(IM.sel.has(im.id)?" checked":"")+' aria-label="Select '+esc(im.name||im.file||"image")+'"></label><div class="imthumb">'+(isFile(im)?fileTile(im):imgSrc(im)?'<img src="'+esc(imgSrc(im))+'" alt="'+esc(im.alt||"")+'" loading="lazy">':'<span class="imload">'+(im.spPath&&SP_IMG()?"Loading…":"In SharePoint")+'</span>')+'</div>'+
          '<div class="imbody"><b>'+esc(im.name||im.file||"Untitled")+'</b><div class="immeta"><span class="chip ch">'+esc(IMG_CAMP[im.campaign]||"Other")+'</span>'+(im.edition&&S.editions[im.edition]?'<span class="chip ch">'+esc(MONL[+S.editions[im.edition].month.slice(5)-1])+'</span>':'')+(im.archived?'<span class="chip wait">Archived</span>':'')+'</div>'+
          '<div class="imsub">'+[im.w?im.w+" × "+im.h:"", +im.size?imgKB(im.size):"", im.spPath?"SharePoint":"", fS(String(im.at||"").slice(0,10))].filter(Boolean).map(esc).join(" · ")+'</div>'+
          '<div class="imact">'+(isFile(im)?'<a class="btn sm" href="'+esc(spFileUrl(im.spPath))+'" target="_blank" rel="noopener" data-stop>Open ↗</a><a class="btn sm" href="'+esc(spFileUrl(im.spPath,true))+'" target="_blank" rel="noopener" data-stop>Download</a><button class="btn sm" type="button" data-imcp="'+esc(im.id)+'">Copy Link</button>':'<button class="btn sm" type="button" data-imdl="'+esc(im.id)+'">Download</button><button class="btn sm" type="button" data-imcp="'+esc(im.id)+'">Copy Link</button>')+'</div></div></div>').join("")+'</div>'
        :'<div class="empty">'+(all.length?"No images match. Clear the search or pick another campaign.":(ASSETS?"Drop pictures here or press Add Images. JPG, PNG, GIF, SVG and WebP all work.":"No images yet."))+'</div>')+
    '</div>');
  $$("[data-imview]",el).forEach(b=>b.onclick=()=>{ IM.view=b.dataset.imview; IM.q=""; renderImages(); });
  if(shelf){ hlPaint(); $$(".lgs-card",el).forEach(c=>{ c.onclick=()=>openImage(c.dataset.im); c.onkeydown=e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); openImage(c.dataset.im); } }; });
    const qi=$("#im-q",el); qi.oninput=()=>{ IM.q=qi.value; clearTimeout(qi._t); qi._t=setTimeout(()=>{ renderImages(); const n=$("#im-q"); if(n){ n.focus(); n.setSelectionRange(n.value.length,n.value.length); } },250); };
    $("#im-arch",el).onchange=e=>{ IM.arch=e.target.checked; renderImages(); };
    const sb=$("#im-sp",el); if(sb) sb.onclick=openAddFromSharePoint; const ad=$("#im-add",el), fi=$("#im-file",el); if(ad) ad.onclick=()=>fi.click(); if(fi) fi.onchange=async()=>{ await addImages(fi.files,{campaign:"logos"}); fi.value=""; };
    return; }
  const spb=$("#im-sp",el); if(spb) spb.onclick=openAddFromSharePoint;
  list.filter(im=>!isFile(im)).slice(0,60).forEach(im=>{ if(!imgSrc(im)) imgEnsure(im); });
  const add=$("#im-add",el), file=$("#im-file",el);
  if(add) add.onclick=()=>file.click();
  if(file) file.onchange=async()=>{ await addImages(file.files); file.value=""; };
  $("#im-type",el).onchange=e=>{ IM.type=e.target.value; renderImages(); };
  $$("a[data-stop]",el).forEach(a=>a.addEventListener("click",e=>e.stopPropagation()));
  $("#im-camp",el).onchange=e=>{ IM.camp=e.target.value; if(IM.camp && IM.camp!=="matters") IM.ed=""; renderImages(); };
  const se=$("#im-ed",el); if(se) se.onchange=e=>{ IM.ed=e.target.value; renderImages(); };
  const qi=$("#im-q",el); qi.oninput=()=>{ IM.q=qi.value; clearTimeout(qi._t); qi._t=setTimeout(()=>{ renderImages(); const n=$("#im-q"); if(n){ n.focus(); n.setSelectionRange(n.value.length,n.value.length); } },250); };
  $("#im-arch",el).onchange=e=>{ IM.arch=e.target.checked; renderImages(); };
  $$("[data-imsel]",el).forEach(c=>c.onchange=()=>{ if(c.checked) IM.sel.add(c.dataset.imsel); else IM.sel.delete(c.dataset.imsel); renderImages(); });
  const z=$("#im-zip",el); if(z) z.onclick=()=>{ const pick=IM.sel.size ? [...IM.sel].map(i=>S.images[i]) : list; const ced=IM.ed&&S.editions[IM.ed]; downloadZip(pick, "MISMO Images"+(IM.camp?" - "+IMG_CAMP[IM.camp]:"")+(ced?" - "+monthName(ced.month):"")); };
  const zc=$("#im-clr",el); if(zc) zc.onclick=()=>{ IM.sel.clear(); renderImages(); };
  $$("[data-imdl]",el).forEach(b=>b.onclick=e=>{ e.stopPropagation(); downloadImage(S.images[b.dataset.imdl]); });
  $$("[data-imcp]",el).forEach(b=>b.onclick=e=>{ e.stopPropagation(); copyImageLink(S.images[b.dataset.imcp]); });
  $$(".imcard",el).forEach(c=>{ c.onclick=()=>openImage(c.dataset.im); c.onkeydown=e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); openImage(c.dataset.im); } }; });
}
async function openImage(id){
  let im=S.images[id]; if(!im) return;
  if(isFile(im)){ const eds=editionsSorted();
    openPane({eye:"Image Library · Brand File", title:im.name||im.file||"File", data:im, noFocus:true, fields:[
      {k:"_pv",type:"html",wide:true,html:()=>'<div class="impv imfile-pv">'+fileTile(im)+'</div><div class="imsub" style="margin-top:6px">'+esc(im.file||"")+' · '+imgKB(im.size)+' · in SharePoint: '+esc(String(im.spPath||"").replace(/^\/MISMO\/Active Documents\//,"").replace(/\/[^/]+$/,""))+'</div>'},
      {sec:"About This File"},{k:"name",label:"Name",wide:true},{k:"campaign",label:"Campaign",type:"select",opts:IMG_CAMPS},
      {k:"notes",label:"Notes",type:"rich",rows:3,ph:"What it's for, which version to use"},{k:"archived",label:"Archived (hidden from the library, kept on file)",type:"cb",wide:true}],
      save:async v=>{ await patch("images",id,{name:v.name, campaign:v.campaign, notes:v.notes, archived:!!v.archived}); },
      buttons:[{label:"Open in SharePoint", run:async()=>{ window.open(spFileUrl(im.spPath),"_blank","noopener"); }},{label:"Download", run:async()=>{ window.open(spFileUrl(im.spPath,true),"_blank","noopener"); }},{label:"Copy Link", run:async()=>copyImageLink(S.images[id])}]});
    return; }
  if(!imgSrc(im) && im.spPath && SP_IMG()){ toast("Loading the picture…", 20000); await imgEnsure(im); toast("Ready", 800); im=S.images[id]; }
  const eds=editionsSorted();
  const fields=[
    {k:"_pv",type:"html",wide:true,html:()=>'<div class="impv"><img src="'+esc(imgSrc(im))+'" alt="'+esc(im.alt||"")+'"></div><div class="imsub" style="margin-top:6px">'+esc(im.file||"")+' · '+(im.w?im.w+" × "+im.h+" px · ":"")+imgKB(im.size)+(imgLink(im)?' · <a href="'+esc(imgLink(im))+'" target="_blank" rel="noopener">Open full size ↗</a>':'')+'</div>'},
    {sec:"About This Image"},
    {k:"name",label:"Name",wide:true,ph:"e.g. Fall Summit Stage, Brian Vieaux Headshot"},
    {k:"campaign",label:"Campaign",type:"select",opts:IMG_CAMPS},
    {k:"edition",label:"MISMO Matters Edition",type:"select",blank:true,opts:eds.map(e=>[e.id,monthName(e.month)])},
    {k:"alt",label:"Alt Text",wide:true,ph:"What the picture shows, for screen readers and email clients that block images"},
    {k:"hlUrl",label:"Link in Higher Logic's Image Library",type:"url",wide:true,ph:"Paste once it's uploaded to Higher Logic; MISMO Matters sections then use it automatically"},
    ...(im.campaign==="logos"||im.company||im.site?[{k:"company",label:"Company (for member and sponsor logos)",ph:"e.g. Ameriprise Financial"},{k:"site",label:"Company Website",type:"url",ph:"https://"},{k:"group",label:"Member Level or Sponsor Tier",ph:"e.g. Corporate Members"}]:[]),
    {k:"credit",label:"Credit or Source",ph:"Photographer, partner or where it came from"},
    {k:"notes",label:"Notes",type:"rich",rows:3,ph:"Where it has been used, rights or size limits"},
    {k:"archived",label:"Archived (hidden from the library, kept on file)",type:"cb",wide:true}
  ];
  openPane({eye:"Image Library", title:im.name||im.file||"Image", fields, data:im, noFocus:true,
    save:async v=>{ await patch("images",id,Object.assign({name:v.name, campaign:v.campaign, edition:v.campaign==="matters"?v.edition:"", alt:v.alt, hlUrl:v.hlUrl||"", credit:v.credit, notes:v.notes, archived:!!v.archived}, v.company!==undefined?{company:v.company||"", site:v.site||"", group:v.group||""}:{})); },
    buttons:[{label:"Download Original", run:async()=>downloadImage(S.images[id])},{label:"Copy Link", run:async()=>copyImageLink(S.images[id])}]
  });
}
/* the picker used by MISMO Matters sections: pictures already in the library */
function libraryStrip(ed){
  const list=vals("images").filter(i=>!i.archived && !isFile(i) && !isLogo(i)).sort((a,b)=>{ const sa=(a.edition===(ed&&ed.id))?0:1, sb=(b.edition===(ed&&ed.id))?0:1; return sa-sb || ((a.at||"")<(b.at||"")?1:-1); }).slice(0,24);
  if(!list.length) return '<div class="hint">No pictures in the Image Library yet.</div>';
  /* SharePoint pictures arrive after the tiles are drawn, so each tile fills itself in */
  list.forEach(im=>{ if(!imgSrc(im)) imgEnsure(im).then(()=>{ const src=imgSrc(im); document.querySelectorAll('.impick[data-pick="'+im.id+'"]').forEach(b=>{ if(src){ b.innerHTML='<img src="'+esc(src)+'" alt="">'; b.classList.remove("loading"); } else { b.classList.remove("loading"); b.classList.add("missing"); } }); }); });
  return '<div class="imstrip">'+list.map(im=>{ const src=imgSrc(im); return '<button type="button" class="impick'+(src?"":" loading")+'" data-pick="'+esc(im.id)+'" title="'+esc(im.name||im.file||"")+'">'+(src?'<img src="'+esc(src)+'" alt="">':'<span>'+esc((im.name||im.file||"").slice(0,28))+'</span>')+'</button>'; }).join("")+'</div>';
}
/* drop pictures anywhere on the Image Library page */
(function(){
  let depth=0;
  const on=()=>TAB==="images" && ASSETS;
  document.addEventListener("dragenter",e=>{ if(!on()||!e.dataTransfer||![...e.dataTransfer.types].includes("Files")) return; depth++; document.body.classList.add("im-drop"); });
  document.addEventListener("dragleave",()=>{ if(!on()) return; depth=Math.max(0,depth-1); if(!depth) document.body.classList.remove("im-drop"); });
  document.addEventListener("dragover",e=>{ if(on()) e.preventDefault(); });
  document.addEventListener("drop",e=>{ if(!on()) return; e.preventDefault(); depth=0; document.body.classList.remove("im-drop"); addImages(e.dataTransfer.files); });
})();
