
/* ---------- Spelling (Jonna, Nov 26, 2026: "a spell checker on anything that has copy - text etc") ----------
   Every box people write copy in (text areas, the rich editor, and one-line boxes for titles, headlines, names and the
   like) has the browser's spell checker switched on, in American English: a misspelled word gets a red underline and a
   right-click offers the right spelling. Boxes for links, email addresses, file names, codes, colors, dates, numbers and
   searches are left alone. Boxes that appear later (panels, pop-ups, the rich editor) are switched on as they appear. */
const SPELL_SEL = 'textarea, input:not([type]), input[type="text"], [contenteditable]:not([contenteditable="false"])';
const SPELL_OFF = /url|link|href|e-?mail|path|file|folder|hex|colou?r|phone|code|slug|token|key|date|time|search|filter|(^|-)id$|(^|-)q$/i;
function spellWanted(el){
  if(el.hasAttribute("data-nospell")) return false;
  if(el.isContentEditable) return true;
  const who=[el.id, el.name, el.getAttribute("autocomplete"), el.getAttribute("aria-label")].join(" ");
  if(el.tagName==="TEXTAREA") return !/html|json|css|csv|code|paste-?url/i.test(who);
  if(el.tagName!=="INPUT") return false;
  const t=(el.getAttribute("type")||"text").toLowerCase();
  if(t!=="text") return false;
  return !SPELL_OFF.test(who) && !/https?:|www\.|@|\.(com|org|net)\b|\d{4}-\d\d/i.test(el.getAttribute("placeholder")||"");
}
function spellOn(el){
  if(!el || el.dataset.spell) return;
  const on=spellWanted(el); el.dataset.spell=on?"on":"off";
  if(on){ el.spellcheck=true; el.setAttribute("lang","en-US"); if(typeof spellNew==="function") spellNew(el); }
}
function spellScan(root){
  if(!root || !root.querySelectorAll) return;
  if(root.matches && root.matches(SPELL_SEL)) spellOn(root);
  root.querySelectorAll(SPELL_SEL).forEach(spellOn);
}

/* ---------- The spelling line (Jonna, Nov 26, 2026) ----------
   Chrome only underlines a box once someone clicks into it, so copy Claude wrote could hide a mistake. Every copy box
   is also checked as it appears and as it changes, and a line under it lists the words to look at:
   "Spelling: recieve". Press a word for the right spellings (one press puts it in), Add to MISMO Words (shared by
   the whole team, kept in settings/spelling) or Ignore. No line when everything is spelled right.
   The dictionary is the standard American English one (Hunspell en_US from the typo-js 1.2.4 package: its notice is in spell/README.md), kept
   in MISMO Media's own files (spell/en_US.aff and spell/en_US.dic) and read once; nothing loads from anywhere else.
   Words with a capital in the middle of a sentence are taken as names and left alone, as are ALL-CAPS words, words
   with capitals inside (eNote, iPhone), links, email addresses, @handles and #hashtags. */
const SPELL = {state:"", words:null, err:"", ignore:new Set(), loading:null, timers:new WeakMap()};
const SPELL_MISMO = ("MISMO MBA Vieaux eNote eNotes eClosing eClosings eMortgage eMortgages eVault eVaults ULAD ULDD UCD MCD Mic'd Xactus Teraverde Veros Snapdocs "+
  "HousingWire LinkedIn YouTube Spotify Riverside Informz Mailchimp Aptify Thrive webinar webinars workgroup workgroups fintech proptech onboarding offboarding "+
  "roadmap roadmaps livestream livestreamed podcast podcasts podcaster cybersecurity blockchain interoperability interoperable implementers implementer signup signups "+
  "lender lenders servicer servicers subservicer subservicers underwriter underwriters underwriting appraiser appraisers homebuyer homebuyers homeownership "+
  "dataset datasets metadata API APIs SaaS email emails emailed inbox website websites login logins homepage username webpage nonprofit nonprofits "+
  "summit summits keynote keynotes panelist panelists moderator moderators recap recaps upskill upskilling reskilling ecosystem ecosystems scalable "+
  "standardization standardize standardized standardizing digitize digitized digitization tokenization tokenized AI's").split(/\s+/);
function spellLoad(){
  if(SPELL.loading) return SPELL.loading;
  /* a saved copy opened from disk can't read the dictionary; Chrome's own underline still works there */
  if(location.protocol==="file:"){ SPELL.state="off"; SPELL.err="this copy was opened from a file"; return (SPELL.loading=Promise.resolve()); }
  SPELL.state="loading";
  SPELL.loading=Promise.all(["spell/en_US.aff","spell/en_US.dic"].map(u=>fetch(u,{cache:"force-cache"}).then(r=>{ if(!r.ok) throw new Error("the dictionary didn't load ("+r.status+")"); return r.text(); })))
    .then(([aff,dic])=>{ SPELL.words=spellBuild(aff,dic); SPELL.state="ready"; spellAll(); })
    .catch(e=>{ SPELL.state="off"; SPELL.err=String((e&&e.message)||e); });
  return SPELL.loading;
}
/* the dictionary: each stem plus the endings and beginnings its flags allow (Hunspell's PFX and SFX rules) */
function spellBuild(aff, dic){
  const rules={};
  String(aff).split(/\r?\n/).forEach(l=>{ const p=l.trim().split(/\s+/); if((p[0]==="PFX"||p[0]==="SFX") && p.length>=5){
    const flag=p[1], r=rules[flag]; if(!r) return; const cond=p[4]===undefined||p[4]==="."?null:new RegExp(p[0]==="SFX"?"(?:"+p[4]+")$":"^(?:"+p[4]+")");
    r.list.push({strip:p[2]==="0"?"":p[2], add:(p[3]==="0"?"":p[3]).split("/")[0], cond}); }
    else if((p[0]==="PFX"||p[0]==="SFX") && p.length===4) rules[p[1]]={type:p[0], cross:p[2]==="Y", list:[]}; });
  const set=new Set(), nosug=new Set(), sfx=(w,r)=>r.list.filter(x=>(!x.cond||x.cond.test(w)) && (!x.strip||w.endsWith(x.strip))).map(x=>w.slice(0,w.length-x.strip.length)+x.add),
    pfx=(w,r)=>r.list.filter(x=>(!x.cond||x.cond.test(w)) && (!x.strip||w.startsWith(x.strip))).map(x=>x.add+w.slice(x.strip.length));
  String(dic).split(/\r?\n/).forEach((l,i)=>{ if(!i && /^\d+$/.test(l.trim())) return; const line=l.trim(); if(!line) return;
    const k=line.indexOf("/"), w=k<0?line:line.slice(0,k), flags=k<0?"":line.slice(k+1).split(/\s/)[0]; set.add(w);
    if(flags.indexOf("!")>=0) nosug.add(w.toLowerCase());          /* NOSUGGEST: never offered as a spelling */
    const rs=[...flags].map(f=>rules[f]).filter(Boolean), sufs=rs.filter(r=>r.type==="SFX"), pres=rs.filter(r=>r.type==="PFX");
    const withS=[]; sufs.forEach(r=>sfx(w,r).forEach(x=>{ set.add(x); if(r.cross) withS.push(x); }));
    pres.forEach(r=>{ pfx(w,r).forEach(x=>set.add(x)); if(r.cross) withS.forEach(s=>pfx(s,r).forEach(x=>set.add(x))); }); });
  set.nosug=nosug;
  return set;
}
function spellExtra(){
  const s=new Set(SPELL_MISMO.map(w=>w.toLowerCase()));
  try{ ((((S.settings||{}).spelling)||{}).words||[]).forEach(w=>s.add(String(w).toLowerCase())); }catch(e){}
  try{ vals("guests").forEach(g=>String(g.name||g.n||"").split(/[\s,]+/).forEach(w=>w&&s.add(w.toLowerCase()))); vals("episodes").forEach(e=>String(e.guests||"").split(/[\s,&]+/).forEach(w=>w&&s.add(w.toLowerCase()))); }catch(e){}
  return s;
}
function spellKnown(w, extra){
  const W=SPELL.words; if(!W) return true;
  const lw=w.toLowerCase(); if(extra.has(lw) || SPELL.ignore.has(lw)) return true;
  if(W.has(w) || W.has(lw) || W.has(w.charAt(0).toUpperCase()+w.slice(1))) return true;
  if(/'/.test(w)){ const base=w.replace(/'(s|ll|re|ve|d|m)$/i,"").replace(/s'$/i,"s"); if(base!==w) return spellKnown(base, extra); if(/n't$/i.test(w)) return W.has(lw.replace(/n't$/,"")) || W.has(lw.replace(/n't$/,"")+"n") || /^(can|won|don|doesn|didn|isn|aren|wasn|weren|hasn|haven|hadn|couldn|wouldn|shouldn|mustn|ain)'t$/i.test(lw); }
  return false;
}
/* the words to look at in a piece of copy */
function spellIssues(text){
  if(!SPELL.words) return [];
  const extra=spellExtra(), seen=new Set(), out=[];
  const t=String(text||"").replace(/https?:\/\/\S+|www\.\S+|\S+@\S+\.\S+|[@#][\w.-]+|<[^>]+>|&[a-z]+;/gi," ").replace(/[’‘]/g,"'");
  const re=/[A-Za-z][A-Za-z']*[A-Za-z]|[A-Za-z]/g; let m;
  while((m=re.exec(t))){
    let w=m[0].replace(/^'+|'+$/g,""); if(w.length<2) continue;
    if(/[A-Z]/.test(w.slice(1))) continue;                          /* MISMO, eNote, iPhone */
    /* a capital mid-sentence is usually a name, or a word in a Title Case heading: flagged only when it's one letter
       away from a real word (Standerds), so names like Vieaux are left alone */
    let named=false;
    if(/^[A-Z]/.test(w)){
      const before=t.slice(0,m.index).replace(/[\s"'“(\[*_-]+$/,"");
      named = !!before && !/[.!?:\n]$/.test(before) && !/\n\s*$/.test(t.slice(0,m.index));
    }
    const key=w.toLowerCase(); if(seen.has(key)) continue; seen.add(key);
    if(spellKnown(w, extra)) continue;
    if(named && !spellNear(w)) continue;
    out.push(w);
  }
  return out;
}
function spellNear(word){ const W=SPELL.words, lw=word.toLowerCase(), A="abcdefghijklmnopqrstuvwxyz";
  if(lw.length<5) return false;
  for(let i=0;i<=lw.length;i++){ const a=lw.slice(0,i), b=lw.slice(i);
    if(b && W.has(a+b.slice(1))) return true; if(b.length>1 && W.has(a+b[1]+b[0]+b.slice(2))) return true;
    for(const c of A){ if(b && c!==b[0] && W.has(a+c+b.slice(1))) return true; if(W.has(a+c+b)) return true; } }
  return false; }
/* the right spellings: one change away, then two */
function spellSuggest(word){
  const W=SPELL.words; if(!W) return [];
  const lw=word.toLowerCase(), A="abcdefghijklmnopqrstuvwxyz'", ed=w=>{ const o=new Set();
    for(let i=0;i<=w.length;i++){ const a=w.slice(0,i), b=w.slice(i);
      if(b) o.add(a+b.slice(1)); if(b.length>1) o.add(a+b[1]+b[0]+b.slice(2));
      for(const c of A){ if(b) o.add(a+c+b.slice(1)); o.add(a+c+b); } } return o; };
  const ok=w=>W.has(w) && !(W.nosug && W.nosug.has(w)), one=[...ed(lw)].filter(ok);
  let list=one; if(!list.length && lw.length<=12){ const two=new Set(); for(const x of ed(lw)) for(const y of ed(x)) if(ok(y)) two.add(y); list=[...two]; }
  /* closest first: same length, same first letter, and the same letters swapped round (recieve → receive) */
  const sl=x=>[...x].sort().join(""), base=sl(lw), cap=/^[A-Z]/.test(word), score=s=>Math.abs(s.length-lw.length)+(s[0]===lw[0]?0:1)-(sl(s)===base?1:0);
  return [...new Set(list)].sort((a,b)=>score(a)-score(b)).slice(0,5).map(s=>cap?s.charAt(0).toUpperCase()+s.slice(1):s);
}
function spellText(el){ return el.isContentEditable ? el.innerText : el.value; }
function spellLineFor(el){
  let n=el.nextElementSibling; if(n && n.classList.contains("spl") && n.__for===el) return n;
  if(el.tagName==="INPUT"){ const p=el.parentElement; if(!p || /flex|grid/.test(getComputedStyle(p).display)) return null; }
  n=document.createElement("div"); n.className="spl"; n.__for=el; n.hidden=true; n.setAttribute("aria-live","polite"); el.insertAdjacentElement("afterend", n); return n;
}
function spellCheckEl(el){
  if(!el || !el.isConnected || el.dataset.spell!=="on" || SPELL.state!=="ready") return;
  const text=spellText(el)||""; const words=text.trim().length>2 ? spellIssues(text) : [];
  let line=el.nextElementSibling; if(!(line && line.classList.contains("spl") && line.__for===el)) line=words.length?spellLineFor(el):null;
  if(!line) return;
  if(!words.length){ line.hidden=true; line.innerHTML=""; return; }
  line.hidden=false;
  line.innerHTML='<span class="spl-k">Spelling</span>'+words.slice(0,10).map(w=>'<button type="button" class="spl-w" data-splw="'+esc(w)+'" title="Show the right spellings">'+esc(w)+'</button>').join("")+(words.length>10?'<span class="spl-more">and '+(words.length-10)+' more</span>':'');
}
function spellAll(){ if(SPELL.state!=="ready") return; document.querySelectorAll('[data-spell="on"]').forEach(spellCheckEl); }
function spellSoon(el, ms){ clearTimeout(SPELL.timers.get(el)); SPELL.timers.set(el, setTimeout(()=>spellCheckEl(el), ms==null?600:ms)); }
function spellReplace(el, from, to){
  const re=new RegExp("(^|[^A-Za-z'’])"+from.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"(?![A-Za-z'’])","g");
  if(el.isContentEditable){ const tw=document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; while((n=tw.nextNode())) n.nodeValue=n.nodeValue.replace(re,"$1"+to); }
  else el.value=el.value.replace(re,"$1"+to);
  el.dispatchEvent(new Event("input",{bubbles:true})); el.dispatchEvent(new Event("change",{bubbles:true}));
}
async function spellAddWord(w){
  const cur=(((S.settings||{}).spelling)||{}).words||[]; if(cur.map(x=>String(x).toLowerCase()).includes(w.toLowerCase())) return;
  const words=cur.concat([w]).sort((a,b)=>a.localeCompare(b));
  try{ if((S.settings||{}).spelling) await patch("settings","spelling",{words}); else await put("settings","spelling",{words}); toast('"'+w+'" added to MISMO Words.'); }
  catch(e){ toast("Couldn't add the word: "+((e&&e.message)||"try again")); }
}
function spellMenu(btn){
  document.querySelectorAll(".spl-menu").forEach(m=>m.remove());
  const line=btn.closest(".spl"), el=line&&line.__for, w=btn.dataset.splw; if(!el) return;
  const ro=el.readOnly || (el.isContentEditable===false && el.tagName!=="TEXTAREA" && el.tagName!=="INPUT"), sug=ro?[]:spellSuggest(w);
  const m=document.createElement("div"); m.className="spl-menu"; m.setAttribute("role","group"); m.setAttribute("aria-label","Spellings for "+w);
  m.innerHTML=(ro?'<span class="spl-ro">This copy is locked.</span>':(sug.length?sug.map(s=>'<button type="button" class="btn sm" data-splto="'+esc(s)+'">'+esc(s)+'</button>').join(""):'<span class="spl-ro">No close match.</span>'))+
    '<button type="button" class="btn sm" data-spladd>Add to MISMO Words</button><button type="button" class="btn sm" data-splign>Ignore</button>';
  btn.insertAdjacentElement("afterend", m);
  m.querySelectorAll("[data-splto]").forEach(b=>b.onclick=()=>{ spellReplace(el, w, b.dataset.splto); m.remove(); spellCheckEl(el); try{ el.focus(); }catch(e){} });
  m.querySelector("[data-spladd]").onclick=async()=>{ m.remove(); await spellAddWord(w); spellAll(); };
  m.querySelector("[data-splign]").onclick=()=>{ SPELL.ignore.add(w.toLowerCase()); m.remove(); spellAll(); };
  const f=m.querySelector("button"); if(f) try{ f.focus(); }catch(e){}
}
document.addEventListener("input", e=>{ const t=e.target; if(t && t.dataset && t.dataset.spell==="on") spellSoon(t); }, true);
document.addEventListener("click", e=>{ const b=e.target && e.target.closest && e.target.closest(".spl-w"); if(b){ e.preventDefault(); spellMenu(b); return; }
  if(!(e.target.closest && e.target.closest(".spl-menu"))) document.querySelectorAll(".spl-menu").forEach(m=>m.remove()); });
document.addEventListener("keydown", e=>{ if(e.key==="Escape"){ const m=document.querySelector(".spl-menu"); if(m){ m.remove(); } } });
/* boxes that appear get checked; the dictionary loads a few seconds after the page opens */
function spellNew(el){ if(SPELL.state==="ready") spellSoon(el, 50); else if(!SPELL.state && document.readyState!=="loading") setTimeout(()=>{ if(!SPELL.state) spellLoad(); }, 1500); }
(function(){
  setTimeout(()=>{ if(!SPELL.state) spellLoad(); }, 3000);
  const st=document.createElement("style");
  st.textContent='.spl{display:flex;flex-wrap:wrap;align-items:center;gap:4px 6px;margin:5px 0 2px;font-size:12.5px;position:relative}.spl[hidden]{display:none}'+
    '.spl-k{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;color:var(--ink-3);margin-right:2px}'+
    '.spl-w{font:inherit;background:none;border:0;border-bottom:2px dotted var(--bad);border-radius:0;padding:0 1px;color:var(--ink);cursor:pointer}.spl-w:focus-visible{outline:2px solid var(--sky);outline-offset:2px}'+
    '.spl-more{color:var(--ink-3)}.spl-menu{display:flex;flex-wrap:wrap;gap:6px;align-items:center;flex-basis:100%;padding:8px;background:var(--surface-2);border:1px solid var(--border);border-radius:6px}.spl-ro{color:var(--ink-3)}';
  document.head.appendChild(st);
})();
/* Help > System Health */
function hhSpelling(){
  const n=((((S.settings||{}).spelling)||{}).words||[]).length;
  if(SPELL.state==="off") return hhRow("spelling","Spelling","warn","The dictionary didn't load ("+SPELL.err+"), so the spelling line under copy boxes is off. Chrome's own red underline still works.");
  if(SPELL.state!=="ready") return hhRow("spelling","Spelling","off","The dictionary loads a few seconds after MISMO Media opens.");
  return hhRow("spelling","Spelling","ok","Every copy box is checked as it changes: "+rsN(SPELL.words.size)+" English words, plus "+rsN(n)+" MISMO Word"+(n===1?"":"s")+" the team added.");
}
/* switch on every copy box now and as new ones appear (after everything above is set up) */
(function(){
  try{ document.documentElement.setAttribute("lang","en-US"); }catch(e){}
  spellScan(document);
  try{ new MutationObserver(ms=>{ for(const m of ms){ if(m.type==="attributes") spellOn(m.target); else m.addedNodes.forEach(n=>{ if(n.nodeType===1) spellScan(n); }); } })
    .observe(document.documentElement, {childList:true, subtree:true, attributes:true, attributeFilter:["contenteditable"]}); }catch(e){}
})();
