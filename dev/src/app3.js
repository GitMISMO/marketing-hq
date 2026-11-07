
/* ================= MISMO Mic'd Up ================= */
function tk(on, due, label){ return '<span class="tk'+(on?" on":(due?" due":""))+'" title="'+esc(label)+'">'+(on?"✓":"·")+'</span>'; }
function renderMicdup(){
  const el=$("#page-micdup"), t=T();
  const fri=nextDow(t,5), ep=epOn(fri);
  const lastFri = add(fri,-7), lastEp=epOn(lastFri);
  const eps=epsSorted();
  const ytDue=vals("episodes").filter(e=>owes(e)&&e.airDate&&e.airDate<=t&&!e.youtubeDone);
  const notRec=vals("episodes").filter(e=>e.airDate&&e.airDate>=t&&e.airDate<=add(t,14)&&!isRecorded(e));
  const liDue=vals("episodes").filter(e=>owes(e)&&liDate(e)&&liDate(e)<=add(t,6)&&!liClosed(e));
  const webMissing=vals("episodes").filter(e=>owes(e)&&e.youtubeDone&&!e.websiteDone);
  const slots=fridays(add(t,-21),12).filter(f=>{ if(f>=t) return true; const e=epOn(f); return !!(e && owes(e) && !(e.youtubeDone&&liClosed(e)&&e.websiteDone)); }).slice(0,9);  // past Fridays only while their episode still has work left
  const run = slots.map(f=>{ const e=epOn(f); const past=f<t;
    if(!e) return '<tr class="click slot" data-new="'+f+'"><td><b>'+esc(fD(f))+'</b></td><td colspan="2">'+(f<MICDUP_START?'Before the new routine':'<span style="color:'+(past?"var(--bad)":"var(--ink-3)")+'">No episode yet · press to add it</span>')+'</td><td></td><td></td><td></td><td></td><td></td><td></td>'+(MU_PAUSED.spotify?'':'<td></td>')+'</tr>';
    const ed=editionFor(f);
    return '<tr class="click'+(past&&e.youtubeDone&&liClosed(e)?" past":"")+'" data-ep="'+esc(e.id)+'"><td><b>'+esc(fD(f))+'</b></td><td><b>'+esc(epTag(e))+'</b> '+esc(e.title||"")+'</td><td>'+esc(e.guests||"")+(e.company?'<span class="t2">'+esc(e.company)+'</span>':'')+'</td>'+
      '<td class="ck">'+tk(isRecorded(e), f<=add(t,7), e.recordDate?"Recorded "+fS(e.recordDate):"Not recorded yet")+'</td><td class="ck">'+tk(e.captions, past, "Captions proofed and uploaded")+'</td>'+(MU_PAUSED.spotify?'':'<td class="ck">'+tk(e.spotifyDone, past, "On Spotify Friday 6:30 AM")+'</td>')+'</td><td class="ck">'+tk(e.youtubeDone, past, "On YouTube Friday afternoon")+'</td><td class="ck">'+tk(e.linkedinDone, liDate(e)<t, "MISMO LinkedIn Live Monday "+fS(liDate(e)))+'</td><td class="ck">'+tk(e.websiteDone, false, "On the website's episode list")+'</td><td>'+(ed?esc(MONL[+ed.month.slice(5)-1]):"—")+'</td></tr>';
  }).join("");
  const all = eps.map(e=>'<tr class="click" data-ep="'+esc(e.id)+'"><td class="n"><b>'+esc(e.num||"")+'</b></td><td>'+esc(e.title||"(title needed)")+(e.notes?'<span class="t2">'+esc(mdPlain(e.notes))+'</span>':'')+'</td><td>'+esc(e.guests||"")+(e.company?'<span class="t2">'+esc(e.company)+'</span>':'')+'</td><td>'+esc(e.airDate?fS(e.airDate):"—")+'</td><td class="ck">'+tk(e.youtubeDone,false,"YouTube")+'</td><td class="ck">'+tk(e.linkedinDone,false,"LinkedIn")+'</td><td class="ck">'+tk(e.websiteDone,false,"Website")+'</td></tr>').join("");
  el.innerHTML='<div class="phead"><div><div class="eyebrow">Weekly Podcast</div><h1>MISMO Mic\'d Up</h1><div class="sub">Recorded in Riverside a week or two ahead. Live Friday at 8:30 AM ET on Brian\'s LinkedIn and Spotify (6:30 AM), on YouTube that afternoon, MISMO\'s LinkedIn Live Monday at 1:00 PM ET, then the next MISMO Matters.</div></div><div class="tools"><a class="btn" href="https://www.youtube.com/@MISMOStandards/videos" target="_blank" rel="noopener">Open the Channel →</a><button class="btn pri" type="button" id="mu-new">+ Add Episode</button></div></div>'+
    '<div class="band"><div class="onair"><div><span class="lbl"><i></i>'+(ep?"On Air":"Open Slot")+' · Friday 8:30 AM ET</span><div class="epn">'+(ep?"Episode "+esc(ep.num||"?"):"Episode "+(Math.max(0,...vals("episodes").map(e=>+e.num||0))+1))+'<small>'+esc(fD(fri))+'</small></div><div class="ept">'+esc(ep&&ep.title?ep.title:(ep?"Title to come":"Waiting on the file and Brian\'s description"))+'</div><div class="epg">'+esc(ep?[ep.guests,ep.company].filter(Boolean).join(", "):"Press the first box below to add it")+'</div></div>'+waveHtml(!!ep)+'</div><div class="say" style="font-size:14.5px">'+(ep?'<em>Episode '+esc(ep.num||"?")+'</em>'+(ep.title?': '+esc(ep.title):'')+(ep.guests?' with '+esc(ep.guests):'')+'.':'<span class="hot">No episode is set for this Friday yet.</span> Add it once Brian sends the file and his description.')+(ytDue.length?' <span class="hot">'+ytDue.length+' episode'+(ytDue.length>1?"s":"")+' still need to go up on YouTube.</span>':'')+'</div><div class="tiles">'+
      '<button class="tile" type="button" data-tile="fri"><div class="v'+(ep?"":" hot")+'">'+(ep?esc(epTag(ep)):"Needed")+'</div><div class="k">This Friday</div><div class="s">'+esc(fS(fri))+' · 8:30 AM ET</div></button>'+
      '<div class="tile"><div class="v'+(notRec.length?" hot":"")+'">'+notRec.length+'</div><div class="k">Not Recorded Yet</div><div class="s">running in the next two weeks</div></div>'+
      '<div class="tile"><div class="v'+(ytDue.length?" hot":"")+'">'+ytDue.length+'</div><div class="k">Waiting for YouTube</div><div class="s">aired, not uploaded</div></div>'+
      '<div class="tile"><div class="v">'+liDue.length+'</div><div class="k">LinkedIn Posts Due</div><div class="s">Monday after each episode</div></div>'+
      '<div class="tile"><div class="v'+(webMissing.length?" hot":"")+'">'+webMissing.length+'</div><div class="k">Missing from Website</div><div class="s">on YouTube, not on the site\'s list</div></div>'+
      '<div class="tile"><div class="v">'+eps.length+'</div><div class="k">Episodes Logged</div><div class="s">'+(eps[0]?"latest: Ep "+esc(eps[0].num):"")+'</div></div>'+
    '</div></div>'+
    '<div class="flow"><div class="st"><div class="when">1–2 Weeks Ahead</div><b>Recorded</b><small>Brian records with the guest in Riverside</small></div>'+
      '<div class="st"><div class="when">Friday · 8:30 AM ET</div><b>Live</b><small>LinkedIn Live on Brian\'s profile'+(MU_PAUSED.spotify?'':'; Spotify at 6:30 AM')+'</small></div>'+
      '<div class="st"><div class="when">Friday Afternoon</div><b>YouTube</b><small>Upload with Brian\'s description and proofed captions</small></div>'+
      '<div class="st"><div class="when">Monday · 1:00 PM ET</div><b>MISMO LinkedIn Live</b><small>Streamed from Riverside to MISMO\'s page, once Amy approves the wording</small></div>'+
      '<div class="st"><div class="when">Next MISMO Matters</div><b>Mic\'d Up Section</b><small>Listed automatically once it\'s on YouTube</small></div></div>'+
    kitCardHtml()+
    '<div class="card"><div class="ch"><h2>The Weekly Run</h2><span class="note">Recorded · Captions · '+(MU_PAUSED.spotify?'':'Spotify · ')+'YouTube · LinkedIn · Website</span></div><div class="tw"><table class="t"><thead><tr><th>Friday</th><th>Episode</th><th>Guest</th><th class="ck">Recorded</th><th class="ck">Captions</th>'+(MU_PAUSED.spotify?'':'<th class="ck">Spotify</th>')+'<th class="ck">YouTube</th><th class="ck">LinkedIn</th><th class="ck">Website</th><th>MISMO Matters</th></tr></thead><tbody>'+run+'</tbody></table></div></div>'+
    '<div class="card"><div class="ch"><h2>All Episodes</h2><span class="cnt">'+eps.length+'</span></div>'+(all?'<div class="tw"><table class="t"><thead><tr><th class="n">Ep</th><th>Title</th><th>Guest</th><th>Friday</th><th class="ck">YouTube</th><th class="ck">LinkedIn</th><th class="ck">Website</th></tr></thead><tbody>'+all+'</tbody></table></div>':'<div class="empty">'+(LIVE&&!LOADED.has("episodes")?"Loading episodes…":"No episodes logged yet. Add the first one above.")+'</div>')+'</div>';
  $("#mu-new",el).onclick=()=>newEpisode(epOn(fri)?add(fri,7):fri);
  $$("[data-ep]",el).forEach(r=>r.onclick=()=>openEpisode(r.dataset.ep));
  $$("[data-new]",el).forEach(r=>r.onclick=()=>newEpisode(r.dataset.new));
  const tf=$('[data-tile="fri"]',el); if(tf) tf.onclick=()=>ep?openEpisode(ep.id):newEpisode(fri);
  wireKit(el);
}
function isRecorded(e){ return !!(e.recordDate && e.recordDate<=T()); }
function newEpisode(fri){
  const season = Math.max(1,...vals("episodes").map(e=>+e.season||1));
  const max = Math.max(0,...vals("episodes").filter(e=>(+e.season||1)===season).map(e=>+e.num||0));
  openEpisode(null, {num:max+1, season:String(season), airDate:fri, linkedinDate:add(fri,3)});
}
function openEpisode(id, seed){
  const e = id ? Object.assign({}, S.episodes[id]) : Object.assign({}, seed||{});
  const ed = e.airDate ? editionFor(e.airDate) : null;
  const fields=[
    {sec:"The Episode"},
    {k:"num",label:"Episode Number",type:"number"},
    {k:"season",label:"Season",type:"select",opts:[["1","Season 1"],["2","Season 2"],["3","Season 3"]]},
    {k:"airDate",label:"Friday It Runs",type:"date"},
    {k:"recordDate",label:"Recorded On",type:"date",hint:"In Riverside, a week or two before it runs"},
    {k:"title",label:"Title",wide:true,ph:"e.g. Beyond the Next Loan: Building Trust, Community, and Influence"},
    {k:"guests",label:"Guests",ph:"e.g. Steve Manente and Mike Hallman"},
    {k:"company",label:"Company",ph:"e.g. DocsDirect"},
    {sec:"Guest and Run of Show"},
    {k:"guestEmail",label:"Guest's Email",ph:"For the guest form and the share kit"},
    {k:"_guest",type:"html",html:()=>guestPaneHtml(id?S.episodes[id]:e, id)},
    {k:"runOfShow",label:"Run of Show",type:"rich",rows:9,ph:"Drafted from the guest's answers, for Brian to use as his guide"},
    {k:"_folder",type:"html",html:()=>e.spFolder?'<div class="ro">Episode folder in SharePoint: <a href="'+esc(spFolderUrl(e.spFolder))+'" target="_blank" rel="noopener">'+esc(e.spFolder.split("/").pop())+' ↗</a></div>':'<div class="ro">The SharePoint folder is made automatically once the episode has a number.</div>'},
    {sec:"From Brian (Older Episodes)"},
    {k:"_paste",type:"html",html:()=>'<label class="flabel" for="ep-paste">Paste Brian\'s Message</label><textarea id="ep-paste" rows="3" placeholder="Paste the whole message from Teams. The Google Drive link and his description are pulled out for you."></textarea><span class="hint" id="ep-paste-msg"></span>'},
    {k:"fileUrl",label:"Episode File (Google Drive Link)",type:"url",ph:"https://drive.google.com/…",wide:true},
    {k:"fileIn",label:"File received from Brian",type:"cb"},
    {k:"bvDescription",label:"Brian's Description",type:"textarea",rows:7,ph:"Paste Brian's description. It goes on YouTube as is, and the LinkedIn post is written from it."},
    ...(MU_PAUSED.spotify?[]:[{sec:"Spotify · Friday 6:30 AM"},
    {k:"spotifyDone",label:"On Spotify",type:"cb"},
    {k:"spotifyUrl",label:"Spotify Link",type:"url",ph:"https://open.spotify.com/episode/…"}]),
    {sec:"YouTube · Friday Afternoon"},
    {k:"captions",label:"Captions uploaded and names proofed (MISMO spelled right, no burned-in captions)",type:"cb",wide:true},
    {k:"youtubeDone",label:"Posted to YouTube",type:"cb"},
    {k:"youtubeUrl",label:"YouTube Link",type:"url",ph:"https://www.youtube.com/watch?v=…"},
    {sec:"MISMO LinkedIn Live · Monday 1:00 PM ET"},
    {k:"_cx",type:"html",html:()=>id?cxBox("ep",id,"LinkedIn Post"):""},
    {k:"linkedinDate",label:"LinkedIn Post Date",type:"date",hint:"The Monday after the episode"},
    {k:"linkedinTime",label:"Post Time",ph:"e.g. 9:00 AM"},
    {k:"linkedinAuto",label:"Stage it: post on the MISMO page automatically Monday (links to YouTube)",type:"cb",wide:true},
    {k:"linkedinDone",label:"Posted on LinkedIn",type:"cb"},
    {k:"linkedinUrl",label:"LinkedIn Post Link",type:"url"},
    {k:"linkedinCopy",label:"LinkedIn Post",type:"textarea",rows:7,ph:"Written from Brian's description. Ends with the YouTube link."},
    {k:"_draft",type:"html",html:()=>SAMPLE?'<button class="btn" type="button" id="ep-draft">Write the LinkedIn Post from Brian\'s Description</button> <span class="hint" id="ep-draft-msg"></span>':'<span class="hint">Claude can write this post from Brian\'s description when the page is open on claude.ai.</span>'},
    {sec:"Results"},
    {k:"views",label:"YouTube Views",type:"number"},{k:"watchHours",label:"Watch Time (Hours)",type:"number"},{k:"likes",label:"YouTube Likes",type:"number"},
    ...(MU_PAUSED.spotify?[]:[{k:"spotifyPlays",label:"Spotify Plays",type:"number"}]),{k:"liImpressions",label:"LinkedIn Impressions",type:"number"},{k:"liClicks",label:"LinkedIn Clicks",type:"number"},{k:"liReactions",label:"LinkedIn Reactions",type:"number"},
    {sec:"Website and MISMO Matters"},
    {k:"websiteDone",label:"On the website's Mic'd Up list",type:"cb"},
    {k:"_ed",type:"html",html:()=>'<div class="ro">'+(ed?"Lands in the "+esc(monthName(ed.month))+" MISMO Matters (goes out "+esc(fS(ed.dates.publish))+")":"No MISMO Matters edition covers this date yet.")+'</div>'},
    {k:"notes",label:"Notes",type:"rich",rows:2}
  ];
  const nid = id || uid("ep");
  openPane({eye:"MISMO Mic'd Up", title: e.num?(epWord(e)+(e.title?": "+e.title:"")):"New Episode", fields, data:e,
    save:async v=>{ if(!v.linkedinDate && v.airDate) v.linkedinDate=add(v.airDate,3); await put("episodes",nid,Object.assign({},e,v)); },
    del: id ? async()=>remove("episodes",id) : null,
    after:b=>{ wireCx(b); wireGuestPane(b, id); const d=$("#ep-draft",b); if(d) d.onclick=()=>draftLinkedIn(b);
      const pa=$("#ep-paste",b); if(pa) pa.addEventListener("input",()=>{ const txt=pa.value; const urls=txt.match(/https?:\/\/[^\s<>"')\]]+/g)||[]; const drive=urls.find(u=>/drive\.google|docs\.google|sharepoint|onedrive|1drv/.test(u))||urls[0];
        const msg=$("#ep-paste-msg",b); let said=[];
        if(drive){ $("#f-fileUrl",b).value=drive; $("#f-fileIn",b).checked=true; said.push("file link"); }
        const rest=txt.replace(/https?:\/\/[^\s<>"')\]]+/g,"").replace(/[ \t]+\n/g,"\n").trim();
        const desc=$("#f-bvDescription",b); if(rest.length>40 && !desc.value.trim()){ desc.value=rest; said.push("description"); }
        const m=txt.match(/ep(?:isode)?\.?\s*#?\s*(\d{1,3})/i); if(m && !$("#f-num",b).value) $("#f-num",b).value=m[1];
        msg.textContent = said.length ? "Pulled in the "+said.join(" and ")+". Check them, then Save." : "No link found in that text."; if(PANE) PANE.dirty=true; }); }
  });
}
async function draftLinkedIn(b){
  const msg=$("#ep-draft-msg",b), desc=$("#f-bvDescription",b).value.trim(), title=$("#f-title",b).value.trim(), num=$("#f-num",b).value, guests=$("#f-guests",b).value, co=$("#f-company",b).value, url=$("#f-youtubeUrl",b).value.trim();
  if(!desc){ msg.textContent="Paste Brian's description first."; return; }
  msg.textContent="Writing…";
  try{
    const r = await SAMPLE("Write a LinkedIn post for MISMO's company page (MISMO is the Mortgage Industry Standards Maintenance Organization) announcing a new episode of the weekly podcast MISMO Mic'd Up. "+
      "Base it on the host's description below, but write in MISMO's institutional voice, not first person as Brian. 90 to 150 words. One short hook line, two or three sentences on what listeners learn, tag-style mentions written plainly (no @), then a line driving people to watch on YouTube with the link. Add 3 to 5 relevant hashtags including #MISMOMicdUp. American spelling. Plain text only, no markdown.\n\n"+
      "Episode "+num+": "+title+"\nGuests: "+guests+(co?", "+co:"")+"\nYouTube link: "+(url||"[YouTube link]")+"\n\nBrian's description:\n"+desc, {modelTier:"default", onText:({text})=>{ $("#f-linkedinCopy",b).value=text; }});
    $("#f-linkedinCopy",b).value = r.text.trim(); if(PANE) PANE.dirty=true; msg.textContent="Drafted. Read it over, then Save.";
  }catch(e){ msg.textContent = e.code==="not_granted" ? "Claude drafting isn't allowed on this page." : "Couldn't draft: "+(e.message||e.code); }
}

/* ================= generic items (LinkedIn, YouTube, Mailchimp, Summit, Setup) ================= */
function pieceFields(ch){
  const base=[{sec:"The Item"},
    {k:"title",label:ch==="mailchimp"?"Campaign / Subject Line":ch==="setup"?"What Needs Doing":"Title",wide:true},
    {k:"date",label:ch==="linkedin"?"Post Date":ch==="mailchimp"?"Send On":"Date",type:"date"},
    {k:"owner",label:"Owner",type:"select",opts:PEOPLE,blank:true},
    {k:"status",label:"Status",type:"select",opts:Object.entries(PSTAT).map(([v,[l]])=>[v,l])},
    {k:"channel",label:"Channel",type:"select",opts:Object.entries(CH).filter(([k])=>!["matters","micdup","news","orders"].includes(k))}];
  if(ch==="linkedin") base.push({k:"postTime",label:"Post Time",ph:"e.g. 9:00 AM"},{k:"autoPost",label:"Stage it: post on the MISMO page automatically at this date and time (link posts)",type:"cb",wide:true});
  if(ch==="linkedin") base.push({k:"kind",label:"Kind of Post",type:"select",opts:["Mic'd Up","In the News","Summit","Member Highlight","Sponsor Highlight","Certification","Press Release","Workgroup","MISMO Matters","Other"]});
  if(ch==="summit") base.push({k:"summit",label:"Summit",type:"select",opts:SUMMITS.map(s=>[s.id,s.name])},{k:"phase",label:"When",type:"select",opts:[["before","Before the Summit"],["at","At the Summit"],["after","After the Summit"]]},{k:"via",label:"Where It Goes",type:"select",opts:SUMMIT_VIA});
  if(ch==="mailchimp") base.push({k:"sendTime",label:"Send Time",ph:"e.g. 10:00 AM ET"},{k:"audience",label:"Audience",ph:"e.g. Compliance list, Tech list"});
  if(ch==="youtube") base.push({k:"kind",label:"Kind of Video",type:"select",opts:["FRAME","MISMO Initiatives Series","Webinar Recording","Summit","Special Content","Other"]});
  if(ch!=="setup") base.push({sec:"Copy and Links"},{k:"copy",label:ch==="mailchimp"?"Email Copy":"Copy",type:(ch==="linkedin"||ch==="youtube")?"textarea":"rich",rows:7},(ch==="mailchimp"?{k:"reviewLink",label:"Review Link",type:"url",ph:"Paste the Mailchimp preview or share link",hint:"Where the reviewer can open the campaign and look it over before it sends. It shows as a Review button on the Mailchimp page."}:{k:"link",label:"Link It Points To",type:"url"}),{k:"postedUrl",label:ch==="linkedin"?"Link to the Live Post":ch==="mailchimp"?"Link to the Sent Campaign":"Link Once Live",type:"url"},{k:"imageNote",label:"Image",ph:"Where the image is, or reuse from a MISMO Matters section"});
  if(ch==="linkedin") base.push({sec:"Results"},{k:"impressions",label:"Impressions",type:"number"},{k:"clicks",label:"Clicks",type:"number"},{k:"reactions",label:"Reactions",type:"number"},{k:"comments",label:"Comments",type:"number"},{k:"reposts",label:"Reposts",type:"number"});
  if(ch==="youtube") base.push({sec:"Results"},{k:"views",label:"Views",type:"number"},{k:"watchHours",label:"Watch Time (Hours)",type:"number"});
  if(ch==="community") base.push({sec:"Results"},{k:"views",label:"Views",type:"number"},{k:"replies",label:"Replies",type:"number"});
  if(ch==="mailchimp") base.push({sec:"Results"},{k:"sent",label:"Sent To",type:"number"},{k:"opens",label:"Unique Opens",type:"number"},{k:"clicks",label:"Unique Clicks",type:"number"},{k:"unsubs",label:"Unsubscribes",type:"number"});
  base.push({sec:"Also Use It In"},{k:"touch",label:"Other places this goes",type:"checks",opts:[["matters","MISMO Matters"],["linkedin","LinkedIn"],["youtube","YouTube"],["mailchimp","Mailchimp"],["website","Website"]]});
  base.push({k:"notes",label:"Notes",type:"rich",rows:3});
  return base;
}
function newPiece(ch, seed){ openPiece(null, Object.assign({channel:ch, status:ch==="setup"?"draft":"idea", date:T()}, seed||{})); }
function openPiece(id, seed){
  const p = id ? Object.assign({}, S.pieces[id]) : Object.assign({}, seed);
  const ch = p.channel||"other"; const nid=id||uid("p");
  const cxWhat = ch==="linkedin"?"This Post":ch==="mailchimp"?"This Campaign":"This Item";
  const fields = id ? [{k:"_cx",type:"html",html:()=>cxBox("piece",id,cxWhat)}].concat(pieceFields(ch)) : pieceFields(ch);
  openPane({eye:CH[ch]||"Item", title:p.title||(id?"Untitled":"New "+(CH[ch]&&ch!=="setup"?CH[ch]+" Item":"Setup Item")), fields, data:p, after:b=>wireCx(b),
    save:async v=>{ if(ch==="linkedin"){ if(v.status==="canceled") v.autoPost=false; else if(v.autoPost && v.status!=="done") v.status="staged"; else if(!v.autoPost && v.status==="staged") v.status="ready"; } await put("pieces",nid,Object.assign({},p,v)); },
    del: id ? async()=>remove("pieces",id) : null });
}
function pieceRows(list, cols){
  return list.map(p=>'<tr class="click'+(pClosed(p)?" past":"")+(p.status==="canceled"?" cxrow":"")+'" data-pc="'+esc(p.id||"")+'"'+(p._ep?' data-epi="'+esc(p._ep)+'"':'')+(p._sec?' data-sec="'+esc(p._sec)+'"':'')+'><td><b>'+esc(fD(p.date))+'</b>'+(p.date&&pOpen(p)&&p.date<T()?'<span class="t2" style="color:var(--bad)">past due</span>':'')+'</td><td>'+esc(p.title||"Untitled")+(cols.includes("review")&&p.reviewLink?' <a class="revlink" href="'+esc(p.reviewLink)+'" target="_blank" rel="noopener" data-stop="1">Review ↗</a>':'')+(p.status==="canceled"&&p.cancelReason?'<span class="t2 cxwhy">Canceled: '+esc(p.cancelReason.slice(0,120))+'</span>':p.notes?'<span class="t2">'+esc(mdPlain(p.notes).slice(0,90))+'</span>':'')+'</td>'+
    (cols.includes("kind")?'<td>'+esc(p.kind||p.via||"")+'</td>':'')+(cols.includes("aud")?'<td>'+esc(p.audience||"")+'</td>':'')+
    '<td>'+esc(p.owner||"")+'</td><td>'+chip(PSTAT,p.status||"idea")+'</td>'+
    (cols.includes("stats")?'<td class="n">'+(p.sent?pct((+p.opens||0)/p.sent):"—")+'</td><td class="n">'+(p.sent?pct((+p.clicks||0)/p.sent):"—")+'</td>':'')+'</tr>').join("");
}
function wirePieceRows(el){
  $$("a[data-stop]",el).forEach(a=>a.addEventListener("click",e=>e.stopPropagation()));
  $$("tr[data-pc]",el).forEach(r=>r.onclick=()=>{ if(r.dataset.epi) openEpisode(r.dataset.epi); else if(r.dataset.sec){ const [m,k]=r.dataset.sec.split("__"); openSection(S.editions[m],k); } else openPiece(r.dataset.pc); });
}

/* ================= LinkedIn ================= */
function renderLinkedin(){
  const el=$("#page-linkedin"), t=T(), wk=add(t,6);
  const own=vals("pieces").filter(p=>p.channel==="linkedin");
  const fromEp=vals("episodes").filter(e=>liDate(e) && (owes(e)||e.linkedinDone)).map(e=>({id:"", _ep:e.id, date:liDate(e), title:"Mic'd Up "+epWord(e)+(e.title?": "+e.title:""), kind:"Mic'd Up", owner:"Vanessa", cancelReason:e.liCancelReason||"", status:e.linkedinDone?"done":e.liCanceled?"canceled":(e.linkedinAuto&&e.linkedinCopy?"staged":(e.linkedinCopy?"ready":(e.bvDescription?"draft":"idea"))), notes:e.linkedinCopy?"":"Written from Brian's description"}));
  const fromSum=vals("pieces").filter(p=>p.channel==="summit" && p.via==="LinkedIn");
  const all=own.concat(fromEp).concat(fromSum);
  const upcoming=all.filter(p=>pOpen(p) && p.date && p.date<=add(t,45)).sort((a,b)=>a.date<b.date?-1:1);
  const posted=all.filter(p=>pClosed(p)).sort((a,b)=>a.date<b.date?1:-1).slice(0,15);
  const thisWeek=all.filter(p=>pOpen(p)&&p.date>=t&&p.date<=wk).length;
  const noCopy=all.filter(p=>p.status==="idea").length;
  const postedMonth=all.filter(p=>p.status==="done"&&p.date&&p.date.slice(0,7)===t.slice(0,7)).length;
  const ed=curEdition(); const reuse = ed ? edSections(ed).filter(s=>s.on && s.doc.reuse && s.doc.reuse.linkedin) : [];
  const newsTodo = newsAll().filter(n=>!n.linkedinDone && n.date>=add(t,-30)).sort((a,b)=>a.date<b.date?1:-1);
  el.innerHTML='<div class="phead"><div><div class="eyebrow">MISMO Company Page</div><h1>LinkedIn</h1><div class="sub">Monday Mic\'d Up posts, MISMO in the News, summit pushes and anything reused from MISMO Matters.</div></div><div class="tools"><button class="btn pri" type="button" id="li-new">+ New Post</button></div></div>'+mnCard("li")+
    '<div class="band">'+linkedinHero(all)+'<div class="say">'+(thisWeek?'<em>'+thisWeek+' post'+(thisWeek>1?"s":"")+'</em> going up this week. ':'Nothing is set for this week yet. ')+(newsTodo.length?newsTodo.length+' news mention'+(newsTodo.length>1?"s haven't":" hasn't")+' been shared yet.':'')+'</div><div class="tiles">'+
      '<div class="tile"><div class="v sky">'+thisWeek+'</div><div class="k">Posting This Week</div><div class="s">through '+esc(fS(wk))+'</div></div>'+
      '<div class="tile"><div class="v">'+upcoming.length+'</div><div class="k">Coming Up</div><div class="s">next six weeks</div></div>'+
      '<div class="tile"><div class="v'+(noCopy?" hot":"")+'">'+noCopy+'</div><div class="k">Waiting on Copy</div><div class="s">still at the idea stage</div></div>'+
      '<div class="tile"><div class="v">'+postedMonth+'</div><div class="k">Posted This Month</div><div class="s">'+esc(MONL[today().getMonth()])+'</div></div>'+
    '</div></div>'+
    '<div class="card"><div class="ch"><h2>Coming Up</h2><span class="cnt">'+upcoming.length+'</span></div>'+(upcoming.length?'<div class="tw"><table class="t"><thead><tr><th>Date</th><th>Post</th><th>Kind</th><th>Owner</th><th>Status</th></tr></thead><tbody>'+pieceRows(upcoming,["kind"])+'</tbody></table></div>':'<div class="empty">Nothing scheduled. Mic\'d Up posts appear here by themselves once an episode is added.</div>')+'</div>'+
    '<div class="grid2" style="margin-top:22px"><div class="card"><div class="ch"><h2>Ready to Reuse from MISMO Matters</h2><span class="cnt">'+reuse.length+'</span></div>'+(reuse.length?'<div class="checks">'+reuse.map(s=>'<div class="chk"><span class="ct"><b>'+esc(s.doc.headline||s.meta.name)+'</b><small>'+esc(s.meta.name)+' · '+esc(monthName(ed.month))+'</small></span><button class="btn sm" type="button" data-mk="'+esc(s.id)+'">Make a Post</button></div>').join("")+'</div>':'<div class="empty">Tick <b>LinkedIn</b> under "Also Use It In" on a MISMO Matters section and it lands here.</div>')+'</div>'+
    '<div class="card"><div class="ch"><h2>News to Share</h2><span class="cnt">'+newsTodo.length+'</span></div>'+(newsTodo.length?'<div class="checks">'+newsTodo.map(n=>'<div class="chk"><span class="ct"><b>'+esc(n.headline||"")+'</b><small>'+esc((n.outlet||"")+" · "+fS(n.date))+'</small></span><button class="btn sm" type="button" data-nw="'+esc(n.id)+'">Make a Post</button></div>').join("")+'</div>':'<div class="empty">Articles added on the In the News page that haven\'t been shared show up here.</div>')+'</div></div>'+
    '<div class="card" style="margin-top:22px"><div class="ch"><h2>'+(posted.some(p=>p.status==="canceled")?"Posted and Canceled":"Posted")+'</h2><span class="cnt">'+posted.length+'</span></div>'+(posted.length?'<div class="tw"><table class="t"><thead><tr><th>Date</th><th>Post</th><th>Kind</th><th>Owner</th><th>Status</th></tr></thead><tbody>'+pieceRows(posted,["kind"])+'</tbody></table></div>':'<div class="empty">Nothing marked posted yet.</div>')+'</div>';
  $("#li-new",el).onclick=()=>newPiece("linkedin");
  mnWire(el,"li"); if(LOADED.has("monthly") || !LIVE) setTimeout(()=>{ if(TAB==="linkedin") mnPopup("linkedin"); },400);
  wireLinkedinHero(el);
  wirePieceRows(el);
  $$("[data-mk]",el).forEach(b=>b.onclick=()=>{ const sd=S.sections[b.dataset.mk]||{}; newPiece("linkedin",{title:sd.headline||"", copy:sd.body?mdPlain(sd.body).slice(0,600):"", kind:(SEC[sd.key]||{}).name||"MISMO Matters", imageNote:sd.imageNote||"", date:add(T(),1), touch:{matters:true}}); });
  $$("[data-nw]",el).forEach(b=>b.onclick=()=>{ const n=newsGet(b.dataset.nw); newPiece("linkedin",{title:(n.outlet?n.outlet+": ":"")+(n.headline||""), link:n.url||"", kind:"In the News", date:add(T(),1), touch:{matters:true}, notes:"news:"+n.id}); });
}

/* ================= YouTube ================= */
function renderYoutube(){
  const el=$("#page-youtube"), t=T();
  const queue=vals("episodes").filter(e=>owes(e) && !e.youtubeDone && e.airDate && e.airDate<=add(t,7)).sort((a,b)=>a.airDate<b.airDate?-1:1);
  const caps=vals("episodes").filter(e=>owes(e) && e.youtubeDone && !e.captions);
  const vids=vals("pieces").filter(p=>p.channel==="youtube").sort((a,b)=>(a.date||"")<(b.date||"")?1:-1);
  const onYT=vals("episodes").filter(e=>e.youtubeDone).length;
  el.innerHTML='<div class="phead"><div><div class="eyebrow">@MISMOStandards</div><h1>YouTube</h1><div class="sub">Mic\'d Up goes up Friday afternoon with Brian\'s description. FRAME videos, the initiatives series and recordings live here too.</div></div><div class="tools"><a class="btn" href="https://www.youtube.com/@MISMOStandards/videos" target="_blank" rel="noopener">Open the Channel →</a><button class="btn pri" type="button" id="yt-new">+ Other Video</button></div></div>'+
    '<div class="band">'+youtubeHero(queue)+'<div class="say">'+(queue.length?'<em>'+queue.length+' upload'+(queue.length>1?"s":"")+'</em> in the queue, next on '+esc(fD(queue[0].airDate))+'. ':'Nothing waiting to upload. ')+(caps.length?caps.length+' episode'+(caps.length>1?"s are":" is")+' up without proofed captions.':'')+'</div><div class="tiles">'+
      '<div class="tile"><div class="v'+(queue.filter(e=>e.airDate<=t).length?" hot":" sky")+'">'+queue.length+'</div><div class="k">Upload Queue</div><div class="s">aired or airing this week</div></div>'+
      '<div class="tile"><div class="v'+(caps.length?" hot":"")+'">'+caps.length+'</div><div class="k">Captions to Fix</div><div class="s">on YouTube without proofed captions</div></div>'+
      '<div class="tile"><div class="v">'+onYT+'</div><div class="k">Mic\'d Up on YouTube</div><div class="s">logged here</div></div>'+
      '<div class="tile"><div class="v">'+vids.length+'</div><div class="k">Other Videos</div><div class="s">FRAME, series, recordings</div></div>'+
    '</div></div>'+
    '<div class="grid2"><div class="card"><div class="ch"><h2>Upload Queue</h2><span class="cnt">'+queue.length+'</span></div>'+(queue.length?'<div class="tw"><table class="t"><thead><tr><th>Friday</th><th>Episode</th><th class="ck">Description</th><th class="ck">Captions</th></tr></thead><tbody>'+queue.map(e=>'<tr class="click" data-ep="'+esc(e.id)+'"><td><b>'+esc(fD(e.airDate))+'</b></td><td>Ep '+esc(e.num||"?")+' '+esc(e.title||"")+'</td><td class="ck">'+tk(!!e.bvDescription, e.airDate<=t, "Brian's description")+'</td><td class="ck">'+tk(e.captions, e.airDate<=t, "Captions")+'</td></tr>').join("")+'</tbody></table></div>':'<div class="empty">Nothing to upload.</div>')+'</div>'+
    '<div class="card"><div class="ch"><h2>Every Upload</h2></div><div class="checks">'+
      [["Title","MISMO Mic'd Up Episode NN: Title with Guest, Company"],["Description","Brian's description, as he wrote it"],["Captions","Upload the caption file and proof every name. MISMO spelled right. Never burned into the video."],["Playlist","Add to the Mic'd Up playlist"],["Website","Add to the Mic'd Up list on the website home page"],["MISMO Matters","Lists itself in the next edition once marked on YouTube"]].map(([a,b])=>'<div class="chk"><span class="ct"><b>'+esc(a)+'</b><small>'+esc(b)+'</small></span></div>').join("")+
    '</div></div></div>'+
    '<div class="card" style="margin-top:22px"><div class="ch"><h2>Other Videos</h2><span class="cnt">'+vids.length+'</span></div>'+(vids.length?'<div class="tw"><table class="t"><thead><tr><th>Date</th><th>Video</th><th>Kind</th><th>Owner</th><th>Status</th></tr></thead><tbody>'+pieceRows(vids,["kind"])+'</tbody></table></div>':'<div class="empty">FRAME videos, the 18 MISMO Initiatives series and webinar recordings can be logged here.</div>')+'</div>';
  $("#yt-new",el).onclick=()=>newPiece("youtube");
  wireYoutubeHero(el);
  $$("[data-ep]",el).forEach(r=>r.onclick=()=>openEpisode(r.dataset.ep));
  wirePieceRows(el);
}

/* ================= Mailchimp ================= */
function renderMailchimp(){
  const el=$("#page-mailchimp"), t=T();
  const list=vals("pieces").filter(p=>p.channel==="mailchimp").sort((a,b)=>(a.date||"")<(b.date||"")?1:-1);
  const up=list.filter(pOpen), done=list.filter(p=>p.status==="done"), cxd=list.filter(p=>p.status==="canceled");
  const month=list.filter(p=>p.date&&p.date.slice(0,7)===t.slice(0,7)).length;
  const sent=done.filter(p=>+p.sent); const avgOpen = sent.length ? sent.reduce((n,p)=>n+(+p.opens||0)/(+p.sent),0)/sent.length : 0;
  el.innerHTML='<div class="phead"><div><div class="eyebrow">Marketing Email</div><h1>Mailchimp</h1><div class="sub">Campaign sends while marketing email moves into Higher Logic. Unsubscribes from here go into the one unsubscribe list.</div></div><div class="tools"><button class="btn pri" type="button" id="mc-new">+ New Campaign</button></div></div>'+
    '<div class="band">'+mailchimpHero(list)+'<div class="say">'+(up.length?'<em>'+up.length+' campaign'+(up.length>1?"s":"")+'</em> in the works. ':'No campaigns in the works. ')+'Before any send, pull the latest unsubscribes so the unified list stays whole.</div><div class="tiles">'+
      '<div class="tile"><div class="v sky">'+up.length+'</div><div class="k">In the Works</div><div class="s">not sent yet</div></div>'+
      '<div class="tile"><div class="v">'+month+'</div><div class="k">This Month</div><div class="s">'+esc(MONL[today().getMonth()])+'</div></div>'+
      '<div class="tile"><div class="v">'+done.length+'</div><div class="k">Sent</div><div class="s">logged here</div></div>'+
      '<div class="tile"><div class="v">'+(sent.length?pct(avgOpen):"—")+'</div><div class="k">Average Open Rate</div><div class="s">across sends with results</div></div>'+
    '</div></div>'+
    '<div class="card"><div class="ch"><h2>Campaigns</h2><span class="cnt">'+list.length+'</span></div>'+(list.length?'<div class="tw"><table class="t"><thead><tr><th>Send On</th><th>Campaign</th><th>Audience</th><th>Owner</th><th>Status</th><th class="n">Opens</th><th class="n">Clicks</th></tr></thead><tbody>'+pieceRows(up.concat(done,cxd),["aud","stats","review"])+'</tbody></table></div>':'<div class="empty">No campaigns logged. Mailchimp audiences built so far include the compliance list and the tech list.</div>')+'</div>';
  $("#mc-new",el).onclick=()=>newPiece("mailchimp");
  wireMailchimpHero(el);
  wirePieceRows(el);
}

/* ================= Summits ================= */
const SM={id:null};
function renderSummits(){
  const el=$("#page-summits"), t=T();
  if(!SM.id){ SM.id=(SUMMITS.find(s=>s.end>=t)||SUMMITS[0]).id; }
  const s=SUMMITS.find(x=>x.id===SM.id);
  const tasks=vals("pieces").filter(p=>p.channel==="summit"&&p.summit===s.id).sort((a,b)=>(a.date||"")<(b.date||"")?-1:1);
  const done=tasks.filter(p=>p.status==="done").length, due14=tasks.filter(p=>pOpen(p)&&p.date>=t&&p.date<=add(t,14)).length, over=tasks.filter(p=>pOpen(p)&&p.date&&p.date<t).length;
  const col=(ph,label,sub)=>{ const l=tasks.filter(p=>(p.phase||"before")===ph); return '<div class="card"><div class="ch"><h2>'+label+'</h2><span class="cnt">'+l.filter(pOpen).length+' open</span></div>'+(l.length?'<div class="checks">'+l.map(p=>'<div class="chk'+(p.status==="done"?" done":"")+'"><input type="checkbox" data-done="'+esc(p.id)+'"'+(p.status==="done"?" checked":"")+' aria-label="Done"><button type="button" class="lnk ct" data-open="'+esc(p.id)+'"><b>'+esc(p.title)+'</b><small>'+esc(p.via||"")+(p.owner?" · "+esc(p.owner):"")+'</small></button><div class="meta'+(p.status!=="done"&&p.date&&p.date<t?" late":"")+'">'+esc(fS(p.date))+'</div></div>').join("")+'</div>':'<div class="empty">'+esc(sub)+'</div>')+'</div>'; };
  el.innerHTML='<div class="phead"><div><div class="eyebrow">Summit Marketing</div><h1>'+esc(s.name)+'</h1><div class="sub">'+esc(s.where)+' · '+esc(fS(s.start))+'–'+esc(fS(s.end))+', '+esc(s.start.slice(0,4))+'</div></div><div class="tools"><div class="field"><label for="sm-pick">Summit</label><select id="sm-pick">'+SUMMITS.map(x=>'<option value="'+x.id+'"'+(x.id===s.id?" selected":"")+'>'+esc(x.name)+'</option>').join("")+'</select></div>'+
    (tasks.length?'':'<button class="btn" type="button" id="sm-plan">Load the Standard Summit Plan</button>')+'<button class="btn pri" type="button" id="sm-new">+ New Task</button></div></div>'+
    '<div class="band">'+summitHero(s,tasks)+'<div class="say">'+(diff(s.start,t)>0?'<em>'+diff(s.start,t)+' days</em> to the summit. ':'')+(tasks.length?(over?'<span class="hot">'+over+' marketing task'+(over>1?"s are":" is")+' past due.</span> ':'')+due14+' due in the next two weeks.':'No marketing plan yet. Load the standard plan to lay out the posts and emails before, during and after.')+'</div><div class="tiles">'+
      '<div class="tile"><div class="v">'+tasks.length+'</div><div class="k">Marketing Tasks</div><div class="s">before, at and after</div></div>'+
      '<div class="tile"><div class="v">'+(tasks.length?Math.round(done/tasks.length*100):0)+'%</div><div class="k">Done</div><div class="s">'+done+' of '+tasks.length+'</div></div>'+
      '<div class="tile"><div class="v">'+due14+'</div><div class="k">Due Next 14 Days</div><div class="s">open tasks</div></div>'+
      '<div class="tile"><div class="v'+(over?" hot":"")+'">'+over+'</div><div class="k">Past Due</div><div class="s">not marked done</div></div>'+
    '</div></div>'+
    '<div class="phase">'+col("before","Before the Summit","Announcements, registration, early-bird, agenda, countdown.")+col("at","At the Summit","Live posts, photos, Newcomer Orientation, award winners.")+col("after","After the Summit","Thank-you and survey, recap, recordings, the MISMO Matters recap.")+'</div>'+
    summitOrdersCard(s)+
    '<p class="foot">Planning, the agenda and the Run of Show stay in Summit HQ. This page is only the marketing: what gets posted and sent, and when.</p>';
  $("#sm-pick",el).onchange=e=>{ SM.id=e.target.value; renderSummits(); };
  wireSummitOrders(el,s);
  wireSummitHero(el,s);
  $("#sm-new",el).onclick=()=>newPiece("summit",{summit:s.id, phase:"before", via:"LinkedIn", date:T()});
  const pl=$("#sm-plan",el); if(pl) pl.onclick=async()=>{ let n=0, skipped=0; for(const [off,ph,via,title] of SUMMIT_PLAN){ const date=add(s.start,off); if(date<T()){ skipped++; continue; } await put("pieces",uid("p"),{channel:"summit",summit:s.id,phase:ph,via,title,date,status:"idea",owner:via==="Onsite"?"Amy":"Kelly"}); n++; } toast(n+" tasks added"+(skipped?" · "+skipped+" already past were skipped":""),4000); };
  wireChecks(el);
}

/* ================= In the News ================= */
/* In the News, a month at a time (Nov 7, 2026): this month and last month stay open; once a month is over and its
   newsletter has gone out, it folds into the Archive (still there, one click away). Stories come from three places:
   the team, Brittney's emails, and the daily web search. */
const NW = {open:{}};
function renderNews(){
  const el=$("#page-news"), t=T(), thisMo=t.slice(0,7);
  const list=newsAll().sort((a,b)=>(a.date||"")<(b.date||"")?1:-1);
  const ed=curEdition(); const forEd = ed? newsInWindow(ed) : [];
  const month=list.filter(n=>n.date&&n.date.slice(0,7)===thisMo).length;
  const unshared=list.filter(n=>!n.linkedinDone && n.kind!=="press").length;
  const toCheck=list.filter(n=>n.auto && n.viaWeb).length;
  const run=newsWebRun();
  /* a month stays open until its edition has been sent (the edition sent the next month carries it) */
  const sentThrough = editionsSorted().filter(e=>e.archived || (e.done&&e.done.publish)).map(e=>e.dates&&e.dates.publish).filter(Boolean).sort().slice(-1)[0]||"";
  const isArch = mo => mo < thisMo && ((mo+"-31") <= sentThrough || mo < add(t,-62).slice(0,7));
  const byMo={}; list.forEach(n=>{ const mo=(n.date||"").slice(0,7)||"undated"; (byMo[mo]=byMo[mo]||[]).push(n); });
  const months=Object.keys(byMo).sort().reverse(), live=months.filter(m=>m==="undated"||!isArch(m)), arch=months.filter(m=>m!=="undated"&&isArch(m));
  const moName=mo=>mo==="undated"?"No Date":monthName(mo);
  const row=n=>{ const e=newsEdition(n); return '<tr class="click" data-nw="'+esc(n.id)+'"><td><b>'+esc(fS(n.date))+'</b></td><td>'+esc(n.headline||"")+(n.auto?' <span class="chip review" title="'+(n.viaWeb?"Found by the daily web search ("+esc(n.found||"news search")+"). Check it; press Remove in its panel if it isn’t about MISMO.":"Came in by email. Check it, then untick the box.")+'">'+(n.viaWeb?"Found on the Web":"Found Automatically")+'</span>':'')+'</td><td>'+esc(n.outlet||"")+'</td><td>'+(n.kind==="press"?'<span class="chip in">Press Release</span>':'<span class="chip">In the News</span>')+'</td><td>'+(n.linkedinDone?'<span class="chip done">Shared</span>':(n.kind==="press"?'':'<span class="chip waiting">Not Yet</span>'))+'</td><td>'+(e?esc(monthName(e.month)):'<span class="t2">no edition</span>')+'</td></tr>'; };
  const table=items=>'<div class="tw"><table class="t"><thead><tr><th>Date</th><th>Headline</th><th>Outlet</th><th>Kind</th><th>LinkedIn</th><th>MISMO Matters</th></tr></thead><tbody>'+items.map(row).join("")+'</tbody></table></div>';
  el.innerHTML='<div class="phead"><div><div class="eyebrow">Source for MISMO Matters and LinkedIn</div><h1>In the News</h1><div class="sub">Press releases and articles that mention MISMO, a month at a time. Each one feeds the In the News section of that month’s MISMO Matters and the LinkedIn queue.</div></div><div class="tools"><button class="btn pri" type="button" id="nw-new">+ Add an Article</button></div></div>'+
    '<div class="band"><div class="today">In the News</div><div class="say">'+(ed?'<em>'+forEd.length+'</em> item'+(forEd.length===1?"":"s")+' headed to the '+esc(monthName(ed.month))+' MISMO Matters so far. ':'')+'MISMO Media searches Google News and Bing News for MISMO every morning'+(run&&run.at?' (last search '+esc(fS(localDay(run.at)))+')':'')+', and Brittney’s FYI emails come in by themselves. Check anything marked <b>Found on the Web</b>; Remove what isn’t about MISMO.</div><div class="tiles">'+
      '<div class="tile"><div class="v sky">'+forEd.length+'</div><div class="k">For the Next Edition</div><div class="s">'+(ed?esc(fS(add(prevPublish(ed),1)))+' to '+esc(fS(ed.dates.publish)):"")+'</div></div>'+
      '<div class="tile"><div class="v">'+month+'</div><div class="k">This Month</div><div class="s">'+esc(MONL[today().getMonth()])+'</div></div>'+
      '<div class="tile"><div class="v'+(toCheck?" hot":"")+'">'+toCheck+'</div><div class="k">Found on the Web</div><div class="s">waiting for a look</div></div>'+
      '<div class="tile"><div class="v'+(unshared?" hot":"")+'">'+unshared+'</div><div class="k">Not on LinkedIn</div><div class="s">mentions not shared yet</div></div>'+
    '</div></div>'+
    (list.length? live.map(mo=>'<div class="card nw-mo"><div class="ch"><h2>'+esc(moName(mo))+'</h2><span class="cnt">'+byMo[mo].length+'</span>'+(mo===thisMo?'<span class="note">this month</span>':'')+'</div>'+table(byMo[mo])+'</div>').join("")
      +(arch.length?'<div class="card nw-arch"><div class="ch"><h2>Archive</h2><span class="cnt">'+arch.reduce((a,m)=>a+byMo[m].length,0)+'</span><span class="note">past months, after their MISMO Matters went out</span></div><div class="cb">'+
        arch.map(mo=>'<details class="nw-old"'+(NW.open[mo]?' open':'')+' data-mo="'+esc(mo)+'"><summary><b>'+esc(moName(mo))+'</b> <span class="t2">'+byMo[mo].length+' item'+(byMo[mo].length===1?'':'s')+'</span></summary>'+table(byMo[mo])+'</details>').join("")+'</div></div>':'')
      :'<div class="card"><div class="empty"><b>Nothing yet.</b> The daily web search, Brittney’s emails and anything you add land here by month, and in that month’s MISMO Matters.</div></div>');
  $("#nw-new",el).onclick=()=>openNews(null);
  $$("[data-nw]",el).forEach(r=>r.onclick=()=>openNews(r.dataset.nw));
  $$("details.nw-old",el).forEach(d=>d.addEventListener("toggle",()=>{ NW.open[d.dataset.mo]=d.open; }));
}
function openNews(id){
  const src=id?newsGet(id):null, viaEmail=!!(id && !S.news[id] && (S.newsin[id] || S.newsweb[id]));
  const n=id?Object.assign({},src, viaEmail?{auto:true}:{}):{date:T(),kind:"mention"}; const nid=id||uid("n");
  const fromWeb = src && S.newsweb[id] ? '<div class="ro nw-mail"><b>Found by the daily web search ('+esc(src.found||"news search")+(src.foundAt?', '+esc(fS(localDay(src.foundAt))):'')+')</b><div>Open the link to check it\'s about MISMO. If it isn\'t, press Remove and it won\'t come back.</div></div>' : '';
  const fromMail = src && (src.summary||src.note||src.from) ? '<div class="ro nw-mail"><b>Came in by email'+(src.from?' from '+esc(src.from):'')+(src.at?' · '+esc(fS(String(src.at).slice(0,10))):'')+'</b>'+(src.note?'<div>'+esc(src.note)+'</div>':'')+(src.summary?'<div class="nw-sum">'+esc(src.summary)+'</div>':'')+'</div>' : '';
  openPane({eye:"In the News", title:n.headline||"New Article", data:n, fields:[
    {sec:"The Article"},{k:"_mail",type:"html",html:()=>fromMail+fromWeb},{k:"headline",label:"Headline",wide:true},{k:"outlet",label:"Outlet",ph:"e.g. HousingWire"},{k:"date",label:"Date",type:"date"},
    {k:"kind",label:"Kind",type:"select",opts:[["mention","MISMO in the News"],["press","MISMO Press Release"]]},{k:"url",label:"Link",type:"url",wide:true},
    {k:"edition",label:"Goes in MISMO Matters",type:"select",opts:[["","By date (automatic)"]].concat(editionsSorted().slice().reverse().map(e=>[e.id,monthName(e.month)+(e.archived?" (sent)":"")]))},
    {k:"auto",label:"Found automatically · needs a look",type:"cb"},{sec:"Shared"},{k:"linkedinDone",label:"Shared on the MISMO LinkedIn page",type:"cb"},{k:"linkedinUrl",label:"LinkedIn Post Link",type:"url"},{k:"notes",label:"Notes",type:"rich",rows:2}],
    save:async v=>{ await put("news",nid,Object.assign({},n,v)); },
    /* an emailed or web-found item can't be deleted at the source, so removing it hides it for good */
    del:id?async()=>{ if(S.newsin[id]||S.newsweb[id]) await put("news",id,Object.assign({},n,{hidden:true})); else await remove("news",id); }:null, delLabel:id&&(S.newsin[id]||S.newsweb[id])?"Remove":"Delete" });
}

/* ================= Lists & Unsubscribes ================= */
function renderLists(){
  const el=$("#page-lists");
  const lists=vals("lists").sort((a,b)=>(a.order||99)-(b.order||99));
  const have=lists.filter(l=>+l.unique), missing=lists.filter(l=>!+l.unique);
  const totalRows=have.reduce((n,l)=>n+(+l.rows||0),0);
  el.innerHTML='<div class="phead"><div><div class="eyebrow">Who MISMO Matters Goes To</div><h1>Lists &amp; Unsubscribes</h1><div class="sub">The compound lists behind the MISMO Matters group in Higher Logic, and the one unsubscribe list every send respects.</div></div><div class="tools"><button class="btn" type="button" id="ls-new">+ Add a List</button></div></div>'+
    '<div class="band"><div class="today">The Compound · last refreshed September 2026 · next refresh November</div><div class="say">Kelly expects <em>30,000+</em> recipients. The lists forwarded so far hold about <em>16,500</em> unique addresses once duplicates are removed, so the member contacts, the VIPs and the existing Axios audience still need to come in before the November send.</div><div class="tiles">'+
      '<div class="tile"><div class="v sky">30,000+</div><div class="k">Expected Audience</div><div class="s">what Axios sent to</div></div>'+
      '<div class="tile"><div class="v">16,499</div><div class="k">Unique in Hand</div><div class="s">across '+have.length+' lists, '+totalRows.toLocaleString()+' rows</div></div>'+
      '<div class="tile"><div class="v'+(missing.length?" hot":"")+'">'+missing.length+'</div><div class="k">Still Needed</div><div class="s">lists not received</div></div>'+
      '<div class="tile"><div class="v">Nov</div><div class="k">Next Refresh</div><div class="s">Ciara Durkan, MBA</div></div>'+
    '</div></div>'+
    '<div class="card"><div class="ch"><h2>The Compound</h2><span class="cnt">'+lists.length+'</span></div>'+(lists.length?'<div class="tw"><table class="t"><thead><tr><th>List</th><th>From</th><th class="n">Rows</th><th class="n">Unique Emails</th><th>Covers</th><th>Notes</th></tr></thead><tbody>'+
      lists.map(l=>'<tr class="click" data-ls="'+esc(l.id)+'"><td><b>'+esc(l.name)+'</b></td><td>'+esc(l.source||"")+'</td><td class="n">'+(+l.rows?(+l.rows).toLocaleString():"—")+'</td><td class="n">'+(+l.unique?(+l.unique).toLocaleString():'<span class="chip changes">Not received</span>')+'</td><td>'+esc(l.covers||"")+'</td><td class="note">'+esc(mdPlain(l.notes))+'</td></tr>').join("")+
      '</tbody></table></div>':'<div class="empty">'+(LIVE&&!LOADED.has("lists")?"Loading…":"No lists logged.")+'</div>')+'</div>'+
    '<div class="grid2" style="margin-top:22px"><div class="card"><div class="ch"><h2>The Unsubscribe Rule</h2></div><div class="checks">'+
      '<div class="chk"><span class="ct"><b>MISMO&rsquo;s own unsubscribe page</b><small>The Unsubscribe link in every MISMO Matters footer goes to <a href="'+UNSUB_URL+'" target="_blank" rel="noopener">resources.mismo.org/forms/unsubscribe/</a>. '+(()=>{ const n=vals("unsubs").length, p=vals("unsubs").filter(u=>unsubHL(u)==="pending").length; return n?n+' so far'+(p?', '+p+' still to opt out in Higher Logic (see Subscribers).':'.'):'None yet.'; })()+'</small></span></div>'+
      '<div class="chk"><span class="ct"><b>One list, every platform</b><small>Anyone who unsubscribed in Mailchimp, Axios or Higher Logic is left off every MISMO send. Agreed by Amy and Kelly.</small></span></div>'+
      '<div class="chk"><span class="ct"><b>MISMO stays separate from MBA</b><small>MISMO sends aren\'t blocked by MBA\'s Aptify unsubscribe, and a MISMO unsubscribe shouldn\'t touch MBA\'s. Jonna is confirming how Higher Logic\'s unsubscribe button behaves.</small></span></div>'+
      '<div class="chk"><span class="ct"><b>Opt-outs inside Higher Logic</b><small>Community message opt-outs (marketing vs. other) are already managed inside Higher Logic.</small></span></div>'+
    '</div></div>'+
    '<div class="card"><div class="ch"><h2>Feeds to Automate</h2></div><div class="checks">'+
      '<div class="chk"><span class="ct"><b>Website subscribers</b><small>The website\'s Subscribe button is a Smartsheet form today. Kelly has been pulling the list by hand.</small></span></div>'+
      '<div class="chk"><span class="ct"><b>Website downloaders</b><small>Standards downloaders since the last refresh (1,498 rows May–September).</small></span></div>'+
      '<div class="chk"><span class="ct"><b>Prospects</b><small>Come straight from Member 360 instead of a separate list from Kelly.</small></span></div>'+
      '<div class="chk"><span class="ct"><b>Segments from Aptify</b><small>e.g. three years of MBA compliance conference attendees, or anyone with "marketing" in their title, for targeted sends.</small></span></div>'+
    '</div></div></div>'+
    '<p class="foot">Counts come from the attachments on Kelly\'s two "MISMO compound lists" emails (Ciara Durkan\'s September 2–3 update and Kelly\'s September 8 subscriber and downloader lists). No names or addresses are kept on this page.</p>';
  $("#ls-new",el).onclick=()=>openList(null);
  $$("[data-ls]",el).forEach(r=>r.onclick=()=>openList(r.dataset.ls));
}
function openList(id){
  const l=id?Object.assign({},S.lists[id]):{}; const nid=id||uid("l");
  openPane({eye:"Lists", title:l.name||"New List", data:l, fields:[{k:"name",label:"List",wide:true},{k:"source",label:"From"},{k:"covers",label:"Covers"},{k:"rows",label:"Rows",type:"number"},{k:"unique",label:"Unique Emails",type:"number"},{k:"refreshed",label:"Refreshed",type:"date"},{k:"notes",label:"Notes",type:"rich",rows:3}],
    save:async v=>{ await put("lists",nid,Object.assign({},l,v)); }, del:id?async()=>remove("lists",id):null });
}

/* ================= rail (Summit HQ, verbatim except gather) ================= */
(function(){
  const KEY='hq.rail.off';
  function set(off, remember){
    document.body.classList.toggle('railmini', !!off);
    const h=document.getElementById('rail-hide');
    if(h){ h.setAttribute('aria-expanded', off?'false':'true'); h.setAttribute('aria-label', off?'Open the menu':'Narrow the menu'); h.title = (off?'Open the menu':'Narrow the menu')+' (backslash)'; }
    if(off) close();
    if(remember!==false){ try{ localStorage.setItem(KEY, off?'1':'0'); }catch(e){} }
    setTimeout(()=>{ window.dispatchEvent(new Event('resize')); }, 230);
  }
  function toggle(){ set(!document.body.classList.contains('railmini')); }
  function start(){
    let off=null;
    try{ const v=localStorage.getItem(KEY); if(v!==null) off=(v==='1'); }catch(e){}
    if(off===null) off = window.matchMedia('(max-width:900px)').matches;
    set(off, false);
    const h=document.getElementById('rail-hide'); if(h) h.addEventListener('click',toggle);
    const sc=document.getElementById('rail-scrim'); if(sc) sc.addEventListener('click',()=>set(true));
    const qb=document.getElementById('rail-qb');
    if(qb) qb.addEventListener('click',()=>{ set(false); setTimeout(()=>{ const q=document.getElementById('rail-q'); if(q) q.focus(); },230); });
    document.querySelectorAll('.hq nav button[data-hq]').forEach(b=>{
      b.addEventListener('click',()=>{ show(b.dataset.hq); if(window.matchMedia('(max-width:900px)').matches) set(true); });
    });
    wireFind();
  }
  document.addEventListener('keydown',e=>{
    const t=e.target; const typing = t && (t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='SELECT'||t.isContentEditable);
    if(e.key==='Escape' && PANE && (!typing || (t.closest && t.closest('#pane')))){ closePane(); return; }
    if(e.key==='\\' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey){ e.preventDefault(); toggle(); }
    if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); set(false); setTimeout(()=>{ const q=document.getElementById('rail-q'); if(q){ q.focus(); q.select(); } }, 230); }
  });
  const HITS=()=>document.getElementById('rail-hits');
  let picked=-1, rows=[];
  function norm(x){ return String(x||'').replace(/\s+/g,' ').trim().toLowerCase(); }
  function gather(q){
    const t=norm(q); if(t.length<2) return [];
    const out=[];
    const score=(name)=>{ const n=norm(name); return n===t ? 3 : n.indexOf(t)===0 ? 2 : n.indexOf(t)>=0 ? 1 : 0; };
    const push=(group,name,where,go_,hay)=>{ if(out.length<60) out.push({group,name,where,go:go_,s:Math.max(score(name), hay&&norm(hay).indexOf(t)>=0?1:0)}); };
    try{ editionsSorted().forEach(ed=>{ edSections(ed).forEach(s=>{ const nm=(s.doc.headline||s.doc.name||s.meta.name); const hay=[s.meta.name,s.doc.headline,s.doc.body,s.doc.quoteBy].join(" "); if(norm(hay).indexOf(t)<0) return; push('MISMO Matters', nm, s.meta.name+' · '+monthName(ed.month), ()=>{ go('matters'); MS.ed=ed.id; MS.sub="sections"; renderMatters(); if(!ed.archived) openSection(ed,s.k); }, hay); }); }); }catch(e){}
    try{ vals("episodes").forEach(e=>{ const hay=["Episode "+e.num,e.title,e.guests,e.company].join(" "); if(norm(hay).indexOf(t)<0) return; push("Mic'd Up", "Ep "+(e.num||"?")+": "+(e.title||""), [e.guests,e.company].filter(Boolean).join(", "), ()=>{ go('micdup'); openEpisode(e.id); }, hay); }); }catch(e){}
    try{ vals("pieces").forEach(p=>{ const hay=[p.title,p.copy,p.notes,p.kind].join(" "); if(norm(hay).indexOf(t)<0) return; push(CH[p.channel]||"Items", p.title||"Untitled", fS(p.date)+(p.owner?" · "+p.owner:""), ()=>{ const tab={linkedin:"linkedin",youtube:"youtube",mailchimp:"mailchimp",summit:"summits"}[p.channel]||"overview"; go(tab); openPiece(p.id); }, hay); }); }catch(e){}
    try{ HELP.forEach(h=>{ const hay=h.t+" "+h.b.replace(/<[^>]+>/g," "); if(norm(hay).indexOf(t)<0) return; push("Help", h.t, h.g, ()=>{ HL.id=h.id; go('help'); renderHelp(); }, hay); }); }catch(e){}
    try{ newsAll().forEach(n=>{ const hay=[n.headline,n.outlet].join(" "); if(norm(hay).indexOf(t)<0) return; push("In the News", n.headline||"", (n.outlet||"")+" · "+fS(n.date), ()=>{ go('news'); openNews(n.id); }, hay); }); }catch(e){}
    try{ vals("orders").filter(o=>!o.archived).forEach(o=>{ const hay=[o.name,o.kind,o.vendor,o.notes,orEventName(o)].join(" "); if(norm(hay).indexOf(t)<0) return; push("Orders", o.name||"Order", (OR_STAT[o.status||"toorder"]||[""])[0]+(orEventName(o)?" · "+orEventName(o):""), ()=>{ go('orders'); openOrder(o.id); }, hay); }); }catch(e){}
    try{ vals("branding").filter(b=>!b.archived).forEach(b=>{ const hay=[b.name,b.kind,b.where,b.notes].join(" "); if(norm(hay).indexOf(t)<0) return; push("Rebranding", b.name||"Item", (BR_STAT[b.status||"check"]||[""])[0]+(b.kind?" · "+b.kind:""), ()=>{ go('branding'); openBrand(b.id); }, hay); }); }catch(e){}
    try{ vals("images").filter(i=>!i.archived).forEach(im=>{ const hay=[im.name,im.file,im.alt,im.credit,im.notes].join(" "); if(norm(hay).indexOf(t)<0) return; push("Images", im.name||im.file||"Image", (IMG_CAMP[im.campaign]||"Image Library"), ()=>{ go('images'); openImage(im.id); }, hay); }); }catch(e){}
    const best={}; out.forEach(h=>{ best[h.group]=Math.max(best[h.group]||0, h.s); });
    const ORDER=['MISMO Matters',"Mic'd Up",'LinkedIn','YouTube','Mailchimp','Summits','In the News','Rebranding','Orders','Images','Setup','Help'];
    out.sort((a,b)=>(best[b.group]-best[a.group])||(ORDER.indexOf(a.group)-ORDER.indexOf(b.group))||(b.s-a.s)||String(a.name).localeCompare(String(b.name)));
    return out;
  }
  function draw(list){
    const box=HITS(); if(!box) return; box.textContent=''; rows=[]; picked=-1;
    if(!list.length){ const n=document.createElement('div'); n.className='rh-none'; n.textContent='Nothing matches.'; box.appendChild(n); box.hidden=false; return; }
    let g=null;
    list.slice(0,24).forEach(h=>{
      if(h.group!==g){ g=h.group; const hd=document.createElement('div'); hd.className='rh-g'; hd.textContent=g; box.appendChild(hd); }
      const b=document.createElement('button'); b.type='button'; b.className='rh';
      const nm=document.createElement('b'); nm.textContent=h.name; b.appendChild(nm);
      if(h.where){ const w=document.createElement('i'); w.textContent=h.where; b.appendChild(w); }
      b.addEventListener('click',()=>{ close(); h.go(); }); rows.push(b); box.appendChild(b);
    });
    box.hidden=false;
  }
  function close(){ const b=HITS(); if(b){ b.hidden=true; b.textContent=''; } rows=[]; picked=-1; }
  function mark(){ rows.forEach((r,i)=>r.classList.toggle('on', i===picked)); if(rows[picked]) try{ rows[picked].scrollIntoView({block:'nearest'}); }catch(e){} }
  function wireFind(){
    const q=document.getElementById('rail-q'), x=document.getElementById('rail-qx'); if(!q) return;
    let tmr=null;
    const run=()=>{ const v=q.value; if(x) x.hidden = !v; if(norm(v).length<2){ close(); return; } draw(gather(v)); };
    q.addEventListener('input',()=>{ clearTimeout(tmr); tmr=setTimeout(run,150); });
    q.addEventListener('focus',()=>{ if(norm(q.value).length>=2) run(); });
    q.addEventListener('keydown',e=>{
      if(e.key==='Escape'){ close(); q.blur(); return; }
      if(!rows.length) return;
      if(e.key==='ArrowDown'){ e.preventDefault(); picked=(picked+1)%rows.length; mark(); }
      else if(e.key==='ArrowUp'){ e.preventDefault(); picked=(picked-1+rows.length)%rows.length; mark(); }
      else if(e.key==='Enter'){ e.preventDefault(); (rows[picked]||rows[0]).click(); }
    });
    if(x) x.addEventListener('click',()=>{ q.value=''; x.hidden=true; close(); q.focus(); });
    document.addEventListener('click',e=>{ if(!e.target.closest('.railfind')) close(); });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
  window.__rail={ show:()=>set(false), hide:()=>set(true), toggle, mini:()=>document.body.classList.contains('railmini') };
})();

/* ================= theme toggle (shared key) ================= */
(function theme(){
  var btn = document.getElementById("theme-btn"); if(!btn) return;
  function cur(){ var t = document.documentElement.getAttribute("data-theme"); if(t) return t; return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"; }
  function paint(){ const dark = cur() === "dark"; const lab = document.getElementById("theme-lab"); if(lab) lab.textContent = dark ? "Light Mode" : "Dark Mode"; else btn.textContent = dark ? "Light Mode" : "Dark Mode"; btn.title = "Switch to " + (dark ? "light" : "dark") + " mode"; }
  btn.addEventListener("click", function(){ document.documentElement.setAttribute("data-theme", cur() === "dark" ? "light" : "dark"); paint(); try{ localStorage.setItem("mismo.portal.theme", cur()); }catch(e){} window.dispatchEvent(new Event("resize")); });
  try{ var saved = localStorage.getItem("mismo.portal.theme"); if(saved) document.documentElement.setAttribute("data-theme", saved); }catch(e){}
  paint();
})();
(function season(){ if(new Date().getMonth() === 11) document.documentElement.setAttribute("data-season","december"); })();

/* ================= start ================= */
$("#pane-x").onclick=()=>closePane();
window.addEventListener("hashchange",()=>{ const h=location.hash.slice(1); if(TABS.includes(h) && h!==TAB) show(h); });
(function(){
  /* MISMO Media always opens on Home, including a refresh or a reopened tab.
     Only a link that names a page (like Amy's email, #micdup) opens that page instead. Old #overview links open Home. */
  const h=location.hash.slice(1);
  try{ sessionStorage.removeItem("mm.tab"); }catch(e){}
  show(h && TABS.includes(h) && h!=="overview" ? h : "home");
})();
badges();
connect();
