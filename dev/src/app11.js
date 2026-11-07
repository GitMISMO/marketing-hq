/* ================= Mic'd Up YouTube Kit ================= */
/* Everything Vanessa needs to put an episode on YouTube and on MISMO's LinkedIn, filled in
   for her. Teams messages are never kept in MISMO Media. When someone pastes an episode's
   Google Drive folder link (Pull In a Drive Folder), MISMO Media opens the
   folder (through the Marketing HQ Images flow), finds the final video (the largest .mp4),
   the generated-image thumbnails and the untitled.txt transcript, and files them on the
   episode. When Brian's LinkedIn post is pasted into the kit, the "Mic'd Up Writer" prompt
   rewrites it in MISMO's voice: the YouTube title and description and MISMO's LinkedIn post.
   The kit for each episode lives in the "kits" collection under the episode's id. */
const KIT = {ep:"", busy:{}, tx:{}, txIssues:{}, tried:{}};
const DRIVE = ()=> (window.__hqImages && window.__hqImages.drive) || null;
const FOLDER_RX = /drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([A-Za-z0-9_-]{10,})/;
function chatMsgs(){ return vals("chat").sort((a,b)=>String(a.at||"").localeCompare(String(b.at||""))); }
function msgFolder(m){ const l=[].concat(m.links||[], [m.text||""]).join(" "); const x=l.match(FOLDER_RX); return x?x[1]:""; }
function isBrian(m){ return /vieaux|brian/i.test(m.from||""); }
function msgIsPost(m){ return isBrian(m) && !msgFolder(m) && ( (m.links||[]).some(u=>/linkedin\.com/i.test(u)) || String(m.text||"").length>220 ); }
function kitOf(epId){ return (S.kits||{})[epId] || null; }
/* "Ep. 51 - Factual Data - Reno D'Water" → number, topic, guests */
function parseFolder(name){
  const s=String(name||"").replace(/\s+-\s+Google Drive$/i,"").trim();
  const m=s.match(/^\s*ep(?:isode)?\.?\s*#?\s*(\d{1,3})\s*[-–:.]?\s*/i);
  const rest=m?s.slice(m[0].length):s;
  const parts=rest.split(/\s+[-–]\s+/).map(x=>x.trim()).filter(Boolean);
  return {num:m?+m[1]:0, topic:parts[0]||"", guests:parts.slice(1).join(" and ")};
}
function kitVideo(files){ return (files||[]).filter(f=>/\.mp4$/i.test(f.name)||/video\/mp4/i.test(f.type)).sort((a,b)=>(b.size||0)-(a.size||0))[0]||null; }
function kitThumbFiles(files){ return (files||[]).filter(f=>/^generated-image/i.test(f.name)&&/\.(png|jpe?g|webp)$/i.test(f.name)); }
function kitTranscriptFile(files){ return (files||[]).find(f=>/^untitled\.txt$/i.test(f.name)) || (files||[]).find(f=>/\.txt$/i.test(f.name)) || null; }
const driveView = id=>"https://drive.google.com/file/d/"+id+"/view";
const driveFolderUrl = id=>"https://drive.google.com/drive/folders/"+id;
function mb(n){ n=+n||0; return n>=1073741824?(n/1073741824).toFixed(2)+" GB":n>=1048576?Math.round(n/1048576)+" MB":Math.max(1,Math.round(n/1024))+" KB"; }

/* ---------- pulling a folder in ---------- */
async function kitPullFolder(epId, folderId, chatId){
  const dr=DRIVE(); if(!dr){ toast("Brian's Drive folders open on resources.mismo.org."); return; }
  if(KIT.busy[epId]) return; KIT.busy[epId]=true;
  try{
    toast("Opening Brian's Drive folder…", 60000);
    const got=await dr.list(folderId);
    const files=got.files.filter(f=>!f.folder);
    if(!files.length && !got.name){ toast("Google says that folder isn't there. Brian needs to share it (or his whole Mic'd Up folder) with jycritchley@gmail.com, the Google account MISMO Media reads Drive with.", 9000); return; }
    const info=parseFolder(got.name);
    const video=kitVideo(files), tf=kitTranscriptFile(files), thumbs=kitThumbFiles(files);
    const old=kitOf(epId)||{};
    const kit=Object.assign({}, old, {source:"drive", folderId, folderUrl:driveFolderUrl(folderId), folderName:got.name, files:files.map(f=>({id:f.id,name:f.name,size:f.size,type:f.type})),
      video:video?{id:video.id,name:video.name,size:video.size}:null, transcriptId:tf?tf.id:"", chatId:chatId||old.chatId||"", pulledAt:new Date().toISOString()});
    // thumbnails go into the Image Library (and SharePoint), once each
    const have=(old.thumbs||[]);
    const out=[];
    for(const f of thumbs){
      const prev=have.find(t=>t.driveId===f.id && S.images[t.img]);
      if(prev){ out.push(prev); continue; }
      toast("Bringing in the thumbnail "+f.name+"…", 60000);
      const blob=await dr.get(f.id);
      const ext=(f.name.match(/\.([a-z0-9]+)$/i)||["","png"])[1].toLowerCase();
      const file=new File([blob], "Micd-Up-Ep-"+(info.num||"")+"-"+f.name.replace(/[()\s]+/g,"-").replace(/-+/g,"-"), {type:/^image\//.test(blob.type)?blob.type:(ext==="jpg"?"image/jpeg":"image/"+ext)});
      const made=await addImages([file], {campaign:"micdup", name:"Mic'd Up Ep "+(info.num||"")+" Thumbnail ("+f.name.replace(/\.[a-z]+$/i,"")+")", notes:"From Brian's Drive folder: "+got.name});
      if(made[0]) out.push({driveId:f.id, name:f.name, img:made[0].id});
    }
    kit.thumbs=out;
    if(!kit.thumbPick && out.length===1) kit.thumbPick=out[0].img;
    await put("kits", epId, kit);
    // fill the episode from the folder name where it's blank
    const e=S.episodes[epId]||{}; const part={};
    if(!e.fileUrl) part.fileUrl=kit.folderUrl;
    if(!e.fileIn && video) part.fileIn=true;
    if(!e.guests && info.guests) part.guests=info.guests;
    if(Object.keys(part).length) await patch("episodes", epId, part);
    toast("Episode "+(info.num||"")+" kit is ready: "+(video?"video, ":"")+out.length+" thumbnail"+(out.length===1?"":"s")+(tf?", transcript":""), 5000);
  }catch(e){ toast("Couldn't open the Drive folder: "+(e.message||e.code||"try again"), 6000); }
  finally{ KIT.busy[epId]=false; }
}
async function kitWrite(epId, force){
  const dr=DRIVE(); const k=kitOf(epId); if(!dr||!k||!k.brianPost) return;
  if(k.written && !force) return;
  if(KIT.busy["w"+epId]) return; KIT.busy["w"+epId]=true;
  try{
    toast("Writing the YouTube title, description and MISMO's LinkedIn post…", 60000);
    const o=await dr.write(k.folderName||("Ep. "+((S.episodes[epId]||{}).num||"")), k.brianPost);
    const epx=S.episodes[epId]||{};
    const written={title:String(o.youtubeTitle||"").trim().replace(/^MISMO Mic'?d Up Episode\s*(\d+)/i, (m0,n)=>"MISMO Mic'd Up "+((+epx.season||1)>1?"Season "+epx.season+", ":"")+"Episode "+n), desc:String(o.youtubeDescription||o.text||"").trim(), li:String(o.linkedinPost||"").trim()};
    await put("kits", epId, Object.assign({}, kitOf(epId), {written, writtenAt:new Date().toISOString()}));
    const e=S.episodes[epId]||{}, part={};
    if(!e.bvDescription) part.bvDescription=k.brianPost;
    if(written.li && !["review","approved"].includes(kitOf(epId).liStatus||"")){ part.linkedinCopy = written.li.replace(/\s*\[YouTube link\]\s*/gi," ").trim(); }
    if(!e.liEventName && written.title) part.liEventName = liEventName(written.title, epx);
    if(!e.linkedinTime) part.linkedinTime = "1:00 PM ET";
    if(written.title && !e.ytTitle) part.ytTitle=written.title;
    if(written.title && !e.title){ const t=written.title.replace(/^MISMO Mic'?d Up Episode\s*\d+\s*:\s*/i,"").replace(/\s+with\s+.*$/i,"").trim(); if(t) part.title=t; }
    if(Object.keys(part).length) await patch("episodes", epId, part);
    toast("Written. Read it over in the YouTube Kit.", 4000);
  }catch(e){ toast("Couldn't write it: "+(e.message||e.code||"try again"), 6000); }
  finally{ KIT.busy["w"+epId]=false; }
}
/* match chat messages to episodes and fill in whatever's new. Runs for anyone who can edit, on resources.mismo.org. */
let KIT_SYNCING=false;
async function kitSync(){
  if(STALE.on || KIT_SYNCING || !DRIVE() || !CANWRITE || !LOADED.has("chat") || !LOADED.has("kits") || !LOADED.has("episodes")) return;
  KIT_SYNCING=true;
  try{
    if(typeof muSync==="function") await muSync();
    const msgs=chatMsgs();
    for(const m of msgs){
      const fid=msgFolder(m); if(!fid) continue;
      if(vals("kits").some(k=>k.folderId===fid && (k.files||[]).length) || KIT.tried[fid]) continue;
      KIT.tried[fid]=true;
      // which episode? read the folder name for the number
      let info; try{ info=await DRIVE().list(fid); }catch(e){ continue; }
      const n=parseFolder(info.name).num; if(!n) continue;
      let ep=epByNum(n, localDay(m.at)||T());
      if(!ep){ const id=epNewId(n); await put("episodes", id, {num:n, season:epNewSeason(), airDate:"", title:"", guests:"", company:""}); ep=S.episodes[id]; }
      await kitPullFolder(ep.id, fid, m.id);
    }
    // Amy's email replies to "approval needed" (data/approvals.json, filed by the workflow)
    if(LOADED.has("approvals")) for(const a of vals("approvals").sort((x,y)=>String(x.at).localeCompare(String(y.at)))){
      const k=kitOf(a.ref); if(!k || (k.liReplyIds||[]).includes(a.id)) continue;
      const seen=(k.liReplyIds||[]).concat([a.id]);
      if(a.decision==="approved") await put("kits", a.ref, Object.assign({}, k, {liStatus:"approved", liApprovedAt:a.at, liApprovedBy:"Amy (email reply)", liNote:String(a.text||"").replace(/^(approved?|looks good|good to go|all good|yes)[.!,:\s-]*/i,"").trim(), liReplyId:a.id, liReplyIds:seen}));
      else await put("kits", a.ref, Object.assign({}, k, {liStatus:"edits", liNote:a.text||"", liReplyId:a.id, liReplyIds:seen}));
    }
    // Brian's LinkedIn posts: tie each to its episode
    for(const m of msgs){
      if(!msgIsPost(m) || vals("kits").some(k=>k.postChatId===m.id)) continue;
      const said=String(m.text||"").match(/ep(?:isode)?\.?\s*#?\s*(\d{1,3})/i);
      let target=null;
      if(said){ const ep=epByNum(said[1], localDay(m.at)||T()); if(ep && kitOf(ep.id)) target=ep.id; }
      if(!target){ // the newest folder Brian posted before this, still waiting for its post
        const cands=vals("kits").filter(k=>!k.brianPost && k.chatId).map(k=>({k, at:(S.chat[k.chatId]||{}).at||k.pulledAt||""})).filter(x=>x.at<=String(m.at||"9")).sort((a,b)=>b.at.localeCompare(a.at));
        if(cands[0]) target=cands[0].k.id;
      }
      if(!target) continue;
      const li=(m.links||[]).find(u=>/linkedin\.com/i.test(u))||"";
      const post=String(m.text||"").replace(li,"").trim();
      await put("kits", target, Object.assign({}, kitOf(target), {brianPost:post, brianPostUrl:li, postChatId:m.id, written:null}));
      await kitWrite(target, true);
    }
    // once the episode is on YouTube, put the real link in MISMO's LinkedIn post
  }finally{ KIT_SYNCING=false; }
}

/* ---------- the transcript check ---------- */
/* words the transcription tends to get wrong, and how MISMO writes them */
const TX_TERMS = [
  [/\b(?:mismo|mizmo|miz mo|mis mo|miss mo|mesmo|misemo|mis-mo)\b/gi, "MISMO", s=>s!=="MISMO"],
  [/\b(?:mic'?d up|mike'?d up|miked up|mic up|mic'd-up|micd up)\b/gi, "Mic'd Up", s=>s!=="Mic'd Up"],
  [/\b(?:vieux|vio|veo|viox|vieaux|vyo|vieau|vio's)\b/gi, "Vieaux", s=>s!=="Vieaux"],
  [/\b(?:e-?note|enote)s?\b/gi, "eNote", s=>!/^eNotes?$/.test(s)],
  [/\b(?:e-?close|eclose|e-?closing|eclosing)\b/gi, "eClose", s=>!/^eClos(e|ing)$/.test(s)],
  [/\b(?:e-?vault|evault)s?\b/gi, "eVault", s=>!/^eVaults?$/.test(s)],
  [/\bsmart doc(?:s)?\b/gi, "SMART Doc", s=>!/^SMART Docs?$/.test(s)],
  [/\b(?:fannie may|fanny mae|fanny may)\b/gi, "Fannie Mae", s=>s!=="Fannie Mae"],
  [/\b(?:freddy mac|freddie mack|freddy mack)\b/gi, "Freddie Mac", s=>s!=="Freddie Mac"],
  [/\b(?:ginny mae|ginnie may|ginny may)\b/gi, "Ginnie Mae", s=>s!=="Ginnie Mae"],
  [/\b(?:u-?lad|you lad)\b/gi, "ULAD", s=>s!=="ULAD"],
  [/\b(?:u-?r-?l-?a|earl a)\b/gi, "URLA", s=>s!=="URLA"],
  [/\b(?:gse|g\.s\.e\.)s?\b/g, "GSE", s=>!/^GSEs?$/.test(s)],
  [/\b(?:a\.?i\.?)\b/g, "AI", s=>s!=="AI" && s!=="a" && s!=="i"]
];
function lev(a,b){ a=a.toLowerCase(); b=b.toLowerCase(); const m=a.length,n=b.length; if(Math.abs(m-n)>3) return 9; const d=Array.from({length:m+1},(_,i)=>[i].concat(Array(n).fill(0))); for(let j=1;j<=n;j++) d[0][j]=j; for(let i=1;i<=m;i++) for(let j=1;j<=n;j++) d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1)); return d[m][n]; }
/* names from the folder and the episode (guests, company): flag near-misses like "Reno Dwater" */
function txNames(epId){
  const e=S.episodes[epId]||{}, k=kitOf(epId)||{}, info=parseFolder(k.folderName||"");
  const people=[e.guests, info.guests, k.extraNames].filter(Boolean).join(",").split(/,|\band\b|&/).map(x=>x.trim()).filter(x=>x.length>2);
  const words=new Set(); people.forEach(n=>n.split(/\s+/).forEach(w=>{ w=w.replace(/[^A-Za-z'’-]/g,""); if(w.length>=4 && /^[A-Z]/.test(w)) words.add(w); }));
  const phrases=[e.company, info.topic].concat(String(k.extraNames||"").split(",")).map(x=>String(x||"").trim()).filter(x=>/\s/.test(x)||/^[A-Z]{2,}/.test(x));
  return {words:[...words], phrases};
}
function txCheck(text, epId){
  const issues=[], seen={};
  const add=(found,fix,why)=>{ const key=found+"→"+fix; if(seen[key]) { seen[key].n++; return; } seen[key]={found,fix,why,n:1}; issues.push(seen[key]); };
  TX_TERMS.forEach(([rx,fix,bad])=>{ (text.match(rx)||[]).forEach(s=>{ if(bad(s)) add(s, (/s$/i.test(s)&&/^(eNote|eVault|SMART Doc|GSE)$/.test(fix))?fix+"s":fix, "MISMO style"); }); });
  const {words:names, phrases}=txNames(epId);
  if(names.length){
    const tokens=text.match(/[A-Za-z][A-Za-z'’-]{2,}/g)||[];
    const counts={}; tokens.forEach(t=>counts[t]=(counts[t]||0)+1);
    Object.keys(counts).forEach(t=>{ if(!/^[A-Z]/.test(t)) return; names.forEach(nm=>{ if(t===nm || nm.toLowerCase().includes(t.toLowerCase())) return;
      const dist=lev(t,nm); if(dist<=2 && t.length>=4 && dist/Math.max(t.length,nm.length)<0.34){ const key=t+"→"+nm; if(seen[key]) seen[key].n+=counts[t]; else { seen[key]={found:t,fix:nm,why:"Name from the folder",n:counts[t]}; issues.push(seen[key]); } } }); });
    names.filter(nm=>/['’-]/.test(nm)).forEach(nm=>{ const plain=nm.replace(/['’-]/g,""), spaced=nm.replace(/['’-]/g," ");
      [plain, spaced].forEach(v=>{ const rx=new RegExp("\\b"+v.replace(/\s+/g,"\\s+")+"\\b","gi"); (text.match(rx)||[]).forEach(h=>{ if(h!==nm) add(h, nm, "Name from the folder"); }); }); });
  }
  phrases.forEach(ph=>{ const rx=new RegExp("\\b"+ph.replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/\s+/g,"\\s+")+"\\b","gi"); (text.match(rx)||[]).forEach(h=>{ if(h!==ph) add(h, ph, "Company or topic"); }); });
  return issues;
}
function txFixed(text, issues, skip){
  /* one pass, longest first, so a fix is never fixed twice */
  const map={}; issues.forEach((x,i)=>{ if(!(skip && skip[i])) map[x.found]=x.fix; });
  const keys=Object.keys(map).sort((a,b)=>b.length-a.length); if(!keys.length) return text;
  const rx=new RegExp("(^|[^A-Za-z'’])("+keys.map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")+")(?=[^A-Za-z]|$)","g");
  return text.replace(rx,(m,p,w)=>p+(map[w]||w));
}
async function kitLoadTranscript(epId){
  const k=kitOf(epId); if(!k||!(k.transcriptId||k.transcriptPath)||!window.__hqImages) return null;
  if(KIT.tx[epId]!=null) return KIT.tx[epId];
  try{ const b=k.transcriptPath ? await window.__hqImages.get(k.transcriptPath) : await DRIVE().get(k.transcriptId); KIT.tx[epId]=await b.text(); KIT.txIssues[epId]=txCheck(KIT.tx[epId], epId); }catch(e){ KIT.tx[epId]=""; KIT.txIssues[epId]=[]; toast("Couldn't read the transcript: "+(e.message||"try again"),4000); }
  return KIT.tx[epId];
}

/* ---------- MISMO LinkedIn Live (Monday 1 PM ET, streamed from Riverside, after Amy approves the wording) ---------- */
const LI_STAT = {draft:["Draft","in"], review:["With Amy","review"], changes:["Changes Requested","changes"], approved:["Approved by Amy","ok"], edits:["Amy Replied with Edits","review"]};
function liEventName(ytTitle, e){ let t=String(ytTitle||"").replace(/^MISMO Mic'?d Up\s*(Season\s*\d+,\s*)?(Episode|Ep\.)\s*\d+\s*:\s*/i,"").trim(); t=liLabel(e)+": "+t; return t.length>75 ? t.slice(0,72).replace(/\s+\S*$/,"")+"…" : t; }
const LI_APPROVER = {name:"Amy", email:"amoses@mismo.org"};
/* the "approval needed" email to Amy: plain, branded, works in Outlook */
function liAmyEmail(e, k, name, desc, from, rev){
  const F='font-family:Arial,Helvetica,sans-serif;';
  const para=t=>esc(t).replace(/\n/g,"<br>");
  const when=fD(liDate(e))+", "+(e.linkedinTime||"1:00 PM ET");
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f6fa;padding:24px 0"><tr><td align="center">'+
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #d5e2ed">'+
    '<tr><td style="background:#0d314c;padding:18px 28px;'+F+'color:#ffffff;font-size:13px;letter-spacing:2px;font-weight:bold">MISMO MEDIA <span style="color:#74bfeb;font-weight:normal">· '+(rev?'REVISED · ':'')+'APPROVAL NEEDED</span></td></tr>'+
    '<tr><td style="padding:28px 28px 8px;'+F+'color:#0d314c"><div style="font-size:22px;font-weight:bold;line-height:1.3;margin:0 0 8px">'+(rev?'Revised LinkedIn Live wording':'Please approve the LinkedIn Live wording')+'</div>'+
      (rev?'<div style="font-size:15px;line-height:1.6;color:#0d314c;background:#fff6e0;border:1px solid #a2701a;border-radius:6px;padding:10px 12px;margin:0 0 10px"><b>Please use this version instead of the one we sent earlier.</b>'+(rev.note?'<br>'+esc(rev.note).replace(/\n/g,"<br>"):'')+'</div>':'')+
      '<div style="font-size:15px;line-height:1.6;color:#44607a">Hi Amy, the LinkedIn Live event for MISMO Mic\'d Up '+esc(epWord(e))+(e.guests?' with '+esc(e.guests):'')+' is ready for your review. It streams from Riverside to MISMO\'s LinkedIn page on <b style="color:#0d314c">'+esc(when)+'</b>.</div></td></tr>'+
    '<tr><td style="padding:10px 28px 0;'+F+'font-size:15px;line-height:1.6;color:#44607a">Read it over, then press <b style="color:#0f7b5c">Approve</b> at the bottom. It sends your approval by email. No need to open MISMO Media.</td></tr>'+
    '<tr><td style="padding:16px 28px 0;'+F+'"><div style="font-size:11px;letter-spacing:1.5px;font-weight:bold;color:#56718a;margin:0 0 6px">EVENT NAME</div><div style="font-size:16px;font-weight:bold;color:#0d314c;border-left:4px solid #74bfeb;padding:8px 12px;background:#f6fafd">'+esc(name)+'</div></td></tr>'+
    '<tr><td style="padding:16px 28px 0;'+F+'"><div style="font-size:11px;letter-spacing:1.5px;font-weight:bold;color:#56718a;margin:0 0 6px">EVENT DESCRIPTION</div><div style="font-size:15px;line-height:1.6;color:#0d314c;border-left:4px solid #74bfeb;padding:10px 12px;background:#f6fafd">'+para(desc)+'</div></td></tr>'+
    '<tr><td style="padding:22px 28px 6px;'+F+'"><table role="presentation" cellpadding="0" cellspacing="0"><tr>'+
      '<td style="background:#0f7b5c;border-radius:6px"><a href="'+liMailto(e,rev,"Approved")+'" style="display:inline-block;padding:13px 28px;'+F+'font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none">Approve</a></td><td style="width:10px"></td>'+
      '<td style="border:1.5px solid #1a8fe3;border-radius:6px"><a href="'+liMailto(e,rev,"Changes:\n\n")+'" style="display:inline-block;padding:12px 22px;'+F+'font-size:15px;font-weight:bold;color:#1a8fe3;text-decoration:none">Request Changes</a></td></tr></table>'+
      '<div style="font-size:13px;color:#44607a;line-height:1.6;margin-top:10px"><b>Approve</b> opens a reply that already says Approved: press Send and it&rsquo;s done, and Vanessa sets up the event as written. <b>Request Changes</b> opens a reply for your edits (change the wording right in it). You can also just reply to this email.</div></td></tr>'+
    '<tr><td style="padding:20px 28px 24px;'+F+'font-size:12px;color:#56718a;border-top:1px solid #e5eef5">Sent from MISMO Media'+(from?' by '+esc(from):'')+'. Keep the [MM:…] tag in the subject so your reply finds its episode.</td></tr>'+
    '</table></td></tr></table>';
}
/* Amy's buttons in the email are replies, not links to MISMO Media: each opens an email back to the inbox the
   "MISMO Media - Amy Replies" flow watches (jcritchley@mba.org, subject with [MM:…]), already filled in. */
const LI_REPLY_TO = "jcritchley@mba.org";
function liSubject(e, rev){ return (rev?"Revised: approval":"Approval")+" needed: Mic'd Up "+epWord(e)+" LinkedIn Live wording [MM:"+e.id+"]"; }
function liMailto(e, rev, body){ return "mailto:"+LI_REPLY_TO+"?subject="+encodeURIComponent("RE: "+liSubject(e,rev))+"&body="+encodeURIComponent(body); }
async function liSendAmy(e, k, name, desc, to, rev){
  const n=window.__hqImages && window.__hqImages.notify; if(!n) return false;
  const who=(window.__hqWho||"");
  try{ await n(to||LI_APPROVER.email, liSubject(e,rev), liAmyEmail(e,k,name,desc,who,rev)); return true; }catch(err){ toast("Saved, but the email to Amy didn't send: "+(err.message||"try again"), 6000); return false; }
}
function kitsWithAmy(){ return vals("kits").filter(k=>k.liStatus==="review" && S.episodes[k.id]); }
/* Amy's emailed reply, made ready to paste: email line-wraps joined back into paragraphs, then proofread
   (spelling, typos and MISMO terms only; her wording is kept). The result is kept on the kit, so it runs once per reply. */
function amyUnwrap(t){
  return String(t||"").replace(/\r/g,"").split(/\n\s*\n/).map(p=>p.split("\n").map(l=>l.trim()).filter(Boolean).join(" ").replace(/\s{2,}/g," ")).filter(Boolean).join("\n\n");
}
function amyFixHtml(k){
  if(!k.amyClean || k.amyFrom!==k.liReplyId) return '<div class="amy-fix" id="kit-amyfix" hidden></div>';
  const f=k.amyFixes||[];
  return '<div class="amy-fix" id="kit-amyfix">'+(f.length?'<b>Spelling fixed:</b> '+f.map(x=>'<span><s>'+esc(x.from)+'</s> → '+esc(x.to)+'</span>').join(""):'<b>No spelling mistakes found.</b>')+'</div>';
}
async function amyCleanVersion(eid){
  const k=kitOf(eid)||{}; if(!k.liNote) return "";
  if(k.amyClean && k.amyFrom===k.liReplyId) return k.amyClean;
  const plain=amyUnwrap(k.liNote);
  let text=plain, fixes=[];
  const iss=txCheck(plain, eid); if(iss.length){ text=txFixed(plain, iss); fixes=iss.map(x=>({from:x.found,to:x.fix})); }
  try{
    toast("Checking Amy's wording for spelling…", 30000);
    const raw=await writer("You are a careful copy editor. Proofread this LinkedIn event description. Fix ONLY spelling mistakes, typos, doubled words and clear punctuation errors. Do not change word choices, tone, sentences or paragraph breaks. Use American spelling and these exact terms: MISMO, MISMO Mic'd Up, FRAME, eNote, eClose, eVault, SMART Doc, Fannie Mae, Freddie Mac, Ginnie Mae. Return ONLY a JSON object: {\"text\": the corrected text with paragraphs separated by one blank line, \"fixes\": [{\"from\": \"misspelled word\", \"to\": \"correction\"}]}.", text);
    const o=parseJson(raw);
    if(o && typeof o.text==="string" && o.text.trim()){ const t2=o.text.trim();
      /* keep her words: only accept a proofread that stays within a few percent of her length */
      if(Math.abs(t2.length-text.length) <= Math.max(12, text.length*0.04)){ text=t2; fixes=fixes.concat((o.fixes||[]).filter(x=>x&&x.from&&x.to&&x.from!==x.to).map(x=>({from:String(x.from),to:String(x.to)}))); } }
  }catch(e){}
  await put("kits", eid, Object.assign({}, kitOf(eid), {amyClean:text, amyFixes:fixes, amyFrom:k.liReplyId||""}));
  return text;
}
/* names from the episode plan (company, guests) that MISMO's wording uses but Brian's own post doesn't */
function liFlags(e,k,liText){
  if(!k.brianPost || !liText) return [];
  const bp=k.brianPost.toLowerCase(), lt=liText.toLowerCase();
  return [e.company].concat(String(e.guests||"").split(/,|&|\band\b/)).map(x=>String(x||"").trim()).filter(x=>x.length>2)
    .filter((x,i,a)=>a.indexOf(x)===i && lt.includes(x.toLowerCase()) && !bp.includes(x.toLowerCase()));
}
/* Brian's own LinkedIn post, beside MISMO's description so the two can be compared */
function liBrianHtml(e,k,liText){
  const open=k.brianPostUrl?'<a class="btn sm" href="'+esc(k.brianPostUrl)+'" target="_blank" rel="noopener">Open on LinkedIn ↗</a>':'';
  if(!k.brianPost || KIT.bpEdit===k.id) return '<div class="kli-bp"><div class="kcopy-h"><span>Brian\'s LinkedIn Post</span>'+open+'</div>'+
    '<textarea id="kit-bp" rows="6" placeholder="Paste Brian\'s LinkedIn post about this episode">'+esc(k.brianPost||"")+'</textarea>'+
    '<input type="url" id="kit-bpurl" placeholder="Link to his post or LinkedIn Live (optional)" value="'+esc(k.brianPostUrl||"")+'">'+
    '<div class="kbtns"><button class="btn sm" type="button" id="kit-bpsave">Bring It In</button>'+(k.brianPost?'<button class="btn sm" type="button" id="kit-bpcancel">Cancel</button>':'')+'</div></div>';
  const fl=liFlags(e,k,liText);
  return '<div class="kli-bp"><div class="kcopy-h"><span>Brian\'s LinkedIn Post</span><span class="kli-bpb">'+open+'<button class="btn sm" type="button" id="kit-bpedit">Change</button></span></div>'+
    '<div class="kli-bptext">'+esc(k.brianPost).replace(/\n/g,"<br>")+'</div>'+
    (fl.length?'<div class="kli-flag"><b>Check:</b> MISMO\'s description mentions '+fl.map(x=>'<b>'+esc(x)+'</b>').join(", ")+', but Brian\'s post doesn\'t.</div>':'')+'</div>';
}
function liLiveHtml(e,k,liText,thumbs){
  if(!liText) return '<div class="hint">Written in MISMO\'s voice from Brian\'s LinkedIn post, then reviewed by Amy.</div>';
  const st=k.liStatus||"draft", locked=st==="review"||st==="approved", rev=st==="draft" && !!k.liRevising;
  const cover=thumbs.find(t=>t.img===k.thumbPick)||thumbs[0];
  const box=(id,label,val,rows)=>'<div class="kcopy"><div class="kcopy-h"><span>'+label+'</span>'+(st==="approved"?'<button class="btn sm" type="button" data-kcopy="'+id+'">Copy</button>':'')+'</div>'+(rows?'<textarea id="'+id+'" rows="'+rows+'"'+(locked?' readonly':'')+'>'+esc(val||"")+'</textarea>':'<input type="text" id="'+id+'" maxlength="75" value="'+esc(val||"")+'"'+(locked?' readonly':'')+'>')+'</div>';
  let h='<div class="kli-h">'+chip(LI_STAT,st)+'<span class="hint">Streamed from Riverside to MISMO\'s LinkedIn page. No YouTube link.</span></div>'+
    box("kit-liname","Event Name (75 characters at most)",e.liEventName||liEventName((k.written||{}).title,e))+
    '<div class="kli-cmp"><div class="kli-mine">'+box("kit-li","MISMO\'s Event Description"+(st==="edits"?" (put Amy\'s edits in here)":""),liText,9)+'</div>'+liBrianHtml(e,k,liText)+'</div>';
  const reviseBtn='<button class="btn sm" type="button" id="kit-lirevise">Revise and Send Back to Amy</button>';
  const amyTools=(use)=>'<div class="amy-tools"><button class="btn sm" type="button" id="kit-amycopy">Copy Amy\'s Version</button>'+(use?'<button class="btn sm" type="button" id="kit-amyuse">Put It in the Description</button>':'')+'<span class="hint">Cleaned up from her email and checked for spelling.</span></div>'+amyFixHtml(k);
  if((st==="changes"||st==="edits") && k.liNote) h+='<div class="kli-note'+(st==="edits"?' kli-edits':'')+'"><b>'+(st==="edits"?"Amy\'s edits (from her email reply). Use her wording:":"Amy:")+'</b><br>'+esc(k.liNote).replace(/\n/g,"<br>")+(st==="edits"?amyTools(true):'')+'</div>';
  if(st==="approved" && k.liNote && k.liReplyId) h+='<div class="kli-note kli-ok"><b>Amy replied:</b> '+esc(k.liNote).replace(/\n/g,"<br>")+amyTools(false)+'</div>';
  if(rev) h+='<div class="kli-rev"><b>Revising the wording Amy already has.</b> Fix the description above (or have the Writer redo it), then send it back. Amy\'s email says to use this version instead.'+
    '<textarea id="kit-revnote" rows="2" placeholder="What changed, for Amy (e.g. Brian recorded this one on his own, so Xactus is out)">'+esc(k.liRevNote||"")+'</textarea>'+
    '<div class="kbtns"><button class="btn sm pri" type="button" id="kit-lirevsend">Send Revised Version to Amy</button><button class="btn sm" type="button" id="kit-lirewrite">Rewrite It from the Transcript</button><button class="btn sm" type="button" id="kit-lisave">Save Changes</button><button class="btn sm" type="button" id="kit-lirevcancel">Cancel</button></div>'+
    '<div class="hint">Rewrite uses the transcript, Brian\'s post and your note above.</div></div>';
  else if(st==="draft"||st==="changes") h+='<div class="kbtns"><button class="btn sm pri" type="button" id="kit-liamy">Send to Amy for Approval</button><button class="btn sm" type="button" id="kit-lisave">Save Changes</button></div>';
  else if(st==="edits") h+='<div class="kbtns"><button class="btn sm pri" type="button" id="kit-liedits">Edits Made: Ready to Set Up</button><button class="btn sm" type="button" id="kit-lisave">Save Changes</button>'+reviseBtn+'</div>';
  else if(st==="review") h+='<div class="kli-amy"><div class="hint">Emailed to Amy. Her reply (Approved, or her edits) lands here by itself. She can also approve here:</div><textarea id="kit-linote" rows="2" placeholder="What to change (only needed for Request Changes)"></textarea><div class="kbtns"><button class="btn sm pri" type="button" id="kit-liok">Approve</button><button class="btn sm" type="button" id="kit-lichg">Request Changes</button><button class="btn sm" type="button" id="kit-liresend">Resend to Amy</button>'+reviseBtn+'</div>'+(k.liSentAt?'<div class="hint">Last sent '+esc(new Date(k.liSentAt).toLocaleString([],{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}))+'.</div>':'')+'</div>';
  else h+='<div class="kli-go"><b>Set up the LinkedIn Live event</b><ol><li>On MISMO\'s LinkedIn page: Create › Event › Online, format LinkedIn Live.</li><li>Paste the event name and description above.</li><li>Date '+esc(fD(liDate(e)))+', '+esc(e.linkedinTime||"1:00 PM ET")+'. Connect it to Riverside as the streaming tool.</li><li>Cover image: '+(cover?'<button class="btn sm" type="button" data-kcover="'+esc(cover.img)+'">Download the Thumbnail</button>':'the thumbnail from step 2')+'</li></ol>'+
    '<div class="kbtns"><input type="url" id="kit-liurl" placeholder="Paste the LinkedIn event link" value="'+esc(e.linkedinUrl||"")+'"><button class="btn sm" type="button" id="kit-liurl-save">'+(e.liEventSet?"Event Set Up ✓":"Save Event Link")+'</button><button class="btn sm" type="button" id="kit-lidone">'+(e.linkedinDone?"Streamed ✓":"Mark as Streamed")+'</button><button class="btn sm" type="button" id="kit-lireopen">Edit the Wording</button>'+reviseBtn+'</div></div>';
  return h;
}

/* ---------- the kit card on the Mic'd Up page ---------- */
function kitEpisodes(){ const ids=new Set(vals("kits").filter(k=>(k.folderId||k.spFolder) && S.episodes[k.id]).map(k=>k.id)); vals("episodes").filter(e=>e.spFolder).forEach(e=>ids.add(e.id));
  return [...ids].map(id=>S.episodes[id]).sort((a,b)=>((+b.season||1)-(+a.season||1))||((+b.num||0)-(+a.num||0))); }
function kitCardHtml(){
  const eps=kitEpisodes();
  if(!eps.length) return '<div class="card kitcard"><div class="ch"><h2>YouTube Kit</h2><span class="note">from each episode\'s SharePoint folder</span><div class="r"><button class="btn sm" type="button" id="kit-add">Pull In a Drive Folder</button></div></div><div class="empty">Each Season 2 episode gets its own folder in SharePoint (Marketing › MISMO Mic\'d Up) as soon as it has a number. Once Brian\'s files are in it, the video, thumbnails, transcript and clips land here, and the copy is written from the transcript.</div></div>';
  /* open on the episode being worked now: the earliest one from the last week that still has YouTube or MISMO's LinkedIn Live to do, else the next to air */
  /* re-picked on every draw until someone chooses from the list, so it settles once all the records have loaded */
  if(KIT.auto || !KIT.ep || !eps.find(e=>e.id===KIT.ep)){ const t=T();
    const now=eps.filter(e=>e.airDate && e.airDate>=add(t,-7) && (!e.youtubeDone || !liClosed(e))).sort((a,b)=>a.airDate<b.airDate?-1:1);
    KIT.ep=(now[0]||eps[0]).id; KIT.auto=true; }
  const e=S.episodes[KIT.ep], k=kitOf(KIT.ep)||{}, w=k.written||{};
  const tx=KIT.tx[KIT.ep], iss=KIT.txIssues[KIT.ep]||[];
  const thumbs=(k.thumbs||[]).filter(t=>S.images[t.img]);
  const sp=!!(e.spFolder||k.spFolder), hasTx=!!(k.transcriptId||k.transcriptPath);
  const step=(n,title,done,body)=>'<div class="kstep'+(done?" done":"")+'"><div class="kn">'+(done?"✓":n)+'</div><div class="kb"><div class="kt">'+title+'</div>'+body+'</div></div>';
  const copyBox=(id,label,val,rows)=>'<div class="kcopy"><div class="kcopy-h"><span>'+label+'</span><button class="btn sm" type="button" data-kcopy="'+id+'">Copy</button></div>'+(rows?'<textarea id="'+id+'" rows="'+rows+'">'+esc(val||"")+'</textarea>':'<input type="text" id="'+id+'" value="'+esc(val||"")+'">')+'</div>';
  const liText = (e.linkedinCopy || w.li || "");
  const vidLink = k.video ? (k.video.path ? '<a class="btn sm pri" href="'+esc(spFileUrl(k.video.path,true))+'" target="_blank" rel="noopener">Download ↓</a><a class="btn sm" href="'+esc(spFileUrl(k.video.path,false))+'" target="_blank" rel="noopener">Watch ↗</a>' : '<a class="btn sm pri" href="'+esc(driveView(k.video.id))+'" target="_blank" rel="noopener">Open to Download ↗</a>') : '';
  const fromTx = w.from==="transcript";
  const g = guestFor(e);
  let n=0;
  const body =
    step(++n,"Download the Final Video", !!k.video, k.video ? '<div class="kfile"><span class="kic">▶</span><div><b>'+esc(k.video.name)+'</b><small>'+esc(mb(k.video.size))+' · the largest video in the folder</small></div>'+vidLink+'</div>' : '<div class="hint">'+(sp?'Waiting for the final video in the episode folder.':'No .mp4 in the folder yet.')+'</div>')+
    step(++n,"Thumbnail"+(thumbs.length>1?" · pick the one to use":""), !!k.thumbPick, thumbs.length ? '<div class="kthumbs">'+thumbs.map(t=>{ const im=S.images[t.img]; return '<div class="kthumb'+(k.thumbPick===t.img?" on":"")+'"><button type="button" class="kthumb-i" data-kpick="'+esc(t.img)+'" title="Use this one"><img data-kimg="'+esc(t.img)+'" src="'+esc(imgSrc(im))+'" alt=""></button><div class="kthumb-f"><span>'+esc(t.name)+'</span>'+(k.thumbPick===t.img?'<b class="chip ok">Using This One</b>':'<button class="btn sm" type="button" data-kpick="'+esc(t.img)+'">Use This One</button>')+'<button class="btn sm" type="button" data-kdl="'+esc(t.img)+'">Download</button></div></div>'; }).join("")+'</div>' : '<div class="hint">No thumbnails in the folder yet.</div>')+
    step(++n,"Check the Transcript", !!k.txOk, !hasTx ? '<div class="hint">No transcript in the folder yet. Riverside\'s transcript as a .txt works best.</div>' :
      (tx==null ? '<button class="btn sm" type="button" id="kit-tx">Check '+esc(k.transcriptName||"the transcript")+'</button>' :
        '<div class="ktx">'+(iss.length ? '<div class="ktx-h"><b>'+iss.length+' thing'+(iss.length===1?"":"s")+' to fix</b><span class="hint">Untick any that are right as they are.</span></div><div class="ktx-l">'+iss.map((x,i)=>'<label class="ktx-r"><input type="checkbox" data-ktx="'+i+'" checked> <s>'+esc(x.found)+'</s> → <b>'+esc(x.fix)+'</b> <small>'+x.n+'× · '+esc(x.why)+'</small></label>').join("")+'</div>' : '<div class="ktx-ok">No misspelled names or MISMO terms found.</div>')+
        '<div class="kbtns"><button class="btn sm pri" type="button" id="kit-txdl">Download '+(iss.length?"Corrected ":"")+'Transcript (.txt)</button><button class="btn sm" type="button" id="kit-txok">'+(k.txOk?"Checked ✓":"Mark as Checked")+'</button><label class="hint ktx-add">Other names to check: <input type="text" id="kit-names" value="'+esc(k.extraNames||"")+'" placeholder="e.g. Dave Savage, Homebase"></label></div></div>'))+
    step(++n,"Titles, Descriptions and Posts", !!(w.title||w.desc), (w.title||w.desc) ?
        copyBox("kit-title","YouTube Title",e.ytTitle||w.title)+copyBox("kit-desc","YouTube Description",w.desc+(w.chapters?"\n\n"+w.chapters:""),8)+
        (fromTx ? '<details class="kmore"><summary>More copy from the transcript</summary>'+
          (w.titles&&w.titles.length?'<div class="hint">Other title ideas: '+w.titles.map(esc).join(" · ")+'</div>':'')+
          copyBox("kit-long","Long Description"+(MU_PAUSED.spotify?" (LinkedIn Live event)":" (LinkedIn Live event and Spotify)"),w.long,8)+copyBox("kit-promo","Brian\'s Promo Post",w.promo,4)+copyBox("kit-matters","MISMO Matters Blurb",w.matters,3)+
          (k.article?copyBox("kit-article","Viewpoint Article Draft (for Brian)",k.article,10):'')+'</details>' : '')+
        '<div class="kbtns">'+(hasTx?'<button class="btn sm" type="button" id="kit-writeall">Write Again from the Transcript</button>':'<button class="btn sm" type="button" id="kit-rewrite">Write Again</button>')+(hasTx?'<button class="btn sm" type="button" id="kit-article">'+(k.article?"Redraft":"Draft")+' Brian\'s Viewpoint Article</button>':'')+'<span class="hint">'+(fromTx?'Written in MISMO\'s voice from the transcript.':'Written in MISMO\'s voice from Brian\'s LinkedIn post.')+'</span></div>'
      : (hasTx ? '<button class="btn sm pri" type="button" id="kit-writeall">Write Everything from the Transcript</button><span class="hint"> YouTube title and description, the long description, Brian\'s post, MISMO\'s LinkedIn Live wording, the MISMO Matters blurb'+(MU_PAUSED.clips?'':' and clip captions')+'.</span>'
        : (k.brianPost ? '<button class="btn sm" type="button" id="kit-rewrite">Write the Title and Description</button>' : '<div class="hint">Once the transcript is in the folder, it\'s all written from that. Or paste Brian\'s LinkedIn post:</div><textarea id="kit-post" rows="3" placeholder="Paste Brian\'s LinkedIn post"></textarea><div class="kbtns"><button class="btn sm" type="button" id="kit-postgo">Write It</button></div>')))+
    step(++n,"Post on YouTube", !!e.youtubeDone, '<div class="kbtns"><a class="btn sm" href="https://studio.youtube.com/" target="_blank" rel="noopener">Open YouTube Studio ↗</a><input type="url" id="kit-yt" placeholder="Paste the YouTube link once it\'s up" value="'+esc(e.youtubeUrl||"")+'"><button class="btn sm" type="button" id="kit-ytsave">'+(e.youtubeDone?"On YouTube ✓":"Save Link")+'</button></div>')+
    (MU_PAUSED.spotify?'':step(++n,"On Spotify · Friday 6:30 AM", !!e.spotifyDone, '<div class="kbtns"><input type="url" id="kit-sp" placeholder="Paste the Spotify episode link" value="'+esc(e.spotifyUrl||"")+'"><button class="btn sm" type="button" id="kit-spsave">'+(e.spotifyDone?"On Spotify ✓":"Save Link")+'</button><span class="hint">Brian publishes it. Use the long description and the same thumbnail.</span></div>'))+
    step(++n,(e.liCanceled?"Canceled · ":"")+"MISMO LinkedIn Live · "+esc(fD(liDate(e)))+" at "+esc(e.linkedinTime||"1:00 PM ET"), liClosed(e), e.liCanceled ? cxBox("ep",e.id,"LinkedIn Post") : liLiveHtml(e,k,liText,thumbs)+cxBox("ep",e.id,"LinkedIn Post"))+
    (MU_PAUSED.clips?'':step(++n,"Clips for the Next Two Weeks", vals("pieces").some(p=>p.clipOf===e.id), ((k.clips||[]).length ? '<div class="kclips">'+(k.clips||[]).map((c,i)=>'<div class="kfile"><span class="kic">✂</span><div><b>'+esc(c.name)+'</b><small>'+esc(mb(c.size))+((w.clips||[])[i]?' · '+esc((w.clips||[])[i]):'')+'</small></div><a class="btn sm" href="'+esc(spFileUrl(c.path,true))+'" target="_blank" rel="noopener">Download ↓</a></div>').join("")+'</div>' : '<div class="hint">Riverside\'s Magic Clips go in the same folder. Short clips are the best way to keep an episode in front of people after Friday.</div>')+
      '<div class="kbtns"><button class="btn sm" type="button" id="kit-clips">'+(vals("pieces").some(p=>p.clipOf===e.id)?"Clip Posts Planned ✓":"Plan the Clip Posts")+'</button><span class="hint">Three or four posts on MISMO\'s LinkedIn page over the two weeks after the episode, each with its caption.</span></div>'))+
    step(++n,"The Guest\'s Share Kit", !!e.guestKitSent, (g||e.guestEmail) ? (w.guest?copyBox("kit-guest","A Post for the Guest to Share",w.guest,3):'')+'<div class="kbtns"><a class="btn sm pri" id="kit-guestmail" href="'+esc(guestKitMail(e,k))+'">Email the Guest</a><button class="btn sm" type="button" id="kit-guestsent">'+(e.guestKitSent?"Sent ✓":"Mark as Sent")+'</button><span class="hint">Opens an email to '+esc((g&&(g.shareEmail||g.e))||e.guestEmail)+' with the links and a ready-made post. Send it once the episode is live.</span></div>'
      : '<div class="hint">Send the guest the form when Brian books them (in the episode, under Guest and Run of Show). Their email lands here for the share kit.</div>');
  return '<div class="card kitcard"><div class="ch"><h2>YouTube Kit</h2><select id="kit-ep" aria-label="Episode">'+eps.map(x=>'<option value="'+esc(x.id)+'"'+(x.id===KIT.ep?" selected":"")+'>'+esc(epWord(x))+(x.airDate?' · '+esc(fS(x.airDate)):'')+'</option>').join("")+'</select><span class="note">'+esc(k.folderName||(e.spFolder||"").split("/").pop()||"")+'</span><div class="r">'+
    /* Brian still shares a Google Drive folder in the MISMO MIC'D UP chat: paste it here and the kit works from it.
       (Teams messages aren't read by MISMO Media, by Jonna's decision, so the link is pasted, not picked up.) */
    (k.folderId?'<a class="btn sm" href="'+esc(k.folderUrl||"#")+'" target="_blank" rel="noopener">Brian\'s Drive Folder ↗</a><button class="btn sm" type="button" id="kit-repull">Pull Again</button><button class="btn sm" type="button" id="kit-drive">Change the Drive Link</button>'
      :(sp?'<button class="btn sm pri" type="button" id="kit-drive">Paste Brian\'s Drive Link</button><a class="btn sm" href="'+esc(spFolderUrl(e.spFolder||k.spFolder))+'" target="_blank" rel="noopener">Open the Folder ↗</a><button class="btn sm" type="button" id="kit-sppull">Check the Folder</button>':'<button class="btn sm pri" type="button" id="kit-drive">Paste Brian\'s Drive Link</button>'))+'</div></div>'+
    (k.brianPost?'<details class="kpost"><summary>Brian\'s LinkedIn post'+(k.brianPostUrl?' · <a href="'+esc(k.brianPostUrl)+'" target="_blank" rel="noopener" onclick="event.stopPropagation()">open ↗</a>':'')+'</summary><p>'+esc(k.brianPost).replace(/\n/g,"<br>")+'</p></details>':'')+
    '<div class="ksteps">'+body+'</div></div>';
}
function wireKit(el){
  const eid=KIT.ep, k=kitOf(eid)||{}, e=S.episodes[eid]||{};
  const sel=$("#kit-ep",el); if(sel) sel.onchange=()=>{ KIT.ep=sel.value; KIT.auto=false; renderMicdup(); };
  const add=$("#kit-add",el); if(add) add.onclick=()=>openPane({eye:"YouTube Kit", title:"Pull In a Drive Folder", data:{}, fields:[{k:"url",label:"Brian's Google Drive Folder Link",type:"url",wide:true,ph:"https://drive.google.com/drive/folders/…"}],
    buttons:[{label:"Pull It In", run:async v=>{ const m=String(v.url||"").match(FOLDER_RX); if(!m){ toast("That isn't a Google Drive folder link."); return; } closePane(true);
      let info; try{ info=await DRIVE().list(m[1]); }catch(err){ toast("Couldn't open that folder: "+(err.message||"try again"),5000); return; }
      const n=parseFolder(info.name).num; let ep=n?epByNum(n, T()):null;
      if(!ep){ const id=n?epNewId(n):uid("ep"); await put("episodes", id, {num:n||"", season:epNewSeason(), airDate:"", title:"", guests:"", company:""}); ep=S.episodes[id]; }
      KIT.ep=ep.id; KIT.auto=false; await kitPullFolder(ep.id, m[1], ""); renderMicdup(); }}]});
  if(!eid) return;
  const kd=$("#kit-drive",el); if(kd) kd.onclick=()=>openPane({eye:"YouTube Kit · "+epWord(e), title:"Brian's Google Drive Folder", data:{url:k.folderUrl||""}, fields:[{k:"url",label:"The folder link Brian posted in the MISMO MIC'D UP chat",type:"url",wide:true,ph:"https://drive.google.com/drive/folders/…"}],
    buttons:[{label:"Pull It In", run:async v=>{ const m=String(v.url||"").match(FOLDER_RX); if(!m){ toast("That isn't a Google Drive folder link."); return; } closePane(true); await kitPullFolder(eid, m[1], ""); delete KIT.tx[eid]; renderMicdup(); }}]});
  const rp=$("#kit-repull",el); if(rp) rp.onclick=async()=>{ await kitPullFolder(eid, k.folderId, k.chatId); delete KIT.tx[eid]; renderMicdup(); };
  $$("[data-kcopy]",el).forEach(b=>b.onclick=()=>{ const t=$("#"+b.dataset.kcopy,el); copyText(t.value, b.closest(".kcopy").querySelector("span").textContent); });
  $$("[data-kpick]",el).forEach(b=>b.onclick=async()=>{ await put("kits", eid, Object.assign({}, kitOf(eid), {thumbPick:b.dataset.kpick})); renderMicdup(); });
  $$("[data-kdl]",el).forEach(b=>b.onclick=()=>downloadImage(S.images[b.dataset.kdl]));
  $$("img[data-kimg]",el).forEach(i=>{ const im=S.images[i.dataset.kimg]; if(im && !i.getAttribute("src")) imgEnsure(im).then(()=>{ i.src=imgSrc(im); }); });
  const txb=$("#kit-tx",el); if(txb) txb.onclick=async()=>{ txb.disabled=true; txb.textContent="Reading…"; await kitLoadTranscript(eid); renderMicdup(); };
  const nm=$("#kit-names",el); if(nm) nm.onchange=async()=>{ await put("kits", eid, Object.assign({}, kitOf(eid), {extraNames:nm.value})); KIT.txIssues[eid]=txCheck(KIT.tx[eid]||"", eid); renderMicdup(); };
  const dl=$("#kit-txdl",el); if(dl) dl.onclick=()=>{ const skip={}; $$("[data-ktx]",el).forEach(c=>{ if(!c.checked) skip[c.dataset.ktx]=true; }); const out=txFixed(KIT.tx[eid]||"", KIT.txIssues[eid]||[], skip);
    saveBlob(new Blob([out],{type:"text/plain;charset=utf-8"}), "Micd Up Ep "+(e.num||"")+" Transcript.txt"); };
  const ok=$("#kit-txok",el); if(ok) ok.onclick=async()=>{ await put("kits", eid, Object.assign({}, kitOf(eid), {txOk:!k.txOk})); if(!k.txOk && !e.captions) await patch("episodes", eid, {captions:true}); renderMicdup(); };
  const rw=$("#kit-rewrite",el); if(rw) rw.onclick=async()=>{ rw.disabled=true; await kitWrite(eid, true); renderMicdup(); };
  const pg=$("#kit-postgo",el); if(pg) pg.onclick=async()=>{ const t=$("#kit-post",el).value.trim(); if(t.length<40){ toast("Paste Brian's whole LinkedIn post."); return; } const li=(t.match(/https?:\/\/[^\s]*linkedin\.com[^\s]*/i)||[""])[0];
    await put("kits", eid, Object.assign({}, kitOf(eid), {brianPost:t.replace(li,"").trim(), brianPostUrl:li, written:null})); await kitWrite(eid, true); renderMicdup(); };
  const ti=$("#kit-title",el); if(ti) ti.onchange=()=>patch("episodes", eid, {ytTitle:ti.value});
  const ds=$("#kit-desc",el); if(ds) ds.onchange=()=>put("kits", eid, Object.assign({}, kitOf(eid), {written:Object.assign({}, (kitOf(eid)||{}).written, {desc:ds.value})}));
  const spp=$("#kit-sppull",el); if(spp) spp.onclick=async()=>{ spp.disabled=true; await kitPullSP(eid); delete KIT.tx[eid]; renderMicdup(); };
  const wa=$("#kit-writeall",el); if(wa) wa.onclick=async()=>{ wa.disabled=true; wa.textContent="Writing… (about a minute)"; await kitWriteAll(eid); renderMicdup(); };
  const ar=$("#kit-article",el); if(ar) ar.onclick=async()=>{ ar.disabled=true; ar.textContent="Drafting…"; await kitWriteArticle(eid); renderMicdup(); };
  const cl=$("#kit-clips",el); if(cl) cl.onclick=async()=>{ cl.disabled=true; await planClipPosts(eid); renderMicdup(); };
  const gs=$("#kit-guestsent",el); if(gs) gs.onclick=async()=>{ await patch("episodes", eid, {guestKitSent:!e.guestKitSent}); renderMicdup(); };
  const sps=$("#kit-spsave",el); if(sps) sps.onclick=async()=>{ const u=$("#kit-sp",el).value.trim(); if(u && !/^https?:\/\/(open\.)?spotify\.com\//i.test(u) && !/^https?:\/\/creators\.spotify\.com\//i.test(u)){ toast("Paste the Spotify link."); return; } await patch("episodes", eid, {spotifyUrl:u, spotifyDone:true}); toast("Saved"); renderMicdup(); };
  const ys=$("#kit-ytsave",el); if(ys) ys.onclick=async()=>{ const u=$("#kit-yt",el).value.trim(); if(!/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(u)){ toast("Paste the YouTube link."); return; }
    await patch("episodes", eid, {youtubeUrl:u, youtubeDone:true}); toast("Saved"); renderMicdup(); };
  const liVals=()=>({liEventName:($("#kit-liname",el)||{}).value||"", linkedinCopy:($("#kit-li",el)||{}).value||""});
  const ls=$("#kit-lisave",el); if(ls) ls.onclick=async()=>{ await patch("episodes", eid, liVals()); toast("Saved"); };
  const la=$("#kit-liamy",el); if(la) la.onclick=async()=>{ la.disabled=true; const v=liVals(); await patch("episodes", eid, v); await put("kits", eid, Object.assign({}, kitOf(eid), {liStatus:"review", liSentAt:new Date().toISOString(), liNote:""}));
    const ok=await liSendAmy(S.episodes[eid], kitOf(eid), v.liEventName, v.linkedinCopy); toast(ok?"Sent to Amy by email. It also shows under Waiting on Amy.":"Marked as with Amy.", 4000); renderMicdup(); };
  const amc=$("#kit-amycopy",el); if(amc) amc.onclick=async()=>{ amc.disabled=true; const t=await amyCleanVersion(eid); if(t){ copyText(t,"Amy's version"); } amc.disabled=false; renderMicdup(); };
  const amu=$("#kit-amyuse",el); if(amu) amu.onclick=async()=>{ amu.disabled=true; const t=await amyCleanVersion(eid); if(t){ await patch("episodes", eid, {linkedinCopy:t}); toast("Amy's version is in the description. Press Edits Made when it looks right.", 5000); } renderMicdup(); };
  const lrs=$("#kit-liresend",el); if(lrs) lrs.onclick=async()=>{ lrs.disabled=true; const ep=S.episodes[eid], kk=kitOf(eid)||{};
    const name=ep.liEventName||liEventName((kk.written||{}).title||ep.title||"",ep), desc=ep.linkedinCopy||((kk.written||{}).li)||"";
    if(!desc){ toast("There's no LinkedIn Live description to send yet."); lrs.disabled=false; return; }
    const ok=await liSendAmy(ep, kk, name, desc);
    if(ok){ await put("kits", eid, Object.assign({}, kitOf(eid), {liSentAt:new Date().toISOString()})); toast("Sent to Amy again. Her reply lands here by itself.", 4000); }
    renderMicdup(); };
  const lok=$("#kit-liok",el); if(lok) lok.onclick=async()=>{ await patch("episodes", eid, liVals()); await put("kits", eid, Object.assign({}, kitOf(eid), {liStatus:"approved", liApprovedAt:new Date().toISOString(), liApprovedBy:(window.__hqWho||"")})); toast("Approved. Vanessa can set up the event."); renderMicdup(); };
  const lch=$("#kit-lichg",el); if(lch) lch.onclick=async()=>{ const note=($("#kit-linote",el)||{}).value||""; if(!note.trim()){ toast("Say what to change in the note box."); return; } await patch("episodes", eid, liVals()); await put("kits", eid, Object.assign({}, kitOf(eid), {liStatus:"changes", liNote:note})); toast("Sent back with your note."); renderMicdup(); };
  const led=$("#kit-liedits",el); if(led) led.onclick=async()=>{ await patch("episodes", eid, liVals()); await put("kits", eid, Object.assign({}, kitOf(eid), {liStatus:"approved", liApprovedAt:new Date().toISOString(), liApprovedBy:"Amy (edits applied)"})); toast("Ready to set up with Amy's edits."); renderMicdup(); };
  /* MISMO's description shows in full (no scrolling) and lines up with Brian's post beside it */
  const kli=$("#kit-li",el); if(kli){ const fit=()=>{ kli.style.minHeight="0px"; kli.style.minHeight=(kli.scrollHeight+2)+"px"; }; requestAnimationFrame(fit); kli.addEventListener("input",fit); }
  const lrv=$("#kit-lirevise",el); if(lrv) lrv.onclick=async()=>{ const kk=kitOf(eid)||{}; await put("kits", eid, Object.assign({}, kk, {liStatus:"draft", liRevising:true, liRevFrom:kk.liStatus||"review", liRevNote:""})); renderMicdup(); };
  const lrc=$("#kit-lirevcancel",el); if(lrc) lrc.onclick=async()=>{ const kk=kitOf(eid)||{}; await put("kits", eid, Object.assign({}, kk, {liStatus:kk.liRevFrom||"review", liRevising:false})); renderMicdup(); };
  const rvn=$("#kit-revnote",el); if(rvn) rvn.onchange=()=>put("kits", eid, Object.assign({}, kitOf(eid), {liRevNote:rvn.value}));
  const lrw=$("#kit-lirewrite",el); if(lrw) lrw.onclick=async()=>{ lrw.disabled=true; lrw.textContent="Rewriting…"; await patch("episodes", eid, liVals());
    const t=await kitRewriteLi(eid, ($("#kit-revnote",el)||{}).value||""); if(t) await patch("episodes", eid, {linkedinCopy:t}); renderMicdup(); };
  const lrs2=$("#kit-lirevsend",el); if(lrs2) lrs2.onclick=async()=>{ const v=liVals(); if(!v.linkedinCopy.trim()){ toast("The description is empty."); return; } lrs2.disabled=true;
    const note=(($("#kit-revnote",el)||{}).value||"").trim(), kk=kitOf(eid)||{};
    await patch("episodes", eid, v);
    const ok=await liSendAmy(S.episodes[eid], kk, v.liEventName, v.linkedinCopy, null, {note});
    const hist=(kk.liRevisions||[]).concat([{at:new Date().toISOString(), note, by:(window.__hqWho||""), sent:ok}]);
    await put("kits", eid, Object.assign({}, kitOf(eid), {liStatus:"review", liRevising:false, liRevNote:"", liRevisions:hist, liSentAt:new Date().toISOString(), liNote:"", amyClean:"", amyFixes:[]}));
    toast(ok?"The revised version is on its way to Amy. Her reply lands here by itself.":"Marked as with Amy, but the email didn't send.", 5000); renderMicdup(); };
  const bpe=$("#kit-bpedit",el); if(bpe) bpe.onclick=()=>{ KIT.bpEdit=eid; renderMicdup(); };
  const bpc=$("#kit-bpcancel",el); if(bpc) bpc.onclick=()=>{ KIT.bpEdit=null; renderMicdup(); };
  const bps=$("#kit-bpsave",el); if(bps) bps.onclick=async()=>{ let t=($("#kit-bp",el).value||"").trim(), u=($("#kit-bpurl",el).value||"").trim();
    const li=(t.match(/https?:\/\/[^\s]*linkedin\.com[^\s]*/i)||[""])[0]; if(li){ t=t.replace(li,"").trim(); if(!u) u=li; }
    if(t.length<40){ toast("Paste Brian's whole LinkedIn post."); return; }
    if(u && !/^https?:\/\/([a-z]+\.)?linkedin\.com\//i.test(u)){ toast("That link isn't a LinkedIn link."); return; }
    KIT.bpEdit=null; await put("kits", eid, Object.assign({}, kitOf(eid), {brianPost:t, brianPostUrl:u})); toast("Brian's post is in. It sits beside MISMO's description.", 4000); renderMicdup(); };
  const lre=$("#kit-lireopen",el); if(lre) lre.onclick=async()=>{ await put("kits", eid, Object.assign({}, kitOf(eid), {liStatus:"draft"})); renderMicdup(); };
  const lu=$("#kit-liurl-save",el); if(lu) lu.onclick=async()=>{ const u=$("#kit-liurl",el).value.trim(); if(!/^https?:\/\/(www\.)?linkedin\.com\//i.test(u)){ toast("Paste the LinkedIn event link."); return; } await patch("episodes", eid, {linkedinUrl:u, liEventSet:true}); toast("Event saved"); renderMicdup(); };
  wireCx(el, ()=>renderMicdup());
  const ld=$("#kit-lidone",el); if(ld) ld.onclick=async()=>{ await patch("episodes", eid, {linkedinDone:!e.linkedinDone}); renderMicdup(); };
  $$("[data-kcover]",el).forEach(b=>b.onclick=()=>downloadImage(S.images[b.dataset.kcover]));
}
