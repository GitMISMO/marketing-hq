// The sponsor benefits feed the Sponsorship Portal reads (Nov 21, 2026): a sponsor picker on Sponsor Highlight posts,
// the Summits sponsor thank-you post and Mic'd Up episodes, and data/feed-sponsor-benefits.json written from them.
// Contract: Connections Map row "MISMO Media → Sponsorship Portal".
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html#linkedin');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms)); const out={};
  const m=document.getElementById("mn-pop"); if(m) m.remove();
  window.__hqSponsors=async()=>[{id:"a1",appNo:"SP-101",company:"Acme Corp",event:"2027 Series",status:"Approved"},{id:"a2",appNo:"SP-102",company:"Beta Lending",event:"Winter 2027",status:"Paid"},{id:"a3",appNo:"SP-103",company:"Gamma",event:"Winter 2027",status:"Declined"}];
  SPN.apps=null; SB.apps=null;
  const store={}; let shaN=0; window.__puts=0;
  window.__hqFile={ get:async n=>({data:store[n]?JSON.parse(JSON.stringify(store[n].c)):null, sha:store[n]?store[n].sha:null}),
    put:async(n,c,sha)=>{ if(store[n] && store[n].sha!==sha){ const e=new Error("conflict"); e.status=409; throw e; } window.__puts++; store[n]={c:JSON.parse(JSON.stringify(c)), sha:"s"+(++shaN)}; return {}; } };
  const feed=()=>((store["feed-sponsor-benefits"]||{}).c||{});
  const save=async()=>{ document.getElementById("pf-save").click(); await wait(700); };
  const setv=(id,v)=>{ const e=document.getElementById(id); e.value=v; e.dispatchEvent(new Event("change",{bubbles:true})); };
  /* a Sponsor Highlight post */
  await put("pieces","sbp1",{channel:"linkedin",title:"Thank you, Acme",date:"2026-12-01",status:"draft",kind:"Other",owner:"Kelly"}); await wait(300);
  openPiece("sbp1"); await wait(500);
  out.hiddenOther=document.getElementById("sb-pick").hidden===true;
  setv("f-kind","Sponsor Highlight"); await wait(100);
  out.shownSponsor=document.getElementById("sb-pick").hidden===false;
  const opts=[...document.querySelectorAll("#sb-app option")].map(o=>o.textContent);
  out.onlyApproved=opts.length===3 && opts.some(t=>/Acme Corp · 2027 Series · SP-101/.test(t)) && !opts.some(t=>/Gamma/.test(t));
  setv("sb-app","a1"); await wait(50);
  out.seriesSummits=[...document.querySelectorAll("#sb-sum option")].map(o=>o.value).join("|")==="|Winter 2027|Spring 2027|Fall 2027";
  setv("sb-sum","Winter 2027");
  await save(); await sbSync(); await wait(100);
  const p1=S.pieces.sbp1;
  out.saved=p1.sponsorApp==="a1" && p1.sponsorAppNo==="SP-101" && p1.sponsorCompany==="Acme Corp" && p1.sponsorSummit==="Winter 2027" && p1.kind==="Sponsor Highlight";
  let e=feed().entries&&feed().entries.sbp1;
  out.planned=!!e && e.status==="planned" && e.benefit==="linkedin" && e.appNo==="SP-101" && e.summit==="Winter 2027" && !!feed().updatedAt && !!e.at;
  const at1=e&&e.at;
  /* marked Posted, with the live link */
  openPiece("sbp1"); await wait(500); setv("f-status","done"); document.getElementById("f-postedUrl").value="https://www.linkedin.com/feed/update/urn:li:activity:1";
  await save(); await sbSync(); await wait(100);
  e=feed().entries.sbp1;
  out.posted=e.status==="posted" && e.on==="2026-12-01" && /linkedin\.com\/feed/.test(e.url) && e.company==="Acme Corp";
  out.keys=Object.keys(e).sort().join(",")==="appNo,at,benefit,by,company,on,status,summit,url";
  /* nothing changed: no new save, and the time stays */
  const before=window.__puts; SB.last=""; await sbSync(); out.noRewrite=window.__puts===before;
  /* a Mic'd Up sponsor guest: invited, recorded, posted */
  await put("episodes","sbe1",{num:77,season:"2",airDate:"2027-01-08",title:"Sponsor talk"}); await wait(300);
  openEpisode("sbe1"); await wait(500);
  setv("sb-app","a2"); await wait(50);
  out.oneSummit=document.getElementById("sb-sum").value==="Winter 2027";
  await save(); await sbSync(); await wait(100);
  e=feed().entries.sbe1; out.invited=!!e && e.benefit==="micdup" && e.status==="invited" && e.appNo==="SP-102";
  await patch("episodes","sbe1",{recordDate:"2026-11-10"}); await wait(300); await sbSync(); await wait(100);
  out.recorded=feed().entries.sbe1.status==="recorded" && feed().entries.sbe1.on==="2026-11-10";
  await patch("episodes","sbe1",{youtubeDone:true, youtubeUrl:"https://www.youtube.com/watch?v=x"}); await wait(300); await sbSync(); await wait(100);
  out.epPosted=feed().entries.sbe1.status==="posted" && /youtube/.test(feed().entries.sbe1.url);
  out.atKept=feed().entries.sbp1.at===feed().entries.sbp1.at && !!at1;
  /* the Summits sponsor thank-you post picks its summit */
  await put("pieces","sbs1",{channel:"summit",summit:"2027-spring",title:"Sponsor thank-you post",via:"LinkedIn",date:"2027-05-08",status:"idea"}); await wait(300);
  openPiece("sbs1"); await wait(500);
  out.summitPicker=!!document.getElementById("sb-pick") && !document.getElementById("sb-pick").hidden;
  setv("sb-app","a1"); await wait(50); out.summitDefault=document.getElementById("sb-sum").value==="Spring 2027";
  await save(); await sbSync(); await wait(100);
  out.summitEntry=feed().entries.sbs1 && feed().entries.sbs1.summit==="Spring 2027" && feed().entries.sbs1.status==="planned";
  /* taking the sponsor off drops the entry; a deleted post drops out */
  openPiece("sbs1"); await wait(500); setv("sb-app",""); await save(); await sbSync(); await wait(100);
  out.cleared=!feed().entries.sbs1;
  await remove("pieces","sbp1"); await wait(400); await sbSync(); await wait(100);
  out.deleted=!feed().entries.sbp1 && !!feed().entries.sbe1;
  /* a conflict on save is retried on the newest copy */
  store["feed-sponsor-benefits"].sha="other"; await patch("episodes","sbe1",{title:"Sponsor talk 2"}); SB.last=""; await put("pieces","sbp2",{channel:"linkedin",kind:"Sponsor Highlight",title:"B",date:"2026-12-05",status:"ready",sponsorApp:"a2",sponsorAppNo:"SP-102",sponsorCompany:"Beta Lending"}); await wait(300);
  await sbSync(); await wait(100); out.conflict=!!feed().entries.sbp2;
  /* System Health */
  const h=hhSponsorFeed(); out.health=h && h.level==="ok" && /2 sponsor benefits/.test(h.line);
  out.ok=Object.values(out).every(v=>v===true); return out; });
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
