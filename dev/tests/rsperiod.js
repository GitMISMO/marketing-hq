// Results: one period (Showing ...) drives every card and panel; MISMO Matters starts at its first Higher Logic send (Jonna, Nov 24, 2026).
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms)); const out={};
  document.querySelectorAll('[id^=mn-pop]').forEach(e=>e.remove());
  const t=T(), ago=n=>add(t,-n);
  S.pieces.pmc1={id:"pmc1", channel:"mailchimp", title:"Period test recent", date:ago(3), sent:2000, delivered:1900, opens:500, clicks:50, status:"done"};
  S.pieces.pmc2={id:"pmc2", channel:"mailchimp", title:"Period test old", date:ago(200), sent:3000, delivered:2900, opens:700, clicks:70, status:"done"};
  S.pieces.pli1={id:"pli1", channel:"linkedin", title:"Period post recent", date:ago(2), impressions:900, status:"done"};
  S.pieces.pli2={id:"pli2", channel:"linkedin", title:"Period post old", date:ago(120), impressions:800, status:"done"};
  S.webtraffic=S.webtraffic||{}; S.webtraffic["pw1"]={date:ago(1), visits:11, views:22}; S.webtraffic["pw2"]={date:ago(60), visits:33, views:44};
  S.aifeedback=S.aifeedback||{}; S.aifeedback.pf1={id:"pf1", at:new Date(Date.now()-2*864e5).toISOString(), comment:"Recent period comment", question:"q"}; S.aifeedback.pf2={id:"pf2", at:new Date(Date.now()-100*864e5).toISOString(), comment:"Old period comment", question:"q"};
  RSP.range="week"; go("results"); await wait(300);
  const band=document.querySelector("#page-results [data-rsp=range]"); out.band=!!band && band.value==="week" && /Last 7 Days/.test(band.selectedOptions[0].text);
  let x=rsCtx();
  out.mc=x.mcY.some(m=>m.subject==="Period test recent") && !x.mcY.some(m=>m.subject==="Period test old") && x.mcY.every(m=>m.date>=ago(6));
  out.li=x.li.some(q=>q.id==="pli1") && !x.li.some(q=>q.id==="pli2");
  out.web=x.wt.some(d=>d.date===ago(1)) && !x.wt.some(d=>d.date===ago(60)) && x.wt.every(d=>d.date>=ago(6));
  out.voices=x.fb.some(f=>f.id==="pf1") && !x.fb.some(f=>f.id==="pf2");
  out.eds=x.eds.every(e=>{ const p=e.dates&&e.dates.publish; return !p || p>=ago(6); });
  out.cardWeb=/visits, /i.test(document.querySelector('[data-rs-open="web"]').innerText);
  /* the band's picker changes everything; the panel's picker shows the same */
  band.value="all"; band.onchange(); await wait(250); x=rsCtx();
  out.all=x.mcY.some(m=>m.subject==="Period test old") && x.li.some(q=>q.id==="pli2") && x.wt.some(d=>d.date===ago(60)) && x.fb.some(f=>f.id==="pf2");
  rsOpen("web"); await wait(250);
  const rail=document.querySelector("#pane-body [data-rsp=range]"); out.rail=!!rail && rail.value==="all" && !document.querySelector("#pane-body #wt-days");
  rail.value="90"; rail.onchange(); await wait(250);
  out.sync=document.querySelector("#page-results [data-rsp=range]").value==="90" && /Last 90 Days/.test(document.querySelector("#page-results .rs-per").innerText) && document.querySelector("#pane-body [data-rsp=range]").value==="90";
  out.webPane=/Visits/.test(document.querySelector("#pane-body #rs-web").innerText);
  rsOpen("mc"); await wait(200); out.mcPane=/Period test recent/.test(document.querySelector("#pane-body").innerText) && !/Period test old/.test(document.querySelector("#pane-body").innerText);
  rsOpen("voices"); await wait(200); out.voPane=/Recent period comment/.test(document.querySelector("#pane-body").innerText) && /Old period comment/.test(document.querySelector("#pane-body").innerText)===false;
  /* last month is the whole of the month before */
  RSP.range="last"; const [f,to]=rsRange(); out.last=f.slice(8)==="01" && to.slice(0,7)===f.slice(0,7) && add(to,1).slice(8)==="01" && add(to,1).slice(0,7)===t.slice(0,7);
  rsOpen("tools"); await wait(150); out.toolsNoPicker=!document.querySelector("#pane-body [data-rsp]");
  /* MISMO Matters never reaches back before its first Higher Logic send (Jonna, Nov 24, 2026) */
  const st=rsMMStart(); RSP.range="all"; x=rsCtx();
  out.mmStart=/^\d{4}-\d\d-\d\d$/.test(st) && x.eds.every(e=>!e.archived && (!(e.dates&&e.dates.publish) || e.dates.publish>=st));
  rsOpen("mm"); await wait(200); out.mmRail=new RegExp("^"+rsDY(st)+" to ").test(rsMMText()) && /first Higher Logic send/.test(document.querySelector("#pane-body .rs-perbar").innerText);
  RSP.range="custom"; RSP.from="2020-01-01"; RSP.to="2020-02-01"; renderResults(); await wait(200);
  out.mmBefore=/numbers start with its first Higher Logic send/.test(document.querySelector("#pane-body").innerText) && document.querySelector("#pane-body [data-rsp=from]").getAttribute("min")===st;
  RSP.range="year"; try{ localStorage.removeItem("mm.rs.period"); }catch(e){} if(typeof closePane==="function") closePane();
  out.ok=Object.values(out).every(v=>v===true); return out; });
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
