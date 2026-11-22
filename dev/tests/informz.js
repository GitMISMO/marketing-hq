// MISMO Matters email numbers from Higher Logic (Informz), read automatically (Nov 21, 2026): data/informz.json from
// the "MISMO Matters email numbers (Informz)" workflow fills each edition's numbers (one or two waves, matched by name
// and date), wins over typed numbers while keeping what Higher Logic doesn't give (top links), skips other sends,
// and System Health shows the read.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html#matters');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms)); const out={};
  const m=document.getElementById("mn-pop"); if(m) m.remove();
  out.healthNone=hhInformz()===null || (hhInformz()||{}).level==="off";
  const eds=editionsSorted(), ed=eds[eds.length-1];
  ed.dates=Object.assign({}, ed.dates, {publish:"2026-11-19"});
  ed.stats={recipients:100, opens:10, topLinks:"Winter Summit registration — 212 clicks"};
  out.typedFirst=edStats(ed).recipients===100;
  const now=new Date().toISOString();
  S.informz={
    "send-1":{instanceId:"1",mailingId:"9",name:"MISMO Matters November 2026",subject:"MISMO Matters | November",date:"2026-11-19",at:"2026-11-19T14:00:00Z",sent:4000,delivered:3950,opensUnique:1500,clicksUnique:200,unsubs:5,optOuts:1,bounces:50,hardBounces:10,softBounces:40,blocked:0,forwards:3,opensMobile:450,opensDesktop:900,statsAt:now},
    "send-2":{instanceId:"2",mailingId:"9",name:"MISMO Matters November 2026",subject:"MISMO Matters | November",date:"2026-11-20",at:"2026-11-20T14:00:00Z",sent:1000,delivered:990,opensUnique:300,clicksUnique:40,unsubs:2,optOuts:0,bounces:10,hardBounces:2,softBounces:8,blocked:0,forwards:1,opensMobile:90,opensDesktop:180,statsAt:now},
    "send-3":{instanceId:"3",mailingId:"10",name:"Winter Summit reminder",subject:"Register now",date:"2026-11-20",at:"2026-11-20T15:00:00Z",sent:800,delivered:790,opensUnique:200,clicksUnique:30,statsAt:now},
    "send-4":{instanceId:"4",mailingId:"8",name:"MISMO Matters October 2026",subject:"MISMO Matters",date:"2026-10-15",at:"2026-10-15T14:00:00Z",sent:3000,delivered:2990,opensUnique:900,clicksUnique:90,statsAt:now},
    "_run":{at:now,ok:true,lastOk:now,sends:4}
  };
  LOADED.add("informz");
  const st=edStats(ed);
  out.summed=st.recipients===5000 && st.delivered===4940 && st.opens===1800 && st.clicks===240 && st.unsubs===8 && st.bounces===60 && st.fromInformz===true && st.informzSends===2;
  out.otherSendsOut=st.recipients!==5800 && st.recipients!==8000;
  out.waves=st.w1Sent===4000 && st.w2Sent===1000 && /Wave 1/.test(st.w1Label);
  out.keepsTyped=/Winter Summit registration/.test(st.topLinks);
  out.clients=st.cMobile===30 && st.cDesktop===60;
  /* the MISMO Matters page says where the numbers came from */
  MS.sub="stats"; go("matters"); await wait(400);
  const main=document.getElementById("main").innerText;
  out.page=/From Higher Logic automatically \(2 sends\)/.test(main) && /36\.4%|36\.43?%/.test(main);
  /* Results */
  go("results"); await wait(500);
  const res=document.getElementById("main").innerText;
  out.results=/36\.4%/.test(res);
  /* an edition with no Higher Logic sends keeps what was typed */
  const other={id:"x", month:"2026-09", dates:{publish:"2026-09-17"}, stats:{recipients:77}};
  out.noMatch=edStats(other).recipients===77;
  out.health=(hhInformz()||{}).level==="ok" && /4 sends, 3 of them MISMO Matters/.test(hhInformz().line);
  S.informz._run={at:now,ok:false,error:"Higher Logic 500: brand not allowed from this address",lastOk:""};
  out.healthBad=(hhInformz()||{}).level==="bad" && /brand not allowed/.test(hhInformz().line);
  S.informz._run={at:now,ok:false,waiting:true,error:"Not connected yet: the secrets aren't all set"};
  out.healthWaiting=(hhInformz()||{}).level==="off";
  out.ok=Object.values(out).every(v=>v===true); return out; });
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
