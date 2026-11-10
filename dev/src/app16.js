/* ================= formatted text boxes =================
   Body copy, notes and details boxes work like a small Word document: Bold, Italic, Links,
   bulleted and numbered lists. What is saved stays readable plain text (a light markdown):
     **bold**   *italic*   [link text](https://…)   "- " bullets   "1. " numbered
   so search, word counts, the AI writers and every plain-text copy keep working, and the
   Mailchimp/newsletter HTML shows the real formatting. */

const RT_SAFE_URL = /^(https?:|mailto:|tel:)/i;
/* safeHref: what any typed-in link goes through before it becomes an href (review, Nov 7 2026) */
function safeHref(u){ const v=rtUrl(u); return /^(https?:|mailto:|tel:)/i.test(v)?v:""; }
function rtUrl(u){ u=String(u||"").trim(); if(!u) return ""; if(/^www\./i.test(u)) u="https://"+u; u=u.replace(/^(mailto:)+/i,"mailto:"); if(!/^[a-z][a-z0-9+.-]*:/i.test(u) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u)) u="mailto:"+u; return RT_SAFE_URL.test(u)?u:""; }

/* inline: **bold**, *italic*, [text](url), bare links. `aStyle` adds inline styles for email. */
function mdInline(s, aStyle){
  const links=[];
  let t=String(s||"").replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g,(m,txt,u)=>{ const url=rtUrl(u); if(!url) return m; links.push([txt,url]); return "\u0000"+(links.length-1)+"\u0000"; });
  t=esc(t);
  t=t.replace(/\*\*([^*\n](?:[^*\n]|\*(?!\*))*?)\*\*/g,"<b>$1</b>")
     .replace(/(^|[^*\w])\*([^\s*](?:[^*\n]*?[^\s*])?)\*(?!\w)/g,"$1<i>$2</i>")
     .replace(/(^|[\s(>])((?:https?:\/\/|www\.)[^\s<]+[^\s<.,;:!?)])/g,(m,pre,u)=>pre+'<a href="'+esc(rtUrl(u.replace(/&amp;/g,"&")))+'"'+(aStyle?' style="'+aStyle+'"':' target="_blank" rel="noopener"')+'>'+u+'</a>');
  t=t.replace(/(^|[\s(>;])([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})(?=$|[\s).,;:!?<&])/g,(m,pre,e)=>pre+'<a href="mailto:'+e+'"'+(aStyle?' style="'+aStyle+'"':'')+'>'+e+'</a>');
  t=t.replace(/\u0000(\d+)\u0000/g,(m,i)=>{ const [txt,url]=links[+i]; return '<a href="'+esc(url)+'"'+(aStyle?' style="'+aStyle+'"':' target="_blank" rel="noopener"')+'>'+mdInline(txt).replace(/<\/?a[^>]*>/g,"")+'</a>'; });
  return t;
}
const RT_UL=/^\s*(?:[-*•–])\s+/, RT_OL=/^\s*\d+[.)]\s+/;
/* a picture on its own line: ![description](lib:IMAGE_ID "half") or ![description](https://… ) */
const RT_IMG=/^\s*!\[([^\]\n]*)\]\(([^)\s]+)(?:\s+"(full|half)")?\)\s*$/;
function rtImgMd(alt,ref,size){ return "!["+String(alt||"").replace(/[\[\]\n]/g," ").trim()+"]("+ref+(size==="half"?' "half"':'')+")"; }
/* what a picture reference points at: the library record (if any), what to show here, and its public Higher Logic link */
function rtImgInfo(ref){
  const m=/^lib:(.+)$/.exec(ref||"");
  if(m){ const im=S.images && S.images[m[1]]; return {im, id:m[1], src:im?imgSrc(im):"", hl:im&&im.hlUrl||"", name:im?(im.name||im.file||""):"(picture removed from the library)"}; }
  return {im:null, id:"", src:rtUrl(ref), hl:rtUrl(ref), name:""};
}
/* blocks: paragraphs (blank line apart), single line breaks, bullet and numbered lists */
function mdBlocks(s){
  const out=[]; let para=[], list=null;
  const flushP=()=>{ if(para.length){ out.push({t:"p",lines:para}); para=[]; } };
  const flushL=()=>{ if(list){ out.push(list); list=null; } };
  String(s||"").replace(/\r/g,"").split("\n").forEach(line=>{
    if(!line.trim()){ flushP(); flushL(); return; }
    const pic=RT_IMG.exec(line); if(pic){ flushP(); flushL(); out.push({t:"img", alt:pic[1].trim(), ref:pic[2], size:pic[3]||"full"}); return; }
    const ul=RT_UL.test(line), ol=!ul && RT_OL.test(line);
    if(ul||ol){ flushP(); const t=ul?"ul":"ol"; if(!list||list.t!==t){ flushL(); list={t,items:[]}; } list.items.push(line.replace(ul?RT_UL:RT_OL,"")); return; }
    if(list && /^\s{2,}/.test(line)){ list.items[list.items.length-1]+="\n"+line.trim(); return; }
    flushL(); para.push(line);
  });
  flushP(); flushL(); return out;
}
/* For the page itself (cards, notes, request details). */
function mdHtml(s){
  return mdBlocks(s).map(b=>b.t==="img" ? (()=>{ const r=rtImgInfo(b.ref); return '<figure class="rt-vfig'+(b.size==="half"?" half":"")+'">'+(r.src?'<img src="'+esc(r.src)+'" alt="'+esc(b.alt)+'">':'<span>Picture: '+esc(b.alt||r.name)+'</span>')+'</figure>'; })() : b.t==="p" ? '<p>'+b.lines.map(l=>mdInline(l)).join("<br>")+'</p>'
    : '<'+b.t+'>'+b.items.map(i=>'<li>'+mdInline(i).replace(/\n/g,"<br>")+'</li>').join("")+'</'+b.t+'>').join("");
}
/* For email HTML: every tag carries its own inline style. */
/* A paragraph that is one bold line on its own becomes a subheading (opt.h3 = its style). */
const RT_HEAD=/^\*\*([^*\n]{1,140})\*\*:?$/;
function mdEmail(s, pStyle, aStyle, opt){
  opt=opt||{};
  return mdBlocks(s).map(b=>{
    if(b.t==="img") return opt.img ? opt.img(b) : '';
    if(b.t==="p"){
      if(opt.h3 && b.lines.length===1 && RT_HEAD.test(b.lines[0].trim())) return '<h3 style="'+opt.h3+'">'+mdInline(b.lines[0].trim().replace(RT_HEAD,"$1"),aStyle)+'</h3>';
      return '<p style="'+pStyle+'">'+b.lines.map(l=>mdInline(l,aStyle)).join("<br>")+'</p>';
    }
    /* lists are drawn as a two-column table (marker, text): Outlook on Windows adds its own indent to real lists */
    const cs=String(opt.li||pStyle).replace(/(^|;)\s*margin:[^;]*/g,"$1").replace(/;;+/g,";");
    return emGap('<table role="presentation" width="100%" cellpadding="0" cellspacing="0">'+b.items.map((i,n)=>
      '<tr><td width="22" valign="top" style="'+cs.replace(/font-family:[^;]*;?/,"")+';width:22px;padding:0 0 8px 2px">'+(b.t==="ol"?(n+1)+'.':'&bull;')+'</td><td valign="top" style="'+cs+';padding:0 0 8px">'+mdInline(i,aStyle).replace(/\n/g,"<br>")+'</td></tr>').join("")+'</table>', 0, 6);
  }).join("");
}
/* Plain text, for places that can't show formatting (LinkedIn, text copies, short snippets). */
function mdPlain(s){
  let n=0;
  return String(s||"").replace(/\r/g,"").split("\n").map(line=>{
    const pic=RT_IMG.exec(line); if(pic) return "[Picture"+(pic[1].trim()?": "+pic[1].trim():"")+"]";
    if(RT_UL.test(line)){ n=0; line="• "+line.replace(RT_UL,""); }
    else if(RT_OL.test(line)){ n++; line=n+". "+line.replace(RT_OL,""); }
    else if(line.trim()) n=0;
    return line.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g,(m,t,u)=>t===u?u:t+" ("+u+")").replace(/\*\*([^*\n]+?)\*\*/g,"$1").replace(/(^|[^*\w])\*([^\s*](?:[^*\n]*?[^\s*])?)\*(?!\w)/g,"$1$2");
  }).join("\n");
}

/* ---- the editor: what you see in the box, read back to the light markdown ---- */
function rtFromDom(root){
  const isBlock=n=>n.nodeType===1 && /^(P|DIV|UL|OL|LI|H[1-6]|BLOCKQUOTE|PRE|TABLE|TR|FIGURE)$/.test(n.nodeName);
  const figMd=n=>n.dataset && n.dataset.ref ? rtImgMd(n.dataset.alt, n.dataset.ref, n.dataset.size) : "";
  function inline(n, st){
    if(n.nodeType===3) return n.nodeValue.replace(/ /g," ").replace(/[\r\n]+/g," ");
    if(n.nodeType!==1) return "";
    const tag=n.nodeName, css=(n.getAttribute("style")||"").toLowerCase();
    if(tag==="BR") return "\n";
    if(/^(STYLE|SCRIPT|META|TITLE|O:P)$/.test(tag)) return "";
    if(tag==="FIGURE") return "\n"+figMd(n)+"\n";
    if(tag==="IMG"){ const u=rtUrl(n.getAttribute("src")); return u && !/^blob:|\/_blob\//.test(u) ? "\n"+rtImgMd(n.getAttribute("alt"),u)+"\n" : ""; }
    if(isBlock(n)) return "\n"+kids(n,st)+"\n";
    const bold=!st.b && (tag==="B"||tag==="STRONG"||/font-weight\s*:\s*(bold|[6-9]00)/.test(css));
    const ital=!st.i && (tag==="I"||tag==="EM"||/font-style\s*:\s*italic/.test(css));
    let t=kids(n,{b:st.b||bold,i:st.i||ital,a:st.a||tag==="A"});
    if(tag==="A" && !st.a){ const u=rtUrl(n.getAttribute("href")); const txt=t.trim(); if(u && txt) t=(txt===u && /^https?:/i.test(u)) ? txt : "["+txt.replace(/[[\]]/g,"")+"]("+u+")"; }
    const wrap=(t,m)=>{ const a=t.match(/^\s*/)[0], z=t.match(/\s*$/)[0], c=t.trim(); return c? a+m+c+m+z : t; };
    if(ital) t=wrap(t,"*");
    if(bold) t=wrap(t,"**");
    return t;
  }
  function kids(n,st){ return [...n.childNodes].map(c=>inline(c,st)).join(""); }
  const lines=[];
  function block(n){
    if(n.nodeType===3){ const t=n.nodeValue.replace(/ /g," "); if(t.trim()) pushText(t); return; }
    if(n.nodeType!==1) return;
    const tag=n.nodeName;
    if(tag==="FIGURE"){ endPara(); const m=figMd(n); if(m) lines.push(m,""); return; }
    if(tag==="UL"||tag==="OL"){ endPara(); let i=0; [...n.children].forEach(li=>{ if(li.nodeName!=="LI") return; i++;
        const sub=[...li.childNodes].filter(c=>!(c.nodeType===1&&/^(UL|OL)$/.test(c.nodeName)));
        const txt=sub.map(c=>inline(c,{})).join("").replace(/\n+/g," ").replace(/\s+/g," ").trim();
        if(txt) lines.push((tag==="UL"?"- ":i+". ")+txt);
        [...li.children].filter(c=>/^(UL|OL)$/.test(c.nodeName)).forEach(c=>{ block(c); }); });
      lines.push(""); return; }
    if(tag==="BR"){ lines.push(cur); cur=""; return; }
    if(isBlock(n) && ![...n.childNodes].some(isBlock)){
      endPara(); const t=kids(n,{}).replace(/[ \t]+\n/g,"\n").replace(/\n{2,}/g,"\n").trim(); if(t) lines.push(t, ""); else if(lines.length && lines[lines.length-1]!=="") lines.push(""); return; }
    if(isBlock(n)){ endPara(); [...n.childNodes].forEach(block); endPara(); return; }
    pushText(inline(n,{}));
  }
  let cur="";
  function pushText(t){ const parts=t.split("\n"); cur+=parts.shift(); parts.forEach(p=>{ lines.push(cur); cur=p; }); }
  function endPara(){ if(cur.trim()){ lines.push(cur.trim(),""); } cur=""; }
  [...root.childNodes].forEach(block); endPara();
  return lines.join("\n").replace(/\u200b/g,"").replace(/[ \t]+$/gm,"").replace(/\n{3,}/g,"\n\n").trim();
}
function rtFig(alt,ref,size){
  const r=rtImgInfo(ref), warn = r.im && !r.hl ? '<em>Needs its Higher Logic link before the send</em>' : (!r.im && /^lib:/.test(ref) ? '<em>This picture is no longer in the library</em>' : '');
  return '<figure class="rt-fig'+(size==="half"?" half":"")+'" contenteditable="false" data-ref="'+esc(ref)+'" data-alt="'+esc(alt||"")+'" data-size="'+(size==="half"?"half":"full")+'"'+(r.id?' data-imid="'+esc(r.id)+'"':'')+'>'+
    '<img src="'+esc(r.src)+'" alt="'+esc(alt||"")+'">'+
    '<figcaption><b>'+esc(alt||r.name||"Picture")+'</b>'+warn+'</figcaption>'+
    '<span class="rt-figbar"><button type="button" data-fig="up" title="Move up">↑</button><button type="button" data-fig="down" title="Move down">↓</button><button type="button" data-fig="size">'+(size==="half"?"Full Width":"Half Width")+'</button><button type="button" data-fig="alt">Description</button><button type="button" data-fig="rm">Remove</button></span></figure>';
}
function rtToDom(s){
  const h=mdBlocks(s).map(b=>b.t==="img" ? rtFig(b.alt,b.ref,b.size) : b.t==="p" ? '<p>'+b.lines.map(l=>mdInline(l)).join("<br>")+'</p>'
    : '<'+b.t+'>'+b.items.map(i=>'<li>'+mdInline(i).replace(/\n/g,"<br>")+'</li>').join("")+'</'+b.t+'>').join("");
  return h.replace(/ target="_blank" rel="noopener"/g,"") || "<p><br></p>";
}

const RT_ICONS={
  b:'<b>B</b>', i:'<i style="font-family:Georgia,serif">I</i>',
  link:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
  ul:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="7" r="1.3"/><circle cx="5" cy="12" r="1.3"/><circle cx="5" cy="17" r="1.3"/><path d="M9.5 7H20M9.5 12H20M9.5 17H20"/></svg>',
  ol:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 7H20M9.5 12H20M9.5 17H20"/><text x="2.6" y="9" font-size="6.5" stroke="none" fill="currentColor">1</text><text x="2.6" y="14" font-size="6.5" stroke="none" fill="currentColor">2</text><text x="2.6" y="19" font-size="6.5" stroke="none" fill="currentColor">3</text></svg>',
  clear:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h12M12 5l-3 14"/><path d="M15 15l5 5M20 15l-5 5"/></svg>',
  img:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l5-5 4 4 3-3 4 4"/></svg>'
};
/* The HTML for one box: toolbar + editable area. Used by buildFields for type "rich". */
function rtField(id, v, ph, rows, img){
  const btn=(c,t,k)=>'<button type="button" class="rt-b" data-rt="'+c+'" title="'+t+(k?' ('+k+')':'')+'" aria-label="'+t+'">'+RT_ICONS[c]+'</button>';
  const mod=/Mac|iPhone|iPad/.test(navigator.platform||"")?"⌘":"Ctrl+";
  return '<div class="rt" data-rtwrap="'+id+'">'+
    '<div class="rt-bar" role="toolbar" aria-label="Formatting">'+btn("b","Bold",mod+"B")+btn("i","Italic",mod+"I")+btn("link","Add a link",mod+"K")+'<span class="rt-sep"></span>'+btn("ul","Bulleted list")+btn("ol","Numbered list")+'<span class="rt-sep"></span>'+(img?btn("img","Add a picture here")+'<span class="rt-sep"></span>':'')+btn("clear","Clear formatting")+'</div>'+
    (img?'<div class="rt-imgbar" hidden data-ed="'+esc(typeof img==="string"?img:"")+'"><div class="kbtns">'+(typeof ASSETS!=="undefined"&&ASSETS?'<button type="button" class="btn sm pri" data-rti="up">Upload a Picture</button>':'')+'<button type="button" class="btn sm" data-rti="lib">Pick from Image Library</button><button type="button" class="btn sm" data-rti="x">Cancel</button><span class="hint">It goes where your cursor is. Move it with the arrows on the picture.</span></div><input type="file" accept="image/*" hidden><div class="rt-imstrip"></div></div>':'')+
    '<div class="rt-linkbar" hidden><input type="url" placeholder="Paste or type the link, e.g. https://www.mismo.org/…" aria-label="Link address" autocomplete="off"><button type="button" class="btn sm pri" data-rtl="ok">Add Link</button><button type="button" class="btn sm" data-rtl="rm" hidden>Remove Link</button><button type="button" class="btn sm" data-rtl="x">Cancel</button></div>'+
    '<div class="rt-ed" id="'+id+'" contenteditable="true" role="textbox" aria-multiline="true" data-ph="'+esc(ph||"")+'" style="min-height:'+Math.max(3,rows||4)*1.5+'em">'+rtToDom(v||"")+'</div></div>';
}
function rtWire(root){
  $$(".rt",root).forEach(w=>{
    if(w.dataset.wired) return; w.dataset.wired="1";
    const ed=$(".rt-ed",w), bar=$(".rt-bar",w), lb=$(".rt-linkbar",w), li=$("input",lb);
    /* .value reads and writes the saved form, so code written for <textarea> keeps working */
    Object.defineProperty(ed,"value",{configurable:true, get(){ return rtFromDom(ed); }, set(v){ ed.innerHTML=rtToDom(v||""); rtEmpty(ed); }});
    try{ document.execCommand("defaultParagraphSeparator",false,"p"); }catch(e){}
    let saved=null, editA=null;
    const inEd=n=>n && ed.contains(n.nodeType===1?n:n.parentNode);
    const keep=()=>{ const s=getSelection(); if(s.rangeCount && inEd(s.anchorNode)) saved=s.getRangeAt(0).cloneRange(); };
    const back=()=>{ ed.focus(); const s=getSelection(); if(saved){ s.removeAllRanges(); s.addRange(saved); } else { const r=document.createRange(); r.selectNodeContents(ed); r.collapse(false); s.removeAllRanges(); s.addRange(r); } };
    const changed=()=>{ ed.dispatchEvent(new Event("input",{bubbles:true})); rtState(w); rtEmpty(ed); };
    const anchorAt=()=>{ const s=getSelection(); let n=s.anchorNode; while(n && n!==ed){ if(n.nodeName==="A") return n; n=n.parentNode; } return null; };
    const openLink=()=>{ keep(); editA=anchorAt(); li.value=editA?editA.getAttribute("href").replace(/^mailto:/,""):""; $('[data-rtl="rm"]',lb).hidden=!editA; lb.hidden=false; setTimeout(()=>li.focus(),0); };
    const doLink=()=>{
      const url=rtUrl(li.value); if(!url){ li.focus(); li.select(); li.classList.add("bad"); return; } li.classList.remove("bad");
      back();
      if(editA){ editA.setAttribute("href",url); }
      else{ const s=getSelection();
        if(s.isCollapsed){ const a=document.createElement("a"); a.href=url; a.textContent=li.value.trim(); const r=s.getRangeAt(0); r.insertNode(a); r.setStartAfter(a); r.collapse(true); s.removeAllRanges(); s.addRange(r); }
        else document.execCommand("createLink",false,url); }
      lb.hidden=true; editA=null; changed();
    };
    bar.addEventListener("mousedown",e=>{ if(e.target.closest("[data-rt]")) e.preventDefault(); });
    bar.addEventListener("click",e=>{
      const b=e.target.closest("[data-rt]"); if(!b) return; const c=b.dataset.rt;
      if(c==="link") return openLink();
      if(c==="img"){ keep(); const ib=$(".rt-imgbar",w); ib.hidden=!ib.hidden; $(".rt-imstrip",ib).innerHTML=""; return; }
      ed.focus();
      if(c==="b") document.execCommand("bold"); else if(c==="i") document.execCommand("italic");
      else if(c==="ul") document.execCommand("insertUnorderedList"); else if(c==="ol") document.execCommand("insertOrderedList");
      else if(c==="clear"){ document.execCommand("removeFormat"); document.execCommand("unlink"); }
      changed();
    });
    lb.addEventListener("click",e=>{ const k=(e.target.closest("[data-rtl]")||{}).dataset; if(!k||!k.rtl) return;
      if(k.rtl==="ok") doLink();
      else if(k.rtl==="rm"){ back(); if(editA){ const r=document.createRange(); r.selectNodeContents(editA); const s=getSelection(); s.removeAllRanges(); s.addRange(r); } document.execCommand("unlink"); lb.hidden=true; editA=null; changed(); }
      else { lb.hidden=true; editA=null; back(); } });
    /* pictures: upload or pick one, and it lands where the cursor was */
    const ib=$(".rt-imgbar",w);
    const insertPic=(ref,alt)=>{ ib.hidden=true; back(); const s=getSelection();
      /* a picture sits between paragraphs, never inside one */
      let host=s.anchorNode; while(host && host.parentNode!==ed) host=host.parentNode;
      const tmp=document.createElement("div"); tmp.innerHTML=rtFig(alt,ref,"full"); const fig=tmp.firstChild;
      if(host && host!==ed && host.nodeType===1 && host.textContent.trim()==="" && !host.querySelector("figure")) host.replaceWith(fig);
      else if(host && host!==ed){
        const r=s.rangeCount?s.getRangeAt(0):null, tail=document.createRange();
        if(r && host.nodeType===1 && /^(P|DIV)$/.test(host.nodeName)){ tail.setStart(r.endContainer,r.endOffset); tail.setEndAfter(host.lastChild||host); const rest=tail.extractContents(); host.after(fig);
          const after=document.createElement("p"); after.appendChild(rest); if(!after.textContent.trim()) after.innerHTML="<br>"; fig.after(after); if(!host.textContent.trim() && !host.querySelector("br,img")) host.innerHTML="<br>"; }
        else host.after(fig);
      } else ed.appendChild(fig);
      if(!fig.nextSibling){ const pp=document.createElement("p"); pp.innerHTML="<br>"; fig.after(pp); }
      const r=document.createRange(); r.setStart(fig.nextSibling,0); r.collapse(true); s.removeAllRanges(); s.addRange(r);
      rtFill(ed); changed(); };
    if(ib){
      const fi=$('input[type=file]',ib), strip=$(".rt-imstrip",ib);
      ib.addEventListener("click",async e=>{ const k=(e.target.closest("[data-rti]")||{}).dataset; const pk=e.target.closest("[data-pick]");
        if(pk){ const im=S.images[pk.dataset.pick]; if(im) insertPic("lib:"+im.id, im.alt||im.name||""); return; }
        if(!k||!k.rti) return;
        if(k.rti==="up") fi.click();
        else if(k.rti==="lib"){ strip.innerHTML=libraryStrip(S.editions[ib.dataset.ed]||curEdition()); }
        else { ib.hidden=true; back(); } });
      fi.addEventListener("change",async()=>{ const f=fi.files[0]; fi.value=""; if(!f) return;
        const made=await addImages([f],{campaign:"matters", edition:ib.dataset.ed||""}); if(made[0]){ insertPic("lib:"+made[0].id, made[0].alt||made[0].name||""); toast("Picture added here and to the Image Library. Press Save to keep it."); } });
    }
    ed.addEventListener("mousedown",e=>{ if(e.target.closest("[data-fig]")) e.preventDefault(); });
    ed.addEventListener("click",e=>{ const b=e.target.closest("[data-fig]"); if(!b) return; e.preventDefault();
      const fig=b.closest("figure"); let host=fig; while(host.parentNode && host.parentNode!==ed) host=host.parentNode; if(host!==fig){ host.after(fig); }
      const a=b.dataset.fig;
      if(a==="up"){ const pv=fig.previousElementSibling; if(pv) pv.before(fig); fig.scrollIntoView({block:"nearest"}); }
      else if(a==="down"){ const nx=fig.nextElementSibling; if(nx) nx.after(fig); fig.scrollIntoView({block:"nearest"}); }
      else if(a==="size"){ const half=fig.dataset.size!=="half"; fig.dataset.size=half?"half":"full"; fig.classList.toggle("half",half); b.textContent=half?"Full Width":"Half Width"; }
      else if(a==="alt"){ const v=prompt("Describe the picture in a few words (read aloud to people using screen readers):", fig.dataset.alt||""); if(v===null) return; fig.dataset.alt=v.trim(); const cap=$("figcaption b",fig); if(cap) cap.textContent=v.trim()||"Picture"; $("img",fig).alt=v.trim(); }
      else if(a==="rm"){ const nx=fig.nextElementSibling; fig.remove(); if(nx && nx.nodeName==="P" && !nx.textContent.trim() && nx.previousElementSibling && nx.previousElementSibling.nodeName==="P" && !nx.previousElementSibling.textContent.trim()) nx.remove(); }
      changed(); });
    rtFill(ed);
    li.addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); doLink(); } if(e.key==="Escape"){ e.preventDefault(); e.stopPropagation(); lb.hidden=true; back(); } });
    ed.addEventListener("keydown",e=>{
      const m=e.ctrlKey||e.metaKey;
      if(m && (e.key==="k"||e.key==="K")){ e.preventDefault(); openLink(); return; }
      if(m && /^[bi]$/i.test(e.key)) setTimeout(()=>rtState(w),0);
      /* Word-style shortcuts: "- " or "* " starts bullets, "1. " starts a numbered list */
      if(e.key===" " && !m){
        const s=getSelection(); if(!s.isCollapsed) return; const n=s.anchorNode; if(!n||n.nodeType!==3) return;
        const before=n.nodeValue.slice(0,s.anchorOffset);
        let blk=n.parentNode; while(blk && blk!==ed && !/^(P|DIV|LI)$/.test(blk.nodeName)) blk=blk.parentNode;
        if(blk && blk.nodeName==="LI") return;
        const first=blk && blk!==ed ? blk.firstChild : (()=>{ let p=n; while(p.previousSibling && p.previousSibling.nodeName!=="BR" && !/^(P|DIV|UL|OL)$/.test(p.previousSibling.nodeName)) p=p.previousSibling; return p; })();
        if(first!==n) return;
        if(/^[-*•]$/.test(before)||/^1[.)]$/.test(before)){
          e.preventDefault(); const rest=n.nodeValue.slice(s.anchorOffset); const r=document.createRange();
          if(!rest && blk && blk!==ed && blk.childNodes.length===1){ blk.innerHTML="<br>"; r.setStart(blk,0); }
          else { n.nodeValue=rest||"\u200b"; r.setStart(n,0); }
          r.collapse(true); s.removeAllRanges(); s.addRange(r);
          document.execCommand(before.startsWith("1")?"insertOrderedList":"insertUnorderedList"); changed();
        }
      }
    });
    /* Pasting from Word, Outlook or a web page keeps bold, italics, links and lists, and drops the rest */
    ed.addEventListener("paste",e=>{
      const cd=e.clipboardData; if(!cd) return; e.preventDefault();
      const html=cd.getData("text/html"), txt=cd.getData("text/plain");
      let md;
      if(html){ const d=new DOMParser().parseFromString(html,"text/html"); rtWordLists(d); md=rtFromDom(d.body); }
      else md=txt||"";
      const one=!/\n/.test(md) && !RT_UL.test(md) && !RT_OL.test(md);
      const h=one ? mdInline(md).replace(/ target="_blank" rel="noopener"/g,"") : rtToDom(md);
      document.execCommand("insertHTML",false,h||"");
      changed();
    });
    ed.addEventListener("click",e=>{ const a=e.target.closest("a"); if(a && (e.ctrlKey||e.metaKey)){ window.open(a.href,"_blank","noopener"); e.preventDefault(); } });
    ed.addEventListener("input",()=>{ if(!ed.firstChild || (ed.childNodes.length===1 && ed.firstChild.nodeName==="BR")){ ed.innerHTML="<p><br></p>"; const r=document.createRange(); r.setStart(ed.firstChild,0); r.collapse(true); const s=getSelection(); s.removeAllRanges(); s.addRange(r); } rtEmpty(ed); });
    ed.addEventListener("keyup",()=>rtState(w)); ed.addEventListener("mouseup",()=>rtState(w));
    document.addEventListener("selectionchange",()=>{ if(document.activeElement===ed) rtState(w); });
    rtEmpty(ed);
  });
}
/* Word's pasted bullets are paragraphs with class MsoListParagraph and a "·" or "1." in front */
function rtWordLists(d){
  $$("p",d.body).forEach(p=>{
    const cls=p.className||"", st=p.getAttribute("style")||"";
    if(!/MsoListParagraph/i.test(cls) && !/mso-list/i.test(st)) return;
    $$("span",p).forEach(s=>{ if(/mso-list\s*:\s*Ignore/i.test(s.getAttribute("style")||"")) s.remove(); });
    const raw=p.textContent.replace(/ /g," ").trim();
    const ordered=/^\d+[.)]/.test(raw)||/l\d+ level\d+ lfo\d+/.test(st)&&/^\d/.test(raw);
    p.innerHTML=p.innerHTML.replace(/^(\s|&nbsp;)*([·•oØ§▪–-]|\d+[.)])(\s|&nbsp;)+/,"");
    const li=d.createElement("li"); li.innerHTML=p.innerHTML;
    const prev=p.previousElementSibling, t=ordered?"OL":"UL";
    if(prev && prev.nodeName===t && prev.dataset.word){ prev.appendChild(li); p.remove(); }
    else { const l=d.createElement(t); l.dataset.word="1"; l.appendChild(li); p.replaceWith(l); }
  });
}
/* SharePoint pictures arrive after the box is drawn, so each one fills itself in */
function rtFill(root){
  $$("[data-imid]",root).forEach(f=>{ const img=$("img",f); if(!img || img.getAttribute("src")) return; const im=S.images[f.dataset.imid]; if(!im) return;
    imgEnsure(im).then(()=>{ const src=imgSrc(im); if(src) img.src=src; }); });
}
function rtEmpty(ed){ ed.classList.toggle("is-empty", !ed.textContent.trim() && !ed.querySelector("li,img,figure")); }
function rtState(w){
  const ed=$(".rt-ed",w); const s=getSelection(); if(!s.rangeCount || !ed.contains(s.anchorNode)) return;
  const q=c=>{ try{ return document.queryCommandState(c); }catch(e){ return false; } };
  let n=s.anchorNode, a=false; while(n && n!==ed){ if(n.nodeName==="A") a=true; n=n.parentNode; }
  [["b","bold"],["i","italic"],["ul","insertUnorderedList"],["ol","insertOrderedList"]].forEach(([c,k])=>{ const b=$('[data-rt="'+c+'"]',w); if(b) b.setAttribute("aria-pressed",q(k)?"true":"false"); });
  const lb=$('[data-rt="link"]',w); if(lb) lb.setAttribute("aria-pressed",a?"true":"false");
}
