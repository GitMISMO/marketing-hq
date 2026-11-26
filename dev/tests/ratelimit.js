// CN-014 (Nov 23, 2026): the save relay door reads busy files every 2 minutes, and a GitHub rate limit is "wait and
// retry": the change is kept (never taken back) and saved once the allowance is back, and nothing is read for 5 minutes.
const {chromium}=require('playwright'); const fs=require('fs'), path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-11-26T15:00:00Z')});
const shim=fs.readFileSync(path.join(__dirname,'..','shim.html'),'utf8');
const stub=`<script>
window.__NET={gets:0,puts:0,limit:1};
window.ResourcesSession={token:()=>"t",current:()=>({name:"Test Person",email:"test@mismo.org"}),role:()=>"editor",canEdit:()=>true,
  requireAccess:()=>Promise.resolve(),onChange:()=>{},signIn:()=>Promise.resolve()};
const json=(status,b)=>Promise.resolve(new Response(JSON.stringify(b),{status,headers:{"Content-Type":"application/json"}}));
window.fetch=(url,o)=>{ o=o||{}; const m=o.method||"GET";
  if(m==="GET"){ __NET.gets++; return json(200,{data:{docs:{}},sha:"s"+__NET.gets}); }
  if(m==="PUT"){ __NET.puts++; if(__NET.limit>0){ __NET.limit--; return json(403,{error:"GITHUB",status:403,message:"API rate limit exceeded for user ID 326650000."}); } return json(200,{sha:"saved"}); }
  return json(404,{}); };
</script>`;
await p.setContent('<!doctype html><html><head>'+stub+shim+'</head><body></body></html>');
await p.clock.runFor(1000);
const r={};
r.poll2min=await p.evaluate(()=>window.__hqRelay.config.POLL_MS===120000);
await p.evaluate(async()=>{ const db=await window.claude.use("db"); window.__saved="waiting";
  db.collection("editions").onSnapshot(()=>{}); db.collection("editions").doc("2026-12").set({month:"2026-12"}).then(()=>{ window.__saved="saved"; },e=>{ window.__saved="taken back: "+e.message; }); });
await p.clock.runFor(3000);
r.firstTry=await p.evaluate(()=>__NET.puts===1 && __saved==="waiting");
r.toast=await p.evaluate(()=>/GitHub is busy right now/.test((document.getElementById("hq-savestate")||{}).textContent||""));
const g0=await p.evaluate(()=>__NET.gets);
await p.clock.runFor(4*60000);
r.waits=await p.evaluate(()=>__NET.puts===1 && __saved==="waiting");
r.noReads=(await p.evaluate(()=>__NET.gets))===g0;
await p.clock.runFor(70000);
r.retried=await p.evaluate(()=>__NET.puts>=2 && __saved==="saved");
r.pendingClear=await p.evaluate(()=>!window.__hqRelay.pending());
/* reads come back after the wait, at most every 2 minutes */
const g1=await p.evaluate(()=>__NET.gets); await p.clock.runFor(60000); const g2=await p.evaluate(()=>__NET.gets); await p.clock.runFor(70000); const g3=await p.evaluate(()=>__NET.gets);
r.readsBack=g2===g1 && g3>g2;
r.ok=Object.values(r).every(v=>v===true);
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
