// The Schedule (Jonna, Nov 27, 2026): MISMO Media opens on it and Home is gone from the menu; + New Item offers the eight
// kinds of work; the calendar, its filter and Next Two Weeks share those eight; no Next Four Weeks, no Getting Set Up,
// and housekeeping like Stats Recorded stays out of Next Two Weeks.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms)); const out={};
  document.querySelectorAll('[id^=mn-pop]').forEach(e=>e.remove());
  out.startsOnSchedule=TAB==="overview" && !document.getElementById("page-overview").hidden;
  out.noHome=!document.querySelector('.hq nav button[data-hq="home"]');
  go("home"); await wait(50); out.homeGoesNowhere=TAB==="overview";
  const t=T(), d1=add(t,2), d2=add(t,3);
  S.pieces.sc1={id:"sc1", channel:"linkedin", title:"Schedule LinkedIn test", date:d1, status:"idea"};
  S.pieces.sc2={id:"sc2", channel:"mailchimp", title:"Schedule Mailchimp test", date:d1, status:"idea"};
  S.pieces.sc3={id:"sc3", channel:"setup", title:"Schedule setup test", date:d1, status:"idea"};
  S.pieces.sc4={id:"sc4", channel:"events", title:"Schedule event test", date:d2, status:"idea"};
  const ed=editionsSorted().find(e=>!e.archived); ed.dates=Object.assign({},ed.dates,{stats:d2, test:d2}); ed.done=Object.assign({},ed.done,{stats:false, test:false});
  window.__hqTeamEvents=()=>Promise.resolve([{id:"events/e1", name:"Test Industry Conference", start:add(t,4), end:add(t,5)}]);
  OV.teAt=0; OV.chans=[]; OV.month=t.slice(0,7); go("overview"); renderOverview(); await wait(200);
  const pg=()=>document.getElementById("page-overview");
  out.noFourWeeks=!/Next Four Weeks/i.test(pg().innerText);
  out.noSetup=!/Getting Set Up/i.test(pg().innerText) && !pg().querySelector("#ov-newsetup");
  const fil=[...pg().querySelectorAll("[data-calch]")].map(b=>b.dataset.calch).filter(Boolean).join(",");
  out.filters=fil==="press,matters,micdup,linkedin,youtube,mailchimp,summit,events";
  const ag=()=>pg().querySelector(".agcard").innerText;
  out.agenda=/Schedule LinkedIn test/.test(ag()) && /Schedule event test/.test(ag()) && !/Schedule setup test/.test(ag()) && !/Stats Recorded/i.test(ag()) && /Test Send/.test(ag());
  out.calNoSetup=!/Schedule setup test/.test(pg().querySelector(".cal").innerText);
  const evDay=pg().querySelector('.cal .d[data-date="'+add(t,4)+'"]'); out.teamEvent=(!evDay && add(t,4).slice(0,7)!==t.slice(0,7)) || (!!evDay && /Test Industry Conference/.test(evDay.innerText));
  /* the filter drives Next Two Weeks too */
  pg().querySelector('[data-calch="linkedin"]').click(); await wait(100);
  out.agFiltered=/Schedule LinkedIn test/.test(ag()) && !/Schedule Mailchimp test/.test(ag()) && !/Schedule event test/.test(ag()) && /like the calendar/.test(ag());
  pg().querySelector('[data-calch=""]').click(); await wait(100);
  /* + New Item: the eight kinds */
  let seen=[]; const kp=window.newPiece, ke=window.newEpisode; window.newPiece=(ch,seed)=>seen.push(["piece",ch,seed]); window.newEpisode=f=>seen.push(["ep",f]);
  pg().querySelector("#ov-newpiece").click(); await wait(80);
  const menu=document.querySelector(".calmenu"); const kinds=menu?[...menu.querySelectorAll("[data-k]")].map(b=>b.textContent.trim()).join("|"):"";
  out.menu=kinds==="Press Release|MISMO Matters|Mic'd Up Episode|LinkedIn Post|YouTube Video|Mailchimp Send|Summit|Industry Event";
  menu.querySelector('[data-k="press"]').click(); await wait(50);
  out.press=seen[0] && seen[0][0]==="piece" && seen[0][1]==="press";
  pg().querySelector("#ov-newpiece").click(); await wait(80); document.querySelector('.calmenu [data-k="micdup"]').click(); await wait(50);
  out.micdup=seen[1] && seen[1][0]==="ep" && P(seen[1][1]).getDay()===5;
  window.newPiece=kp; window.newEpisode=ke;
  /* a real new Industry Event item keeps its kind */
  newPiece("events"); await wait(150); const ch=document.querySelector("#pane-body #f-channel"); out.paneKind=!!ch && ch.value==="events" && /New Industry Event/.test(document.getElementById("pane-title").textContent); closePane(true);
  newPiece("matters"); await wait(150); const ch2=document.querySelector("#pane-body #f-channel"); out.mattersKind=!!ch2 && ch2.value==="matters" && !!document.querySelector("#pane-body #f-edition"); closePane(true);
  ["sc1","sc2","sc3","sc4"].forEach(k=>delete S.pieces[k]);
  out.ok=Object.values(out).every(v=>v===true); return out; });
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
