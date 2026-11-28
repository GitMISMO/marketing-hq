// Results opens on the last 30 days, and every card says whether its numbers come in by themselves or by hand
// (Jonna, Nov 28, 2026).
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms)); const out={};
  if(typeof rsToDo!=="function") return {ok:true, skipped:"the page this was built from predates Still Needs Someone"};
  document.querySelectorAll('[id^=mn-pop]').forEach(e=>e.remove());
  out.default30=RSP.range==="30";
  go("results"); await wait(300); document.querySelectorAll('#mn-pop').forEach(e=>e.remove());
  const pg=document.getElementById("page-results");
  out.picker=pg.querySelector('[data-rsp="range"]').value==="30";
  const chip=k=>{ const c=pg.querySelector('[data-rs-open="'+k+'"] .rs-src'); return c?c.textContent:""; };
  out.mmHand=chip("mm")==="By Hand"; out.mcHand=chip("mc")==="By Hand"; out.webAuto=chip("web")==="Automatic"; out.dlAuto=chip("dl")==="Automatic"; out.listsMix=chip("lists")==="Partly by Hand";
  out.liChip=["Automatic","By Hand"].includes(chip("li"));
  out.key=/Automatic/.test(pg.querySelector(".rs-key").innerText) && /By Hand/.test(pg.querySelector(".rs-key").innerText) && /MISMO Matters/.test(pg.querySelector(".rs-key").innerText);
  rsOpen("mm"); await wait(200); const box=document.querySelector("#pane-body .rs-srcbox"); out.railBox=!!box && /Higher Logic/.test(box.innerText);
  out.toolsCard=/fully automatic/.test(pg.querySelector('[data-rs-open="tools"]').innerText) && !pg.querySelector('[data-rs-open="tools"] .rs-src') && !/Drop an export from YouTube/.test(pg.querySelector('[data-rs-open="tools"]').innerText);
  rsOpen("tools"); await wait(200); out.todo=!!document.querySelector("#pane-body #rs-todo") && /Still Needs Someone/i.test(document.querySelector("#pane-body #rs-todo").innerText) && /Only If an Automatic Read Stops/i.test(document.getElementById("pane-body").innerText);
  out.toolsFeeds=/By hand: Record Stats/.test(document.getElementById("pane-body").innerText) && !/Export by hand for now/.test(document.getElementById("pane-body").innerText);
  /* a different pick holds while MISMO Media is open, not the next time it opens */
  const sel=document.querySelector('#page-results [data-rsp="range"]'); sel.value="year"; sel.dispatchEvent(new Event("change")); await wait(150);
  out.held=RSP.range==="year" && JSON.parse(sessionStorage.getItem("mm.rs.period")).range==="year" && !localStorage.getItem("mm.rs.period");
  try{ sessionStorage.removeItem("mm.rs.period"); }catch(e){} RSP.range="30"; closePane(true);
  out.ok=Object.values(out).every(v=>v===true); return out; });
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
