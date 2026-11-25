// Results: one period for every card and panel, here What People Download (Jonna, Nov 24, 2026).
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms)); const out={};
  const m0=document.getElementById("mn-pop"); if(m0) m0.remove();
  const t=T(), ago=n=>add(t,-n), iso=n=>new Date(Date.now()-n*864e5).toISOString();
  S.audience={}; S.audience.dl1={id:"dl1", list:"downloaders", part:1, rows:[
    {e:"old1@x.org", f:ago(3), l:ago(3), x:["Alpha"]},
    {e:"old2@x.org", f:ago(300), l:ago(5), x:["Alpha","Beta"]},
    {e:"old3@x.org", f:ago(300), l:ago(250), x:["Gamma"]}]};
  S.wpdl={}; S.wpdl.a={id:"a", e:"new1@x.org", product:"Alpha", at:iso(1), firstAt:iso(1)};
  S.wpdl.b={id:"b", e:"new2@x.org", product:"Delta", at:iso(100), firstAt:iso(120)};
  RSP.range="all"; go("results"); await wait(200); rsOpen("dl"); await wait(200);
  const sec=()=>document.querySelector("#pane-body #rs-dl");
  const bar=l=>{ const r=[...sec().querySelectorAll(".fr")].find(f=>f.querySelector("span").textContent===l); return r?r.innerText:""; };
  out.allTime=!!sec() && !!document.querySelector("#pane-body [data-rsp=range]") && !!document.querySelector("#page-results [data-rsp=range]") && /3 people/.test(bar("Alpha")) && !!bar("Gamma") && !!bar("Delta");
  const rg=document.querySelector("#pane-body [data-rsp=range]"); rg.value="week"; rg.onchange(); await wait(150);
  out.week=/3 people/.test(bar("Alpha")) && /1 people/.test(bar("Beta")) && !bar("Gamma") && !bar("Delta") && / to /i.test(sec().querySelector("h3").innerText);
  out.note=/first and last download dates/.test(sec().innerText);
  out.kept=JSON.parse(localStorage.getItem("mm.rs.period")).range==="week" && document.querySelector("#page-results [data-rsp=range]").value==="week" && /people downloaded in the last 7 days/i.test(document.querySelector('[data-rs-open="dl"]').innerText);
  const rg2=document.querySelector("#pane-body [data-rsp=range]"); rg2.value="custom"; rg2.onchange(); await wait(150);
  const f=document.querySelector("#pane-body [data-rsp=from]"), to=document.querySelector("#pane-body [data-rsp=to]"); out.custom=!!f && !!to;
  f.value=ago(130); f.onchange(); await wait(100); const to2=document.querySelector("#pane-body [data-rsp=to]"); to2.value=ago(90); to2.onchange(); await wait(150);
  out.customRange=!!bar("Delta") && !bar("Alpha") && !/first and last download dates/.test(sec().innerText);
  const f3=document.querySelector("#pane-body [data-rsp=from]"); f3.value=ago(20); f3.onchange(); await wait(100); const t3=document.querySelector("#pane-body [data-rsp=to]"); t3.value=ago(10); t3.onchange(); await wait(150);
  out.empty=/No downloads/.test(sec().innerText) && !!document.querySelector("#pane-body [data-rsp=range]") && !!document.querySelector("#page-results [data-rsp=range]");
  RSP.range="year"; try{ localStorage.removeItem("mm.rs.period"); }catch(e){} if(typeof closePane==="function") closePane();
  out.ok=Object.values(out).every(v=>v===true); return out; });
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
