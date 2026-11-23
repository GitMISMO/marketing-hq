// Industry Events graphics from Team HQ (CN-004, approved by Jonna Nov 23, 2026): read only from Team HQ, a copy
// of each graphic saved to SharePoint, listed in the Image Library under Industry Events with the event's name.
// Contract: Connections Map row "Team HQ (Industry Events) → MISMO Media (Image Library)".
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms)); const out={};
  const png=await new Promise(res=>{ const c=document.createElement("canvas"); c.width=40; c.height=20; c.getContext("2d").fillRect(0,0,40,20); c.toBlob(res,"image/png"); });
  let events=[{id:"ev1",name:"MBA Annual 2026",start:"2026-10-19",status:"Going",graphics:[
      {id:"receipts/abc1-logo.png",name:"logo.png",label:"MBA Annual Logo",use:"Logo",type:"image/png",size:800},
      {id:"receipts/abc2-deck.pptx",name:"deck.pptx",label:"Booth deck",use:"Booth",type:"",size:900},
      {id:"receipts/abc3-notes.txt",name:"notes.txt",label:"Notes",use:"Other",type:"text/plain",size:10}]}];
  const reads=[], saves=[], writes=[];
  window.__hqTeamEvents=async()=>JSON.parse(JSON.stringify(events));
  window.__hqTeamFile=async(id,type)=>{ reads.push(id); return new Blob([await png.arrayBuffer()],{type:type||"application/octet-stream"}); };
  window.__hqImages=Object.assign(window.__hqImages||{}, {get:async()=>png, list:async()=>[], save:async(blob,name)=>{ saves.push(name); return {id:"/Shared/2026-11/x-"+name, sp:true, sizeBytes:blob.size}; }});
  await teamEventsSync(true); await wait(200);
  const imgs=teImages();
  const logo=imgs.find(i=>i.teFile==="receipts/abc1-logo.png"), deck=imgs.find(i=>i.teFile==="receipts/abc2-deck.pptx");
  out.added=imgs.length===2 && !!logo && !!deck && logo.campaign==="events" && logo.eventName==="MBA Annual 2026" && logo.eventUse==="Logo" && logo.name==="MBA Annual Logo" && /^\/Shared\//.test(logo.spPath) && logo.w===40 && deck.kind==="file";
  out.skipped=TE.skipped.length===1 && /notes\.txt/.test(TE.skipped[0]) && !reads.includes("receipts/abc3-notes.txt");
  /* run again: nothing added twice */
  await teamEventsSync(true); await wait(100);
  out.noRepeat=teImages().length===2 && saves.length===2;
  /* Team HQ renames the event: the library follows; a removed graphic stays */
  events=[{id:"ev1",name:"MBA Annual Convention 2026",start:"2026-10-19",graphics:[{id:"receipts/abc1-logo.png",name:"logo.png",label:"MBA Annual Logo",use:"Banner"}]}];
  await teamEventsSync(true); await wait(100);
  const l2=S.images[logo.id];
  out.follows=l2.eventName==="MBA Annual Convention 2026" && l2.eventUse==="Banner" && !!S.images[deck.id] && !S.images[deck.id].archived;
  /* the Image Library: Industry Events campaign, an event filter, the event on the card */
  go("images"); IM.view="lib"; IM.camp="events"; renderImages(); await wait(150);
  const card=document.querySelector('[data-im="'+logo.id+'"]');
  out.page=!!document.querySelector("#im-ev") && [...document.querySelectorAll("#im-ev option")].some(o=>o.value==="ev1") && !!card && /MBA Annual Convention 2026/.test(card.innerText) && /Industry Events/.test(card.innerText);
  IM.camp=""; IM.ev=""; renderImages();
  /* someone who can't read Team HQ: no error, health says so */
  window.__hqTeamEvents=async()=>{ const e=new Error("This sign-in can’t read Team HQ"); e.status=403; e.code="DENIED"; throw e; };
  let threw=false; try{ await teamEventsSync(true); }catch(e){ threw=true; }
  const h=hhTeamEvents();
  out.denied=!threw && TE.denied && /can't read Team HQ/.test(JSON.stringify(h));
  hhRun(); out.health=/Industry Events Graphics/.test(JSON.stringify(HH.last.rows));
  out.ok=Object.values(out).every(v=>v===true);
  return out;
});
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
