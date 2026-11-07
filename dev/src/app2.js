
/* ================= MISMO Matters ================= */
const MS = {ed:null, sub:"sections"};
function renderMatters(){
  const el=$("#page-matters"); const list=editionsSorted();
  if(!list.length){
    el.innerHTML='<div class="phead"><div><div class="eyebrow">MISMO Matters</div><h1>MISMO Matters</h1></div></div><div class="card"><div class="empty">'+(LIVE&&!LOADED.has("editions")?"Loading the editions…":"<b>No editions yet.</b> Start the first one and its thirteen sections appear here, ready for content.")+'</div><div class="cb"><button class="btn pri" type="button" id="ms-start">Start an Edition</button></div></div>';
    const b=$("#ms-start",el); if(b) b.onclick=startNextEdition; return;
  }
  let ed = S.editions[MS.ed] || curEdition(); MS.ed = ed.id;
  const t=T();
  const opts = list.slice().reverse().map(e=>'<option value="'+esc(e.id)+'"'+(e.id===ed.id?" selected":"")+'>'+esc(monthName(e.month))+(e.archived?" · sent through Axios":"")+'</option>').join("");
  const head = '<div class="phead"><div><div class="eyebrow">MISMO Matters</div><h1>'+esc(monthName(ed.month))+' Edition</h1><div class="sub">'+
    (ed.archived ? 'Sent '+esc(fL(ed.dates.publish))+' through Axios' : 'Goes out '+esc(fL(ed.dates.publish))+' through Higher Logic to the MISMO Matters group')+'</div></div>'+
    '<div class="tools"><div class="field"><label for="ms-pick">Edition</label><select id="ms-pick">'+opts+'</select></div>'+
    (ed.archived?'':'<button class="btn" type="button" id="ms-dates">Change Dates</button>')+
    '<button class="btn" type="button" id="ms-next">Start the Next Edition</button></div></div>';
  if(ed.archived){ el.innerHTML = head + archiveView(ed); wireMattersHead(el, ed); return; }
  const secs=edSections(ed), on=secs.filter(s=>s.on);
  const cnt=k=>on.filter(s=>!s.meta.auto && s.doc.status===k).length;
  const inN=on.filter(s=>s.meta.auto||s.doc.status!=="waiting").length;
  const totalWords = on.reduce((n,s)=>n+words(s.doc.body)+words(s.doc.quote),0);
  const nx = MILES.find(([k])=>!(ed.done&&ed.done[k]));
  const band = '<div class="band">'+mattersHero(ed,on)+
    '<div><div><div class="say">'+mattersSay(ed,on)+'</div><div class="tiles">'+
    '<div class="tile"><div class="v">'+inN+' of '+on.length+'</div><div class="k">Sections In</div><div class="s">'+(on.length-inN)+' still waiting on content</div></div>'+
    '<div class="tile"><div class="v">'+cnt("review")+'</div><div class="k">With Amy</div><div class="s">ready for her review</div></div>'+
    '<div class="tile"><div class="v'+(cnt("changes")?" hot":"")+'">'+cnt("changes")+'</div><div class="k">Changes Requested</div><div class="s">back with Kelly</div></div>'+
    '<div class="tile"><div class="v">'+cnt("approved")+'</div><div class="k">Approved</div><div class="s">ready to build</div></div>'+
    '<div class="tile"><div class="v">'+totalWords.toLocaleString()+'</div><div class="k">Words So Far</div><div class="s">recent editions ran 2,500–4,000</div></div>'+
    '</div>'+ringLegend()+'</div></div></div>';
  const miles = '<div class="miles">'+MILES.map(([k,l,w])=>{ const dd=ed.dates[k], done=ed.done&&ed.done[k]; const cls=done?"done":(dd&&dd<t?"late":(nx&&nx[0]===k?"next":"")); return '<button type="button" class="mile '+cls+'" data-mile="'+k+'" title="'+esc(done?"Done — press to undo":"Press to mark done")+'"><div class="ml">'+esc(l)+'</div><div class="md">'+esc(fS(dd))+'</div><div class="mw">'+esc(done?"Done":w)+'</div></button>'; }).join("")+'</div>';
  const checksDone = SEND_CHECKS.filter(([k])=>ed.checks&&ed.checks[k]).length;
  const subs = '<div class="subtabs" role="group" aria-label="Edition views">'+
    [["sections","Sections",""],["preview","Preview & HTML",""],["checks","Send Checklist",checksDone+"/"+SEND_CHECKS.length],["stats","Stats",""],["archive","Past Editions",""]].map(([k,l,n])=>'<button type="button" data-sub="'+k+'" aria-pressed="'+(MS.sub===k)+'">'+esc(l)+(n?' <span class="note">'+esc(n)+'</span>':'')+'</button>').join("")+'</div>';
  let body='';
  if(MS.sub==="sections") body=sectionsView(ed,secs);
  else if(MS.sub==="preview") body=previewView(ed);
  else if(MS.sub==="checks") body=checksView(ed);
  else if(MS.sub==="stats") body=statsView(ed);
  else body=archiveTable();
  el.innerHTML = head + band + miles + subs + body;
  wireMattersHead(el, ed);
  $$(".mile",el).forEach(b=>b.onclick=async()=>{ const k=b.dataset.mile; const done=Object.assign({},ed.done||{}); const was=!!done[k]; done[k]=!was; await patch("editions",ed.id,{done}); toast((was?"Unmarked: ":"Done: ")+MILES.find(m=>m[0]===k)[1]); });
  $$("[data-sub]",el).forEach(b=>b.onclick=()=>{ MS.sub=b.dataset.sub; renderMatters(); });
  $$("[data-rk]",el).forEach(p=>p.addEventListener("click",()=>openSection(ed,p.dataset.rk)));
  if(MS.sub==="sections") wireSections(el,ed);
  if(MS.sub==="preview") wirePreview(el,ed);
  if(MS.sub==="checks") $$("[data-chk]",el).forEach(c=>c.onchange=async()=>{ const checks=Object.assign({},ed.checks||{}); checks[c.dataset.chk]=c.checked; await patch("editions",ed.id,{checks}); });
  if(MS.sub==="stats"){ const b=$("#ms-stats",el); if(b) b.onclick=()=>openStats(ed); }
  if(MS.sub==="archive") $$("[data-ed]",el).forEach(r=>r.onclick=()=>{ MS.ed=r.dataset.ed; MS.sub="sections"; renderMatters(); });
}
function mattersSay(ed,on){
  const t=T(), w=on.filter(s=>!s.meta.auto && s.doc.status==="waiting");
  if(ed.done&&ed.done.publish) return 'This edition has gone out. Record its stats a week after sending so the next one can be compared.';
  if(t<=ed.dates.content) return 'Content is due to Kelly <em>'+esc(fD(ed.dates.content))+'</em>. Drop each piece into its section as it arrives so Amy can review section by section instead of all at once.';
  if(w.length) return '<span class="hot">'+w.length+' section'+(w.length>1?"s are":" is")+' still waiting on content:</span> '+esc(w.slice(0,4).map(s=>s.meta.name).join(", "))+(w.length>4?" and more":"")+'. Turn a section off if it isn\'t running this month.';
  return 'Every running section has content. Next is Amy\'s review, then the build in Higher Logic.';
}
function wireMattersHead(el, ed){
  $("#ms-pick",el).onchange=e=>{ MS.ed=e.target.value; renderMatters(); };
  const d=$("#ms-dates",el); if(d) d.onclick=()=>openEdition(ed);
  $("#ms-next",el).onclick=startNextEdition;
}
const GRIP='<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="5" cy="3" r="1.4"/><circle cx="11" cy="3" r="1.4"/><circle cx="5" cy="8" r="1.4"/><circle cx="11" cy="8" r="1.4"/><circle cx="5" cy="13" r="1.4"/><circle cx="11" cy="13" r="1.4"/></svg>';
function sectionsView(ed,secs){
  const rows = secs.map(s=>{
    const d=s.doc; let snip='';
    if(s.meta.auto){ const n = s.k==="micdup" ? epsInWindow(ed).length : newsInWindow(ed).length; snip='<i>'+n+(s.k==="micdup"?" episode":" item")+(n===1?"":"s")+' so far · fills itself</i>'; }
    else if(isCertSpot(s)){ const p=certProg(d.certProgram); snip=esc(p.name)+' · '+d.certItems.length+' certified, current from the website'; }
    else if(isLogoSec(s.k) && logoPicks(ed,s.k).length){ const L=logoPicks(ed,s.k); snip=L.length+' logo'+(L.length===1?'':'s')+': '+esc(L.map(l=>l.name||(S.images[l.id]||{}).name||"").join(", ")); }
    else snip = d.headline ? esc(d.headline) : (d.body ? esc(mdPlain(d.body).slice(0,120)) : '<i>Nothing in yet</i>');
    const reuse = REUSE.map(([k,l,a])=>'<span class="rz k-'+(k==="website"?"other":k)+(d.reuse&&d.reuse[k]?" on":"")+'" title="'+esc(l)+'">'+a+'</span>').join("");
    const st = s.meta.auto ? '<span class="chip in">Automatic</span>' : chip(SSTAT, d.status||"waiting");
    return '<div class="secrow'+(s.on?"":" off")+'" draggable="true" data-k="'+esc(s.k)+'"><span class="grip" title="Drag to reorder">'+GRIP+'</span><input type="checkbox" data-inc="'+esc(s.k)+'"'+(s.on?" checked":"")+' aria-label="Include '+esc(s.meta.name)+' this month" title="Running this month"><div class="sn"><b>'+esc(d.name||s.meta.name)+'</b><small>'+esc(d.owner||s.meta.owner)+' · '+esc(s.meta.from||"")+(d.imageId||d.imageNote||d.imageUrl?" · image ✓":"")+'</small></div><div class="sx">'+snip+'</div><div class="reuse">'+reuse+'</div><div>'+st+'</div></div>';
  }).join("");
  return '<div class="card"><div class="ch"><h2>Sections, in Running Order</h2><span class="cnt">'+secs.filter(s=>s.on).length+' running</span><div class="r"><button class="btn sm" type="button" id="ms-oneoff">+ One-Off Section</button></div></div>'+
    '<div class="cb flush" id="ms-rows">'+rows+'</div></div>'+
    '<p class="foot">Drag a row by its grip to change the order. Untick a section that isn\'t running this month. The small boxes show where else a section\'s copy and image are going: LI LinkedIn, MC Mailchimp, WB website, YT YouTube, SU summit.</p>';
}
function wireSections(el,ed){
  $$(".secrow",el).forEach(r=>{
    r.addEventListener("click",e=>{ if(e.target.closest("input,.grip")) return; openSection(ed, r.dataset.k); });
    r.addEventListener("dragstart",e=>{ r.classList.add("dragging"); e.dataTransfer.effectAllowed="move"; e.dataTransfer.setData("text/plain",r.dataset.k); });
    r.addEventListener("dragend",()=>{ r.classList.remove("dragging"); $$(".secrow",el).forEach(x=>x.classList.remove("over")); });
    r.addEventListener("dragover",e=>{ e.preventDefault(); $$(".secrow",el).forEach(x=>x.classList.remove("over")); r.classList.add("over"); });
    r.addEventListener("drop",async e=>{ e.preventDefault(); const from=e.dataTransfer.getData("text/plain"), to=r.dataset.k; if(!from||from===to) return;
      const order=edSections(ed).map(s=>s.k).filter(k=>k!==from); order.splice(order.indexOf(to),0,from);
      await patch("editions",ed.id,{order}); toast("Order saved"); });
  });
  $$("[data-inc]",el).forEach(c=>c.onchange=async()=>{ const ex=Object.assign({},ed.excluded||{}); if(c.checked) delete ex[c.dataset.inc]; else ex[c.dataset.inc]=true;
    const v={excluded:ex}; if(c.checked && ed.order && ed.order.length && !ed.order.includes(c.dataset.inc)) v.order=edSections(ed).map(s=>s.k); await patch("editions",ed.id,v); toast(c.checked?"Running this month":"Left out this month"); });
  $("#ms-oneoff",el).onclick=()=>{ const k="x"+Date.now().toString(36); openSection(ed,k,true); };
}
function openSection(ed,k,isNew){
  const meta = SEC[k] || {key:k, name:"One-Off Section", owner:"Kelly", from:""};
  const id=ed.month+"__"+k; const doc=Object.assign({month:ed.month,key:k,status:"waiting",owner:meta.owner,from:meta.from}, S.sections[id]||{});
  const auto = !!meta.auto;
  let fields=[];
  if(!SEC[k]) fields.push({k:"name",label:"Section Name",ph:"e.g. Summit Sponsor Spotlight",wide:true});
  if(auto){
    const list = k==="micdup" ? epsInWindow(ed).map(e=>epWord(e)+": "+(e.title||"")+(e.youtubeDone?"":" (not on YouTube yet)")) : newsInWindow(ed).map(n=>(n.kind==="press"?"Press release · ":"")+(n.outlet?n.outlet+" – ":"")+(n.headline||""));
    fields.push({sec:"What Goes In"},{k:"_auto",type:"html",html:()=>'<div class="ro">'+(list.length?esc(list.join("\n")).replace(/\n/g,"<br>"):"Nothing yet for this window ("+esc(fS(add(prevPublish(ed),1)))+" to "+esc(fS(ed.dates.publish))+"). Add it on the "+(k==="micdup"?"Mic'd Up":"In the News")+" page and it shows up here.")+'</div>'},
      {k:"intro",label:"Intro Line",type:"rich",rows:3,ph:k==="micdup"?"MISMO Mic'd Up spotlights the voices shaping the future of real estate finance…":"MISMO regularly shares key updates…"});
  } else if(isLogoSec(k)){
    const L=LOGO_SECS[k];
    fields.push({sec:"Copy"},
      {k:"headline",label:"Headline",wide:true,ph:L.head,hint:"Leave blank for: "+L.head},
      {k:"body",label:"Intro",type:"rich",rows:3,ph:L.intro},
      {sec:"Logos"},{k:"_logos",type:"html",wide:true,html:()=>'<div id="lg-box"></div>'},
      {k:"ctaText",label:"Button Text (optional)",ph:k==="welcome"?"e.g. Become a Member":"e.g. Become a Sponsor"},
      {k:"ctaUrl",label:"Button Link",type:"url",ph:"https://"});
  } else {
    if(k==="cert") fields.push({sec:"Certification Spotlight"},
      {k:"certProgram",label:"Certification to Highlight",type:"select",wide:true,opts:[["","None: write the section myself"]].concat(CERT_PROGRAMS.map(p=>[p.k,p.name]))},
      {k:"_cert",type:"html",wide:true,html:()=>certPaneHtml()});
    fields.push({sec:"Copy"},
      {k:"headline",label:"Headline",wide:true,ph:k==="cert"?"Leave blank to use the certification's name, e.g. MISMO Certified FRAME Advisory Partners":"e.g. Before Mortgage Can Be AI-Ready, We Need to Be Data-Ready"},
      {k:"body",label:"Body Copy",type:"rich",rows:12,img:ed.month,ph:"Type or paste the copy as it should run. Pasting from Word keeps bold, links and bullets. Add pictures anywhere with the picture button."},
      {k:"quote",label:"Quote",type:"rich",rows:3,ph:"Sponsor and member highlights usually carry a quote"},
      {k:"quoteBy",label:"Quote Attribution",ph:"Name, Title, Company"},
      ...(FULL_ARTICLE[k] ? [{k:"_full",type:"html",html:d=>'<div class="ro">'+esc(fullArticleLabel(k))+' goes to <a href="'+esc(fullArticleUrl(ed,k,d))+'" target="_blank" rel="noopener">'+esc(fullArticleUrl(ed,k,d).replace(/^https:\/\//,""))+' ↗</a>, the '+esc(monthName(ed.month))+' article on the website.</div>'},{k:"noFull",label:"Leave out the "+fullArticleLabel(k)+" button",type:"cb"}] : []),
      {k:"ctaText",label:"Link Text",ph:"e.g. Register for the Winter Summit"},
      {k:"ctaUrl",label:"Link",type:"url",ph:"https://"});
  }
  if(!isLogoSec(k)) fields.push({sec:"Lead Picture (Under the Headline)"},{k:"_imgh",type:"html",html:()=>auto?'':'<div class="hint">For more pictures, or a picture anywhere in the text, put your cursor in the Body Copy and press the picture button in its toolbar.</div>'},
    {k:"_img",type:"html",html:d=>imageField(d)},
    {k:"imageNote",label:"Where the Image Is",ph:"e.g. Q drive › MISMO Matters › 2026-11 › citizens.png"},
    {k:"imageUrl",label:"Image Link in Higher Logic",type:"url",ph:"https://"},
    {k:"imageAlt",label:"Image Description",ph:"For screen readers, e.g. Deborah Jones headshot"},
    {k:"imageSize",label:"Picture Size",type:"select",opts:[["","Automatic (headshots go small)"],["full","Full Width"],["half","Half Width, Centered"],["small","Small, Beside the Text"]],hint:"Small puts the picture at the left with the text running beside it. Good for headshots."},
    {k:"hdrUrl",label:"Section Header Graphic",type:"url",ph:meta.hdr?"Using the October header graphic":"Plain text header",hint:meta.hdr?"Leave blank to use the header graphic from the October edition":"Paste a header graphic link, or leave blank for a text header"});
  fields.push({sec:"Who and Status"},
    {k:"owner",label:"Collecting It",type:"select",opts:PEOPLE},
    {k:"from",label:"Comes From"},
    {k:"status",label:"Status",type:"select",opts:Object.entries(SSTAT).map(([v,[l]])=>[v,l])},
    {k:"amyNotes",label:"Amy's Notes",type:"rich",rows:3,ph:"Edits, questions or a request for a different graphic"});
  fields.push({sec:"Also Use It In"},{k:"reuse",label:"Where else this copy and image go",type:"checks",opts:REUSE.map(([v,l])=>[v,l])});
  const save = async v=>{ if(isNew){ const order=edSections(ed).map(s=>s.k); if(!order.includes(k)){ order.push(k); await patch("editions",ed.id,{order}); } } await put("sections",id,Object.assign({},doc,v,{month:ed.month,key:k})); if(isLogoSec(k) && v.logos) rememberLogos(v.logos);
    if(k==="cert" && certProg(v.certProgram) && (doc.certProgram!==v.certProgram || !(S.sections[id]||{}).certItems)){ certRefresh(ed).catch(e=>toast("Saved. Couldn't read the website yet: "+(e.message||"try again"), 6000)); } };
  openPane({eye:monthName(ed.month)+" · MISMO Matters", title:doc.name||meta.name, fields, data:doc, save,
    buttons: auto?[]:[
      {label:"Save & Send to Amy", run:async v=>{ await save(Object.assign(v,{status:"review"})); toast("Sent to Amy for review"); closePane(true); }},
      {label:"Approve", run:async v=>{ await save(Object.assign(v,{status:"approved"})); toast("Approved"); closePane(true); }},
      {label:"Request Changes", run:async v=>{ await save(Object.assign(v,{status:"changes"})); toast("Back to Kelly with notes"); closePane(true); }}
    ],
    del: (!SEC[k] && S.sections[id]) ? async()=>{ await remove("sections",id); await patch("editions",ed.id,{order:edSections(ed).map(s=>s.k).filter(x=>x!==k)}); } : null,
    after: b=>{ if(isLogoSec(k)) wireLogos(b, doc, ed, k); else wireImage(b, doc, v=>{ doc.imageId=v; }); if(k==="cert") wireCert(b, doc, ed); }
  });
  PANE.set = out=>{ if(doc.imageId!==undefined) out.imageId=doc.imageId||""; if(doc.imageLib!==undefined) out.imageLib=doc.imageLib||"";
    if(isLogoSec(k) && PANE.logos){ out.logos=PANE.logos().filter(l=>l.id).map(l=>({id:l.id, name:(l.name||"").trim(), group:(l.group||"").trim(), url:(l.url||"").trim()})); } if(k==="thanks" && PANE.sponsorsAuto){ out.sponsorsAuto=!!PANE.sponsorsAuto(); } if(k==="cert" && PANE.certAuto){ out.certAuto=!!PANE.certAuto(); } };
}
/* lead picture size: what the section says, else headshot-shaped pictures (taller than wide) go small */
function leadSize(d, lib){ if(d.imageSize) return d.imageSize; return lib && +lib.w && +lib.h > +lib.w*1.1 ? "small" : "full"; }
function imageField(d){
  const lib = d.imageLib && S.images[d.imageLib];
  const src = lib ? imgSrc(lib) : (d.imageId ? "/_blob/"+d.imageId : "");
  const img = src ? '<img src="'+esc(src)+'" alt="">' : '';
  const has = !!src;
  const pick = vals("images").some(i=>!i.archived) ? '<button class="btn sm" type="button" id="img-lib">Pick from Image Library</button>' : '';
  if(!ASSETS) return '<div class="imgbox" id="imgbox">'+img+pick+(has?'<button class="btn sm" type="button" id="img-rm">Remove</button>':'')+'<span class="hint">Adding new pictures works on the Claude version until the image folder is switched on here.</span><div id="img-strip" hidden></div></div>';
  return '<div class="imgbox" id="imgbox">'+img+'<button class="btn sm" type="button" id="img-up">'+(has?"Replace Image":"Upload Image")+'</button>'+pick+(has?'<button class="btn sm" type="button" id="img-rm">Remove</button>':'')+'<input type="file" id="img-file" accept="image/*" hidden><span class="hint">Every picture added here also goes into the Image Library, tagged to this edition, so it can be reused for LinkedIn and Mailchimp.</span><div id="img-strip" hidden></div></div>';
}
function wireImage(b, doc, setId){
  const up=$("#img-up",b), f=$("#img-file",b), rm=$("#img-rm",b), lb=$("#img-lib",b), strip=$("#img-strip",b);
  const redraw=()=>{ if(PANE) PANE.dirty=true; $("#f-_img",b).innerHTML=imageField(doc); wireImage(b,doc,setId); };
  const use=im=>{ doc.imageLib=im.id; setId(im.assetId||""); const u=$("#f-imageUrl",b); if(u && !u.value && im.hlUrl) u.value=im.hlUrl; const a=$("#f-imageAlt",b); if(a && !a.value && im.alt) a.value=im.alt; redraw(); };
  if(up) up.onclick=()=>f.click();
  if(f) f.onchange=async()=>{ const file=f.files[0]; if(!file) return; const made=await addImages([file],{campaign:"matters", edition:doc.month||""}); if(made[0]){ use(made[0]); toast("Image added to the section and the Image Library. Press Save to keep it."); } };
  if(lb) lb.onclick=()=>{ strip.hidden=!strip.hidden; if(!strip.hidden){ strip.innerHTML=libraryStrip(S.editions[doc.month]||curEdition()); $$("[data-pick]",strip).forEach(p=>p.onclick=()=>{ const im=S.images[p.dataset.pick]; if(im) use(im); }); } };
  if(rm) rm.onclick=()=>{ doc.imageLib=""; setId(""); redraw(); };
}
function openEdition(ed){
  const fields=[{sec:"Dates"}].concat(MILES.map(([k,l,w])=>({k:"d_"+k,label:l,type:"date",get:d=>d.dates&&d.dates[k],hint:w})))
    .concat([{sec:"Notes"},{k:"notes",label:"Notes for This Edition",type:"rich",rows:4,ph:"Anything the team should know: who's out, special sections, sponsor banner"}]);
  openPane({eye:"MISMO Matters", title:monthName(ed.month)+" Edition", fields, data:ed,
    save:async v=>{ const old=ed.dates||{}, dates=Object.assign({},old); MILES.forEach(([k])=>{ if(v["d_"+k]) dates[k]=v["d_"+k]; });
      const np=dates.publish, moved = np && old.publish && np!==old.publish && MILES.every(([k])=>k==="publish" || dates[k]===old[k]);
      let msg="";
      if(moved){ const delta=diff(np,old.publish); SEND_SIDE.forEach(k=>{ if(k==="publish"||!old[k]||(ed.done&&ed.done[k])) return; dates[k]=workday(add(old[k],delta), k==="stats"?1:-1); }); msg="Send date moved to "+fD(np)+". Test send, final approval and stats moved with it; content dates stayed put."; }
      const warn=MILES.filter(([k])=>dates[k]&&offDay(dates[k])).map(([k,l])=>l+" falls on "+offNote(dates[k])+" ("+fD(dates[k])+")");
      await patch("editions",ed.id,{dates, notes:v.notes});
      if(msg||warn.length) setTimeout(()=>toast([msg].concat(warn.length?["Heads up: "+warn.join("; ")+"."]:[]).filter(Boolean).join(" "), 7000), 700); },
    extra: ed.notes?'':'', buttons:[{label:"Reset to the Usual Cadence", run:async()=>{ const p=ed.dates.publish; const dates=cadenceFrom(p); await patch("editions",ed.id,{dates}); toast("Dates reset from the send date"); closePane(true); }}]
  });
}
async function startNextEdition(){
  const list=editionsSorted(); const last=list[list.length-1];
  let y,m; if(last){ [y,m]=last.month.split("-").map(Number); m++; if(m>12){m=1;y++;} } else { const d=today(); y=d.getFullYear(); m=d.getMonth()+2; if(m>12){m=1;y++;} }
  const month=y+"-"+pad(m); const p=thirdWed(y,m-1);
  const dates=cadenceFrom(workday(p,1));
  await put("editions",month,{month, dates, done:{}, checks:{}, order:SECTIONS.map(s=>s.key), excluded:{}, stats:{}});
  for(const s of SECTIONS){ if(!S.sections[month+"__"+s.key]) await put("sections",month+"__"+s.key,{month,key:s.key,status:"waiting",owner:s.owner,from:s.from}); }
  MS.ed=month; MS.sub="sections"; go("matters"); renderMatters(); toast(monthName(month)+" edition started · goes out "+fS(p));
}
function checksView(ed){
  return '<div class="card"><div class="ch"><h2>Before It Goes Out</h2><span class="cnt">'+SEND_CHECKS.filter(([k])=>ed.checks&&ed.checks[k]).length+' of '+SEND_CHECKS.length+'</span></div><div class="checks">'+
    SEND_CHECKS.map(([k,l,s])=>'<label class="chk'+(ed.checks&&ed.checks[k]?" done":"")+'"><input type="checkbox" data-chk="'+k+'"'+(ed.checks&&ed.checks[k]?" checked":"")+'><span class="ct"><b>'+esc(l)+'</b><small>'+esc(s)+'</small></span></label>').join("")+'</div></div>';
}

/* ---- the newsletter itself: email-safe HTML for Higher Logic ---- */
function paras(s){ return String(s||"").split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean); }
function linkify(s){ return esc(s).replace(/(https?:\/\/[^\s<]+)/g,'<a href="$1" style="color:#14486e">$1</a>').replace(/\n/g,"<br>"); }
/* Option 2 section headers: drawn for MISMO Media, served from resources.mismo.org (GitMISMO/marketing-hq, mm-headers/).
   The drawing source is mm-headers/source.html. Mic'd Up is a short animated GIF; Outlook shows its first frame. */
const HDR2_BASE="https://resources.mismo.org/marketing-hq/mm-headers/v1/";
const HDR2_KEYS=["vieaux","summit","highlight","workgroup","sponsor","impl","micdup","member","welcome","thanks","education","cert","events","news"];
/* Vieaux Point and Workgroup Highlights each have a page on the website with every month's
   article; #vp-YYYY-MM / #wg-YYYY-MM opens straight to that month. */
const FULL_ARTICLE = {vieaux:["about-mismo/vieaux-point","vp","Continue Reading"], workgroup:["about-mismo/workgroup-highlights","wg","Read the Full Article"]};
/* Every edition also lives on the web at its own address, so a reader can link to one section (Copy Link). */
const MM_WEB_BASE="https://resources.mismo.org/marketing-hq/matters/";
function mmWebUrl(ed){ return MM_WEB_BASE+(ed&&ed.month||"")+"/"; }
function buildWebPage(ed){
  const t="MISMO Matters | "+monthName(ed.month);
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(t)+'</title>'+
    '<meta property="og:title" content="'+esc(t)+'"><meta property="og:image" content="'+esc(MAST_IMG)+'">'+
    '<style>html{scroll-behavior:smooth}body{margin:0;background:#f1f6fa}a[name]{scroll-margin-top:12px}a[data-mm-copy].ok{color:#0f7b5c!important}</style></head><body>'+
    buildEmail(ed,false,hdrOpt(ed))+
    '<script>document.addEventListener("click",function(e){var a=e.target.closest("a[data-mm-copy]");if(!a)return;e.preventDefault();var u=location.href.split("#")[0]+"#"+a.getAttribute("data-mm-copy");history.replaceState(null,"",u);var l=a.querySelector("[data-mm-label]");function ok(){if(!l)return;l.textContent="Link Copied";a.classList.add("ok");setTimeout(function(){l.textContent="Copy Link";a.classList.remove("ok")},2200)}if(navigator.clipboard)navigator.clipboard.writeText(u).then(ok,function(){prompt("Copy this link",u)});else prompt("Copy this link",u)});<\/script></body></html>';
}
function fullArticleLabel(k){ const f=FULL_ARTICLE[k]; return (f&&f[2])||"Read the Full Article"; }
/* the website moves from collaborate.mismo.org/mismowebsite to www.mismo.org on Nov 16 (certSite picks by publish date);
   d.fullAnchor (optional) picks up the article where the newsletter cut it off, e.g. vp-2026-11-mcd-cost */
function fullArticleUrl(ed, k, d){ const f=FULL_ARTICLE[k]; return f && ed && ed.month ? certSite(ed, f[0])+"#"+((d&&d.fullAnchor)||(f[1]+"-"+ed.month)) : ""; }
function hdrOpt(ed){ return (ed && ed.hdrStyle==="2") ? "2" : "1"; }
/* IBM Plex for the email apps that load web fonts (Apple Mail on iPhone, iPad and Mac, Outlook for Mac, Samsung Mail).
   Hidden from Outlook on Windows, which would otherwise drop to Times New Roman; it and Gmail use Segoe UI or Arial instead. */
const EMAIL_FONTS='<!--[if !mso]><!--><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&amp;family=IBM+Plex+Sans:wght@400;600;700&amp;display=swap" rel="stylesheet"><style type="text/css">@import url(\'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=IBM+Plex+Sans:wght@400;600;700&display=swap\');</style><!--<![endif]-->';
function buildEmail(ed, preview, opt){
  opt = opt || hdrOpt(ed);
  /* Laid out like the hand-built November edition: a 600px column, full-width section header
     images edge to edge, roomy 16px type, and every block in tables so Outlook keeps it. */
  const F="font-family:'IBM Plex Sans','Segoe UI',Helvetica,Arial,sans-serif;", M="font-family:'IBM Plex Mono',Consolas,Menlo,monospace;";
  const navy="#0d314c", ink="#1d2b36", link="#14486e", mute="#56718a", soft="#f6fafd", line="#dde9f2";
  const P=F+'font-size:16px;line-height:1.7;margin:0 0 14px;color:'+ink;
  const A='color:'+link+';font-weight:600;text-decoration:underline';
  /* subheads always start below a small picture beside the text, never beside it */
  const H3=F+'font-size:17.5px;line-height:1.35;color:'+navy+';margin:24px 0 10px;font-weight:700;clear:both;padding-top:6px';
  const pic=b=>{ const r=rtImgInfo(b.ref), half=b.size==="half", w=half?272:544;
    const tag=(src,extra)=>'<img src="'+esc(src)+'" alt="'+esc(b.alt||"")+'" width="'+w+'"'+(extra||'')+' style="display:block;width:'+(half?'50%':'100%')+';max-width:'+w+'px;height:auto;margin:'+(half?'4px auto 18px':'4px 0 18px')+';border:0'+(r.hl?'':';outline:2px dashed #e0a440;outline-offset:-2px')+'" border="0">';
    const wrap=x=>half?'<div style="text-align:center">'+x+'</div>':x;
    if(r.hl) return wrap(tag(r.hl));
    if(preview && r.im) return wrap(tag(r.src, r.src?'':' data-mmimg="'+esc(r.id)+'"'))+'<div style="font:600 11px/1.3 Arial,Helvetica,sans-serif;color:#9a5b00;background:#fff4e0;border:1px dashed #e0a440;padding:6px 8px;margin:-12px 0 18px">Preview only. Add this picture to Higher Logic\'s image library, then paste its link on the picture in MISMO Media\'s Image Library.</div>';
    return imgBox('PICTURE: '+esc(b.alt||r.name||"from MISMO Media")+' &mdash; add it to Higher Logic and paste its link on the picture in the Image Library'); };
  const body=(md)=>mdEmail(md, P, A, {h3:H3, li:F+'font-size:16px;line-height:1.65;color:'+ink+';margin:0 0 8px', img:pic});
  const card=(top,main,sub,href)=>'<tr><td bgcolor="'+soft+'" style="background:'+soft+';border:1px solid '+line+';padding:14px 18px">'+
    (top?'<div style="'+M+'font-size:11px;letter-spacing:.13em;text-transform:uppercase;color:'+mute+';font-weight:600;margin:0 0 6px">'+top+'</div>':'')+
    (href?'<a href="'+esc(href)+'" style="'+F+'font-size:16px;line-height:1.45;color:'+link+';font-weight:700;text-decoration:none">'+main+'</a>':'<div style="'+F+'font-size:16px;line-height:1.45;color:'+navy+';font-weight:700">'+main+'</div>')+
    (sub?'<div style="'+F+'font-size:14.5px;line-height:1.5;color:#456179;margin:5px 0 0">'+sub+'</div>':'')+'</td></tr>';
  const cards=list=>'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 6px">'+list.join('<tr><td height="8" style="font-size:0;line-height:0;height:8px">&nbsp;</td></tr>')+'</table>';
  const imgBox=t=>'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px"><tr><td bgcolor="'+soft+'" style="background:'+soft+';border:1px dashed #9db6c9;color:#456179;'+F+'font-size:12px;padding:20px;text-align:center">'+t+'</td></tr></table>';
  const on=edSections(ed).filter(s=>s.on);
  const blocks=[], toc=[];
  on.forEach(s=>{
    const d=s.doc, name=d.name||s.meta.name, anchor="mm-"+s.k;
    let inner='';
    if(s.meta.auto){
      if(d.intro) inner+=body(d.intro);
      if(s.k==="micdup"){
        const eps=epsInWindow(ed); if(!eps.length) return;
        inner+='<p style="'+P+';margin-bottom:16px">Check out the latest episodes of MISMO Mic&rsquo;d Up on MISMO&rsquo;s YouTube Channel:</p>';
        inner+=cards(eps.map(e=>{ const lab="Season "+esc(e.season||1)+" &middot; Episode "+esc(e.num||"?");
          return card(lab, esc("MISMO Mic’d Up "+epWord(e)+(e.title?": "+e.title:"")), e.guests?'with '+esc(e.guests)+(e.company?', '+esc(e.company):''):'', e.youtubeUrl||"https://www.youtube.com/@MISMOStandards/videos"); }));
      } else {
        const ns=newsInWindow(ed); if(!ns.length) return;
        const pr=ns.filter(n=>n.kind==="press"), mn=ns.filter(n=>n.kind!=="press");
        const head=(t,first)=>'<h3 style="'+H3+(first?';margin-top:0':'')+';margin-bottom:12px">'+t+'</h3>';
        if(pr.length) inner+=head("Press Releases",true)+cards(pr.map(n=>card(esc(fS(n.date)), esc(n.headline||""), '', n.url||"#")));
        if(mn.length) inner+=head("MISMO in the News",!pr.length)+cards(mn.map(n=>card(esc(n.outlet||""), esc(n.headline||""), '', n.url||"#")));
      }
    } else if(isLogoSec(s.k) && logoPicks(ed,s.k).length){
      inner+=logoWall(ed, s, preview);
    } else if(isCertSpot(s)){
      inner+=certSpotlight(ed, s, body);
    } else {
      if(!d.headline && !d.body && !d.quote) return;
      if(d.headline) inner+='<h2 style="'+F+'font-size:24px;line-height:1.27;letter-spacing:-.012em;color:'+navy+';margin:0 0 16px;font-weight:700">'+esc(d.headline)+'</h2>';
      const lib=d.imageLib&&S.images[d.imageLib], local=lib?imgSrc(lib):(d.imageId?"/_blob/"+d.imageId:"");
      const hl=d.imageUrl||(lib&&lib.hlUrl)||"";
      const isz=leadSize(d, lib);
      const img=src=> isz==="small" ? '<img src="'+esc(src)+'" alt="'+esc(d.imageAlt||"")+'" width="140" align="left" style="float:left;width:140px;max-width:38%;height:auto;margin:4px 22px 16px 0;border:0;border-radius:4px" border="0">'
        : isz==="half" ? '<img src="'+esc(src)+'" alt="'+esc(d.imageAlt||"")+'" width="272" style="display:block;width:272px;max-width:100%;height:auto;margin:0 auto 18px;border:0" border="0">'
        : '<img src="'+esc(src)+'" alt="'+esc(d.imageAlt||"")+'" width="544" style="display:block;width:100%;max-width:544px;height:auto;margin:0 0 18px;border:0" border="0">';
      if(hl) inner+=img(hl);
      else if(preview && local) inner+=img(local).replace('border:0"','border:0;outline:2px dashed #e0a440;outline-offset:-2px"')+'<div style="font:600 11px/1.3 Arial,Helvetica,sans-serif;color:#9a5b00;background:#fff4e0;border:1px dashed #e0a440;padding:6px 8px;margin:-12px 0 18px">Preview only. Before you copy the HTML, add this picture to the Higher Logic image library and paste its link into the section\'s Image Link in Higher Logic.</div>';
      else if(d.imageId||d.imageLib||d.imageNote) inner+=imgBox('IMAGE: '+esc(d.imageAlt||d.imageNote||"uploaded in MISMO Media")+' &mdash; upload to Higher Logic and paste its link');
      inner+=body(d.body);
      if(isz==="small" && (hl||(preview&&local))) inner+='<div style="clear:both;height:0;font-size:0;line-height:0">&nbsp;</div>';
      if(d.quote) inner+='<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 20px"><tr><td bgcolor="#74bfeb" width="4" style="background:#74bfeb;width:4px;font-size:0;line-height:0">&nbsp;</td><td bgcolor="#f4f9fd" style="background:#f4f9fd;padding:18px 20px"><div style="'+F+'font-size:16.5px;line-height:1.62;color:'+ink+'">'+(()=>{ const q=String(d.quote).trim(), has=/^["“”']/.test(q); return (has?'':'&ldquo;')+mdInline(q,A).replace(/\n/g,"<br>")+(has?'':'&rdquo;'); })()+'</div>'+(d.quoteBy?'<div style="'+F+'font-weight:700;font-size:13.5px;line-height:1.5;color:'+navy+';margin:12px 0 0">&mdash; '+esc(d.quoteBy)+'</div>':'')+'</td></tr></table>';
      const full = !d.noFull && fullArticleUrl(ed, s.k, d);
      if(full) inner+='<p style="margin:0 0 18px"><a href="'+esc(full)+'" style="'+F+'display:inline-block;background:'+(opt==="2"?'#1a8fe3':navy)+';color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;line-height:1;padding:14px 24px;border-radius:3px;white-space:nowrap">'+esc(fullArticleLabel(s.k))+'&nbsp;&rarr;</a></p>';
      if(d.ctaUrl) inner+='<p style="margin:0 0 18px"><a href="'+esc(safeHref(d.ctaUrl))+'" style="'+F+'display:inline-block;background:'+navy+';color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;line-height:1;padding:14px 24px;border-radius:3px;white-space:nowrap">'+esc(d.ctaText||"Learn More")+'&nbsp;&rarr;</a></p>';
    }
    const hdr = (opt==="2" && HDR2_KEYS.includes(s.k)) ? HDR2_BASE+(s.k==="micdup"?"micdup.gif":s.k+".jpg") : (d.hdrUrl||s.meta.hdr);
    toc.push([anchor,name]);
    blocks.push(
      (hdr ? '<tr><td style="padding:0;line-height:0"><a name="'+anchor+'" id="'+anchor+'"></a><img src="'+esc(hdr)+'" alt="'+esc(name)+'" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0" border="0"></td></tr>'
           : '<tr><td bgcolor="#e4f2fb" style="background:#e4f2fb;padding:38px 28px;border-top:1px solid #cfe1ef;border-bottom:1px solid #cfe1ef"><a name="'+anchor+'" id="'+anchor+'"></a><div style="'+F+'font-size:27px;font-weight:700;letter-spacing:-.012em;color:'+navy+';line-height:1.2">'+esc(name)+'</div></td></tr>')+
      '<tr><td style="padding:28px 28px 4px">'+inner+'</td></tr>'+
      /* the foot of every section: Copy Link on the left (the section's own address on the web version, like the
         Axios editions had), Back to Top on the right */
      '<tr><td style="padding:14px 28px 22px;border-top:1px solid #e5eef5"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>'+
        '<td align="left" valign="middle" style="text-align:left"><a href="'+esc(mmWebUrl(ed)+"#"+anchor)+'" data-mm-copy="'+anchor+'" title="Link to this section" style="'+F+'font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:'+mute+';text-decoration:none;font-weight:600;white-space:nowrap"><img src="'+HDR2_BASE+'ic-link.png" alt="" width="12" height="12" style="display:inline-block;width:12px;height:12px;border:0;vertical-align:-1px" border="0">&nbsp;&nbsp;<span data-mm-label>Copy Link</span></a></td>'+
        '<td align="right" valign="middle" style="text-align:right"><a href="#mm-top" style="'+F+'font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:'+mute+';text-decoration:none;font-weight:600;white-space:nowrap">Back to Top&nbsp;&uarr;</a></td>'+
      '</tr></table></td></tr>');
  });
  /* In This Issue: two columns, numbered down the left column first */
  const half=Math.ceil(toc.length/2), tl=(i)=>{ const t=toc[i]; if(!t) return ''; return '<a href="#'+t[0]+'" style="text-decoration:none;color:'+navy+';'+F+'font-size:14px;font-weight:600"><span style="'+M+'color:#2477b8;font-size:12px;font-weight:500">'+String(i+1).padStart(2,"0")+'</span>&nbsp;&nbsp;'+esc(t[1])+'</a>'; };
  let tocRows=''; for(let r=0;r<half;r++){ const last=r===half-1; tocRows+='<tr><td width="50%" valign="top" style="padding:0 10px '+(last?0:9)+'px 0">'+tl(r)+'</td><td width="50%" valign="top" style="padding:0 0 '+(last?0:9)+'px 10px">'+tl(r+half)+'</td></tr>'; }
  const out = EMAIL_FONTS+'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f6fa;margin:0;padding:0"><tr><td align="center" style="padding:24px 12px">'+
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #d8e5ef">'+
    '<tr><td style="padding:0;line-height:0"><a name="mm-top" id="mm-top"></a><img src="'+MAST_IMG+'" alt="MISMO Matters" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0" border="0"></td></tr>'+
    /* the band under the masthead lines up with the masthead picture: the month starts under the MISMO logo and
       "Where" starts under the M of "MISMO Matters" (316 of the picture's 600px, so it holds on a phone too) */
    '<tr><td bgcolor="'+navy+'" style="background:'+navy+';padding:13px 0 14px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>'+
      '<td width="316" valign="middle" style="width:52.67%;padding:0 0 0 35px;'+M+'font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#a9d8f3;white-space:nowrap">'+esc(monthName(ed.month))+'</td>'+
      '<td valign="middle" align="left" style="padding:0 16px 0 0;text-align:left;'+F+'font-size:12.5px;line-height:1.4;color:#9fc0d6">Where Our Industry Builds What&rsquo;s Next</td></tr></table></td></tr>'+
    '<tr><td bgcolor="#74bfeb" style="background:#74bfeb;font-size:0;line-height:0;height:4px">&nbsp;</td></tr>'+
    (toc.length?'<tr><td bgcolor="'+soft+'" style="background:'+soft+';padding:20px 28px 16px;border-bottom:1px solid '+line+'"><div style="'+F+'font-size:11px;letter-spacing:.17em;text-transform:uppercase;color:'+mute+';font-weight:700;margin:0 0 13px">In This Issue</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">'+tocRows+'</table></td></tr>':'')+
    blocks.join("")+
    '<tr><td bgcolor="'+navy+'" style="background:'+navy+';padding:30px 28px"><div style="'+F+'font-size:19px;line-height:1.45;color:#ffffff;font-weight:700;margin:0 0 8px;letter-spacing:-.008em">Engage With MISMO to Shape the Future of the Mortgage Industry</div><div style="'+F+'font-size:15.5px;line-height:1.6;color:#a9d8f3;margin:0 0 20px">We have a chair at the table waiting for you.</div><a href="'+SUBSCRIBE_URL+'" style="'+F+'display:inline-block;'+(opt==="2"?'background:#1a8fe3;color:#ffffff;border:1px solid #2e9dee;':'background:#74bfeb;color:'+navy+';')+'text-decoration:none;font-weight:700;font-size:15px;line-height:1;padding:14px 24px;border-radius:3px;white-space:nowrap">Subscribe to MISMO Matters&nbsp;&rarr;</a></td></tr>'+
    emailFooter(F)+
    '</table></td></tr></table>';
  /* every build carries its version, so the copy in Informz can be checked against MISMO Media before sending */
  return '<!-- MISMO Matters '+monthName(ed.month)+' · version '+emailVersion(out)+' -->'+out;
}
function emailVersion(html){ let h=0; const t=String(html).replace(/<!-- MISMO Matters [^>]*-->/,""); for(let i=0;i<t.length;i++){ h=(h*31+t.charCodeAt(i))|0; } return (h>>>0).toString(36).toUpperCase().padStart(7,"0").slice(-7); }
/* The Unsubscribe link carries Informz's Unsubscribe_Web_Page marker (what its Hyperlink Tool makes for an External Link), so Informz accepts it as the required unsubscribe link while still sending people to MISMO's own page. */
/* Footer: the website's footer, nice and tight. Two halves sit side by side on a computer and stack on a phone. */
function emailFooter(F){
  const navy="#0d314c", I=HDR2_BASE;
  const half=(inner,align)=>'<div style="display:inline-block;vertical-align:middle;width:100%;max-width:272px;text-align:'+align+'">'+inner+'</div>';
  const left='<a href="https://collaborate.mismo.org/mismowebsite/home" style="text-decoration:none;display:inline-block"><img src="'+FOOT_LOGO+'" alt="MISMO" width="124" height="19" style="display:block;width:124px;height:auto;border:0" border="0"></a>'+
    '<div style="margin:8px 0 0;'+F+'font-size:12.5px;line-height:1.4;color:#456179">Where Our Industry Builds What&rsquo;s Next</div>';
  const right='<div style="'+F+'font-size:12.5px;line-height:1.55;color:#456179">1919 M Street NW, 5th Floor<br>Washington, DC 20036<br><img src="'+I+'ic-mail.png" alt="" width="12" height="12" style="display:inline-block;width:12px;height:12px;border:0;vertical-align:-1px" border="0">&nbsp;<a href="mailto:info@mismo.org" style="color:'+navy+';text-decoration:none;white-space:nowrap">info@mismo.org</a></div>'+
    '<div style="margin:8px 0 0;line-height:0"><a href="https://www.linkedin.com/company/mismo-mortgage-industry-standards-maintenance-organization" style="display:inline-block;text-decoration:none"><img src="'+I+'ic-li.png" alt="MISMO on LinkedIn" width="30" height="30" style="display:block;width:30px;height:30px;border:0" border="0"></a><a href="https://www.youtube.com/@MISMOStandards" style="display:inline-block;text-decoration:none;padding-left:8px"><img src="'+I+'ic-yt.png" alt="MISMO on YouTube" width="30" height="30" style="display:block;width:30px;height:30px;border:0" border="0"></a></div>';
  return '<tr><td bgcolor="#f4f7f9" style="background:#f4f7f9;padding:18px 24px 12px;border-top:1px solid #e5eef5;font-size:0">'+
    '<!--[if mso]><table role="presentation" width="552" cellpadding="0" cellspacing="0" border="0"><tr><td width="276" valign="middle"><![endif]-->'+half(left,"left")+
    '<!--[if mso]></td><td width="276" valign="middle" align="right"><![endif]-->'+half('<div style="padding:10px 0 0">'+right+'</div>',"right")+
    '<!--[if mso]></td></tr></table><![endif]-->'+
    '<div style="border-top:1px solid #e3ebf1;margin:14px 0 0;padding:10px 0 0;text-align:center;'+F+'font-size:11px;line-height:1.5;color:#56718a">You&rsquo;re getting MISMO Matters because you subscribed or take part in MISMO.&nbsp; <a name="Unsubscribe" data-informz-link-type="Unsubscribe_Web_Page" href="'+UNSUB_URL+'" style="color:#456179;text-decoration:underline;white-space:nowrap">Unsubscribe</a></div></td></tr>';
}
function buildText(ed){
  const on=edSections(ed).filter(s=>s.on); const out=["MISMO MATTERS — "+monthName(ed.month).toUpperCase(),""];
  on.forEach(s=>{ const d=s.doc, name=(d.name||s.meta.name).toUpperCase();
    let body=[];
    if(s.k==="micdup"){ const eps=epsInWindow(ed); if(!eps.length) return; if(d.intro) body.push(mdPlain(d.intro)); eps.forEach(e=>body.push("MISMO Mic’d Up "+epWord(e)+(e.title?": "+e.title:"")+(e.guests?" — with "+e.guests+(e.company?", "+e.company:""):"")+(e.youtubeUrl?"\n"+e.youtubeUrl:""))); }
    else if(s.k==="news"){ const ns=newsInWindow(ed); if(!ns.length) return; ns.forEach(n=>body.push((n.outlet?n.outlet+" – ":"")+n.headline+(n.url?"\n"+n.url:""))); }
    else if(isLogoSec(s.k) && logoPicks(ed,s.k).length){ body=logoWallText(ed,s); }
    else if(isCertSpot(s)){ body=certSpotlightText(ed,s); }
    else { if(!d.headline&&!d.body) return; if(d.headline) body.push(d.headline); paras(mdPlain(d.body)).forEach(p=>body.push(p)); if(d.quote) body.push("“"+mdPlain(d.quote)+"”"+(d.quoteBy?" — "+d.quoteBy:"")); const full=!d.noFull && fullArticleUrl(ed, s.k, d); if(full) body.push(fullArticleLabel(s.k)+": "+full); if(d.ctaUrl) body.push((d.ctaText||"Learn more")+": "+d.ctaUrl); }
    out.push("== "+name+" ==", ...body, "");
  });
  out.push("Subscribe: "+SUBSCRIBE_URL,"Unsubscribe: "+UNSUB_URL,"","MISMO · 1919 M Street NW, 5th Floor, Washington, DC 20036 · info@mismo.org","LinkedIn: https://www.linkedin.com/company/mismo-mortgage-industry-standards-maintenance-organization","YouTube: https://www.youtube.com/@MISMOStandards");
  return out.join("\n");
}
function previewView(ed){
  return '<div class="card"><div class="ch"><h2>How It Will Look</h2><div class="r"><div class="subtabs" style="margin:0" role="group" aria-label="Section header style"><button type="button" data-hs="1" aria-pressed="'+(hdrOpt(ed)==="1")+'">Option 1 · Original</button><button type="button" data-hs="2" aria-pressed="'+(hdrOpt(ed)==="2")+'">Option 2 · New</button></div><div class="subtabs" style="margin:0" role="group" aria-label="Preview size"><button type="button" data-dev="desk" aria-pressed="true">Desktop</button><button type="button" data-dev="phone" aria-pressed="false">Phone</button></div><button class="btn" type="button" id="pv-text">Copy Plain Text</button><button class="btn pri" type="button" id="pv-html">Copy HTML for Higher Logic</button></div></div>'+
    '<div class="cb"><div class="mailwrap"><div class="mail" id="pv-mail">'+buildEmail(ed,true)+'</div></div>'+
    '<p class="foot">Only sections that are running and have content appear. "Copy HTML" puts the whole email on your clipboard to paste into Higher Logic\'s HTML block. Each section has its own link, so a reader can share one story, and every section has a way back to the top. This build is version <b>'+esc(emailVersion(buildEmail(ed)))+'</b>; the same number is on the first line of the HTML, so you can check that Informz has the latest before sending.</p></div></div>';
}
function copyText(s, what){
  const done=()=>toast(what+" copied");
  try{ navigator.clipboard.writeText(s).then(done, ()=>fallbackCopy(s,what)); }catch(e){ fallbackCopy(s,what); }
}
function fallbackCopy(s,what){
  openPane({eye:"Copy", title:what, fields:[{k:"cp",label:"Select all and copy",type:"textarea",rows:18}], data:{cp:s}, noFocus:false, after:b=>{ const t=$("#f-cp",b); t.focus(); t.select(); }});
}
function pvFill(root){ $$("img[data-mmimg]",root).forEach(i=>{ const im=S.images[i.dataset.mmimg]; if(!im) return; imgEnsure(im).then(()=>{ const s=imgSrc(im); if(s) i.src=s; }); }); }
function bodyPicsNeedingLinks(ed){ let n=0; edSections(ed).filter(x=>x.on).forEach(x=>mdBlocks(x.doc.body).forEach(b=>{ if(b.t==="img"){ const r=rtImgInfo(b.ref); if(!r.hl) n++; } })); return n; }
function wirePreview(el,ed){
  pvFill(el);
  $$("[data-hs]",el).forEach(b=>b.onclick=async()=>{ const v=b.dataset.hs; if(hdrOpt(ed)===v) return;
    ed.hdrStyle=v; $$("[data-hs]",el).forEach(x=>x.setAttribute("aria-pressed",String(x===b))); $("#pv-mail",el).innerHTML=buildEmail(ed,true); pvFill(el);
    try{ await patch("editions",ed.id,{hdrStyle:v}); toast("Option "+v+" is what Copy HTML gives you now"); }catch(e){} });
  $("#pv-html",el).onclick=()=>{ copyText(buildEmail(ed),"HTML"); const need=edSections(ed).filter(x=>x.on && !x.doc.imageUrl && !(x.doc.imageLib&&S.images[x.doc.imageLib]&&S.images[x.doc.imageLib].hlUrl) && (x.doc.imageLib||x.doc.imageId)).length + bodyPicsNeedingLinks(ed) + logosNeedingLinks(ed); if(need) setTimeout(()=>toast("HTML copied. "+need+" picture"+(need===1?" still needs":"s still need")+" a Higher Logic image link, so "+(need===1?"it shows":"they show")+" as a placeholder box.", 7000), 900); };
  $("#pv-text",el).onclick=()=>copyText(buildText(ed),"Plain text");
  /* in the preview, Copy Link copies the section's web address rather than leaving MISMO Media */
  $("#pv-mail",el).addEventListener("click",e=>{ const a=e.target.closest("a[data-mm-copy]"); if(!a) return; e.preventDefault(); copyText(a.href,"Section link"); });
  $$("[data-dev]",el).forEach(b=>b.onclick=()=>{ $$("[data-dev]",el).forEach(x=>x.setAttribute("aria-pressed",String(x===b))); $(".mailwrap",el).classList.toggle("phone",b.dataset.dev==="phone"); });
}
function statsCalc(st){
  st=st||{}; const r=+st.recipients||0, dl=+st.delivered||r, o=+st.opens||0, c=+st.clicks||0;
  return {r,dl,o,c,u:+st.unsubs||0, openRate: dl?o/dl:0, ctr: dl?c/dl:0, cto: o?c/o:0};
}
const pct = x=>(x*100).toFixed(1)+"%";
function statsView(ed){
  const st=edStats(ed), c=statsCalc(st), has=!!c.r;
  const fun = has ? '<div class="funnel">'+[["Sent",c.r],["Delivered",c.dl],["Opened",c.o],["Clicked",c.c]].map(([l,v])=>'<div class="fr"><span>'+l+'</span><span class="bar"><i style="width:'+(c.r?Math.max(1,v/c.r*100):0)+'%"></i></span><span class="fv">'+v.toLocaleString()+'</span></div>').join("")+'</div>' : '';
  const top = (st.topLinks||"").split("\n").filter(Boolean);
  const rows = editionsSorted().filter(e=>+edStats(e).recipients).reverse().map(e=>{ const x=statsCalc(edStats(e)); return '<tr><td>'+esc(monthName(e.month))+'</td><td class="n">'+x.r.toLocaleString()+'</td><td class="n">'+pct(x.openRate)+'</td><td class="n">'+pct(x.ctr)+'</td><td class="n">'+pct(x.cto)+'</td><td class="n">'+x.u.toLocaleString()+'</td></tr>'; }).join("");
  return '<div class="grid2"><div class="card"><div class="ch"><h2>This Edition</h2><div class="r"><button class="btn pri" type="button" id="ms-stats">'+(has?"Update Stats":"Record Stats")+'</button></div></div>'+
    (has?'<div class="cb"><dl class="kv"><dt>Open Rate</dt><dd>'+pct(c.openRate)+'</dd><dt>Click Rate</dt><dd>'+pct(c.ctr)+'</dd><dt>Click to Open</dt><dd>'+pct(c.cto)+'</dd><dt>Unsubscribes</dt><dd>'+c.u.toLocaleString()+'</dd></dl></div>'+fun:'<div class="empty"><b>No stats yet.</b> A week after sending, copy the numbers from Higher Logic\'s marketing report into Record Stats. Axios never gave us these, so every edition from November on is the first real record.</div>')+
    '</div><div class="card"><div class="ch"><h2>Most-Clicked Links</h2></div>'+(top.length?'<div class="checks">'+top.map(l=>'<div class="chk"><span class="ct">'+linkify(l)+'</span></div>').join("")+'</div>':'<div class="empty">Add the top links when you record the stats.</div>')+'</div></div>'+
    (rows?'<div class="card"><div class="ch"><h2>Every Edition with Stats</h2></div><div class="tw"><table class="t"><thead><tr><th>Edition</th><th class="n">Sent To</th><th class="n">Open Rate</th><th class="n">Click Rate</th><th class="n">Click to Open</th><th class="n">Unsubscribes</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>':'');
}
function openStats(ed){
  openPane({eye:monthName(ed.month)+" · MISMO Matters", title:"Edition Stats", data:ed.stats||{},
    fields:[{sec:"From Higher Logic's Report"},{k:"recipients",label:"Sent To",type:"number"},{k:"delivered",label:"Delivered",type:"number"},{k:"opens",label:"Unique Opens",type:"number"},{k:"clicks",label:"Unique Clicks",type:"number"},{k:"unsubs",label:"Unsubscribes",type:"number"},{k:"bounces",label:"Bounces",type:"number"},
      {k:"topLinks",label:"Most-Clicked Links",type:"textarea",rows:5,ph:"One per line, e.g. Winter Summit registration — 212 clicks"}],
    save:async v=>{ await patch("editions",ed.id,{stats:v}); const done=Object.assign({},ed.done||{}); done.stats=true; const checks=Object.assign({},ed.checks||{}); checks.stats=true; await patch("editions",ed.id,{done,checks}); }});
}
function archiveTable(){
  const list=editionsSorted().slice().reverse();
  return '<div class="card"><div class="ch"><h2>Which Sections Ran</h2><span class="cnt">'+list.length+' editions</span></div><div class="tw"><table class="t"><thead><tr><th>Edition</th><th>Sent</th>'+SECTIONS.map(s=>'<th title="'+esc(s.name)+'" style="text-align:center">'+s.ab+'</th>').join("")+'<th class="n">Words</th></tr></thead><tbody>'+
    list.map(e=>{ const ran = e.archived ? (e.sectionsRun||[]) : edSections(e).filter(s=>s.on).map(s=>s.k); return '<tr class="click" data-ed="'+esc(e.id)+'"><td><b>'+esc(monthName(e.month))+'</b>'+(e.archived?'<span class="t2">Axios</span>':'<span class="t2">Higher Logic</span>')+'</td><td>'+esc(fD(e.dates&&e.dates.publish))+'</td>'+SECTIONS.map(s=>'<td style="text-align:center"><span class="mx'+(ran.includes(s.key)?" on":"")+'" title="'+esc(s.name)+'"></span></td>').join("")+'<td class="n">'+(e.words?(+e.words).toLocaleString():"—")+'</td></tr>'; }).join("")+
    '</tbody></table></div></div><p class="foot">'+SECTIONS.map(s=>s.ab+" "+s.name).join(" · ")+'</p>';
}
function archiveView(ed){
  const ran=ed.sectionsRun||[];
  return '<div class="grid2"><div class="card"><div class="ch"><h2>Sections That Ran</h2><span class="cnt">'+ran.length+' of 13</span></div><div class="checks">'+
    SECTIONS.map(s=>'<div class="chk'+(ran.includes(s.key)?"":" done")+'"><span class="mx'+(ran.includes(s.key)?" on":"")+'" style="margin-top:2px"></span><span class="ct"><b>'+esc(s.name)+'</b>'+(ran.includes(s.key)?'':'<small>Did not run</small>')+'</span></div>').join("")+
    '</div></div><div class="card"><div class="ch"><h2>About This Edition</h2></div><div class="cb"><dl class="kv"><dt>Sent</dt><dd>'+esc(fL(ed.dates.publish))+'</dd><dt>Byline</dt><dd>'+esc(ed.byline||"Amy Moses")+'</dd><dt>Length</dt><dd>'+(ed.words?(+ed.words).toLocaleString()+" words":"—")+'</dd><dt>Lead Story</dt><dd>'+esc(ed.lead||"—")+'</dd><dt>Read It</dt><dd>'+(ed.url?'<a href="'+esc(ed.url)+'" target="_blank" rel="noopener">Open in Axios</a>':"—")+'</dd></dl>'+(ed.notes?'<div class="note rt-view" style="margin-top:12px">'+mdHtml(ed.notes)+'</div>':'')+'</div></div></div>';
}
