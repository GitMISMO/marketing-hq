
/* ================= Summit Photos from MyMISMO (CN-057, approved by Jonna Nov 27, 2026) =================
   Attendees take selfies and photos with friends in MyMISMO's summit frame and send them to MISMO (with the box saying
   MISMO may use them and everyone in them is OK with it). Amy reviews them in MyMISMO, picks the ones she wants and
   presses Send to MISMO Media. The save relay files each send as a batch in marketing-hq-data:
     incoming/summit-photos/<summit id>/<batch id>.json = {summit, sentBy, sentAt, photos:[{id, file, by, name, caption,
     challenge, tags, note, consent, at}]}, each JPEG beside it.
   The relay can't list a folder, so the "Summit Photos" workflow in marketing-hq-data lists every batch in the
   read-only collection summitphotos (data/summitphotos.json, .github/summit-photos.mjs; only photos with consent and a
   JPEG that is there). MISMO Media never writes that collection. Here:
   - The Summits tab shows Summit Photos for the chosen summit, newest batch first.
   - Background job "Summit Photos" (one tab per browser, someone who can edit): each photo is read through the relay's
     file route (window.__hqIncoming, incoming/summit-photos/ JPEGs only) and kept in SharePoint like the other pictures
     (Image Library, campaign Summits, ids imsp-…, fixed so two tabs never add one twice).
   - One draft summit post per batch (pieces, channel summit, id psp-…, status Ready for Review, owner Amy) with the
     captions drafted into the copy and the people to tag in the notes. Amy reads it and decides whether to post; summit
     items never post on their own, and nothing here posts, sends or emails. A draft Amy deleted is not made again.
   Contract: Connections Map row "MyMISMO (Summit Photos: Amy's picks) → MISMO Media". dev/tests/sumphotos.js checks it. */
const SPH = {at:0, last:0, err:"", busy:false, added:0, drafts:0, failed:[]};
function spBatches(){ return vals("summitphotos").filter(b=>b && Array.isArray(b.photos))
  .sort((a,b)=>String(b.sentAt||"").localeCompare(String(a.sentAt||"")) || String(b.id).localeCompare(String(a.id))); }
/* which summit a batch belongs to: MyMISMO's summit id when it is one of ours, else the season and year in it,
   else the summit nearest the day it was sent */
function spSummitId(b){
  const sid=String((b&&b.summit)||"").toLowerCase();
  if(SUMMITS.some(s=>s.id===sid)) return sid;
  const yr=(sid.match(/20\d\d/)||[""])[0], sea=(sid.match(/winter|spring|summer|fall|autumn/)||[""])[0].replace("autumn","fall");
  const hit=SUMMITS.find(s=>yr && sea && s.id.indexOf(yr)>=0 && (s.id+" "+s.name).toLowerCase().indexOf(sea)>=0); if(hit) return hit.id;
  const day=String((b&&b.sentAt)||"").slice(0,10)||T(); let best=null, gap=1e9;
  SUMMITS.forEach(s=>{ const g=day<s.start?diff(s.start,day):day>s.end?diff(day,s.end):0; if(g<gap){ gap=g; best=s; } });
  return best ? best.id : "";
}
function spImgId(b,p){ return "imsp-"+teHash(b.id+"|"+p.id); }
function spDraftId(b){ return "psp-"+teHash(b.id); }
function spDraft(b){ return (S.pieces||{})[spDraftId(b)] || null; }
function spCopy(b, s){
  const caps=b.photos.map(p=>String(p.caption||"").trim()).filter(Boolean).slice(0,6);
  return "Moments from the "+(s?s.name:"MISMO Summit")+(s&&s.where?" in "+String(s.where).split("·")[0].trim():"")+", shared by attendees and the MISMO team. Thank you to everyone who joined us!"+
    (caps.length?"\n\n"+caps.map(c=>"• "+c).join("\n"):"")+"\n\n#MISMO #MISMOSummit";
}
function spNotes(b){
  const tags=[...new Set(b.photos.flatMap(p=>p.tags||[]).concat(b.photos.filter(p=>p.by==="attendee"&&p.name).map(p=>p.name)))];
  const notes=b.photos.filter(p=>p.note).map(p=>"• "+(p.caption||p.file)+": "+p.note);
  return "Drafted by MISMO Media from the "+b.photos.length+" photo"+(b.photos.length===1?"":"s")+" "+(b.sentBy||"Amy")+" sent from MyMISMO on "+fS(String(b.sentAt||"").slice(0,10)||T())+
    ". The photos are in the Image Library (Summits) and on the Summits page. Nothing posts on its own: read it over, choose the photos and post it yourself if you want it."+
    (tags.length?"\n\nPeople in the photos (tag them if they want): "+tags.join(", "):"")+(notes.length?"\n\nAmy's notes:\n"+notes.join("\n"):"");
}
function spPhase(s){ const t=T(); return !s ? "at" : t<s.start ? "before" : t>s.end ? "after" : "at"; }
async function summitPhotosSync(force){
  if(SPH.busy || !window.__hqIncoming || !SP_IMG() || !CANWRITE || !LOADED.has("summitphotos") || !LOADED.has("images") || !LOADED.has("pieces")) return;
  if(typeof STALE!=="undefined" && STALE.on) return;
  if(!force && Date.now()-SPH.at<10*60000) return;
  SPH.busy=true; SPH.at=Date.now();
  const failed=[];
  try{
    for(const b of spBatches()){
      const s=SUMMITS.find(x=>x.id===spSummitId(b));
      for(const p of b.photos){
        const id=spImgId(b,p); if(!p || !p.path || (S.images||{})[id] || (TRASH.images||{})[id]) continue;
        try{
          const blob=await window.__hqIncoming(String(p.path));
          const dims=await imgDims(blob), saved=await SP_IMG().save(blob, p.file||"summit-photo.jpg");
          if(await put("images", id, {name:String(p.caption||"").trim().slice(0,80)||("Summit photo"+(p.name?" by "+p.name:"")), file:p.file||"", ext:"jpg", campaign:"summit", edition:"",
            alt:"", credit:p.by==="staff"?"MISMO":(p.name||""), notes:"From MyMISMO Summit Photos"+(s?" ("+s.name+")":"")+", sent by "+(b.sentBy||"Amy")+". Consent given in MyMISMO"+(p.at?" "+fS(String(p.at).slice(0,10)):"")+"."+(p.note?" Amy's note: "+p.note:""),
            w:dims.w, h:dims.h, size:blob.size||0, type:blob.type||"image/jpeg", url:"", assetId:"", path:"", spPath:saved.id, at:new Date().toISOString(), archived:false,
            source:"mymismo", summit:s?s.id:"", spBatch:b.id, spPhoto:String(p.id), spBy:p.by||"", spChallenge:p.challenge||"", spTags:(p.tags||[]).slice(), consent:true})!==false) SPH.added++;
        }catch(e){ failed.push((p.file||p.id)+": "+String((e&&(e.message||e.code))||"failed")); }
      }
      /* the draft post, once per batch, as soon as at least one of its photos is in the library */
      const ids=b.photos.map(p=>spImgId(b,p)).filter(i=>(S.images||{})[i]);
      const did=spDraftId(b), cur=(S.pieces||{})[did];
      if(!cur && !(TRASH.pieces||{})[did] && ids.length){
        if(await put("pieces", did, {channel:"summit", summit:s?s.id:"", phase:spPhase(s), via:"LinkedIn", status:"review", owner:"Amy", date:T(),
          title:"Summit Photos: "+ids.length+" photo"+(ids.length===1?"":"s")+" from MyMISMO ("+fS(String(b.sentAt||"").slice(0,10)||T())+")",
          copy:spCopy(b,s), notes:spNotes(b), spBatch:b.id, photoIds:ids, source:"mymismo"})!==false) SPH.drafts++;
      } else if(cur && ids.some(i=>!(cur.photoIds||[]).includes(i)) && ["idea","draft","review"].includes(cur.status)){
        await patch("pieces", did, {photoIds:[...new Set((cur.photoIds||[]).concat(ids))]});
      }
    }
    SPH.failed=failed; SPH.err=failed.length?failed.length+" photo"+(failed.length===1?"":"s")+" couldn't be copied yet":""; SPH.last=Date.now();
    if(TAB==="summits") renderSummits();
  }catch(e){ SPH.err=String((e&&(e.message||e.code))||"failed"); throw e; }
  finally{ SPH.busy=false; }
}
/* the Summits tab card */
function summitPhotosCard(s){
  const list=spBatches().filter(b=>spSummitId(b)===s.id), n=list.reduce((k,b)=>k+b.photos.length,0);
  return '<div class="card sph" style="margin-top:22px"><div class="ch"><h2>Summit Photos</h2><span class="cnt">'+n+' photo'+(n===1?'':'s')+(list.length?' · '+list.length+' batch'+(list.length===1?'':'es'):'')+'</span></div>'+
    (list.length ? list.map(b=>{
      const d=spDraft(b), when=String(b.sentAt||"").slice(0,10);
      return '<div class="sph-b"><div class="sph-h"><b>Sent '+esc(when?fS(when)+", "+when.slice(0,4):"")+(b.sentBy?' by '+esc(b.sentBy):'')+'</b><span>'+b.photos.length+' photo'+(b.photos.length===1?'':'s')+(b.skipped&&b.skipped.length?' · '+b.skipped.length+' left out (no consent or no file)':'')+'</span>'+
        (d ? '<button class="btn sm" type="button" data-open="'+esc(d.id)+'">Open the Draft Post · '+esc((PSTAT[d.status]||[d.status||""])[0])+'</button>' : '<span class="sph-wait">The draft post is made once the photos are in SharePoint.</span>')+'</div>'+
        '<div class="sph-g">'+b.photos.map(p=>{ const im=(S.images||{})[spImgId(b,p)]; if(im) imgEnsure(im); const src=im?imgSrc(im):"";
          return '<figure class="sph-p">'+(src?'<img src="'+esc(src)+'" alt="'+esc(p.caption||"Summit photo")+'" loading="lazy">':'<div class="sph-ph">'+(im?'Loading from SharePoint…':'Copying to SharePoint…')+'</div>')+
            '<figcaption>'+(p.caption?'<b>'+esc(p.caption)+'</b>':'')+'<small>'+esc([p.by==="staff"?"MISMO staff":"Attendee", p.name, p.challenge].filter(Boolean).join(" · "))+'</small>'+
            (p.tags&&p.tags.length?'<small>With '+esc(p.tags.join(", "))+'</small>':'')+(p.note?'<small class="sph-n">Amy: '+esc(p.note)+'</small>':'')+'</figcaption></figure>'; }).join("")+'</div></div>';
    }).join("") : '<div class="empty">No photos yet. When Amy picks attendee and staff photos in MyMISMO and presses Send to MISMO Media, they show here, newest first, with a draft post for her to review.</div>')+'</div>';
}
/* Help > System Health */
function hhSummitPhotos(){
  if(!window.__hqIncoming) return null;
  const bs=spBatches(), n=bs.reduce((k,b)=>k+b.photos.length,0), have=vals("images").filter(i=>i.source==="mymismo").length;
  if(SPH.err) return hhRow("sumphotos","Summit Photos (MyMISMO)","warn","Read "+(SPH.last?hhWhen(SPH.last):"")+": "+SPH.err+". It tries again by itself.", SPH.failed);
  if(!bs.length) return hhRow("sumphotos","Summit Photos (MyMISMO)","off","No photos have come from MyMISMO yet. They arrive when Amy presses Send to MISMO Media there.");
  return hhRow("sumphotos","Summit Photos (MyMISMO)","ok",bs.length+" batch"+(bs.length===1?"":"es")+", "+n+" photo"+(n===1?"":"s")+"; "+have+" in SharePoint (Image Library, Summits). Draft posts wait for Amy; nothing posts on its own.");
}
