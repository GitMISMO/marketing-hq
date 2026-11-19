/* ================= MISMO Matters to LinkedIn (Amy, Nov 19, 2026) =================
   Each section of an edition becomes its own LinkedIn post for MISMO's company page, with its own graphic.
   Claude writes the post from that section's own words and links (it never adds facts), and a 1080 x 1080
   branded card is drawn from the section's header banner, its headline and its picture (or a one-line teaser).
   The posts land on the LinkedIn page with no date, Ready for Review, until Amy approves each one in MISMO Media.
   Nothing posts by itself: the team sets a date and posts once Amy has approved. */
const ML = {busy:{}, ed:""};
const ML_SIZE = 1080;
/* which edition: the one picked, else the newest one already sent, else the one being built */
/* starts with November 2026, the first edition this was built for (Jonna, Nov 19, 2026) */
function mlEditions(){ return vals("editions").filter(e=>e && e.month && e.month>="2026-11" && e.dates && e.dates.publish && e.dates.publish<=T()).sort((a,b)=>a.month<b.month?1:-1); }
function mlEdition(){ return (ML.ed && S.editions[ML.ed]) || mlEditions()[0] || curEdition(); }
function mlId(ed, k){ return "li-mm-"+ed.month+"-"+k; }
function mlPosts(ed){ return vals("pieces").filter(p=>p.channel==="linkedin" && p.fromEdition===ed.id && !p.archived); }
function mlPostFor(ed, k){ const p=(S.pieces||{})[mlId(ed,k)]; return p && !p.archived ? p : null; }
function mlIsAmy(){ const s=window.ResourcesSession && window.ResourcesSession.current && window.ResourcesSession.current();
  return String((s&&s.email)||"").toLowerCase()==="amoses@mismo.org"; }
/* the sections that have something to say, in newsletter order, with each one's plain text from the text version */
function mlSections(ed){
  const txt=buildText(ed), blocks={};
  txt.split(/\n(?===)/).forEach(b=>{ const m=b.match(/^== (.+?) ==\n([\s\S]*)$/); if(m) blocks[m[1]]=m[2].trim(); });
  return edSections(ed).filter(s=>s.on).map(s=>{ const name=s.doc.name||s.meta.name; return {s, k:s.k, name, text:blocks[name.toUpperCase()]||""}; }).filter(x=>x.text);
}
function mlLink(ed, s){
  const d=s.doc||{};
  return (d.ctaUrl && /^https?:\/\//.test(d.ctaUrl) ? d.ctaUrl : "") || (typeof fullArticleUrl==="function" && fullArticleUrl(ed, s.k, d)) || (mmWebUrl(ed)+"#mm-"+s.k);
}
function mlHeadline(ed, x){
  const d=x.s.doc||{};
  if(d.headline) return mdPlain(d.headline).trim();
  const first=x.text.split("\n").map(l=>l.trim()).filter(Boolean)[0]||"";
  return first.length<=110 ? first : x.name;
}

/* ---------- the graphic ---------- */
function mlLoadImg(src){
  return new Promise(res=>{ if(!src){ res(null); return; } const i=new Image(); if(!/^(blob:|data:)/.test(src)) i.crossOrigin="anonymous";
    i.onload=()=>{ try{ const c=document.createElement("canvas"); c.width=c.height=2; const x=c.getContext("2d"); x.drawImage(i,0,0,2,2); x.getImageData(0,0,1,1); res(i); }catch(e){ res(null); } };
    i.onerror=()=>res(null); i.src=src; });
}
function mlLogoSrc(){
  const sym=document.getElementById("mismo-logo"); if(!sym) return "";
  const inner=sym.innerHTML.replace(/var\(--[a-z-]+,\s*(#[0-9a-fA-F]{3,6})\)/g,"$1");
  return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 708 108" width="708" height="108">'+inner+'</svg>');
}
async function mlPicture(ed, s){
  const d=s.doc||{}, im=(d.imageLib && S.images && S.images[d.imageLib]) || (d.imageId && S.images && S.images[d.imageId]) || null;
  if(im){ try{ await imgEnsure(im); }catch(e){} const i=await mlLoadImg(imgSrc(im)); if(i) return i; }
  if(d.imageUrl) return mlLoadImg(d.imageUrl);
  return null;
}
function mlWrap(ctx, text, maxW){
  const words=String(text||"").split(/\s+/).filter(Boolean), lines=[]; let line="";
  words.forEach(w=>{ const t=line?line+" "+w:w; if(ctx.measureText(t).width>maxW && line){ lines.push(line); line=w; } else line=t; });
  if(line) lines.push(line); return lines;
}
function mlRound(ctx, x, y, w, h, r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
async function mlCard(ed, x, teaser){
  const N=ML_SIZE, M=72, W=N-2*M, F='"IBM Plex Sans",-apple-system,"Segoe UI",Arial,sans-serif';
  try{ await Promise.all([document.fonts.load('700 60px "IBM Plex Sans"'), document.fonts.load('400 32px "IBM Plex Sans"'), document.fonts.load('600 22px "IBM Plex Sans"')]); }catch(e){}
  const c=document.createElement("canvas"); c.width=c.height=N; const g=c.getContext("2d");
  const bg=g.createLinearGradient(0,0,0,N); bg.addColorStop(0,"#0b2740"); bg.addColorStop(1,"#06202f"); g.fillStyle=bg; g.fillRect(0,0,N,N);
  g.strokeStyle="rgba(116,191,235,.07)"; g.lineWidth=1; for(let i=0;i<=N;i+=54){ g.beginPath(); g.moveTo(i,0); g.lineTo(i,N); g.stroke(); g.beginPath(); g.moveTo(0,i); g.lineTo(N,i); g.stroke(); }
  /* the section's header banner from the newsletter */
  const hdrSrc=(typeof HDR2_KEYS!=="undefined" && HDR2_KEYS.includes(x.k)) ? HDR2_BASE+(x.k==="micdup"?"micdup.gif":x.k+".jpg") : ((x.s.doc&&x.s.doc.hdrUrl)||x.s.meta.hdr||"");
  const hdr=await mlLoadImg(hdrSrc); let top;
  if(hdr){ const h=Math.round(N*hdr.naturalHeight/hdr.naturalWidth); g.drawImage(hdr,0,0,N,h); top=h; }
  else { g.fillStyle="#0d314c"; g.fillRect(0,0,N,200); g.fillStyle="#74bfeb"; g.font='700 64px '+F; g.fillText(x.name,M,128); g.fillRect(0,194,N,6); top=200; }
  /* a section without its own headline (sponsor, welcome) leads with Claude's teaser line instead of its first sentence */
  const own=x.s.doc&&x.s.doc.headline ? mdPlain(x.s.doc.headline).trim() : "";
  const pic=await mlPicture(ed, x.s), head=own || teaser || mlHeadline(ed, x);
  if(!own && teaser) teaser="";
  const footY=N-118, areaTop=top+44, areaBot=footY-40, avail=areaBot-areaTop;
  const fit=(text, weight, from, to, maxH, lhK, width)=>{ const ww=width||W; let sz=from, ls=[]; for(; sz>=to; sz-=2){ g.font=weight+' '+sz+'px '+F; ls=mlWrap(g, text, ww); if(ls.length*sz*lhK<=maxH) break; }
    sz=Math.max(sz,to); g.font=weight+' '+sz+'px '+F; ls=mlWrap(g, text, ww); const max=Math.max(1,Math.floor(maxH/(sz*lhK)));
    if(ls.length>max){ ls=ls.slice(0,max); ls[max-1]=ls[max-1].replace(/\s*\S*$/,"")+"…"; } return {sz, ls, lh:Math.round(sz*lhK)}; };
  const drawText=(H, T, x0, y0)=>{ let y=y0; g.fillStyle="#ffffff"; g.textBaseline="alphabetic"; g.font='700 '+H.sz+'px '+F;
    H.ls.forEach(l=>{ g.fillText(l, x0, y+H.sz); y+=H.lh; }); y+=26; g.fillStyle="#74bfeb"; g.fillRect(x0,y,110,6); y+=6+38;
    if(T){ g.fillStyle="#a9d8f3"; g.font='400 '+T.sz+'px '+F; T.ls.forEach(l=>{ g.fillText(l, x0, y+T.sz); y+=T.lh; }); } return y; };
  const panel=(px, py, pw, ph, dw, dh)=>{ g.fillStyle="#ffffff"; mlRound(g,px,py,pw,ph,16); g.fill();
    g.save(); mlRound(g,px,py,pw,ph,16); g.clip(); g.drawImage(pic, px+(pw-dw)/2, py+(ph-dh)/2, dw, dh); g.restore(); };
  const tall = pic && pic.naturalWidth/pic.naturalHeight < 1.3;
  if(tall){
    /* a photo or square logo sits beside the words, so the card has no empty corner */
    const pad=16, maxW=400, sc=Math.min((maxW-2*pad)/pic.naturalWidth, (avail*0.92-2*pad)/pic.naturalHeight), dw=pic.naturalWidth*sc, dh=pic.naturalHeight*sc;
    const pw=dw+2*pad, ph=dh+2*pad, tw=W-pw-48;
    const H=fit(head, "700", 64, 36, avail*0.62, 1.14, tw);
    const T=teaser ? fit(teaser, "400", 36, 24, avail-H.ls.length*H.lh-70, 1.38, tw) : null;
    const th=H.ls.length*H.lh+70+(T?T.ls.length*T.lh:0), bh=Math.max(th, ph), y0=areaTop+Math.max(0,Math.round((avail-bh)/2));
    drawText(H, T, M, y0+Math.round((bh-th)/2));
    panel(M+W-pw, y0+Math.round((bh-ph)/2), pw, ph, dw, dh);
  } else {
    /* the headline as large as fits; then a wide picture or logo on a white panel that hugs it, or the teaser line */
    const H=fit(head, "700", pic?66:78, 40, avail*(pic?0.38:0.56), 1.14);
    const T=(!pic && teaser) ? fit(teaser, "400", 42, 28, avail-H.ls.length*H.lh-70, 1.38) : null;
    let P=null; if(pic){ const pad=34, maxH=avail-H.ls.length*H.lh-70, sc=Math.min((W-2*pad)/pic.naturalWidth, (maxH-2*pad)/pic.naturalHeight, 3);
      const dw=pic.naturalWidth*sc, dh=pic.naturalHeight*sc; P={dw, dh, pw:Math.max(Math.min(W, dw+2*pad), 360), ph:Math.max(dh+2*pad, 200)}; }
    const block=H.ls.length*H.lh + 70 + (P ? P.ph : (T ? T.ls.length*T.lh : 0));
    const y=drawText(H, P?null:T, M, areaTop + Math.max(0, Math.round((avail-block)/2)));
    if(P) panel(M+Math.round((W-P.pw)/2), y, P.pw, P.ph, P.dw, P.dh);
  }
  /* the foot: edition on the left, the logo on a white plate on the right (the lockup needs a light ground) */
  g.fillStyle="rgba(116,191,235,.35)"; g.fillRect(M,footY,W,2);
  g.fillStyle="#a9d8f3"; g.font='600 22px '+F; try{ g.letterSpacing="3px"; }catch(e){}
  g.fillText(("MISMO Matters · "+monthName(ed.month)).toUpperCase(), M, footY+66); try{ g.letterSpacing="0px"; }catch(e){}
  const logo=await mlLoadImg(mlLogoSrc()), pw=262, ph=64, px=N-M-pw, py=footY+26;
  g.fillStyle="#ffffff"; mlRound(g,px,py,pw,ph,6); g.fill();
  if(logo){ const lh2=34, lw=lh2*708/108; g.drawImage(logo, px+(pw-lw)/2, py+(ph-lh2)/2, lw, lh2); }
  else { g.fillStyle="#0d314c"; g.font='700 30px '+F; g.fillText("MISMO", px+70, py+43); }
  return new Promise(res=>c.toBlob(b=>res(b),"image/png"));
}

/* ---------- the post ---------- */
async function mlWrite(ed, x, link){
  const task="Write one LinkedIn post for MISMO's company page (MISMO is the Mortgage Industry Standards Maintenance Organization, the real estate finance industry's standards body) "+
    "that shares one item from the "+monthName(ed.month)+" edition of MISMO Matters, MISMO's monthly newsletter. The section is \""+x.name+"\". "+
    "Use only the facts, names, numbers, dates and links in the material below; never add or guess any. Write in MISMO's institutional voice: one short hook line, "+
    "two to four short sentences on what it is and why it matters to the mortgage industry, then one line sending readers to "+link+" . "+
    "Name people and companies in plain text (no @ tags). 70 to 160 words. End with 3 to 5 relevant hashtags, including #MISMOMatters. American spelling. "+
    "Plain text only: no markdown, no emojis. Also give a teaser for the graphic: the single most important line, 20 words at most, taken from the material. "+
    "Return ONLY JSON: {\"post\":\"\",\"teaser\":\"\"}";
  const raw=await writer(task, "SECTION: "+x.name+"\nHEADLINE: "+mlHeadline(ed,x)+"\nLINK: "+link+"\n\n"+x.text);
  const j=parseJson(raw)||{}; const post=String(j.post||"").trim();
  if(!post) throw new Error("Claude didn't send back a post");
  return {post, teaser:String(j.teaser||"").trim()};
}
/* one section: the post and its graphic, saved as a LinkedIn post waiting for Amy */
async function mlMakeOne(ed, x){
  const id=mlId(ed,x.k); if(ML.busy[id]) return; ML.busy[id]=true;
  try{
    const link=mlLink(ed, x.s), w=await mlWrite(ed, x, link);
    const blob=await mlCard(ed, x, w.teaser);
    let imageId="";
    if(blob){ const fname="MISMO-Matters-"+ed.month+"-"+x.k+"-linkedin.png";
      const made=await addImages([new File([blob], fname, {type:"image/png"})], {name:"LinkedIn: "+x.name+" ("+monthName(ed.month)+" MISMO Matters)", campaign:"linkedin", edition:ed.id, alt:mlHeadline(ed,x)}, true);
      imageId=(made[0]&&made[0].id)||""; }
    const cur=(S.pieces||{})[id]||{};
    await put("pieces", id, Object.assign({}, cur, {channel:"linkedin", kind:"MISMO Matters", title:x.name+": "+mlHeadline(ed,x), copy:w.post, link,
      date:cur.date||"", owner:cur.owner||"Vanessa", status:"review", fromEdition:ed.id, fromSec:x.k, imageId, teaser:w.teaser, touch:{matters:true},
      approvedBy:"", approvedAt:"", madeAt:new Date().toISOString(), archived:false}));
    return true;
  } finally { delete ML.busy[id]; }
}
/* a new graphic for a post that's already written (the section's picture changed, or the design did); the words stay */
async function mlRedraw(ed, k){
  const p=mlPostFor(ed,k), x=mlSections(ed).find(y=>y.k===k); if(!p||!x) return false;
  const blob=await mlCard(ed, x, p.teaser||""); if(!blob) return false;
  const made=await addImages([new File([blob], "MISMO-Matters-"+ed.month+"-"+k+"-linkedin.png", {type:"image/png"})], {name:"LinkedIn: "+x.name+" ("+monthName(ed.month)+" MISMO Matters)", campaign:"linkedin", edition:ed.id, alt:mlHeadline(ed,x)}, true);
  if(!made[0]) return false;
  const old=p.imageId; await put("pieces", p.id, Object.assign({}, S.pieces[p.id], {imageId:made[0].id}));
  if(old && S.images[old]) await put("images", old, Object.assign({}, S.images[old], {archived:true}));
  return true;
}
async function mlMakeAll(ed, onlyMissing){
  const list=mlSections(ed).filter(x=>!onlyMissing || !mlPostFor(ed,x.k));
  if(!list.length){ toast("Every section already has its post.", 3500); return; }
  let n=0, bad=0;
  for(const x of list){ n++; toast("Writing "+n+" of "+list.length+": "+x.name+"…", 120000); if(TAB==="linkedin") renderLinkedin();
    try{ await mlMakeOne(ed, x); }catch(e){ bad++; toast(x.name+" didn't work: "+(e.message||"try again"), 5000); } }
  toast(bad ? (list.length-bad)+" posts made; "+bad+" didn't work. Press Make the Missing Posts to try them again." : list.length+" posts made, waiting for Amy's approval.", 6000);
  if(TAB==="linkedin") renderLinkedin();
}
async function mlApprove(id){
  if(!mlIsAmy()){ toast("Only Amy can approve these.", 3500); return; }
  const p=S.pieces[id]; if(!p) return;
  await put("pieces", id, Object.assign({}, p, {status:"ready", approvedBy:"Amy Moses", approvedAt:new Date().toISOString()}));
  toast("Approved. Set a post date when it's going up.", 3500); renderLinkedin();
}

/* Amy can also decide a section shouldn't go on LinkedIn at all (Nov 19, 2026); it can be brought back */
async function mlSkip(id){
  if(!mlIsAmy()){ toast("Only Amy can decide that.", 3500); return; }
  const p=S.pieces[id]; if(!p) return;
  await put("pieces", id, Object.assign({}, p, {status:"canceled", cancelReason:"Not posting (Amy)", skippedBy:"Amy Moses", skippedAt:new Date().toISOString(), autoPost:false}));
  toast("Marked Not Posting.", 3000); renderLinkedin();
}
async function mlUnskip(id){
  if(!mlIsAmy()){ toast("Only Amy can decide that.", 3500); return; }
  const p=S.pieces[id]; if(!p) return;
  await put("pieces", id, Object.assign({}, p, {status:"review", cancelReason:"", skippedBy:"", skippedAt:""}));
  toast("Back to Ready for Review.", 3000); renderLinkedin();
}
/* ---------- the card on the LinkedIn page ---------- */
function mlCardHtml(){
  const ed=mlEdition(); if(!ed) return "";
  const secs=mlSections(ed), posts=secs.map(x=>({x, p:mlPostFor(ed,x.k)})), made=posts.filter(o=>o.p).length;
  const waiting=posts.filter(o=>o.p && o.p.status==="review").length, approved=posts.filter(o=>o.p && ["ready","staged","done"].includes(o.p.status)).length, skipped=posts.filter(o=>o.p && o.p.status==="canceled").length;
  const busy=Object.keys(ML.busy).length;
  /* one row per section, like the other lists: click it to see and work on the post in the panel on the right */
  const row=o=>{ const p=o.p, id=mlId(ed,o.x.k), im=p&&p.imageId&&S.images&&S.images[p.imageId];
    if(im) imgEnsure(im).then(()=>{ const t=document.querySelector('[data-mlimg="'+id+'"]'); if(t && imgSrc(im)) t.src=imgSrc(im); }).catch(()=>{});
    const st=!p ? (ML.busy[id]?'<span class="chip in">Writing…</span>':'<span class="chip wait">Not Made</span>') : p.status==="canceled" ? '<span class="chip changes">Not Posting</span>' : chip(PSTAT,p.status||"review");
    return '<tr class="click'+(p&&p.status==="canceled"?" cxrow":"")+'" data-mlrow="'+esc(o.x.k)+'">'+
      '<td class="ml-tcell">'+(im?'<img class="ml-tn" alt="" data-mlimg="'+esc(id)+'" src="'+esc(imgSrc(im)||"")+'">':'<span class="ml-tn ml-tn0">'+esc(o.x.s.meta.ab||"")+'</span>')+'</td>'+
      '<td><b>'+esc(o.x.name)+'</b><span class="t2 ml-one">'+esc(p ? String(p.copy||"").split("\n")[0] : mlHeadline(ed,o.x))+'</span></td>'+
      '<td>'+st+'</td><td>'+esc(p&&p.date?fS(p.date):"")+'</td></tr>'; };
  /* the card folds up to its header; each person's choice is remembered in their own browser */
  const open=mlOpenState();
  return '<div class="card'+(open?'':' closed')+'" id="ml-card" style="margin-top:22px"><div class="ch"><button class="ml-tog" type="button" id="ml-tog" aria-expanded="'+(open?'true':'false')+'" aria-controls="ml-body"><svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg><h2>'+esc(monthName(ed.month))+' MISMO Matters as LinkedIn Posts</h2></button><span class="cnt">'+made+' of '+secs.length+'</span>'+
    '<div class="r ml-tools">'+(mlEditions().length>1?'<select class="plain" id="ml-ed" aria-label="Edition">'+mlEditions().map(e=>'<option value="'+esc(e.id)+'"'+(e.id===ed.id?" selected":"")+'>'+esc(monthName(e.month))+'</option>').join("")+'</select>':'')+
      /* the button only shows while a section has no post yet: the first time, or one that didn't work */
      (made<secs.length?'<button class="btn pri" type="button" id="ml-make"'+(busy?' disabled':'')+'>'+(made?"Make the "+(secs.length-made)+" Missing Post"+(secs.length-made===1?"":"s"):"Make a Post for Every Section")+'</button>':'')+'</div></div>'+
    '<div id="ml-body"><div class="ml-sub">'+(made?'<b>'+waiting+'</b> waiting on Amy, <b>'+approved+'</b> approved'+(skipped?', <b>'+skipped+'</b> not posting':'')+'. Click a post to read it, see its graphic and approve it. Nothing posts by itself.'
      :'Each section becomes its own post with a 1080 x 1080 graphic, written from the section\'s own words and links. Nothing posts by itself.')+'</div>'+
    '<div class="tw"><table class="t"><thead><tr><th style="width:56px"></th><th>Post</th><th>Status</th><th>Date</th></tr></thead><tbody>'+posts.map(row).join("")+'</tbody></table></div></div></div>';
}
function mlOpenState(){ try{ return localStorage.getItem("mmhq.mlOpen")!=="0"; }catch(e){ return true; } }
/* the post in the panel on the right: the graphic, the words, and what Amy and the team can do */
function mlOpen(ed, k){
  const x=mlSections(ed).find(y=>y.k===k); if(!x) return;
  const id=mlId(ed,k), p=mlPostFor(ed,k);
  if(!p){ openPane({eye:"LinkedIn Post", title:x.name, fields:[{k:"_n",type:"html",html:()=>'<div class="ro">No post yet for this section. Claude writes it from the section\'s own words and links, with its graphic.</div>'}],
    data:{}, buttons:[{label:"Make This Post", run:async()=>{ closePane(true); toast("Writing the "+x.name+" post…", 120000); try{ await mlMakeOne(ed,x); toast("Done. It's waiting for Amy.", 3500); }catch(e){ toast("It didn't work: "+(e.message||"try again"), 5000); } renderLinkedin(); mlOpen(ed,k); }}]}); return; }
  const im=p.imageId&&S.images&&S.images[p.imageId], amy=mlIsAmy();
  const st=p.status==="canceled" ? '<span class="chip changes">Not Posting</span>' : chip(PSTAT,p.status||"review");
  const acts='<div class="ml-acts">'+
    (p.status==="review"?'<button class="btn sm pri" type="button" data-mla="ok"'+(amy?'':' disabled title="Only Amy can approve"')+'>Approve</button>':'')+
    (["review","ready"].includes(p.status)?'<button class="btn sm" type="button" data-mla="skip"'+(amy?'':' disabled title="Only Amy can decide this"')+'>Don\'t Post</button>':'')+
    (p.status==="canceled"?'<button class="btn sm" type="button" data-mla="back"'+(amy?'':' disabled title="Only Amy can decide this"')+'>Bring It Back</button>':'')+
    '<button class="btn sm" type="button" data-mla="copy">Copy Post</button>'+
    (im?'<button class="btn sm" type="button" data-mla="dl">Download Graphic</button>':'')+
    '<button class="btn sm" type="button" data-mla="draw">Redraw Graphic</button>'+
    '<button class="btn sm" type="button" data-mla="redo">Write It Again</button></div>'+
    (amy||!["review","ready","canceled"].includes(p.status)?'':'<div class="t2 ml-who">Approve and Don\'t Post are Amy\'s calls, so they\'re greyed out for everyone else.</div>');
  openPane({eye:"LinkedIn Post · "+monthName(ed.month)+" MISMO Matters", title:x.name, data:Object.assign({}, p), noFocus:true,
    fields:[{k:"_g",type:"html",html:()=>'<div class="ml-pv">'+(im?'<img alt="" id="ml-pvimg" src="'+esc(imgSrc(im)||"")+'">':'<div class="ro">No graphic yet. Press Redraw Graphic.</div>')+'</div>'+
        '<div class="ml-pst">'+st+(p.approvedBy?'<span class="t2">Approved by '+esc(p.approvedBy)+'</span>':'')+'</div>'+acts},
      {k:"copy",label:"Post",type:"textarea",rows:12,wide:true},
      {k:"link",label:"Link in the Post",type:"url",wide:true},
      {k:"date",label:"Post Date",type:"date"},{k:"owner",label:"Owner",type:"select",opts:PEOPLE,blank:true}],
    save:async v=>{ await put("pieces", id, Object.assign({}, S.pieces[id], v)); renderLinkedin(); },
    after:b=>{
      if(im) imgEnsure(im).then(()=>{ const t=$("#ml-pvimg",b); if(t && imgSrc(im)) t.src=imgSrc(im); }).catch(()=>{});
      const go2=async fn=>{ await fn(); closePane(true); renderLinkedin(); mlOpen(ed,k); };
      $$("[data-mla]",b).forEach(btn=>btn.onclick=async()=>{ const a=btn.dataset.mla;
        if(a==="ok") return go2(()=>mlApprove(id));
        if(a==="skip") return go2(()=>mlSkip(id));
        if(a==="back") return go2(()=>mlUnskip(id));
        if(a==="copy") return copyText($("#f-copy",b).value||p.copy||"","The post");
        if(a==="dl"){ try{ await imgEnsure(im); const blob=await fetch(imgSrc(im)).then(r=>r.blob()); await saveBlob(blob, imgFileName(im)); }catch(e){ toast("Couldn't download it: "+(e.message||"try again"), 4000); } return; }
        if(a==="draw"){ toast("Drawing a new graphic…", 30000); try{ toast(await mlRedraw(ed,k) ? "New graphic saved." : "It didn't work. Try again.", 3500); }catch(e){ toast("It didn't work: "+(e.message||"try again"), 5000); } closePane(true); renderLinkedin(); mlOpen(ed,k); return; }
        if(a==="redo"){ if(["ready","staged","done"].includes(p.status) && !window.confirm("Amy already approved this post. Write it again and send it back to her?")) return;
          closePane(true); toast("Writing the "+x.name+" post…", 120000); try{ await mlMakeOne(ed,x); toast("Done. It's waiting for Amy.", 3500); }catch(e){ toast("It didn't work: "+(e.message||"try again"), 5000); } renderLinkedin(); mlOpen(ed,k); }
      });
    }});
}
function mlWire(el){
  const ed=mlEdition(); if(!ed || !$("#ml-card",el)) return;
  const pick=$("#ml-ed",el); if(pick) pick.onchange=()=>{ ML.ed=pick.value; renderLinkedin(); };
  const mk=$("#ml-make",el); if(mk) mk.onclick=()=>mlMakeAll(ed, true);
  const tog=$("#ml-tog",el); if(tog) tog.onclick=()=>{ const card=$("#ml-card",el), open=card.classList.toggle("closed")===false;
    tog.setAttribute("aria-expanded", open?"true":"false"); try{ localStorage.setItem("mmhq.mlOpen", open?"1":"0"); }catch(e){} };
  $$("[data-mlrow]",el).forEach(r=>r.onclick=()=>mlOpen(ed, r.dataset.mlrow));
}
