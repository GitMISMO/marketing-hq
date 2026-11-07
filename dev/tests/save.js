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
  go("help"); HL.id="system"; renderHelp(); await wait(50);
  const h=document.querySelector("#page-help").textContent; out.system = /System Health/.test(h) && /Recently Deleted/.test(h) && /New one/.test(h) && /Download All Data/.test(h);
  // 10. bring back from System Health
  document.querySelector("[data-restore]").click(); await wait(120); out.restoreBtn = !!S.pieces.ptest;
  // 11. Approvals on Home
  go("home"); renderHome(); await wait(50); out.approvals = /Waiting on Approval/.test(document.querySelector("#page-home").textContent) && /New one/.test(document.querySelector("#page-home").textContent);
  // 12. rows reachable by keyboard
  out.rowsTabbable = [...document.querySelectorAll("tr.click")].every(r=>r.tabIndex===0);
  // 13. pane inert when closed, focus returns
  const btn=document.querySelector("button"); btn.focus(); openPane({title:"T",fields:[{k:"a",label:"A"}],data:{}}); await wait(260); const inertOpen=document.getElementById("pane").inert; closePane(true); out.pane = inertOpen===false && document.getElementById("pane").inert===true && document.activeElement===btn;
  out.leader = LEADER; out.jobs = Object.keys(JOBS);
  return out;
});
console.log(JSON.stringify(r,null,1)); console.log('errors',errs);
await b.close();})();
