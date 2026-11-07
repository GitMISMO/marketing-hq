
/* ================= Mic'd Up: SharePoint episode folders, the Writer, guests, clips ================= */
/* Every episode gets its own folder in SharePoint: Q Drive > MISMO > Active Documents > Marketing >
   MISMO Mic'd Up > Season N > "S2 Ep 01 - Guest". MISMO Media makes the folder as soon as the episode
   has a number, then reads whatever lands in it (the final video, thumbnails, transcript, clips).
   Copy is written by the "MISMO Media - Writer" prompt in Power Automate, from the transcript. */
const MU_LIB = "Active Documents/Marketing/MISMO Mic'd Up";      // inside the MISMO library (for making folders)
const SP_SITE = "https://mortgagebankersassociation.sharepoint.com/sites/Q%20Drive";
const SPX = ()=> (window.__hqImages && window.__hqImages.mkdir) ? window.__hqImages : null;
const GUEST_FORM = "https://resources.mismo.org/forms/micdup-guest/";
const BRIAN_EMAIL = "bvieaux@mba.org";
const pad2 = n=>String(+n||0).padStart(2,"0");
const spSafe = s=>String(s||"").replace(/[\\/:*?"<>|#%{}~&]+/g," ").replace(/\s+/g," ").trim().slice(0,80);
function epFolderLib(e){ const s=+e.season||1; return MU_LIB+"/Season "+s+"/S"+s+" Ep "+pad2(e.num)+" - "+(spSafe(e.guests||e.company)||"Guest TBD"); }
function spListPath(lib){ return "/MISMO/"+lib; }
function spUrl(listPath){ return SP_SITE+String(listPath).split("/").map(x=>encodeURIComponent(x)).join("/"); }
function spFolderUrl(lib){ return SP_SITE+"/MISMO/Forms/AllItems.aspx?id="+encodeURIComponent("/sites/Q Drive/MISMO/"+lib); }
function spFileUrl(listPath, download){ return spUrl(listPath)+(download?"?download=1":"?web=1"); }

/* ---------- folders ---------- */
const MU = {made:{}, pulling:{}, pulled:{}, writing:{}, folderFail:{}};
async function ensureEpFolder(e){
  const sp=SPX(); if(!sp || !e || !e.num || e.spFolder) return e && e.spFolder;
  const lib=epFolderLib(e), season=MU_LIB+"/Season "+(+e.season||1);
  if(MU.folderFail[e.id] && Date.now()-MU.folderFail[e.id] < 30*60*1000) return "";
  try{
    if(!MU.made[season]){ await sp.mkdir(season); MU.made[season]=true; }
    await sp.mkdir(lib);
    await patch("episodes", e.id, {spFolder:lib});
    return lib;
  }catch(err){ MU.folderFail[e.id]=Date.now(); if(typeof jobNote==="function") jobNote("SharePoint folders", err); return ""; }
}
/* what's in an episode folder */
const VID_RX=/\.(mp4|mov|m4v)$/i, IMG_RX=/\.(png|jpe?g|webp)$/i, TX_RX=/\.(txt|srt|vtt)$/i;
function classify(files){
  const vids=files.filter(f=>VID_RX.test(f.name)).sort((a,b)=>(b.size||0)-(a.size||0));
  const tx=files.filter(f=>TX_RX.test(f.name)).sort((a,b)=>(/\.txt$/i.test(b.name)-/\.txt$/i.test(a.name)) || ((b.size||0)-(a.size||0)));
  return {video:vids[0]||null, clips:vids.slice(1), thumbs:files.filter(f=>IMG_RX.test(f.name)), transcript:tx[0]||null};
}
/* SharePoint folder listings go through the "Marketing HQ Images" flow, which is slow to list a folder. So: one listing
   at a time (never a burst), each answer remembered for 5 minutes, and a 30-minute rest after a timeout. A button press
   always asks fresh. */
const SPL={chain:Promise.resolve(), cache:{}, restUntil:0};
function spListOnce(path, fresh){
  const c=SPL.cache[path]; if(!fresh && c && Date.now()-c.at<5*60*1000) return Promise.resolve(c.files);
  if(!fresh && Date.now()<SPL.restUntil) return Promise.reject(Object.assign(new Error("SharePoint is slow right now; checking again later"),{code:"REST"}));
  const run=()=>SPX().list(path).then(files=>{ SPL.cache[path]={at:Date.now(), files}; return files; },
    err=>{ if(/^(HTTP_5|OFFLINE)/.test(String(err&&err.code||""))) SPL.restUntil=Date.now()+30*60*1000; throw err; });
  const p=SPL.chain.then(run,run); SPL.chain=p.catch(()=>{}); return p;
}
async function kitPullSP(epId, quiet){
  const sp=SPX(); const e=S.episodes[epId]; if(!sp||!e||!e.spFolder) return;
  if((kitOf(epId)||{}).folderId){ if(!quiet) toast("This kit comes from Brian's Drive folder, so it stays as it is.", 5000); return; }
  if(MU.pulling[epId]) return; MU.pulling[epId]=true;
  try{
    if(!quiet) toast("Reading the episode's SharePoint folder…", 60000);
    const files=(await spListOnce(spListPath(e.spFolder), !quiet)).filter(f=>!f.folder);
    const c=classify(files), old=kitOf(epId)||{};
    /* a kit that came from Brian's Drive folder is never replaced by the SharePoint folder */
    if(old.folderId){ if(!quiet) toast("This kit comes from Brian's Drive folder, so it stays as it is.", 5000); MU.pulled[epId]=Date.now(); return; }
    const thumbs=[];
    for(const f of c.thumbs){
      const prev=(old.thumbs||[]).find(t=>t.spPath===f.path && S.images[t.img]) || null;
      if(prev){ thumbs.push(prev); continue; }
      const have=vals("images").find(i=>i.spPath===f.path);
      let id=have&&have.id;
      if(!id){ id=uid("img"); await put("images", id, {name:"Mic'd Up "+epTag(e)+" Thumbnail ("+f.name.replace(/\.[a-z0-9]+$/i,"")+")", file:f.name, campaign:"micdup", edition:"", alt:"", credit:"", notes:"From the episode's SharePoint folder", w:0, h:0, size:f.size||0, type:"", url:"", assetId:"", spPath:f.path, at:f.modified||new Date().toISOString(), archived:false, source:"sharepoint"}); }
      thumbs.push({spPath:f.path, name:f.name, img:id});
    }
    const kit=Object.assign({}, old, {source:"sp", spFolder:e.spFolder, folderName:e.spFolder.split("/").pop(), folderUrl:spFolderUrl(e.spFolder),
      files:files.map(f=>({name:f.name,size:f.size,path:f.path})), video:c.video?{name:c.video.name,size:c.video.size,path:c.video.path}:null,
      clips:c.clips.map(f=>({name:f.name,size:f.size,path:f.path})), transcriptPath:c.transcript?c.transcript.path:"", transcriptName:c.transcript?c.transcript.name:"",
      thumbs, pulledAt:new Date().toISOString()});
    if(!kit.thumbPick && thumbs.length===1) kit.thumbPick=thumbs[0].img;
    await put("kits", epId, kit);
    const part={}; if(c.video && !e.recordDate) part.recordDate=localDay(c.video.modified)||T();
    if(c.video && !e.fileIn) part.fileIn=true;
    if(Object.keys(part).length) await patch("episodes", epId, part);
    MU.pulled[epId]=Date.now();
    if(!quiet) toast(c.video||thumbs.length||c.transcript ? "Found "+[c.video?"the video":"", thumbs.length?thumbs.length+" thumbnail"+(thumbs.length===1?"":"s"):"", c.transcript?"the transcript":"", c.clips.length?c.clips.length+" clip"+(c.clips.length===1?"":"s"):""].filter(Boolean).join(", ")+".":"The folder is empty so far.", 5000);
  }catch(err){ if(!quiet) toast("Couldn't read the folder: "+(err.message||"try again"), 6000); }
  finally{ MU.pulling[epId]=false; }
}
/* runs with kitSync: make folders for upcoming episodes, check folders that are still filling */
async function muSync(){
  if(STALE.on || !SPX() || !CANWRITE || !LOADED.has("episodes") || !LOADED.has("kits")) return;
  const t=T();
  const eps=vals("episodes").filter(e=>e.num && owes(e) && (+e.season||1)>=2 && (!e.airDate || e.airDate>=add(t,-21)));
  for(const e of eps){
    if(!e.spFolder){ await ensureEpFolder(e); continue; }
    const k=kitOf(e.id)||{};
    /* only the episodes whose files are due (aired in the last 10 days or airing in the next 10), and only if nobody
       has checked in the last 30 minutes, so open tabs don't keep asking SharePoint */
    const near=!!e.airDate && e.airDate>=add(t,-10) && e.airDate<=add(t,10);
    const lastAt=Math.max(MU.pulled[e.id]||0, k.pulledAt?new Date(k.pulledAt).getTime():0);
    const stale=Date.now()-lastAt>30*60*1000;
    if(near && stale && !k.folderId && (!k.video || !k.transcriptPath || !(k.thumbs||[]).length)) await kitPullSP(e.id, true);
    await muAuto(e.id);
  }
}
/* Autopilot: once the transcript is in the folder, MISMO Media writes everything and sends the LinkedIn Live
   wording to Amy by itself, so Vanessa opens a finished kit. Each step runs once;
   a claim on the kit keeps two open browsers from doing the same step twice. */
const AUTO_HOLD = 30*60*1000;
function autoClaimed(k, key){ const t=k[key]; return t && Date.now()-Date.parse(t) < AUTO_HOLD; }
async function muAuto(epId){
  const e=S.episodes[epId]; let k=kitOf(epId)||{};
  if(!e || !k.transcriptPath || (e.airDate && e.airDate<T())) return;
  if(!k.written){
    if(autoClaimed(k,"autoWriteAt") || MU.writing[epId]) return;
    await put("kits", epId, Object.assign({}, k, {autoWriteAt:new Date().toISOString()}));
    await kitWriteAll(epId, true);
    k=kitOf(epId)||{}; if(!k.written) return;
  }
  const ep=S.episodes[epId];
  if(!k.liStatus && !k.liAutoSent && ep.linkedinCopy){
    const name=ep.liEventName || liEventName((k.written||{}).title, ep);
    await put("kits", epId, Object.assign({}, k, {liStatus:"review", liSentAt:new Date().toISOString(), liNote:"", liAutoSent:true}));
    await liSendAmy(ep, kitOf(epId), name, ep.linkedinCopy);
    k=kitOf(epId)||{};
  }
  /* Clip posts are not planned by themselves: Amy decides whether MISMO posts clips. */
}

/* ---------- the Writer ---------- */
function liLabel(e){ const s=+e.season||1; return "MISMO Mic'd Up "+(s>1?"S"+s+" ":"")+"Ep. "+(e.num||""); }
/* The house style, from MISMO's published Mic'd Up episodes (YouTube, Spotify and Apple Podcasts, Ep. 32 to 51),
   kept, then raised: the same voice and shape, plus what the old ones missed. */
const MU_STYLE = [
"You are a senior B2B content writer and podcast producer who has studied every published MISMO Mic'd Up episode on YouTube, Spotify and Apple Podcasts, and MISMO's and Brian Vieaux's Mic'd Up posts on LinkedIn. You write for mortgage lenders, servicers, technology providers, investors and the GSEs. Keep MISMO's established style, and make each piece clearly better than past episodes.",
"WHO: MISMO is the mortgage industry's standards organization. The host is always \"Brian Vieaux, MISMO President\" on first mention, then \"Brian\". The show is \"MISMO Mic'd Up\" (podcast name: \"MISMO Mic'd Up: Beyond the Standards\"). Name every guest on first mention with full name, title and company exactly as given in the material; afterwards, first name and company.",
"VOICE: confident, warm, plain-spoken and specific. Short sentences. Active voice. American spelling. No hype words (game-changer, revolutionize, unlock, dive in, delve, landscape, in today's fast-paced world), no emojis (except the one Brian sometimes uses, below), no exclamation marks. Never invent facts, numbers, products or quotes: every claim must come from the transcript, the guest's form or Brian's post. Quote the guest only with words that appear in the transcript. Use MISMO terms correctly: MISMO, FRAME, eNote, eClose, eVault, SMART Doc, ULAD, URLA, UAD, GSEs, Fannie Mae, Freddie Mac, Ginnie Mae, Community of Practice.",
"YOUTUBE DESCRIPTION (house pattern, improved): open with a one or two sentence hook that states the problem or tension the episode solves (a sharp statement, or one rhetorical question); put the topic's main search words in the first 150 characters. Then a paragraph introducing Brian Vieaux, MISMO President, and the guest with title and company, and what they dig into, with two or three specifics from the conversation. Then a short paragraph speaking directly to who should watch (for example lenders, LOS and POS technologists, servicers) and what they will take away. Then one line inviting viewers to subscribe for a new episode every Friday and to get involved at mismo.org. 120 to 170 words before the chapters and hashtags. No bullets. Then hashtags on their own line: always #MISMO #MISMOMicdUp #MortgageIndustry plus one or two that match THIS episode's topic (for example #AIGovernance only when the episode is about AI governance, #eMortgage, #CreditData, #DownPaymentAssistance).",
"PODCAST / LINKEDIN LIVE LONG DESCRIPTION (house pattern, improved): open by saying that on this episode of MISMO Mic'd Up, Brian Vieaux, MISMO President, sits down with the guest (full name, title, company); one line on why it matters now. Then four to six short prose paragraphs, each on one topic from the conversation, in the order they come up, with real specifics. Then a line \"In this episode:\" followed by three or four one-line takeaways, each starting with a verb. Close with one sentence on who should listen and \"Tune in every Friday.\" No hashtags.",
"LINKEDIN, MISMO COMPANY PAGE (from MISMO's own Mic'd Up posts for Ep. 36, 37 and 41): open with a hook, either a question (\"What does it take for a small but mighty team to pull off a record-breaking MISMO Summit with 430 registrants?\", \"How clean is the data feeding your AI?\") or a bold two-part statement (\"Artificial Intelligence isn't the biggest challenge facing mortgage lenders. Transformation is.\"). Then one sentence in the pattern \"On this episode of MISMO Mic'd Up, MISMO President Brian Vieaux sat down with [full name], [title] at [company], to discuss ...\" or \"[Guest] joined MISMO President Brian Vieaux on MISMO Mic'd Up to ...\", naming the real topics. Optionally one memorable moment from the conversation, told plainly. Then one line on who should watch (\"If you're ..., this conversation is worth your time.\"). Optionally end with one question to the audience. 60 to 180 words, short paragraphs, no emojis, no links. End with exactly: #MISMOMatters #MISMOMicdUp #MortgageTech",
"LINKEDIN, BRIAN'S OWN POSTS (from his posts for Ep. 37, 38, 41, 42 and UAD 3.6): first person, conversational and direct. Open with a hook question or a short punchy line. Then \"[Guest] of [company] joined me on MISMO MIC'D UP to discuss ...\" or \"In my latest MISMO MIC'D UP, I sat down with ...\". He often names one favorite moment (\"One of my favorite moments came when ...\") and closes with \"Tune in for our conversation on ...\" or a question to readers. 60 to 200 words. Hashtags are rare: none, or #VieauxPoint. At most one emoji (🎙️) before the tune-in line.",
"LINKEDIN LIVE EVENT NAME on MISMO's page follows \"MISMO Mic'd Up Ep. 41: How MISMO Built a Record-Breaking Fall Summit\": the episode label, a colon, then the short title.",
"TITLES: specific and benefit-led, Title Case, under 60 characters before any guest name, often two phrases joined by a colon, like the show's best titles (\"Down Payment Assistance Needs a Common Language\", \"138 AI Use Cases, 16 Vendors: The Hidden Risk in Your Tech Stack\", \"Don't Drink the Dirty Data: Why Mortgage AI Starts with Standards\"). No clickbait, no question titles unless the episode is built around that question."
].join("\n\n");
function txPlain(t){ return String(t||"").replace(/^WEBVTT.*$/m,"").replace(/^\d+\s*$/gm,"").replace(/^\d{1,2}:\d{2}(:\d{2})?[.,]\d{3}\s*-->.*$/gm,"").replace(/\n{2,}/g,"\n").trim(); }
async function writer(task, material){ const sp=SPX(); if(!sp) throw new Error("Writing works on resources.mismo.org"); return sp.writer(task, material); }
function parseJson(s){ const m=String(s||"").replace(/^```(?:json)?\s*|\s*```$/g,"").trim(); try{ return JSON.parse(m); }catch(e){ const a=m.indexOf("{"), b=m.lastIndexOf("}"); if(a>=0&&b>a){ try{ return JSON.parse(m.slice(a,b+1)); }catch(e2){} } return null; } }
function guestFor(e){ if(!e) return null; const g=vals("guests").filter(x=>x.ep===e.id || (e.guestEmail && x.e===String(e.guestEmail).toLowerCase())).sort((a,b)=>String(b.at).localeCompare(String(a.at))); return g[0]||null; }
function styleSamples(e){
  return epsSorted().filter(x=>x.id!==e.id && (x.bvDescription||(kitOf(x.id)||{}).written)).slice(0,3).map(x=>{ const w=(kitOf(x.id)||{}).written||{}; return "• "+(w.title||x.title||"")+"\n"+String(w.long||w.desc||x.bvDescription||"").slice(0,900); }).join("\n\n");
}
/* the guest line comes from the episode plan. When the transcript is in and never names the planned guest or
   company, Brian recorded it on his own, so the Writer is told to leave them out. */
function kitGuestLine(e,g,tx){
  const who=[e.guests||(g&&g.n)||"", g&&g.title, e.company||(g&&g.company)].filter(Boolean);
  if(!who.length) return "Guest(s): none. Brian Vieaux on his own.";
  const names=[e.guests||(g&&g.n)||"", e.company||(g&&g.company)||""].join(",").split(/,|&|\band\b/).map(x=>x.trim()).filter(x=>x.length>2);
  const t=String(tx||"").toLowerCase();
  if(t.length>=400 && names.length && !names.some(n=>t.includes(n.toLowerCase()) || t.includes(n.split(/\s+/).pop().toLowerCase())))
    return "Guest(s): none. Brian Vieaux recorded this one on his own. The episode was planned with "+who.join(", ")+", but they are not in the transcript, so do not mention them anywhere.";
  return "Guest(s): "+who.join(", ");
}
/* MISMO's LinkedIn Live description only, redone from the transcript and Brian's post, with a note on what to fix */
async function kitRewriteLi(epId, note){
  const e=S.episodes[epId], k=kitOf(epId)||{}; if(!e) return "";
  try{
    toast("Rewriting MISMO's LinkedIn Live description…", 90000);
    const tx=txPlain(await kitLoadTranscript(epId)||""), g=guestFor(e);
    if(tx.length<400 && !k.brianPost){ toast("The transcript or Brian's post is needed to rewrite it.", 5000); return ""; }
    const material=["EPISODE: MISMO Mic'd Up "+epWord(e), kitGuestLine(e,g,tx),
      k.brianPost?"Brian's own LinkedIn post about it (the facts and framing to match):\n"+k.brianPost:"",
      e.linkedinCopy?"The current description, which needs fixing:\n"+e.linkedinCopy:"",
      note?"What to fix: "+note:"",
      "TRANSCRIPT:\n"+tx.slice(0,60000)].filter(Boolean).join("\n\n");
    const raw=await writer(MU_STYLE+"\n\nRewrite MISMO's company-page post and LinkedIn Live event description for this episode, exactly as the LINKEDIN, MISMO COMPANY PAGE rules say, including the hashtag line. Use only facts from the transcript and Brian's post. Return ONLY a JSON object: {\"text\": the description}.", material);
    const o=parseJson(raw), t=o && typeof o.text==="string" ? o.text.trim() : "";
    if(!t){ toast("The Writer sent back something unexpected. Try again.", 5000); return ""; }
    toast("Rewritten. Read it over, then send it to Amy.", 4000); return t;
  }catch(err){ toast("Couldn't rewrite it: "+(err.message||"try again"), 6000); return ""; }
}
async function kitWriteAll(epId, quiet){
  const say=quiet?(()=>{}):toast;
  const e=S.episodes[epId], k=kitOf(epId)||{}; if(!e) return;
  if(MU.writing[epId]) return; MU.writing[epId]=true;
  try{
    say("Reading the transcript…", 60000);
    let tx=await kitLoadTranscript(epId); tx=txPlain(tx||"");
    if(tx.length<400 && !k.brianPost){ say("Add the transcript to the folder first (or paste Brian's LinkedIn post).", 6000); return; }
    const g=guestFor(e), season=+e.season||1, word=epWord(e);
    const material=["EPISODE: MISMO Mic'd Up "+word, kitGuestLine(e,g,tx),
      "Goes live: "+(e.airDate?fD(e.airDate):"Friday")+" 8:30 AM ET (LinkedIn Live on Brian Vieaux's profile, "+(MU_PAUSED.spotify?"":"Spotify, ")+"YouTube). MISMO's LinkedIn Live: "+fD(liDate(e))+" "+(e.linkedinTime||"1:00 PM ET")+".",
      g&&g.bio?"Guest bio: "+g.bio:"", k.brianPost?"Brian's own LinkedIn post about it:\n"+k.brianPost:"",
      styleSamples(e)?"Earlier episodes, for style only (do not reuse their facts):\n"+styleSamples(e):"",
      "TRANSCRIPT:\n"+tx.slice(0,60000)].filter(Boolean).join("\n\n");
    const task=MU_STYLE+"\n\nNow write the full promotion pack for this episode from the material. Return ONLY a JSON object with these keys:\n"+
      "\"titles\": an array of 3 short, specific episode title options (no episode number);\n"+
      "\"title\": the best of them;\n"+
      "\"youtubeTitle\": \"MISMO Mic'd Up "+(season>1?"Season "+season+", ":"")+"Ep. "+(e.num||"")+": \" + the title, as on the channel (for example \"MISMO Mic'd Up Ep. 48: Down Payment Assistance Needs a Common Language\"), 100 characters at most;\n"+
      "\"youtubeDescription\": the YouTube description exactly as the YOUTUBE DESCRIPTION rules say, including the hashtag line;\n"+
      "\"longDescription\": the long description exactly as the PODCAST / LINKEDIN LIVE LONG DESCRIPTION rules say, 2,000 to 3,800 characters;\n"+
      "\"promoPost\": Brian's own LinkedIn post, exactly as the LINKEDIN, BRIAN'S OWN POSTS rules say;\n"+
      "\"liEventName\": the event name for MISMO's LinkedIn Live, starting \""+liLabel(e)+": \" then the short title, 75 characters at most;\n"+
      "\"liEventDescription\": MISMO's company-page post and LinkedIn Live event description, exactly as the LINKEDIN, MISMO COMPANY PAGE rules say, including the hashtag line;\n"+
      "\"mattersBlurb\": 2 to 3 sentences for the MISMO Matters newsletter;\n"+
      "\"guestPost\": a 3 sentence LinkedIn post the guest can share, first person as the guest, thanking Brian and MISMO and saying what they talked about, ending with #MISMOMicdUp;\n"+
      "\"clipCaptions\": an array of 4 short LinkedIn captions (1 to 2 sentences each) for 30 to 60 second clips, each built on a different strong moment, quoting the guest only with words that appear in the transcript;\n"+
      "\"chapters\": YouTube chapters as lines \"MM:SS Topic\" starting at 00:00, only if the transcript has timestamps, otherwise an empty string.";
    say("Writing the titles, descriptions, posts and clip captions…", 120000);
    const raw=await writer(task, material); const o=parseJson(raw);
    if(!o){ say("The Writer sent back something unexpected. Try Write Again.", 6000); return; }
    const written={title:String(o.youtubeTitle||"").trim(), titles:(o.titles||[]).map(String), desc:String(o.youtubeDescription||"").trim(), long:String(o.longDescription||"").trim(),
      promo:String(o.promoPost||"").trim(), li:String(o.liEventDescription||"").trim(), liName:String(o.liEventName||"").trim(), matters:String(o.mattersBlurb||"").trim(), guest:String(o.guestPost||"").trim(),
      clips:(o.clipCaptions||[]).map(String), chapters:String(o.chapters||"").trim(), from:"transcript"};
    await put("kits", epId, Object.assign({}, kitOf(epId), {written, writtenAt:new Date().toISOString()}));
    const part={};
    if(written.li && !["review","approved"].includes((kitOf(epId)||{}).liStatus||"")) part.linkedinCopy=written.li;
    if(written.liName && !e.liEventName) part.liEventName=written.liName.slice(0,75);
    if(!e.linkedinTime) part.linkedinTime="1:00 PM ET";
    if(written.title) part.ytTitle=written.title;
    if(!e.title && o.title) part.title=String(o.title).trim();
    if(Object.keys(part).length) await patch("episodes", epId, part);
    say("Written. Read it over in the kit.", 4000);
  }catch(err){ say("Couldn't write it: "+(err.message||"try again"), 6000); }
  finally{ MU.writing[epId]=false; }
}
async function kitWriteArticle(epId){
  const e=S.episodes[epId]; if(!e) return;
  try{
    toast("Drafting Brian's viewpoint article…", 120000);
    const tx=txPlain(await kitLoadTranscript(epId)||"");
    if(tx.length<400){ toast("The transcript is needed for the article.", 5000); return; }
    const out=await writer("Draft a 600 to 800 word viewpoint article by Brian Vieaux, MISMO President, based on this Mic'd Up conversation, for an industry outlet such as Chrisman Commentary. First person as Brian. A clear headline on the first line, then the article. Credit the guest by name and company. Use only facts from the transcript. Plain text.", "Episode: MISMO Mic'd Up "+epWord(e)+(e.guests?" with "+e.guests:"")+(e.company?", "+e.company:"")+"\n\nTRANSCRIPT:\n"+tx.slice(0,60000));
    await put("kits", epId, Object.assign({}, kitOf(epId), {article:out.trim(), articleAt:new Date().toISOString()}));
    toast("Article drafted.", 3000);
  }catch(err){ toast("Couldn't draft it: "+(err.message||"try again"), 6000); }
}
async function draftRunOfShow(epId){
  const e=S.episodes[epId], g=guestFor(e); if(!e) return "";
  const material=["Episode: MISMO Mic'd Up "+epWord(e), "Guest: "+[(g&&g.n)||e.guests, g&&g.title, (g&&g.company)||e.company].filter(Boolean).join(", "),
    g&&g.say?"How to say the guest's name: "+g.say:"", g&&g.bio?"Bio: "+g.bio:"", g?"What they want to talk about:\n"+g.topics:"",
    g&&g.questions&&g.questions.length?"Questions they asked Brian to ask:\n"+g.questions.map((q,i)=>(i+1)+". "+q).join("\n"):"",
    g&&g.avoid?"Steer clear of: "+g.avoid:"", g&&g.links?"Links: "+g.links:"", e.notes?"Notes: "+e.notes:""].filter(Boolean).join("\n\n");
  return writer("Write a 25-minute run of show for Brian Vieaux, host of MISMO Mic'd Up, MISMO's podcast. Keep the guest's questions word for word, in a sensible order. Include: a short scripted opening that introduces MISMO Mic'd Up and the guest (with pronunciation if given); each question with one or two optional follow-ups; a transition line between topics; one or two natural places to connect the topic to MISMO's work on standards; a final takeaway question; and a scripted close that thanks the guest and invites listeners to the next episode. Add rough timings. Plain text with simple headings. It is a guide for a conversation, not a script to read word for word.", material);
}
/* ---------- clips and the guest's share kit ---------- */
async function planClipPosts(epId, quiet){
  const say=quiet?(()=>{}):toast;
  const e=S.episodes[epId], k=kitOf(epId)||{}, w=k.written||{}; if(!e) return;
  const clips=k.clips||[], caps=w.clips||[]; const n=Math.max(Math.min(4, clips.length||4), Math.min(4, caps.length));
  if(!n){ say("Write Everything first, so each clip has a caption.", 5000); return; }
  const start=e.airDate||T(); const offs=[4,7,11,14];
  let made=0;
  for(let i=0;i<n;i++){
    const c=clips[i], date=workday(add(start,offs[i]),1);
    if(vals("pieces").some(p=>p.channel==="linkedin" && p.clipOf===epId && p.clipNo===i+1)) continue;
    await put("pieces", uid("p"), {channel:"linkedin", kind:"Mic'd Up Clip", title:"Mic'd Up "+epTag(e)+" clip "+(i+1)+(e.guests?" · "+e.guests:""), date, postTime:"9:00 AM", owner:"Vanessa", status:caps[i]?"draft":"idea",
      copy:(caps[i]||"")+(e.youtubeUrl?"\n\nWatch the full episode: "+e.youtubeUrl:""), link:c?spFileUrl(c.path,true):"", notes:c?"Clip file: "+c.name:"Pick a clip from the episode folder", clipOf:epId, clipNo:i+1, touch:{}});
    made++;
  }
  say(made?made+" clip post"+(made===1?"":"s")+" added to LinkedIn, two weeks after the episode.":"The clip posts are already planned.", 5000);
}
function guestKitMail(e, k){
  const g=guestFor(e)||{}, w=k.written||{};
  const to=g.shareEmail||g.e||e.guestEmail||"";
  const first=String(g.n||e.guests||"").split(/\s+/)[0]||"there";
  const lines=["Hi "+first+",","","Thank you again for joining Brian on MISMO Mic'd Up. Your episode is live, and here is everything you need to share it:",""];
  if(e.linkedinUrl) lines.push("LinkedIn: "+e.linkedinUrl);
  if(e.youtubeUrl) lines.push("YouTube: "+e.youtubeUrl);
  if(e.spotifyUrl) lines.push("Spotify: "+e.spotifyUrl);
  lines.push("","A post you can use (edit it as you like):","",(w.guest||w.desc||""),"","Please tag MISMO (linkedin.com/company/mismo-mortgage-industry-standards-maintenance-organization) and Brian Vieaux so we can share it too. We're happy to send short clips if you'd like them.","","Thank you,","The MISMO Mic'd Up team");
  return "mailto:"+encodeURIComponent(to).replace(/%40/g,"@")+"?subject="+encodeURIComponent("Your MISMO Mic'd Up episode is live")+"&body="+encodeURIComponent(lines.join("\n"));
}

/* ---------- the guest section of the episode panel ---------- */
function guestPaneHtml(e, id){
  const g=id?guestFor(e):null;
  const link=GUEST_FORM+(id?"?ep="+encodeURIComponent(id):"");
  let h='';
  if(g) h+='<div class="kguest"><b>'+esc(g.n)+'</b>'+(g.title||g.company?' · '+esc([g.title,g.company].filter(Boolean).join(", ")):'')+(g.say?'<br><small>Say it: '+esc(g.say)+'</small>':'')+
    '<div><small>Answered the guest form '+esc(fS(String(g.at).slice(0,10)))+'.</small></div>'+
    (g.topics?'<p><b>Topics:</b> '+esc(g.topics).replace(/\n/g,"<br>")+'</p>':'')+
    (g.questions&&g.questions.length?'<ol>'+g.questions.map(q=>'<li>'+esc(q)+'</li>').join("")+'</ol>':'')+
    (g.avoid?'<p><b>Steer clear of:</b> '+esc(g.avoid)+'</p>':'')+(safeHref(g.linkedin)?'<p><a href="'+esc(safeHref(g.linkedin))+'" target="_blank" rel="noopener">LinkedIn profile ↗</a></p>':'')+'</div>';
  else h+='<div class="hint">'+(id?'No answers from the guest yet. Send them the guest form when Brian books them; their answers show here.':'Save the episode first, then send the guest the form.')+'</div>';
  h+='<div class="kbtns">'+(id?'<button class="btn sm" type="button" id="ep-gform">Copy Guest Form Link</button>':'')+(id?'<button class="btn sm'+(g?' pri':'')+'" type="button" id="ep-ros">Draft the Run of Show</button>':'')+(id?'<button class="btn sm" type="button" id="ep-ros-mail">Email the Run of Show to Brian</button>':'')+'</div><span class="hint" id="ep-gmsg"></span>';
  return h;
}
function wireGuestPane(b, id){
  if(!id) return;
  const msg=$("#ep-gmsg",b);
  const gf=$("#ep-gform",b); if(gf) gf.onclick=()=>copyText(GUEST_FORM+"?ep="+encodeURIComponent(id), "Guest form link");
  const r=$("#ep-ros",b); if(r) r.onclick=async()=>{ r.disabled=true; msg.textContent="Drafting… (about 30 seconds)";
    try{ const t=await draftRunOfShow(id); $("#f-runOfShow",b).value=t.trim(); if(PANE) PANE.dirty=true; msg.textContent="Drafted. Read it over, then Save."; }catch(err){ msg.textContent="Couldn't draft it: "+(err.message||"try again"); }
    r.disabled=false; };
  const m=$("#ep-ros-mail",b); if(m) m.onclick=async()=>{ const t=($("#f-runOfShow",b).value||"").trim(); if(!t){ msg.textContent="Draft or write the run of show first."; return; }
    const n=window.__hqImages && window.__hqImages.notify; if(!n){ msg.textContent="Email works on resources.mismo.org."; return; }
    const e=S.episodes[id]||{}; m.disabled=true; msg.textContent="Sending…";
    try{ await n(BRIAN_EMAIL, "Run of show: Mic'd Up "+epWord(e)+(e.guests?" with "+e.guests:""), '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#0d314c"><p>Hi Brian, here is the run of show for MISMO Mic\'d Up '+esc(epWord(e))+(e.guests?' with '+esc(e.guests):'')+', drafted from the guest\'s answers.</p><div style="border-left:4px solid #74bfeb;background:#f6fafd;padding:12px 16px">'+mdEmail(t,'margin:0 0 10px','color:#14486e')+'</div><p style="font-size:12px;color:#56718a">Sent from MISMO Media.</p></div>');
      msg.textContent="Sent to Brian."; }catch(err){ msg.textContent="Didn't send: "+(err.message||"try again"); }
    m.disabled=false; };
}
