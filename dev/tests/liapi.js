// The LinkedIn page read automatically (Nov 21, 2026): data/linkedin.json from the "LinkedIn page" workflow is matched
// to MISMO Media's own posts and episodes (marked Posted with the live link, numbers filled in), unknown posts are
// added, the page's daily totals become the Daily totals records, and System Health shows the read.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html#results');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms)); const out={};
  const m=document.getElementById("mn-pop"); if(m) m.remove();
  /* not connected yet */
  out.healthWaiting=(hhLinkedIn()||{}).level==="off";
  /* MISMO Media's own records */
  await put("pieces","mmp1",{channel:"linkedin",kind:"MISMO Matters",fromEdition:"x",title:"Vieaux Point",copy:"President's Vieaux Point: the Mortgage Compliance Dataset saves lenders real money on every loan they close this year",status:"review",date:""});
  await put("pieces","sh1",{channel:"linkedin",kind:"Sponsor Highlight",title:"Thanks Acme",copy:"Thank you to Acme Lending for sponsoring the Winter Summit in New Orleans this January",status:"ready",date:"2026-11-18"});
  await put("pieces","old1",{channel:"linkedin",title:"Unrelated",copy:"Completely different words about workgroups and standards adoption today",status:"ready",date:"2026-11-18"});
  await put("episodes","lep1",{num:48,season:"2",airDate:"2026-11-14",title:"Down Payment",linkedinDate:"2026-11-17"});
  await wait(400);
  const now=new Date().toISOString();
  S.linkedin={
    "post-111":{id:"post-111",urn:"urn:li:share:111",url:"https://www.linkedin.com/feed/update/urn:li:share:111/",date:"2026-11-20",at:"2026-11-20T15:00:00Z",text:"President's Vieaux Point: the Mortgage Compliance Dataset saves lenders real money on every loan they close this year. Read more",impressions:500,uniqueImpressions:400,clicks:12,likes:30,comments:2,shares:3},
    "post-222":{id:"post-222",urn:"urn:li:ugcPost:222",url:"https://www.linkedin.com/feed/update/urn:li:ugcPost:222/",date:"2026-11-17",at:"2026-11-17T18:00:00Z",text:"New on MISMO Mic'd Up, Episode 48: down payment assistance and standards",impressions:250,clicks:5,likes:9,comments:0,shares:1},
    "post-333":{id:"post-333",urn:"urn:li:share:333",url:"https://www.linkedin.com/feed/update/urn:li:share:333/",date:"2026-11-19",at:"2026-11-19T14:00:00Z",text:"Thank you to Acme Lending for sponsoring the Winter Summit in New Orleans this January!",impressions:300,clicks:4,likes:11,comments:1,shares:0},
    "post-444":{id:"post-444",urn:"urn:li:share:444",url:"https://www.linkedin.com/feed/update/urn:li:share:444/",date:"2026-11-15",at:"2026-11-15T14:00:00Z",text:"MISMO in the news: HousingWire on the MISMO standards #InTheNews",impressions:120,clicks:3,likes:4,comments:0,shares:0},
    "post-555":{id:"post-555",urn:"urn:li:share:555",url:"https://www.linkedin.com/feed/update/urn:li:share:555/",date:"2025-05-01",at:"2025-05-01T14:00:00Z",text:"An old post from last year",impressions:10},
    "day-2026-11-20":{id:"day-2026-11-20",date:"2026-11-20",impressions:900,clicks:20,likes:10,comments:1,shares:2},
    "_run":{id:"_run",at:now,ok:true,lastOk:now,posts:5,days:1,followers:4321,tokenExpires:"2027-01-20"}
  };
  LOADED.add("linkedin");
  await liSync(); await wait(600);
  const mm=S.pieces.mmp1, sh=S.pieces.sh1, ep=S.episodes.lep1;
  out.mmCleared=mm.status==="done" && /share:111/.test(mm.postedUrl) && mm.impressions===500 && mm.reactions===30 && mm.reposts===3 && mm.date==="2026-11-20" && /automatically/.test(mm.postedBy);
  out.sponsor=sh.status==="done" && sh.liUrn==="urn:li:share:333" && sh.impressions===300;
  out.untouched=S.pieces.old1.status==="ready" && !S.pieces.old1.liUrn;
  out.episode=ep.linkedinDone===true && /ugcPost:222/.test(ep.linkedinUrl) && ep.liImpressions===250;
  out.added=!!S.pieces["li-444"] && S.pieces["li-444"].kind==="In the News" && S.pieces["li-444"].status==="done" && !S.pieces["li-555"];
  out.daily=vals("pieces").some(q=>liIsDay(q) && q.date==="2026-11-20" && q.impressions===900);
  /* a second pass changes nothing */
  const before=JSON.stringify(S.pieces); LI_API.done=""; await liSync(); await wait(300); out.idempotent=JSON.stringify(S.pieces)===before;
  /* Health, Results and the monthly line */
  out.healthOk=(hhLinkedIn()||{}).level==="ok" && /4,321 followers/.test(hhLinkedIn().line);
  S.linkedin._run=Object.assign({},S.linkedin._run,{tokenExpires:new Date(Date.now()+5*864e5).toISOString().slice(0,10)}); out.healthToken=(hhLinkedIn()||{}).level==="warn";
  S.linkedin._run=Object.assign({},S.linkedin._run,{ok:false,error:"LinkedIn 401: expired"}); out.healthBad=(hhLinkedIn()||{}).level==="bad";
  S.linkedin._run=Object.assign({},S.linkedin._run,{ok:true,tokenExpires:"2027-01-20"});
  go("results"); await wait(300); const mm2=document.getElementById("mn-pop"); if(mm2) mm2.remove();
  out.card=/Followers/.test(document.querySelector('[data-rs-open="li"]').innerText) && /4,321/.test(document.querySelector('[data-rs-open="li"]').innerText);
  out.monthAuto=liApiCovers("2026-10")===true && liApiCovers(new Date().toISOString().slice(0,7))===false;
  out.ok=Object.values(out).every(v=>v===true); return out; });
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
