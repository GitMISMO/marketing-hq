// Every number on the Schedule's band opens what it counts (Jonna, Nov 28, 2026): Past Due, Due This Week and
// Waiting on Amy list their items (one item opens straight away); Sections In lists the sections; Days to MISMO Matters
// opens the edition; Mic'd Up This Friday opens the episode.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms)); const out={};
  document.querySelectorAll('[id^=mn-pop]').forEach(e=>e.remove());
  const t=T(), pg=()=>document.getElementById("page-overview"), tile=k=>pg().querySelector('.tile[data-tl="'+k+'"]');
  const menu=()=>document.querySelector(".tilemenu");
  go("overview"); renderOverview(); await wait(150);
  out.allButtons=pg().querySelectorAll(".tiles .tile").length===6 && pg().querySelectorAll(".tiles button.tile[data-tl]").length===6;
  /* Past Due: make two, see both, open one */
  S.requests=S.requests||{}; await put("requests","tl-r1",{status:"new",title:"Tile test request",type:"linkedin",neededBy:add(t,-3)});
  S.pieces.tlp1={id:"tlp1", channel:"linkedin", title:"Tile test late post", date:add(t,-2), status:"idea"};
  renderOverview(); await wait(150);
  tile("over").click(); await wait(100);
  out.overList=!!menu() && /Tile test request/.test(menu().innerText) && /Tile test late post/.test(menu().innerText);
  let opened=""; const kp=window.openPiece; window.openPiece=id=>{ opened=id; };
  [...menu().querySelectorAll("button")].find(x=>/Tile test late post/.test(x.innerText)).click(); await wait(80);
  out.overOpens=opened==="tlp1" && !menu();
  /* one item opens straight away */
  delete S.pieces.tlp1; await put("requests","tl-r1",{status:"done",title:"Tile test request",type:"linkedin",neededBy:add(t,-3)});
  const others=allEvents().filter(isOver); 
  S.pieces.tlp2={id:"tlp2", channel:"linkedin", title:"Only late", date:add(t,-2), status:"idea"};
  renderOverview(); await wait(150); opened="";
  const nOver=allEvents().filter(isOver).length;
  tile("over").click(); await wait(100);
  out.oneOpens = nOver===1 ? (opened==="tlp2" && !menu()) : (!!menu());
  document.querySelectorAll(".calmenu").forEach(m=>m.remove()); window.openPiece=kp; delete S.pieces.tlp2;
  /* Due This Week */
  S.pieces.tlw1={id:"tlw1", channel:"mailchimp", title:"Tile week one", date:add(t,1), status:"idea"};
  S.pieces.tlw2={id:"tlw2", channel:"mailchimp", title:"Tile week two", date:add(t,2), status:"idea"};
  renderOverview(); await wait(150); tile("week").click(); await wait(100);
  out.weekList=!!menu() && /Tile week one/.test(menu().innerText) && /Tile week two/.test(menu().innerText);
  document.querySelectorAll(".calmenu").forEach(m=>m.remove()); delete S.pieces.tlw1; delete S.pieces.tlw2;
  /* Waiting on Amy */
  S.pieces.tla1={id:"tla1", channel:"linkedin", title:"Amy review one", date:add(t,5), status:"review"};
  S.pieces.tla2={id:"tla2", channel:"linkedin", title:"Amy review two", date:add(t,6), status:"review"};
  renderOverview(); await wait(150); tile("amy").click(); await wait(100);
  out.amyList=!!menu() && /Amy review one/.test(menu().innerText) && /Amy review two/.test(menu().innerText);
  document.querySelectorAll(".calmenu").forEach(m=>m.remove()); delete S.pieces.tla1; delete S.pieces.tla2;
  /* Sections In lists the sections, with Open the Edition */
  renderOverview(); await wait(150); tile("secs").click(); await wait(100);
  out.secsList=!!menu() && menu().querySelectorAll("[data-i]").length>0 && !!menu().querySelector("[data-all]");
  menu().querySelector("[data-all]").click(); await wait(150); out.secsAll=TAB==="matters";
  /* Days opens the edition; Friday opens the episode or Mic'd Up */
  go("overview"); renderOverview(); await wait(150); tile("days").click(); await wait(150); out.days=TAB==="matters";
  go("overview"); renderOverview(); await wait(150);
  const ep=epOn(nextDow(t,5)); let epId=""; const ko=window.openEpisode; window.openEpisode=id=>{ epId=id; };
  tile("fri").click(); await wait(150); out.fri = ep ? epId===ep.id : TAB==="micdup"; window.openEpisode=ko;
  go("overview"); renderOverview();
  out.ok=Object.values(out).every(v=>v===true); return out; });
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
