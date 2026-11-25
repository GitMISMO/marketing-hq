// Results › Website shows the days before Cloudflare from Higher Logic's Microsite Traffic report (settings/webtraffic-hl),
// copied once on Nov 23, 2026, apart from Cloudflare's numbers and never added to them.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html#results');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms)); const out={};
  if(typeof RSP!=="undefined") RSP.range="all"; /* fixed 2026 dates below: show All Time on Results */
  go("results"); await wait(300); rsOpen("web"); await wait(250);
  out.noneYet=!/Higher Logic's Count/i.test(document.getElementById("rs-web").innerText);
  const days={}; ["2026-11-13","2026-11-14","2026-11-15","2026-11-16","2026-11-17","2026-11-18","2026-11-19"].forEach((d,i)=>days[d]={viewsIn:i<3?100:1000, viewsOut:i<3?500:5000, visIn:i<3?5:40, visOut:i<3?300:3000});
  S.settings["webtraffic-hl"]={id:"webtraffic-hl", source:"Higher Logic Microsite Traffic report", copiedAt:"2026-11-23T17:30:00Z", from:"2026-11-13", to:"2026-11-19", windowTo:"2026-11-23", launch:"2026-11-16", days,
    pages:[["Home",10323],["Member Home <script>",13433]], refs:[["Not Specified",58065],["www.google.com",2397],["mismoiz.informz.net",2581]]};
  renderResults(); rsOpen("web"); await wait(300);
  const w=document.getElementById("rs-web"), t=w.innerText;
  /* with no Cloudflare days yet, the Higher Logic block still shows under the note */
  out.shownWhenEmpty=/Higher Logic's Count/i.test(t) && !/use Higher Logic's Site Traffic report/.test(t);
  out.kpis=/12,160/.test(t.replace(/\s+/g," ")) && /Visitors a Day Before/.test(t) && /Signed In/.test(t);
  out.chart=w.querySelectorAll(".wt-bar").length===7 && !!w.querySelector(".wt-mark") && /New site live/.test(t);
  out.pages=/Member Home <script>/.test(t) && !w.querySelector("script");
  out.refs=/Google/.test(t) && /MISMO Matters email/.test(t) && !/Not Specified/.test(t);
  out.note=/run several times Cloudflare/.test(t) && /only 31 days/.test(t);
  /* with Cloudflare days, the two stay apart: Cloudflare's totals don't change */
  const day=n=>new Date(Date.now()-n*864e5).toISOString().slice(0,10);
  for(let i=3;i>=1;i--) S.webtraffic["d"+i]={id:"d"+i, date:day(i), visits:100, views:200};
  S.webtraffic._run={id:"_run", at:new Date().toISOString(), ok:true, days:[day(1)], lastOk:new Date().toISOString(), error:""};
  WT.days=7; renderResults(); rsOpen("web"); await wait(300);
  const t2=document.getElementById("rs-web").innerText.replace(/\s+/g," ");
  /* when the numbers were last brought in, on the section and on its Results card (Nov 23, 2026) */
  const stamp=wtStamp(S.webtraffic._run.lastOk);
  out.updated=/ ET$/.test(stamp) && t2.indexOf("Updated "+stamp)>=0 && (document.querySelector('[data-rs-open="web"]')||{innerText:""}).innerText.indexOf(stamp)>=0;
  out.apart=/300 Visits/.test(t2) && /Days before Nov 20 are further down/.test(t2) && /Higher Logic's Count/i.test(t2);
  out.ok=Object.values(out).every(v=>v===true); return out; });
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
