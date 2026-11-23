
/* ================= Industry Events graphics from Team HQ (CN-004, approved by Jonna Nov 23, 2026) =================
   Team HQ's Industry Events page keeps the graphics each event gives us (logos, speaker cards, banners, social posts,
   booth art) on the event: collection events in Team HQ's own data, graphics:[{id (Team HQ file id), name, label,
   use, type, size, at, by}], files in Team HQ's file storage. MISMO Media reads them (read only, through the save
   relay with the signed-in person's own sign-in, the way it reads the Sponsorship Portal) and keeps a copy of each in
   SharePoint like its other pictures (Marketing HQ Images, the month's folder), listed in the Image Library under the
   campaign Industry Events with the event's name. MISMO Media never writes to Team HQ.
   - One picture record per graphic, with a fixed id (imte-…) so two tabs or two people never add it twice.
   - Pictures and brand files the library already takes (PDF, Illustrator, EPS, PowerPoint, ZIP) come in; anything
     else stays on the event in Team HQ.
   - If Team HQ renames the event or changes what a graphic is for, the library follows. A graphic removed from the
     event stays in the library (nothing is deleted); archive it there if it's no longer wanted.
   - Runs as the background job "Industry Events graphics": every 30 minutes, one tab per browser, only for
     someone who can edit MISMO Media. Someone who can't read Team HQ simply gets nothing. */
const TE = {at:0, last:0, err:"", denied:false, events:0, graphics:0, added:0, skipped:[], busy:false};
const TE_TYPES = {png:"image/png", jpg:"image/jpeg", jpeg:"image/jpeg", gif:"image/gif", webp:"image/webp", svg:"image/svg+xml", pdf:"application/pdf"};
function teHash(s){ let h=5381, k=0; s=String(s||""); for(let i=0;i<s.length;i++){ h=(h*33+s.charCodeAt(i))|0; k=(k*31+s.charCodeAt(i))|0; } return (Math.abs(h).toString(36)+Math.abs(k).toString(36)).slice(0,12); }
function teId(evId, gid){ const slug=String(evId||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,20)||"event"; return "imte-"+slug+"-"+teHash(evId+"|"+gid); }
function teEventName(ev){ return String((ev&&ev.name)||"Industry event").trim(); }
function teImages(){ return vals("images").filter(im=>im.campaign==="events" || im.source==="team-hq"); }
function teEvents(){ const m={}; teImages().filter(im=>im.eventId && !im.archived).forEach(im=>{ const e=m[im.eventId]||(m[im.eventId]={id:im.eventId, name:im.eventName||"Industry event", start:im.eventStart||"", n:0}); e.n++; });
  return Object.values(m).sort((a,b)=>String(b.start).localeCompare(String(a.start)) || a.name.localeCompare(b.name)); }
async function teamEventsSync(force){
  if(TE.busy || !window.__hqTeamEvents || !window.__hqTeamFile || !SP_IMG() || !CANWRITE || !LOADED.has("images")) return;
  if(typeof STALE!=="undefined" && STALE.on) return;
  if(!force && Date.now()-TE.at<30*60000) return;
  TE.busy=true; TE.at=Date.now();
  try{
    let evs;
    try{ evs=await window.__hqTeamEvents(); }
    catch(e){ if(e && (e.status===403 || e.status===401 || e.code==="DENIED")){ TE.denied=true; TE.err=""; return; } throw e; }
    TE.denied=false; TE.err=""; TE.last=Date.now(); TE.events=evs.length;
    const skipped=[]; let n=0;
    for(const ev of evs){
      const evId=String((ev&&ev.id)||"").replace(/^events\//,""); if(!evId) continue;
      for(const g of (Array.isArray(ev.graphics)?ev.graphics:[])){
        if(!g || !g.id) continue; n++;
        const file=String(g.name||g.label||"graphic").trim(), id=teId(evId, g.id), cur=(S.images||{})[id];
        const meta={eventId:evId, eventName:teEventName(ev), eventStart:String(ev.start||""), eventUse:String(g.use||"Other")};
        if(cur){ if(cur.eventName!==meta.eventName || cur.eventUse!==meta.eventUse || cur.eventStart!==meta.eventStart) await patch("images", id, meta); continue; }
        if(!BRAND_EXT.test(file)){ skipped.push(meta.eventName+": "+file+" (stays in Team HQ)"); continue; }
        const ext=(file.split(".").pop()||"").toLowerCase(), pic=IMG_EXT.test(file), type=g.type||TE_TYPES[ext]||"";
        const blob=await window.__hqTeamFile(String(g.id), type);
        const dims=pic && !/svg/.test(ext) ? await imgDims(blob) : {w:0,h:0};
        const saved=await SP_IMG().save(blob, file);
        await put("images", id, Object.assign({name:String(g.label||file.replace(/\.[a-z0-9]+$/i,"")).trim(), file, kind:pic?"":"file", ext, campaign:"events", edition:"",
          alt:"", credit:meta.eventName, notes:"From Team HQ Industry Events: "+meta.eventName+" ("+meta.eventUse+").", w:dims.w, h:dims.h, size:blob.size||+g.size||0, type:blob.type||type,
          url:"", assetId:"", path:"", spPath:saved.id, at:new Date().toISOString(), archived:false, source:"team-hq", teFile:String(g.id)}, meta));
        TE.added++;
      }
    }
    TE.graphics=n; TE.skipped=skipped;
    if(TAB==="images") renderImages();
  }catch(e){ TE.err=String((e&&(e.message||e.code))||"failed"); throw e; }
  finally{ TE.busy=false; }
}
/* Help > System Health */
function hhTeamEvents(){
  if(!window.__hqTeamEvents) return null;
  const have=teImages().length;
  if(TE.denied) return hhRow("tevents","Industry Events Graphics (Team HQ)","off","This sign-in can't read Team HQ's Industry Events. The graphics come in when someone with Team HQ access has MISMO Media open."+(have?" "+have+" are in the Image Library.":""));
  if(TE.err) return hhRow("tevents","Industry Events Graphics (Team HQ)","warn","Couldn't bring in the event graphics from Team HQ ("+TE.err+"). It tries again by itself.");
  if(!TE.last) return hhRow("tevents","Industry Events Graphics (Team HQ)","off","Read from Team HQ every 30 minutes while MISMO Media is open, by someone who can edit."+(have?" "+have+" are in the Image Library.":""));
  return hhRow("tevents","Industry Events Graphics (Team HQ)", TE.skipped.length?"warn":"ok","Read "+hhWhen(TE.last)+": "+TE.events+" event"+(TE.events===1?"":"s")+", "+TE.graphics+" graphic"+(TE.graphics===1?"":"s")+"; "+have+" in the Image Library under Industry Events."+(TE.skipped.length?" "+TE.skipped.length+" file"+(TE.skipped.length===1?" isn't a kind":"s aren't kinds")+" the library takes; "+(TE.skipped.length===1?"it stays":"they stay")+" on the event in Team HQ.":""), TE.skipped);
}
