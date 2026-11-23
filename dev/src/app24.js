
/* ================= Press Releases (Jonna, Nov 19, 2026) =================
   Perry Williams owns press releases; Amy Moses approves who is quoted.
   Facts come only from the MMS Robot's announcements feed (resources.mismo.org/mms/announcements.json, rebuilt
   every 30 minutes) and the work-product catalog (resources.mismo.org/work-products/catalog.json, by websiteId).
   Each new entry in the feed starts a release (data/releases.json, one record per announcement):
     1 Claude writes the first draft  2 Perry reviews and edits, picks who to quote from Claude's suggestions
     3 Amy approves or changes the quote source by email reply ([MM:<release id>] in the subject, like the Mic'd Up
       LinkedIn approval)  4 the quote request goes out as Perry, Amy copied, only when Perry presses Send
     5 Perry puts in the approved quote, with the person's written approval kept on the release
     6 Perry gives final approval  7 MISMO Connect post to Vanessa, newsroom copy to Brittney at MBA, offered to
       MISMO Matters and as a LinkedIn post request.
   Nothing is ever sent unless a person presses Send. Every name and company is checked against the MMS leaders list.
   Draft ahead, post on release (CN-010, approved by Jonna Nov 22 and 23, 2026): the feed marks each entry
     pressRelease (false = no release at all: a comment period gets no press release and no LinkedIn post),
     draftNow (true while the work is out for comment: draft it, take it through review, the quote and final
     approval, then hold it), readyToPost + readyAt (the same entry, same id, once the work reaches Release: the
     finished release moves to Distribution; nothing new is started), stage (the MMS step) and inComment (true while
     the work is out for public comment: shown as an Out for Comment tag with commentCloses, gone once it's false).
     A release drafted ahead announces the Final or Candidate Recommendation; it never says the work is in comment. */
const PR_FEED = "/mms/announcements.json", PR_CATALOG = "/work-products/catalog.json";
const PR_OWNER = {name:"Perry Williams", first:"Perry", email:"pwilliams@mismo.org"};
const PR_AMY = {name:"Amy Moses", first:"Amy", email:"amoses@mismo.org"};
const PR_VANESSA = {name:"Vanessa Rios", first:"Vanessa", email:"vrios@mismo.org"};
/* MBA newsroom contact (Jonna, Nov 18, 2026); MBA Newsroom Contact on the page can change it */
const PR_BRITTNEY = {name:"Brittney Prophete", first:"Brittney", email:"bprophete@mba.org"};
const PR_BRIAN = {name:"Brian Vieaux", title:"President", company:"MISMO"};
/* the "MISMO Media - Send As Perry" flow: it checks the resources.mismo.org sign-in with the relay and sends only
   when the person signed in is Perry, from pwilliams@mismo.org (Jonna's Send As permission) */
const PR_SEND_FLOW = "https://default867e5d11bde4499fb45e61572f9f33.7c.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/25/workflows/2a698d168d65408bbb85bcaae6ed3dcf/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=eNy4l66TJLJEvGIksG63ppyy8SES_GqXFWbWD3B_pm0";
const PR_TYPE = {cfp:"Call for Participation", comment:"Public Comment", release:"Release"};
const PR_STEPS = [["draft","First Draft"],["review","Perry's Review"],["source","Quote Source: Amy"],["request","Quote Request"],["quote","Approved Quote"],["final","Final Approval"],["out","Distribution"]];
const PR = {sel:null, feed:null, feedErr:"", feedAt:0, cat:null, catAt:0, writing:{}, q:"", showDone:false, view:""};
/* CN-010: the MMS's own fields about when a release is written and when it goes out (never part of the facts) */
const PR_FLAGS = ["pressRelease","draftNow","readyToPost","readyAt","stage","inComment"];
const prNoRelease = a=>!!a && (a.pressRelease===false || a.type==="comment");
/* drafted ahead and held: the work is still on its way to Release */
function prHeld(r){ const a=(r&&r.ann)||{}; return a.draftNow===true && a.readyToPost!==true; }
function prToPost(r){ const a=(r&&r.ann)||{}; return a.readyToPost===true; }
function prPosted(r){ const o=(r&&r.out)||{}; return !!(o.vanessaAt || o.mbaAt); }
function prFactsSig(a){ const x=Object.assign({}, a||{}); PR_FLAGS.forEach(k=>delete x[k]); return JSON.stringify(x); }
function prTags(r){ const a=(r&&r.ann)||{}; let h="";
  if(prHeld(r)) h+='<span class="pr-tag dn" title="The work is still on its way to Release. Draft it, get the quote and final approval, then hold it.">Draft Now</span>';
  else if(prToPost(r)) h+='<span class="pr-tag rp" title="The work has reached Release'+(a.readyAt?' ('+esc(fS(a.readyAt))+')':'')+'. The finished release can go out.">Ready to Post</span>';
  if(a.inComment===true) h+='<span class="pr-tag oc" title="The work is still out for public comment in the MMS. The release must not say so.">Out for Comment'+(a.commentCloses?' · closes '+esc(fS(a.commentCloses)):'')+'</span>';
  return h; }
function prHoldStop(r){ if(r && prHeld(r)){ toast("This release is held: it goes out once the MMS marks it Ready to Post.", 5000); return true; } return false; }

/* CN-013 (approved by Jonna Nov 23, 2026): MISMO makes no comment-period releases, and none is kept. A release that
   announces a comment period (started for a comment entry, or for an entry the MMS now marks as no release) is
   erased, archived ones included, and never shown or started again. A Final or Candidate Recommendation release
   whose first draft still reads "Seeks Public Comment" is rewritten as that announcement. */
const PR_SEEKS = /\b(?:seek(?:s|ing)?|invit(?:es|ing)|request(?:s|ing)?|open(?:s|ed)?)\s+(?:for\s+)?(?:public\s+)?comments?\b|\bpublic comment\b|\bcomment period\b/i;
function prIsCommentRel(r){ return !!r && (r.type==="comment" || prNoRelease(r.ann)); }
function prSeeksHeadline(r){ return !!(r && r.draft && PR_SEEKS.test(r.draft.headline||"")); }
function prAll(){ return vals("releases").filter(r=>!r.archived && !prIsCommentRel(r)); }
function prGet(id){ return (S.releases||{})[id]||null; }
function prMe(){ const s=window.ResourcesSession && window.ResourcesSession.current && window.ResourcesSession.current(); return {name:(s&&s.name)||window.__hqWho||"", email:String((s&&s.email)||"").toLowerCase()}; }
function prIsPerry(){ return prMe().email===PR_OWNER.email; }
function prWho(){ return prMe().name||"Someone"; }
function prSlug(s){ return String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,""); }
function prHash(s){ let h=0; s=String(s||""); for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))|0; return Math.abs(h).toString(36).slice(0,5); }
/* the record id is also the [MM:…] tag in Amy's email subject (letters, digits, dashes, 40 at most) */
function prIdFor(annId){ let s=prSlug(annId)||"x"; if(s.length>34) s=s.slice(0,28)+"-"+prHash(annId); return "pr-"+s; }
async function prSave(id, part, what){
  const cur=prGet(id)||{};
  const log=(cur.log||[]).concat(what?[{at:new Date().toISOString(), by:prWho(), what}]:[]).slice(-60);
  await put("releases", id, Object.assign({}, cur, part, {log}));
}
function prStepOf(r){ if(!r) return "draft";
  if(r.status==="final") return "out"; if(r.status==="quote") return "final"; if(r.status==="request") return r.quote&&r.quote.text?"final":(r.request&&r.request.sentAt?"quote":"request");
  if(r.status==="source") return "source"; return r.draft&&r.draft.body?"review":"draft"; }
/* the work product's public name. The MMS sometimes has a web address typed in the public-name field (Nov 23, 2026:
   the eHELOC FAQ), so a name that is only an address falls back to the MMS name. */
const prIsUrl=v=>/^\s*https?:\/\/\S+\s*$/i.test(String(v||""));
function prName(a){ a=a||{}; return (!prIsUrl(a.publicName) && a.publicName) || a.name || ""; }
function prTitle(r){ return (r.draft&&r.draft.headline) || prName(r.ann) || "Untitled release"; }
function prLongDate(d){ const x=P(d); return x?MONL[x.getMonth()]+" "+x.getDate()+", "+x.getFullYear():""; }
/* 3 business days after a day (weekends and MBA holidays skipped) */
function prBizAdd(d, n){ let x=d, k=0; while(k<n){ x=add(x,1); if(!offDay(x)) k++; } return x; }
function prReminderDue(r){ return r && r.request && r.request.sentAt && !(r.quote&&r.quote.text) ? prBizAdd(localDay(r.request.sentAt),3) : ""; }
function prLate(r){ const d=prReminderDue(r); return !!d && d<=T() && r.status==="request"; }

/* ---------- the feeds ---------- */
async function prLoadFeed(force){
  if(!force && PR.feed && Date.now()-PR.feedAt<5*60000) return PR.feed;
  try{ const r=await fetch(PR_FEED,{cache:"no-store"}); if(!r.ok) throw new Error("the feed answered "+r.status);
    const j=await r.json(); PR.feed={updated:j.updated||"", list:Array.isArray(j.announcements)?j.announcements:[]}; PR.feedErr=""; }
  catch(e){ PR.feedErr=e.message||"couldn't read it"; if(!PR.feed) PR.feed={updated:"", list:[]}; }
  PR.feedAt=Date.now(); return PR.feed;
}
async function prLoadCatalog(){
  if(PR.cat && Date.now()-PR.catAt<60*60000) return PR.cat;
  try{ const r=await fetch(PR_CATALOG,{cache:"no-store"}); if(r.ok){ const j=await r.json(); const m={}; (j.products||[]).forEach(p=>{ m[p.id]=p; (p.aliases||[]).forEach(a=>{ m[a]=m[a]||p; }); }); PR.cat=m; PR.catAt=Date.now(); } }catch(e){}
  return PR.cat||{};
}
function prCatFor(a, cat){ const p=a && a.websiteId && cat ? cat[a.websiteId] : null; if(!p) return null;
  return {id:p.id, title:p.title||"", summary:p.summary||"", version:p.version||"", status:p.status||"", membersOnly:!!p.membersOnly, libraryUrl:p.libraryUrl||"", externalUrl:p.externalUrl||""}; }

/* the background job: new feed entries become releases with a first draft; Amy's replies are applied */
async function prSync(){
  if(!LIVE || !CANWRITE || !LOADED.has("releases")) return;
  const feed=await prLoadFeed(true); const cat=await prLoadCatalog();
  for(const a of feed.list){
    if(!a || !a.id) continue;
    const id=prIdFor(a.id), cur=prGet(id);
    if(prNoRelease(a)) continue;   /* CN-010/CN-013: no release for a comment period, ever (the facts refresh never brings one back) */
    if(!cur){
      await put("releases", id, {annId:a.id, ann:a, cat:prCatFor(a,cat), type:a.type||"release", status:"draft", createdAt:new Date().toISOString(),
        log:[{at:new Date().toISOString(), by:"MISMO Media", what:"Started from the MMS announcement"}]});
      await prWrite(id, true);
    } else if(!cur.archived && JSON.stringify(cur.ann)!==JSON.stringify(a)){
      /* the MMS adds fields over time (never renames): keep the latest facts, say so on the release. The draft-ahead
         fields (Draft Now, Ready to Post, Out for Comment) follow the feed even after final approval. */
      const part={ann:a}, said=[], was=cur.ann||{};
      if(a.readyToPost===true && was.readyToPost!==true){ part.readyAt=a.readyAt||T(); if(was.draftNow===true) said.push("Ready to post: the MMS moved the work to Release"+(cur.status==="final"?". The finished release can go out now":". Finish it, then it can go out")); }
      if(a.inComment!==true && was.inComment===true) said.push("No longer out for comment in the MMS");
      if(prFactsSig(was)!==prFactsSig(a)){ part.cat=prCatFor(a,cat)||cur.cat||null; if(cur.status!=="final") part.annChangedAt=new Date().toISOString(); said.push(cur.status==="final"?"The MMS updated the facts after final approval":"The MMS updated the facts"); }
      await prSave(id, part, said.join(". "));
    } else if(cur && !cur.archived && !(cur.draft&&cur.draft.body) && !PR.writing[id] && !cur.draftErrAt) await prWrite(id, true);
  }
  /* CN-013: comment-period releases are erased (not archived), archived ones included */
  for(const r of vals("releases")) if(prIsCommentRel(r)) await remove("releases", r.id, true);
  /* CN-013: a Final or Candidate Recommendation release still headed "Seeks Public Comment" is rewritten as that
     announcement (the old draft is kept on the release) */
  for(const r of prAll()) if(prSeeksHeadline(r) && r.status!=="final" && !PR.writing[r.id]){
    await prSave(r.id, {draftOld:r.draft}, "Rewritten: the draft announced a comment period (CN-013)"); await prWrite(r.id, true); }
  await prApplyApprovals();
}

/* ---------- Claude's writing ---------- */
const PR_STYLE = `You write press releases for MISMO, the real estate finance industry's standards organization (a wholly owned subsidiary of the Mortgage Bankers Association). Match the house style of MISMO's published releases exactly. American spelling. Plain, factual, confident; no hype, no exclamation marks.

NEVER MENTION PUBLIC COMMENT. MISMO issues no press release for a comment period. A release is often written ahead, while the work is still out for public comment, and goes out only once the work reaches the status given: write it as announcing that Final or Candidate Recommendation status, never say the work is going out for comment, is in or was in a comment period, or invite comments, and never give comment dates.

NEVER INVENT FACTS. Use only the facts given in the material (the MMS announcement and, when present, the work-product catalog entry). If something the structure calls for is not in the material, write a clearly marked gap in square brackets, e.g. [KICKOFF DATE AND TIME NEEDED] or [WHO SHOULD DOWNLOAD IT: CONFIRM], instead of making it up. Spell every person's name and company exactly as the leaders list gives it. Brian Vieaux is spelled V-i-e-a-u-x.

STRUCTURE (one paragraph per item, blank line between paragraphs):
1. Headline: "MISMO [verb] [work product] [benefit]" (e.g. "MISMO Publishes AVM Accuracy Testing Guidance for Lenders", "MISMO Enhances SMART Doc® Implementation Guide to Support Secure, Digital Mortgage Processes", "MISMO Launches Workgroup to Standardize eNote Bailee Agreement"). Title case.
2. First paragraph begins exactly: "WASHINGTON, D.C. ([DATE]) – MISMO®, the real estate finance industry's standards organization, today announced…" (keep [DATE] as written; it is filled in when the release goes out). For a call for participation: "…today issued a call for participation in…".
3. What it is.
4. Why it matters.
5. The quote: a line that is exactly [QUOTE] on its own. Never write a quote yourself.
6. Who built it: "The [work product] was developed by MISMO's [workgroup]… The [Workgroup/Community of Practice] is led by co-chairs [Name, Company], [Name, Company]; and vice-chair [Name, Company]." Use the leaders list positions; omit what is not given.
7. Status: e.g. "The [work product] has achieved "Candidate Recommendation" status, indicating that the work product has achieved broad industry consensus and is ready for implementation." or Final status ("…has been thoroughly reviewed, and is ready for industry use."), then "MISMO encourages [who] to download and review the [work product]." Use the release status given.
8. Close, exactly: "MISMO's work to solve key industry challenges is made possible through the support of its members, champions, sponsors, and lenders (via the Innovation Investment Fee). To learn more about MISMO and opportunities to participate, visit MISMO.org."

A CALL FOR PARTICIPATION also gives: the kickoff date and time (only if given), who should participate as a bulleted list (lines starting "- "), that MISMO members can join through MISMO Connect, and the sponsor ask ("This MISMO workgroup is seeking a sponsor. Organizations interested in sponsoring this workgroup can contact info@mismo.org.").

EXAMPLES OF THE HOUSE STYLE (wording only; never reuse their facts):
${"`"}MISMO Publishes AVM Accuracy Testing Guidance for Lenders${"`"}
WASHINGTON, D.C. (September 29, 2026) – MISMO®, the real estate finance industry's standards organization, today announced the release of the Automated Valuation Model (AVM) Testing Guidance and Best Practices, a best-practice guide that gives lenders a standardized method for testing automated valuation models.
The AVM Testing Guidance and Best Practices was developed by the MISMO Automated Valuation Model Development Workgroup (DWG), which brings together AVM providers, testing firms, lenders, investors and other subject matter experts. The Workgroup is led by co-chairs Carla Nott, JPMorgan Chase, Erica Vigen, Clear Capital; and vice-chair Reena Agrawal, Veros Real Estate Solutions.
The AVM Testing Guidance and Best Practices has achieved "Candidate Recommendation" status, indicating that the work product has achieved broad industry consensus and is ready for implementation. MISMO encourages lenders, AVM providers and the 3rd party reviewers that support them to download and review the guide.
${"`"}MISMO Enhances SMART Doc® Implementation Guide to Support Secure, Digital Mortgage Processes${"`"}
Developed by MISMO's eMortgage Community of Practice, the SMART Doc® 1.02 Implementation Guide was created in response to ongoing industry demand for clear and consistent implementation guidance for electronic mortgage documents and eNotes. The Community of Practice is led by Epperson, Harry Gardner, ICE, Co-Chair; and David Garrett, DocMagic, Vice-Chair.
The SMART Doc® 1.02 Implementation Guide has achieved Final Status, indicating that the work product has achieved broad industry consensus, has been thoroughly reviewed, and is ready for industry use. MISMO encourages organizations utilizing eMortgage technologies to download and review the guide.
${"`"}MISMO Launches Workgroup to Standardize eNote Bailee Agreement${"`"}
WASHINGTON, D.C. (October 6, 2026) – MISMO®, the real estate finance industry's standards organization, today issued a call for participation in a new Development Workgroup that will create a standardized industry template for Tri-Party eNote Bailee Agreements… The kickoff meeting will be held Thursday, October 22, 2026, from 2:00 to 3:00 p.m. ET.
MISMO is seeking participation from:
- Mortgage lenders, who negotiate agreements with their warehouse lenders and investors
- Warehouse lenders, who maintain agreements across their lender clients and those lenders' investors
MISMO members can join the workgroup through MISMO Connect. This MISMO workgroup is seeking a sponsor. Organizations interested in sponsoring this workgroup can contact info@mismo.org.`;

function prFacts(r){
  const a=Object.assign({}, r.ann||{}); delete a.mmsUrl;   /* the MMS link is for staff, not the release */
  /* the draft-ahead fields and comment dates are about timing, not facts for the release (CN-010) */
  PR_FLAGS.concat(["commentOpens","commentCloses"]).forEach(k=>delete a[k]);
  if(prIsUrl(a.publicName)){ a.websitePage=String(a.publicName).trim(); delete a.publicName; }   /* an address, not a name */
  return "MMS ANNOUNCEMENT (the only source of facts):\n"+JSON.stringify(a,null,1)+(r.cat?"\n\nWORK-PRODUCT CATALOG ENTRY:\n"+JSON.stringify(r.cat,null,1):"");
}
async function prWrite(id, quiet){
  const r=prGet(id); if(!r || PR.writing[id]) return;
  const say=quiet?(()=>{}):toast; PR.writing[id]=true; if(PR.sel===id && TAB==="press") renderPress();
  try{
    say("Writing the first draft…", 90000);
    const kind=PR_TYPE[r.type]||"Release";
    const raw=await writer(PR_STYLE+"\n\nWrite the press release for this "+kind+" announcement. Return ONLY a JSON object: {\"headline\": the headline, \"body\": the release from the WASHINGTON, D.C. paragraph to the close, paragraphs separated by one blank line, with [QUOTE] on its own line where the quote goes}.", prFacts(r));
    const o=parseJson(raw);
    if(!o || !o.body) throw new Error("the Writer sent back something unexpected");
    await prSave(id, {draft:{headline:String(o.headline||"").trim(), body:String(o.body||"").trim(), at:new Date().toISOString(), by:"Claude"}, draftErrAt:""}, "Claude wrote the first draft");
    say("First draft written.", 3000);
  }catch(e){ await prSave(id, {draftErrAt:new Date().toISOString(), draftErr:e.message||"try again"}, ""); say("Couldn't write it: "+(e.message||"try again"), 6000); }
  finally{ PR.writing[id]=false; if(TAB==="press") renderPress(); }
}
async function prSuggest(id){
  const r=prGet(id); if(!r) return;
  try{
    toast("Thinking about who to quote…", 60000);
    const raw=await writer("Suggest 2 or 3 people MISMO could quote in this press release, each with a one-sentence reason. Draw first on the leaders list in the facts (workgroup co-chairs and vice-chairs, with their exact names, positions and companies) and Brian Vieaux, President of MISMO. You may also suggest a kind of person to find when that would make the release stronger (for example \"a servicer using the dataset\" for a servicing product): then leave name empty and describe them in title. Never invent a named person. Return ONLY JSON: {\"suggestions\": [{\"name\":\"\",\"title\":\"\",\"company\":\"\",\"reason\":\"\"}]}.", prFacts(r)+"\n\nDRAFT:\n"+((r.draft&&r.draft.body)||""));
    const o=parseJson(raw); const list=((o&&o.suggestions)||[]).slice(0,3).map(s=>({name:String(s.name||"").trim(), title:String(s.title||"").trim(), company:String(s.company||"").trim(), reason:String(s.reason||"").trim()}));
    if(!list.length) throw new Error("no suggestions came back");
    await prSave(id, {suggestions:list, suggestedAt:new Date().toISOString()}, "Claude suggested who to quote");
    toast("Suggestions ready.", 2500);
  }catch(e){ toast("Couldn't suggest anyone: "+(e.message||"try again"), 6000); }
  if(TAB==="press") renderPress();
}
async function prWriteRequest(id){
  const r=prGet(id); if(!r || !r.source || !r.source.name) return;
  try{
    toast("Drafting the quote request…", 60000);
    const raw=await writer("Write a short, warm email from Perry Williams at MISMO asking "+r.source.name+(r.source.title?", "+r.source.title:"")+(r.source.company?" at "+r.source.company:"")+" for a quote for the attached draft press release. Say what the release announces in one sentence, ask whether they would be willing to be quoted, offer a suggested quote of 2 or 3 sentences in their voice that they can edit or replace (clearly labeled as a suggestion), ask them to reply with the quote they approve, and give a reply-by date of "+prLongDate(prBizAdd(T(),3))+". Plain text, no subject line in the body, sign off as Perry Williams, MISMO. American spelling. Use only the facts given. Return ONLY JSON: {\"subject\":\"\",\"body\":\"\",\"suggestedQuote\":\"\"}.", prFacts(r)+"\n\nDRAFT RELEASE:\n"+prText(r));
    const o=parseJson(raw); if(!o || !o.body) throw new Error("the Writer sent back something unexpected");
    await prSave(id, {request:Object.assign({}, r.request||{}, {subject:String(o.subject||"").trim()||("Quote request: "+prTitle(r)), body:String(o.body||"").trim(), suggested:String(o.suggestedQuote||"").trim(), writtenAt:new Date().toISOString()})}, "Claude drafted the quote request");
  }catch(e){ toast("Couldn't draft it: "+(e.message||"try again"), 6000); }
  if(TAB==="press") renderPress();
}

/* ---------- the release text ---------- */
function prText(r, opts){
  const d=r.draft||{}; let b=String(d.body||"");
  const date=r.releaseDate?prLongDate(r.releaseDate):"";
  if(date) b=b.replace(/\[DATE\]/g, date);
  if(opts && opts.quote===false) b=b.replace(/^\s*\[QUOTE\]\s*$/m,"");
  return ((d.headline||"")+"\n\n"+b).trim();
}
function prParas(text){ return String(text||"").replace(/\r/g,"").split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean); }
function prHtml(r, style){
  const F="font-family:Arial,Helvetica,sans-serif;", ink="#0d314c", body="#1d2b36";
  const d=r.draft||{}; const paras=prParas(prText(r).split("\n").slice(1).join("\n"));
  const p=x=>{ const lines=x.split("\n"), bullets=lines.filter(l=>/^\s*[-•]\s+/.test(l));
    if(bullets.length && bullets.length===lines.length-1 || (bullets.length && bullets.length===lines.length)){
      const lead=bullets.length===lines.length?"":lines[0];
      return (lead?'<p style="'+F+'font-size:15px;line-height:1.6;color:'+body+';margin:0 0 8px">'+esc(lead)+'</p>':'')+'<ul style="'+F+'font-size:15px;line-height:1.6;color:'+body+';margin:0 0 14px;padding-left:22px">'+bullets.map(l=>'<li style="margin:0 0 4px">'+esc(l.replace(/^\s*[-•]\s+/,""))+'</li>').join("")+'</ul>'; }
    const hot=/\[[A-Z][^\]]*\]/.test(x);
    return '<p style="'+F+'font-size:15px;line-height:1.6;color:'+body+';margin:0 0 14px'+(hot?';background:#fff6e0':'')+'">'+esc(x).replace(/\n/g,"<br>")+'</p>'; };
  return (style==="bare"?'':'<h2 style="'+F+'font-size:22px;line-height:1.3;color:'+ink+';margin:0 0 14px">'+esc(d.headline||"")+'</h2>')+paras.map(p).join("");
}

/* ---------- names and spelling ---------- */
function prLev(a,b){ a=a.toLowerCase(); b=b.toLowerCase(); const m=a.length, n=b.length; if(Math.abs(m-n)>3) return 9; const d=Array.from({length:m+1},(_,i)=>[i]); for(let j=1;j<=n;j++) d[0][j]=j;
  for(let i=1;i<=m;i++) for(let j=1;j<=n;j++) d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1)); return d[m][n]; }
function prPeople(r){
  const out=[]; ((r.ann&&r.ann.leaders)||[]).forEach(l=>{ if(l&&l.name) out.push({name:String(l.name).trim(), company:String(l.company||"").trim(), position:String(l.position||"").trim(), from:"MMS leaders list"}); });
  out.push({name:PR_BRIAN.name, company:"MISMO", position:PR_BRIAN.title, from:"MISMO"});
  if(r.quote && r.quote.name) out.push({name:r.quote.name, company:r.quote.company||"", position:r.quote.title||"", from:"the approved quote"});
  else if(r.source && r.source.name) out.push({name:r.source.name, company:r.source.company||"", position:r.source.title||"", from:"the quote source"});
  if(r.ann && r.ann.facilitator) out.push({name:String(r.ann.facilitator).trim(), company:"MISMO", position:"Facilitator", from:"MMS"});
  return out;
}
const PR_UK = [["organisation","organization"],["organise","organize"],["standardise","standardize"],["standardisation","standardization"],["behaviour","behavior"],["colour","color"],["favour","favor"],["programme","program"],["centre","center"],["catalogue","catalog"],["analyse","analyze"],["prioritise","prioritize"],["recognise","recognize"],["utilise","utilize"],["licence","license"],["enrol","enroll"],["modelling","modeling"],["travelled","traveled"],["cancelled","canceled"]];
function prChecks(r){
  const text=prText(r), out=[]; if(!text.trim()) return out;
  const people=prPeople(r), names=people.map(p=>p.name);
  /* anything that looks like a misspelling of a known name (Brian Vieaux was once misspelled in a release) */
  const seen=new Set();
  (text.match(/\b[A-Z][a-zA-Z'’.-]+(?:\s+[A-Z][a-zA-Z'’.-]+){1,2}\b/g)||[]).forEach(cand=>{
    if(seen.has(cand)) return; seen.add(cand);
    if(names.includes(cand)) return;
    for(const n of names){ const parts=n.split(/\s+/); const tryOn=[cand].concat(cand.split(/\s+/).length>2?[cand.split(/\s+/).slice(0,2).join(" "),cand.split(/\s+/).slice(1).join(" ")]:[]);
      for(const t of tryOn){ const dd=prLev(t,n); if(dd>0 && dd<=2 && t.split(/\s+/).length===parts.length){ out.push({level:"bad", msg:'"'+t+'" looks like a misspelling of '+n+'.'}); return; } } }
  });
  if(/\bVie(?!aux\b)[a-z]{1,5}\b/.test(text)) out.push({level:"bad", msg:"Brian's last name is spelled Vieaux."});
  /* each leader named in the release is named with the company the MMS gives */
  people.filter(p=>p.from==="MMS leaders list").forEach(p=>{
    const i=text.indexOf(p.name); if(i<0) return;
    if(p.company && text.slice(i, i+p.name.length+160).indexOf(p.company)<0 && text.indexOf(p.company)<0) out.push({level:"warn", msg:p.name+" is named, but not their company as the MMS has it ("+p.company+")."}); });
  ((r.ann&&r.ann.leaders)||[]).forEach(l=>{ if(l && l.name && /chair/i.test(l.position||"") && text.indexOf(l.name)<0) out.push({level:"warn", msg:l.name+" ("+(l.position||"leader")+", "+(l.company||"")+") isn't named in the release."}); });
  PR_UK.forEach(([uk,us])=>{ const re=new RegExp("\\b"+uk+"(s|d|ing)?\\b","i"); const m=text.match(re); if(m) out.push({level:"warn", msg:'"'+m[0]+'" is British spelling; use "'+us+(m[1]||"")+'".'}); });
  /* CN-010: a release never says the work is going out for, or is in, public comment */
  const cm=text.match(/[^.\n]*\b(?:comment(?:s|ing|ed)?|comment period)\b[^.\n]*/i);
  if(cm && r.type!=="cfp") out.push({level:"bad", kind:"comment", msg:'The release mentions comments ("'+cm[0].trim().slice(0,90)+'"). It announces the '+(((r.ann||{}).releaseStatus)||"Final or Candidate Recommendation")+' only: take any mention of public comment out.'});
  const gaps=(text.match(/\[[A-Z][^\]]{1,80}\]/g)||[]).filter(g=>g!=="[QUOTE]" && g!=="[DATE]");
  [...new Set(gaps)].forEach(g=>out.push({level:"warn", msg:"Still to fill in: "+g}));
  return out;
}

/* ---------- Amy: the quote source ---------- */
function prAmySubject(r){ return "Approval needed: who to quote in the press release \""+prTitle(r)+"\" [MM:"+r.id+"]"; }
function prAmyMailto(r, body){ return "mailto:"+LI_REPLY_TO+"?subject="+encodeURIComponent("RE: "+prAmySubject(r))+"&body="+encodeURIComponent(body); }
function prAmyEmail(r){
  const F='font-family:Arial,Helvetica,sans-serif;', s=r.source||{};
  const others=(r.suggestions||[]).filter(x=>x.name && x.name!==s.name);
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f6fa;padding:24px 0"><tr><td align="center">'+
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #d5e2ed">'+
    '<tr><td style="background:#0d314c;padding:18px 28px;'+F+'color:#ffffff;font-size:13px;letter-spacing:2px;font-weight:bold">MISMO MEDIA <span style="color:#74bfeb;font-weight:normal">· PRESS RELEASE · APPROVAL NEEDED</span></td></tr>'+
    '<tr><td style="padding:26px 28px 6px;'+F+'color:#0d314c"><div style="font-size:21px;font-weight:bold;line-height:1.3;margin:0 0 8px">Who should we quote?</div>'+
      '<div style="font-size:15px;line-height:1.6;color:#44607a">Hi Amy, Perry would like to ask the person below for a quote for the press release <b style="color:#0d314c">'+esc(prTitle(r))+'</b>.</div></td></tr>'+
    '<tr><td style="padding:12px 28px 0;'+F+'"><div style="font-size:11px;letter-spacing:1.5px;font-weight:bold;color:#56718a;margin:0 0 6px">PROPOSED QUOTE SOURCE</div>'+
      '<div style="font-size:16px;color:#0d314c;border-left:4px solid #74bfeb;padding:10px 12px;background:#f6fafd"><b>'+esc(s.name||"")+'</b>'+(s.title?', '+esc(s.title):'')+(s.company?', '+esc(s.company):'')+(s.reason?'<div style="font-size:14px;color:#44607a;margin-top:6px">'+esc(s.reason)+'</div>':'')+'</div></td></tr>'+
    (others.length?'<tr><td style="padding:14px 28px 0;'+F+'"><div style="font-size:11px;letter-spacing:1.5px;font-weight:bold;color:#56718a;margin:0 0 6px">OTHER SUGGESTIONS</div>'+others.map(o=>'<div style="font-size:14px;line-height:1.5;color:#0d314c;margin:0 0 6px">'+esc(o.name)+(o.title?', '+esc(o.title):'')+(o.company?', '+esc(o.company):'')+(o.reason?' <span style="color:#56718a">· '+esc(o.reason)+'</span>':'')+'</div>').join("")+'</td></tr>':'')+
    '<tr><td style="padding:22px 28px 6px;'+F+'"><table role="presentation" cellpadding="0" cellspacing="0"><tr>'+
      '<td style="background:#0f7b5c;border-radius:6px"><a href="'+prAmyMailto(r,"Approved")+'" style="display:inline-block;padding:13px 28px;'+F+'font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none">Approve</a></td><td style="width:10px"></td>'+
      '<td style="border:1.5px solid #1a8fe3;border-radius:6px"><a href="'+prAmyMailto(r,"Please quote instead:\n\n")+'" style="display:inline-block;padding:12px 22px;'+F+'font-size:15px;font-weight:bold;color:#1a8fe3;text-decoration:none">Choose Someone Else</a></td></tr></table>'+
      '<div style="font-size:13px;color:#44607a;line-height:1.6;margin-top:10px"><b>Approve</b> opens a reply that already says Approved: press Send and it&rsquo;s done. <b>Choose Someone Else</b> opens a reply for the name, title and company you&rsquo;d rather quote. You can also just reply to this email.</div></td></tr>'+
    '<tr><td style="padding:18px 28px 6px;'+F+'"><div style="font-size:11px;letter-spacing:1.5px;font-weight:bold;color:#56718a;margin:0 0 8px">THE DRAFT RELEASE</div>'+prHtml(r)+'</td></tr>'+
    '<tr><td style="padding:16px 28px 22px;'+F+'font-size:12px;color:#56718a;border-top:1px solid #e5eef5">Sent from MISMO Media by '+esc(prWho())+'. Keep the [MM:…] tag in the subject so your reply finds its release.</td></tr>'+
    '</table></td></tr></table>';
}
async function prSendAmy(id){
  const r=prGet(id); if(!r || !r.source || !r.source.name) { toast("Pick who to quote first.", 4000); return; }
  if(!prIsPerry()){ toast("Perry sends this from his own MISMO Media sign-in.", 5000); return; }
  const n=window.__hqImages && window.__hqImages.notify; if(!n){ toast("Sending works on resources.mismo.org.", 5000); return; }
  try{ toast("Sending to Amy…", 20000); await n(PR_AMY.email, prAmySubject(r), prAmyEmail(r));
    await prSave(id, {status:"source", source:Object.assign({}, r.source, {sentAt:new Date().toISOString(), sentBy:prWho()}), amy:null}, "Sent the quote source to Amy for approval");
    toast("Sent to Amy. Her reply lands here.", 4000); }
  catch(e){ toast("It didn't send: "+(e.message||"try again"), 6000); }
  renderPress();
}
async function prApplyApprovals(){
  if(!LOADED.has("approvals")) return;
  for(const a of vals("approvals").sort((x,y)=>String(x.at).localeCompare(String(y.at)))){
    if(!/^pr-/.test(String(a.ref||""))) continue;
    const r=prGet(a.ref); if(!r || (r.amySeen||[]).includes(a.id)) continue;
    const seen=(r.amySeen||[]).concat([a.id]);
    /* a reply to an earlier ask (the source was changed and sent again since) only gets noted */
    if(r.status!=="source" || (r.source&&r.source.sentAt && String(a.at||"")<String(r.source.sentAt))){ await prSave(a.ref, {amySeen:seen}, ""); continue; }
    if(a.decision==="approved") await prSave(a.ref, {amySeen:seen, status:"request", amy:{decision:"approved", text:String(a.text||"").replace(/^(approved?|looks good|good to go|all good|yes)[.!,:\s-]*/i,"").trim(), at:a.at, from:a.from||"Amy"}}, "Amy approved the quote source");
    else await prSave(a.ref, {amySeen:seen, amy:{decision:"edits", text:String(a.text||""), at:a.at, from:a.from||"Amy"}}, "Amy asked for someone else");
  }
}

/* ---------- sending as Perry ---------- */
async function prSendAs(msg){
  if(!prIsPerry()) throw new Error("only Perry can send these, from his own sign-in");
  if(!PR_SEND_FLOW) throw new Error("the Send As Perry connection isn't set up yet");
  const rs=window.ResourcesSession, tok=rs && rs.token && rs.token(); if(!tok) throw new Error("sign in to resources.mismo.org first");
  const r=await fetch(PR_SEND_FLOW,{method:"POST", cache:"no-store", headers:{"Content-Type":"text/plain;charset=UTF-8"}, body:JSON.stringify(Object.assign({token:tok}, msg))});
  const j=await r.json().catch(()=>({}));
  if(!r.ok || !j.ok) throw new Error(j.error||("the send flow answered "+r.status));
  return j;
}
function prEmailShell(inner, note){
  const F='font-family:Arial,Helvetica,sans-serif;';
  return '<div style="'+F+'font-size:15px;line-height:1.6;color:#1d2b36">'+inner+(note?'<div style="'+F+'font-size:12px;color:#56718a;margin-top:18px">'+note+'</div>':'')+'</div>';
}
function prRequestHtml(r){
  const q=r.request||{}, F='font-family:Arial,Helvetica,sans-serif;';
  return prEmailShell(esc(q.body||"").replace(/\n/g,"<br>")+
    '<div style="margin:24px 0 0;border-top:2px solid #74bfeb;padding-top:16px"><div style="'+F+'font-size:11px;letter-spacing:1.5px;font-weight:bold;color:#56718a;margin:0 0 10px">DRAFT PRESS RELEASE (NOT FOR DISTRIBUTION)</div>'+prHtml(r)+'</div>');
}
async function prSendRequest(id){
  const r=prGet(id), q=(r&&r.request)||{};
  if(!r || !q.to || !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(q.to)) { toast("Add their email address first.", 4000); return; }
  if(!q.body){ toast("Write the email first.", 4000); return; }
  try{ toast("Sending as Perry…", 30000);
    await prSendAs({kind:"quote-request", to:q.to, ccAmy:true, subject:q.subject||("Quote request: "+prTitle(r)), html:prRequestHtml(r)});
    await prSave(id, {request:Object.assign({}, q, {sentAt:new Date().toISOString(), sentBy:prWho()})}, "Sent the quote request to "+(q.toName||q.to)+" (Amy copied)");
    toast("Sent from Perry's address, Amy copied. Replies go to Perry.", 5000); }
  catch(e){ toast("It didn't send: "+(e.message||"try again"), 7000); }
  renderPress();
}

/* ---------- the approved quote ---------- */
function prQuotePara(q){
  let t=String(q.text||"").trim().replace(/^["“”]+|["“”]+$/g,"");
  const who=q.name+(q.title||q.company?", "+[q.title, q.company&&q.company!=="MISMO"?q.company:""].filter(Boolean).join(" at ")+(q.company==="MISMO"?" of MISMO":""):"");
  const m=t.match(/^(.*?[.!?])\s+(.+)$/s);
  if(m){ const first=m[1].replace(/\.$/,","); return "“"+first+"” said "+who+". “"+m[2]+"”"; }
  return "“"+t.replace(/\.$/,",")+"” said "+who+".";
}
async function prPutQuote(id, v){
  const r=prGet(id); if(!r) return;
  const q={text:v.text.trim(), name:v.name.trim(), title:v.title.trim(), company:v.company.trim(), approval:v.approval.trim(), approvalAt:v.approvalAt, addedAt:new Date().toISOString(), addedBy:prWho()};
  if(!q.text || !q.name){ toast("Add the quote and who said it.", 4000); return; }
  if(!q.approval || !q.approvalAt){ toast("A quote only goes in with the person's written approval: paste their approval and its date.", 6000); return; }
  let body=String((r.draft&&r.draft.body)||""), para=prQuotePara(q);
  if(/^\s*\[QUOTE\]\s*$/m.test(body)) body=body.replace(/^\s*\[QUOTE\]\s*$/m, para);
  else if(r.quote && r.quote.para && body.indexOf(r.quote.para)>=0) body=body.replace(r.quote.para, para);
  else { const ps=prParas(body); const at=ps.findIndex(p=>/developed by|led by|is led/i.test(p)); ps.splice(at>0?at:Math.max(1,ps.length-2),0,para); body=ps.join("\n\n"); }
  q.para=para;
  await prSave(id, {quote:q, status:r.status==="final"?"final":"quote", draft:Object.assign({}, r.draft, {body})}, "Put in the approved quote from "+q.name);
  toast("Quote in, with the approval kept on the release.", 4000); renderPress();
}

/* ---------- distribution ---------- */
function prConnectHtml(r){
  const F='font-family:Arial,Helvetica,sans-serif;';
  return '<div style="'+F+'max-width:680px;border:1px solid #d5e2ed;border-radius:6px;overflow:hidden">'+
    '<div style="background:#0d314c;padding:14px 22px;'+F+'color:#ffffff;font-size:12px;letter-spacing:2px;font-weight:bold">MISMO NEWS <span style="color:#74bfeb;font-weight:normal">· PRESS RELEASE</span></div>'+
    '<div style="padding:20px 22px 10px">'+prHtml(r)+
      (r.out&&r.out.link?'<p style="'+F+'font-size:15px;margin:6px 0 14px"><a href="'+esc(r.out.link)+'" style="color:#14486e;font-weight:bold">Read the release&nbsp;&rarr;</a></p>':'')+'</div></div>';
}
function prSettings(){ const s=(S.settings||{}).press||{}; return Object.assign({}, s, {brittney:String(s.brittney||"").trim()||PR_BRITTNEY.email}); }
async function prSendVanessa(id){
  const r=prGet(id); if(!r || prHoldStop(r)) return;
  try{ toast("Sending to Vanessa as Perry…", 30000);
    await prSendAs({kind:"connect", to:PR_VANESSA.email, ccAmy:false, subject:"For MISMO Connect: "+prTitle(r),
      html:prEmailShell('<p>Hi Vanessa,</p><p>Here is the final press release for MISMO Connect, ready to post'+(r.releaseDate?' on '+esc(prLongDate(r.releaseDate)):'')+'. The branded version is below; the HTML is also attached in MISMO Media (Press Releases &rsaquo; Copy Connect HTML).</p><p>Thanks,<br>Perry</p>'+
        '<div style="margin-top:18px">'+prConnectHtml(r)+'</div>')});
    await prSave(id, {out:Object.assign({}, r.out||{}, {vanessaAt:new Date().toISOString()})}, "Sent the MISMO Connect post to Vanessa");
    toast("Sent to Vanessa.", 3000); }catch(e){ toast("It didn't send: "+(e.message||"try again"), 7000); }
  renderPress();
}
async function prSendBrittney(id){
  const r=prGet(id), to=String(prSettings().brittney||"").trim(); if(!r || prHoldStop(r)) return;
  if(!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(to)){ toast("Add Brittney's email address under MBA Newsroom first.", 5000); return; }
  try{ toast("Sending to Brittney as Perry…", 30000);
    await prSendAs({kind:"newsroom", to, ccAmy:false, subject:"MISMO press release for the MBA newsroom: "+prTitle(r),
      html:prEmailShell('<p>Hi Brittney,</p><p>Here is MISMO&rsquo;s final press release'+(r.releaseDate?' for '+esc(prLongDate(r.releaseDate)):'')+' for the MBA newsroom.</p><p>Thanks,<br>Perry</p><div style="margin-top:18px;border-top:2px solid #74bfeb;padding-top:16px">'+prHtml(r)+'</div>')});
    await prSave(id, {out:Object.assign({}, r.out||{}, {mbaAt:new Date().toISOString()})}, "Sent the newsroom copy to Brittney at MBA");
    toast("Sent to Brittney.", 3000); }catch(e){ toast("It didn't send: "+(e.message||"try again"), 7000); }
  renderPress();
}
async function prOfferMatters(id){
  const r=prGet(id); if(!r || prHoldStop(r)) return; const o=r.out||{};
  const nid="n-"+r.id; const cur=(S.news||{})[nid]||{};
  await put("news", nid, Object.assign({}, cur, {id:nid, headline:prTitle(r), outlet:"MISMO Press Release", date:r.releaseDate||T(), kind:"press", url:o.link||"https://www.mismo.org/about-mismo/news", notes:"From Press Releases ("+prTitle(r)+").", fromRelease:r.id}));
  await prSave(id, {out:Object.assign({}, o, {mattersAt:new Date().toISOString(), mattersNewsId:nid})}, "Offered to MISMO Matters (In the News)");
  toast("Added to In the News for that month's MISMO Matters.", 4000); renderPress();
}
async function prAskLinkedin(id){
  const r=prGet(id); if(!r || prHoldStop(r)) return; const o=r.out||{}; const rid="rq-"+r.id;
  await put("requests", rid, Object.assign({}, (S.requests||{})[rid]||{}, {id:rid, title:"LinkedIn post: "+prTitle(r), type:"linkedin", status:"new", n:PR_OWNER.name, e:PR_OWNER.email, role:"MISMO Staff",
    neededBy:r.releaseDate||T(), at:new Date().toISOString(), details:"Please share MISMO's press release on the MISMO LinkedIn page"+(o.link?": "+o.link:".")+"\n\n"+prText(r), fromRelease:r.id}));
  await prSave(id, {out:Object.assign({}, o, {linkedinAt:new Date().toISOString(), linkedinReq:rid})}, "Asked for a LinkedIn post (Requests)");
  toast("LinkedIn post request added to Requests.", 4000); renderPress();
}

/* ---------- Home, the Schedule and the left menu ---------- */
function prEvents(){
  const ev=[];
  prAll().forEach(r=>{ const d=prReminderDue(r);
    if(d) ev.push({date:d, k:"press", label:"Press Release · Follow Up on the Quote: "+prTitle(r), done:false, who:"Perry", go:()=>{ go("press"); PR.sel=r.id; renderPress(); }});
    if(r.releaseDate && r.status!=="final") ev.push({date:r.releaseDate, k:"press", label:"Press Release · "+prTitle(r), done:false, who:"Perry", go:()=>{ go("press"); PR.sel=r.id; renderPress(); }}); });
  return ev;
}

/* ---------- the page ---------- */
const PR_STAT = {draft:["Perry's Review","review"], source:["With Amy","wait"], request:["Quote Request","in"], quote:["Ready for Final","in"], final:["Approved","ok"]};
function prChip(r){ if(PR.writing[r.id]) return '<span class="chip wait">Writing…</span>'; if(prLate(r)) return '<span class="chip changes">Follow Up</span>'; if(r.status==="source" && r.amy && r.amy.decision==="edits") return '<span class="chip changes">Amy Asked for Changes</span>'; if(r.status==="final" && prHeld(r)) return '<span class="chip wait">Finished, Held</span>'; return chip(PR_STAT, r.status||"draft"); }
function renderPress(){
  const el=$("#page-press"); if(!el) return;
  const all=prAll().sort((a,b)=>String(b.createdAt||"").localeCompare(String(a.createdAt||""))), feed=PR.feed;
  const n=k=>all.filter(r=>(r.status||"draft")===k).length, late=all.filter(prLate).length;
  const mo=T().slice(0,7), outMo=all.filter(r=>r.status==="final" && String((r.final||{}).at||"").slice(0,7)===mo).length;
  if(PR.sel && !prGet(PR.sel)) PR.sel=null;
  /* CN-010: Draft Now (drafted ahead, held) and Ready to Post (the work reached Release, not posted yet) */
  const dnAll=all.filter(prHeld), rpAll=all.filter(r=>prToPost(r) && !prPosted(r));
  const inView=r=>PR.view==="draftnow"?prHeld(r):PR.view==="ready"?(prToPost(r) && !prPosted(r)):(PR.showDone || r.status!=="final" || r.id===PR.sel || (prToPost(r) && !prPosted(r)));
  const q=PR.q.trim().toLowerCase(), list=all.filter(r=>inView(r) && (!q || [prTitle(r), r.ann&&r.ann.workgroup, r.ann&&r.ann.name].join(" ").toLowerCase().includes(q)));
  const feedLine = PR.feedErr ? '<span class="pr-bad">Can\'t read the MMS announcements feed right now ('+esc(PR.feedErr)+').</span>' :
    feed ? 'MMS announcements feed: '+feed.list.length+' entr'+(feed.list.length===1?'y':'ies')+(feed.updated?', updated '+esc(hhWhen?hhWhen(feed.updated):feed.updated):'')+'. New entries start a release with a first draft.' : 'Reading the MMS announcements feed…';
  el.innerHTML='<div class="phead"><div><div class="eyebrow">Perry Williams &middot; Quote Sources Approved by Amy Moses</div><h1>Press Releases</h1><div class="sub">Every release announcement from the MMS gets a first draft here. Perry edits it, Amy approves who is quoted, the quote request goes out as Perry, and the final release goes to MISMO Connect, the MBA newsroom, MISMO Matters and LinkedIn. <b>Draft Now</b> releases are finished and held while the work is still on its way; they go out once the MMS marks them <b>Ready to Post</b>. Comment periods get no release.</div></div>'+
      '<div class="tools"><button class="btn" type="button" id="pr-feed">Check the Feed Now</button><button class="btn" type="button" id="pr-mba">MBA Newsroom Contact</button></div></div>'+
    '<div class="band"><div class="tiles">'+
      '<button type="button" class="tile pr-vt'+(PR.view==="draftnow"?" on":"")+'" data-prv="draftnow" aria-pressed="'+(PR.view==="draftnow")+'"><div class="v sky">'+dnAll.length+'</div><div class="k">Draft Now</div><div class="s">finish and hold'+(dnAll.filter(r=>r.status==="final").length?' · '+dnAll.filter(r=>r.status==="final").length+' held':'')+'</div></button>'+
      '<button type="button" class="tile pr-vt'+(PR.view==="ready"?" on":"")+'" data-prv="ready" aria-pressed="'+(PR.view==="ready")+'"><div class="v'+(rpAll.length?" hot":"")+'">'+rpAll.length+'</div><div class="k">Ready to Post</div><div class="s">the work reached Release</div></button>'+
      '<div class="tile"><div class="v'+(n("draft")?" hot":"")+'">'+n("draft")+'</div><div class="k">Perry\'s Review</div><div class="s">first drafts to read over</div></div>'+
      '<div class="tile"><div class="v">'+n("source")+'</div><div class="k">With Amy</div><div class="s">who to quote</div></div>'+
      '<div class="tile"><div class="v'+(late?" hot":"")+'">'+n("request")+'</div><div class="k">Waiting on a Quote</div><div class="s">'+(late?late+" past 3 business days":"quote requests out")+'</div></div>'+
      '<div class="tile"><div class="v sky">'+n("quote")+'</div><div class="k">Ready for Final</div><div class="s">quote in, approval kept</div></div>'+
      '<div class="tile"><div class="v">'+outMo+'</div><div class="k">Approved This Month</div><div class="s">'+esc(MONL[+mo.slice(5)-1])+'</div></div>'+
    '</div><div class="pr-feedline">'+feedLine+'</div></div>'+
    '<div class="card"><div class="ch"><h2>'+(PR.view==="draftnow"?"Draft Now":PR.view==="ready"?"Ready to Post":"Releases")+'</h2><span class="cnt">'+list.length+'</span>'+(PR.view?'<button class="btn sm" type="button" id="pr-all">Show All Releases</button>':'')+'<div class="r" style="align-items:center"><input type="search" class="plain" id="pr-q" placeholder="Search releases" value="'+esc(PR.q)+'" style="width:200px"><button class="btn sm" type="button" id="pr-done" aria-pressed="'+PR.showDone+'">'+(PR.showDone?"Hide":"Show")+' Approved</button></div></div>'+
      (list.length?'<div class="tw"><table class="t"><thead><tr><th>Release</th><th>Type</th><th>Workgroup</th><th>Started</th><th>Status</th></tr></thead><tbody>'+
        list.map(r=>'<tr class="click'+(r.id===PR.sel?" sel":"")+'" data-pr="'+esc(r.id)+'"><td><b>'+esc(prTitle(r))+'</b>'+(prTags(r)?'<span class="pr-tags">'+prTags(r)+'</span>':'')+(r.annChangedAt&&r.status!=="final"?'<span class="t2">The MMS updated the facts '+esc(fS(localDay(r.annChangedAt)))+'</span>':'')+'</td><td>'+esc(PR_TYPE[r.type]||"Release")+'</td><td>'+esc((r.ann&&r.ann.workgroup)||"")+'</td><td>'+esc(fS(localDay(r.createdAt)))+'</td><td>'+prChip(r)+'</td></tr>').join("")+'</tbody></table></div>'
        :'<div class="empty"><b>No releases yet.</b> When the MMS adds an announcement to its feed (it checks every 30 minutes), a release starts here with Claude\'s first draft.</div>')+'</div>'+
    (PR.sel?prDetail(prGet(PR.sel)):'');
  $("#pr-feed",el).onclick=async()=>{ toast("Checking the MMS feed…", 20000); await prLoadFeed(true); if(LEADER) await prSync(); toast("Checked.", 2000); renderPress(); };
  $("#pr-mba",el).onclick=prOpenSettings;
  $("#pr-done",el).onclick=()=>{ PR.showDone=!PR.showDone; renderPress(); };
  $$("[data-prv]",el).forEach(b=>b.onclick=()=>{ PR.view=PR.view===b.dataset.prv?"":b.dataset.prv; renderPress(); });
  const pa=$("#pr-all",el); if(pa) pa.onclick=()=>{ PR.view=""; renderPress(); };
  const qi=$("#pr-q",el); qi.oninput=()=>{ PR.q=qi.value; clearTimeout(qi._t); qi._t=setTimeout(()=>{ renderPress(); const x=$("#pr-q"); if(x){ x.focus(); x.setSelectionRange(x.value.length,x.value.length); } },250); };
  $$("[data-pr]",el).forEach(t=>t.onclick=()=>{ PR.sel=t.dataset.pr; renderPress(); const d=$("#pr-detail"); if(d) d.scrollIntoView({behavior:"smooth",block:"start"}); });
  if(PR.sel) prWire(el, prGet(PR.sel));
  if(!PR.feed && !PR._loading){ PR._loading=true; prLoadFeed().then(()=>{ PR._loading=false; if(TAB==="press") renderPress(); }); }
}
function prOpenSettings(){
  const s=prSettings();
  openPane({eye:"Press Releases", title:"MBA Newsroom Contact", data:{brittney:s.brittney||""}, fields:[
    {k:"_n",type:"html",html:()=>'<div class="ro">Brittney Prophete at MBA gets a copy of each final release for MBA\'s newsroom. Her edits stay on her side. Perry presses Send for each one.</div>'},
    {k:"brittney",label:"Brittney Prophete's email address",wide:true}],
    save:async v=>{ await put("settings","press",Object.assign({}, s, {brittney:String(v.brittney||"").trim()})); }});
}
function prSec(n, title, state, inner){ return '<div class="pr-sec '+state+'"><div class="pr-sh"><span class="pr-n">'+n+'</span><h3>'+esc(title)+'</h3></div><div class="pr-sb">'+inner+'</div></div>'; }
function prDetail(r){
  if(!r) return "";
  const a=r.ann||{}, step=prStepOf(r), si=PR_STEPS.findIndex(s=>s[0]===step), perry=prIsPerry();
  const st=k=>{ const i=PR_STEPS.findIndex(s=>s[0]===k); return i<si?"done":i===si?"now":"later"; };
  const onlyPerry=perry?'':'<div class="pr-note">Perry does this step from his own sign-in.</div>';
  const checks=prChecks(r);
  const facts=[["Type",PR_TYPE[r.type]||"Release"],["Work product",prName(a)],["Workgroup",[a.workgroup,a.groupType].filter(Boolean).join(" · ")],["Classification",a.classification],["Release status",a.releaseStatus],["MMS step",a.stage],["Ready to post",a.readyToPost===true?(a.readyAt?fS(a.readyAt):"Yes"):a.draftNow===true?"Not yet: Draft Now (finish and hold)":""],["Version",a.version],
    ["Comment period",(a.commentOpens||a.commentCloses)?(fS(a.commentOpens)+" – "+fS(a.commentCloses)):""],["License",a.license],["Available to",a.availableTo],["Members",a.memberUrl],["Non-members",a.nonMemberUrl],["Facilitator",a.facilitator],["Summary",a.summary]].filter(x=>x[1]);
  const leaders=(a.leaders||[]).map(l=>'<li><b>'+esc(l.name)+'</b>'+(l.position?', '+esc(l.position):'')+(l.company?', '+esc(l.company):'')+'</li>').join("");
  const d=r.draft||{}, s=r.source||{}, q=r.request||{}, qt=r.quote||{}, o=r.out||{};
  const held=prHeld(r), go=!!r.final && !held;   /* CN-010: a Draft Now release is finished and held */
  const sug=(r.suggestions||[]);
  const html='<div class="card pr-detail" id="pr-detail"><div class="ch"><h2>'+esc(prTitle(r))+'</h2>'+prChip(r)+prTags(r)+'<div class="r"><button class="btn sm" type="button" id="pr-close">Close</button></div></div>'+
    '<ol class="pr-steps">'+PR_STEPS.map(([k,l],i)=>'<li class="'+st(k)+'"><span>'+(i+1)+'</span>'+esc(l)+'</li>').join("")+'</ol>'+
    '<div class="pr-grid">'+
    '<div class="pr-main">'+
      prSec(1,"The Draft",si<=1?"now":"done",
        (PR.writing[r.id]?'<div class="pr-note">Claude is writing the first draft…</div>':r.draftErrAt&&!d.body?'<div class="pr-note bad">The first draft didn\'t write ('+esc(r.draftErr||"")+'). Press Write It Again.</div>':'')+
        '<label class="pr-l">Headline<input type="text" id="pr-h" value="'+esc(d.headline||"")+'"></label>'+
        '<label class="pr-l">Release date (fills in the WASHINGTON, D.C. date)<input type="date" id="pr-date" value="'+esc(r.releaseDate||"")+'"></label>'+
        '<label class="pr-l">Release<textarea id="pr-body" rows="18">'+esc(d.body||"")+'</textarea></label>'+
        '<div class="pr-help">[QUOTE] marks where the approved quote goes. Anything else in [SQUARE BRACKETS] is a gap the MMS didn\'t give a fact for: fill it in or take it out. Nothing is invented.</div>'+
        '<div class="pr-btns"><button class="btn pri" type="button" id="pr-save">Save the Draft</button><button class="btn" type="button" id="pr-rewrite"'+(PR.writing[r.id]?" disabled":"")+'>Write It Again from the Facts</button><button class="btn" type="button" id="pr-copy">Copy the Release</button></div>'+
        '<div class="pr-checks">'+(checks.length?checks.map(c=>'<div class="pr-ck '+c.level+'">'+esc(c.msg)+'</div>').join(""):(d.body?'<div class="pr-ck ok">Names, companies and spelling check out against the MMS leaders list.</div>':''))+'</div>')+
      prSec(2,"Who to Quote",st("source"),
        '<div class="pr-help">Claude\'s suggestions, each with a reason. Perry picks one; Amy approves or changes it by replying to her email.</div>'+
        (sug.length?'<div class="pr-sugs">'+sug.map((x,i)=>'<label class="pr-sug"><input type="radio" name="pr-pick" value="'+i+'"'+(s.name&&x.name===s.name?" checked":"")+'><span><b>'+esc(x.name||"Someone to find")+'</b>'+(x.title?', '+esc(x.title):'')+(x.company?', '+esc(x.company):'')+'<em>'+esc(x.reason||"")+'</em></span></label>').join("")+'</div>':'')+
        '<div class="pr-btns"><button class="btn" type="button" id="pr-sugg">'+(sug.length?"Suggest Again":"Suggest People to Quote")+'</button></div>'+
        '<div class="pr-row"><label class="pr-l">Name<input type="text" id="pr-sn" value="'+esc(s.name||"")+'"></label><label class="pr-l">Title<input type="text" id="pr-st" value="'+esc(s.title||"")+'"></label><label class="pr-l">Company<input type="text" id="pr-sc" value="'+esc(s.company||"")+'"></label></div>'+
        '<label class="pr-l">Email<input type="email" id="pr-se" value="'+esc(s.email||q.to||"")+'"></label><label class="pr-l">Why them<input type="text" id="pr-sr" value="'+esc(s.reason||"")+'"></label>'+
        (r.amy?'<div class="pr-amy '+(r.amy.decision==="approved"?"ok":"bad")+'"><b>'+(r.amy.decision==="approved"?"Amy approved":"Amy asked for someone else")+'</b> · '+esc(fS(localDay(r.amy.at)))+(r.amy.text?'<div>'+esc(r.amy.text).replace(/\n/g,"<br>")+'</div>':'')+'</div>':s.sentAt?'<div class="pr-note">Sent to Amy '+esc(fS(localDay(s.sentAt)))+'. Waiting on her reply.</div>':'')+
        '<div class="pr-btns"><button class="btn" type="button" id="pr-ssave">Save</button><button class="btn pri" type="button" id="pr-amy"'+(perry?"":" disabled")+'>'+(s.sentAt?"Send to Amy Again":"Send to Amy for Approval")+'</button></div>'+onlyPerry)+
      prSec(3,"The Quote Request",st("request"),
        (r.status==="request"||q.sentAt?'':'<div class="pr-note">Opens once Amy approves who to quote.</div>')+
        '<div class="pr-row"><label class="pr-l">To (name)<input type="text" id="pr-qn" value="'+esc(q.toName||s.name||"")+'"></label><label class="pr-l">To (email)<input type="email" id="pr-qe" value="'+esc(q.to||s.email||"")+'"></label></div>'+
        '<label class="pr-l">Subject<input type="text" id="pr-qs" value="'+esc(q.subject||"")+'"></label>'+
        '<label class="pr-l">Email (the draft release is added below it, with a suggested quote they can edit or replace)<textarea id="pr-qb" rows="12">'+esc(q.body||"")+'</textarea></label>'+
        '<div class="pr-help">Sends from Perry\'s address (pwilliams@mismo.org), Amy copied. Replies come back to Perry\'s inbox. Nothing goes until Perry presses Send.</div>'+
        (q.sentAt?'<div class="pr-note'+(prLate(r)?" bad":"")+'">Sent '+esc(fS(localDay(q.sentAt)))+' to '+esc(q.toName||q.to)+'. '+(prLate(r)?'<b>No quote yet after 3 business days: time to follow up.</b>':'Follow up if there\'s no reply by '+esc(fD(prReminderDue(r)))+'.')+'</div>':'')+
        '<div class="pr-btns"><button class="btn" type="button" id="pr-qw">'+(q.body?"Write It Again":"Write the Email")+'</button><button class="btn" type="button" id="pr-qsave">Save</button><button class="btn pri" type="button" id="pr-qsend"'+(perry&&(r.status==="request"||q.sentAt)?"":" disabled")+'>'+(q.sentAt?"Send Again as Perry":"Send as Perry")+'</button></div>'+onlyPerry)+
      prSec(4,"The Approved Quote",st("quote"),
        '<div class="pr-help">A quote only goes in after the person has approved it in writing, Brian included. Paste their approval (their email reply) below; it\'s kept with the release.</div>'+
        '<label class="pr-l">Quote, exactly as approved<textarea id="pr-tt" rows="4">'+esc(qt.text||"")+'</textarea></label>'+
        '<div class="pr-row"><label class="pr-l">Name<input type="text" id="pr-tn" value="'+esc(qt.name||s.name||"")+'"></label><label class="pr-l">Title<input type="text" id="pr-ti" value="'+esc(qt.title||s.title||"")+'"></label><label class="pr-l">Company<input type="text" id="pr-tc" value="'+esc(qt.company||s.company||"")+'"></label></div>'+
        '<label class="pr-l">Their written approval (paste the email)<textarea id="pr-ta" rows="5">'+esc(qt.approval||"")+'</textarea></label>'+
        '<label class="pr-l">Approved on<input type="date" id="pr-td" value="'+esc(qt.approvalAt||"")+'"></label>'+
        (qt.addedAt?'<div class="pr-note ok">In the release since '+esc(fS(localDay(qt.addedAt)))+', approval on file ('+esc(fS(qt.approvalAt))+').</div>':'')+
        '<div class="pr-btns"><button class="btn pri" type="button" id="pr-tput">'+(qt.addedAt?"Update the Quote":"Put the Quote In")+'</button></div>')+
      prSec(5,"Final Approval",st("final"),
        '<div class="pr-ready">'+prReady(r).map(x=>'<div class="pr-ck '+(x[0]?"ok":"bad")+'">'+esc(x[1])+'</div>').join("")+'</div>'+
        (r.final?'<div class="pr-note ok"><b>Approved by '+esc(r.final.by||"Perry")+'</b> · '+esc(fS(localDay(r.final.at)))+'</div>':'')+
        '<div class="pr-btns"><button class="btn pri" type="button" id="pr-final"'+(perry&&!r.final&&prReady(r).every(x=>x[0])?"":" disabled")+'>Give Final Approval</button>'+(r.final&&perry?'<button class="btn" type="button" id="pr-unfinal">Reopen for Changes</button>':'')+'</div>'+onlyPerry)+
      prSec(6,"Distribution",st("out"),
        (held?'<div class="pr-note">'+(r.final?'<b>Finished and held.</b> ':'')+'Draft Now: the work is still on its way to Release in the MMS'+(a.stage?' ('+esc(a.stage)+')':'')+'. This release goes out once the MMS marks it <b>Ready to Post</b>; the same release moves here, nothing is started again.</div>':r.final?'':'<div class="pr-note">Opens after Perry\'s final approval.</div>')+
        '<label class="pr-l">Link to the published release (MBA newsroom), once it\'s up<input type="url" id="pr-link" value="'+esc(o.link||"")+'"></label>'+
        '<div class="pr-dist">'+
          prDist("MISMO Connect post","Branded HTML post, sent to Vanessa Rios to post on MISMO Connect.",o.vanessaAt,'<button class="btn" type="button" id="pr-chtml">Copy Connect HTML</button><button class="btn pri" type="button" id="pr-van"'+(perry&&go?"":" disabled")+'>Send to Vanessa as Perry</button>')+
          prDist("MBA newsroom","A copy for Brittney Prophete at MBA ("+prSettings().brittney+"). Her edits stay on her side.",o.mbaAt,'<button class="btn pri" type="button" id="pr-brit"'+(perry&&go?"":" disabled")+'>Send to Brittney as Perry</button>')+
          prDist("MISMO Matters","Adds the release to In the News for that month's edition.",o.mattersAt,'<button class="btn" type="button" id="pr-mat"'+(go?"":" disabled")+'>'+(o.mattersAt?"Update in MISMO Matters":"Offer to MISMO Matters")+'</button>')+
          prDist("LinkedIn","Adds a LinkedIn post request to Requests.",o.linkedinAt,'<button class="btn" type="button" id="pr-li"'+(go?"":" disabled")+'>'+(o.linkedinAt?"Request Again":"Request a LinkedIn Post")+'</button>')+
        '</div>'+onlyPerry)+
    '</div>'+
    '<div class="pr-side">'+
      '<div class="pr-box"><h4>Facts from the MMS</h4><dl class="kv">'+facts.map(f=>'<dt>'+esc(f[0])+'</dt><dd>'+(/^https?:/.test(String(f[1]))?'<a href="'+esc(f[1])+'" target="_blank" rel="noopener">'+esc(f[1])+'</a>':esc(f[1]))+'</dd>').join("")+'</dl>'+
        (leaders?'<h4>Leaders (names to match exactly)</h4><ul class="pr-leaders">'+leaders+'</ul>':'')+
        (a.mmsUrl?'<a class="btn sm" href="'+esc(a.mmsUrl)+'" target="_blank" rel="noopener">Open in the MMS&nbsp;↗</a>':'')+
        (r.cat?'<h4>Work-Product Catalog</h4><div class="pr-cat">'+esc(r.cat.title)+(r.cat.summary?'<div>'+esc(r.cat.summary)+'</div>':'')+(r.cat.libraryUrl?'<a href="'+esc(r.cat.libraryUrl)+'" target="_blank" rel="noopener">Resource Library ↗</a>':'')+'</div>':'')+'</div>'+
      '<div class="pr-box"><h4>History</h4><ul class="pr-log">'+(r.log||[]).slice().reverse().slice(0,14).map(l=>'<li><b>'+esc(fS(localDay(l.at)))+'</b> '+esc(l.what)+(l.by?' <span>· '+esc(l.by)+'</span>':'')+'</li>').join("")+'</ul>'+
        '<button class="btn sm danger" type="button" id="pr-arch">Archive This Release</button></div>'+
    '</div></div></div>';
  return html;
}
function prDist(t, s, at, btns){ return '<div class="pr-dr"><div><b>'+esc(t)+'</b>'+(at?' <span class="chip ok">Done '+esc(fS(localDay(at)))+'</span>':'')+'<div class="pr-mini">'+esc(s)+'</div></div><div class="pr-btns">'+btns+'</div></div>'; }
function prReady(r){
  const text=prText(r), checks=prChecks(r), qt=r.quote||{};
  return [
    [!!(r.draft&&r.draft.headline&&r.draft.body), "Headline and release written"],
    [!/^\s*\[QUOTE\]\s*$/m.test((r.draft&&r.draft.body)||""), "The quote is in"],
    [!!(qt.text && qt.approval && qt.approvalAt), "The quoted person's written approval is kept with the release"+(qt.name?" ("+qt.name+")":"")],
    [!!r.releaseDate, "Release date set"],
    [!/\[[A-Z][^\]]{1,80}\]/.test(text), "No [GAPS] left to fill in"],
    [!checks.some(c=>c.level==="bad" && c.kind!=="comment"), "Names and companies match the MMS leaders list"],
    [!checks.some(c=>c.kind==="comment"), "Says nothing about public comment"]];
}
function prWire(el, r){
  if(!r) return; const id=r.id, v=s=>{ const x=$(s,el); return x?x.value:""; };
  const saveDraft=async(msg)=>{ await prSave(id, {draft:Object.assign({}, r.draft||{}, {headline:v("#pr-h").trim(), body:v("#pr-body"), editedAt:new Date().toISOString(), editedBy:prWho()}), releaseDate:v("#pr-date")}, msg||"Edited the draft"); };
  $("#pr-close",el).onclick=()=>{ PR.sel=null; renderPress(); };
  $("#pr-save",el).onclick=async()=>{ await saveDraft(); toast("Saved"); renderPress(); };
  $("#pr-rewrite",el).onclick=async()=>{ if((r.draft&&r.draft.editedAt) && !confirm("Write a new draft from the MMS facts? Perry's edits to this draft will be replaced (the old one stays in the history).")) return; await prSave(id, {draftOld:r.draft||null}, ""); await prWrite(id); };
  $("#pr-copy",el).onclick=()=>copyText(prText(r),"The release");
  const sourceFrom=()=>({name:v("#pr-sn").trim(), title:v("#pr-st").trim(), company:v("#pr-sc").trim(), email:v("#pr-se").trim(), reason:v("#pr-sr").trim()});
  $$('input[name="pr-pick"]',el).forEach(x=>x.onchange=()=>{ const sg=(r.suggestions||[])[+x.value]||{}; $("#pr-sn",el).value=sg.name||""; $("#pr-st",el).value=sg.title||""; $("#pr-sc",el).value=sg.company||""; $("#pr-sr",el).value=sg.reason||""; });
  $("#pr-sugg",el).onclick=()=>prSuggest(id);
  $("#pr-ssave",el).onclick=async()=>{ await prSave(id, {source:Object.assign({}, r.source||{}, sourceFrom())}, "Picked who to quote"); toast("Saved"); renderPress(); };
  $("#pr-amy",el).onclick=async()=>{ const s=sourceFrom(); if(!s.name){ toast("Pick who to quote first.", 4000); return; } await saveDraft("Saved the draft before sending to Amy"); await prSave(id, {source:Object.assign({}, r.source||{}, s)}, ""); await prSendAmy(id); };
  const reqFrom=()=>({toName:v("#pr-qn").trim(), to:v("#pr-qe").trim(), subject:v("#pr-qs").trim(), body:v("#pr-qb")});
  $("#pr-qw",el).onclick=async()=>{ await prSave(id, {request:Object.assign({}, r.request||{}, reqFrom())}, ""); await prWriteRequest(id); };
  $("#pr-qsave",el).onclick=async()=>{ await prSave(id, {request:Object.assign({}, r.request||{}, reqFrom())}, "Edited the quote request"); toast("Saved"); renderPress(); };
  $("#pr-qsend",el).onclick=async()=>{ await prSave(id, {request:Object.assign({}, r.request||{}, reqFrom())}, ""); await prSendRequest(id); };
  $("#pr-tput",el).onclick=()=>prPutQuote(id, {text:v("#pr-tt"), name:v("#pr-tn"), title:v("#pr-ti"), company:v("#pr-tc"), approval:v("#pr-ta"), approvalAt:v("#pr-td")});
  const fin=$("#pr-final",el); if(fin) fin.onclick=async()=>{ await saveDraft("Saved the draft before final approval"); const r2=prGet(id); if(!prReady(r2).every(x=>x[0])){ toast("Not ready yet: see the list above.", 5000); renderPress(); return; } await prSave(id, {status:"final", final:{at:new Date().toISOString(), by:prWho()}}, "Perry gave final approval"); toast(prHeld(prGet(id))?"Approved and held. It goes out once the MMS marks it Ready to Post.":"Approved. Distribution is open.", 5000); renderPress(); };
  const unf=$("#pr-unfinal",el); if(unf) unf.onclick=async()=>{ await prSave(id, {status:"quote", final:null}, "Reopened for changes"); renderPress(); };
  const link=$("#pr-link",el); if(link) link.onchange=async()=>{ await prSave(id, {out:Object.assign({}, r.out||{}, {link:link.value.trim()})}, "Added the published link"); };
  $("#pr-chtml",el).onclick=()=>copyText(prConnectHtml(prGet(id)),"The MISMO Connect post (HTML)");
  $("#pr-van",el).onclick=()=>prSendVanessa(id);
  $("#pr-brit",el).onclick=()=>prSendBrittney(id);
  $("#pr-mat",el).onclick=()=>prOfferMatters(id);
  $("#pr-li",el).onclick=()=>prAskLinkedin(id);
  const ar=$("#pr-arch",el); ar.onclick=async()=>{ if(ar.dataset.sure){ await prSave(id, {archived:true, archivedAt:new Date().toISOString()}, "Archived"); PR.sel=null; toast("Archived"); renderPress(); } else { ar.dataset.sure="1"; ar.textContent="Press Again to Archive"; } };
}
