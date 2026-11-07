const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html#matters');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{
  window.__hqWho="Test Person"; const out={}; const W=__MOCK.W; const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const id="2026-11__vieaux";
  // 1. a save sends only the changed field
  W.length=0; await patch("sections",id,{headline:"Mine"}); await wait(50);
  out.mergeUsed = W.length===1 && W[0].op==="merge" && !!W[0].base && W[0].d.updatedBy!==undefined;
  // 2. someone else changes another field; my next save keeps theirs
  __MOCK.other("sections",id,{quote:"Theirs"}); await wait(50);
  await patch("sections",id,{status:"review"}); await wait(50);
  const rec=__MOCK.D.sections[id]; out.keepsOthers = rec.quote==="Theirs" && rec.status==="review" && rec.headline==="Mine";
  // 3. someone else deleted it while its panel was open: the save is refused, not brought back
  __MOCK.D.sections["2026-11__summit"]={month:"2026-11",key:"summit"}; __MOCK.other("sections","2026-11__summit",{}); await wait(50);
  openPane({title:"Summit",fields:[{k:"headline",label:"Headline"}],data:{id:"2026-11__summit"}}); await wait(20);
  delete __MOCK.D.sections["2026-11__summit"]; __MOCK.other("sections","2026-11__vieaux",{}); await wait(50);
  let refused=false; try{ await patch("sections","2026-11__summit",{headline:"x"}); }catch(e){ refused=true; } closePane(true);
  out.goneRefused = refused && !__MOCK.D.sections["2026-11__summit"];
  // 4. delete puts aside; restore brings back
  await remove("sections",id); await wait(80);
  out.softDeleted = !!__MOCK.D.sections[id] && !!__MOCK.D.sections[id]._deletedAt && !S.sections[id] && !!TRASH.sections[id];
  await restoreRec("sections",id); await wait(80);
  out.restored = !!S.sections[id] && !__MOCK.D.sections[id]._deletedAt;
  // 5. stale tab saves nothing
  STALE.on=true; W.length=0; await patch("sections",id,{headline:"Stale"}); await wait(30); out.staleBlocked = W.length===0 && S.sections[id].headline==="Mine"; STALE.on=false;
  // 6. new record = set
  W.length=0; await put("pieces","ptest",{title:"New one",status:"review",channel:"linkedin"}); await wait(50); out.newIsSet = W[0] && W[0].op==="set";
  // 7. removed key is sent as null
  W.length=0; const cur=Object.assign({},S.sections[id]); delete cur.headline; await put("sections",id,cur); await wait(50); out.keyRemoved = !("headline" in __MOCK.D.sections[id]);
  // 8. version stamp
  const html=buildEmail(curEdition()); out.versionStamp=/^<!-- MISMO Matters .* version [0-9A-Z]{7} -->/.test(html);
  // 9. System Health renders, with the deleted list and export
  await remove("pieces","ptest"); await wait(80);
  hhOpen(); await wait(80);
  const h=document.querySelector("#hh-modal").textContent; out.system = /Everything Is Working|Working, With a Warning|Something Needs Attention/.test(h) && /Storage/.test(h) && /Recently Deleted/.test(h) && /New one/.test(h) && /Download All Data/.test(h) && !!document.querySelector("#hh-btn .hh-dot");
  // 10. bring back from System Health
  document.querySelector("[data-restore]").click(); await wait(120); out.restoreBtn = !!S.pieces.ptest;
  // 11. approvals show in On Your Plate for Amy (no separate card)
  S.sections["2026-11__vieaux"].status="review"; const needs=(()=>{ const f=hmFirst; hmFirst=()=>"Amy"; const n=hmNeeds(); hmFirst=f; return n; })();
  go("home"); renderHome(); await wait(50);
  out.approvals = needs.some(n=>/Approve .*Vieaux Point/.test(n.label)) && needs.some(n=>/New one/.test(n.label)) && !/Waiting on Approval/.test(document.querySelector("#page-home").textContent);
  // 12. rows reachable by keyboard
  out.rowsTabbable = [...document.querySelectorAll("tr.click")].every(r=>r.tabIndex===0);
  // 13. pane inert when closed, focus returns
  const btn=document.querySelector("button"); btn.focus(); openPane({title:"T",fields:[{k:"a",label:"A"}],data:{}}); await wait(260); const inertOpen=document.getElementById("pane").inert; closePane(true); out.pane = inertOpen===false && document.getElementById("pane").inert===true && document.activeElement===btn;
  // 14. dates are editable: a saved holiday moves deadlines, the website date drives newsletter links
  await put("settings","dates",{holidays:Object.assign({}, HOLIDAYS, {"2028-01-17":"MLK Jr. Birthday"}), summits:SUMMITS.map(s=>Object.assign({},s)).concat([{id:"t",name:"2028 Winter Summit",start:"2028-01-10",end:"2028-01-13",where:"Test"}]), siteLive:"2026-12-01"}); await wait(80);
  renderAll(); await wait(30);
  out.dates = HOLIDAYS["2028-01-17"]==="MLK Jr. Birthday" && SUMMITS.some(s=>s.name==="2028 Winter Summit") && siteLive()==="2026-12-01" && certSite({dates:{publish:"2026-11-19"}},"x")==="https://collaborate.mismo.org/mismowebsite/x";
  go("help"); HL.id="dates"; renderHelp(); await wait(30); out.datesPage = /Holidays and Key Dates/.test(document.querySelector("#page-help").textContent) && document.querySelectorAll("[data-hd]").length>10 && !document.querySelector('.hq nav button[data-hq="settings"]') && document.querySelectorAll("[data-hd]").length>10;
  // 15. Eastern-time countdown and local days
  out.et = etAt("2026-11-13","08:30").toISOString()==="2026-11-13T13:30:00.000Z" && localDay("2026-11-07")==="2026-11-07";
  out.sizes = typeof fileSizes==="function";
  // 16. errors are caught and shown in System Health
  setTimeout(()=>{ throw new Error("test boom"); },0); await wait(50); hhRun(); out.errCaught = (window.__mmErrs||[]).some(e=>/test boom/.test(e.msg)) && HH.last.rows.some(r=>r.key==="err" && r.level==="warn");
  // 17. web-found news: shown by month, archived when the month's edition is out, and fed to that edition
  const ed=curEdition(), d=ed.dates.publish, inWin=add(prevPublish(ed),2);
  __MOCK.D.newsweb={"w-1":{id:"w-1",headline:"Lender X adopts MISMO standards",outlet:"HousingWire",url:"https://example.com/a",date:inWin,month:inWin.slice(0,7),kind:"mention",found:"Bing News"},
    "w-old":{id:"w-old",headline:"Old MISMO story",outlet:"NMN",url:"https://example.com/b",date:"2026-06-10",month:"2026-06",kind:"mention",found:"Google News"},
    "_run":{id:"_run",at:new Date().toISOString(),added:2}};
  __MOCK.other("newsweb","w-1",{}); await wait(80);
  go("news"); renderNews(); await wait(30); const pg=document.querySelector("#page-news");
  out.webNews = newsAll().some(n=>n.id==="w-1" && n.viaWeb) && newsInWindow(ed).some(n=>n.id==="w-1") && /Found on the Web/.test(pg.textContent) && !!pg.querySelector("details.nw-old[data-mo='2026-06']") && hhWebNews().level==="ok";
  out.leader = LEADER; out.jobs = Object.keys(JOBS);
  return out;
});
console.log(JSON.stringify(r,null,1)); console.log("errors",errs.filter(e=>!/test boom/.test(e)));
await b.close();})();
