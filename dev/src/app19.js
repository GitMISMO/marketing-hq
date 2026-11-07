/* ================= Logo walls: New Member Welcome and Thank You to Our Sponsors =================
   Instead of one flat picture of logos, Kelly picks each logo from the Image Library (tagged
   "Member & Sponsor Logos"). Each logo carries its company name, its level or tier, and its website,
   and the email draws them as a grid of white logo cards on a branded band. The company details are
   remembered on the logo in the Image Library, so next time it fills itself in. Sponsors carry over
   from the month before until someone changes them. */
const LOGO_SECS = {
  welcome:{eye:"Welcome to the Community", head:"Please Welcome Our Newest Members",
    intro:"These organizations joined MISMO this month. We're glad to have you at the table and can't wait to build what's next together.",
    groups:["Corporate Members","Sole Members","Affiliate Members","Government Members"], word:"Level", carry:false},
  thanks:{eye:"With Gratitude", head:"Thank You to Our Sponsors",
    intro:"MISMO's work is made possible by the organizations that support it. Thank you to our sponsors for helping the industry build what's next.",
    groups:["Platinum Sponsors","Gold Sponsors","Silver Sponsors","Bronze Sponsors","Summit Sponsors"], word:"Tier", carry:true}
};
function isLogoSec(k){ return !!LOGO_SECS[k]; }
function prevEditionOf(ed){ return vals("editions").filter(e=>e.month && e.month<ed.month && !e.archived).sort((a,b)=>a.month<b.month?1:-1)[0]||null; }
/* the logos for a section: what's saved, or (sponsors) last month's */
function logoPicks(ed, k){
  const d=S.sections[ed.month+"__"+k]||{};
  if(Array.isArray(d.logos)) return d.logos.filter(l=>l && l.id && S.images[l.id]);
  if(LOGO_SECS[k] && LOGO_SECS[k].carry){ const p=prevEditionOf(ed); if(p){ const pd=S.sections[p.month+"__"+k]; if(pd && Array.isArray(pd.logos)) return pd.logos.filter(l=>l && l.id && S.images[l.id]); } }
  return [];
}
function logosNeedingLinks(ed){ let n=0; edSections(ed).filter(x=>x.on && isLogoSec(x.k)).forEach(x=>logoPicks(ed,x.k).forEach(l=>{ const im=S.images[l.id]; if(!im || !im.hlUrl) n++; })); return n; }
function logoGroups(list){ const g=[]; list.forEach(l=>{ const k=(l.group||"").trim(); let x=g.find(y=>y.k===k); if(!x){ x={k, items:[]}; g.push(x); } x.items.push(l); }); return g; }

/* ---------- the email ---------- */
function logoWall(ed, s, preview){
  const cfg=LOGO_SECS[s.k], d=s.doc, list=logoPicks(ed,s.k);
  const F="font-family:'IBM Plex Sans','Segoe UI',Helvetica,Arial,sans-serif;", M="font-family:'IBM Plex Mono',Consolas,Menlo,monospace;";
  const navy="#0d314c", ink="#1d2b36", dark=s.k==="welcome";
  const eyeC=dark?"#74bfeb":"#2477b8", headC=dark?"#ffffff":navy, txtC=dark?"#cfe6f6":ink, grpC=dark?"#a9d8f3":"#5d7d95", cardB=dark?"#ffffff":"#dde9f2";
  const intro=d.body ? mdEmail(d.body, F+'font-size:16px;line-height:1.65;margin:0 0 12px;color:'+txtC, 'color:'+(dark?"#ffffff":"#14486e")+';font-weight:600;text-decoration:underline', {}) : '<p style="'+F+'font-size:16px;line-height:1.65;margin:0 0 12px;color:'+txtC+'">'+esc(cfg.intro).replace(/'/g,"&rsquo;")+'</p>';
  const logo=l=>{ const im=S.images[l.id]||{}; const hl=im.hlUrl||"", src=hl||(preview?imgSrc(im):"");
    const ar=(+im.w && +im.h) ? im.w/im.h : 2.6, h=ar>=2.2?58:ar>=1.4?70:84, w=Math.round(Math.max(64,Math.min(200,h*ar)));
    const inner = src
      ? '<img src="'+esc(src)+'" alt="'+esc(l.name||im.name||"")+'" width="'+w+'" style="display:block;margin:0 auto;width:'+w+'px;max-width:100%;height:auto;border:0'+(hl?'':';outline:2px dashed #e0a440;outline-offset:3px')+'" border="0"'+(hl||src?'':' data-mmimg="'+esc(l.id)+'"')+'>'
      : '<div style="'+F+'font-size:18px;line-height:1.3;font-weight:700;color:'+navy+'">'+esc(l.name||im.name||"")+'</div>';
    const linked = safeHref(l.url) ? '<a href="'+esc(safeHref(l.url))+'" style="text-decoration:none;display:block">'+inner+'</a>' : inner;
    return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" valign="middle" bgcolor="#ffffff" height="112" style="background:#ffffff;border:1px solid '+cardB+';'+(dark?'border-top:3px solid #74bfeb;':'')+'border-radius:6px;padding:16px 10px;height:112px;text-align:center">'+linked+'</td></tr></table>'; };
  const grid=items=>{ let rows=''; for(let i=0;i<items.length;i+=2){ const a=items[i], b=items[i+1];
      rows+= b ? '<tr><td width="50%" valign="top" style="padding:5px">'+logo(a)+'</td><td width="50%" valign="top" style="padding:5px">'+logo(b)+'</td></tr>'
               : '<tr><td colspan="2" align="center" style="padding:6px"><table role="presentation" width="50%" cellpadding="0" cellspacing="0" border="0" style="width:50%;margin:0 auto"><tr><td>'+logo(a)+'</td></tr></table></td></tr>'; }
    return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">'+rows+'</table>'; };
  /* sponsors: a compact wall, several logos across, sized and colored by tier (Platinum largest), so even a long
     sponsor list stays short. The last row of a tier is centered. */
  const TIERS={platinum:{m:4,h:78,lh:44,lw:120,c:"#9fb0be"}, gold:{m:3,h:72,lh:42,lw:132,c:"#d4a92e"}, silver:{m:4,h:66,lh:36,lw:112,c:"#aab4bd"},
    bronze:{m:5,h:60,lh:32,lw:124,c:"#c4763a"}, other:{m:4,h:66,lh:36,lw:112,c:"#74bfeb"}};
  const tierOf=g=>{ const t=String(g||"").toLowerCase(); return t.includes("platinum")?"platinum":t.includes("gold")?"gold":t.includes("silver")?"silver":t.includes("bronze")?"bronze":"other"; };
  const logoC=(l,T)=>{ const im=S.images[l.id]||{}; const hl=im.hlUrl||"", src=hl||(preview?imgSrc(im):"");
    const ar=(+im.w && +im.h) ? im.w/im.h : 2.6, w=Math.round(Math.max(36, Math.min(T.lw, T.lh*ar)));
    const inner = src
      ? '<img src="'+esc(src)+'" alt="'+esc(l.name||im.name||"")+'" width="'+w+'" style="display:block;margin:0 auto;width:'+w+'px;max-width:100%;height:auto;border:0'+(hl?'':';outline:2px dashed #e0a440;outline-offset:3px')+'" border="0">'
      : '<div style="'+F+'font-size:13px;line-height:1.25;font-weight:700;color:'+navy+'">'+esc(l.name||im.name||"")+'</div>';
    const linked = safeHref(l.url) ? '<a href="'+esc(safeHref(l.url))+'" style="text-decoration:none;display:block">'+inner+'</a>' : inner;
    return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" valign="middle" bgcolor="#ffffff" height="'+T.h+'" style="background:#ffffff;border:1px solid #dde9f2;border-top:3px solid '+T.c+';border-radius:5px;padding:8px 6px;height:'+T.h+'px;text-align:center">'+linked+'</td></tr></table>'; };
  const gridC=(items,T)=>{ const n=items.length, rows=Math.ceil(n/T.m), c=Math.max(Math.ceil(n/rows), Math.min(T.m,3)); let out='';
    for(let i=0;i<n;i+=c){ const row=items.slice(i,i+c), pct=(100/row.length).toFixed(2), tw=Math.round(row.length/c*100);
      out+='<table role="presentation" align="center" width="'+tw+'%" cellpadding="0" cellspacing="0" border="0" style="width:'+tw+'%;margin:0 auto"><tr>'+
        row.map(l=>'<td width="'+pct+'%" valign="top" style="padding:3px;width:'+pct+'%">'+logoC(l,T)+'</td>').join("")+'</tr></table>'; }
    return out; };
  const groups=logoGroups(list), many=groups.length>1 || (groups[0] && groups[0].k);
  if(!dark){ const body=groups.map(g=>{ const T=TIERS[tierOf(g.k)];
      return (many && g.k ? '<div style="'+M+'font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:'+grpC+';font-weight:600;margin:12px 0 3px;text-align:center"><span style="color:'+T.c+'">&#9632;</span>&nbsp;'+esc(g.k)+'</div>' : '')+gridC(g.items,T); }).join("");
    const introC=d.body ? mdEmail(d.body, F+'font-size:15px;line-height:1.55;margin:0 0 4px;color:'+txtC, 'color:#14486e;font-weight:600;text-decoration:underline', {}) : '<p style="'+F+'font-size:15px;line-height:1.55;margin:0 0 4px;color:'+txtC+'">'+esc(cfg.intro).replace(/'/g,"&rsquo;")+'</p>';
    const ctaC = d.ctaUrl ? '<p style="margin:14px 0 2px;text-align:center"><a href="'+esc(safeHref(d.ctaUrl))+'" style="'+F+'display:inline-block;background:'+navy+';color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;line-height:1;padding:12px 20px;border-radius:3px;white-space:nowrap">'+esc(d.ctaText||"Learn More")+'&nbsp;&rarr;</a></p>' : '';
    return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px"><tr><td align="center" bgcolor="#f4f9fd" style="background:#f4f9fd;border:1px solid #dde9f2;border-top:4px solid #74bfeb;border-radius:8px;padding:20px 10px 14px;text-align:center">'+
      '<div style="'+M+'font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:'+eyeC+';font-weight:600;margin:0 0 6px">&#9670;&nbsp;&nbsp;'+esc(cfg.eye)+'&nbsp;&nbsp;&#9670;</div>'+
      '<div style="'+F+'font-size:23px;line-height:1.2;letter-spacing:-.014em;color:'+headC+';font-weight:700;margin:0 0 6px;padding:0 8px">'+esc(d.headline||cfg.head)+'</div>'+
      '<div style="padding:0 14px;max-width:500px;margin:0 auto">'+introC+'</div>'+body+ctaC+'</td></tr></table>'; }
  const body=groups.map(g=>(many && g.k ? '<div style="'+M+'font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:'+grpC+';font-weight:600;margin:18px 0 4px;text-align:center">'+esc(g.k)+(s.k==="welcome"?'&nbsp;&middot;&nbsp;'+g.items.length:'')+'</div>' : '')+grid(g.items)).join("");
  const rule='<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:6px auto 4px"><tr><td width="48" height="3" bgcolor="#74bfeb" style="width:48px;height:3px;background:#74bfeb;font-size:0;line-height:0">&nbsp;</td></tr></table>';
  const cta = d.ctaUrl ? '<p style="margin:18px 0 4px;text-align:center"><a href="'+esc(safeHref(d.ctaUrl))+'" style="'+F+'display:inline-block;background:'+(dark?'#1a8fe3':navy)+';color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;line-height:1;padding:14px 24px;border-radius:3px;white-space:nowrap">'+esc(d.ctaText||"Learn More")+'&nbsp;&rarr;</a></p>' : '';
  const box = dark
    ? 'bgcolor="'+navy+'" style="background:'+navy+';background-image:linear-gradient(180deg,#0d314c 0%,#0d314c 38%,#123f63 74%,#17507a 100%);border-radius:8px;padding:14px 12px 24px;text-align:center"'
    : 'bgcolor="#f4f9fd" style="background:#f4f9fd;border:1px solid #dde9f2;border-top:4px solid #74bfeb;border-radius:8px;padding:28px 12px 22px;text-align:center"';
  /* the welcome band opens with a small looping animation (sparkles drifting around a "new member" badge);
     Outlook shows its first frame, which is a finished picture on its own */
  const burst = dark ? '<img src="'+HDR2_BASE+'welcome-burst.gif" alt="" width="520" style="display:block;width:100%;max-width:520px;height:auto;margin:0 auto 6px;border:0" border="0">' : '';
  const outro = dark ? '<div style="'+F+'font-size:14px;line-height:1.55;color:#a9d8f3;margin:18px 0 0;padding:0 10px">Say hello when you see them in a workgroup or at the next MISMO Summit.</div>' : '';
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px"><tr><td align="center" '+box+'>'+burst+
    '<div style="'+M+'font-size:11.5px;letter-spacing:.2em;text-transform:uppercase;color:'+eyeC+';font-weight:600;margin:0 0 10px">&#9670;&nbsp;&nbsp;'+esc(cfg.eye)+'&nbsp;&nbsp;&#9670;</div>'+
    '<div style="'+F+'font-size:26px;line-height:1.22;letter-spacing:-.014em;color:'+headC+';font-weight:700;margin:0 0 10px;padding:0 8px">'+esc(d.headline||cfg.head)+'</div>'+rule+
    '<div style="padding:8px 14px 0;max-width:470px;margin:0 auto">'+intro+'</div>'+body+outro+cta+'</td></tr></table>';
}
function logoWallText(ed, s){
  const cfg=LOGO_SECS[s.k], d=s.doc, out=[d.headline||cfg.head, d.body?mdPlain(d.body):cfg.intro];
  logoGroups(logoPicks(ed,s.k)).forEach(g=>{ if(g.k) out.push(g.k+":"); g.items.forEach(l=>out.push("• "+(l.name||(S.images[l.id]||{}).name||"")+(l.url?" – "+l.url:""))); });
  if(d.ctaUrl) out.push((d.ctaText||"Learn more")+": "+d.ctaUrl);
  return out;
}

/* ---------- the section pane ---------- */
function wireLogos(b, doc, ed, k){
  const cfg=LOGO_SECS[k], box=$("#lg-box",b); if(!box) return;
  let list=logoPicks(ed,k).map(l=>Object.assign({},l)), pickOpen=false, pickQ="";
  const carried = !Array.isArray(doc.logos) && list.length;
  const dirty=()=>{ if(PANE) PANE.dirty=true; };
  PANE.logos=()=>list;
  /* sponsors: kept in step with the Sponsorship Portal unless someone unticks it */
  let auto = k==="thanks" ? doc.sponsorsAuto!==false : null;
  if(k==="thanks") PANE.sponsorsAuto=()=>auto;
  const manual=()=>{ if(k==="thanks" && auto){ auto=false; toast("Changed by hand, so this edition stops following the Sponsorship Portal. Tick the box to go back.", 4500); } };
  const prev=prevEditionOf(ed), prevList=prev? (S.sections[prev.month+"__"+k]||{}).logos : null;
  const thumb=im=>{ const src=imgThumb(im); if(!src) imgEnsureThumb(im).then(()=>{ const s=imgThumb(im); $$('[data-lgthumb="'+im.id+'"]').forEach(x=>{ if(s) x.innerHTML='<img src="'+esc(s)+'" alt="">'; }); }); return '<span class="lg-thumb" data-lgthumb="'+esc(im.id)+'">'+(src?'<img src="'+esc(src)+'" alt="">':'')+'</span>'; };
  const draw=()=>{
    const sp = k==="thanks" ? '<div class="lg-sp"><label><input type="checkbox" id="lg-auto"'+(auto?' checked':'')+'> Keep in step with the Sponsorship Portal</label>'+
      (auto ? '<div class="hint">'+(doc.sponsorsFrom?'The '+esc(doc.sponsorsFrom)+' Summit sponsors (approved, paid or in kind), grouped by tier. New sponsors and their logos come in by themselves.':'Fills itself from the Sponsorship Portal\'s approved sponsors for the next Summit.')+'</div>'+
        ((doc.sponsorsMissing||[]).length?'<div class="lg-miss"><b>No logo yet:</b> '+doc.sponsorsMissing.map(esc).join(", ")+'. Add it to the Image Library (Member Logos) or upload it here, and it joins the wall.</div>':'')
        : '<div class="hint">Changed by hand. Tick the box to go back to the Sponsorship Portal\'s list.</div>')+'</div>' : '';
    box.innerHTML=sp+
      (carried && !auto?'<div class="hint">Carried over from '+esc(monthName(prev.month))+'. Change anything and press Save to make this month its own.</div>':'')+
      (list.length?'<div class="lg-list">'+list.map((l,i)=>{ const im=S.images[l.id]||{};
        return '<div class="lg-row" data-i="'+i+'">'+thumb(im)+'<div class="lg-f">'+
          '<input type="text" data-f="name" value="'+esc(l.name||"")+'" placeholder="Company name" aria-label="Company name">'+
          '<input type="text" data-f="group" value="'+esc(l.group||"")+'" list="lg-groups-'+k+'" placeholder="'+cfg.word+', e.g. '+esc(cfg.groups[0])+'" aria-label="'+cfg.word+'">'+
          '<input type="url" data-f="url" value="'+esc(l.url||"")+'" placeholder="Website (optional) https://" aria-label="Website">'+
          (im.hlUrl?'':'<small class="lg-warn">Needs its Higher Logic link before Copy HTML (shows the company name until then).</small>')+
          '</div><div class="lg-mv"><button type="button" class="btn sm" data-mv="-1" aria-label="Move up"'+(i?'':' disabled')+'>↑</button><button type="button" class="btn sm" data-mv="1" aria-label="Move down"'+(i<list.length-1?'':' disabled')+'>↓</button><button type="button" class="btn sm" data-rm aria-label="Remove">Remove</button></div></div>'; }).join("")+'</div>'
        :'<div class="empty" style="padding:14px">No logos yet. Add them from the Image Library, or upload new ones.</div>')+
      '<div class="lg-acts"><button type="button" class="btn sm pri" id="lg-add">Add Logos from the Image Library</button>'+
      (ASSETS?'<button type="button" class="btn sm" id="lg-up">Upload New Logos</button><input type="file" id="lg-file" accept="image/*" multiple hidden>':'')+
      (cfg.carry && prevList && prevList.length?'<button type="button" class="btn sm" id="lg-prev">Same as '+esc(MONL[+prev.month.slice(5)-1])+'</button>':'')+'</div>'+
      '<div id="lg-pick" hidden><input type="search" id="lg-q" placeholder="Search the Image Library" aria-label="Search the Image Library"><div class="imstrip" id="lg-strip"></div><div class="hint">Logos tagged Member &amp; Sponsor Logos come first. Click one to add it.</div></div>'+
      '<datalist id="lg-groups-'+k+'">'+cfg.groups.map(g=>'<option value="'+esc(g)+'">').join("")+'</datalist>';
    $$(".lg-row",box).forEach(r=>{ const i=+r.dataset.i;
      $$("[data-f]",r).forEach(inp=>inp.oninput=()=>{ list[i][inp.dataset.f]=inp.value; if(inp.dataset.f!=="url") manual(); dirty(); });
      $$("[data-f]",r).forEach(inp=>inp.onchange=()=>{ if(k==="thanks" && inp.dataset.f!=="url") draw(); });
      $$("[data-mv]",r).forEach(btn=>btn.onclick=()=>{ const j=i+(+btn.dataset.mv); if(j<0||j>=list.length) return; [list[i],list[j]]=[list[j],list[i]]; manual(); dirty(); draw(); });
      $("[data-rm]",r).onclick=()=>{ list.splice(i,1); manual(); dirty(); draw(); };
    });
    const add=im=>{ if(list.some(l=>l.id===im.id)){ toast("That logo is already here"); return; } const last=list[list.length-1];
      list.push({id:im.id, name:im.company||im.name||"", group:im.group||(last&&last.group)||"", url:im.site||""}); manual(); dirty(); draw(); toast("Added "+(im.company||im.name||"logo")); };
    const pick=$("#lg-pick",box), strip=$("#lg-strip",box), q=$("#lg-q",box);
    const fill=()=>{ const t=(q.value||"").toLowerCase();
      const all=vals("images").filter(i=>!i.archived && !isFile(i) && (!t || ((i.company||"")+" "+(i.name||"")+" "+(i.file||"")).toLowerCase().includes(t)))
        .sort((a,c)=>((a.campaign==="logos"?0:1)-(c.campaign==="logos"?0:1)) || ((a.at||"")<(c.at||"")?1:-1)).slice(0,40);
      strip.innerHTML=all.length?all.map(im=>{ const src=imgThumb(im); return '<button type="button" class="impick lgpick'+(src?"":" loading")+'" data-pick="'+esc(im.id)+'" title="'+esc(im.company||im.name||"")+'">'+(src?'<img src="'+esc(src)+'" alt="">':'<span>'+esc((im.name||im.file||"").slice(0,28))+'</span>')+'</button>'; }).join(""):'<div class="hint">Nothing matches.</div>';
      all.forEach(im=>{ if(!imgThumb(im)) imgEnsureThumb(im).then(()=>{ const s=imgThumb(im); $$('.lgpick[data-pick="'+im.id+'"]',strip).forEach(x=>{ if(s){ x.innerHTML='<img src="'+esc(s)+'" alt="">'; x.classList.remove("loading"); } }); }); });
      $$("[data-pick]",strip).forEach(p=>p.onclick=()=>{ const im=S.images[p.dataset.pick]; if(im) add(im); }); };
    $("#lg-add",box).onclick=()=>{ pickOpen=!pickOpen; pick.hidden=!pickOpen; if(pickOpen){ fill(); q.focus(); } };
    q.value=pickQ; q.oninput=()=>{ pickQ=q.value; fill(); };
    if(pickOpen){ pick.hidden=false; fill(); }
    const up=$("#lg-up",box), f=$("#lg-file",box);
    if(up) up.onclick=()=>f.click();
    if(f) f.onchange=async()=>{ const made=await addImages([...f.files],{campaign:"logos", edition:""}); made.forEach(im=>add(im)); if(made.length) toast(made.length+" logo"+(made.length===1?"":"s")+" added here and to the Image Library. Press Save to keep them."); };
    const au=$("#lg-auto",box); if(au) au.onchange=()=>{ auto=au.checked; if(auto) SPN.at=0; dirty(); draw(); };
    const pv=$("#lg-prev",box); if(pv) pv.onclick=()=>{ list=prevList.filter(l=>S.images[l.id]).map(l=>Object.assign({},l)); dirty(); draw(); toast("Copied "+monthName(prev.month)+"'s sponsors"); };
  };
  draw();
}
/* after a save: remember each logo's company, level and website on the logo itself */
async function rememberLogos(list){
  for(const l of list||[]){ const im=S.images[l.id]; if(!im) continue; const v={};
    if(l.name && l.name!==im.company) v.company=l.name; if((l.url||"")!==(im.site||"") && l.url) v.site=l.url; if(l.group && l.group!==im.group) v.group=l.group;
    if(im.campaign!=="logos" && im.campaign!=="brand") v.campaign="logos";
    if(Object.keys(v).length){ try{ await patch("images", l.id, v); }catch(e){} } }
}
