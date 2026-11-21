// Results shows www.mismo.org traffic from Cloudflare (data/webtraffic.json), the AI answer feedback and the
// website problem reports; System Health shows the nightly pull (Nov 20, 2026).
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html#results');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms)); const out={};
  const day=n=>new Date(Date.now()-n*864e5).toISOString().slice(0,10);
  /* nothing yet: the section says the first pull hasn't run, Health says so too */
  go("results"); await wait(300); rsOpen("web"); await wait(250);
  out.emptyNote=/first nightly pull/.test(document.getElementById("rs-web").innerText);
  out.healthOff=(hhWebTraffic()||{}).level!=="bad";
  /* twelve days of numbers */
  for(let i=12;i>=1;i--) S.webtraffic["d"+i]={id:"d"+i, date:day(i), visits:100+i*7, views:250+i*11,
    pages:[["/",120,80],["/standards",40,30],["/about-mismo/<script>",9,7]], refs:[["",60,50],["www.google.com",30,25],["www.linkedin.com",12,10],["www.mismo.org",8,6]],
    countries:[["United States",90,80],["Canada",5,4]], devices:[["desktop",70,60],["mobile",30,25],["tablet",2,2]]};
  S.webtraffic._run={id:"_run", at:new Date().toISOString(), ok:true, days:[day(1)], lastOk:new Date().toISOString(), error:""};
  S.aifeedback.f1={id:"f1", assistant:"Mimi", question:"What is ULDD?", answer:"…", comment:"Missing the <b>link</b>", page:"https://www.mismo.org/x", n:"Pat Test", e:"pat@example.com", at:new Date().toISOString()};
  S.websiteproblems.p1={id:"p1", message:"The Standards page link is broken", page:"https://www.mismo.org/standards", n:"Sam", e:"sam@example.com", via:"mimi", signedIn:true, at:new Date().toISOString()};
  S.websiteproblems._dropped={id:"_dropped", total:3, byReason:{honeypot:2,"too fast":1}};
  renderResults(); await wait(300);
  const w=document.getElementById("rs-web"), t=w.innerText;
  out.kpis=/Visits/.test(t) && /Page Views/.test(t) && /Pages per Visit/.test(t);
  out.chart=w.querySelectorAll(".wt-bar").length===12 && !!w.querySelector(".wt-line");
  out.pages=/\/standards/.test(t) && /about-mismo\/<script>/.test(t) && !w.querySelector("script");
  out.refs=/Direct or not shared/.test(t) && /Google/.test(t) && /LinkedIn/.test(t) && /Another mismo\.org page/.test(t);
  out.devices=/Desktop/.test(t) && /Phone/.test(t);
  out.countries=/United States/.test(t);
  out.tile=/visits, last 12 days/.test(document.querySelector('[data-rs-open="web"]').innerText) && document.querySelector('[data-rs-open="web"]').classList.contains("on");
  rsOpen("voices"); await wait(250);
  const v=document.getElementById("rs-voices").innerText;
  out.feedback=/Missing the <b>link<\/b>/.test(v) && /What is ULDD\?/.test(v);
  out.problems=/Standards page link is broken/.test(v) && /From Mimi/i.test(v) && /3 spam or repeat reports were dropped/.test(v);
  /* 7-day pick */
  rsOpen("web"); await wait(250);
  const sel=document.getElementById("wt-days"); sel.value="7"; sel.dispatchEvent(new Event("change")); await wait(200);
  out.pick=document.querySelectorAll("#rs-web .wt-bar").length===7;
  /* Health */
  out.healthOk=(hhWebTraffic()||{}).level==="ok";
  S.webtraffic._run=Object.assign({}, S.webtraffic._run, {ok:false, error:"Cloudflare 401: Invalid token"});
  const bad=hhWebTraffic()||{}; out.healthBad=bad.level==="bad";
  S.webtraffic._run=Object.assign({}, S.webtraffic._run, {ok:true, at:new Date(Date.now()-50*36e5).toISOString()});
  out.healthStale=(hhWebTraffic()||{}).level==="warn";
  out.ok=Object.values(out).every(v=>v===true);
  return out;
});
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
