// No Mic'd Up on holiday Fridays (Brian, Nov 28, 2026: none on Nov 27, Dec 25 or Jan 1). The Schedule doesn't ask
// for an episode on those Fridays, the Mic'd Up page shows them as No Episode, and a new episode skips them.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.setFixedTime(new Date('2026-12-21T15:00:00'));   // the Monday before Christmas
await p.goto('file://'+process.cwd()+'/live.html');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms)); const out={};
  document.querySelectorAll('[id^=mn-pop]').forEach(e=>e.remove());
  out.holidays=!!HOLIDAYS["2026-11-27"] && HOLIDAYS["2026-12-25"]==="Winter Break" && HOLIDAYS["2027-01-01"]==="Winter Break";
  out.micOff=!!micOff("2026-12-25") && !!micOff("2027-01-01") && !micOff("2026-12-18");
  /* today is the Monday before Christmas; no episodes after it */
  const today=T(); out.today=today==="2026-12-21";
  const keep=S.episodes; S.episodes={}; Object.values(keep).forEach(e=>{ if(!e.airDate || e.airDate<today) S.episodes[e.id]=e; });
  const ev=allEvents();
  out.noSlotOnHoliday=!ev.some(e=>e.slot && (e.date==="2026-12-25"||e.date==="2027-01-01"));
  out.slotAfter=ev.some(e=>e.slot && e.date==="2027-01-08");
  out.nextFri=nextMicFri("2026-12-25")==="2027-01-08";
  let seen=[]; const ke=window.newEpisode; window.newEpisode=f=>seen.push(f);
  newItem("micdup",""); out.newItemSkips=seen[0]==="2027-01-08";
  window.newEpisode=ke;
  go("micdup"); renderMicdup(); await wait(150);
  const pg=document.getElementById("page-micdup");
  out.band=/No Episode/.test(pg.querySelector(".band").innerText) && /Winter Break/.test(pg.querySelector(".band").innerText) && !/Needed/.test(pg.querySelector('[data-tile="fri"]').innerText);
  const rows=[...pg.querySelectorAll("tr.slot")];
  out.runRow=rows.some(r=>/Dec 25/.test(r.innerText) && /No episode · Winter Break/.test(r.innerText) && !r.dataset.new);
  go("overview"); renderOverview(); await wait(150);
  const tile=document.querySelector('#page-overview [data-tl="fri"], #page-overview [data-go="micdup"]');
  out.overviewTile=!!tile && /No Episode/.test(tile.innerText) && !tile.querySelector(".v.hot");
  S.episodes=keep; go("overview"); renderOverview();
  out.ok=Object.values(out).every(v=>v===true); return out; });
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
