// Summit Photos from MyMISMO (CN-057, approved by Jonna Nov 27, 2026), on made-up batches only: the batches show on the
// Summits tab newest first, each photo is read through the relay's file route (incoming/summit-photos/ JPEGs only) and
// kept in SharePoint (Image Library, Summits), one draft summit post per batch for Amy (Ready for Review; never posted,
// nothing sent), nothing added twice, a deleted draft is not made again, and System Health has a row.
// Contract: Connections Map row "MyMISMO (Summit Photos: Amy's picks) → MISMO Media".
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
const sent=[];p.on('request',r=>{ if(/push|linkedin|notify|mailchimp/i.test(r.url()) && r.method()==="POST") sent.push(r.url()); });
await p.goto('file://'+process.cwd()+'/live.html');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms)); const out={};
  const jpg=await new Promise(res=>{ const c=document.createElement("canvas"); c.width=40; c.height=50; c.getContext("2d").fillRect(0,0,40,50); c.toBlob(res,"image/jpeg"); });
  const reads=[], saves=[]; let notified=0;
  window.__hqIncoming=async path=>{ reads.push(path); if(/bad/.test(path)) throw new Error("The photo couldn’t be read (404)"); return new Blob([await jpg.arrayBuffer()],{type:"image/jpeg"}); };
  window.__hqImages=Object.assign(window.__hqImages||{}, {get:async()=>jpg, list:async()=>[], save:async(blob,name)=>{ saves.push(name); return {id:"/Shared/2027-01/x-"+name, sp:true, sizeBytes:blob.size}; }, notify:async()=>{ notified++; return {}; }});
  const ph=(id,file,o)=>Object.assign({id, file, path:"incoming/summit-photos/2027-winter/"+file, by:"attendee", name:"Pat Example", caption:"Caption "+id, challenge:"You and someone you just met", tags:["Sam Example"], note:"", consent:true, at:"2027-01-12T14:00:00Z"}, o||{});
  S.summitphotos={
    "2027-winter--b1":{id:"2027-winter--b1", summit:"2027-winter", batch:"b1", sentBy:"Test Reviewer", sentAt:"2027-01-12T15:00:00Z", count:2, skipped:[],
      photos:[ph("p1","p1.jpg",{note:"Use this one first"}), ph("p2","p2.jpg",{by:"staff", name:"Staff Example", tags:[]})]},
    "2027-winter--b2":{id:"2027-winter--b2", summit:"winter-2027", batch:"b2", sentBy:"Test Reviewer", sentAt:"2027-01-13T15:00:00Z", count:2, skipped:[{id:"x",why:"no consent"}],
      photos:[ph("p3","p3.jpg"), ph("p4","bad.jpg")]}};
  LOADED.add("summitphotos");
  await summitPhotosSync(true); await wait(200);
  const imgs=vals("images").filter(i=>i.source==="mymismo");
  const i1=S.images[spImgId(S.summitphotos["2027-winter--b1"], {id:"p1"})];
  out.copied=imgs.length===3 && saves.length===3 && !!i1 && i1.campaign==="summit" && i1.summit==="2027-winter" && /^\/Shared\//.test(i1.spPath) && i1.consent===true && i1.credit==="Pat Example" && /Use this one first/.test(i1.notes) && i1.w===40;
  out.onlyIncoming=reads.every(x=>/^incoming\/summit-photos\//.test(x));
  const d1=S.pieces[spDraftId(S.summitphotos["2027-winter--b1"])], d2=S.pieces[spDraftId(S.summitphotos["2027-winter--b2"])];
  out.drafts=!!d1 && !!d2 && d1.channel==="summit" && d1.summit==="2027-winter" && d2.summit==="2027-winter" && d1.status==="review" && d1.owner==="Amy" && d1.via==="LinkedIn" &&
    !d1.autoPost && d1.photoIds.length===2 && d2.photoIds.length===1 && /Caption p1/.test(d1.copy) && /Sam Example/.test(d1.notes) && /Nothing posts on its own/.test(d1.notes);
  out.failedShown=SPH.failed.length===1 && /bad\.jpg/.test(SPH.failed[0]) && /couldn't be copied/.test(JSON.stringify(hhSummitPhotos()));
  /* again: nothing added twice; the photo that failed is tried again */
  const before=saves.length; await summitPhotosSync(true); await wait(100);
  out.noRepeat=vals("images").filter(i=>i.source==="mymismo").length===3 && saves.length===before && Object.keys(S.pieces).filter(k=>/^psp-/.test(k)).length===2 && reads.filter(x=>/bad/.test(x)).length===2;
  /* a draft Amy deleted is not made again */
  await remove("pieces", d2.id); await summitPhotosSync(true); await wait(100);
  out.deletedStays=!S.pieces[d2.id];
  /* the Summits tab: newest batch first, the photos and the draft button */
  go("summits"); SM.id="2027-winter"; renderSummits(); await wait(200);
  const card=document.querySelector(".card.sph"), heads=[...document.querySelectorAll(".sph-h b")].map(x=>x.textContent);
  out.page=!!card && /Summit Photos/.test(card.innerText) && heads.length===2 && /Jan 13/.test(heads[0]) && /Jan 12/.test(heads[1]) && card.querySelectorAll(".sph-p").length===4 &&
    /Amy: Use this one first/.test(card.innerText) && /MISMO staff/.test(card.innerText) && !!card.querySelector('[data-open="'+d1.id+'"]') && /1 left out/.test(card.innerText);
  /* another summit: none of these */
  SM.id="2027-spring"; renderSummits(); await wait(100);
  out.otherSummit=/No photos yet/.test(document.querySelector(".card.sph").innerText);
  SM.id="2027-winter"; renderSummits();
  /* the draft button opens the post */
  document.querySelector('[data-open="'+d1.id+'"]').click(); await wait(200);
  out.opens=/Summit Photos/.test((document.querySelector("#pane-title")||{}).textContent||""); if(typeof closePane==="function") closePane(true);
  out.nothingSent=notified===0;
  hhRun(); out.health=/Summit Photos \(MyMISMO\)/.test(JSON.stringify(HH.last.rows));
  out.ok=Object.values(out).every(v=>v===true);
  return out;
});
if(sent.length){ r.ok=false; r.sent=sent; }
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
